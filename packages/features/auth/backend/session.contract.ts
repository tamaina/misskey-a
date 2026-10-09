/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { sessionInput, signupSessionSchema, signinSessionSchema, passkeySessionSchema, finishedSigninSchema } from './session.schema.js';
import { fastifyFailureSchema } from './session-errors.schema.js';
const httpErrors = { SESSION_HTTP_ERROR: { status: 400, data: fastifyFailureSchema }, INTERNAL_SERVER_ERROR: { status: 500, data: fastifyFailureSchema } };
export const authSessionsContract = {
	signup: oc.$meta<{ requestName: 'signup' }>({ requestName: 'signup' }).route({ method: 'POST', path: '/signup', tags: ['auth'], operationId: 'post___signup' }).errors(httpErrors).input(sessionInput).output(signupSessionSchema),
	signupPending: oc.$meta<{ requestName: 'signup-pending' }>({ requestName: 'signup-pending' }).route({ method: 'POST', path: '/signup-pending', tags: ['auth'], operationId: 'post___signup_pending' }).errors(httpErrors).input(sessionInput).output(finishedSigninSchema),
	signinFlow: oc.$meta<{ requestName: 'signin-flow' }>({ requestName: 'signin-flow' }).route({ method: 'POST', path: '/signin-flow', tags: ['auth'], operationId: 'post___signin_flow' }).errors(httpErrors).input(sessionInput).output(signinSessionSchema),
	signinWithPasskey: oc.$meta<{ requestName: 'signin-with-passkey' }>({ requestName: 'signin-with-passkey' }).route({ method: 'POST', path: '/signin-with-passkey', tags: ['auth'], operationId: 'post___signin_with_passkey' }).errors(httpErrors).input(sessionInput).output(passkeySessionSchema),
};
export const sessionContract = { authSessions: authSessionsContract };
export type AuthSessionInputs = InferContractRouterInputs<typeof authSessionsContract>;
export type AuthSessionOutputs = InferContractRouterOutputs<typeof authSessionsContract>;
