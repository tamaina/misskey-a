/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Settings from '../../frontend/pages/settings/2fa.vue';
import MkDialog from '@features/ui/frontend/components/MkDialog.vue';
import MkRecoveryCodesDialog from '../../frontend/components/MkRecoveryCodesDialog.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { inputText, confirm, popup } from '@features/ui/frontend/os.js';
import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';
import { startAuthentication, startRegistration, WebAuthnAbortService } from '@simplewebauthn/browser';
const fixture = vi.hoisted(() => ({ actor: { id: 'synthetic-owner', token: 'bs_synthetic' } }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => reactive(fixture.actor) }));
vi.mock('@features/auth/frontend/utility/ensure-sudo.js', () => ({ ensureSudo: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: () => true, startAuthentication: vi.fn(), startRegistration: vi.fn(), WebAuthnAbortService: { cancelCeremony: vi.fn() } }));
vi.mock('@features/ui/frontend/components/MkDialog.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/os.js', () => ({ inputText: vi.fn(async () => ({ canceled: false, result: 'Synthetic key' })), confirm: vi.fn(async () => ({ canceled: false })), popup: vi.fn() }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ props: ['disabled', 'type'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled, type: props.type }, slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInfo.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('aside', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/form/section.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('section', [h('h2', slots.label?.()), slots.default?.()]) }) }));
vi.mock('@features/ui/frontend/components/MkInput.vue', () => ({ default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('input', { value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) }) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({ props: ['modelValue', 'disabled'], emits: ['update:modelValue'], setup: (props, { slots, emit }) => () => h('label', [h('input', { type: 'checkbox', checked: props.modelValue, disabled: props.disabled, onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked) }), slots.label?.(), slots.default?.()]) }) }));
vi.mock('@features/ui/frontend/components/MkModalWindow.vue', () => ({ default: defineComponent({ emits: ['close', 'closed'], setup: (_, { slots, expose, emit }) => { expose({ close: () => emit('closed') }); return () => h('div', { role: 'dialog', onClose: () => emit('close') }, slots.default?.()); } }) }));
vi.mock('@features/ui/frontend/components/MkFolder.vue', () => ({ default: defineComponent({ props: ['defaultOpen'], emits: ['opened'], setup: (props, { slots, emit }) => {
	const opened = ref(props.defaultOpen ?? false);
	return () => h('article', [h('button', { onClick: () => { opened.value = !opened.value; if (opened.value) emit('opened'); } }, [slots.label?.(), slots.suffix?.()]), opened.value ? slots.default?.() : null]);
} }) }));
vi.mock('@features/navigation/frontend/components/MkLink.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('a', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkKeyValue.vue', () => ({ default: defineComponent({ props: ['copy'], setup: (props, { slots }) => () => h('div', { 'data-copy': props.copy }, [slots.key?.(), slots.value?.()]) }) }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ hostname: 'synthetic.example', port: '' }));
vi.mock('@features/share/frontend/utility/qr-code.js', () => ({ qrOptions: {} }));
vi.mock('@features/ui/frontend/utility/confetti.js', () => ({ confetti: vi.fn() }));
const slot = defineComponent({ inheritAttrs: false, setup: (_, { slots }) => () => h('div', slots.default?.()) });
const i18nSlot = defineComponent({ props: ['src'], setup: (props, { slots }) => () => h('span', [props.src, slots.t?.()]) });

// popup is generic over the component's emits; a mock receives several dialogs.
function emitPopupEvent(events: unknown, name: string, ...args: unknown[]) {
	if (events === null || typeof events !== 'object') throw new Error('Missing popup events');
	const callback: unknown = Reflect.get(events, name);
	if (typeof callback !== 'function') throw new Error(`Missing popup event: ${name}`);
	callback(...args);
}

function registerGlobals(instance: ReturnType<typeof createApp>) {
	for (const name of ['SearchMarker', 'SearchLabel', 'SearchText']) instance.component(name, slot);
	instance.component('I18n', i18nSlot);
}

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
		if (component === MkDialog) {
			queueMicrotask(() => emitPopupEvent(events, 'done', { canceled: false, result: 'Synthetic key' }));
			return { dispose: vi.fn() } as never;
		}
		const instance = createApp(component as never, { ...props, onClosed: events?.closed, onCancel: events?.cancel }); instance.use(internationalization); registerGlobals(instance); instance.mount(modal);
		return { dispose: () => instance.unmount() } as never;
	});
	vi.clearAllMocks(); fixture.actor.id = 'synthetic-owner'; fixture.actor.token = 'bs_synthetic'; show.value = true;
	vi.mocked(ensureSudo).mockReset().mockResolvedValue(true);
	vi.mocked(confirm).mockReset().mockResolvedValue({ canceled: false });
	vi.mocked(inputText).mockReset().mockResolvedValue({ canceled: false, result: 'Synthetic key' });
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
	app.use(internationalization); registerGlobals(app); app.component('MkTime', defineComponent({ render: () => null })); app.mount(element); mounted = true;
	await vi.waitFor(() => expect(element.textContent).toContain('セキュリティキー・パスキー'));
	click('セキュリティキー・パスキー'); await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	vi.mocked(ensureSudo).mockClear();
});

