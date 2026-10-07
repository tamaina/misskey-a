/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedDriveFileSchema, packedDriveFolderSchema } from '../../contract/packed.js';
import { listingDriveFilesInput, listingDriveFilesDefinition } from '../../contract/drive-listing-endpoint-definitions.js';
import { selectorAdminDriveShowFileOutput } from '../../contract/selector-endpoint-definitions.js';
import { DriveFileEntityService } from '../../backend/serializers/DriveFileEntityService.js';
import { DriveFolderEntityService } from '../../backend/serializers/DriveFolderEntityService.js';
import { EndpointImplementation as AdminShowFile } from '../../backend/endpoints/admin/drive/show-file.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiDriveFile } from '../../backend/models/DriveFile.js';
import type { MiDriveFolder } from '../../backend/models/DriveFolder.js';

const date = new Date('2026-01-01T00:00:00Z');

function checkClosed(schema: v.GenericSchema, value: Record<string, unknown>, required: string, wrong: Record<string, unknown>) {
	expect(v.safeParse(schema, value).success).toBe(true);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	const missing = { ...value };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...value, ...wrong }).success).toBe(false);
}

function driveFile() {
	return mockDeep<MiDriveFile>({ id: 'file123', userId: null, userHost: null, folderId: null, name: 'image.jpg', type: 'image/jpeg', md5: 'hash', size: 12, isSensitive: false, blurhash: null, properties: { width: 640, height: 480, orientation: 8, avgColor: 'rgb(1,2,3)' }, url: 'https://example/image.jpg', thumbnailUrl: null, webpublicUrl: null, webpublicType: null, comment: null, uri: null, src: null, storedInternal: true, isLink: false, maybeSensitive: false, maybePorn: false, accessKey: null, thumbnailAccessKey: null, webpublicAccessKey: null, requestIp: null, requestHeaders: null });
}

test.each([false, true])('actual DriveFile producer validates public and self properties: %s', async self => {
	const ids = mockDeep<ConstructorParameters<typeof DriveFileEntityService>[7]>();
	ids.parse.mockReturnValue({ date });
	const service = new DriveFileEntityService(mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), ids);
	const file = driveFile();
	const output = await service.pack(file, { self });
	checkClosed(packedDriveFileSchema, output, 'name', { size: '12' });
	expect(output.properties).toEqual(self ? { width: 640, height: 480, orientation: 8, avgColor: 'rgb(1,2,3)' } : { width: 480, height: 640, orientation: undefined, avgColor: 'rgb(1,2,3)' });
	expect(output.folder).toBeNull();
	expect(output.user).toBeNull();
	expect(v.safeParse(packedDriveFileSchema, { ...output, properties: { ...output.properties, unknown: 1 } }).success).toBe(false);
	file.userId = 'owner123';
	expect((await service.packNullable(file, { self }))?.userId).toBe('owner123');
	expect((await service.pack(file, { self })).userId).toBeNull();
});

test('actual folder producer validates basic, detail and recursive parent variants', async () => {
	const folders = mockDeep<ConstructorParameters<typeof DriveFolderEntityService>[0]>();
	const files = mockDeep<ConstructorParameters<typeof DriveFolderEntityService>[1]>();
	const ids = mockDeep<ConstructorParameters<typeof DriveFolderEntityService>[2]>();
	ids.parse.mockReturnValue({ date });
	folders.countBy.mockResolvedValue(2);
	files.countBy.mockResolvedValue(3);
	const service = new DriveFolderEntityService(folders, files, ids);
	const parent = mockDeep<MiDriveFolder>({ id: 'parent123', name: 'parent', parentId: null });
	const folder = mockDeep<MiDriveFolder>({ id: 'folder123', name: 'child', parentId: parent.id });
	folders.findOneByOrFail.mockResolvedValue(parent);
	for (const detail of [false, true]) {
		const output = await service.pack(folder, { detail });
		checkClosed(packedDriveFolderSchema, output, 'name', { parentId: 1 });
		expect(output.foldersCount).toBe(detail ? 2 : undefined);
		expect(output.filesCount).toBe(detail ? 3 : undefined);
		expect(output.parent?.name).toBe(detail ? 'parent' : undefined);
	}
});

test.each([false, true])('actual admin show-file producer includes nullable webpublicType and opaque headers: %s', async moderator => {
	const files = mockDeep<ConstructorParameters<typeof AdminShowFile>[0]>();
	const roles = mockDeep<ConstructorParameters<typeof AdminShowFile>[2]>();
	const ids = mockDeep<ConstructorParameters<typeof AdminShowFile>[3]>();
	ids.parse.mockReturnValue({ date });
	roles.isModerator.mockResolvedValue(moderator);
	const file = driveFile();
	file.requestIp = '127.0.0.1';
	file.requestHeaders = { 'x-custom': 'value' };
	files.findOneBy.mockResolvedValue(file);
	const endpoint = new AdminShowFile(files, mockDeep(), roles, ids);
	const output = await endpoint.exec({ fileId: file.id }, mockDeep<MiLocalUser>({ id: 'viewer123' }), null);
	checkClosed(selectorAdminDriveShowFileOutput, output, 'webpublicType', { webpublicType: 1 });
	expect(output.webpublicType).toBeNull();
	expect(output.requestHeaders).toEqual(moderator ? file.requestHeaders : null);
});

test('finite drive input strips extras while HTTP retains unknown keys, defaults and response identity', async () => {
	expect(v.parse(listingDriveFilesInput, { future: true })).toEqual({ limit: 10, folderId: null });
	for (const value of [{ limit: 0 }, { limit: '10' }, { folderId: 1 }]) expect(v.safeParse(listingDriveFilesInput, value).success).toBe(false);
	const projection = projectEndpointContract(listingDriveFilesDefinition);
	expect(projection.input).not.toHaveProperty('additionalProperties');
	const params = { future: true };
	const response: v.InferOutput<typeof listingDriveFilesDefinition.output> = [];
	const endpoint = new ContractEndpoint({}, projection, async ps => { expect(ps).toBe(params); return response; });
	expect(await endpoint.exec(params, null, null)).toBe(response);
	expect(params).toEqual({ future: true, limit: 10, folderId: null });
	await expect(endpoint.exec({ limit: 0 }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', info: { param: '#/properties/limit/minimum' } });
});
