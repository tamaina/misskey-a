/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { JsonValue } from '@features/runtime/backend/formatting/json-value.js';
import type { StreamChannel } from './stream.schema.js';
export { streamChannels } from './stream.schema.js';
export type { StreamChannel } from './stream.schema.js';
/** Persist only the finite parameter values accepted by stream.schema. */
export interface StreamSubscription { channel: StreamChannel | 'broadcast' | 'note'; params: Record<string, string | boolean | string[][]> }
/** Publisher identity is shared by every observer. Message is reduced before queue storage. */
export interface StreamOccurrence { id: string; createdAt: number; channel: string; message: JsonValue }
