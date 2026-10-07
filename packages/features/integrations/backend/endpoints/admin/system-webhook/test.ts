/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { portableAdminSystemWebhookTestDefinition, portableAdminSystemWebhookTestInput, portableAdminSystemWebhookTestOutput } from '../../../../contract/portable-constant-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import ms from '@/runtime-dependencies/ms.js';
import { WebhookTestService } from '../../../services/WebhookTestService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(portableAdminSystemWebhookTestDefinition);

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:system-webhook',

	limit: {
		duration: ms('15min'),
		max: 60,
	},

	errors: {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: '0c52149c-e913-18f8-5dc7-74870bfe0cf9',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof portableAdminSystemWebhookTestInput, typeof portableAdminSystemWebhookTestOutput> {
	constructor(
		private webhookTestService: WebhookTestService,
	) {
		super(meta, contractProjection, async (ps) => {
			try {
				await this.webhookTestService.testSystemWebhook({
					webhookId: ps.webhookId,
					type: ps.type,
					override: ps.override,
				});
			} catch (e) {
				if (e instanceof WebhookTestService.NoSuchWebhookError) {
					throw new ApiError(meta.errors.noSuchWebhook);
				}
				throw e;
			}
		});
	}
}