async function mountFresh(token: string) {
	if (mounted) { app.unmount(); mounted = false; element.remove(); }
	fixture.actor.id = 'synthetic-owner'; fixture.actor.token = token;
	show.value = true;
	vi.mocked(ensureSudo).mockReset().mockResolvedValue(true);
	vi.mocked(misskeyApi).mockClear();
	element = window.document.createElement('div');
	app = createApp(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => show.value ? h(Settings) : h('div', 'Other page') }) }));
	app.use(internationalization); registerGlobals(app); app.component('MkTime', defineComponent({ render: () => null })); app.mount(element); mounted = true;
	await vi.waitFor(() => expect(element.textContent).toContain('セキュリティキー・パスキー'));
}

test.each(['bs_synthetic', '0123456789abcdef'] as const)('opening the page and passkey list does not prompt for sudo with token=%s', async token => {
	await mountFresh(token);
	expect(ensureSudo).not.toHaveBeenCalled();
	expect(calls('i/security/state')).toHaveLength(1);
	click('セキュリティキー・パスキー');
	await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	expect(ensureSudo).not.toHaveBeenCalled();
	expect(calls('i/security/keys/list')).toHaveLength(1);
});
afterEach(() => { if (mounted) app.unmount(); element.remove(); vi.unstubAllGlobals(); });

function button(text: string) { const value = [...element.querySelectorAll('button')].reverse().find(value => value.textContent?.trim() === text || (text === 'Synthetic key' && value.textContent?.startsWith(text))); expect(value).toBeDefined(); return value!; }

function click(text: string) { button(text).click(); }

function modalButton(text: string) { return [...modal.querySelectorAll('button')].find(button => button.textContent?.trim() === text)!; }

const calls = (route: string) => vi.mocked(misskeyApi).mock.calls.filter(([name]) => name === route);

async function registration() { click('セキュリティキー・パスキーを登録する'); await vi.waitFor(() => expect(modal.textContent).toContain(codes[0])); }

test('registration needs no TOTP or later enable step and displays five recovery codes in the registration flow', async () => {
	await registration(); expect(modal.querySelectorAll('code')).toHaveLength(5); expect(modal.querySelector('[role=dialog]')).not.toBeNull(); expect(element.querySelectorAll('code')).toHaveLength(0);
	await vi.waitFor(() => expect(element.textContent).toContain('パスキーによる多要素認証は有効です。'));
	expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: options }); expect(ensureSudo).toHaveBeenCalledOnce();
	expect(vi.mocked(ensureSudo).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(popup).mock.invocationCallOrder[0]);
	expect(vi.mocked(popup).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(startRegistration).mock.invocationCallOrder[0]);
	expect(modal.querySelector('article')).toBeNull();
	expect(modal.querySelector('aside')?.textContent).toContain('このコードは再表示できません');
	expect([...modal.querySelectorAll('[data-copy]')].map(value => value.getAttribute('data-copy'))).toEqual(codes);
	expect(calls('i/security/passkey/register/start')[0][1]).toEqual({ name: 'Synthetic key' });
	expect(calls('i/security/passkey/register/complete')[0][1]).toEqual({ ticket: 'synthetic-ticket', credential });
	expect(calls('i/security/passkey/mfa/enable')).toHaveLength(0); expect(calls('i/security/passkey/mfa/start')).toHaveLength(0); expect(calls('i/security/totp/start')).toHaveLength(0);
	expect(startAuthentication).not.toHaveBeenCalled();
	expect(element.textContent).not.toContain('パスキーによる多要素認証を有効にする');
	[...modal.querySelectorAll('button')].find(button => button.textContent === '完了')!.click(); await nextTick(); expect(modal.textContent).not.toContain(codes[0]); expect(element.textContent).not.toContain('復旧コードを表示');
});
test.each(['sudo', 'name', 'closed', 'webauthn'] as const)('cancelled %s settles registration and permits retry', async stage => {
	if (stage === 'sudo') vi.mocked(ensureSudo).mockResolvedValueOnce(false);
	if (stage === 'name' || stage === 'closed') {
		vi.mocked(popup).mockImplementationOnce((_component, _props, events) => {
			queueMicrotask(() => stage === 'closed' ? emitPopupEvent(events, 'closed') : emitPopupEvent(events, 'done', { canceled: true }));
			return { dispose: vi.fn() } as never;
		});
	}
	if (stage === 'webauthn') vi.mocked(startRegistration).mockRejectedValueOnce(new DOMException('Canceled', 'NotAllowedError'));
	click('セキュリティキー・パスキーを登録する');
	await nextTick();
	await vi.waitFor(() => expect(button('セキュリティキー・パスキーを登録する').disabled).toBe(false));
	expect(calls('i/security/passkey/register/complete')).toHaveLength(0);
	if (stage === 'sudo') expect(popup).not.toHaveBeenCalled();
	if (stage !== 'webauthn') { expect(startRegistration).not.toHaveBeenCalled(); expect(calls('i/security/passkey/register/start')).toHaveLength(0); }
	await registration();
	expect(calls('i/security/passkey/register/complete')).toHaveLength(1);
});

