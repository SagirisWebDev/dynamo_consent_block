# Fonts via developer-managed manifest, separate Font Renderer, slugs in tokens

Dynamo registers custom fonts through a developer-authored `fonts/fonts.json` **Font Manifest** loaded by a `Dynamo_Font_Manifest` class. A peer class, `Dynamo_Font_Renderer`, transforms the manifest into an `@font-face` stylesheet emitted inline in `wp_head` and cached against the manifest's content hash. Typography tokens in `Dynamo_Token_Registry` store font **slugs** (e.g. `"system-sans"`); `Dynamo_CSS_Generator` resolves slug → CSS `font-family` value (label + fallback chain) at emission time using the Font Manifest injected as a dependency.

## Considered Options

- **Admin-uploadable fonts (WP 6.5 Font Library style).** Rejected: themes shouldn't assume write access to their own directory in production. Conflicts with composer-installed and immutable-deploy hosts. Adds upload-handling, capability-check, MIME-validation, and delete-flow surface area unrelated to the design-token system Dynamo already has.
- **Fold `@font-face` generation into `Dynamo_CSS_Generator`.** Rejected: fonts and tokens have different invalidation lifecycles (manifest changes only on deploy; tokens change on every Customizer save). Merging the two would re-render the font block on every Customizer save and stretch CSS Generator's `CONTEXT.md` contract beyond "reads tokens, produces CSS rules."
- **Store resolved CSS strings in typography tokens.** Rejected: manifest edits would not propagate to existing token values, and orphaned references after a font is renamed or removed would silently fall through to browser defaults instead of being detectable.
- **Filename-convention auto-discovery (no manifest).** Rejected: no place to declare fallback chains, display labels, or variable-font ranges; renames silently change CSS output; fragile.
- **External `.css` file with `wp_enqueue_style`.** Rejected for the same write-permissions reason as admin upload, and inline emission already matches `Dynamo_CSS_Output`'s pattern. The `@font-face` block is small enough (≤2 KB) that the extra request would cost more than it saves.

## Consequences

- Adding a custom font is a developer task: drop files in `fonts/<family>/`, add an entry to `fonts.json`, deploy. No admin UI.
- `Dynamo_CSS_Generator` gains a `Dynamo_Font_Manifest` dependency; its contract expands from "resolve tokens" to "resolve tokens, including looking up font slugs against the manifest."
- The theme ships a default `fonts/fonts.json` containing only system-stack entries (`system-sans`, `system-serif`, `system-mono`) — no third-party font files in the repo.
- Missing or malformed manifest at runtime degrades silently to a baked-in system stack and surfaces an admin notice for `manage_options` users; the front-end never renders fontless.
- Migration is not required: Dynamo is pre-deployment, so no existing free-text typography token values need rewriting to slugs.
