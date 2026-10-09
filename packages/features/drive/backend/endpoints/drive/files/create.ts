/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { CreateFileDependencies } from '../../../create-file.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError, internalError } from "@features/api/backend/transport/orpc-error.js";
import { driveCreateContract } from './create.contract.js';
import type { ApiActor } from "@features/api/backend/transport/context.js";

function isRecord(input: unknown): input is Record<string, unknown> {
	return input !== null && typeof input === 'object' && !Array.isArray(input);
}

export function createDriveFileProcedure<Actor extends ApiActor, File>(deps: CreateFileDependencies<Actor, File>) {
	return createApiProcedure<Actor>()(driveCreateContract).use(requirePrincipal<Actor>())
		.use(async ({ context, next }) => {
			if (!context.upload) throw apiError({
				code: 'FILE_REQUIRED', message: 'File required.', id: '4267801e-70d1-416a-b011-4ee502885d8b',
			});
			return next({ context: { upload: context.upload } });
		})
		.use(async ({ next }, input) => {
			// Representation decoding follows authorization, as in the existing transport.
			if (isRecord(input)) {
				for (const key of ['force', 'isSensitive'] as const) {
					if (key in input && typeof input[key] === 'string') {
						try {
							input[key] = JSON.parse(input[key]);
						} catch {
							throw apiError({
								code: 'INVALID_PARAM', message: 'Invalid param.',
								id: '0b5f1631-7c1a-41a6-b399-cce335f34d85'
							}, { param: key, reason: 'cannot cast to boolean' });
						}
					}
				}
			}
			return next();
		})
		.handler(async ({ input, context }) => {
		if (input.file !== context.upload.file) throw new Error('Upload resource does not match its wire File');
		const actor = context.principal;
		const upload = context.upload;
		const request = context;
		let name = input.name ?? upload.name;
		if (name !== null) {
			name = name.trim();
			if (name.length === 0 || name === 'blob') name = null;
			else if (!deps.validateFileName(name)) throw apiError({
				code: 'INVALID_FILE_NAME', message: 'Invalid file name.',
				id: 'f449b209-0c60-4e51-84d5-29486263bfd4',
			});
		}
		let packed: Awaited<ReturnType<typeof deps.pack>>;
		try {
			const file = await deps.addFile({
				user: actor, path: upload.path, name, comment: input.comment, folderId: input.folderId,
				force: input.force, sensitive: input.isSensitive,
				requestIp: deps.enableIpLogging() ? request.ip : null,
				requestHeaders: deps.enableIpLogging() ? request.headers : null,
			});
			packed = await deps.pack(file);
		} catch (error) {
			deps.logError(error);
			const id = error !== null && typeof error === 'object' && 'id' in error ? error.id : undefined;
			if (id === '282f77bf-5816-4f72-9264-aa14d8261a21') throw apiError({
				code: 'INAPPROPRIATE', message: 'Cannot upload the file because it has been determined that it possibly contains inappropriate content.',
				id: 'bec5bd69-fba3-43c9-b4fb-2894b66ad5d2',
			});
			if (id === 'c6244ed2-a39a-4e1c-bf93-f0fbd7764fa6') throw apiError({
				code: 'NO_FREE_SPACE', message: 'Cannot upload the file because you have no free space of drive.',
				id: 'd08dbc37-a6a9-463a-8c47-96c32ab5f064',
			});
			if (id === 'f9e4e5f3-4df4-40b5-b400-f236945f7073') throw apiError({
				code: 'MAX_FILE_SIZE_EXCEEDED', message: 'Cannot upload the file because it exceeds the maximum file size.',
				id: 'b9d8c348-33f0-4673-b9a9-5d4da058977a', status: 413,
			});
			if (id === 'bd71c601-f9b0-4808-9137-a330647ced9b') throw apiError({
				code: 'UNALLOWED_FILE_TYPE', message: 'Cannot upload the file because it is an unallowed file type.',
				id: '4becd248-7f2c-48c4-a9f0-75edc4f9a1ea',
			});
			throw apiError(internalError);
		}
		if (packed.folder != null || packed.user != null || packed.userId != null) {
			throw new Error('Self upload packing returned unexpected relationship fields');
		}
		// Select public wire fields; packers may also carry internal storage data.
		return {
			id: packed.id,
			createdAt: packed.createdAt,
			name: packed.name,
			type: packed.type,
			md5: packed.md5,
			size: packed.size,
			isSensitive: packed.isSensitive,
			blurhash: packed.blurhash,
			properties: {
				...(packed.properties.width === undefined ? {} : { width: packed.properties.width }),
				...(packed.properties.height === undefined ? {} : { height: packed.properties.height }),
				...(packed.properties.orientation === undefined ? {} : { orientation: packed.properties.orientation }),
				...(packed.properties.avgColor === undefined ? {} : { avgColor: packed.properties.avgColor }),
			},
			url: packed.url,
			thumbnailUrl: packed.thumbnailUrl,
			comment: packed.comment,
			folderId: packed.folderId,
			folder: null,
			user: null,
			userId: null,
		};
	});
}
