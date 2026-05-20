# PRD: Dynamo Consent Gate Plugin

Status: ready-for-agent

## Problem Statement

The Dynamo WordPress theme contains a custom Gutenberg block (`dynamo/consent-gate`) that hides inner content until a visitor grants a specified cookie consent category. The WordPress Theme Directory explicitly prohibits custom blocks inside themes. This block must be removed from the theme before Dynamo can be submitted to the WordPress Theme Directory — but it must continue to work for existing and future Dynamo users who rely on it to gate cookie-dependent content.

## Solution

Extract the Consent Gate block into a standalone companion plugin (`dynamo-consent-gate`) that Dynamo users install separately. The plugin registers the `dynamo/consent-gate` block, provides a JSX-based block editor UI compiled via `@wordpress/scripts`, and enqueues its own frontend JavaScript using plugin-owned URL and version constants — removing any dependency on theme constants for asset loading. The plugin retains a deliberate runtime dependency on the Dynamo theme for the REST endpoint that populates the consent category dropdown; the cookie driver logic, Banner Token Sync, and embed blocking all remain in the theme unchanged.

During the transition period, the Dynamo theme guards its own block registration with a sentinel constant defined by the plugin, so only one registration fires when both are present. The plugin is intentionally thin — it does only what the theme directory prohibits.

## User Stories

1. As a site owner using Dynamo, I want to install the Consent Gate plugin so that I can continue using the Consent Gate block after updating to the WordPress Theme Directory version of Dynamo.
2. As a site owner, I want to place a Consent Gate block in any post or page so that I can hide cookie-dependent embeds until a visitor grants consent.
3. As a site owner, I want to select a consent category from a dropdown in the block editor so that I can tie gated content to the correct cookie category without knowing the category slug by heart.
4. As a site owner using Complianz, I want gated content to reveal automatically when a visitor accepts the relevant Complianz category so that the experience is seamless.
5. As a site owner using Borlabs Cookie, I want gated content to reveal automatically when a visitor accepts the relevant Borlabs category so that the experience is seamless.
6. As a site owner, I want gated content that was consented to on a previous visit to be revealed immediately on page load so that returning visitors are not repeatedly prompted.
7. As a site owner, I want gated content to remain hidden if a visitor has not granted consent so that I comply with cookie consent regulations.
8. As a site owner, I want a dismissible admin notice when the Dynamo theme is not active so that I know why the Consent Gate block's category dropdown is not populating.
9. As a content editor, I want the Consent Gate block to appear in the block inserter under the Embeds category with a shield icon so that I can find and identify it intuitively when building content.
10. As a content editor, I want to nest any block inside a Consent Gate — except another Consent Gate — so that I can gate maps, videos, social embeds, or any other cookie-dependent content without creating undefined nested-gate behaviour.
11. As a content editor, I want to see a visible labelled border around the Consent Gate block in the editor so that I can identify the gate boundary at a glance without opening the inspector.
12. As a content editor, I want the Consent Gate border to turn amber and display "No category selected" when no consent category has been chosen so that I notice the misconfiguration before publishing.
13. As a content editor, I want the Consent Gate border to display the selected category name when a category is set so that I can confirm the correct category is applied without opening the inspector.
14. As a content editor, I want a placeholder prompt inside the Consent Gate block when it is empty so that I know where to add the content I want to gate.
15. As a content editor, I want the consent category dropdown to show a loading state while categories are being fetched so that I know the list is not permanently empty.
16. As a content editor, I want a clear explanation in the inspector when no consent categories are available so that I understand the dropdown is empty because of a missing theme or cookie plugin, not a bug.
17. As a content editor, I want a warning in the block editor that the Consent Gate hides content visually but does not prevent it from appearing in the page source so that I do not use it to protect sensitive data.
18. As a developer, I want the block name to remain `dynamo/consent-gate` so that existing posts using the block are not broken by the plugin extraction.
19. As a developer, I want the plugin to use the `dynamo` text domain so that all block strings are covered by the theme's existing translation files without maintaining a separate set.
20. As a developer, I want the plugin to define its own URL and version constants so that its assets are enqueued independently of whether theme constants are present.
21. As a developer, I want the Dynamo theme to defer block registration to the plugin via a sentinel constant so that the block is never double-registered during the transition period.
22. As a developer, I want the plugin's editor script compiled via `@wordpress/scripts` so that block dependencies are declared in a generated asset file and resolved automatically by WordPress.
23. As a developer, I want the compiled `build/` directory committed to the repository so that the plugin is installable directly from source without requiring a build step on the host.
24. As a developer, I want the plugin to fail gracefully — keeping gated content hidden — if the Dynamo theme is not active or the REST endpoint is unavailable, so that deactivating the theme does not expose unintended content.

