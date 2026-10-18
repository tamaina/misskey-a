/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { createApp, defineComponent, h, KeepAlive, nextTick, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import OidcSignin from '../../frontend/components/MkOidcSignin.vue';
import OidcPage from '../../frontend/pages/oidc.vue';
import { oidcApi } from '../../frontend/oidc-api.js';
import { ensureOidcSudo } from '../../frontend/oidc-local-authorization.js';
import { $i } from '../../frontend/i.js';
import { login } from '../../frontend/accounts.js';
import { browserSupportsWebAuthn, startAuthentication, WebAuthnAbortService } from '@simplewebauthn/browser';
vi.mock('@features/ui/frontend/os.js', () => ({ alert: vi.fn() }));
vi.mock('../../frontend/oidc-api.js', () => ({ oidcApi: vi.fn() }));
vi.mock('../../frontend/oidc-local-authorization.js', () => ({ ensureOidcSudo: vi.fn() }));
vi.mock('../../frontend/i.js', async () => { const { reactive } = await import('vue'); return { $i: reactive({ id: 'owner', token: 'bs_owner' }) }; });
vi.mock('../../frontend/accounts.js', () => ({ login: vi.fn() }));
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: vi.fn(() => true), startAuthentication: vi.fn(), WebAuthnAbortService: { cancelCeremony: vi.fn() } }));
vi.mock('@features/instance/frontend/instance.js', () => ({ instance: { serverRules: [], disableRegistration: false, privacyPolicyUrl: null } }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ props: ['disabled'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled }, slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInput.vue', () => ({ default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit, slots }) => () => h('label', [slots.label?.(), h('input', { value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) })]) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit, slots }) => () => h('label', [h('input', { type: 'checkbox', checked: props.modelValue, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked) }), slots.default?.()]) }) }));
vi.mock('../../frontend/components/MkCaptcha.vue', () => ({ default: defineComponent({ setup: () => () => null }) }));
const internationalization = createInternationalization({ initialLocale: 'en-US' });
const show = ref(true); let app: ReturnType<typeof createApp>; let element: HTMLDivElement; let mounted = false;
const ticket = 't'.repeat(43); const errors: unknown[] = [];
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('en-US'); });
beforeEach(() => {
	vi.resetAllMocks(); Object.assign($i!, { id: 'owner', token: 'bs_owner' }); errors.length = 0; show.value = true; history.replaceState(null, '', `/auth/oidc/resume?ticket=${ticket}`);
	vi.mocked(oidcApi).mockResolvedValue({ next: 'login', factors: ['passkey'], options: { challenge: 'synthetic' } } as never);
	vi.mocked(browserSupportsWebAuthn).mockReturnValue(true); vi.mocked(ensureOidcSudo).mockResolvedValue(true); vi.mocked(startAuthentication).mockResolvedValue({ id: 'credential' } as never);
});
afterEach(() => { vi.unstubAllGlobals(); if (mounted) app.unmount(); element?.remove(); expect(errors).toEqual([]); });
function mount(providerId?: string) {
	element = document.createElement('div'); app = createApp(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => show.value ? h(OidcPage, { providerId }) : h('div', 'Other') }) }));
	app.config.errorHandler = error => errors.push(error); app.use(internationalization); app.component('MkA', defineComponent({ setup: (_, { slots }) => () => h('a', slots.default?.()) })); app.mount(element); mounted = true;
}
function click(text: string) { const button = [...element.querySelectorAll('button')].find(node => node.textContent === text); expect(button).toBeDefined(); button!.click(); }
test('existing local MFA is explicit and passes the dedicated external continuation', async () => {
	mount(); await vi.waitFor(() => expect(element.textContent).toContain('登録したパスキーで確認'));
	vi.mocked(oidcApi).mockResolvedValueOnce({ finished: true, id: 'owner', i: 'bs_new' } as never); click('登録したパスキーで確認');
	await vi.waitFor(() => expect(login).toHaveBeenCalledWith('bs_new', '/'));
	expect(oidcApi).toHaveBeenLastCalledWith('oidc/login', { ticket, credential: { id: 'credential' } });
});
test('native cancellation does not complete or fall back to a local password route', async () => {
	mount(); await vi.waitFor(() => expect(element.textContent).toContain('登録したパスキーで確認')); vi.mocked(startAuthentication).mockRejectedValueOnce(new Error('Canceled')); click('登録したパスキーで確認');
	await vi.waitFor(() => expect(element.querySelector('button')!.disabled).toBe(false)); expect(oidcApi).toHaveBeenCalledOnce(); expect(login).not.toHaveBeenCalled();
});
test.each(['unmount', 'keepalive'] as const)('%s discards a delayed native result, including after returning', async mode => {
	mount(); await vi.waitFor(() => expect(element.textContent).toContain('登録したパスキーで確認')); let finish!: (value: Awaited<ReturnType<typeof startAuthentication>>) => void;
	vi.mocked(startAuthentication).mockReturnValueOnce(new Promise(resolve => { finish = resolve; })); click('登録したパスキーで確認'); await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce());
	if (mode === 'unmount') { app.unmount(); mounted = false; } else { show.value = false; await nextTick(); show.value = true; await nextTick(); }
	expect(WebAuthnAbortService.cancelCeremony).toHaveBeenCalledOnce();
	finish({ id: 'late' } as never); await new Promise(resolve => setTimeout(resolve, 10)); expect(oidcApi).toHaveBeenCalledOnce(); expect(login).not.toHaveBeenCalled();
});
test('failed external completion displays retry and never invokes local login automatically', async () => {
	mount(); await vi.waitFor(() => expect(element.textContent).toContain('登録したパスキーで確認')); vi.mocked(oidcApi).mockRejectedValueOnce(new Error('Rejected')); click('登録したパスキーで確認');
	await vi.waitFor(() => expect(element.textContent).toContain('最初からやり直してください')); expect(login).not.toHaveBeenCalled();
});
test('callback removes external authorization code before the async API call', async () => {
	history.replaceState(null, '', `/auth/oidc/callback/provider?state=${ticket}&code=synthetic-code`);
	vi.mocked(oidcApi).mockResolvedValueOnce({ ticket, flow: { next: 'login', factors: [] } } as never); mount('provider');
	await vi.waitFor(() => expect(oidcApi).toHaveBeenCalledWith('oidc/callback', { providerId: 'provider', state: ticket, code: 'synthetic-code' })); expect(window.location.search).not.toContain('code='); expect(login).not.toHaveBeenCalled();
});
test('duplicate callback fields fail before a protocol request', async () => {
	history.replaceState(null, '', `/auth/oidc/callback/provider?state=${ticket}&code=one&code=two`); mount('provider');
	await vi.waitFor(() => expect(element.textContent).toContain('最初からやり直してください')); expect(oidcApi).not.toHaveBeenCalled();
});
test('link confirmation requires explicit agreement before local sudo is requested', async () => {
	vi.mocked(oidcApi).mockResolvedValueOnce({ next: 'link', providerId: 'provider', issuer: 'https://idp.example', subject: 'verified-subject' } as never); mount();
	await vi.waitFor(() => expect(element.textContent).toContain('verified-subject')); click('再認証して連携'); expect(ensureOidcSudo).not.toHaveBeenCalled(); expect(oidcApi).toHaveBeenCalledOnce();
});

