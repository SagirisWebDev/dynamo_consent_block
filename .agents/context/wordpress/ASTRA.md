# AGENTS.md

Agent guidance for this repository (WordPress Astra theme).

## Scope

- This is a production WordPress theme codebase.
- Keep changes minimal and backward-compatible.
- Prefer existing Astra APIs and hooks over introducing new patterns.

## Fast Start

- Install JS tooling only when needed: `npm ci`
- This repo has no npm scripts. Use Prettier directly when formatting JS/CSS/JSON/Markdown:
  - Check: `npx prettier --check "**/*.{js,css,json,md}"`
  - Write: `npx prettier --write "**/*.{js,css,json,md}"`

## Project Map

- Theme bootstrap and core includes: [functions.php](functions.php)
- Theme option access/defaults: [inc/core/class-astra-theme-options.php](inc/core/class-astra-theme-options.php)
- Astra hook surface: [inc/core/theme-hooks.php](inc/core/theme-hooks.php)
- Dynamic CSS generation: [inc/class-astra-dynamic-css.php](inc/class-astra-dynamic-css.php), [inc/dynamic-css/](inc/dynamic-css/)
- Template rendering entry points: [template-parts/](template-parts/), [header.php](header.php), [footer.php](footer.php), [single.php](single.php), [archive.php](archive.php)
- Frontend JS source: [assets/js/unminified/](assets/js/unminified/)
- Minified frontend assets: [assets/js/minified/](assets/js/minified/), [assets/css/minified/](assets/css/minified/)
- Block editor settings/palette bridge: [theme.json](theme.json)

## Editing Conventions

- PHP style follows WordPress conventions used throughout this repo.
- Reuse Astra option accessors (for example `astra_get_option()`) rather than hardcoding values.
- Prefer extending behavior through existing Astra/WordPress actions and filters.
- Keep localization/text-domain behavior intact (`astra`).

## Asset Rules

- Do not hand-edit minified files unless explicitly asked.
- Prefer changing source files under `assets/js/unminified/` and corresponding non-minified CSS sources.
- Note: [style.css](style.css) states runtime CSS is loaded from `assets/css/`.

## Dynamic Styling

- Many visual changes should be integrated into dynamic CSS flow, not only static stylesheet edits.
- Check existing dynamic CSS modules in [inc/dynamic-css/](inc/dynamic-css/) before adding new style output.

## Validation Checklist

- Lint changed PHP files with syntax check: `php -l <changed-file>.php`
- Format changed JS/CSS/JSON/MD with Prettier.
- Manually verify affected templates/pages in a local WordPress instance.
- For UI/style changes, verify desktop + mobile behavior.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Reference Docs

- Theme metadata and compatibility notes: [readme.txt](readme.txt)
- Security reporting policy: [SECURITY.md](SECURITY.md)
- Release history: [changelog.txt](changelog.txt)
