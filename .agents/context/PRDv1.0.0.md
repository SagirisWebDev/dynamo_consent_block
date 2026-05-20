# PRD: Dynamo Consent Gate Plugin

Status: needs-triage

## Problem Statement

The Dynamo WordPress theme contains a custom Gutenberg block (`dynamo/consent-gate`) that hides inner content until a visitor grants a specified cookie consent category. The WordPress Theme Directory explicitly prohibits custom blocks inside themes. This block must be removed from the theme before Dynamo can be submitted to the WordPress Theme Directory — but it must continue to work for existing and future Dynamo users who rely on it to gate cookie-dependent content.

## Solution

Extract the Consent Gate block into a standalone companion plugin (`dynamo-consent-gate`) that Dynamo users install separately. The plugin registers the `dynamo/consent-gate` block and enqueues its frontend JavaScript. It deliberately depends on the Dynamo theme being active: it uses constants defined by the theme (`DYNAMO_URL`, `DYNAMO_VERSION`) and the theme's existing REST endpoint (`/wp-json/dynamo/v1/cookie-categories`) to populate the block editor's consent category dropdown. The cookie driver logic, Banner Token Sync, and embed blocking all remain in the theme unchanged. The plugin is intentionally thin — it does only what the theme directory prohibits.

## User Stories

1. As a site owner using Dynamo, I want to install the Consent Gate plugin so that I can continue using the Consent Gate block after updating to the WordPress Theme Directory version of Dynamo.
2. As a site owner, I want to place a Consent Gate block in any post or page so that I can hide cookie-dependent embeds until a visitor grants consent.
3. As a site owner, I want to select a consent category from a dropdown in the block editor so that I can tie gated content to the correct cookie category without knowing the category slug by heart.
4. As a site owner using Complianz, I want gated content to reveal automatically when a visitor accepts the relevant Complianz category so that the experience is seamless.
5. As a site owner using Borlabs Cookie, I want gated content to reveal automatically when a visitor accepts the relevant Borlabs category so that the experience is seamless.
6. As a site owner, I want gated content that was consented to on a previous visit to be revealed immediately on page load so that returning visitors are not repeatedly prompted.
7. As a site owner, I want gated content to remain hidden if a visitor has not granted consent so that I comply with cookie consent regulations.
8. As a content editor, I want the Consent Gate block to appear in the block inserter under the Embeds category so that I can find it intuitively when building content.
9. As a content editor, I want to nest any block inside a Consent Gate so that I can gate maps, videos, social embeds, or any other cookie-dependent content.
10. As a content editor, I want a warning in the block editor that the Consent Gate hides content visually but does not prevent it from appearing in the page source so that I do not use it to protect sensitive data.
11. As a developer, I want the block name to remain `dynamo/consent-gate` so that existing posts using the block are not broken by the plugin extraction.
12. As a developer, I want the plugin to use the `dynamo` text domain so that all block strings are covered by the theme's existing translation files without maintaining a separate set.
13. As a developer, I want the plugin to fail gracefully — keeping gated content hidden — if the Dynamo theme is not active or the REST endpoint is unavailable, so that deactivating the theme does not expose unintended content.

## Implementation Decisions

### Modules

**Plugin Bootstrap**
The main plugin PHP file containing WordPress plugin headers (Plugin Name, Description, Version, Requires at least, Requires PHP, License, Text Domain). Responsible for a single action: calling `register_block_type()` pointing at the block metadata directory. Hooks on `init`. Contains a version constant used by no one externally — internal only.

**Block Definition**
The `block.json` metadata file. Declares `dynamo/consent-gate`, API version 3, the `consentCategory` string attribute, and the server-side render file. No changes required from the theme version.

**Block Editor JS**
The editor-side script registered via `block.json`. Renders a `SelectControl` in `InspectorControls` populated by a `wp.apiFetch` call to `/dynamo/v1/cookie-categories`. Displays a `Notice` warning about page-source visibility. Uses `InnerBlocks` for the content area. Text domain remains `dynamo`.

