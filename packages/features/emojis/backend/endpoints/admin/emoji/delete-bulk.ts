/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminEmojiDeleteBulkDefinition, voidAdminEmojiDeleteBulkInput, voidAdminEmojiDeleteBulkOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { CustomEmojiService } from '../../../services/CustomEmojiService.js';

const contractProjection = projectEndpointContract(voidAdminEmojiDeleteBulkDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'write:admin:emoji',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminEmojiDeleteBulkInput, typeof voidAdminEmojiDeleteBulkOutput> {
	constructor(
		private customEmojiService: CustomEmojiService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.customEmojiService.deleteBulk(ps.ids, me);
		});
	}
}
