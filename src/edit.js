import { useBlockProps, InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Notice } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

const ALLOWED_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/image',
	'core/list',
	'core/list-item',
	'core/quote',
	'core/pullquote',
	'core/code',
	'core/preformatted',
	'core/html',
	'core/table',
	'core/video',
	'core/audio',
	'core/gallery',
	'core/cover',
	'core/buttons',
	'core/button',
	'core/group',
	'core/columns',
	'core/column',
	'core/separator',
	'core/spacer',
	'core/embed',
	'core/shortcode',
];

export default function Edit( { attributes, setAttributes } ) {
	const { consentCategory = '' } = attributes;

	const [ isLoading, setIsLoading ] = useState( true );
	const [ categories, setCategories ] = useState( [] );

	useEffect( () => {
		apiFetch( { path: '/dynamo/v1/cookie-categories' } )
			.then( ( result ) => {
				setCategories( result );
				setIsLoading( false );
			} )
			.catch( () => {
				setCategories( [] );
				setIsLoading( false );
			} );
	}, [] );

	const borderColor = consentCategory ? '#8c8f94' : '#dba617';
	const label = consentCategory
		? `Consent Gate: ${ consentCategory }`
		: __( 'Consent Gate: No category selected', 'dynamo' );

	let categoryControl;
	if ( isLoading ) {
		categoryControl = (
			<SelectControl
				label={ __( 'Loading categories…', 'dynamo' ) }
				disabled={ true }
				options={ [] }
			/>
		);
	} else if ( categories.length === 0 ) {
		categoryControl = (
			<Notice isDismissible={ false }>
				{ __(
					'No consent categories found. Make sure the Dynamo theme is active and a supported cookie plugin (Complianz or Borlabs Cookie) is installed.',
					'dynamo'
				) }
			</Notice>
		);
	} else {
		categoryControl = (
			<SelectControl
				label={ __( 'Required Consent Category', 'dynamo' ) }
				value={ consentCategory }
				options={ categories }
				onChange={ ( value ) =>
					setAttributes( { consentCategory: value } )
				}
				disabled={ false }
			/>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Consent Settings', 'dynamo' ) }>
					{ categoryControl }
					<Notice isDismissible={ false }>
						{ __(
							'Security warning: This block hides content visually. Do not use it to protect sensitive data — hidden content is still present in the page source.',
							'dynamo'
						) }
					</Notice>
				</PanelBody>
			</InspectorControls>
			<div
				{ ...useBlockProps() }
				style={ {
					border: `2px solid ${ borderColor }`,
					borderRadius: '4px',
					padding: '16px',
				} }
			>
				<div>{ label }</div>
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					placeholder={ __( 'Add consent-gated content', 'dynamo' ) }
				/>
			</div>
		</>
	);
}
