/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { describe, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { MaterialError } from '../../backend/store.js';
import { material } from './fixture.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { FukushuStore } from '../../backend/store.js';
import type { FukushuDriveImporter } from '../../backend/drive-import.js';

function fixture() {
	const store = mockDeep<FukushuStore>();
	const importer = mockDeep<FukushuDriveImporter>();
	const user = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false, movedToUri: null });
	importer.import.mockResolvedValue(material());
	store.list.mockResolvedValue([material().deck]);
	return { store, importer, user, api: createFukushuRouter(store, importer) };
}

describe('Fukushu import and list authorization', () => {
	test.each([{ permission: [] }, { permission: ['read:drive'] }, { permission: ['write:account'] }, { permission: ['read:account'] }])('requires both import scopes ($permission)', async ({ permission }) => {
		const f = fixture();
		await expect(call(f.api.import, { fileId: 'file1' }, { context: testContext(f.user, { permission }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.importer.import).not.toHaveBeenCalled();
	});
	test('requires login before reading a file', async () => {
		const f = fixture();
		await expect(call(f.api.import, { fileId: 'file1' }, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		expect(f.importer.import).not.toHaveBeenCalled();
	});
	test('allows both scopes or the owner session, never a caller-supplied owner', async () => {
		const f = fixture();
		for (const token of [null, { permission: ['read:drive', 'write:account'] }]) {
			expect(await call(f.api.import, { fileId: 'file1', ownerId: 'bob' } as never, { context: testContext(f.user, token) })).toEqual(material());
		}
		expect(f.importer.import).toHaveBeenCalledTimes(2);
		expect(f.importer.import).toHaveBeenCalledWith('alice', 'file1');
	});
	test('maps unavailable files and duplicate imports to documented errors', async () => {
		const f = fixture();
		for (const code of ['NO_SUCH_FILE', 'MATERIAL_EXISTS', 'IMPORT_FAILED'] as const) {
			f.importer.import.mockRejectedValueOnce(new MaterialError(code));
			await expect(call(f.api.import, { fileId: 'file1' }, { context: testContext(f.user) })).rejects.toMatchObject({ code });
		}
	});
	test('list requires read:account and only selects the authenticated owner', async () => {
		const f = fixture();
		await expect(call(f.api.list, {}, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.list, {}, { context: testContext(f.user, { permission: ['write:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.store.list).not.toHaveBeenCalled();
		expect(await call(f.api.list, { ownerId: 'bob' } as never, { context: testContext(f.user, { permission: ['read:account'] }) })).toEqual([material().deck]);
		expect(f.store.list).toHaveBeenCalledWith('alice');
	});
});
