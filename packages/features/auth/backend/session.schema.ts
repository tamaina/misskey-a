/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedOptionalJsonValueSchema } from '../../users/backend/json-value.schema.js';
import { sessionFailureSchema } from './session-errors.schema.js';
export { sessionFailureSchema, sessionErrorDataSchema, fastifyFailureSchema } from './session-errors.schema.js';
import { packedMeDetailedSchema } from '../../users/backend/user.schema.js';
import { webAuthnAuthenticationOptionsSchema } from './webauthn.schema.js';

// These handlers deliberately validate field values in their original domain order.
// The wire admits finite JSON protocol data, rather than claiming it is a verified credential.
export const sessionInput = packedOptionalJsonValueSchema;
export const finishedSigninSchema = v.strictObject({ finished: v.literal(true), id: v.string(), i: v.string() });
export const signinFlowSchema = v.union([
	finishedSigninSchema,
	v.strictObject({ finished: v.literal(false), next: v.picklist(['captcha', 'password', 'totp']) }),
	v.strictObject({ finished: v.literal(false), next: v.literal('passkey'), authRequest: webAuthnAuthenticationOptionsSchema }),
]);
export const signupSessionSchema = v.union([v.strictObject({ ...packedMeDetailedSchema.entries, token: v.string() }), v.void()]);
export const signinSessionSchema = v.union([signinFlowSchema, sessionFailureSchema, v.void()]);
export const passkeySessionSchema = v.union([
	v.strictObject({ option: webAuthnAuthenticationOptionsSchema, context: v.string() }),
	v.strictObject({ signinResponse: finishedSigninSchema }), sessionFailureSchema,
]);

/** HTTP header records are stored as JSON; undefined values disappear during legacy JSON serialization. */
export function toSessionHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[]> {
	const entries: [string, string | string[]][] = [];
	for (const [key, value] of Object.entries(headers)) if (value !== undefined) entries.push([key, value]);
	return Object.fromEntries(entries);
}
