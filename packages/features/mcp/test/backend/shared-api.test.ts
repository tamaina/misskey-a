/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { describe, expect, it } from 'vitest';
import { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { pilotContract } from '@features/index/backend/api.definition.js';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
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
		expect(f.grant.permission).toEqual([]);
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
		expect(await auth.authenticate(f.own.token)).toEqual([f.own, null]);
		for (const credential of [f.grant.token, f.appGrant.hash, '0123456789abcdef']) expect(await f.invoke({}, credential)).toEqual((await f.ordinary({ userId: f.own.id }, credential)).json());
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
