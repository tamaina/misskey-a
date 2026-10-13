/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { userInfo } from 'node:os';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { DataSource, Repository } from 'typeorm';
import { entities } from '@features/persistence/backend/postgres.js';
import { createRepositorySet } from '@features/persistence/backend/repositories/factory.js';
import { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { McpEventsWebhook1791763200000 } from '../../../../backend/migration/1791763200000-McpEventsWebhook.js';
import { McpAntennaEvents1791763200001 } from '../../../../backend/migration/1791763200001-McpAntennaEvents.js';
import { McpStreamSubscriptions1791786439355 } from '../../../../backend/migration/1791786439355-McpStreamSubscriptions.js';
import { McpStreamSubscriptionService } from '../../backend/McpStreamSubscriptionService.js';
import { AntennaEventSubscriptionService } from '@features/timelines/backend/services/AntennaEventSubscriptionService.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type * as Redis from 'ioredis';
import { McpEventsService } from '../../backend/McpEventsService.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
const socket = process.env.MISSKEY_MCP_TEST_SOCKET;
describe.skipIf(!socket)('isolated MCP Events PostgreSQL fixture', () => {
	let db: DataSource;
	beforeAll(async () => {
		if (!socket || readFileSync(join(socket, '..', '.misskey-mcp-fixture'), 'utf8') !== 'mcp_synthetic') throw new Error('Task-owned fixture marker required');
		db = new DataSource({ type: 'postgres', host: socket, port: 55436, username: userInfo().username, database: 'mcp_synthetic', entities, synchronize: true, dropSchema: true, logging: false, extra: { max: 2, statement_timeout: 5000 } });
		await db.initialize();
	}, 30000);
	afterAll(async () => { if (db?.isInitialized) await db.destroy(); });
	it('persists native parameters/generation, restores future observation and round-trips the stream migration without pending DDL', async () => {
		const repos = createRepositorySet(db);
		const user = await repos.usersRepository.save(new MiUser({ id: 'stream_account', host: null, username: 'synthetic_stream', usernameLower: 'synthetic_stream' }));
		const grant = await repos.accessTokensRepository.save({ id: 'stream_grant', userId: user.id, token: 'SYNTHETIC_STREAM', hash: 'SYNTHETIC_STREAM', permission: ['access:mcp', 'read:account'] });
		const http = mockDeep<HttpRequestService>(); const roles = mockDeep<RoleService>(); const native = mockDeep<import('../../backend/McpStreamAccessService.js').McpStreamAccessService>();
		http.sendMcpWebhook.mockImplementation(async (_url, body) => ({ status: 200, ok: true, text: JSON.stringify({ challenge: JSON.parse(body).challenge }) })); roles.getUserPolicies.mockResolvedValue({ webhookLimit: 5 } as never);
		const moduleRef = mockDeep<import('@nestjs/core').ModuleRef>(); moduleRef.get.mockReturnValue(native as never);
		const service = new McpEventsService(repos.webhooksRepository, repos.accessTokensRepository, repos.appsRepository, repos.usersRepository, repos.notesRepository, http, roles, mockDeep(), repos.antennasRepository, mockDeep(), moduleRef);
		const context: ApiContext<MiLocalUser> = { credential: 'SYNTHETIC_STREAM', ip: '127.0.0.1', headers: {}, services: { authenticate: async () => [user as MiLocalUser, grant], limitActor: () => user.id, rateLimitFactor: async () => 1, limit: async () => null } };
		const input = { name: 'stream.channel', arguments: { channel: 'homeTimeline' }, delivery: { mode: 'webhook', url: 'https://callback.example/stream', secret: 'whsec_' + Buffer.alloc(32, 11).toString('base64') } };
		const { id } = await service.invoke('events/subscribe', input, context) as { id: string };
		const row = await repos.webhooksRepository.findOneByOrFail({ id });
		expect(row.mcpStream).toEqual({ channel: 'homeTimeline', params: { withFiles: false, withRenotes: true } }); expect(row.on).toEqual([]);
		const explicit = { ...input, arguments: { channel: 'homeTimeline', params: { withRenotes: true, withFiles: false } } };
		expect((await service.invoke('events/subscribe', explicit, context) as { id: string }).id).toBe(id);
		expect((await repos.webhooksRepository.findOneByOrFail({ id })).mcpGeneration).toBe(row.mcpGeneration);
		const redis = new (await import('node:events')).EventEmitter(); const queue = mockDeep<QueueService>();
		native.authorize.mockResolvedValue({ webhook: row, frames: [] });
		let listener = new McpStreamSubscriptionService(redis as unknown as Redis.Redis, repos.webhooksRepository, native, queue);
		listener.onApplicationBootstrap(); await listener.onApplicationShutdown(); listener = new McpStreamSubscriptionService(redis as unknown as Redis.Redis, repos.webhooksRepository, native, queue); listener.onApplicationBootstrap();
		await listener.receive(JSON.stringify({ occurrenceId: 'after-restart', createdAt: Date.now(), channel: 'notesStream', message: { id: 'synthetic-note', text: 'PRIVATE_SYNTHETIC' } }));
		expect(queue.streamWebhookDeliver).toHaveBeenCalledOnce(); expect(queue.streamWebhookDeliver.mock.calls[0][1].message).toEqual({ id: 'synthetic-note' }); await listener.onApplicationShutdown();
		await service.invoke('events/unsubscribe', { name: input.name, arguments: explicit.arguments, delivery: { mode: 'webhook', url: input.delivery.url } }, context);
		expect((await repos.webhooksRepository.findOneByOrFail({ id })).active).toBe(false);
		await service.invoke('events/subscribe', input, context); expect((await repos.webhooksRepository.findOneByOrFail({ id })).mcpGeneration).not.toBe(row.mcpGeneration);
		const runner = db.createQueryRunner(); const migration = new McpStreamSubscriptions1791786439355(); await migration.down(runner); expect(await runner.query('SELECT "id" FROM "webhook" WHERE "id" = $1', [id])).toEqual([]); await migration.up(runner);
		expect((await db.driver.createSchemaBuilder().log()).upQueries).toEqual([]); await runner.release(); await repos.usersRepository.delete(user.id);
	});
	it('round-trips migration and leaves no pending entity DDL', async () => {
		const runner = db.createQueryRunner(); const migration = new McpEventsWebhook1791763200000();
		await migration.down(runner); await migration.up(runner);
		const ddl = await db.driver.createSchemaBuilder().log(); expect(ddl.upQueries.map(query => query.query)).toEqual([]);
		await runner.release();
	});
	it('serializes unsubscribe after an in-flight refresh without reviving its generation', async () => {
		const repos = createRepositorySet(db);
		const user = await repos.usersRepository.save(new MiUser({ id: 'race_account', host: null, username: 'synthetic_race', usernameLower: 'synthetic_race' }));
		const grant = await repos.accessTokensRepository.save({ id: 'race_grant', userId: user.id, token: 'SYNTHETIC_RACE', hash: 'SYNTHETIC_RACE', permission: ['access:mcp', 'read:notifications'] });
		const http = mockDeep<HttpRequestService>(); const roles = mockDeep<RoleService>(); const noteEntity = mockDeep<NoteEntityService>();
		http.sendMcpWebhook.mockImplementation(async (_url, body) => ({ status: 200, ok: true, text: JSON.stringify({ challenge: JSON.parse(body).challenge }) })); roles.getUserPolicies.mockResolvedValue({ webhookLimit: 5 } as never);
		const service = new McpEventsService(repos.webhooksRepository, repos.accessTokensRepository, repos.appsRepository, repos.usersRepository, repos.notesRepository, http, roles, noteEntity, mockDeep(), mockDeep());
		const context: ApiContext<MiLocalUser> = { credential: 'SYNTHETIC_RACE', ip: '127.0.0.1', headers: {}, services: { authenticate: async () => [user as MiLocalUser, grant], limitActor: () => user.id, rateLimitFactor: async () => 1, limit: async () => null } };
		const input = { name: 'note.mentioned', arguments: {}, delivery: { mode: 'webhook', url: 'https://callback.example/race', secret: 'whsec_' + Buffer.alloc(32, 42).toString('base64') } };
		const { id } = await service.invoke('events/subscribe', input, context) as { id: string };
		const original = await repos.webhooksRepository.findOneByOrFail({ id });
		let entered!: () => void; let release!: () => void;
		const saved = new Promise<void>(resolve => { entered = resolve; }); const delayed = new Promise<void>(resolve => { release = resolve; });
		const save = Repository.prototype.save;
		const spy = vi.spyOn(Repository.prototype, 'save').mockImplementation(async function (this: Repository<MiWebhook>, ...args) {
			if (this.target === MiWebhook) { entered(); await delayed; }
			return save.apply(this, args);
		});
		let refresh: Promise<unknown> | undefined; let unsubscribe: Promise<unknown> | undefined;
		try {
			refresh = service.invoke('events/subscribe', input, context); await saved;
			let completed = false;
			unsubscribe = service.invoke('events/unsubscribe', { name: input.name, arguments: {}, delivery: { mode: 'webhook', url: input.delivery.url } }, context).then(result => { completed = true; return result; });
			await new Promise(resolve => setTimeout(resolve, 50)); expect(completed).toBe(false);
			release(); await refresh; await unsubscribe;
			const revoked = await repos.webhooksRepository.findOneByOrFail({ id }); expect(revoked.active).toBe(false); expect(revoked.secret).toBe('');
			spy.mockRestore(); await service.invoke('events/subscribe', input, context);
			expect((await repos.webhooksRepository.findOneByOrFail({ id })).mcpGeneration).not.toBe(original.mcpGeneration);
			expect(await service.authorizeDelivery(id, user.id, original.mcpGeneration!, 'note', 'mention')).toBeNull();
		} finally { release(); await Promise.allSettled([refresh, unsubscribe]); spy.mockRestore(); await repos.usersRepository.delete(user.id); }
	});
	it('persists grant-bound subscriptions, refreshes idempotently and cascades grant revocation', async () => {
		const repos = createRepositorySet(db);
		const user = await repos.usersRepository.save(new MiUser({ id: 'events_account', host: null, username: 'synthetic_events', usernameLower: 'synthetic_events' }));
		const grant = await repos.accessTokensRepository.save({ id: 'events_grant', userId: user.id, token: 'SYNTHETIC_ONLY', hash: 'SYNTHETIC_ONLY', permission: ['access:mcp', 'read:notifications'] });
		const http = mockDeep<HttpRequestService>(); const roles = mockDeep<RoleService>(); const noteEntity = mockDeep<NoteEntityService>();
		http.sendMcpWebhook.mockImplementation(async (_url, body) => ({ status: 200, ok: true, text: JSON.stringify({ challenge: JSON.parse(body).challenge }) })); roles.getUserPolicies.mockResolvedValue({ webhookLimit: 5 } as never);
		const service = new McpEventsService(repos.webhooksRepository, repos.accessTokensRepository, repos.appsRepository, repos.usersRepository, repos.notesRepository, http, roles, noteEntity, mockDeep(), mockDeep());
		const context: ApiContext<MiLocalUser> = { credential: 'SYNTHETIC_ONLY', ip: '127.0.0.1', headers: {}, services: { authenticate: async () => [user as MiLocalUser, grant], limitActor: () => user.id, rateLimitFactor: async () => 1, limit: async () => null } };
		const input = { name: 'note.mentioned', arguments: {}, delivery: { mode: 'webhook', url: 'https://callback.example/events', secret: 'whsec_' + Buffer.alloc(32, 42).toString('base64') }, ttlMs: 10000 };
		const subscribed = await service.invoke('events/subscribe', input, context) as { id: string };
		const persisted = await repos.webhooksRepository.findOneByOrFail({ id: subscribed.id }); expect(persisted.mode).toBe('mcp'); expect(persisted.mcpGeneration).toMatch(/[a-f0-9-]{36}/);
		await service.invoke('events/subscribe', input, context); expect(await repos.webhooksRepository.countBy({ userId: user.id })).toBe(1);
		roles.getUserPolicies.mockResolvedValue({ webhookLimit: 2 } as never);
		const racing = await Promise.allSettled([1, 2].map(index => service.invoke('events/subscribe', { ...input, name: 'note.replied', delivery: { ...input.delivery, url: `https://callback.example/race${index}` } }, context)));
		expect(racing.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(await repos.webhooksRepository.countBy({ userId: user.id })).toBe(2);
		await repos.accessTokensRepository.delete(grant.id); expect(await repos.webhooksRepository.findOneBy({ id: subscribed.id })).toBeNull();
		expect(await service.authorizeDelivery(subscribed.id, user.id, persisted.mcpGeneration!, 'note', 'mention')).toBeNull();
		// A legacy webhook remains intact on rollback; MCP rows are intentionally removed.
		await repos.webhooksRepository.save({ id: 'legacy_fixture', userId: user.id, name: 'legacy', url: 'https://legacy.example', secret: '', on: ['mention'] });
		const next = await repos.accessTokensRepository.save({ ...grant, id: 'events_grant2' });
		await repos.webhooksRepository.save({ ...persisted, mcpTokenId: next.id, mcpGeneration: randomUUID() });
		const runner = db.createQueryRunner(); await new McpEventsWebhook1791763200000().down(runner);
		const records = await runner.query('SELECT "id", "secret" FROM "webhook"'); expect(records).toEqual([{ id: 'legacy_fixture', secret: '' }]);
		await new McpEventsWebhook1791763200000().up(runner); await runner.release();
	});
	it('round-trips antenna migration and restores live subscriptions from persisted rows after restart', async () => {
		const runner = db.createQueryRunner(); const migration = new McpAntennaEvents1791763200001();
		await migration.down(runner); await migration.up(runner);
		expect((await db.driver.createSchemaBuilder().log()).upQueries).toEqual([]);
		const repos = createRepositorySet(db);
		const user = await repos.usersRepository.save(new MiUser({ id: 'antenna_owner', host: null, username: 'synthetic_antenna', usernameLower: 'synthetic_antenna' }));
		const grant = await repos.accessTokensRepository.save({ id: 'antenna_grant', userId: user.id, token: 'SYNTHETIC_ANTENNA', hash: 'SYNTHETIC_ANTENNA', permission: ['access:mcp', 'read:notifications', 'read:account'] });
		const antenna = await repos.antennasRepository.save({ id: 'synthetic_antenna', userId: user.id, name: 'synthetic', lastUsedAt: new Date(), src: 'all', keywords: [], excludeKeywords: [], users: [], caseSensitive: false, withReplies: true, withFile: false });
		const http = mockDeep<HttpRequestService>(); const roles = mockDeep<RoleService>();
		http.sendMcpWebhook.mockImplementation(async (_url, body) => ({ status: 200, ok: true, text: JSON.stringify({ challenge: JSON.parse(body).challenge }) })); roles.getUserPolicies.mockResolvedValue({ webhookLimit: 5 } as never);
		const service = new McpEventsService(repos.webhooksRepository, repos.accessTokensRepository, repos.appsRepository, repos.usersRepository, repos.notesRepository, http, roles, mockDeep(), repos.antennasRepository, mockDeep());
		const input = { cursor: null, ttlMs: 3600000, name: 'antenna.note' as const, arguments: { antennaId: antenna.id }, delivery: { mode: 'webhook' as const, url: 'https://callback.example/antenna', secret: 'whsec_' + Buffer.alloc(32, 42).toString('base64') } };
		const subscribed = await service.subscribe(user.id, grant.id, input);
		const queue = mockDeep<QueueService>(); const ids = mockDeep<IdService>(); ids.parse.mockReturnValue({ date: new Date(1000) });
		const redis = mockDeep<Redis.Redis>();
		const first = new AntennaEventSubscriptionService(redis, repos.webhooksRepository, queue, ids);
		const event = JSON.stringify({ channel: `antennaStream:${antenna.id}`, message: { type: 'note', body: { id: 'synthetic_note', text: 'PRIVATE_SYNTHETIC' } } });
		await first.receive(event); await first.onApplicationShutdown();
		const restarted = new AntennaEventSubscriptionService(redis, repos.webhooksRepository, queue, ids);
		await restarted.receive(event);
		expect(queue.antennaWebhookDeliver).toHaveBeenCalledTimes(2);
		expect(queue.antennaWebhookDeliver.mock.calls[0][0]).toMatchObject({ id: subscribed.id, mcpAntennaId: antenna.id });
		expect(queue.antennaWebhookDeliver.mock.calls[1][0].mcpGeneration).toBe(queue.antennaWebhookDeliver.mock.calls[0][0].mcpGeneration);
		expect(queue.antennaWebhookDeliver.mock.calls[0][0].secret).toBeUndefined();
		await repos.webhooksRepository.update(subscribed.id, { mcpExpiresAt: new Date(0) });
		await restarted.receive(event); expect(queue.antennaWebhookDeliver).toHaveBeenCalledTimes(2);
		await repos.antennasRepository.delete(antenna.id); expect(await repos.webhooksRepository.findOneBy({ id: subscribed.id })).toBeNull();
		await repos.antennasRepository.save(antenna);
		await service.subscribe(user.id, grant.id, input);
		const mention = await service.subscribe(user.id, grant.id, { ...input, name: 'note.mentioned', arguments: {} });
		await migration.down(runner);
		const retained = await runner.query('SELECT "id" FROM "webhook"');
		expect(retained).not.toContainEqual({ id: subscribed.id });
		expect(retained).toContainEqual({ id: mention.id }); expect(retained).toContainEqual({ id: 'legacy_fixture' });
		await migration.up(runner); expect((await db.driver.createSchemaBuilder().log()).upQueries).toEqual([]);
		await restarted.onApplicationShutdown(); await repos.usersRepository.delete(user.id); await runner.release();
	});
});
