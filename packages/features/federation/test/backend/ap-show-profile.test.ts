/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { IsNull } from 'typeorm';
import { describe, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { MiLocalUser, MiUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { createApShowProcedure, type ApShowDependencies } from '../../backend/endpoints/ap/show.js';

function fixture() {
	const deps = mockDeep<ApShowDependencies>();
	deps.utilityService.isFederationAllowedUri.mockReturnValue(true);
	deps.utilityService.isUriLocal.mockImplementation(uri => new URL(uri).host === 'a.test');
	deps.utilityService.extractDbHost.mockImplementation(uri => new URL(uri).host);
	deps.utilityService.isSelfHost.mockImplementation(host => host == null || host === 'a.test');
	deps.apDbResolverService.getUserFromApId.mockResolvedValue(null);
	deps.apDbResolverService.getNoteFromApId.mockResolvedValue(null);
	deps.usersRepository.findOneBy.mockResolvedValue(null);
	const context = testContext(mockDeep<MiLocalUser>({ id: 'viewer', isSuspended: false }));
	const invoke = (uri: string) => call(createApShowProcedure<MiLocalUser>(deps), { uri }, { context });
	return { deps, invoke };
}

describe('ap/show profile lookup boundaries', () => {
	test.each([
		['https://a.test/@Alice', null],
		['https://a.test/@Alice@a.test', null],
		['https://a.test/@Alice@b.test', 'b.test'],
	] as const)('normalizes %s and excludes deleted/suspended stored users', async (uri, host) => {
		const { deps, invoke } = fixture();
		await expect(invoke(uri)).rejects.toMatchObject({ code: 'NO_SUCH_OBJECT' });
		expect(deps.usersRepository.findOneBy).toHaveBeenCalledWith({
			usernameLower: 'alice', host: host ?? IsNull(), isDeleted: false, isSuspended: false,
		});
		expect(deps.apResolverService.createResolver).not.toHaveBeenCalled();
		expect(deps.apPersonService.createPerson).not.toHaveBeenCalled();
	});

	test.each(['https://a.test/@alice/extra', 'https://a.test/users/missing'])('does not treat %s as an account profile', async uri => {
		const { deps, invoke } = fixture();
		await expect(invoke(uri)).rejects.toMatchObject({ code: 'NO_SUCH_OBJECT' });
		expect(deps.usersRepository.findOneBy).not.toHaveBeenCalled();
		expect(deps.apResolverService.createResolver).not.toHaveBeenCalled();
	});

	test('passes a stored profile through the existing user serializer and preserves its refusal', async () => {
		const { deps, invoke } = fixture();
		const user = mockDeep<MiUser>({ id: 'stored' });
		deps.usersRepository.findOneBy.mockResolvedValue(user);
		const refused = new Error('user serializer refused');
		deps.userEntityService.pack.mockRejectedValue(refused);
		await expect(invoke('https://a.test/@alice')).rejects.toBe(refused);
		expect(deps.userEntityService.pack).toHaveBeenCalledWith(user, expect.objectContaining({ id: 'viewer' }), { schema: 'UserDetailedNotMe' });
		expect(deps.apResolverService.createResolver).not.toHaveBeenCalled();
	});

	test('keeps federation restrictions ahead of profile lookup', async () => {
		const { deps, invoke } = fixture();
		deps.utilityService.isFederationAllowedUri.mockReturnValue(false);
		await expect(invoke('https://a.test/@alice')).rejects.toMatchObject({ code: 'FEDERATION_NOT_ALLOWED' });
		expect(deps.usersRepository.findOneBy).not.toHaveBeenCalled();
		expect(deps.apDbResolverService.getUserFromApId).not.toHaveBeenCalled();
	});

	test('keeps the existing Note visibility refusal', async () => {
		const { deps, invoke } = fixture();
		deps.apDbResolverService.getNoteFromApId.mockResolvedValue(mockDeep<MiNote>({ id: 'private' }));
		deps.noteEntityService.pack.mockRejectedValue(new Error('not visible'));
		await expect(invoke('https://a.test/notes/private')).rejects.toMatchObject({ code: 'NO_SUCH_OBJECT' });
		expect(deps.apResolverService.createResolver).not.toHaveBeenCalled();
	});
});
