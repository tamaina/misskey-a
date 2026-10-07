/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAnnouncementsShowDefinition, packedAnnouncementsShowInput, packedAnnouncementsShowOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';

import { AnnouncementService } from '../../services/AnnouncementService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedAnnouncementsShowDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: 'b57b5e1d-4f49-404a-9edb-46b00268f121',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAnnouncementsShowInput, typeof packedAnnouncementsShowOutput> {
	constructor(
		private announcementService: AnnouncementService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			try {
				return await this.announcementService.getAnnouncement(ps.announcementId, me);
			} catch (err) {
				if (err instanceof EntityNotFoundError) throw new ApiError(meta.errors.noSuchAnnouncement);
				throw err;
			}
		});
	}
}
