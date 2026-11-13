/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { access } from 'node:fs/promises';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { createDriveRouter } from '../../backend/api.implementation.js';
import type { CreateFileDependencies } from '../../backend/create-file.js';
import { driveCreateContract } from '../../backend/endpoints/drive/files/create.contract.js';
import { bodyCredential, registerPilotHttp } from '@features/api/backend/transport/pilot-http.js';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
import type { ApiActor, ApiServices } from '@features/api/backend/transport/context.js';

const actor: ApiActor = { id: 'owner', isSuspended: false, movedToUri: null };
const publicFile = {
	id: 'file1', createdAt: '2026-01-01T00:00:00.000Z', name: 'file.txt', type: 'text/plain',
	md5: 'hash', size: 5, isSensitive: false, blurhash: null, properties: {}, url: '/file.txt',
	thumbnailUrl: null, comment: null, folderId: null, folder: null, userId: null, user: null,
};

afterEach(() => vi.restoreAllMocks());

async function fixture() {
	const deps = mockDeep<CreateFileDependencies<ApiActor, string>>();
	deps.validateFileName.mockReturnValue(true);
	deps.addFile.mockResolvedValue('file1');
	const packed = { ...publicFile, accessKey: 'outer-secret', requestHeaders: { private: 'outer' },
		properties: { width: 12, accessKey: 'nested-secret', requestHeaders: { private: 'nested' } },
	};
	deps.pack.mockResolvedValue(packed);
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([actor, null]);
	services.limitActor.mockReturnValue(null);
	const app = Fastify();
	const paths: string[] = [];
	const handler = new OpenAPIHandler(createDriveRouter(deps), { customErrorResponseBodyEncoder: misskeyErrorBody });
	await app.register(async api => {
		await api.register(multipart, { limits: { fileSize: 1024, files: 1 } });
		registerPilotHttp(api, handler, {
			maxFileSize: 1024, runSpan: (_name, run) => run(),
			context: (request, _reply, _name, upload) => {
				if (upload) paths.push(upload.path);
				return { services, credential: bodyCredential(request), ip: request.ip, headers: request.headers, upload };
			},
		});
	}, { prefix: '/api' });
	const post = (content = 'hello', fields = '') => app.inject({ method: 'POST', url: '/api/drive/files/create',
		headers: { 'content-type': 'multipart/form-data; boundary=projection', authorization: 'Bearer native' },
		payload: fields + '--projection\r\nContent-Disposition: form-data; name="file"; filename="file.txt"\r\nContent-Type: text/plain\r\n\r\n' + content + '\r\n--projection--\r\n',
	});
	return { app, deps, services, paths, post };
}

test('multipart HTTP selects outer and nested public fields, skips output validation, and cleans temporary files', async () => {
	const schema = driveCreateContract['~orpc'].outputSchema;
	if (!schema) throw new Error('Missing drive output schema');
	const output = vi.spyOn(schema['~standard'], 'validate');
	const h = await fixture();
	try {
		const response = await h.post();
		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ ...publicFile, properties: { width: 12 } });
		expect(output).not.toHaveBeenCalled();
		expect(h.deps.addFile).toHaveBeenCalledWith(expect.objectContaining({ folderId: null, force: false, sensitive: false }));
		for (const path of h.paths) await expect(access(path)).rejects.toMatchObject({ code: 'ENOENT' });
		h.deps.pack.mockResolvedValue({ ...publicFile, folder: undefined, user: undefined, userId: undefined });
		expect((await h.post()).json()).toEqual(publicFile);
		for (const path of h.paths) await expect(access(path)).rejects.toMatchObject({ code: 'ENOENT' });
	} finally { await h.app.close(); }
});

