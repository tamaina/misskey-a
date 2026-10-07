/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChatRoomsUpdateDefinition, packedChatRoomsUpdateInput, packedChatRoomsUpdateOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { ChatService } from '../../../services/ChatService.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';

const contractProjection = projectEndpointContract(packedChatRoomsUpdateDefinition);

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'write:chat',

	res: contractProjection.response,

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'fcdb0f92-bda6-47f9-bd05-343e0e020932',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatRoomsUpdateInput, typeof packedChatRoomsUpdateOutput> {
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'write');

			const room = await this.chatService.findMyRoomById(me.id, ps.roomId);
			if (room == null) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			const updated = await this.chatService.updateRoom(room, {
				name: ps.name,
				description: ps.description,
			});

			return this.chatEntityService.packRoom(updated, me);
		});
	}
}
