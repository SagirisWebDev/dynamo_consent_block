<?php
/**
 * PHPUnit bootstrap for the Dynamo Consent Gate plugin tests.
 *
 * Loads Composer autoload (Brain Monkey, PHPUnit) and exposes the plugin
 * root as DYNAMO_CONSENT_GATE_PLUGIN_DIR for tests that need to require
 * source files directly.
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

if (!defined('DYNAMO_CONSENT_GATE_PLUGIN_DIR')) {
    define('DYNAMO_CONSENT_GATE_PLUGIN_DIR', dirname(__DIR__));
}

if (!defined('ABSPATH')) {
    // Many WordPress files guard on ABSPATH; pretend we're inside WordPress.
    define('ABSPATH', DYNAMO_CONSENT_GATE_PLUGIN_DIR . '/');
}
