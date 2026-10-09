/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { portabilityApiContract } from '../../backend/api.contract.js';
import { iExportFollowingContract } from '../../backend/endpoints/i/export-following.contract.js';
import { iImportFollowingContract } from '../../backend/endpoints/i/import-following.contract.js';

test('native portability inputs retain finite fields, defaults and optional flags', () => {
	expect(v.parse(iExportFollowingContract['~orpc'].inputSchema!, { future: true })).toEqual({ excludeMuting: false, excludeInactive: false });
	expect(v.parse(iImportFollowingContract['~orpc'].inputSchema!, { fileId: 'file123', future: true })).toEqual({ fileId: 'file123' });
	for (const value of [{}, { fileId: 7 }, { fileId: 'bad-id' }, { fileId: 'file123', withReplies: 'bad' }]) expect(v.safeParse(iImportFollowingContract['~orpc'].inputSchema!, value).success).toBe(false);
	expect(v.safeParse(iExportFollowingContract['~orpc'].inputSchema!, { excludeInactive: 7 }).success).toBe(false);
	expect(v.parse(iExportFollowingContract['~orpc'].inputSchema!, undefined)).toEqual({ excludeMuting: false, excludeInactive: false });
});

test('empty native exports accept a missing body and reject non-object bodies', () => {
	for (const name of ['i/export-antennas', 'i/export-blocking', 'i/export-clips', 'i/export-favorites', 'i/export-mute', 'i/export-notes', 'i/export-user-lists'] as const) {
		const schema = portabilityApiContract[name]['~orpc'].inputSchema;
		if (schema === undefined) throw new Error('Missing native export input schema');
		expect(v.parse(schema, undefined)).toEqual({});
		expect(v.parse(schema, { future: true })).toEqual({});
		for (const value of [[], [1], null, 7, 'bad']) expect(v.safeParse(schema, value).success).toBe(false);
	}
});
