/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createWriteStream, openAsBlob } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { finished } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import type { FastifyRequest } from 'fastify';
import type { UploadResource } from './context.js';

export class UploadRequestError extends Error {
	constructor(public readonly status: 400 | 413, message: string) { super(message); }
}

/** Retains the existing empty/destroyed-part handling; pipeline can hang on that case. */
export async function writeMultipartFile(file: Readable, path: string, signal: AbortSignal): Promise<void> {
	const destination = createWriteStream(path, { flags: 'wx' });
	let failed = false;
	const reading = finished(file, { writable: false }).then(() => null, (error: Error) => {
		if (failed) return null;
		failed = true;
		return error;
	});
	const writing = finished(destination, { readable: false }).then(() => null, (error: Error) => {
		if (failed) return null;
		failed = true;
		file.destroy();
		return error;
	});
	const abort = () => { failed = true; file.destroy(); destination.destroy(); };
	signal.addEventListener('abort', abort, { once: true });
	try {
		if (signal.aborted) abort();
		else file.pipe(destination, { end: false });
		const readError = await reading;
		if (failed) { file.destroy(); destination.destroy(); } else destination.end();
		const writeError = await writing;
		if (signal.aborted || readError) throw new UploadRequestError(400, 'Incomplete multipart upload');
		if (writeError) throw writeError;
	} finally {
		signal.removeEventListener('abort', abort);
	}
}

/** Only the multipart parser/staging differs from the official handler's body reader. */
export async function withStagedUpload(
	request: FastifyRequest,
	options: { maxFileSize: number; directory?: string },
	consume: (body: Record<string, unknown>, upload: UploadResource, cleanup: () => Promise<void>) => Promise<void>,
): Promise<void> {
	const controller = new AbortController();
	const abort = () => controller.abort();
	// Listen before the first asynchronous staging operation; an early close is not replayed.
	request.raw.once('aborted', abort);
	if (request.raw.aborted) abort();
	let directory: string | undefined;
	let cleanupPromise: Promise<void> | undefined;
	const cleanup = () => cleanupPromise ??= directory === undefined
		? Promise.resolve() : rm(directory, { recursive: true, force: true });
	const checkCanceled = () => {
		if (controller.signal.aborted) throw new UploadRequestError(400, 'Upload canceled');
	};
	try {
		checkCanceled();
		directory = await mkdtemp(join(options.directory ?? tmpdir(), 'misskey-upload-'));
		checkCanceled();
		const path = join(directory, 'file');
		const fields: Record<string, unknown> = {};
		let upload: UploadResource | undefined;
		try {
			// Preserve plugin limits, including its bounded field/part/header parser defaults.
			const parts = request.parts({ limits: { files: 1, fileSize: options.maxFileSize } });
			try {
				while (true) {
					checkCanceled();
					const result = await parts.next().catch((error: unknown) => {
						const limited = error !== null && typeof error === 'object' && 'code' in error
							&& typeof error.code === 'string' && /TOO_LARGE|LIMIT/.test(error.code);
						throw new UploadRequestError(limited ? 413 : 400, 'Invalid multipart request');
					});
					if (result.done) break;
					const part = result.value;
					if (controller.signal.aborted) throw new UploadRequestError(400, 'Upload canceled');
					if (part.type === 'file') {
						await writeMultipartFile(part.file, path, controller.signal);
						if (part.file.truncated) throw new UploadRequestError(413, 'File size limit exceeded');
						const blob = await openAsBlob(path, { type: part.mimetype });
						const file = new File([blob], part.filename, { type: part.mimetype });
						upload = { path, name: part.filename, file };
					} else {
						if (part.fieldnameTruncated || part.valueTruncated) throw new UploadRequestError(400, 'Field limit exceeded');
						Object.defineProperty(fields, part.fieldname, { value: part.value, enumerable: true, configurable: true, writable: true });
					}
				}
			} finally {
				await parts.return?.();
			}
		} catch (error) {
			if (error instanceof UploadRequestError) throw error;
			if (error !== null && typeof error === 'object' && 'code' in error
				&& typeof error.code === 'string' && error.code.startsWith('FST_')) {
				throw new UploadRequestError(error.code.includes('TOO_LARGE') || error.code.includes('LIMIT') ? 413 : 400, 'Invalid multipart request');
			}
			throw error;
		}
		if (!upload) throw new UploadRequestError(400, 'File required');
		// This exact native File is supplied both to the public contract and trusted context.
		await consume({ ...fields, file: upload.file }, upload, cleanup);
	} finally {
		request.raw.removeListener('aborted', abort);
		// Await consumers before deleting, including validation/business/output-error paths.
		await cleanup();
	}
}
