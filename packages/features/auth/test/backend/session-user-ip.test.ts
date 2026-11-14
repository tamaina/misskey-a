/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { call } from '@orpc/server';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { DataSource, type QueryRunner, type InsertQueryBuilder } from 'typeorm';
import { entities } from '@features/persistence/backend/postgres.js';
import { ApiIpLoggingService } from '@features/api/backend/transport/ApiIpLoggingService.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import type { MiMeta, UserIpsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createAdminGetUserIpsProcedure } from '@features/moderation/backend/endpoints/admin/get-user-ips.js';
import { SessionUserIp1794700800000 } from '../../../../backend/migration/1794700800000-SessionUserIp.js';
import { MiUserIp } from '../../backend/models/UserIp.js';
import { createISessionIpsProcedure, type SessionIpsDependencies } from '../../backend/endpoints/i/sessions.js';
import { testContext } from './native-context.js';

class MetadataSource extends DataSource {
	async prepare() { await this.buildMetadatas(); }
}
afterEach(() => vi.useRealTimers());

test('IP logging keeps session/null buckets separate, refreshes hourly, and only updates lastSeenAt', async () => {
	vi.useFakeTimers();
	const meta = mockDeep<MiMeta>({ enableIpLogging: true });
	const repository = mockDeep<UserIpsRepository>();
	const query = mockDeep<InsertQueryBuilder<MiUserIp>>();
	repository.createQueryBuilder.mockReturnValue({ insert: () => query } as never);
	query.values.mockReturnValue(query); query.onConflict.mockReturnValue(query);
	const service = new ApiIpLoggingService(meta, repository);
	try {
		for (const session of ['one', 'two', null]) {
			await service.log('192.0.2.1', 'alice', session);
			await service.log('192.0.2.1', 'alice', session);
		}
		expect(query.execute).toHaveBeenCalledTimes(3);
		expect(query.values.mock.calls.map(([value]) => value)).toEqual(['one', 'two', null].map(browserSessionId => ({ createdAt: expect.any(Date), lastSeenAt: expect.any(Date), userId: 'alice', ip: '192.0.2.1', browserSessionId })));
		expect(query.onConflict).toHaveBeenCalledWith(`("userId", "ip", (COALESCE("browserSessionId", ''))) DO UPDATE SET "lastSeenAt" = EXCLUDED."lastSeenAt"`);
		await vi.advanceTimersByTimeAsync(3_600_000);
		await service.log('192.0.2.1', 'alice', 'one');
		expect(query.execute).toHaveBeenCalledTimes(4);
		meta.enableIpLogging = false;
		await service.log('192.0.2.2', 'alice', 'one');
		expect(query.execute).toHaveBeenCalledTimes(4);
		meta.enableIpLogging = true;
		query.execute.mockRejectedValueOnce(new Error('synthetic failure'));
		await expect(service.log('192.0.2.3', 'alice')).resolves.toBeUndefined();
	} finally { service.onApplicationShutdown(); }
});

test.each([
	{ session: undefined, token: null },
	{ session: undefined, token: { id: 'api-key', permission: ['read:account'] } },
	{ session: { id: 'session1', userId: 'alice' }, token: null },
])('authentication forwards browser session or null: %j', async ({ session, token }) => {
	const authenticate = mockDeep<ConstructorParameters<typeof ApiExecutionContextFactory>[2]>();
	const logging = mockDeep<ApiIpLoggingService>();
	const factory = new ApiExecutionContextFactory(mockDeep(), mockDeep(), authenticate, mockDeep(), mockDeep(), mockDeep(), mockDeep(), logging);
	const user = mockDeep<MiLocalUser>({ id: 'alice' });
	authenticate.authenticate.mockResolvedValue([user, token, session]);
	const request = mockDeep<Parameters<typeof factory.create>[0]>({ ip: '192.0.2.1', headers: {} });
	await factory.create(request, 'i/sessions').services.authenticate('synthetic');
	expect(logging.log).toHaveBeenCalledWith('192.0.2.1', 'alice', session?.id ?? null);
});

