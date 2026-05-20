# Dynamo Consent Gate

A WordPress plugin that registers the `dynamo/consent-gate` Gutenberg block. The block hides inner content until a visitor grants a specified consent category, integrating with whichever cookie plugin is active on the site. Designed exclusively for use with the Dynamo theme.

## Language

**Consent Gate**:
The Gutenberg block (`dynamo/consent-gate`) registered by this plugin. Wraps inner blocks and keeps them hidden until the visitor grants the required **Consent Category**.
_Avoid_: cookie gate, consent wall, content gate

**Consent Category**:
The string slug stored on a **Consent Gate** block identifying the cookie category a visitor must have granted before inner content is revealed. Sourced at edit-time from the `/wp-json/dynamo/v1/cookie-categories` REST endpoint, which is owned by the Dynamo theme.
_Avoid_: consent type, cookie type, category slug

**Cookie Driver**:
An interface in the Dynamo theme (`Dynamo_Cookie_Driver`) implemented by adapters for each supported cookie plugin (Complianz, Borlabs). Provides `get_consent_categories()`, which backs the REST endpoint consumed by the **Consent Gate** block editor. Lives in the theme — not this plugin.
_Avoid_: plugin adapter, cookie handler

## Relationships

- **Consent Gate** block stores one **Consent Category** as an attribute
- **Consent Gate** block editor fetches available **Consent Categories** from `/wp-json/dynamo/v1/cookie-categories`, registered by the Dynamo theme via the active **Cookie Driver**
- `frontend.js` reveals **Consent Gate** content client-side when the visitor's cookie plugin fires the matching **Consent Category** grant event

## Flagged ambiguities

- "content gate" and "cookie gate" are used colloquially — resolved: the canonical term is **Consent Gate** because gating is on consent, not on cookies specifically.
