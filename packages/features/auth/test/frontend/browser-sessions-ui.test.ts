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
	return () => h('article', [h('button', { onClick: () => { opened.value = !opened.value; } }, [slots.icon?.(), h('strong', slots.label?.()), slots.caption?.(), h('small', slots.suffix?.())]), opened.value ? slots.default?.() : null]);
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
	const base = { createdAt: '2026-10-01T00:00:00.000Z', lastUsedAt: '2026-10-02T00:00:00.000Z', lastIp: '192.0.2.1', lastUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/145.0', revokedAt: null };
	vi.mocked(misskeyApi).mockImplementation(async (route, data) => {
		if (route === 'i/sessions') return [{ ...base, id: 'other', current: false }, { ...base, id: 'current', current: true }, { ...base, id: 'revoked', current: false, revokedAt: base.lastUsedAt }] as never;
		if (route === 'i/session-ips') return [{ id: 'history', createdAt: base.createdAt, lastSeenAt: base.lastUsedAt, ip: '192.0.2.2' }] as never;
		if (route === 'i/sessions/revoke') { expect(data).toEqual({ sessionId: 'other' }); return undefined as never; }
		throw new Error(`Unexpected synthetic route ${route}`);
	});
	const element = window.document.createElement('div');
	app = createApp(Sessions); app.use(internationalization);
	app.component('MkTime', defineComponent({ props: ['time'], setup: props => () => h('time', String(props.time)) }));
	app.mount(element);
	await vi.waitFor(() => expect(element.querySelectorAll('article')).toHaveLength(3));
	const folders = [...element.querySelectorAll('article')];
	expect(folders[0].querySelector('strong')?.textContent).toBe('Firefox 145 / Windows');
	expect(folders[0].querySelector('small')?.textContent).toBe('このデバイス');
	expect(folders[1].querySelector('small')?.textContent).toBe('有効');
	expect(folders[0].querySelector('i')?.className).toBe('ti ti-device-desktop');
	expect(folders[0].textContent).toContain('192.0.2.1');
	expect(folders[0].textContent).not.toContain(base.lastUserAgent);
	expect(folders[0].textContent).toContain(base.lastUsedAt);
	expect(folders[2].textContent).toContain('失効済み');
	expect(misskeyApi).not.toHaveBeenCalledWith('i/signin-history', expect.anything());
	folders[1].querySelector('button')!.click();
	await vi.waitFor(() => expect(folders[1].textContent).toContain('192.0.2.2'));
	expect(folders[1].textContent).toContain(base.lastUserAgent);
	expect(folders[1].textContent).toContain('初回確認:');
	expect(folders[1].textContent).toContain('最終確認:');
	expect(folders[1].textContent).toContain(base.createdAt);
	expect(folders[1].textContent).toContain(base.lastUsedAt);
	expect(misskeyApi).toHaveBeenCalledWith('i/session-ips', expect.objectContaining({ sessionId: 'other' }));
	[...folders[1].querySelectorAll('button')].find(button => button.textContent === 'このログインを失効')!.click();
	await vi.waitFor(() => expect(misskeyApi).toHaveBeenCalledWith('i/sessions/revoke', { sessionId: 'other' }));
	await vi.waitFor(() => expect(folders[1].querySelector('small')?.textContent).toBe('失効済み'));
	expect(folders[1].querySelectorAll('button')).toHaveLength(1);
	expect(signout).not.toHaveBeenCalled();
	folders[2].querySelector('button')!.click();
	await vi.waitFor(() => expect(folders[2].textContent).toContain('192.0.2.2'));
	expect(folders[2].querySelectorAll('button')).toHaveLength(1);
});
