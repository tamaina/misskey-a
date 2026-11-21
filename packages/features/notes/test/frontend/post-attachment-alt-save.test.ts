/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import type { entities } from 'misskey-js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import { confirmImageAltText } from '@features/notes/frontend/utility/post-image-alt-reminder.js';
import MkPostFormAttaches from '@features/notes/frontend/components/MkPostFormAttaches.vue';

const mocks = vi.hoisted(() => ({
	api: vi.fn<(route: string, input: { fileId: string; comment: string | null }) => Promise<void>>(),
	menu: vi.fn<(items: MenuItem[]) => Promise<void>>(),
	editor: vi.fn<(
		component: Promise<unknown>,
		props: { default: string },
		events: { done: (caption: string) => Promise<void> },
	) => Promise<{ dispose: () => void }>>(),
}));

vi.mock('@features/ui/frontend/os.js', () => ({
	apiWithDialog: mocks.api,
	popupMenu: mocks.menu,
	popupAsyncWithDialog: mocks.editor,
}));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: { s: { devMode: false } } }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/drive/frontend/components/MkDriveFileThumbnail.vue', () => ({ default: { render: () => null } }));
vi.mock('@features/drive/frontend/components/MkFileCaptionEditWindow.vue', () => ({ default: { render: () => null } }));
vi.mock('@features/ui/frontend/components/MkDraggable.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return {
		default: defineComponent({
			props: { modelValue: { type: Array, required: true } },
			setup: (props, { slots }) => () => h('div', props.modelValue.flatMap(item => slots.default?.({ item }) ?? [])),
		}),
	};
});

const locale = createInternationalization({ initialLocale: 'en-US' });
beforeAll(async () => { await locale.ready; await locale.loadLocale('en-US'); });
beforeEach(() => {
	mocks.api.mockReset();
	mocks.menu.mockReset().mockResolvedValue(undefined);
	mocks.editor.mockReset().mockResolvedValue({ dispose: vi.fn() });
});
afterEach(cleanup);

async function setup(initialCaption: string | null) {
	const files = ref([{ id: 'file1', type: 'image/png', comment: initialCaption }] as entities.DriveFile[]);
	const savingAltText = ref(false);
	const warn = vi.fn().mockResolvedValue(false);
	render(defineComponent({
		render: () => h('div', [
			h(MkPostFormAttaches, {
				modelValue: files.value,
				savingAltText: savingAltText.value,
				'onUpdate:savingAltText': value => { savingAltText.value = value; },
			}),
			h('button', { disabled: savingAltText.value, onClick: () => { if (!savingAltText.value) void confirmImageAltText(true, files.value, warn); } }, 'Post'),
		]),
	}), { global: { plugins: [locale] } });

	await fireEvent.click(screen.getAllByRole('button')[0]);
	const action = mocks.menu.mock.calls[0][0].find(item => 'text' in item && item.text === 'Add alt text');
	if (!action || !('action' in action)) throw new Error('Caption edit action not found');
	action.action(new PointerEvent('click'));
	const saveCaption = mocks.editor.mock.calls[0][2].done;
	return { files, post: screen.getByRole('button', { name: 'Post' }) as HTMLButtonElement, saveCaption, warn };
}

test.each([
	{ initial: 'Before', next: '', saved: null, warnAfterSave: true },
	{ initial: null, next: 'After', saved: 'After', warnAfterSave: false },
])('checks the saved caption, not the previous one ($initial -> $next)', async ({ initial, next, saved, warnAfterSave }) => {
	const api = Promise.withResolvers<void>();
	mocks.api.mockReturnValueOnce(api.promise);
	const { files, post, saveCaption, warn } = await setup(initial);

	const saving = saveCaption(next);
	await nextTick();
	expect(post.disabled).toBe(true);
	expect(files.value[0].comment).toBe(initial);
	await fireEvent.click(post);
	expect(warn).not.toHaveBeenCalled();

	api.resolve();
	await saving;
	await nextTick();
	expect(mocks.api).toHaveBeenCalledWith('drive/files/update', { fileId: 'file1', comment: saved });
	expect(files.value[0].comment).toBe(saved);
	expect(post.disabled).toBe(false);
	await fireEvent.click(post);
	expect(warn).toHaveBeenCalledTimes(warnAfterSave ? 1 : 0);
});

test('a failed caption save unlocks posting without changing the saved caption', async () => {
	mocks.api.mockRejectedValueOnce(new Error('save failed'));
	const { files, post, saveCaption, warn } = await setup(null);
	await saveCaption('Not saved');
	await nextTick();
	expect(files.value[0].comment).toBeNull();
	expect(post.disabled).toBe(false);
	await fireEvent.click(post);
	expect(warn).toHaveBeenCalledOnce();
});
