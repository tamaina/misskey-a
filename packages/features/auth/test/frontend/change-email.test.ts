/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import * as os from '@features/ui/frontend/os.js';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import Email from '../../frontend/pages/settings/email.vue';
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: vi.fn(() => true), startAuthentication: vi.fn() }));
const account = vi.hoisted(() => ({ email: 'old@example.test', emailVerified: true, token: 'bs_synthetic', securityKeysList: [{ id: 'AQID' }], emailNotificationTypes: [], receiveAnnouncementEmail: false }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => reactive(account) }));
vi.mock('@features/instance/frontend/instance.js', () => ({ instance: { enableEmail: true } }));
vi.mock('@features/ui/frontend/os.js', () => ({ authenticateDialog: vi.fn(), inputText: vi.fn(), apiWithDialog: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ props: ['disabled'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled }, slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInput.vue', () => ({ default: defineComponent({ props: ['modelValue', 'disabled'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('input', { value: props.modelValue, disabled: props.disabled, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) }) }) }));
vi.mock('@features/ui/frontend/components/MkInfo.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkSwitch.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkDisableSection.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/form/section.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('section', slots.default?.()) }) }));
const internationalization = createInternationalization({ initialLocale: 'en-US' });
let app: ReturnType<typeof createApp>; let element: HTMLDivElement; let mounted = false;
const show = ref(true); const errors: unknown[] = []; let expectedErrors: unknown[] = [];
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('en-US'); });
beforeEach(() => {
	vi.resetAllMocks(); errors.length = 0; expectedErrors = []; show.value = true;
	account.token = 'bs_synthetic'; account.securityKeysList = [{ id: 'AQID' }]; vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
	vi.mocked(os.inputText).mockResolvedValue({ canceled: false, result: 'current-password' });
	vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: false, result: { password: 'current-password', token: 'totp' } });
	vi.mocked(os.apiWithDialog).mockResolvedValue({ ticket: 'ticket', options: { challenge: 'synthetic' } } as never);
	vi.mocked(startAuthentication).mockResolvedValue({ id: 'credential' } as never);
	mountEmail();
});

function mountEmail() {
	element = window.document.createElement('div');
	app = createApp(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => show.value ? h(Email) : h('div', 'Other') }) }));
	app.config.errorHandler = error => { errors.push(error); }; app.use(internationalization);
	const slot = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) });
	for (const name of ['SearchMarker', 'SearchLabel', 'SearchText']) app.component(name, slot);
	app.mount(element); mounted = true;
}

afterEach(() => { expect(errors).toEqual(expectedErrors); if (mounted) app.unmount(); element.remove(); });

function edit(value: string) { const input = element.querySelector('input')!; input.value = value; input.dispatchEvent(new Event('input')); }

function save(fresh = true) { const button = [...element.querySelectorAll('button')].find(item => item.textContent === (fresh ? 'パスキーでメールアドレスを保存' : 'メールアドレスを保存')); expect(button).toBeDefined(); button!.click(); }

