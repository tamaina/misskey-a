/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NoteFavoritesRepository } from '@/models/_.js';
import type { } from '../../../relationships/backend/models/Blocking.js';
import type { MiUser } from '../../../users/backend/models/User.js';
import type { MiNoteFavorite } from '../models/NoteFavorite.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '../../../runtime/backend/services/IdService.js';
import { NoteEntityService } from '../../../notes/backend/serializers/NoteEntityService.js';

@Injectable()
export class NoteFavoriteEntityService {
	constructor(
		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		private noteEntityService: NoteEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiNoteFavorite['id'] | MiNoteFavorite,
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const favorite = typeof src === 'object' ? src : await this.noteFavoritesRepository.findOneByOrFail({ id: src });

		return {
			id: favorite.id,
			createdAt: this.idService.parse(favorite.id).date.toISOString(),
			noteId: favorite.noteId,
			note: await this.noteEntityService.pack(favorite.note ?? favorite.noteId, me),
		};
	}

	@bindThis
	public packMany(
		favorites: any[],
		me: { id: MiUser['id'] },
	) {
		return Promise.all(favorites.map(x => this.pack(x, me)));
	}
}
