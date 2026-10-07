/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import type { ModuleRef } from '@nestjs/core';
import type { FollowRequestsRepository, NotesRepository, UsersRepository, MiNote, MiUser } from '@/models/_.js';
import type { CacheService } from '@/core/CacheService.js';
import type { Packed } from '@features/index/contract/packed.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { RoleEntityService } from '@features/roles/backend/serializers/RoleEntityService.js';
import type { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import { NotificationEntityService } from '@features/notifications/backend/serializers/NotificationEntityService.js';

const meId = 'me';
const notifierId = 'notifier';
const noteId = 'note';
const createdAt = '2026-01-02T03:04:05.000Z';

const packedUser = { id: notifierId, host: null } as unknown as Packed<'UserLite'>;
const packedNote = { id: noteId, user: { id: notifierId, host: null } } as unknown as Packed<'Note'>;

function createService() {
	const userEntityService = {
		pack: vi.fn(async (userId: MiUser['id']) => userId === notifierId ? packedUser : null),
		packMany: vi.fn(async (users: MiUser[]) => users.map(() => packedUser)),
	};
	const noteEntityService = {
		pack: vi.fn(async () => packedNote),
		packMany: vi.fn(async (notes: MiNote[]) => notes.map(() => packedNote)),
	};
	const roleEntityService = { pack: vi.fn(async () => null) };
	const chatEntityService = { packRoomInvitation: vi.fn(async () => null) };
	const services = new Map<string, unknown>([
		['UserEntityService', userEntityService],
		['NoteEntityService', noteEntityService],
		['RoleEntityService', roleEntityService],
		['ChatEntityService', chatEntityService],
	]);
	const moduleRef = { get: vi.fn((token: string) => services.get(token)) };
	const notesRepository = { find: vi.fn(async () => [{ id: noteId }]) };
	const usersRepository = {
		find: vi.fn(async () => [{ id: notifierId, host: null, isSuspended: false }]),
	};
	const followRequestsRepository = { find: vi.fn(async () => [{ followerId: notifierId }]) };
	const cacheService = {
		userMutingsCache: { fetch: vi.fn(async () => new Set<string>()) },
		userProfileCache: { fetch: vi.fn(async () => ({ mutedInstances: [] })) },
	};

	const service = new NotificationEntityService(
		moduleRef as unknown as ModuleRef,
		notesRepository as unknown as NotesRepository,
		usersRepository as unknown as UsersRepository,
		followRequestsRepository as unknown as FollowRequestsRepository,
		cacheService as unknown as CacheService,
	);
	service.onModuleInit();

	return {
		service,
		moduleRef,
		userEntityService: userEntityService as unknown as UserEntityService,
		noteEntityService: noteEntityService as unknown as NoteEntityService,
		roleEntityService: roleEntityService as unknown as RoleEntityService,
		chatEntityService: chatEntityService as unknown as ChatEntityService,
	};
}

describe('NotificationEntityService', () => {
	test('packs a notification with its notifier and note', async () => {
		const { service } = createService();
		const result = await service.pack({ type: 'note', id: 'notification', createdAt, notifierId, noteId }, meId, { checkValidNotifier: false });

		expect(result).toMatchObject({
			id: 'notification',
			createdAt,
			type: 'note',
			user: packedUser,
			userId: notifierId,
			note: packedNote,
		});
	});

	test('packs a variant without a user', async () => {
		const { service } = createService();
		const result = await service.pack({ type: 'login', id: 'notification', createdAt }, meId, { checkValidNotifier: false });

		expect(result).toEqual({ id: 'notification', createdAt, type: 'login', userId: undefined });
	});

	test('preserves notifier fields on chat invitation notifications', async () => {
		const { service, chatEntityService } = createService();
		const invitation = { id: 'invitation' };
		vi.mocked(chatEntityService.packRoomInvitation).mockResolvedValueOnce(invitation as never);
		const result = await service.pack({
			type: 'chatRoomInvitationReceived', id: 'notification', createdAt, notifierId, invitationId: 'invitation',
		}, meId, { checkValidNotifier: false });

		expect(result).toMatchObject({ type: 'chatRoomInvitationReceived', user: packedUser, userId: notifierId, invitation });
	});

	test('preserves users and reactions in grouped notifications', async () => {
		const { service } = createService();
		const packedOtherUser = { id: 'other', host: null } as unknown as Packed<'UserLite'>;
		const result = await service.pack({
			type: 'reaction:grouped', id: 'notification', createdAt, noteId,
			reactions: [{ userId: notifierId, reaction: ':a:' }, { userId: 'other', reaction: ':b:' }],
		}, meId, { checkValidNotifier: false }, {
			packedNotes: new Map([[noteId, packedNote]]),
			packedUsers: new Map([[notifierId, packedUser], ['other', packedOtherUser]]),
		});

		expect(result).toMatchObject({
			type: 'reaction:grouped',
			note: packedNote,
			reactions: [
				{ user: packedUser, reaction: ':a:' },
				{ user: packedOtherUser, reaction: ':b:' },
			],
		});

		const groupedRenotes = await service.pack({
			type: 'renote:grouped', id: 'renote-notification', createdAt, noteId,
			userIds: [notifierId, 'deleted-user'],
		}, meId, { checkValidNotifier: false }, {
			packedNotes: new Map([[noteId, packedNote]]),
			packedUsers: new Map([[notifierId, packedUser]]),
		});
		expect(groupedRenotes).toMatchObject({ type: 'renote:grouped', note: packedNote, users: [packedUser] });
	});

	test('filters notifications when a hinted note or user is missing', async () => {
		const { service } = createService();
		const notification = { type: 'mention', id: 'notification', createdAt, notifierId, noteId } as const;
		const missingNote = await service.pack(notification, meId, { checkValidNotifier: false }, {
			packedNotes: new Map(),
			packedUsers: new Map([[notifierId, packedUser]]),
		});
		const missingUser = await service.pack(notification, meId, { checkValidNotifier: false }, {
			packedNotes: new Map([[noteId, packedNote]]),
			packedUsers: new Map(),
		});

		expect(missingNote).toBeNull();
		expect(missingUser).toBeNull();
	});

	test('does not load or disclose a draft for failed scheduled posts', async () => {
		const { service, moduleRef } = createService();
		const result = await service.pack({ type: 'scheduledNotePostFailed', id: 'notification', createdAt, noteDraftId: 'private-draft' }, meId, { checkValidNotifier: false });

		expect(moduleRef.get).not.toHaveBeenCalledWith('NoteDraftEntityService');
		expect(result).toEqual({ id: 'notification', createdAt, type: 'scheduledNotePostFailed', userId: undefined });
		expect(result).not.toHaveProperty('noteDraft');
	});

	test('packMany returns serialized notification rows', async () => {
		const { service } = createService();
		const result = await service.packMany([{ type: 'follow', id: 'notification', createdAt, notifierId }], meId);

		expect(result).toEqual([{
			id: 'notification',
			createdAt,
			type: 'follow',
			user: packedUser,
			userId: notifierId,
		}]);
		expect(result[0]).not.toHaveProperty('notifierId');
	});
});
