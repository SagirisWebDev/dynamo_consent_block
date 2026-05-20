/**
 * Tests for Edit component — Issue #3
 * Block editor visual canvas: border, label, and InnerBlocks
 *
 * Red phase: all tests are written against the INTENDED implementation.
 * The current edit.js does not implement border/label UI, so all tests
 * that assert those features will fail until the implementation lands.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Edit from '../../src/edit';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
// Several @wordpress/* packages are not installed in node_modules — they are
// provided as globals by WordPress at runtime. We mock them as virtual modules
// so Jest can resolve the imports without needing the real packages installed.

// Mock @wordpress/block-editor
// - useBlockProps returns a plain object (no wp-specific attrs needed for these tests)
// - InnerBlocks is rendered as a <div data-testid="inner-blocks"> so we can
//   inspect the props passed to it via data attributes
jest.mock(
	'@wordpress/block-editor',
	() => ( {
		useBlockProps: jest.fn( () => ( {} ) ),
		InnerBlocks: jest.fn( ( props ) => (
			<div
				data-testid="inner-blocks"
				data-allowed-blocks={ JSON.stringify( props.allowedBlocks ?? null ) }
				data-placeholder={ props.placeholder ?? '' }
			/>
		) ),
		InspectorControls: jest.fn( ( { children } ) => <div>{ children }</div> ),
	} ),
	{ virtual: true }
);

// Mock @wordpress/components (not needed for these tests — suppress import errors)
jest.mock(
	'@wordpress/components',
	() => ( {
		PanelBody: jest.fn( ( { children } ) => <div>{ children }</div> ),
		SelectControl: jest.fn( () => null ),
		Notice: jest.fn( () => null ),
	} ),
	{ virtual: true }
);

// Mock @wordpress/i18n — __ returns its first argument unchanged
jest.mock(
	'@wordpress/i18n',
	() => ( {
		__: jest.fn( ( str ) => str ),
	} ),
	{ virtual: true }
);

// Mock @wordpress/element — re-export real React hooks so component logic works
jest.mock(
	'@wordpress/element',
	() => ( {
		...jest.requireActual( 'react' ),
		useState: jest.requireActual( 'react' ).useState,
		useEffect: jest.requireActual( 'react' ).useEffect,
	} ),
	{ virtual: true }
);

// Mock @wordpress/api-fetch — resolves with empty array by default
jest.mock(
	'@wordpress/api-fetch',
	() => jest.fn( () => Promise.resolve( [] ) ),
	{ virtual: true }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render the Edit component with given consentCategory attribute.
 */
async function renderEdit( consentCategory = '' ) {
	const setAttributes = jest.fn();
	let rerender, container;
	await act( async () => {
		( { rerender, container } = render(
			<Edit
				attributes={ { consentCategory } }
				setAttributes={ setAttributes }
			/>
		) );
	} );

	/**
	 * Re-render with a new consentCategory value (simulates attribute change).
	 */
	async function changeCategory( newCategory ) {
		await act( async () => {
			rerender(
				<Edit
					attributes={ { consentCategory: newCategory } }
					setAttributes={ setAttributes }
				/>
			);
		} );
	}

	// The component now returns a Fragment — the styled canvas div is the last child.
	const wrapper = container.querySelector( '[style]' );

	return { container, wrapper, setAttributes, changeCategory };
}

// ---------------------------------------------------------------------------
// AC1 / AC6 — Amber border and "No category selected" label when empty
// ---------------------------------------------------------------------------

describe( 'AC1 / AC6 — empty consentCategory', () => {
	test( 'wrapper has a 2px solid amber (#dba617) border', async () => {
		const { wrapper } = await renderEdit( '' );

		expect( wrapper.style.border ).toBe( '2px solid #dba617' );
	} );

	test( 'wrapper has 4px border-radius', async () => {
		const { wrapper } = await renderEdit( '' );

		expect( wrapper.style.borderRadius ).toBe( '4px' );
	} );

	test( 'wrapper has 16px padding', async () => {
		const { wrapper } = await renderEdit( '' );

		expect( wrapper.style.padding ).toBe( '16px' );
	} );

	test( 'label reads "Consent Gate: No category selected"', async () => {
		await renderEdit( '' );

		expect(
			screen.getByText( 'Consent Gate: No category selected' )
		).toBeTruthy();
	} );

	test( 'no background fill (background or backgroundColor is absent / empty)', async () => {
		const { wrapper } = await renderEdit( '' );

		// background and backgroundColor must not be set to any solid colour
		const bg = wrapper.style.background || wrapper.style.backgroundColor;
		expect( bg ).toBeFalsy();
	} );
} );