## Implementation Decisions

### Modules

**Plugin Bootstrap**
The main plugin PHP file containing WordPress plugin headers. Responsibilities: define the `DYNAMO_CONSENT_GATE_LOADED` sentinel constant (used by the Dynamo theme to defer its own block registration), define `DYNAMO_CONSENT_GATE_URL` (from `plugin_dir_url(__FILE__)`) and `DYNAMO_CONSENT_GATE_VERSION`, call `register_block_type` pointing at the `build/` directory on `init`, and hook an `admin_notices` callback that shows a dismissible warning to `manage_options` users when the active theme is not Dynamo. Contains no activation hooks, no database writes, and no settings pages.

**Block Definition**
`src/block.json` — declares `dynamo/consent-gate`, API version 3, the `consentCategory` string attribute, `"editorScript": "file:./index.js"` (resolved from `build/`), and `"render": "file:../render.php"` (resolved from `build/` up to the plugin root). The `../` path is intentional: `register_block_type` is called against the `build/` directory, so the render path must traverse up to reach `render.php` at the plugin root.

**Block Editor Entry** (`src/index.js`)
Imports the Edit component from `./edit.js` and the Save function from `./save.js`. Calls `registerBlockType('dynamo/consent-gate', { ..., icon: shield, edit: Edit, save: Save })`. The `shield` icon is imported from `@wordpress/icons`.

**Block Edit Component** (`src/edit.js`)
The editor-facing React component. Renders two surfaces:

- **Block canvas** — a wrapper `div` with `4px` border radius, `16px` padding, and a dynamic `2px solid` border: `#8c8f94` (neutral grey) when a consent category is set, `#dba617` (amber) when none is selected. A top-left label displays `"Consent Gate: {category name}"` in the normal state and `"Consent Gate: No category selected"` in the warning state. No background fill in either state. Contains `<InnerBlocks>` with `allowedBlocks` excluding `dynamo/consent-gate` and a `placeholder` of `"Add consent-gated content"`.

- **Inspector sidebar** — a `PanelBody` titled `"Consent Settings"` with elements in this order:
  1. The consent category control — one of three states: while fetching, a disabled `SelectControl` labelled `"Loading categories…"`; if the resolved array is empty, a `Notice` reading `"No consent categories found. Make sure the Dynamo theme is active and a supported cookie plugin (Complianz or Borlabs Cookie) is installed."`; once loaded, a `SelectControl` labelled `"Required Consent Category"` with options fetched from `/dynamo/v1/cookie-categories`. Tracks `isLoading` boolean state.
  2. A non-dismissible warning `Notice`: `"This block hides content visually. Do not use it to protect sensitive data — hidden content is still present in the page source."`

**Block Save Component** (`src/save.js`)
Returns `<InnerBlocks.Content />`. No other logic — the block is server-side rendered.

**Block Render PHP** (`render.php`)
Server-side render template at the plugin root. Enqueues `frontend.js` unconditionally using `DYNAMO_CONSENT_GATE_URL` and `DYNAMO_CONSENT_GATE_VERSION` — no guard condition. Outputs the `dynamo-consent-gate` wrapper div with `style="display:none"` and `data-consent-category` stamped from the `consentCategory` attribute.

**Block Frontend JS** (`frontend.js`)
Vanilla JavaScript at the plugin root, outside the build pipeline. Unchanged from the theme version. On `DOMContentLoaded`, checks initial consent state against both Complianz (`window.cmplz_has_consent`) and Borlabs Cookie (`window.BorlabsCookie.checkCookieConsent`). Listens for `cmplz_status_change` and `borlabs-cookie-consent-saved` events to reveal content mid-session.

**Build Configuration** (`package.json`)
Declares `@wordpress/scripts` as a dev dependency. Provides `build` (`wp-scripts build`) and `start` (`wp-scripts start`) scripts. The build entry point is `src/index.js`; output lands in `build/`. `node_modules/` is gitignored; `build/` is committed.

**File Restructure**
The existing `blocks/consent-gate/` directory is removed. `render.php` and `frontend.js` move to the plugin root. `block.json` and the editor scripts move into `src/`.

### Architectural Decisions

