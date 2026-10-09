/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';

import type { BubbleGameRecordsRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type bubbleGameRankingContract } from '../../endpoints/bubble-game/ranking.contract.js';

@Injectable()
export class BubbleGameRankingApplicationService {
	constructor(
		@Inject(DI.bubbleGameRecordsRepository)
		private bubbleGameRecordsRepository: BubbleGameRecordsRepository,

		private userEntityService: UserEntityService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof bubbleGameRankingContract)['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const records = await this.bubbleGameRecordsRepository.find({
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

		const users = await this.userEntityService.packMany(records.map(r => r.user!), null);

		return records.map(r => ({
			id: r.id,
			score: r.score,
			user: users.find(u => u.id === r.user!.id),
		}));
	}
}
