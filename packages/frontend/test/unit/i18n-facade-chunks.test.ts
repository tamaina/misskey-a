/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { describe, expect, test } from 'vitest';
import { detectI18nFacadeChunk } from '../../../frontend-builder/locale-inliner/facade-chunk-detection.js';
import { blankLogger } from '../../../frontend-builder/logger.js';

const detect = (source: string) => detectI18nFacadeChunk(source, 'i18n.js', blankLogger);

describe('i18n facade chunk shapes', () => {
	test('preserves the old import and export alias mapping', () => {
		expect(detect('import { value as local } from "./shared.js"; export { local as label };')).toEqual({ fileName: 'shared.js', nameMap: { label: 'value' } });
	});
	test('accepts direct named re-exports emitted by newer bundlers', () => {
		expect(detect('export { value as label } from "./shared.js";')).toEqual({ fileName: 'shared.js', nameMap: { label: 'value' } });
	});
	test('combines multiple import and re-export statements from one source', () => {
		expect(detect('import { a as local } from "./shared.js"; export { local as first }; export { b as second } from "./shared.js";')).toEqual({ fileName: 'shared.js', nameMap: { first: 'a', second: 'b' } });
	});
	test.each(['', 'const value = 1; export { value };', 'export const value = 1;', 'function init() {}'])('does not misclassify executable modules: %s', source => {
		expect(detect(source)).toBeNull();
	});
	test.each(['export * from "./shared.js";', 'export { unknown };', 'import value from "./shared.js"; export { value };', 'export { a } from "./first.js"; export { b } from "./second.js";'])('rejects unsupported or ambiguous facades: %s', source => {
		expect(() => detect(source)).toThrow();
	});
});
