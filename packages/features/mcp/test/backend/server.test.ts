/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import Fastify from 'fastify';
import { afterEach, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { registerHttpAccessLog } from '@features/runtime/backend/http/http-access-log.js';
import type { LogManager } from '@features/runtime/backend/logging/LogManager.js';
import { McpApiService } from '../../backend/McpApiService.js';
import { registerMcpServer } from '../../backend/server.js';
import { fixture } from './fixtures/shared-api.js';

const closures: (() => Promise<unknown>)[] = [];
afterEach(async () => { for (const close of closures.splice(0).reverse()) await close(); });
const resource = 'https://instance.invalid/mcp';
const message = (method = 'tools/list', params: object = {}) => ({ jsonrpc: '2.0', id: 1, method, params });

async function server(enabled?: boolean) {
	const f = await fixture();
	const app = Fastify({ logger: false, trustProxy: ['127.0.0.1'] });
	const logs = vi.fn();
	registerHttpAccessLog(app, {
		isAccessLogEnabled: () => true, getActiveTraceContext: () => undefined, shouldWriteAccess: () => true,
		getAccessLogConfiguration: () => ({ bodies: { request: true, response: true } }), writeAccess: logs,
	} as unknown as LogManager);
	app.register(child => registerMcpServer(child, f.module.get(McpApiService), { url: 'https://instance.invalid', ...(enabled === undefined ? {} : { enableMcp: enabled }) }));
	app.post('/control', async request => ({ echoed: request.body }));
	app.get('/*', async () => 'SPA fallback');
	await app.ready(); closures.push(() => app.close());
	const headers = { host: 'instance.invalid', authorization: `Bearer ${f.grant.token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
	const invoke = (payload: object = message(), extraHeaders: Record<string, string | string[]> = {}, url = '/mcp') => app.inject({ method: 'POST', url, remoteAddress: '203.0.113.10', headers: { ...headers, ...extraHeaders }, payload });
	return { f, app, logs, invoke, headers };
}

it.each([undefined, false])('reserves disabled /mcp ahead of SPA fallback without authenticating (%s)', async enabled => {
	const { app, invoke, f } = await server(enabled);
	expect((await invoke()).statusCode).toBe(404);
	expect((await app.inject({ url: '/mcp' })).statusCode).toBe(404);
	expect((await app.inject({ url: '/other' })).body).toBe('SPA fallback');
	expect(f.tokens.findOne).not.toHaveBeenCalled();
});

it('rejects enabled non-HTTPS service configuration', async () => {
	const f = await fixture(); const app = Fastify(); closures.push(() => app.close());
	await expect(registerMcpServer(app, f.module.get(McpApiService), { url: 'http://instance.invalid', enableMcp: true })).rejects.toThrow('trusted');
});

it('accepts remote native MiAuth and app grants with current access:mcp, preserving native HTTP permissions', async () => {
	const { f, invoke } = await server(true);
	for (const credential of [f.grant.token, f.appGrant.hash]) expect((await invoke(message(), { authorization: `Bearer ${credential}` })).statusCode).toBe(200);
	expect((await f.ordinary({ userId: f.own.id }, f.appGrant.hash)).statusCode).toBe(200);
	f.grant.permission = [];
	expect((await invoke()).statusCode).toBe(403);
	expect((await f.ordinary({ userId: f.own.id })).statusCode).toBe(200);
	expect((await invoke(message(), { authorization: `Bearer ${f.own.token}` })).statusCode).toBe(403);
	f.app.permission = ['read:account'];
	expect((await invoke(message(), { authorization: `Bearer ${f.appGrant.hash}` })).statusCode).toBe(403);
});

it.each<Record<string, string | string[]>>([{ host: 'evil.invalid' }, { origin: 'https://evil.invalid' }, { origin: 'null' }, { 'x-forwarded-host': 'instance.invalid' }, { authorization: ['Bearer ONE', 'Bearer TWO'] }])('rejects untrusted authority/origin/header configuration %j', async headers => {
	const { invoke, f } = await server(true);
	expect((await invoke(message(), headers)).statusCode).toBeGreaterThanOrEqual(400);
	expect(f.tokens.findOne).not.toHaveBeenCalled();
});

it('keeps private request/result bodies out of inherited access logging, even on rejected query auth', async () => {
	const { f, app, invoke, logs } = await server(true);
	const notes = (await f.ordinary({ userId: f.own.id })).json();
	f.deps.fanoutTimelineEndpointService.timeline.mockResolvedValue(notes.map((note: object) => ({ ...note, text: 'PRIVATE_RESPONSE_SENTINEL' })));
	const result = await invoke(message('tools/call', { name: 'list_my_notes', arguments: {} }));
	expect(result.body).toContain('PRIVATE_RESPONSE_SENTINEL');
	await invoke(message('tools/call', { name: 'list_my_notes', arguments: { text: 'PRIVATE_ARGUMENT_SENTINEL' } }));
	expect((await invoke(message(), {}, '/mcp?i=QUERY_CREDENTIAL_SENTINEL')).statusCode).toBe(403);
	const captured = JSON.stringify(logs.mock.calls);
	for (const secret of ['PRIVATE_RESPONSE_SENTINEL', 'PRIVATE_ARGUMENT_SENTINEL', 'QUERY_CREDENTIAL_SENTINEL', f.grant.token]) expect(captured).not.toContain(secret);
	for (const [record] of logs.mock.calls) { expect(record).not.toHaveProperty('requestBody'); expect(record).not.toHaveProperty('responseBody'); }
	await app.inject({ method: 'POST', url: '/control', payload: { visible: 'CONTROL_LOG_BODY' } });
	expect(JSON.stringify(logs.mock.calls)).toContain('CONTROL_LOG_BODY');
});

it('returns an explicit bounded error rather than truncated oversized native notes', async () => {
	const { f, invoke } = await server(true);
	const notes = (await f.ordinary({ userId: f.own.id })).json();
	f.deps.fanoutTimelineEndpointService.timeline.mockResolvedValue(notes.map((note: object) => ({ ...note, text: 'x'.repeat(1024 * 1024) })));
	const response = await invoke(message('tools/call', { name: 'list_my_notes', arguments: {} }));
	expect(response.statusCode).toBe(200);
	expect(response.json().result.isError).toBe(true);
	expect(response.json().result.content[0].text).toContain('output limit');
	expect(response.json().result.structuredContent).toBeUndefined();
	expect(Buffer.byteLength(response.body)).toBeLessThan(1024);
});

it('runs the SDK against the normal-server plugin and rejects revocation, injected subjects and unsupported tools', async () => {
	const { f, app, headers } = await server(true);
	const fetchFixture: typeof fetch = async (input, init) => {
		const url = new URL(String(input)); expect(url.origin).toBe('https://instance.invalid');
		const response = await app.inject({ method: init?.method === 'GET' ? 'GET' : 'POST', remoteAddress: '203.0.113.10', url: url.pathname + url.search,
			headers: { ...Object.fromEntries(new Headers(init?.headers)), host: headers.host }, payload: init?.body ? String(init.body) : undefined });
		return new Response(response.body, { status: response.statusCode, headers: { 'content-type': 'application/json' } });
	};
	const client = new Client({ name: 'synthetic-native-token', version: '0' });
	await client.connect(new StreamableHTTPClientTransport(new URL(resource), { fetch: fetchFixture, requestInit: { headers: { authorization: headers.authorization } } }));
	try {
		expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(['list_my_notes']);
		expect((await client.callTool({ name: 'list_my_notes', arguments: {} })).structuredContent).toEqual({ notes: (await f.ordinary({ userId: f.own.id })).json() });
		await expect(client.callTool({ name: 'list_my_notes', arguments: { userId: f.otherId } })).rejects.toBeDefined();
		await expect(client.callTool({ name: 'notes/delete', arguments: {} })).rejects.toBeDefined();
		f.rows.delete(f.grant.id);
		await expect(client.listTools()).rejects.toBeDefined();
	} finally { await client.close(); }
});
