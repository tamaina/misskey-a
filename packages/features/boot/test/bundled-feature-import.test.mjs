/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('bundled native feature entry points initialize decorator metadata in a fresh process', () => {
	for (const feature of ['statistics', 'preferences']) {
		const url = new URL(`../../../backend/built/features/${feature}/backend.js`, import.meta.url).href;
		const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `
			import assert from 'node:assert/strict';
			assert.equal(Reflect.getOwnMetadata, undefined);
			await import(${JSON.stringify(url)});
			assert.equal(typeof Reflect.getOwnMetadata, 'function');
		`], { encoding: 'utf8', timeout: 10_000 });
		assert.equal(result.error, undefined);
		assert.equal(result.status, 0, `${feature}: ${result.stderr.slice(-2000)}`);
	}
});
