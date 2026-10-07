/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { FlashsRepository } from '@/models/_.js';
import type { MiFlash } from '../../../../features/play/backend/models/Flash.js';
import type { MiLocalUser } from '../../../../features/users/backend/models/User.js';
import { EndpointImplementation, meta } from '../../../../features/play/backend/endpoints/flash/update.js';
import { voidFlashUpdateDefinition, voidFlashUpdateInput } from '../../../../features/play/contract/void-endpoint-definitions.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { Endpoint } from './endpoint-base.js';

function setup() {
	const flash = mockDeep<MiFlash>({ id: 'flash1', userId: 'user1' });
	const user = mockDeep<MiLocalUser>({ id: flash.userId });
	const repository = mockDeep<FlashsRepository>();
	repository.findOneBy.mockResolvedValue(flash);
	const endpoint = new EndpointImplementation(repository);
	return { flash, user, repository, endpoint };
}

test('flash/update persists only the native contract fields through the real legacy bridge', async () => {
	const { flash, user, repository, endpoint } = setup();
	expect(endpoint).toBeInstanceOf(ContractEndpoint);
	expect(endpoint).toBeInstanceOf(Endpoint);
	expect(meta).not.toHaveProperty('res');
	expect(projectEndpointContract(voidFlashUpdateDefinition).response).toBeUndefined();
	expect(Object.keys(voidFlashUpdateInput.entries).sort()).toEqual([
		'flashId', 'permissions', 'script', 'summary', 'title', 'visibility',
	]);
	const params = {
		flashId: flash.id,
		title: 'updated title',
		summary: 'updated summary',
		script: 'updated script',
		permissions: ['read:notes'],
		visibility: 'private',
		userId: 'injectedUser',
		unknown: 'injected field',
	};
	await expect(endpoint.exec(params, user, null)).resolves.toBeUndefined();
	expect(repository.findOneBy).toHaveBeenCalledExactlyOnceWith({ id: flash.id });
	expect(repository.update).toHaveBeenCalledExactlyOnceWith(flash.id, {
		updatedAt: expect.any(Date),
		title: 'updated title',
		summary: 'updated summary',
		script: 'updated script',
		permissions: ['read:notes'],
		visibility: 'private',
	});
	// AJV keeps the extra input fields; the handler's allowlist drops them.
	expect(params.userId).toBe('injectedUser');
	expect(params.unknown).toBe('injected field');
});

test('flash/update leaves absent optional fields untouched in partial updates', async () => {
	const { flash, user, repository, endpoint } = setup();
	await expect(endpoint.exec({ flashId: flash.id, summary: 'summary only', userId: 'injectedUser', unknown: true }, user, null)).resolves.toBeUndefined();
	expect(repository.update).toHaveBeenCalledExactlyOnceWith(flash.id, {
		updatedAt: expect.any(Date),
		summary: 'summary only',
	});
});

test('flash/update keeps the existing timestamp-only update when no fields are supplied', async () => {
	const { flash, user, repository, endpoint } = setup();
	await expect(endpoint.exec({ flashId: flash.id }, user, null)).resolves.toBeUndefined();
	expect(repository.update).toHaveBeenCalledExactlyOnceWith(flash.id, { updatedAt: expect.any(Date) });
});

test.each([
	{},
	{ flashId: 'flash-1' },
	{ flashId: 'flash1', title: 123 },
	{ flashId: 'flash1', permissions: [1] },
	{ flashId: 'flash1', visibility: 'followers' },
])('flash/update rejects invalid input before accessing the repository: %j', async params => {
	const { user, repository, endpoint } = setup();
	await expect(endpoint.exec(params, user, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(repository.findOneBy).not.toHaveBeenCalled();
	expect(repository.update).not.toHaveBeenCalled();
});

test('flash/update refuses a different author without persisting any fields', async () => {
	const { flash, repository, endpoint } = setup();
	const otherUser = mockDeep<MiLocalUser>({ id: 'otherUser' });
	await expect(endpoint.exec({ flashId: flash.id }, otherUser, null)).rejects.toMatchObject(meta.errors.accessDenied);
	expect(repository.update).not.toHaveBeenCalled();
});

test('flash/update preserves the missing-flash error without persisting any fields', async () => {
	const { flash, user, repository, endpoint } = setup();
	repository.findOneBy.mockResolvedValue(null);
	await expect(endpoint.exec({ flashId: flash.id }, user, null)).rejects.toMatchObject(meta.errors.noSuchFlash);
	expect(repository.update).not.toHaveBeenCalled();
});
