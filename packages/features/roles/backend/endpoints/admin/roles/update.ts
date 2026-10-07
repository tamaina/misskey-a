/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminRolesUpdateDefinition } from '../../../../contract/void-endpoint-definitions.js';
import { LegacyRoleUpdateConsumerEndpoint } from '../../../legacy-role-consumer-endpoint.js';
import { Inject, Injectable } from '@nestjs/common';

import type { RolesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { RoleService } from '../../../services/RoleService.js';

const contractProjection = projectEndpointContract(voidAdminRolesUpdateDefinition);

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:roles',

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: 'cd23ef55-09ad-428a-ac61-95a45e124b32',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends LegacyRoleUpdateConsumerEndpoint<typeof meta> {
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const role = await this.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			await this.roleService.update(role, {
				name: ps.name,
				description: ps.description,
				color: ps.color,
				iconUrl: ps.iconUrl,
				target: ps.target,
				condFormula: ps.condFormula,
				isPublic: ps.isPublic,
				isModerator: ps.isModerator,
				isAdministrator: ps.isAdministrator,
				isExplorable: ps.isExplorable,
				asBadge: ps.asBadge,
				preserveAssignmentOnMoveAccount: ps.preserveAssignmentOnMoveAccount,
				canEditMembersByModerator: ps.canEditMembersByModerator,
				displayOrder: ps.displayOrder,
				policies: ps.policies,
			}, me);
		});
	}
}
