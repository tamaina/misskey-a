/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { rolldown } from 'rolldown';

// Type checking alone cannot detect selecting the package's CJS main in an ESM bundle.
test('host and feature ms imports retain the callable ESM default in compiled output', async () => {
	const backend = fileURLToPath(new URL('../../', import.meta.url));
	const entry = join(backend, 'scripts/virtual-ms-resolution.mjs');
	const directory = await mkdtemp(join(tmpdir(), 'misskey-ms-resolution-'));
	let bundle;
	try {
		bundle = await rolldown({
			input: entry,
			tsconfig: join(backend, 'tsconfig.json'),
			platform: 'node',
			plugins: [{
				name: 'ms-resolution-fixture',
				resolveId(id) { return id === entry ? entry : undefined; },
				load(id) {
					if (id !== entry) return undefined;
					return "export { default as directMs } from 'ms'; export { default as featureMs } from '../src/runtime-dependencies/ms.js';";
				},
			}],
		});
		const output = join(directory, 'probe.mjs');
		await bundle.write({ file: output, format: 'esm' });
		const { directMs, featureMs } = await import(pathToFileURL(output).href);
		assert.equal(typeof directMs, 'function');
		assert.equal(featureMs, directMs);
		assert.equal(directMs('30 days'), 2_592_000_000);
		assert.equal(featureMs('1 hour'), 3_600_000);
	} finally {
		await bundle?.close();
		await rm(directory, { recursive: true, force: true });
	}
});
