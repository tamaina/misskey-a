/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GalleryLikesRepository, GalleryPostsRepository } from '@features/persistence/backend/repositories/models.js';
import { awaitAll } from '@features/runtime/backend/async/await-all.js';
import type { Packed } from '@features/index/contract/packed.js';
import type { } from '@features/relationships/backend/models/Blocking.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiGalleryPost } from '../models/GalleryPost.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';

export class GalleryPostEntityService {
	constructor(
		private galleryPostsRepository: GalleryPostsRepository,

		private galleryLikesRepository: GalleryLikesRepository,

		private userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>,
		private driveFileEntityService: Pick<DriveFileEntityService, 'packManyByIds'>,
		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiGalleryPost['id'] | MiGalleryPost,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'GalleryPost'>> {
		const meId = me ? me.id : null;
		const post = typeof src === 'object' ? src : await this.galleryPostsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: post.id,
			createdAt: this.idService.parse(post.id).date.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
			userId: post.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(post.user ?? post.userId, me),
			title: post.title,
			description: post.description,
			fileIds: post.fileIds,
			// TODO: packMany causes N+1 queries
			files: this.driveFileEntityService.packManyByIds(post.fileIds),
			tags: post.tags.length > 0 ? post.tags : undefined,
			isSensitive: post.isSensitive,
			likedCount: post.likedCount,
			isLiked: meId ? await this.galleryLikesRepository.exists({ where: { postId: post.id, userId: meId } }) : undefined,
		});
	}

	@bindThis
	public async packMany(
		posts: MiGalleryPost[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = posts.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(posts.map(post => this.pack(post, me, { packedUser: _userMap.get(post.userId) })));
	}
}
