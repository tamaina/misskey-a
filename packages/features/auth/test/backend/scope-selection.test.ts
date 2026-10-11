/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it } from 'vitest';
import { eligibleOAuthPermissions, selectedOAuthScopes } from '../../backend/oauth/scope-selection.js';

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
