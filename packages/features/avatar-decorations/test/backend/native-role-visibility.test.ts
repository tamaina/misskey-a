/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createProcedureClient } from '@orpc/server';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createGetAvatarDecorationsProcedure } from '../../backend/endpoints/get-avatar-decorations.js';
import type { GetAvatarDecorationsDependencies } from '../../backend/endpoints/get-avatar-decorations.js';
import { MiAvatarDecoration } from '../../backend/models/AvatarDecoration.js';
import type { ApiActor, ApiContext, ApiServices } from '../../../api/backend/transport/context.js';
test('one composed decoration procedure reads current roles per request and isolates authenticated visibility', async () => {
	const dependencies = mockDeep<GetAvatarDecorationsDependencies<ApiActor>>();
	const decoration = Object.assign(new MiAvatarDecoration(), {
		id: 'decoration1', name: 'Crown', description: '', url: '/crown.png', category: null,
		roleIdsThatCanBeUsedThisDecoration: ['public1', 'private1', 'deleted1'],
	});
	dependencies.avatarDecorationService.getAll.mockResolvedValue([decoration]);
	dependencies.readRoles.mockResolvedValue([{ id: 'public1', isPublic: true }, { id: 'private1', isPublic: false }]);
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([null, null]);
	const context: ApiContext<ApiActor> = { services, credential: null, headers: {}, ip: '127.0.0.1' };
	const procedure = createGetAvatarDecorationsProcedure(dependencies);
	const client = createProcedureClient(procedure, { context });
	const forged = { authenticated: true };
	expect((await client(forged))[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['public1']);
	dependencies.readRoles.mockResolvedValue([{ id: 'private1', isPublic: true }]);
	expect((await client({}))[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['private1']);
	const actor: ApiActor = { id: 'viewer1', isSuspended: false, movedToUri: null };
	services.authenticate.mockResolvedValue([actor, null]);
	dependencies.readRoles.mockResolvedValue([{ id: 'public1', isPublic: false }, { id: 'private1', isPublic: false }]);
	expect((await client({}))[0].roleIdsThatCanBeUsedThisDecoration).toEqual(['public1', 'private1']);
	expect(dependencies.readRoles).toHaveBeenCalledTimes(3);
	expect(dependencies.avatarDecorationService.getAll).toHaveBeenNthCalledWith(1, true);
	expect(dependencies.avatarDecorationService.getAll).toHaveBeenNthCalledWith(2, true);
	expect(dependencies.avatarDecorationService.getAll).toHaveBeenNthCalledWith(3, true);
	expect(decoration.roleIdsThatCanBeUsedThisDecoration).toEqual(['public1', 'private1', 'deleted1']);
});
