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
		const service = new McpEventsService(repos.webhooksRepository, repos.accessTokensRepository, repos.appsRepository, repos.usersRepository, repos.notesRepository, http, roles, noteEntity);
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
		const service = new McpEventsService(repos.webhooksRepository, repos.accessTokensRepository, repos.appsRepository, repos.usersRepository, repos.notesRepository, http, roles, noteEntity);
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
});
