/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { webhookEventTypes } from '../../integrations/backend/webhook-events.schema.js';
import { gameTurnEvent } from '../../games/mahjong/shared/turn-webhook.schema.js';

export const eventNames = [...webhookEventTypes, 'note.mentioned', 'note.replied', 'antenna.note', gameTurnEvent, 'stream.channel', 'stream.broadcast', 'stream.note'] as const;
export type McpEventName = typeof eventNames[number];

/** Account security signals require both notification and account access. */
export function eventPermissions(name: McpEventName): string[] {
	if (name === gameTurnEvent || name.startsWith('stream.')) return ['read:account'];
	if (name === 'antenna.note' || name === 'login' || name === 'createToken') return ['read:notifications', 'read:account'];
	if (name === 'chatMessage') return ['read:chat'];
	if (name === 'note') return ['read:account'];
	if (name === 'follow' || name === 'unfollow') return ['read:following'];
	return ['read:notifications'];
}

/** Describe the reference data, without exposing packed private content. */
export function eventPayloadSchema(name: McpEventName): Record<string, unknown> {
	if (name.startsWith('stream.')) return { type: 'object', properties: { frames: { type: 'array', description: 'Native envelopes projected to explicit reference/invalidation contracts; no original content.' } }, required: ['frames'], additionalProperties: false };
	if (name === gameTurnEvent) return { type: 'object', properties: {
		roomId: { type: 'string', pattern: '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$' },
		phaseId: { type: 'string', pattern: '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$' },
		revision: { type: 'integer', minimum: 1 },
	}, required: ['roomId', 'phaseId', 'revision'], additionalProperties: false };
	const properties: Record<string, { type: 'string' }> = {};
	let required: string[];
	if (name === 'antenna.note' || name === 'note.mentioned' || name === 'note.replied') {
		required = ['noteId', 'url'];
	} else if (name === 'chatMessage') {
		required = ['messageId'];
	} else if (name === 'note') {
		required = ['noteId'];
	} else if (name === 'follow' || name === 'unfollow') {
		required = ['userId'];
	} else {
		required = ['notificationId', 'notificationType'];
		properties.noteId = { type: 'string' };
		properties.userId = { type: 'string' };
	}
	for (const key of required) properties[key] = { type: 'string' };
	return { type: 'object', properties, required, additionalProperties: false };
}
