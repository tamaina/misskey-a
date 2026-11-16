/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SelectQueryBuilder } from 'typeorm';
import type { MiSignin } from '../../backend/models/Signin.js';
import { call } from '@orpc/server';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createISigninHistoryProcedure } from '../../backend/endpoints/i/signin-history.js';
import type { ISigninHistoryDependencies } from '../../backend/endpoints/i/signin-history.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import { testContext } from './native-context.js';

test.each([
	[{ browserSessionId: 'sessiona' }, 'signin.browserSessionId = :sessionId', { sessionId: 'sessiona' }],
	[{ unlinkedOnly: true }, 'signin.browserSessionId IS NULL', undefined],
] as const)('history filter %j remains scoped to the account', async (input, clause, params) => {
	const deps = mockDeep<ISigninHistoryDependencies>();
	const query = mockDeep<SelectQueryBuilder<MiSignin>>();
	deps.signinsRepository.createQueryBuilder.mockReturnValue(query);
	deps.queryService.makePaginationQuery.mockReturnValue(query);
	query.andWhere.mockReturnValue(query); query.limit.mockReturnValue(query);
	query.getMany.mockResolvedValue([]);
	const context = testContext(mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false }), null);
	expect(await call(createISigninHistoryProcedure(deps), input, { context })).toEqual([]);
	expect(query.andWhere).toHaveBeenCalledWith('signin.userId = :meId', { meId: 'alice' });
	if (params) expect(query.andWhere).toHaveBeenCalledWith(clause, params);
	else expect(query.andWhere).toHaveBeenCalledWith(clause);
});

// The global correlated check must remain independent of the page cursor: older pages
// must not promote a second signin for a session whose latest signin is on page one.
test.each([undefined, 'signin8'])('collapsed history uses global latest signins before limit (untilId=%s)', async untilId => {
	const deps = mockDeep<ISigninHistoryDependencies>();
	const query = mockDeep<SelectQueryBuilder<MiSignin>>();
	deps.signinsRepository.createQueryBuilder.mockReturnValue(query);
	deps.queryService.makePaginationQuery.mockReturnValue(query);
	query.andWhere.mockReturnValue(query); query.limit.mockReturnValue(query);
	const records = [
		{ id: 'signin7', browserSessionId: 'sessiona', headers: {}, ip: '192.0.2.1', success: true },
		{ id: 'signin6', browserSessionId: null, headers: { 'user-agent': 'Legacy UA' }, ip: '192.0.2.2', success: false },
		{ id: 'signin5', browserSessionId: null, headers: {}, ip: '192.0.2.3', success: true },
	] as MiSignin[];
	query.getMany.mockResolvedValue(records);
	deps.signinEntityService.pack.mockImplementation(async record => ({ ...record, createdAt: '2026-10-01T00:00:00.000Z', browserSession: null }));
	const date = new Date('2026-10-02T00:00:00.000Z');
	deps.browserSessionService.listOwned.mockResolvedValue([{
		id: 'sessiona', userId: 'alice', createdAt: date, lastUsedAt: date, revokedAt: null, sudoUntil: null,
		lastIp: '192.0.2.4', lastUserAgent: 'Session UA',
	}]);
	const user = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false });
	const context = testContext(user);
	context.services.authenticate = async () => [user, null, { id: 'sessiona', userId: 'alice' }];
	const output = await call(createISigninHistoryProcedure(deps), { latestPerSession: true, limit: 3, ...(untilId ? { untilId } : {}) }, { context });
	expect(deps.queryService.makePaginationQuery).toHaveBeenCalledWith(query, undefined, untilId, undefined, undefined);
	const clause = query.andWhere.mock.calls.map(([sql]) => sql).find(sql => typeof sql === 'string' && sql.includes('NOT EXISTS'));
	expect(clause).toContain('newer."userId" = signin."userId"');
	expect(clause).toContain('newer."browserSessionId" = signin."browserSessionId"');
	expect(clause).toContain('newer.id > signin.id');
	expect(clause).not.toContain('untilId');
	expect(query.limit).toHaveBeenCalledWith(3);
	expect(query.andWhere.mock.invocationCallOrder.at(-1)).toBeLessThan(query.limit.mock.invocationCallOrder[0]);
	expect(deps.browserSessionService.listOwned).toHaveBeenCalledWith('alice', 1, 0, ['sessiona']);
	expect(output.map(row => row.id)).toEqual(['signin7', 'signin6', 'signin5']);
	expect(output[0]).toMatchObject({ browserSessionId: 'sessiona', browserSession: { id: 'sessiona', lastIp: '192.0.2.4', current: true } });
	expect(output[0].browserSession).not.toHaveProperty('sudoUntil');
	expect(output[0].browserSession).not.toHaveProperty('userId');
	expect(output.slice(1).map(row => row.browserSession)).toEqual([null, null]);
});
