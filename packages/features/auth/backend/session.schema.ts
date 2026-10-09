/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
export { sessionFailureSchema, sessionErrorDataSchema, fastifyFailureSchema } from './session-errors.schema.js';

// These handlers deliberately validate field values in their original domain order.
// The wire admits finite JSON protocol data, rather than claiming it is a verified credential.

export const finishedSigninSchema = v.strictObject({ finished: v.literal(true), id: v.string(), i: v.string() });

/** HTTP header records are stored as JSON; undefined values disappear during legacy JSON serialization. */
export function toSessionHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[]> {
	const entries: [string, string | string[]][] = [];
	for (const [key, value] of Object.entries(headers)) if (value !== undefined) entries.push([key, value]);
	return Object.fromEntries(entries);
}

/** Keep the authenticated session token invariant at the wire boundary after domain effects. */
export function toFinishedSignin(result: { finished: true; id: string; i: string | null }): v.InferOutput<typeof finishedSigninSchema> {
	if (result.i === null) throw new Error('Signed-in local user has no session token.');
	return { finished: true, id: result.id, i: result.i };
}
