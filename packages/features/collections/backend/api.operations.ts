/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Brackets, In } from 'typeorm';
import { apiError } from '../../api/backend/transport/orpc-error.js';
import { GALLERY_POSTS_RANKING_WINDOW } from '../../discovery/backend/services/FeaturedService.js';
import { sqlLikeEscape } from '../../persistence/backend/utility/sql-like-escape.js';
import { collectionsErrors } from './api.errors.js';
import { MiGalleryPost } from './models/GalleryPost.js';
import { ClipService } from './services/ClipService.js';
import type * as v from 'valibot';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { collectionsInputs, collectionsOutputs } from './api.schema.js';
import type { ClipsRepository, ClipNotesRepository, ClipFavoritesRepository, NotesRepository, NoteFavoritesRepository, GalleryPostsRepository, GalleryLikesRepository, DriveFilesRepository, UsersRepository, MiClip, MiNote, MiNoteFavorite, MiGalleryLike } from '../../persistence/backend/repositories/models.js';
import type { MiDriveFile } from '../../drive/backend/models/DriveFile.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { GetterService } from '../../api/backend/transport/GetterService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { RoleService } from '../../roles/backend/services/RoleService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { AchievementService } from '../../users/backend/services/AchievementService.js';
import type { FeaturedService } from '../../discovery/backend/services/FeaturedService.js';

type Inputs = { [K in keyof typeof collectionsInputs]: v.InferOutput<typeof collectionsInputs[K]> };
type Outputs = { [K in keyof typeof collectionsOutputs]: v.InferOutput<typeof collectionsOutputs[K]> };

export interface CollectionsOperations<Actor extends ApiActor> {
	clipsAddNote(input: Inputs['clipsAddNote'], actor: Actor): Promise<Outputs['clipsAddNote']>;
	clipsCreate(input: Inputs['clipsCreate'], actor: Actor): Promise<Outputs['clipsCreate']>;
	clipsDelete(input: Inputs['clipsDelete'], actor: Actor): Promise<Outputs['clipsDelete']>;
	clipsFavorite(input: Inputs['clipsFavorite'], actor: Actor): Promise<Outputs['clipsFavorite']>;
	clipsList(input: Inputs['clipsList'], actor: Actor): Promise<Outputs['clipsList']>;
	clipsMyFavorites(input: Inputs['clipsMyFavorites'], actor: Actor): Promise<Outputs['clipsMyFavorites']>;
	clipsNotes(input: Inputs['clipsNotes'], actor: Actor | null): Promise<Outputs['clipsNotes']>;
	clipsRemoveNote(input: Inputs['clipsRemoveNote'], actor: Actor): Promise<Outputs['clipsRemoveNote']>;
	clipsShow(input: Inputs['clipsShow'], actor: Actor | null): Promise<Outputs['clipsShow']>;
	clipsUnfavorite(input: Inputs['clipsUnfavorite'], actor: Actor): Promise<Outputs['clipsUnfavorite']>;
	clipsUpdate(input: Inputs['clipsUpdate'], actor: Actor): Promise<Outputs['clipsUpdate']>;
	galleryFeatured(input: Inputs['galleryFeatured'], actor: Actor | null): Promise<Outputs['galleryFeatured']>;
	galleryPopular(input: Inputs['galleryPopular'], actor: Actor | null): Promise<Outputs['galleryPopular']>;
	galleryPosts(input: Inputs['galleryPosts'], actor: Actor | null): Promise<Outputs['galleryPosts']>;
	galleryPostsCreate(input: Inputs['galleryPostsCreate'], actor: Actor): Promise<Outputs['galleryPostsCreate']>;
	galleryPostsDelete(input: Inputs['galleryPostsDelete'], actor: Actor): Promise<Outputs['galleryPostsDelete']>;
	galleryPostsLike(input: Inputs['galleryPostsLike'], actor: Actor): Promise<Outputs['galleryPostsLike']>;
	galleryPostsShow(input: Inputs['galleryPostsShow'], actor: Actor | null): Promise<Outputs['galleryPostsShow']>;
	galleryPostsUnlike(input: Inputs['galleryPostsUnlike'], actor: Actor): Promise<Outputs['galleryPostsUnlike']>;
	galleryPostsUpdate(input: Inputs['galleryPostsUpdate'], actor: Actor): Promise<Outputs['galleryPostsUpdate']>;
	iFavorites(input: Inputs['iFavorites'], actor: Actor): Promise<Outputs['iFavorites']>;
	iGalleryLikes(input: Inputs['iGalleryLikes'], actor: Actor): Promise<Outputs['iGalleryLikes']>;
	iGalleryPosts(input: Inputs['iGalleryPosts'], actor: Actor): Promise<Outputs['iGalleryPosts']>;
	notesClips(input: Inputs['notesClips'], actor: Actor | null): Promise<Outputs['notesClips']>;
	notesFavoritesCreate(input: Inputs['notesFavoritesCreate'], actor: Actor): Promise<Outputs['notesFavoritesCreate']>;
	notesFavoritesDelete(input: Inputs['notesFavoritesDelete'], actor: Actor): Promise<Outputs['notesFavoritesDelete']>;
	usersClips(input: Inputs['usersClips'], actor: Actor | null): Promise<Outputs['usersClips']>;
	usersGalleryPosts(input: Inputs['usersGalleryPosts'], actor: Actor | null): Promise<Outputs['usersGalleryPosts']>;
}

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
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBlockedHostQueryForNote' | 'generateMutedUserQueryForNotes' | 'generateBlockedUserQueryForNotes'>;
	getterService: Pick<GetterService, 'getNote'>;
	idService: Pick<IdService, 'gen' | 'parse'>;
	roleService: Pick<RoleService, 'isModerator'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
	achievementService: Pick<AchievementService, 'create'>;
	featuredService: Pick<FeaturedService, 'getGalleryPostsRanking' | 'updateGalleryPostsRanking'>;
}

