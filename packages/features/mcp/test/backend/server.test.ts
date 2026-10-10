/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import Fastify from 'fastify';
import { request as httpRequest } from 'node:http';
import { afterEach, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { registerHttpAccessLog } from '@features/runtime/backend/http/http-access-log.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { LogManager } from '@features/runtime/backend/logging/LogManager.js';
import { McpApiService } from '../../backend/McpApiService.js';
import { registerMcpServer } from '../../backend/server.js';
import { registerMcpTransport } from '../../backend/transport.js';
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
	expect((await app.inject({ url: '/.well-known/oauth-protected-resource/mcp' })).statusCode).toBe(404);
	expect((await app.inject({ url: '/other' })).body).toBe('SPA fallback');
	expect(f.tokens.findOne).not.toHaveBeenCalled();
});

it('publishes only configured resource/issuer metadata, independent of request authority', async () => {
	const { app, f } = await server(true);
	const response = await app.inject({ url: '/.well-known/oauth-protected-resource/mcp', headers: { host: 'evil.invalid', 'x-forwarded-host': 'evil.invalid' } });
	expect(response.statusCode).toBe(200);
	expect(response.headers['access-control-allow-origin']).toBe('*');
	expect(response.json()).toEqual({ resource, authorization_servers: ['https://instance.invalid'], scopes_supported: ['access:mcp'], bearer_methods_supported: ['header'] });
	expect(f.tokens.findOne).not.toHaveBeenCalled();
});

it.each(['initialize', 'tools/list'])('requires bearer auth for %s and advertises protected-resource discovery', async method => {
	const { app, headers } = await server(true);
	const { authorization: _credential, ...anonymousHeaders } = headers;
	const response = await app.inject({ method: 'POST', url: '/mcp', headers: anonymousHeaders, payload: message(method) });
	expect(response.statusCode).toBe(401);
	expect(response.headers['www-authenticate']).toBe('Bearer realm="Misskey MCP", resource_metadata="https://instance.invalid/.well-known/oauth-protected-resource/mcp"');
	expect(response.body).not.toContain('list_my_notes');
});

it('declares OAuth access:mcp on the tool and challenges invalid or insufficient credentials', async () => {
	const { invoke, f } = await server(true);
	expect((await invoke()).json().result.tools[0].securitySchemes).toEqual([{ type: 'oauth2', scopes: ['access:mcp'] }]);
	const invalid = await invoke(message(), { authorization: 'Bearer SYNTHETIC_INVALID' });
	expect(invalid.statusCode).toBe(401);
	expect(invalid.headers['www-authenticate']).toContain('error="invalid_token"');
	f.grant.permission = [];
	const denied = await invoke();
	expect(denied.statusCode).toBe(403);
	expect(denied.headers['www-authenticate']).toContain('resource_metadata="https://instance.invalid/.well-known/oauth-protected-resource/mcp"');
	expect(denied.headers['www-authenticate']).toContain('error="insufficient_scope"');
	expect(denied.headers['www-authenticate']).toContain('scope="access:mcp"');
});

it.each(['revoked', 'permission removed'] as const)('returns tool reauthorization metadata when a prepared grant is %s', async reason => {
	const { invoke, f } = await server(true);
	f.tokens.findOneBy.mockResolvedValueOnce(f.grant).mockResolvedValueOnce(reason === 'revoked' ? null : Object.assign({}, f.grant, { permission: [] }));
	const response = await invoke(message('tools/call', { name: 'list_my_notes', arguments: {} }));
	expect(response.statusCode).toBe(200);
	const result = response.json().result;
	expect(result.isError).toBe(true);
	expect(result._meta['mcp/www_authenticate']).toHaveLength(1);
	expect(result._meta['mcp/www_authenticate'][0]).toContain(reason === 'revoked' ? 'error="invalid_token"' : 'error="insufficient_scope"');
	expect(result._meta['mcp/www_authenticate'][0]).toContain('resource_metadata="https://instance.invalid/.well-known/oauth-protected-resource/mcp"');
	expect(JSON.stringify(result._meta)).not.toContain(f.grant.token);
});

it('does not request OAuth reauthorization for an unrelated native policy error', async () => {
	const { invoke, f } = await server(true);
	f.deps.fanoutTimelineEndpointService.timeline.mockRejectedValue(apiError({ code: 'ROLE_PERMISSION_DENIED', kind: 'permission', message: 'Policy denied.', id: 'synthetic-policy-error' }));
	const response = await invoke(message('tools/call', { name: 'list_my_notes', arguments: {} }));
	expect(response.json().result.isError).toBe(true);
	expect(response.json().result).not.toHaveProperty('_meta');
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
	const missing = await app.inject({ method: 'POST', url: '/unknown', payload: { visible: 'UNKNOWN_ROUTE_LOG_BODY' } });
	expect(missing.statusCode).toBe(404);
	expect(JSON.stringify(logs.mock.calls)).toContain('UNKNOWN_ROUTE_LOG_BODY');
});

it.each(['authentication', 'tool'] as const)('cancels a listening normal transport during Fastify drain, retaining delayed %s permits', async phase => {
	const f = await fixture();
	const app = Fastify({ logger: false });
	let control!: ReturnType<typeof registerMcpTransport>;
	app.register(async child => { control = registerMcpTransport(child, f.module.get(McpApiService), { resource }); });
	let release!: () => void; let entered!: () => void; let settled = false;
	const started = new Promise<void>(resolve => { entered = resolve; });
	const delayed = new Promise<void>(resolve => { release = resolve; });
	if (phase === 'authentication') f.tokens.findOne.mockImplementation(async () => { entered(); await delayed; settled = true; return f.grant; });
	else f.deps.fanoutTimelineEndpointService.timeline.mockImplementation(async () => { entered(); await delayed; settled = true; return []; });
	let closing: Promise<void> | undefined;
	try {
		const address = new URL(await app.listen({ port: 0, host: '127.0.0.1' }));
		const response = new Promise<number | Error>(resolve => {
			const request = httpRequest(address, { method: 'POST', path: '/mcp', headers: { host: 'instance.invalid', authorization: `Bearer ${f.grant.token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' } }, response => { response.resume(); response.on('end', () => resolve(response.statusCode ?? 0)); });
			request.on('error', resolve);
			request.end(JSON.stringify(message('tools/call', { name: 'list_my_notes', arguments: {} })));
		});
		await started;
		expect(control.nativeInFlight()).toBe(1);
		let closed = false;
		closing = app.close().then(() => { closed = true; });
		await vi.waitFor(() => { expect(closed).toBe(true); }, { timeout: 1000 });
		expect(await response).toBeInstanceOf(Error);
		expect(control.activeRequests()).toBe(0);
		expect(settled).toBe(false);
		expect(control.nativeInFlight()).toBe(1);
		await app.close(); // Repeated shutdown is idempotent; it cannot release native permits.
		expect(control.nativeInFlight()).toBe(1);
		release();
		await vi.waitFor(() => { expect(control.nativeInFlight()).toBe(0); });
		expect(settled).toBe(true);
	} finally { release(); await closing; await app.close(); }
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
