/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DriveFilesRepository, PagesRepository, PageLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { awaitAll } from '@features/runtime/backend/async/await-all.js';
import type { PackedJsonValue } from '@features/users/backend/json-value.schema.js';
import type { PackedUserLite } from '@features/users/backend/user.schema.js';
import type * as v from 'valibot';
import type { packedPageSchema } from '@features/users/backend/page.schema.js';
import type { } from '@features/relationships/backend/models/Blocking.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiPage } from '../models/Page.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';

/** Exact persisted fields used by serialization avoid recursively expanding JSON through ORM types. */
export interface PagePackingRepository {
 findOneByOrFail(where: { id: string }): Promise<MiPage>;
 update(id: string, values: { content: MiPage['content'] }): Promise<unknown>;
}

export class PageEntityService {
	constructor(
		private pagesRepository: PagePackingRepository,

		private pageLikesRepository: PageLikesRepository,

		private driveFilesRepository: DriveFilesRepository,

		private userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>,
		private driveFileEntityService: Pick<DriveFileEntityService, 'pack' | 'packMany'>,
		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiPage['id'] | MiPage,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: PackedUserLite
		},
	): Promise<v.InferOutput<typeof packedPageSchema>> {
		const meId = me ? me.id : null;
		const page = typeof src === 'object' ? src : await this.pagesRepository.findOneByOrFail({ id: src });

		const attachedFiles: Promise<MiDriveFile | null>[] = [];
		const collectFile = (xs: PackedJsonValue[]) => {
			for (const x of xs) {
				if (x === null || typeof x !== 'object' || Array.isArray(x)) continue;
				if (x.type === 'image' && typeof x.fileId === 'string') {
					attachedFiles.push(this.driveFilesRepository.findOneBy({
						id: x.fileId,
						userId: page.userId,
					}));
				}
				if (Array.isArray(x.children)) {
					collectFile(x.children);
				}
			}
		};
		collectFile(page.content);

		// 後方互換性のため
		let migrated = false;
		const migrate = (xs: PackedJsonValue[]) => {
			for (const x of xs) {
				if (x === null || typeof x !== 'object' || Array.isArray(x)) continue;
				if (x.type === 'input') {
					if (x.inputType === 'text') {
						x.type = 'textInput';
					}
					if (x.inputType === 'number') {
						x.type = 'numberInput';
						if (x.default) {
							const parsed = parseInt(String(x.default), 10);
							// JSON serialization historically emits null for a non-finite parsed default.
							x.default = Number.isFinite(parsed) ? parsed : null;
						}
					}
					migrated = true;
				}
				if (Array.isArray(x.children)) {
					migrate(x.children);
				}
			}
		};
		migrate(page.content);
		if (migrated) {
			this.pagesRepository.update(page.id, {
				content: page.content,
			});
		}

		return await awaitAll({
			id: page.id,
			createdAt: this.idService.parse(page.id).date.toISOString(),
			updatedAt: page.updatedAt.toISOString(),
			userId: page.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(page.user ?? page.userId, me), // { schema: 'UserDetailed' } すると無限ループするので注意
			content: page.content,
			variables: page.variables,
			title: page.title,
			name: page.name,
			summary: page.summary,
			hideTitleWhenPinned: page.hideTitleWhenPinned,
			alignCenter: page.alignCenter,
			font: page.font,
			script: page.script,
			eyeCatchingImageId: page.eyeCatchingImageId,
			eyeCatchingImage: page.eyeCatchingImageId ? await this.driveFileEntityService.pack(page.eyeCatchingImageId) : null,
			attachedFiles: this.driveFileEntityService.packMany((await Promise.all(attachedFiles)).filter(x => x != null)),
			likedCount: page.likedCount,
			isLiked: meId ? await this.pageLikesRepository.exists({ where: { pageId: page.id, userId: meId } }) : undefined,
		});
	}

	@bindThis
	public async packMany(
		pages: MiPage[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = pages.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(pages.map(page => this.pack(page, me, { packedUser: _userMap.get(page.userId) })));
	}
}
