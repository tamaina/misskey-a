/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it, vi } from 'vitest';
import { DEFAULT_POLICIES, RoleService } from '@features/roles/backend/services/RoleService.js';
import type { MiRole } from '@features/roles/backend/models/Role.js';
import { pilotContract } from '@features/index/backend/api.definition.js';
import { endpointPolicies } from '@features/api/backend/transport/endpoint-directory.js';
import { McpApiService } from '../../backend/McpApiService.js';
import { fixture } from './fixtures/shared-api.js';

const role = (isAdministrator = false): MiRole => ({ id: 'synthetic-role', isAdministrator, isModerator: !isAdministrator }) as MiRole;
const adInput = { url: 'https://example.invalid', imageUrl: 'https://example.invalid/ad.png', memo: 'synthetic', place: 'square', priority: 'low', ratio: 1, startsAt: 0, expiresAt: 2000000000000, dayOfWeek: 0 };

it('classifies support from native gates rather than admin tags or scope prefixes', () => {
	const endpoints = endpointPolicies(pilotContract);
	for (const name of ['admin/meta', 'admin/ad/create', 'admin/emoji/add']) expect(endpoints.find(endpoint => endpoint.name === name)?.mcpSupported).toBe(true);
	for (const name of ['admin/reset-password', 'miauth/gen-token', 'i/regenerate-token', 'i/webhooks/create', 'drive/files/create']) expect(endpoints.find(endpoint => endpoint.name === name)?.mcpSupported ?? false).toBe(false);
	// Report remaining unsupported administrative policies without dispatching any handler.
	const excluded = endpoints.filter(endpoint => endpoint.name.startsWith('admin/') && !endpoint.mcpSupported).map(endpoint => ({ name: endpoint.name, secure: endpoint.policy.secure, kind: endpoint.policy.kind }));
	expect(excluded.length).toBeGreaterThan(0);
	console.info('Unsupported administrative MCP endpoints:', JSON.stringify(excluded));
});

