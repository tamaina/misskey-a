/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { open } from 'node:fs/promises';
import { Readable } from 'node:stream';
import type { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import { contentDisposition } from '../utility/content-disposition.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** Owner-only original downloads. Existing public file URLs keep their separate semantics. */
export class DriveDownloadHandler {
	constructor(
		private authenticateService: Pick<AuthenticateService, 'authenticate'>,
		private driveFilesRepository: Pick<DriveFilesRepository, 'findOneBy'>,
		private internalStorageService: Pick<InternalStorageService, 'resolvePath'>,
	) {}

	public async handle(request: FastifyRequest<{ Params: { fileId: string } }>, reply: FastifyReply) {
		reply.header('Cache-Control', 'private, no-store');
		reply.header('Vary', 'Authorization');
		reply.header('X-Content-Type-Options', 'nosniff');

		// Credentials never belong in a URL, cookie, or redirect to the public file server.
		const match = /^Bearer ([^\s,]+)$/i.exec(request.headers.authorization ?? '');
		if (match === null) {
			reply.header('WWW-Authenticate', 'Bearer realm="Misskey"');
			return reply.code(401).send();
		}

		const [user, token] = await this.authenticateService.authenticate(match[1]);
		if (user === null || user.host !== null || user.isSuspended || user.isDeleted || (token && !token.permission.includes('read:drive'))) {
			return reply.code(403).send();
		}

		// Include ownership in the lookup: missing and other people's IDs have the same response.
		const file = await this.driveFilesRepository.findOneBy({ id: request.params.fileId, userId: user.id });
		if (!file || !file.storedInternal || file.isLink || file.userHost !== null || !file.accessKey ||
			!/^[a-zA-Z0-9._-]+$/.test(file.accessKey) || file.accessKey === '.' || file.accessKey === '..') {
			return reply.code(404).send();
		}

		let handle;
		try {
			handle = await open(this.internalStorageService.resolvePath(file.accessKey), 'r');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return reply.code(404).send();
			throw error;
		}
		try {
			const stat = await handle.stat();
			if (!stat.isFile()) {
				await handle.close();
				return reply.code(404).send();
			}
			reply.header('Content-Type', 'application/octet-stream');
			reply.header('Content-Disposition', contentDisposition('attachment', file.name));
			reply.header('Content-Length', stat.size);
			// This first slice sends the complete original; it does not advertise range support.
			if (request.method === 'HEAD') {
				await handle.close();
				// An empty send() makes Fastify overwrite Content-Length with zero.
				return reply.send(Readable.from([]));
			}
			return reply.send(handle.createReadStream());
		} catch (error) {
			await handle.close();
			throw error;
		}
	}
}
