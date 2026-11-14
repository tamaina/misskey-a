/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, onMounted, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Sessions from '../../frontend/components/MkBrowserSessions.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
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
	return () => h('div', [slots.default?.({ items: props.paginator.items.value }), h('button', { onClick: () => props.paginator.fetchOlder() }, 'older')]);
} }) }));
const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
let app: ReturnType<typeof createApp>;
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('ja-JP'); });
afterEach(() => { app?.unmount(); vi.clearAllMocks(); });

test('one newest-first signin list renders session folders, UA folders and plain rows with scoped revocation', async () => {
	const base = { createdAt: '2026-10-01T00:00:00.000Z', lastUsedAt: '2026-10-02T00:00:00.000Z', lastIp: '192.0.2.1', lastUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/145.0', revokedAt: null };
	vi.mocked(misskeyApi).mockImplementation(async (route, data) => {
		if (route === 'i/signin-history') {
			expect(data).toMatchObject({ latestPerSession: true });
			if (data && 'untilId' in data) {
				expect(data.untilId).toBe('signin1');
				return [{ id: 'signin0', createdAt: base.createdAt, ip: '192.0.2.8', headers: {}, success: false, browserSessionId: null, browserSession: null }] as never;
			}
			return [
				...[
					{ ...base, id: 'other', current: false },
					{ ...base, id: 'current', current: true },
					{ ...base, id: 'revoked', current: false, revokedAt: base.lastUsedAt },
				].map((session, index) => ({ id: `signin${5 - index}`, createdAt: base.createdAt, ip: '192.0.2.3', headers: {}, success: true, browserSessionId: session.id, browserSession: session })),
				{ id: 'signin2', createdAt: base.createdAt, ip: '192.0.2.5', headers: { 'user-agent': base.lastUserAgent }, success: false, browserSessionId: null, browserSession: null },
				{ id: 'signin1', createdAt: base.createdAt, ip: '192.0.2.6', headers: {}, success: true, browserSessionId: null, browserSession: null },
			] as never;
		}
		if (route === 'i/session-ips') return [{ id: 'history', createdAt: base.createdAt, lastSeenAt: base.lastUsedAt, ip: '192.0.2.2' }] as never;
		if (route === 'i/sessions/revoke') { expect(data).toEqual({ sessionId: 'other' }); return undefined as never; }
		throw new Error(`Unexpected synthetic route ${route}`);
	});
	const element = window.document.createElement('div');
	app = createApp(Sessions); app.use(internationalization);
	app.component('MkTime', defineComponent({ props: ['time'], setup: props => () => h('time', String(props.time)) }));
	app.directive('panel', {});
	app.mount(element);
	await vi.waitFor(() => expect(element.querySelectorAll('article')).toHaveLength(4));
	const folders = [...element.querySelectorAll('article')];
	expect(folders[0].querySelector('strong')?.textContent).toBe('Firefox 145 / Windows');
	expect(folders[0].querySelector('small')?.textContent).toBe('有効');
	expect(folders[1].querySelector('small')?.textContent).toBe('このデバイス');
	expect(folders[0].querySelector('i')?.className).toBe('ti ti-device-desktop');
	expect(folders[0].textContent).toContain('192.0.2.1');
	expect(folders[0].textContent).not.toContain(base.lastUserAgent);
	expect(folders[0].textContent).toContain(base.lastUsedAt);
	expect(folders[2].textContent).toContain('失効済み');
	expect(misskeyApi).toHaveBeenCalledWith('i/signin-history', expect.objectContaining({ limit: 5, latestPerSession: true }));
	expect(misskeyApi).not.toHaveBeenCalledWith('i/sessions', expect.anything());
	expect(element.querySelector('table')).toBeNull();
	expect(element.textContent).toContain('192.0.2.6');
	const plain = [...element.querySelectorAll('code')].find(code => code.textContent === '192.0.2.6')!.parentElement!;
	expect(plain.closest('article')).toBeNull();
	expect(plain.querySelector('button')).toBeNull();
	expect(plain.textContent).toContain('成功');
	expect(folders[3].querySelector('small')?.textContent).toBe('失敗');
	folders[3].querySelector('button')!.click();
	await vi.waitFor(() => expect(folders[3].textContent).toContain(base.lastUserAgent));
	expect(folders[3].querySelectorAll('button')).toHaveLength(1);
	expect(misskeyApi).not.toHaveBeenCalledWith('i/session-ips', expect.anything());
	folders[0].querySelector('button')!.click();
	await vi.waitFor(() => expect(folders[0].textContent).toContain('192.0.2.2'));
	expect(folders[0].textContent).toContain(base.lastUserAgent);
	expect(folders[0].textContent).toContain('初回確認:');
	expect(folders[0].textContent).toContain('最終確認:');
	expect(folders[0].textContent).toContain(base.createdAt);
	expect(folders[0].textContent).toContain(base.lastUsedAt);
	expect(misskeyApi).toHaveBeenCalledWith('i/session-ips', expect.objectContaining({ sessionId: 'other' }));
	const revokeButton = [...folders[0].querySelectorAll('button')].find(button => button.textContent === 'このログインを失効')!;
	vi.mocked(os.confirm).mockResolvedValueOnce({ canceled: true });
	revokeButton.click();
	await vi.waitFor(() => expect(os.confirm).toHaveBeenCalledOnce());
	expect(misskeyApi).not.toHaveBeenCalledWith('i/sessions/revoke', expect.anything());
	await vi.waitFor(() => expect(revokeButton.disabled).toBe(false));
	revokeButton.click();
	await vi.waitFor(() => expect(misskeyApi).toHaveBeenCalledWith('i/sessions/revoke', { sessionId: 'other' }));
	await vi.waitFor(() => expect(folders[0].querySelector('small')?.textContent).toBe('失効済み'));
	expect(folders[0].querySelectorAll('button')).toHaveLength(2);
	expect(os.confirm).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
	expect(signout).not.toHaveBeenCalled();
	folders[2].querySelector('button')!.click();
	await vi.waitFor(() => expect(folders[2].textContent).toContain('192.0.2.2'));
	expect(folders[2].querySelectorAll('button')).toHaveLength(2); // header plus IP-history pagination
	[...element.querySelectorAll('button')].filter(button => button.textContent === 'older').at(-1)!.click();
	await vi.waitFor(() => expect(element.textContent).toContain('192.0.2.8'));
	expect(element.querySelectorAll('article')).toHaveLength(4);
	const failedPlain = [...element.querySelectorAll('code')].find(code => code.textContent === '192.0.2.8')!.parentElement!;
	expect(failedPlain.closest('article')).toBeNull();
	expect(failedPlain.textContent).toContain('失敗');
	folders[1].querySelector('button')!.click();
	await vi.waitFor(() => expect(folders[1].textContent).toContain('このログインからサインアウト'));
	[...folders[1].querySelectorAll('button')].find(button => button.textContent === 'このログインからサインアウト')!.click();
	await vi.waitFor(() => expect(signout).toHaveBeenCalledOnce());
});
