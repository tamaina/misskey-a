/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChatRoomsCreateDefinition, packedChatRoomsCreateInput, packedChatRoomsCreateOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import ms from '@/runtime-dependencies/ms.js';

import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';

const contractProjection = projectEndpointContract(packedChatRoomsCreateDefinition);

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:chat',

	limit: {
		duration: ms('1day'),
		max: 10,
	},

	res: contractProjection.response,

	errors: {
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatRoomsCreateInput, typeof packedChatRoomsCreateOutput> {
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'write');

			const room = await this.chatService.createRoom(me, {
				name: ps.name,
				description: ps.description ?? '',
			});
			return await this.chatEntityService.packRoom(room);
		});
	}
}
