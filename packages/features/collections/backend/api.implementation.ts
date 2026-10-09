/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import type { MiGalleryPost } from './models/GalleryPost.js';
import { ClipService } from './services/ClipService.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from './api.definition.js';
import type { ClipsRepository, ClipNotesRepository, ClipFavoritesRepository, NotesRepository, NoteFavoritesRepository, GalleryPostsRepository, GalleryLikesRepository, DriveFilesRepository, UsersRepository, MiClip, MiNote, MiNoteFavorite, MiGalleryLike } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { AchievementService } from '@features/users/backend/services/AchievementService.js';
import { FeaturedService } from '@features/discovery/backend/services/FeaturedService.js';
import { implement } from '@orpc/server';
import { createClipsAddNoteProcedure } from './endpoints/clips/add-note.js';
import { createClipsCreateProcedure } from './endpoints/clips/create.js';
import { createClipsDeleteProcedure } from './endpoints/clips/delete.js';
import { createClipsFavoriteProcedure } from './endpoints/clips/favorite.js';
import { createClipsListProcedure } from './endpoints/clips/list.js';
import { createClipsMyFavoritesProcedure } from './endpoints/clips/my-favorites.js';
import { createClipsNotesProcedure } from './endpoints/clips/notes.js';
import { createClipsRemoveNoteProcedure } from './endpoints/clips/remove-note.js';
import { createClipsShowProcedure } from './endpoints/clips/show.js';
import { createClipsUnfavoriteProcedure } from './endpoints/clips/unfavorite.js';
import { createClipsUpdateProcedure } from './endpoints/clips/update.js';
import { createGalleryFeaturedProcedure } from './endpoints/gallery/featured.js';
import { createGalleryPopularProcedure } from './endpoints/gallery/popular.js';
import { createGalleryPostsProcedure } from './endpoints/gallery/posts.js';
import { createGalleryPostsCreateProcedure } from './endpoints/gallery/posts/create.js';
import { createGalleryPostsDeleteProcedure } from './endpoints/gallery/posts/delete.js';
import { createGalleryPostsLikeProcedure } from './endpoints/gallery/posts/like.js';
import { createGalleryPostsShowProcedure } from './endpoints/gallery/posts/show.js';
import { createGalleryPostsUnlikeProcedure } from './endpoints/gallery/posts/unlike.js';
import { createGalleryPostsUpdateProcedure } from './endpoints/gallery/posts/update.js';
import { createIFavoritesProcedure } from './endpoints/i/favorites.js';
import { createIGalleryLikesProcedure } from './endpoints/i/gallery/likes.js';
import { createIGalleryPostsProcedure } from './endpoints/i/gallery/posts.js';
import { createNotesClipsProcedure } from './endpoints/notes/clips.js';
import { createNotesFavoritesCreateProcedure } from './endpoints/notes/favorites/create.js';
import { createNotesFavoritesDeleteProcedure } from './endpoints/notes/favorites/delete.js';
import { createUsersClipsProcedure } from './endpoints/users/clips.js';
import { createUsersGalleryPostsProcedure } from './endpoints/users/gallery/posts.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ClipEntityService } from './serializers/ClipEntityService.js';
import { GalleryPostEntityService } from './serializers/GalleryPostEntityService.js';
import { GalleryLikeEntityService } from './serializers/GalleryLikeEntityService.js';
import { NoteFavoriteEntityService } from './serializers/NoteFavoriteEntityService.js';

type Outputs = InferContractRouterOutputs<typeof collectionsContract>;

