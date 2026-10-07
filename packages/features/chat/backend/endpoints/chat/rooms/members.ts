/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChatRoomsMembersDefinition, packedChatRoomsMembersInput, packedChatRoomsMembersOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { ChatService } from '../../../services/ChatService.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(packedChatRoomsMembersDefinition);

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'write:chat',

	res: contractProjection.response,

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '7b9fe84c-eafc-4d21-bf89-485458ed2c18',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatRoomsMembersInput, typeof packedChatRoomsMembersOutput> {
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
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

			if (!(await this.chatService.isRoomMember(room, me.id))) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			const memberships = await this.chatService.getRoomMembershipsWithPagination(room.id, ps.limit, sinceId, untilId);

			return this.chatEntityService.packRoomMemberships(memberships, me, {
				populateUser: true,
				populateRoom: false,
			});
		});
	}
}
