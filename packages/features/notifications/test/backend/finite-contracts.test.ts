/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import { createProcedureClient } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { type ModuleRef } from '@nestjs/core';
import { createCreateProcedure } from '../../backend/index.js';
import { groupedNotificationTypes } from '../../backend/notification-types.schema.js';

import { NotificationEntityService } from '../../backend/serializers/NotificationEntityService.js';

import { packedSchemas } from '../../../index/backend/packed.schema.js';
import { unregisterContract as nativeContract1 } from '../../backend/endpoints/sw/unregister.contract.js';
import { unregisterContract as nativeContract2 } from '../../backend/endpoints/sw/unregister.contract.js';
import { listContract as nativeContract3 } from '../../backend/endpoints/i/notifications.contract.js';
import { groupedContract as nativeContract4 } from '../../backend/endpoints/i/notifications-grouped.contract.js';
import { registerContract as nativeContract5 } from '../../backend/endpoints/sw/register.contract.js';
import { registerContract as nativeContract6 } from '../../backend/endpoints/sw/register.contract.js';
import { registerContract as nativeContract7 } from '../../backend/endpoints/sw/register.contract.js';
import { showRegistrationContract as nativeContract8 } from '../../backend/endpoints/sw/show-registration.contract.js';
import { showRegistrationContract as nativeContract9 } from '../../backend/endpoints/sw/show-registration.contract.js';
import { showRegistrationContract as nativeContract10 } from '../../backend/endpoints/sw/show-registration.contract.js';
import { updateRegistrationContract as nativeContract11 } from '../../backend/endpoints/sw/update-registration.contract.js';
import { updateRegistrationContract as nativeContract12 } from '../../backend/endpoints/sw/update-registration.contract.js';
import { updateRegistrationContract as nativeContract13 } from '../../backend/endpoints/sw/update-registration.contract.js';
import type { Packed } from '@features/index/backend/packed.schema.js';
import type { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import type { RoleEntityService } from '@features/roles/backend/serializers/RoleEntityService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { MiGroupedNotification } from '../../backend/models/Notification.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S { if (schema === undefined) throw new Error('Missing native schema'); return schema; }

const packedNotificationSchema = packedSchemas.Notification;
const unregisterInput = requiredSchema(nativeContract1['~orpc'].inputSchema);
const unregisterDefinition = nativeContract2;
const listInput = requiredSchema(nativeContract3['~orpc'].inputSchema);
const groupedListInput = requiredSchema(nativeContract4['~orpc'].inputSchema);
const registerDefinition = nativeContract5;
const registerInput = requiredSchema(nativeContract6['~orpc'].inputSchema);
const registerOutput = requiredSchema(nativeContract7['~orpc'].outputSchema);
const showDefinition = nativeContract8;
const showInput = requiredSchema(nativeContract9['~orpc'].inputSchema);
const showOutput = requiredSchema(nativeContract10['~orpc'].outputSchema);
const updateDefinition = nativeContract11;
const updateInput = requiredSchema(nativeContract12['~orpc'].inputSchema);
const updateOutput = requiredSchema(nativeContract13['~orpc'].outputSchema);

const createdAt = '2026-10-07T00:00:00.000Z';
const user = { id: 'user123', name: null, username: 'fixture', host: null, avatarUrl: 'https://example.com/avatar.png', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const } satisfies Packed<'UserLite'>;
const note = { id: 'note123', createdAt, text: null, userId: user.id, user, visibility: 'public' as const, reactionAcceptance: null, reactionEmojis: {}, reactions: {}, reactionCount: 0, renoteCount: 0, repliesCount: 0 } satisfies Packed<'Note'>;
const draft = { id: 'draft123', createdAt, text: 'Draft', userId: user.id, user, visibility: 'public', reactionAcceptance: null, cw: null, replyId: null, renoteId: null, visibleUserIds: [], fileIds: [], hashtag: null, poll: null, channelId: null, localOnly: false, scheduledAt: null, isActuallyScheduled: false } satisfies Packed<'NoteDraft'>;
const role = { id: 'role123', name: 'Fixture', color: null, iconUrl: null, description: '', isModerator: false, isAdministrator: false, displayOrder: 0, createdAt, updatedAt: createdAt, target: 'manual' as const, condFormula: { id: 'formula123', type: 'isLocal' as const }, isPublic: true, isExplorable: true, asBadge: false, preserveAssignmentOnMoveAccount: false, canEditMembersByModerator: false, policies: {}, usersCount: 1 } satisfies Packed<'Role'>;
const invitation = { id: 'invite123', createdAt, userId: user.id, user, roomId: 'room123', room: { id: 'room123', createdAt, ownerId: user.id, owner: user, name: 'Fixture', description: '' } } satisfies Packed<'ChatRoomInvitation'>;
const base = { id: 'notification123', createdAt };
const fromUser = { ...base, notifierId: user.id };
const onNote = { ...fromUser, noteId: note.id };
const fixtures: MiGroupedNotification[] = [
	{ ...onNote, type: 'note' }, { ...fromUser, type: 'follow' }, { ...onNote, type: 'mention' },
	{ ...onNote, type: 'reply' }, { ...onNote, type: 'renote', targetNoteId: note.id },
	{ ...onNote, type: 'quote' }, { ...onNote, type: 'reaction', reaction: '🔥' },
	{ ...onNote, type: 'pollEnded' }, { ...base, type: 'scheduledNotePosted', noteId: note.id },
	{ ...base, type: 'scheduledNotePostFailed', noteDraftId: 'draft123' },
	{ ...fromUser, type: 'receiveFollowRequest' }, { ...fromUser, type: 'followRequestAccepted', message: null },
	{ ...base, type: 'roleAssigned', roleId: role.id },
	{ ...fromUser, type: 'chatRoomInvitationReceived', invitationId: invitation.id },
	{ ...base, type: 'achievementEarned', achievement: 'notes1' },
	{ ...base, type: 'exportCompleted', exportedEntity: 'note', fileId: 'file123' },
	{ ...base, type: 'login' }, { ...base, type: 'createToken' },
	{ ...base, type: 'app', customBody: 'Fixture', customHeader: null, customIcon: null, appAccessTokenId: null },
	{ ...base, type: 'test' },
	{ ...base, type: 'reaction:grouped', noteId: note.id, reactions: [{ userId: user.id, reaction: '🔥' }] },
	{ ...base, type: 'renote:grouped', noteId: note.id, userIds: [user.id] },
];

function serializerFixture() {
	const moduleRef = mockDeep<ModuleRef>();
	const users = mockDeep<UserEntityService>();
	const notes = mockDeep<NoteEntityService>();
	const roles = mockDeep<RoleEntityService>();
	const chat = mockDeep<ChatEntityService>();
	moduleRef.get.mockReturnValueOnce(users).mockReturnValueOnce(notes).mockReturnValueOnce(roles).mockReturnValueOnce(chat);
	users.pack.mockResolvedValue(user);
	notes.pack.mockResolvedValue(note);
	roles.pack.mockResolvedValue(role);
	chat.packRoomInvitation.mockResolvedValue(invitation);
	const serializer = new NotificationEntityService(moduleRef, mockDeep(), mockDeep(), mockDeep(), mockDeep());
	serializer.onModuleInit();
	return { serializer, users, notes, roles, chat };
}

test('notification fixtures cover every producer variant', () => {
	expect(fixtures.map(fixture => fixture.type)).toEqual(groupedNotificationTypes);
});

test.each(fixtures)('real notification serializer has a finite outer shape: $type', async fixture => {
	const { serializer } = serializerFixture();
	const result = await serializer.pack(fixture, user.id, { checkValidNotifier: false });
	expect(result).not.toBeNull();
	expect(v.parse(packedNotificationSchema, result)).toEqual(result);
	expect(v.parse(packedNotificationSchema, JSON.parse(JSON.stringify(result)))).toEqual(JSON.parse(JSON.stringify(result)));
	expect(v.safeParse(packedNotificationSchema, { ...result, future: true }).success).toBe(false);
	expect(v.safeParse(packedNotificationSchema, { ...result, id: 7 }).success).toBe(false);
	expect(v.safeParse(packedNotificationSchema, { ...result, createdAt: null }).success).toBe(false);
	if (fixture.type === 'app') {
		for (const value of [{ ...result, body: null }, { ...result, header: 7 }, { ...result, icon: false }]) expect(v.safeParse(packedNotificationSchema, value).success).toBe(false);
	}
	if (fixture.type === 'followRequestAccepted') {
		expect(v.safeParse(packedNotificationSchema, { ...result, message: 'Accepted' }).success).toBe(true);
		expect(v.safeParse(packedNotificationSchema, { ...result, message: 7 }).success).toBe(false);
	}
	const { id: _id, ...missingId } = result!;
	expect(v.safeParse(packedNotificationSchema, missingId).success).toBe(false);
	if (!('notifierId' in fixture) && !fixture.type.endsWith(':grouped')) {
		expect(Object.hasOwn(result!, 'userId')).toBe(true);
		expect(result).toHaveProperty('userId', undefined);
		for (const value of ['user123', null, 7]) expect(v.safeParse(packedNotificationSchema, { ...result, userId: value }).success).toBe(false);
	}
	if ('notifierId' in fixture) {
		expect(result).toMatchObject({ userId: user.id, user });
		if (result == null || !('user' in result)) throw new Error('Notifier notification must pack its user');
		const { user: _user, ...missingUser } = result;
		expect(v.safeParse(packedNotificationSchema, missingUser).success).toBe(false);
	}
	if (fixture.type === 'reaction:grouped') {
		expect(v.safeParse(packedNotificationSchema, { ...result, reactions: [{ user, reaction: '🔥', future: true }] }).success).toBe(false);
		for (const reaction of [{ user }, { user, reaction: null }, { reaction: '🔥' }]) expect(v.safeParse(packedNotificationSchema, { ...result, reactions: [reaction] }).success).toBe(false);
	}
});

test('serializer retains deleted-note and missing-invitation suppression', async () => {
	const { serializer, chat } = serializerFixture();
	expect(await serializer.pack(fixtures[0], user.id, { checkValidNotifier: false }, { packedNotes: new Map(), packedUsers: new Map([[user.id, user]]) })).toBeNull();
	chat.packRoomInvitation.mockRejectedValue(new Error('Deleted invitation'));
	expect(await serializer.pack(fixtures[13], user.id, { checkValidNotifier: false })).toBeNull();
	expect(await serializer.pack({ ...base, type: 'reaction:grouped', noteId: note.id, reactions: [] }, user.id, { checkValidNotifier: false })).toBeNull();
});

const subscription = { userId: user.id, endpoint: 'https://push.example.com/fixture', sendReadMessage: true };
const registerParams = { endpoint: subscription.endpoint, auth: 'fixture-auth', publickey: 'fixture-key' };

test('native sw inputs strip extras and preserve defaults; outputs reject missing, mistyped and extra fields', () => {
	expectTypeOf<v.InferOutput<typeof registerOutput>>().toEqualTypeOf<{ userId: string; endpoint: string; sendReadMessage: boolean; state: 'subscribed' | 'already-subscribed'; key: string | null }>();
	expect(v.parse(registerInput, { ...registerParams, future: true })).toEqual({ ...registerParams, sendReadMessage: false });
	expect(v.parse(showInput, { endpoint: subscription.endpoint, future: true })).toEqual({ endpoint: subscription.endpoint });
	expect(v.parse(updateInput, { endpoint: subscription.endpoint, future: true })).toEqual({ endpoint: subscription.endpoint });
	for (const schema of [registerInput, showInput, updateInput]) {
		expect(v.safeParse(schema, {}).success).toBe(false);
		expect(v.safeParse(schema, { ...registerParams, endpoint: 7 }).success).toBe(false);
	}
	for (const schema of [registerInput, updateInput]) expect(v.safeParse(schema, { ...registerParams, sendReadMessage: null }).success).toBe(false);
	expect(v.parse(showOutput, null)).toBeNull();
	for (const [schema, value] of [[registerOutput, { ...subscription, state: 'subscribed', key: null }], [showOutput, subscription], [updateOutput, subscription]] as const) {
		expect(v.parse(schema, value)).toEqual(value);
		for (const bad of [{ ...value, future: true }, { ...value, userId: 7 }, { ...value, sendReadMessage: null }]) expect(v.safeParse(schema, bad).success).toBe(false);
		const { endpoint: _endpoint, ...missing } = value;
		expect(v.safeParse(schema, missing).success).toBe(false);
	}
	expect(v.safeParse(registerOutput, { ...subscription, key: null }).success).toBe(false);
	expect(v.parse(registerOutput, { ...subscription, state: 'subscribed', key: 'public-key' })).toHaveProperty('key', 'public-key');
	for (const state of [undefined, 'unknown']) expect(v.safeParse(registerOutput, { ...subscription, state, key: null }).success).toBe(false);
	for (const schema of [registerOutput, updateOutput]) expect(v.safeParse(schema, null).success).toBe(false);
});

test('real create feature retains token fallbacks and explicit optional values', async () => {
	const deps = mockDeep<Parameters<typeof createCreateProcedure>[0]>();
	const procedure = createCreateProcedure(deps);
	const token = { id: 'token123', name: 'Token title', iconUrl: 'https://example.com/token.png', permission: ['write:notifications'] };
	const context = mockDeep<ApiContext<MiLocalUser>>({ credential: 'fixture', ip: '127.0.0.1', headers: {} });
	context.services.authenticate.mockResolvedValue([mockDeep<MiLocalUser>({ id: user.id, isSuspended: false, movedToUri: null }), token]);
	const feature = createProcedureClient(procedure, { context });
	await feature({ body: 'Fixture' });
	expect(deps.createAppNotification).toHaveBeenLastCalledWith(user.id, { appAccessTokenId: 'token123', customBody: 'Fixture', customHeader: token.name, customIcon: token.iconUrl });
	await feature({ body: 'Fixture', header: 'Title', icon: '' });
	expect(deps.createAppNotification).toHaveBeenLastCalledWith(user.id, { appAccessTokenId: 'token123', customBody: 'Fixture', customHeader: 'Title', customIcon: '' });
});
