/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { createInternationalization, useLocale } from 'vite-vue-internationalization/runtime';
import type { LocaleBundle } from 'vite-vue-internationalization/runtime';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import { parse } from 'vue/compiler-sfc';
import { expect, test } from 'vitest';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import proof from './remote-suspension-source-rebase.json';
import { restoreRemoteSuspensionBaseline } from './remote-suspension-source-rebase.js';

const source = readFileSync(resolve(import.meta.dirname, '../../../..', proof.file), 'utf8');

test('remote suspension indicator reverses exactly and rejects unrelated edits', () => {
	const restored = restoreRemoteSuspensionBaseline(proof.file, source);
	expect(createHash('sha256').update(restored).digest('hex')).toBe(proof.baselineSha256);
	expect(() => restoreRemoteSuspensionBaseline(proof.file, '// unexpected\n' + source)).toThrow('Source differs');
	expect(() => restoreRemoteSuspensionBaseline(proof.file, source + '\n')).toThrow('Source differs');
	expect(source).toContain('v-if="remoteSuspended"');
	expect(source).toContain('const remoteSuspended = ref(info.value.isRemoteSuspended)');
	expect(source).toContain('remoteSuspended.value = info.value.isRemoteSuspended');
});

test('only Japanese gains a remote label, other languages retain explicit suspend fallback', () => {
	const blocks = parse(source).descriptor.customBlocks.filter(block => block.type === 'locale');
	for (const block of blocks) {
		const locale: { suspend: string; remoteSuspended?: string } = JSON.parse(block.content);
		const dictionary = copyLocaleDictionary(locale);
		const label = dictionary.remoteSuspended ?? dictionary.suspend;
		if (block.attrs.locale === 'ja-JP') expect(label).toBe('リモートで凍結済み');
		else {
			expect(Object.hasOwn(dictionary, 'remoteSuspended')).toBe(false);
			expect(label).toBe(locale.suspend);
		}
	}
});

function invoke(hook: unknown, ...args: unknown[]): unknown {
	if (typeof hook === 'function') return Reflect.apply(hook, {}, args);
	if (hook && typeof hook === 'object' && 'handler' in hook && typeof hook.handler === 'function') return Reflect.apply(hook.handler, {}, args);
	throw new Error('Expected Vite hook');
}

test('actual VVI loaders fill untranslated remote labels from Japanese before runtime lookup', async () => {
	const root = resolve(import.meta.dirname, '../../../..');
	const plugin = pluginVvi();
	invoke(plugin.configResolved, { root: resolve(root, 'packages/frontend'), command: 'build', base: '/', build: { ssr: false } });
	invoke(plugin.buildStart);
	for (const language of ['ja-JP', 'ar-SA']) {
		const loader = invoke(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`);
		if (typeof loader !== 'string') throw new Error('Expected generated VVI loader');
		const payload: LocaleBundle = {};
		runInNewContext(loader.replaceAll('export const ', 'const ').replace('export default { locale, global, modules };', 'payload.global = global; payload.modules = modules;'), { payload });
		const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { [language]: async () => payload } });
		await runtime.ready;
		await runtime.loadLocale(language);
		const moduleUrl = proof.file.replace('packages/', '/');
		// VVI normalizes missing inline messages into each generated locale payload.
		expect(payload.modules).toHaveProperty([moduleUrl, 'remoteSuspended'], 'リモートで凍結済み');
		const raw = useLocale(moduleUrl, runtime).value.sfc;
		const dictionary = copyLocaleDictionary(raw);
		const label = dictionary.remoteSuspended ?? raw.suspend;
		expect(Object.hasOwn(dictionary, 'remoteSuspended')).toBe(true);
		expect(label).toBe('リモートで凍結済み');
		// The source ar-SA block remains untranslated; its existing suspend text is retained.
		const block = parse(source).descriptor.customBlocks.find(block => block.attrs.locale === language);
		if (!block) throw new Error('Expected original inline locale');
		const sourceDictionary: { suspend: string; remoteSuspended?: string } = JSON.parse(block.content);
		expect(raw.suspend).toBe(sourceDictionary.suspend);
		if (language === 'ar-SA') expect(Object.hasOwn(sourceDictionary, 'remoteSuspended')).toBe(false);
	}
}, 30000);