**Block Render PHP**
The server-side render template. Outputs the `dynamo-consent-gate` wrapper div with the `data-consent-category` attribute. Enqueues `frontend.js` using `DYNAMO_URL` and `DYNAMO_VERSION` — constants supplied by the active Dynamo theme. No changes required from the theme version.

**Block Frontend JS**
Vanilla JavaScript. On `DOMContentLoaded`, checks initial consent state against both Complianz (`window.cmplz_has_consent`) and Borlabs Cookie (`window.BorlabsCookie.checkCookieConsent`). Listens for `cmplz_status_change` and `borlabs-cookie-consent-saved` events to reveal content mid-session when a visitor grants consent. No changes required from the theme version.

### Architectural decisions

- The plugin is Dynamo-only by design (ADR 0003). It does not attempt to detect or load theme constants defensively — if the theme is inactive, `frontend.js` is not enqueued and content remains hidden, which is the correct fail-safe behaviour.
- The REST endpoint `/dynamo/v1/cookie-categories` is owned by the theme's `Dynamo_Cookie_Integration` class and is not duplicated in the plugin. The block editor dropdown degrades gracefully to an empty list if the endpoint is absent.
- Block name `dynamo/consent-gate` is kept unchanged. Renaming would orphan existing post content.
- Text domain `dynamo` is kept. Translations remain in the theme's `languages/` directory.
- The plugin contains no options, no database writes, no admin pages, and no activation hooks.

## Testing Decisions

**What makes a good test:** Tests assert on observable output — that `register_block_type` is called with the correct path, that the rendered HTML contains the expected wrapper div and `data-consent-category` attribute, that `frontend.js` is enqueued when `DYNAMO_URL` is defined. Tests do not assert on internal wiring (e.g. which WordPress hook fires first).

**Modules with tests:**

- **Plugin Bootstrap** — assert that `register_block_type` is called on `init` with the path pointing to the block metadata directory; assert the call is not made if the `init` hook has not fired.
- **Block Render PHP** — assert that given a `consentCategory` attribute of `"analytics"`, the rendered output contains `data-consent-category="analytics"` and the wrapper div has `style="display:none"`; assert that when `DYNAMO_URL` and `DYNAMO_VERSION` are defined, `wp_enqueue_script` is called with handle `dynamo-consent-gate-frontend`; assert that when those constants are undefined, `wp_enqueue_script` is not called.
- **Block Frontend JS** — assert `revealForCategory` removes `display:none` from matching `.dynamo-consent-gate` elements; assert `checkInitialConsent` calls both the Complianz and Borlabs APIs when both are present; assert that only the matching category's elements are revealed when a `cmplz_status_change` event fires; assert Borlabs elements are revealed on `borlabs-cookie-consent-saved` when `checkCookieConsent` returns true.

Prior art: the Dynamo theme's PHPUnit suite uses `WP_UnitTestCase` with Brain Monkey for WordPress function stubs. The frontend JS tests follow the same vanilla JS + Jest pattern used for other theme scripts.

## Out of Scope

- Cookie driver logic (Complianz and Borlabs detection, `get_consent_categories()`) — remains in the Dynamo theme.
- Banner Token Sync (`register_palette_sync_hooks()`) — remains in the Dynamo theme.
- Embed blocking (`register_embed_hooks()`) — remains in the Dynamo theme.
- Consent Placeholder markup and styling — remains in the Dynamo theme.
- Theme-agnostic operation — the plugin will not work without Dynamo active.
- Support for cookie plugins other than Complianz and Borlabs Cookie.
- WordPress plugin directory submission (may follow separately once the plugin is stable).
- Child theme or filter extensibility — no public filter API is planned for this plugin.
- Multisite support.

## Further Notes

- The Dynamo theme must remove its `register_block_type()` call and the `Dynamo_Cookie_Integration::boot()` invocation only after this plugin is stable and tested. The theme should add a dismissible `admin_notices` notice prompting users to install the plugin if the block type is not already registered.
- Because the plugin ships no styles of its own, the Consent Gate's visual appearance in the editor (the InnerBlocks placeholder) inherits from core block editor styles only.
- The `dynamo/consent-gate` block name is considered a stable public identifier from v1.0.0 of this plugin. Any rename would require a migration path.
