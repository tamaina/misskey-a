/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authSessionsContract } from './session.contract.js';
import type { AuthSessionContext } from './session.effects.js';
export type { AuthSessionContext } from './session.effects.js';
import { createSignupProcedure, type SignupDependencies } from './endpoints/signup.js';
import { createSignupPendingProcedure, type SignupPendingDependencies } from './endpoints/signupPending.js';
import { createSigninFlowProcedure, type SigninFlowDependencies } from './endpoints/signinFlow.js';
import { createSigninWithPasskeyProcedure, type SigninWithPasskeyDependencies } from './endpoints/signinWithPasskey.js';
export interface AuthSessionDependencies {
	signup: SignupDependencies;
	signupPending: SignupPendingDependencies;
	signinFlow: SigninFlowDependencies;
	signinWithPasskey: SigninWithPasskeyDependencies;
}
export function createAuthSessionRouter(deps: AuthSessionDependencies) {
	return {
authSessions: implement(authSessionsContract).$context<AuthSessionContext>().router({
			signup: createSignupProcedure(deps.signup),
			signupPending: createSignupPendingProcedure(deps.signupPending),
			signinFlow: createSigninFlowProcedure(deps.signinFlow),
			signinWithPasskey: createSigninWithPasskeyProcedure(deps.signinWithPasskey),
		})
};
}
