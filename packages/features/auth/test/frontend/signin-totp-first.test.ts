/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createApp, defineComponent, h, nextTick, onMounted } from 'vue';
import Signin from '../../frontend/components/MkSignin.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { login } from '../../frontend/accounts.js';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

vi.mock('vue', async original => {
	const vue = await original<typeof import('vue')>();
	return { ...vue, Transition: vue.defineComponent({ setup(_, { slots }) { return () => slots.default?.(); } }) };
});

const state = vi.hoisted(() => ({ handlers: {} as Record<string, (value?: unknown) => void>, requests: [] as unknown[], captcha: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/auth/frontend/accounts.js', () => ({ login: vi.fn() }));
vi.mock('@features/runtime/frontend/i18n.js', () => ({ i18n: { ts: { signinWithPasskey: 'Use passkey' } } }));
vi.mock('@features/moderation/frontend/utility/show-suspended-dialog.js', () => ({ showSuspendedDialog: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ alert: vi.fn() }));
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: vi.fn() }));
vi.mock('@features/auth/frontend/components/MkSignin.input.vue', () => ({ default: defineComponent({
	emits: ['usernameSubmitted', 'passkeyClick'], setup(_, { emit }) {
		state.handlers.username = value => emit('usernameSubmitted', value);
		state.handlers.standalone = () => emit('passkeyClick');
		return () => h('div', { 'data-page': 'input' });
	},
}) }));
vi.mock('@features/auth/frontend/components/MkSignin.password.vue', () => ({ default: defineComponent({
	props: ['user', 'needCaptcha'], emits: ['passwordSubmitted'], setup(props, { emit, expose }) {
		state.handlers.password = value => emit('passwordSubmitted', value);
		expose({ resetCaptcha: state.captcha });
		return () => h('div', { 'data-page': 'password', 'data-captcha': String(props.needCaptcha) });
	},
}) }));
vi.mock('@features/auth/frontend/components/MkSignin.totp.vue', () => ({ default: defineComponent({
	emits: ['totpSubmitted'], setup(_, { emit }) {
		state.handlers.totp = value => emit('totpSubmitted', value);
		return () => h('div', { 'data-page': 'totp' });
	},
}) }));
vi.mock('@features/auth/frontend/components/MkSignin.passkey.vue', () => ({ default: defineComponent({
	props: ['credentialRequest', 'isPerformingPasswordlessLogin'], emits: ['done', 'useTotp'], setup(props, { emit }) {
		onMounted(() => state.requests.push(props.credentialRequest));
		state.handlers.credential = value => emit('done', value);
		state.handlers.cancel = () => emit('useTotp');
		return () => h('div', { 'data-page': 'passkey', 'data-passwordless': String(props.isPerformingPasswordlessLogin) });
	},
}) }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({
	props: ['disabled'], setup(props, { attrs, slots }) { return () => h('button', { ...attrs, disabled: props.disabled }, slots.default?.()); },
}) }));

let app: ReturnType<typeof createApp> | undefined;
let element: HTMLDivElement;
const emitted = vi.fn();
const errors: unknown[] = [];
let expectedError: unknown;
const option = (challenge: string) => ({ challenge, rpId: 'synthetic.example', userVerification: 'required' });
const finished = { finished: true, i: 'synthetic-session', id: 'synthetic-user' };
const credential = { id: 'synthetic-key', rawId: 'AA', type: 'public-key', response: { clientDataJSON: 'AA', authenticatorData: 'AA', signature: 'AA' }, clientExtensionResults: {} };
const pw = { password: 'synthetic-password', captcha: { hCaptchaResponse: 'h', mCaptchaResponse: 'm', reCaptchaResponse: 'r', turnstileResponse: 't', testcaptchaResponse: 'test' } };

function mount(autoSet = false) {
	app = createApp(Signin, { autoSet, onLogin: emitted });
	app.use(createInternationalization({ initialLocale: 'en-US' }));
	app.config.errorHandler = error => { errors.push(error); };
	app.component('MkLoading', defineComponent({ render: () => h('span', 'Waiting') }));
	app.mount(element);
}

async function settle() {
	for (let i = 0; i < 20; i++) await Promise.resolve();
	await nextTick();
}

async function passwordPath() {
	state.handlers.username('synthetic'); await settle();
	state.handlers.password(pw); await settle();
}

function page() { return element.querySelector('[data-page]')?.getAttribute('data-page'); }

function fallback() { return element.querySelector('button') as HTMLButtonElement | null; }

beforeEach(() => {
	vi.resetAllMocks(); state.handlers = {}; state.requests = []; errors.length = 0; expectedError = undefined;
	vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
	vi.mocked(misskeyApi).mockResolvedValueOnce({ username: 'synthetic' } as never)
		.mockResolvedValueOnce({ finished: false, next: 'password' } as never)
		.mockResolvedValueOnce({ finished: false, next: 'passkey', authRequest: option('initial') } as never);
	element = window.document.createElement('div'); window.document.body.append(element);
});
afterEach(() => {
	app?.unmount(); app = undefined; element.remove(); vi.useRealTimers();
	expect(errors).toEqual(expectedError === undefined ? [] : [expectedError]);
});

test('password path shows TOTP without mounting passkey or relying on public MFA flags', async () => {
	mount(); await passwordPath();
	expect(page()).toBe('totp'); expect(state.requests).toEqual([]); expect(fallback()?.disabled).toBe(false);
	expect(misskeyApi).toHaveBeenNthCalledWith(3, 'signin-flow', { username: 'synthetic', password: pw.password, 'hcaptcha-response': 'h', 'm-captcha-response': 'm', 'g-recaptcha-response': 'r', 'turnstile-response': 't', 'testcaptcha-response': 'test' });
});

