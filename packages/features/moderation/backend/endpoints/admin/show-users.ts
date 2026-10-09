/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import { moderationContract } from '../../api.contract.js';
import type { ModerationApiDependencies } from '../../api.dependencies.js';
import { sqlLikeEscape } from '../../../../persistence/backend/utility/sql-like-escape.js';
export function createAdminShowUsersProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'usersRepository' | 'roleService' | 'userEntityService'>) {
	return implement(moderationContract.adminShowUsers, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/show-users', requireCredential: true, requireModerator: true, kind: 'read:admin:show-user' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'number', offset: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.usersRepository.createQueryBuilder('user');
			switch (ps.state) {
				case 'available':
					query.where('user.isSuspended = FALSE');
					break;
				case 'alive':
					query.where('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) });
					break;
				case 'suspended':
					query.where('user.isSuspended = TRUE');
					break;
				case 'admin': {
					const adminIds = await deps.roleService.getAdministratorIds();
					if (adminIds.length === 0) return [];
					query.where('user.id IN (:...adminIds)', { adminIds: adminIds });
					break;
				}
				case 'moderator': {
					const moderatorIds = await deps.roleService.getModeratorIds({ includeAdmins: false });
					if (moderatorIds.length === 0) return [];
					query.where('user.id IN (:...moderatorIds)', { moderatorIds: moderatorIds });
					break;
				}
				case 'adminOrModerator': {
					const adminOrModeratorIds = await deps.roleService.getModeratorIds({ includeAdmins: true });
					if (adminOrModeratorIds.length === 0) return [];
					query.where('user.id IN (:...adminOrModeratorIds)', { adminOrModeratorIds: adminOrModeratorIds });
					break;
				}
			}
			switch (ps.origin) {
				case 'local':
					query.andWhere('user.host IS NULL');
					break;
				case 'remote':
					query.andWhere('user.host IS NOT NULL');
					break;
			}
			if (ps.username) {
				query.andWhere('user.usernameLower like :username', { username: sqlLikeEscape(ps.username.toLowerCase()) + '%' });
			}
			if (ps.hostname) {
				query.andWhere('user.host = :hostname', { hostname: ps.hostname.toLowerCase() });
			}
			switch (ps.sort) {
				case '+follower':
					query.orderBy('user.followersCount', 'DESC');
					break;
				case '-follower':
					query.orderBy('user.followersCount', 'ASC');
					break;
				case '+createdAt':
					query.orderBy('user.id', 'DESC');
					break;
				case '-createdAt':
					query.orderBy('user.id', 'ASC');
					break;
				case '+updatedAt':
					query.orderBy('user.updatedAt', 'DESC', 'NULLS LAST');
					break;
				case '-updatedAt':
					query.orderBy('user.updatedAt', 'ASC', 'NULLS FIRST');
					break;
				case '+lastActiveDate':
					query.orderBy('user.lastActiveDate', 'DESC', 'NULLS LAST');
					break;
				case '-lastActiveDate':
					query.orderBy('user.lastActiveDate', 'ASC', 'NULLS FIRST');
					break;
				default:
					query.orderBy('user.id', 'ASC');
					break;
			}
			query.limit(ps.limit);
			query.offset(ps.offset);
			const users = await query.getMany();
			return await deps.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
		});
}
