/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DriveCreateInput, DriveCreateOutput } from './endpoints/drive/files/create.schema.js';
import type { UploadResource } from '../../api/backend/transport/context.js';
import { apiError, internalError } from '../../api/backend/transport/orpc-error.js';

export interface CreateFileDependencies<Actor, File> {
	validateFileName(name: string): boolean;
	enableIpLogging(): boolean;
	addFile(options: {
		user: Actor; path: string; name: string | null; comment: string | null; folderId: string | null;
		force: boolean; sensitive: boolean; requestIp: string | null;
		requestHeaders: Record<string, string | string[] | undefined> | null;
	}): Promise<File>;
	pack(file: File): Promise<Omit<DriveCreateOutput, 'folder' | 'user' | 'userId'> & {
		folder?: unknown; user?: unknown; userId?: string | null;
	}>;
	logError(error: unknown): void;
}

/** Temporary file ownership belongs to the HTTP boundary, including error paths. */
export function createFileService<Actor, File>(deps: CreateFileDependencies<Actor, File>) {
	return async (input: DriveCreateInput, actor: Actor, upload: UploadResource,
		request: { ip: string; headers: Record<string, string | string[] | undefined> }): Promise<DriveCreateOutput> => {
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
		// Copy without stripping unknown fields. Output validation rejects undeclared fields.
		const properties = { ...packed.properties };
		for (const key of ['width', 'height', 'orientation', 'avgColor'] as const) {
			if (properties[key] === undefined) delete properties[key];
		}
		return { ...packed, properties, folder: null, user: null, userId: null };
	};
}
