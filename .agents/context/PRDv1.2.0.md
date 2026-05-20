# PRD v1.2.0 — Cookie Consent Integration

## Problem Statement

Sites using the Dynamo theme that activate a cookie consent plugin end up with a visually inconsistent experience: the cookie banner renders in the plugin's default styling, blocked embeds produce generic grey placeholder boxes, and there is no native Gutenberg way to gate content behind a consent category. Developers must manually restyle each plugin's output to match their site — a repetitive task that has to be repeated per-project and re-done any time theme colours change. There is also no safety net preventing editors from accidentally using CSS-only visibility tricks to "hide" sensitive content, which provides no real access protection.

## Solution

Implement a self-contained Cookie Compat Class that auto-detects the active cookie consent plugin (Complianz or Borlabs Cookie), instantiates the appropriate Cookie Driver, and activates three opt-in features:

1. **Banner Token Sync** — injects a filterable subset of the Token Registry's values as CSS custom properties into the cookie banner stylesheet, so the banner automatically matches the site's colour palette and typography without any manual plugin configuration.
2. **Consent Gate block** — a Gutenberg block that renders its inner content hidden server-side and reveals it client-side when the visitor grants a specified consent category. Suitable for script and embed gating; explicitly not for sensitive data.
3. **Consent Placeholder** — a themed, on-brand placeholder rendered in place of blocked embeds (YouTube, Vimeo, Google Maps, etc.) until the visitor grants the required consent category, replacing the plugin's generic default.

All three features are activated automatically when a supported plugin is detected. No separate theme options configuration is required.

## User Stories

### Banner Token Sync

1. As a developer, I want the cookie banner to inherit my site's primary colour, background colour, text colour, link colour, and body font automatically, so that I do not have to manually restyle the banner for every project.
2. As a developer, I want the banner token mapping to be filterable via `dynamo_cookie_banner_tokens`, so that I can add, remove, or remap tokens to CSS custom properties without modifying theme files.
3. As a developer, I want the Banner Token Sync to work with both Complianz and Borlabs Cookie, so that I can choose my consent plugin without losing the sync feature.
4. As a developer, I want Banner Token Sync to activate automatically when a supported plugin is detected, so that there is no manual setup step beyond installing the plugin.
5. As a developer, I want to be able to override the injected CSS custom properties with my own styles, so that I can fine-tune the banner appearance beyond what the token map provides.

### Consent Gate Block

6. As a site editor, I want a Gutenberg block that gates any inner content behind a consent category, so that I can prevent scripts or embeds from running until the visitor has consented.
7. As a site editor, I want to select the consent category from a dropdown in the block inspector, so that I can target the correct category without knowing the plugin's internal slug.
8. As a site editor, I want the dropdown to show human-readable category labels (e.g. "Marketing", "Statistics"), so that I do not need to remember raw plugin slugs.
9. As a site editor, I want the dropdown to reflect the consent categories available in the active plugin, so that I cannot select a category that does not exist.
10. As a site editor, I want the Consent Gate block to show a clear placeholder in the editor when content is gated, so that I know the gate is active without switching to preview mode.
11. As a visitor who has not yet consented, I want to see a clear, on-brand message explaining that I need to accept cookies to view the content, so that I understand why it is not showing.
12. As a visitor who grants consent via the cookie banner, I want the gated content to appear immediately without a page reload, so that I do not have to navigate back to the page.
13. As a visitor who has already consented on a previous visit, I want gated content to display immediately on page load, so that I am not asked to consent again.
14. As a developer, I want the Consent Gate block to render content server-side (hidden) rather than omitting it from the page entirely, so that the feature works correctly on cached pages where PHP-side consent checking is unreliable.
15. As a developer, I want the Consent Gate block to be clearly documented as unsuitable for protecting sensitive data, so that editors do not use it as a security mechanism.
16. As a developer, I want the Consent Gate block's reveal logic to detect whichever supported plugin is active, so that it works regardless of whether Complianz or Borlabs Cookie is installed.

### Consent Placeholder

17. As a site editor, I want blocked embeds to display a styled, on-brand placeholder instead of the plugin's default grey box, so that my site looks designed even when content is blocked.
18. As a visitor, I want the Consent Placeholder to clearly tell me which consent category I need to accept and provide a prompt to do so, so that I can take action if I want to view the embed.
19. As a visitor who grants the required consent, I want the Consent Placeholder to be replaced with the real embed immediately without a page reload, so that the experience is seamless.
20. As a developer, I want the Consent Placeholder to use the same CSS custom properties set by Banner Token Sync, so that the placeholder automatically matches the cookie banner and the rest of the site.
21. As a developer, I want to override the Consent Placeholder markup by placing a template file in my child theme, so that I can fully customise its appearance without modifying the parent theme.
22. As a developer, I want embed blocking to cover the full product description, short description, and product category description on WooCommerce sites, so that embeds in all product content areas are gated correctly.
23. As a developer, I want embed blocking to only extend to WooCommerce taxonomy archives when WooCommerce product category or tag archives are being viewed, so that non-WooCommerce term descriptions on the same site are unaffected.
24. As a developer, I want embed blocking to work across both Complianz and Borlabs Cookie, using each plugin's native blocking API, so that the placeholder system integrates cleanly with the active plugin's consent lifecycle.

