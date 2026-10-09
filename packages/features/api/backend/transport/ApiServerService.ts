/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { OrpcPilotService } from './OrpcPilotService.js';
import type { InstancesRepository, AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { StandaloneAuthService } from '@features/auth/backend/StandaloneAuthService.js';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

@Injectable()
export class ApiServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private userEntityService: UserEntityService,
		private orpcPilot: OrpcPilotService,
		private standaloneAuth: StandaloneAuthService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.register(cors, {
			origin: '*',
		});

		fastify.register(multipart, {
			limits: {
				fileSize: this.config.maxFileSize,
				files: 1,
			},
		});

		// Prevent cache
		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Cache-Control', 'private, max-age=0, must-revalidate');
			done();
		});

		this.orpcPilot.register(fastify);

		this.standaloneAuth.register(fastify);

		fastify.get('/v1/instance/peers', async (request, reply) => {
			const instances = await this.instancesRepository.find({
				select: { host: true },
				where: {
					suspensionState: 'none',
				},
			});

			return instances.map(instance => instance.host);
		});

		fastify.post<{ Params: { session: string; } }>('/miauth/:session/check', async (request, reply) => {
			const token = await this.accessTokensRepository.findOneBy({
				session: request.params.session,
			});

			if (token && token.session != null && !token.fetched) {
				this.accessTokensRepository.update(token.id, {
					fetched: true,
				});

				return {
					ok: true,
					token: token.token,
					user: await this.userEntityService.pack(token.userId, null, { schema: 'UserDetailedNotMe' }),
				};
			} else {
				return {
					ok: false,
				};
			}
		});

		// Make sure any unknown path under /api returns HTTP 404 Not Found,
		// because otherwise ClientServerService will return the base client HTML
		// page with HTTP 200.
		fastify.get('/*', (request, reply) => {
			reply.code(404);
			// Mock ApiCallService.send's error handling
			reply.send({
				error: {
					message: 'Unknown API endpoint.',
					code: 'UNKNOWN_API_ENDPOINT',
					id: '2ca3b769-540a-4f08-9dd5-b5a825b6d0f1',
					kind: 'client',
				},
			});
		});

		done();
	}
}
