/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import Fastify from 'fastify';
import Redis from 'ioredis';
import dns from 'node:dns/promises';
import { Response as MetadataResponse } from 'node-fetch';
import type { ResponseInit } from 'node-fetch';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { discoverOAuthServerInfo, exchangeAuthorization, startAuthorization } from '@modelcontextprotocol/sdk/client/auth.js';
import { OAuth2ProviderService } from '../../backend/oauth/OAuth2ProviderService.js';
import { MiAccessToken } from '../../backend/models/AccessToken.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { Logger } from '@features/runtime/backend/logging/logger.js';
import { HtmlTemplateService } from '@features/web/backend/http/HtmlTemplateService.js';
import { registerHttpAccessLog } from '@features/runtime/backend/http/http-access-log.js';
import { McpApiService } from '@features/mcp/backend/McpApiService.js';
import { registerMcpServer } from '@features/mcp/backend/server.js';
import { fixture } from '@features/mcp/test/backend/fixtures/shared-api.js';
import type { LogManager } from '@features/runtime/backend/logging/LogManager.js';
import type { Config } from '@/config.js';

// Explicit opt-in to a disposable, synthetic Redis socket. No production connections or grants.
const socket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
const issuer = 'https://instance.invalid';
const resource = `${issuer}/mcp`;
const clientId = 'https://chatgpt.com/oauth/client.json';
const redirectUri = 'https://chatgpt.com/connector_platform_oauth_redirect';
const cleanups: (() => Promise<unknown>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });

async function setup() {
	const f = await fixture();
	const redis = new Redis({ path: socket!, lazyConnect: true, maxRetriesPerRequest: 1 });
	await redis.connect(); cleanups.push(async () => { redis.disconnect(); });
	const config = { url: issuer, enableMcp: true } as Config;
	let nextId = 0;
	const ids = mockDeep<IdService>(); ids.gen.mockImplementation(() => `oauth-${++nextId}`);
	f.tokens.insert.mockImplementation(async row => {
		if (Array.isArray(row)) throw new Error('Only a single synthetic row is expected');
		const token = Object.assign(new MiAccessToken(), row, { appId: null });
		f.rows.set(token.id, token);
		return { raw: [], generatedMaps: [], identifiers: [{ id: token.id }] };
	});
	f.tokens.delete.mockImplementation(async criteria => {
		const fields = criteria as { id?: string; token?: string };
		for (const [id, row] of f.rows) if (id === fields.id || row.token === fields.token) f.rows.delete(id);
		return { raw: [], affected: 1 };
	});
	const logger = mockDeep<Logger>();
	const loggers = mockDeep<LoggerService>(); loggers.getLogger.mockReturnValue(logger);
	const templates = mockDeep<HtmlTemplateService>();
	templates.getCommonData.mockResolvedValue({ config, instanceUrl: issuer, langs: [], frontendViteFiles: { entryJs: null, css: [], modulePreloads: [] } } as unknown as Awaited<ReturnType<HtmlTemplateService['getCommonData']>>);
	const httpServices = [mockDeep<HttpRequestService>(), mockDeep<HttpRequestService>()];
	const providers = [0, 1].map(index => {
		const provider = new OAuth2ProviderService(config, f.tokens, f.users, ids, httpServices[index], f.cache, templates, loggers, redis);
		vi.spyOn(provider, 'fetchClientMetadata').mockImplementation(async () => new MetadataResponse(JSON.stringify({
			client_id: clientId, client_name: 'Synthetic public client', redirect_uris: [redirectUri],
			grant_types: ['authorization_code'], response_types: ['code'],
			token_endpoint_auth_methods_supported: ['none', 'private_key_jwt'],
			token_endpoint_auth_method: 'private_key_jwt',
		}), { headers: { 'content-type': 'application/json' } }));
		return provider;
	});
	const app = Fastify({ logger: false });
	const logs = vi.fn();
	registerHttpAccessLog(app, {
		isAccessLogEnabled: () => true, getActiveTraceContext: () => undefined, shouldWriteAccess: () => true,
		getAccessLogConfiguration: () => ({ bodies: { request: true, response: true } }), writeAccess: logs,
	} as unknown as LogManager);
	app.register(child => registerMcpServer(child, f.module.get(McpApiService), config));
	app.get('/.well-known/oauth-authorization-server', () => providers[0].generateRFC8414());
	app.register(child => providers[0].createServer(child), { prefix: '/oauth' });
	// Exchange on a different provider instance verifies that authorization state is shared.
	app.register(child => providers[1].createTokenServer(child), { prefix: '/oauth/token' });
	await app.ready(); cleanups.push(() => app.close());
	const fetchFixture: typeof fetch = async (input, init) => {
		const url = new URL(String(input)); expect(url.origin).toBe(issuer);
		const response = await app.inject({ method: (init?.method ?? 'GET') as 'GET' | 'POST', url: url.pathname + url.search,
			remoteAddress: '203.0.113.10', headers: { ...Object.fromEntries(new Headers(init?.headers)), host: 'instance.invalid' },
			payload: init?.body ? String(init.body) : undefined });
		return new Response(response.statusCode === 204 ? null : response.body, { status: response.statusCode, headers: response.headers as Record<string, string> });
	};
	const discovery = await discoverOAuthServerInfo(resource, { fetchFn: fetchFixture });
	const begin = async (overrides: Record<string, string> = {}) => {
		const flow = await startAuthorization(issuer, { metadata: discovery.authorizationServerMetadata, clientInformation: { client_id: clientId }, redirectUrl: redirectUri, scope: 'access:mcp', state: 'SYNTHETIC_STATE_SECRET', resource });
		for (const [key, value] of Object.entries(overrides)) { if (value === '') flow.authorizationUrl.searchParams.delete(key); else flow.authorizationUrl.searchParams.set(key, value); }
		const page = await app.inject({ url: flow.authorizationUrl.pathname + flow.authorizationUrl.search });
		return { ...flow, page };
	};
	const grant = async (overrides: Record<string, string> = {}) => {
		const flow = await begin(overrides); expect(flow.page.statusCode, flow.page.body).toBe(200);
		const transaction = flow.page.body.match(/name="misskey:oauth:transaction-id" content="([^"]+)"/)?.[1];
		expect(transaction).toBeDefined();
		const consent = await app.inject({ method: 'POST', url: '/oauth/decision', payload: { transaction_id: transaction, login_token: f.own.token } });
		expect(consent.statusCode).toBe(302);
		const callback = new URL(String(consent.headers.location));
		expect(callback.origin + callback.pathname).toBe(redirectUri);
		expect(callback.searchParams.get('iss')).toBe(issuer);
		expect(callback.searchParams.get('state')).toBe('SYNTHETIC_STATE_SECRET');
		const code = callback.searchParams.get('code')!; expect(code).toBeTruthy();
		return { ...flow, code };
	};
	const exchange = async (flow: Awaited<ReturnType<typeof grant>>) => exchangeAuthorization(issuer, {
		metadata: discovery.authorizationServerMetadata, clientInformation: { client_id: clientId }, authorizationCode: flow.code,
		codeVerifier: flow.codeVerifier, redirectUri, resource, fetchFn: fetchFixture,
	});
	return { f, app, redis, providers, httpServices, logger, logs, fetchFixture, discovery, begin, grant, exchange };
}

