/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp, defineComponent, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { loadEmojiCatalog } from '@features/emojis/frontend';
import { loadNotFoundPage } from '@features/navigation/frontend';
import { startComponentLocales } from '@features/boot/frontend';
import MkResult from '@features/ui/frontend/components/global/MkResult.vue';
import MkError from '@features/ui/frontend/components/global/MkError.vue';
import MkGoogle from '@/components/MkGoogle.vue';

try {
	const locale = new URL(window.location.href).searchParams.get('locale') ?? 'en-US';
	const { default: NotFoundPage } = await loadNotFoundPage();
	const { default: EmojiCatalog } = await loadEmojiCatalog();
	let retries = 0;
	const app = createApp(defineComponent({
		setup: () => () => h('div', [
			h('section', { id: 'not-found' }, [h(NotFoundPage, { showLoginPopup: true })]),
			h('section', { id: 'emoji-catalog' }, [h(EmojiCatalog)]),
			h('section', { id: 'local-search' }, [h(MkGoogle, { q: 'fixture query' })]),
			h('section', { id: 'empty' }, [h(MkResult, { type: 'empty' })]),
			h('section', { id: 'error' }, [h(MkError, { onRetry() { window.document.querySelector('#retry-count').textContent = String(++retries); } })]),
		]),
	}));
	app.component('MkResult', MkResult);
	app.component('MkSystemIcon', defineComponent({ setup: () => () => h('span') }));
	await startComponentLocales(locale, createInternationalization, runtime => app.use(runtime));
	app.mount('#app');
	window.document.querySelector('#status').textContent = 'ready';
} catch {
	window.document.querySelector('#status').textContent = 'error';
}
