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

import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';
import { signout } from '../../frontend/signout.js';
vi.mock('@features/auth/frontend/utility/ensure-sudo.js', () => ({ ensureSudo: vi.fn() }));
vi.mock('@features/auth/frontend/utility/owned-dialog.js', () => ({ ownedInputText: (props: Parameters<typeof os.inputText>[0]) => os.inputText(props), ownedAuthenticateDialog: (props: Parameters<typeof os.authenticateDialog>[0]) => os.authenticateDialog(props) }));
vi.mock('@features/auth/frontend/signout.js', () => ({ signout: vi.fn() }));
vi.mock('@features/auth/frontend/components/MkSecuritySettings.vue', () => ({ default: defineComponent({ render: () => null }) }));
vi.mock('@features/auth/frontend/components/MkBrowserSessions.vue', () => ({ default: defineComponent({ render: () => null }) }));
const account = vi.hoisted(() => ({ id: 'synthetic-owner', twoFactorEnabled: true, token: 'legacy-token', securityKeysList: [] as { id: string }[] }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => reactive(account) }));

vi.mock('@features/ui/frontend/os.js', () => ({
	confirm: vi.fn(),
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
	account.id = 'synthetic-owner';
	vi.mocked(ensureSudo).mockResolvedValue(true);
	vi.mocked(signout).mockResolvedValue(undefined);
	vi.mocked(os.confirm).mockResolvedValue({ canceled: false });
	account.twoFactorEnabled = true; account.token = 'legacy-token'; account.securityKeysList = [];
	vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
	vi.mocked(os.promiseDialog).mockImplementation(promise => promise);
	vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: false, result: { password: 'current-password', token: null } });
	vi.mocked(os.inputText)
		.mockResolvedValueOnce({ canceled: false, result: 'current-password' })
		.mockResolvedValue({ canceled: false, result: 'new-password' });
	mountSecurity();
});

function mountSecurity() {
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
}

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


