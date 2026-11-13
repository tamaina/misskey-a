/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createConditionalPasskeyLogin, conditionalPasskeyWaitMs, getConditionalCredential } from '../../frontend/utility/conditional-passkey.js';
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';

const option: PublicKeyCredentialRequestOptionsJSON = { challenge: 'c3ludGhldGlj', rpId: 'synthetic.example', userVerification: 'preferred' };
const credential: AuthenticationResponseJSON = {
	id: 'synthetic', rawId: 'c3ludGhldGlj', type: 'public-key',
	response: { clientDataJSON: 'AA', authenticatorData: 'AA', signature: 'AA', userHandle: 'AA' }, clientExtensionResults: {},
};

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(yes => { resolve = yes; });
	return { promise, resolve };
}

function harness() {
	const deps = {
		supported: vi.fn(async () => true), inputReady: vi.fn(() => true),
		challenge: vi.fn(async () => ({ context: 'synthetic-context', option })),
		credential: vi.fn(async (_option: PublicKeyCredentialRequestOptionsJSON, _signal: AbortSignal) => credential),
		verify: vi.fn(async (_context: string, _credential: AuthenticationResponseJSON) => ({ i: 'synthetic-session', finished: true })),
		verifying: vi.fn(), login: vi.fn(),
	};
	return { deps, flow: createConditionalPasskeyLogin(deps) };
}

