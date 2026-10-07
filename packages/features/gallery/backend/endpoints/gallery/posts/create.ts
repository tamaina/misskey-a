/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { uniqueGalleryPostsCreateDefinition, uniqueGalleryPostsCreateInput, uniqueGalleryPostsCreateOutput } from '../../../../contract/unique-string-endpoint-definitions.js';
import ms from '@/runtime-dependencies/ms.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, GalleryPostsRepository } from '@/models/_.js';
import { MiGalleryPost } from '../../../models/GalleryPost.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GalleryPostEntityService } from '../../../serializers/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(uniqueGalleryPostsCreateDefinition);

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:gallery',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	res: contractProjection.response,

	errors: {

	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof uniqueGalleryPostsCreateInput, typeof uniqueGalleryPostsCreateOutput> {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private galleryPostEntityService: GalleryPostEntityService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const files = (await Promise.all(ps.fileIds.map(fileId =>
				this.driveFilesRepository.findOneBy({
					id: fileId,
					userId: me.id,
				}),
			))).filter(x => x != null);

			if (files.length === 0) {
				throw new Error();
			}

			const post = await this.galleryPostsRepository.insertOne(new MiGalleryPost({
				id: this.idService.gen(),
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				userId: me.id,
				isSensitive: ps.isSensitive,
				fileIds: files.map(file => file.id),
			}));

			return await this.galleryPostEntityService.pack(post, me);
		});
	}
}
