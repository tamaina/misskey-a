/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineAdminAnnouncementsCreateDefinition, inlineAdminAnnouncementsCreateInput, inlineAdminAnnouncementsCreateOutput } from '../../../../contract/endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { AnnouncementService } from '../../../services/AnnouncementService.js';

const contractProjection = projectEndpointContract(inlineAdminAnnouncementsCreateDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:announcements',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminAnnouncementsCreateInput, typeof inlineAdminAnnouncementsCreateOutput> {
	constructor(
		private announcementService: AnnouncementService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const { packed } = await this.announcementService.create({
				updatedAt: null,
				title: ps.title,
				text: ps.text,
				/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 空の文字列の場合、nullを渡すようにするため */
				imageUrl: ps.imageUrl || null,
				icon: ps.icon,
				display: ps.display,
				forExistingUsers: ps.forExistingUsers,
				silence: ps.silence,
				needConfirmationToRead: ps.needConfirmationToRead,
				userId: ps.userId,
			}, me);

			return packed;
		});
	}
}
