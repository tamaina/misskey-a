/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminEmojiDeleteDefinition, voidAdminEmojiDeleteInput, voidAdminEmojiDeleteOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { CustomEmojiService } from '../../../services/CustomEmojiService.js';

const contractProjection = projectEndpointContract(voidAdminEmojiDeleteDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'write:admin:emoji',

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: 'be83669b-773a-44b7-b1f8-e5e5170ac3c2',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminEmojiDeleteInput, typeof voidAdminEmojiDeleteOutput> {
	constructor(
		private customEmojiService: CustomEmojiService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.customEmojiService.delete(ps.id, me);
		});
	}
}
