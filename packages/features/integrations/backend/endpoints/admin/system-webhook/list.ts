/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { portableAdminSystemWebhookListDefinition, portableAdminSystemWebhookListInput, portableAdminSystemWebhookListOutput } from '../../../../contract/portable-constant-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';

const contractProjection = projectEndpointContract(portableAdminSystemWebhookListDefinition);

export const meta = {
	tags: ['admin', 'system-webhook'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof portableAdminSystemWebhookListInput, typeof portableAdminSystemWebhookListOutput> {
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
		super(meta, contractProjection, async (ps) => {
			const webhooks = await this.systemWebhookService.fetchSystemWebhooks({
				isActive: ps.isActive,
				on: ps.on,
			});
			return this.systemWebhookEntityService.packMany(webhooks);
		});
	}
}
