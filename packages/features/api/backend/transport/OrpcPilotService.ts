/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { ApiRouterProvider } from '@features/index/backend/api.implementation.js';
import type { ApiExecutionContext } from '@features/index/backend/api.context.js';
import { AuthenticateService, AuthenticationError } from '@features/auth/backend/transport/AuthenticateService.js';
import { getIpHash } from '@features/auth/backend/utility/get-ip-hash.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { TelemetryService } from '@features/statistics/backend/services/TelemetryService.js';
import { RateLimiterService } from './RateLimiterService.js';
import { ApiLoggerService } from './ApiLoggerService.js';
import { ApiIpLoggingService } from './ApiIpLoggingService.js';
import { apiError, internalError, normalizeError, misskeyErrorBody } from './orpc-error.js';
import { nullSuccessToNoContent } from './no-content.js';
import { bodyCredential, registerPilotHttp } from './pilot-http.js';
import type { UploadResource } from './context.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
@Injectable()
export class OrpcPilotService {
	private handler: ReturnType<OrpcPilotService['createHandler']> | undefined;
	constructor(
		@Inject(DI.config) private readonly config: Config,
		@Inject(DI.meta) private readonly settings: MiMeta,
		private readonly authenticate: AuthenticateService,
		private readonly roles: RoleService,
		private readonly limiter: RateLimiterService,
		private readonly logger: ApiLoggerService,
		private readonly telemetry: TelemetryService,
		private readonly ipLogging: ApiIpLoggingService,
		private readonly moduleRef: ModuleRef,
	) { }
	private context(request: FastifyRequest, reply: FastifyReply, name: string, upload?: UploadResource): ApiExecutionContext<MiLocalUser> {
		const credential = name === 'clear-browser-cache' ? undefined : bodyCredential(request);
		return {
			authorization: {
				rootUserId: () => this.settings.rootUserId,
				roles: actor => this.roles.getUserRoles(actor.id),
				policyAllowed: async (actor, key) => {
					const policies = await this.roles.getUserPolicies(actor.id);
					return Boolean(Object.entries(policies).find(([name]) => name === key)?.[1]);
				},
			},
			response: { header: (key, value) => { reply.header(key, value); } },
			credential, ip: request.ip, headers: request.headers, ...(upload === undefined ? {} : { upload }),
			services: {
				authenticate: async token => {
					try {
						const principal = await this.authenticate.authenticate(token);
						if (principal[0]) this.ipLogging.log(request.ip, principal[0].id);
						return principal;
					} catch (error) {
						if (!(error instanceof AuthenticationError)) throw error;
						throw apiError({
							code: 'AUTHENTICATION_FAILED', status: 401,
							message: 'Authentication failed. Please ensure your token is correct.', id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14'
						});
					}
				},
				limitActor: (actor, ip) => {
					if (actor) return actor.id;
					if (!this.config.enableIpRateLimit) return null;
					if (process.env.NODE_ENV === 'production' && (ip === '::1' || ip === '127.0.0.1')) {
						this.logger.logger.warn('Recieved API request from localhost IP address for rate limiting in production environment. This is likely due to an improper trustProxy setting in the config file.');
					}
					return getIpHash(ip);
				},
				rateLimitFactor: async actor => (await this.roles.getUserPolicies(actor.id)).rateLimitFactor,
				limit: async (limit, actor, factor) => {
					const result = await this.limiter.limit(limit, actor, factor);
					return result === null ? null : { info: { ...result.info } };
				},
			},
			mapError: original => {
				let error = normalizeError(original);
				if (error.code === 'INTERNAL_ERROR') {
					const id = randomUUID();
					const cause = original instanceof Error ? original : new Error('Unknown API failure');
					this.logger.logger.write({
						level: 'error', eventName: 'api.endpoint.failed', message: `Internal error occurred in ${name}: ${cause.message}`,
						attributes: { 'api.endpoint': name, 'error.id': id, 'api.params': request.body }, error: cause
					});
					this.telemetry.captureMessage(`Internal error occurred in ${name}: ${cause.message}`, {
						level: 'error', extra: { ep: name, e: { message: cause.message, code: cause.name, stack: cause.stack, id } },
					});
					error = apiError(internalError, { e: { message: cause.message, code: cause.name, id } });
				}
				const { error: wire } = misskeyErrorBody(error);
				reply.header('Cache-Control', 'private, max-age=0, must-revalidate');
				if (wire.code === 'AUTHENTICATION_FAILED') reply.header('WWW-Authenticate', `Bearer realm="Misskey", error="invalid_token", error_description="${wire.message}"`);
				else if (error.status === 401) reply.header('WWW-Authenticate', 'Bearer realm="Misskey"');
				else if (wire.code === 'RATE_LIMIT_EXCEEDED') {
					if (typeof wire.info?.resetMs === 'number') reply.header('Retry-After', String(Math.max(0, Math.ceil((wire.info.resetMs - Date.now()) / 1000))));
				} else if (wire.code === 'PERMISSION_DENIED') reply.header('WWW-Authenticate', `Bearer realm="Misskey", error="insufficient_scope", error_description="${wire.message}"`);
				else if (wire.kind === 'client') reply.header('WWW-Authenticate', `Bearer realm="Misskey", error="invalid_request", error_description="${wire.message}"`);
				return error;
			},
		};
	}
	private createHandler() {
		const router = this.moduleRef.get(ApiRouterProvider, { strict: false }).compose();
		return new OpenAPIHandler(router, { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
	}
	register(fastify: FastifyInstance) {
		const handler = this.handler ??= this.createHandler();
		registerPilotHttp(fastify, handler, {
			maxFileSize: this.config.maxFileSize,
			context: (request, reply, name, upload) => this.context(request, reply, name, upload),
			runSpan: (name, run) => this.telemetry.startSpan(name, run),
		});
	}
}
