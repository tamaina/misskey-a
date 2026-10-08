/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { LocaleInliner } from '../../../frontend-builder/locale-inliner.js';
import { collectModifications } from '../../../frontend-builder/locale-inliner/collect-modifications.js';
import { createLogger } from '../../../frontend-builder/logger.js';

function fixture() {
	const logger = createLogger();
	const inliner = new LocaleInliner({
		outputDir: '/unused',
		scriptsDir: 'scripts',
		i18nFile: 'i18n.ts',
		manifest: { 'i18n.ts': { file: 'scripts/shared.js', src: 'i18n.ts' } },
		logger,
	});
	inliner.i18nSymbol = 'r';
	return { logger, inliner };
}

test('owner-only imports from a shared locale chunk remain intact without inliner errors', () => {
	const { logger, inliner } = fixture();
	const source = 'import { o as owner } from "./shared.js"; export const label = owner.$locale.title;';
	expect(collectModifications(source, 'owner.js', logger, inliner)).toEqual([]);
	expect(logger.errorCount).toBe(0);
});

test('mixed imports still inline legacy labels and preserve unrelated owner imports', () => {
	const { logger, inliner } = fixture();
	const source = 'import { r as locale, o as owner } from "./shared.js"; export const label = locale.ts.notifications; export const ownerLabel = owner.$locale.title;';
	const modifications = collectModifications(source, 'mixed.js', logger, inliner);
	expect(modifications).toEqual([expect.objectContaining({ type: 'localized', localizationKey: ['notifications'] })]);
	expect(logger.errorCount).toBe(0);
});

test('sole legacy imports still disappear after successful label inlining', () => {
	const { logger, inliner } = fixture();
	const source = 'import { r as locale } from "./shared.js"; export const label = locale.ts.notifications;';
	const modifications = collectModifications(source, 'legacy.js', logger, inliner);
	expect(modifications.map(modification => modification.type)).toEqual(['localized', 'delete']);
	expect(logger.errorCount).toBe(0);
});

test('unsupported direct legacy dictionary uses still report errors and preserve imports', () => {
	const { logger, inliner } = fixture();
	const source = 'import { r as locale, o as owner } from "./shared.js"; export { locale, owner };';
	expect(collectModifications(source, 'unsupported.js', logger, inliner)).toEqual([]);
	expect(logger.errorCount).toBe(1);
});
