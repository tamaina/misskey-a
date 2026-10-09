/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { MiGalleryPost } from './models/GalleryPost.js';
import type { ClipService } from './services/ClipService.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { collectionsContract } from './api.contract.js';
import type { ClipsRepository, ClipNotesRepository, ClipFavoritesRepository, NotesRepository, NoteFavoritesRepository, GalleryPostsRepository, GalleryLikesRepository, DriveFilesRepository, UsersRepository, MiClip, MiNote, MiNoteFavorite, MiGalleryLike } from '../../persistence/backend/repositories/models.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { GetterService } from '../../api/backend/transport/GetterService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { RoleService } from '../../roles/backend/services/RoleService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { AchievementService } from '../../users/backend/services/AchievementService.js';
import type { FeaturedService } from '../../discovery/backend/services/FeaturedService.js';
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
