/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
import { getRelationshipUser } from '../relationship-errors.js';
export function createRenoteMuteCreateProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'renoteMutingsRepository' | 'userRenoteMutingService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["renote-mute/create"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const errors = relationshipsErrors['renote-mute/create'];
			if (actor.id === input.userId) throw apiError(errors.muteeIsYourself);
			const mutee = await getRelationshipUser(deps.getterService, input.userId, errors.noSuchUser);
			if (await deps.renoteMutingsRepository.exists({ where: { muterId: actor.id, muteeId: mutee.id } })) throw apiError(errors.alreadyMuting);
			await deps.userRenoteMutingService.mute(actor, mutee);
		});
}
