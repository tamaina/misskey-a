/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { h, inject } from 'vue';
import { expect, test, vi } from 'vitest';
import { Window as HappyWindow } from 'happy-dom';
import { createInternationalization, setActiveInternationalization, useInternationalization } from 'vite-vue-internationalization/runtime';
import { locales } from './pruned-global-locale-baseline.js';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import messages from '../../../features/boot/frontend/embed/boot-messages.json';

test.each(['ja-JP', 'en-US', 'fr-FR', 'pt-PT'] as const)('real embed boot installs the supplied runtime and preserves boot errors, ready and self-XSS messages in %s', async language => {
	vi.resetModules();
	localStorage.setItem('lang', language);
	window.document.body.innerHTML = '<div id="splash"></div>';
	const metadata = { defaultLightTheme: null, defaultDarkTheme: null };
	const context = { noteId: 'test' };
	const theme = vi.fn();
	const ready = vi.fn();
	const parentMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
	const removeListener = vi.spyOn(window, 'removeEventListener');
	const mounted = vi.fn();
	const marker = Symbol('installed-runtime');
	const dictionary = locales[language];
	vi.doMock('@features/drive/frontend/shared/media-proxy.js', () => ({ MediaProxy: class MediaProxy {} }));
	vi.doMock('@features/preferences/frontend/embed/theme.js', () => ({ applyTheme: theme, assertIsTheme: () => true }));
	vi.doMock('@features/emojis/frontend/embed/custom-emojis.js', () => ({ fetchCustomEmojis: async () => {} }));
	vi.doMock('@features/instance/frontend/embed/server-metadata.js', () => ({ serverMetadata: metadata }));
	vi.doMock('@features/boot/frontend/embed/server-context.js', () => ({ serverContext: context }));
	vi.doMock('@features/web/frontend/embed/post-message.js', async () => {
		const actual = await vi.importActual<typeof import('../../../features/web/frontend/embed/post-message.js')>('@features/web/frontend/embed/post-message.js');
		return { ...actual, postMessageToParentWindow: ready.mockImplementation(actual.postMessageToParentWindow) };
	});
	const { DI } = await import('@features/boot/frontend/embed/di.js');
	vi.doMock('@features/boot/frontend/embed/ui.vue', () => ({ __esModule: true, default: {
		setup() {
			mounted(inject(marker), useInternationalization(), inject(DI.serverMetadata), inject(DI.serverContext));
			return () => h('div', { id: 'embed-mounted' }, 'ready');
		},
	} }));
	const runtime = createInternationalization({ primaryLocale: 'ja-JP', initialLocale: language, loaders: { 'ja-JP': async () => ({ global: messages['ja-JP'], modules: {} }), [language]: async () => ({ global: messages[language], modules: {} }) } });
	await runtime.ready;
	await runtime.loadLocale(language);
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
		expect(window.document.getElementById('embed-mounted')?.textContent).toBe('ready');
		expect(JSON.parse(localStorage.getItem('bootloaderLocales')!)).toEqual({ ...dictionary._bootErrors, reload: dictionary.reload });
		const legacy = new I18n(dictionary);
		expect(log.mock.calls.slice(-5).map(call => call[0])).toEqual([
			`%c${legacy.ts._selfXssPrevention.warning}`,
			`%c${legacy.ts._selfXssPrevention.title}`,
			`%c${legacy.ts._selfXssPrevention.description1}`,
			`%c${legacy.ts._selfXssPrevention.description2}`,
			legacy.tsx._selfXssPrevention.description3({ link: 'https://misskey-hub.net/docs/for-users/resources/self-xss/' }),
		]);
		expect(ready).toHaveBeenCalledExactlyOnceWith('misskey:embed:ready');
		expect(theme).toHaveBeenCalledTimes(1);

		// Exercise the real registration listener and outgoing height notifications.
		const { postMessageToParentWindow } = await import('@features/web/frontend/embed/post-message.js');
		const sibling = new HappyWindow() as unknown as Window;
		const register = (source: MessageEventSource | null, data: unknown) => {
			window.dispatchEvent(new MessageEvent('message', { source, origin: 'https://embedding.example', data }));
		};
		const registration = (iframeId: string) => ({ type: 'misskey:embedParent:registerIframeId', payload: { iframeId } });
		removeListener.mockClear();
		register(sibling, registration('sibling-id'));
		register(null, registration('missing-source-id'));
		for (const data of [null, 'unrelated', {}, { type: 'unrelated' }, { type: 'misskey:embedParent:registerIframeId' }]) {
			register(window.parent, data);
		}
		postMessageToParentWindow('misskey:embed:changeHeight', { height: 320 });
		expect(parentMessage).toHaveBeenLastCalledWith({ type: 'misskey:embed:changeHeight', iframeId: null, payload: { height: 320 } }, '*');
		expect(removeListener.mock.calls.filter(([type]) => type === 'message')).toHaveLength(0);

		register(window.parent, registration('parent-id'));
		postMessageToParentWindow('misskey:embed:changeHeight', { height: 480 });
		expect(parentMessage).toHaveBeenLastCalledWith({ type: 'misskey:embed:changeHeight', iframeId: 'parent-id', payload: { height: 480 } }, '*');
		expect(removeListener.mock.calls.filter(([type]) => type === 'message')).toHaveLength(1);
		register(window.parent, registration('replacement-id'));
		postMessageToParentWindow('misskey:embed:changeHeight', { height: 640 });
		expect(parentMessage).toHaveBeenLastCalledWith({ type: 'misskey:embed:changeHeight', iframeId: 'parent-id', payload: { height: 640 } }, '*');
	} finally {
		parentMessage.mockRestore();
		removeListener.mockRestore();
		log.mockRestore();
		install.mockRestore();
		window.document.body.innerHTML = '';
		localStorage.clear();
	}
});