/** Business operations with typed ports; HTTP authentication and input validation live in the router. */
@Injectable()
export class CollectionsApplicationService<Actor extends ApiActor> implements CollectionsOperations<Actor> {
	private galleryPostsRankingCache: string[] = [];
	private galleryPostsRankingCacheLastFetchedAt = 0;
	constructor(private readonly deps: CollectionsDependencies<Actor>) {}

	public async clipsCreate(ps: Inputs['clipsCreate'], me: Actor): Promise<Outputs['clipsCreate']> {
		let clip: MiClip;
		try {
			// 空文字列をnullにしたいので??は使わない
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			clip = await this.deps.clipService.create(me, ps.name, ps.isPublic, ps.description || null);
		} catch (e) {
			if (e instanceof ClipService.TooManyClipsError) {
				throw apiError(collectionsErrors.clipsCreate.tooManyClips);
			}
			throw e;
		}
		return await this.deps.clipEntityService.pack(clip, me);
	}

	public async clipsList(ps: Inputs['clipsList'], me: Actor): Promise<Outputs['clipsList']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.clipsRepository.createQueryBuilder('clip'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('clip.userId = :userId', { userId: me.id });

		const clips = await query.limit(ps.limit).getMany();

		return await this.deps.clipEntityService.packMany(clips, me);
	}

	public async clipsMyFavorites(ps: Inputs['clipsMyFavorites'], me: Actor): Promise<Outputs['clipsMyFavorites']> {
		const query = this.deps.clipFavoritesRepository.createQueryBuilder('favorite')
			.andWhere('favorite.userId = :meId', { meId: me.id })
			.leftJoinAndSelect('favorite.clip', 'clip');

		const favorites = await query
			.getMany();

		return this.deps.clipEntityService.packMany(favorites.map(x => x.clip!), me);
	}

	public async clipsNotes(ps: Inputs['clipsNotes'], me: Actor | null): Promise<Outputs['clipsNotes']> {
		const clip = await this.deps.clipsRepository.findOneBy({
			id: ps.clipId,
		});

		if (clip == null) {
			throw apiError(collectionsErrors.clipsNotes.noSuchClip);
		}

		if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
			throw apiError(collectionsErrors.clipsNotes.noSuchClip);
		}

