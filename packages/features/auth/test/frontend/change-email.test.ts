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
import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';
vi.mock('@features/auth/frontend/utility/ensure-sudo.js', () => ({ ensureSudo: vi.fn() }));
vi.mock('@features/auth/frontend/utility/owned-dialog.js', () => ({ ownedInputText: (props: Parameters<typeof os.inputText>[0]) => os.inputText(props), ownedAuthenticateDialog: (props: Parameters<typeof os.authenticateDialog>[0]) => os.authenticateDialog(props) }));
const account = vi.hoisted(() => ({ id: 'synthetic-owner', email: 'old@example.test', emailVerified: true, token: 'bs_synthetic', securityKeysList: [{ id: 'AQID' }], emailNotificationTypes: [], receiveAnnouncementEmail: false }));
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
	account.id = 'synthetic-owner'; vi.mocked(ensureSudo).mockResolvedValue(true);
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


function save() { const button = [...element.querySelectorAll('button')].find(item => item.textContent === 'メールアドレスを保存'); expect(button).toBeDefined(); button!.click(); }
function legacy() { app.unmount(); element.remove(); account.token = 'legacy-native'; mountEmail(); }

test('editing is inert; common sudo authorizes the exact target captured before confirmation', async () => {
	edit('new@example.test'); expect(ensureSudo).not.toHaveBeenCalled(); expect(os.apiWithDialog).not.toHaveBeenCalled();
	let finish!: (value: boolean) => void; vi.mocked(ensureSudo).mockReturnValue(new Promise(resolve => { finish = resolve; }));
	save(); edit('later@example.test'); finish(true);
	await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledExactlyOnceWith('i/security/email', { email: 'new@example.test' }));
	expect(os.authenticateDialog).not.toHaveBeenCalled(); expect(startAuthentication).not.toHaveBeenCalled();
});
test('empty target is explicit null', async () => { edit(''); save(); await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledExactlyOnceWith('i/security/email', { email: null })); });
test('cancelled sudo never submits or falls back', async () => {
	vi.mocked(ensureSudo).mockResolvedValue(false); save(); await nextTick();
	expect(os.apiWithDialog).not.toHaveBeenCalled(); expect(os.authenticateDialog).not.toHaveBeenCalled();
});
test.each(['authorization', 'mutation'] as const)('%s failure does not fall back', async stage => {
	const failure = new Error('Synthetic request failure'); expectedErrors = [failure];
	if (stage === 'authorization') vi.mocked(ensureSudo).mockRejectedValue(failure); else vi.mocked(os.apiWithDialog).mockRejectedValue(failure);
	save(); await vi.waitFor(() => expect(errors).toEqual([failure]));
	expect(os.apiWithDialog).toHaveBeenCalledTimes(stage === 'authorization' ? 0 : 1); expect(os.authenticateDialog).not.toHaveBeenCalled();
});
test('busy excludes competing save during confirmation', async () => {
	let finish!: (value: boolean) => void; vi.mocked(ensureSudo).mockReturnValue(new Promise(resolve => { finish = resolve; }));
	save(); save(); expect(ensureSudo).toHaveBeenCalledOnce(); finish(true); await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
});
test.each(['deactivate', 'unmount', 'actor'] as const)('%s discards delayed authorization, including reactivation', async mode => {
	let finish!: (value: boolean) => void; vi.mocked(ensureSudo).mockReturnValue(new Promise(resolve => { finish = resolve; }));
	save(); const [current, signal] = vi.mocked(ensureSudo).mock.calls[0];
	if (mode === 'unmount') { app.unmount(); mounted = false; }
	else if (mode === 'actor') account.id = 'replacement-owner';
	else { show.value = false; await nextTick(); show.value = true; await nextTick(); }
	expect(current!()).toBe(false); if (mode !== 'actor') expect(signal?.aborted).toBe(true);
	finish(true); await new Promise(resolve => window.setTimeout(resolve, 10)); expect(os.apiWithDialog).not.toHaveBeenCalled();
});
test('legacy retains password/TOTP and captured target', async () => {
	legacy(); edit('legacy@example.test'); save(); await vi.waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledOnce());
	expect(os.apiWithDialog).toHaveBeenCalledWith('i/update-email', { password: 'current-password', token: 'totp', email: 'legacy@example.test' }); expect(ensureSudo).not.toHaveBeenCalled();
});
test('legacy cancellation never calls either endpoint', async () => {
	legacy(); vi.mocked(os.authenticateDialog).mockResolvedValue({ canceled: true, result: undefined }); save(); await nextTick(); expect(os.apiWithDialog).not.toHaveBeenCalled();
});
test('unmount while legacy dialog waits discards its result', async () => {
	legacy(); let finish!: (value: Awaited<ReturnType<typeof os.authenticateDialog>>) => void;
	vi.mocked(os.authenticateDialog).mockReturnValue(new Promise(resolve => { finish = resolve; })); save(); app.unmount(); mounted = false;
	finish({ canceled: false, result: { password: 'current-password', token: 'totp' } }); await new Promise(resolve => window.setTimeout(resolve, 10)); expect(os.apiWithDialog).not.toHaveBeenCalled();
});
test.each(['legacy-token', 'no-key', 'unsupported'] as const)('%s renders one explicit save choice', async kind => {
	app.unmount(); element.remove(); mounted = false;
	if (kind === 'legacy-token') account.token = 'old-native'; if (kind === 'no-key') account.securityKeysList = []; if (kind === 'unsupported') vi.mocked(browserSupportsWebAuthn).mockReturnValue(false);
	mountEmail(); await nextTick(); expect([...element.querySelectorAll('button')].some(button => button.textContent === 'パスキーでメールアドレスを保存')).toBe(false); expect(os.apiWithDialog).not.toHaveBeenCalled();
});
