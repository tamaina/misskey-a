/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import * as Vue from 'vue';
import { compileScript, parse } from 'vue/compiler-sfc';
import ts from 'typescript';
import { describe, expect, test, vi } from 'vitest';
import { getLocaleMessageNamedKeys } from 'vite-vue-internationalization';
import * as VviRuntime from 'vite-vue-internationalization/runtime';
import { languages, locales } from 'i18n';
import { I18n } from '@@/js/i18n.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import type { Component, ComputedRef } from 'vue';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

const migrations = [
	{
		file: "packages/features/drive/frontend/pages/drive.vue",
		keyPaths: ["drive"],
		references: [{ "keyPath": "drive", "replacement": "$locale.value.sfc.drive" }],
	},
	{
		file: "packages/features/collections/frontend/pages/favorites.vue",
		keyPaths: ["noNotes", "favorites"],
		references: [{ "keyPath": "noNotes", "replacement": "$locale.sfc.noNotes" }, { "keyPath": "favorites", "replacement": "$locale.value.sfc.favorites" }],
	},
	{
		file: "packages/features/discovery/frontend/pages/explore.vue",
		keyPaths: ["featured", "users", "roles", "explore"],
		references: [{ "keyPath": "featured", "replacement": "$locale.value.sfc.featured" }, { "keyPath": "users", "replacement": "$locale.value.sfc.users" }, { "keyPath": "roles", "replacement": "$locale.value.sfc.roles" }, { "keyPath": "explore", "replacement": "$locale.value.sfc.explore" }],
	},
	{
		file: "packages/features/relationships/frontend/pages/user/followers.vue",
		keyPaths: ["user", "followers"],
		references: [{ "keyPath": "user", "replacement": "$locale.value.sfc.user" }, { "keyPath": "followers", "replacement": "$locale.value.sfc.followers" }],
	},
	{
		file: "packages/features/relationships/frontend/pages/user/following.vue",
		keyPaths: ["user", "following"],
		references: [{ "keyPath": "user", "replacement": "$locale.value.sfc.user" }, { "keyPath": "following", "replacement": "$locale.value.sfc.following" }],
	},
	{
		file: "packages/features/media/frontend/components/MkLightbox.item.controls.vue",
		keyPaths: ["_mediaControls.loop", "_mediaControls.playbackRate", "_mediaControls.pip"],
		references: [{ "keyPath": "_mediaControls.loop", "replacement": "$locale.value.sfc.loop" }, { "keyPath": "_mediaControls.playbackRate", "replacement": "$locale.value.sfc.playbackRate" }, { "keyPath": "_mediaControls.pip", "replacement": "$locale.value.sfc.pip" }],
	},
	{
		file: "packages/features/navigation/frontend/components/global/MkA.vue",
		keyPaths: ["openInWindow", "showInPage", "openInNewTab", "copyLink"],
		references: [{ "keyPath": "openInWindow", "replacement": "$locale.value.sfc.openInWindow" }, { "keyPath": "showInPage", "replacement": "$locale.value.sfc.showInPage" }, { "keyPath": "openInNewTab", "replacement": "$locale.value.sfc.openInNewTab" }, { "keyPath": "copyLink", "replacement": "$locale.value.sfc.copyLink" }],
	},
	{
		file: "packages/features/auth/frontend/pages/reset-password.vue",
		keyPaths: ["newPassword", "save", "resetPassword"],
		references: [{ "keyPath": "resetPassword", "replacement": "$locale.value.sfc.resetPassword" }, { "keyPath": "newPassword", "replacement": "$locale.sfc.newPassword" }, { "keyPath": "save", "replacement": "$locale.sfc.save" }],
	},
	{
		file: "packages/features/timelines/frontend/pages/antenna-timeline.vue",
		keyPaths: ["settings", "antennas"],
		references: [{ "keyPath": "settings", "replacement": "$locale.value.sfc.settings" }, { "keyPath": "antennas", "replacement": "$locale.value.sfc.antennas" }],
	},
	{
		file: "packages/features/relationships/frontend/pages/user-list-timeline.vue",
		keyPaths: ["settings", "lists"],
		references: [{ "keyPath": "settings", "replacement": "$locale.value.sfc.settings" }, { "keyPath": "lists", "replacement": "$locale.value.sfc.lists" }],
	},
	{
		file: "packages/features/announcements/frontend/components/MkAnnouncementDialog.vue",
		keyPaths: ["close", "scrollToClose", "_announcement.readConfirmTitle", "_announcement.readConfirmText"],
		references: [{ "keyPath": "close", "replacement": "$locale.sfc.close" }, { "keyPath": "scrollToClose", "replacement": "$locale.sfc.scrollToClose" }, { "keyPath": "_announcement.readConfirmTitle", "replacement": "$locale.value.sfc.readConfirmTitle" }, { "keyPath": "_announcement.readConfirmText", "replacement": "$l.value.sfc.readConfirmText" }],
	},
	{
		file: "packages/features/collections/frontend/components/MkClipPreview.vue",
		keyPaths: ["updatedAt", "notesCount", "remainingN", "unknown"],
		references: [{ "keyPath": "updatedAt", "replacement": "$locale.sfc.updatedAt" }, { "keyPath": "notesCount", "replacement": "$locale.sfc.notesCount" }, { "keyPath": "remainingN", "replacement": "$l.sfc.remainingN" }, { "keyPath": "unknown", "replacement": "$locale.value.sfc.unknown" }],
	},
	{
		file: "packages/features/share/frontend/pages/qr.show.vue",
		keyPaths: ["_qr.shareTitle", "_qr.shareText"],
		references: [{ "keyPath": "_qr.shareTitle", "replacement": "$l.value.sfc.shareTitle" }, { "keyPath": "_qr.shareText", "replacement": "$locale.value.sfc.shareText" }],
	},
	{
		file: "packages/features/relationships/frontend/pages/settings/mute-block.emoji-mute.vue",
		keyPaths: ["add", "syncBetweenDevices", "emojiUnmute", "unmuteX"],
		references: [{ "keyPath": "add", "replacement": "$locale.sfc.add" }, { "keyPath": "syncBetweenDevices", "replacement": "$locale.sfc.syncBetweenDevices" }, { "keyPath": "emojiUnmute", "replacement": "$locale.value.sfc.emojiUnmute" }, { "keyPath": "unmuteX", "replacement": "$l.value.sfc.unmuteX" }],
	},
	{
		file: "packages/features/channels/frontend/components/MkChannelPreview.vue",
		keyPaths: ["sensitive", "_channel.usersCount", "_channel.notesCount", "youAreAdmin", "updatedAt"],
		references: [{ "keyPath": "sensitive", "replacement": "$locale.sfc.sensitive" }, { "keyPath": "_channel.usersCount", "replacement": "$locale.sfc.usersCount" }, { "keyPath": "_channel.notesCount", "replacement": "$locale.sfc.notesCount" }, { "keyPath": "youAreAdmin", "replacement": "$locale.sfc.youAreAdmin" }, { "keyPath": "updatedAt", "replacement": "$locale.sfc.updatedAt" }],
	}
] as const;

