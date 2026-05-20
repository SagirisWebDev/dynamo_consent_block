# PRD v1.1.0 — WooCommerce Compatibility

## Problem Statement

The Dynamo theme has no WooCommerce support. When WooCommerce is activated on a site using Dynamo, the shop page, single product pages, cart, and checkout render without theme styles, structural wrappers, or any design system integration. Product grids are unstyled, the header has no cart icon, and there are no customizer controls for common shop layout decisions. Store owners cannot use Dynamo as a WooCommerce theme without significant custom CSS work.

## Solution

Implement a self-contained WooCommerce Compat Class that registers theme support, provides structural wrappers, hooks into WooCommerce's template system, and exposes a WooCommerce customizer panel. All colour and spacing values flow through Dynamo's existing Token Registry and CSS Generator. A static Base WooCommerce Stylesheet handles structural layout, grid, and responsive styles that do not vary per-token. The result is a fully styled, customizer-controlled WooCommerce experience consistent with Dynamo's design system.

## User Stories

1. As a store owner, I want WooCommerce to recognise the Dynamo theme, so that WooCommerce template overrides and hooks work correctly.
2. As a store owner, I want my shop page to display products in a styled grid, so that my store looks professional without writing custom CSS.
3. As a store owner, I want to set the number of product columns (1–6) from the customizer, so that I can match my shop layout to my content width.
4. As a store owner, I want to set the number of products displayed per page from the customizer, so that I can control pagination without editing PHP.
5. As a store owner, I want to show or hide the product image on product cards, so that I can build text-focused product listings if needed.
6. As a store owner, I want to show or hide the product title on product cards, so that I have full control over card content.
7. As a store owner, I want to show or hide the product price on product cards, so that I can hide pricing on quote-only catalogues.
8. As a store owner, I want to show or hide star ratings on product cards, so that I can hide ratings on new stores with no reviews yet.
9. As a store owner, I want to show or hide the short description on product cards, so that I can keep my grid clean or add context per preference.
10. As a store owner, I want to show or hide the add-to-cart button on product cards, so that I can build browse-only catalogue pages.
11. As a store owner, I want to show or hide the product title on the single product page, so that I can integrate the title into a custom hero section if needed.
12. As a store owner, I want to show or hide the product price on the single product page, so that I can hide pricing from catalogue-mode product pages.
13. As a store owner, I want to show or hide star ratings on the single product page, so that I can suppress ratings until a product has enough reviews.
14. As a store owner, I want to show or hide the product excerpt on the single product page, so that I can control the information density of the summary area.
15. As a store owner, I want to show or hide the add-to-cart button on the single product page, so that I can create enquiry-only product pages.
16. As a store owner, I want to show or hide product meta (SKU, categories, tags) on the single product page, so that I can keep product pages clean.
17. As a store owner, I want a cart icon in my theme header, so that customers can see their cart and navigate to it without hunting for a link.
18. As a store owner, I want to enable or disable the header cart icon from the customizer, so that I can choose whether it appears.
19. As a store owner, I want to choose the position of the header cart icon (left, center, right), so that it fits my header layout.
20. As a store owner, I want the header cart icon to display a live item count, so that customers always see how many items are in their cart.
21. As a store owner, I want plus and minus buttons on quantity inputs, so that customers on mobile don't need to use the native number spinner.
22. As a store owner, I want to enable or disable quantity plus/minus buttons from the customizer, so that I can revert to native inputs if preferred.
23. As a store owner, I want to customise the "Proceed to Checkout" button text on the cart page, so that I can match my brand voice.
24. As a store owner, I want to show or hide cross-sell products on the cart page, so that I can reduce distraction in the checkout flow if I choose.
25. As a store owner, I want to control how many columns related products are displayed in on the single product page, so that related products align with my shop grid.
26. As a store owner, I want sale badges on product cards to use my brand colours, so that sale highlights look intentional rather than generic.
27. As a store owner, I want star ratings to use my brand's accent colour, so that ratings feel like part of the design system.
28. As a store owner, I want the cart and checkout pages to be styled consistently with the rest of my theme, so that the purchase flow feels cohesive.
29. As a store owner, I want the block-based WooCommerce checkout to be styled correctly, so that customers using the new checkout experience don't see broken layouts.
30. As a store owner, I want all WooCommerce colour customisations to be reflected live in the customizer preview, so that I can design without saving and refreshing.
31. As a developer, I want WooCommerce styles to respect Dynamo's token system, so that a single colour change in the customizer propagates correctly to WooCommerce elements.
32. As a developer, I want the WooCommerce integration to be encapsulated in its own class, so that I can extend or replace it without touching core theme files.
33. As a developer, I want a commented stub for a future shop style switcher (grid/modern/list), so that the extension point is clearly marked when we revisit it.

## Implementation Decisions

### Modules to build

**WooCommerce Compat Class (new)**
A singleton class responsible for: registering `add_theme_support('woocommerce')`, wrapping WooCommerce's main content area, enqueuing the Base WooCommerce Stylesheet and WooCommerce JS, applying all customizer-driven filters (columns, products per page, element visibility, related products, cart button text, cross-sells), and rendering the Header Cart Icon via the `dynamo_header_cart` action hook. Instantiated in `functions.php` alongside core classes.

**Base WooCommerce Stylesheet (new)**
A single static CSS file for structural and layout styles: product grid, table structure, form input resets, block checkout compatibility styles, quantity button layout, header cart icon positioning, and responsive breakpoints. Not token-driven. Enqueued by the WooCommerce Compat Class on WooCommerce pages.