test.each(['123456', 'A'.repeat(32)])('TOTP/backup token is sent unchanged and login emits only server success: %s', async token => {
	mount(true); await passwordPath();
	vi.mocked(misskeyApi).mockResolvedValueOnce(finished as never);
	state.handlers.totp(token); await settle();
	expect(misskeyApi).toHaveBeenNthCalledWith(4, 'signin-flow', { username: 'synthetic', password: pw.password, token });
	expect(emitted).toHaveBeenCalledWith(finished); expect(login).toHaveBeenCalledWith('synthetic-session');
});

test('explicit passkey fallback obtains fresh challenge and verifies through password path', async () => {
	mount(); await passwordPath();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ finished: false, next: 'passkey', authRequest: option('fresh') } as never);
	fallback()!.click(); await settle();
	expect(state.requests).toEqual([option('fresh')]); expect(page()).toBe('passkey');
	vi.mocked(misskeyApi).mockResolvedValueOnce(finished as never);
	state.handlers.credential(credential); await settle();
	expect(misskeyApi).toHaveBeenLastCalledWith('signin-flow', { username: 'synthetic', password: pw.password, credential });
	expect(emitted).toHaveBeenCalledWith(finished); expect(login).not.toHaveBeenCalled();
});

test('returning from passkey and waiting beyond expiry requests another fresh challenge', async () => {
	mount(); await passwordPath(); vi.useFakeTimers();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ finished: false, next: 'passkey', authRequest: option('fresh-one') } as never);
	fallback()!.click(); await settle(); state.handlers.cancel(); await settle(); expect(page()).toBe('totp');
	await vi.advanceTimersByTimeAsync(120000);
	vi.mocked(misskeyApi).mockResolvedValueOnce({ finished: false, next: 'passkey', authRequest: option('fresh-two') } as never);
	fallback()!.click(); await settle(); expect(state.requests).toEqual([option('fresh-one'), option('fresh-two')]);
	expect(misskeyApi).toHaveBeenCalledTimes(5);
});

test('failed fallback leaves TOTP usable and retry can succeed', async () => {
	mount(); await passwordPath(); expectedError = new Error('Synthetic network failure');
	vi.mocked(misskeyApi).mockRejectedValueOnce(expectedError); vi.spyOn(console, 'error').mockImplementation(() => {});
	fallback()!.click(); await settle(); expect(page()).toBe('totp'); expect(fallback()?.disabled).toBe(false); expect(emitted).not.toHaveBeenCalled();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ finished: false, next: 'passkey', authRequest: option('retry') } as never);
	fallback()!.click(); await settle(); expect(state.requests).toEqual([option('retry')]);
});

test('standalone passwordless remains separate from username/password/TOTP', async () => {
	vi.mocked(misskeyApi).mockReset().mockResolvedValueOnce({ context: 'synthetic-context', option: option('standalone') } as never).mockResolvedValueOnce({ signinResponse: finished } as never);
	mount(); state.handlers.standalone(); await settle(); expect(page()).toBe('passkey');
	expect(element.querySelector('[data-passwordless]')?.getAttribute('data-passwordless')).toBe('true');
	state.handlers.credential(credential); await settle();
	expect(misskeyApi).toHaveBeenNthCalledWith(1, 'signin-with-passkey', {});
	expect(misskeyApi).toHaveBeenNthCalledWith(2, 'signin-with-passkey', { credential, context: 'synthetic-context' });
	expect(emitted).toHaveBeenCalledWith(finished);
});

test('unsupported browser shows TOTP without unavailable fallback', async () => {
	vi.mocked(browserSupportsWebAuthn).mockReturnValue(false); mount(); await passwordPath();
	expect(page()).toBe('totp'); expect(fallback()).toBeNull(); expect(state.requests).toEqual([]);
});

test('TOTP-only server response offers no passkey fallback', async () => {
	vi.mocked(misskeyApi).mockReset().mockResolvedValueOnce({ username: 'synthetic' } as never).mockResolvedValueOnce({ finished: false, next: 'password' } as never).mockResolvedValueOnce({ finished: false, next: 'totp' } as never);
	mount(); await passwordPath(); expect(page()).toBe('totp'); expect(fallback()).toBeNull();
});

test('password-only CAPTCHA route preserves form and completion', async () => {
	vi.mocked(misskeyApi).mockReset().mockResolvedValueOnce({ username: 'synthetic' } as never).mockResolvedValueOnce({ finished: false, next: 'captcha' } as never).mockResolvedValueOnce(finished as never);
	mount(); state.handlers.username('synthetic'); await settle(); expect(element.querySelector('[data-captcha]')?.getAttribute('data-captcha')).toBe('true');
	state.handlers.password(pw); await settle(); expect(emitted).toHaveBeenCalledWith(finished); expect(state.requests).toEqual([]);
});

test('repeated fallback clicks cannot start overlapping challenge requests', async () => {
	mount(); await passwordPath();
	let finish!: (value: never) => void;
	vi.mocked(misskeyApi).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
	const button = fallback()!;
	button.click(); button.click(); await settle();
	expect(misskeyApi).toHaveBeenCalledTimes(4); expect(fallback()?.disabled).toBe(true);
	finish({ finished: false, next: 'passkey', authRequest: option('one-request') } as never);
	await settle(); expect(state.requests).toEqual([option('one-request')]);
});

test('rejected TOTP does not emit login and leaves explicit fallback available', async () => {
	mount(); await passwordPath(); expectedError = { id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f' };
	vi.mocked(misskeyApi).mockRejectedValueOnce(expectedError);
	state.handlers.totp('wrong'); await settle();
	expect(emitted).not.toHaveBeenCalled(); expect(login).not.toHaveBeenCalled(); expect(page()).toBe('totp'); expect(fallback()?.disabled).toBe(false);
});
