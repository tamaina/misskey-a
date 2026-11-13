/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { call } from '@orpc/server';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import type { ApiActor, ApiServices, ApiContext } from '@features/api/backend/transport/context.js';
import type { EndpointDescriptor, InstanceApiDependencies } from '@features/instance/backend/api.implementation.js';
import { createInstanceRouter } from '@features/instance/backend/api.implementation.js';
import { createStatsProcedure } from '@features/statistics/backend/endpoints/stats.js';
import { statsContract } from '@features/statistics/backend/endpoints/stats.contract.js';
import { createAvatarDecorationsRouter } from '@features/avatar-decorations/backend/api.implementation.js';
import type { AvatarDecorationsDependencies } from '@features/avatar-decorations/backend/api.implementation.js';
import { createEmojisRouter } from '@features/emojis/backend/api.implementation.js';
import type { EmojisDependencies } from '@features/emojis/backend/api.implementation.js';
import type { MiAvatarDecoration, MiEmoji } from '@features/persistence/backend/repositories/models.js';

const actor: ApiActor = { id: 'local-user', isSuspended: false, movedToUri: null };

function services(principal: ApiActor | null = null) {
	const result = mockDeep<ApiServices<ApiActor>>();
	result.authenticate.mockResolvedValue([principal, null]);
	return result;
}

function instance(readEndpoints: () => Promise<readonly EndpointDescriptor[]> = async () => []) {
	const deps = mockDeep<InstanceApiDependencies>();
	deps.now = () => 123;
	deps.getOnlineUsersCount.thresholdMs = 1000;
	deps.getOnlineUsersCount.countSince.mockResolvedValue(8);
	deps.readEndpoints.mockImplementation(readEndpoints);
	const context: ApiContext<ApiActor> = { services: services(), credential: null, ip: '127.0.0.1', headers: {} };
	return { deps, context, router: createInstanceRouter<ApiActor>({ ...deps, serverInfo: { enabled: () => false, read: async () => ({ machine: '?', cpu: { model: '?', cores: 0 }, mem: { total: 0 }, fs: { total: 0, used: 0 } }) } }) };
}

