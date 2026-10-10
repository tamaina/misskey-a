/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AuthenticateService, AuthenticationError } from '@features/auth/backend/transport/AuthenticateService.js';
import { getIpHash } from '@features/auth/backend/utility/get-ip-hash.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { TelemetryService } from '@features/statistics/backend/services/TelemetryService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { RateLimiterService } from './RateLimiterService.js';
import { ApiLoggerService } from './ApiLoggerService.js';
import { ApiIpLoggingService } from './ApiIpLoggingService.js';
import { apiError, internalError, normalizeError, misskeyErrorBody } from './orpc-error.js';
import type { ApiExecutionContext } from '@features/index/backend/api.context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { UploadResource } from './context.js';
export interface ApiRequestContext {
	credential: string | null | undefined;
	ip: string;
	headers: Record<string, string | string[] | undefined>;
	params?: unknown;
	upload?: UploadResource;
	response?: { header(name: string, value: string): void };
	/** Transport hygiene only: omit sensitive diagnostics from MCP logs and wire errors. */
	safeDiagnostics?: boolean;
}

@Injectable()
export class ApiExecutionContextFactory {
	constructor(
		@Inject(DI.config) private readonly config: Config,
		@Inject(DI.meta) private readonly settings: MiMeta,
		private readonly authenticate: AuthenticateService,
		private readonly roles: RoleService,
		private readonly limiter: RateLimiterService,
		private readonly logger: ApiLoggerService,
		private readonly telemetry: TelemetryService,
		private readonly ipLogging: ApiIpLoggingService,
	) { }
	get maxFileSize(): number { return this.config.maxFileSize; }

	create(request: ApiRequestContext, name: string): ApiExecutionContext<MiLocalUser> {
		const { credential, upload } = request;
		return {
			authorization: {
				rootUserId: () => this.settings.rootUserId,
				roles: actor => this.roles.getUserRoles(actor.id),
				policyAllowed: async (actor, key) => {
					const policies = await this.roles.getUserPolicies(actor.id);
					return Boolean(Object.entries(policies).find(([name]) => name === key)?.[1]);
				},
			},
			...(request.response === undefined ? {} : { response: request.response }),
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
							message: 'Authentication failed. Please ensure your token is correct.', id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
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
					const safeDiagnostics = request.safeDiagnostics === true;
					this.logger.logger.write({
						level: 'error', eventName: 'api.endpoint.failed', message: safeDiagnostics ? `Internal error occurred in ${name}` : `Internal error occurred in ${name}: ${cause.message}`,
						attributes: { 'api.endpoint': name, 'error.id': id, ...(safeDiagnostics ? {} : { 'api.params': request.params }) }, ...(safeDiagnostics ? {} : { error: cause }),
					});
					this.telemetry.captureMessage(safeDiagnostics ? `Internal error occurred in ${name}` : `Internal error occurred in ${name}: ${cause.message}`, {
						level: 'error', extra: { ep: name, e: safeDiagnostics ? { code: 'INTERNAL_ERROR', id } : { message: cause.message, code: cause.name, stack: cause.stack, id } },
					});
					error = apiError(internalError, { e: safeDiagnostics ? { code: 'INTERNAL_ERROR', id } : { message: cause.message, code: cause.name, id } });
				}
				const { error: wire } = misskeyErrorBody(error);
				request.response?.header('Cache-Control', 'private, max-age=0, must-revalidate');
				if (wire.code === 'AUTHENTICATION_FAILED') request.response?.header('WWW-Authenticate', `Bearer realm="Misskey", error="invalid_token", error_description="${wire.message}"`);
				else if (error.status === 401) request.response?.header('WWW-Authenticate', 'Bearer realm="Misskey"');
				else if (wire.code === 'RATE_LIMIT_EXCEEDED') {
					if (typeof wire.info?.resetMs === 'number') request.response?.header('Retry-After', String(Math.max(0, Math.ceil((wire.info.resetMs - Date.now()) / 1000))));
				} else if (wire.code === 'PERMISSION_DENIED') request.response?.header('WWW-Authenticate', `Bearer realm="Misskey", error="insufficient_scope", error_description="${wire.message}"`);
				else if (wire.kind === 'client') request.response?.header('WWW-Authenticate', `Bearer realm="Misskey", error="invalid_request", error_description="${wire.message}"`);
				return error;
			},
		};
	}
}
