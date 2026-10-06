/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp, defineComponent, h } from 'vue';
import { describe, expect, test, vi } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import locales from 'i18n';
import MkError from '@features/ui/frontend/components/global/MkError.vue';
import MkResult from '@features/ui/frontend/components/global/MkResult.vue';

vi.mock('@/instance.js', () => ({ instance: {} }));

describe('result component-owned translations', () => {
	test.each(Object.keys(locales))('preserves existing text for %s', async lang => {
		const internationalization = createInternationalization({ initialLocale: lang });
		await internationalization.ready;
		await internationalization.loadLocale(lang);

		const onRetry = vi.fn();
		const app = createApp(defineComponent({
			setup: () => () => h('div', [
				h(MkResult, { type: 'empty' }),
				h(MkResult, { type: 'notFound' }),
				h(MkResult, { type: 'error' }),
				h(MkError, { onRetry }),
			]),
		}));
		app.use(internationalization);
		app.component('MkResult', MkResult);
		app.component('MkSystemIcon', defineComponent({ setup: () => () => null }));
		const element = document.createElement('div');
		app.mount(element);
		try {
			const resultText = Array.from(element.querySelectorAll('[style="opacity: 0.7;"]'), el => el.textContent);
			expect(resultText).toEqual([
				locales[lang].nothing,
				locales[lang].notFound,
				locales[lang].somethingHappened,
				locales[lang].somethingHappened,
			]);
			expect(element.querySelector('button')?.textContent).toBe(locales[lang].retry);

			element.querySelector('button')?.click();
			expect(onRetry).toHaveBeenCalledOnce();
		} finally {
			app.unmount();
		}
	});

	test.each(['Custom result', ''])('keeps the text prop override %s', async text => {
		const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
		await internationalization.ready;
		await internationalization.loadLocale('ja-JP');
		const app = createApp(MkResult, { type: 'empty', text });
		app.use(internationalization);
		app.component('MkSystemIcon', defineComponent({ setup: () => () => null }));
		const element = document.createElement('div');
		app.mount(element);
		try {
			expect(element.querySelector('[style="opacity: 0.7;"]')?.textContent).toBe(text);
		} finally {
			app.unmount();
		}
	});
});
