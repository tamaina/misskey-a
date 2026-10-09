/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import type { ApiActor, ApiAuthorization, ApiContext, ApiServices } from '@features/api/backend/transport/context.js';
import { avatarDecorationsContract } from '@features/avatar-decorations/backend/api.definition.js';
import { createAvatarDecorationsRouter } from '@features/avatar-decorations/backend/api.implementation.js';
import type { AvatarDecorationsDependencies } from '@features/avatar-decorations/backend/api.implementation.js';

const actor: ApiActor = { id: 'alice', isSuspended: false, movedToUri: null };
const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

afterEach(() => vi.restoreAllMocks());

function fixture() {
	const deps = mockDeep<AvatarDecorationsDependencies<ApiActor>>();
	const row = {
		id: 'decoration1', name: 'Decoration', description: '', url: '/image.png',
		roleIdsThatCanBeUsedThisDecoration: ['public', 'private', 'missing'], category: null,
		updatedAt, internalOnly: 'must not reach the wire',
	};
	deps.avatarDecorationService.getAll.mockResolvedValue([row]);
	deps.avatarDecorationService.create.mockResolvedValue(row);
	deps.idService.parse.mockReturnValue({ date: createdAt });
	deps.readRoles.mockResolvedValue([{ id: 'public', isPublic: true }, { id: 'private', isPublic: false }]);
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([null, null]);
	const authorization = mockDeep<ApiAuthorization<ApiActor>>();
	authorization.rootUserId.mockReturnValue(actor.id);
	const context: ApiContext<ApiActor> = { services, authorization, credential: null, ip: '127.0.0.1', headers: {} };
	const handler = new OpenAPIHandler(createAvatarDecorationsRouter(deps));

	async function post(path: string, input: unknown) {
		const result = await handler.handle(new Request(`https://local.test/${path}`, {
			method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
		}), { context });
		if (!result.response) throw new Error('Expected a matched avatar-decoration route');
		return result.response;
	}

	return { deps, services, authorization, post };
}

test('avatar output validators are never called; explicit DTOs preserve visibility, dates, null and 204', async () => {
	const outputSpies = Object.values(avatarDecorationsContract).map(contract => {
		const schema = contract['~orpc'].outputSchema;
		if (!schema) throw new Error('Expected an explicit avatar output schema');
		return vi.spyOn(schema['~standard'], 'validate');
	});
	const h = fixture();
	const publicDto = { id: 'decoration1', name: 'Decoration', description: '', url: '/image.png', roleIdsThatCanBeUsedThisDecoration: ['public'], category: null };
	expect(await (await h.post('get-avatar-decorations', {})).json()).toEqual([publicDto]);
	h.services.authenticate.mockResolvedValue([actor, null]);
	expect(await (await h.post('get-avatar-decorations', {})).json()).toEqual([{ ...publicDto, roleIdsThatCanBeUsedThisDecoration: ['public', 'private'] }]);
	const adminDto = { ...publicDto, roleIdsThatCanBeUsedThisDecoration: ['public', 'private', 'missing'], createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
	expect(await (await h.post('admin/avatar-decorations/list', {})).json()).toEqual([adminDto]);
	expect(await (await h.post('admin/avatar-decorations/create', { name: 'Decoration', description: '', url: '/image.png' })).json()).toEqual({ ...adminDto, updatedAt: null });
	for (const path of ['admin/avatar-decorations/update', 'admin/avatar-decorations/delete']) {
		const response = await h.post(path, { id: 'decoration1', category: null });
		expect(response.status).toBe(204);
		expect(await response.text()).toBe('');
	}
	for (const spy of outputSpies) expect(spy).not.toHaveBeenCalled();
});

test('avatar input validation, default pagination and unknown-key stripping remain active', async () => {
	const schema = avatarDecorationsContract.list['~orpc'].inputSchema;
	if (!schema) throw new Error('Expected an explicit avatar input schema');
	const inputSpy = vi.spyOn(schema['~standard'], 'validate');
	const h = fixture();
	h.services.authenticate.mockResolvedValue([actor, null]);
	for (const input of [null, { limit: 0 }, { limit: 101 }, { id: 'ignored', limit: '10' }]) {
		expect((await h.post('admin/avatar-decorations/list', input)).status).toBe(400);
	}
	expect(h.deps.avatarDecorationService.getAll).not.toHaveBeenCalled();
	expect((await h.post('admin/avatar-decorations/list', { future: true })).status).toBe(200);
	expect(inputSpy).toHaveBeenCalledTimes(5);
	const parsed = await inputSpy.mock.results[4].value;
	expect(parsed).toMatchObject({ value: { limit: 10 } });
	expect(parsed.value).not.toHaveProperty('future');
	for (const input of [{ name: '', description: '', url: '/image.png' }, { name: 'Name', description: '', url: '' }]) {
		expect((await h.post('admin/avatar-decorations/create', input)).status).toBe(400);
	}
	expect(h.deps.avatarDecorationService.create).not.toHaveBeenCalled();
	expect((await h.post('admin/avatar-decorations/create', { name: 'Name', description: '', url: '/image.png', internalOnly: true })).status).toBe(200);
	expect(h.deps.avatarDecorationService.create).toHaveBeenCalledWith({ name: 'Name', description: '', url: '/image.png', roleIdsThatCanBeUsedThisDecoration: undefined, category: undefined }, actor);
});

test('avatar credential and role policy rejection still run before business logic', async () => {
	const h = fixture();
	const unauthenticated = await h.post('admin/avatar-decorations/delete', { id: 'decoration1' });
	expect(unauthenticated.status).toBe(401);
	expect(await unauthenticated.json()).toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
	h.services.authenticate.mockResolvedValue([actor, null]);
	h.authorization.rootUserId.mockReturnValue(null);
	h.authorization.roles.mockResolvedValue([]);
	h.authorization.policyAllowed.mockResolvedValue(false);
	const unauthorized = await h.post('admin/avatar-decorations/delete', { id: 'decoration1' });
	expect(unauthorized.status).toBe(403);
	expect(await unauthorized.json()).toMatchObject({ code: 'ROLE_PERMISSION_DENIED' });
	expect(h.deps.avatarDecorationService.delete).not.toHaveBeenCalled();
});
