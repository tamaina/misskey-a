/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import type { Component } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import locales from 'i18n';
import { loadEmojiCatalog } from './index.js';
import EmojiCatalogItem from './EmojiCatalogItem.vue';

const mocks = vi.hoisted(() => ({
	user: null as null | {
		isModerator?: boolean;
		isAdmin?: boolean;
		policies: { canManageCustomEmojis: boolean };
	},
	popupMenu: vi.fn(),
	popup: vi.fn(),
	popupAsyncWithDialog: vi.fn(),
	misskeyApiGet: vi.fn(),
	copyToClipboard: vi.fn(),
}));

vi.mock('@features/auth/frontend/i.js', () => ({
	get $i() {
		return mocks.user;
	},
}));

vi.mock('@features/emojis/frontend/custom-emojis.js', async () => {
	const { computed, shallowRef } = await import('vue');
	return {
		customEmojis: shallowRef([]),
		customEmojiCategories: computed(() => [null]),
	};
});

vi.mock('@features/ui/frontend/components/MkButton.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return {
		default: defineComponent({
			props: { to: String },
			setup: (props, { slots }) => () => h('button', { 'data-to': props.to }, slots.default?.()),
		}),
	};
});

vi.mock('@features/ui/frontend/components/MkInput.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return {
		default: defineComponent({
			props: { modelValue: String, placeholder: String },
			emits: ['update:modelValue'],
			setup: (props, { emit, slots }) => () => h('div', [
				h('span', { class: 'input-placeholder' }, props.placeholder),
				h('input', {
					value: props.modelValue,
					onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
				}),
				slots.prefix?.(),
			]),
		}),
	};
});

vi.mock('@features/ui/frontend/components/MkFoldableSection.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return {
		default: defineComponent({
			setup: (_props, { slots }) => () => h('section', [
				h('h2', slots.header?.()),
				...(slots.default?.() ?? []),
			]),
		}),
	};
});

vi.mock('@features/emojis/frontend/components/MkCustomEmojiDetailedDialog.vue', async () => {
	const { defineComponent } = await import('vue');
	return { default: defineComponent({ render: () => null }) };
});

vi.mock('@features/ui/frontend/os.js', () => ({
	popupMenu: mocks.popupMenu,
	popup: mocks.popup,
	popupAsyncWithDialog: mocks.popupAsyncWithDialog,
}));

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApiGet: mocks.misskeyApiGet }));
vi.mock('@features/ui/frontend/utility/copy-to-clipboard.js', () => ({ copyToClipboard: mocks.copyToClipboard }));

let EmojiCatalog: Component;

beforeAll(async () => {
	EmojiCatalog = (await loadEmojiCatalog()).default;
});

afterEach(() => {
	mocks.user = null;
	mocks.popupMenu.mockClear();
	mocks.popup.mockClear();
	mocks.popupAsyncWithDialog.mockClear();
	mocks.misskeyApiGet.mockClear();
	mocks.copyToClipboard.mockClear();
});

async function mountWithLocale(component: Component, lang: string, props?: Record<string, unknown>) {
	const internationalization = createInternationalization({ initialLocale: lang });
	await internationalization.ready;
	await internationalization.loadLocale(lang);
	const app = createApp(component, props);
	app.use(internationalization);
	const element = window.document.createElement('div');
	app.mount(element);
	return { app, element };
}

describe('emoji catalog component-owned translations', () => {
	test.each(Object.keys(locales))('uses resolved locale values for %s', async lang => {
		mocks.user = { isModerator: false, policies: { canManageCustomEmojis: true } };
		const { app, element } = await mountWithLocale(EmojiCatalog, lang);
		try {
			const manageButton = element.querySelector('button');
			expect(manageButton?.textContent).toBe(locales[lang].manageCustomEmojis);
			expect(manageButton?.getAttribute('data-to')).toBe('/custom-emojis-manager');
			expect(element.querySelector('.input-placeholder')?.textContent).toBe(locales[lang].search);

			const input = element.querySelector('input')!;
			input.value = 'not-present';
			input.dispatchEvent(new Event('input', { bubbles: true }));
			await nextTick();
			await nextTick();
			expect(Array.from(element.querySelectorAll('h2'), heading => heading.textContent)).toEqual([
				locales[lang].searchResult,
				locales[lang].other,
			]);
		} finally {
			app.unmount();
		}
	});

	test.each([
		['moderator', { isModerator: true, isAdmin: false, policies: { canManageCustomEmojis: false } }, true],
		['emoji manager policy', { isModerator: false, isAdmin: false, policies: { canManageCustomEmojis: true } }, true],
		['admin without moderator or policy', { isModerator: false, isAdmin: true, policies: { canManageCustomEmojis: false } }, false],
		['signed out', null, false],
	] as const)('keeps the catalog manager permission predicate for %s', async (_name, user, expectedVisible) => {
		mocks.user = user;
		const { app, element } = await mountWithLocale(EmojiCatalog, 'ja-JP');
		try {
			expect(element.querySelector('[data-to="/custom-emojis-manager"]') !== null).toBe(expectedVisible);
		} finally {
			app.unmount();
		}
	});
});

describe('emoji catalog item menu', () => {
	test.each(Object.keys(locales))('uses resolved menu labels for %s', async lang => {
		mocks.user = { isModerator: true, isAdmin: false, policies: { canManageCustomEmojis: false } };
		const { app, element } = await mountWithLocale(EmojiCatalogItem, lang, {
			emoji: { name: 'wave', aliases: ['hello'], category: null, url: 'https://example.test/wave.png' },
		});
		try {
			const button = element.querySelector('button')!;
			button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

			expect(mocks.popupMenu).toHaveBeenCalledOnce();
			const [items, anchor] = mocks.popupMenu.mock.calls[0] as unknown as [Array<{ text?: string; action?: () => void }>, HTMLElement];
			expect(anchor).toBe(button);
			expect(items.map(item => item.text)).toEqual([':wave:', locales[lang].copy, locales[lang].info, locales[lang].edit]);
			items[1].action?.();
			expect(mocks.copyToClipboard).toHaveBeenCalledWith(':wave:');
		} finally {
			app.unmount();
		}
	});

	test.each([
		['moderator', { isModerator: true, isAdmin: false, policies: { canManageCustomEmojis: false } }, true],
		['admin with explicit false moderator flag', { isModerator: false, isAdmin: true, policies: { canManageCustomEmojis: false } }, false],
		['admin with missing moderator flag', { isAdmin: true, policies: { canManageCustomEmojis: false } }, true],
		['signed out', null, false],
	] as const)('keeps the row edit-menu predicate for %s', async (_name, user, shouldShowEdit) => {
		mocks.user = user;
		const { app, element } = await mountWithLocale(EmojiCatalogItem, 'ja-JP', {
			emoji: { name: 'wave', aliases: [], category: null, url: 'https://example.test/wave.png' },
		});
		try {
			element.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			const items = mocks.popupMenu.mock.calls[0][0] as Array<{ text?: string }>;
			expect(items.some(item => item.text === locales['ja-JP'].edit)).toBe(shouldShowEdit);
			expect(items.map(item => item.text).slice(1, 3)).toEqual([locales['ja-JP'].copy, locales['ja-JP'].info]);
		} finally {
			app.unmount();
		}
	});
});
