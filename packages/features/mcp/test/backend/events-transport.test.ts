/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, expect, it, vi } from 'vitest';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { createLocalMcpPilot } from '../../backend/local-transport.js';
import type { McpApiService } from '../../backend/McpApiService.js';
const close: (() => Promise<unknown>)[] = [];

afterEach(async () => { vi.restoreAllMocks(); for (const callback of close.splice(0)) await callback(); });

async function pilot(expiresAt?: Date) {
	const invoke = vi.fn(async () => []);
	const events = vi.fn(async (method: string): Promise<unknown> => method === 'events/subscribe' ? { id: 'synthetic-sub', refreshBefore: '2026-10-12T00:00:00Z', cursor: null, truncated: false } : method === 'events/list' ? { events: [] } : {});
	const service = { prepare: vi.fn(async () => ({ invoke, events, expiresAt })), requiredScopes: () => ['access:mcp'] } as unknown as McpApiService;
	const p = createLocalMcpPilot(service, { enabled: true, resource: 'http://127.0.0.1:61836/mcp' }); await p.app.ready(); close.push(() => p.app.close());
	const request = (method: string, params: object = {}, extra: Record<string, string> = {}) => p.app.inject({ method: 'POST', url: '/mcp', headers: {
		host: '127.0.0.1:61836', authorization: 'Bearer synthetic', 'content-type': 'application/json', accept: 'application/json, text/event-stream',
		'mcp-method': method, 'mcp-protocol-version': '2026-07-28', ...extra,
	}, payload: { jsonrpc: '2.0', id: 1, method, params: { ...params, _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } } } });
	return { request, events, p, invoke };
}

it('serves modern discovery, events and tools on the same authenticated endpoint', async () => {
	const { request, events, invoke } = await pilot();
	const discovery = await request('server/discover'); expect(discovery.statusCode).toBe(200);
	// MCP 2026-07-28 DiscoverResult requires both cache fields on the wire.
	expect(discovery.json().result).toMatchObject({ resultType: 'complete', supportedVersions: ['2026-07-28'], capabilities: { events: {}, tools: {} }, cacheScope: 'private', ttlMs: 0 });
	for (const method of ['events/list', 'events/subscribe', 'events/unsubscribe']) {
		const response = await request(method, { synthetic: true }); expect(response.statusCode).toBe(200); expect(response.json().result.resultType).toBe('complete');
		expect(events).toHaveBeenCalledWith(method, { synthetic: true }, expect.any(AbortSignal));
	}
	expect((await request('tools/list')).json().result.tools).toHaveLength(3);
	expect((await request('tools/call', { name: 'list_my_notes', arguments: {} }, { 'mcp-name': 'list_my_notes' })).json().result.resultType).toBe('complete'); expect(invoke).toHaveBeenCalled();
});
it('rejects mirrored-header mismatch and missing authorization without executing events', async () => {
	const { request, events } = await pilot();
	const mismatch = await request('events/subscribe', {}, { 'mcp-method': 'events/unsubscribe' });
	expect(mismatch.statusCode).toBe(400); expect(mismatch.json().error.code).toBe(-32020);
	expect((await request('events/subscribe', {}, { authorization: '' })).statusCode).toBe(401); expect(events).not.toHaveBeenCalled();
	expect((await request('events/poll')).statusCode).toBe(404);
});

it('preserves native authorization challenge metadata in modern tool results', async () => {
	const { request, invoke } = await pilot();
	// Native permission failures use the existing tool error adapter.
	invoke.mockRejectedValue(apiError({ code: 'PERMISSION_DENIED', kind: 'permission', message: 'Denied', id: 'synthetic' }));
	const response = await request('tools/call', { name: 'list_my_notes', arguments: {} }, { 'mcp-name': 'list_my_notes' });
	expect(response.json().result._meta['mcp/www_authenticate']).toBeDefined();
	expect(response.json().result._meta['io.modelcontextprotocol/serverInfo']).toBeDefined();
});

it('modern output checks wall-clock expiry even before its idle timer has a turn', async () => {
	const now = vi.spyOn(Date, 'now').mockReturnValue(1000); const h = await pilot(new Date(2000));
	h.events.mockImplementationOnce(async () => { now.mockReturnValue(2000); return { secret: 'SYNTHETIC_PRIVATE_OUTPUT' }; });
	const result = await h.request('events/list').catch(error => error);
	expect(result).toBeInstanceOf(Error);
	expect(h.events).toHaveBeenCalledOnce(); expect(h.p.activeRequests()).toBe(0);
});
