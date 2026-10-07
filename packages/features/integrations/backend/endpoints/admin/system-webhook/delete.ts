/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidAdminSystemWebhookDeleteDefinition, voidAdminSystemWebhookDeleteInput, voidAdminSystemWebhookDeleteOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { SystemWebhookService } from '../../../services/SystemWebhookService.js';

const contractProjection = projectEndpointContract(voidAdminSystemWebhookDeleteDefinition);

export const meta = {
	tags: ['admin', 'system-webhook'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminSystemWebhookDeleteInput, typeof voidAdminSystemWebhookDeleteOutput> {
	constructor(
		private systemWebhookService: SystemWebhookService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.systemWebhookService.deleteSystemWebhook(
				ps.id,
				me,
			);
		});
	}
}
