/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Security from '../../frontend/pages/settings/security.vue';
import * as os from '@features/ui/frontend/os.js';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: vi.fn(() => true), startAuthentication: vi.fn() }));

const account = vi.hoisted(() => ({ twoFactorEnabled: true, token: 'legacy-token', securityKeysList: [] as { id: string }[] }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => reactive(account) }));

vi.mock('@features/ui/frontend/os.js', () => ({
	authenticateDialog: vi.fn(),
	inputText: vi.fn(),
	alert: vi.fn(),
	apiWithDialog: vi.fn(),
	promiseDialog: vi.fn(),
}));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/ui/frontend/utility/paginator.js', () => ({ Paginator: class {} }));
vi.mock('@features/auth/frontend/pages/settings/2fa.vue', () => ({ default: defineComponent({ render: () => null }) }));
vi.mock('@features/ui/frontend/components/MkPagination.vue', () => ({ default: defineComponent({ render: () => null }) }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({
	default: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }),
}));
vi.mock('@features/ui/frontend/components/form/section.vue', () => ({
	default: defineComponent({ setup: (_, { slots }) => () => h('section', slots.default?.()) }),
}));
vi.mock('@features/ui/frontend/components/form/slot.vue', () => ({
	default: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }),
}));
vi.mock('@features/web/frontend/components/MkFeatureBanner.vue', () => ({ default: defineComponent({ render: () => null }) }));

const internationalization = createInternationalization({ initialLocale: 'en-US' });
let app: ReturnType<typeof createApp>;
let element: HTMLDivElement;
let mounted = false;
const showSecurity = ref(true);
const errors: unknown[] = [];
let expectedErrors: unknown[] = [];

beforeAll(async () => {
	await internationalization.ready;
	await internationalization.loadLocale('en-US');
});

beforeEach(() => {
	vi.resetAllMocks();
	errors.length = 0; expectedErrors = [];
	account.twoFactorEnabled = true; account.token = 'legacy-token'; account.securityKeysList = [];
	vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
	vi.mocked(os.promiseDialog).mockImplementation(promise => promise);
	vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: false, result: { password: 'current-password', token: null } });
	vi.mocked(os.inputText)
		.mockResolvedValueOnce({ canceled: false, result: 'current-password' })
		.mockResolvedValue({ canceled: false, result: 'new-password' });
	element = window.document.createElement('div');
	showSecurity.value = true;
	app = createApp(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => showSecurity.value ? h(Security) : h('div', 'Another page') }) }));
	app.config.errorHandler = error => { errors.push(error); };
	app.use(internationalization);
	const slot = defineComponent({ inheritAttrs: false, setup: (_, { slots }) => () => h('div', slots.default?.()) });
	for (const name of ['SearchMarker', 'SearchLabel', 'SearchText']) app.component(name, slot);
	app.component('MkTime', defineComponent({ render: () => null }));
	app.directive('panel', {});
	app.mount(element); mounted = true;
});

afterEach(() => {
	vi.useRealTimers();
	expect(errors).toEqual(expectedErrors);
	if (mounted) app.unmount();
	element.remove();
});

function startChange(fresh = false) {
	const button = [...element.querySelectorAll('button')].find(item => fresh ? item.textContent === 'パスキーでパスワードを変更' : item.textContent === 'Change password');
	expect(button).toBeDefined();
	button!.click();
}

