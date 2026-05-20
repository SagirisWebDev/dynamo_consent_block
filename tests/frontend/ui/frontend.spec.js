// @ts-check
/**
 * Playwright browser tests for frontend.js
 *
 * These tests run in real Chromium so that DOM event dispatch, event listeners,
 * and window-global third-party APIs (Complianz, Borlabs) behave exactly as they
 * would on a live WordPress page. jsdom cannot faithfully replicate this.
 *
 * Test strategy: inject the gate HTML via setContent(), then load the actual
 * frontend.js via addScriptTag(). The script runs in a real Chromium browser context.
 *
 * Note: Playwright's page.evaluate() cannot serialize JS functions across the
 * Node.js → browser boundary. Window mock functions are injected via
 * page.addInitScript() (runs before the page script) or page.evaluate()
 * using a script string.
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const FRONTEND_JS = path.resolve(__dirname, '../../../frontend.js');

/**
 * Base page setup: inject HTML and load frontend.js.
 * Use page.addInitScript() before this for window mocks that must be
 * present when the IIFE runs.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} html - body content containing .dynamo-consent-gate elements
 */
async function loadPage(page, html) {
    await page.goto('about:blank');
    await page.setContent(`<!DOCTYPE html><html><body>${html}</body></html>`);
    await page.addScriptTag({ path: FRONTEND_JS });
}

// Gate HTML fragments used across tests
const MARKETING_GATE = `<div class="dynamo-consent-gate" style="display:none" data-consent-category="marketing">Marketing content</div>`;
const STATISTICS_GATE = `<div class="dynamo-consent-gate" style="display:none" data-consent-category="statistics">Statistics content</div>`;
const BOTH_GATES = MARKETING_GATE + STATISTICS_GATE;

// ---------------------------------------------------------------------------
// AC2: On DOMContentLoaded, revealForCategory removes display:none from
//      .dynamo-consent-gate elements whose data-consent-category matches the
//      granted category.
// ---------------------------------------------------------------------------
test.describe('AC2 — initial consent reveal on DOMContentLoaded', () => {
    test('reveals matching gate when Complianz reports consent for that category', async ({ page }) => {
        // Inject cmplz_has_consent before the page and script load
        await page.addInitScript(() => {
            window.cmplz_has_consent = (category) => category === 'marketing';
        });

        await loadPage(page, BOTH_GATES);

        // Marketing gate should be revealed (display cleared), statistics still hidden
        await expect(page.locator('.dynamo-consent-gate[data-consent-category="marketing"]'))
            .not.toHaveCSS('display', 'none');
        await expect(page.locator('.dynamo-consent-gate[data-consent-category="statistics"]'))
            .toHaveCSS('display', 'none');
    });

    test('reveals matching gate when Borlabs reports consent for that category', async ({ page }) => {
        await page.addInitScript(() => {
            window.BorlabsCookie = {
                checkCookieConsent: (category) => category === 'marketing',
            };
        });

        await loadPage(page, MARKETING_GATE);

        await expect(page.locator('.dynamo-consent-gate[data-consent-category="marketing"]'))
            .not.toHaveCSS('display', 'none');
    });

    test('leaves all gates hidden when neither API reports consent', async ({ page }) => {
        // No mocks — neither API present
        await loadPage(page, BOTH_GATES);

        await expect(page.locator('.dynamo-consent-gate[data-consent-category="marketing"]'))
            .toHaveCSS('display', 'none');
        await expect(page.locator('.dynamo-consent-gate[data-consent-category="statistics"]'))
            .toHaveCSS('display', 'none');
    });
});

// ---------------------------------------------------------------------------
// AC3: checkInitialConsent calls both Complianz and Borlabs APIs when both
//      are present on window.
// ---------------------------------------------------------------------------
test.describe('AC3 — checkInitialConsent calls both cookie APIs', () => {
    test('queries both Complianz and Borlabs when both are available', async ({ page }) => {
        await page.addInitScript(() => {
            window._cmplzCalls = [];
            window._borlabsCalls = [];
            window.cmplz_has_consent = (cat) => { window._cmplzCalls.push(cat); return false; };
            window.BorlabsCookie = {
                checkCookieConsent: (cat) => { window._borlabsCalls.push(cat); return false; },
            };
        });

        await loadPage(page, MARKETING_GATE);

        const cmplzCalls = await page.evaluate(() => window._cmplzCalls);
        const borlabsCalls = await page.evaluate(() => window._borlabsCalls);

        expect(cmplzCalls).toContain('marketing');
        expect(borlabsCalls).toContain('marketing');
    });
});

