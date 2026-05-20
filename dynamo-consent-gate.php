<?php
/**
 * Plugin Name: Dynamo Consent Gate
 * Plugin URI:  https://github.com/SagirisWebDev/dynamo_consent_block
 * Description: Registers the dynamo/consent-gate Gutenberg block. Hides inner content until a visitor grants the required consent category.
 * Version:     1.0.0
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * Author:      Sagiris Web Dev
 * Text Domain: dynamo
 */

declare(strict_types=1);

define('DYNAMO_CONSENT_GATE_LOADED', true);
define('DYNAMO_CONSENT_GATE_VERSION', '1.0.0');
define('DYNAMO_CONSENT_GATE_URL', plugin_dir_url(__FILE__));

function dynamo_consent_gate_register(): void {
    register_block_type(__DIR__ . '/build');
}

add_action('init', 'dynamo_consent_gate_register');
