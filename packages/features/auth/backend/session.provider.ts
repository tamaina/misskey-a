/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { createAuthSessionRouter } from './session.router.js';
import type { SignupDependencies } from './endpoints/signup.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { CaptchaService } from '@features/auth/backend/services/CaptchaService.js';
import { SignupService } from '@features/auth/backend/services/SignupService.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import type { SignupPendingDependencies } from './endpoints/signupPending.js';
import { SigninService } from './transport/SigninService.js';
import type { SigninFlowDependencies } from './endpoints/signinFlow.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import type { SigninWithPasskeyDependencies } from './endpoints/signinWithPasskey.js';
@Injectable()
export class AuthSessionApiProvider {
	private router: ReturnType<typeof createAuthSessionRouter> | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose() {
		if (this.router !== undefined) return this.router;
		this.router = createAuthSessionRouter({
			'signup': { config: this.moduleRef.get<SignupDependencies['config']>(DI.config, { strict: false }), meta: this.moduleRef.get<SignupDependencies['meta']>(DI.meta, { strict: false }), usersRepository: this.moduleRef.get<SignupDependencies['usersRepository']>(DI.usersRepository, { strict: false }), userPendingsRepository: this.moduleRef.get<SignupDependencies['userPendingsRepository']>(DI.userPendingsRepository, { strict: false }), usedUsernamesRepository: this.moduleRef.get<SignupDependencies['usedUsernamesRepository']>(DI.usedUsernamesRepository, { strict: false }), registrationTicketsRepository: this.moduleRef.get<SignupDependencies['registrationTicketsRepository']>(DI.registrationTicketsRepository, { strict: false }), userEntityService: this.moduleRef.get<SignupDependencies['userEntityService']>(UserEntityService, { strict: false }), idService: this.moduleRef.get<SignupDependencies['idService']>(IdService, { strict: false }), captchaService: this.moduleRef.get<SignupDependencies['captchaService']>(CaptchaService, { strict: false }), signupService: this.moduleRef.get<SignupDependencies['signupService']>(SignupService, { strict: false }), emailService: this.moduleRef.get<SignupDependencies['emailService']>(EmailService, { strict: false }) },
			'signupPending': { userProfilesRepository: this.moduleRef.get<SignupPendingDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userPendingsRepository: this.moduleRef.get<SignupPendingDependencies['userPendingsRepository']>(DI.userPendingsRepository, { strict: false }), registrationTicketsRepository: this.moduleRef.get<SignupPendingDependencies['registrationTicketsRepository']>(DI.registrationTicketsRepository, { strict: false }), idService: this.moduleRef.get<SignupPendingDependencies['idService']>(IdService, { strict: false }), signupService: this.moduleRef.get<SignupPendingDependencies['signupService']>(SignupService, { strict: false }), signinService: this.moduleRef.get<SignupPendingDependencies['signinService']>(SigninService, { strict: false }) },
			'signinFlow': { config: this.moduleRef.get<SigninFlowDependencies['config']>(DI.config, { strict: false }), meta: this.moduleRef.get<SigninFlowDependencies['meta']>(DI.meta, { strict: false }), usersRepository: this.moduleRef.get<SigninFlowDependencies['usersRepository']>(DI.usersRepository, { strict: false }), userProfilesRepository: this.moduleRef.get<SigninFlowDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userSecurityKeysRepository: this.moduleRef.get<SigninFlowDependencies['userSecurityKeysRepository']>(DI.userSecurityKeysRepository, { strict: false }), signinsRepository: this.moduleRef.get<SigninFlowDependencies['signinsRepository']>(DI.signinsRepository, { strict: false }), loggerService: this.moduleRef.get<SigninFlowDependencies['loggerService']>(LoggerService, { strict: false }), idService: this.moduleRef.get<SigninFlowDependencies['idService']>(IdService, { strict: false }), rateLimiterService: this.moduleRef.get<SigninFlowDependencies['rateLimiterService']>(RateLimiterService, { strict: false }), signinService: this.moduleRef.get<SigninFlowDependencies['signinService']>(SigninService, { strict: false }), userAuthService: this.moduleRef.get<SigninFlowDependencies['userAuthService']>(UserAuthService, { strict: false }), webAuthnService: this.moduleRef.get<SigninFlowDependencies['webAuthnService']>(WebAuthnService, { strict: false }), captchaService: this.moduleRef.get<SigninFlowDependencies['captchaService']>(CaptchaService, { strict: false }) },
			'signinWithPasskey': { config: this.moduleRef.get<SigninWithPasskeyDependencies['config']>(DI.config, { strict: false }), usersRepository: this.moduleRef.get<SigninWithPasskeyDependencies['usersRepository']>(DI.usersRepository, { strict: false }), userProfilesRepository: this.moduleRef.get<SigninWithPasskeyDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), signinsRepository: this.moduleRef.get<SigninWithPasskeyDependencies['signinsRepository']>(DI.signinsRepository, { strict: false }), idService: this.moduleRef.get<SigninWithPasskeyDependencies['idService']>(IdService, { strict: false }), rateLimiterService: this.moduleRef.get<SigninWithPasskeyDependencies['rateLimiterService']>(RateLimiterService, { strict: false }), signinService: this.moduleRef.get<SigninWithPasskeyDependencies['signinService']>(SigninService, { strict: false }), webAuthnService: this.moduleRef.get<SigninWithPasskeyDependencies['webAuthnService']>(WebAuthnService, { strict: false }), loggerService: this.moduleRef.get<SigninWithPasskeyDependencies['loggerService']>(LoggerService, { strict: false }) },
		});
		return this.router;
	}
}
