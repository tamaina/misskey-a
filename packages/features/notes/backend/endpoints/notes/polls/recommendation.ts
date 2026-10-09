/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Brackets, In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { NoteEntityService } from '../../../serializers/NoteEntityService.js';
import { notesPollsRecommendationContract, notesPollsRecommendationPolicy, notesPollsRecommendationInput, notesPollsRecommendationOutput } from './recommendation.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../../operations.js';
import type { NotesRepository, MutingsRepository, PollsRepository, PollVotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createNotesPollsRecommendationProcedure<Actor extends ApiActor>() {
	return implement(notesPollsRecommendationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesPollsRecommendationPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.notesPollsRecommendation(input, context.principal));
}

@Injectable()
export class NotesPollsRecommendationOperation {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: PollVotesRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private noteEntityService: NoteEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof notesPollsRecommendationInput>, me: MiLocalUser): Promise<v.InferOutput<typeof notesPollsRecommendationOutput>> {
		return v.parse(notesPollsRecommendationOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof notesPollsRecommendationInput>, me: MiLocalUser) {
		const query = this.pollsRepository.createQueryBuilder('poll')
			.where('poll.userHost IS NULL')
			.andWhere('poll.userId != :meId', { meId: me.id })
			.andWhere('poll.noteVisibility = \'public\'')
			.andWhere(new Brackets(qb => {
				qb
					.where('poll.expiresAt IS NULL')
					.orWhere('poll.expiresAt > :now', { now: new Date() });
			}));

		//#region exclude arleady voted polls
		const votedQuery = this.pollVotesRepository.createQueryBuilder('vote')
			.select('vote.noteId')
			.where('vote.userId = :meId', { meId: me.id });

		query
			.andWhere(`poll.noteId NOT IN (${ votedQuery.getQuery() })`);

		query.setParameters(votedQuery.getParameters());
		//#endregion

		//#region mute
		const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('muting.muteeId')
			.where('muting.muterId = :muterId', { muterId: me.id });

		query
			.andWhere(`poll.userId NOT IN (${ mutingQuery.getQuery() })`);

		query.setParameters(mutingQuery.getParameters());
		//#endregion

		//#region exclude channels
		if (ps.excludeChannels) {
			query.andWhere('poll.channelId IS NULL');
		}
		//#endregion

		const polls = await query
			.orderBy('poll.noteId', 'DESC')
			.limit(ps.limit)
			.offset(ps.offset)
			.getMany();

		if (polls.length === 0) return [];

		const notes = await this.notesRepository.find({
			where: {
				id: In(polls.map(poll => poll.noteId)),
			},
			order: {
				id: 'DESC',
			},
		});

		return await this.noteEntityService.packMany(notes, me, {
			detail: true,
		});
	}
}
