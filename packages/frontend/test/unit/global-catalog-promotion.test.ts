/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { createInternationalization, setActiveInternationalization, useLocale } from 'virtual:vite-vue-internationalization';
import { getNoteSummary } from '@features/notes/frontend/utility/get-note-summary.js';
import { languages, locales } from 'i18n';
import { expect, test } from 'vitest';
import retention from '../../../i18n/catalog-retention.json';
import type { entities } from 'misskey-js';

type Dictionary = { [key: string]: string | Dictionary };
const root = resolve(import.meta.dirname, '../../../..');
const flattenCatalog = (dictionary: Dictionary, prefix = ''): [string, string][] => Object.entries(dictionary).flatMap(([key, value]) => typeof value === 'string' ? [[prefix + key, value]] : flattenCatalog(value, `${prefix}${key}.`));

test('keeps retained global catalog paths for every supported language', () => {
	expect(flattenCatalog(locales['ja-JP'] as unknown as Dictionary).map(([key]) => key).sort()).toEqual(retention.retainedPaths);
	for (const language of languages) {
		expect(locales[language]).toBeDefined();
	}
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

test.each(Object.entries(settingsSearchLocalKeys))('retains settings-search local keys in %s', (file, keys) => {
	const source = readFileSync(resolve(root, file), 'utf8');
	const dictionaries = new Map(parse(source).descriptor.customBlocks
		.filter(block => block.type === 'locale')
		.map(block => [String(block.attrs.locale), JSON.parse(block.content) as Record<string, unknown>]));
	for (const language of languages) {
		for (const key of keys) {
			expect(dictionaries.get(language), `${file}:${language}:${key}`).toHaveProperty(key);
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

test.each([
	['ca-ES', '/features/preferences/frontend/pages/settings/preferences.vue', 'expandUrlPreviewAutomatically', 'Expandir automàticament les previsualitzacions d\'URL'],
	['de-DE', '/features/collections/frontend/ui/deck/clip-column.vue', 'selectClip', 'Clip auswählen'],
	['it-IT', '/features/users/frontend/pages/settings/profile.vue', 'cannotSelectSensitiveMedia', 'Impossibile selezionare il media esplicito'],
	['ko-KR', '/features/drive/frontend/ts-messages.vue', 'cannotUploadBecauseNoSuchFolder', '업로드할 폴더를 찾을 수 없습니다. 기본 업로드 위치 설정을 확인해 주세요.'],
	['zh-CN', '/features/instance/frontend/pages/admin/email-settings.vue', 'emptyToDisableSmtpAuth', '将用户名和密码留空可以禁用 SMTP 验证'],
])('loads a #18171 owner translation from VVI for %s', async (language, owner, key, value) => {
	const internationalization = createInternationalization({ initialLocale: language });
	await internationalization.ready;
	expect(useLocale(owner, internationalization).value.sfc[key]).toBe(value);
});
