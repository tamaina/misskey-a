/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from "@features/api/backend/transport/orpc-error.js";
import { adminPromoCreateContract, adminPromoCreateErrors } from './create.contract.js';
import type { PromoNotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface AdminPromoCreateDependencies {
	promoNotesRepository: PromoNotesRepository;
	getterService: Pick<GetterService, 'getNote'>;
}
export function createAdminPromoCreateProcedure(deps: AdminPromoCreateDependencies) {
	return createApiProcedure<MiLocalUser>()(adminPromoCreateContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const _me = context.principal;

				const note = await deps.getterService.getNote(ps.noteId).catch(e => {
					if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(adminPromoCreateErrors.noSuchNote);
					throw e;
				});

				const exist = await deps.promoNotesRepository.exists({ where: { noteId: note.id } });

				if (exist) {
					throw apiError(adminPromoCreateErrors.alreadyPromoted);
				}

				await deps.promoNotesRepository.insert({
					noteId: note.id,
					expiresAt: new Date(ps.expiresAt),
					userId: note.userId,
				});
		});
}
