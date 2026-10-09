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

// Both importer locations must select the same public package exports, including ESM conditions.
const dependencies = [
	'got', 'fluent-ffmpeg', 'cacheable-lookup', 'tinycolor2', 'web-push',
	'@simplewebauthn/server/helpers', 'chalk', 'meilisearch', 'qrcode',
	'file-type', 'ms', 'sanitize-html', 'archiver', 'mime-types',
];
for (const mode of ['production', 'e2e']) {
	test(`${mode} host and feature dependencies retain public export identity`, async () => {
		const backend = fileURLToPath(new URL('../../', import.meta.url));
		const entry = join(backend, 'scripts/virtual-dependency-host.ts');
		const feature = join(backend, '../features/runtime/backend/virtual-dependency-feature.ts');
		const directory = await mkdtemp(join(tmpdir(), 'misskey-dependency-exports-'));
		let bundle;
		try {
			let hostSource = '';
			let featureSource = '';
			const names = dependencies.map((dependency, index) => {
				hostSource += `import * as host${index} from ${JSON.stringify(dependency)};`;
				featureSource += `import * as feature${index} from ${JSON.stringify(dependency)}; export { feature${index} };`;
				return `feature${index}`;
			});
			hostSource += `import { ${names.join(', ')} } from ${JSON.stringify(feature)};`;
			hostSource += `export function probe() { return [${names.map((name, index) => `[host${index}, ${name}]`).join(', ')}]; }`;
			const { output, ...input } = await configFactory(mode === 'e2e' ? { e2e: true } : {});
			delete input.watch;
			bundle = await rolldown({
				...input,
				input: entry,
				tsconfig: join(backend, mode === 'e2e' ? 'test-server/tsconfig.json' : 'tsconfig.json'),
				external: [],
				plugins: [...input.plugins, {
					name: 'dependency-identity-fixtures',
					resolveId(id) { return id === entry || id === feature ? id : undefined; },
					load(id) { return id === entry ? hostSource : id === feature ? featureSource : undefined; },
				}],
			});
			await bundle.write({ ...output, dir: directory, entryFileNames: 'probe.mjs', chunkFileNames: '[name]-[hash].mjs' });
			const { probe } = await import(pathToFileURL(join(directory, 'probe.mjs')).href);
			const pairs = probe();
			assert.equal(pairs.length, dependencies.length);
			for (const [host, owned] of pairs) {
				assert.deepEqual(Object.keys(owned), Object.keys(host));
				for (const key of Object.keys(host)) assert.equal(owned[key], host[key]);
			}
			const ms = pairs[dependencies.indexOf('ms')][0].default;
			assert.equal(typeof ms, 'function');
			assert.equal(ms('30 days'), 2_592_000_000);
			assert.equal(ms('1 hour'), 3_600_000);
		} finally {
			await bundle?.close();
			await rm(directory, { recursive: true, force: true });
		}
	});
}
