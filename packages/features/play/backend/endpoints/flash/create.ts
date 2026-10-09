/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedFlash } from '../../flash.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';

import { flashCreateContract } from './create.contract.js';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { FlashEntityService } from '../../serializers/FlashEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface FlashCreateDependencies {
	flashsRepository: FlashsRepository;
	flashEntityService: Pick<FlashEntityService, 'pack'>;
	idService: Pick<IdService, 'gen'>;
}
export function createFlashCreateProcedure(deps: FlashCreateDependencies) {
	return createApiProcedure<MiLocalUser>()(flashCreateContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const flash = await deps.flashsRepository.insertOne({
				id: deps.idService.gen(),
				userId: me.id,
				updatedAt: new Date(),
				title: ps.title,
				summary: ps.summary,
				script: ps.script,
				permissions: ps.permissions,
				visibility: ps.visibility,
			});
			return toPackedFlash(await deps.flashEntityService.pack(flash));
		});
}
