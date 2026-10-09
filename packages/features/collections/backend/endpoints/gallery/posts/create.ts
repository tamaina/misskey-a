/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { collectionsContract } from '../../../api.contract.js';
import type { CollectionsDependencies } from '../../../api.dependencies.js';
import { MiGalleryPost } from '../../../models/GalleryPost.js';
export interface GalleryPostsCreateDependencies<Actor extends ApiActor> {
	driveFilesRepository: Pick<CollectionsDependencies<Actor>['driveFilesRepository'], 'findOneBy'>;
	galleryPostsRepository: CollectionsDependencies<Actor>['galleryPostsRepository'];
	idService: Pick<CollectionsDependencies<Actor>['idService'], 'gen'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'pack'>;
}
export function createGalleryPostsCreateProcedure<Actor extends ApiActor>(deps: GalleryPostsCreateDependencies<Actor>) {
	return implement(collectionsContract.galleryPostsCreate, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.galleryPostsCreate['~orpc'].meta.requestName, requireCredential: true, prohibitMoved: true, kind: 'write:gallery', limit: { duration: 3600000, max: 20 } })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isSensitive: 'boolean' }))
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
			return await deps.galleryPostEntityService.pack(post, me);
		});
}
