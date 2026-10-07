/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { h, inject } from 'vue';
import { expect, test, vi } from 'vitest';
import { createInternationalization, setActiveInternationalization, useInternationalization } from 'vite-vue-internationalization/runtime';
import locales from 'i18n';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';

test('real embed boot installs the supplied runtime before mounting and preserves boot-error storage and ready signaling', async () => {
	vi.resetModules();
	localStorage.setItem('lang', 'fr-FR');
	document.body.innerHTML = '<div id="splash"></div>';
	const metadata = { defaultLightTheme: null, defaultDarkTheme: null };
	const context = { noteId: 'test' };
	const theme = vi.fn();
	const ready = vi.fn();
	const mounted = vi.fn();
	const marker = Symbol('installed-runtime');
	const dictionary = locales['fr-FR'];
	vi.doMock('@features/drive/frontend/shared/media-proxy.js', () => ({ MediaProxy: class MediaProxy {} }));
	vi.doMock('@features/preferences/frontend/embed/theme.js', () => ({ applyTheme: theme, assertIsTheme: () => true }));
	vi.doMock('@features/emojis/frontend/embed/custom-emojis.js', () => ({ fetchCustomEmojis: async () => {} }));
	vi.doMock('@features/instance/frontend/embed/server-metadata.js', () => ({ serverMetadata: metadata }));
	vi.doMock('@features/boot/frontend/embed/server-context.js', () => ({ serverContext: context }));
	vi.doMock('@features/runtime/frontend/embed/i18n.js', () => ({ i18n: new I18n(dictionary) }));
	vi.doMock('@features/web/frontend/embed/post-message.js', () => ({ postMessageToParentWindow: ready, setIframeId: vi.fn() }));
	const { DI } = await import('@features/boot/frontend/embed/di.js');
	vi.doMock('@features/boot/frontend/embed/ui.vue', () => ({ __esModule: true, default: {
		setup() {
			mounted(inject(marker), useInternationalization(), inject(DI.serverMetadata), inject(DI.serverContext));
			return () => h('div', { id: 'embed-mounted' }, 'ready');
		},
	} }));
	const runtime = createInternationalization({ primaryLocale: 'fr-FR', loaders: { 'fr-FR': async () => ({ global: {}, modules: {} }) } });
	await runtime.ready;
	await runtime.loadLocale('fr-FR');
	setActiveInternationalization(runtime);
	const originalInstall = runtime.install;
	const install = vi.spyOn(runtime, 'install').mockImplementation(app => {
		originalInstall(app);
		app.provide(marker, runtime);
	});
	const log = vi.spyOn(console, 'log').mockImplementation(() => {});
	try {
		// Keep host dependency typing in frontend-embed's authoritative compiler.
		const modulePath = '@features/boot/frontend/embed/boot.js';
		const { embedBoot } = await import(modulePath);
		await embedBoot(runtime);
		await vi.waitFor(() => expect(mounted).toHaveBeenCalledExactlyOnceWith(runtime, runtime, metadata, context));
		expect(install).toHaveBeenCalledTimes(1);
		expect(document.getElementById('embed-mounted')?.textContent).toBe('ready');
		expect(JSON.parse(localStorage.getItem('bootloaderLocales')!)).toEqual({ ...dictionary._bootErrors, reload: dictionary.reload });
		expect(ready).toHaveBeenCalledExactlyOnceWith('misskey:embed:ready');
		expect(theme).toHaveBeenCalledTimes(1);
	} finally {
		log.mockRestore();
		install.mockRestore();
		document.body.innerHTML = '';
		localStorage.clear();
	}
});
