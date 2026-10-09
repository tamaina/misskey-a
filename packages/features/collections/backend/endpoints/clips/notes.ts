/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../api.definition.js';
import type { CollectionsDependencies } from '../../api.implementation.js';
import { Brackets } from 'typeorm';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';
import { collectionsErrors } from '../../api.errors.js';
export interface ClipsNotesDependencies<Actor extends ApiActor> {
	clipsRepository: Pick<CollectionsDependencies<Actor>['clipsRepository'], 'findOneBy'>;
	queryService: Pick<CollectionsDependencies<Actor>['queryService'], 'generateBlockedHostQueryForNote' | 'generateBlockedUserQueryForNotes' | 'generateMutedUserQueryForNotes' | 'generateSuspendedUserQueryForNote' | 'generateVisibilityQuery' | 'makePaginationQuery'>;
	notesRepository: Pick<CollectionsDependencies<Actor>['notesRepository'], 'createQueryBuilder'>;
	clipNotesRepository: Pick<CollectionsDependencies<Actor>['clipNotesRepository'], 'metadata'>;
	noteEntityService: Pick<CollectionsDependencies<Actor>['noteEntityService'], 'packMany'>;
}
export function createClipsNotesProcedure<Actor extends ApiActor>(deps: ClipsNotesDependencies<Actor>) {
	return implement(collectionsContract.clipsNotes, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.clipsNotes['~orpc'].meta.requestName, kind: 'read:account' })).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const clip = await deps.clipsRepository.findOneBy({
				id: ps.clipId,
			});
			if (clip == null) {
				throw apiError(collectionsErrors.clipsNotes.noSuchClip);
			}
			if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
				throw apiError(collectionsErrors.clipsNotes.noSuchClip);
			}
			const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.innerJoin(deps.clipNotesRepository.metadata.targetName, 'clipNote', 'clipNote.noteId = note.id')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.andWhere('clipNote.clipId = :clipId', { clipId: clip.id });
			deps.queryService.generateVisibilityQuery(query, me);
			deps.queryService.generateBlockedHostQueryForNote(query);
			// deps.queryService.generateSuspendedUserQueryForNote(query); // To avoid problems with removing notes, ignoring suspended user for now
			if (me) {
				deps.queryService.generateMutedUserQueryForNotes(query, me);
				deps.queryService.generateBlockedUserQueryForNotes(query, me);
				deps.queryService.generateMutedUserQueryForNotes(query, me, { noteColumn: 'renote' });
				deps.queryService.generateBlockedUserQueryForNotes(query, me, { noteColumn: 'renote' });
			}
			if (ps.search != null) {
				for (const word of ps.search.trim().split(' ')) {
					query.andWhere(new Brackets(qb => {
						qb.orWhere('note.text ILIKE :search', { search: `%${sqlLikeEscape(word)}%` });
						qb.orWhere('note.cw ILIKE :search', { search: `%${sqlLikeEscape(word)}%` });
					}));
				}
			}
			const notes = await query
				.limit(ps.limit)
				.getMany();
			return await deps.noteEntityService.packMany(notes, me);
		});
}