**WooCommerce JS (new)**
A small JavaScript file handling two concerns: quantity plus/minus button click handlers (increment/decrement the adjacent input and trigger a change event for cart updates), and AJAX cart fragment refresh for the Header Cart Icon count. Enqueued by the WooCommerce Compat Class.

### Modules to modify

**Token Registry**
Add three WooCommerce-specific tokens: `woocommerce-sale-badge-bg`, `woocommerce-sale-badge-color`, `woocommerce-star-color`. All other WooCommerce element styles map to existing tokens (`colors-primary`, `colors-text`, `colors-background`, `borders-radius`, `borders-color`, `shadows-md`, spacing tokens).

**CSS Generator**
Add a WooCommerce CSS generation method that outputs token-driven overrides for: sale badge colours, star rating colour, add-to-cart button colours (mapped to `colors-primary`), product card backgrounds (mapped to `colors-background`), and border/shadow values on product cards.

**Customizer**
Add a WooCommerce panel with the following sections and controls:
- *Shop Layout*: columns per row (1–6), products per page, commented-out style switcher stub (future feature)
- *Product Cards*: show/hide toggles for image, title, price, rating, short description, add-to-cart button
- *Single Product*: show/hide toggles for title, price, rating, excerpt, add-to-cart, meta; related products column count
- *Header Cart*: enable toggle, position select (left/center/right)
- *Cart & Checkout*: cart button text field, cross-sells enable toggle
- *WooCommerce Colours*: sale badge background, sale badge text colour, star rating colour

All controls use `postMessage` transport for live preview. Saving busts the CSS Cache via the existing `customize_save_after` hook.

**functions.php**
Add a `require_once` for the WooCommerce Compat Class and conditionally instantiate it inside the `after_setup_theme` callback, guarded by `class_exists('WooCommerce')`.

**header.php**
Add a `do_action('dynamo_header_cart')` call at an appropriate point in the header markup. The WooCommerce Compat Class hooks into this action to inject the cart icon when enabled.

### Architectural decisions

- WooCommerce integration is entirely opt-in at the PHP level — if WooCommerce is not active, the compat class is never instantiated and no overhead is added.
- Structural CSS (grid, tables, responsive) lives in a static file; token-driven overrides are generated. These two layers are intentionally separate and must not be merged.
- The shop style switcher customizer control is implemented but commented out. The comment must label it as a future feature. The grid layout is the only active style.
- The Header Cart Icon is injected via `dynamo_header_cart` action hook, not hardcoded into `header.php`. This keeps the template clean and the integration reversible.
- Product card and Single Product element order is fixed. The show/hide toggles control visibility only — there is no drag-and-drop reordering.
- Sticky add-to-cart is explicitly out of scope for this version.
- Store notice styling is explicitly out of scope for this version.
- Side-by-side single product image layout is explicitly out of scope for this version.

## Testing Decisions

**What makes a good test here:** Test external behaviour — what the module produces given a set of inputs — not implementation details. For filters and hooks, test that the correct value is returned or that the correct markup is output. Do not test that a specific internal method was called.

**Modules to test:**

- *Token Registry (WooCommerce tokens)*: Assert that the three new WooCommerce tokens are present in the registry output with correct default values. Assert that existing tokens are unaffected. This module is a pure data store — straightforward to test in isolation.
- *CSS Generator (WooCommerce overrides)*: Assert that given a known set of token values, the generator produces the expected CSS property/value pairs for WooCommerce elements. Test the sale badge, star colour, and button colour outputs specifically.
- *WooCommerce Compat Class (filters)*: Assert that `loop_shop_columns` and `loop_shop_per_page` return the values set in the customizer. Assert that `related_products_args` returns the correct column count. Assert that the cross-sells filter returns false when the toggle is disabled.
- *Customizer controls*: Assert that all WooCommerce customizer controls are registered under the correct panel/section, and that default values match the Token Registry defaults.

**Prior art:** Check `tests/` in the Dynamo repo for existing test patterns before writing new ones — match the assertion style and test runner configuration already in use.

## Out of Scope

- **Sticky add-to-cart bar** on single product pages
- **Store notice** text/background colour and position customisation
- **Side-by-side image/summary layout** on single product pages
- **Shop style switcher** (modern card design, list layout) — grid only in this version; the customizer control stub is present but commented out as a future feature
- **Product structure reordering** (drag-and-drop element order) — show/hide only
- **Header builder** — the header cart icon uses a fixed action hook, not a builder component
- **RTL stylesheet variants**
- **Astra Pro addon features** (none of Astra's Pro-gated WooCommerce features are in scope)

## Further Notes

- The Base WooCommerce Stylesheet should include styles for the WooCommerce Blocks checkout (the block-based checkout that ships with WooCommerce 7+), as this is increasingly the default for new WooCommerce installs.
- The `dynamo_header_cart` action hook added to `header.php` is a general-purpose extension point — future features (wishlist icons, account icons) can hook into it without further template changes.
- When implementing the WooCommerce Compat Class, reference Astra's `class-astra-woocommerce.php` for the correct WooCommerce hook names and priorities. Do not copy Astra's markup or CSS directly — Dynamo's token system and simpler architecture require fresh implementations.
- The three WooCommerce tokens (`woocommerce-sale-badge-bg`, `woocommerce-sale-badge-color`, `woocommerce-star-color`) should have sensible defaults that work against both light and dark `colors-background` values.
