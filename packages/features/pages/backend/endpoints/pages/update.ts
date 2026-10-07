/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { portablePagesUpdateDefinition, portablePagesUpdateInput, portablePagesUpdateOutput } from '../../../contract/portable-constant-endpoint-definitions.js';
import ms from '@/runtime-dependencies/ms.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, MiDriveFile } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { PageService } from '../../services/PageService.js';

const contractProjection = projectEndpointContract(portablePagesUpdateDefinition);

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:pages',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '21149b9e-3616-4778-9592-c4ce89f5a864',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '3c15cd52-3b4b-4274-967d-6456fc4f792b',
		},
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cfc23c7c-3887-490e-af30-0ed576703c82',
		},
		nameAlreadyExists: {
			message: 'Specified name already exists.',
			code: 'NAME_ALREADY_EXISTS',
			id: '2298a392-d4a1-44c5-9ebb-ac1aeaa5a9ab',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof portablePagesUpdateInput, typeof portablePagesUpdateOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private pageService: PageService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			try {
				let eyeCatchingImage: MiDriveFile | null | undefined | string = ps.eyeCatchingImageId;
				if (eyeCatchingImage != null) {
					eyeCatchingImage = await this.driveFilesRepository.findOneBy({
						id: eyeCatchingImage,
						userId: me.id,
					});

					if (eyeCatchingImage == null) {
						throw new ApiError(meta.errors.noSuchFile);
					}
				}

				await this.pageService.update(me, ps.pageId, {
					...ps,
					eyeCatchingImage,
				});
			} catch (err) {
				if (err instanceof IdentifiableError) {
					if (err.id === '66aefd3c-fdb2-4a71-85ae-cc18bea85d3f') throw new ApiError(meta.errors.noSuchPage);
					if (err.id === 'd0017699-8256-46f1-aed4-bc03bed73616') throw new ApiError(meta.errors.accessDenied);
					if (err.id === 'd05bfe24-24b6-4ea2-a3ec-87cc9bf4daa4') throw new ApiError(meta.errors.nameAlreadyExists);
				}
				throw err;
			}
		});
	}
}
