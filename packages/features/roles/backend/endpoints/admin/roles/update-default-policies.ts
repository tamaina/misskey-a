/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminRolesUpdateDefaultPoliciesDefinition, voidAdminRolesUpdateDefaultPoliciesInput, voidAdminRolesUpdateDefaultPoliciesOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { MetaService } from '@features/instance/backend/services/MetaService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';

const contractProjection = projectEndpointContract(voidAdminRolesUpdateDefaultPoliciesDefinition);

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:roles',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminRolesUpdateDefaultPoliciesInput, typeof voidAdminRolesUpdateDefaultPoliciesOutput> {
	constructor(
		private metaService: MetaService,
		private globalEventService: GlobalEventService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const before = await this.metaService.fetch(true);

			await this.metaService.update({
				policies: ps.policies,
			});

			const after = await this.metaService.fetch(true);

			this.globalEventService.publishInternalEvent('policiesUpdated', after.policies);
			this.moderationLogService.log(me, 'updateServerSettings', {
				before: before.policies,
				after: after.policies,
			});
		});
	}
}