test('registration waits for sudo before opening the name dialog', async () => {
	let approve!: (value: boolean) => void;
	vi.mocked(ensureSudo).mockReturnValueOnce(new Promise(resolve => { approve = resolve; }));
	click('セキュリティキー・パスキーを登録する');
	await nextTick();
	expect(ensureSudo).toHaveBeenCalledOnce();
	expect(popup).not.toHaveBeenCalled();
	expect(calls('i/security/passkey/register/start')).toHaveLength(0);
	expect(startRegistration).not.toHaveBeenCalled();
	approve(true);
	await vi.waitFor(() => expect(modal.textContent).toContain(codes[0]));
});

test('leaving during registration sudo aborts it and permits retry on return', async () => {
	vi.mocked(ensureSudo).mockImplementationOnce((_isCurrent, signal) => new Promise(resolve => {
		signal!.addEventListener('abort', () => resolve(false), { once: true });
	}));
	click('セキュリティキー・パスキーを登録する');
	await nextTick();
	const signal = vi.mocked(ensureSudo).mock.calls[0][1]!;
	show.value = false; await nextTick();
	expect(signal.aborted).toBe(true);
	expect(popup).not.toHaveBeenCalled();
	expect(startRegistration).not.toHaveBeenCalled();
	show.value = true; await nextTick();
	await vi.waitFor(() => expect(button('セキュリティキー・パスキーを登録する').disabled).toBe(false));
	await registration();
});

test.each(['leave', 'actor', 'token', 'unmount'] as const)('%s disposes pending registration name and rejects late input', async kind => {
	let finish!: () => void;
	const dispose = vi.fn();
	vi.mocked(popup).mockImplementationOnce((_component, _props, events) => {
		finish = () => emitPopupEvent(events, 'done', { canceled: false, result: 'Late name' });
		return { dispose } as never;
	});
	click('セキュリティキー・パスキーを登録する');
	click('セキュリティキー・パスキーを登録する');
	await vi.waitFor(() => expect(popup).toHaveBeenCalledOnce());
	expect(ensureSudo).toHaveBeenCalledOnce();
	if (kind === 'leave') {
		show.value = false;
		await nextTick();
	} else if (kind === 'unmount') {
		app.unmount();
		mounted = false;
	} else if (kind === 'actor') {
		reactive(fixture.actor).id = 'replacement-owner';
	} else {
		reactive(fixture.actor).token = 'replacement-token';
	}
	await nextTick();
	expect(dispose).toHaveBeenCalledOnce();
	finish(); await nextTick();
	expect(calls('i/security/passkey/register/start')).toHaveLength(0);
	expect(startRegistration).not.toHaveBeenCalled();
	if (kind === 'leave') {
		show.value = true; await nextTick();
		await vi.waitFor(() => expect(button('セキュリティキー・パスキーを登録する').disabled).toBe(false));
		await registration();
	}
});

test.each(['leave', 'actor'] as const)('%s clears registration recovery codes', async kind => {
	await registration();
	if (kind === 'leave') { show.value = false; await nextTick(); show.value = true; await nextTick(); } else reactive(fixture.actor).id = 'replacement-owner';
	await nextTick(); expect(modal.textContent).not.toContain(codes[0]);
});
test.each(['leave', 'actor'] as const)('%s cancels native registration and prevents delayed completion', async kind => {
	let release!: (value: never) => void; vi.mocked(startRegistration).mockReturnValue(new Promise(resolve => { release = resolve; })); click('セキュリティキー・パスキーを登録する');
	await vi.waitFor(() => expect(startRegistration).toHaveBeenCalledOnce());
	if (kind === 'leave') { show.value = false; await nextTick(); show.value = true; await nextTick(); } else reactive(fixture.actor).id = 'replacement-owner';
	await nextTick(); expect(WebAuthnAbortService.cancelCeremony).toHaveBeenCalledOnce();
	release(credential as never); await nextTick(); expect(calls('i/security/passkey/register/complete')).toHaveLength(0);
	if (kind === 'leave') {
		await vi.waitFor(() => expect(button('セキュリティキー・パスキーを登録する').disabled).toBe(false));
		vi.mocked(startRegistration).mockResolvedValue(credential as never);
		await registration();
	}
});
test('authenticator Signal API runs only after owned removal has been accepted', async () => {
	const signal = vi.fn(async () => undefined); vi.stubGlobal('PublicKeyCredential', { signalUnknownCredential: signal });
	click('Synthetic key'); await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	let accept!: () => void; vi.mocked(misskeyApi).mockImplementationOnce(() => new Promise<void>(resolve => { accept = resolve; }) as never);
	click('登録を解除'); await vi.waitFor(() => expect(calls('i/security/passkey/remove')).toHaveLength(1)); expect(signal).not.toHaveBeenCalled();
	accept(); await vi.waitFor(() => expect(signal).toHaveBeenCalledOnce()); expect(signal).toHaveBeenCalledWith({ rpId: window.location.hostname, credentialId: 'synthetic-key' });
});

