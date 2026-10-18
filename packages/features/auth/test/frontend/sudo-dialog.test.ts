/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Dialog from '../../frontend/components/MkSudoDialog.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { startAuthentication, WebAuthnAbortService } from '@simplewebauthn/browser';
const fixture = vi.hoisted(() => ({ actor: { id: 'synthetic-owner', token: 'bs_synthetic' }, close: vi.fn() }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => fixture.actor }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@simplewebauthn/browser', () => ({ browserSupportsWebAuthn: () => true, startAuthentication: vi.fn(), WebAuthnAbortService: { cancelCeremony: vi.fn() } }));
vi.mock('@features/ui/frontend/components/MkModalWindow.vue', () => ({ default: defineComponent({ setup: (_, { slots, expose }) => { expose({ close: fixture.close }); return () => h('div', slots.default?.()); } }) }));
vi.mock('@features/ui/frontend/components/MkButton.vue', () => ({ default: defineComponent({ props: ['disabled', 'type'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled, type: props.type }, slots.default?.()) }) }));
vi.mock('@features/ui/frontend/components/MkInput.vue', () => ({ default: defineComponent({ props: ['modelValue', 'type'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('input', { value: props.modelValue, type: props.type, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) }) }) }));
vi.mock('@features/ui/frontend/components/MkInfo.vue', () => ({ default: defineComponent({ setup: (_, { slots }) => () => h('aside', slots.default?.()) }) }));
const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
const state = { totpEnabled: true, passkeyMfaEnabled: false, passkeyCount: 1, passwordLoginDisabled: false };
const options = { challenge: 'synthetic', userVerification: 'preferred' as const };
const credential = { id: 'synthetic-key' };
const grantId = 'g'.repeat(43);
const expiresAt = '2026-10-18T00:05:00.000Z';
const current = ref(true); const done = vi.fn();
let app: ReturnType<typeof createApp>; let element: HTMLDivElement;
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('ja-JP'); });
beforeEach(async () => {
	vi.clearAllMocks(); current.value = true; fixture.actor.token = 'bs_synthetic';
	vi.mocked(startAuthentication).mockReset().mockResolvedValue(credential as never);
	vi.mocked(misskeyApi).mockReset().mockImplementation(async route => route === 'i/security/state' ? { ...state } as never : { status: 'elevated', expiresAt, grantId } as never);
	element = window.document.createElement('div'); app = createApp({ render: () => h(Dialog, { isCurrent: () => current.value, onDone: done }) }); app.use(internationalization); app.mount(element);
	await vi.waitFor(() => expect(element.querySelector('form')).not.toBeNull());
});
afterEach(() => { app.unmount(); element.remove(); state.totpEnabled = true; state.passkeyMfaEnabled = false; state.passwordLoginDisabled = false; });

function input(type: string, value: string) { const field = element.querySelector<HTMLInputElement>(`input[type=${type}]`)!; field.value = value; field.dispatchEvent(new Event('input')); }

function submit() { element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true })); }

function cancel() { [...element.querySelectorAll('button')].find(button => button.textContent === 'キャンセル')!.click(); }

test('TOTP is the initial choice and the common endpoint receives password plus current code', async () => {
	expect(element.querySelector('select')!.value).toBe('totp'); input('password', 'synthetic-password'); input('text', '123456'); submit();
	await vi.waitFor(() => expect(done).toHaveBeenCalledWith(true));
	expect(misskeyApi).toHaveBeenCalledWith('i/sudo/start', { password: 'synthetic-password', usePasskey: false, token: '123456' }); expect(startAuthentication).not.toHaveBeenCalled();
	expect([...element.querySelectorAll('input')].every(field => !field.value)).toBe(true);
});
test('passkey choice completes only the server-owned sudo ticket', async () => {
	vi.mocked(misskeyApi).mockResolvedValueOnce({ status: 'passkey-required', ticket: 'synthetic-ticket', options } as never).mockResolvedValueOnce({ expiresAt, grantId } as never);
	input('password', 'synthetic-password'); const select = element.querySelector('select')!; select.value = 'passkey'; select.dispatchEvent(new Event('change')); await nextTick(); submit();
	await vi.waitFor(() => expect(done).toHaveBeenCalledWith(true)); expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: options });
	expect(misskeyApi).toHaveBeenCalledWith('i/sudo/complete', { ticket: 'synthetic-ticket', credential });
});
test('cancellation while native proof waits aborts the ceremony and prevents completion', async () => {
	vi.mocked(misskeyApi).mockResolvedValueOnce({ status: 'passkey-required', ticket: 'synthetic-ticket', options } as never);
	let release!: (value: never) => void; vi.mocked(startAuthentication).mockReturnValue(new Promise(resolve => { release = resolve; }));
	input('password', 'synthetic-password'); const select = element.querySelector('select')!; select.value = 'passkey'; select.dispatchEvent(new Event('change')); await nextTick(); submit();
	await vi.waitFor(() => expect(startAuthentication).toHaveBeenCalledOnce()); cancel(); release(credential as never); await nextTick();
	expect(WebAuthnAbortService.cancelCeremony).toHaveBeenCalledOnce(); expect(done).toHaveBeenCalledExactlyOnceWith(false);
	expect(vi.mocked(misskeyApi).mock.calls.some(([route]) => route === 'i/sudo/complete')).toBe(false);
});
test('an abandoned start cleans only its exact elevation using the original session credential', async () => {
	let release!: (value: never) => void; vi.mocked(misskeyApi).mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
	input('password', 'synthetic-password'); input('text', '123456'); submit(); current.value = false; fixture.actor.token = 'bs_replacement'; await nextTick();
	release({ status: 'elevated', expiresAt, grantId } as never);
	await vi.waitFor(() => expect(misskeyApi).toHaveBeenCalledWith('i/sudo/exit', { expiresAt, grantId }, 'bs_synthetic'));
	expect(done).toHaveBeenCalledExactlyOnceWith(false);
});
test('server rejection clears entered secrets and never changes authentication purpose', async () => {
	vi.mocked(misskeyApi).mockRejectedValueOnce(new Error('Synthetic rejected proof')); input('password', 'synthetic-password'); input('text', '123456'); submit();
	await vi.waitFor(() => expect(element.querySelector('[role=alert]')).not.toBeNull());
	expect([...element.querySelectorAll('input')].every(field => !field.value)).toBe(true); expect(done).not.toHaveBeenCalled(); expect(startAuthentication).not.toHaveBeenCalled();
	expect(vi.mocked(misskeyApi).mock.calls.map(([route]) => route)).toEqual(['i/security/state', 'i/sudo/start']);
});