export interface CollectionsDependencies<Actor extends ApiActor> {
	clipsRepository: Pick<ClipsRepository, 'findOneBy' | 'findBy' | 'createQueryBuilder'>;
	clipNotesRepository: Pick<ClipNotesRepository, 'findBy' | 'metadata'>;
	clipFavoritesRepository: Pick<ClipFavoritesRepository, 'createQueryBuilder' | 'exists' | 'insert' | 'findOneBy' | 'delete'>;
	notesRepository: Pick<NotesRepository, 'createQueryBuilder'>;
	noteFavoritesRepository: Pick<NoteFavoritesRepository, 'createQueryBuilder' | 'exists' | 'insert' | 'findOneBy' | 'delete'>;
	// insertOne declares the full repository as its receiver; retain that typed receiver.
	galleryPostsRepository: GalleryPostsRepository;
	galleryLikesRepository: Pick<GalleryLikesRepository, 'createQueryBuilder' | 'exists' | 'insert' | 'findOneBy' | 'delete'>;
	driveFilesRepository: Pick<DriveFilesRepository, 'findOneBy'>;
	usersRepository: Pick<UsersRepository, 'findOneByOrFail'>;
	clipService: Pick<ClipService, 'create' | 'update' | 'delete' | 'addNote' | 'removeNote'>;
	clipEntityService: {
		pack(row: string | MiClip, actor: Actor | null): Promise<Outputs['clipsShow']>;
		packMany(rows: MiClip[], actor: Actor | null): Promise<Outputs['clipsList']>;
	};
	noteEntityService: {
		packMany(rows: MiNote[], actor: Actor | null): Promise<Outputs['clipsNotes']>;
		isVisibleForMe(note: MiNote, actorId: string | null): Promise<boolean>;
	};
	noteFavoriteEntityService: { packMany(rows: MiNoteFavorite[], actor: Actor): Promise<Outputs['iFavorites']> };
	galleryPostEntityService: {
		pack(row: string | MiGalleryPost, actor: Actor | null): Promise<Outputs['galleryPostsShow']>;
		packMany(rows: MiGalleryPost[], actor: Actor | null): Promise<Outputs['galleryPosts']>;
	};
	galleryLikeEntityService: { packMany(rows: MiGalleryLike[], actor: Actor): Promise<Outputs['iGalleryLikes']> };
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateSuspendedUserQueryForNote' | 'generateBlockedHostQueryForNote' | 'generateMutedUserQueryForNotes' | 'generateBlockedUserQueryForNotes'>;
	getterService: Pick<GetterService, 'getNote'>;
	idService: Pick<IdService, 'gen' | 'parse'>;
	roleService: Pick<RoleService, 'isModerator'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
	achievementService: Pick<AchievementService, 'create'>;
	featuredService: Pick<FeaturedService, 'getGalleryPostsRanking' | 'updateGalleryPostsRanking'>;
}

export function createCollectionsRouter<Actor extends ApiActor>(deps: CollectionsDependencies<Actor>) {
	return implement(collectionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		clipsAddNote: createClipsAddNoteProcedure(deps),
		clipsCreate: createClipsCreateProcedure(deps),
		clipsDelete: createClipsDeleteProcedure(deps),
		clipsFavorite: createClipsFavoriteProcedure(deps),
		clipsList: createClipsListProcedure(deps),
		clipsMyFavorites: createClipsMyFavoritesProcedure(deps),
		clipsNotes: createClipsNotesProcedure(deps),
		clipsRemoveNote: createClipsRemoveNoteProcedure(deps),
		clipsShow: createClipsShowProcedure(deps),
		clipsUnfavorite: createClipsUnfavoriteProcedure(deps),
		clipsUpdate: createClipsUpdateProcedure(deps),
		galleryFeatured: createGalleryFeaturedProcedure(deps),
		galleryPopular: createGalleryPopularProcedure(deps),
		galleryPosts: createGalleryPostsProcedure(deps),
		galleryPostsCreate: createGalleryPostsCreateProcedure(deps),
		galleryPostsDelete: createGalleryPostsDeleteProcedure(deps),
		galleryPostsLike: createGalleryPostsLikeProcedure(deps),
		galleryPostsShow: createGalleryPostsShowProcedure(deps),
		galleryPostsUnlike: createGalleryPostsUnlikeProcedure(deps),
		galleryPostsUpdate: createGalleryPostsUpdateProcedure(deps),
		iFavorites: createIFavoritesProcedure(deps),
		iGalleryLikes: createIGalleryLikesProcedure(deps),
		iGalleryPosts: createIGalleryPostsProcedure(deps),
		notesClips: createNotesClipsProcedure(deps),
		notesFavoritesCreate: createNotesFavoritesCreateProcedure(deps),
		notesFavoritesDelete: createNotesFavoritesDeleteProcedure(deps),
		usersClips: createUsersClipsProcedure(deps),
		usersGalleryPosts: createUsersGalleryPostsProcedure(deps),
	});
}

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
