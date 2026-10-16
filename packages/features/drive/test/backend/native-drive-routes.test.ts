/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { createProcedureClient } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { mockDeep } from 'vitest-mock-extended';
import { createDriveFilesShowProcedure as DriveFilesShowOperation } from '../../backend/endpoints/drive/files/show.js';
import { adminDriveShowFileContract } from '../../backend/endpoints/admin/drive/show-file.contract.js';
import { driveFilesShowContract } from '../../backend/endpoints/drive/files/show.contract.js';
import { driveFoldersCreateContract } from '../../backend/endpoints/drive/folders/create.contract.js';
import { driveFilesUploadFromUrlContract } from '../../backend/endpoints/drive/files/upload-from-url.contract.js';
import { createDriveFilesUploadFromUrlProcedure as DriveFilesUploadFromUrlOperation } from '../../backend/endpoints/drive/files/upload-from-url.js';
import { toRequestHeaders } from '../../backend/management.schema.js';
import { packedJsonObjectSchema } from '@features/users/backend/json-value.schema.js';
import type { MiDriveFile } from '../../backend/models/DriveFile.js';
import type { DriveFileEntityService } from '../../backend/serializers/DriveFileEntityService.js';
import type { DriveService } from '../../backend/services/DriveService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { DriveFileSelectorRepository } from '../../backend/selector.repository.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S {
	if (schema === undefined) throw new Error('Missing native contract schema');
	return schema;
}

const adminDriveShowFileInput = requiredSchema(adminDriveShowFileContract['~orpc'].inputSchema);
const driveFilesShowInput = requiredSchema(driveFilesShowContract['~orpc'].inputSchema);
const driveFoldersCreateInput = requiredSchema(driveFoldersCreateContract['~orpc'].inputSchema);
const driveFilesUploadFromUrlInput = requiredSchema(driveFilesUploadFromUrlContract['~orpc'].inputSchema);

test('drive file selectors retain both fields and owner checks permit only owners or moderators', async () => {
	const input = v.parse(driveFilesShowInput, { fileId: 'file1', url: 'https://example.test/file' });
	expect(input).toEqual({ fileId: 'file1', url: 'https://example.test/file' });
	const files = mockDeep<DriveFileSelectorRepository>();
	const roles = mockDeep<RoleService>();
	const serializer = mockDeep<DriveFileEntityService>();
	const actor = mockDeep<MiLocalUser>({ id: 'viewer1' });
	files.findOneBy.mockResolvedValue(mockDeep<MiDriveFile>({ id: 'file1', userId: 'owner1' }));
	roles.isModerator.mockResolvedValue(false);
	const operation = DriveFilesShowOperation({ driveFileSelectorRepository: files, driveFileEntityService: serializer, roleService: roles });
	await expect(createProcedureClient(operation, { context: apiTestContext(actor, '127.0.0.1', {}) })(input)).rejects.toMatchObject({ code: 'ACCESS_DENIED', data: { id: '25b73c73-68b1-41d0-bad1-381cfdf6579f' } });
	expect(files.findOneBy).toHaveBeenLastCalledWith({ id: 'file1' });
	expect(serializer.pack).not.toHaveBeenCalled();
	roles.isModerator.mockResolvedValue(true);
	serializer.pack.mockResolvedValue(v.parse(requiredSchema(driveFilesShowContract['~orpc'].outputSchema), { id: 'file1', createdAt: '2026-01-01T00:00:00.000Z', name: 'file.txt', type: 'text/plain', md5: 'hash', size: 5, isSensitive: false, blurhash: null, properties: {}, url: 'https://example.test/file', thumbnailUrl: null, comment: null, folderId: null, folder: null, userId: null, user: null }));
	await createProcedureClient(operation, { context: apiTestContext(actor, '127.0.0.1', {}) })(input);
	expect(serializer.pack).toHaveBeenCalledWith(expect.anything(), { detail: true, withUser: true, self: true });
});

