/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { DI } from '@/di-symbols.js';
import { UserFollowingService } from '../services/UserFollowingService.js';
import { UserMutingService } from '../services/UserMutingService.js';
import { UserRenoteMutingService } from '../services/UserRenoteMutingService.js';
import { UserListService } from '../services/UserListService.js';
import { relationshipsErrors } from './relationships.errors.js';
import type { RelationshipsInputs } from './relationships.contract.js';
import type { BlockingsRepository, MutingsRepository, RenoteMutingsRepository, UserListsRepository, UserListFavoritesRepository, UserListMembershipsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

type PublicError = { message: string; code: string; id: string };

function hasErrorId(error: unknown, id: string): boolean {
	return error !== null && typeof error === 'object' && 'id' in error && error.id === id;
}

@Injectable()
export class RelationshipsCommandOperations {
	constructor(
		private readonly getter: GetterService,
		private readonly following: UserFollowingService,
		private readonly muting: UserMutingService,
		private readonly renoteMuting: UserRenoteMutingService,
		private readonly userListService: UserListService,
		private readonly ids: IdService,
		@Inject(DI.mutingsRepository) private readonly mutings: MutingsRepository,
		@Inject(DI.renoteMutingsRepository) private readonly renoteMutings: RenoteMutingsRepository,
		@Inject(DI.userListsRepository) private readonly lists: UserListsRepository,
		@Inject(DI.userListFavoritesRepository) private readonly favorites: UserListFavoritesRepository,
		@Inject(DI.userListMembershipsRepository) private readonly memberships: UserListMembershipsRepository,
		@Inject(DI.blockingsRepository) private readonly blockings: BlockingsRepository,
	) {}

	private async getUser(userId: string, error: PublicError) {
		try { return await this.getter.getUser(userId); } catch (failure) {
			if (hasErrorId(failure, '15348ddd-432d-49c2-8a5a-8069753becff')) throw apiError(error);
			throw failure;
		}
	}

	async accept(input: RelationshipsInputs['following/requests/accept'], actor: MiLocalUser) {
		const errors = relationshipsErrors['following/requests/accept'];
		const follower = await this.getUser(input.userId, errors.noSuchUser);
		try { await this.following.acceptFollowRequest(actor, follower); } catch (error) {
			if (hasErrorId(error, '8884c2dd-5795-4ac9-b27e-6a01d38190f9')) throw apiError(errors.noFollowRequest);
			throw error;
		}
	}
	async reject(input: RelationshipsInputs['following/requests/reject'], actor: MiLocalUser) {
		const follower = await this.getUser(input.userId, relationshipsErrors['following/requests/reject'].noSuchUser);
		await this.following.rejectFollowRequest(actor, follower);
	}
	async deleteMute(input: RelationshipsInputs['mute/delete'], actor: MiLocalUser) {
		const errors = relationshipsErrors['mute/delete'];
		if (actor.id === input.userId) throw apiError(errors.muteeIsYourself);
		const mutee = await this.getUser(input.userId, errors.noSuchUser);
		const existing = await this.mutings.findOneBy({ muterId: actor.id, muteeId: mutee.id });
		if (existing == null) throw apiError(errors.notMuting);
		await this.muting.unmute([existing]);
	}
	async createRenoteMute(input: RelationshipsInputs['renote-mute/create'], actor: MiLocalUser) {
		const errors = relationshipsErrors['renote-mute/create'];
		if (actor.id === input.userId) throw apiError(errors.muteeIsYourself);
		const mutee = await this.getUser(input.userId, errors.noSuchUser);
		if (await this.renoteMutings.exists({ where: { muterId: actor.id, muteeId: mutee.id } })) throw apiError(errors.alreadyMuting);
		await this.renoteMuting.mute(actor, mutee);
	}
	async deleteRenoteMute(input: RelationshipsInputs['renote-mute/delete'], actor: MiLocalUser) {
		const errors = relationshipsErrors['renote-mute/delete'];
		if (actor.id === input.userId) throw apiError(errors.muteeIsYourself);
		const mutee = await this.getUser(input.userId, errors.noSuchUser);
		const existing = await this.renoteMutings.findOneBy({ muterId: actor.id, muteeId: mutee.id });
		if (existing == null) throw apiError(errors.notMuting);
		await this.renoteMuting.unmute([existing]);
	}
	async deleteList(input: RelationshipsInputs['users/lists/delete'], actor: MiLocalUser) {
		const list = await this.lists.findOneBy({ id: input.listId, userId: actor.id });
		if (list == null) throw apiError(relationshipsErrors['users/lists/delete'].noSuchList);
		await this.lists.delete(list.id);
	}
	async favorite(input: RelationshipsInputs['users/lists/favorite'], actor: MiLocalUser) {
		const errors = relationshipsErrors['users/lists/favorite'];
		if (!await this.lists.exists({ where: { id: input.listId, isPublic: true } })) throw apiError(errors.noSuchList);
		if (await this.favorites.exists({ where: { userId: actor.id, userListId: input.listId } })) throw apiError(errors.alreadyFavorited);
		await this.favorites.insert({ id: this.ids.gen(), userId: actor.id, userListId: input.listId });
	}
	async pull(input: RelationshipsInputs['users/lists/pull'], actor: MiLocalUser) {
		const errors = relationshipsErrors['users/lists/pull'];
		const list = await this.lists.findOneBy({ id: input.listId, userId: actor.id });
		if (list == null) throw apiError(errors.noSuchList);
		const user = await this.getUser(input.userId, errors.noSuchUser);
		await this.userListService.removeMember(user, list);
	}
	async push(input: RelationshipsInputs['users/lists/push'], actor: MiLocalUser) {
		const errors = relationshipsErrors['users/lists/push'];
		const list = await this.lists.findOneBy({ id: input.listId, userId: actor.id });
		if (list == null) throw apiError(errors.noSuchList);
		const user = await this.getUser(input.userId, errors.noSuchUser);
		if (user.id !== actor.id && await this.blockings.exists({ where: { blockerId: user.id, blockeeId: actor.id } })) throw apiError(errors.youHaveBeenBlocked);
		if (await this.memberships.exists({ where: { userListId: list.id, userId: user.id } })) throw apiError(errors.alreadyAdded);
		try { await this.userListService.addMember(user, list, actor); } catch (error) {
			if (error instanceof UserListService.TooManyUsersError) throw apiError(errors.tooManyUsers);
			throw error;
		}
	}
	async unfavorite(input: RelationshipsInputs['users/lists/unfavorite'], actor: MiLocalUser) {
		const errors = relationshipsErrors['users/lists/unfavorite'];
		if (!await this.lists.exists({ where: { id: input.listId, isPublic: true } })) throw apiError(errors.noSuchList);
		const favorite = await this.favorites.findOneBy({ userListId: input.listId, userId: actor.id });
		if (favorite === null) throw apiError(errors.notFavorited);
		await this.favorites.delete({ id: favorite.id });
	}
	async updateMembership(input: RelationshipsInputs['users/lists/update-membership'], actor: MiLocalUser) {
		const errors = relationshipsErrors['users/lists/update-membership'];
		const list = await this.lists.findOneBy({ id: input.listId, userId: actor.id });
		if (list == null) throw apiError(errors.noSuchList);
		const user = await this.getUser(input.userId, errors.noSuchUser);
		await this.userListService.updateMembership(user, list, { withReplies: input.withReplies });
	}
}