- The plugin defines `DYNAMO_CONSENT_GATE_LOADED` as a sentinel constant at file load time. The Dynamo theme checks `defined('DYNAMO_CONSENT_GATE_LOADED')` before its own `register_block_type` and `enqueue_block_editor_assets` calls, deferring to the plugin when present.
- The plugin owns its asset URLs via `DYNAMO_CONSENT_GATE_URL` and `DYNAMO_CONSENT_GATE_VERSION`. No dependency on `DYNAMO_URL` or `DYNAMO_VERSION` for any asset loading.
- The REST endpoint `/dynamo/v1/cookie-categories` is owned by the theme's `Dynamo_Cookie_Integration` class and is not duplicated in the plugin. The block editor dropdown degrades gracefully to the empty-state notice if the endpoint is absent.
- `"render": "file:../render.php"` in `block.json` is intentional: `register_block_type` targets `build/`, so the render path must traverse up one level to reach `render.php` at the plugin root.
- Block name `dynamo/consent-gate` is kept unchanged. Renaming would orphan existing post content.
- Text domain `dynamo` is kept. Translations remain in the theme's `languages/` directory.
- `dynamo/consent-gate` is excluded from its own `allowedBlocks` to prevent nesting, whose behaviour would be undefined.
- The plugin contains no options, no database writes, no admin pages, and no activation hooks beyond the constant definition and block registration.

## Testing Decisions

**What makes a good test:** Tests assert on observable output — that `register_block_type` is called with the correct path, that the rendered HTML contains the expected wrapper div and `data-consent-category` attribute, that `frontend.js` is enqueued when the plugin constants are defined. Tests do not assert on internal wiring (e.g. which WordPress hook fires first).

**Modules with tests:**

- **Plugin Bootstrap** — assert that `register_block_type` is called on `init` with the path pointing at `build/`; assert the sentinel constant `DYNAMO_CONSENT_GATE_LOADED` is defined at file load time; assert the admin notice is rendered for `manage_options` users when the active theme stylesheet is not `dynamo`; assert it is not rendered when Dynamo is active.
- **Block Render PHP** — assert that given a `consentCategory` attribute of `"analytics"`, the rendered output contains `data-consent-category="analytics"` and the wrapper div has `style="display:none"`; assert that `wp_enqueue_script` is called unconditionally with handle `dynamo-consent-gate-frontend` and a URL containing `frontend.js`.
- **Block Frontend JS** — assert `revealForCategory` removes `display:none` from matching `.dynamo-consent-gate` elements; assert `checkInitialConsent` calls both the Complianz and Borlabs APIs when both are present; assert that only the matching category's elements are revealed when a `cmplz_status_change` event fires; assert Borlabs elements are revealed on `borlabs-cookie-consent-saved` when `checkCookieConsent` returns true.
- **Block Edit Component** — assert the wrapper renders with amber border styles when `consentCategory` is empty; assert the wrapper renders with grey border styles and the category name in the label when `consentCategory` is set; assert `InnerBlocks` receives `allowedBlocks` that excludes `dynamo/consent-gate`; assert the `SelectControl` is disabled and labelled `"Loading categories…"` while `isLoading` is true; assert the fallback `Notice` renders when the fetch resolves to an empty array; assert the `SelectControl` renders with options when the fetch resolves to a non-empty array.

Prior art: the Dynamo theme's PHPUnit suite uses `WP_UnitTestCase` with Brain Monkey for WordPress function stubs. The frontend JS tests follow the same vanilla JS + Jest pattern used for other theme scripts. The Edit component tests use `@wordpress/jest-preset-default` with `@testing-library/react`.

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
- A `blocks/` directory structure for multiple blocks — deferred to a future implementation once the plugin's scope expands.
- CI/CD pipeline for building and releasing the plugin.

## Further Notes

- The `build/` directory is committed to the repository. `npm run build` must be re-run and `build/` re-committed whenever `src/` changes. A future CI pipeline should automate this.
- Because the plugin ships no editor styles of its own, the Consent Gate's wrapper border and label are applied via inline styles on the edit component's root element.
- The `dynamo/consent-gate` block name is considered a stable public identifier from v1.0.0 of this plugin. Any rename would require a migration path.
- **Dynamo theme cleanup (final implementation step):** Once this plugin is stable and tested, the Dynamo theme must remove its `register_block_type()` call for `dynamo/consent-gate`, its `enqueue_block_editor_assets` callback for the consent gate editor script, and the sentinel guard that was added during the transition. The `Dynamo_Cookie_Integration::boot()` invocation and all cookie driver logic remain in the theme — only the block registration and editor script enqueue are removed. The theme should retain a dismissible `admin_notices` notice prompting users to install this plugin if the block type is not already registered.
