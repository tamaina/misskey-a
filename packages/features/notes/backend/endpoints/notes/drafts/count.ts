/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { notesDraftsCountContract } from './count.contract.js';
import type { NoteDraftsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesDraftsCountDependencies {
	noteDraftsRepository: NoteDraftsRepository;
}
export function createNotesDraftsCountProcedure(deps: NotesDraftsCountDependencies) {
	return createApiProcedure<MiLocalUser>()(notesDraftsCountContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const _ps = input;
			const me = context.principal;

				const count = await deps.noteDraftsRepository.createQueryBuilder('drafts')
					.where('drafts.userId = :meId', { meId: me.id })
					.getCount();

				return count;
		});
}
