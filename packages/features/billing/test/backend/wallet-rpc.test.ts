/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as https from 'node:https';
import { Socket } from 'node:net';
import { Readable } from 'node:stream';
import { afterEach, expect, test, vi } from 'vitest';
import { createPublicClient, http } from 'viem';
import { createSiweMessage } from 'viem/siwe';
import { createWalletProof } from '../../backend/wallet-service.js';
import { Response as NativeResponse } from 'node-fetch';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { Config } from '@/config.js';
import { createWalletRpcFetch, WALLET_RPC_MAX_BYTES, WALLET_RPC_TIMEOUT } from '../../backend/wallet-rpc.js';
import type { RequestInit as NativeRequestInit } from 'node-fetch';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('node-fetch', async importOriginal => ({ ...await importOriginal<typeof import('node-fetch')>(), default: mocks.fetch }));
const services: HttpRequestService[] = [];
afterEach(() => {
	for (const service of services.splice(0)) {
		service.httpAgent.destroy(); service.httpsAgent.destroy();
		service.getAgentByUrl(new URL('https://rpc.example.test'), true).destroy();
	}
	vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllEnvs(); mocks.fetch.mockReset();
});

function service(overrides: Partial<Config> = {}) {
	vi.useFakeTimers();
	const instance = new HttpRequestService({ userAgent: 'Misskey synthetic', outgoingAddress: '192.0.2.23', ...overrides } as Config);
	services.push(instance);
	return instance;
}

test('actual viem request uses native proxy/outgoingAddress agents, never global fetch', async () => {
	const native = service({ proxy: 'http://proxy.example.test:3128' });
	const globalFetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Global fetch must not run'));
	const getAgent = vi.spyOn(native, 'getAgentByUrl');
	mocks.fetch.mockImplementation(async (_url: string, init: NativeRequestInit) => {
		const selector = init.agent;
		expect(typeof selector).toBe('function');
		if (typeof selector !== 'function') throw new Error('Missing native selector');
		const agent = selector(new URL('https://rpc.example.test'));
		expect(agent).toBe(native.httpsAgent);
		expect(native.httpsAgent.options.localAddress).toBe('192.0.2.23');
		expect(init.redirect).toBe('error'); expect(init.follow).toBe(0); expect(init.size).toBe(WALLET_RPC_MAX_BYTES);
		const request = JSON.parse(String(init.body));
		return new NativeResponse(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: '0x1' }), { headers: { 'Content-Type': 'application/json' } });
	});
	const client = createPublicClient({ transport: http('https://rpc.example.test', { retryCount: 0, timeout: WALLET_RPC_TIMEOUT, fetchFn: createWalletRpcFetch(native) }) });
	expect(await client.request({ method: 'eth_chainId' })).toBe('0x1');
	expect(globalFetch).not.toHaveBeenCalled();
	expect(getAgent).toHaveBeenCalledWith(new URL('https://rpc.example.test'), false, false);
	expect(mocks.fetch).toHaveBeenCalledOnce();
});

test('native private-address filter is preserved, including intentional CIDR allowances', () => {
	vi.stubEnv('NODE_ENV', 'production');
	for (const allowed of [false, true]) {
		const native = service({ allowedPrivateNetworks: allowed ? ['127.0.0.1/32'] : [] });
		const socket = new Socket(); Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
		const destroy = vi.spyOn(socket, 'destroy').mockReturnValue(socket);
		const createConnection = vi.spyOn(https.Agent.prototype, 'createConnection').mockReturnValue(socket);
		const agent = native.getAgentByUrl(new URL('https://rpc.example.test'));
		agent.createConnection({ host: 'rpc.example.test', port: 443 }); socket.emit('connect');
		if (allowed) expect(destroy).not.toHaveBeenCalled();
		else expect(destroy).toHaveBeenCalledWith(expect.objectContaining({ message: 'Blocked address: 127.0.0.1' }));
		createConnection.mockRestore(); destroy.mockRestore(); socket.destroy();
	}
});

test('redirect responses are rejected without following or exposing a private URL', async () => {
	const native = service();
	mocks.fetch.mockResolvedValue(new NativeResponse('', { status: 302, headers: { Location: 'https://127.0.0.1/private-synthetic-token' } }));
	await expect(createWalletRpcFetch(native)('https://rpc.example.test/private-synthetic-token', { method: 'POST', body: '{}' })).rejects.toThrow('Wallet RPC request failed');
	expect(mocks.fetch).toHaveBeenCalledOnce();
	expect(mocks.fetch.mock.calls[0][1]).toMatchObject({ redirect: 'error', follow: 0 });
});

test('native streaming response cap rejects oversized bodies and strips upstream error detail', async () => {
	const native = service();
	mocks.fetch.mockImplementation(async (_url: string, init: NativeRequestInit) => {
		const options = { size: init.size, headers: { 'Content-Type': 'application/json' } };
		return new NativeResponse(Readable.from([Buffer.alloc(WALLET_RPC_MAX_BYTES), Buffer.from('overflow')]), options);
	});
	const fetchRpc = createWalletRpcFetch(native);
	await expect(fetchRpc('https://rpc.example.test', { method: 'POST', body: '{}' })).rejects.toThrow('Wallet RPC request failed');
	mocks.fetch.mockRejectedValue(new Error('https://synthetic-secret@rpc.example.test/secret'));
	await expect(fetchRpc('https://rpc.example.test', { method: 'POST', body: '{}' })).rejects.toThrow(/^Wallet RPC request failed$/);
	const controller = new AbortController(); controller.abort(); mocks.fetch.mockClear();
	await expect(fetchRpc('https://rpc.example.test', { method: 'POST', body: '{}', signal: controller.signal })).rejects.toThrow('Wallet RPC request failed');
	expect(mocks.fetch).not.toHaveBeenCalled();
});

test('native timeout bounds a pending RPC without returning URL details', async () => {
	const native = service();
	mocks.fetch.mockImplementation((_url: string, init: NativeRequestInit) => new Promise((_resolve, reject) => {
		init.signal?.addEventListener('abort', () => reject(new Error('synthetic private URL')));
	}));
	const result = createWalletRpcFetch(native)('https://rpc.example.test', { method: 'POST', body: '{}' });
	const rejected = expect(result).rejects.toThrow(/^Wallet RPC request failed$/);
	await vi.advanceTimersByTimeAsync(WALLET_RPC_TIMEOUT);
	await rejected;
});

test('proof verifier uses native RPC and fails closed without propagating URL-bearing viem errors', async () => {
	const native = service();
	const globalFetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Global fetch must not run'));
	mocks.fetch.mockRejectedValue(new Error('https://synthetic-secret@rpc.example.test/private'));
	const address = '0x0000000000000000000000000000000000000001';
	const message = createSiweMessage({ address, chainId: 123456, domain: 'misskey.example.test', uri: 'https://misskey.example.test', nonce: 'syntheticNonce0001', version: '1', issuedAt: new Date(0), expirationTime: new Date(600000) });
	const challenge = { nonce: 'syntheticNonce0001', userId: 'alice', chainId: 123456, address, domain: 'misskey.example.test', uri: 'https://misskey.example.test', message, createdAt: 0, expiresAt: 600000, usedAt: null };
	const signature = `0x${'00'.repeat(65)}` as const; // Invalid synthetic signature, never signed.
	expect(await createWalletProof(native).verify(challenge, signature, 'https://synthetic-secret@rpc.example.test/private', 1000)).toBe(false);
	expect(globalFetch).not.toHaveBeenCalled();
	expect(mocks.fetch).toHaveBeenCalled();
});