test('leaving the linking screen aborts its local sudo dialog and rejects its delayed result', async () => {
	vi.mocked(oidcApi).mockResolvedValueOnce({ next: 'link', providerId: 'provider', issuer: 'https://idp.example', subject: 'verified-subject' } as never);
	let finish!: (value: boolean) => void; vi.mocked(ensureOidcSudo).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
	mount(); await vi.waitFor(() => expect(element.textContent).toContain('verified-subject'));
	const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')!; checkbox.checked = true; checkbox.dispatchEvent(new Event('change')); await nextTick();
	click('再認証して連携'); await vi.waitFor(() => expect(ensureOidcSudo).toHaveBeenCalledOnce());
	const signal = vi.mocked(ensureOidcSudo).mock.calls[0][1]!; expect(signal.aborted).toBe(false);
	show.value = false; await nextTick(); expect(signal.aborted).toBe(true); show.value = true; await nextTick();
	finish(true); await new Promise(resolve => setTimeout(resolve, 10)); expect(oidcApi).toHaveBeenCalledOnce();
});

test.each(['id', 'token'] as const)('actor %s change discards a delayed login result', async field => {
	mount(); await vi.waitFor(() => expect(element.textContent).toContain('登録したパスキーで確認'));
	let complete!: (value: unknown) => void; vi.mocked(oidcApi).mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
	click('登録したパスキーで確認'); await vi.waitFor(() => expect(oidcApi).toHaveBeenCalledTimes(2));
	Object.assign($i!, { [field]: 'changed' }); await nextTick(); complete({ finished: true, id: 'owner', i: 'bs_late' });
	await new Promise(resolve => setTimeout(resolve, 10)); expect(login).not.toHaveBeenCalled();
});

test.each(['id', 'token'] as const)('external start aborts and rejects navigation after actor %s changes', async field => {
	vi.mocked(oidcApi).mockResolvedValueOnce([{ id: 'provider', name: 'Synthetic' }] as never);
	element = document.createElement('div'); app = createApp(OidcSignin); app.config.errorHandler = error => errors.push(error); app.use(internationalization); app.mount(element); mounted = true;
	await vi.waitFor(() => expect(element.textContent).toContain('Synthetic'));
	let complete!: (value: unknown) => void; vi.mocked(oidcApi).mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
	click('外部サービスでログイン: Synthetic'); await vi.waitFor(() => expect(oidcApi).toHaveBeenCalledTimes(2));
	const signal = vi.mocked(oidcApi).mock.calls[1][2]!; expect(signal.aborted).toBe(false);
	Object.assign($i!, { [field]: 'changed' }); expect(signal.aborted).toBe(true);
	const assign = vi.fn(); vi.stubGlobal('window', { location: { assign } }); complete({ url: 'https://idp.example/authorize' });
	await new Promise(resolve => setTimeout(resolve, 10)); expect(assign).not.toHaveBeenCalled();
});
