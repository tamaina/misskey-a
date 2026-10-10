/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import '@fastify/multipart';
import { afterEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Test } from '@nestjs/testing';
import { implement } from '@orpc/server';
import Fastify from 'fastify';
import * as v from 'valibot';
import { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import { MiApp } from '@features/auth/backend/models/App.js';
import { MiNote } from '@features/notes/backend/models/Note.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { DEFAULT_POLICIES, RoleService } from '@features/roles/backend/services/RoleService.js';
import { TelemetryService } from '@features/statistics/backend/services/TelemetryService.js';
import { ApiRouterProvider } from '@features/index/backend/api.implementation.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { OrpcPilotService } from '@features/api/backend/transport/OrpcPilotService.js';
import { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { ApiIpLoggingService } from '@features/api/backend/transport/ApiIpLoggingService.js';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';
import { normalizeError } from '@features/api/backend/transport/orpc-error.js';
import { usersNotesContract } from '@features/timelines/backend/endpoints/users/notes.contract.js';
import { createUsersNotesProcedure } from '@features/timelines/backend/endpoints/users/notes.js';
import { MyAppsContract } from '@features/auth/backend/api.definition.js';
import { createMyAppsProcedure } from '@features/auth/backend/endpoints/my/apps.js';
import { packedNoteSchema } from '@features/notes/backend/note.schema.js';
import { DI } from '@/di-symbols.js';
import { McpApiService } from '../../../backend/McpApiService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { UsersNotesDependencies } from '@features/timelines/backend/endpoints/users/notes.js';
import type { MyAppsDependencies } from '@features/auth/backend/endpoints/my/apps.js';
import type { AccessTokensRepository, AppsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';

// No listener, DB, Redis, real token, grant issuance or production data is used.
const cleanups: (() => Promise<unknown>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });

export async function fixture() {
	const own: MiLocalUser = Object.assign(new MiUser({}), { id: 'aaaaaaaaaaaaaaaa', host: null, uri: null, token: '0123456789abcdef', isSuspended: false, movedToUri: null });
	const otherId = 'bbbbbbbbbbbbbbbb';
	const grant: MiAccessToken = Object.assign(new MiAccessToken(), { id: 'cccccccccccccccc', userId: own.id, token: 'synthetic-miauth-credential-32chars', hash: 'synthetic-miauth-credential-32chars', appId: null, permission: ['access:mcp'] });
	const app = Object.assign(new MiApp(), { id: 'dddddddddddddddd', permission: ['read:account', 'access:mcp'] });
	const appGrant: MiAccessToken = Object.assign(new MiAccessToken(), { id: 'eeeeeeeeeeeeeeee', userId: own.id, token: 'synthetic-app-token-32characters', hash: 'synthetic-app-hash-32characters', appId: app.id, permission: ['write:notes'] });
	const rows = new Map<string, MiAccessToken>([[grant.id, grant], [appGrant.id, appGrant]]);
	const users = mockDeep<UsersRepository>();
	const tokens = mockDeep<AccessTokensRepository>();
	const apps = mockDeep<AppsRepository>();
	const cache = mockDeep<CacheService>();
	users.findOneBy.mockResolvedValue(own);
	tokens.findOne.mockImplementation(async options => {
		const where = options.where;
		return [...rows.values()].find(row => Array.isArray(where) && where.some(candidate => candidate.hash === row.hash || candidate.token === row.token)) ?? null;
	});
	tokens.findOneBy.mockImplementation(async where => Array.isArray(where) ? null : [...rows.values()].find(row => row.id === where.id && row.userId === where.userId) ?? null);
	apps.findOneBy.mockImplementation(async where => !Array.isArray(where) && where.id === app.id ? app : null);
	tokens.update.mockResolvedValue({ raw: [], generatedMaps: [], affected: 1 });
	apps.findOneByOrFail.mockResolvedValue(app);
	cache.localUserByIdCache.fetch.mockResolvedValue(own);
	cache.localUserByNativeTokenCache.fetch.mockImplementation(async token => token === own.token ? own : null);
	const blocked = new Set<string>();
	cache.userBlockedCache.fetch.mockResolvedValue(blocked);
	cache.userFollowingsCache.fetch.mockResolvedValue({});
	const deps = mockDeep<UsersNotesDependencies>();
	deps.serverSettings.enableFanoutTimeline = true;
	deps.cacheService = cache;
	const notes = [own.id, otherId].flatMap(userId => ['public', 'home', 'followers', 'specified'].map((visibility, i) => v.parse(packedNoteSchema, {
		id: `${userId.slice(0, 15)}${i}`, createdAt: '2026-01-01T00:00:00Z', text: `synthetic ${visibility}`, userId,
		user: { id: userId, name: null, username: 'fixture', host: null, avatarUrl: 'https://example.invalid/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' },
		visibility, visibleUserIds: [], reactionAcceptance: null, reactionEmojis: {}, reactions: {}, reactionCount: 0, renoteCount: 0, repliesCount: 0,
	})));
	deps.fanoutTimelineEndpointService.timeline.mockImplementation(async options => notes.filter(note => options.redisTimelines.some(key => key.endsWith(`:${note.userId}`)) && (options.noteFilter?.(new MiNote({ id: note.id, userId: note.userId, visibility: note.visibility, visibleUserIds: note.visibleUserIds ?? [], channel: null })) ?? true)).slice(0, options.limit));
	const appDeps = mockDeep<MyAppsDependencies>();
	appDeps.appsRepository.find.mockResolvedValue([]);
	const contract = { timelines: { usersNotes: usersNotesContract }, auth: { 'my/apps': MyAppsContract } };
	const builder = implement(contract).$context<ApiContext<MiLocalUser>>().use(async ({ context, next }) => {
		try { return await next(); } catch (error) { throw context.mapError ? context.mapError(error) : normalizeError(error); }
	});
	const router = builder.router({ timelines: { usersNotes: createUsersNotesProcedure<MiLocalUser>(deps) }, auth: { 'my/apps': createMyAppsProcedure(appDeps) } });
	const roles = mockDeep<RoleService>(); roles.getUserPolicies.mockResolvedValue(DEFAULT_POLICIES);
	const logger = mockDeep<ApiLoggerService>();
	const telemetry = mockDeep<TelemetryService>(); telemetry.startSpan.mockImplementation((_name, run) => run());
	const module = await Test.createTestingModule({ providers: [AuthenticateService, ApiExecutionContextFactory, McpApiService, OrpcPilotService,
																																																													{ provide: DI.config, useValue: { maxFileSize: 1024, enableIpRateLimit: false } }, { provide: DI.meta, useValue: { rootUserId: null } },
																																																													{ provide: DI.usersRepository, useValue: users }, { provide: DI.accessTokensRepository, useValue: tokens }, { provide: DI.appsRepository, useValue: apps },
																																																													{ provide: CacheService, useValue: cache }, { provide: RoleService, useValue: roles }, { provide: ApiLoggerService, useValue: logger }, { provide: TelemetryService, useValue: telemetry },
																																																													{ provide: ApiIpLoggingService, useValue: mockDeep<ApiIpLoggingService>() }, { provide: RateLimiterService, useValue: mockDeep<RateLimiterService>() },
																																																													{ provide: ApiRouterProvider, useValue: { compose: () => router } },
	] }).compile();
	cleanups.push(() => module.close());
	const http = Fastify();
	http.register(async instance => { module.get(OrpcPilotService).register(instance); }, { prefix: '/api' });
	await http.ready(); cleanups.push(() => http.close());
	const request = (credential: string | undefined = grant.token) => ({ credential, ip: '127.0.0.1', headers: {} });
	const invoke = (input: unknown = {}, credential: string | undefined = grant.token) => module.get(McpApiService).invoke('list_my_notes', input, request(credential));
	const ordinary = (input: object, credential = grant.token, name = 'users/notes') => http.inject({ method: 'POST', url: `/api/${name}`, payload: { ...input, i: credential } });
	return { cache, users, apps, appDeps, http, own, otherId, grant, appGrant, app, rows, tokens, deps, blocked, module, invoke, ordinary, request, router, logger, telemetry };
}