function getLocaleValue(language: string, keyPath: string): string {
	const value = keyPath.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], locales[language]);
	if (typeof value !== 'string') throw new Error(`Expected locale text at ${language}:${keyPath}`);
	return value;
}

function getBlocks(file: string): Map<string, Record<string, string>> {
	const { descriptor, errors } = parse(readFileSync(resolve(repoRoot, file), 'utf8'), { filename: file });
	expect(errors).toEqual([]);
	const blocks = descriptor.customBlocks.filter(block => block.type === 'locale');
	const result = new Map<string, Record<string, string>>();
	for (const block of blocks) {
		expect(block.attrs.lang).toBe('json');
		expect(result.has(String(block.attrs.locale))).toBe(false);
		result.set(String(block.attrs.locale), JSON.parse(block.content) as Record<string, string>);
	}
	return result;
}

function placeholders(message: string): string[] {
	return [...new Set([...message.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();
}

function legacyFormat(language: string, keyPath: string, values: Record<string, string | number>): string {
	const legacy = new I18n(locales[language]);
	const formatter = keyPath.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], legacy.tsx);
	return (formatter as (parameters: Record<string, string | number>) => string)(values);
}

// Compile the actual migrated component through the installed VVI transform and
// Vue compiler. Inject only its external collaborators, leaving setup/render and
// the real VVI computed refs/localizers intact.
function compileSource(file: string): string {
	const filename = resolve(repoRoot, file);
	const source = readFileSync(filename, 'utf8');
	const plugin = pluginVvi();
	const configure = plugin.configResolved;
	const transform = plugin.transform;
	if (typeof configure !== 'function' || !transform || typeof transform === 'function') throw new Error('Expected VVI hooks');
	configure.call({} as never, { root: resolve(repoRoot, 'packages/frontend'), command: 'serve', base: '/' } as never);
	const transformed = transform.handler.call({} as never, source, filename);
	if (transformed instanceof Promise) throw new Error('Expected a synchronous SFC transform');
	const transformedSource = typeof transformed === 'string' ? transformed : transformed?.code?.toString() ?? source;
	const { descriptor, errors } = parse(transformedSource, { filename });
	expect(errors).toEqual([]);
	const compiled = compileScript(descriptor, { id: file, inlineTemplate: true });
	const output = ts.transpileModule(compiled.content, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		reportDiagnostics: true,
	});
	expect(output.diagnostics).toEqual([]);
	return output.outputText;
}

