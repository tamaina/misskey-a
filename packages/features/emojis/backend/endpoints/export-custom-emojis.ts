/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidExportCustomEmojisDefinition, voidExportCustomEmojisInput, voidExportCustomEmojisOutput } from '../../contract/void-endpoint-definitions.js';
import ms from '@/runtime-dependencies/ms.js';
import { Injectable } from '@nestjs/common';

import { QueueService } from '@features/runtime/backend/services/QueueService.js';

const contractProjection = projectEndpointContract(voidExportCustomEmojisDefinition);

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1hour'),
		max: 1,
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidExportCustomEmojisInput, typeof voidExportCustomEmojisOutput> {
	constructor(
		private queueService: QueueService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			this.queueService.createExportCustomEmojisJob(me);
		});
	}
}
