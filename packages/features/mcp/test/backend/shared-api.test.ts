/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { describe, expect, it, vi } from 'vitest';
import { implement, call } from '@orpc/server';
import { usersNotesContract } from '@features/timelines/backend/endpoints/users/notes.contract.js';
import { ApiRouterProvider } from '@features/index/backend/api.implementation.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { pilotContract } from '@features/index/backend/api.definition.js';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { apiPolicy } from '@features/api/backend/transport/middleware.js';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';
import { McpApiService } from '../../backend/McpApiService.js';
import { createAllowedApiCaller } from '../../backend/api-caller.js';
import { fixture } from './fixtures/shared-api.js';

describe('inactive MCP application seam through shared native API', () => {
	it('matches HTTP native own-note output, defaults and all four visibility values with a kindless scoped token', async () => {
		const f = await fixture();
		const direct = await f.ordinary({ userId: f.own.id });
		expect(direct.statusCode).toBe(200);
		expect(await f.invoke()).toEqual(direct.json());
		expect(direct.json().map((note: { visibility: string }) => note.visibility)).toEqual(['public', 'home', 'followers', 'specified']);
		expect(f.grant.permission).toEqual(['access:mcp']);
		expect(f.tokens.findOne).toHaveBeenCalledTimes(2); // once per request, no duplicate MCP authentication
		expect(f.deps.queryService.makePaginationQuery).not.toHaveBeenCalled();
	});
	it('keeps HTTP bearer precedence and does not expose a network MCP route', async () => {
		const f = await fixture();
		const response = await f.http.inject({ method: 'POST', url: '/api/users/notes', headers: { authorization: `Bearer ${f.grant.token}` }, payload: { userId: f.own.id, i: 'synthetic-invalid-token' } });
		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(await f.invoke());
		expect((await f.http.inject({ method: 'POST', url: '/mcp', payload: {} })).statusCode).toBe(404);
	});
	it('preserves MiAuth, app-derived permissions and master-token null tuple', async () => {
		const f = await fixture(); const auth = f.module.get(AuthenticateService);
		expect((await auth.authenticate(f.grant.token))[1]).toBe(f.grant);
		expect((await auth.authenticate(f.appGrant.hash))[1]).toEqual({ id: f.appGrant.id, permission: f.app.permission });
		expect(await auth.authenticate(f.own.token!)).toEqual([f.own, null]);
		for (const credential of [f.grant.token, f.appGrant.hash]) expect(await f.invoke({}, credential)).toEqual((await f.ordinary({ userId: f.own.id }, credential)).json());
		await expect(f.invoke({}, f.own.token!)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect((await f.ordinary({ userId: f.own.id }, f.own.token!)).statusCode).toBe(200);
	});
	it('applies native insufficient-permission errors on a protected endpoint without inventing a users/notes scope', async () => {
		const f = await fixture(); const dispatch = createAllowedApiCaller(f.router, pilotContract, ['my/apps']);
		const context = f.module.get(ApiExecutionContextFactory);
		const direct = await f.ordinary({}, f.grant.token, 'my/apps');
		expect(direct.statusCode).toBe(403);
		await expect(dispatch('my/apps', {}, context.create(f.request(), 'my/apps'))).rejects.toMatchObject({ code: direct.json().error.code });
		f.grant.permission = ['read:account'];
		expect(await dispatch('my/apps', {}, context.create(f.request(), 'my/apps'))).toEqual((await f.ordinary({}, f.grant.token, 'my/apps')).json());
	});
	it('rechecks revocation for each MCP request and matches HTTP authentication failure', async () => {
		const f = await fixture(); await f.invoke(); f.rows.delete(f.grant.id);
		const direct = await f.ordinary({ userId: f.own.id });
		expect(direct.statusCode).toBe(401);
		await expect(f.invoke()).rejects.toMatchObject({ code: direct.json().error.code });
	});
	it('denies foreign subject before native invocation; native API itself hides foreign restricted notes', async () => {
		const f = await fixture();
		const foreign = await f.ordinary({ userId: f.otherId });
		expect(foreign.json().map((note: { visibility: string }) => note.visibility)).toEqual(['public', 'home']);
		f.deps.fanoutTimelineEndpointService.timeline.mockClear();
		await expect(f.invoke({ userId: f.otherId })).rejects.toMatchObject({ code: 'SUBJECT_MISMATCH' });
		expect(f.deps.fanoutTimelineEndpointService.timeline).not.toHaveBeenCalled();
	});
	it.each([{ limit: '10' }, { limit: 101 }, { withReplies: true, withFiles: true }])('retains native validation/error for %j', async input => {
		const f = await fixture(); const direct = await f.ordinary({ userId: f.own.id, ...input });
		expect(direct.statusCode).toBe(400);
		await expect(f.invoke(input)).rejects.toMatchObject({ code: direct.json().error.code });
	});
	it('preserves native blocking and prevents arbitrary tools/unauthenticated subjects/cancelled calls', async () => {
		const f = await fixture(); f.blocked.add(f.own.id);
		expect(await f.invoke()).toEqual((await f.ordinary({ userId: f.own.id })).json());
		const mcp = f.module.get(McpApiService);
		await expect(mcp.invoke('notes/delete', {}, f.request())).rejects.toMatchObject({ code: 'TOOL_UNAVAILABLE' });
		await expect(mcp.invoke('list_my_notes', {}, { ...f.request(), credential: undefined })).rejects.toMatchObject({ code: 'SUBJECT_REQUIRED' });
		const abort = new AbortController(); abort.abort(); f.tokens.findOne.mockClear();
		await expect(mcp.invoke('list_my_notes', {}, f.request(), abort.signal)).rejects.toBeDefined();
		expect(f.tokens.findOne).not.toHaveBeenCalled();
	});
	it('omits private diagnostic cause/arguments from MCP errors, logger and telemetry', async () => {
		const f = await fixture(); const secret = 'PRIVATE_SYNTHETIC_SENTINEL';
		f.deps.fanoutTimelineEndpointService.timeline.mockRejectedValue(Object.assign(new Error(secret), { name: secret }));
		const error = await f.module.get(McpApiService).invoke('list_my_notes', { limit: 1 }, { ...f.request(), params: { i: f.grant.token, private: secret } }).catch(error => error);
		expect(misskeyErrorBody(error).error.code).toBe('INTERNAL_ERROR');
		expect(JSON.stringify([misskeyErrorBody(error), f.logger.logger.write.mock.calls, f.telemetry.captureMessage.mock.calls])).not.toContain(secret);
		expect(JSON.stringify(f.logger.logger.write.mock.calls)).not.toContain(f.grant.token);
	});
});

it('requires explicit MCP access while preserving normal native API behavior for old empty-permission tokens', async () => {
	const f = await fixture(); f.grant.permission = [];
	expect((await f.ordinary({ userId: f.own.id })).statusCode).toBe(200);
	await expect(f.invoke()).rejects.toMatchObject({ code: 'PERMISSION_DENIED', status: 403 });
	f.grant.permission = ['access:mcp']; expect(await f.invoke()).toEqual((await f.ordinary({ userId: f.own.id })).json());
	expect((await f.ordinary({}, f.grant.token, 'my/apps')).statusCode).toBe(403);
});
it('rechecks MCP access on each request and every prepared tool invocation', async () => {
	const f = await fixture(); const service = f.module.get(McpApiService);
	const prepared = await service.prepare(f.request()); await prepared.invoke('list_my_notes', {});
	f.grant.permission = ['read:account'];
	await expect(f.invoke()).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	await expect(prepared.invoke('list_my_notes', {})).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	expect((await f.ordinary({}, f.grant.token, 'my/apps')).statusCode).toBe(200);
	f.grant.permission = ['access:mcp']; await f.invoke(); f.rows.delete(f.grant.id);
	await expect(prepared.invoke('list_my_notes', {})).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });
});
it('checks fresh app permissions rather than stale native app cache or token-row permissions', async () => {
	const f = await fixture(); await f.invoke({}, f.appGrant.hash);
	f.apps.findOneBy.mockResolvedValue(Object.assign({}, f.app, { permission: ['read:account'] }));
	expect((await f.module.get(AuthenticateService).authenticate(f.appGrant.hash))[1]?.permission).toContain('access:mcp');
	f.appGrant.permission = ['access:mcp'];
	await expect(f.invoke({}, f.appGrant.hash)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	f.apps.findOneBy.mockResolvedValue(f.app); await f.invoke({}, f.appGrant.hash);
});
it('passes the original nonnull grant tuple to native procedures and never upgrades downstream permissions', async () => {
	const f = await fixture(); const protectedCall = createAllowedApiCaller(f.router, pilotContract, ['my/apps']);
	const observed = implement(usersNotesContract).$context<ApiContext<MiLocalUser>>().handler(async ({ input, context }) => {
		const tuple = await context.services!.authenticate(context.credential);
		expect(tuple[1]?.id).toBe(f.grant.id); expect(tuple[1]?.permission).toEqual(['access:mcp']);
		await expect(protectedCall('my/apps', {}, context)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		return call(f.router.timelines.usersNotes, input, { context });
	});
	const provider = f.module.get(ApiRouterProvider);
	vi.spyOn(provider, 'compose').mockReturnValue(Object.assign({}, provider.compose(), { timelines: Object.assign({}, f.router.timelines, { usersNotes: observed }) }));
	expect(await f.invoke()).toEqual((await f.ordinary({ userId: f.own.id })).json());
});

it('discovers current token API candidates and provides native input definitions', async () => {
	const f = await fixture(); const service = f.module.get(McpApiService);
	const list = await service.invoke('list_api_endpoints', { endpoint: 'users/notes' }, f.request()) as { endpoints: string[]; definitions: { inputSchema: unknown }[] };
	expect(list.endpoints).toContain('users/notes'); expect(list.endpoints).not.toContain('notes/reactions/create');
	expect(list.endpoints).not.toContain('miauth/gen-token'); expect(list.endpoints).not.toContain('admin/meta');
	expect(JSON.stringify(list.definitions[0].inputSchema)).toContain('userId');
	const api = await f.ordinary({}, f.grant.token, 'available-endpoints'); expect(api.statusCode).toBe(200);
	expect(api.json().endpoints).toContain('users/notes'); expect(api.json().endpoints).not.toContain('notes/reactions/create');
	f.grant.permission.push('write:reactions');
	expect((await f.ordinary({}, f.grant.token, 'available-endpoints')).json().endpoints).toContain('notes/reactions/create');
	f.rows.delete(f.grant.id); expect((await f.ordinary({}, f.grant.token, 'available-endpoints')).statusCode).toBe(401);
});
it('omits non-productive contract endpoints from MCP discovery and call_api while native listing still includes them', async () => {
	const f = await fixture(); const service = f.module.get(McpApiService);
	const listed = await service.invoke('list_api_endpoints', {}, f.request()) as { endpoints: string[] };
	expect(listed.endpoints).toContain('users/notes');
	expect(listed.endpoints).not.toContain('reset-db');
	expect(listed.endpoints).not.toContain('test');
	for (const endpoint of ['reset-db', 'test']) {
		const lookup = await service.invoke('list_api_endpoints', { endpoint }, f.request()) as { endpoints: string[]; definitions: { name: string }[] };
		expect(lookup.endpoints).not.toContain(endpoint);
		expect(lookup.definitions).toEqual([]);
		await expect(service.invoke('call_api', { endpoint, arguments: {} }, f.request())).rejects.toMatchObject({ code: 'TOOL_UNAVAILABLE' });
	}
	expect(await service.invoke('call_api', { endpoint: 'users/notes', arguments: { userId: f.own.id } }, f.request())).toEqual((await f.ordinary({ userId: f.own.id })).json());
	const http = await f.ordinary({}, f.grant.token, 'available-endpoints');
	expect(http.statusCode).toBe(200);
	expect(http.json().endpoints).toEqual(expect.arrayContaining(['reset-db', 'test', 'users/notes']));
});
it('routes generic reads and writes through native validation/permissions, with fresh revocation and no arbitrary URLs', async () => {
	const f = await fixture(); const prepared = await f.module.get(McpApiService).prepare(f.request());
	const visiblePrivate = f.notes.find(note => note.userId === f.otherId && note.visibility === 'specified')!;
	visiblePrivate.visibleUserIds = [f.own.id];
	const read = { endpoint: 'users/notes', arguments: { userId: f.otherId } };
	const viewed = await prepared.invoke('call_api', read);
	expect(viewed).toEqual((await f.ordinary(read.arguments)).json());
	expect(viewed).toContainEqual(expect.objectContaining({ id: visiblePrivate.id, visibility: 'specified' }));
	const write = { endpoint: 'notes/reactions/create', arguments: { noteId: 'aaaaaaaaaaaaaaa0', reaction: '❤️' } };
	await expect(prepared.invoke('call_api', write)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	expect(f.reactions.createReaction).not.toHaveBeenCalled();
	f.grant.permission.push('write:reactions');
	await prepared.invoke('call_api', write); expect(f.reactions.createReaction).toHaveBeenCalledTimes(1);
	f.grant.permission = ['access:mcp'];
	await expect(prepared.invoke('call_api', write)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	await expect(prepared.invoke('call_api', { endpoint: 'users/notes', arguments: { userId: f.own.id, limit: '1' } })).rejects.toBeDefined();
	for (const endpoint of ['https://remote.invalid/api', '../users/notes', '/users/notes', 'miauth/gen-token', 'i/regenerate-token', 'i/webhooks/create', 'not-found']) {
		await expect(prepared.invoke('call_api', { endpoint, arguments: {} })).rejects.toMatchObject({ code: 'TOOL_UNAVAILABLE' });
	}
	await expect(prepared.invoke('call_api', { endpoint: 'users/notes', arguments: { userId: f.own.id, i: f.own.token } })).rejects.toBeDefined();
	f.grant.permission = ['access:mcp', 'write:reactions']; f.own.movedToUri = 'https://other.invalid';
	await expect(prepared.invoke('call_api', write)).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_MOVED' });
	f.own.movedToUri = null; f.own.isSuspended = true;
	await expect(prepared.invoke('call_api', write)).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_SUSPENDED' });
	f.rows.delete(f.grant.id); await expect(prepared.invoke('call_api', read)).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });
});

it('refreshes app permissions for native discovery and excludes denied definitions without caching grants', async () => {
	const f = await fixture();
	const first = await f.ordinary({ endpoint: 'notes/reactions/create' }, f.appGrant.hash, 'available-endpoints');
	expect(first.statusCode).toBe(200); expect(first.headers['cache-control']).toBe('no-store');
	expect(first.json().definitions).toEqual([]);
	f.apps.findOneBy.mockResolvedValue(Object.assign({}, f.app, { permission: ['access:mcp', 'write:reactions'] }));
	const refreshed = await f.ordinary({ endpoint: 'notes/reactions/create' }, f.appGrant.hash, 'available-endpoints');
	expect(refreshed.json().permissions).toEqual(['access:mcp', 'write:reactions']);
	expect(refreshed.json().definitions).toContainEqual(expect.objectContaining({ name: 'notes/reactions/create', permission: 'write:reactions' }));
	f.apps.findOneBy.mockResolvedValue(null);
	expect((await f.ordinary({}, f.appGrant.hash, 'available-endpoints')).statusCode).toBe(401);
	expect((await f.http.inject({ method: 'POST', url: '/api/available-endpoints', payload: {} })).statusCode).toBe(401);
});
it('preserves a declared native rate limit before executing a generic tool handler', async () => {
	const f = await fixture();
	const limiter = f.module.get(RateLimiterService);
	vi.mocked(limiter.limit).mockResolvedValue({ code: 'RATE_LIMIT_EXCEEDED', info: { resetMs: Date.now() + 60000 } } as Awaited<ReturnType<RateLimiterService['limit']>>);
	const handler = vi.fn(async ({ input, context }: { input: { userId: string }; context: ApiContext<MiLocalUser> }) => call(f.router.timelines.usersNotes, input, { context }));
	const limited = createApiProcedure<MiLocalUser>()(usersNotesContract)
		.use(apiPolicy<MiLocalUser>({ name: 'users/notes', limit: { duration: 60000, max: 1 } })).handler(handler);
	const provider = f.module.get(ApiRouterProvider);
	vi.spyOn(provider, 'compose').mockReturnValue(Object.assign({}, provider.compose(), { timelines: Object.assign({}, f.router.timelines, { usersNotes: limited }) }));
	await expect(f.module.get(McpApiService).invoke('call_api', { endpoint: 'users/notes', arguments: { userId: f.own.id } }, f.request())).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' });
	expect(limiter.limit).toHaveBeenCalled(); expect(handler).not.toHaveBeenCalled();
});
