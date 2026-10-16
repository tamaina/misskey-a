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
import configFactory from '../../rolldown.config.ts';

// A successful build can silently erase a dynamic import by selecting a declaration file.
for (const mode of ['production', 'e2e']) {
	test(`${mode} build resolves declaration aliases to callable runtime exports`, async () => {
		const backend = fileURLToPath(new URL('../../', import.meta.url));
		const entry = join(backend, 'scripts/virtual-declaration-dependencies.ts');
		const directory = await mkdtemp(join(tmpdir(), 'misskey-declaration-dependencies-'));
		let bundle;
		try {
			const { output, ...input } = await configFactory(mode === 'e2e' ? { e2e: true } : {});
			delete input.watch;
			bundle = await rolldown({
				...input,
				input: entry,
				tsconfig: join(backend, mode === 'e2e' ? 'test-server/tsconfig.json' : 'tsconfig.json'),
				external: [],
				plugins: [...input.plugins, {
					name: 'declaration-dependencies-fixture',
					resolveId(id) { return id === entry ? entry : undefined; },
					load(id) {
						if (id !== entry) return undefined;
						return "import { verifyChallenge } from 'pkce-challenge'; import { oc } from '@orpc/contract'; import { WebSocket } from 'ws'; import Limiter from 'ratelimiter'; import Link from 'http-link-header'; import * as nestedProperty from 'nested-property'; export async function probe() { return [typeof verifyChallenge, typeof (await import('deep-email-validator')).validate, typeof oc, typeof WebSocket, typeof Limiter, Link.parse('<https://example.test>; rel=next').rel('next')[0].uri, nestedProperty.has({ nested: { value: 1 } }, 'nested.value')]; }";
					},
				}],
			});
			await bundle.write({ ...output, dir: directory, entryFileNames: 'probe.mjs', chunkFileNames: '[name]-[hash].mjs' });
			const { probe } = await import(pathToFileURL(join(directory, 'probe.mjs')).href);
			assert.deepEqual(await probe(), ['function', 'function', 'object', 'function', 'function', 'https://example.test', true]);
		} finally {
			await bundle?.close();
			await rm(directory, { recursive: true, force: true });
		}
	});
}
