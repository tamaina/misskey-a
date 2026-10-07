/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineDriveDefinition, inlineDriveInput, inlineDriveOutput } from '../../contract/endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { DriveFileEntityService } from '../serializers/DriveFileEntityService.js';
import { RoleService } from '../../../roles/backend/services/RoleService.js';

const contractProjection = projectEndpointContract(inlineDriveDefinition);

export const meta = {
	tags: ['drive', 'account'],

	requireCredential: true,

	kind: 'read:drive',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineDriveInput, typeof inlineDriveOutput> {
	constructor(
		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const usage = await this.driveFileEntityService.calcDriveUsageOf(me.id);

			const policies = await this.roleService.getUserPolicies(me.id);

			return {
				capacity: 1024 * 1024 * policies.driveCapacityMb,
				usage: usage,
			};
		});
	}
}