describe('password-change dialogs', () => {
	test('collects the current password before either new-password input and MFA', async () => {
		let finishCurrentPassword!: (value: Awaited<ReturnType<typeof os.inputText>>) => void;
		vi.mocked(os.inputText).mockReset()
			.mockReturnValueOnce(new Promise(resolve => { finishCurrentPassword = resolve; }))
			.mockResolvedValue({ canceled: false, result: 'new-password' });
		startChange();
		expect(os.inputText).toHaveBeenCalledOnce();
		expect(os.inputText).toHaveBeenNthCalledWith(1, { title: 'Password', type: 'password', autocomplete: 'current-password', minLength: 1 });
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		finishCurrentPassword({ canceled: false, result: 'current-password' });
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
		expect(os.inputText).toHaveBeenNthCalledWith(2, { title: 'New password', type: 'password', autocomplete: 'new-password' });
		expect(os.inputText).toHaveBeenNthCalledWith(3, { title: 'Retype new password', type: 'password', autocomplete: 'new-password' });
		expect(os.authenticateDialog).toHaveBeenCalledWith({ currentPassword: 'current-password' });
	});

	test('collects a fresh MFA token only after two minutes of new-password entry', async () => {
		vi.useFakeTimers();
		const startedAt = Date.now();
		let authenticationRequestedAt: number | null = null;
		let finishNewPassword!: (value: Awaited<ReturnType<typeof os.inputText>>) => void;
		vi.mocked(os.inputText).mockReset()
			.mockResolvedValueOnce({ canceled: false, result: 'current-password' })
			.mockReturnValueOnce(new Promise(resolve => { finishNewPassword = resolve; }))
			.mockResolvedValueOnce({ canceled: false, result: 'new-password' });
		vi.mocked(os.authenticateDialog).mockImplementation(async () => {
			authenticationRequestedAt = Date.now();
			return { canceled: false, result: { password: 'current-password', token: '654321' } };
		});
		startChange();
		await vi.advanceTimersByTimeAsync(120000);
		expect(os.inputText).toHaveBeenCalledTimes(2);
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
		finishNewPassword({ canceled: false, result: 'new-password' });
		await vi.advanceTimersByTimeAsync(0);
		expect(os.authenticateDialog).toHaveBeenCalledOnce();
		expect(authenticationRequestedAt).toBe(startedAt + 120000);
		expect(os.apiWithDialog).toHaveBeenCalledWith('i/change-password', {
			currentPassword: 'current-password', token: '654321', newPassword: 'new-password',
		});
	});

	test.each(['123456', 'SYNTHETIC-BACKUP-CODE'])('preserves current credentials and 2FA token %s in the request', async token => {
		vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: false, result: { password: 'current-password', token } });
		startChange();
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
		expect(os.apiWithDialog).toHaveBeenCalledWith('i/change-password', {
			currentPassword: 'current-password', token, newPassword: 'new-password',
		});
		expect(os.alert).not.toHaveBeenCalled();
	});

	test('submits without an MFA dialog when two-factor authentication is disabled', async () => {
		account.twoFactorEnabled = false;
		startChange();
		await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		expect(os.apiWithDialog).toHaveBeenCalledWith('i/change-password', {
			currentPassword: 'current-password', token: null, newPassword: 'new-password',
		});
	});

	test('does not submit when the final MFA dialog is canceled', async () => {
		vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: true, result: undefined });
		startChange();
		for (let i = 0; i < 5; i++) await Promise.resolve();
		expect(os.inputText).toHaveBeenCalledTimes(3);
		expect(os.authenticateDialog).toHaveBeenCalledOnce();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
	});

	test.each([
		{ stage: 1, canceled: true, result: 'current-password' },
		{ stage: 1, canceled: false, result: null },
		{ stage: 1, canceled: false, result: '' },
		{ stage: 2, canceled: true, result: 'new-password' },
		{ stage: 2, canceled: false, result: null },
		{ stage: 3, canceled: true, result: 'new-password' },
		{ stage: 3, canceled: false, result: null },
	])('stops at stage $stage on canceled=$canceled or result=$result', async ({ stage, canceled, result }) => {
		vi.mocked(os.inputText).mockReset();
		if (stage > 1) vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: false, result: 'current-password' });
		if (stage > 2) vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: false, result: 'new-password' });
		vi.mocked(os.inputText).mockResolvedValueOnce(canceled ? { canceled: true, result: undefined } : { canceled: false, result });
		startChange();
		for (let i = 0; i < 5; i++) await Promise.resolve();
		expect(os.inputText).toHaveBeenCalledTimes(stage);
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
		expect(os.alert).not.toHaveBeenCalled();
	});

	test('reports a mismatch before requesting MFA or submitting', async () => {
		vi.mocked(os.inputText).mockReset()
			.mockResolvedValueOnce({ canceled: false, result: 'current-password' })
			.mockResolvedValueOnce({ canceled: false, result: 'new-password' })
			.mockResolvedValueOnce({ canceled: false, result: 'different-password' });
		startChange();
		await vi.waitFor(() => expect(os.alert).toHaveBeenCalledWith({ type: 'error', text: 'The inputs do not match.' }));
		expect(os.authenticateDialog).not.toHaveBeenCalled();
		expect(os.apiWithDialog).not.toHaveBeenCalled();
	});
});

