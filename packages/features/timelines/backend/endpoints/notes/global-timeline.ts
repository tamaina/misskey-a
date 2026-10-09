/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';

import { notesGlobalTimelineContract, notesGlobalTimelineErrors } from './global-timeline.contract.js';
import { Brackets } from 'typeorm';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';

export interface NotesGlobalTimelineDependencies {
	notesRepository: NotesRepository;
	noteEntityService: NoteEntityService;
	queryService: QueryService;
	roleService: RoleService;
	activeUsersChart: ActiveUsersChart;
}
export function createNotesGlobalTimelineProcedure<Actor extends MiLocalUser>(deps: NotesGlobalTimelineDependencies) {
	return createApiProcedure<Actor>()(notesGlobalTimelineContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const policies = await deps.roleService.getUserPolicies(me ? me.id : null);
				if (!policies.gtlAvailable) {
					throw apiError(notesGlobalTimelineErrors.gtlDisabled);
				}
				//#region Construct query
				const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'),
					ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('note.visibility = \'public\'')
					.andWhere('note.channelId IS NULL')
					.innerJoinAndSelect('note.user', 'user')
					.leftJoinAndSelect('note.reply', 'reply')
					.leftJoinAndSelect('note.renote', 'renote')
					.leftJoinAndSelect('reply.user', 'replyUser')
					.leftJoinAndSelect('renote.user', 'renoteUser');
				deps.queryService.generateBaseNoteFilteringQuery(query, me);
				if (me == null) deps.queryService.generateUgcVisibilityQueryForVisitor(query);
				if (me) deps.queryService.generateMutedUserRenotesQueryForNotes(query, me);
				if (ps.withFiles) {
					query.andWhere('note.fileIds != \'{}\'');
				}
				if (ps.withRenotes === false) {
					query.andWhere(new Brackets(qb => {
						qb.where('note.renoteId IS NULL');
						qb.orWhere(new Brackets(qb => {
							qb.where('note.text IS NOT NULL');
							qb.orWhere('note.fileIds != \'{}\'');
							qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
						}));
					}));
				}
				//#endregion
				const timeline = await query.limit(ps.limit).getMany();
				process.nextTick(() => {
					if (me) {
						deps.activeUsersChart.read(me);
					}
				});
				return await deps.noteEntityService.packMany(timeline, me);
			})();
			return result.map(toPackedNote);
		});
}
