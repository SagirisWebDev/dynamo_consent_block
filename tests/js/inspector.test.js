/**
 * Tests for Edit component Inspector panel — Issue #4
 * Consent category inspector panel with loading, empty, and populated states
 *
 * Red phase: all tests are written against the INTENDED implementation.
 * The current edit.js does not have an inspector panel, so all tests
 * that assert inspector behaviour will fail until the implementation lands.
 */

import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import Edit from '../../src/edit';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// @wordpress/block-editor
// InspectorControls renders children so PanelBody content is visible in tests.
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
		// Render children so the full inspector tree is visible to tests
		InspectorControls: jest.fn( ( { children } ) => (
			<div data-testid="inspector-controls">{ children }</div>
		) ),
	} ),
	{ virtual: true }
);

// @wordpress/components
// - PanelBody: renders children AND exposes `title` via data-title
// - SelectControl: renders a <div> with data-* attrs for label, disabled, and options
// - Notice: renders a <div> exposing isDismissible via data-dismissible so we can
//   assert the non-dismissible requirement
jest.mock(
	'@wordpress/components',
	() => ( {
		PanelBody: jest.fn( ( { title, children } ) => (
			<div data-testid="panel-body" data-title={ title }>
				{ children }
			</div>
		) ),
		SelectControl: jest.fn( ( { label, disabled, options, onChange, value } ) => (
			<div
				data-testid="select-control"
				data-label={ label }
				data-disabled={ String( disabled ?? false ) }
				data-options={ JSON.stringify( options ?? [] ) }
				data-value={ value ?? '' }
			>
				<select
					disabled={ disabled }
					aria-label={ label }
					value={ value ?? '' }
					onChange={ ( e ) => onChange && onChange( e.target.value ) }
				>
					{ ( options ?? [] ).map( ( opt ) => (
						<option key={ opt.value } value={ opt.value }>
							{ opt.label }
						</option>
					) ) }
				</select>
			</div>
		) ),
		Notice: jest.fn( ( { children, isDismissible } ) => (
			<div
				data-testid="notice"
				data-dismissible={ String( isDismissible ) }
			>
				{ children }
			</div>
		) ),
	} ),
	{ virtual: true }
);

// @wordpress/i18n — __ returns its first argument unchanged
jest.mock(
	'@wordpress/i18n',
	() => ( {
		__: jest.fn( ( str ) => str ),
	} ),
	{ virtual: true }
);

// @wordpress/element — re-export real React hooks so component logic works
jest.mock(
	'@wordpress/element',
	() => ( {
		...jest.requireActual( 'react' ),
		useState: jest.requireActual( 'react' ).useState,
		useEffect: jest.requireActual( 'react' ).useEffect,
	} ),
	{ virtual: true }
);

// @wordpress/api-fetch — factory returns jest.fn() so it is created inside the
// hoisted scope. Use jest.requireMock() to get a reference after mocking.
jest.mock(
	'@wordpress/api-fetch',
	() => jest.fn( () => Promise.resolve( [] ) ),
	{ virtual: true }
);

const apiFetch = jest.requireMock( '@wordpress/api-fetch' );

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render the Edit component and wait for the initial async fetch to settle.
 */
async function renderEdit( consentCategory = '', fetchResult = [] ) {
	apiFetch.mockResolvedValue( fetchResult );

	const setAttributes = jest.fn();
	let container;
	await act( async () => {
		( { container } = render(
			<Edit
				attributes={ { consentCategory } }
				setAttributes={ setAttributes }
			/>
		) );
	} );

	return { container, setAttributes };
}

/**
 * Render and capture the component BEFORE the fetch promise settles,
 * so we can assert the loading state.
 */
function renderEditLoading() {
	// Return a never-resolving promise to keep component in loading state
	apiFetch.mockReturnValue( new Promise( () => {} ) );

	const setAttributes = jest.fn();
	let container;
	act( () => {
		( { container } = render(
			<Edit
				attributes={ { consentCategory: '' } }
				setAttributes={ setAttributes }
			/>
		) );
	} );

	return { container, setAttributes };
}

// ---------------------------------------------------------------------------
// Before each — reset mocks
// ---------------------------------------------------------------------------

beforeEach( () => {
	apiFetch.mockReset();
} );

// ---------------------------------------------------------------------------
// AC1 — PanelBody titled "Consent Settings"
// ---------------------------------------------------------------------------

describe( 'AC1 — PanelBody titled "Consent Settings"', () => {
	test( 'renders a PanelBody with title "Consent Settings"', async () => {
		await renderEdit( '', [] );

		const panel = screen.getByTestId( 'panel-body' );
		expect( panel ).toBeTruthy();
		expect( panel.getAttribute( 'data-title' ) ).toBe( 'Consent Settings' );
	} );
} );

// ---------------------------------------------------------------------------
// AC2 / AC8 — Loading state: disabled SelectControl labelled "Loading categories…"
// ---------------------------------------------------------------------------

