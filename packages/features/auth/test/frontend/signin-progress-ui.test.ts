/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { compileScript, parse } from 'vue/compiler-sfc';
import * as Vue from 'vue';
import ts from 'typescript';
import { afterEach, expect, test, vi } from 'vitest';

const source = readFileSync(resolve(import.meta.dirname, '../../frontend/components/MkSignin.vue'), 'utf8');
const script = compileScript(parse(source).descriptor, { id: 'signin-progress-ui' });
const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const challenge = { ticket: 't'.repeat(43), browserSecret: 'b'.repeat(43), nonce: 'n'.repeat(43), version: 1 };
const pw = { password: 'synthetic-password', captcha: { hCaptchaResponse: null, mCaptchaResponse: null, reCaptchaResponse: null, turnstileResponse: null, testcaptchaResponse: null } };
interface Bindings {
	page: Vue.Ref<string>; password: Vue.Ref<string>; authenticationProgress: Vue.Ref<typeof challenge | null>;
	onUsernameSubmitted(username: string): Promise<void>; onPasswordSubmitted(value: typeof pw): Promise<void>; onTotpSubmitted(token: string): Promise<void>;
}
let app: ReturnType<typeof Vue.createApp> | undefined; let element: HTMLDivElement | undefined;
afterEach(() => { app?.unmount(); app = undefined; element?.remove(); element = undefined; vi.restoreAllMocks(); });

function mount() {
	const api = vi.fn(); const emit = vi.fn(); const alert = vi.fn(async () => {}); let bindings!: Bindings;
	const exports: { default?: { setup(props: object, context: object): Bindings } } = {};
	runInNewContext(code, { exports, require(name: string) {
		if (name === 'vue') return Vue;
		if (name === '@simplewebauthn/browser') return { browserSupportsWebAuthn: () => true };
		if (name.endsWith('misskey-api.js')) return { misskeyApi: api };
		if (name.endsWith('/os.js')) return { alert };
		if (name.endsWith('/accounts.js')) return { login: vi.fn() };
		return {};
	}, $locale: Vue.ref({ sfc: { loginFailed: 'Failed', incorrectTotp: 'Incorrect code' } }), console });
	element = window.document.createElement('div'); window.document.body.append(element);
	app = Vue.createApp({ setup() { bindings = exports.default!.setup({ autoSet: false }, { expose() {}, emit }); return () => Vue.h('div', { 'data-page': bindings.page.value }); } }); app.mount(element);
	api.mockResolvedValueOnce({ username: 'synthetic' }).mockResolvedValueOnce({ finished: false, next: 'password' }).mockResolvedValueOnce({ finished: false, next: 'totp', authenticationProgress: challenge });
	return { api, emit, bindings, alert };
}

async function start(h: ReturnType<typeof mount>) { await h.bindings.onUsernameSubmitted('synthetic'); await h.bindings.onPasswordSubmitted(pw); await Vue.nextTick(); }

test('actual Vue setup keeps state in memory and sends it only with the proof request', async () => {
	const h = mount(); const writes = vi.spyOn(window.localStorage, 'setItem'); await start(h);
	expect(h.bindings.authenticationProgress.value).toEqual(challenge); expect(h.bindings.page.value).toBe('totp');
	expect(h.api.mock.calls[2][1]).not.toHaveProperty('authenticationProgress');
	h.api.mockResolvedValueOnce({ finished: true, id: 'synthetic', i: 'synthetic-session' }); await h.bindings.onTotpSubmitted('123456');
	expect(h.api.mock.calls[3][1]).toMatchObject({ progressMode: 'v1', username: 'synthetic', password: pw.password, token: '123456', authenticationProgress: challenge });
	expect(h.bindings.authenticationProgress.value).toBeNull(); expect(h.emit).toHaveBeenCalledOnce(); expect(writes).not.toHaveBeenCalled();
});
test('server-denied proof resets password and takes a new ticket', async () => {
	const h = mount(); await start(h); h.api.mockRejectedValueOnce({ id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f' });
	await expect(h.bindings.onTotpSubmitted('wrong')).rejects.toBeDefined(); await Vue.nextTick();
	expect(h.bindings.page.value).toBe('password'); expect(element!.querySelector('[data-page]')?.getAttribute('data-page')).toBe('password'); expect(h.bindings.password.value).toBe(''); expect(h.bindings.authenticationProgress.value).toBeNull(); expect(h.emit).not.toHaveBeenCalled();
	const fresh = { ...challenge, ticket: 'f'.repeat(43), nonce: 'x'.repeat(43) }; h.api.mockResolvedValueOnce({ finished: false, next: 'totp', authenticationProgress: fresh }); await h.bindings.onPasswordSubmitted(pw);
	expect(h.api.mock.calls[4][1]).not.toHaveProperty('authenticationProgress'); expect(h.bindings.authenticationProgress.value).toEqual(fresh);
});
test('unmount clears state and ignores a late response', async () => {
	const h = mount(); await start(h); let complete!: (value: unknown) => void; h.api.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
	const pending = h.bindings.onPasswordSubmitted(pw); app!.unmount(); app = undefined;
	expect(h.bindings.authenticationProgress.value).toBeNull(); complete({ finished: false, next: 'totp', authenticationProgress: challenge }); await pending;
	expect(h.bindings.authenticationProgress.value).toBeNull(); expect(h.emit).not.toHaveBeenCalled();
});

test('unmount also prevents a late failure from reopening authentication UI', async () => {
	const h = mount(); await start(h); let reject!: (error: Error) => void;
	h.api.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
	const pending = h.bindings.onPasswordSubmitted(pw); app!.unmount(); app = undefined;
	reject(new Error('synthetic late network failure')); await expect(pending).rejects.toThrow('synthetic late');
	expect(h.bindings.authenticationProgress.value).toBeNull(); expect(h.emit).not.toHaveBeenCalled(); expect(h.alert).not.toHaveBeenCalled();
});