test('registration and key removal have no session revocation warning', async () => {
	expect(element.textContent).not.toContain('パスワード変更では、他の端末のログインが無効になります。');
	expect(element.textContent).not.toContain('他の端末のログインやログイントークンは無効になりません。');
	expect(element.textContent).not.toContain('他の端末はサインアウトします');
	button('セキュリティキー・パスキーを登録する').click();
	await vi.waitFor(() => expect(popup).toHaveBeenCalledWith(MkDialog, expect.objectContaining({ text: 'キーの名前を入力' }), expect.anything()));
	expect(element.textContent).not.toContain('パスキーの登録・削除');
	await vi.waitFor(() => expect(misskeyApi).toHaveBeenCalledWith('i/security/passkey/register/complete', expect.anything()));
	button('Synthetic key').click();
	await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	button('登録を解除').click();
	await vi.waitFor(() => expect(confirm).toHaveBeenCalledOnce());
	expect(vi.mocked(confirm).mock.calls[0][0].text).toContain('このパスキーを削除しますか');
	expect(vi.mocked(confirm).mock.calls[0][0].text).not.toMatch(/サインアウト|この端末以外|他の端末/);
});

test.each([false, true])('passwordless permits adding keys with passwordLoginDisabled=%s', async disabled => {
	show.value = false; await nextTick();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...state, passwordlessEnabled: true, passwordLoginDisabled: disabled } as never);
	show.value = true;
	await vi.waitFor(() => expect(button('セキュリティキー・パスキーを登録する').disabled).toBe(false));
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

test('passwordless enabling on a native token confirms identity first so a session can be issued', async () => {
	await mountFresh('0123456789abcdef');
	vi.mocked(misskeyApi).mockImplementation(async route => {
		if (route === 'i/security/passkey/passwordless/start') return { ticket: 'enable-ticket', options: { ...options, userVerification: 'required' } } as never;
		if (route === 'i/security/state') return { ...state, passwordlessEnabled: true } as never;
		return undefined as never;
	});
	vi.mocked(ensureSudo).mockClear();
	const toggle = element.querySelector<HTMLInputElement>('input[type=checkbox]')!;
	toggle.checked = true; toggle.dispatchEvent(new Event('change'));
	await vi.waitFor(() => expect(calls('i/security/passkey/passwordless/complete')).toHaveLength(1));
	expect(ensureSudo).toHaveBeenCalledOnce();
	expect(vi.mocked(ensureSudo).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(startAuthentication).mock.invocationCallOrder[0]);
	expect(startAuthentication).toHaveBeenCalledExactlyOnceWith({ optionsJSON: { ...options, userVerification: 'required' } });
});

test.each([[true, false], [false, true], [true, true], [false, false]] as const)('recovery regeneration follows upstream controls with passkey MFA=%s and TOTP=%s', async (passkeyMfaEnabled, totpEnabled) => {
	show.value = false; await nextTick();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...state, passkeyMfaEnabled, totpEnabled } as never);
	show.value = true; await nextTick(); await nextTick();
	const buttons = [...element.querySelectorAll('button')].filter(button => button.textContent === '復旧コードを再生成');
	expect(buttons).toHaveLength(passkeyMfaEnabled || totpEnabled ? 1 : 0);
	if (passkeyMfaEnabled || totpEnabled) {
		const regenerate = buttons[0];
		await vi.waitFor(() => expect(regenerate.disabled).toBe(false));
		expect(element.querySelector('input[type=checkbox]')!.compareDocumentPosition(regenerate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(element.querySelector('article')!.compareDocumentPosition(regenerate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	}
});

test('regeneration confirms invalidation and shows newly issued codes only in the modal', async () => {
	await registration(); [...modal.querySelectorAll('button')].find(button => button.textContent === '完了')!.click(); await nextTick();
	vi.mocked(misskeyApi).mockImplementation(async route => route === 'i/security/recovery-codes' ? { backupCodes: ['new-synthetic-code'] } as never : { ...state, passkeyMfaEnabled: true } as never);
	vi.mocked(ensureSudo).mockClear(); vi.mocked(confirm).mockClear(); vi.mocked(popup).mockClear();
	click('復旧コードを再生成');
	await vi.waitFor(() => expect(modal.textContent).toContain('new-synthetic-code'));
	expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('以前の復旧コードは使えなくなります') }));
	expect(ensureSudo).toHaveBeenCalledOnce(); expect(confirm).toHaveBeenCalledOnce();
	expect(vi.mocked(confirm).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(ensureSudo).mock.invocationCallOrder[0]);
	const regenerateIndex = vi.mocked(misskeyApi).mock.calls.findIndex(([route]) => route === 'i/security/recovery-codes');
	expect(vi.mocked(confirm).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(misskeyApi).mock.invocationCallOrder[regenerateIndex]);
	expect(calls('i/security/recovery-codes')).toHaveLength(1);
	expect(calls('i/security/recovery-codes')[0][1]).toEqual({ regenerate: true });
	expect(popup).toHaveBeenCalledExactlyOnceWith(MkRecoveryCodesDialog, { codes: ['new-synthetic-code'] }, expect.anything());
	expect(modal.querySelector('[role=dialog]')).not.toBeNull();
	expect(modal.querySelectorAll('code')).toHaveLength(1);
	[...modal.querySelectorAll('button')].find(button => button.textContent === '完了')!.click(); await nextTick();
	expect(modal.textContent).not.toContain('new-synthetic-code');
	expect(element.textContent).not.toContain('new-synthetic-code'); expect(element.textContent).not.toContain('復旧コードを表示');
});

