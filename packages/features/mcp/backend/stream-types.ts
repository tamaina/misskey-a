/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { JsonObject, JsonValue } from '@features/runtime/backend/formatting/json-value.js';
import type { StreamChannel } from './stream.schema.js';
export { streamChannels } from './stream.schema.js';
export type { StreamChannel } from './stream.schema.js';
export interface StreamSubscription { channel: StreamChannel | 'broadcast' | 'note'; params: JsonObject }
/** Publisher identity is shared by every observer. Message is reduced before queue storage. */
export interface StreamOccurrence { id: string; createdAt: number; channel: string; message: JsonValue }
