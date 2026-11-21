/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

/** Original id-only session failures, including the single rate-limit code/message variant. */
export const sessionErrorDataSchema = v.strictObject({ id: v.optional(v.string()), code: v.optional(v.literal('TOO_MANY_AUTHENTICATION_FAILURES')), message: v.optional(v.string()) });
export const sessionFailureSchema = v.strictObject({ error: sessionErrorDataSchema });
/** Fastify's distinct error envelope for thrown signup/domain failures. */
export const fastifyFailureSchema = v.strictObject({ statusCode: v.pipe(v.number(), v.integer(), v.finite()), error: v.string(), message: v.string() });