test('anonymous ping and online count retain native validation and GET/cache policy', async () => {
	const h = instance();
	expect(await call(h.router.ping, {}, { context: h.context })).toEqual({ pong: 123 });
	expect(await call(h.router.onlineUsersCount, {}, { context: h.context })).toEqual({ count: 8 });
	expect(h.router.onlineUsersCount['~orpc'].meta).toMatchObject({ allowGet: true, cacheSec: 60 });
	expect(h.router.onlineUsersCountGet['~orpc'].route.method).toBe('GET');
	expect(h.router.ping['~orpc'].meta).toMatchObject({ allowGet: false });
	const handler = new OpenAPIHandler({ ping: h.router.ping, count: h.router.onlineUsersCount });
	for (const path of ['ping', 'get-online-users-count']) {
		for (const input of [null, [], 'invalid']) {
			const result = await handler.handle(new Request(`https://local.test/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }), { context: h.context });
			expect(result.response?.status).toBe(400);
		}
	}
	expect(h.deps.getOnlineUsersCount.countSince).toHaveBeenCalledTimes(1);
});

test('introspection validates before reading and preserves descriptor order, fallback, null and failures', async () => {
	const registry: EndpointDescriptor[] = [
		{ name: 'first/endpoint', properties: { alpha: { type: 'boolean' }, beta: { type: 'array' }, fallback: {} } },
		{ name: 'second/endpoint', properties: { id: { type: 'string' } } },
	];
	const snapshot = structuredClone(registry);
	let reads = 0;
	const h = instance(async () => { reads++; return registry; });
	const handler = new OpenAPIHandler({ endpoint: h.router.endpoint });
	for (const input of [null, [], 'invalid', {}, { endpoint: 1 }, { endpoint: null }]) {
		const result = await handler.handle(new Request('https://local.test/endpoint', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }), { context: h.context });
		expect(result.response?.status).toBe(400);
	}
	expect(reads).toBe(0);
	expect(await call(h.router.endpoint, { endpoint: 'first/endpoint' }, { context: h.context })).toEqual({ params: [{ name: 'alpha', type: 'Boolean' }, { name: 'beta', type: 'Array' }, { name: 'fallback', type: 'string' }] });
	expect(await call(h.router.endpoint, { endpoint: 'missing' }, { context: h.context })).toBeNull();
	expect(await call(h.router.endpoints, {}, { context: h.context })).toEqual(['first/endpoint', 'second/endpoint']);
	expect(reads).toBe(3);
	expect(registry).toEqual(snapshot);
	for (const procedure of [h.router.endpoint, h.router.endpoints]) expect(procedure['~orpc'].meta).toMatchObject({ allowGet: false });
	const error = new Error('registry unavailable');
	const unavailable = instance(async () => { throw error; });
	await expect(call(unavailable.router.endpoint, { endpoint: 'ping' }, { context: unavailable.context })).rejects.toBe(error);
	await expect(call(unavailable.router.endpoints, {}, { context: unavailable.context })).rejects.toBe(error);
});

test('real statistics producer retains anonymous POST-only totals and drive placeholders', async () => {
	const stats = createStatsProcedure<ApiActor>({ readNotes: async () => ({ local: 2, remote: 3 }), readUsers: async () => ({ local: 5, remote: 7 }), countReactions: async () => 11, countInstances: async () => 13 });
	expect(await call(stats, {}, { context: { services: services(), credential: null, ip: '127.0.0.1', headers: {} } })).toEqual({ notesCount: 5, originalNotesCount: 2, usersCount: 12, originalUsersCount: 5, reactionsCount: 11, instances: 13, driveUsageLocal: 0, driveUsageRemote: 0 });
	expect(statsContract['~orpc'].route.method).toBe('POST');
	expect(statsContract['~orpc'].meta).not.toHaveProperty('allowGet');
	expect(statsContract['~orpc'].meta).not.toHaveProperty('cacheSec');
});

test('decoration role visibility uses authenticated context and rejects invalid input before reading', async () => {
	const deps = mockDeep<AvatarDecorationsDependencies<ApiActor>>();
	deps.avatarDecorationService.getAll.mockResolvedValue([mockDeep<MiAvatarDecoration>({ id: 'a', name: 'A', description: '', url: '/a.png', roleIdsThatCanBeUsedThisDecoration: ['public', 'private', 'missing'], category: null })]);
	deps.readRoles.mockResolvedValue([{ id: 'public', isPublic: true }, { id: 'private', isPublic: false }]);
	const context: ApiContext<ApiActor> = { services: services(), credential: null, ip: '127.0.0.1', headers: {} };
	const router = createAvatarDecorationsRouter(deps);
	const handler = new OpenAPIHandler({ get: router.get });
	const invalid = await handler.handle(new Request('https://local.test/get-avatar-decorations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'null' }), { context });
	expect(invalid.response?.status).toBe(400);
	expect(deps.avatarDecorationService.getAll).not.toHaveBeenCalled();
	const forged = { authenticated: true, context: { authenticated: true } };
	expect((await call(router.get, forged, { context }))[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['public']);
	context.services.authenticate = async () => [actor, null];
	expect((await call(router.get, { authenticated: false }, { context }))[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['public', 'private']);
	context.services.authenticate = async () => [null, null];
	expect((await call(router.get, {}, { context }))[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['public']);
	expect(deps.avatarDecorationService.getAll).toHaveBeenCalledTimes(3);
	expect(router.get['~orpc'].meta).not.toHaveProperty('cacheSec');
});

test('native emoji lookup validates before storage and preserves local results and cache aliases', async () => {
	const simple = { aliases: ['alias'], name: 'sample', category: null, url: '/sample.webp' };
	const detailed = { ...simple, id: 'e', host: null, license: null, isSensitive: false, localOnly: false, roleIdsThatCanBeUsedThisEmojiAsReaction: [] };
	const deps = mockDeep<EmojisDependencies<ApiActor>>();
	const row = mockDeep<MiEmoji>({ id: 'e', name: 'sample', host: null });
	deps.emojisRepository.findOneOrFail.mockResolvedValue(row);
	deps.emojisRepository.find.mockResolvedValue([row]);
	deps.emojiEntityService.packDetailed.mockResolvedValue(detailed);
	deps.emojiEntityService.packSimpleMany.mockResolvedValue([simple]);
	const context: ApiContext<ApiActor> = { services: services(), credential: null, ip: '127.0.0.1', headers: {} };
	const router = createEmojisRouter<ApiActor>(deps);
	const handler = new OpenAPIHandler({ emoji: router.emoji });
	for (const input of [null, {}, { name: 1 }, { name: null }]) {
		const invalid = await handler.handle(new Request('https://local.test/emoji', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }), { context });
		expect(invalid.response?.status).toBe(400);
	}
	expect(deps.emojisRepository.findOneOrFail).not.toHaveBeenCalled();
	expect(await call(router.emoji, { name: 'sample' }, { context })).toEqual(detailed);
	expect(deps.emojisRepository.findOneOrFail).toHaveBeenCalledWith({ where: { name: 'sample', host: expect.objectContaining({ _type: 'isNull' }) } });
	expect(await call(router.emojis, {}, { context })).toEqual({ emojis: [simple] });
	for (const procedure of [router.emoji, router.emojis]) expect(procedure['~orpc'].meta).toMatchObject({ allowGet: true, cacheSec: 3600 });
	expect(router.emojiGet['~orpc'].route.method).toBe('GET');
	expect(router.emojisGet['~orpc'].route.method).toBe('GET');
});
