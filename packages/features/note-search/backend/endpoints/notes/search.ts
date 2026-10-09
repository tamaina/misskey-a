/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { notesSearchContract, notesSearchErrors } from './search.contract.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { SearchService } from '../../services/SearchService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesSearchDependencies {
	noteEntityService: NoteEntityService;
	searchService: SearchService;
	roleService: RoleService;
	idService: IdService;
}
export function createNotesSearchProcedure<Actor extends MiLocalUser>(deps: NotesSearchDependencies) {
	return implement(notesSearchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: notesSearchContract['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => {
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
		});
}