function compileComponent(file: string, dependencies: Record<string, unknown> = {}): Component {
	const output = compileSource(file);
	const exports: { default?: Component } = {};
	runInNewContext(output, {
		exports,
		require(specifier: string) {
			if (specifier === 'vue') return Vue;
			if (specifier === 'virtual:vite-vue-internationalization') return VviRuntime;
			if (Object.hasOwn(dependencies, specifier)) return { __esModule: true, ...(dependencies[specifier] as Record<string, unknown>) };
			throw new Error(`Unexpected component dependency: ${specifier}`);
		},
		window, document, navigator, console, IntersectionObserver: window.IntersectionObserver,
	}, { filename: file });
	if (!exports.default) throw new Error(`Missing compiled component: ${file}`);
	return exports.default;
}

async function runtimeFor(language: string, files: readonly string[]) {
	const modules = Object.fromEntries(files.map(file => [
		'/' + file.replace(/^packages\//, ''),
		getBlocks(file).get(language)!,
	]));
	const runtime = VviRuntime.createInternationalization({
		primaryLocale: 'ja-JP', initialLocale: language,
		loaders: { [language]: async () => ({ modules }) },
	});
	await runtime.ready;
	await runtime.loadLocale(language);
	return runtime;
}

const slotContainer = Vue.defineComponent({
	setup: (_props, { slots }) => () => Vue.h('div', slots.default?.()),
});
const slotButton = Vue.defineComponent({
	setup: (_props, { slots }) => () => Vue.h('button', slots.default?.()),
});

async function mountLocalized(language: string, file: string, component: Component, props: Record<string, unknown> = {}) {
	const runtime = await runtimeFor(language, [file]);
	const app = Vue.createApp(component, props);
	app.use(runtime);
	app.config.globalProperties.$style = new Proxy({}, { get: (_target, key) => String(key) });
	for (const name of ['PageWithHeader', 'MkA', 'MkAvatar', 'MkUserName', 'MkCondensedLine']) app.component(name, slotContainer);
	app.component('MkTime', Vue.defineComponent({ setup: () => () => null }));
	// eslint-disable-next-line vue/multi-word-component-names -- Match the existing application global.
	app.component('Mfm', Vue.defineComponent({ props: ['text'], setup: props => () => Vue.h('span', props.text) }));
	const element = document.createElement('div');
	app.mount(element);
	return { app, element };
}

describe('script and parameterized SFC-local locales', () => {
	test.each(migrations)('$file compiles with injected script and template locale bindings', ({ file }) => {
		expect(compileSource(file)).toContain('virtual:vite-vue-internationalization');
	});

	test.each(migrations)('$file keeps every effective translation and placeholder set', ({ file, keyPaths, references }) => {
		const source = readFileSync(resolve(repoRoot, file), 'utf8');
		const blocks = getBlocks(file);
		expect([...blocks.keys()]).toEqual(languages);
		expect(source).not.toMatch(/\bi18n\s*\./);
		expect(source).not.toContain("from '@features/runtime/frontend/i18n.js'");
		for (const { replacement } of references) expect(source.split(replacement).length - 1).toBe(1);
		for (const language of languages) {
			const dictionary = blocks.get(language)!;
			expect(Object.keys(dictionary).sort()).toEqual(keyPaths.map(path => path.split('.').at(-1)!).sort());
			for (const keyPath of keyPaths) {
				const localKey = keyPath.split('.').at(-1)!;
				const expected = getLocaleValue(language, keyPath);
				expect(dictionary[localKey]).toBe(expected);
				expect(placeholders(dictionary[localKey])).toEqual(placeholders(expected));
				expect(getLocaleMessageNamedKeys(dictionary[localKey]).sort()).toEqual(placeholders(expected));
			}
		}
	});

	const parameterized = [
		{ file: 'packages/features/announcements/frontend/components/MkAnnouncementDialog.vue', keyPath: '_announcement.readConfirmText' },
		{ file: 'packages/features/collections/frontend/components/MkClipPreview.vue', keyPath: 'remainingN' },
		{ file: 'packages/features/share/frontend/pages/qr.show.vue', keyPath: '_qr.shareTitle' },
		{ file: 'packages/features/relationships/frontend/pages/settings/mute-block.emoji-mute.vue', keyPath: 'unmuteX' },
	] as const;

	test.each(parameterized)('$keyPath formats all 28 locales like the legacy implementation', async ({ file, keyPath }) => {
		for (const language of languages) {
			const runtime = await runtimeFor(language, [file]);
			Vue.createApp({}).use(runtime);
			const localizer = VviRuntime.createComponentLocalizer('/' + file.replace(/^packages\//, ''));
			const localKey = keyPath.split('.').at(-1)!;
			const formatter = localizer[localKey];
			if (typeof formatter !== 'function') throw new Error(`Expected localizer function for ${localKey}`);
			for (const value of [0, 1, 12, -5, "名前 {x} | @:linked & <b> ' $ 東京"]) {
				const values = Object.fromEntries(placeholders(getLocaleValue(language, keyPath)).map(key => [key, value]));
				expect(formatter(values)).toBe(legacyFormat(language, keyPath, values));
			}
		}
	});

	// The application stores the selected language and requests a reload. VVI
	// 1.1.3 has no runtime locale setter, so exercise the supported fresh-boot path.
	test('locale reload/remount retains reactive page metadata and later context-menu reads', async () => {
		const driveFile = 'packages/features/drive/frontend/pages/drive.vue';
		const linkFile = 'packages/features/navigation/frontend/components/global/MkA.vue';
		for (const language of ['ja-JP', 'en-US']) {
			let metadata: ComputedRef<{ title: string }> | undefined;
			const drive = compileComponent(driveFile, {
				'@features/drive/frontend/components/MkDrive.vue': { default: Vue.defineComponent({
					setup: (_props, { emit }) => () => Vue.h('div', [
						Vue.h('button', { onClick: () => emit('cd', { name: 'Current folder' }) }, 'folder'),
						Vue.h('button', { onClick: () => emit('cd', null) }, 'root'),
					]),
				}) },
				'@features/navigation/frontend/page.js': { definePage: (getter: () => { title: string }) => { metadata = Vue.computed(getter); } },
				'@features/ui/frontend/composables/use-scroll-position-keeper.js': { useScrollPositionKeeper: () => {} },
			});
			const mountedDrive = await mountLocalized(language, driveFile, drive);
			try {
				expect(metadata!.value.title).toBe(locales[language].drive);
				mountedDrive.element.querySelectorAll('button')[0].click();
				await Vue.nextTick();
				expect(metadata!.value.title).toBe('Current folder');
				mountedDrive.element.querySelectorAll('button')[1].click();
				await Vue.nextTick();
				expect(metadata!.value.title).toBe(locales[language].drive);
			} finally { mountedDrive.app.unmount(); }

			const contextMenu = vi.fn();
			const copy = vi.fn();
			const destination = Vue.ref('/before');
			const link = compileComponent(linkFile, {
				'@@/js/config.js': { url: 'https://example.test' },
				'@features/ui/frontend/os.js': { contextMenu, pageWindow: vi.fn() },
				'@features/ui/frontend/utility/copy-to-clipboard.js': { copyToClipboard: copy },
				'@features/navigation/frontend/router.js': { useRouter: () => ({ pushByPath: vi.fn() }) },
			});
			const parent = Vue.defineComponent({ setup: () => () => Vue.h(link, { to: destination.value }, () => 'link') });
			const mountedLink = await mountLocalized(language, linkFile, parent);
			try {
				destination.value = '/after';
				await Vue.nextTick();
				mountedLink.element.querySelector('a')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
				const menu = contextMenu.mock.calls[0][0] as { text?: string; action?: () => void }[];
				expect(menu.map(item => item.text).filter(Boolean)).toEqual([
					'/after', locales[language].openInWindow, locales[language].showInPage, locales[language].openInNewTab, locales[language].copyLink,
				]);
				menu.at(-1)!.action!();
				expect(copy).toHaveBeenCalledWith('https://example.test/after');
			} finally { mountedLink.app.unmount(); }
		}
	});

	test.each(['ja-JP', 'en-US'])('compiled clip parameters react to count and policy changes in %s', async language => {
		const file = 'packages/features/collections/frontend/components/MkClipPreview.vue';
		const account = Vue.reactive({ policies: { noteEachClipsLimit: 10 } });
		const clip = Vue.reactive({ id: 'clip', name: 'Clip', notesCount: 7 });
		const component = compileComponent(file, {
			'@features/auth/frontend/i.js': { $i: account },
			'@features/ui/frontend/filters/number.js': { default: String },
		});
		const mounted = await mountLocalized(language, file, component, { clip, noUserInfo: true });
		try {
			expect(mounted.element.textContent).toContain(legacyFormat(language, 'remainingN', { n: 3 }));
			clip.notesCount = 8;
			await Vue.nextTick();
			expect(mounted.element.textContent).toContain(legacyFormat(language, 'remainingN', { n: 2 }));
			account.policies.noteEachClipsLimit = 12;
			await Vue.nextTick();
			expect(mounted.element.textContent).toContain(legacyFormat(language, 'remainingN', { n: 4 }));
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled announcement confirmation preserves cancel and later parameter reads in %s', async language => {
		const file = 'packages/features/announcements/frontend/components/MkAnnouncementDialog.vue';
		const confirmation = vi.fn().mockResolvedValueOnce({ canceled: true }).mockResolvedValueOnce({ canceled: false });
		const api = vi.fn();
		const closeModal = vi.fn();
		const updateAccount = vi.fn();
		const announcement = Vue.reactive({ id: 'announcement', title: 'Before', text: 'Body', icon: 'info', needConfirmationToRead: true });
		const component = compileComponent(file, {
			'@features/ui/frontend/os.js': { confirm: confirmation },
			'@features/api/frontend/utility/misskey-api.js': { misskeyApi: api },
			'@features/ui/frontend/components/MkModal.vue': { default: Vue.defineComponent({
				setup: (_props, { slots, expose }) => { expose({ close: closeModal }); return () => Vue.h('div', slots.default?.()); },
			}) },
			'@features/ui/frontend/components/MkButton.vue': { default: slotButton },
			'@features/auth/frontend/i.js': { $i: { unreadAnnouncements: [{ id: 'announcement' }, { id: 'other' }] } },
			'@features/auth/frontend/accounts.js': { updateCurrentAccountPartial: updateAccount },
		});
		const bounds = vi.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 100 } as DOMRect);
		const mounted = await mountLocalized(language, file, component, { announcement });
		bounds.mockRestore();
		try {
			await Vue.nextTick();
			mounted.element.querySelector('button')!.click();
			await new Promise<void>(resolve => window.setTimeout(resolve, 0));
			expect(confirmation).toHaveBeenNthCalledWith(1, {
				type: 'question', title: locales[language]._announcement.readConfirmTitle,
				text: legacyFormat(language, '_announcement.readConfirmText', { title: 'Before' }),
			});
			expect(closeModal).not.toHaveBeenCalled();
			expect(api).not.toHaveBeenCalled();
			announcement.title = "After {title} | <b>";
			await Vue.nextTick();
			mounted.element.querySelector('button')!.click();
			await new Promise<void>(resolve => window.setTimeout(resolve, 0));
			expect(confirmation.mock.calls[1][0].text).toBe(legacyFormat(language, '_announcement.readConfirmText', { title: announcement.title }));
			expect(closeModal).toHaveBeenCalledOnce();
			expect(api).toHaveBeenCalledExactlyOnceWith('i/read-announcement', { announcementId: 'announcement' });
			expect(updateAccount).toHaveBeenCalledExactlyOnceWith({ unreadAnnouncements: [{ id: 'other' }] });
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled channel keeps rich n slots and read-indicator behavior in %s', async language => {
		const file = 'packages/features/channels/frontend/components/MkChannelPreview.vue';
		const renderer = compileComponent('packages/features/ui/frontend/components/global/I18n.vue');
		const channel = Vue.reactive({ id: 'channel', name: 'Channel', usersCount: 2, notesCount: 3, lastNotedAt: '2026-10-01T00:00:00.000Z', isFollowing: true });
		const component = compileComponent(file, {
			'@features/auth/frontend/i.js': { $i: null },
			'@features/preferences/frontend/local-storage.js': { miLocalStorage: { getItemAsJson: () => null } },
		});
		const runtime = await runtimeFor(language, [file]);
		const app = Vue.createApp(component, { channel });
		app.use(runtime);
		app.component('MkA', Vue.defineComponent({ setup: (_props, { slots }) => () => Vue.h('a', slots.default?.()) }));
		app.component('MkTime', Vue.defineComponent({ setup: () => () => null }));
		// eslint-disable-next-line vue/multi-word-component-names -- Match the existing application global.
		app.component('I18n', renderer);
		const element = document.createElement('div');
		app.mount(element);
		try {
			const spans = element.querySelectorAll('.status span');
			expect(spans[0].textContent).toBe(legacyFormat(language, '_channel.usersCount', { n: 2 }));
			expect(spans[1].textContent).toBe(legacyFormat(language, '_channel.notesCount', { n: 3 }));
			expect([...element.querySelectorAll('.status b')].map(item => item.textContent)).toEqual(['2', '3']);
			channel.usersCount = 5;
			channel.notesCount = 8;
			await Vue.nextTick();
			expect(spans[0].textContent).toBe(legacyFormat(language, '_channel.usersCount', { n: 5 }));
			expect(spans[1].textContent).toBe(legacyFormat(language, '_channel.notesCount', { n: 8 }));
			expect(element.querySelector('.indicator')).not.toBeNull();
			element.querySelector('a')!.click();
			await Vue.nextTick();
			expect(element.querySelector('.indicator')).toBeNull();
		} finally { app.unmount(); }
	});
});