test('first TOTP completion shows new codes in the same modal', async () => {
	vi.mocked(misskeyApi).mockImplementation(async route => {
		if (route === 'i/security/totp/start') return { secret: 'synthetic-totp-secret', url: 'otpauth://synthetic' } as never;
		if (route === 'i/security/totp/complete') return { backupCodes: codes } as never;
		if (route === 'i/security/state') return { ...state, totpEnabled: true } as never;
		return undefined as never;
	});
	click('認証アプリの設定を開始');
	await vi.waitFor(() => expect(modal.textContent).toContain('アプリを起動'));
	modalButton('続ける').click();
	await vi.waitFor(() => expect(modal.querySelector('input')).not.toBeNull());
	const input = modal.querySelector<HTMLInputElement>('input')!; input.value = '123456'; input.dispatchEvent(new Event('input')); await nextTick();
	modalButton('続ける').click();
	await vi.waitFor(() => expect(modal.querySelectorAll('code')).toHaveLength(5));
	expect(calls('i/security/totp/complete')[0][1]).toEqual({ token: '123456' });
	expect(element.textContent).not.toContain(codes[0]);
	expect(modal.querySelector('article')).toBeNull();
	expect(modal.querySelector('aside')?.textContent).toContain('コード');
	expect([...modal.querySelectorAll('[data-copy]')].map(value => value.getAttribute('data-copy'))).toEqual(codes);
	expect(modalButton('ダウンロード')).toBeDefined();
	modalButton('完了').click(); await nextTick();
	expect(modal.textContent).not.toContain(codes[0]);
});

test('passwordless disabling uses sudo only and does not launch a passkey ceremony', async () => {
	const toggle = element.querySelector<HTMLInputElement>('input[type=checkbox]')!;
	toggle.checked = false; toggle.dispatchEvent(new Event('change'));
	await vi.waitFor(() => expect(calls('i/security/passkey/passwordless')).toHaveLength(1));
	expect(calls('i/security/passkey/passwordless')[0][1]).toEqual({ enabled: false });
	expect(ensureSudo).toHaveBeenCalledOnce(); expect(startAuthentication).not.toHaveBeenCalled();
});

test.each([[false, 0], [false, 1], [true, 1], [true, 0]] as const)('MFA buttons reflect enabled=%s and key count=%s', async (enabled, count) => {
	show.value = false; await nextTick();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...state, passkeyMfaEnabled: enabled, passkeyCount: count } as never);
	show.value = true; await nextTick(); await nextTick();
	const labels = [...element.querySelectorAll('button')].map(button => button.textContent);
	expect(labels.includes('パスキーによる多要素認証を有効にする')).toBe(!enabled && count > 0);
	expect(labels.includes('パスキーによる多要素認証を無効にする')).toBe(enabled);
});

test.each([false, true])('explicit MFA enable confirms before sudo, showing only new codes=%s', async issueCodes => {
	vi.mocked(misskeyApi).mockImplementation(async route => {
		if (route === 'i/security/passkey/mfa/enable') return { backupCodes: issueCodes ? codes : [] } as never;
		if (route === 'i/security/state') return { ...state, passkeyMfaEnabled: true } as never;
		return undefined as never;
	});
	click('パスキーによる多要素認証を有効にする');
	await vi.waitFor(() => expect(element.textContent).toContain('パスキーによる多要素認証は有効です。'));
	expect(ensureSudo).toHaveBeenCalledOnce(); expect(confirm).toHaveBeenCalledOnce();
	expect(vi.mocked(confirm).mock.calls[0][0].text).not.toContain('この端末以外のログインはすべて無効になります');
	expect(vi.mocked(confirm).mock.calls[0][0].text).toContain('パスキーによる多要素認証を有効にしますか');
	expect(calls('i/security/passkey/mfa/enable')[0][1]).toEqual({ acknowledged: true });
	expect(vi.mocked(confirm).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(ensureSudo).mock.invocationCallOrder[0]);
	expect(vi.mocked(confirm).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(misskeyApi).mock.invocationCallOrder.at(-2)!);
	expect(startAuthentication).not.toHaveBeenCalled(); expect(calls('i/security/passkey/mfa/start')).toHaveLength(0);
	if (issueCodes) {
		expect(modal.querySelectorAll('code')).toHaveLength(5); expect(popup).toHaveBeenCalledOnce();
		[...modal.querySelectorAll('button')].find(button => button.textContent === '完了')!.click(); await nextTick();
		expect(modal.textContent).not.toContain(codes[0]);
	} else expect(popup).not.toHaveBeenCalled();
	expect(element.textContent).not.toContain('復旧コードを表示');
});

