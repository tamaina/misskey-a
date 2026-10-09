/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { In } from 'typeorm';
import type { EmojisRepository, DriveFilesRepository, SwSubscriptionsRepository } from '@features/persistence/backend/repositories/models.js';
import { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import { EmojiEntityService } from '@features/emojis/backend/serializers/EmojiEntityService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { NotificationEntityService } from '@features/notifications/backend/serializers/NotificationEntityService.js';
import { PushNotificationService } from '@features/notifications/backend/services/PushNotificationService.js';
import { createEmojisOperations } from '@features/emojis/backend/api.operations.js';
import { createNotificationsOperations } from '@features/notifications/backend/application.js';
import { packedNotificationSchema } from '@features/notifications/backend/notification.schema.js';
import { MoreThan } from 'typeorm';
import type { DataSource } from 'typeorm';
import type { Redis } from 'ioredis';
import type { AdsRepository, AnnouncementsRepository, AnnouncementReadsRepository, RetentionAggregationsRepository, NoteReactionsRepository, InstancesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { MetaService } from '@features/instance/backend/services/MetaService.js';
import { MetaEntityService } from '@features/instance/backend/serializers/MetaEntityService.js';
import { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { AnnouncementEntityService } from '@features/announcements/backend/serializers/AnnouncementEntityService.js';
import { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';
import { AvatarDecorationService } from '@features/avatar-decorations/backend/services/AvatarDecorationService.js';
import { RegistryApiService } from '@features/preferences/backend/services/RegistryApiService.js';
import { DiscoveryApplicationService } from '@features/discovery/backend/endpoints/discovery.application.js';
import { createInstanceOperations } from '@features/instance/backend/operations.js';
import { createStatisticsOperations } from '@features/statistics/backend/operations.js';
import { createAnnouncementsOperations } from '@features/announcements/backend/api.operations.js';
import { createAvatarDecorationsOperations } from '@features/avatar-decorations/backend/api.operations.js';
import { createPreferencesOperations } from '@features/preferences/backend/operations.js';
import { USER_ONLINE_THRESHOLD } from '@features/users/backend/presence-constants.js';
import { getPilotEndpointDescriptors } from './openapi/pilot-spec.js';
import type { ApiExecutionContext } from '@features/index/backend/api.context.js';
import ActiveUsersChart from '@features/statistics/backend/charts/active-users.js';
import ApRequestChart from '@features/statistics/backend/charts/ap-request.js';
import DriveChart from '@features/statistics/backend/charts/drive.js';
import FederationChart from '@features/statistics/backend/charts/federation.js';
import InstanceChart from '@features/statistics/backend/charts/instance.js';
import NotesChart from '@features/statistics/backend/charts/notes.js';
import PerUserDriveChart from '@features/statistics/backend/charts/per-user-drive.js';
import PerUserFollowingChart from '@features/statistics/backend/charts/per-user-following.js';
import PerUserNotesChart from '@features/statistics/backend/charts/per-user-notes.js';
import PerUserPvChart from '@features/statistics/backend/charts/per-user-pv.js';
import PerUserReactionsChart from '@features/statistics/backend/charts/per-user-reactions.js';
import UsersChart from '@features/statistics/backend/charts/users.js';
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
import type { UploadResource } from './context.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/** DI composition only; applications and native procedures own behavior. */
@Injectable()
export class OrpcPilotService {
	private readonly router = createApiRouter<MiLocalUser>();
	private readonly handler = new OpenAPIHandler(this.router, { customErrorResponseBodyEncoder: misskeyErrorBody });
	private readonly serverInfo;
	private readonly deleteNote;
	private readonly createFile;
	private readonly operations: ApiExecutionContext<MiLocalUser>['operations'];

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
		@Inject(DI.adsRepository) ads: AdsRepository,
		@Inject(DI.announcementsRepository) announcements: AnnouncementsRepository,
		@Inject(DI.announcementReadsRepository) announcementReads: AnnouncementReadsRepository,
		@Inject(DI.retentionAggregationsRepository) retention: RetentionAggregationsRepository,
		@Inject(DI.noteReactionsRepository) reactions: NoteReactionsRepository,
		@Inject(DI.instancesRepository) instances: InstancesRepository,
		@Inject(DI.db) db: DataSource,
		@Inject(DI.redis) redis: Redis,
		idService: IdService,
		queryService: QueryService,
		moderationLogService: ModerationLogService,
		metaService: MetaService,
		metaEntityService: MetaEntityService,
		systemAccountService: SystemAccountService,
		userEntityService: UserEntityService,
		announcementEntityService: AnnouncementEntityService,
		announcementService: AnnouncementService,
		avatarDecorationService: AvatarDecorationService,
		registry: RegistryApiService,
		discovery: DiscoveryApplicationService,
		@Inject(DI.emojisRepository) emojis: EmojisRepository,
		@Inject(DI.driveFilesRepository) driveFiles: DriveFilesRepository,
		@Inject(DI.swSubscriptionsRepository) subscriptions: SwSubscriptionsRepository,
		customEmojiService: CustomEmojiService,
		emojiEntityService: EmojiEntityService,
		utilityService: UtilityService,
		queueService: QueueService,
		notificationService: NotificationService,
		notificationEntityService: NotificationEntityService,
		pushNotificationService: PushNotificationService,
		activeUsers: ActiveUsersChart,
		apRequest: ApRequestChart,
		driveChart: DriveChart,
		federation: FederationChart,
		instance: InstanceChart,
		notes: NotesChart,
		userDrive: PerUserDriveChart,
		userFollowing: PerUserFollowingChart,
		userNotes: PerUserNotesChart,
		userPv: PerUserPvChart,
		userReactions: PerUserReactionsChart,
		usersChart: UsersChart,

	) {
		this.operations = {
			instance: createInstanceOperations<MiLocalUser>({ adsRepository: ads, usersRepository: users,
				serverSettings: settings, config, idService, queryService, moderationLogService, metaService,
				metaEntityService, systemAccountService, userEntityService, db, redisClient: redis,
				getOnlineUsersCount: { thresholdMs: USER_ONLINE_THRESHOLD, countSince: cutoff => users.countBy({ lastActiveDate: MoreThan(cutoff) }) },
				readEndpoints: async () => {
					const { endpoints } = await import('@features/index/backend/endpoints.js');
					const legacy = endpoints.map(endpoint => ({ name: endpoint.name,
						properties: Object.fromEntries(Object.entries(endpoint.params.properties ?? {}).map(([name, value]) => [name, typeof value.type === 'string' ? { type: value.type } : {}])) }));
					return [...legacy, ...await getPilotEndpointDescriptors()].sort((a, b) => a.name.localeCompare(b.name));
				},
			}),
			statistics: createStatisticsOperations<MiLocalUser>({ charts: { activeUsers, apRequest, drive: driveChart,
				federation, instance, notes, userDrive, userFollowing, userNotes, userPv, userReactions, users: usersChart },
				readRetention: options => retention.find(options),
				readNotes: async () => { const chart = await notes.getChart('hour', 1, null); return { local: chart.local.total[0], remote: chart.remote.total[0] }; },
				readUsers: async () => { const chart = await usersChart.getChart('hour', 1, null); return { local: chart.local.total[0], remote: chart.remote.total[0] }; },
				countReactions: () => reactions.count({ cache: 3600000 }), countInstances: () => instances.count({ cache: 3600000 }),
			}),
			discovery,
			emojis: createEmojisOperations<MiLocalUser>({ emojisRepository: emojis, driveFilesRepository: driveFiles,
				customEmojiService, emojiEntityService, driveService: drive, queryService, utilityService, idService, queueService }),
			notifications: createNotificationsOperations<MiLocalUser>({
				generateId: timestamp => idService.gen(timestamp),
				getNotifications: (userId, options) => notificationService.getNotifications(userId, options),
				packMany: async (records, userId) => v.parse(v.array(packedNotificationSchema), await notificationEntityService.packMany(records, userId)),
				packGroupedMany: async (records, userId) => v.parse(v.array(packedNotificationSchema), await notificationEntityService.packGroupedMany(records, userId)),
				createAppNotification: (userId, data) => notificationService.createNotification(userId, 'app', data),
				createTestNotification: userId => notificationService.createNotification(userId, 'test', {}),
				flushAllNotifications: userId => notificationService.flushAllNotifications(userId),
				readAllNotification: (userId, force) => notificationService.readAllNotification(userId, force),
				swPublicKey: settings.swPublicKey, isValidEndpoint: endpoint => pushNotificationService.isValidEndpoint(endpoint),
				findSubscription: query => subscriptions.findOneBy(query), findSubscriptions: query => subscriptions.findBy(query),
				insertSubscription: async record => { await subscriptions.insert(record); },
				updateSubscription: async (id, update) => { await subscriptions.update(id, update); },
				deleteSubscriptions: async ids => { await subscriptions.delete({ id: In(ids) }); },
				refreshSubscriptionCache: userId => pushNotificationService.refreshCache(userId),
			}),
			announcements: createAnnouncementsOperations<MiLocalUser>({ announcementsRepository: announcements,
				announcementReadsRepository: announcementReads, queryService, idService, announcementEntityService, announcementService }),
			avatarDecorations: createAvatarDecorationsOperations<MiLocalUser>({ avatarDecorationService, idService, readRoles: () => roles.getRoles() }),
			preferences: createPreferencesOperations<MiLocalUser>({ registry }),
		};

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

	private context(request: FastifyRequest, reply: FastifyReply, name: string, upload?: UploadResource): ApiExecutionContext<MiLocalUser> {
		const credential = bodyCredential(request);
		return {
			authorization: {
				rootUserId: () => this.settings.rootUserId,
				roles: actor => this.roles.getUserRoles(actor.id),
				policyAllowed: async (actor, key) => {
					const policies = await this.roles.getUserPolicies(actor.id);
					return Boolean(Object.entries(policies).find(([name]) => name === key)?.[1]);
				},
			},
			operations: this.operations,
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
