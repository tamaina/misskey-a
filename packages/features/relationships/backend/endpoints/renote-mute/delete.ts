/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.dependencies.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
import { getRelationshipUser } from '../relationship-errors.js';
export function createRenoteMuteDeleteProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'renoteMutingsRepository' | 'userRenoteMutingService'>) {
	return implement(relationshipsContract["renote-mute/delete"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'renote-mute/delete', requireCredential: true, kind: 'write:mutes' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const errors = relationshipsErrors['renote-mute/delete'];
			if (actor.id === input.userId) throw apiError(errors.muteeIsYourself);
			const mutee = await getRelationshipUser(deps.getterService, input.userId, errors.noSuchUser);
			const existing = await deps.renoteMutingsRepository.findOneBy({ muterId: actor.id, muteeId: mutee.id });
			if (existing == null) throw apiError(errors.notMuting);
			await deps.userRenoteMutingService.unmute([existing]);
		});
}
