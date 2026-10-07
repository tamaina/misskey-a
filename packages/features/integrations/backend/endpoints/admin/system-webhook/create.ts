/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { portableAdminSystemWebhookCreateDefinition, portableAdminSystemWebhookCreateInput, portableAdminSystemWebhookCreateOutput } from '../../../../contract/portable-constant-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';

const contractProjection = projectEndpointContract(portableAdminSystemWebhookCreateDefinition);

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
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof portableAdminSystemWebhookCreateInput, typeof portableAdminSystemWebhookCreateOutput> {
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const result = await this.systemWebhookService.createSystemWebhook(
				{
					isActive: ps.isActive,
					name: ps.name,
					on: ps.on,
					url: ps.url,
					secret: ps.secret,
				},
				me,
			);

			return this.systemWebhookEntityService.pack(result);
		});
	}
}
