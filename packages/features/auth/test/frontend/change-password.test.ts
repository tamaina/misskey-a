/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import type { Endpoints } from 'misskey-js';
import Security from '../../frontend/pages/settings/security.vue';
import * as os from '@features/ui/frontend/os.js';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: vi.fn(() => true), startAuthentication: vi.fn() }));

import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';
import { signout } from '../../frontend/signout.js';
vi.mock('@features/auth/frontend/utility/ensure-sudo.js', () => ({ ensureSudo: vi.fn() }));
vi.mock('@features/auth/frontend/utility/owned-dialog.js', () => ({ ownedInputText: (props: Parameters<typeof os.inputText>[0]) => os.inputText(props), ownedAuthenticateDialog: (props: Parameters<typeof os.authenticateDialog>[0]) => os.authenticateDialog(props) }));
vi.mock('@features/auth/frontend/signout.js', () => ({ signout: vi.fn() }));
// OIDC child behavior is covered by oidc-flow/api tests, independently of these password dialogs.
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

function startChange() {
	const button = [...element.querySelectorAll('button')].find(item => item.textContent === 'Change password');
	expect(button).toBeDefined();
	button!.click();
}

test('legacy login cannot change the password and asks the user to sign in again', async () => {
	await nextTick();
	startChange();
	await vi.waitFor(() => expect(os.alert).toHaveBeenCalledOnce());
	expect(os.alert).toHaveBeenCalledWith({ type: 'warning', text: 'To change your password, please sign in again in the browser.' });
	expect(os.inputText).not.toHaveBeenCalled();
	expect(os.authenticateDialog).not.toHaveBeenCalled();
	expect(ensureSudo).not.toHaveBeenCalled();
	expect(os.apiWithDialog).not.toHaveBeenCalled();
	expect(signout).not.toHaveBeenCalled();
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
	expect(os.inputText).toHaveBeenNthCalledWith(1, { title: 'New password', text: 'パスワードを変更すると、現在の端末を含むすべてのログインが無効になります。', type: 'password', autocomplete: 'new-password', minLength: 1 });
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
	if (phase === 'unmount') { app.unmount(); mounted = false; } else if (phase === 'deactivate') { showSecurity.value = false; await nextTick(); showSecurity.value = true; await nextTick(); } else account.id = 'replacement-owner';
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
	enableSession(); let release!: () => void; vi.mocked(os.apiWithDialog).mockReturnValue(new Promise<Endpoints['i/security/password']['res']>(resolve => { release = () => resolve(null); }));
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
