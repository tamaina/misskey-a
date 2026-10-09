/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import Fastify from 'fastify';
import { createRouterClient } from '@orpc/server';
import { registerPilotHttp } from '@features/api/backend/transport/pilot-http.js';
import { createDiscoveryRouter } from '@features/discovery/backend/endpoints/discovery.js';
import type { DiscoveryContext } from '@features/discovery/backend/endpoints/discovery.js';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import type * as v from 'valibot';
import { createCollectionsRouter } from '../../backend/api.router.js';
import type { CollectionsContext } from '../../backend/api.router.js';
import type { CollectionsOperations } from '../../backend/api.operations.js';
import type { packedClipSchema } from '../../backend/api.schema.js';
import type { ApiActor, ApiServices } from '@features/api/backend/transport/context.js';

const actor: ApiActor = { id: 'owner1', isSuspended: false, movedToUri: null };
const clip: v.InferOutput<typeof packedClipSchema> = {
	id: 'clip1', createdAt: '2026-10-09T00:00:00.000Z', lastClippedAt: null,
	userId: actor.id, user: {
		id: actor.id, name: null, username: 'owner', host: null,
		avatarUrl: 'https://example.test/avatar', avatarBlurhash: null,
		avatarDecorations: [], emojis: {}, onlineStatus: 'unknown',
	},
	name: 'clip', description: null, isPublic: false, favoritedCount: 0,
};

test.each(['clips/create', 'clips/update'])('native JSON POST %s rejects nonboolean isPublic without invoking operations', async endpoint => {
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([actor, null]);
	const operations = mockDeep<CollectionsOperations<ApiActor>>();
	operations.clipsCreate.mockResolvedValue(clip);
	operations.clipsUpdate.mockResolvedValue(clip);
	const context: CollectionsContext<ApiActor> = { services, credential: 'native', ip: '127.0.0.1', headers: {}, operations: { collections: operations } };
	const handler = new OpenAPIHandler(createCollectionsRouter<ApiActor>());
	const app = Fastify();
	app.post('/api/' + endpoint, async (request, reply) => {
		await handler.handle(request, reply, { prefix: '/api', context });
	});
	try {
		for (const isPublic of ['true', 'false', '1', 1, 0, null, [], {}]) {
			const response = await app.inject({ method: 'POST', url: '/api/' + endpoint, payload: { name: 'clip', clipId: 'clip1', isPublic } });
			expect(response.statusCode).toBe(400);
		}
		expect(operations.clipsCreate).not.toHaveBeenCalled();
		expect(operations.clipsUpdate).not.toHaveBeenCalled();
		for (const isPublic of [false, true]) {
			const response = await app.inject({ method: 'POST', url: '/api/' + endpoint, payload: { name: 'clip', clipId: 'clip1', isPublic } });
			expect(response.statusCode).toBe(200);
		}
		const operation = endpoint === 'clips/create' ? operations.clipsCreate : operations.clipsUpdate;
		expect(operation).toHaveBeenLastCalledWith(expect.objectContaining({ isPublic: true }), actor);
	} finally { await app.close(); }
});

test('native transport decodes GET query numbers while POST JSON and canonical direct calls stay strict', async () => {
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([actor, null]);
	const collections = mockDeep<CollectionsOperations<ApiActor>>();
	collections.clipsList.mockResolvedValue([]);
	const discovery = mockDeep<DiscoveryContext<ApiActor>['operations']['discovery']>();
	discovery['notes/featured'].mockResolvedValue([]);
	const context: CollectionsContext<ApiActor> & DiscoveryContext<ApiActor> = {
		services, credential: 'native', ip: '127.0.0.1', headers: {},
		operations: { collections, discovery },
	};
	const router = { collections: createCollectionsRouter<ApiActor>(), discovery: createDiscoveryRouter<ApiActor>() };
	const handler = new OpenAPIHandler<CollectionsContext<ApiActor> & DiscoveryContext<ApiActor>>(router);
	const app = Fastify();
	await app.register(async api => registerPilotHttp(api, handler, {
		maxFileSize: 1024, context: () => context, runSpan: (_name, run) => run(),
	}), { prefix: '/api' });
	try {
		const get = await app.inject({ method: 'GET', url: '/api/notes/featured?limit=3' });
		expect(get.statusCode).toBe(200);
		expect(discovery['notes/featured']).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 3 }), actor);
		const invalidPost = await app.inject({ method: 'POST', url: '/api/clips/list', payload: { limit: '3' } });
		expect(invalidPost.statusCode).toBe(400);
		expect(collections.clipsList).not.toHaveBeenCalled();
		const post = await app.inject({ method: 'POST', url: '/api/clips/list', payload: { limit: 3 } });
		expect(post.statusCode).toBe(200);
		expect(collections.clipsList).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 3 }), actor);
		collections.clipsList.mockClear();
		const client = createRouterClient(router, { context });
		// @ts-expect-error Canonical direct calls require JSON numbers, just like POST bodies.
		await expect(client.collections.clipsList({ limit: '3' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(collections.clipsList).not.toHaveBeenCalled();
	} finally { await app.close(); }
});
