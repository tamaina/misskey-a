/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { expect, test, vi } from 'vitest';
import { parse } from 'vue/compiler-sfc';
import { locales } from 'i18n';
import { startComponentLocales } from '@features/boot/frontend/index.js';
import navbarMessagesSource from '../../frontend/navbar-messages.vue?raw';

// Keep the actual navbar, LaunchPad, SFC transforms and generated VVI bundles.
vi.mock('@features/runtime/frontend/utility/clear-cache.js', () => ({ clearCache: vi.fn() }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: { username: 'fixture', policies: {} } }));
vi.mock('@features/auth/frontend/accounts.js', () => ({ getAccountMenu: vi.fn() }));
vi.mock('@features/preferences/frontend/local-storage.js', () => ({ miLocalStorage: { setItem: vi.fn() } }));
vi.mock('@features/navigation/frontend/ui/_common_/common.js', () => ({ openInstanceMenu: vi.fn(), openToolsMenu: vi.fn() }));
vi.mock('@features/discovery/frontend/utility/lookup.js', () => ({ lookup: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ popupMenu: vi.fn() }));
vi.mock('@features/runtime/frontend/utility/unison-reload.js', () => ({ unisonReload: vi.fn() }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: { render: () => null } }));
vi.mock('@features/ui/frontend/components/MkModal.vue', () => ({
	default: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.({ type: 'dialog', maxHeight: 500 })) }),
}));
vi.mock('@features/ui/frontend/utility/device-kind.js', () => ({ deviceKind: 'desktop' }));
vi.mock('@features/instance/frontend/instance.js', () => ({ instance: {} }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({
	prefer: { s: { menu: ['search', 'explore', 'notifications', 'tools'] }, r: { menu: ref(['search', 'explore', 'notifications', 'tools']) } },
}));
vi.mock('@features/preferences/frontend/store.js', () => ({
	store: { r: { realtimeMode: ref(false), menuDisplay: ref('sideFull'), showNavbarSubButtons: ref(false) } },
}));
vi.mock('@features/navigation/frontend/router.js', () => ({ useRouter: () => ({ currentRoute: ref({}) }) }));

const componentMessages = Object.fromEntries(parse(navbarMessagesSource).descriptor.customBlocks
	.filter(block => block.type === 'locale')
	.map(block => [String(block.attrs.locale), JSON.parse(block.content) as Record<string, string>]));
const globalKeys = {
	search: 'search', notifications: 'notifications', drive: 'drive', announcements: 'announcements',
	lists: 'lists', antennas: 'antennas', favorites: 'favorites', clips: 'clip', channels: 'channel', reload: 'reload',
} as const;
const localKeys = {
	followRequests: 'followRequests', explore: 'explore', lookup: 'lookup', qr: 'qr', pages: 'pages', gallery: 'gallery',
	chat: 'directMessage_short', achievements: 'achievements', ui: 'switchUi', about: 'about', tools: 'tools', profile: 'profile', cacheClear: 'clearCache',
} as const;

test.each(['ja-JP', 'en-US', 'fr-FR'])('renders global and owner labels through boot, injection and LaunchPad: %s', async language => {
	vi.resetModules();
	const { createInternationalization, setActiveInternationalization, useLocale } = await import('virtual:vite-vue-internationalization');
	// Match _boot_.ts: fully load and activate before dynamically importing the UI.
	const runtime = await startComponentLocales(language, createInternationalization, setActiveInternationalization);
	const { default: Navbar } = await import('../../frontend/ui/_common_/navbar.vue');
	const { default: LaunchPad } = await import('../../frontend/components/MkLaunchPad.vue');
	const { navbarItemDef } = await import('../../frontend/navbar.js');
	const { getNavbarMessages } = await import('../../frontend/navbar-locale.js');
	const { default: Messages } = await import('../../frontend/navbar-messages.vue');
	const expectedLocal = { ...componentMessages['ja-JP'], ...componentMessages[language] };
	const launchPadShowing = ref(false);
	const errors = vi.fn();
	const app = createApp(defineComponent({ setup: () => () => h('main', [
		h('section', { id: 'navbar' }, [h(Navbar)]),
		launchPadShowing.value ? h('section', { id: 'launchpad' }, [h(LaunchPad)]) : null,
	]) }));

	// VVI's active fallback only works outside injection context. Missing provide
	// throws; it does not silently produce an empty global catalog.
	expect(useLocale(import.meta.url).value.env.search).toBe(locales[language].search);
	expect(() => app.runWithContext(() => useLocale(import.meta.url))).toThrow('not installed');
	app.use(runtime);
	expect(app.runWithContext(() => useLocale(import.meta.url).value.env.search)).toBe(locales[language].search);
	app.config.errorHandler = errors;
	app.component('MkA', defineComponent({ setup: (_, { slots }) => () => h('a', slots.default?.()) }));
	app.component('MkAvatar', () => null);
	app.component('MkAcct', () => null);
	app.directive('tooltip', {});
	app.directive('click-anime', {});
	const element = window.document.createElement('div');
	// First navbar title access happens inside the real SFC render, not outside Vue.
	app.mount(element);
	try {
		const navbarText = element.querySelector('#navbar')?.textContent ?? '';
		for (const key of ['timeline', 'more', 'settings'] as const) {
			expect(navbarText).toContain(locales[language][key]);
		}
		for (const key of ['search', 'notifications'] as const) {
			expect(navbarText).toContain(locales[language][key]);
		}
		// Static owner proxies resolve keys but have no enumerable own properties.
		expect(Messages.$locale.explore).toBe(expectedLocal.explore);
		expect(navbarText).toContain(expectedLocal.explore);
		expect(navbarText).toContain(expectedLocal.tools);
		for (const [item, key] of Object.entries(globalKeys)) {
			expect(navbarItemDef[item].title, item).toBe(locales[language][key]);
		}
		for (const [item, key] of Object.entries(localKeys)) {
			expect(navbarItemDef[item].title, item).toBe(expectedLocal[key]);
		}
		expect(app.runWithContext(() => getNavbarMessages().default)).toBe(locales[language].default);
		expect(app.runWithContext(() => getNavbarMessages().deck)).toBe(expectedLocal.deck);

		// LaunchPad mounts later, as when opening "more", and copies title values.
		launchPadShowing.value = true;
		await nextTick();
		const launchPadText = element.querySelector('#launchpad')?.textContent ?? '';
		for (const [item, key] of Object.entries(globalKeys)) {
			if (['search', 'notifications'].includes(item)) continue;
			expect(launchPadText, item).toContain(locales[language][key]);
		}
		for (const [item, key] of Object.entries(localKeys)) {
			if (['explore', 'tools'].includes(item)) continue;
			expect(launchPadText, item).toContain(expectedLocal[key]);
		}
		expect(errors).not.toHaveBeenCalled();
		expect(element.textContent).not.toContain('$locale');
	} finally {
		app.unmount();
	}
});
