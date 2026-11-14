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
