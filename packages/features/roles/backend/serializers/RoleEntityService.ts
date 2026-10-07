/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import type { RoleAssignmentsRepository, RolesRepository } from '@features/persistence/backend/repositories/models.js';
import { awaitAll } from '@features/runtime/backend/async/await-all.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiRole } from '../models/Role.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { DEFAULT_POLICIES } from '../services/RoleService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import { Packed } from '@features/index/contract/packed.js';

export class RoleEntityService {
	constructor(
		private rolesRepository: RolesRepository,

		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiRole['id'] | MiRole,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'Role'>> {
		const role = typeof src === 'object' ? src : await this.rolesRepository.findOneByOrFail({ id: src });

		const assignedCount = await this.roleAssignmentsRepository.createQueryBuilder('assign')
			.where('assign.roleId = :roleId', { roleId: role.id })
			.andWhere(new Brackets(qb => {
				qb
					.where('assign.expiresAt IS NULL')
					.orWhere('assign.expiresAt > :now', { now: new Date() });
			}))
			.getCount();

		const policies = { ...role.policies };
		for (const [k, v] of Object.entries(DEFAULT_POLICIES)) {
			if (policies[k] == null) policies[k] = {
				useDefault: true,
				priority: 0,
				value: v,
			};
		}

		return await awaitAll({
			id: role.id,
			createdAt: this.idService.parse(role.id).date.toISOString(),
			updatedAt: role.updatedAt.toISOString(),
			name: role.name,
			description: role.description,
			color: role.color,
			iconUrl: role.iconUrl,
			target: role.target,
			condFormula: role.condFormula,
			isPublic: role.isPublic,
			isAdministrator: role.isAdministrator,
			isModerator: role.isModerator,
			isExplorable: role.isExplorable,
			asBadge: role.asBadge,
			preserveAssignmentOnMoveAccount: role.preserveAssignmentOnMoveAccount,
			canEditMembersByModerator: role.canEditMembersByModerator,
			displayOrder: role.displayOrder,
			policies: policies,
			usersCount: assignedCount,
		});
	}

	@bindThis
	public packMany(
		roles: any[],
		me: { id: MiUser['id'] },
	) {
		return Promise.all(roles.map(x => this.pack(x, me)));
	}
}
