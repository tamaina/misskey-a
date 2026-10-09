/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { In, IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import { PerUserPvChart } from '@features/statistics/backend/charts/per-user-pv.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '../../serializers/UserEntityService.js';
import { usersShowErrors } from './show.contract.js';
import type { MiUser } from '../../models/User.js';
import type { MiMeta, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UsersInputs } from '../../api.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { FindOptionsWhere } from 'typeorm';

@Injectable()
export class UsersShowOperation {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private remoteUserResolveService: RemoteUserResolveService,
		private roleService: RoleService,
		private perUserPvChart: PerUserPvChart,
		private apiLoggerService: ApiLoggerService,
	) {
	}

	async execute(ps: UsersInputs['users/show'], me: MiLocalUser | null, _token: ApiToken | null, ip: string) {
		// ログイン時にusers/showできなくなってしまう
		//if (this.serverSettings.ugcVisibilityForVisitor === 'none' && me == null) {
		//	throw apiError(usersShowErrors.noSuchUser);
		//}

		let user: MiUser | null;

		const isModerator = await this.roleService.isModerator(me);
		if (ps.username !== undefined) {
			ps.username = ps.username.trim();
		}

		if (ps.userIds !== undefined) {
			if (ps.userIds.length === 0) {
				return [];
			}

			const users = await this.usersRepository.findBy(isModerator ? {
				id: In(ps.userIds),
			} : {
				id: In(ps.userIds),
				isSuspended: false,
				...(this.serverSettings.ugcVisibilityForVisitor === 'local' && me == null ? { host: IsNull() } : {}),
			});

			// リクエストされた通りに並べ替え
			// 順番は保持されるけど数は減ってる可能性がある
			const _users: MiUser[] = [];
			for (const id of ps.userIds) {
				const user = users.find(x => x.id === id);
				if (user != null) _users.push(user);
			}

			const _userMap = await this.userEntityService.packMany(_users, me, { schema: 'UserDetailed' })
				.then(users => new Map(users.map(u => [u.id, u])));
			return _users.map(u => {
				const packed = _userMap.get(u.id);
				if (packed === undefined) throw new Error('Missing packed user');
				return packed;
			});
		} else {
			// Lookup user
			if (typeof ps.host === 'string' && ps.username !== undefined) {
				if (this.serverSettings.ugcVisibilityForVisitor === 'local' && me == null) {
					throw apiError(usersShowErrors.noSuchUser);
				}

				user = await this.remoteUserResolveService.resolveUser(ps.username, ps.host).catch(err => {
					this.apiLoggerService.logger.warn(`failed to resolve remote user: ${err}`);
					throw apiError(usersShowErrors.failedToResolveRemoteUser);
				});
			} else {
				const q: FindOptionsWhere<MiUser> = ps.userId !== undefined
					? { id: ps.userId }
					: { usernameLower: ps.username?.toLowerCase(), host: IsNull() };

				user = await this.usersRepository.findOneBy(q);
			}

			if (user == null || (!isModerator && user.isSuspended)) {
				throw apiError(usersShowErrors.noSuchUser);
			}

			if (this.serverSettings.ugcVisibilityForVisitor === 'local' && user.host != null && me == null) {
				throw apiError(usersShowErrors.noSuchUser);
			}

			if (user.host == null) {
				if (me == null && ip != null) {
					this.perUserPvChart.commitByVisitor(user, ip);
				} else if (me && me.id !== user.id) {
					this.perUserPvChart.commitByUser(user, me.id);
				}
			}

			return await this.userEntityService.pack(user, me, {
				schema: 'UserDetailed',
			});
		}
	}
}