		const query = this.deps.queryService.makePaginationQuery(this.deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.innerJoin(this.deps.clipNotesRepository.metadata.targetName, 'clipNote', 'clipNote.noteId = note.id')
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.andWhere('clipNote.clipId = :clipId', { clipId: clip.id });

		this.deps.queryService.generateVisibilityQuery(query, me);
		this.deps.queryService.generateBlockedHostQueryForNote(query);
		// this.deps.queryService.generateSuspendedUserQueryForNote(query); // To avoid problems with removing notes, ignoring suspended user for now
		if (me) {
			this.deps.queryService.generateMutedUserQueryForNotes(query, me);
			this.deps.queryService.generateBlockedUserQueryForNotes(query, me);
			this.deps.queryService.generateMutedUserQueryForNotes(query, me, { noteColumn: 'renote' });
			this.deps.queryService.generateBlockedUserQueryForNotes(query, me, { noteColumn: 'renote' });
		}

		if (ps.search != null) {
			for (const word of ps.search.trim().split(' ')) {
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.text ILIKE :search', { search: `%${sqlLikeEscape(word)}%` });
					qb.orWhere('note.cw ILIKE :search', { search: `%${sqlLikeEscape(word)}%` });
				}));
			}
		}

		const notes = await query
			.limit(ps.limit)
			.getMany();

		return await this.deps.noteEntityService.packMany(notes, me);
	}

	public async clipsShow(ps: Inputs['clipsShow'], me: Actor | null): Promise<Outputs['clipsShow']> {
		// Fetch the clip
		const clip = await this.deps.clipsRepository.findOneBy({
			id: ps.clipId,
		});

		if (clip == null) {
			throw apiError(collectionsErrors.clipsShow.noSuchClip);
		}

		if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
			throw apiError(collectionsErrors.clipsShow.noSuchClip);
		}

		return await this.deps.clipEntityService.pack(clip, me);
	}

	public async clipsUpdate(ps: Inputs['clipsUpdate'], me: Actor): Promise<Outputs['clipsUpdate']> {
		try {
			// 空文字列をnullにしたいので??は使わない
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			await this.deps.clipService.update(me, ps.clipId, ps.name, ps.isPublic, ps.description || null);
		} catch (e) {
			if (e instanceof ClipService.NoSuchClipError) {
				throw apiError(collectionsErrors.clipsUpdate.noSuchClip);
			}
			throw e;
		}

		return await this.deps.clipEntityService.pack(ps.clipId, me);
	}

	public async galleryFeatured(ps: Inputs['galleryFeatured'], me: Actor | null): Promise<Outputs['galleryFeatured']> {
		let postIds: string[];
		if (this.galleryPostsRankingCacheLastFetchedAt !== 0 && (Date.now() - this.galleryPostsRankingCacheLastFetchedAt < 1000 * 60 * 30)) {
			postIds = this.galleryPostsRankingCache;
		} else {
			postIds = await this.deps.featuredService.getGalleryPostsRanking(100);
			this.galleryPostsRankingCache = postIds;
			this.galleryPostsRankingCacheLastFetchedAt = Date.now();
		}

		postIds.sort((a, b) => a > b ? -1 : 1);
		const untilId = ps.untilId;
		if (untilId) {
			postIds = postIds.filter(id => id < untilId);
		}
		postIds = postIds.slice(0, ps.limit);

		if (postIds.length === 0) {
			return [];
		}

		const query = this.deps.galleryPostsRepository.createQueryBuilder('post')
			.where('post.id IN (:...postIds)', { postIds: postIds });

		const posts = await query.getMany();

		return await this.deps.galleryPostEntityService.packMany(posts, me);
	}

	public async galleryPopular(ps: Inputs['galleryPopular'], me: Actor | null): Promise<Outputs['galleryPopular']> {
		const query = this.deps.galleryPostsRepository.createQueryBuilder('post')
			.andWhere('post.likedCount > 0')
			.orderBy('post.likedCount', 'DESC');

		const posts = await query.limit(10).getMany();

		return await this.deps.galleryPostEntityService.packMany(posts, me);
	}

	public async galleryPosts(ps: Inputs['galleryPosts'], me: Actor | null): Promise<Outputs['galleryPosts']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.galleryPostsRepository.createQueryBuilder('post'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.innerJoinAndSelect('post.user', 'user');

		const posts = await query.limit(ps.limit).getMany();

		return await this.deps.galleryPostEntityService.packMany(posts, me);
	}

	public async galleryPostsCreate(ps: Inputs['galleryPostsCreate'], me: Actor): Promise<Outputs['galleryPostsCreate']> {
		const files = (await Promise.all(ps.fileIds.map(fileId =>
			this.deps.driveFilesRepository.findOneBy({
				id: fileId,
				userId: me.id,
			}),
		))).filter(x => x != null);

		if (files.length === 0) {
			throw new Error();
		}

		const post = await this.deps.galleryPostsRepository.insertOne(new MiGalleryPost({
			id: this.deps.idService.gen(),
			updatedAt: new Date(),
			title: ps.title,
			description: ps.description,
			userId: me.id,
			isSensitive: ps.isSensitive,
			fileIds: files.map(file => file.id),
		}));

		return await this.deps.galleryPostEntityService.pack(post, me);
	}

	public async galleryPostsDelete(ps: Inputs['galleryPostsDelete'], me: Actor): Promise<Outputs['galleryPostsDelete']> {
		const post = await this.deps.galleryPostsRepository.findOneBy({ id: ps.postId });

		if (post == null) {
			throw apiError(collectionsErrors.galleryPostsDelete.noSuchPost);
		}

		if (!await this.deps.roleService.isModerator(me) && post.userId !== me.id) {
			throw apiError(collectionsErrors.galleryPostsDelete.accessDenied);
		}

		await this.deps.galleryPostsRepository.delete(post.id);

		if (post.userId !== me.id) {
			const user = await this.deps.usersRepository.findOneByOrFail({ id: post.userId });
			this.deps.moderationLogService.log(me, 'deleteGalleryPost', {
				postId: post.id,
				postUserId: post.userId,
				postUserUsername: user.username,
				post,
			});
		}
	}

	public async galleryPostsLike(ps: Inputs['galleryPostsLike'], me: Actor): Promise<Outputs['galleryPostsLike']> {
		const post = await this.deps.galleryPostsRepository.findOneBy({ id: ps.postId });
		if (post == null) {
			throw apiError(collectionsErrors.galleryPostsLike.noSuchPost);
		}

		if (post.userId === me.id) {
			throw apiError(collectionsErrors.galleryPostsLike.yourPost);
		}

		// if already liked
		const exist = await this.deps.galleryLikesRepository.exists({
			where: {
				postId: post.id,
				userId: me.id,
			},
		});

		if (exist) {
			throw apiError(collectionsErrors.galleryPostsLike.alreadyLiked);
		}

		// Create like
		await this.deps.galleryLikesRepository.insert({
			id: this.deps.idService.gen(),
			postId: post.id,
			userId: me.id,
		});

		// ランキング更新
		if (Date.now() - this.deps.idService.parse(post.id).date.getTime() < GALLERY_POSTS_RANKING_WINDOW) {
			await this.deps.featuredService.updateGalleryPostsRanking(post.id, 1);
		}

		this.deps.galleryPostsRepository.increment({ id: post.id }, 'likedCount', 1);
	}

	public async galleryPostsShow(ps: Inputs['galleryPostsShow'], me: Actor | null): Promise<Outputs['galleryPostsShow']> {
		const post = await this.deps.galleryPostsRepository.findOneBy({
			id: ps.postId,
		});

		if (post == null) {
			throw apiError(collectionsErrors.galleryPostsShow.noSuchPost);
		}

		return await this.deps.galleryPostEntityService.pack(post, me);
	}

	public async galleryPostsUnlike(ps: Inputs['galleryPostsUnlike'], me: Actor): Promise<Outputs['galleryPostsUnlike']> {
		const post = await this.deps.galleryPostsRepository.findOneBy({ id: ps.postId });
		if (post == null) {
			throw apiError(collectionsErrors.galleryPostsUnlike.noSuchPost);
		}

		const exist = await this.deps.galleryLikesRepository.findOneBy({
			postId: post.id,
			userId: me.id,
		});

		if (exist == null) {
			throw apiError(collectionsErrors.galleryPostsUnlike.notLiked);
		}

		// Delete like
		await this.deps.galleryLikesRepository.delete(exist.id);

		// ランキング更新
		if (Date.now() - this.deps.idService.parse(post.id).date.getTime() < GALLERY_POSTS_RANKING_WINDOW) {
			await this.deps.featuredService.updateGalleryPostsRanking(post.id, -1);
		}

		this.deps.galleryPostsRepository.decrement({ id: post.id }, 'likedCount', 1);
	}

	public async galleryPostsUpdate(ps: Inputs['galleryPostsUpdate'], me: Actor): Promise<Outputs['galleryPostsUpdate']> {
		let files: Array<MiDriveFile> | undefined;

		if (ps.fileIds) {
			files = (await Promise.all(ps.fileIds.map(fileId =>
				this.deps.driveFilesRepository.findOneBy({
					id: fileId,
					userId: me.id,
				}),
			))).filter(x => x != null);

			if (files.length === 0) {
				throw new Error();
			}
		}

		await this.deps.galleryPostsRepository.update({
			id: ps.postId,
			userId: me.id,
		}, {
			updatedAt: new Date(),
			title: ps.title,
			description: ps.description,
			isSensitive: ps.isSensitive,
			fileIds: files ? files.map(file => file.id) : undefined,
		});

		const post = await this.deps.galleryPostsRepository.findOneByOrFail({ id: ps.postId });

		return await this.deps.galleryPostEntityService.pack(post, me);
	}

	public async iFavorites(ps: Inputs['iFavorites'], me: Actor): Promise<Outputs['iFavorites']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.noteFavoritesRepository.createQueryBuilder('favorite'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('favorite.userId = :meId', { meId: me.id })
			.leftJoinAndSelect('favorite.note', 'note');

		const favorites = await query
			.limit(ps.limit)
			.getMany();

		return await this.deps.noteFavoriteEntityService.packMany(favorites, me);
	}

	public async iGalleryLikes(ps: Inputs['iGalleryLikes'], me: Actor): Promise<Outputs['iGalleryLikes']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.galleryLikesRepository.createQueryBuilder('like'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('like.userId = :meId', { meId: me.id })
			.leftJoinAndSelect('like.post', 'post');

		const likes = await query
			.limit(ps.limit)
			.getMany();

		return await this.deps.galleryLikeEntityService.packMany(likes, me);
	}

	public async iGalleryPosts(ps: Inputs['iGalleryPosts'], me: Actor): Promise<Outputs['iGalleryPosts']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.galleryPostsRepository.createQueryBuilder('post'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('post.userId = :meId', { meId: me.id });

		const posts = await query
			.limit(ps.limit)
			.getMany();

		return await this.deps.galleryPostEntityService.packMany(posts, me);
	}

	public async notesClips(ps: Inputs['notesClips'], me: Actor | null): Promise<Outputs['notesClips']> {
		const note = await this.deps.getterService.getNote(ps.noteId).catch(err => {
			if (err !== null && typeof err === 'object' && 'id' in err && err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(collectionsErrors.notesClips.noSuchNote);
			throw err;
		});

		const clipNotes = await this.deps.clipNotesRepository.findBy({
			noteId: note.id,
		});

		const clips = await this.deps.clipsRepository.findBy({
			id: In(clipNotes.map(x => x.clipId)),
			isPublic: true,
		});

		return await this.deps.clipEntityService.packMany(clips, me);
	}

	public async notesFavoritesCreate(ps: Inputs['notesFavoritesCreate'], me: Actor): Promise<Outputs['notesFavoritesCreate']> {
		// Get favoritee
		const note = await this.deps.getterService.getNote(ps.noteId).catch(err => {
			if (err !== null && typeof err === 'object' && 'id' in err && err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(collectionsErrors.notesFavoritesCreate.noSuchNote);
			throw err;
		});

		// check visibility
		if (!await this.deps.noteEntityService.isVisibleForMe(note, me.id)) {
			throw apiError(collectionsErrors.notesFavoritesCreate.noSuchNote);
		}

		// if already favorited
		const exist = await this.deps.noteFavoritesRepository.exists({
			where: {
				noteId: note.id,
				userId: me.id,
			},
		});

		if (exist) {
			throw apiError(collectionsErrors.notesFavoritesCreate.alreadyFavorited);
		}

		// Create favorite
		await this.deps.noteFavoritesRepository.insert({
			id: this.deps.idService.gen(),
			noteId: note.id,
			userId: me.id,
		});

		if (note.userHost == null && note.userId !== me.id) {
			this.deps.achievementService.create(note.userId, 'myNoteFavorited1');
		}
	}

	public async notesFavoritesDelete(ps: Inputs['notesFavoritesDelete'], me: Actor): Promise<Outputs['notesFavoritesDelete']> {
		// Get favoritee
		const note = await this.deps.getterService.getNote(ps.noteId).catch(err => {
			if (err !== null && typeof err === 'object' && 'id' in err && err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(collectionsErrors.notesFavoritesDelete.noSuchNote);
			throw err;
		});

		// if already favorited
		const exist = await this.deps.noteFavoritesRepository.findOneBy({
			noteId: note.id,
			userId: me.id,
		});

		if (exist == null) {
			throw apiError(collectionsErrors.notesFavoritesDelete.notFavorited);
		}

		// Delete favorite
		await this.deps.noteFavoritesRepository.delete(exist.id);
	}

	public async usersClips(ps: Inputs['usersClips'], me: Actor | null): Promise<Outputs['usersClips']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.clipsRepository.createQueryBuilder('clip'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('clip.userId = :userId', { userId: ps.userId })
			.andWhere('clip.isPublic = true');

		const clips = await query
			.limit(ps.limit)
			.getMany();

		return await this.deps.clipEntityService.packMany(clips, me);
	}

	public async usersGalleryPosts(ps: Inputs['usersGalleryPosts'], me: Actor | null): Promise<Outputs['usersGalleryPosts']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.galleryPostsRepository.createQueryBuilder('post'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('post.userId = :userId', { userId: ps.userId });

		const posts = await query
			.limit(ps.limit)
			.getMany();

		return await this.deps.galleryPostEntityService.packMany(posts, me);
	}

	public async clipsDelete(ps: Inputs['clipsDelete'], me: Actor): Promise<void> {
		try { await this.deps.clipService.delete(me, ps.clipId); } catch (error) {
			if (error instanceof ClipService.NoSuchClipError) throw apiError(collectionsErrors.clipsDelete.noSuchClip);
			throw error;
		}
	}
	public async clipsAddNote(ps: Inputs['clipsAddNote'], me: Actor): Promise<void> {
		try { await this.deps.clipService.addNote(me, ps.clipId, ps.noteId); } catch (error) {
			if (error instanceof ClipService.NoSuchClipError) throw apiError(collectionsErrors.clipsAddNote.noSuchClip);
			if (error instanceof ClipService.NoSuchNoteError) throw apiError(collectionsErrors.clipsAddNote.noSuchNote);
			if (error instanceof ClipService.AlreadyAddedError) throw apiError(collectionsErrors.clipsAddNote.alreadyClipped);
			if (error instanceof ClipService.TooManyClipNotesError) throw apiError(collectionsErrors.clipsAddNote.tooManyClipNotes);
			throw error;
		}
	}
	public async clipsRemoveNote(ps: Inputs['clipsRemoveNote'], me: Actor): Promise<void> {
		try { await this.deps.clipService.removeNote(me, ps.clipId, ps.noteId); } catch (error) {
			if (error instanceof ClipService.NoSuchClipError) throw apiError(collectionsErrors.clipsRemoveNote.noSuchClip);
			if (error instanceof ClipService.NoSuchNoteError) throw apiError(collectionsErrors.clipsRemoveNote.noSuchNote);
			throw error;
		}
	}
	public async clipsFavorite(ps: Inputs['clipsFavorite'], me: Actor): Promise<void> {
		const clip = await this.deps.clipsRepository.findOneBy({ id: ps.clipId });
		if (clip === null || (clip.userId !== me.id && !clip.isPublic)) throw apiError(collectionsErrors.clipsFavorite.noSuchClip);
		if (await this.deps.clipFavoritesRepository.exists({ where: { clipId: clip.id, userId: me.id } })) throw apiError(collectionsErrors.clipsFavorite.alreadyFavorited);
		await this.deps.clipFavoritesRepository.insert({ id: this.deps.idService.gen(), clipId: clip.id, userId: me.id });
	}
	public async clipsUnfavorite(ps: Inputs['clipsUnfavorite'], me: Actor): Promise<void> {
		const clip = await this.deps.clipsRepository.findOneBy({ id: ps.clipId });
		if (clip === null) throw apiError(collectionsErrors.clipsUnfavorite.noSuchClip);
		// Removal stays possible after another user's previously public clip becomes private.
		const favorite = await this.deps.clipFavoritesRepository.findOneBy({ clipId: clip.id, userId: me.id });
		if (favorite === null) throw apiError(collectionsErrors.clipsUnfavorite.notFavorited);
		await this.deps.clipFavoritesRepository.delete(favorite.id);
	}
}

export function createCollectionsOperations<Actor extends ApiActor>(deps: CollectionsDependencies<Actor>): CollectionsOperations<Actor> {
	return new CollectionsApplicationService(deps);
}