const freshOptions = { challenge: 'synthetic-challenge', rpId: 'synthetic.example', userVerification: 'required' as const };
const freshCredential = { id: 'AQID', rawId: 'AQID', type: 'public-key' as const, response: { clientDataJSON: 'AQID', authenticatorData: 'AQID', signature: 'AQID' }, clientExtensionResults: {} };

function enableFreshPath() {
	Object.assign(reactive(account), { token: 'bs_' + 'x'.repeat(43), securityKeysList: [{ id: 'AQID' }] });
	vi.mocked(os.apiWithDialog).mockResolvedValueOnce({ ticket: 't'.repeat(43), options: freshOptions } as never).mockResolvedValue(undefined as never);
	vi.mocked(startAuthentication).mockResolvedValue(freshCredential);
}

async function startFreshChange() { await nextTick(); startChange(true); }

test('real settings page completes the session-bound password/passkey/API path without a TOTP dialog', async () => {
	enableFreshPath(); let release!: (value: typeof freshCredential) => void;
	vi.mocked(startAuthentication).mockReturnValue(new Promise(resolve => { release = resolve; }));
	await startFreshChange(); await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce());
	expect(os.apiWithDialog).toHaveBeenCalledExactlyOnceWith('i/change-password/passkey/start', { currentPassword: 'current-password' });
	expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: freshOptions }); expect(os.authenticateDialog).not.toHaveBeenCalled();
	release(freshCredential);
	await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledTimes(2));
	expect(os.apiWithDialog).toHaveBeenLastCalledWith('i/change-password/passkey/complete', { ticket: 't'.repeat(43), credential: freshCredential, newPassword: 'new-password' });
});

test.each(['NotAllowedError', 'AbortError'])('native %s cancellation never completes or falls back', async name => {
	enableFreshPath(); vi.mocked(startAuthentication).mockRejectedValue(new DOMException('Synthetic cancellation', name));
	await startFreshChange(); await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce());
	for (let i = 0; i < 10; i++) await Promise.resolve();
	expect(os.apiWithDialog).toHaveBeenCalledTimes(1); expect(os.authenticateDialog).not.toHaveBeenCalled(); expect(os.alert).not.toHaveBeenCalled();
});

test('server expiry/rejection never retries through the legacy password endpoint', async () => {
	enableFreshPath(); const error = new Error('Synthetic expired proof'); expectedErrors = [error];
	vi.mocked(os.apiWithDialog).mockReset().mockResolvedValueOnce({ ticket: 't'.repeat(43), options: freshOptions } as never).mockRejectedValue(error);
	await startFreshChange(); await vi.waitFor(() => expect(errors).toEqual([error]));
	expect(os.apiWithDialog).toHaveBeenCalledTimes(2); expect(os.authenticateDialog).not.toHaveBeenCalled();
});

test('duplicate clicks cannot start parallel password ceremonies', async () => {
	enableFreshPath(); await startFreshChange(); startChange(true);
	await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledTimes(2));
	expect(os.inputText).toHaveBeenCalledTimes(3); expect(startAuthentication).toHaveBeenCalledOnce();
});

test('leaving settings before the native result prevents password completion', async () => {
	enableFreshPath(); let release!: (value: typeof freshCredential) => void;
	vi.mocked(startAuthentication).mockReturnValue(new Promise(resolve => { release = resolve; }));
	await startFreshChange(); await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce());
	app.unmount(); mounted = false; release(freshCredential);
	for (let i = 0; i < 10; i++) await Promise.resolve();
	expect(os.apiWithDialog).toHaveBeenCalledTimes(1);
});

test('KeepAlive departure and return cannot revive an old native ceremony', async () => {
	enableFreshPath(); let release!: (value: typeof freshCredential) => void;
	vi.mocked(startAuthentication).mockReturnValue(new Promise(resolve => { release = resolve; }));
	await startFreshChange(); await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce());
	showSecurity.value = false; await nextTick();
	showSecurity.value = true; await nextTick();
	release(freshCredential);
	for (let i = 0; i < 10; i++) await Promise.resolve();
	expect(os.apiWithDialog).toHaveBeenCalledTimes(1);
	vi.mocked(startAuthentication).mockResolvedValue(freshCredential);
	vi.mocked(os.apiWithDialog).mockResolvedValueOnce({ ticket: 'n'.repeat(43), options: freshOptions } as never);
	vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: false, result: 'current-password' });
	await startFreshChange();
	await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledTimes(3));
});