// ---------------------------------------------------------------------------
// AC4: Only matching category elements are revealed when cmplz_status_change
//      fires (with detail.value === 'allow').
// ---------------------------------------------------------------------------
test.describe('AC4 — cmplz_status_change event reveals only matching category', () => {
    test('reveals only the marketing gate when cmplz_status_change fires for marketing', async ({ page }) => {
        // No initial consent so both gates start hidden
        await loadPage(page, BOTH_GATES);

        const marketingGate = page.locator('.dynamo-consent-gate[data-consent-category="marketing"]');
        const statisticsGate = page.locator('.dynamo-consent-gate[data-consent-category="statistics"]');

        // Verify initial hidden state
        await expect(marketingGate).toHaveCSS('display', 'none');
        await expect(statisticsGate).toHaveCSS('display', 'none');

        // Dispatch cmplz_status_change for marketing
        await page.evaluate(() => {
            document.dispatchEvent(
                new CustomEvent('cmplz_status_change', {
                    detail: { category: 'marketing', value: 'allow' },
                })
            );
        });

        // Only marketing revealed — statistics unchanged
        await expect(marketingGate).not.toHaveCSS('display', 'none');
        await expect(statisticsGate).toHaveCSS('display', 'none');
    });

    test('does not reveal any gate when cmplz_status_change fires with value !== "allow"', async ({ page }) => {
        await loadPage(page, MARKETING_GATE);

        const gate = page.locator('.dynamo-consent-gate[data-consent-category="marketing"]');
        await expect(gate).toHaveCSS('display', 'none');

        await page.evaluate(() => {
            document.dispatchEvent(
                new CustomEvent('cmplz_status_change', {
                    detail: { category: 'marketing', value: 'deny' },
                })
            );
        });

        await expect(gate).toHaveCSS('display', 'none');
    });
});

// ---------------------------------------------------------------------------
// AC5: Borlabs elements are revealed on borlabs-cookie-consent-saved when
//      BorlabsCookie.checkCookieConsent returns true.
// ---------------------------------------------------------------------------
test.describe('AC5 — borlabs-cookie-consent-saved event', () => {
    test('reveals gate when BorlabsCookie.checkCookieConsent returns true for that category', async ({ page }) => {
        await loadPage(page, MARKETING_GATE);

        const gate = page.locator('.dynamo-consent-gate[data-consent-category="marketing"]');
        await expect(gate).toHaveCSS('display', 'none');

        // Inject BorlabsCookie AFTER page load (simulating the plugin attaching later),
        // then dispatch the saved event
        await page.evaluate(() => {
            window.BorlabsCookie = {
                checkCookieConsent: (category) => category === 'marketing',
            };
            document.dispatchEvent(new Event('borlabs-cookie-consent-saved'));
        });

        await expect(gate).not.toHaveCSS('display', 'none');
    });

    test('does not reveal gate when BorlabsCookie is absent from window', async ({ page }) => {
        await loadPage(page, MARKETING_GATE);

        const gate = page.locator('.dynamo-consent-gate[data-consent-category="marketing"]');

        // Dispatch the event without BorlabsCookie present
        await page.evaluate(() => {
            delete window.BorlabsCookie;
            document.dispatchEvent(new Event('borlabs-cookie-consent-saved'));
        });

        await expect(gate).toHaveCSS('display', 'none');
    });
});

// ---------------------------------------------------------------------------
// AC6: Elements for a non-matching category are NOT revealed.
// ---------------------------------------------------------------------------
test.describe('AC6 — non-matching category gates are not revealed', () => {
    test('statistics gate stays hidden when only marketing consent is granted via Complianz event', async ({ page }) => {
        await loadPage(page, STATISTICS_GATE);

        const gate = page.locator('.dynamo-consent-gate[data-consent-category="statistics"]');
        await expect(gate).toHaveCSS('display', 'none');

        // Grant marketing — statistics gate must stay hidden
        await page.evaluate(() => {
            document.dispatchEvent(
                new CustomEvent('cmplz_status_change', {
                    detail: { category: 'marketing', value: 'allow' },
                })
            );
        });

        await expect(gate).toHaveCSS('display', 'none');
    });

    test('statistics gate stays hidden when Borlabs reports consent only for marketing', async ({ page }) => {
        await loadPage(page, STATISTICS_GATE);

        const gate = page.locator('.dynamo-consent-gate[data-consent-category="statistics"]');

        await page.evaluate(() => {
            window.BorlabsCookie = {
                checkCookieConsent: (category) => category === 'marketing',
            };
            document.dispatchEvent(new Event('borlabs-cookie-consent-saved'));
        });

        await expect(gate).toHaveCSS('display', 'none');
    });
});
