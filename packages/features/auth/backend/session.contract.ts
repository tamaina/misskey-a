/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { packedOptionalJsonValueSchema } from '../../users/backend/json-value.schema.js';
import { packedMeDetailedSchema } from '../../users/backend/user.schema.js';
import { webAuthnAuthenticationOptionsSchema } from './webauthn.schema.js';
import { sessionFailureSchema, fastifyFailureSchema } from './session-errors.schema.js';
import { finishedSigninSchema } from './session.schema.js';
const httpErrors = { SESSION_HTTP_ERROR: { status: 400, data: fastifyFailureSchema }, INTERNAL_SERVER_ERROR: { status: 500, data: fastifyFailureSchema } };
export const authSessionsContract = {
	signup: oc.$meta({ requestName: 'signup' } as const).route({ method: 'POST', path: '/signup', tags: ['auth'], operationId: 'post___signup' }).errors(httpErrors).input(packedOptionalJsonValueSchema).output(v.union([v.strictObject({ ...packedMeDetailedSchema.entries, token: v.string() }), v.void()])),
	signupPending: oc.$meta({ requestName: 'signup-pending' } as const).route({ method: 'POST', path: '/signup-pending', tags: ['auth'], operationId: 'post___signup_pending' }).errors(httpErrors).input(packedOptionalJsonValueSchema).output(finishedSigninSchema),
	signinFlow: oc.$meta({ requestName: 'signin-flow' } as const).route({ method: 'POST', path: '/signin-flow', tags: ['auth'], operationId: 'post___signin_flow' }).errors(httpErrors).input(packedOptionalJsonValueSchema).output(v.union([v.union([
	finishedSigninSchema,
	v.strictObject({ finished: v.literal(false), next: v.picklist(['captcha', 'password', 'totp']) }),
	v.strictObject({ finished: v.literal(false), next: v.literal('passkey'), authRequest: webAuthnAuthenticationOptionsSchema }),
]), sessionFailureSchema, v.void()])),
	signinWithPasskey: oc.$meta({ requestName: 'signin-with-passkey' } as const).route({ method: 'POST', path: '/signin-with-passkey', tags: ['auth'], operationId: 'post___signin_with_passkey' }).errors(httpErrors).input(packedOptionalJsonValueSchema).output(v.union([
	v.strictObject({ option: webAuthnAuthenticationOptionsSchema, context: v.string() }),
	v.strictObject({ signinResponse: finishedSigninSchema }), sessionFailureSchema,
])),
};
export const sessionContract = { authSessions: authSessionsContract };
export type AuthSessionInputs = InferContractRouterInputs<typeof authSessionsContract>;
export type AuthSessionOutputs = InferContractRouterOutputs<typeof authSessionsContract>;