describe( 'AC2 / AC8 — Loading state', () => {
	test( 'SelectControl is rendered while loading', () => {
		renderEditLoading();

		const selectControl = screen.getByTestId( 'select-control' );
		expect( selectControl ).toBeTruthy();
	} );

	test( 'SelectControl is disabled while isLoading is true', () => {
		renderEditLoading();

		const selectControl = screen.getByTestId( 'select-control' );
		expect( selectControl.getAttribute( 'data-disabled' ) ).toBe( 'true' );
	} );

	test( 'SelectControl is labelled "Loading categories…" while loading', () => {
		renderEditLoading();

		const selectControl = screen.getByTestId( 'select-control' );
		expect( selectControl.getAttribute( 'data-label' ) ).toBe(
			'Loading categories…'
		);
	} );
} );

// ---------------------------------------------------------------------------
// AC3 / AC9 — Empty fetch: missing-theme Notice is rendered
// ---------------------------------------------------------------------------

describe( 'AC3 / AC9 — Empty fetch resolves to missing-theme Notice', () => {
	test( 'renders a Notice when fetch resolves to an empty array', async () => {
		await renderEdit( '', [] );

		const notices = screen.getAllByTestId( 'notice' );
		expect( notices.length ).toBeGreaterThanOrEqual( 1 );
	} );

	test( 'missing-theme Notice contains relevant message text', async () => {
		await renderEdit( '', [] );

		// The notice should mention something about the missing theme/categories
		const noticeTexts = screen
			.getAllByTestId( 'notice' )
			.map( ( n ) => n.textContent );

		const hasMissingThemeMessage = noticeTexts.some(
			( text ) =>
				text.toLowerCase().includes( 'theme' ) ||
				text.toLowerCase().includes( 'no categories' ) ||
				text.toLowerCase().includes( 'no consent' ) ||
				text.toLowerCase().includes( 'plugin' ) ||
				text.toLowerCase().includes( 'complianz' )
		);
		expect( hasMissingThemeMessage ).toBe( true );
	} );

	test( 'missing-theme Notice is non-dismissible (isDismissible={false})', async () => {
		await renderEdit( '', [] );

		const notices = screen.getAllByTestId( 'notice' );

		// At least one notice must have isDismissible=false
		const hasNonDismissible = notices.some(
			( n ) => n.getAttribute( 'data-dismissible' ) === 'false'
		);
		expect( hasNonDismissible ).toBe( true );
	} );

	test( 'SelectControl is NOT rendered when categories are empty', async () => {
		await renderEdit( '', [] );

		// After an empty fetch, the component should show the notice instead of a SelectControl
		// (or at least not show an enabled SelectControl with options)
		const selectControls = screen.queryAllByTestId( 'select-control' );
		const hasEnabledSelect = selectControls.some(
			( s ) => s.getAttribute( 'data-disabled' ) !== 'true'
		);
		expect( hasEnabledSelect ).toBe( false );
	} );
} );

// ---------------------------------------------------------------------------
// AC4 / AC10 — Non-empty fetch: SelectControl with options
// ---------------------------------------------------------------------------

describe( 'AC4 / AC10 — Non-empty fetch renders SelectControl with options', () => {
	const mockCategories = [
		{ value: 'statistics', label: 'Statistics' },
		{ value: 'marketing', label: 'Marketing' },
		{ value: 'functional', label: 'Functional' },
	];

	test( 'renders a SelectControl when fetch resolves with categories', async () => {
		await renderEdit( '', mockCategories );

		const selectControl = screen.getByTestId( 'select-control' );
		expect( selectControl ).toBeTruthy();
	} );

	test( 'SelectControl is labelled "Required Consent Category"', async () => {
		await renderEdit( '', mockCategories );

		const selectControl = screen.getByTestId( 'select-control' );
		expect( selectControl.getAttribute( 'data-label' ) ).toBe(
			'Required Consent Category'
		);
	} );

	test( 'SelectControl is not disabled when categories are loaded', async () => {
		await renderEdit( '', mockCategories );

		const selectControl = screen.getByTestId( 'select-control' );
		expect( selectControl.getAttribute( 'data-disabled' ) ).toBe( 'false' );
	} );

	test( 'SelectControl options include the fetched categories', async () => {
		await renderEdit( '', mockCategories );

		const selectControl = screen.getByTestId( 'select-control' );
		const options = JSON.parse( selectControl.getAttribute( 'data-options' ) );

		expect( options.length ).toBeGreaterThanOrEqual( mockCategories.length );

		const values = options.map( ( o ) => o.value );
		expect( values ).toContain( 'statistics' );
		expect( values ).toContain( 'marketing' );
		expect( values ).toContain( 'functional' );
	} );
} );

// ---------------------------------------------------------------------------
// AC5 — Selecting a category updates consentCategory attribute
// ---------------------------------------------------------------------------

describe( 'AC5 — Selecting a category updates consentCategory attribute', () => {
	const mockCategories = [
		{ value: 'statistics', label: 'Statistics' },
		{ value: 'marketing', label: 'Marketing' },
	];

	test( 'calls setAttributes with the selected category value', async () => {
		const { setAttributes } = await renderEdit( '', mockCategories );

		const select = screen.getByRole( 'combobox', {
			name: 'Required Consent Category',
		} );

		await act( async () => {
			fireEvent.change( select, { target: { value: 'marketing' } } );
		} );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( { consentCategory: 'marketing' } )
		);
	} );
} );

