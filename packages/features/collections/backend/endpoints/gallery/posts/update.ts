/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedGalleryPost } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
export interface GalleryPostsUpdateDependencies<Actor extends ApiActor> {
	driveFilesRepository: Pick<CollectionsDependencies<Actor>['driveFilesRepository'], 'findOneBy'>;
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'findOneByOrFail' | 'update'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'pack'>;
}
export function createGalleryPostsUpdateProcedure<Actor extends ApiActor>(deps: GalleryPostsUpdateDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.galleryPostsUpdate).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isSensitive: 'boolean' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			let files: Array<MiDriveFile> | undefined;
			if (ps.fileIds) {
				files = (await Promise.all(ps.fileIds.map(fileId =>
					deps.driveFilesRepository.findOneBy({
						id: fileId,
						userId: me.id,
					}),
				))).filter(x => x != null);
				if (files.length === 0) {
					throw new Error();
				}
			}
			await deps.galleryPostsRepository.update({
				id: ps.postId,
				userId: me.id,
			}, {
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				isSensitive: ps.isSensitive,
				fileIds: files ? files.map(file => file.id) : undefined,
			});
			const post = await deps.galleryPostsRepository.findOneByOrFail({ id: ps.postId });
			return toPackedGalleryPost(await deps.galleryPostEntityService.pack(post, me));
		});
}
