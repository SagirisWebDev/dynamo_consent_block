import { useState, useEffect } from '@wordpress/element';
import { useBlockProps, InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Notice } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
    const { consentCategory = '' } = attributes;
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        apiFetch({ path: '/dynamo/v1/cookie-categories' })
            .then((data) => setCategories(data))
            .catch(() => setCategories([]));
    }, []);

    const options = [
        { label: __('— Select a category —', 'dynamo'), value: '' },
        ...categories.map((cat) => ({ label: cat.label, value: cat.slug })),
    ];

    return (
        <div { ...useBlockProps() }>
            <InspectorControls>
                <PanelBody title={ __('Consent Settings', 'dynamo') }>
                    <Notice status="warning" isDismissible={ false }>
                        { __('This block hides content visually. Do not use it to protect sensitive data — hidden content is still present in the page source.', 'dynamo') }
                    </Notice>
                    <SelectControl
                        label={ __('Required Consent Category', 'dynamo') }
                        value={ consentCategory }
                        options={ options }
                        onChange={ (value) => setAttributes({ consentCategory: value }) }
                    />
                </PanelBody>
            </InspectorControls>
            <InnerBlocks />
        </div>
    );
}
