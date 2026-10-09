/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../api.definition.js';
import type { RolesDependencies } from '../../api.implementation.js';
import { Brackets } from 'typeorm';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { rolesErrors } from '../../api.errors.js';
export function createRolesUsersProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'queryService' | 'roleAssignmentsRepository' | 'userEntityService'>) {
	return implement(rolesContract.rolesUsers, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'roles/users', requireCredential: false })).use(decodeScalarInput<Actor>({ sinceDate: 'number', untilDate: 'number', limit: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const role = await deps.rolesRepository.findOneBy({
				id: ps.roleId,
				isPublic: true,
				isExplorable: true,
			});
			if (role == null) {
				throw apiError(rolesErrors.rolesUsers.noSuchRole);
			}
			const query = deps.queryService.makePaginationQuery(deps.roleAssignmentsRepository.createQueryBuilder('assign'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('assign.roleId = :roleId', { roleId: role.id })
				.andWhere(new Brackets(qb => {
					qb
						.where('assign.expiresAt IS NULL')
						.orWhere('assign.expiresAt > :now', { now: new Date() });
				}))
				.innerJoinAndSelect('assign.user', 'user');
			const assigns = await query
				.limit(ps.limit)
				.getMany();
			const _users = assigns.map(({ user, userId }) => user ?? userId);
			const _userMap = await deps.userEntityService.packMany(_users, me, { schema: 'UserDetailed' })
				.then(users => new Map(users.map(u => [u.id, u])));
			return await Promise.all(assigns.map(async (assign) => ({
				id: assign.id,
				user: _userMap.get(assign.userId) ?? await deps.userEntityService.pack(assign.user ?? assign.userId, me, { schema: 'UserDetailed' }),
			})));
		});
}
