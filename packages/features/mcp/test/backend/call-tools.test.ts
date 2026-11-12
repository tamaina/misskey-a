/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it } from 'vitest';
import { callToolDefinition, callToolKinds, callToolName } from '../../backend/call-tools.js';

it('derives stable valid names and rejects future aliases or invalid MCP names', () => {
	expect(callToolName(null)).toBe('call_api_general');
	expect(callToolName('write:notes')).toBe('call_api_write_notes');
	expect(callToolName('read:account')).toBe('call_api_read_account');
	expect(callToolName('write:admin:abuse-user-reports')).toBe('call_api_write_admin_abuse_user_reports');
	expect([...callToolKinds([null, 'write:notes', 'write:notes'])]).toEqual([['call_api_general', null], ['call_api_write_notes', 'write:notes']]);
	expect(() => callToolKinds(['write:a-b', 'write:a:b'])).toThrow();
	expect(() => callToolKinds([null, 'general'])).toThrow();
	expect(() => callToolKinds(['read:invalid/name'])).toThrow();
	expect(() => callToolKinds(['read:' + 'a'.repeat(128)])).toThrow();
});

it('advertises native scopes, read hints, and conservative write/general hints', () => {
	expect(callToolDefinition('read:account')).toMatchObject({
		securitySchemes: [{ type: 'oauth2', scopes: ['access:mcp', 'read:account'] }],
		annotations: { readOnlyHint: true, destructiveHint: false },
	});
	for (const kind of [null, 'write:notes']) expect(callToolDefinition(kind).annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true, idempotentHint: false });
});
