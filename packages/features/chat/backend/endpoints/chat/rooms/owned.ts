/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChatRoomsOwnedDefinition, packedChatRoomsOwnedInput, packedChatRoomsOwnedOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(packedChatRoomsOwnedDefinition);

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
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatRoomsOwnedInput, typeof packedChatRoomsOwnedOutput> {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			await this.chatService.checkChatAvailability(me.id, 'read');

			const rooms = await this.chatService.getOwnedRoomsWithPagination(me.id, ps.limit, sinceId, untilId);
			return this.chatEntityService.packRooms(rooms, me);
		});
	}
}
