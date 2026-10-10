/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { userInfo } from 'node:os';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { call } from '@orpc/server';
import * as v from 'valibot';
import { entities } from '@features/persistence/backend/postgres.js';
import { createRepositorySet } from '@features/persistence/backend/repositories/factory.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiNote } from '@features/notes/backend/models/Note.js';
import { MiMeta } from '@features/instance/backend/models/Meta.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { packedUserLiteSchema } from '@features/users/backend/user.schema.js';
import { createIRevokeTokenProcedure } from '@features/auth/backend/endpoints/i/revoke-token.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { McpApiService } from '@features/mcp/backend/McpApiService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { createLocalMcpPilot } from '../../backend/local-transport.js';
import { fixture } from './fixtures/shared-api.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import type { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import type { ReactionService } from '@features/notes/backend/services/ReactionService.js';
import type { ReactionsBufferingService } from '@features/notes/backend/services/ReactionsBufferingService.js';

// Opt in only through the task-owned fixture launcher; never load .config/test.yml.
const socket = process.env.MISSKEY_MCP_TEST_SOCKET;
const enabled = process.env.MISSKEY_MCP_TEST_DB === '1' && socket !== undefined;
describe.skipIf(!enabled)('task-owned native PostgreSQL integration', () => {
	let db: DataSource;
	beforeAll(async () => {
		if (!socket || readFileSync(join(socket, '..', '.misskey-mcp-fixture'), 'utf8') !== 'mcp_synthetic') throw new Error('Task-owned fixture marker required');
		db = new DataSource({ type: 'postgres', host: socket, port: 55436, username: userInfo().username, database: 'mcp_synthetic', entities, synchronize: true, dropSchema: true, logging: false, extra: { max: 2, statement_timeout: 5000 } });
		await db.initialize();
	}, 30000);
	afterAll(async() => {if (db?.isInitialized) await db.destroy();});
	it('native SQL visibility, note serializer and native token revocation share HTTP/MCP semantics', async() => {
		const repos = createRepositorySet(db);
		const f = await fixture();
		const own = await repos.usersRepository.save(Object.assign(f.own, { username: 'synthetic_own', usernameLower: 'synthetic_own' }));
		const other = await repos.usersRepository.save(new MiUser({ id: f.otherId, host: null, uri: null, username: 'synthetic_other', usernameLower: 'synthetic_other' }));
		await repos.appsRepository.save(Object.assign(f.app, { secret: 'SYNTHETIC_ONLY', name: 'synthetic', description: 'fixture', userId: null }));
		await repos.accessTokensRepository.save([f.grant, f.appGrant]);
		// Existing AuthenticateService now executes its original lookups/updates against real repositories.
		f.users.findOneBy.mockImplementation(where => repos.usersRepository.findOneBy(where));
		f.tokens.findOne.mockImplementation(options => repos.accessTokensRepository.findOne(options));
		f.tokens.findOneBy.mockImplementation(where => repos.accessTokensRepository.findOneBy(where));
		f.apps.findOneBy.mockImplementation(where => repos.appsRepository.findOneBy(where));
		f.tokens.update.mockImplementation((id, patch) => repos.accessTokensRepository.update(id, patch));
		f.apps.findOneByOrFail.mockImplementation(where => repos.appsRepository.findOneByOrFail(where));
		f.cache.localUserByIdCache.fetch.mockImplementation(async id => {
			const user = await repos.usersRepository.findOneByOrFail({ id });
			return Object.assign(user, { host: null, uri: null });
		});
		f.cache.localUserByNativeTokenCache.fetch.mockImplementation(async token => {
			const user = await repos.usersRepository.findOneBy({ token });
			return user ? Object.assign(user, { host: null, uri: null }) : null;
		});
		const idService = new IdService(mockDeep<Config>({ id: 'aid' }));
		const meta = Object.assign(new MiMeta(), { enableFanoutTimeline: false, enableReactionsBuffering: false, blockedHosts: [], ugcVisibilityForVisitor: 'public' });
		const query = new QueryService(repos.userProfilesRepository, repos.followingsRepository, repos.channelFollowingsRepository, repos.blockingsRepository, repos.noteThreadMutingsRepository, repos.mutingsRepository, repos.renoteMutingsRepository, meta, idService);
		const userPacking = mockDeep<UserEntityService>();
		const packUser = async(src:MiUser | string) => {
			const user = typeof src === 'string' ? await repos.usersRepository.findOneByOrFail({ id: src }) : src;
			return v.parse(packedUserLiteSchema, { id: user.id, name: null, username: user.username, host: user.host, avatarUrl: 'https://example.invalid/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' });
		};
		userPacking.pack.mockImplementation(packUser);
		userPacking.packMany.mockImplementation(async users => Promise.all(users.map(packUser)));
		const files = mockDeep<DriveFileEntityService>(); files.packManyByIds.mockResolvedValue([]);
		const emoji = mockDeep<CustomEmojiService>(); emoji.populateEmojis.mockResolvedValue({});
		const reactions = mockDeep<ReactionService>(); reactions.convertLegacyReactions.mockImplementation(value => value);
		const buffering = mockDeep<ReactionsBufferingService>(); buffering.mergeReactions.mockImplementation((value, deltas) => ({ ...value, ...deltas }));
		const noteModule = await Test.createTestingModule({ providers: [NoteEntityService,
																																																																		{ provide: DI.meta, useValue: meta }, ...(['usersRepository', 'notesRepository', 'followingsRepository', 'pollsRepository', 'pollVotesRepository', 'noteReactionsRepository', 'channelsRepository'] as const).map(name => ({ provide: DI[name], useValue: repos[name] })),
																																																																		{ provide: 'UserEntityService', useValue: userPacking }, { provide: 'DriveFileEntityService', useValue: files }, { provide: 'CustomEmojiService', useValue: emoji }, { provide: 'ReactionService', useValue: reactions }, { provide: 'ReactionsBufferingService', useValue: buffering }, { provide: 'IdService', useValue: idService }, { provide: 'CacheService', useValue: f.cache },
		] }).compile();
		await noteModule.init();
		const local = createLocalMcpPilot(f.module.get(McpApiService), { enabled: true, resource: 'http://127.0.0.1:61836/mcp' });
		const transportRequest = (method: string, params: object = {}) => local.app.inject({ method: 'POST', url: '/mcp', headers: { host: '127.0.0.1:61836', authorization: `Bearer ${f.grant.token}`, accept: 'application/json, text/event-stream', 'content-type': 'application/json' }, payload: { jsonrpc: '2.0', id: 1, method, params } });
		try {
			f.deps.serverSettings.enableFanoutTimeline = false;
			f.deps.notesRepository.createQueryBuilder.mockImplementation((alias, runner) => repos.notesRepository.createQueryBuilder(alias, runner));
			f.deps.queryService.makePaginationQuery.mockImplementation(query.makePaginationQuery);
			f.deps.queryService.generateVisibilityQuery.mockImplementation(query.generateVisibilityQuery);
			f.deps.queryService.generateBaseNoteFilteringQuery.mockImplementation(query.generateBaseNoteFilteringQuery);
			f.deps.queryService.generateUgcVisibilityQueryForVisitor.mockImplementation(query.generateUgcVisibilityQueryForVisitor);
			f.deps.channelMutingService.list.mockResolvedValue([]);
			f.deps.noteEntityService.packMany.mockImplementation(noteModule.get(NoteEntityService).packMany);
			const notes = [];
			for (const user of [own, other]) for (const visibility of ['public', 'home', 'followers', 'specified'] as const) {
				const note = await repos.notesRepository.save(new MiNote({ id: idService.gen(), userId: user.id, userHost: null, text: `SYNTHETIC_${user.username}_${visibility}`, visibility, visibleUserIds: [], mentions: [], fileIds: [], tags: [], emojis: [], reactionAndUserPairCache: [], reactions: {}, localOnly: false }));
				notes.push(note);
			}
			const specified = notes.find(note => note.userId === other.id && note.visibility === 'specified')!;
			const followers = notes.find(note => note.userId === other.id && note.visibility === 'followers')!;
			await repos.notesRepository.save(new MiNote({ id: idService.gen(), userId: own.id, userHost: null, text: 'SYNTHETIC_REPLY', visibility: 'public', replyId: specified.id, replyUserId: other.id, replyUserHost: null }));
			await repos.notesRepository.save(new MiNote({ id: idService.gen(), userId: own.id, userHost: null, text: 'SYNTHETIC_QUOTE', visibility: 'public', renoteId: followers.id, renoteUserId: other.id, renoteUserHost: null }));
			const direct = await f.ordinary({ userId: own.id }); expect(direct.statusCode).toBe(200);
			const mcp = await f.invoke(); expect(mcp).toEqual(direct.json());
			const overTransport = await transportRequest('tools/call', { name: 'list_my_notes', arguments: {} });
			expect(overTransport.statusCode).toBe(200);
			expect(overTransport.json().result.structuredContent).toEqual({ notes: direct.json() });
			expect(direct.json().filter((note:{ text: string }) => note.text.startsWith('SYNTHETIC_synthetic_own_')).map((note:{ visibility: string }) => note.visibility).sort()).toEqual(['followers', 'home', 'public', 'specified']);
			expect(direct.json().find((note:{ text: string }) => note.text === 'SYNTHETIC_REPLY').reply).toMatchObject({ isHidden: true, text: null, fileIds: [] });
			expect(direct.json().find((note:{ text: string }) => note.text === 'SYNTHETIC_QUOTE').renote).toMatchObject({ isHidden: true, text: null, fileIds: [] });
			const foreign = await f.ordinary({ userId: other.id }); expect(foreign.json().map((note:{ visibility: string }) => note.visibility).sort()).toEqual(['home', 'public']);
			await expect(f.invoke({ userId: other.id })).rejects.toMatchObject({ code: 'SUBJECT_MISMATCH' });
			const denied = await f.ordinary({}, f.grant.token, 'my/apps'); expect(denied.json().error.code).toBe('PERMISSION_DENIED');
			expect((await f.ordinary({}, f.appGrant.hash, 'my/apps')).statusCode).toBe(200); // app row permissions override access-token row permissions
			await expect(f.invoke({}, '0123456789abcdef')).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
			expect((await f.ordinary({ userId: own.id }, '0123456789abcdef')).statusCode).toBe(200);
			await repos.accessTokensRepository.update(f.grant.id, { permission: ['read:account'] });
			expect((await f.ordinary({}, f.grant.token, 'my/apps')).statusCode).toBe(200);
			await expect(f.invoke()).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
			expect((await transportRequest('tools/list')).statusCode).toBe(403);
			await repos.accessTokensRepository.update(f.grant.id, { permission: ['access:mcp'] });
			await f.invoke();
			await repos.appsRepository.update(f.app.id, { permission: ['read:account'] });
			await expect(f.invoke({}, f.appGrant.hash)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
			await repos.appsRepository.update(f.app.id, { permission: ['read:account', 'access:mcp'] });
			await f.invoke({}, f.appGrant.hash);
			const context = f.module.get(ApiExecutionContextFactory);
			const revoke = createIRevokeTokenProcedure({ accessTokensRepository: {
				findOneBy: where => 'token' in where ? repos.accessTokensRepository.findOneBy(where) : typeof where.id === 'string' ? repos.accessTokensRepository.findOneBy({ id: where.id, userId: where.userId }) : Promise.resolve(null),
				delete: where => repos.accessTokensRepository.delete(where),
			} });
			await expect(call(revoke, { tokenId: f.appGrant.id }, { context: context.create(f.request(), 'i/revoke-token') })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
			expect(await repos.accessTokensRepository.findOneBy({ id: f.appGrant.id })).not.toBeNull();
			await call(revoke, { tokenId: f.grant.id }, { context: context.create(f.request(), 'i/revoke-token') });
			expect(await repos.accessTokensRepository.findOneBy({ id: f.grant.id })).toBeNull();
			expect((await f.ordinary({ userId: own.id })).statusCode).toBe(401);
			await expect(f.invoke()).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });
			expect((await transportRequest('tools/list')).statusCode).toBe(401);
			expect(f.deps.fanoutTimelineEndpointService.timeline).not.toHaveBeenCalled();
		} finally {await local.app.close(); await noteModule.close();}
	}, 30000);
	it('delayed native work completes after abort: signal forwarding is not active SQL cancellation', async() => {
		const f = await fixture(); const abort = new AbortController();
		let release!:() => void; let entered!:() => void;
		const started = new Promise<void>(resolve => {entered = resolve;}); const delay = new Promise<void>(resolve => {release = resolve;});
		f.deps.fanoutTimelineEndpointService.timeline.mockImplementation(async() => {entered(); await delay; return [];});
		const pending = f.module.get(McpApiService).invoke('list_my_notes', {}, f.request(), abort.signal);
		await started; abort.abort(); release();
		expect(await pending).toEqual([]);
	});
});
