/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ClipNotesRepository, ClipFavoritesRepository, ClipsRepository, MiUser } from '@features/persistence/backend/repositories/models.js';
import { awaitAll } from '@features/runtime/backend/async/await-all.js';
import type { Packed } from '@features/index/backend/packed.schema.js';
import type { } from '@features/relationships/backend/models/Blocking.js';
import type { MiClip } from '../models/Clip.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

export class ClipEntityService {
	constructor(
		private clipsRepository: ClipsRepository,

		private clipNotesRepository: ClipNotesRepository,

		private clipFavoritesRepository: ClipFavoritesRepository,

		private userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>,
		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiClip['id'] | MiClip,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'Clip'>> {
		const meId = me ? me.id : null;
		const clip = typeof src === 'object' ? src : await this.clipsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: clip.id,
			createdAt: this.idService.parse(clip.id).date.toISOString(),
			lastClippedAt: clip.lastClippedAt ? clip.lastClippedAt.toISOString() : null,
			userId: clip.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(clip.user ?? clip.userId),
			name: clip.name,
			description: clip.description,
			isPublic: clip.isPublic,
			favoritedCount: await this.clipFavoritesRepository.countBy({ clipId: clip.id }),
			isFavorited: meId ? await this.clipFavoritesRepository.exists({ where: { clipId: clip.id, userId: meId } }) : undefined,
			notesCount: (meId === clip.userId) ? await this.clipNotesRepository.countBy({ clipId: clip.id }) : undefined,
		});
	}

	@bindThis
	public async packMany(
		clips: MiClip[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = clips.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(clips.map(clip => this.pack(clip, me, { packedUser: _userMap.get(clip.userId) })));
	}
}
