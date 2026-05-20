<?php
declare(strict_types=1);

wp_enqueue_script(
    'dynamo-consent-gate-frontend',
    DYNAMO_CONSENT_GATE_URL . 'frontend.js',
    [],
    DYNAMO_CONSENT_GATE_VERSION,
    true
);

$category = esc_attr($attributes['consentCategory'] ?? '');
?>
<div class="dynamo-consent-gate" style="display:none" data-consent-category="<?php echo $category; ?>">
    <?php echo $content; ?>
</div>