### General / Integration

25. As a developer, I want the Cookie Compat Class to activate automatically when Complianz or Borlabs Cookie is detected on `after_setup_theme`, so that no manual configuration is required beyond installing the plugin.
26. As a developer, I want the Cookie Compat Class to log a `_doing_it_wrong()` notice and default to Complianz if both supported plugins are active simultaneously, so that conflicts are surfaced clearly rather than silently misbehaving.
27. As a developer, I want the cookie integration to add no overhead when neither supported plugin is active, so that sites not using cookie plugins are unaffected.
28. As a developer, I want the Complianz and Borlabs drivers to be independently testable classes, so that I can verify each driver's behaviour in isolation without needing the plugin installed.
29. As a developer, I want to be able to add support for a third cookie plugin in the future by implementing a single interface, so that extending the integration does not require modifying existing driver code.

## Implementation Decisions

### Modules to build

**Cookie Compat Class**
The coordinator class. Runs on `after_setup_theme` (priority 11, after plugins load), checks for the active plugin via `class_exists` / `function_exists`, instantiates the matching Cookie Driver, and calls `register_palette_sync_hooks()`, `register_embed_hooks()`, and registers the consent categories REST endpoint. If both supported plugins are active, calls `_doing_it_wrong()` and defaults to Complianz. Never instantiated if neither plugin is active.

**Cookie Driver interface**
Defines three methods: `register_palette_sync_hooks(): void`, `register_embed_hooks(): void`, and `get_consent_categories(): array`. The return type of `get_consent_categories()` is a keyed label map: `[['slug' => 'marketing', 'label' => 'Marketing'], ...]`. All drivers must return this shape.

**Complianz Driver**
Implements `register_palette_sync_hooks()` via the `cmplz_banner_css` action. Implements `register_embed_hooks()` via the `cmplz_known_script_tags` filter (for URL-matched blocking) and the `cmplz_placeholder_{service}` filter (to point to the Consent Placeholder template). Implements `get_consent_categories()` returning Complianz's four fixed categories with human-readable labels.

**Borlabs Driver**
Implements `register_palette_sync_hooks()` via the `borlabsCookie/styleBuilder/modifyCss` filter. Implements `register_embed_hooks()` via the `borlabsCookie/contentBlocker/blocking/afterBlocking/{service}` filter to inject the Consent Placeholder template. Implements `get_consent_categories()` by reading Borlabs' configured service groups and mapping them to the keyed label map format.

**Cookie Categories REST Endpoint**
A REST route at `/wp-json/dynamo/v1/cookie-categories` registered by the Cookie Compat Class. Returns the active driver's `get_consent_categories()` output as JSON. Used by the Consent Gate block editor to populate the consent category dropdown. Requires `edit_posts` capability.

**Consent Gate Block**
A Gutenberg block with a single `cookieCategory` string attribute (stores the slug). The block editor fetches available categories from the REST endpoint on mount and renders a `SelectControl` dropdown. Server-side render outputs the inner blocks wrapped in a container with `style="display:none"` and a `data-consent-category` attribute. A small frontend JS file listens for the active plugin's consent event and removes the hidden style when the required category is granted. If consent is already held on page load, content is shown immediately.

**Consent Placeholder Template**
A PHP template at `templates/consent-placeholder.php`. Receives the blocked service name and consent category as variables. Styled exclusively via CSS custom properties set by Banner Token Sync (e.g. `var(--cookie-primary)`). Overridable by placing the same file in a child theme. Shared across both drivers — neither driver contains placeholder HTML directly.

### Modules to modify

**functions.php**
Add `require_once` calls for all new cookie class files and conditionally instantiate the Cookie Compat Class inside the existing `after_setup_theme` callback.

**CSS Generator / Token Registry**
No new tokens required. Banner Token Sync reads existing tokens (`colour_primary`, `colour_background`, `colour_text`, `colour_link`, `typography_body_font_family`) via the `dynamo_cookie_banner_tokens` filterable map. The map ships with these five defaults.

### Architectural decisions