async function settle() {
	for (let i = 0; i < 10; i++) await Promise.resolve();
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('conditional passkey lifecycle', () => {
	test('uses the server context and request-owned signal for the selected credential', async () => {
		const { flow, deps } = harness();
		await flow.start();
		expect(deps.credential).toHaveBeenCalledWith(option, expect.any(AbortSignal));
		expect(deps.verify).toHaveBeenCalledWith('synthetic-context', credential);
		expect(deps.login).toHaveBeenCalledOnce();
		expect(deps.verifying.mock.calls.map(([value]) => value)).toEqual([false, true, false]);
		expect(vi.getTimerCount()).toBe(0);
	});
	test.each(['unsupported', 'detection failure', 'missing input'])('%s falls back without a challenge', async mode => {
		const { flow, deps } = harness();
		if (mode === 'unsupported') deps.supported.mockResolvedValue(false);
		if (mode === 'detection failure') deps.supported.mockRejectedValue(new Error('synthetic'));
		if (mode === 'missing input') deps.inputReady.mockReturnValue(false);
		await flow.start();
		expect(deps.challenge).not.toHaveBeenCalled();
		expect(deps.credential).not.toHaveBeenCalled();
	});
	test.each(['supported', 'challenge', 'credential', 'verify'] as const)('cancel while waiting for %s ignores the late result', async stage => {
		const { flow, deps } = harness();
		const pending = deferred<never>();
		deps[stage].mockReturnValue(pending.promise);
		const completion = flow.start();
		await settle();
		flow.cancel();
		const result = { supported: true, challenge: { context: 'late', option }, credential, verify: { i: 'late', finished: true } }[stage];
		pending.resolve(result as never);
		await completion;
		expect(deps.login).not.toHaveBeenCalled();
		if (stage !== 'verify') expect(deps.verify).not.toHaveBeenCalled();
		if (stage === 'supported') expect(deps.challenge).not.toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});
	test('expires without automatic retries and rejects credentials returned after the deadline', async () => {
		const { flow, deps } = harness();
		const pending = deferred<AuthenticationResponseJSON>();
		deps.credential.mockReturnValue(pending.promise);
		const completion = flow.start();
		await settle();
		const signal = deps.credential.mock.calls[0][1];
		await vi.advanceTimersByTimeAsync(conditionalPasskeyWaitMs);
		expect(signal.aborted).toBe(true);
		pending.resolve(credential);
		await completion;
		expect(deps.verify).not.toHaveBeenCalled();
		expect(deps.challenge).toHaveBeenCalledOnce();
	});
	test('ignores a credential returned after a clock jump even before the timer callback runs', async () => {
		const { flow, deps } = harness();
		const pending = deferred<AuthenticationResponseJSON>();
		deps.credential.mockReturnValue(pending.promise);
		const completion = flow.start();
		await settle();
		vi.setSystemTime(Date.now() + conditionalPasskeyWaitMs + 1);
		pending.resolve(credential);
		await completion;
		expect(deps.verify).not.toHaveBeenCalled();
		expect(deps.login).not.toHaveBeenCalled();
	});
	test('repeated start aborts only the old request and its completion cannot clear the new request', async () => {
		const { flow, deps } = harness();
		const first = deferred<AuthenticationResponseJSON>();
		const second = deferred<AuthenticationResponseJSON>();
		deps.credential.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		const a = flow.start();
		await settle();
		const b = flow.start();
		await settle();
		const [oldSignal, newSignal] = deps.credential.mock.calls.map(call => call[1]);
		expect(oldSignal.aborted).toBe(true);
		first.resolve(credential);
		await a;
		expect(newSignal.aborted).toBe(false);
		second.resolve(credential);
		await b;
		expect(deps.verify).toHaveBeenCalledOnce();
		expect(deps.login).toHaveBeenCalledOnce();
	});
	test.each(['challenge', 'credential', 'verify'] as const)('%s rejection restores ordinary login', async stage => {
		const { flow, deps } = harness();
		deps[stage].mockRejectedValue(new DOMException('Synthetic cancellation', 'NotAllowedError'));
		await flow.start();
		expect(deps.login).not.toHaveBeenCalled();
		expect(deps.verifying).toHaveBeenLastCalledWith(false);
		expect(vi.getTimerCount()).toBe(0);
	});
	test('cancel and restart during committed verification keep the manual lock until it settles', async () => {
		const { flow, deps } = harness();
		const pending = deferred<{ i: string; finished: boolean }>();
		deps.verify.mockReturnValue(pending.promise);
		const completion = flow.start();
		await settle();
		flow.cancel();
		await flow.start();
		expect(deps.verifying).toHaveBeenLastCalledWith(true);
		expect(deps.challenge).toHaveBeenCalledOnce();
		expect(deps.credential).toHaveBeenCalledOnce();
		pending.resolve({ i: 'synthetic-session', finished: true });
		await completion;
		expect(deps.login).not.toHaveBeenCalled();
		expect(deps.verifying).toHaveBeenLastCalledWith(false);
	});
	test('verification after credential selection is not interrupted by the autofill deadline', async () => {
		const { flow, deps } = harness();
		const pending = deferred<{ i: string; finished: boolean }>();
		deps.verify.mockReturnValue(pending.promise);
		const completion = flow.start();
		await settle();
		await vi.advanceTimersByTimeAsync(90000);
		pending.resolve({ i: 'synthetic-session', finished: true });
		await completion;
		expect(deps.login).toHaveBeenCalledOnce();
	});
});

describe('native conditional request ownership', () => {
	test('stale cleanup cannot abort a newer manual SimpleWebAuthn ceremony', async () => {
		const { startAuthentication, WebAuthnAbortService } = await import('@simplewebauthn/browser');
		vi.stubGlobal('PublicKeyCredential', class {});
		const requests: CredentialRequestOptions[] = [];
		vi.stubGlobal('navigator', { credentials: { get: vi.fn((options: CredentialRequestOptions) => {
			requests.push(options);
			return new Promise((resolve, reject) => options.signal!.addEventListener('abort', () => reject(new DOMException('Synthetic abort', 'AbortError'))));
		}) } });
		const own = new AbortController();
		const conditional = getConditionalCredential(option, own.signal).catch(error => error.name);
		const manual = startAuthentication({ optionsJSON: option }).catch(error => error.code);
		expect(requests[0].mediation).toBe('conditional');
		own.abort();
		expect(await conditional).toBe('AbortError');
		expect(requests[1].signal!.aborted).toBe(false);
		WebAuthnAbortService.cancelCeremony();
		expect(await manual).toBe('ERROR_CEREMONY_ABORTED');
	});
	test('serializes assertion buffers and preserves server options with a discoverable allow list', async () => {
		const raw = Uint8Array.of(0, 1, 2).buffer;
		const get = vi.fn(async (_options: CredentialRequestOptions) => ({ id: 'synthetic', rawId: raw, type: 'public-key', authenticatorAttachment: 'platform',
			response: { clientDataJSON: raw, authenticatorData: raw, signature: raw, userHandle: raw }, getClientExtensionResults: () => ({}) }));
		vi.stubGlobal('navigator', { credentials: { get } });
		const own = new AbortController();
		const result = await getConditionalCredential({ ...option, allowCredentials: [{ id: 'ignored', type: 'public-key' }] }, own.signal);
		expect(get.mock.calls[0][0]).toEqual({ mediation: 'conditional', signal: own.signal, publicKey: { ...option, challenge: expect.any(ArrayBuffer), allowCredentials: [] } });
		expect(result).toEqual({ id: 'synthetic', rawId: 'AAEC', type: 'public-key', authenticatorAttachment: 'platform',
			response: { clientDataJSON: 'AAEC', authenticatorData: 'AAEC', signature: 'AAEC', userHandle: 'AAEC' }, clientExtensionResults: {} });
	});
	test.each(['ArrayBuffer', 'SharedArrayBuffer'] as const)('copies offset PRF views backed by %s into independent DOM buffers', async backing => {
		const storage = backing === 'SharedArrayBuffer' ? new SharedArrayBuffer(12) : new ArrayBuffer(12);
		const bytes = new Uint8Array(storage);
		bytes.set([90, 91, 1, 2, 3, 92, 4, 5, 93, 6, 7, 94]);
		const first = new Uint8Array(storage, 2, 3);
		const second = new DataView(storage, 6, 2);
		const perCredential = new Uint8Array(storage, 9, 2);
		const raw = Uint8Array.of(0, 1, 2).buffer;
		const get = vi.fn(async (_options: CredentialRequestOptions) => ({ id: 'synthetic', rawId: raw, type: 'public-key',
			response: { clientDataJSON: raw, authenticatorData: raw, signature: raw, userHandle: null }, getClientExtensionResults: () => ({}) }));
		vi.stubGlobal('navigator', { credentials: { get } });
		const own = new AbortController();
		const request: PublicKeyCredentialRequestOptionsJSON = {
			...option,
			timeout: 60000,
			allowCredentials: [{ id: 'ignored', type: 'public-key' }],
			extensions: { appid: 'https://synthetic.example/app-id', credProps: true,
				prf: { eval: { first, second }, evalByCredential: { synthetic: { first: perCredential } } } },
		};
		await getConditionalCredential(request, own.signal);
		const passed = get.mock.calls[0][0];
		expect(passed.signal).toBe(own.signal);
		expect(passed.mediation).toBe('conditional');
		expect(passed.publicKey).toMatchObject({ rpId: option.rpId, userVerification: option.userVerification, timeout: 60000, allowCredentials: [] });
		expect(passed.publicKey!.extensions).toMatchObject({ appid: request.extensions!.appid, credProps: true });
		const evalValues = passed.publicKey!.extensions!.prf!.eval!;
		const credentialValues = passed.publicKey!.extensions!.prf!.evalByCredential!.synthetic;
		expect(evalValues.first).toBeInstanceOf(ArrayBuffer);
		expect(evalValues.second).toBeInstanceOf(ArrayBuffer);
		expect(credentialValues.first).toBeInstanceOf(ArrayBuffer);
		expect(evalValues.first).not.toBe(storage);
		expect(evalValues.first).toEqual(Uint8Array.of(1, 2, 3).buffer);
		expect(evalValues.second!).toEqual(Uint8Array.of(4, 5).buffer);
		expect(credentialValues.first).toEqual(Uint8Array.of(6, 7).buffer);
		expect(credentialValues).not.toHaveProperty('second');
		bytes.fill(0);
		expect(evalValues.first).toEqual(Uint8Array.of(1, 2, 3).buffer);
		expect(evalValues.second!).toEqual(Uint8Array.of(4, 5).buffer);
		expect(credentialValues.first).toEqual(Uint8Array.of(6, 7).buffer);
		expect(request.extensions!.prf!.eval!.first).toBe(first);
		expect(request.allowCredentials).toEqual([{ id: 'ignored', type: 'public-key' }]);
	});
	test('dismissed credential chooser returns to fallback', async () => {
		vi.stubGlobal('navigator', { credentials: { get: async () => null } });
		await expect(getConditionalCredential(option, new AbortController().signal)).rejects.toThrow('No public-key credential');
	});
});
