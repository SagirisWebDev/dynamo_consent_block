<?php
/**
 * Tests for the plugin bootstrap (dynamo-consent-gate.php).
 *
 * Acceptance criteria covered:
 *  - PHPUnit: sentinel constant `DYNAMO_CONSENT_GATE_LOADED` is defined at file load
 *  - PHPUnit: `register_block_type` receives a path pointing at `build/`
 */

declare(strict_types=1);

namespace Dynamo\ConsentGate\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

final class PluginBootstrapTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        // Default stubs WordPress functions the bootstrap is expected to call.
        Functions\when('plugin_dir_url')->justReturn('https://example.test/wp-content/plugins/dynamo-consent-gate/');
        Functions\when('plugin_dir_path')->justReturn(DYNAMO_CONSENT_GATE_PLUGIN_DIR . '/');
        Functions\when('untrailingslashit')->alias(static function (string $value): string {
            return rtrim($value, '/\\');
        });
        Functions\when('trailingslashit')->alias(static function (string $value): string {
            return rtrim($value, '/\\') . '/';
        });
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * AC: sentinel constant `DYNAMO_CONSENT_GATE_LOADED` is defined at file load.
     */
    public function test_sentinel_constant_is_defined_when_plugin_file_is_loaded(): void
    {
        $this->assertFalse(
            defined('DYNAMO_CONSENT_GATE_LOADED'),
            'Pre-condition failed: DYNAMO_CONSENT_GATE_LOADED must not already be defined before loading the plugin.'
        );

        $pluginFile = DYNAMO_CONSENT_GATE_PLUGIN_DIR . '/dynamo-consent-gate.php';

        $this->assertFileExists(
            $pluginFile,
            'Plugin bootstrap file dynamo-consent-gate.php is missing from the plugin root.'
        );

        require_once $pluginFile;

        $this->assertTrue(
            defined('DYNAMO_CONSENT_GATE_LOADED'),
            'Expected DYNAMO_CONSENT_GATE_LOADED to be defined at file load time.'
        );
    }

    /**
     * AC: register_block_type receives a path pointing at `build/`.
     *
     * The plugin is expected to register the block on the `init` action.
     * We capture the registration call by stubbing `register_block_type`,
     * then fire the `init` action via Brain Monkey to invoke whatever
     * callback the plugin attached.
     */
    public function test_register_block_type_is_called_with_path_pointing_at_build_directory(): void
    {
        $capturedPath = null;

        Functions\when('register_block_type')->alias(static function ($pathOrName) use (&$capturedPath) {
            $capturedPath = $pathOrName;
            return true;
        });

        $pluginFile = DYNAMO_CONSENT_GATE_PLUGIN_DIR . '/dynamo-consent-gate.php';
        $this->assertFileExists($pluginFile, 'Plugin bootstrap file dynamo-consent-gate.php is missing from the plugin root.');

        require_once $pluginFile;

        // Brain Monkey does not invoke add_action callbacks via do_action.
        // Call the named registration function directly.
        dynamo_consent_gate_register();

        $this->assertNotNull(
            $capturedPath,
            'Expected register_block_type to be called after the `init` action fires.'
        );

        $this->assertIsString(
            $capturedPath,
            'register_block_type was expected to be called with a string path argument.'
        );

        $this->assertStringContainsString(
            'build',
            (string) $capturedPath,
            'Expected register_block_type to be called with a path containing the `build/` directory.'
        );

        $this->assertStringContainsString(
            DYNAMO_CONSENT_GATE_PLUGIN_DIR,
            (string) $capturedPath,
            'Expected register_block_type to be called with a path rooted in the plugin directory.'
        );
    }
}
