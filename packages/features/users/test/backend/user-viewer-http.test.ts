/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as v from 'valibot';
import { packedUserDetailedSchema, packedMeDetailedSchema } from '../../backend/user.schema.js';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
import type { ApiContext, ApiToken } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '../../backend/models/User.js';
import { createIProcedure, type IDependencies } from '../../backend/endpoints/i.js';
import { createUsersShowProcedure, type UsersShowDependencies } from '../../backend/endpoints/users/show.js';
import { iContract } from '../../backend/endpoints/i.contract.js';
import { usersShowContract } from '../../backend/endpoints/users/show.contract.js';
import { createUserSerializationFixture, timestamp } from './user-serialization-fixture.js';

afterEach(() => vi.restoreAllMocks());

for (const viewer of ['anonymous', 'other', 'moderator', 'native-self', 'app-token-self']) {
	test(`HTTP ${viewer} uses actual serializer viewer decisions and never validates its output`, async () => {
		const f = createUserSerializationFixture();
		const self = viewer === 'native-self' || viewer === 'app-token-self';
		const principal = viewer === 'anonymous' ? null : mockDeep<MiLocalUser>({
			id: self ? f.user.id : `${viewer}123`, isSuspended: false, movedToUri: null,
		});
		f.roles.isModerator.mockImplementation(async actor => actor?.id === 'moderator123');
		// Viewer relation data comes from a service port; the serializer still decides visibility.
		vi.spyOn(f.service, 'getRelation').mockResolvedValue({
			id: f.user.id, following: null, isFollowing: false, isFollowed: false,
			hasPendingFollowRequestFromYou: false, hasPendingFollowRequestToYou: false,
			isBlocking: false, isBlocked: false, isMuted: false, isRenoteMuted: false,
		});
		const mockedPublicDeps = mockDeep<UsersShowDependencies>();
		mockedPublicDeps.serverSettings.ugcVisibilityForVisitor = 'all';
		mockedPublicDeps.usersRepository.findOneBy.mockResolvedValue(f.user);
		const publicDeps: UsersShowDependencies = {
			serverSettings: mockedPublicDeps.serverSettings, usersRepository: mockedPublicDeps.usersRepository,
			userEntityService: f.service, roleService: f.roles,
			remoteUserResolveService: mockedPublicDeps.remoteUserResolveService,
			perUserPvChart: mockedPublicDeps.perUserPvChart, apiLoggerService: mockedPublicDeps.apiLoggerService,
		};
		const profiles = mockDeep<IDependencies['userProfilesRepository']>();
		f.profile.user = f.user;
		profiles.findOne.mockResolvedValue(f.profile);
		const token: ApiToken | null = viewer === 'app-token-self' ? { id: 'app123', permission: ['read:account'] } : null;
		const context: ApiContext<MiLocalUser> = {
			credential: principal ? 'fixture' : null, ip: '192.0.2.1', headers: {},
			services: { authenticate: async () => [principal, token], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
		};
		const handler = new OpenAPIHandler({ show: createUsersShowProcedure(publicDeps), self: createIProcedure({ userProfilesRepository: profiles, userEntityService: f.service }) }, {
			customErrorResponseBodyEncoder: misskeyErrorBody,
		});
		const schemas = [iContract['~orpc'].outputSchema, usersShowContract['~orpc'].outputSchema];
		const validators = schemas.map(schema => {
			if (!schema) throw new Error('Missing user output contract');
			return vi.spyOn(schema['~standard'], 'validate');
		});

		async function post(path: string, input: unknown) {
			const result = await handler.handle(new Request(`https://local.test/${path}`, {
				method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
			}), { context });
			if (!result.response) throw new Error('Expected matched user HTTP route');
			return result.response;
		}

		const response = await post('users/show', { userId: f.user.id, future: true });
		expect(response.status).toBe(200);
		const publicWire = v.parse(packedUserDetailedSchema, await response.json());
		for (const key of ['email', 'emailVerified', 'securityKeysList']) expect(publicWire).not.toHaveProperty(key);
		expect(publicWire.followersCount).toBe(self || viewer === 'moderator' ? 3 : 0);
		expect(publicWire.followingCount).toBe(self || viewer === 'moderator' ? 4 : 0);
		if (viewer === 'moderator') expect(publicWire.moderationNote).toBe('moderator-only');
		else expect(publicWire).not.toHaveProperty('moderationNote');
		if (self) expect(publicWire.followedMessage).toBe('followers-only');
		else expect(publicWire).not.toHaveProperty('followedMessage');
		if (self) {
			const me = await post('i', {});
			expect(me.status).toBe(200);
			const wire = v.parse(packedMeDetailedSchema, await me.json());
			expect(wire.unreadAnnouncements[0].updatedAt).toBe(timestamp.toISOString());
			expect(wire.followedMessage).toBe('followers-only');
			expect(wire.followersCount).toBe(3);
			expect(wire.followingCount).toBe(4);
			if (viewer === 'native-self') {
				expect(wire.email).toBe('private@example.com');
				expect(wire.emailVerified).toBe(true);
				expect(wire.securityKeysList).toEqual([{ id: 'key123', name: 'key', lastUsed: timestamp.toISOString() }]);
			} else for (const key of ['email', 'emailVerified', 'securityKeysList']) expect(wire).not.toHaveProperty(key);
		} else if (viewer === 'anonymous') {
			const me = await post('i', null);
			expect(me.status).toBe(401);
			expect(await me.json()).toMatchObject({ error: { code: 'CREDENTIAL_REQUIRED' } });
			expect(profiles.findOne).not.toHaveBeenCalled();
		}
		for (const validator of validators) expect(validator).not.toHaveBeenCalled();
	});
}
