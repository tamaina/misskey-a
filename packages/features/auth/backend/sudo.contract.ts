/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { webAuthnAuthenticationOptionsSchema, webAuthnAuthenticationResponseSchema } from './webauthn.schema.js';

export const sudoErrors = { ...commonErrors,
	SUDO_REQUIRED: { status: 403, data: apiErrorData },
	REAUTHENTICATION_FAILED: { status: 403, data: apiErrorData },
} as const;
const elevated = v.strictObject({ status: v.literal('elevated'), expiresAt: v.string(), grantId: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)) });
const metadata = { requireCredential: true, secure: true, limit: { duration: 60_000, max: 10, key: 'sudo' } } as const;
const start = oc.$meta({ ...metadata, requestName: 'i/sudo/start' } as const)
	.route({ method: 'POST', path: '/i/sudo/start', tags: ['account'] }).errors(sudoErrors)
	.input(objectInput({ password: v.exactOptional(v.pipe(v.string(), v.minLength(1), v.maxLength(1024))),
		token: v.exactOptional(v.pipe(v.string(), v.minLength(1), v.maxLength(256))), usePasskey: v.optional(v.boolean(), false) }))
	.output(v.variant('status', [elevated, v.strictObject({ status: v.literal('passkey-required'),
		ticket: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)), options: webAuthnAuthenticationOptionsSchema })]));
const complete = oc.$meta({ ...metadata, requestName: 'i/sudo/complete' } as const)
	.route({ method: 'POST', path: '/i/sudo/complete', tags: ['account'] }).errors(sudoErrors)
	.input(objectInput({ ticket: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)), credential: webAuthnAuthenticationResponseSchema }))
	.output(elevated);
const status = oc.$meta({ requireCredential: true, secure: true, requestName: 'i/sudo/status' } as const)
	.route({ method: 'POST', path: '/i/sudo/status', tags: ['account'] }).errors(sudoErrors).input(objectInput({}))
	.output(v.strictObject({ active: v.boolean(), expiresAt: v.nullable(v.string()) }));
const exit = oc.$meta({ requireCredential: true, secure: true, requestName: 'i/sudo/exit' } as const)
	.route({ method: 'POST', path: '/i/sudo/exit', tags: ['account'] }).errors(sudoErrors).input(objectInput({ expiresAt: v.exactOptional(v.string()), grantId: v.exactOptional(v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/))) })).output(v.void());
export const sudoContract = { 'i/sudo/start': start, 'i/sudo/complete': complete, 'i/sudo/status': status, 'i/sudo/exit': exit };
