<?php
/**
 * Tests for the server-side render template (render.php).
 *
 * Acceptance criteria covered:
 *  - PHPUnit: render output contains `data-consent-category="analytics"` and
 *    `style="display:none"` given attribute `"analytics"`
 *  - PHPUnit: `wp_enqueue_script` is called unconditionally with handle
 *    `dynamo-consent-gate-frontend` and a URL containing `frontend.js`
 */

declare(strict_types=1);

namespace Dynamo\ConsentGate\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

final class RenderTest extends TestCase
{
    /**
     * Records calls to wp_enqueue_script during a render. Reset per-test.
     *
     * @var array<int, array{handle: string, src: string}>
     */
    private array $enqueuedScripts = [];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->enqueuedScripts = [];

        // Capture every wp_enqueue_script call made by render.php so we can
        // assert against handle and URL after the render runs.
        $captured = &$this->enqueuedScripts;
        Functions\when('wp_enqueue_script')->alias(static function (
            string $handle,
            string $src = '',
            array $deps = [],
            $ver = false,
            $in_footer = false
        ) use (&$captured): bool {
            $captured[] = [
                'handle' => $handle,
                'src'    => $src,
                'deps'   => $deps,
                'ver'    => $ver,
                'in_footer' => $in_footer,
            ];
            return true;
        });

        // Default no-op stubs for HTML escapers used in render.php.
        Functions\when('esc_attr')->alias(static fn ($value) => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'));
        Functions\when('esc_html')->alias(static fn ($value) => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'));
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Render render.php with a given attributes/content payload and return
     * the captured output. Mirrors how WordPress invokes a block render
     * template: the file is included with `$attributes` and `$content` in scope.
     */
    private function renderTemplate(array $attributes, string $content = ''): string
    {
        $renderFile = DYNAMO_CONSENT_GATE_PLUGIN_DIR . '/render.php';
        $this->assertFileExists(
            $renderFile,
            'render.php is missing from the plugin root. Move it from blocks/consent-gate/ to the plugin root per the PRD.'
        );

        // Ensure required plugin constants are present so render.php can build the asset URL.
        if (!defined('DYNAMO_CONSENT_GATE_URL')) {
            define('DYNAMO_CONSENT_GATE_URL', 'https://example.test/wp-content/plugins/dynamo-consent-gate/');
        }
        if (!defined('DYNAMO_CONSENT_GATE_VERSION')) {
            define('DYNAMO_CONSENT_GATE_VERSION', '1.0.0-test');
        }

        ob_start();
        // $attributes and $content are referenced inside render.php.
        require $renderFile;
        return (string) ob_get_clean();
    }

    /**
     * AC: render output contains `data-consent-category="analytics"` and
     * `style="display:none"` given attribute `"analytics"`.
     */
    public function test_render_output_contains_consent_category_and_hidden_style_for_analytics(): void
    {
        $output = $this->renderTemplate(
            ['consentCategory' => 'analytics'],
            '<p>Gated content</p>'
        );

        $this->assertStringContainsString(
            'data-consent-category="analytics"',
            $output,
            'Rendered output must stamp data-consent-category from the consentCategory attribute.'
        );

        $this->assertStringContainsString(
            'style="display:none"',
            $output,
            'Rendered wrapper div must include style="display:none" so content is hidden until consent is granted.'
        );
    }

    /**
     * AC: `wp_enqueue_script` is called unconditionally with handle
     * `dynamo-consent-gate-frontend` and a URL containing `frontend.js`.
     */
    public function test_wp_enqueue_script_is_called_with_frontend_handle_and_url(): void
    {
        $this->renderTemplate(
            ['consentCategory' => 'analytics'],
            '<p>Gated content</p>'
        );

        $this->assertNotEmpty(
            $this->enqueuedScripts,
            'render.php must call wp_enqueue_script unconditionally — no script enqueues were captured.'
        );

        $handles = array_column($this->enqueuedScripts, 'handle');
        $this->assertContains(
            'dynamo-consent-gate-frontend',
            $handles,
            'render.php must enqueue a script with the handle `dynamo-consent-gate-frontend`.'
        );

        $matchedSrc = null;
        foreach ($this->enqueuedScripts as $script) {
            if ($script['handle'] === 'dynamo-consent-gate-frontend') {
                $matchedSrc = $script['src'];
                break;
            }
        }

        $this->assertNotNull(
            $matchedSrc,
            'Could not locate the dynamo-consent-gate-frontend enqueue call to inspect its URL.'
        );

        $this->assertStringContainsString(
            'frontend.js',
            (string) $matchedSrc,
            'The enqueued URL for handle `dynamo-consent-gate-frontend` must contain `frontend.js`.'
        );
    }

    /**
     * AC: wp_enqueue_script is called unconditionally.
     *
     * Even when the plugin constants happen to be defined later (or empty
     * attributes are passed in), render.php must still enqueue the frontend
     * script — no guard condition.
     */
    public function test_wp_enqueue_script_is_called_even_with_empty_attributes(): void
    {
        $this->renderTemplate([], '');

        $handles = array_column($this->enqueuedScripts, 'handle');
        $this->assertContains(
            'dynamo-consent-gate-frontend',
            $handles,
            'render.php must enqueue dynamo-consent-gate-frontend unconditionally, even when attributes are empty.'
        );
    }
}
