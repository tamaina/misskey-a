/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { portableAdminUpdateProxyAccountDefinition, portableAdminUpdateProxyAccountInput, portableAdminUpdateProxyAccountOutput } from '../../../contract/portable-constant-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { UserEntityService } from '../../serializers/UserEntityService.js';
import { ModerationLogService } from '../../../../moderation/backend/services/ModerationLogService.js';
import { SystemAccountService } from '../../services/SystemAccountService.js';

const contractProjection = projectEndpointContract(portableAdminUpdateProxyAccountDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export default class extends ContractEndpoint<typeof meta, typeof portableAdminUpdateProxyAccountInput, typeof portableAdminUpdateProxyAccountOutput> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
		private moderationLogService: ModerationLogService,
		private systemAccountService: SystemAccountService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const proxy = await this.systemAccountService.updateCorrespondingUserProfile('proxy', {
				description: ps.description,
			});

			const updated = await this.userEntityService.pack(proxy.id, proxy, {
				schema: 'MeDetailed',
			});

			if (ps.description !== undefined) {
				this.moderationLogService.log(me, 'updateProxyAccountDescription', {
					before: null, //TODO
					after: ps.description,
				});
			}

			return updated;
		});
	}
}
