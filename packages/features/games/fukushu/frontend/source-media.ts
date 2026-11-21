/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const allowedMime = /^(?:image\/(?:png|jpeg|gif|webp|avif)|audio\/(?:mpeg|ogg|wav|x-wav|mp4|webm|flac))$/i;
export type SourceMedia = { url: string; mimeType: string };

async function readPage(id: string, offset: number, signal: AbortSignal) {
	while (true) {
		signal.throwIfAborted();
		try {
			return await misskeyApi('fukushu/upstream/media', { id, offset }, undefined, signal);
		} catch (cause) {
			const error = cause as { code?: string; info?: { resetMs?: number } } | null;
			const reset = error?.info?.resetMs;
			if (error?.code !== 'RATE_LIMIT_EXCEEDED' || !Number.isFinite(reset) || !reset) throw cause;
			await new Promise<void>((resolve, reject) => {
				signal.throwIfAborted();
				const timer = window.setTimeout(() => {
					signal.removeEventListener('abort', abort);
					resolve();
				}, Math.max(1000, reset - Date.now()));

				function abort() {
					window.clearTimeout(timer);
					reject(signal.reason);
				}

				signal.addEventListener('abort', abort, { once: true });
			});
		}
	}
}

// The library can mount ten cards at once. Keep at most one active download per tab.
let pending = Promise.resolve();
export function loadSourceMedia(id: string, signal: AbortSignal): Promise<SourceMedia | undefined> {
	const result = pending.then(() => readSourceMedia(id, signal));
	pending = result.then(() => {}, () => {});
	return result;
}

/** Pass each decoded page to the browser's Blob builder. Only publish a complete, verified attachment. */
async function readSourceMedia(id: string, signal: AbortSignal): Promise<SourceMedia | undefined> {
	const first = await readPage(id, 0, signal);
	const mimeType = first.mimeType.toLowerCase();
	if (!allowedMime.test(mimeType)) return;
	const decode = (base64: string) => Uint8Array.from(atob(base64), char => char.charCodeAt(0));
	const initial = decode(first.base64);
	const size = first.totalBytes ?? initial.length;
	const hash = sha256.create().update(initial);

	function verify() {
		signal.throwIfAborted();
		if (bytesToHex(hash.digest()) !== id) throw new Error('Media digest mismatch');
	}

	if (initial.length === size) {
		verify();
		return { mimeType, url: 'data:' + mimeType + ';base64,' + first.base64 };
	}
	if (!initial.length || initial.length > size) throw new Error('Invalid media page');
	let offset = initial.length;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(initial);
		},
		async pull(controller) {
			const page = await readPage(id, offset, signal);
			signal.throwIfAborted();
			const bytes = decode(page.base64);
			if (page.mimeType.toLowerCase() !== mimeType || page.totalBytes !== size || !bytes.length || bytes.length > size - offset) throw new Error('Invalid media page');
			hash.update(bytes);
			offset += bytes.length;
			controller.enqueue(bytes);
			if (offset === size) {
				verify();
				controller.close();
			}
		},
	});
	const blob = await new Response(stream, { headers: { 'Content-Type': mimeType } }).blob();
	signal.throwIfAborted();
	return { mimeType, url: URL.createObjectURL(blob) };
}
