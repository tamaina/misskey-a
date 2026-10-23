/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNoteDraft } from '@features/notes/backend/note.schema.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { QueryService } from '../../../services/QueryService.js';
import { NoteDraftEntityService } from '../../../serializers/NoteDraftEntityService.js';
import { notesDraftsListContract } from './list.contract.js';
import type { MiNoteDraft, NoteDraftsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesDraftsListDependencies {
	noteDraftsRepository: NoteDraftsRepository;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	noteDraftEntityService: Pick<NoteDraftEntityService, 'packMany'>;
}
export function createNotesDraftsListProcedure(deps: NotesDraftsListDependencies) {
	return createApiProcedure<MiLocalUser>()(notesDraftsListContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					const query = deps.queryService.makePaginationQuery<MiNoteDraft>(deps.noteDraftsRepository.createQueryBuilder('drafts'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
						.andWhere('drafts.userId = :meId', { meId: me.id });

					if (ps.scheduled === true) {
						query.andWhere('drafts.isActuallyScheduled = true');
					} else if (ps.scheduled === false) {
						query.andWhere('drafts.isActuallyScheduled = false');
					}

					const drafts = await query
						.limit(ps.limit)
						.getMany();

					return await deps.noteDraftEntityService.packMany(drafts, me);
			})();
			return result.map(toPackedNoteDraft);
		});
}
