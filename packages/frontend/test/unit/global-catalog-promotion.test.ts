/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { parse } from 'vue/compiler-sfc';
import { createInternationalization, setActiveInternationalization } from 'virtual:vite-vue-internationalization';
import { getNoteSummary } from '@features/notes/frontend/utility/get-note-summary.js';
import { languages, locales } from 'i18n';
import { expect, test } from 'vitest';
import retention from '../../../i18n/catalog-retention.json';
import history from './catalog-history.json';
import { flattenCatalog, historicalRawLocale } from './catalog-history.js';
import { globalCatalogPilotOwners, restoreGlobalCatalogPilotSource } from './global-catalog-pilot-baseline.js';
import { locales as historicalLocales, valueAt } from './pruned-global-locale-baseline.js';
import type { entities } from 'misskey-js';

const root = resolve(import.meta.dirname, '../../../..');
const paths: Record<string, string> = {
	permissionsLabels: '_permissions',
	visibilityLabels: '_visibility',
	timelinesLabels: '_timelines',
	notificationTypesLabels: '_notification._types',
	deckColumnsLabels: '_deck._columns',
	cwHide: '_cw.hide',
	cwShow: '_cw.show',
};

test('keeps independently pinned raw and effective catalog history for every language', () => {
	for (const file of readdirSync(resolve(root, 'locales')).filter(file => file.endsWith('.yml'))) {
		const language = file.slice(0, -4);
		expect(() => historicalRawLocale(language)).not.toThrow();
		const raw = load(readFileSync(resolve(root, 'locales', file), 'utf8')) as Parameters<typeof flattenCatalog>[0];
		const pairs = flattenCatalog(raw).filter(([key]) => history.promoted.includes(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
		expect({ count: pairs.length, sha256: createHash('sha256').update(JSON.stringify(pairs)).digest('hex') }).toEqual(Reflect.get(history.promotedRawHashes, language));
	}
	expect(Object.keys(historicalLocales)).toEqual([...languages]);
	expect(flattenCatalog(locales['ja-JP']).map(([key]) => key).sort()).toEqual(retention.retainedPaths);
});

test('keeps new mail labels in production without rewriting historical catalog hashes', () => {
	for (const language of languages) {
		const historicalPaths = new Set(flattenCatalog(historicalRawLocale(language)).map(([key]) => key));
		for (const path of history.addedAfterBaseline) {
			expect(historicalPaths.has(path), `${language}:${path}`).toBe(false);
			expect(valueAt(locales[language], path), `${language}:${path}`).toBeTruthy();
		}
	}
	expect(valueAt(locales['ja-JP'], '_mail.title')).toBe('メール');
	expect(valueAt(locales['ja-JP'], '_deck._columns.mail')).toBe('メール');
});

/** Promoted keys kept in the SFC so the settings-search static indexer can resolve `$locale.sfc.*`. */
const settingsSearchLocalKeys: Record<string, readonly string[]> = {
	'packages/features/drive/frontend/pages/settings/drive.vue': ['drive'],
	'packages/features/notifications/frontend/pages/settings/notifications.vue': ['notifications'],
	'packages/features/instance/frontend/pages/admin/branding.vue': ['somethingHappened'],
	'packages/features/instance/frontend/pages/admin/settings.vue': ['info'],
	'packages/features/portability/frontend/pages/settings/account-data.vue': ['antennas'],
	'packages/features/preferences/frontend/pages/settings/preferences.vue': ['notifications'],
	'packages/features/relationships/frontend/pages/settings/mute-block.vue': ['mutedUsers', 'renote', 'blockedUsers'],
};

test.each(globalCatalogPilotOwners)('preserves all 28 translations and removes promoted copies: $file', owner => {
	const source = readFileSync(resolve(root, owner.file), 'utf8');
	const baseline = restoreGlobalCatalogPilotSource(owner.file, source);
	const collect = (text: string) => new Map(parse(text).descriptor.customBlocks.filter(block => block.type === 'locale').map(block => [String(block.attrs.locale), JSON.parse(block.content) as Record<string, unknown>]));
	const before = collect(baseline);
	const after = collect(source);
	const localKeys = settingsSearchLocalKeys[owner.file] ?? [];
	for (const language of languages) {
		for (const key of owner.keys) {
			const value = valueAt(locales[language], paths[key] ?? key);
			const order = 'groupOrders' in owner ? (owner.groupOrders as Record<string, readonly string[]>)[key] : undefined;
			const historical = order ? Object.fromEntries(order.map(part => [part, Reflect.get(value as object, part)])) : value;
			expect(historical, `${owner.file}:${language}:${key}`).toEqual(before.get(language)?.[key]);
			if (localKeys.includes(key)) {
				expect(after.get(language), `${owner.file}:${language}:${key}`).toHaveProperty(key);
				expect(after.get(language)?.[key], `${owner.file}:${language}:${key}`).toEqual(before.get(language)?.[key]);
			} else {
				expect(after.get(language), `${owner.file}:${language}:${key}`).not.toHaveProperty(key);
			}
		}
	}
});

test('keeps all current permission kinds, including MCP and administrator kinds', async () => {
	const { permissions } = await import('../../../misskey-js/src/consts.js');
	for (const language of languages) {
		expect(Object.keys(locales[language]._permissions)).toEqual(expect.arrayContaining([...permissions]));
		expect(Object.keys(locales[language]._permissions)).toHaveLength(88);
		expect(locales[language]._permissions['read:admin:stream']).toBeTruthy();
	}
});

// The TS helper is imported before activation, as it is in Storybook and boot.
test.each(['ja-JP', 'en-US', 'fr-FR'])('reads promoted note-summary labels after activation: %s', async language => {
	const internationalization = createInternationalization({ initialLocale: language });
	await internationalization.ready;
	setActiveInternationalization(internationalization);
	expect(getNoteSummary({ id: 'deleted-note', deletedAt: '2026-01-01' } as entities.Note)).toBe(`(${locales[language].deletedNote})`);
	expect(getNoteSummary({ text: 'Hello', files: [{}, {}], poll: {} } as entities.Note)).toBe(`Hello (${locales[language].withNFiles.replace('{n}', '2')}) (${locales[language].poll})`);
});
