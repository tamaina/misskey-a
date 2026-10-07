/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChatMessagesSearchDefinition, packedChatMessagesSearchInput, packedChatMessagesSearchOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedChatMessagesSearchDefinition);

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: contractProjection.response,

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '460b3669-81b0-4dc9-a997-44442141bf83',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatMessagesSearchInput, typeof packedChatMessagesSearchOutput> {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'read');

			if (ps.roomId != null) {
				const room = await this.chatService.findRoomById(ps.roomId);
				if (room == null) {
					throw new ApiError(meta.errors.noSuchRoom);
				}

				if (!(await this.chatService.isRoomMember(room, me.id))) {
					throw new ApiError(meta.errors.noSuchRoom);
				}
			}

			const messages = await this.chatService.searchMessages(me.id, ps.query, ps.limit, {
				userId: ps.userId,
				roomId: ps.roomId,
			});

			return await this.chatEntityService.packMessagesDetailed(messages, me);
		});
	}
}
