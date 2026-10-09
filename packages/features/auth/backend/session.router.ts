/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement, ORPCError } from '@orpc/server';
import { STATUS_CODES } from 'node:http';
import { FastifyReplyError } from '@features/runtime/backend/http/fastify-reply-error.js';
import { authSessionsContract, type AuthSessionInputs, type AuthSessionOutputs } from './session.contract.js';
import type { AuthSessionRequest, AuthSessionEffects } from './session.effects.js';

export type AuthSessionOperations = { [Name in keyof AuthSessionInputs]: (input: AuthSessionInputs[Name], request: AuthSessionRequest, effects: AuthSessionEffects) => Promise<AuthSessionOutputs[Name]> };
export interface AuthSessionContext {
	operations: AuthSessionOperations;
	request: AuthSessionRequest;
	effects: AuthSessionEffects;
	response: { status?: number };
}
export function createAuthSessionRouter() {
	const api = implement(authSessionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<AuthSessionContext>()
		.use(async ({ next }) => {
			try { return await next(); } catch (error) {
				const statusCode = error instanceof FastifyReplyError ? error.statusCode : 500;
				const message = error instanceof Error ? error.message : String(error);
				throw new ORPCError(statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'SESSION_HTTP_ERROR', {
					status: statusCode, message,
					data: { statusCode, error: STATUS_CODES[statusCode] ?? 'Error', message },
				});
			}
		});
	return { authSessions: api.router({
		signup: api.signup.handler(({ input, context }) => context.operations.signup(input, context.request, context.effects)),
		signupPending: api.signupPending.handler(({ input, context }) => context.operations.signupPending(input, context.request, context.effects)),
		signinFlow: api.signinFlow.handler(({ input, context }) => context.operations.signinFlow(input, context.request, context.effects)),
		signinWithPasskey: api.signinWithPasskey.handler(({ input, context }) => context.operations.signinWithPasskey(input, context.request, context.effects)),
	}) };
}
