import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
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

export default function Edit( { attributes } ) {
	const { consentCategory = '' } = attributes;

	const borderColor = consentCategory ? '#8c8f94' : '#dba617';
	const label = consentCategory
		? `Consent Gate: ${ consentCategory }`
		: __( 'Consent Gate: No category selected', 'dynamo' );

	return (
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
	);
}
