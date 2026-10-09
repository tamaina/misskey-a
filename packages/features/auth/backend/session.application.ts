/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { toPackedUserDetailed } from '../../users/backend/user.schema.js';
import { SignupApiService } from './transport/SignupApiService.js';
import { SigninApiService } from './transport/SigninApiService.js';
import { SigninWithPasskeyApiService } from './transport/SigninWithPasskeyApiService.js';
import type { AuthSessionOperations } from './session.router.js';
import { authSessionsContract } from './session.contract.js';

@Injectable()
export class AuthSessionApplicationService implements AuthSessionOperations {
	constructor(private readonly signupService: SignupApiService, private readonly signinService: SigninApiService, private readonly passkeyService: SigninWithPasskeyApiService) {}
	signup: AuthSessionOperations['signup'] = async (input, request, effects) => {
		const result = await this.signupService.signup(input, request, effects);
		return v.parse(requiredSchema(authSessionsContract.signup['~orpc'].outputSchema), result === undefined ? result : { ...toPackedUserDetailed(result), token: result.token });
	};
	signupPending: AuthSessionOperations['signupPending'] = async (input, request, effects) => v.parse(requiredSchema(authSessionsContract.signupPending['~orpc'].outputSchema), await this.signupService.signupPending(input, request, effects));
	signinFlow: AuthSessionOperations['signinFlow'] = async (input, request, effects) => v.parse(requiredSchema(authSessionsContract.signinFlow['~orpc'].outputSchema), await this.signinService.signin(input, request, effects));
	signinWithPasskey: AuthSessionOperations['signinWithPasskey'] = async (input, request, effects) => v.parse(requiredSchema(authSessionsContract.signinWithPasskey['~orpc'].outputSchema), await this.passkeyService.signin(input, request, effects));
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
