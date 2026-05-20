# Cookie integration uses a driver pattern

The cookie integration supports two plugins (Complianz and Borlabs Cookie) with meaningfully different APIs — particularly for embed blocking, where Complianz uses a URL-match filter and Borlabs exposes a first-class `contentBlockerApi()`. A single flat class with branching conditionals would merge those differences into a hard-to-read tangle and make adding a third plugin error-prone. Instead, `Dynamo_Cookie_Driver` is an interface with three feature methods (`register_palette_sync_hooks`, `register_embed_hooks`, `get_consent_categories`); `Dynamo_Cookie_Compat` detects the active plugin and instantiates the matching driver.

## Considered options

- **Flat class with conditionals** — simpler, no interface, consistent with the rest of `includes/`. Rejected because the per-plugin differences in embed blocking are large enough that a single class would require deep nesting and make each plugin's behaviour hard to follow or test in isolation.
- **Driver pattern** — chosen. Each driver is independently testable, the coordinator stays thin, and adding a third plugin (e.g. CookieYes if their API improves) means adding one class without touching existing drivers.

## Consequences

CookieYes is explicitly out of scope for the initial implementation. Its API lacks server-side embed blocking, making it impossible to implement Feature 3 (`register_embed_hooks`) without reimplementing what the plugin should provide. A future driver could be added if their API matures.
