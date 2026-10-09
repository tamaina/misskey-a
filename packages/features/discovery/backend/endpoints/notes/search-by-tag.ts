/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { safeForSql } from '@features/persistence/backend/utility/safe-for-sql.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { normalizeForSearch } from '../../utility/normalize-for-search.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
export interface NotesSearchByTagDependencies {
	notesRepository: NotesRepository;
	noteEntityService: NoteEntityService;
	queryService: QueryService;
}
export function createNotesSearchByTagProcedure<Actor extends MiLocalUser>(deps: NotesSearchByTagDependencies) {
	const handler = async ({ input: ps, context: { principal: me } }: { input: DiscoveryInputs['notes/search-by-tag']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		deps.queryService.generateVisibilityQuery(query, me);
		if (me == null) deps.queryService.generateUgcVisibilityQueryForVisitor(query);
		deps.queryService.generateBaseNoteFilteringQuery(query, me);

		try {
			if ('tag' in ps) {
				if (!safeForSql(normalizeForSearch(ps.tag))) throw new Error('Injection');
				query.andWhere(':tag <@ note.tags', { tag: [normalizeForSearch(ps.tag)] });
			} else {
				query.andWhere(new Brackets(qb => {
					for (const tags of ps.query) {
						qb.orWhere(new Brackets(qb => {
							for (const tag of tags) {
								if (!safeForSql(normalizeForSearch(tag))) throw new Error('Injection');
								qb.andWhere(':tag <@ note.tags', { tag: [normalizeForSearch(tag)] });
							}
						}));
					}
				}));
			}
		} catch (e) {
			if (e === 'Injection') return [];
			throw e;
		}

		if (ps.reply != null) {
			if (ps.reply) {
				query.andWhere('note.replyId IS NOT NULL');
			} else {
				query.andWhere('note.replyId IS NULL');
			}
		}

		if (ps.renote != null) {
			if (ps.renote) {
				query.andWhere('note.renoteId IS NOT NULL');
			} else {
				query.andWhere('note.renoteId IS NULL');
			}
		}

		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}

		if (ps.poll != null) {
			if (ps.poll) {
				query.andWhere('note.hasPoll = TRUE');
			} else {
				query.andWhere('note.hasPoll = FALSE');
			}
		}

		// Search notes
		const notes = await query.limit(ps.limit).getMany();

		return await deps.noteEntityService.packMany(notes, me);
	};
	return implement(discoveryContract['notes/search-by-tag'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: discoveryContract['notes/search-by-tag']['~orpc'].meta.requestName })).handler(handler);
}
