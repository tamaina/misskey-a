/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Fastify from 'fastify';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { AuthenticationError } from '@features/auth/backend/transport/AuthenticateService.js';
import type { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import type { DriveFilesRepository, MiDriveFile } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import type { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { FileServerService } from '../../backend/http/FileServerService.js';

const authenticate = mockDeep<AuthenticateService>();
const files = mockDeep<DriveFilesRepository>();
const resolvePath = vi.fn<(key: string) => string>();
let directory: string;
let app: ReturnType<typeof Fastify>;
let file: MiDriveFile;
let user: MiLocalUser;

beforeEach(async () => {
	vi.resetAllMocks();
	directory = await mkdtemp(join(tmpdir(), 'drive-download-'));
	await writeFile(join(directory, 'original-key'), '<script>original</script>');
	resolvePath.mockImplementation(key => join(directory, key));
	user = mockDeep<MiLocalUser>({ id: 'owner', host: null, isSuspended: false, isDeleted: false });
	file = mockDeep<MiDriveFile>({ id: 'file1', userId: 'owner', userHost: null, storedInternal: true, isLink: false, accessKey: 'original-key', name: '日本語.html', type: 'text/html', size: 999 });
	authenticate.authenticate.mockResolvedValue([user, null]);
	files.findOneBy.mockImplementation(async where => 'userId' in where && where.userId === file.userId && where.id === file.id ? file : null);
	app = Fastify();
	const logger = mockDeep<LoggerService>();
	logger.getLogger.mockReturnValue(mockDeep());
	const server = new FileServerService(
		mockDeep({ rootDir: directory }), files, mockDeep(), mockDeep(), mockDeep(), mockDeep(),
		mockDeep({ resolvePath }), logger, authenticate,
	);
	server.createServer(app, {}, () => {});
});

afterEach(async () => {
	await app.close();
	await rm(directory, { recursive: true, force: true });
});

test('streams the owner original as an uncached attachment, using the actual size', async () => {
	const response = await app.inject({ url: '/drive/file1', headers: { authorization: 'Bearer owner-token', range: 'bytes=0-1' } });
	expect(response.statusCode).toBe(200);
	expect(response.body).toBe('<script>original</script>');
	expect(response.headers['content-type']).toBe('application/octet-stream');
	expect(response.headers['content-length']).toBe(String(Buffer.byteLength(response.body)));
	expect(response.headers['content-disposition']).toMatch(/^attachment;.*filename\*=UTF-8''/);
	expect(response.headers['cache-control']).toBe('private, no-store');
	expect(response.headers.vary).toBe('Authorization');
	expect(response.headers['x-content-type-options']).toBe('nosniff');
	expect(response.headers.location).toBeUndefined();
	expect(response.headers['accept-ranges']).toBeUndefined();
	expect(authenticate.authenticate).toHaveBeenCalledWith('owner-token');
	expect(files.findOneBy).toHaveBeenCalledWith({ id: 'file1', userId: 'owner' });
});

test.each(['/drive/file1', '/drive/file1?i=owner-token', '/drive/file1?token=owner-token'])('does not accept cookie or URL credentials: %s', async url => {
	const response = await app.inject({ url, headers: { cookie: 'i=owner-token' } });
	expect(response.statusCode).toBe(401);
	expect(response.headers['cache-control']).toBe('private, no-store');
	expect(authenticate.authenticate).not.toHaveBeenCalled();
	expect(files.findOneBy).not.toHaveBeenCalled();
});

test.each(['Basic owner-token', 'Bearer a,b', 'Bearer a b', 'Bearer '])('rejects malformed authorization: %s', async authorization => {
	expect((await app.inject({ url: '/drive/file1', headers: { authorization } })).statusCode).toBe(401);
	expect(authenticate.authenticate).not.toHaveBeenCalled();
});

test.each(['isSuspended', 'isDeleted'] as const)('rejects %s before resolving a file', async flag => {
	user[flag] = true;
	expect((await app.inject({ url: '/drive/file1', headers: { authorization: 'Bearer token' } })).statusCode).toBe(403);
	expect(files.findOneBy).not.toHaveBeenCalled();
});

test('requires read:drive for application credentials', async () => {
	const token = mockDeep<MiAccessToken>({ permission: ['read:account'] });
	authenticate.authenticate.mockResolvedValue([user, token]);
	expect((await app.inject({ url: '/drive/file1', headers: { authorization: 'Bearer token' } })).statusCode).toBe(403);
	expect(files.findOneBy).not.toHaveBeenCalled();
	token.permission = ['read:drive'];
	expect((await app.inject({ url: '/drive/file1', headers: { authorization: 'Bearer token' } })).statusCode).toBe(200);
});

test('other owners and missing files are indistinguishable without touching storage', async () => {
	file.userId = 'another-owner';
	for (const id of ['file1', 'missing']) {
		const response = await app.inject({ url: `/drive/${id}`, headers: { authorization: 'Bearer token' } });
		expect(response.statusCode).toBe(404);
		expect(response.body).toBe('');
		expect(response.headers['cache-control']).toBe('private, no-store');
	}
	expect(resolvePath).not.toHaveBeenCalled();
});

test.each([null, '.', '..', '../outside', 'a/b'])('rejects invalid storage keys: %s', async key => {
	file.accessKey = key;
	expect((await app.inject({ url: '/drive/file1', headers: { authorization: 'Bearer token' } })).statusCode).toBe(404);
	expect(resolvePath).not.toHaveBeenCalled();
});

test('does not redirect object storage or remote files to public URLs', async () => {
	file.storedInternal = false;
	file.url = 'https://storage.example/secret-key';
	const response = await app.inject({ url: '/drive/file1', headers: { authorization: 'Bearer token' } });
	expect(response.statusCode).toBe(404);
	expect(response.headers.location).toBeUndefined();
	expect(resolvePath).not.toHaveBeenCalled();
});

test('missing original returns an uncached 404', async () => {
	file.accessKey = 'missing';
	const response = await app.inject({ url: '/drive/file1', headers: { authorization: 'Bearer token' } });
	expect(response.statusCode).toBe(404);
	expect(response.headers['cache-control']).toBe('private, no-store');
});

test('invalid native credentials return an uncached 401 without querying files', async () => {
	authenticate.authenticate.mockRejectedValue(new AuthenticationError('private diagnostic'));
	const response = await app.inject({ url: '/drive/file1', headers: { authorization: 'Bearer invalid' } });
	expect(response.statusCode).toBe(401);
	expect(response.headers['cache-control']).toBe('private, no-store');
	expect(response.headers['www-authenticate']).toContain('invalid_token');
	expect(response.body).toBe('');
	expect(files.findOneBy).not.toHaveBeenCalled();
});

test('internal failures remain uncached and do not expose diagnostics or use public fallbacks', async () => {
	files.findOneBy.mockRejectedValue(new Error('private file details'));
	const response = await app.inject({ url: '/drive/file1?fallback=1', headers: { authorization: 'Bearer token' } });
	expect(response.statusCode).toBe(500);
	expect(response.headers['cache-control']).toBe('private, no-store');
	expect(response.body).toBe('');
});

test('HEAD follows the same ownership gate and returns headers without a body', async () => {
	const response = await app.inject({ method: 'HEAD', url: '/drive/file1', headers: { authorization: 'Bearer token' } });
	expect(response.statusCode).toBe(200);
	expect(response.body).toBe('');
	expect(response.headers['content-length']).toBe('25');
	file.userId = 'another-owner';
	expect((await app.inject({ method: 'HEAD', url: '/drive/file1', headers: { authorization: 'Bearer token' } })).statusCode).toBe(404);
});
