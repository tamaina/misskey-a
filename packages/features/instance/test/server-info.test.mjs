/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServerInfo } from '../../../backend/built/features/instance/backend.js';

import { genPilotOpenapiSpec } from '../../../backend/built/features/api/pilot.js';

const metrics = { machine: 'fixture', cpu: { model: 'fixture-cpu', cores: 4 }, mem: { total: 1024 }, fs: { total: 512, used: 64 } };
const hidden = { machine: '?', cpu: { model: '?', cores: 0 }, mem: { total: 0 }, fs: { total: 0, used: 0 } };

test('disabled machine statistics never call the reader', async () => {
	const endpoint = createServerInfo({ enabled: () => false, read: () => { throw new Error('Must not read'); } });
	assert.deepEqual(await endpoint({}), hidden);
});

test('settings are checked on every call, not captured when creating the service', async () => {
	let enabled = true;
	let reads = 0;
	const endpoint = createServerInfo({ enabled: () => enabled, read: async () => { reads++; return metrics; } });
	assert.deepEqual(await endpoint({}), metrics);
	enabled = false;
	assert.deepEqual(await endpoint({ extra: true }), hidden);
	assert.equal(reads, 1);
});

test('invalid input is rejected before querying settings or metrics', async () => {
	const endpoint = createServerInfo({ enabled: () => { throw new Error('Must not call settings'); }, read: async () => metrics });
	for (const input of [null, [], 'invalid', 1]) await assert.rejects(endpoint(input), error => !String(error).includes('Must not call settings'));
});

test('reader failures and malformed output are not silently replaced with hidden statistics', async () => {
	await assert.rejects(createServerInfo({ enabled: () => true, read: async () => { throw new Error('Probe failed'); } })({}));
	await assert.rejects(createServerInfo({ enabled: () => true, read: async () => ({ ...metrics, cpu: { model: 'fixture', cores: 'invalid' } }) })({}));
});

test('official external documentation retains the complete response shape', async () => {
	const spec = await genPilotOpenapiSpec({ version: 'test', apiUrl: '/api' });
	const output = spec.paths['/server-info'].post.responses['200'].content['application/json'].schema;
	assert.deepEqual(output.required, ['machine', 'cpu', 'mem', 'fs']);
	assert.equal(output.properties.cpu.properties.cores.type, 'number');
});
