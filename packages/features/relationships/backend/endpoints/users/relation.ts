/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';
import { toPackedUserRelation } from '../relationships.schema.js';
export function createUsersRelationProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userEntityService'>) {
	return implement(relationshipsContract["users/relation"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/relation', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return (Array.isArray(ps.userId)
				? await deps.userEntityService.getRelations(me.id, ps.userId).then(it => [...it.values()])
				: await deps.userEntityService.getRelation(me.id, ps.userId).then(it => [it])).map(toPackedUserRelation);
		});
}
