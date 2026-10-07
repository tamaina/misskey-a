/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminRolesCreateDefinition } from '../../../../contract/packed-endpoint-definitions.js';
import { LegacyRoleCreateConsumerEndpoint } from '../../../legacy-role-consumer-endpoint.js';
import { RoleEntityService } from '../../../serializers/RoleEntityService.js';
import { RoleService } from '../../../services/RoleService.js';

const contractProjection = projectEndpointContract(packedAdminRolesCreateDefinition);

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:roles',

	res: { ...contractProjection.response, optional: false, nullable: false },
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends LegacyRoleCreateConsumerEndpoint<typeof meta> {
	constructor(
		private roleEntityService: RoleEntityService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const created = await this.roleService.create(ps, me);

			return await this.roleEntityService.pack(created, me);
		});
	}
}
