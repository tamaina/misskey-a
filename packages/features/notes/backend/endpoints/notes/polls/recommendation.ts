/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { Brackets, In } from 'typeorm';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { NoteEntityService } from '../../../serializers/NoteEntityService.js';
import { notesPollsRecommendationContract, notesPollsRecommendationPolicy } from './recommendation.contract.js';
import type { NotesRepository, MutingsRepository, PollsRepository, PollVotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesPollsRecommendationDependencies {
	notesRepository: NotesRepository;
	pollsRepository: PollsRepository;
	pollVotesRepository: PollVotesRepository;
	mutingsRepository: MutingsRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
}
export function createNotesPollsRecommendationProcedure(deps: NotesPollsRecommendationDependencies) {
	return implement(notesPollsRecommendationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesPollsRecommendationPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesPollsRecommendationContract['~orpc'].outputSchema), await (async () => {
				const query = deps.pollsRepository.createQueryBuilder('poll')
					.where('poll.userHost IS NULL')
					.andWhere('poll.userId != :meId', { meId: me.id })
					.andWhere('poll.noteVisibility = \'public\'')
					.andWhere(new Brackets(qb => {
						qb
							.where('poll.expiresAt IS NULL')
							.orWhere('poll.expiresAt > :now', { now: new Date() });
					}));

				//#region exclude arleady voted polls
				const votedQuery = deps.pollVotesRepository.createQueryBuilder('vote')
					.select('vote.noteId')
					.where('vote.userId = :meId', { meId: me.id });

				query
					.andWhere(`poll.noteId NOT IN (${votedQuery.getQuery()})`);
				query.setParameters(votedQuery.getParameters());
				//#endregion

				//#region mute
				const mutingQuery = deps.mutingsRepository.createQueryBuilder('muting')
					.select('muting.muteeId')
					.where('muting.muterId = :muterId', { muterId: me.id });

				query
					.andWhere(`poll.userId NOT IN (${mutingQuery.getQuery()})`);
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

				const notes = await deps.notesRepository.find({
					where: {
						id: In(polls.map(poll => poll.noteId)),
					},
					order: {
						id: 'DESC',
					},
				});

				return await deps.noteEntityService.packMany(notes, me, {
					detail: true,
				});
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