test('editing is inert until explicit save; target is frozen before password/native ceremony', async () => {
	edit('new@example.test'); expect(os.authenticateDialog).not.toHaveBeenCalled(); expect(os.apiWithDialog).not.toHaveBeenCalled();
	let finish!: (value: Awaited<ReturnType<typeof os.inputText>>) => void;
	vi.mocked(os.inputText).mockReturnValueOnce(new Promise(resolve => { finish = resolve; })); save(); edit('later@example.test');
	finish({ canceled: false, result: 'current-password' });
	await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledTimes(2));
	expect(os.apiWithDialog).toHaveBeenNthCalledWith(1, 'i/update-email/passkey/start', { currentPassword: 'current-password', email: 'new@example.test' });
	expect(os.apiWithDialog).toHaveBeenNthCalledWith(2, 'i/update-email/passkey/complete', { ticket: 'ticket', credential: { id: 'credential' }, email: 'new@example.test' });
	expect(os.authenticateDialog).not.toHaveBeenCalled();
});
test('empty target means explicit null, without confusing an omitted field', async () => { edit(''); save(); await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledTimes(2)); expect(os.apiWithDialog).toHaveBeenCalledWith('i/update-email/passkey/start', { currentPassword: 'current-password', email: null }); });
test.each(['password-cancel', 'native-cancel', 'start-failed', 'complete-failed'] as const)('%s never falls back to legacy', async mode => {
	const failure = new Error('Synthetic request failure');
	if (mode === 'password-cancel') vi.mocked(os.inputText).mockResolvedValue({ canceled: true, result: undefined });
	if (mode === 'native-cancel') vi.mocked(startAuthentication).mockRejectedValue(new Error('Canceled'));
	if (mode === 'start-failed') { expectedErrors = [failure]; vi.mocked(os.apiWithDialog).mockRejectedValueOnce(failure); }
	if (mode === 'complete-failed') { expectedErrors = [failure]; vi.mocked(os.apiWithDialog).mockResolvedValueOnce({ ticket: 'ticket', options: {} } as never).mockRejectedValueOnce(failure); }
	save(); await nextTick(); await vi.waitFor(() => expect(element.querySelector('button')!.disabled).toBe(false));
	expect(os.authenticateDialog).not.toHaveBeenCalled(); expect(os.apiWithDialog).toHaveBeenCalledTimes(mode === 'password-cancel' ? 0 : mode === 'complete-failed' ? 2 : 1);
});
test('busy excludes a competing legacy save', async () => {
	let finish!: (value: Awaited<ReturnType<typeof startAuthentication>>) => void;
	vi.mocked(startAuthentication).mockReturnValueOnce(new Promise(resolve => { finish = resolve; })); save(); await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce()); save(false); expect(os.authenticateDialog).not.toHaveBeenCalled();
	finish({ id: 'credential' } as never); await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledTimes(2));
});
test.each(['deactivate', 'unmount'] as const)('%s discards delayed native results, including reactivation', async mode => {
	let finish!: (value: Awaited<ReturnType<typeof startAuthentication>>) => void;
	vi.mocked(startAuthentication).mockReturnValueOnce(new Promise(resolve => { finish = resolve; })); save(); await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce());
	if (mode === 'unmount') { app.unmount(); mounted = false; } else { show.value = false; await vi.waitFor(() => expect(element.textContent).toBe('Other')); show.value = true; await vi.waitFor(() => expect(element.querySelector('input')).not.toBeNull()); }
	finish({ id: 'credential' } as never); await new Promise(resolve => window.setTimeout(resolve, 10)); expect(os.apiWithDialog).toHaveBeenCalledOnce();
});
test('legacy remains explicit with password/TOTP and the captured target', async () => { edit('legacy@example.test'); save(false); await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce()); expect(os.apiWithDialog).toHaveBeenCalledWith('i/update-email', { password: 'current-password', token: 'totp', email: 'legacy@example.test' }); expect(startAuthentication).not.toHaveBeenCalled(); });
test('legacy cancellation never calls either endpoint', async () => {
	vi.mocked(os.authenticateDialog).mockResolvedValueOnce({ canceled: true, result: undefined }); save(false); await nextTick(); await vi.waitFor(() => expect(element.querySelector('button')!.disabled).toBe(false)); expect(os.apiWithDialog).not.toHaveBeenCalled();
});
test('unmount while the legacy dialog waits discards its result', async () => {
	let finish!: (value: Awaited<ReturnType<typeof os.authenticateDialog>>) => void;
	vi.mocked(os.authenticateDialog).mockReturnValueOnce(new Promise(resolve => { finish = resolve; })); save(false); expect(os.authenticateDialog).toHaveBeenCalledOnce(); app.unmount(); mounted = false;
	finish({ canceled: false, result: { password: 'current-password', token: 'totp' } }); await new Promise(resolve => window.setTimeout(resolve, 10)); expect(os.apiWithDialog).not.toHaveBeenCalled();
});
test.each(['legacy-token', 'no-key', 'unsupported'] as const)('%s keeps only the explicit legacy choice', async kind => {
	app.unmount(); element.remove(); mounted = false;
	if (kind === 'legacy-token') account.token = 'old-native';
	if (kind === 'no-key') account.securityKeysList = [];
	if (kind === 'unsupported') vi.mocked(browserSupportsWebAuthn).mockReturnValue(false);
	mountEmail(); await nextTick(); expect([...element.querySelectorAll('button')].some(button => button.textContent === 'パスキーでメールアドレスを保存')).toBe(false); expect(os.apiWithDialog).not.toHaveBeenCalled();
});
