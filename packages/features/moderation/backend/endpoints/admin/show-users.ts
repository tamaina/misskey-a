/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminShowUsersDefinition, packedAdminShowUsersInput, packedAdminShowUsersOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';

const contractProjection = projectEndpointContract(packedAdminShowUsersDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:show-user',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export default class extends ContractEndpoint<typeof meta, typeof packedAdminShowUsersInput, typeof packedAdminShowUsersOutput> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.usersRepository.createQueryBuilder('user');

			switch (ps.state) {
				case 'available': query.where('user.isSuspended = FALSE'); break;
				case 'alive': query.where('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }); break;
				case 'suspended': query.where('user.isSuspended = TRUE'); break;
				case 'admin': {
					const adminIds = await this.roleService.getAdministratorIds();
					if (adminIds.length === 0) return [];
					query.where('user.id IN (:...adminIds)', { adminIds: adminIds });
					break;
				}
				case 'moderator': {
					const moderatorIds = await this.roleService.getModeratorIds({ includeAdmins: false });
					if (moderatorIds.length === 0) return [];
					query.where('user.id IN (:...moderatorIds)', { moderatorIds: moderatorIds });
					break;
				}
				case 'adminOrModerator': {
					const adminOrModeratorIds = await this.roleService.getModeratorIds({ includeAdmins: true });
					if (adminOrModeratorIds.length === 0) return [];
					query.where('user.id IN (:...adminOrModeratorIds)', { adminOrModeratorIds: adminOrModeratorIds });
					break;
				}
			}

			switch (ps.origin) {
				case 'local': query.andWhere('user.host IS NULL'); break;
				case 'remote': query.andWhere('user.host IS NOT NULL'); break;
			}

			if (ps.username) {
				query.andWhere('user.usernameLower like :username', { username: sqlLikeEscape(ps.username.toLowerCase()) + '%' });
			}

			if (ps.hostname) {
				query.andWhere('user.host = :hostname', { hostname: ps.hostname.toLowerCase() });
			}

			switch (ps.sort) {
				case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
				case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
				case '+createdAt': query.orderBy('user.id', 'DESC'); break;
				case '-createdAt': query.orderBy('user.id', 'ASC'); break;
				case '+updatedAt': query.orderBy('user.updatedAt', 'DESC', 'NULLS LAST'); break;
				case '-updatedAt': query.orderBy('user.updatedAt', 'ASC', 'NULLS FIRST'); break;
				case '+lastActiveDate': query.orderBy('user.lastActiveDate', 'DESC', 'NULLS LAST'); break;
				case '-lastActiveDate': query.orderBy('user.lastActiveDate', 'ASC', 'NULLS FIRST'); break;
				default: query.orderBy('user.id', 'ASC'); break;
			}

			query.limit(ps.limit);
			query.offset(ps.offset);

			const users = await query.getMany();

			return await this.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
		});
	}
}
