/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { setTimeout as delay } from 'node:timers/promises';
import { Module, type Provider } from '@nestjs/common';
import { ModuleRef, NestFactory } from '@nestjs/core';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import Fastify from 'fastify';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { DI } from '@/di-symbols.js';
import { AnnouncementsApiProvider } from '../../backend/api.provider.js';
import { AnnouncementService } from '../../backend/services/AnnouncementService.js';
import { AnnouncementEntityService } from '../../backend/serializers/AnnouncementEntityService.js';
import { IdService } from '../../../runtime/backend/services/IdService.js';
import { QueryService } from '../../../notes/backend/services/QueryService.js';
import { misskeyErrorBody } from '../../../api/backend/transport/orpc-error.js';
import type { ApiContext, ApiServices } from '../../../api/backend/transport/context.js';
import type { MiLocalUser, MiUser } from '../../../users/backend/models/User.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '../../../persistence/backend/repositories/models.js';
test('announcement provider composes after Nest hooks and caches a ready singleton for native HTTP requests', async () => {
	let ready = false;
	let lookupCount = () => 0;
	const singleton = {
		onModuleInit() {
			expect(lookupCount()).toBe(0);
			ready = true;
		},
		read: vi.fn(async (actor: MiUser, id: string) => {
			expect(ready).toBe(true);
			expect(actor.id).toBe('reader123');
			expect(id).toMatch(/^announcement[12]$/);
		}),
	};
	const providers: Provider[] = [
		{
			provide: AnnouncementsApiProvider,
			inject: [ModuleRef],
			useFactory: (moduleRef: ModuleRef) => {
				const lookup = vi.spyOn(moduleRef, 'get');
				lookupCount = () => lookup.mock.calls.length;
				const provider = new AnnouncementsApiProvider(moduleRef);
				expect(lookup).not.toHaveBeenCalled();
				return provider;
			},
		},
		{
			provide: AnnouncementService,
			useFactory: async () => { await delay(10); return singleton; },
		},
		{ provide: AnnouncementEntityService, useValue: mockDeep<AnnouncementEntityService>() },
		{ provide: QueryService, useValue: mockDeep<QueryService>() },
		{ provide: IdService, useValue: mockDeep<IdService>() },
		{ provide: DI.announcementsRepository, useValue: mockDeep<AnnouncementsRepository>() },
		{ provide: DI.announcementReadsRepository, useValue: mockDeep<AnnouncementReadsRepository>() },
	];
	class TestModule { }
	Module({ providers })(TestModule);
	const nest = await NestFactory.createApplicationContext(TestModule, { logger: false, abortOnError: false });
	const app = Fastify();
	try {
		expect(ready).toBe(true);
		expect(lookupCount()).toBe(0);
		const provider = nest.get(AnnouncementsApiProvider);
		let authenticated = true;
		const actor = mockDeep<MiLocalUser>();
		actor.id = 'reader123';
		actor.isSuspended = false;
		actor.movedToUri = null;
		const services = mockDeep<ApiServices<MiLocalUser>>();
		services.authenticate.mockImplementation(async () => [authenticated ? actor : null, null]);
		const context: ApiContext<MiLocalUser> = { services, credential: 'credential', headers: {}, ip: '127.0.0.1' };
		await app.register(async api => {
			const router = provider.compose();
			expect(provider.compose()).toBe(router);
			const handler = new OpenAPIHandler(router, { customErrorResponseBodyEncoder: misskeyErrorBody });
			api.post('/i/read-announcement', async (request, reply) => {
				await handler.handle(request, reply, { prefix: '/api', context });
			});
		}, { prefix: '/api' });
		await app.ready();
		const resolvedCount = lookupCount();
		expect(resolvedCount).toBe(6);
		for (const announcementId of ['announcement1', 'announcement2']) {
			const response = await app.inject({ method: 'POST', url: '/api/i/read-announcement', payload: { announcementId } });
			expect(response.statusCode).toBe(204);
			expect(response.body).toBe('');
		}
		expect(singleton.read).toHaveBeenCalledTimes(2);
		expect(singleton.read).toHaveBeenNthCalledWith(1, actor, 'announcement1');
		expect(singleton.read).toHaveBeenNthCalledWith(2, actor, 'announcement2');
		expect(lookupCount()).toBe(resolvedCount);
		authenticated = false;
		const denied = await app.inject({ method: 'POST', url: '/api/i/read-announcement', payload: { announcementId: '' } });
		expect(denied.statusCode).toBe(401);
		expect(denied.json()).toMatchObject({ error: { code: 'CREDENTIAL_REQUIRED', id: '1384574d-a912-4b81-8601-c7b1c4085df1' } });
		expect(singleton.read).toHaveBeenCalledTimes(2);
		expect(lookupCount()).toBe(resolvedCount);
	} finally {
		await app.close();
		await nest.close();
		vi.restoreAllMocks();
	}
});
