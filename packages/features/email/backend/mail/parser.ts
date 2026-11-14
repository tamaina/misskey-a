/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import PostalMime from 'postal-mime';
import { createMailHtmlDocument } from './html.js';

/** PostalMime 4.2.0 has shared part/header budgets across nested RFC822 messages. */
export const MAIL_PARSE_LIMITS = Object.freeze({
	maxBytes: 25 * 1024 * 1024,
	maxNestingDepth: 20,
	maxHeadersSize: 128 * 1024,
	maxPartCount: 200,
	maxRfc822NestingDepth: 3,
	maxForwardedAddresses: 200,
});

export type ParsedMailAttachment = {
	filename: string;
	mimeType: string;
	contentId: string | null;
	content: Uint8Array;
};
export type ParsedIncomingMail = {
	subject: string;
	from: string;
	text: string;
	html: string | null;
	attachments: ParsedMailAttachment[];
};

export function safeMailAttachmentFilename(value: string | null): string {
	// eslint-disable-next-line no-control-regex
	return (value ?? 'attachment').replace(/[\x00-\x1f\x7f/\\]/g, '_').slice(0, 200) || 'attachment';
}

/** Call only in a bounded-concurrency worker. Parse failures retain the raw mail. */
export async function parseIncomingMail(raw: Uint8Array, limits = MAIL_PARSE_LIMITS): Promise<ParsedIncomingMail> {
	if (!Number.isSafeInteger(limits.maxBytes) || limits.maxBytes < 1 || raw.byteLength > limits.maxBytes) throw new Error('MAIL_TOO_LARGE');
	const parsed = await PostalMime.parse(raw, {
		attachmentEncoding: 'arraybuffer',
		maxNestingDepth: limits.maxNestingDepth,
		maxHeadersSize: limits.maxHeadersSize,
		maxPartCount: limits.maxPartCount,
		maxRfc822NestingDepth: limits.maxRfc822NestingDepth,
		maxForwardedAddresses: limits.maxForwardedAddresses,
	});
	// Do not claim opaque nested content has been inspected, nor recursively retry.
	if (parsed.attachments.some(attachment => attachment.rfc822DepthExceeded)) throw new Error('MAIL_RFC822_DEPTH_EXCEEDED');
	return {
		subject: parsed.subject ?? '',
		from: parsed.from?.address ?? '',
		text: parsed.text ?? '',
		html: parsed.html ? createMailHtmlDocument(parsed.html) : null,
		attachments: parsed.attachments.map(attachment => {
			if (typeof attachment.content === 'string') throw new Error('MAIL_ATTACHMENT_ENCODING');
			return {
				filename: safeMailAttachmentFilename(attachment.filename),
				mimeType: /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(attachment.mimeType) ? attachment.mimeType : 'application/octet-stream',
				contentId: attachment.contentId && /^<?[a-zA-Z0-9_.@+-]{1,200}>?$/.test(attachment.contentId) ? attachment.contentId.replace(/^<|>$/g, '') : null,
				content: new Uint8Array(attachment.content),
			};
		}),
	};
}
