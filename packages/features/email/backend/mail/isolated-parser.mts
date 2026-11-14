/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { MAIL_PARSE_LIMITS, safeMailAttachmentFilename } from './parser.js';
import { createMailHtmlDocument } from './html.js';

type AttachmentMetadata = { filename: string | null; mimeType: string; contentId: string | null; size: number };
type Projection = { subject: string; from: string; text: string; html: string | null; attachments: AttachmentMetadata[] };
type AttachmentContent = { filename: string | null; mimeType: string; content: Uint8Array };
let attachmentWorkerActive = false;

/** A hard CPU/memory deadline, not Promise.race around CPU-bound MIME parsing. */
async function runIsolated<T>(raw: Uint8Array, attachmentIndex?: number): Promise<T> {
	if (raw.byteLength > MAIL_PARSE_LIMITS.maxBytes) throw new Error('MAIL_TOO_LARGE');
	const moduleUrl = pathToFileURL(createRequire(import.meta.url).resolve('postal-mime')).href;
	const worker = new Worker(`
		const { parentPort, workerData } = require('node:worker_threads');
		(async () => {
			const { default: PostalMime } = await import(workerData.moduleUrl);
			const mail = await PostalMime.parse(workerData.raw, { ...workerData.limits, attachmentEncoding: 'arraybuffer' });
			if (mail.attachments.some(a => a.rfc822DepthExceeded)) throw new Error('DEPTH');
			if (workerData.attachmentIndex !== undefined) {
				const attachment = mail.attachments[workerData.attachmentIndex];
				if (!attachment || !(attachment.content instanceof ArrayBuffer)) throw new Error('NOT_FOUND');
				parentPort.postMessage({ filename: attachment.filename, mimeType: attachment.mimeType,
					content: new Uint8Array(attachment.content) }, [attachment.content]);
				return;
			}
			parentPort.postMessage({ subject: (mail.subject ?? '').slice(0, 4096), from: (mail.from?.address ?? '').slice(0, 254),
				text: (mail.text ?? '').slice(0, 100000), html: mail.html ? mail.html.slice(0, 100000) : null,
				attachments: mail.attachments.map(a => ({ filename: a.filename, mimeType: a.mimeType, contentId: a.contentId ?? null, size: a.content.byteLength })) });
		})().catch(() => { parentPort.postMessage(null); });
	`, { eval: true, workerData: { moduleUrl, raw, attachmentIndex, limits: MAIL_PARSE_LIMITS }, resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 16, stackSizeMb: 4 } });
	try {
		return await new Promise<T>((resolve, reject) => {
			const timeout = setTimeout(() => reject(new Error('MAIL_PARSE_TIMEOUT')), 30_000);
			worker.once('message', value => { clearTimeout(timeout); if (value) resolve(value); else reject(new Error('MAIL_PARSE_FAILED')); });
			worker.once('error', () => { clearTimeout(timeout); reject(new Error('MAIL_PARSE_FAILED')); });
			worker.once('exit', () => { clearTimeout(timeout); reject(new Error('MAIL_PARSE_FAILED')); });
		});
	} finally { await worker.terminate(); }
}

function safeMimeType(value: string): string {
	return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(value) ? value : 'application/octet-stream';
}

export async function parseMailIsolated(raw: Uint8Array): Promise<Record<string, unknown>> {
	const projection = await runIsolated<Projection>(raw);
	const result = {
		...projection,
		html: projection.html ? createMailHtmlDocument(projection.html) : null,
		attachments: projection.attachments.map(item => ({
			filename: safeMailAttachmentFilename(item.filename),
			mimeType: safeMimeType(item.mimeType), size: item.size,
			contentId: item.contentId && /^<?[a-zA-Z0-9_.@+-]{1,200}>?$/.test(item.contentId) ? item.contentId.replace(/^<|>$/g, '') : null,
		})),
	};
	if (Buffer.byteLength(JSON.stringify(result)) > 900_000) result.html = null;
	return result;
}

/** Call only after owner-scoped raw lookup. One attachment parser per API process, no unbounded waiter queue. */
export async function readMailAttachmentIsolated(raw: Uint8Array, index: number): Promise<{ filename: string; mimeType: string; content: Uint8Array }> {
	if (!Number.isInteger(index) || index < 0 || index >= MAIL_PARSE_LIMITS.maxPartCount) throw new Error('MAIL_ATTACHMENT_NOT_FOUND');
	if (attachmentWorkerActive) throw new Error('MAIL_ATTACHMENT_BUSY');
	attachmentWorkerActive = true;
	try {
		const attachment = await runIsolated<AttachmentContent>(raw, index);
		return { filename: safeMailAttachmentFilename(attachment.filename), mimeType: safeMimeType(attachment.mimeType), content: attachment.content };
	} finally { attachmentWorkerActive = false; }
}
