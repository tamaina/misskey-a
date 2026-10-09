/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { In, IsNull } from 'typeorm';
import { type RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import { type PerUserPvChart } from '@features/statistics/backend/charts/per-user-pv.js';
import { type RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { type ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { type UserEntityService } from '../../serializers/UserEntityService.js';
import { usersShowErrors } from './show.contract.js';
import type { MiUser } from '../../models/User.js';
import type { MiMeta, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UsersInputs } from '../../api.definition.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { FindOptionsWhere } from 'typeorm';
import { usersShowContract } from './show.contract.js';

import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export interface UsersShowDependencies {
	serverSettings: MiMeta;
	usersRepository: UsersRepository;
	userEntityService: UserEntityService;
	remoteUserResolveService: RemoteUserResolveService;
	roleService: RoleService;
	perUserPvChart: PerUserPvChart;
	apiLoggerService: ApiLoggerService;
}
export function createUsersShowProcedure(deps: UsersShowDependencies) {
	async function execute(ps: UsersInputs['users/show'], me: MiLocalUser | null, _token: ApiToken | null, ip: string) {
		// ログイン時にusers/showできなくなってしまう
		//if (deps.serverSettings.ugcVisibilityForVisitor === 'none' && me == null) {
		//	throw apiError(usersShowErrors.noSuchUser);
		//}

		let user: MiUser | null;

		const isModerator = await deps.roleService.isModerator(me);
		if (ps.username !== undefined) {
			ps.username = ps.username.trim();
		}

		if (ps.userIds !== undefined) {
			if (ps.userIds.length === 0) {
				return [];
			}

			const users = await deps.usersRepository.findBy(isModerator ? {
				id: In(ps.userIds),
			} : {
				id: In(ps.userIds),
				isSuspended: false,
				...(deps.serverSettings.ugcVisibilityForVisitor === 'local' && me == null ? { host: IsNull() } : {}),
			});

			// リクエストされた通りに並べ替え
			// 順番は保持されるけど数は減ってる可能性がある
			const _users: MiUser[] = [];
			for (const id of ps.userIds) {
				const user = users.find(x => x.id === id);
				if (user != null) _users.push(user);
			}

			const _userMap = await deps.userEntityService.packMany(_users, me, { schema: 'UserDetailed' })
				.then(users => new Map(users.map(u => [u.id, u])));
			return _users.map(u => {
				const packed = _userMap.get(u.id);
				if (packed === undefined) throw new Error('Missing packed user');
				return packed;
			});
		} else {
			// Lookup user
			if (typeof ps.host === 'string' && ps.username !== undefined) {
				if (deps.serverSettings.ugcVisibilityForVisitor === 'local' && me == null) {
					throw apiError(usersShowErrors.noSuchUser);
				}

				user = await deps.remoteUserResolveService.resolveUser(ps.username, ps.host).catch(err => {
					deps.apiLoggerService.logger.warn(`failed to resolve remote user: ${err}`);
					throw apiError(usersShowErrors.failedToResolveRemoteUser);
				});
			} else {
				const q: FindOptionsWhere<MiUser> = ps.userId !== undefined
					? { id: ps.userId }
					: { usernameLower: ps.username?.toLowerCase(), host: IsNull() };

				user = await deps.usersRepository.findOneBy(q);
			}

			if (user == null || (!isModerator && user.isSuspended)) {
				throw apiError(usersShowErrors.noSuchUser);
			}

			if (deps.serverSettings.ugcVisibilityForVisitor === 'local' && user.host != null && me == null) {
				throw apiError(usersShowErrors.noSuchUser);
			}

			if (user.host == null) {
				if (me == null && ip != null) {
					deps.perUserPvChart.commitByVisitor(user, ip);
				} else if (me && me.id !== user.id) {
					deps.perUserPvChart.commitByUser(user, me.id);
				}
			}

			return await deps.userEntityService.pack(user, me, {
				schema: 'UserDetailed',
			});
		}
	}

	async function packShow(input: UsersInputs['users/show'], context: { principal: MiLocalUser | null; token: ApiToken | null; ip: string }) {
		const value = await execute(input, context.principal, context.token, context.ip);
		return Array.isArray(value) ? value.map(user => toPackedUserDetailed(user)) : toPackedUserDetailed(value);
	}

	return createApiProcedure<MiLocalUser>()(usersShowContract)
		.handler(async ({ input, context }) => await packShow(input, context));
}
