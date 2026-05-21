<?php
declare(strict_types=1);

wp_enqueue_script(
    'dynamo-consent-gate-frontend',
    DYNAMO_CONSENT_GATE_URL . 'frontend.js',
    [],
    DYNAMO_CONSENT_GATE_VERSION,
    true
);

$category = strtolower(esc_attr($attributes['consentCategory'] ?? ''));

if ($category === '') {
    echo $content;
    return;
}
?>
<div class="dynamo-consent-gate" style="display:none" data-consent-category="<?php echo $category; ?>">
    <?php echo $content; ?>
</div>
