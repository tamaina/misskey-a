/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { listingAdminDriveFilesDefinition, listingAdminDriveFilesInput, listingAdminDriveFilesOutput } from '../../../../contract/drive-listing-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/_.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';

const contractProjection = projectEndpointContract(listingAdminDriveFilesDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:drive',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof listingAdminDriveFilesInput, typeof listingAdminDriveFilesOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.driveFilesRepository.createQueryBuilder('file'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

			if (ps.userId) {
				query.andWhere('file.userId = :userId', { userId: ps.userId });
			} else {
				if (ps.origin === 'local') {
					query.andWhere('file.userHost IS NULL');
				} else if (ps.origin === 'remote') {
					query.andWhere('file.userHost IS NOT NULL');
				}

				if (ps.hostname) {
					query.andWhere('file.userHost = :hostname', { hostname: ps.hostname });
				}
			}

			if (ps.type) {
				if (ps.type.endsWith('/*')) {
					query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
				} else {
					query.andWhere('file.type = :type', { type: ps.type });
				}
			}

			const files = await query.limit(ps.limit).getMany();

			return await this.driveFileEntityService.packMany(files, { detail: true, withUser: true, self: true });
		});
	}
}
