/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { FlashLikesRepository } from '@/models/_.js';
import type { } from '../../../relationships/backend/models/Blocking.js';
import type { MiUser } from '../../../users/backend/models/User.js';
import type { MiFlashLike } from '../models/FlashLike.js';
import { bindThis } from '@/decorators.js';
import type { FlashEntityService } from './FlashEntityService.js';

export class FlashLikeEntityService {
	constructor(
		private flashLikesRepository: FlashLikesRepository,

		private flashEntityService: Pick<FlashEntityService, 'pack'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiFlashLike['id'] | MiFlashLike,
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const like = typeof src === 'object' ? src : await this.flashLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			flash: await this.flashEntityService.pack(like.flash ?? like.flashId, me),
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