test('competing drive selectors preserve inactive JSON values and fileId lookup priority', async () => {
	for (const schema of [driveFilesShowInput, adminDriveShowFileInput]) {
		expect(v.parse(schema, { fileId: 'file1', url: 42 })).toEqual({ fileId: 'file1', url: 42 });
		expect(v.parse(schema, { fileId: { preserved: true }, url: 'https://example.test/file' })).toEqual({ fileId: { preserved: true }, url: 'https://example.test/file' });
		expect(v.safeParse(schema, { fileId: 42, url: false }).success).toBe(false);
	}
	const files = mockDeep<DriveFileSelectorRepository>();
	files.findOneBy.mockResolvedValue(null);
	const operation = DriveFilesShowOperation({ driveFileSelectorRepository: files, driveFileEntityService: mockDeep<DriveFileEntityService>(), roleService: mockDeep<RoleService>() });
	const actor = mockDeep<MiLocalUser>({ id: 'viewer1' });
	const input = v.parse(driveFilesShowInput, { fileId: null, url: 'https://example.test/file' });
	await expect(createProcedureClient(operation, { context: apiTestContext(actor, '127.0.0.1', {}) })(input)).rejects.toMatchObject({ code: 'NO_SUCH_FILE' });
	expect(files.findOneBy).toHaveBeenCalledWith({ id: null });
});

test('drive defaults and comment/folder bounds retain Unicode code point behavior', () => {
	expect(v.parse(driveFoldersCreateInput, {})).toEqual({ name: 'Untitled' });
	expect(v.safeParse(driveFoldersCreateInput, { name: '😀'.repeat(200) }).success).toBe(true);
	expect(v.safeParse(driveFoldersCreateInput, { name: '😀'.repeat(201) }).success).toBe(false);
	expect(v.parse(driveFilesUploadFromUrlInput, { url: 'https://example.test/file' })).toEqual({ url: 'https://example.test/file', folderId: null, isSensitive: false, comment: null, marker: null, force: false });
	expect(v.safeParse(driveFilesUploadFromUrlInput, { url: 'https://example.test/file', comment: '😀'.repeat(512) }).success).toBe(true);
	expect(v.safeParse(driveFilesUploadFromUrlInput, { url: 'https://example.test/file', comment: '😀'.repeat(513) }).success).toBe(false);
});

test('URL upload returns before downloading and retains request IP, headers and stream marker', async () => {
	const drive = mockDeep<DriveService>();
	const serializer = mockDeep<DriveFileEntityService>();
	const events = mockDeep<GlobalEventService>();
	const actor = mockDeep<MiLocalUser>({ id: 'owner1' });
	let finish: (file: MiDriveFile) => void = () => { throw new Error('Upload not started'); };
	drive.uploadFromUrl.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
	const packed = mockDeep<Awaited<ReturnType<DriveFileEntityService['pack']>>>();
	serializer.pack.mockResolvedValue(packed);
	const operation = DriveFilesUploadFromUrlOperation({ driveFileEntityService: serializer, driveService: drive, globalEventService: events });
	const input = v.parse(driveFilesUploadFromUrlInput, { url: 'https://example.test/file', marker: 'request1' });
	await expect(createProcedureClient(operation, { context: apiTestContext(actor, '127.0.0.1', { 'x-test': 'value', accept: ['image/png'], absent: undefined }) })(input)).resolves.toBeUndefined();
	expect(events.publishMainStream).not.toHaveBeenCalled();
	expect(drive.uploadFromUrl).toHaveBeenCalledWith(expect.objectContaining({ requestIp: '127.0.0.1', requestHeaders: { 'x-test': 'value', accept: ['image/png'], absent: undefined } }));
	finish(mockDeep<MiDriveFile>());
	await Promise.resolve();
	await Promise.resolve();
	expect(events.publishMainStream).toHaveBeenCalledWith('owner1', 'urlUploadFinished', { marker: 'request1', file: packed });
});

test('admin stored header JSON retains reserved keys and omits absent header values', () => {
	const headers: Record<string, string | string[] | undefined> = { absent: undefined, accept: ['image/png'] };
	Object.defineProperty(headers, '__proto__', { value: 'header', enumerable: true });
	const packed = toRequestHeaders(headers);
	expect(v.parse(packedJsonObjectSchema, packed)).toEqual(packed);
	expect(packed).toHaveProperty('__proto__', 'header');
	expect(packed).not.toHaveProperty('absent');
});

function apiTestContext(actor: MiLocalUser | null, ip = '127.0.0.1', headers: Record<string, string | string[] | undefined> = {}): ApiContext<MiLocalUser> {
	if (actor !== null) { actor.isSuspended = false; actor.movedToUri = null; }
	return {
		credential: actor ? 'fixture' : null, ip, headers,
		services: {
			authenticate: async () => [actor, null],
			limitActor: () => null,
			rateLimitFactor: async () => 1,
			limit: async () => null,
		},
		authorization: {
			rootUserId: () => actor?.id ?? null,
			roles: async () => [],
			policyAllowed: async () => false,
		},
	};
}
