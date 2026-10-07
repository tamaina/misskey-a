/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidAdminEmojiImportZipDefinition, voidAdminEmojiImportZipInput, voidAdminEmojiImportZipOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { QueueService } from '@features/runtime/backend/services/QueueService.js';

const contractProjection = projectEndpointContract(voidAdminEmojiImportZipDefinition);

export const meta = {
	secure: true,
	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminEmojiImportZipInput, typeof voidAdminEmojiImportZipOutput> {
	constructor(
		private queueService: QueueService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			this.queueService.createImportCustomEmojisJob(me, ps.fileId);
		});
	}
}
