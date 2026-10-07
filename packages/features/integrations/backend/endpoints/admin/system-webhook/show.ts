/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedAdminSystemWebhookShowDefinition, packedAdminSystemWebhookShowInput, packedAdminSystemWebhookShowOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';

const contractProjection = projectEndpointContract(packedAdminSystemWebhookShowDefinition);

export const meta = {
	tags: ['admin', 'system-webhook'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',

	res: contractProjection.response,

	errors: {
		noSuchSystemWebhook: {
			message: 'No such SystemWebhook.',
			code: 'NO_SUCH_SYSTEM_WEBHOOK',
			id: '38dd1ffe-04b4-6ff5-d8ba-4e6a6ae22c9d',
			kind: 'server',
			httpStatusCode: 404,
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminSystemWebhookShowInput, typeof packedAdminSystemWebhookShowOutput> {
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
		super(meta, contractProjection, async (ps) => {
			const webhooks = await this.systemWebhookService.fetchSystemWebhooks({ ids: [ps.id] });
			if (webhooks.length === 0) {
				throw new ApiError(meta.errors.noSuchSystemWebhook);
			}

			return this.systemWebhookEntityService.pack(webhooks[0]);
		});
	}
}