// ---------------------------------------------------------------------------
// AC6 / AC11 — Security warning Notice is always present in all states
// ---------------------------------------------------------------------------

describe( 'AC6 / AC11 — Security warning Notice is always present', () => {
	test( 'security warning Notice is present in loading state', () => {
		renderEditLoading();

		const notices = screen.getAllByTestId( 'notice' );
		const hasSecurityWarning = notices.some( ( n ) => {
			const text = n.textContent.toLowerCase();
			return (
				text.includes( 'security' ) ||
				text.includes( 'server' ) ||
				text.includes( 'enforce' ) ||
				text.includes( 'server-side' )
			);
		} );
		expect( hasSecurityWarning ).toBe( true );
	} );

	test( 'security warning Notice is present when fetch resolves to empty array', async () => {
		await renderEdit( '', [] );

		const notices = screen.getAllByTestId( 'notice' );
		const hasSecurityWarning = notices.some( ( n ) => {
			const text = n.textContent.toLowerCase();
			return (
				text.includes( 'security' ) ||
				text.includes( 'server' ) ||
				text.includes( 'enforce' ) ||
				text.includes( 'server-side' )
			);
		} );
		expect( hasSecurityWarning ).toBe( true );
	} );

	test( 'security warning Notice is present when categories are loaded', async () => {
		const mockCategories = [
			{ value: 'marketing', label: 'Marketing' },
		];
		await renderEdit( '', mockCategories );

		const notices = screen.getAllByTestId( 'notice' );
		const hasSecurityWarning = notices.some( ( n ) => {
			const text = n.textContent.toLowerCase();
			return (
				text.includes( 'security' ) ||
				text.includes( 'server' ) ||
				text.includes( 'enforce' ) ||
				text.includes( 'server-side' )
			);
		} );
		expect( hasSecurityWarning ).toBe( true );
	} );

	test( 'security warning Notice is non-dismissible in all states', async () => {
		const mockCategories = [ { value: 'marketing', label: 'Marketing' } ];
		await renderEdit( '', mockCategories );

		const notices = screen.getAllByTestId( 'notice' );
		// Security warning should be non-dismissible
		const hasNonDismissibleNotice = notices.some(
			( n ) => n.getAttribute( 'data-dismissible' ) === 'false'
		);
		expect( hasNonDismissibleNotice ).toBe( true );
	} );
} );

// ---------------------------------------------------------------------------
// AC7 — REST endpoint unavailable: empty-state Notice, gated content hidden
// ---------------------------------------------------------------------------

describe( 'AC7 — REST endpoint unavailable (network error / 404)', () => {
	test( 'renders the missing-theme Notice when fetch rejects with a network error', async () => {
		apiFetch.mockRejectedValue( new Error( 'Network Error' ) );

		const setAttributes = jest.fn();
		await act( async () => {
			render(
				<Edit
					attributes={ { consentCategory: '' } }
					setAttributes={ setAttributes }
				/>
			);
		} );

		const notices = screen.getAllByTestId( 'notice' );
		const hasMissingThemeMessage = notices.some( ( n ) => {
			const text = n.textContent.toLowerCase();
			return (
				text.includes( 'theme' ) ||
				text.includes( 'no categories' ) ||
				text.includes( 'no consent' ) ||
				text.includes( 'plugin' ) ||
				text.includes( 'complianz' ) ||
				text.includes( 'unavailable' ) ||
				text.includes( 'error' )
			);
		} );
		expect( hasMissingThemeMessage ).toBe( true );
	} );

	test( 'renders the missing-theme Notice when fetch rejects with a 404', async () => {
		apiFetch.mockRejectedValue( { code: 'rest_no_route', status: 404 } );

		const setAttributes = jest.fn();
		await act( async () => {
			render(
				<Edit
					attributes={ { consentCategory: '' } }
					setAttributes={ setAttributes }
				/>
			);
		} );

		const notices = screen.getAllByTestId( 'notice' );
		expect( notices.length ).toBeGreaterThanOrEqual( 1 );
	} );

	test( 'no enabled SelectControl with options when endpoint is unavailable', async () => {
		apiFetch.mockRejectedValue( new Error( 'Network Error' ) );

		const setAttributes = jest.fn();
		await act( async () => {
			render(
				<Edit
					attributes={ { consentCategory: '' } }
					setAttributes={ setAttributes }
				/>
			);
		} );

		const selectControls = screen.queryAllByTestId( 'select-control' );
		const hasEnabledSelectWithOptions = selectControls.some( ( s ) => {
			if ( s.getAttribute( 'data-disabled' ) === 'true' ) return false;
			const options = JSON.parse( s.getAttribute( 'data-options' ) ?? '[]' );
			return options.length > 0;
		} );
		expect( hasEnabledSelectWithOptions ).toBe( false );
	} );
} );
