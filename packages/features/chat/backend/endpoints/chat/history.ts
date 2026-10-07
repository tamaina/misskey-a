/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChatHistoryDefinition, packedChatHistoryInput, packedChatHistoryOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { ChatService } from '../../services/ChatService.js';
import { ChatEntityService } from '../../serializers/ChatEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedChatHistoryDefinition);

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: contractProjection.response,

	errors: {
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatHistoryInput, typeof packedChatHistoryOutput> {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'read');

			const history = ps.room ? await this.chatService.roomHistory(me.id, ps.limit) : await this.chatService.userHistory(me.id, ps.limit);

			const packedMessages = await this.chatEntityService.packMessagesDetailed(history, me);

			if (ps.room) {
				const roomIds = history.map(m => m.toRoomId!);
				const readStateMap = await this.chatService.getRoomReadStateMap(me.id, roomIds);

				for (const message of packedMessages) {
					message.isRead = readStateMap[message.toRoomId!] ?? false;
				}
			} else {
				const otherIds = history.map(m => m.fromUserId === me.id ? m.toUserId! : m.fromUserId!);
				const readStateMap = await this.chatService.getUserReadStateMap(me.id, otherIds);

				for (const message of packedMessages) {
					const otherId = message.fromUserId === me.id ? message.toUserId! : message.fromUserId!;
					message.isRead = readStateMap[otherId] ?? false;
				}
			}

			return packedMessages;
		});
	}
}
