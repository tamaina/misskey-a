/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Settings from '../../frontend/components/MkSecuritySettings.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { inputText, confirm, popup } from '@features/ui/frontend/os.js';
import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';
import { startAuthentication, startRegistration, WebAuthnAbortService } from '@simplewebauthn/browser';
const fixture = vi.hoisted(() => ({ actor: { id: 'synthetic-owner', token: 'bs_synthetic' } }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => reactive(fixture.actor) }));
vi.mock('@features/auth/frontend/utility/ensure-sudo.js', () => ({ ensureSudo: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: () => true, startAuthentication: vi.fn(), startRegistration: vi.fn(), WebAuthnAbortService: { cancelCeremony: vi.fn() } }));
vi.mock('@features/ui/frontend/os.js', () => ({ inputText: vi.fn(async () => ({ canceled: false, result: 'Synthetic key' })), confirm: vi.fn(async () => ({ canceled: false })), popup: vi.fn() }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ props: ['disabled', 'type'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled, type: props.type }, slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInfo.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('aside', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/form/section.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('section', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInput.vue', () => ({ default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('input', { value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) }) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({ props: ['modelValue', 'disabled'], emits: ['update:modelValue'], setup: (props, { slots, emit }) => () => h('label', [h('input', { type: 'checkbox', checked: props.modelValue, disabled: props.disabled, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked) }), slots.default?.()]) }) }));
vi.mock('@features/ui/frontend/components/MkModalWindow.vue', () => ({ default: defineComponent({ emits: ['closed'], setup: (_, { slots, expose, emit }) => { expose({ close: () => emit('closed') }); return () => h('div', { role: 'dialog' }, slots.default?.()); } }) }));
vi.mock('@features/ui/frontend/components/MkFolder.vue', () => ({ default: defineComponent({ emits: ['opened'], setup: (_, { slots, emit }) => {
	const opened = ref(false);
	return () => h('article', [h('button', { onClick: () => { opened.value = !opened.value; if (opened.value) emit('opened'); } }, [slots.label?.(), slots.suffix?.()]), opened.value ? slots.default?.() : null]);
} }) }));
const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
const state = { totpEnabled: false, passkeyMfaEnabled: false, passkeyCount: 1, passwordlessEnabled: false, passwordLoginDisabled: false, hasVerifiedRecoveryEmail: true, recoveryCodesRemaining: 5 };
const options = { challenge: 'synthetic', rpId: 'synthetic.example', userVerification: 'preferred' as const };
const codes = ['synthetic-1', 'synthetic-2', 'synthetic-3', 'synthetic-4', 'synthetic-5'];
const credential = { id: 'synthetic-key', rawId: 'synthetic-key', type: 'public-key', response: { clientDataJSON: 'AQID', attestationObject: 'AQID', transports: ['usb'] }, clientExtensionResults: {} };
let app: ReturnType<typeof createApp>; let element: HTMLDivElement; let mounted = false;
const modal = window.document.createElement('div');
const show = ref(true);
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('ja-JP'); });
beforeEach(async () => {
	vi.mocked(popup).mockImplementation((component, props, events) => {
		const instance = createApp(component as never, { ...props, onClosed: events?.closed }); instance.use(internationalization); instance.mount(modal);
		return { dispose: () => instance.unmount() } as never;
	});
	vi.clearAllMocks(); fixture.actor.id = 'synthetic-owner'; fixture.actor.token = 'bs_synthetic'; show.value = true;
	vi.mocked(ensureSudo).mockReset().mockResolvedValue(true);
	vi.mocked(startAuthentication).mockReset().mockResolvedValue(credential as never); vi.mocked(startRegistration).mockReset().mockResolvedValue(credential as never);
	let registered = false;
	vi.mocked(misskeyApi).mockReset().mockImplementation(async route => {
		if (route === 'i/security/state') return { ...state, passkeyMfaEnabled: registered } as never;
		if (route === 'i/security/keys/list') return [{ id: 'synthetic-key', name: 'Synthetic key', lastUsedAt: new Date().toISOString() }] as never;
		if (route === 'i/security/passkey/register/complete') { registered = true; return { id: 'synthetic-key', name: 'Synthetic key', backupCodes: codes } as never; }
		if (route === 'i/security/passkey/register/start') return { ticket: 'synthetic-ticket', options } as never;
		return undefined as never;
	});
	element = window.document.createElement('div');
	app = createApp(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => show.value ? h(Settings) : h('div', 'Other page') }) }));
	app.use(internationalization); app.component('MkTime', defineComponent({ render: () => null })); app.mount(element); mounted = true;
	await vi.waitFor(() => expect(element.textContent).toContain('パスキーによる多要素認証は無効です。'));
	click('セキュリティキー・パスキー'); await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	vi.mocked(ensureSudo).mockClear();
});
afterEach(() => { if (mounted) app.unmount(); element.remove(); vi.unstubAllGlobals(); });

