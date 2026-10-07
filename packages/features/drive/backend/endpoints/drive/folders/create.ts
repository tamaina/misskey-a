/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedDriveFoldersCreateDefinition, packedDriveFoldersCreateInput, packedDriveFoldersCreateOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import ms from '@/runtime-dependencies/ms.js';

import type { DriveFoldersRepository } from '@/models/_.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedDriveFoldersCreateDefinition);

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '53326628-a00d-40a6-a3cd-8975105c0f95',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedDriveFoldersCreateInput, typeof packedDriveFoldersCreateOutput> {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// If the parent folder is specified
			let parent = null;
			if (ps.parentId) {
				// Fetch parent folder
				parent = await this.driveFoldersRepository.findOneBy({
					id: ps.parentId,
					userId: me.id,
				});

				if (parent == null) {
					throw new ApiError(meta.errors.noSuchFolder);
				}
			}

			// Create folder
			const folder = await this.driveFoldersRepository.insertOne({
				id: this.idService.gen(),
				name: ps.name,
				parentId: parent !== null ? parent.id : null,
				userId: me.id,
			});

			const folderObj = await this.driveFolderEntityService.pack(folder);

			// Publish folderCreated event
			this.globalEventService.publishDriveStream(me.id, 'folderCreated', folderObj);

			return folderObj;
		});
	}
}
