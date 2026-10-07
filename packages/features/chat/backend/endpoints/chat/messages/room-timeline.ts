/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChatMessagesRoomTimelineDefinition, packedChatMessagesRoomTimelineInput, packedChatMessagesRoomTimelineOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(packedChatMessagesRoomTimelineDefinition);

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: contractProjection.response,

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'c4d9f88c-9270-4632-b032-6ed8cee36f7f',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatMessagesRoomTimelineInput, typeof packedChatMessagesRoomTimelineOutput> {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			await this.chatService.checkChatAvailability(me.id, 'read');

			const room = await this.chatService.findRoomById(ps.roomId);
			if (room == null) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			if (!await this.chatService.hasPermissionToViewRoomTimeline(me.id, room)) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			const messages = await this.chatService.roomTimeline(room.id, ps.limit, sinceId, untilId);

			this.chatService.readRoomChatMessage(me.id, room.id);

			return await this.chatEntityService.packMessagesLiteForRoom(messages);
		});
	}
}
