/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { searchIndexes } from '../../../lib/search-index-options.js';
import { pluginCreateSearchIndexVirtualModule, MarkerIdAssigner } from '../../../lib/vite-plugin-create-search-index.js';

const allocations = readFileSync(resolve('../../docs/architecture/feature-file-allocation.tsv'), 'utf8')
	.trim().split('\n').slice(1).map(line => line.split('\t'));

for (const section of ['settings', 'admin']) {
	test(`${section} search includes every relocated or retained view`, async () => {
		const options = searchIndexes.find(item => item.mainVirtualModule === `search-index:${section}`)!;
		const files = [...globSync(options.targetFilePaths)];
		const matched = new Set(files.map(file => resolve(file)));
		expect(matched.size).toBe(files.length);
		const expected = allocations.filter(([source]) => new RegExp(`^packages/frontend/src/pages/${section}/[^/]+\\.vue$`).test(source));
		expect(expected.length).toBeGreaterThan(0);
		for (const [source, , target] of expected) {
			const current = existsSync(resolve('../../', target)) ? target : source;
			expect(matched.has(resolve('../../', current)), current).toBe(true);
		}
		for (const view of options.modulesToHmrOnUpdate) expect(existsSync(resolve(view))).toBe(true);
		const plugin = pluginCreateSearchIndexVirtualModule(options, new MarkerIdAssigner());
		const load = plugin.load;
		if (typeof load !== 'function') throw new Error('Expected a load hook');
		const generated = await load.call({} as never, `\0${options.mainVirtualModule}`);
		for (const file of files) expect(generated).toContain(resolve(file));
	});
}
