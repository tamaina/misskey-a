/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it } from 'vitest';
import { eligibleOAuthPermissions, selectedOAuthScopes, parsePermissionCustomization } from '../../backend/oauth/scope-selection.js';

it('starts from no grant and validates the exact selected known permissions', () => {
	const eligible = eligibleOAuthPermissions(undefined, false);
	expect(eligible).not.toContain('access:mcp');
	expect(eligible.some(p => p.startsWith('write:admin'))).toBe(false);
	expect(() => selectedOAuthScopes([], undefined, eligible)).toThrow();
	expect(() => selectedOAuthScopes([], 'unknown', eligible)).toThrow();
	expect(selectedOAuthScopes([], 'read:account read:account', eligible)).toEqual(['read:account']);
	expect(selectedOAuthScopes(['read:account'], undefined, eligible)).toEqual(['read:account']);
	expect(() => selectedOAuthScopes(['read:account'], 'write:notes', eligible)).toThrow();
	expect(eligibleOAuthPermissions('https://instance.invalid/mcp', false)).toContain('access:mcp');
});

it('accepts only eligible optional additions in the server-authorized MCP mode', () => {
	const eligible = eligibleOAuthPermissions('https://instance.invalid/mcp', false);
	expect(selectedOAuthScopes(['access:mcp'], undefined, eligible, true)).toEqual(['access:mcp']);
	expect(selectedOAuthScopes(['access:mcp'], '', eligible, true)).toEqual(['access:mcp']);
	expect(selectedOAuthScopes(['access:mcp', 'read:account'], 'write:notes write:notes', eligible, true)).toEqual(['access:mcp', 'read:account', 'write:notes']);
	for (const selection of ['access:mcp', 'read:account', 'bogus', 'write:admin:meta', ['write:notes']]) {
		expect(() => selectedOAuthScopes(['access:mcp', 'read:account'], selection, eligible, true)).toThrow();
	}
	expect(() => selectedOAuthScopes(['access:mcp', 'write:admin:meta'], '', eligible, true)).toThrow();
});

it('parses only strict authorization extension values, treating empty as omitted', () => {
	for (const value of [undefined, '', 'false']) expect(parsePermissionCustomization(value)).toBe(false);
	expect(parsePermissionCustomization('true')).toBe(true);
	for (const value of ['1', 'TRUE', ' true ', true, ['true'], ['true', 'false']]) expect(() => parsePermissionCustomization(value)).toThrow();
});
