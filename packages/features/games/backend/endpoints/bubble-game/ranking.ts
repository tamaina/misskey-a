/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedUserLite } from '@features/users/backend/user.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

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
	return createApiProcedure<MiLocalUser>()(bubbleGameRankingContract)
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
			const users = (await deps.userEntityService.packMany(records.map(r => r.user!), null)).map(toPackedUserLite);
			return records.map(r => ({
				id: r.id,
				score: r.score,
				user: users.find(u => u.id === r.user!.id),
			}));
		});
}
export function createBubbleGameRankingGetProcedure(deps: BubbleGameRankingDependencies) {
	return createApiProcedure<MiLocalUser>()(bubbleGameRankingGetContract)
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
			const users = (await deps.userEntityService.packMany(records.map(r => r.user!), null)).map(toPackedUserLite);
			return records.map(r => ({
				id: r.id,
				score: r.score,
				user: users.find(u => u.id === r.user!.id),
			}));
		});
}
