/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createProcedureClient } from '@orpc/server';
import type { ApiContext, ApiToken } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '../../backend/models/User.js';
import { createIProcedure, type IDependencies } from '../../backend/endpoints/i.js';
import { iContract } from '../../backend/endpoints/i.contract.js';
import { toPackedUserDetailed, toPackedUserLite, packedUserLiteSchema } from '../../backend/user.schema.js';
import { toPackedNotificationSettings } from '../../backend/notification-settings.schema.js';
import { createUserSerializationFixture, timestamp } from './user-serialization-fixture.js';

function context(principal: MiLocalUser | null, token: ApiToken | null = null): ApiContext<MiLocalUser> {
	return {
		credential: principal === null ? null : 'credential', ip: '192.0.2.1', headers: {},
		services: {
			...mockDeep<ApiContext<MiLocalUser>['services']>(),
			authenticate: async () => [principal, token],
		},
	};
}

for (const viewer of ['anonymous', 'other', 'moderator'] as const) {
	test(`finite ${viewer} view preserves serializer security and private-count decisions`, async () => {
		const f = createUserSerializationFixture();
		if (viewer === 'moderator') f.roles.isModerator.mockResolvedValue(true);
		const principal = viewer === 'anonymous' ? null : { id: `${viewer}123` };
		const native = await f.service.pack(f.user, principal, { schema: 'UserDetailed', ...f.hints });
		const wire = toPackedUserDetailed(Object.assign(native, { outerSentinel: 'drop', email: 'never-expose', securityKeysList: [] }));
		for (const key of ['outerSentinel', 'email', 'emailVerified', 'securityKeysList', 'unreadAnnouncements', 'policies']) expect(wire).not.toHaveProperty(key);
		expect(wire.followersCount).toBe(viewer === 'moderator' ? 3 : 0);
		expect(wire.followingCount).toBe(viewer === 'moderator' ? 4 : 0);
		expect(wire.moderationNote).toBe(viewer === 'moderator' ? 'moderator-only' : undefined);
		expect(wire.followedMessage).toBeUndefined();
		expect(wire.twoFactorEnabled).toBe(viewer === 'moderator' ? true : undefined);
	});
}

for (const appToken of [false, true]) {
	test(`i ${appToken ? 'app token' : 'native session'} preserves self fields, date conversion, and secret gating without an output validator`, async () => {
		const f = createUserSerializationFixture();
		const actor = mockDeep<MiLocalUser>({ id: f.user.id, isSuspended: false, movedToUri: null });
		const profiles = mockDeep<IDependencies['userProfilesRepository']>();
		f.profile.user = f.user;
		profiles.findOne.mockResolvedValue(f.profile);
		const procedure = createIProcedure({ userProfilesRepository: profiles, userEntityService: f.service });
		const outputSchema = iContract['~orpc'].outputSchema;
		if (outputSchema === undefined) throw new Error('Missing self output schema');
		const validator = vi.spyOn(outputSchema, '~run');
		try {
			const client = createProcedureClient(procedure, { context: context(actor, appToken ? { id: 'app123', permission: ['read:account'] } : null) });
			const wire = await client({});
			expect(validator).not.toHaveBeenCalled();
			expect(wire.followersCount).toBe(3);
			expect(wire.followingCount).toBe(4);
			expect(wire.followedMessage).toBe('followers-only');
			expect(wire.unreadAnnouncements[0].updatedAt).toBe(timestamp.toISOString());
			expect(wire.unreadAnnouncements[0]).not.toHaveProperty('user');
			if (appToken) {
				for (const key of ['email', 'emailVerified', 'securityKeysList']) expect(wire).not.toHaveProperty(key);
			} else {
				expect(wire.email).toBe('private@example.com');
				expect(wire.emailVerified).toBe(true);
				expect(wire.securityKeysList).toEqual([{ id: 'key123', name: 'key', lastUsed: timestamp.toISOString() }]);
			}
		} finally { validator.mockRestore(); }
	});
}