function button(text: string) { const value = [...element.querySelectorAll('button')].find(value => value.textContent === text); expect(value).toBeDefined(); return value!; }

function click(text: string) { button(text).click(); }

const calls = (route: string) => vi.mocked(misskeyApi).mock.calls.filter(([name]) => name === route);

async function registration() { click('パスキーを登録'); await vi.waitFor(() => expect(modal.textContent).toContain(codes[0])); }

test('registration needs no TOTP or later enable step and displays five recovery codes in the registration flow', async () => {
	await registration(); expect(modal.querySelectorAll('code')).toHaveLength(5); expect(modal.querySelector('[role=dialog]')).not.toBeNull(); expect(element.querySelectorAll('code')).toHaveLength(0);
	await vi.waitFor(() => expect(element.textContent).toContain('パスキーによる多要素認証は有効です。'));
	expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: options }); expect(ensureSudo).toHaveBeenCalledOnce();
	expect(calls('i/security/passkey/register/start')[0][1]).toEqual({ name: 'Synthetic key' });
	expect(calls('i/security/passkey/register/complete')[0][1]).toEqual({ ticket: 'synthetic-ticket', credential });
	expect(calls('i/security/passkey/mfa/start')).toHaveLength(0); expect(calls('i/security/totp/start')).toHaveLength(0);
	expect(startAuthentication).not.toHaveBeenCalled();
	expect(element.textContent).not.toContain('パスキーによる多要素認証を有効にする');
	[...modal.querySelectorAll('button')].find(button => button.textContent === '保存して閉じる')!.click(); await nextTick(); expect(modal.textContent).not.toContain(codes[0]); expect(element.textContent).not.toContain('復旧コードを表示');
});
test('cancelled common sudo cannot start registration', async () => {
	vi.mocked(ensureSudo).mockResolvedValue(false); click('パスキーを登録'); await nextTick();
	expect(calls('i/security/passkey/register/start')).toHaveLength(0); expect(startRegistration).not.toHaveBeenCalled();
});
test.each(['leave', 'actor'] as const)('%s clears registration recovery codes', async kind => {
	await registration();
	if (kind === 'leave') { show.value = false; await nextTick(); show.value = true; await nextTick(); } else reactive(fixture.actor).id = 'replacement-owner';
	await nextTick(); expect(modal.textContent).not.toContain(codes[0]);
});
test.each(['leave', 'actor'] as const)('%s cancels native registration and prevents delayed completion', async kind => {
	let release!: (value: never) => void; vi.mocked(startRegistration).mockReturnValue(new Promise(resolve => { release = resolve; })); click('パスキーを登録');
	await vi.waitFor(() => expect(startRegistration).toHaveBeenCalledOnce());
	if (kind === 'leave') { show.value = false; await nextTick(); show.value = true; await nextTick(); } else reactive(fixture.actor).id = 'replacement-owner';
	await nextTick(); expect(WebAuthnAbortService.cancelCeremony).toHaveBeenCalledOnce();
	release(credential as never); await nextTick(); expect(calls('i/security/passkey/register/complete')).toHaveLength(0);
});
test('authenticator Signal API runs only after owned removal has been accepted', async () => {
	const signal = vi.fn(async () => undefined); vi.stubGlobal('PublicKeyCredential', { signalUnknownCredential: signal });
	click('Synthetic key'); await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	let accept!: () => void; vi.mocked(misskeyApi).mockImplementationOnce(() => new Promise<void>(resolve => { accept = resolve; }) as never);
	click('削除'); await vi.waitFor(() => expect(calls('i/security/passkey/remove')).toHaveLength(1)); expect(signal).not.toHaveBeenCalled();
	accept(); await vi.waitFor(() => expect(signal).toHaveBeenCalledOnce()); expect(signal).toHaveBeenCalledWith({ rpId: window.location.hostname, credentialId: 'synthetic-key' });
});