test.each(['sudo', 'confirm'] as const)('cancelled %s prevents explicit MFA enable', async kind => {
	if (kind === 'sudo') vi.mocked(ensureSudo).mockResolvedValueOnce(false);
	else vi.mocked(confirm).mockResolvedValueOnce({ canceled: true });
	click('パスキーによる多要素認証を有効にする');
	await vi.waitFor(() => expect(confirm).toHaveBeenCalledOnce()); await nextTick();
	expect(calls('i/security/passkey/mfa/enable')).toHaveLength(0); expect(popup).not.toHaveBeenCalled();
	if (kind === 'confirm') expect(ensureSudo).not.toHaveBeenCalled();
	else expect(ensureSudo).toHaveBeenCalledOnce();
});

test('explicit MFA disable keeps sudo and confirmation without a session revocation warning', async () => {
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...state, passkeyMfaEnabled: true } as never);
	show.value = false; await nextTick(); show.value = true; await nextTick();
	await vi.waitFor(() => expect(element.textContent).toContain('パスキーによる多要素認証は有効です。'));
	click('パスキーによる多要素認証を無効にする');
	await vi.waitFor(() => expect(calls('i/security/passkey/mfa/disable')).toHaveLength(1));
	expect(ensureSudo).toHaveBeenCalledOnce();
	expect(confirm).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'warning', text: expect.not.stringMatching(/サインアウト|この端末以外|他の端末/) }));
	expect(vi.mocked(confirm).mock.calls[0][0].text).toContain('この認証方法を無効にしますか');
	expect(calls('i/security/passkey/mfa/disable')[0][1]).toEqual({ acknowledged: true });
	expect(vi.mocked(confirm).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(ensureSudo).mock.invocationCallOrder[0]);
	expect(startAuthentication).not.toHaveBeenCalled();
});

test.each([false, true])('TOTP removal keeps sudo and operation warning with passkey MFA=%s without session revocation warning', async passkeyMfaEnabled => {
	show.value = false; await nextTick();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...state, totpEnabled: true, passkeyMfaEnabled } as never);
	show.value = true;
	await vi.waitFor(() => expect(element.textContent).toContain('登録を解除'));
	click('登録を解除');
	await vi.waitFor(() => expect(calls('i/security/totp/remove')).toHaveLength(1));
	expect(ensureSudo).toHaveBeenCalledOnce();
	expect(confirm).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'warning', text: expect.stringContaining(passkeyMfaEnabled ? '認証アプリを削除しますか' : 'この認証方法を無効にしますか') }));
	expect(vi.mocked(confirm).mock.calls[0][0].text).not.toMatch(/サインアウト|この端末以外|他の端末/);
	expect(calls('i/security/totp/remove')[0][1]).toEqual({ confirmDisableMfa: true });
});

test('password-login disable keeps sudo, recovery warning and UV ceremony without session revocation warning', async () => {
	show.value = false; await nextTick();
	vi.mocked(misskeyApi).mockImplementation(async route => {
		if (route === 'i/security/state') return { ...state, passwordlessEnabled: true } as never;
		if (route === 'i/security/password-login/disable/start') return { ticket: 'disable-ticket', options: { ...options, userVerification: 'required' } } as never;
		return undefined as never;
	});
	show.value = true;
	await vi.waitFor(() => expect(element.textContent).toContain('パスワード'));
	click('パスワード'); await nextTick();
	await vi.waitFor(() => expect(button('パスワードによるログインを無効にする').disabled).toBe(false));
	click('パスワードによるログインを無効にする');
	await vi.waitFor(() => expect(calls('i/security/password-login/disable/complete')).toHaveLength(1));
	expect(ensureSudo).toHaveBeenCalledOnce(); expect(confirm).toHaveBeenCalledOnce();
	const text = vi.mocked(confirm).mock.calls[0][0].text;
	expect(text).toContain('パスワードによるログインを無効にしますか');
	expect(text).toContain('パスキーを失った場合は確認済みメールへのパスワード再設定が必要です');
	expect(text).not.toMatch(/他の端末|この端末以外|サインアウト/);
	expect(startAuthentication).toHaveBeenCalledExactlyOnceWith({ optionsJSON: { ...options, userVerification: 'required' } });
	expect(calls('i/security/password-login/disable/complete')[0][1]).toEqual({ ticket: 'disable-ticket', credential });
});

