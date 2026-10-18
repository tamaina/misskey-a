/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Settings from '../../frontend/components/MkSecuritySettings.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';
import { startAuthentication, startRegistration, WebAuthnAbortService } from '@simplewebauthn/browser';
const fixture = vi.hoisted(() => ({ actor: { id: 'synthetic-owner', token: 'bs_synthetic' } }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => reactive(fixture.actor) }));
vi.mock('@features/auth/frontend/utility/ensure-sudo.js', () => ({ ensureSudo: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: () => true, startAuthentication: vi.fn(), startRegistration: vi.fn(), WebAuthnAbortService: { cancelCeremony: vi.fn() } }));
vi.mock('@features/ui/frontend/os.js', () => ({ inputText: vi.fn(async () => ({ canceled: false, result: 'Synthetic key' })), confirm: vi.fn(async () => ({ canceled: false })) }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ props: ['disabled', 'type'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled, type: props.type }, slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInfo.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('aside', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/form/section.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('section', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInput.vue', () => ({ default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('input', { value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) }) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({ props: ['modelValue', 'disabled'], emits: ['update:modelValue'], setup: (props, { slots, emit }) => () => h('label', [h('input', { type: 'checkbox', checked: props.modelValue, disabled: props.disabled, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked) }), slots.default?.()]) }) }));
const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
const state = { totpEnabled: false, passkeyMfaEnabled: false, passkeyCount: 1, passwordlessEnabled: false, passwordLoginDisabled: false, hasVerifiedRecoveryEmail: true, recoveryCodesRemaining: 5 };
const options = { challenge: 'synthetic', rpId: 'synthetic.example', userVerification: 'preferred' as const };
const codes = ['synthetic-1', 'synthetic-2', 'synthetic-3', 'synthetic-4', 'synthetic-5'];
const credential = { id: 'synthetic-key', rawId: 'synthetic-key', type: 'public-key', response: { clientDataJSON: 'AQID', attestationObject: 'AQID', transports: ['usb'] }, clientExtensionResults: {} };
let app: ReturnType<typeof createApp>; let element: HTMLDivElement; let mounted = false;
const show = ref(true);
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('ja-JP'); });
beforeEach(async () => {
	vi.clearAllMocks(); fixture.actor.id = 'synthetic-owner'; fixture.actor.token = 'bs_synthetic'; show.value = true;
	vi.mocked(ensureSudo).mockReset().mockResolvedValue(true);
	vi.mocked(startAuthentication).mockReset().mockResolvedValue(credential as never); vi.mocked(startRegistration).mockReset().mockResolvedValue(credential as never);
	vi.mocked(misskeyApi).mockReset().mockImplementation(async route => {
		if (route === 'i/security/state') return state as never;
		if (route === 'i/security/keys/list') return [{ id: 'synthetic-key', name: 'Synthetic key', lastUsedAt: new Date().toISOString() }] as never;
		if (route === 'i/security/passkey/mfa/start') return { ticket: 'synthetic-ticket', options, backupCodes: codes } as never;
		if (route === 'i/security/passkey/register/start') return { ticket: 'synthetic-ticket', options } as never;
		return undefined as never;
	});
	element = document.createElement('div');
	app = createApp(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => show.value ? h(Settings) : h('div', 'Other page') }) }));
	app.use(internationalization); app.component('MkTime', defineComponent({ render: () => null })); app.mount(element); mounted = true;
	await vi.waitFor(() => expect(element.textContent).toContain('パスキーによる多要素認証は無効です。'));
});
afterEach(() => { if (mounted) app.unmount(); element.remove(); vi.unstubAllGlobals(); });
function button(text: string) { const value = [...element.querySelectorAll('button')].find(value => value.textContent === text); expect(value).toBeDefined(); return value!; }
function click(text: string) { button(text).click(); }
const calls = (route: string) => vi.mocked(misskeyApi).mock.calls.filter(([name]) => name === route);
async function activation() { click('パスキーによる多要素認証を有効にする'); await vi.waitFor(() => expect(element.textContent).toContain(codes[0])); }

test('registration needs no TOTP setup and never silently activates MFA', async () => {
	click('パスキーを登録'); await vi.waitFor(() => expect(calls('i/security/passkey/register/complete')).toHaveLength(1));
	expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: options }); expect(ensureSudo).toHaveBeenCalledOnce();
	expect(calls('i/security/passkey/register/start')[0][1]).toEqual({ name: 'Synthetic key' });
	expect(calls('i/security/passkey/mfa/start')).toHaveLength(0); expect(calls('i/security/totp/start')).toHaveLength(0);
});
test('activation displays five codes and requires explicit acknowledgement before native proof', async () => {
	await activation(); expect(element.querySelectorAll('code')).toHaveLength(5);
	expect(button('パスキーで確認して有効にする').disabled).toBe(true); expect(startAuthentication).not.toHaveBeenCalled();
	const checkbox = element.querySelector<HTMLInputElement>('input[type=checkbox]')!; checkbox.checked = true; checkbox.dispatchEvent(new Event('change')); await nextTick();
	click('パスキーで確認して有効にする'); await vi.waitFor(() => expect(calls('i/security/passkey/mfa/complete')).toHaveLength(1));
	expect(calls('i/security/passkey/mfa/complete')[0][1]).toEqual({ ticket: 'synthetic-ticket', credential, recoveryAcknowledged: true });
	await vi.waitFor(() => expect(element.textContent).not.toContain(codes[0]));
});
test('cancelled common sudo cannot start registration', async () => {
	vi.mocked(ensureSudo).mockResolvedValue(false); click('パスキーを登録'); await nextTick();
	expect(calls('i/security/passkey/register/start')).toHaveLength(0); expect(startRegistration).not.toHaveBeenCalled();
});
test.each(['leave', 'actor'] as const)('%s clears displayed codes and prevents a delayed native completion', async kind => {
	await activation(); const checkbox = element.querySelector<HTMLInputElement>('input[type=checkbox]')!; checkbox.checked = true; checkbox.dispatchEvent(new Event('change')); await nextTick();
	let release!: (value: never) => void; vi.mocked(startAuthentication).mockReturnValue(new Promise(resolve => { release = resolve; })); click('パスキーで確認して有効にする');
	await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce());
	if (kind === 'leave') { show.value = false; await nextTick(); show.value = true; await nextTick(); } else reactive(fixture.actor).id = 'replacement-owner';
	await nextTick(); expect(element.textContent).not.toContain(codes[0]); expect(WebAuthnAbortService.cancelCeremony).toHaveBeenCalledOnce();
	release(credential as never); await nextTick(); expect(calls('i/security/passkey/mfa/complete')).toHaveLength(0);
});
test('authenticator Signal API runs only after owned removal has been accepted', async () => {
	const signal = vi.fn(async () => undefined); vi.stubGlobal('PublicKeyCredential', { signalUnknownCredential: signal });
	click('登録済みのパスキーを表示'); await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	let accept!: () => void; vi.mocked(misskeyApi).mockImplementationOnce(() => new Promise<void>(resolve => { accept = resolve; }) as never);
	click('削除'); await vi.waitFor(() => expect(calls('i/security/passkey/remove')).toHaveLength(1)); expect(signal).not.toHaveBeenCalled();
	accept(); await vi.waitFor(() => expect(signal).toHaveBeenCalledOnce()); expect(signal).toHaveBeenCalledWith({ rpId: location.hostname, credentialId: 'synthetic-key' });
});