// ---------------------------------------------------------------------------
// AC2 / AC7 — Grey border and category name in label when category is set
// ---------------------------------------------------------------------------

describe( 'AC2 / AC7 — consentCategory set', () => {
	test( 'wrapper has a 2px solid grey (#8c8f94) border', async () => {
		const { wrapper } = await renderEdit( 'marketing' );

		expect( wrapper.style.border ).toBe( '2px solid #8c8f94' );
	} );

	test( 'label contains the category value', async () => {
		await renderEdit( 'marketing' );

		expect( screen.getByText( 'Consent Gate: marketing' ) ).toBeTruthy();
	} );

	test( 'label format is "Consent Gate: {category}"', async () => {
		await renderEdit( 'analytics' );

		expect( screen.getByText( 'Consent Gate: analytics' ) ).toBeTruthy();
	} );
} );

// ---------------------------------------------------------------------------
// AC3 / AC8 — InnerBlocks allowedBlocks excludes dynamo/consent-gate
// ---------------------------------------------------------------------------

describe( 'AC3 / AC8 — InnerBlocks allowedBlocks', () => {
	test( 'InnerBlocks receives an allowedBlocks prop', async () => {
		await renderEdit( '' );
		const innerBlocks = screen.getByTestId( 'inner-blocks' );
		const raw = innerBlocks.getAttribute( 'data-allowed-blocks' );

		// Must be a non-null JSON array
		expect( raw ).not.toBe( 'null' );
		const parsed = JSON.parse( raw );
		expect( Array.isArray( parsed ) ).toBe( true );
	} );

	test( 'allowedBlocks does NOT include "dynamo/consent-gate"', async () => {
		await renderEdit( '' );
		const innerBlocks = screen.getByTestId( 'inner-blocks' );
		const parsed = JSON.parse(
			innerBlocks.getAttribute( 'data-allowed-blocks' )
		);

		expect( parsed ).not.toContain( 'dynamo/consent-gate' );
	} );
} );

// ---------------------------------------------------------------------------
// AC4 — InnerBlocks placeholder prop
// ---------------------------------------------------------------------------

describe( 'AC4 — InnerBlocks placeholder', () => {
	test( 'InnerBlocks receives placeholder "Add consent-gated content"', async () => {
		await renderEdit( '' );
		const innerBlocks = screen.getByTestId( 'inner-blocks' );

		expect( innerBlocks.getAttribute( 'data-placeholder' ) ).toBe(
			'Add consent-gated content'
		);
	} );
} );

// ---------------------------------------------------------------------------
// AC5 — Border and label update reactively when consentCategory changes
// ---------------------------------------------------------------------------

describe( 'AC5 — Reactive updates when consentCategory attribute changes', () => {
	test( 'switches from amber to grey border when category is set', async () => {
		const { wrapper, changeCategory } = await renderEdit( '' );

		// Initial state: amber
		expect( wrapper.style.border ).toBe( '2px solid #dba617' );

		// Change attribute
		await changeCategory( 'functional' );

		// After change: grey
		expect( wrapper.style.border ).toBe( '2px solid #8c8f94' );
	} );

	test( 'updates label from "No category selected" to the category name', async () => {
		const { changeCategory } = await renderEdit( '' );

		expect(
			screen.getByText( 'Consent Gate: No category selected' )
		).toBeTruthy();

		await changeCategory( 'functional' );

		expect( screen.getByText( 'Consent Gate: functional' ) ).toBeTruthy();
		expect(
			screen.queryByText( 'Consent Gate: No category selected' )
		).toBeNull();
	} );

	test( 'switches from grey back to amber border when category is cleared', async () => {
		const { wrapper, changeCategory } = await renderEdit( 'marketing' );

		// Initial state: grey (category set)
		expect( wrapper.style.border ).toBe( '2px solid #8c8f94' );

		// Clear attribute
		await changeCategory( '' );

		// After clearing: amber
		expect( wrapper.style.border ).toBe( '2px solid #dba617' );
	} );
} );