describe.skipIf(!socket)('synthetic OAuth discovery through native MCP (isolated Redis)', () => {
	it('negotiates CIMD none/S256, creates a native scoped row and accesses only the consenting user, then revokes', async () => {
		const s = await setup();
		expect(s.discovery.resourceMetadata?.resource).toBe(resource);
		expect(s.discovery.authorizationServerUrl).toBe(issuer);
		expect(s.discovery.authorizationServerMetadata?.token_endpoint_auth_methods_supported).toEqual(['none']);
		expect(s.discovery.authorizationServerMetadata?.code_challenge_methods_supported).toEqual(['S256']);
		const flow = await s.grant(); const token = await s.exchange(flow);
		expect(token).not.toHaveProperty('refresh_token'); expect(token).not.toHaveProperty('expires_in');
		const row = [...s.f.rows.values()].find(value => value.token === token.access_token)!;
		expect(row.userId).toBe(s.f.own.id); expect(row.permission).toEqual(['access:mcp']); expect(row.hash).toBe(token.access_token);
		const client = new Client({ name: 'synthetic-oauth-client', version: '0' });
		await client.connect(new StreamableHTTPClientTransport(new URL(resource), { fetch: s.fetchFixture, requestInit: { headers: { authorization: `Bearer ${token.access_token}` } } }));
		try {
			expect((await client.listTools()).tools.map(tool => tool.name)).toEqual(['list_my_notes']);
			const result = await client.callTool({ name: 'list_my_notes', arguments: {} });
			expect(result.structuredContent).toEqual({ notes: (await s.f.ordinary({ userId: s.f.own.id }, token.access_token)).json() });
			await expect(client.callTool({ name: 'list_my_notes', arguments: { userId: s.f.otherId } })).rejects.toBeDefined();
			s.f.rows.delete(row.id); await expect(client.listTools()).rejects.toBeDefined();
		} finally { await client.close(); }
		const captured = JSON.stringify([...s.logs.mock.calls, ...s.logger.info.mock.calls]);
		for (const secret of [flow.code, flow.codeVerifier, token.access_token, s.f.own.token, 'SYNTHETIC_STATE_SECRET']) expect(captured).not.toContain(secret);
	});

	it.each(['initialize', 'tools/list'])('keeps %s authenticated and advertises configured discovery without trusting Host', async method => {
		const s = await setup();
		const response = await s.app.inject({ method: 'POST', url: '/mcp', headers: { host: 'instance.invalid', accept: 'application/json, text/event-stream' }, payload: { jsonrpc: '2.0', id: 1, method, params: {} } });
		expect(response.statusCode).toBe(401);
		expect(response.headers['www-authenticate']).toContain(`${issuer}/.well-known/oauth-protected-resource/mcp`);
		const metadata = (await s.app.inject({ url: '/.well-known/oauth-protected-resource/mcp', headers: { host: 'evil.invalid' } })).json();
		expect(metadata.resource).toBe(resource); expect(metadata.authorization_servers).toEqual([issuer]);
	});

	it.each(['https://other.invalid/mcp', `${resource}/child`, `${resource}?alias=1`])('rejects substituted authorization resource %s', async resourceValue => {
		const s = await setup(); const flow = await s.begin({ resource: resourceValue });
		expect(flow.page.statusCode).toBeGreaterThanOrEqual(400);
		expect(s.providers[0].fetchClientMetadata).not.toHaveBeenCalled();
	});

	it('rejects a redirect outside CIMD metadata and a PKCE downgrade before native consent', async () => {
		const s = await setup();
		const badRedirect = await s.begin({ redirect_uri: `${redirectUri}/extra` });
		expect(badRedirect.page.statusCode).toBeGreaterThanOrEqual(400);
		expect(badRedirect.page.headers.location).toBeUndefined();
		const downgrade = await s.begin({ code_challenge_method: 'plain' });
		expect(downgrade.page.statusCode).toBe(302);
		const callback = new URL(String(downgrade.page.headers.location));
		expect(callback.searchParams.get('error')).toBe('invalid_request');
		expect(callback.searchParams.get('iss')).toBe(issuer);
		expect(callback.searchParams.has('code')).toBe(false);
		expect(s.f.tokens.insert).not.toHaveBeenCalled();
	});

	it.each(['resource', 'client_id', 'redirect_uri', 'code_verifier'])('denies %s substitution in token exchange and never inserts a row', async field => {
		const s = await setup(); const flow = await s.grant();
		const values: Record<string, string> = { grant_type: 'authorization_code', client_id: clientId, redirect_uri: redirectUri, code: flow.code, code_verifier: flow.codeVerifier, resource };
		values[field] = field === 'code_verifier' ? 'x'.repeat(43) : 'https://evil.invalid/substitute';
		const response = await s.app.inject({ method: 'POST', url: '/oauth/token', payload: values });
		expect(response.statusCode).toBeGreaterThanOrEqual(400); expect(s.f.tokens.insert).not.toHaveBeenCalled();
	});

	it('removes a native row when code replay races with its database insertion', async () => {
		const s = await setup(); const flow = await s.grant();
		let release!: () => void; let entered!: () => void;
		const barrier = new Promise<void>(resolve => { release = resolve; });
		const started = new Promise<void>(resolve => { entered = resolve; });
		const insert = s.f.tokens.insert.getMockImplementation()!;
		s.f.tokens.insert.mockImplementation(async row => { entered(); await barrier; return insert(row); });
		const first = s.exchange(flow).then(() => 'issued', () => 'denied');
		try {
			await started;
			await expect(s.exchange(flow)).rejects.toBeDefined();
		} finally { release(); }
		expect(await first).toBe('denied');
		expect([...s.f.rows.values()].some(row => row.name === clientId)).toBe(false);
	});

	it('deletes the inserted native row when Redis fails during the final code-state check', async () => {
		const s = await setup(); const flow = await s.grant();
		const insert = s.f.tokens.insert.getMockImplementation()!;
		s.f.tokens.insert.mockImplementation(async row => {
			const result = await insert(row);
			vi.spyOn(s.redis, 'eval').mockRejectedValueOnce(new Error('Synthetic post-insert Redis failure'));
			return result;
		});
		await expect(s.exchange(flow)).rejects.toBeDefined();
		expect([...s.f.rows.values()].some(row => row.name === clientId)).toBe(false);
		expect(s.f.tokens.delete).toHaveBeenCalled();
	});

	it.each(['/oauth/unknown', '/oauth/decision/', '/oauth/token/unknown'])('redacts sensitive payloads on OAuth fallback %s', async url => {
		const s = await setup();
		await s.app.inject({ method: 'POST', url: `${url}?state=UNKNOWN_STATE_SENTINEL`, payload: { login_token: 'UNKNOWN_LOGIN_SENTINEL', code: 'UNKNOWN_CODE_SENTINEL', code_verifier: 'UNKNOWN_VERIFIER_SENTINEL', client_secret: 'UNKNOWN_SECRET_SENTINEL' } });
		const captured = JSON.stringify(s.logs.mock.calls);
		for (const secret of ['UNKNOWN_STATE_SENTINEL', 'UNKNOWN_LOGIN_SENTINEL', 'UNKNOWN_CODE_SENTINEL', 'UNKNOWN_VERIFIER_SENTINEL', 'UNKNOWN_SECRET_SENTINEL']) expect(captured).not.toContain(secret);
	});

	it.each(['json', 'html'])('preserves legacy %s IndieAuth consent and empty-secret token exchange without a resource', async format => {
		const s = await setup();
		const body = format === 'json' ? JSON.stringify({ client_id: clientId, client_uri: 'https://chatgpt.com/', client_name: 'Legacy synthetic client', redirect_uris: [redirectUri] })
			: `<html><head><link rel="redirect_uri" href="${redirectUri}"></head><body><div class="h-app"><span class="p-name">Legacy synthetic client</span></div></body></html>`;
		vi.mocked(s.providers[0].fetchClientMetadata).mockResolvedValue(new MetadataResponse(body, { url: clientId, headers: { 'content-type': format === 'json' ? 'application/json' : 'text/html' } } as ResponseInit & { url: string }));
		const flow = await s.grant({ resource: '', scope: 'read:account' });
		expect(s.providers[0].fetchClientMetadata).toHaveBeenCalledWith(clientId);
		expect(s.httpServices[0].send).not.toHaveBeenCalled();
		const response = await s.app.inject({ method: 'POST', url: '/oauth/token', payload: { grant_type: 'authorization_code', client_id: clientId, client_secret: '', redirect_uri: redirectUri, code: flow.code, code_verifier: flow.codeVerifier } });
		expect(response.statusCode).toBe(200);
		const token = response.json(); expect(token.scope).toBe('read:account');
		const row = [...s.f.rows.values()].find(value => value.token === token.access_token)!;
		expect(row.permission).toEqual(['read:account']);
		const denied = await s.app.inject({ method: 'POST', url: '/mcp', headers: { host: 'instance.invalid', authorization: `Bearer ${token.access_token}`, accept: 'application/json, text/event-stream' }, payload: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} } });
		expect(denied.statusCode).toBe(403);
	});

	it('accepts globally advertised CIMD for a non-MCP native scope without resource or client_uri', async () => {
		const s = await setup();
		expect(s.discovery.authorizationServerMetadata?.client_id_metadata_document_supported).toBe(true);
		const flow = await s.grant({ resource: '', scope: 'read:account' });
		expect(s.providers[0].fetchClientMetadata).toHaveBeenCalledWith(clientId);
		expect(s.httpServices[0].send).not.toHaveBeenCalled();
		const token = await exchangeAuthorization(issuer, { metadata: s.discovery.authorizationServerMetadata, clientInformation: { client_id: clientId }, authorizationCode: flow.code, codeVerifier: flow.codeVerifier, redirectUri, fetchFn: s.fetchFixture });
		const row = [...s.f.rows.values()].find(value => value.token === token.access_token)!;
		expect(row.permission).toEqual(['read:account']);
		expect(row.userId).toBe(s.f.own.id);
		const denied = await s.app.inject({ method: 'POST', url: '/mcp', headers: { host: 'instance.invalid', authorization: `Bearer ${token.access_token}`, accept: 'application/json, text/event-stream' }, payload: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} } });
		expect(denied.statusCode).toBe(403);
	});

	it.each(['client_id', 'redirect_uris', 'methods'])('validates no-resource CIMD %s without falling back to generic fetching', async field => {
		const s = await setup();
		const document: Record<string, unknown> = { client_id: clientId, client_name: 'Synthetic CIMD', redirect_uris: [redirectUri], token_endpoint_auth_methods_supported: ['none', 'private_key_jwt'], token_endpoint_auth_method: 'private_key_jwt' };
		if (field === 'client_id') document.client_id = 'https://chatgpt.com/oauth/other.json';
		if (field === 'redirect_uris') document.redirect_uris = [`${redirectUri}/extra`];
		if (field === 'methods') document.token_endpoint_auth_methods_supported = ['private_key_jwt'];
		vi.mocked(s.providers[0].fetchClientMetadata).mockResolvedValue(new MetadataResponse(JSON.stringify(document), { headers: { 'content-type': 'application/json' } }));
		const flow = await s.begin({ resource: '', scope: 'read:account' });
		expect(flow.page.statusCode).toBeGreaterThanOrEqual(400);
		expect(flow.page.headers.location).toBeUndefined();
		expect(s.httpServices[0].send).not.toHaveBeenCalled();
		expect(s.f.tokens.insert).not.toHaveBeenCalled();
	});

	it('keeps no-resource CIMD public clients secret-free at token exchange', async () => {
		const s = await setup(); const flow = await s.grant({ resource: '', scope: 'read:account' });
		const response = await s.app.inject({ method: 'POST', url: '/oauth/token', payload: { grant_type: 'authorization_code', client_id: clientId, client_secret: '', redirect_uri: redirectUri, code: flow.code, code_verifier: flow.codeVerifier } });
		expect(response.statusCode).toBeGreaterThanOrEqual(400);
		expect(s.f.tokens.insert).not.toHaveBeenCalled();
	});

	it('never falls back to generic HTTP after strict no-resource metadata fetching fails', async () => {
		const s = await setup();
		vi.mocked(s.providers[0].fetchClientMetadata).mockRejectedValue(new Error('Synthetic strict metadata rejection'));
		const flow = await s.begin({ resource: '', scope: 'read:account' });
		expect(flow.page.statusCode).toBeGreaterThanOrEqual(400);
		expect(s.providers[0].fetchClientMetadata).toHaveBeenCalledWith(clientId);
		expect(s.httpServices[0].send).not.toHaveBeenCalled();
	});

	it.each(['cimd', 'legacy'])('requires canonical resource for access:mcp even with %s metadata', async format => {
		const s = await setup();
		if (format === 'legacy') vi.mocked(s.providers[0].fetchClientMetadata).mockResolvedValue(new MetadataResponse(JSON.stringify({ client_id: clientId, client_uri: 'https://chatgpt.com/', client_name: 'Legacy', redirect_uris: [redirectUri] }), { url: clientId, headers: { 'content-type': 'application/json' } } as ResponseInit & { url: string }));
		const flow = await s.begin({ resource: '' });
		expect(flow.page.statusCode).toBeGreaterThanOrEqual(400);
		expect(s.providers[0].fetchClientMetadata).not.toHaveBeenCalled();
		expect(s.f.tokens.insert).not.toHaveBeenCalled();
	});

	it.each(['absent', 'singular', 'plural'])('preserves root HTTPS IndieAuth with %s auth metadata through existing generic discovery', async authMetadata => {
		const s = await setup(); const legacyClient = 'https://legacy.invalid/';
		vi.spyOn(dns, 'lookup').mockImplementation((async () => ({ address: '203.0.113.10', family: 4 })) as unknown as typeof dns.lookup);
		const authFields = authMetadata === 'singular' ? { token_endpoint_auth_method: 'none' } : authMetadata === 'plural' ? { token_endpoint_auth_methods_supported: ['none'] } : {};
		s.httpServices[0].send.mockResolvedValue(new MetadataResponse(JSON.stringify({ client_id: legacyClient, client_uri: legacyClient, client_name: 'Legacy root client', redirect_uris: [redirectUri], ...authFields }), { url: legacyClient, headers: { 'content-type': 'application/json' } } as ResponseInit & { url: string }));
		const flow = await s.grant({ client_id: legacyClient, resource: '', scope: 'read:account' });
		expect(s.providers[0].fetchClientMetadata).not.toHaveBeenCalled();
		expect(s.httpServices[0].send).toHaveBeenCalledWith(legacyClient);
		const response = await s.app.inject({ method: 'POST', url: '/oauth/token', payload: { grant_type: 'authorization_code', client_id: legacyClient, client_secret: '', redirect_uri: redirectUri, code: flow.code, code_verifier: flow.codeVerifier } });
		expect(response.statusCode).toBe(200); expect(response.json().scope).toBe('read:account');
	});

	it('rejects code replay on another worker and removes the previously issued native row', async () => {
		const s = await setup(); const flow = await s.grant(); const token = await s.exchange(flow);
		await expect(s.exchange(flow)).rejects.toBeDefined();
		expect([...s.f.rows.values()].some(row => row.token === token.access_token)).toBe(false);
	});
});