test('registration has no revocation warning while removal confirmation keeps it', async () => {
	expect(element.textContent).toContain('この端末以外のログインはすべて無効になります');
	button('パスキーを登録').click();
	await vi.waitFor(() => expect(inputText).toHaveBeenCalledOnce());
	expect(vi.mocked(inputText).mock.calls[0][0]).not.toHaveProperty('text');
	expect(element.textContent).not.toContain('パスキーの登録・削除');
	await vi.waitFor(() => expect(misskeyApi).toHaveBeenCalledWith('i/security/passkey/register/complete', expect.anything()));
	button('Synthetic key').click();
	await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	button('削除').click();
	await vi.waitFor(() => expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('この端末以外のログインはすべて無効になります') })));
});

test.each([false, true])('passwordless permits adding keys with passwordLoginDisabled=%s', async disabled => {
	show.value = false; await nextTick();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...state, passwordlessEnabled: true, passwordLoginDisabled: disabled } as never);
	show.value = true;
	await vi.waitFor(() => expect(button('パスキーを登録').disabled).toBe(false));
	expect(element.textContent).not.toContain('単独ログインを無効にしてから登録してください。');
	await registration(); expect(calls('i/security/passkey/register/complete')).toHaveLength(1);
});

test('passwordless enabling supplies exactly one UV ceremony without a separate sudo dialog', async () => {
	vi.mocked(misskeyApi).mockImplementation(async route => {
		if (route === 'i/security/passkey/passwordless/start') return { ticket: 'enable-ticket', options: { ...options, userVerification: 'required' } } as never;
		if (route === 'i/security/state') return { ...state, passwordlessEnabled: true } as never;
		return undefined as never;
	});
	const toggle = element.querySelector<HTMLInputElement>('input[type=checkbox]')!;
	toggle.checked = true; toggle.dispatchEvent(new Event('change'));
	await vi.waitFor(() => expect(calls('i/security/passkey/passwordless/complete')).toHaveLength(1));
	expect(startAuthentication).toHaveBeenCalledExactlyOnceWith({ optionsJSON: { ...options, userVerification: 'required' } });
	expect(ensureSudo).not.toHaveBeenCalled();
	expect(calls('i/security/passkey/passwordless/complete')[0][1]).toEqual({ ticket: 'enable-ticket', credential });
});

test('regeneration confirms invalidation and shows newly issued codes only in the modal', async () => {
	await registration(); [...modal.querySelectorAll('button')].find(button => button.textContent === '保存して閉じる')!.click(); await nextTick();
	vi.mocked(misskeyApi).mockImplementation(async route => route === 'i/security/recovery-codes' ? { backupCodes: ['new-synthetic-code'] } as never : { ...state, passkeyMfaEnabled: true } as never);
	click('復旧コードを再生成');
	await vi.waitFor(() => expect(modal.textContent).toContain('new-synthetic-code'));
	expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('以前の復旧コードは使えなくなります') }));
	expect(calls('i/security/recovery-codes')[0][1]).toEqual({ regenerate: true });
	expect(element.textContent).not.toContain('new-synthetic-code'); expect(element.textContent).not.toContain('復旧コードを表示');
});

test('first TOTP completion shows new codes in the same modal', async () => {
	vi.mocked(misskeyApi).mockImplementation(async route => {
		if (route === 'i/security/totp/start') return { secret: 'synthetic-totp-secret', url: 'otpauth://synthetic' } as never;
		if (route === 'i/security/totp/complete') return { backupCodes: codes } as never;
		if (route === 'i/security/state') return { ...state, totpEnabled: true } as never;
		return undefined as never;
	});
	click('認証アプリを設定');
	await vi.waitFor(() => expect(element.querySelector('form input')).not.toBeNull());
	const input = element.querySelector<HTMLInputElement>('form input')!; input.value = '123456'; input.dispatchEvent(new Event('input')); await nextTick();
	element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
	await vi.waitFor(() => expect(modal.querySelectorAll('code')).toHaveLength(5));
	expect(calls('i/security/totp/complete')[0][1]).toEqual({ token: '123456' });
	expect(element.textContent).not.toContain(codes[0]);
});

test('passwordless disabling uses sudo only and does not launch a passkey ceremony', async () => {
	const toggle = element.querySelector<HTMLInputElement>('input[type=checkbox]')!;
	toggle.checked = false; toggle.dispatchEvent(new Event('change'));
	await vi.waitFor(() => expect(calls('i/security/passkey/passwordless')).toHaveLength(1));
	expect(calls('i/security/passkey/passwordless')[0][1]).toEqual({ enabled: false });
	expect(ensureSudo).toHaveBeenCalledOnce(); expect(startAuthentication).not.toHaveBeenCalled();
});