- The driver pattern is used because Complianz and Borlabs have meaningfully different embed-blocking APIs. A flat class with conditionals would make both drivers hard to read and test in isolation. See ADR-0002.
- CookieYes is explicitly excluded. Its API has no server-side embed blocking, making a clean `register_embed_hooks()` implementation impossible without reimplementing functionality the plugin should provide.
- The Consent Gate block uses a CSS-hide/JS-reveal pattern rather than server-side content omission. PHP consent checking is unreliable on first visits and cached pages. The block must document clearly that it is not suitable for protecting sensitive data — hidden HTML is always accessible in the page source.
- The REST endpoint for consent categories requires `edit_posts` capability. It is only called in the block editor context, not on the frontend.
- WooCommerce embed hook extension (`woocommerce_short_description`, `term_description`) is registered conditionally inside `register_embed_hooks()` when `class_exists('WooCommerce')` is true. The `term_description` hook is additionally guarded by `is_product_category() || is_product_tag()` to prevent interference with non-WooCommerce taxonomies.
- The Consent Placeholder template is shared across drivers. It receives service name and category as template variables — drivers are responsible for passing these; the template contains no plugin-specific logic.

## Testing Decisions

**What makes a good test here:** Test what each module produces given a set of inputs, not which internal methods it called. For drivers, test that the correct hooks are registered with the correct priorities, and that `get_consent_categories()` returns a correctly-shaped array. For the REST endpoint, test the response shape. For the block, test the server-side render output given a specific `cookieCategory` attribute value.

**Modules to test:**

- *Cookie Driver interface contract*: Both drivers must return a correctly-shaped keyed label map from `get_consent_categories()`. Write a shared contract test that both drivers pass.
- *Complianz Driver*: Assert that `register_palette_sync_hooks()` adds a callback to `cmplz_banner_css`. Assert that `register_embed_hooks()` adds a callback to `cmplz_known_script_tags`. Assert that `get_consent_categories()` returns the expected four entries with correct slug/label pairs.
- *Borlabs Driver*: Assert that `register_palette_sync_hooks()` adds a callback to `borlabsCookie/styleBuilder/modifyCss`. Assert that `register_embed_hooks()` registers `afterBlocking` callbacks. Assert that `get_consent_categories()` returns a non-empty keyed label map.
- *Cookie Compat Class*: Assert that when only Complianz is present, the Complianz Driver is instantiated. Assert that when only Borlabs is present, the Borlabs Driver is instantiated. Assert that when neither is present, no driver is instantiated and no hooks are registered.
- *REST endpoint*: Assert that the endpoint returns HTTP 200 with a JSON array of `{slug, label}` objects when called with sufficient capability.
- *Consent Gate block render*: Assert that the server-side render outputs a wrapper with `style="display:none"` and the correct `data-consent-category` attribute for a given `cookieCategory` attribute value.

**Prior art:** Review `tests/` in the Dynamo repo for existing PHPUnit patterns and assertion style before writing new tests. Match the bootstrap configuration already in use.

## Out of Scope

- **CookieYes integration** — excluded due to insufficient server-side embed-blocking API. May be revisited if their developer API matures.
- **Sensitive data protection** — the Consent Gate block is not a security boundary. Server-side access control for genuinely private content is out of scope and belongs in a membership or access-control plugin.
- **Custom cookie banner template** — Banner Token Sync injects CSS custom properties into the existing plugin banner; it does not replace the banner template. Full template replacement is left to the developer via the plugin's own mechanisms.
- **Cookie scanner or automatic cookie categorisation** — this is provided by the consent plugin itself and is not duplicated in the theme.
- **Consent logging or audit trail** — this is provided by the consent plugin itself.
- **A/B testing banner variants** — out of scope for this version.
- **Geo-targeted consent rules** — out of scope for this version.
- **Per-page consent requirements via post meta** — out of scope for this version.
- **CookieYes, OneTrust, TrustArc, or any other third-party SaaS provider** — only Complianz and Borlabs Cookie are in scope.

## Further Notes

- The `dynamo_cookie_banner_tokens` filter should be documented in `dynamo-extend-customizer.php` alongside the existing customizer extension examples, so that developers extending the theme have a single reference point for all filterable theme behaviour.
- The Consent Gate block's editor UI should display a visible warning in the block inspector stating: "This block hides content visually. Do not use it to protect sensitive data — hidden content is still present in the page source."
- When implementing the Borlabs Driver's `get_consent_categories()`, note that `borlabsCookieApi()` returns `null` if called before WordPress `init` at priority 10. All Borlabs API calls must run at `init` priority 11 or later.
- The frontend JS for the Consent Gate block should detect which plugin is active by checking for the presence of `window.cmplz_has_consent` (Complianz) or `window.BorlabsCookie` (Borlabs) rather than being hardcoded to one plugin's event system.
- The Consent Placeholder template should include a visually-hidden accessible label describing why the content is blocked, for screen reader users.
