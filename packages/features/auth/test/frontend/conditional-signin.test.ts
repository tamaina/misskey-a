/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import ConditionalSignin from '../../frontend/components/MkSignin.conditional.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { login } from '@features/auth/frontend/accounts.js';
import { browserSupportsWebAuthnAutofill } from '@simplewebauthn/browser';

const state = vi.hoisted(() => ({ manual: vi.fn(), props: {} as Record<string, unknown> }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/auth/frontend/accounts.js', () => ({ login: vi.fn() }));
vi.mock('@simplewebauthn/browser', async original => ({ ...await original<typeof import('@simplewebauthn/browser')>(), browserSupportsWebAuthnAutofill: vi.fn() }));
vi.mock('@features/auth/frontend/components/MkSignin.vue', () => ({ default: defineComponent({
	props: ['autoSet', 'message', 'openOnRemote', 'initialUsername'], emits: ['login'],
	setup(props, { emit }) {
		state.props = props;
		return () => h('div', [
			h('form', { onSubmit: (event: Event) => { event.preventDefault(); state.manual('username'); } }, [
				h('input', { autocomplete: 'username webauthn' }), h('button', { type: 'submit' }, 'Continue'),
			]),
			h('button', { onClick: () => state.manual('passkey') }, 'Passkey'),
			h('button', { onClick: () => state.manual('remote') }, 'Remote'),
			h('button', { onClick: () => emit('login', { finished: true, i: 'synthetic-manual' }) }, 'Manual done'),
		]);
	},
}) }));
const result = { finished: true, i: 'synthetic-session' };
const option = { challenge: 'c3ludGhldGlj', rpId: 'synthetic.example', userVerification: 'preferred' };
let app: ReturnType<typeof createApp> | undefined;
let element: HTMLDivElement;
let credentialResolve: (value: unknown) => void;
let signal: AbortSignal;
const emitted = vi.fn();
const get = vi.fn();
let testClock = 1800000000000;

function mount(props: Record<string, unknown> = {}) {
	app = createApp(ConditionalSignin, { ...props, onLogin: emitted });
	app.component('MkLoading', defineComponent({ render: () => h('span', 'Verifying') }));
	app.mount(element);
}

async function settle() {
	for (let i = 0; i < 15; i++) await Promise.resolve();
	await nextTick();
	// Vue's capture handler stamps the event; nested handlers reject stamps at
	// or before attachment time. A real user event follows rendering in time.
	vi.setSystemTime(Date.now() + 1);
}

function chooseCredential() {
	const raw = Uint8Array.of(0).buffer;
	credentialResolve({ id: 'synthetic', rawId: raw, type: 'public-key', response: { clientDataJSON: raw, authenticatorData: raw, signature: raw, userHandle: null }, getClientExtensionResults: () => ({}) });
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	testClock += 1000;
	vi.setSystemTime(testClock);
	vi.resetAllMocks();
	vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
	vi.mocked(misskeyApi).mockResolvedValueOnce({ context: 'synthetic-context', option } as never).mockResolvedValue({ signinResponse: result } as never);
	get.mockImplementation((options: CredentialRequestOptions) => {
		signal = options.signal!;
		return new Promise(resolve => { credentialResolve = resolve; });
	});
	vi.stubGlobal('navigator', { credentials: { get } });
	element = window.document.createElement('div');
	window.document.body.append(element);
});
afterEach(() => { app?.unmount(); app = undefined; element.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('opt-in conditional signin surface', () => {
	test('default forwards ordinary signin props and emits without invoking autofill', async () => {
		mount({ autoSet: true, message: 'Synthetic message', initialUsername: 'synthetic', openOnRemote: { type: 'web', path: '/' } });
		await settle();
		expect(state.props).toMatchObject({ autoSet: true, message: 'Synthetic message', initialUsername: 'synthetic', openOnRemote: { type: 'web', path: '/' } });
		expect(browserSupportsWebAuthnAutofill).not.toHaveBeenCalled();
		expect(misskeyApi).not.toHaveBeenCalled();
		(element.querySelectorAll('button')[3] as HTMLButtonElement).click();
		expect(emitted).toHaveBeenCalledWith({ finished: true, i: 'synthetic-manual' });
		expect(login).not.toHaveBeenCalled();
	});
	test('opt-in waits without making the normal login form inert', async () => {
		mount({ enabled: true });
		await settle();
		expect(get).toHaveBeenCalledOnce();
		expect(element.firstElementChild!.hasAttribute('inert')).toBe(false);
		chooseCredential();
		await settle();
		expect(misskeyApi).toHaveBeenNthCalledWith(2, 'signin-with-passkey', { context: 'synthetic-context', credential: expect.any(Object) });
		expect(emitted).toHaveBeenCalledWith(result);
		expect(login).not.toHaveBeenCalled();
	});
	test.each([0, 1, 2])('manual action %i aborts its pending request before invoking the normal handler', async index => {
		mount({ enabled: true });
		await settle();
		state.manual.mockImplementation(() => expect(signal.aborted).toBe(true));
		(element.querySelectorAll('button')[index] as HTMLButtonElement).click();
		chooseCredential();
		await settle();
		expect(state.manual).toHaveBeenCalledOnce();
		expect(misskeyApi).toHaveBeenCalledOnce();
		expect(emitted).not.toHaveBeenCalled();
	});
	test('route unmount aborts the owned request and ignores a late result', async () => {
		mount({ enabled: true });
		await settle();
		app!.unmount(); app = undefined;
		expect(signal.aborted).toBe(true);
		chooseCredential();
		await settle();
		expect(misskeyApi).toHaveBeenCalledOnce();
		expect(emitted).not.toHaveBeenCalled();
	});
	test('committed verification prevents a competing manual submission and supports autoSet', async () => {
		let finish!: (value: never) => void;
		vi.mocked(misskeyApi).mockReset().mockResolvedValueOnce({ context: 'synthetic-context', option } as never)
			.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
		mount({ enabled: true, autoSet: true });
		await settle();
		chooseCredential();
		await settle();
		expect(element.firstElementChild!.hasAttribute('inert')).toBe(true);
		(element.querySelectorAll('button')[1] as HTMLButtonElement).click();
		expect(state.manual).not.toHaveBeenCalled();
		finish({ signinResponse: result } as never);
		await settle();
		expect(login).toHaveBeenCalledWith('synthetic-session');
		expect(emitted).toHaveBeenCalledWith(result);
	});
	test('opt-out and opt-in during verification cannot release the lock or start another request', async () => {
		let finish!: (value: never) => void;
		vi.mocked(misskeyApi).mockReset().mockResolvedValueOnce({ context: 'synthetic-context', option } as never)
			.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
		const enabled = ref(true);
		app = createApp({ render: () => h(ConditionalSignin, { enabled: enabled.value, onLogin: emitted }) });
		app.component('MkLoading', defineComponent({ render: () => h('span', 'Verifying') }));
		app.mount(element);
		await settle();
		chooseCredential();
		await settle();
		enabled.value = false;
		await settle();
		expect(element.firstElementChild!.hasAttribute('inert')).toBe(true);
		(element.querySelectorAll('button')[0] as HTMLButtonElement).click();
		expect(state.manual).not.toHaveBeenCalled();
		enabled.value = true;
		await settle();
		expect(get).toHaveBeenCalledOnce();
		expect(misskeyApi).toHaveBeenCalledTimes(2);
		finish({ signinResponse: result } as never);
		await settle();
		expect(emitted).not.toHaveBeenCalled();
		expect(element.firstElementChild!.hasAttribute('inert')).toBe(false);
	});
	test('unsupported browser keeps the ordinary form usable', async () => {
		vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(false);
		mount({ enabled: true });
		await settle();
		expect(get).not.toHaveBeenCalled();
		expect(misskeyApi).not.toHaveBeenCalled();
		expect(element.firstElementChild!.hasAttribute('inert')).toBe(false);
		element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		expect(state.manual).toHaveBeenCalledWith('username');
	});
});
