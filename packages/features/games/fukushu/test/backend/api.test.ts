/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { fukushuContract } from '../../backend/material.contract.js';
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
	store.show.mockResolvedValue({ ...material(), revision: 1, archivedAt: null });
	store.update.mockResolvedValue({ revision: 2, archivedAt: null });
	store.archive.mockResolvedValue({ revision: 2, archivedAt: '2026-11-17T00:00:00.000Z' });
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
		expect(f.store.list).toHaveBeenCalledWith('alice', { archived: false });
	});
});

test('preserves each literal request name for native SDK response inference', () => {
	expectTypeOf(fukushuContract.list['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/list'>();
	expectTypeOf(fukushuContract.import['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/import'>();
	expectTypeOf(fukushuContract.show['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/show'>();
	expectTypeOf(fukushuContract.update['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/update'>();
	expectTypeOf(fukushuContract.archive['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/archive'>();
	expectTypeOf(fukushuContract.create['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/create'>();
});

describe('Fukushu metadata and archive authorization', () => {
	test('requires write:account and derives the owner from the principal', async () => {
		const f = fixture();
		const update = { id: 'deck-original', expectedRevision: 1, name: 'renamed', description: 'description' };
		const archive = { id: 'deck-original', expectedRevision: 1, archived: true };
		await expect(call(f.api.update, update, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.archive, archive, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.update, update, { context: testContext(f.user, { permission: ['read:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		await expect(call(f.api.archive, archive, { context: testContext(f.user, { permission: ['read:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.store.update).not.toHaveBeenCalled();
		expect(f.store.archive).not.toHaveBeenCalled();
		await call(f.api.update, { ...update, ownerId: 'bob' } as never, { context: testContext(f.user, { permission: ['write:account'] }) });
		await call(f.api.archive, { ...archive, ownerId: 'bob' } as never, { context: testContext(f.user) });
		expect(f.store.update).toHaveBeenCalledWith('alice', update.id, 1, 'renamed', 'description');
		expect(f.store.archive).toHaveBeenCalledWith('alice', archive.id, 1, true);
	});
	test('exposes concurrency state separately and selects the archived owner list explicitly', async () => {
		const f = fixture();
		expect(await call(f.api.show, { id: 'deck-original' }, { context: testContext(f.user) })).toEqual({ ...material(), revision: 1, archivedAt: null });
		await call(f.api.list, { archived: true }, { context: testContext(f.user) });
		expect(f.store.list).toHaveBeenCalledWith('alice', { archived: true });
	});
	test('maps stale revisions and missing materials without exposing storage details', async () => {
		const f = fixture();
		for (const code of ['MATERIAL_CONFLICT', 'NO_SUCH_MATERIAL', 'INVALID_MATERIAL'] as const) {
			f.store.update.mockRejectedValueOnce(new MaterialError(code));
			await expect(call(f.api.update, { id: 'deck-original', expectedRevision: 1, name: 'name' }, { context: testContext(f.user) })).rejects.toMatchObject({ code });
		}
	});
	test.each([0, -1, 1.5, 2_147_483_648])('rejects an invalid expected revision %s before storage', async expectedRevision => {
		const f = fixture();
		await expect(call(f.api.archive, { id: 'deck-original', expectedRevision, archived: false }, { context: testContext(f.user) })).rejects.toThrow();
		expect(f.store.archive).not.toHaveBeenCalled();
	});
});
