/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { ModuleRef } from '@nestjs/core';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import { packedNotificationSchema } from '../../contract/packed.js';
import { notificationsInputs, notificationsContract } from '../../contract/index.js';
import { voidSwUnregisterInput as unregisterInput, voidSwUnregisterDefinition as unregisterDefinition } from '../../contract/void-endpoint-definitions.js';
import { portableINotificationsInput as listInput, portableINotificationsGroupedInput as groupedListInput } from '../../contract/portable-constant-endpoint-definitions.js';
import { createNotifications } from '../../backend/index.js';
import { EndpointImplementation as UnregisterEndpoint } from '../../backend/endpoints/sw/unregister.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { groupedNotificationTypes } from '../../contract/notification-types.js';
import { inlineSwRegisterDefinition as registerDefinition, inlineSwRegisterInput as registerInput, inlineSwRegisterOutput as registerOutput, inlineSwShowRegistrationDefinition as showDefinition, inlineSwShowRegistrationInput as showInput, inlineSwShowRegistrationOutput as showOutput, inlineSwUpdateRegistrationDefinition as updateDefinition, inlineSwUpdateRegistrationInput as updateInput, inlineSwUpdateRegistrationOutput as updateOutput } from '../../contract/endpoint-definitions.js';
import { NotificationEntityService } from '../../backend/serializers/NotificationEntityService.js';
import type { MiGroupedNotification } from '../../backend/models/Notification.js';
import { EndpointImplementation as RegisterEndpoint } from '../../backend/endpoints/sw/register.js';
import { EndpointImplementation as ShowEndpoint } from '../../backend/endpoints/sw/show-registration.js';
import { EndpointImplementation as UpdateEndpoint } from '../../backend/endpoints/sw/update-registration.js';
import type { PushNotificationService } from '../../backend/services/PushNotificationService.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import type { MiMeta, SwSubscriptionsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { RoleEntityService } from '@features/roles/backend/serializers/RoleEntityService.js';
import type { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { Packed } from '@features/index/contract/packed.js';

const createdAt = '2026-10-07T00:00:00.000Z';
const user = { id: 'user123', name: null, username: 'fixture', host: null, avatarUrl: 'https://example.com/avatar.png', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const } satisfies Packed<'UserLite'>;
const note = { id: 'note123', createdAt, text: null, userId: user.id, user, visibility: 'public' as const, reactionAcceptance: null, reactionEmojis: {}, reactions: {}, reactionCount: 0, renoteCount: 0, repliesCount: 0 } satisfies Packed<'Note'>;
const draft = { ...note, cw: null, replyId: null, renoteId: null, visibleUserIds: [], fileIds: [], hashtag: null, poll: null, channelId: null, localOnly: false, scheduledAt: null, isActuallyScheduled: false } satisfies Packed<'NoteDraft'>;
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

test('finite notification closure preserves nested compositions and optional draft semantics', async () => {
	const { serializer } = serializerFixture();
	const packed = await serializer.pack(fixtures[0], user.id, { checkValidNotifier: false });
	expect(v.safeParse(packedNotificationSchema, { ...packed, user: { ...user, nestedFuture: true }, note: { ...note, nestedFuture: true } }).success).toBe(true);
	const draftless = await serializer.pack(fixtures[9], user.id, { checkValidNotifier: false });
	expect(v.safeParse(packedNotificationSchema, { ...draftless, noteDraft: undefined }).success).toBe(true);
	expect(v.safeParse(packedNotificationSchema, { ...draftless, noteDraft: draft }).success).toBe(true);
	expect(v.safeParse(packedNotificationSchema, { ...draftless, noteDraft: null }).success).toBe(false);
	const json = toLegacyJsonSchema(packedNotificationSchema, { target: 'openapi-3.0', typeMode: 'output' });
	expect(json.oneOf).toHaveLength(22);
	for (const variant of json.oneOf!) {
		if (typeof variant === 'boolean') throw new Error('Notification variant must have an object schema');
		expect(variant.additionalProperties).toBe(false);
	}
	const failed = json.oneOf!.find(variant => {
		if (typeof variant === 'boolean') return false;
		const discriminator = variant.properties?.type;
		return discriminator !== undefined && typeof discriminator !== 'boolean' && discriminator.enum?.[0] === 'scheduledNotePostFailed';
	});
	if (failed === undefined || typeof failed === 'boolean') throw new Error('Missing scheduledNotePostFailed variant');
	expect(failed.properties?.userId).toEqual({ not: {} });
	expect(failed.required).not.toContain('userId');
	expect(failed.required).not.toContain('noteDraft');
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

test('sw JSON input projections remain open and finite response projections close their objects', () => {
	for (const projected of [projectEndpointContract(registerDefinition), projectEndpointContract(showDefinition), projectEndpointContract(updateDefinition)]) {
		expect(projected.input.additionalProperties).toBeUndefined();
		expect(projected.input.required).toContain('endpoint');
		expect(projected.response).toMatchObject({ additionalProperties: false });
	}
	expect(projectEndpointContract(registerDefinition).input.properties?.sendReadMessage).toEqual({ type: 'boolean', default: false });
	expect(projectEndpointContract(registerDefinition).response?.required).toContain('state');
	expect(projectEndpointContract(showDefinition).response?.nullable).toBe(true);
});

test('legacy sw HTTP keeps extra input keys and raw response keys independently of native parsing', async () => {
	const params = { ...registerParams, i: 'transport', future: true };
	const response = { ...subscription, state: 'subscribed' as const, key: null, future: true };
	const handler = async (ps: object) => { expect(ps).toBe(params); return response; };
	const cases = [
		{ endpoint: new ContractEndpoint({}, projectEndpointContract(registerDefinition), handler), schema: registerOutput },
		{ endpoint: new ContractEndpoint({}, projectEndpointContract(showDefinition), handler), schema: showOutput },
		{ endpoint: new ContractEndpoint({}, projectEndpointContract(updateDefinition), handler), schema: updateOutput },
	];
	for (const { endpoint, schema } of cases) {
		expect(await endpoint.exec(params, null, null)).toBe(response);
		expect(v.safeParse(schema, response).success).toBe(false);
		await expect(endpoint.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	}
});

test('real sw handlers retain existing/new registration, defaults, null, update and errors', async () => {
	const repository = mockDeep<SwSubscriptionsRepository>();
	const push = mockDeep<PushNotificationService>();
	const ids = mockDeep<IdService>();
	const me = mockDeep<MiLocalUser>({ id: user.id });
	const settings = mockDeep<MiMeta>({ swPublicKey: null });
	ids.gen.mockReturnValue('subscription123');
	push.isValidEndpoint.mockReturnValue(true);
	const existing = { ...subscription, id: 'subscription123', user: null, auth: registerParams.auth, publickey: registerParams.publickey };
	repository.findOneBy.mockResolvedValue(existing);
	const register = new RegisterEndpoint(settings, repository, ids, push);
	const already = await register.exec({ ...registerParams }, me, null);
	expect(already).toEqual({ ...subscription, state: 'already-subscribed', key: null });
	expect(v.parse(registerOutput, already)).toEqual(already);
	repository.findOneBy.mockResolvedValue(null);
	const subscribed = await register.exec({ ...registerParams }, me, null);
	expect(subscribed).toEqual({ ...subscription, sendReadMessage: false, state: 'subscribed', key: null });
	expect(v.parse(registerOutput, subscribed)).toEqual(subscribed);
	expect(repository.insert).toHaveBeenCalledWith({ ...subscription, id: existing.id, auth: existing.auth, publickey: existing.publickey, sendReadMessage: false });
	push.isValidEndpoint.mockReturnValue(false);
	await expect(register.exec({ ...registerParams }, me, null)).rejects.toMatchObject({ code: 'INVALID_ENDPOINT' });
	const show = new ShowEndpoint(repository);
	expect(await show.exec({ endpoint: subscription.endpoint }, me, null)).toBeNull();
	repository.findOneBy.mockResolvedValue(existing);
	const shown = await show.exec({ endpoint: subscription.endpoint }, me, null);
	expect(shown).toEqual(subscription);
	expect(v.parse(showOutput, shown)).toEqual(shown);
	const update = new UpdateEndpoint(repository, push);
	const unchanged = await update.exec({ endpoint: subscription.endpoint }, me, null);
	expect(unchanged).toEqual(subscription);
	const updated = await update.exec({ endpoint: subscription.endpoint, sendReadMessage: false }, me, null);
	expect(updated).toEqual({ ...subscription, sendReadMessage: false });
	expect(v.parse(updateOutput, updated)).toEqual(updated);
	expect(repository.update).toHaveBeenLastCalledWith(existing.id, { sendReadMessage: false });
	expect(push.refreshCache).toHaveBeenCalledWith(me.id);
	repository.findOneBy.mockResolvedValue(null);
	await expect(update.exec({ endpoint: subscription.endpoint }, me, null)).rejects.toMatchObject({ code: 'NO_SUCH_REGISTRATION' });
});

test('remaining native notifications inputs strip extras without changing required fields or optional values', () => {
	const createInput = notificationsInputs['notifications/create'];
	expect(v.parse(createInput, { body: 'Fixture', future: true })).toEqual({ body: 'Fixture' });
	expect(v.parse(createInput, { body: 'Fixture', header: null, icon: null })).toEqual({ body: 'Fixture', header: null, icon: null });
	expect(v.parse(createInput, { body: '', header: 'Title', icon: 'https://example.com/icon.png' })).toEqual({ body: '', header: 'Title', icon: 'https://example.com/icon.png' });
	for (const input of [{}, { body: 7 }, { body: 'Fixture', header: 7 }, { body: 'Fixture', icon: false }, { body: 'Fixture', header: undefined }]) expect(v.safeParse(createInput, input).success).toBe(false);
	expect(v.parse(unregisterInput, { ...registerParams, future: true })).toEqual(registerParams);
	for (const field of ['endpoint', 'auth', 'publickey']) {
		const input: Record<string, unknown> = { ...registerParams };
		delete input[field];
		expect(v.safeParse(unregisterInput, input).success).toBe(false);
		expect(v.safeParse(unregisterInput, { ...registerParams, [field]: 7 }).success).toBe(false);
	}
	const projectedCreate = toLegacyJsonSchema(createInput, { target: 'openapi-3.0' });
	expect(projectedCreate.additionalProperties).toBeUndefined();
	expect(projectedCreate.required).toEqual(['body']);
	expect(projectedCreate.properties?.header).toEqual({ type: 'string', nullable: true });
	expect(projectedCreate.properties?.icon).toEqual({ type: 'string', nullable: true });
	expect(projectEndpointContract(unregisterDefinition).input).toEqual({ type: 'object', properties: { endpoint: { type: 'string' }, auth: { type: 'string' }, publickey: { type: 'string' } }, required: ['endpoint', 'auth', 'publickey'] });
});

test('notification list compositions retain limits, defaults and current/obsolete selectors', () => {
	for (const schema of [listInput, groupedListInput]) {
		expect(v.parse(schema, {})).toEqual({ limit: 10, markAsRead: true });
		expect(v.parse(schema, { limit: 100, markAsRead: false, includeTypes: ['note', 'pollVote'], excludeTypes: ['groupInvited'], sinceId: 'note123', untilDate: 7, future: true })).toEqual({ limit: 100, markAsRead: false, includeTypes: ['note', 'pollVote'], excludeTypes: ['groupInvited'], sinceId: 'note123', untilDate: 7, future: true });
		for (const input of [{ limit: 0 }, { limit: 101 }, { limit: 1.5 }, { markAsRead: null }, { includeTypes: ['unknown'] }, { excludeTypes: ['reaction:grouped'] }, { sinceId: 'bad-id' }]) expect(v.safeParse(schema, input).success).toBe(false);
		const projected = toLegacyJsonSchema(schema, { target: 'openapi-3.0' });
		expect(projected.additionalProperties).toBeUndefined();
		expect(projected.properties?.limit).toEqual({ type: 'integer', minimum: 1, maximum: 100, default: 10 });
		expect(projected.properties?.markAsRead).toEqual({ type: 'boolean', default: true });
	}
});

test('legacy create and unregister HTTP accept extra inputs without native stripping', async () => {
	const createInput = notificationsInputs['notifications/create'];
	const createParams = { body: 'Fixture', header: null, future: true, i: 'transport' };
	const create = createContractTransportEndpoint({}, projectEndpointContract(defineEndpointContract({ method: 'POST', path: '/notifications/create' }, createInput, v.void())).input, notificationsContract['notifications/create'], async params => { expect(params).toBe(createParams); });
	expect(await create.exec(createParams, null, null)).toBeUndefined();
	await expect(create.exec({}, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	const unregisterParams = { ...registerParams, future: true, i: 'transport' };
	const unregister = new ContractEndpoint({}, projectEndpointContract(unregisterDefinition), async params => { expect(params).toBe(unregisterParams); });
	expect(await unregister.exec(unregisterParams, null, null)).toBeUndefined();
	await expect(unregister.exec({ endpoint: subscription.endpoint }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
});

test('real create feature retains token fallbacks and explicit optional values', async () => {
	const deps = mockDeep<Parameters<typeof createNotifications>[0]>();
	const feature = createNotifications(deps);
	const context = { actor: { id: user.id }, token: { id: 'token123', name: 'Token title', iconUrl: 'https://example.com/token.png' } };
	await feature['notifications/create']({ body: 'Fixture' }, { context });
	expect(deps.createAppNotification).toHaveBeenLastCalledWith(user.id, { appAccessTokenId: 'token123', customBody: 'Fixture', customHeader: context.token.name, customIcon: context.token.iconUrl });
	await feature['notifications/create']({ body: 'Fixture', header: 'Title', icon: '' }, { context });
	expect(deps.createAppNotification).toHaveBeenLastCalledWith(user.id, { appAccessTokenId: 'token123', customBody: 'Fixture', customHeader: 'Title', customIcon: '' });
});

test('real unregister handler retains anonymous secret ownership and per-user cache refresh', async () => {
	const repository = mockDeep<SwSubscriptionsRepository>();
	const push = mockDeep<PushNotificationService>();
	const endpoint = new UnregisterEndpoint(repository, push);
	repository.findBy.mockResolvedValue([]);
	expect(await endpoint.exec(registerParams, null, null)).toBeUndefined();
	expect(repository.delete).not.toHaveBeenCalled();
	const existing = { ...subscription, id: 'subscription123', user: null, auth: registerParams.auth, publickey: registerParams.publickey };
	repository.findBy.mockResolvedValue([existing, { ...existing, id: 'subscription456' }]);
	expect(await endpoint.exec(registerParams, null, null)).toBeUndefined();
	expect(repository.findBy).toHaveBeenLastCalledWith(registerParams);
	expect(repository.delete).toHaveBeenCalledWith(['subscription123', 'subscription456']);
	expect(push.refreshCache).toHaveBeenCalledExactlyOnceWith(user.id);
});
