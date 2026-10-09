/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
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
	return implement(flashCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: flashCreateContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:flash', prohibitMoved: true, limit: { duration: 3_600_000, max: 10 } }))
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
			return await deps.flashEntityService.pack(flash);
		});
}
