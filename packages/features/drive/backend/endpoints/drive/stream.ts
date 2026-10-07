/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { listingDriveStreamDefinition, listingDriveStreamInput, listingDriveStreamOutput } from '../../../contract/drive-listing-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DriveFileEntityService } from '../../serializers/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(listingDriveStreamDefinition);

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof listingDriveStreamInput, typeof listingDriveStreamOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.driveFilesRepository.createQueryBuilder('file'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('file.userId = :userId', { userId: me.id });

			if (ps.type) {
				if (ps.type.endsWith('/*')) {
					query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
				} else {
					query.andWhere('file.type = :type', { type: ps.type });
				}
			}

			const files = await query.limit(ps.limit).getMany();

			return await this.driveFileEntityService.packMany(files, { detail: false, self: true });
		});
	}
}
