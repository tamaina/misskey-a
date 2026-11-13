/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import type { entities } from 'misskey-js';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { announcementsContract } from '../../backend/api.definition.js';
import AdminAnnouncements from '../../frontend/pages/admin/announcements.vue';
import UserAnnouncementDialog from '../../../users/frontend/components/MkUserAnnouncementEditDialog.vue';

const mocks = vi.hoisted(() => ({ api: vi.fn(), dialog: vi.fn(), alert: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: mocks.api }));
vi.mock('@features/ui/frontend/os.js', () => ({ apiWithDialog: mocks.dialog, alert: mocks.alert, confirm: vi.fn() }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/runtime/frontend/utility/id.js', () => ({ genId: () => 'newsynthetic' }));
vi.mock('@features/ui/frontend/composables/use-mkselect.js', () => ({ useMkSelect: ({ items, initialValue }: { items: unknown[]; initialValue: string }) => ({ model: ref(initialValue), def: items }) }));
vi.mock('@features/ui/frontend/components/MkButton.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: (_props, { slots }) => () => h('button', slots.default?.()) }) };
});
vi.mock('@features/ui/frontend/components/MkFolder.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: (_props, { slots }) => () => h('section', [slots.label?.(), slots.default?.(), slots.footer?.()]) }) };
});
vi.mock('@features/ui/frontend/components/MkModalWindow.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: (_props, { slots, expose }) => { expose({ close: vi.fn() }); return () => h('section', slots.default?.()); } }) };
});
vi.mock('@features/ui/frontend/components/MkInput.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('input', {
		value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
	}) }) };
});
vi.mock('@features/ui/frontend/components/MkTextarea.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('textarea', {
		value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
	}) }) };
});
vi.mock('@features/ui/frontend/components/MkRadios.vue', async () => ({ default: (await import('vue')).defineComponent({ setup: () => () => null }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', async () => ({ default: (await import('vue')).defineComponent({ setup: () => () => null }) }));
vi.mock('@features/ui/frontend/components/MkSelect.vue', async () => ({ default: (await import('vue')).defineComponent({ setup: () => () => null }) }));
vi.mock('@features/ui/frontend/components/MkInfo.vue', async () => ({ default: (await import('vue')).defineComponent({ setup: () => () => null }) }));

const internationalization = createInternationalization({ initialLocale: 'en-US' });
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('en-US'); });
const original: entities.AdminAnnouncementsListResponse[number] = {
	id: 'announcement1', createdAt: '2026-10-14T00:00:00.000Z', updatedAt: null,
	title: 'Synthetic title', text: 'Synthetic text', imageUrl: null, icon: 'info', display: 'normal',
	isActive: true, forExistingUsers: true, silence: true, needConfirmationToRead: true,
	userId: 'recipient1', reads: 9, autoArchiveAt: '2099-11-14T12:34:56.789Z',
};
const unmounts: (() => void)[] = [];
beforeEach(() => {
	mocks.api.mockReset(); mocks.dialog.mockReset(); mocks.alert.mockReset();
	mocks.api.mockResolvedValue([{ ...original }]);
	mocks.dialog.mockResolvedValue({});
});
afterEach(() => { for (const unmount of unmounts.splice(0)) unmount(); });

async function mountScreen(userDialog = false, announcement?: entities.AdminAnnouncementsListResponse[number]): Promise<HTMLDivElement> {
	const element = window.document.createElement('div');
	const app = createApp({ render: () => userDialog
		? h(UserAnnouncementDialog, { user: { id: 'recipient1' } as entities.User, announcement })
		: h(AdminAnnouncements) });
	app.component('PageWithHeader', defineComponent({ props: ['actions'], setup: (props, { slots }) => () => h('main', [
		...(props.actions ?? []).map((action: { text: string; handler: () => void }) => h('button', { onClick: action.handler }, action.text)), slots.default?.(),
	]) }));
	app.component('MkLoading', { render: () => null });
	app.component('MkTime', { render: () => null });
	app.use(internationalization); app.mount(element); unmounts.push(() => app.unmount());
	await nextTick(); await nextTick(); return element;
}

async function click(element: HTMLElement, text: RegExp): Promise<void> {
	const button = Array.from(element.querySelectorAll('button')).find(node => text.test(node.textContent?.trim() ?? ''));
	expect(button).toBeDefined(); button!.click(); await nextTick(); await nextTick();
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Expected native announcement input schema');
	return schema;
}

function updatePayload(): entities.AdminAnnouncementsUpdateRequest {
	expect(mocks.dialog).toHaveBeenCalledOnce();
	const [endpoint, input] = mocks.dialog.mock.calls[0];
	expect(endpoint).toBe('admin/announcements/update');
	expect(input).toEqual(v.parse(requiredSchema(announcementsContract.update['~orpc'].inputSchema), input));
	for (const key of ['reads', 'userId', '_id', 'originalAutoArchiveAt', 'createdAt', 'updatedAt']) expect(input).not.toHaveProperty(key);
	return input;
}

test('admin save projects the actual update contract and preserves the original precise deadline', async () => {
	const screen = await mountScreen(); await click(screen, /^Save$/);
	expect(updatePayload()).toEqual({ id: original.id, title: original.title, text: original.text, imageUrl: null,
		icon: original.icon, display: original.display, isActive: true, forExistingUsers: true, silence: true,
		needConfirmationToRead: true, autoArchiveAt: Date.parse(original.autoArchiveAt!) });
});

test('admin archive keeps editable fields while excluding list and creation metadata', async () => {
	const screen = await mountScreen(); await click(screen, /^Archive announcement/);
	expect(updatePayload()).toMatchObject({ id: original.id, isActive: false, title: original.title, forExistingUsers: true, autoArchiveAt: Date.parse(original.autoArchiveAt!) });
});

test('admin unarchive clears an expired deadline and sends only update fields', async () => {
	mocks.api.mockResolvedValue([{ ...original, isActive: false, autoArchiveAt: '2020-01-01T00:00:01.234Z' }]);
	const screen = await mountScreen(); await click(screen, /^Unarchive$/);
	expect(updatePayload()).toMatchObject({ id: original.id, isActive: true, autoArchiveAt: null, forExistingUsers: true });
});

test('the user dialog updates without the creation-only recipient field', async () => {
	const screen = await mountScreen(true, original); await click(screen, /^Update$/);
	expect(updatePayload()).toMatchObject({ id: original.id, title: original.title, autoArchiveAt: Date.parse(original.autoArchiveAt!) });
});

test('the user dialog keeps the recipient when creating an announcement', async () => {
	const screen = await mountScreen(true);
	const title = screen.querySelector('input')!; title.value = 'Synthetic title'; title.dispatchEvent(new Event('input'));
	const text = screen.querySelector('textarea')!; text.value = 'Synthetic text'; text.dispatchEvent(new Event('input'));
	await nextTick(); await click(screen, /^Create$/);
	expect(mocks.dialog).toHaveBeenCalledOnce();
	const [endpoint, input] = mocks.dialog.mock.calls[0];
	expect(endpoint).toBe('admin/announcements/create');
	expect(v.safeParse(requiredSchema(announcementsContract.create['~orpc'].inputSchema), input).success).toBe(true);
	expect(input).toMatchObject({ userId: 'recipient1', autoArchiveAt: null });
	expect(input).not.toHaveProperty('id');
});
