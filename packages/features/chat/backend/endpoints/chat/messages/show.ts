/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChatMessagesShowDefinition, packedChatMessagesShowInput, packedChatMessagesShowOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';

const contractProjection = projectEndpointContract(packedChatMessagesShowDefinition);

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: contractProjection.response,

	errors: {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: '3710865b-1848-4da9-8d61-cfed15510b93',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatMessagesShowInput, typeof packedChatMessagesShowOutput> {
	constructor(
		private chatService: ChatService,
		private roleService: RoleService,
		private chatEntityService: ChatEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'read');

			const message = await this.chatService.findMessageById(ps.messageId);
			if (message == null) {
				throw new ApiError(meta.errors.noSuchMessage);
			}
			if (message.fromUserId !== me.id && message.toUserId !== me.id && !(await this.roleService.isModerator(me))) {
				throw new ApiError(meta.errors.noSuchMessage);
			}
			return this.chatEntityService.packMessageDetailed(message, me);
		});
	}
}
