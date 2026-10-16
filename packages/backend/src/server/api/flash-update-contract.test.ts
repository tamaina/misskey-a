/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiFlash } from '@features/play/backend/models/Flash.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createProcedureClient } from '@orpc/server';
import * as v from 'valibot';
import { createFlashUpdateProcedure } from '@features/play/backend/endpoints/flash/update.js';
import type { ApiContext, ApiServices } from '@features/api/backend/transport/context.js';
import { flashUpdateContract, flashUpdateErrors } from '@features/play/backend/endpoints/flash/update.contract.js';

function requiredSchema<T>(schema: T | undefined): T {
	if (schema === undefined) throw new Error('Expected contract input schema');
	return schema;
}

const flashUpdateInput = requiredSchema(flashUpdateContract['~orpc'].inputSchema);

function setup() {
	const flash = mockDeep<MiFlash>({ id: 'flash1', userId: 'user1' });
	const user = mockDeep<MiLocalUser>({ id: flash.userId, isSuspended: false, movedToUri: null });
	const repository = mockDeep<FlashsRepository>();
	repository.findOneBy.mockResolvedValue(flash);
	const services = mockDeep<ApiServices<MiLocalUser>>();
	const context: ApiContext<MiLocalUser> = { services, credential: 'native', ip: '127.0.0.1', headers: {} };
	services.authenticate.mockResolvedValue([user, null]);
	services.limitActor.mockReturnValue(null);
	services.rateLimitFactor.mockResolvedValue(1);
	const endpoint = createProcedureClient(createFlashUpdateProcedure({ flashsRepository: repository }), { context });
	return { flash, user, repository, endpoint, context, services };
}

test('flash/update persists only the validated native contract fields through the real native handler', async () => {
	const { flash, repository, endpoint } = setup();
	const params = {
		flashId: flash.id,
		title: 'updated title',
		summary: 'updated summary',
		script: 'updated script',
		permissions: ['read:notes'],
		visibility: 'private' as const,
		userId: 'injectedUser',
		unknown: 'injected field',
	};
	await expect(endpoint(params)).resolves.toBeUndefined();
	expect(repository.findOneBy).toHaveBeenCalledExactlyOnceWith({ id: flash.id });
	expect(repository.update).toHaveBeenCalledExactlyOnceWith(flash.id, {
		updatedAt: expect.any(Date),
		title: 'updated title',
		summary: 'updated summary',
		script: 'updated script',
		permissions: ['read:notes'],
		visibility: 'private',
	});
	// Parsing removes unused fields without mutating caller input.
	expect(params.userId).toBe('injectedUser');
	expect(params.unknown).toBe('injected field');
});

test('flash/update leaves absent optional fields untouched in partial updates', async () => {
	const { flash, repository, endpoint } = setup();
	const params = { flashId: flash.id, summary: 'summary only', userId: 'injectedUser', unknown: true };
	await expect(endpoint(params)).resolves.toBeUndefined();
	expect(repository.update).toHaveBeenCalledExactlyOnceWith(flash.id, {
		updatedAt: expect.any(Date),
		summary: 'summary only',
	});
});

test('flash/update keeps the existing timestamp-only update when no fields are supplied', async () => {
	const { flash, repository, endpoint } = setup();
	await expect(endpoint({ flashId: flash.id })).resolves.toBeUndefined();
	expect(repository.update).toHaveBeenCalledExactlyOnceWith(flash.id, { updatedAt: expect.any(Date) });
});

test.each([
	{},
	{ flashId: 'flash-1' },
	{ flashId: 'flash1', title: 123 },
	{ flashId: 'flash1', permissions: [1] },
	{ flashId: 'flash1', visibility: 'followers' },
])('flash/update rejects invalid native input: %j', async params => {
	expect(v.safeParse(flashUpdateInput, params).success).toBe(false);
});

test('flash/update refuses a different author without persisting any fields', async () => {
	const { flash, repository, endpoint, services } = setup();
	const otherUser = mockDeep<MiLocalUser>({ id: 'otherUser', isSuspended: false, movedToUri: null });
	services.authenticate.mockResolvedValue([otherUser, null]);
	await expect(endpoint({ flashId: flash.id })).rejects.toMatchObject({ code: flashUpdateErrors.accessDenied.code, data: { id: flashUpdateErrors.accessDenied.id } });
	expect(repository.update).not.toHaveBeenCalled();
});

test('flash/update preserves the missing-flash error without persisting any fields', async () => {
	const { flash, repository, endpoint } = setup();
	repository.findOneBy.mockResolvedValue(null);
	await expect(endpoint({ flashId: flash.id })).rejects.toMatchObject({ code: flashUpdateErrors.noSuchFlash.code, data: { id: flashUpdateErrors.noSuchFlash.id } });
	expect(repository.update).not.toHaveBeenCalled();
});

test('flash/update rejects an invalid ID before accessing the repository', async () => {
	const { repository, endpoint } = setup();
	await expect(endpoint({ flashId: 'flash-1' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
	expect(repository.findOneBy).not.toHaveBeenCalled();
	expect(repository.update).not.toHaveBeenCalled();
});
