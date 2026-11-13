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
import { MiGalleryPost } from '../../../models/GalleryPost.js';
export interface GalleryPostsCreateDependencies<Actor extends ApiActor> {
	driveFilesRepository: Pick<CollectionsDependencies<Actor>['driveFilesRepository'], 'findOneBy'>;
	galleryPostsRepository: CollectionsDependencies<Actor>['galleryPostsRepository'];
	idService: Pick<CollectionsDependencies<Actor>['idService'], 'gen'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'pack'>;
}
export function createGalleryPostsCreateProcedure<Actor extends ApiActor>(deps: GalleryPostsCreateDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.galleryPostsCreate).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isSensitive: 'boolean' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const files = (await Promise.all(ps.fileIds.map(fileId =>
				deps.driveFilesRepository.findOneBy({
					id: fileId,
					userId: me.id,
				}),
			))).filter(x => x != null);
			if (files.length === 0) {
				throw new Error();
			}
			const post = await deps.galleryPostsRepository.insertOne(new MiGalleryPost({
				id: deps.idService.gen(),
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				userId: me.id,
				isSensitive: ps.isSensitive,
				fileIds: files.map(file => file.id),
			}));
			return toPackedGalleryPost(await deps.galleryPostEntityService.pack(post, me));
		});
}
