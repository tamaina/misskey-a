/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { uniqueGalleryPostsUpdateDefinition, uniqueGalleryPostsUpdateInput, uniqueGalleryPostsUpdateOutput } from '../../../../contract/unique-string-endpoint-definitions.js';
import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, GalleryPostsRepository } from '@/models/_.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import { GalleryPostEntityService } from '../../../serializers/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(uniqueGalleryPostsUpdateDefinition);

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:gallery',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	res: contractProjection.response,

	errors: {

	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof uniqueGalleryPostsUpdateInput, typeof uniqueGalleryPostsUpdateOutput> {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			let files: Array<MiDriveFile> | undefined;

			if (ps.fileIds) {
				files = (await Promise.all(ps.fileIds.map(fileId =>
					this.driveFilesRepository.findOneBy({
						id: fileId,
						userId: me.id,
					}),
				))).filter(x => x != null);

				if (files.length === 0) {
					throw new Error();
				}
			}

			await this.galleryPostsRepository.update({
				id: ps.postId,
				userId: me.id,
			}, {
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				isSensitive: ps.isSensitive,
				fileIds: files ? files.map(file => file.id) : undefined,
			});

			const post = await this.galleryPostsRepository.findOneByOrFail({ id: ps.postId });

			return await this.galleryPostEntityService.pack(post, me);
		});
	}
}