function enableSession() {
	Object.assign(reactive(account), { token: 'bs_' + 'x'.repeat(43), securityKeysList: [{ id: 'AQID' }] });
	vi.mocked(os.inputText).mockReset().mockResolvedValue({ canceled: false, result: 'new-password' });
	app.unmount(); element.remove(); mountSecurity();
}
async function startTokenRegeneration() {
	await nextTick();
	const button = [...element.querySelectorAll('button')].find(item => item.textContent?.trim() === 'Regenerate login token');
	expect(button).toBeDefined(); button!.click();
}
test('session password change authorizes once before two new-password entries and awaits accepted cleanup', async () => {
	enableSession(); await nextTick(); startChange();
	await vi.waitFor(() => expect(signout).toHaveBeenCalledWith('credentials-changed'));
	expect(ensureSudo).toHaveBeenCalledOnce();
	expect(os.inputText).toHaveBeenCalledTimes(2);
	expect(os.inputText).toHaveBeenNthCalledWith(1, { title: 'New password', type: 'password', autocomplete: 'new-password', minLength: 1 });
	expect(os.inputText).toHaveBeenNthCalledWith(2, { title: 'Retype new password', type: 'password', autocomplete: 'new-password', minLength: 1 });
	expect(os.apiWithDialog).toHaveBeenCalledExactlyOnceWith('i/security/password', { newPassword: 'new-password' });
	expect(os.authenticateDialog).not.toHaveBeenCalled(); expect(startAuthentication).not.toHaveBeenCalled();
	expect(vi.mocked(ensureSudo).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(os.inputText).mock.invocationCallOrder[0]);
});
test('cancelled common confirmation cannot submit or fall back', async () => {
	enableSession(); vi.mocked(ensureSudo).mockResolvedValue(false); await nextTick(); startChange();
	await vi.waitFor(() => expect(ensureSudo).toHaveBeenCalledOnce());
	expect(os.inputText).not.toHaveBeenCalled(); expect(os.apiWithDialog).not.toHaveBeenCalled(); expect(signout).not.toHaveBeenCalled();
});
test.each([1, 2])('cancelled new password input %s cannot submit', async stage => {
	enableSession(); if (stage === 2) vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: false, result: 'new-password' });
	vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: true, result: undefined }); await nextTick(); startChange();
	await vi.waitFor(() => expect(os.inputText).toHaveBeenCalledTimes(stage));
	expect(os.apiWithDialog).not.toHaveBeenCalled(); expect(signout).not.toHaveBeenCalled();
});
test('session mismatch is reported before mutation', async () => {
	enableSession(); vi.mocked(os.inputText).mockResolvedValueOnce({ canceled: false, result: 'first' }).mockResolvedValueOnce({ canceled: false, result: 'second' });
	await nextTick(); startChange(); await vi.waitFor(() => expect(os.alert).toHaveBeenCalledOnce());
	expect(os.apiWithDialog).not.toHaveBeenCalled();
});
test.each(['password', 'token'] as const)('server rejection of %s never cleans credentials or falls back', async operation => {
	enableSession(); const error = new Error('Synthetic expired sudo'); expectedErrors = [error]; vi.mocked(os.apiWithDialog).mockRejectedValue(error);
	await nextTick(); if (operation === 'password') startChange(); else await startTokenRegeneration();
	await vi.waitFor(() => expect(errors).toEqual([error]));
	expect(os.apiWithDialog).toHaveBeenCalledOnce(); expect(signout).not.toHaveBeenCalled(); expect(os.authenticateDialog).not.toHaveBeenCalled();
});
test.each(['unmount', 'deactivate', 'actor'] as const)('%s invalidates delayed common sudo and prevents a later write', async phase => {
	enableSession(); let release!: (value: boolean) => void;
	vi.mocked(ensureSudo).mockReturnValue(new Promise(resolve => { release = resolve; })); await nextTick(); startChange();
	await vi.waitFor(() => expect(ensureSudo).toHaveBeenCalledOnce());
	const [current, signal] = vi.mocked(ensureSudo).mock.calls[0];
	if (phase === 'unmount') { app.unmount(); mounted = false; }
	else if (phase === 'deactivate') { showSecurity.value = false; await nextTick(); showSecurity.value = true; await nextTick(); }
	else account.id = 'replacement-owner';
	expect(current!()).toBe(false); if (phase !== 'actor') expect(signal?.aborted).toBe(true);
	release(true); for (let index = 0; index < 10; index++) await Promise.resolve();
	expect(os.inputText).not.toHaveBeenCalled(); expect(os.apiWithDialog).not.toHaveBeenCalled(); expect(signout).not.toHaveBeenCalled();
});
test('password and token operations share one busy owner during sudo', async () => {
	enableSession(); let release!: (value: boolean) => void;
	vi.mocked(ensureSudo).mockReturnValue(new Promise(resolve => { release = resolve; })); await nextTick(); startChange(); await startTokenRegeneration(); startChange();
	expect(ensureSudo).toHaveBeenCalledOnce(); release(true);
	await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
});
test('token regeneration uses common sudo, explicit warning and accepted cleanup without returning a token', async () => {
	enableSession(); await startTokenRegeneration(); await vi.waitFor(() => expect(signout).toHaveBeenCalledWith('credentials-changed'));
	expect(ensureSudo).toHaveBeenCalledOnce(); expect(os.confirm).toHaveBeenCalledOnce();
	expect(os.apiWithDialog).toHaveBeenCalledExactlyOnceWith('i/security/regenerate-token', {});
	expect(os.inputText).not.toHaveBeenCalled(); expect(os.authenticateDialog).not.toHaveBeenCalled();
});
test('cancelled token regeneration warning submits nothing', async () => {
	enableSession(); vi.mocked(os.confirm).mockResolvedValue({ canceled: true }); await startTokenRegeneration();
	await vi.waitFor(() => expect(os.confirm).toHaveBeenCalledOnce()); expect(os.apiWithDialog).not.toHaveBeenCalled(); expect(signout).not.toHaveBeenCalled();
});
test('actor switch while password mutation waits cannot clean the replacement account', async () => {
	enableSession(); let release!: () => void; vi.mocked(os.apiWithDialog).mockReturnValue(new Promise<undefined>(resolve => { release = () => resolve(undefined); }));
	await nextTick(); startChange(); await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
	account.id = 'replacement-owner'; release(); for (let index = 0; index < 10; index++) await Promise.resolve(); expect(signout).not.toHaveBeenCalled();
});
test('legacy token regeneration preserves password/TOTP and ignores dialog results after unmount', async () => {
	let release!: (value: Awaited<ReturnType<typeof os.authenticateDialog>>) => void;
	vi.mocked(os.authenticateDialog).mockReturnValue(new Promise(resolve => { release = resolve; }));
	await startTokenRegeneration(); expect(os.authenticateDialog).toHaveBeenCalledOnce();
	app.unmount(); mounted = false; release({ canceled: false, result: { password: 'current-password', token: '123456' } });
	for (let i = 0; i < 10; i++) await Promise.resolve(); expect(os.apiWithDialog).not.toHaveBeenCalled();
});
