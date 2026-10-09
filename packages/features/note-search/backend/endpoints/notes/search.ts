/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';

import { notesSearchContract, notesSearchErrors } from './search.contract.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { SearchService } from '../../services/SearchService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface NotesSearchDependencies {
	noteEntityService: NoteEntityService;
	searchService: SearchService;
	roleService: RoleService;
	idService: IdService;
}
export function createNotesSearchProcedure<Actor extends MiLocalUser>(deps: NotesSearchDependencies) {
	return createApiProcedure<Actor>()(notesSearchContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : undefined);
				const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : undefined);
				const policies = await deps.roleService.getUserPolicies(me ? me.id : null);
				if (!policies.canSearchNotes) {
					throw apiError(notesSearchErrors.unavailable);
				}
				const notes = await deps.searchService.searchNote(ps.query, me, {
					userId: ps.userId,
					channelId: ps.channelId,
					host: ps.host,
					rangeStartAt: ps.rangeStartAt,
					rangeEndAt: ps.rangeEndAt,
				}, {
					untilId: untilId,
					sinceId: sinceId,
					limit: ps.limit,
				});
				return await deps.noteEntityService.packMany(notes, me);
			})();
			return result.map(toPackedNote);
		});
}