it('requires both current account role and native scope for administrative discovery and dispatch', async () => {
	const f = await fixture(); const service = f.module.get(McpApiService);
	const prepared = await service.prepare(f.request());
	const discover = async () => (await prepared.invoke('list_api_endpoints', {}) as { endpoints: string[] }).endpoints;
	f.grant.permission.push('read:admin:ad', 'write:admin:ad', 'read:admin:meta');
	expect(await discover()).not.toContain('admin/ad/list');
	await expect(prepared.invoke('call_api', { endpoint: 'admin/ad/list', arguments: {} })).rejects.toMatchObject({ code: 'ROLE_PERMISSION_DENIED' });
	f.roles.getUserRoles.mockResolvedValue([role(true)]); f.grant.permission = ['access:mcp'];
	expect(await discover()).not.toContain('admin/ad/list');
	await expect(prepared.invoke('call_api', { endpoint: 'admin/ad/list', arguments: {} })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	expect(f.ads.queryService.makePaginationQuery).not.toHaveBeenCalled();
	f.grant.permission.push('read:admin:ad');
	expect(await discover()).toContain('admin/ad/list');
	expect(await prepared.invoke('call_api', { endpoint: 'admin/ad/list', arguments: {} })).toEqual([]);
	expect(f.roles.getUserRoles).toHaveBeenCalledWith(f.own.id, true);
	await expect(prepared.invoke('call_api', { endpoint: 'admin/ad/list', arguments: { limit: '1' } })).rejects.toMatchObject({ code: 'INVALID_PARAM' });
});

it('honors moderator versus administrator and required role policies on discovery', async () => {
	const f = await fixture(); const service = f.module.get(McpApiService);
	f.grant.permission.push('read:admin:ad', 'read:admin:meta', 'write:admin:emoji');
	f.roles.getUserRoles.mockResolvedValue([role()]);
	const list = async () => (await service.invoke('list_api_endpoints', {}, f.request()) as { endpoints: string[] }).endpoints;
	expect(await list()).toContain('admin/ad/list'); expect(await list()).not.toContain('admin/meta');
	expect(await list()).not.toContain('admin/emoji/add');
	f.roles.getUserPolicies.mockResolvedValue({ ...DEFAULT_POLICIES, canManageCustomEmojis: true });
	expect(await list()).toContain('admin/emoji/add');
	expect(f.roles.getUserPolicies).toHaveBeenCalledWith(f.own.id, true);
	f.roles.getUserRoles.mockResolvedValue([role(true)]);
	expect(await list()).toContain('admin/meta');
});

it('preserves native write validation, audit attribution and sensitive target guards', async () => {
	const f = await fixture(); const prepared = await f.module.get(McpApiService).prepare(f.request());
	f.roles.getUserRoles.mockResolvedValue([role()]);
	f.grant.permission.push('write:admin:ad', 'write:admin:suspend-user');
	await expect(prepared.invoke('call_api', { endpoint: 'admin/ad/create', arguments: { ...adInput, ratio: '1' } })).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(f.ads.adsRepository.insertOne).not.toHaveBeenCalled(); expect(f.ads.moderationLogService.log).not.toHaveBeenCalled();
	const result = await prepared.invoke('call_api', { endpoint: 'admin/ad/create', arguments: adInput });
	expect(result).toMatchObject({ id: 'ffffffffffffffff', memo: 'synthetic' });
	expect(f.ads.moderationLogService.log).toHaveBeenCalledWith(f.own, 'createAd', expect.objectContaining({ adId: 'ffffffffffffffff' }));
	f.moderation.roleService.isModerator.mockResolvedValue(true);
	await expect(prepared.invoke('call_api', { endpoint: 'admin/suspend-user', arguments: { userId: f.otherId } })).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
	expect(f.moderation.userSuspendService.suspend).not.toHaveBeenCalled();
});

it('rechecks role downgrade, fresh account suspension/deletion, scope removal and grant revocation on a prepared connection', async () => {
	const f = await fixture(); const prepared = await f.module.get(McpApiService).prepare(f.request());
	f.grant.permission.push('read:admin:ad'); f.roles.getUserRoles.mockResolvedValue([role(true)]);
	const read = () => prepared.invoke('call_api', { endpoint: 'admin/ad/list', arguments: {} });
	await read(); f.roles.getUserRoles.mockResolvedValue([]);
	await expect(read()).rejects.toMatchObject({ code: 'ROLE_PERMISSION_DENIED' });
	f.roles.getUserRoles.mockResolvedValue([role(true)]);
	f.users.findOneBy.mockResolvedValue(Object.assign({}, f.own, { isSuspended: true }));
	expect(f.own.isSuspended).toBe(false); // cached authenticated principal remains stale
	await expect(read()).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_SUSPENDED' });
	f.users.findOneBy.mockResolvedValue(f.own); f.grant.permission = ['access:mcp'];
	await expect(read()).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
	f.grant.permission.push('read:admin:ad'); f.users.findOneBy.mockResolvedValue(null);
	await expect(read()).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });
	f.users.findOneBy.mockResolvedValue(f.own); f.rows.delete(f.grant.id);
	await expect(read()).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });
});

it('reads fresh native role definitions, assignments and conditional actors without using shared caches', async () => {
	const rolesRepository = { findBy: vi.fn(async () => [{ ...role(true), target: 'conditional', condFormula: { type: 'isLocal' } }]) };
	const assignments = { findBy: vi.fn(async () => [{ roleId: 'synthetic-role', expiresAt: new Date(0) }]) };
	const users = { findOneByOrFail: vi.fn(async () => ({ id: 'actor', host: null })) };
	const cache = { fetch: vi.fn(async () => []) };
	const service = Object.assign(Object.create(RoleService.prototype) as object, { rolesRepository, roleAssignmentsRepository: assignments, usersRepository: users, rolesCache: cache, roleAssignmentByUserIdCache: cache, cacheService: { findUserById: vi.fn() }, userEntityService: { isLocalUser: (user: { host: string | null }) => user.host === null } }) as unknown as RoleService;
	expect(await service.getUserAssigns('actor', true)).toEqual([]);
	expect(await service.getUserRoles('actor', true)).toContainEqual(expect.objectContaining({ isAdministrator: true }));
	expect(users.findOneByOrFail).toHaveBeenCalledWith({ id: 'actor' }); expect(cache.fetch).not.toHaveBeenCalled();
	rolesRepository.findBy.mockResolvedValue([]);
	expect(await service.getUserRoles('actor', true)).toEqual([]);
	expect(rolesRepository.findBy).toHaveBeenCalledTimes(2); expect(assignments.findBy).toHaveBeenCalledTimes(3);
});
