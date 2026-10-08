/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { randomUUID } from 'node:crypto';
import * as os from 'node:os';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MiMeta, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { NoteDeleteService } from '@features/notes/backend/services/NoteDeleteService.js';
import { DriveService } from '@features/drive/backend/services/DriveService.js';
import { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import { TelemetryService } from '@features/statistics/backend/services/TelemetryService.js';
import { AuthenticateService, AuthenticationError } from '@features/auth/backend/transport/AuthenticateService.js';
import { getIpHash } from '@features/auth/backend/utility/get-ip-hash.js';
import { createApiRouter } from '@features/index/backend/api.router.js';
import { createServerInfoService } from '@features/instance/backend/server-info.js';
import { createDeleteNote } from '@features/notes/backend/delete-note.js';
import { createFileService } from '@features/drive/backend/create-file.js';
import { GetterService } from './GetterService.js';
import { RateLimiterService } from './RateLimiterService.js';
import { ApiLoggerService } from './ApiLoggerService.js';
import { ApiCallService } from './ApiCallService.js';
import { apiError, internalError, normalizeError, misskeyErrorBody } from './orpc-error.js';
import { bodyCredential, registerPilotHttp } from './pilot-http.js';
import type { ApiContext, UploadResource } from './context.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/** DI composition only; applications and native procedures own behavior. */
@Injectable()
export class OrpcPilotService {
	private readonly router = createApiRouter<MiLocalUser>();
	private readonly handler = new OpenAPIHandler(this.router, { customErrorResponseBodyEncoder: misskeyErrorBody });
	private readonly serverInfo;
	private readonly deleteNote;
	private readonly createFile;

	constructor(
		@Inject(DI.config) private readonly config: Config,
		@Inject(DI.meta) private readonly settings: MiMeta,
		@Inject(DI.usersRepository) users: UsersRepository,
		private readonly authenticate: AuthenticateService,
		private readonly roles: RoleService,
		private readonly limiter: RateLimiterService,
		private readonly logger: ApiLoggerService,
		private readonly telemetry: TelemetryService,
		private readonly apiCall: ApiCallService,
		getter: GetterService,
		deletion: NoteDeleteService,
		drive: DriveService,
		files: DriveFileEntityService,
	) {
		this.serverInfo = createServerInfoService({
			enabled: () => settings.enableServerMachineStats,
			read: async () => {
				const si = await import('systeminformation');
				const memory = await si.mem();
				const disks = await si.fsSize();
				return { machine: os.hostname(), cpu: { model: os.cpus()[0].model, cores: os.cpus().length },
					mem: { total: memory.total }, fs: { total: disks[0].size, used: disks[0].used } };
			},
		});
		this.deleteNote = createDeleteNote<MiLocalUser, MiNote, MiUser>({ getNote: id => getter.getNote(id), isModerator: actor => roles.isModerator(actor),
			findAuthor: id => users.findOneByOrFail({ id }), delete: (author, note, quiet, actor) => deletion.delete(author, note, quiet, actor) });
		this.createFile = createFileService<MiLocalUser, MiDriveFile>({ validateFileName: name => files.validateFileName(name),
			enableIpLogging: () => settings.enableIpLogging, addFile: options => drive.addFile(options),
			pack: file => files.pack(file, { self: true }), logError: error => {
				if (error instanceof Error || typeof error === 'string') console.error(error);
			} });
	}

	private context(request: FastifyRequest, reply: FastifyReply, name: string, upload?: UploadResource): ApiContext<MiLocalUser> {
		const credential = bodyCredential(request);
		return {
			credential, ip: request.ip, headers: request.headers, ...(upload === undefined ? {} : { upload }),
			services: {
				authenticate: async token => {
					try {
						const principal = await this.authenticate.authenticate(token);
						if (principal[0]) this.apiCall.logIp(request, principal[0]);
						return principal;
					} catch (error) {
						if (!(error instanceof AuthenticationError)) throw error;
						throw apiError({ code: 'AUTHENTICATION_FAILED', status: 401,
							message: 'Authentication failed. Please ensure your token is correct.', id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14' });
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
				serverInfo: this.serverInfo, deleteNote: this.deleteNote, createFile: this.createFile,
			},
			mapError: original => {
				let error = normalizeError(original);
				if (error.code === 'INTERNAL_ERROR') {
					const id = randomUUID();
					const cause = original instanceof Error ? original : new Error('Unknown API failure');
					this.logger.logger.write({ level: 'error', eventName: 'api.endpoint.failed', message: `Internal error occurred in ${name}: ${cause.message}`,
						attributes: { 'api.endpoint': name, 'error.id': id, 'api.params': request.body }, error: cause });
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

	register(fastify: FastifyInstance) {
		registerPilotHttp(fastify, this.handler, {
			maxFileSize: this.config.maxFileSize,
			context: (request, reply, name, upload) => this.context(request, reply, name, upload),
			runSpan: (name, run) => this.telemetry.startSpan(name, run),
		});
	}
}