test('explicit user projection removes outer and nested structural sentinels while preserving authored JSON keys', async () => {
	const f = createUserSerializationFixture();
	const native = await f.service.packSelf(f.user, { ...f.hints, includeSecrets: true });
	const json = { ['__proto__']: { kept: true }, constructor: [null, 1], prototype: 'kept' };
	const lite = await f.service.pack(f.user, null);
	const page = {
		id: 'page123', createdAt: timestamp.toISOString(), updatedAt: timestamp.toISOString(), userId: f.user.id,
		user: Object.assign(lite, { email: 'never-expose', nestedSentinel: true }), content: [json], variables: [json],
		title: 'Page', name: 'page', summary: null, hideTitleWhenPinned: false, alignCenter: false,
		font: 'serif' as const, script: '', eyeCatchingImageId: null, eyeCatchingImage: null, attachedFiles: [], likedCount: 0,
		pageSentinel: true,
	};
	const input = Object.assign(native, {
		outerSentinel: true, pinnedPage: page,
		fields: [{ name: 'field', value: 'value', fieldSentinel: true }],
		avatarDecorations: [{ id: 'decoration123', url: '/decoration', angle: undefined, decorationSentinel: true }],
		achievements: [{ name: 'notes1' as const, unlockedAt: 1, achievementSentinel: true }],
		policies: Object.assign({}, native.policies, { policySentinel: true }),
		unreadAnnouncements: native.unreadAnnouncements.map(row => Object.assign({}, row, { announcementSentinel: true })),
		securityKeysList: native.securityKeysList?.map(row => Object.assign({}, row, { keySentinel: true })),
		notificationRecieveConfig: { note: undefined, futureNotification: json },
	});
	const wire = toPackedUserDetailed(input);
	expect(wire).not.toHaveProperty('outerSentinel');
	expect(wire.fields).toEqual([{ name: 'field', value: 'value' }]);
	expect(wire.avatarDecorations).toEqual([{ id: 'decoration123', url: '/decoration' }]);
	expect(wire.achievements).toEqual([{ name: 'notes1', unlockedAt: 1 }]);
	expect(wire.policies).not.toHaveProperty('policySentinel');
	expect(wire.unreadAnnouncements[0]).not.toHaveProperty('announcementSentinel');
	expect(wire.securityKeysList?.[0]).not.toHaveProperty('keySentinel');
	expect(wire.pinnedPage).not.toHaveProperty('pageSentinel');
	expect(wire.pinnedPage?.user).not.toHaveProperty('email');
	expect(wire.pinnedPage?.user).not.toHaveProperty('nestedSentinel');
	expect(wire.pinnedPage?.content[0]).toEqual(json);
	expect(wire.notificationRecieveConfig).toEqual({ futureNotification: json });
	expect(input.notificationRecieveConfig).toHaveProperty('note', undefined);
	expect(toPackedUserLite(input)).not.toHaveProperty('email');
	expect(toPackedUserLite(input)).not.toHaveProperty('unreadAnnouncements');
});

test('notification wire conversion preserves reserved names, omits declared undefined, and rejects non-JSON extensions', () => {
	const input = { note: undefined };
	for (const key of ['__proto__', 'constructor', 'prototype']) Object.defineProperty(input, key, { value: { kept: true }, enumerable: true });
	const wire = toPackedNotificationSettings(input);
	for (const key of ['__proto__', 'constructor', 'prototype']) expect(Object.hasOwn(wire, key)).toBe(true);
	expect(wire).not.toHaveProperty('note');
	expect(input).toHaveProperty('note', undefined);
	expect(() => toPackedNotificationSettings({ futureNotification: undefined })).toThrow(TypeError);
});

test('follower projection preserves followed-message and count visibility without adding self secrets', async () => {
	for (const isFollowing of [false, true]) {
		const f = createUserSerializationFixture();
		f.profile.followersVisibility = 'followers';
		f.profile.followingVisibility = 'followers';
		const relation = { id: f.user.id, following: null, isFollowing, isFollowed: false, hasPendingFollowRequestFromYou: false, hasPendingFollowRequestToYou: false, isBlocking: false, isBlocked: false, isMuted: false, isRenoteMuted: false };
		const native = await f.service.pack(f.user, { id: 'other123' }, { schema: 'UserDetailed', ...f.hints, userRelations: new Map([[f.user.id, relation]]) });
		const wire = toPackedUserDetailed(native);
		expect(wire.followedMessage).toBe(isFollowing ? 'followers-only' : undefined);
		expect(wire.followersCount).toBe(isFollowing ? 3 : 0);
		expect(wire.followingCount).toBe(isFollowing ? 4 : 0);
		for (const key of ['email', 'emailVerified', 'securityKeysList', 'moderationNote']) expect(wire).not.toHaveProperty(key);
	}
});

test('ordinary emoji records retain Valibot reserved-key normalization independently of genuine JSON', async () => {
	const f = createUserSerializationFixture();
	const native = await f.service.pack(f.user);
	const emojis = { normal: '/emoji.png', ['__proto__']: '/proto.png', constructor: '/constructor.png', prototype: '/prototype.png' };
	const wire = toPackedUserLite({ ...native, emojis });
	expect(wire.emojis).toEqual(v.parse(packedUserLiteSchema.entries.emojis, emojis));
	expect(wire.emojis).toEqual({ normal: '/emoji.png' });
	for (const key of ['__proto__', 'constructor', 'prototype']) {
		expect(Object.hasOwn(wire.emojis, key)).toBe(false);
		expect(Object.hasOwn(emojis, key)).toBe(true);
	}
});