const dialogActions = [
	{ label: 'パスキーによる多要素認証を有効にする', route: 'i/security/passkey/mfa/enable', input: false, mfa: false },
	{ label: 'パスキーによる多要素認証を無効にする', route: 'i/security/passkey/mfa/disable', input: false, mfa: true },
	{ label: '登録を解除', route: 'i/security/passkey/remove', input: false, mfa: true },
	{ label: '登録を解除', route: 'i/security/totp/remove', input: false, mfa: true },
	{ label: 'パスワードによるログインを無効にする', route: 'i/security/password-login/disable/start', input: false, mfa: true },
	{ label: '復旧コードを再生成', route: 'i/security/recovery-codes', input: false, mfa: true },
	{ label: '名前を変更', route: 'i/security/passkey/rename', input: true, mfa: true },
];

async function prepareDialogAction(action: typeof dialogActions[number]) {
	show.value = false; await nextTick();
	const implementation = vi.mocked(misskeyApi).getMockImplementation()!;
	vi.mocked(misskeyApi).mockImplementation((route, ...args) => route === 'i/security/state'
		? Promise.resolve({ ...state, passkeyMfaEnabled: action.mfa, totpEnabled: true, passwordlessEnabled: true }) as never
		: implementation(route, ...args));
	show.value = true; await nextTick();
	await vi.waitFor(() => expect(button('セキュリティキー・パスキーを登録する').disabled).toBe(false));
	click('セキュリティキー・パスキー'); await nextTick();
	click('セキュリティキー・パスキー');
	await vi.waitFor(() => expect(element.textContent).toContain('Synthetic key'));
	click('Synthetic key'); await nextTick();
	if (action.route === 'i/security/totp/remove') { click('Synthetic key'); await nextTick(); }
	if (action.route.startsWith('i/security/password-login')) { click('パスワード'); await nextTick(); }
	vi.mocked(ensureSudo).mockClear(); vi.mocked(misskeyApi).mockClear();
}

test.each(dialogActions)('$label runs its dialog before sudo and the API', async action => {
	await prepareDialogAction(action);
	click(action.label);
	await vi.waitFor(() => expect(calls(action.route)).toHaveLength(1));
	const dialog = vi.mocked(action.input ? inputText : confirm);
	expect(dialog).toHaveBeenCalledOnce(); expect(ensureSudo).toHaveBeenCalledOnce();
	expect(dialog.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(ensureSudo).mock.invocationCallOrder[0]);
	const index = vi.mocked(misskeyApi).mock.calls.findIndex(([route]) => route === action.route);
	expect(vi.mocked(ensureSudo).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(misskeyApi).mock.invocationCallOrder[index]);
});

for (const cancel of ['dialog', 'sudo'] as const) {
	test.each(dialogActions)(`$label stops after cancelled ${cancel}`, async action => {
		await prepareDialogAction(action);
		if (cancel === 'sudo') vi.mocked(ensureSudo).mockResolvedValueOnce(false);
		else if (action.input) vi.mocked(inputText).mockResolvedValueOnce({ canceled: true, result: undefined });
		else vi.mocked(confirm).mockResolvedValueOnce({ canceled: true });
		click(action.label); await nextTick();
		if (cancel === 'sudo') await vi.waitFor(() => expect(ensureSudo).toHaveBeenCalledOnce());
		await vi.waitFor(() => expect(button(action.label).disabled).toBe(false));
		expect(action.input ? inputText : confirm).toHaveBeenCalledOnce();
		if (cancel === 'dialog') expect(ensureSudo).not.toHaveBeenCalled();
		else expect(ensureSudo).toHaveBeenCalledOnce();
		expect(misskeyApi).not.toHaveBeenCalled();
		expect(startRegistration).not.toHaveBeenCalled(); expect(startAuthentication).not.toHaveBeenCalled();
	});
}

for (const input of [false, true]) {
	test.each(['leave', 'actor', 'token'] as const)(`%s while ${input ? 'name input' : 'confirmation'} is open prevents sudo and submission`, async kind => {
		let release!: () => void;
		if (input) vi.mocked(inputText).mockImplementationOnce(() => new Promise(resolve => { release = () => resolve({ canceled: false, result: 'Delayed name' }); }));
		else vi.mocked(confirm).mockImplementationOnce(() => new Promise(resolve => { release = () => resolve({ canceled: false }); }));
		if (input) { click('Synthetic key'); await nextTick(); }
		const label = input ? '名前を変更' : 'パスキーによる多要素認証を有効にする';
		vi.mocked(misskeyApi).mockClear();
		click(label); click(label);
		await nextTick(); expect(input ? inputText : confirm).toHaveBeenCalledOnce();
		if (kind === 'leave') { show.value = false; await nextTick(); show.value = true; await nextTick(); } else if (kind === 'actor') reactive(fixture.actor).id = 'replacement-owner';
		else reactive(fixture.actor).token = 'replacement-token';
		await nextTick(); vi.mocked(misskeyApi).mockClear();
		release(); await nextTick(); await nextTick();
		expect(ensureSudo).not.toHaveBeenCalled(); expect(misskeyApi).not.toHaveBeenCalled();
	});
}

