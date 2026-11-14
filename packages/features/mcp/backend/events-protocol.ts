/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { webhookEventTypes } from '../../integrations/backend/webhook-events.schema.js';
import type { McpEventName } from './events.schema.js';
import type { StreamSubscription } from './stream-types.js';
export { eventNames } from './events.schema.js';
export type { McpEventName } from './events.schema.js';
export const eventType = (name: McpEventName) => name === 'note.mentioned' ? 'mention' : name === 'note.replied' ? 'reply' : webhookEventTypes.find(type => type === name) ?? null;

export class McpEventError extends Error {
	constructor(public readonly code: number, message: string, public readonly data?: { reason: string }) { super(message); }
}

export function signingKey(secret: string): Buffer {
	if (!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret)) throw new McpEventError(-32602, 'Invalid signing secret');
	const key = Buffer.from(secret.slice(6), 'base64');
	if (key.length < 24 || key.length > 64 || key.toString('base64').replace(/=+$/, '') !== secret.slice(6).replace(/=+$/, '')) throw new McpEventError(-32602, 'Invalid signing secret');
	return key;
}

/** Include the grant and canonical antenna arguments in subscription identity. */
export function subscriptionId(userId: string, tokenId: string, url: string, name: McpEventName, antennaId?: string, stream?: StreamSubscription | null): string {
	return createHash('sha256').update(JSON.stringify([userId, tokenId, url, name, stream ?? (antennaId ? { antennaId } : {})])).digest('hex').slice(0, 32);
}

export function signedHeaders(id: string, subscription: string, secret: string, body: string, previous?: string, now = Date.now()): Record<string, string> {
	if (Buffer.byteLength(body) > 262144) throw new McpEventError(-32602, 'Payload exceeds 256 KiB');
	const timestamp = String(Math.floor(now / 1000));
	const sign = (key: string) => 'v1,' + createHmac('sha256', signingKey(key)).update(`${id}.${timestamp}.${body}`).digest('base64');
	return { 'Content-Type': 'application/json', 'webhook-id': id, 'webhook-timestamp': timestamp,
		'webhook-signature': [sign(secret), ...(previous ? [sign(previous)] : [])].join(' '), 'X-MCP-Subscription-Id': subscription };
}

export function challengeMatches(expected: string, actual: unknown): boolean {
	return typeof actual === 'string' && Buffer.byteLength(actual) === Buffer.byteLength(expected)
		&& timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
