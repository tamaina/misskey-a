/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedChatMessagesUserTimelineDefinition, packedChatMessagesUserTimelineInput, packedChatMessagesUserTimelineOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ChatService } from '../../../services/ChatService.js';
import { ChatEntityService } from '../../../serializers/ChatEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { IdService } from '../../../../../runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(packedChatMessagesUserTimelineDefinition);

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: contractProjection.response,

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '11795c64-40ea-4198-b06e-3c873ed9039d',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChatMessagesUserTimelineInput, typeof packedChatMessagesUserTimelineOutput> {
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
		private getterService: GetterService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			await this.chatService.checkChatAvailability(me.id, 'read');

			const other = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			const messages = await this.chatService.userTimeline(me.id, other.id, ps.limit, sinceId, untilId);

			this.chatService.readUserChatMessage(me.id, other.id);

			return await this.chatEntityService.packMessagesLiteFor1on1(messages);
		});
	}
}
