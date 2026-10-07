/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import { expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { packedSigninSchema } from '../../../../features/auth/contract/packed.js';
vi.mock('../../../../features/roles/backend/services/RoleService.js', () => ({ RoleService: class {} }));
vi.mock('../../../../features/roles/backend/serializers/RoleEntityService.js', () => ({ RoleEntityService: class {} }));
vi.mock('../../../../features/runtime/backend/services/IdService.js', () => ({ IdService: class {} }));
import { convertSchemaToOpenApiSchema } from '@/server/api/openapi/schemas.js';
import { EndpointImplementation as After, meta, paramDef } from '../../../../features/moderation/backend/endpoints/admin/show-user.js';
import { adminShowUserInput, adminShowUserOutput } from '../../../../features/moderation/contract/admin-user-endpoint-definition.js';
test('native input and documented output remain distinct from raw producer', () => {
	expect(v.safeParse(adminShowUserInput, { userId: 'Ab12', extra: 42 }).success).toBe(true);
	for (const input of [{}, { userId: null }, { userId: 'a-b' }, []]) expect(v.safeParse(adminShowUserInput, input).success).toBe(false);
	expect(paramDef.required).toEqual(['userId']);
	expect(meta.requireModerator).toBe(true);
	expect(meta.kind).toBe('read:admin:show-user');
	expect(convertSchemaToOpenApiSchema(meta.res!, 'res', true)).toBeDefined();
});

function fixture(Ctor: typeof After, options: { missing?: boolean; forbidden?: boolean } = {}) {
	const calls: unknown[] = []; const user = { id: 'user', isSuspended: false, isHibernated: false, lastActiveDate: null };
	const profile = { email: null, emailVerified: false, followedMessage: null, autoAcceptFollowed: false, noCrawle: false, preventAiLearning: false, alwaysMarkNsfw: false, autoSensitive: false, carefulBot: false, injectFeaturedNote: false, receiveAnnouncementEmail: false, mutedWords: ['abc', ['x']], mutedInstances: [], notificationRecieveConfig: {}, moderationNote: null };
	const raw = [{ id: 'signin', userId: 'user', user: null, ip: '127.0.0.1', headers: { extra: 'retained' }, success: true }];
	const deps = [{ findOneBy: async(args:unknown) => {calls.push(['user', args]); return options.missing ? null : user;}, findOneByOrFail: async(args:unknown) => {calls.push(['me', args]); return { id: 'me' };} }, { findOneBy: async(args:unknown) => {calls.push(['profile', args]); return profile;} }, { findBy: async(args:unknown) => {calls.push(['signins', args]); return raw;} }, { isModerator: async() => false, getUserPolicies: async() => ({ canPublicNote: true }), isAdministrator: async(u:{ id: string }) => options.forbidden && u.id === 'user', getUserAssigns: async() => [{ id: 'assign', expiresAt: null, roleId: 'r' }], getUserRoles: async() => [] }, { packMany: async() => [] }, { parse: () => ({ date: new Date('2026-01-01T00:00:00.000Z') }) }];
	return { endpoint: Reflect.construct(Ctor, deps), raw, calls };
}

test('raw producer stays unpacked and outside documented native compatibility', async() => {
	const { endpoint, raw } = fixture(After); const result = await endpoint.exec({ userId: 'user' }, { id: 'me' }, null);
		expect(result.signins).toBe(raw); expect(Object.hasOwn(raw[0], 'createdAt')).toBe(false);
		expect(result.signins[0].headers).toBe(raw[0].headers);
		const parsed = v.safeParse(adminShowUserOutput, result); expect(parsed.success).toBe(false);
		expect(parsed.issues?.some(issue => issue.path?.some(p => p.key === 'signins'))).toBe(true);
		const signin = v.safeParse(packedSigninSchema, raw[0]); expect(signin.success).toBe(false);
		expect(signin.issues?.some(issue => issue.path?.some(p => p.key === 'createdAt'))).toBe(true);
	expect(result.moderationNote).toBe('');
});
test('missing user and administrator protection retain errors and avoid signin reads', async() => {
	for (const [options, message] of [[{ missing: true }, 'user not found'], [{ forbidden: true }, 'cannot show info of admin']] as const) {
		const { endpoint, calls } = fixture(After, options);
		await expect(endpoint.exec({ userId: 'user' }, { id: 'me' }, null)).rejects.toThrow(message);
		expect(calls.some(c => Array.isArray(c) && c[0] === 'signins')).toBe(false);
	}
});
