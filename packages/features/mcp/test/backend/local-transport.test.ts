/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpApiService } from '../../backend/McpApiService.js';
import { createLocalMcpPilot } from '../../backend/local-transport.js';
import { fixture } from './fixtures/shared-api.js';
const closures: (() => Promise<unknown>)[] = [];
afterEach(async () => { for (const close of closures.splice(0).reverse()) await close(); });
const message = (method = 'tools/list', params: object = {}) => ({ jsonrpc: '2.0', id: 1, method, params });

async function pilot(beforeReady?: (app: ReturnType<typeof createLocalMcpPilot>['app']) => void) {
	const f = await fixture();
	const p = createLocalMcpPilot(f.module.get(McpApiService), { enabled: true, resource: 'http://127.0.0.1:61836/mcp', allowedOrigins: ['http://127.0.0.1:61836'] });
	beforeReady?.(p.app); await p.app.ready(); closures.push(() => p.app.close());
	const headers = { host: '127.0.0.1:61836', authorization: `Bearer ${f.grant.token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
	const invoke = (body: object = message(), extraHeaders: Record<string, string | string[]> = {}, url = '/mcp', method: 'POST' | 'GET' = 'POST') => p.app.inject({ method, url, headers: { ...headers, ...extraHeaders }, ...(method === 'POST' ? { payload: body } : {}) });
	return { f, p, headers, invoke };
}

it('defaults disabled and rejects nonlocal configuration', async () => {
	const f = await fixture(); const p = createLocalMcpPilot(f.module.get(McpApiService)); closures.push(() => p.app.close());
	expect((await p.app.inject({ method: 'POST', url: '/mcp' })).statusCode).toBe(404);
	expect(() => createLocalMcpPilot(f.module.get(McpApiService), { enabled: true, resource: 'https://remote.example/mcp' })).toThrow();
});
it('allows absent Origin for nonbrowser clients and exact approved Origin, with one finite native-schema tool', async () => {
	const { invoke, f, p } = await pilot();
	for (const origin of [undefined, 'http://127.0.0.1:61836']) {
		const response = await invoke(message(), origin ? { origin } : {}); expect(response.statusCode).toBe(200);
		const tools = response.json().result.tools; expect(tools.map((tool: { name: string }) => tool.name)).toEqual(['list_my_notes']);
		expect(tools[0].description).toContain('nonpublic');
		expect(tools[0].inputSchema.properties.userId).toBeUndefined();
		expect(tools[0].inputSchema.properties.limit.maximum).toBe(100);
	}
	expect(f.tokens.findOne).toHaveBeenCalledTimes(2); expect(p.activeRequests()).toBe(0);
});
it.each<Record<string, string | string[]>>([{ host: 'evil.example' }, { host: ['127.0.0.1:61836', '127.0.0.1:61836'] }, { host: '127.0.0.1:61837' }, { origin: 'null' }, { origin: 'http://evil.example' }, { origin: 'http://127.0.0.1:61836/' }, { 'x-forwarded-host': 'evil.example' }, { authorization: ['Bearer ONE', 'Bearer TWO'] }])('rejects untrusted or duplicate critical headers %j', async extra => {
	const { invoke, f } = await pilot(); expect((await invoke(message(), extra)).statusCode).toBeGreaterThanOrEqual(400);
	expect(f.tokens.findOne).not.toHaveBeenCalled();
});
it('rejects nonloopback connections even with an approved Host and bearer', async () => {
	const { p, f, headers } = await pilot();
	const response = await p.app.inject({ method: 'POST', url: '/mcp', remoteAddress: '203.0.113.5', headers, payload: message() });
	expect(response.statusCode).toBe(403); expect(f.tokens.findOne).not.toHaveBeenCalled();
});
it('rejects URL/body/cookie credentials, wrong methods and malformed/oversize JSON before auth', async () => {
	const { invoke, f, p, headers } = await pilot();
	const logged = vi.spyOn(p.app.log, 'info');
	expect((await invoke(message(), {}, '/mcp?i=SYNTHETIC_SECRET')).statusCode).toBe(403);
	expect((await invoke(message(), { authorization: '', cookie: 'i=SYNTHETIC_SECRET' })).statusCode).toBe(401);
	expect((await invoke({ ...message(), i: f.grant.token }, { authorization: '' })).statusCode).toBe(401);
	expect((await invoke(message(), {}, '/mcp', 'GET')).statusCode).toBe(405);
	expect((await invoke(message(), { 'content-type': 'text/plain' })).statusCode).toBe(415);
	expect((await p.app.inject({ method: 'POST', url: '/mcp', headers, payload: '{broken' })).statusCode).toBe(400);
	expect((await p.app.inject({ method: 'POST', url: '/mcp', headers, payload: JSON.stringify({ oversized: 'x'.repeat(1024 * 1024) }) })).statusCode).toBe(413);
	expect(f.tokens.findOne).not.toHaveBeenCalled(); expect(logged).not.toHaveBeenCalled();
});
it('runs SDK1.32.0 initialize/list/call using explicit bearer headers, preserving native output and checking revocation each request', async () => {
	const { f, p, headers } = await pilot();
	const fetchFixture: typeof fetch = async (input, init) => {
		const url = new URL(String(input));
		const incoming = new Headers(init?.headers);
		const response = await p.app.inject({ method: init?.method === 'GET' ? 'GET' : init?.method === 'DELETE' ? 'DELETE' : 'POST', url: url.pathname + url.search, headers: { ...Object.fromEntries(incoming), host: headers.host }, payload: init?.body ? String(init.body) : undefined });
		const outgoing = new Headers(); for (const [key, value] of Object.entries(response.headers)) if (typeof value === 'string') outgoing.set(key, value);
		return new Response(response.statusCode === 204 ? null : response.body, { status: response.statusCode, headers: outgoing });
	};
	const client = new Client({ name: 'synthetic', version: '0' });
	await client.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:61836/mcp'), { fetch: fetchFixture, requestInit: { headers: { authorization: headers.authorization } } }));
	try {
		expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(['list_my_notes']);
		const result = await client.callTool({ name: 'list_my_notes', arguments: {} });
		expect(result.structuredContent).toEqual({ notes: (await f.ordinary({ userId: f.own.id })).json() });
		const invalid = await client.callTool({ name: 'list_my_notes', arguments: { limit: 101 } });
		expect(invalid.isError).toBe(true);
		expect(invalid.structuredContent).toMatchObject({ error: { code: 'INVALID_PARAM' }, status: 400 });
		await expect(client.callTool({ name: 'notes/delete', arguments: {} })).rejects.toBeDefined();
		f.rows.delete(f.grant.id);
		await expect(client.listTools()).rejects.toBeDefined();
	} finally { await client.close(); }
	expect(p.activeRequests()).toBe(0);
});
it('suppresses the response and cleans transport after cancellation, while delayed native work may finish', async () => {
	const { invoke, f, p } = await pilot();
	let release!: () => void; let entered!: () => void;
	const started = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	f.deps.fanoutTimelineEndpointService.timeline.mockImplementation(async () => { entered(); await delayed; return []; });
	const pending = invoke(message('tools/call', { name: 'list_my_notes', arguments: {} })).catch(error => error);
	await started; p.close();
	const response = await pending; expect(response instanceof Error).toBe(true);
	expect(p.activeRequests()).toBe(0);
	release(); await vi.waitFor(() => { expect(p.nativeInFlight()).toBe(0); });
});
it('bounds concurrent native requests and releases all transport state on cancellation', async () => {
	const { invoke, f, p } = await pilot();
	let release!: () => void; let entered!: () => void; let count = 0;
	const started = new Promise<void>(resolve => { entered = resolve; });
	const delayed = new Promise<void>(resolve => { release = resolve; });
	f.deps.fanoutTimelineEndpointService.timeline.mockImplementation(async () => { if (++count === 8) entered(); await delayed; return []; });
	const pending = Array.from({ length: 8 }, () => invoke(message('tools/call', { name: 'list_my_notes', arguments: {} })).catch(error => error));
	await started; expect(p.activeRequests()).toBe(8);
	expect((await invoke()).statusCode).toBe(503);
	p.close(); expect((await Promise.all(pending)).every(response => response instanceof Error)).toBe(true);
	expect(p.activeRequests()).toBe(0); expect(p.nativeInFlight()).toBe(8);
	for (let batch = 0; batch < 3; batch++) {
		const attempts = await Promise.all(Array.from({ length: 8 }, () => invoke(message('tools/call', { name: 'list_my_notes', arguments: {} }))));
		expect(attempts.every(response => response.statusCode === 503)).toBe(true);
		p.close(); expect(p.nativeInFlight()).toBe(8); expect(count).toBe(8);
	}
	release(); await vi.waitFor(() => { expect(p.nativeInFlight()).toBe(0); });
	expect((await invoke()).statusCode).toBe(200);
});
it('observes disconnect before slow authentication settles and retains its native permit', async () => {
	let disconnect!: () => void;
	const { p, f, headers } = await pilot(app => { app.addHook('onRequest', async request => { disconnect = () => { request.raw.emit('aborted'); }; }); });
	let release!: () => void; let entered!: () => void;
	const started = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	f.tokens.findOne.mockImplementation(async () => { entered(); await delayed; return f.grant; });
	const pending = p.app.inject({ method: 'POST', url: '/mcp', headers, payload: message() }).catch(error => error);
	await started; disconnect(); expect(await pending).toBeInstanceOf(Error);
	expect(p.activeRequests()).toBe(0); expect(p.nativeInFlight()).toBe(1);
	release(); await vi.waitFor(() => { expect(p.nativeInFlight()).toBe(0); });
});
it('uses actual SDK callTool AbortSignal and explicitly rejects unsupported stateless protocol cancellation', async () => {
	const { f, p, headers } = await pilot();
	let release!: () => void; let entered!: () => void;
	const started = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
	f.deps.fanoutTimelineEndpointService.timeline.mockImplementation(async () => { entered(); await delayed; return []; });
	const requests: { method: string; signal?: AbortSignal | null; status?: number }[] = [];
	const fetchFixture: typeof fetch = async (input, init) => {
		const body = init?.body ? JSON.parse(String(init.body)) : {};
		const observed = { method: body.method as string, signal: init?.signal, status: undefined as number | undefined }; requests.push(observed);
		const incoming = new Headers(init?.headers);
		const response = await p.app.inject({ method: init?.method === 'GET' ? 'GET' : 'POST', url: new URL(String(input)).pathname, headers: { ...Object.fromEntries(incoming), host: headers.host }, payload: init?.body ? String(init.body) : undefined });
		observed.status = response.statusCode;
		return new Response(response.statusCode === 204 ? null : response.body, { status: response.statusCode, headers: { 'content-type': 'application/json' } });
	};
	const client = new Client({ name: 'synthetic-abort', version: '0' }); const errors: Error[] = []; client.onerror = error => { errors.push(error); };
	await client.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:61836/mcp'), { fetch: fetchFixture, requestInit: { headers: { authorization: headers.authorization } } }));
	try {
		const abort = new AbortController();
		const pending = client.callTool({ name: 'list_my_notes', arguments: {} }, undefined, { signal: abort.signal }).catch(error => error);
		await started; abort.abort(); expect(await pending).toBeInstanceOf(Error);
		await vi.waitFor(() => { expect(requests.find(request => request.method === 'notifications/cancelled')?.status).toBe(501); });
		expect(requests.find(request => request.method === 'tools/call')?.signal?.aborted).toBe(false);
		expect(p.activeRequests()).toBe(1); expect(p.nativeInFlight()).toBe(1);
		expect(errors.some(error => error.message.includes('cancellation'))).toBe(true);
		p.close(); await vi.waitFor(() => { expect(p.activeRequests()).toBe(0); });
		expect(p.nativeInFlight()).toBe(1); release(); await vi.waitFor(() => { expect(p.nativeInFlight()).toBe(0); });
	} finally { release(); await client.close(); }
});
