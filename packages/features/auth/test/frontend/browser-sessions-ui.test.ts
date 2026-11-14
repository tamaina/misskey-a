/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, onMounted, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Sessions from '../../frontend/components/MkBrowserSessions.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { signout } from '../../frontend/signout.js';
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => ({ id: 'owner', token: 'bs_synthetic' }) }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/auth/frontend/signout.js', () => ({ signout: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ confirm: vi.fn(async () => ({ canceled: false })) }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ props: ['disabled'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled }, slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInfo.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('aside', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/form/section.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('section', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkFolder.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => {
	const opened = ref(false);
	return () => h('article', [h('button', { onClick: () => { opened.value = !opened.value; } }, [slots.label?.(), slots.caption?.()]), opened.value ? slots.default?.() : null]);
} }) }));
vi.mock('@features/ui/frontend/components/MkPagination.vue', () => ({ default: defineComponent({ props: ['paginator'], setup: (props, { slots }) => {
	onMounted(() => props.paginator.init());
	return () => h('div', slots.default?.({ items: props.paginator.items.value }));
} }) }));
const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
let app: ReturnType<typeof createApp>;
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('ja-JP'); });
afterEach(() => { app?.unmount(); vi.clearAllMocks(); });

test('shared IP sessions keep separate folders, current/status markers, scoped history and owned revocation', async () => {
	const base = { createdAt: '2026-10-01T00:00:00.000Z', lastUsedAt: '2026-10-02T00:00:00.000Z', lastIp: '192.0.2.1', lastUserAgent: 'Synthetic browser', revokedAt: null };
	vi.mocked(misskeyApi).mockImplementation(async (route, data) => {
		if (route === 'i/sessions') return [{ ...base, id: 'current', current: true }, { ...base, id: 'other', current: false }, { ...base, id: 'revoked', current: false, revokedAt: base.lastUsedAt }] as never;
		if (route === 'i/signin-history') return [{ id: 'history', createdAt: base.createdAt, ip: '192.0.2.2', headers: { 'user-agent': 'Past browser' }, success: true }] as never;
		if (route === 'i/sessions/revoke') { expect(data).toEqual({ sessionId: 'other' }); return undefined as never; }
		throw new Error(`Unexpected synthetic route ${route}`);
	});
	const element = window.document.createElement('div');
	app = createApp(Sessions); app.use(internationalization);
	app.component('MkTime', defineComponent({ props: ['time'], setup: props => () => h('time', String(props.time)) }));
	app.mount(element);
	await vi.waitFor(() => expect(element.querySelectorAll('article')).toHaveLength(3));
	const folders = [...element.querySelectorAll('article')];
	expect(folders[0].textContent).toContain('このログイン · 192.0.2.1 · 有効');
	expect(folders[0].textContent).toContain(base.lastUserAgent);
	expect(folders[0].textContent).toContain(base.lastUsedAt);
	expect(folders[2].textContent).toContain('失効済み');
	expect(misskeyApi).not.toHaveBeenCalledWith('i/signin-history', expect.anything());
	folders[1].querySelector('button')!.click();
	await vi.waitFor(() => expect(folders[1].textContent).toContain('Past browser'));
	expect(misskeyApi).toHaveBeenCalledWith('i/signin-history', expect.objectContaining({ browserSessionId: 'other' }));
	[...folders[1].querySelectorAll('button')].find(button => button.textContent === 'このログインを失効')!.click();
	await vi.waitFor(() => expect(misskeyApi).toHaveBeenCalledWith('i/sessions/revoke', { sessionId: 'other' }));
	expect(signout).not.toHaveBeenCalled();
	folders[2].querySelector('button')!.click();
	await vi.waitFor(() => expect(folders[2].textContent).toContain('Past browser'));
	expect(folders[2].querySelectorAll('button')).toHaveLength(1);
});
