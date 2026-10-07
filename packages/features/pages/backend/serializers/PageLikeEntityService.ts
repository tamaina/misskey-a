/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PageLikesRepository } from '@features/persistence/backend/repositories/models.js';
import type { } from '@features/relationships/backend/models/Blocking.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiPageLike } from '../models/PageLike.js';
import { bindThis } from '@/decorators.js';
import type { PageEntityService } from './PageEntityService.js';

export class PageLikeEntityService {
	constructor(
		private pageLikesRepository: PageLikesRepository,

		private pageEntityService: Pick<PageEntityService, 'pack'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiPageLike['id'] | MiPageLike,
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const like = typeof src === 'object' ? src : await this.pageLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			page: await this.pageEntityService.pack(like.page ?? like.pageId, me),
		};
	}

	@bindThis
	public packMany(
		likes: any[],
		me: { id: MiUser['id'] },
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}
