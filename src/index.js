import { registerBlockType } from '@wordpress/blocks';
import { shield } from '@wordpress/icons';
import Edit from './edit';
import Save from './save';

registerBlockType('dynamo/consent-gate', {
    icon: shield,
    edit: Edit,
    save: Save,
});
