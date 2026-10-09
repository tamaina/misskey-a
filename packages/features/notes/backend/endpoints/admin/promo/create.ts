/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { adminPromoCreateContract, adminPromoCreatePolicy, adminPromoCreateErrors } from './create.contract.js';
import type { PromoNotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AdminPromoCreateDependencies {
	promoNotesRepository: PromoNotesRepository;
	getterService: Pick<GetterService, 'getNote'>;
}
export function createAdminPromoCreateProcedure(deps: AdminPromoCreateDependencies) {
	return implement(adminPromoCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(adminPromoCreatePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const _me = context.principal;
			return v.parse(requiredSchema(adminPromoCreateContract['~orpc'].outputSchema), await (async () => {
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
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
