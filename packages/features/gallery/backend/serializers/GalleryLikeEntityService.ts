/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GalleryLikesRepository } from '@features/persistence/backend/repositories/models.js';
import type { } from '@features/relationships/backend/models/Blocking.js';
import type { MiGalleryLike } from '../models/GalleryLike.js';
import { bindThis } from '@/decorators.js';
import type { GalleryPostEntityService } from './GalleryPostEntityService.js';

export class GalleryLikeEntityService {
	constructor(
		private galleryLikesRepository: GalleryLikesRepository,

		private galleryPostEntityService: Pick<GalleryPostEntityService, 'pack'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiGalleryLike['id'] | MiGalleryLike,
		me?: any,
	) {
		const like = typeof src === 'object' ? src : await this.galleryLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			post: await this.galleryPostEntityService.pack(like.post ?? like.postId, me),
		};
	}

	@bindThis
	public packMany(
		likes: any[],
		me: any,
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}
