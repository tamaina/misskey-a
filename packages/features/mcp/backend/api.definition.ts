/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
import { eventNames } from './events.schema.js';
import { streamChannelArguments, streamNoteArguments } from './stream.schema.js';

const url = v.pipe(v.string(), v.minLength(1), v.maxLength(1024));
const identities = [
	{ name: v.picklist(['note.mentioned', 'note.replied']), arguments: v.strictObject({}) },
	{ name: v.literal('antenna.note'), arguments: v.strictObject({ antennaId: v.pipe(v.string(), v.minLength(1), v.maxLength(32)) }) },
	{ name: v.literal('stream.channel'), arguments: streamChannelArguments },
	{ name: v.literal('stream.broadcast'), arguments: v.strictObject({}) },
	{ name: v.literal('stream.note'), arguments: streamNoteArguments },
] as const;
export const subscribeInput = v.variant('name', identities.map(identity => v.strictObject({ ...identity,
	delivery: v.strictObject({ mode: v.literal('webhook'), url, secret: v.pipe(v.string(), v.maxLength(1024)) }),
	cursor: v.optional(v.null(), null),
	ttlMs: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1))), 3600000),
})));
export const unsubscribeInput = v.variant('name', identities.map(identity => v.strictObject({ ...identity, delivery: v.strictObject({ mode: v.literal('webhook'), url }) })));
export const listInput = v.strictObject({ cursor: v.optional(v.null()) });
const descriptor = v.strictObject({ name: v.picklist(eventNames), description: v.string(), delivery: v.tuple([v.literal('webhook')]),
	inputSchema: v.record(v.string(), v.unknown()),
	payloadSchema: v.record(v.string(), v.unknown()),
});
const procedure = (requestName: string) => oc.$meta({ requestName, requireCredential: true, kind: 'access:mcp', prohibitMoved: true,
	limit: { duration: 60000, max: 30 } } satisfies Meta & ApiProcedureMetadata);
/** MCP-only native contracts: no new HTTP API or generic call_api exposure. */
export const mcpEventsContract = {
	list: procedure('mcp/events/list').input(listInput).output(v.strictObject({ events: v.array(descriptor) })),
	subscribe: procedure('mcp/events/subscribe').input(subscribeInput).output(v.strictObject({ id: v.string(), refreshBefore: v.string(), cursor: v.null(), truncated: v.boolean() })),
	unsubscribe: procedure('mcp/events/unsubscribe').input(unsubscribeInput).output(v.strictObject({})),
};
