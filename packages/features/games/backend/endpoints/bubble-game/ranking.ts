/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { bubbleGameRankingContract, bubbleGameRankingGetContract } from './ranking.contract.js';
import { MoreThan } from 'typeorm';
import type { BubbleGameRecordsRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface BubbleGameRankingDependencies {
	bubbleGameRecordsRepository: Pick<BubbleGameRecordsRepository, 'find'>;
	userEntityService: Pick<UserEntityService, 'packMany'>;
}
export function createBubbleGameRankingProcedure(deps: BubbleGameRankingDependencies) {
	return implement(bubbleGameRankingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: bubbleGameRankingContract['~orpc'].meta.requestName }))
		.handler(async ({ input: ps }) => {
			const records = await deps.bubbleGameRecordsRepository.find({
				where: {
					gameMode: ps.gameMode,
					seededAt: MoreThan(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)),
				},
				order: {
					score: 'DESC',
				},
				take: 10,
				relations: { user: true },
			});
			const users = await deps.userEntityService.packMany(records.map(r => r.user!), null);
			return records.map(r => ({
				id: r.id,
				score: r.score,
				user: users.find(u => u.id === r.user!.id),
			}));
		});
}
export function createBubbleGameRankingGetProcedure(deps: BubbleGameRankingDependencies) {
	return implement(bubbleGameRankingGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: bubbleGameRankingContract['~orpc'].meta.requestName }))
		.handler(async ({ input: ps }) => {
			const records = await deps.bubbleGameRecordsRepository.find({
				where: {
					gameMode: ps.gameMode,
					seededAt: MoreThan(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)),
				},
				order: {
					score: 'DESC',
				},
				take: 10,
				relations: { user: true },
			});
			const users = await deps.userEntityService.packMany(records.map(r => r.user!), null);
			return records.map(r => ({
				id: r.id,
				score: r.score,
				user: users.find(u => u.id === r.user!.id),
			}));
		});
}
