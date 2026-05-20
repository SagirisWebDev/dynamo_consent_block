<?php
declare(strict_types=1);

function dynamo_consent_gate_admin_notice(): void {
    if (!current_user_can('manage_options')) {
        return;
    }

    if (wp_get_theme()->get_stylesheet() === 'dynamo') {
        return;
    }

    echo '<div class="notice notice-warning is-dismissible"><p>Dynamo Consent Gate requires the Dynamo theme to be active. The block category dropdown will not populate without it.</p></div>';
}
