/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/vue';
import { h, nextTick, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import type { entities } from 'misskey-js';
import MkMediaList from '@features/drive/frontend/components/MkMediaList.vue';
import MkLightbox from '@features/drive/frontend/components/MkLightbox.vue';
import MkLightboxItem from '@features/drive/frontend/components/MkLightbox.item.vue';
import type { Content } from '@features/drive/frontend/components/MkLightbox.item.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';

const popup = vi.hoisted(() => vi.fn(async (_component: unknown, _props: unknown) => ({ dispose: vi.fn() })));
vi.mock('@features/ui/frontend/os.js', () => ({ popupAsyncWithDialog: popup, claimZIndex: () => 1000 }));
vi.mock('@features/drive/frontend/utility/get-file-menu.js', () => ({ getFileMenu: () => [] }));

const internationalization = createInternationalization({ initialLocale: 'en-US' });
beforeAll(async () => {
	await internationalization.ready;
	await internationalization.loadLocale('en-US');
});
afterEach(() => {
	cleanup();
	popup.mockClear();
	prefer.s.nsfw = 'respect';
});
const global = {
	plugins: [internationalization],
	directives: { hotkey: {}, tooltip: {} },
	stubs: { MkBlurhash: true, MkImgWithBlurhash: true, XControl: true, XFileInfo: true },
};

function file(id: string, isSensitive = false, type = 'image/png'): entities.DriveFile {
	return { id, isSensitive, type, name: `${id}.png`, url: `https://example.test/${id}`, thumbnailUrl: null, properties: { width: 100, height: 100 }, blurhash: null } as entities.DriveFile;
}

function content(id: string, sensitive = false): Content {
	return { id, type: 'image', url: `https://example.test/${id}`, file: file(id, sensitive), width: 100, height: 100 };
}

test('media list snapshots each image/video visibility by file ID, including re-hide', async () => {
	prefer.s.nsfw = 'respect';
	const files = [file('manual'), file('revealed', true), file('sensitive', true), file('video', false, 'video/mp4')];
	const list = ref<InstanceType<typeof MkMediaList>>();
	const mediaList = ref(files);
	const wrapper = render({ setup: () => () => h(MkMediaList, { ref: list, mediaList: mediaList.value }) }, { global });
	const cards = wrapper.container.querySelector('[class*="medias"]')!.children;
	expect(cards).toHaveLength(4);
	await fireEvent.click(cards[0].querySelector('button:has(.ti-eye-off)')!);
	await fireEvent.click(cards[1]);
	await fireEvent.click(cards[3].querySelector('button:has(.ti-eye-off)')!);
	await list.value!.openGallery('revealed');
	expect(popup.mock.calls.at(-1)?.[1]).toMatchObject({
		defaultIndex: 1, initiallyHiddenContentIds: ['manual', 'sensitive', 'video'], initiallyRevealedContentIds: ['revealed'],
	});
	await fireEvent.click(cards[1].querySelector('button:has(.ti-eye-off)')!);
	await nextTick();
	await list.value!.openGallery();
	expect(popup.mock.calls.at(-1)?.[1]).toMatchObject({
		defaultIndex: 0, initiallyHiddenContentIds: ['manual', 'revealed', 'sensitive', 'video'], initiallyRevealedContentIds: [],
	});
});

test('lightbox forwards separate states to each item and preserves them across navigation', async () => {
	const wrapper = render(MkLightbox, { props: {
		contents: [content('hidden'), content('revealed', true), content('default')],
		initiallyHiddenContentIds: ['hidden'], initiallyRevealedContentIds: ['revealed'],
	}, global });
	const hiddenFiles = () => [...wrapper.container.querySelectorAll('[data-gallery-click-action="hidden"]')];
	expect(hiddenFiles()).toHaveLength(1);
	await fireEvent.click(wrapper.container.querySelector('button:has(.ti-arrow-right)')!);
	await fireEvent.click(wrapper.container.querySelector('button:has(.ti-arrow-left)')!);
	expect(hiddenFiles()).toHaveLength(1);
});

test.each([
	{ name: 'ordinary default', sensitive: false, hidden: false, revealed: false, nsfw: 'respect', expected: false },
	{ name: 'manual hidden', sensitive: false, hidden: true, revealed: false, nsfw: 'respect', expected: true },
	{ name: 'sensitive default', sensitive: true, hidden: false, revealed: false, nsfw: 'respect', expected: true },
	{ name: 'explicit sensitive reveal', sensitive: true, hidden: false, revealed: true, nsfw: 'respect', expected: false },
	{ name: 'reveal precedence', sensitive: true, hidden: true, revealed: true, nsfw: 'respect', expected: false },
	{ name: 'ignore sensitive default', sensitive: true, hidden: false, revealed: false, nsfw: 'ignore', expected: false },
	{ name: 'manual hide with ignore', sensitive: true, hidden: true, revealed: false, nsfw: 'ignore', expected: true },
	{ name: 'force blur', sensitive: false, hidden: false, revealed: false, nsfw: 'force', expected: true },
] as const)('item renders $name', async ({ sensitive, hidden, revealed, nsfw, expected }) => {
	prefer.s.nsfw = nsfw;
	const wrapper = render(MkLightboxItem, { props: {
		content: content('file', sensitive), activated: true, pixelatedZoom: false,
		initiallyHidden: hidden, initiallyRevealed: revealed,
	}, global });
	await nextTick();
	expect(wrapper.container.querySelector('[data-gallery-click-action="hidden"]') != null).toBe(expected);
});
