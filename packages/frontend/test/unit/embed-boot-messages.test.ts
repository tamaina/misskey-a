/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';
import { createInternationalization, setActiveInternationalization, useLocale, useLocalizer } from 'vite-vue-internationalization/runtime';
import { languages, locales } from 'i18n';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import messages from '../../../features/boot/frontend/embed/boot-messages.json';
import proof from './embed-boot-messages.json';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

function hook(hook: unknown, ...args: unknown[]): unknown {
	if (typeof hook === 'function') return Reflect.apply(hook, {}, args);
	if (hook && typeof hook === 'object' && 'handler' in hook && typeof hook.handler === 'function') return Reflect.apply(hook.handler, {}, args);
	throw new Error('Expected a callable Vite hook');
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

test('embed dictionary keeps exactly the 504 effective strings and preserves boot source outside translation accesses', () => {
	expect(Object.keys(messages).sort()).toEqual([...languages].sort());
	expect(sha256(readFileSync(resolve(root, 'packages/features/boot/frontend/embed/boot-messages.json'), 'utf8'))).toBe(proof.dictionarySha256);
	for (const language of languages) {
		expect(messages[language]).toEqual({ _bootErrors: locales[language]._bootErrors, reload: locales[language].reload, _selfXssPrevention: locales[language]._selfXssPrevention });
	}
	let source = readFileSync(resolve(root, 'packages/features/boot/frontend/embed/boot.ts'), 'utf8');
	source = source.replace("import { useLocale, useLocalizer } from 'vite-vue-internationalization/runtime';\nimport type bootMessages from './boot-messages.json';", "import { i18n } from '@features/runtime/frontend/embed/i18n.js';");
	source = source.replace('\n' + proof.newSetup, '');
	source = source.replace(proof.newStore, proof.oldStore);
	for (const [before, after] of proof.rewrites) source = source.split(after).join(before);
	expect(source).toBe(proof.originalSource);
	expect(sha256(source)).toBe(proof.originalSha256);
});

test.each(languages)('VVI embed boot messages match legacy text and formatter bytes in %s', async language => {
	const plugin = pluginVvi({ embed: true });
	hook(plugin.configResolved, { root: resolve(root, 'packages/frontend-embed'), command: 'build', base: '/' });
	hook(plugin.buildStart);
	const source = hook(plugin.load, `\0virtual:vite-vue-internationalization/locale/${language}`);
	if (typeof source !== 'string') throw new Error('Expected a generated locale loader');
	expect(source).toContain('export default { locale, global, modules };');
	const payload: { global?: typeof messages['ja-JP']; modules?: Record<string, Record<string, unknown>> } = {};
	runInNewContext(source.replaceAll('export const ', 'const ').replace('export default { locale, global, modules };', 'payload.global = global; payload.modules = modules;'), { payload });
	if (payload.global === undefined || payload.modules === undefined) throw new Error('Generated loader did not populate its payload');
	expect(payload.global).toEqual(messages[language]);
	const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: Object.fromEntries(languages.map(code => [code, async () => code === language ? payload : ({ global: messages[code], modules: {} })])) });
	await runtime.ready;
	await runtime.loadLocale(language);
	setActiveInternationalization(runtime);
	const t = useLocalizer<typeof messages['ja-JP']>(import.meta.url).value.env;
	const raw = useLocale<typeof messages['ja-JP']>(import.meta.url).value.env;
	const legacy = new I18n(locales[language]);
	expect(Object.keys(raw._bootErrors)).toEqual(proof.bootErrorKeys);
	expect(raw._bootErrors).toEqual(legacy.ts._bootErrors);
	expect(raw.reload).toBe(legacy.ts.reload);
	for (const key of ['warning', 'title', 'description1', 'description2'] as const) expect(raw._selfXssPrevention[key]).toBe(legacy.ts._selfXssPrevention[key]);
	for (const link of ['https://misskey-hub.net/docs/for-users/resources/self-xss/', "link {x} | @:linked & <b> ' $ 東京"]) {
		expect(t._selfXssPrevention.description3({ link })).toBe(legacy.tsx._selfXssPrevention.description3({ link }));
	}
});
