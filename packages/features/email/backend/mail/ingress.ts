/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export class MailIngressError extends Error {
	constructor(public readonly code: 'INVALID_RECIPIENT' | 'TOO_LARGE' | 'UNAUTHENTICATED' | 'INVALID_DATA') {
		super(code);
	}
}

/** SMTP envelope addresses only. Never call this on To/Cc/Delivered-To headers. */
export function parseEnvelopeRecipient(address: string, configuredDomain: string): { username: string; suffix: string | null; address: string } {
	const match = /^([a-zA-Z0-9_]{1,64})(?:\+([a-zA-Z0-9_.-]{1,64}))?@([a-zA-Z0-9.-]+)$/.exec(address);
	if (!match || !configuredDomain || match[3].toLowerCase() !== configuredDomain.toLowerCase() || address.slice(0, address.indexOf('@')).length > 64) {
		throw new MailIngressError('INVALID_RECIPIENT');
	}
	return { username: match[1].toLowerCase(), suffix: match[2] || null, address };
}

/** Applies to actual octets, irrespective of an SMTP SIZE declaration. */
export async function readBoundedMailData(stream: AsyncIterable<Uint8Array> & { sizeExceeded?: boolean }, maxBytes: number): Promise<Buffer> {
	if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new RangeError('Invalid mail size limit');
	const chunks: Buffer[] = [];
	let length = 0;
	for await (const chunk of stream) {
		if (!(chunk instanceof Uint8Array)) throw new MailIngressError('INVALID_DATA');
		length += chunk.byteLength;
		if (stream.sizeExceeded || length > maxBytes) throw new MailIngressError('TOO_LARGE');
		chunks.push(Buffer.from(chunk));
	}
	if (stream.sizeExceeded) throw new MailIngressError('TOO_LARGE');
	if (length === 0) throw new MailIngressError('INVALID_DATA');
	return Buffer.concat(chunks, length);
}

export type MailDeliveryEnvelope = {
	/** Generated and persisted by the trusted MTA, stable over retries. Not Message-ID. */
	deliveryId: string;
	/** Epoch seconds. Re-sign retries with a fresh timestamp. */
	timestamp: number;
	mailFrom: string;
	recipients: string[];
};

/** Versioned wire contract; recipient order is significant (LMTP response order). */
export function mailDeliverySigningPayload(raw: Uint8Array, envelope: MailDeliveryEnvelope): string {
	return JSON.stringify(['misskey-mail-v1', envelope.deliveryId, envelope.timestamp, envelope.mailFrom, envelope.recipients, createHash('sha256').update(raw).digest('hex')]);
}

/**
 * Verify side-channel metadata supplied by the MTA, not fields extracted from DATA.
 * Network isolation/TLS is still required. The caller must enforce durable uniqueness
 * on (deliveryId, recipient) and reject reuse with different content/envelope.
 */
export function authenticateMailDelivery(raw: Uint8Array, envelope: MailDeliveryEnvelope, signature: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): void {
	if (Buffer.byteLength(secret) < 32) throw new Error('Mail ingress secret must contain at least 32 bytes');
	if (!/^[A-Za-z0-9_-]{16,128}$/.test(envelope.deliveryId) || !Number.isSafeInteger(envelope.timestamp) || Math.abs(nowSeconds - envelope.timestamp) > 300 ||
		!Array.isArray(envelope.recipients) || envelope.recipients.length < 1 || envelope.recipients.length > 100 ||
		envelope.recipients.some(address => typeof address !== 'string' || address.length > 254 || /[\r\n\0]/.test(address)) ||
		typeof envelope.mailFrom !== 'string' || envelope.mailFrom.length > 254 || /[\r\n\0]/.test(envelope.mailFrom) || !/^[a-f0-9]{64}$/.test(signature)) {
		throw new MailIngressError('UNAUTHENTICATED');
	}
	const expected = createHmac('sha256', secret).update(mailDeliverySigningPayload(raw, envelope)).digest();
	if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new MailIngressError('UNAUTHENTICATED');
}
