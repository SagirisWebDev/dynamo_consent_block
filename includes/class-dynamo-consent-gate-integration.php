<?php
declare(strict_types=1);

class Dynamo_Consent_Gate_Integration {

    public static function boot(): void {
        add_action('after_setup_theme', [new self(), 'register_embed_hooks'], 12);
        add_action('rest_api_init', [new self(), 'register_rest_route']);
    }

    public function register_embed_hooks(): void {
        $has_complianz = function_exists('cmplz_get_value') || class_exists('COMPLIANZ');
        $has_borlabs   = class_exists('BorlabsCookie\Cookie\Cookie') || class_exists('BorlabsCookie');

        if (! $has_complianz && ! $has_borlabs) {
            return;
        }

        if ($has_complianz) {
            add_filter('dynamo_has_consent', static function (bool $_, string $category): bool {
                return function_exists('cmplz_has_consent') && cmplz_has_consent($category);
            }, 10, 2);
        } else {
            add_filter('dynamo_has_consent', static function (bool $_, string $category): bool {
                if (class_exists('BorlabsCookie\Cookie\Cookie')) {
                    return BorlabsCookie\Cookie\Cookie::getInstance()->isAccepted($category);
                }
                return false;
            }, 10, 2);
        }

        add_filter('the_content', [Dynamo_Consent_Gate_Placeholder::class, 'replace_embeds']);

        if (class_exists('WooCommerce')) {
            add_filter('woocommerce_short_description', [Dynamo_Consent_Gate_Placeholder::class, 'replace_embeds']);
            add_filter('term_description', static function (string $content): string {
                if (! is_product_category() && ! is_product_tag()) {
                    return $content;
                }
                return Dynamo_Consent_Gate_Placeholder::replace_embeds($content);
            });
        }

        add_action('wp_enqueue_scripts', static function (): void {
            wp_enqueue_script(
                'dynamo-consent-reveal',
                DYNAMO_CONSENT_GATE_URL . 'consent-reveal.js',
                [],
                DYNAMO_CONSENT_GATE_VERSION,
                true
            );
        });
    }

    public function register_rest_route(): void {
        $has_complianz = function_exists('cmplz_get_value') || class_exists('COMPLIANZ');
        $has_borlabs   = class_exists('BorlabsCookie\Cookie\Cookie') || class_exists('BorlabsCookie');

        if (! $has_complianz && ! $has_borlabs) {
            return;
        }

        register_rest_route('dynamo/v1', '/cookie-categories', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_categories'],
            'permission_callback' => fn() => current_user_can('edit_posts'),
        ]);
    }

    public function get_categories(): array {
        if (function_exists('cmplz_get_value') || class_exists('COMPLIANZ')) {
            return [
                ['slug' => 'marketing',   'label' => 'Marketing'],
                ['slug' => 'statistics',  'label' => 'Statistics'],
                ['slug' => 'functional',  'label' => 'Functional'],
                ['slug' => 'preferences', 'label' => 'Preferences'],
            ];
        }
        // Borlabs service group querying is a future enhancement.
        return [];
    }
}
