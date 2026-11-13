/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedFlash } from '../../flash.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { flashShowContract, flashShowErrors } from './show.contract.js';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import type { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashShowDependencies {
	flashsRepository: Pick<FlashsRepository, 'findOneBy'>;
	flashEntityService: Pick<FlashEntityService, 'pack'>;
}
export function createFlashShowProcedure(deps: FlashShowDependencies) {
	return createApiProcedure<MiLocalUser>()(flashShowContract)
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const flash = await deps.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw apiError(flashShowErrors.noSuchFlash);
			}
			return toPackedFlash(await deps.flashEntityService.pack(flash, me));
		});
}