test('multipart scope and credential rejection precede boolean decoding, and limits still clean staging', async () => {
	const h = await fixture();
	const invalidForce = '--projection\r\nContent-Disposition: form-data; name="force"\r\n\r\ninvalid\r\n';
	try {
		h.services.authenticate.mockResolvedValue([null, null]);
		expect((await h.post('hello', invalidForce)).json()).toMatchObject({ error: { code: 'CREDENTIAL_REQUIRED' } });
		h.services.authenticate.mockResolvedValue([actor, { permission: [] }]);
		expect((await h.post('hello', invalidForce)).json()).toMatchObject({ error: { code: 'PERMISSION_DENIED' } });
		expect(h.deps.addFile).not.toHaveBeenCalled();
		expect((await h.post('x'.repeat(1025))).statusCode).toBe(413);
		for (const path of h.paths) await expect(access(path)).rejects.toMatchObject({ code: 'ENOENT' });
	} finally { await h.app.close(); }
});

test('moderator file metadata preserves role-first rejection and hides other moderator request headers', async () => {
	const { OpenAPIHandler: FetchHandler } = await import('@orpc/openapi/fetch');
	const { createAdminDriveShowFileProcedure } = await import('../../backend/endpoints/admin/drive/show-file.js');
	const { adminDriveShowFileContract } = await import('../../backend/endpoints/admin/drive/show-file.contract.js');
	const deps = mockDeep<Parameters<typeof createAdminDriveShowFileProcedure>[0]>();
	const moderator = mockDeep<import('@features/users/backend/models/User.js').MiLocalUser>({ id: 'moderator', isSuspended: false, movedToUri: null });
	const stored = mockDeep<import('../../backend/models/DriveFile.js').MiDriveFile>({
		id: 'file1', userId: 'otherModerator', userHost: null, isLink: false, maybePorn: false,
		maybeSensitive: false, isSensitive: false, folderId: null, src: null, uri: null,
		webpublicAccessKey: null, thumbnailAccessKey: null, accessKey: 'authorized-admin-field',
		webpublicType: null, webpublicUrl: null, thumbnailUrl: null, url: '/file.txt', storedInternal: true,
		properties: { width: 12 }, blurhash: null, comment: null, size: 5, type: 'text/plain',
		name: 'file.txt', md5: 'hash', requestIp: '127.0.0.2', requestHeaders: { secret: 'stored' },
	});
	const properties = { width: 12, requestHeaders: { secret: 'nested' }, accessKey: 'nested' };
	stored.properties = properties;
	deps.driveFileSelectorRepository.findOneBy.mockResolvedValue(stored);
	deps.usersRepository.findOneByOrFail.mockResolvedValue(mockDeep<import('@features/users/backend/models/User.js').MiUser>({ id: 'otherModerator' }));
	deps.roleService.isModerator.mockResolvedValue(true);
	deps.idService.parse.mockReturnValue({ date: new Date('2026-01-01T00:00:00.000Z') });
	const schema = adminDriveShowFileContract['~orpc'].outputSchema;
	if (!schema) throw new Error('Missing admin drive output schema');
	const output = vi.spyOn(schema['~standard'], 'validate');
	const context: import('@features/api/backend/transport/context.js').ApiContext<typeof moderator> = {
		credential: 'moderator', ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [moderator, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
		authorization: { rootUserId: () => null, roles: async () => [{ isModerator: true, isAdministrator: false }], policyAllowed: async () => false },
	};
	const handler = new FetchHandler({ show: createAdminDriveShowFileProcedure(deps) }, { customErrorResponseBodyEncoder: misskeyErrorBody });
	const post = (input: unknown) => handler.handle(new Request('https://local.test/admin/drive/show-file', {
		method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
	}), { context });
	const result = await post({ fileId: 'file1' });
	if (!result.response) throw new Error('Expected admin file response');
	const body = await result.response.json();
	expect(body).toHaveProperty('properties', { width: 12 });
	expect(body).toMatchObject({ requestIp: '127.0.0.2', requestHeaders: null, properties: { width: 12 }, accessKey: 'authorized-admin-field' });
	expect(output).not.toHaveBeenCalled();
	context.authorization = { rootUserId: () => null, roles: async () => [], policyAllowed: async () => false };
	const denied = await post(null);
	if (!denied.response) throw new Error('Expected admin file denial');
	expect(await denied.response.json()).toMatchObject({ error: { code: 'ROLE_PERMISSION_DENIED' } });
	expect(deps.driveFileSelectorRepository.findOneBy).toHaveBeenCalledTimes(1);
});
