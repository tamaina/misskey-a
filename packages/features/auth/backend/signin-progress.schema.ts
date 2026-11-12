/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

const secret = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/));
export const signinProgressChallengeSchema = v.strictObject({
	ticket: secret, browserSecret: secret, nonce: secret,
	version: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER)),
});
export type SigninProgressChallenge = v.InferOutput<typeof signinProgressChallengeSchema>;
