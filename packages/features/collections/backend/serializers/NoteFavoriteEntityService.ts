/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { NoteFavoritesRepository } from '@/models/_.js';
import type { } from '@features/relationships/backend/models/Blocking.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiNoteFavorite } from '../models/NoteFavorite.js';
import { bindThis } from '@/decorators.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';

export class NoteFavoriteEntityService {
	constructor(
		private noteFavoritesRepository: NoteFavoritesRepository,

		private noteEntityService: Pick<NoteEntityService, 'pack'>,
		private idService: Pick<IdService, 'parse'>,
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
