/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { generateCssModuleName } from '../../lib/css-module-names.js';
import paths from '../../lib/feature-css-source-paths.json';

const historicalSelectors = [
	['../features/notes/frontend/components/MkNote.vue', 'root', 'xcSej'],
	['../features/notes/frontend/components/MkNote.vue', 'footer', 'xhAPG'],
	['../features/notes/frontend/components/MkNote.vue', 'article', 'x5yeR'],
	['../features/notes/frontend/components/MkNoteHeader.vue', 'root', 'xCPfz'],
	['../features/ui/frontend/components/MkButton.vue', 'root', 'xbaFh'],
];

describe('legacy CSS module source identities', () => {
	test.each(historicalSelectors)('retains historical selector for %s.%s', (file, name, expected) => {
		for (const root of ['/tmp/old/packages/frontend', '/tmp/new-release/packages/frontend']) {
			expect(generateCssModuleName(name, resolve(root, file), root, true)).toBe(expected);
			expect(generateCssModuleName(name, resolve(root, file) + '?vue&type=style&index=0&module=true', root, true)).toBe(expected);
		}
	});

	test('all frozen paths share names with their historical source in production and development', () => {
		const root = '/tmp/release/packages/frontend';
		for (const [destination, original] of Object.entries(paths)) {
			for (const production of [true, false]) {
				for (const name of ['root', 'footer', 'image', 'loading']) {
					expect(generateCssModuleName(name, resolve(root, destination), root, production)).toBe(generateCssModuleName(name, resolve(root, original), root, production));
				}
			}
		}
	});

	test('new components keep their own source identity', () => {
		const root = '/tmp/release/packages/frontend';
		expect(generateCssModuleName('root', resolve(root, '../features/example/frontend/New.vue'), root, false)).toBe('---features-example-frontend-New-root');
	});
});
