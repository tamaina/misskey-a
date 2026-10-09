/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import type { ClipsRepository, ClipNotesRepository, ClipFavoritesRepository, NotesRepository, NoteFavoritesRepository, GalleryPostsRepository, GalleryLikesRepository, DriveFilesRepository, UsersRepository } from '../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { QueryService } from '../../notes/backend/services/QueryService.js';
import { GetterService } from '../../api/backend/transport/GetterService.js';
import { IdService } from '../../runtime/backend/services/IdService.js';
import { RoleService } from '../../roles/backend/services/RoleService.js';
import { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import { AchievementService } from '../../users/backend/services/AchievementService.js';
import { FeaturedService } from '../../discovery/backend/services/FeaturedService.js';
import { NoteEntityService } from '../../notes/backend/serializers/NoteEntityService.js';
import { ClipService } from './services/ClipService.js';
import { ClipEntityService } from './serializers/ClipEntityService.js';
import { GalleryPostEntityService } from './serializers/GalleryPostEntityService.js';
import { GalleryLikeEntityService } from './serializers/GalleryLikeEntityService.js';
import { NoteFavoriteEntityService } from './serializers/NoteFavoriteEntityService.js';
import { collectionsContract } from './api.contract.js';
import { createCollectionsRouter } from './api.router.js';
type Router = ReturnType<typeof createCollectionsRouter<MiLocalUser>>;

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S {
	if (schema === undefined) throw new Error('Missing collections output schema');
	return schema;
}

@Injectable()
export class CollectionsApiProvider {
	private router: Router | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): Router {
		if (this.router !== undefined) return this.router;
		const clips = this.moduleRef.get(ClipEntityService, { strict: false });
		const notes = this.moduleRef.get(NoteEntityService, { strict: false });
		const favorites = this.moduleRef.get(NoteFavoriteEntityService, { strict: false });
		const gallery = this.moduleRef.get(GalleryPostEntityService, { strict: false });
		const likes = this.moduleRef.get(GalleryLikeEntityService, { strict: false });
		this.router = createCollectionsRouter<MiLocalUser>({
			clipsRepository: this.moduleRef.get<ClipsRepository>(DI.clipsRepository, { strict: false }),
			clipNotesRepository: this.moduleRef.get<ClipNotesRepository>(DI.clipNotesRepository, { strict: false }),
			clipFavoritesRepository: this.moduleRef.get<ClipFavoritesRepository>(DI.clipFavoritesRepository, { strict: false }),
			notesRepository: this.moduleRef.get<NotesRepository>(DI.notesRepository, { strict: false }),
			noteFavoritesRepository: this.moduleRef.get<NoteFavoritesRepository>(DI.noteFavoritesRepository, { strict: false }),
			galleryPostsRepository: this.moduleRef.get<GalleryPostsRepository>(DI.galleryPostsRepository, { strict: false }),
			galleryLikesRepository: this.moduleRef.get<GalleryLikesRepository>(DI.galleryLikesRepository, { strict: false }),
			driveFilesRepository: this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false }),
			usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
			clipService: this.moduleRef.get(ClipService, { strict: false }),
			clipEntityService: {
				pack: async (row, actor) => v.parse(requiredSchema(collectionsContract.clipsShow['~orpc'].outputSchema), await clips.pack(row, actor)),
				packMany: async (rows, actor) => v.parse(requiredSchema(collectionsContract.clipsList['~orpc'].outputSchema), await clips.packMany(rows, actor)),
			},
			noteEntityService: {
				packMany: async (rows, actor) => v.parse(requiredSchema(collectionsContract.clipsNotes['~orpc'].outputSchema), await notes.packMany(rows, actor)),
				isVisibleForMe: (note, actorId) => notes.isVisibleForMe(note, actorId),
			},
			noteFavoriteEntityService: { packMany: async (rows, actor) => v.parse(requiredSchema(collectionsContract.iFavorites['~orpc'].outputSchema), await favorites.packMany(rows, actor)) },
			galleryPostEntityService: {
				pack: async (row, actor) => v.parse(requiredSchema(collectionsContract.galleryPostsShow['~orpc'].outputSchema), await gallery.pack(row, actor)),
				packMany: async (rows, actor) => v.parse(requiredSchema(collectionsContract.galleryPosts['~orpc'].outputSchema), await gallery.packMany(rows, actor)),
			},
			galleryLikeEntityService: { packMany: async (rows, actor) => v.parse(requiredSchema(collectionsContract.iGalleryLikes['~orpc'].outputSchema), await likes.packMany(rows, actor)) },
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			getterService: this.moduleRef.get(GetterService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			moderationLogService: this.moduleRef.get(ModerationLogService, { strict: false }),
			achievementService: this.moduleRef.get(AchievementService, { strict: false }),
			featuredService: this.moduleRef.get(FeaturedService, { strict: false }),
		});
		return this.router;
	}
}