test('session IP endpoint reads only owned user_ip rows with first and last seen, without per-row UA', async () => {
	const deps = mockDeep<SessionIpsDependencies>();
	deps.userIpsRepository.find.mockResolvedValue([mockDeep<MiUserIp>({ id: '12', ip: '192.0.2.1', createdAt: new Date(0), lastSeenAt: new Date(1000) })]);
	const context = testContext(mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false }), null);
	const rows = await call(createISessionIpsProcedure(deps), { sessionId: 'session1', offset: 2, limit: 5 }, { context });
	expect(deps.userIpsRepository.find).toHaveBeenCalledWith({ where: { userId: 'alice', browserSessionId: 'session1' }, order: { id: 'DESC' }, take: 5, skip: 2 });
	expect(rows).toEqual([{ id: '12', ip: '192.0.2.1', createdAt: new Date(0).toISOString(), lastSeenAt: new Date(1000).toISOString() }]);
});

test('admin IP output includes stable row identity and both observation times', async () => {
	const repository = mockDeep<UserIpsRepository>();
	repository.find.mockResolvedValue([mockDeep<MiUserIp>({ id: '12', ip: '192.0.2.1', createdAt: new Date(0), lastSeenAt: new Date(1000) })]);
	const context = testContext(mockDeep<MiLocalUser>({ id: 'admin', isAdmin: true, isSuspended: false }), null);
	const result = await call(createAdminGetUserIpsProcedure({ userIpsRepository: repository }), { userId: 'alice' }, { context });
	expect(result).toEqual([{ id: '12', ip: '192.0.2.1', createdAt: new Date(0).toISOString(), lastSeenAt: new Date(1000).toISOString() }]);
});

test('migration and entity use the same nullable unique conflict target, keep SET NULL safe, and reverse', async () => {
	const source = new MetadataSource({ type: 'postgres', entities });
	await source.prepare();
	const metadata = source.getMetadata(MiUserIp);
	expect(metadata.findColumnWithPropertyName('lastSeenAt')?.isNullable).toBe(false);
	expect(metadata.foreignKeys.find(key => key.name === 'FK_user_ip_browserSessionId')).toMatchObject({ onDelete: 'SET NULL', referencedTablePath: 'browser_session' });
	expect(metadata.indices.find(index => index.name === 'IDX_user_ip_session_unique')?.synchronize).toBe(false);
	const runner = mockDeep<QueryRunner>();
	const migration = new SessionUserIp1794700800000();
	await migration.up(runner);
	const sql = runner.query.mock.calls.map(([query]) => query).join('\n');
	expect(sql).toContain(`CREATE UNIQUE INDEX "IDX_user_ip_session_unique" ON "user_ip" ("userId", "ip", (COALESCE("browserSessionId", '')))`);
	expect(sql).toContain(`ON CONFLICT ("userId", "ip", (COALESCE("browserSessionId", ''))) DO UPDATE`);
	expect(sql.indexOf('INSERT INTO "user_ip"')).toBeLessThan(sql.indexOf('DROP COLUMN "lastIp"'));
	expect(sql).toContain('BEFORE DELETE ON "browser_session"');
	expect(sql).toContain('LEAST(');
	expect(sql).toContain('GREATEST(');
	runner.query.mockClear();
	await migration.down(runner);
	const down = runner.query.mock.calls.map(([query]) => query).join('\n');
	expect(down).toContain('ORDER BY "lastSeenAt" DESC');
	expect(down).toContain('row_number() OVER (PARTITION BY "userId", "ip"');
	expect(down).toContain('CREATE UNIQUE INDEX "IDX_361b500e06721013c124b7b6c5"');
	expect(down).not.toContain('"signin"');
	expect(down).not.toContain('"lastUserAgent"');
});

test('scoped tokens cannot read browser session IP history', async () => {
	const deps = mockDeep<SessionIpsDependencies>();
	const context = testContext(mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false }), { id: 'app', permission: ['read:account'] });
	await expect(call(createISessionIpsProcedure(deps), { sessionId: 'session1' }, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	expect(deps.userIpsRepository.find).not.toHaveBeenCalled();
});
