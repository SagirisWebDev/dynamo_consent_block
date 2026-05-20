<?php
/**
 * Tests for the admin notice displayed when the Dynamo theme is not active.
 *
 * Acceptance criteria covered:
 *  - AC1: Admin notice renders for a manage_options user when the active theme
 *         stylesheet is not `dynamo`
 *  - AC2: Admin notice does not render when the active theme stylesheet is `dynamo`
 *  - AC3: Notice is dismissible (contains `notice-warning is-dismissible` or
 *         similar WP admin notice classes)
 *  - AC4: Notice is not shown to users without `manage_options`
 *  - AC5: PHPUnit: notice output is present in the non-Dynamo-active scenario
 *  - AC6: PHPUnit: notice output is absent in the Dynamo-active scenario
 */

declare(strict_types=1);

namespace Dynamo\ConsentGate\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

final class AdminNoticeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        // Load only the admin notice include — keeps this test isolated from
        // PluginBootstrapTest by not triggering plugin-level define() calls.
        require_once DYNAMO_CONSENT_GATE_PLUGIN_DIR . '/includes/admin-notice.php';
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    /**
     * Build an anonymous object that mimics the WP_Theme return value of
     * wp_get_theme(), responding to get_stylesheet() with the given slug.
     */
    private function makeThemeMock(string $stylesheet): object
    {
        return new class ($stylesheet) {
            public function __construct(private string $stylesheet) {}
            public function get_stylesheet(): string { return $this->stylesheet; }
        };
    }

    // -------------------------------------------------------------------------
    // AC1 + AC3 + AC5 — notice renders (and is dismissible) when theme is not Dynamo
    // -------------------------------------------------------------------------

    /**
     * AC1 + AC3 + AC5: A manage_options user sees a dismissible warning notice
     * when the active theme is not `dynamo`.
     */
    public function test_notice_renders_for_admin_when_non_dynamo_theme_is_active(): void
    {
        Functions\when('current_user_can')->justReturn(true);
        Functions\when('wp_get_theme')->justReturn($this->makeThemeMock('some-other-theme'));

        ob_start();
        dynamo_consent_gate_admin_notice();
        $output = ob_get_clean();

        // AC1 + AC5: notice HTML is present.
        $this->assertNotEmpty(
            $output,
            'Expected admin notice HTML to be output when the active theme is not `dynamo`.'
        );

        // AC3: WordPress dismissible notice classes must be present.
        $this->assertMatchesRegularExpression(
            '/notice[^"\']*notice-warning[^"\']*is-dismissible|notice[^"\']*is-dismissible[^"\']*notice-warning/i',
            $output,
            'Expected the notice to carry both `notice-warning` and `is-dismissible` CSS classes.'
        );
    }

    // -------------------------------------------------------------------------
    // AC2 + AC6 — no output when Dynamo theme IS active
    // -------------------------------------------------------------------------

    /**
     * AC2 + AC6: No notice is rendered when the active theme stylesheet is `dynamo`.
     */
    public function test_notice_is_absent_when_dynamo_theme_is_active(): void
    {
        Functions\when('current_user_can')->justReturn(true);
        Functions\when('wp_get_theme')->justReturn($this->makeThemeMock('dynamo'));

        ob_start();
        dynamo_consent_gate_admin_notice();
        $output = ob_get_clean();

        // AC2 + AC6: no notice HTML should be emitted.
        $this->assertEmpty(
            $output,
            'Expected no admin notice output when the active theme is `dynamo`.'
        );
    }

    // -------------------------------------------------------------------------
    // AC4 — notice hidden from users without manage_options
    // -------------------------------------------------------------------------

    /**
     * AC4: No notice is rendered for a user who lacks the `manage_options` capability,
     * even when the active theme is not `dynamo`.
     */
    public function test_notice_is_absent_for_user_without_manage_options(): void
    {
        Functions\when('current_user_can')->justReturn(false);
        Functions\when('wp_get_theme')->justReturn($this->makeThemeMock('some-other-theme'));

        ob_start();
        dynamo_consent_gate_admin_notice();
        $output = ob_get_clean();

        $this->assertEmpty(
            $output,
            'Expected no admin notice output for a user who lacks `manage_options`.'
        );
    }

    // -------------------------------------------------------------------------
    // Edge case — notice still absent when theme is dynamo AND user lacks cap
    // -------------------------------------------------------------------------

    /**
     * Both conditions false: Dynamo theme active AND user lacks manage_options.
     * No notice should appear.
     */
    public function test_notice_is_absent_when_dynamo_theme_active_and_user_lacks_cap(): void
    {
        Functions\when('current_user_can')->justReturn(false);
        Functions\when('wp_get_theme')->justReturn($this->makeThemeMock('dynamo'));

        ob_start();
        dynamo_consent_gate_admin_notice();
        $output = ob_get_clean();

        $this->assertEmpty(
            $output,
            'Expected no admin notice output when both conditions for suppression are true.'
        );
    }
}
