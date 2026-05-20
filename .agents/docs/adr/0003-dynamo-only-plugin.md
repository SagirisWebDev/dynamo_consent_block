# Plugin is Dynamo-theme-only

This plugin deliberately depends on the Dynamo theme being active. `render.php` enqueues `frontend.js` via `DYNAMO_URL` and `DYNAMO_VERSION` constants defined by the theme, and the block editor populates its **Consent Category** dropdown by calling `/wp-json/dynamo/v1/cookie-categories`, a REST endpoint registered by the theme's `Dynamo_Cookie_Integration` class.

## Considered options

- **Theme-agnostic plugin** — replace theme constants with `plugin_dir_url()`, and move the REST endpoint (plus minimal Complianz/Borlabs detection logic) into the plugin. Rejected because it would duplicate the cookie driver logic that already lives in the theme, and the plugin has no use case outside of Dynamo.
- **Dynamo-only plugin** — chosen. The plugin is thin: it only registers the block. All cookie detection and category resolution remain in the theme where they already exist.

## Consequences

If the Dynamo theme is not active, `DYNAMO_URL` and `DYNAMO_VERSION` are undefined and `frontend.js` will not be enqueued — consent-gated content will stay permanently hidden. The block editor dropdown will also be empty. This is acceptable because the plugin is not intended to function without the theme.
