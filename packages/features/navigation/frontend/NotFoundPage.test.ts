/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import locales from 'i18n';
import { loadNotFoundPage } from './index.js';
import { definePage } from '@/page.js';
import { pleaseLogin } from '@/utility/please-login.js';

vi.mock('@/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@/utility/please-login.js', () => ({ pleaseLogin: vi.fn() }));

let NotFound: Awaited<ReturnType<typeof loadNotFoundPage>>['default'];

beforeAll(async () => {
	NotFound = (await loadNotFoundPage()).default;
});

describe('not-found component-owned translations', () => {
	test.each(Object.keys(locales))('preserves existing text and page title for %s', async lang => {
		const internationalization = createInternationalization({ initialLocale: lang });
		await internationalization.ready;
		await internationalization.loadLocale(lang);
		const app = createApp(NotFound);
		app.use(internationalization);
		app.component('MkResult', defineComponent({ props: ['text'], setup: props => () => h('p', props.text) }));
		const element = window.document.createElement('div');
		app.mount(element);
		try {
			expect(element.textContent).toBe(locales[lang].notFoundDescription);
			const metadata = vi.mocked(definePage).mock.lastCall?.[0];
			expect(typeof metadata).toBe('function');
			if (typeof metadata === 'function') expect(metadata().title).toBe(locales[lang].notFound);
		} finally {
			app.unmount();
		}
	});

	test('retains the optional login prompt', async () => {
		const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
		await internationalization.loadLocale('ja-JP');
		const app = createApp(NotFound, { showLoginPopup: true });
		app.use(internationalization);
		app.component('MkResult', defineComponent({ setup: () => () => h('p') }));
		app.mount(window.document.createElement('div'));
		try {
			expect(pleaseLogin).toHaveBeenCalledWith({ path: '/' });
		} finally {
			app.unmount();
		}
	});
});
