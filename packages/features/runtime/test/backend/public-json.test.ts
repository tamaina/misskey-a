/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, expect, test, vi } from 'vitest';
import type { LookupAddress } from 'node:dns';
import { Agent } from 'node:https';
import fetch, { Response } from 'node-fetch';
import { postPublicJson } from '../../backend/http/public-json.js';
import { HttpRequestService } from '../../backend/services/HttpRequestService.js';

const { lookupAll } = vi.hoisted(() => ({ lookupAll: vi.fn<(host: string, options: { all: true; verbatim: true }) => Promise<LookupAddress[]>>() }));
vi.mock('node:dns/promises', () => ({ lookup: lookupAll }));
vi.mock('node-fetch', async importOriginal => ({
	...await importOriginal<typeof import('node-fetch')>(), default: vi.fn(),
}));

const publicAddress = { address: '8.8.8.8', family: 4 };
const options = { userAgent: 'Misskey/test', localAddress: undefined };

beforeEach(() => {
	lookupAll.mockReset();
	vi.mocked(fetch).mockReset();
});

test.each([
	[], [{ address: '127.0.0.1', family: 4 }], [{ address: '10.0.0.1', family: 4 }],
	[{ address: '169.254.169.254', family: 4 }], [{ address: '::1', family: 6 }],
	[{ address: '::ffff:127.0.0.1', family: 6 }], [publicAddress, { address: '192.168.0.1', family: 4 }],
].map(addresses => ({ addresses })))('rejects empty/private/mixed DNS answers before sending HTTP %#', async ({ addresses }) => {
	lookupAll.mockResolvedValue(addresses);
	await expect(postPublicJson('https://source.example/api/users/show', '{}', options)).rejects.toThrow('blocked');
	expect(fetch).not.toHaveBeenCalled();
});

test('pins checked DNS answers while keeping the original HTTPS hostname and destroys the agent', async () => {
	lookupAll.mockResolvedValueOnce([publicAddress]).mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);
	let destroyed = false;
	vi.mocked(fetch).mockImplementation(async (input, init) => {
		expect(String(input)).toBe('https://source.example/api/users/show');
		expect(init).toMatchObject({ method: 'POST', redirect: 'error', size: 256 * 1024, body: '{}', headers: { 'User-Agent': options.userAgent, 'Content-Type': 'application/json' } });
		expect(init?.signal).toBeInstanceOf(AbortSignal);
		expect(init?.agent).toBeInstanceOf(Agent);
		const agent = init?.agent as Agent;
		expect(agent.options.rejectUnauthorized).not.toBe(false);
		const answer = vi.fn();
		agent.options.lookup?.('source.example', { all: true }, answer);
		expect(answer).toHaveBeenLastCalledWith(null, [publicAddress]);
		agent.options.lookup?.('source.example', { all: false }, answer);
		expect(answer).toHaveBeenLastCalledWith(null, publicAddress.address, publicAddress.family);
		const destroy = agent.destroy.bind(agent);
		vi.spyOn(agent, 'destroy').mockImplementation(() => { destroyed = true; destroy(); });
		return new Response('{"avatarDecorations":[]}');
	});
	await expect(postPublicJson('https://source.example/api/users/show', '{}', options)).resolves.toEqual({ avatarDecorations: [] });
	expect(lookupAll).toHaveBeenCalledExactlyOnceWith('source.example', { all: true, verbatim: true });
	expect(destroyed).toBe(true);
});

test('DNS timeout cannot proceed to the network', async () => {
	const controller = new AbortController();
	vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
	lookupAll.mockReturnValue(new Promise(() => {}));
	const pending = postPublicJson('https://source.example/api/users/show', '{}', options);
	controller.abort();
	await expect(pending).rejects.toThrow('timeout');
	expect(fetch).not.toHaveBeenCalled();
});

test.each(['redirect', 'oversize', 'status', 'json'] as const)('fails closed on %s response', async failure => {
	lookupAll.mockResolvedValue([publicAddress]);
	vi.mocked(fetch).mockImplementation(async (_url, init) => {
		if (failure === 'redirect') throw new Error('redirect rejected');
		if (failure === 'status') return new Response('{}', { status: 503 });
		// node-fetch supplies Body's size option when constructing fetched responses.
		const responseOptions = { status: 200, size: init?.size };
		return new Response(failure === 'json' ? '<html>' : JSON.stringify({ text: 'x'.repeat(256 * 1024) }), responseOptions);
	});
	await expect(postPublicJson('https://source.example/api/users/show', '{}', options)).rejects.toThrow();
});

test('proxy configuration cannot bypass public destination pinning', async () => {
	const service: HttpRequestService = Object.assign(Object.create(HttpRequestService.prototype), { config: { proxy: 'http://proxy.example' } });
	await expect(service.postPublicJson('https://source.example/api/users/show', '{}')).rejects.toThrow('direct HTTPS');
	expect(lookupAll).not.toHaveBeenCalled();
	expect(fetch).not.toHaveBeenCalled();
});
