/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { portabilityInputs, portabilityContract, portabilityImportInputs } from '../../contract/index.js';
import { createPortability } from '../../backend/index.js';
import type { PortabilityDependencies } from '../../backend/index.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { defineEndpointContract } from '@features/api/contract/definition.js';

const input = portabilityInputs['i/export-following'];
const importInput = portabilityImportInputs['i/import-following'];

test('portability native input fields are finite and export defaults are explicit', () => {
	expect(v.parse(input, { future: true })).toEqual({ excludeMuting: false, excludeInactive: false });
	expect(v.parse(importInput, { fileId: 'file123', future: true })).toEqual({ fileId: 'file123' });
	for (const value of [{}, { fileId: 7 }, { fileId: 'bad-id' }, { fileId: 'file123', withReplies: 'bad' }]) expect(v.safeParse(importInput, value).success).toBe(false);
	expect(v.safeParse(input, { excludeInactive: 7 }).success).toBe(false);
	const output = portabilityContract['i/export-following']['~orpc'].outputSchema!;
	expect(v.parse(output, undefined)).toBeUndefined();
	for (const value of [{}, null, 7]) expect(v.safeParse(output, value).success).toBe(false);
});

test('actual following export producer supplies defaults and returns void', async () => {
	const deps = mockDeep<PortabilityDependencies>();
	const feature = createPortability(deps);
	expect(await feature['i/export-following']({}, { context: { actor: { id: 'user123' } } })).toBeUndefined();
	expect(deps.createExportFollowingJob).toHaveBeenCalledWith({ id: 'user123' }, false, false);
});

test('HTTP preserves extra keys, AJV defaults and the void response', async () => {
	const definition = defineEndpointContract({ method: 'POST', path: '/i/export-following' }, input, v.void());
	const request = { i: 'token', future: true };
	const endpoint = new ContractEndpoint({}, projectEndpointContract(definition), async ps => { expect(ps).toBe(request); });
	expect(await endpoint.exec(request, null, null)).toBeUndefined();
	expect(request).toEqual({ i: 'token', future: true, excludeMuting: false, excludeInactive: false });
	await expect(endpoint.exec({ excludeMuting: 'bad' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
});

test('seven empty exports retain their non-array JSON-object guards and missing-body defaults', () => {
	for (const key of ['i/export-antennas', 'i/export-blocking', 'i/export-clips', 'i/export-favorites', 'i/export-mute', 'i/export-notes', 'i/export-user-lists'] as const) {
		const schema = portabilityContract[key]['~orpc'].inputSchema!;
		expect(v.parse(schema, undefined)).toEqual({});
		const request = { future: true };
		expect(v.parse(schema, request)).toBe(request);
		for (const value of [[], [1], null, 7, 'bad']) expect(v.safeParse(schema, value).success).toBe(false);
		expect(v.safeParse(portabilityInputs[key], undefined).success).toBe(false);
	}
});