async function openTotpCodeStep() {
	click('認証アプリの設定を開始');
	await vi.waitFor(() => expect(modal.textContent).toContain('アプリを起動'));
	modalButton('続ける').click();
	await vi.waitFor(() => expect(modal.querySelector('input')).not.toBeNull());
	const input = modal.querySelector<HTMLInputElement>('input')!;
	input.value = '123456'; input.dispatchEvent(new Event('input')); await nextTick();
}

function totpResponses() {
	vi.mocked(misskeyApi).mockImplementation(async route => {
		if (route === 'i/security/totp/start') return { secret: 'synthetic-secret', url: 'otpauth://totp/Synthetic?secret=synthetic-secret' } as never;
		if (route === 'i/security/totp/complete') return { backupCodes: [] } as never;
		if (route === 'i/security/state') return { ...state, totpEnabled: true } as never;
		return undefined as never;
	});
}

test('upstream composition has an initially open TOTP folder, then keys, then passwordless', () => {
	const text = element.textContent!;
	expect(element.querySelector('h2')?.textContent).toBe('二要素認証');
	expect(text.indexOf('認証アプリの設定を開始')).toBeLessThan(text.indexOf('セキュリティキー・パスキー'));
	expect(text.indexOf('セキュリティキー・パスキー')).toBeLessThan(text.indexOf('パスワードレスログイン'));
	expect(button('セキュリティキー・パスキーを登録する').compareDocumentPosition(button('Synthetic key')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	expect(text).toContain('最後の使用:');
});

test('TOTP wizard completion preserves existing recovery codes without displaying them again', async () => {
	totpResponses(); await openTotpCodeStep();
	modalButton('続ける').click();
	await vi.waitFor(() => expect(modal.textContent).toContain('設定が完了しました'));
	expect(modal.querySelectorAll('code')).toHaveLength(0);
	expect(modal.textContent).not.toContain('バックアップコード');
	expect(ensureSudo).toHaveBeenCalledTimes(2);
});

test.each(['leave', 'actor', 'token'] as const)('%s discards a delayed TOTP completion and closes its wizard', async kind => {
	totpResponses(); await openTotpCodeStep();
	let complete!: (value: never) => void;
	vi.mocked(misskeyApi).mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
	modalButton('続ける').click();
	await vi.waitFor(() => expect(calls('i/security/totp/complete')).toHaveLength(1));
	if (kind === 'leave') { show.value = false; await nextTick(); } else if (kind === 'actor') reactive(fixture.actor).id = 'replacement-owner';
	else reactive(fixture.actor).token = 'replacement-token';
	await nextTick(); vi.mocked(misskeyApi).mockClear();
	complete({ backupCodes: codes } as never); await nextTick(); await nextTick();
	expect(modal.textContent).toBe(''); expect(misskeyApi).not.toHaveBeenCalled();
});

test('closing the TOTP wizard during sudo prevents completing enrollment', async () => {
	totpResponses(); await openTotpCodeStep();
	let release!: (value: boolean) => void;
	vi.mocked(ensureSudo).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
	modalButton('続ける').click();
	await vi.waitFor(() => expect(ensureSudo).toHaveBeenCalledTimes(2));
	modal.querySelector('[role=dialog]')!.dispatchEvent(new Event('close'));
	await nextTick();
	release(true); await nextTick(); await nextTick();
	expect(calls('i/security/totp/complete')).toHaveLength(0);
	expect(modal.textContent).toBe('');
});

test('TOTP API failure is visible inside the wizard and permits retry', async () => {
	totpResponses(); await openTotpCodeStep();
	vi.mocked(misskeyApi).mockRejectedValueOnce(new Error('Invalid code'));
	modalButton('続ける').click();
	await vi.waitFor(() => expect(modal.textContent).toContain('操作を完了できませんでした'));
	expect(modalButton('続ける').disabled).toBe(false);
	modalButton('続ける').click();
	await vi.waitFor(() => expect(modal.textContent).toContain('設定が完了しました'));
});

test('new TOTP recovery codes remain visible if the following state refresh fails', async () => {
	totpResponses(); await openTotpCodeStep();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ backupCodes: codes } as never).mockRejectedValueOnce(new Error('Refresh failed'));
	modalButton('続ける').click();
	await vi.waitFor(() => expect(modal.querySelectorAll('code')).toHaveLength(5));
	expect(modal.textContent).toContain(codes[0]);
});
