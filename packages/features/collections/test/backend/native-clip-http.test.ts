/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import Fastify from 'fastify';
import { createRouterClient } from '@orpc/server';
import { registerPilotHttp } from '@features/api/backend/transport/pilot-http.js';
import { createNotesFeaturedProcedure, type NotesFeaturedDependencies } from '@features/discovery/backend/endpoints/notes/featured.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import type * as v from 'valibot';
import { collectionsContract } from '../../backend/api.definition.js';
import { createCollectionsRouter } from '../../backend/api.implementation.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { SelectQueryBuilder } from 'typeorm';
import type { MiClip } from '../../backend/models/Clip.js';
import type { CollectionsDependencies } from '../../backend/api.implementation.js';
import type { packedClipSchema } from '../../backend/api.definition.js';
import type { ApiServices } from '@features/api/backend/transport/context.js';
const actor = mockDeep<MiLocalUser>({ id: 'owner1', isSuspended: false, movedToUri: null });
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
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([actor, null]);
	const dependencies = mockDeep<CollectionsDependencies<MiLocalUser>>();
	dependencies.clipService.create.mockResolvedValue(mockDeep<MiClip>({ id: clip.id }));
	dependencies.clipEntityService.pack.mockResolvedValue(clip);
	const context: ApiContext<MiLocalUser> = { services, credential: 'native', ip: '127.0.0.1', headers: {} };
	const handler = new OpenAPIHandler(createCollectionsRouter(dependencies));
	const app = Fastify();
	app.post('/api/' + endpoint, async (request, reply) => {
		await handler.handle(request, reply, { prefix: '/api', context });
	});
	try {
		for (const isPublic of ['true', 'false', '1', 1, 0, null, [], {}]) {
			const response = await app.inject({ method: 'POST', url: '/api/' + endpoint, payload: { name: 'clip', clipId: 'clip1', isPublic } });
			expect(response.statusCode).toBe(400);
		}
		expect(dependencies.clipService.create).not.toHaveBeenCalled();
		expect(dependencies.clipService.update).not.toHaveBeenCalled();
		for (const isPublic of [false, true]) {
			const response = await app.inject({ method: 'POST', url: '/api/' + endpoint, payload: { name: 'clip', clipId: 'clip1', isPublic } });
			expect(response.statusCode).toBe(200);
		}
		if (endpoint === 'clips/create') expect(dependencies.clipService.create).toHaveBeenLastCalledWith(actor, 'clip', true, null);
		else expect(dependencies.clipService.update).toHaveBeenLastCalledWith(actor, 'clip1', 'clip', true, null);
	} finally { await app.close(); }
});

test('native transport decodes GET query numbers while POST JSON and canonical direct calls stay strict', async () => {
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([actor, null]);
	const dependencies = mockDeep<CollectionsDependencies<MiLocalUser>>();
	const query = mockDeep<SelectQueryBuilder<MiClip>>();
	query.andWhere.mockReturnValue(query);
	query.limit.mockReturnValue(query);
	query.getMany.mockResolvedValue([]);
	dependencies.clipsRepository.createQueryBuilder.mockReturnValue(query);
	dependencies.queryService.makePaginationQuery.mockReturnValue(query);
	dependencies.clipEntityService.packMany.mockResolvedValue([]);
	const discovery = mockDeep<NotesFeaturedDependencies>();
	const featuredNotes = ['note1', 'note2', 'note3', 'note4'].map(id => mockDeep<MiNote>({ id }));
	const featuredQuery = mockDeep<SelectQueryBuilder<MiNote>>();
	featuredQuery.where.mockReturnValue(featuredQuery);
	featuredQuery.innerJoinAndSelect.mockReturnValue(featuredQuery);
	featuredQuery.leftJoinAndSelect.mockReturnValue(featuredQuery);
	featuredQuery.getMany.mockResolvedValue(featuredNotes);
	discovery.notesRepository.createQueryBuilder.mockReturnValue(featuredQuery);
	discovery.featuredService.getGlobalNotesRanking.mockResolvedValue(featuredNotes.map(note => note.id));
	discovery.cacheService.userMutingsCache.fetch.mockResolvedValue(new Set());
	discovery.cacheService.userBlockedCache.fetch.mockResolvedValue(new Set());
	discovery.noteEntityService.packMany.mockResolvedValue([]);
	const context: ApiContext<MiLocalUser> = { services, credential: 'native', ip: '127.0.0.1', headers: {} };
	const featured = createNotesFeaturedProcedure<MiLocalUser>(discovery);
	const router = { collections: createCollectionsRouter(dependencies), discovery: { canonical: featured.canonical, get: featured.get } };
	const handler = new OpenAPIHandler<ApiContext<MiLocalUser>>(router);
	const app = Fastify();
	await app.register(async api => registerPilotHttp(api, handler, {
		maxFileSize: 1024, context: () => context, runSpan: (_name, run) => run(),
	}), { prefix: '/api' });
	try {
		const get = await app.inject({ method: 'GET', url: '/api/notes/featured?limit=3' });
		expect(get.statusCode).toBe(200);
		expect(discovery.noteEntityService.packMany).toHaveBeenLastCalledWith(expect.arrayContaining(featuredNotes.slice(1)), actor);
		expect(discovery.noteEntityService.packMany.mock.calls.at(-1)?.[0]).toHaveLength(3);
		const invalidPost = await app.inject({ method: 'POST', url: '/api/clips/list', payload: { limit: '3' } });
		expect(invalidPost.statusCode).toBe(400);
		expect(dependencies.queryService.makePaginationQuery).not.toHaveBeenCalled();
		const post = await app.inject({ method: 'POST', url: '/api/clips/list', payload: { limit: 3 } });
		expect(post.statusCode).toBe(200);
		expect(query.limit).toHaveBeenLastCalledWith(3);
		expect(dependencies.clipEntityService.packMany).toHaveBeenLastCalledWith([], actor);
		dependencies.queryService.makePaginationQuery.mockClear();
		const client = createRouterClient(router, { context });
		// @ts-expect-error Canonical direct calls require JSON numbers, just like POST bodies.
		await expect(client.collections.clipsList({ limit: '3' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
		expect(dependencies.queryService.makePaginationQuery).not.toHaveBeenCalled();
	} finally { await app.close(); }
});

test('native clip HTTP strips outer and nested secrets with no output-validator calls', async () => {
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([actor, null]);
	const dependencies = mockDeep<CollectionsDependencies<MiLocalUser>>();
	dependencies.clipService.create.mockResolvedValue(mockDeep<MiClip>({ id: clip.id }));
	const extended = { ...clip, internalClipData: 'secret', user: { ...clip.user, privateUserData: 'secret' } };
	dependencies.clipEntityService.pack.mockResolvedValue(extended);
	const context: ApiContext<MiLocalUser> = { services, credential: 'native', ip: '127.0.0.1', headers: {} };
	const handler = new OpenAPIHandler(createCollectionsRouter(dependencies));
	const app = Fastify();
	app.post('/api/clips/create', async (request, reply) => {
		await handler.handle(request, reply, { prefix: '/api', context });
	});
	const output = collectionsContract.clipsCreate['~orpc'].outputSchema;
	if (output === undefined) throw new Error('Missing clip output');
	const validate = vi.spyOn(output, '~run');
	try {
		const response = await app.inject({ method: 'POST', url: '/api/clips/create', payload: { name: 'clip' } });
		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(clip);
		expect(response.body).not.toContain('secret');
		expect(validate).not.toHaveBeenCalled();
	} finally { validate.mockRestore(); await app.close(); }
});
