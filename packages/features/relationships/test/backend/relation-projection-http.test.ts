/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { createUsersRelationProcedure } from '../../backend/endpoints/users/relation.js';
import { relationshipsContract } from '../../backend/endpoints/relationships.contract.js';
import type { RelationshipsDependencies } from '../../backend/api.implementation.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';

afterEach(() => vi.restoreAllMocks());

test('relationships HTTP explicitly selects outer and nested following fields without validating outputs', async () => {
	const principal = mockDeep<MiLocalUser>({ id: 'viewer123', isSuspended: false, movedToUri: null });
	const service = mockDeep<RelationshipsDependencies['userEntityService']>();
	const following = {
		id: 'relation123', followeeId: 'author123', followerId: principal.id,
		isFollowerHibernated: false, isFollowerSuspended: false, withReplies: true, notify: null,
		followerHost: null, followerInbox: null, followerSharedInbox: null,
		followeeHost: null, followeeInbox: null, followeeSharedInbox: null,
	};
	const expected = { id: 'author123', following, isFollowing: true, isFollowed: false,
		hasPendingFollowRequestFromYou: false, hasPendingFollowRequestToYou: false,
		isBlocking: false, isBlocked: false, isMuted: false, isRenoteMuted: false,
	};
	const stored = { ...expected, accessKey: 'outer-secret', requestHeaders: { secret: 'outer' },
		following: { ...following, followee: null, follower: null, accessKey: 'nested-secret', requestHeaders: { secret: 'nested' } },
	};
	service.getRelation.mockResolvedValue(stored);
	const schema = relationshipsContract['users/relation']['~orpc'].outputSchema;
	if (!schema) throw new Error('Missing relationship output schema');
	const output = vi.spyOn(schema['~standard'], 'validate');
	const context: ApiContext<MiLocalUser> = {
		credential: 'native', ip: '192.0.2.1', headers: {},
		services: { authenticate: async () => [principal, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
	};
	const handler = new OpenAPIHandler({ relation: createUsersRelationProcedure({ userEntityService: service }) });
	const result = await handler.handle(new Request('https://local.test/users/relation', {
		method: 'POST', headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ userId: 'author123', future: true }),
	}), { context });
	if (!result.response) throw new Error('Expected relationships HTTP response');
	expect(result.response.status).toBe(200);
	expect(await result.response.json()).toEqual([expected]);
	expect(service.getRelation).toHaveBeenCalledWith(principal.id, 'author123');
	expect(output).not.toHaveBeenCalled();
});
