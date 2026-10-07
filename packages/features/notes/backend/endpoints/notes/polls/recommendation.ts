/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedNotesPollsRecommendationDefinition, packedNotesPollsRecommendationInput, packedNotesPollsRecommendationOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Brackets, In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, MutingsRepository, PollsRepository, PollVotesRepository } from '@features/persistence/backend/repositories/models.js';

import { NoteEntityService } from '../../../serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedNotesPollsRecommendationDefinition);

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedNotesPollsRecommendationInput, typeof packedNotesPollsRecommendationOutput> {
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
	) {
		super(meta, contractProjection, async (ps, me) => {
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
		});
	}
}
