/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authContract, authSessionsContract } from './api.definition.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createAdminAccountsCreateProcedure } from './endpoints/admin/accounts/create.js';
import type { AdminAccountsCreateDependencies } from './endpoints/admin/accounts/create.js';
import { createAdminCaptchaCurrentProcedure } from './endpoints/admin/captcha/current.js';
import type { AdminCaptchaCurrentDependencies } from './endpoints/admin/captcha/current.js';
import { createAdminCaptchaSaveProcedure } from './endpoints/admin/captcha/save.js';
import type { AdminCaptchaSaveDependencies } from './endpoints/admin/captcha/save.js';
import { createAdminInviteCreateProcedure } from './endpoints/admin/invite/create.js';
import type { AdminInviteCreateDependencies } from './endpoints/admin/invite/create.js';
import { createAdminInviteListProcedure } from './endpoints/admin/invite/list.js';
import type { AdminInviteListDependencies } from './endpoints/admin/invite/list.js';
import { createAdminResetPasswordProcedure } from './endpoints/admin/reset-password.js';
import type { AdminResetPasswordDependencies } from './endpoints/admin/reset-password.js';
import { createAdminUnsetMfaProcedure } from './endpoints/admin/unset-mfa.js';
import type { AdminUnsetMfaDependencies } from './endpoints/admin/unset-mfa.js';
import { createAppCreateProcedure } from './endpoints/app/create.js';
import type { AppCreateDependencies } from './endpoints/app/create.js';
import { createAppShowProcedure } from './endpoints/app/show.js';
import type { AppShowDependencies } from './endpoints/app/show.js';
import { createAuthAcceptProcedure } from './endpoints/auth/accept.js';
import type { AuthAcceptDependencies } from './endpoints/auth/accept.js';
import { createAuthSessionGenerateProcedure } from './endpoints/auth/session/generate.js';
import type { AuthSessionGenerateDependencies } from './endpoints/auth/session/generate.js';
import { createAuthSessionShowProcedure } from './endpoints/auth/session/show.js';
import type { AuthSessionShowDependencies } from './endpoints/auth/session/show.js';
import { createAuthSessionUserkeyProcedure } from './endpoints/auth/session/userkey.js';
import type { AuthSessionUserkeyDependencies } from './endpoints/auth/session/userkey.js';
import { createEmailAddressAvailableProcedure } from './endpoints/email-address/available.js';
import type { EmailAddressAvailableDependencies } from './endpoints/email-address/available.js';
import { createI2faDoneProcedure } from './endpoints/i/2fa/done.js';
import type { I2faDoneDependencies } from './endpoints/i/2fa/done.js';
import { createI2faKeyDoneProcedure } from './endpoints/i/2fa/key-done.js';
import type { I2faKeyDoneDependencies } from './endpoints/i/2fa/key-done.js';
import { createI2faPasswordLessProcedure } from './endpoints/i/2fa/password-less.js';
import type { I2faPasswordLessDependencies } from './endpoints/i/2fa/password-less.js';
import { createI2faRegisterProcedure } from './endpoints/i/2fa/register.js';
import type { I2faRegisterDependencies } from './endpoints/i/2fa/register.js';
import { createI2faRegisterKeyProcedure } from './endpoints/i/2fa/register-key.js';
import type { I2faRegisterKeyDependencies } from './endpoints/i/2fa/register-key.js';
import { createI2faRemoveKeyProcedure } from './endpoints/i/2fa/remove-key.js';
import type { I2faRemoveKeyDependencies } from './endpoints/i/2fa/remove-key.js';
import { createI2faUnregisterProcedure } from './endpoints/i/2fa/unregister.js';
import type { I2faUnregisterDependencies } from './endpoints/i/2fa/unregister.js';
import { createI2faUpdateKeyProcedure } from './endpoints/i/2fa/update-key.js';
import type { I2faUpdateKeyDependencies } from './endpoints/i/2fa/update-key.js';
import { createIAppsProcedure } from './endpoints/i/apps.js';
import type { IAppsDependencies } from './endpoints/i/apps.js';
import { createIAuthorizedAppsProcedure } from './endpoints/i/authorized-apps.js';
import type { IAuthorizedAppsDependencies } from './endpoints/i/authorized-apps.js';
import { createIChangePasswordProcedure } from './endpoints/i/change-password.js';
import type { IChangePasswordDependencies } from './endpoints/i/change-password.js';
import { createIRegenerateTokenProcedure } from './endpoints/i/regenerate-token.js';
import type { IRegenerateTokenDependencies } from './endpoints/i/regenerate-token.js';
import { createIRevokeTokenProcedure } from './endpoints/i/revoke-token.js';
import type { IRevokeTokenDependencies } from './endpoints/i/revoke-token.js';
import { createISigninHistoryProcedure } from './endpoints/i/signin-history.js';
import type { ISigninHistoryDependencies } from './endpoints/i/signin-history.js';
import { createIUpdateEmailProcedure } from './endpoints/i/update-email.js';
import type { IUpdateEmailDependencies } from './endpoints/i/update-email.js';
import { createInviteCreateProcedure } from './endpoints/invite/create.js';
import type { InviteCreateDependencies } from './endpoints/invite/create.js';
import { createInviteDeleteProcedure } from './endpoints/invite/delete.js';
import type { InviteDeleteDependencies } from './endpoints/invite/delete.js';
import { createInviteLimitProcedure } from './endpoints/invite/limit.js';
import type { InviteLimitDependencies } from './endpoints/invite/limit.js';
import { createInviteListProcedure } from './endpoints/invite/list.js';
import type { InviteListDependencies } from './endpoints/invite/list.js';
import { createMiauthGenTokenProcedure } from './endpoints/miauth/gen-token.js';
import type { MiauthGenTokenDependencies } from './endpoints/miauth/gen-token.js';
import { createMyAppsProcedure } from './endpoints/my/apps.js';
import type { MyAppsDependencies } from './endpoints/my/apps.js';
import { createRequestResetPasswordProcedure } from './endpoints/request-reset-password.js';
import type { RequestResetPasswordDependencies } from './endpoints/request-reset-password.js';
import { createResetPasswordProcedure } from './endpoints/reset-password.js';
import type { ResetPasswordDependencies } from './endpoints/reset-password.js';
import { createUsernameAvailableProcedure } from './endpoints/username/available.js';
import type { UsernameAvailableDependencies } from './endpoints/username/available.js';
import { createVerifyEmailProcedure } from './endpoints/verify-email.js';
import type { VerifyEmailDependencies } from './endpoints/verify-email.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { SignupService } from './services/SignupService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { CaptchaService } from './services/CaptchaService.js';
import { InviteCodeEntityService } from './serializers/InviteCodeEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { AppEntityService } from './serializers/AppEntityService.js';
import { AuthSessionEntityService } from './serializers/AuthSessionEntityService.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import { UserAuthService } from './services/UserAuthService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { WebAuthnService } from './services/WebAuthnService.js';
import { SigninEntityService } from './serializers/SigninEntityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import type { AuthSessionContext } from './session.effects.js';
import { createSignupProcedure } from './endpoints/signup.js';
import type { SignupDependencies } from './endpoints/signup.js';
import { createSignupPendingProcedure } from './endpoints/signupPending.js';
import type { SignupPendingDependencies } from './endpoints/signupPending.js';
import { createSigninFlowProcedure } from './endpoints/signinFlow.js';
import type { SigninFlowDependencies } from './endpoints/signinFlow.js';
import { createSigninWithPasskeyProcedure } from './endpoints/signinWithPasskey.js';
import type { SigninWithPasskeyDependencies } from './endpoints/signinWithPasskey.js';
import { SigninService } from './transport/SigninService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { RateLimiterService } from '@features/api/backend/transport/RateLimiterService.js';

export interface AuthRouterDependencies {
	'admin/accounts/create': AdminAccountsCreateDependencies;
	'admin/captcha/current': AdminCaptchaCurrentDependencies;
	'admin/captcha/save': AdminCaptchaSaveDependencies;
	'admin/invite/create': AdminInviteCreateDependencies;
	'admin/invite/list': AdminInviteListDependencies;
	'admin/reset-password': AdminResetPasswordDependencies;
	'admin/unset-mfa': AdminUnsetMfaDependencies;
	'app/create': AppCreateDependencies;
	'app/show': AppShowDependencies;
	'auth/accept': AuthAcceptDependencies;
	'auth/session/generate': AuthSessionGenerateDependencies;
	'auth/session/show': AuthSessionShowDependencies;
	'auth/session/userkey': AuthSessionUserkeyDependencies;
	'email-address/available': EmailAddressAvailableDependencies;
	'i/2fa/done': I2faDoneDependencies;
	'i/2fa/key-done': I2faKeyDoneDependencies;
	'i/2fa/password-less': I2faPasswordLessDependencies;
	'i/2fa/register': I2faRegisterDependencies;
	'i/2fa/register-key': I2faRegisterKeyDependencies;
	'i/2fa/remove-key': I2faRemoveKeyDependencies;
	'i/2fa/unregister': I2faUnregisterDependencies;
	'i/2fa/update-key': I2faUpdateKeyDependencies;
	'i/apps': IAppsDependencies;
	'i/authorized-apps': IAuthorizedAppsDependencies;
	'i/change-password': IChangePasswordDependencies;
	'i/regenerate-token': IRegenerateTokenDependencies;
	'i/revoke-token': IRevokeTokenDependencies;
	'i/signin-history': ISigninHistoryDependencies;
	'i/update-email': IUpdateEmailDependencies;
	'invite/create': InviteCreateDependencies;
	'invite/delete': InviteDeleteDependencies;
	'invite/limit': InviteLimitDependencies;
	'invite/list': InviteListDependencies;
	'miauth/gen-token': MiauthGenTokenDependencies;
	'my/apps': MyAppsDependencies;
	'request-reset-password': RequestResetPasswordDependencies;
	'reset-password': ResetPasswordDependencies;
	'username/available': UsernameAvailableDependencies;
	'verify-email': VerifyEmailDependencies;
}

export function createAuthRouter(deps: AuthRouterDependencies) {
	return implement(authContract).$context<ApiContext<MiLocalUser>>().router({
		'admin/accounts/create': createAdminAccountsCreateProcedure(deps['admin/accounts/create']),
		'admin/captcha/current': createAdminCaptchaCurrentProcedure(deps['admin/captcha/current']),
		'admin/captcha/save': createAdminCaptchaSaveProcedure(deps['admin/captcha/save']),
		'admin/invite/create': createAdminInviteCreateProcedure(deps['admin/invite/create']),
		'admin/invite/list': createAdminInviteListProcedure(deps['admin/invite/list']),
		'admin/reset-password': createAdminResetPasswordProcedure(deps['admin/reset-password']),
		'admin/unset-mfa': createAdminUnsetMfaProcedure(deps['admin/unset-mfa']),
		'app/create': createAppCreateProcedure(deps['app/create']),
		'app/show': createAppShowProcedure(deps['app/show']),
		'auth/accept': createAuthAcceptProcedure(deps['auth/accept']),
		'auth/session/generate': createAuthSessionGenerateProcedure(deps['auth/session/generate']),
		'auth/session/show': createAuthSessionShowProcedure(deps['auth/session/show']),
		'auth/session/userkey': createAuthSessionUserkeyProcedure(deps['auth/session/userkey']),
		'email-address/available': createEmailAddressAvailableProcedure(deps['email-address/available']),
		'i/2fa/done': createI2faDoneProcedure(deps['i/2fa/done']),
		'i/2fa/key-done': createI2faKeyDoneProcedure(deps['i/2fa/key-done']),
		'i/2fa/password-less': createI2faPasswordLessProcedure(deps['i/2fa/password-less']),
		'i/2fa/register': createI2faRegisterProcedure(deps['i/2fa/register']),
		'i/2fa/register-key': createI2faRegisterKeyProcedure(deps['i/2fa/register-key']),
		'i/2fa/remove-key': createI2faRemoveKeyProcedure(deps['i/2fa/remove-key']),
		'i/2fa/unregister': createI2faUnregisterProcedure(deps['i/2fa/unregister']),
		'i/2fa/update-key': createI2faUpdateKeyProcedure(deps['i/2fa/update-key']),
		'i/apps': createIAppsProcedure(deps['i/apps']),
		'i/authorized-apps': createIAuthorizedAppsProcedure(deps['i/authorized-apps']),
		'i/change-password': createIChangePasswordProcedure(deps['i/change-password']),
		'i/regenerate-token': createIRegenerateTokenProcedure(deps['i/regenerate-token']),
		'i/revoke-token': createIRevokeTokenProcedure(deps['i/revoke-token']),
		'i/signin-history': createISigninHistoryProcedure(deps['i/signin-history']),
		'i/update-email': createIUpdateEmailProcedure(deps['i/update-email']),
		'invite/create': createInviteCreateProcedure(deps['invite/create']),
		'invite/delete': createInviteDeleteProcedure(deps['invite/delete']),
		'invite/limit': createInviteLimitProcedure(deps['invite/limit']),
		'invite/list': createInviteListProcedure(deps['invite/list']),
		'miauth/gen-token': createMiauthGenTokenProcedure(deps['miauth/gen-token']),
		'my/apps': createMyAppsProcedure(deps['my/apps']),
		'request-reset-password': createRequestResetPasswordProcedure(deps['request-reset-password']),
		'reset-password': createResetPasswordProcedure(deps['reset-password']),
		'username/available': createUsernameAvailableProcedure(deps['username/available']),
		'verify-email': createVerifyEmailProcedure(deps['verify-email']),
	});
}

@Injectable()
export class AuthApiProvider {
	private router: ReturnType<typeof createAuthRouter> | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose() {
		if (this.router !== undefined) return this.router;
		this.router = createAuthRouter({
			'admin/accounts/create': { config: this.moduleRef.get<AdminAccountsCreateDependencies['config']>(DI.config, { strict: false }), serverSettings: this.moduleRef.get<AdminAccountsCreateDependencies['serverSettings']>(DI.meta, { strict: false }), usersRepository: this.moduleRef.get<AdminAccountsCreateDependencies['usersRepository']>(DI.usersRepository, { strict: false }), userEntityService: this.moduleRef.get<AdminAccountsCreateDependencies['userEntityService']>(UserEntityService, { strict: false }), signupService: this.moduleRef.get<AdminAccountsCreateDependencies['signupService']>(SignupService, { strict: false }), roleService: this.moduleRef.get<AdminAccountsCreateDependencies['roleService']>(RoleService, { strict: false }) },
			'admin/captcha/current': { captchaService: this.moduleRef.get<AdminCaptchaCurrentDependencies['captchaService']>(CaptchaService, { strict: false }) },
			'admin/captcha/save': { captchaService: this.moduleRef.get<AdminCaptchaSaveDependencies['captchaService']>(CaptchaService, { strict: false }) },
			'admin/invite/create': { registrationTicketsRepository: this.moduleRef.get<AdminInviteCreateDependencies['registrationTicketsRepository']>(DI.registrationTicketsRepository, { strict: false }), inviteCodeEntityService: this.moduleRef.get<AdminInviteCreateDependencies['inviteCodeEntityService']>(InviteCodeEntityService, { strict: false }), idService: this.moduleRef.get<AdminInviteCreateDependencies['idService']>(IdService, { strict: false }), moderationLogService: this.moduleRef.get<AdminInviteCreateDependencies['moderationLogService']>(ModerationLogService, { strict: false }) },
			'admin/invite/list': { registrationTicketsRepository: this.moduleRef.get<AdminInviteListDependencies['registrationTicketsRepository']>(DI.registrationTicketsRepository, { strict: false }), inviteCodeEntityService: this.moduleRef.get<AdminInviteListDependencies['inviteCodeEntityService']>(InviteCodeEntityService, { strict: false }) },
			'admin/reset-password': { serverSettings: this.moduleRef.get<AdminResetPasswordDependencies['serverSettings']>(DI.meta, { strict: false }), usersRepository: this.moduleRef.get<AdminResetPasswordDependencies['usersRepository']>(DI.usersRepository, { strict: false }), userProfilesRepository: this.moduleRef.get<AdminResetPasswordDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), roleService: this.moduleRef.get<AdminResetPasswordDependencies['roleService']>(RoleService, { strict: false }), moderationLogService: this.moduleRef.get<AdminResetPasswordDependencies['moderationLogService']>(ModerationLogService, { strict: false }) },
			'admin/unset-mfa': { db: this.moduleRef.get<AdminUnsetMfaDependencies['db']>(DI.db, { strict: false }), usersRepository: this.moduleRef.get<AdminUnsetMfaDependencies['usersRepository']>(DI.usersRepository, { strict: false }), roleService: this.moduleRef.get<AdminUnsetMfaDependencies['roleService']>(RoleService, { strict: false }), moderationLogService: this.moduleRef.get<AdminUnsetMfaDependencies['moderationLogService']>(ModerationLogService, { strict: false }) },
			'app/create': { appsRepository: this.moduleRef.get<AppCreateDependencies['appsRepository']>(DI.appsRepository, { strict: false }), appEntityService: this.moduleRef.get<AppCreateDependencies['appEntityService']>(AppEntityService, { strict: false }), idService: this.moduleRef.get<AppCreateDependencies['idService']>(IdService, { strict: false }) },
			'app/show': { appsRepository: this.moduleRef.get<AppShowDependencies['appsRepository']>(DI.appsRepository, { strict: false }), appEntityService: this.moduleRef.get<AppShowDependencies['appEntityService']>(AppEntityService, { strict: false }) },
			'auth/accept': { appsRepository: this.moduleRef.get<AuthAcceptDependencies['appsRepository']>(DI.appsRepository, { strict: false }), authSessionsRepository: this.moduleRef.get<AuthAcceptDependencies['authSessionsRepository']>(DI.authSessionsRepository, { strict: false }), accessTokensRepository: this.moduleRef.get<AuthAcceptDependencies['accessTokensRepository']>(DI.accessTokensRepository, { strict: false }), idService: this.moduleRef.get<AuthAcceptDependencies['idService']>(IdService, { strict: false }) },
			'auth/session/generate': { config: this.moduleRef.get<AuthSessionGenerateDependencies['config']>(DI.config, { strict: false }), appsRepository: this.moduleRef.get<AuthSessionGenerateDependencies['appsRepository']>(DI.appsRepository, { strict: false }), authSessionsRepository: this.moduleRef.get<AuthSessionGenerateDependencies['authSessionsRepository']>(DI.authSessionsRepository, { strict: false }), idService: this.moduleRef.get<AuthSessionGenerateDependencies['idService']>(IdService, { strict: false }) },
			'auth/session/show': { authSessionsRepository: this.moduleRef.get<AuthSessionShowDependencies['authSessionsRepository']>(DI.authSessionsRepository, { strict: false }), authSessionEntityService: this.moduleRef.get<AuthSessionShowDependencies['authSessionEntityService']>(AuthSessionEntityService, { strict: false }) },
			'auth/session/userkey': { appsRepository: this.moduleRef.get<AuthSessionUserkeyDependencies['appsRepository']>(DI.appsRepository, { strict: false }), authSessionsRepository: this.moduleRef.get<AuthSessionUserkeyDependencies['authSessionsRepository']>(DI.authSessionsRepository, { strict: false }), accessTokensRepository: this.moduleRef.get<AuthSessionUserkeyDependencies['accessTokensRepository']>(DI.accessTokensRepository, { strict: false }), userEntityService: this.moduleRef.get<AuthSessionUserkeyDependencies['userEntityService']>(UserEntityService, { strict: false }) },
			'email-address/available': { emailService: this.moduleRef.get<EmailAddressAvailableDependencies['emailService']>(EmailService, { strict: false }) },
			'i/2fa/done': { userProfilesRepository: this.moduleRef.get<I2faDoneDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userEntityService: this.moduleRef.get<I2faDoneDependencies['userEntityService']>(UserEntityService, { strict: false }), userAuthService: this.moduleRef.get<I2faDoneDependencies['userAuthService']>(UserAuthService, { strict: false }), globalEventService: this.moduleRef.get<I2faDoneDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'i/2fa/key-done': { userProfilesRepository: this.moduleRef.get<I2faKeyDoneDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userSecurityKeysRepository: this.moduleRef.get<I2faKeyDoneDependencies['userSecurityKeysRepository']>(DI.userSecurityKeysRepository, { strict: false }), webAuthnService: this.moduleRef.get<I2faKeyDoneDependencies['webAuthnService']>(WebAuthnService, { strict: false }), userAuthService: this.moduleRef.get<I2faKeyDoneDependencies['userAuthService']>(UserAuthService, { strict: false }), userEntityService: this.moduleRef.get<I2faKeyDoneDependencies['userEntityService']>(UserEntityService, { strict: false }), globalEventService: this.moduleRef.get<I2faKeyDoneDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'i/2fa/password-less': { userProfilesRepository: this.moduleRef.get<I2faPasswordLessDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userSecurityKeysRepository: this.moduleRef.get<I2faPasswordLessDependencies['userSecurityKeysRepository']>(DI.userSecurityKeysRepository, { strict: false }), userEntityService: this.moduleRef.get<I2faPasswordLessDependencies['userEntityService']>(UserEntityService, { strict: false }), globalEventService: this.moduleRef.get<I2faPasswordLessDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'i/2fa/register': { config: this.moduleRef.get<I2faRegisterDependencies['config']>(DI.config, { strict: false }), userProfilesRepository: this.moduleRef.get<I2faRegisterDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userAuthService: this.moduleRef.get<I2faRegisterDependencies['userAuthService']>(UserAuthService, { strict: false }) },
			'i/2fa/register-key': { userProfilesRepository: this.moduleRef.get<I2faRegisterKeyDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), webAuthnService: this.moduleRef.get<I2faRegisterKeyDependencies['webAuthnService']>(WebAuthnService, { strict: false }), userAuthService: this.moduleRef.get<I2faRegisterKeyDependencies['userAuthService']>(UserAuthService, { strict: false }) },
			'i/2fa/remove-key': { userSecurityKeysRepository: this.moduleRef.get<I2faRemoveKeyDependencies['userSecurityKeysRepository']>(DI.userSecurityKeysRepository, { strict: false }), userProfilesRepository: this.moduleRef.get<I2faRemoveKeyDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userEntityService: this.moduleRef.get<I2faRemoveKeyDependencies['userEntityService']>(UserEntityService, { strict: false }), userAuthService: this.moduleRef.get<I2faRemoveKeyDependencies['userAuthService']>(UserAuthService, { strict: false }), globalEventService: this.moduleRef.get<I2faRemoveKeyDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'i/2fa/unregister': { userProfilesRepository: this.moduleRef.get<I2faUnregisterDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userEntityService: this.moduleRef.get<I2faUnregisterDependencies['userEntityService']>(UserEntityService, { strict: false }), userAuthService: this.moduleRef.get<I2faUnregisterDependencies['userAuthService']>(UserAuthService, { strict: false }), globalEventService: this.moduleRef.get<I2faUnregisterDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'i/2fa/update-key': { userSecurityKeysRepository: this.moduleRef.get<I2faUpdateKeyDependencies['userSecurityKeysRepository']>(DI.userSecurityKeysRepository, { strict: false }), userEntityService: this.moduleRef.get<I2faUpdateKeyDependencies['userEntityService']>(UserEntityService, { strict: false }), globalEventService: this.moduleRef.get<I2faUpdateKeyDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'i/apps': { accessTokensRepository: this.moduleRef.get<IAppsDependencies['accessTokensRepository']>(DI.accessTokensRepository, { strict: false }), idService: this.moduleRef.get<IAppsDependencies['idService']>(IdService, { strict: false }) },
			'i/authorized-apps': { accessTokensRepository: this.moduleRef.get<IAuthorizedAppsDependencies['accessTokensRepository']>(DI.accessTokensRepository, { strict: false }), appEntityService: this.moduleRef.get<IAuthorizedAppsDependencies['appEntityService']>(AppEntityService, { strict: false }) },
			'i/change-password': { userProfilesRepository: this.moduleRef.get<IChangePasswordDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userAuthService: this.moduleRef.get<IChangePasswordDependencies['userAuthService']>(UserAuthService, { strict: false }) },
			'i/regenerate-token': { usersRepository: this.moduleRef.get<IRegenerateTokenDependencies['usersRepository']>(DI.usersRepository, { strict: false }), userProfilesRepository: this.moduleRef.get<IRegenerateTokenDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), globalEventService: this.moduleRef.get<IRegenerateTokenDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'i/revoke-token': { accessTokensRepository: this.moduleRef.get<IRevokeTokenDependencies['accessTokensRepository']>(DI.accessTokensRepository, { strict: false }) },
			'i/signin-history': { signinsRepository: this.moduleRef.get<ISigninHistoryDependencies['signinsRepository']>(DI.signinsRepository, { strict: false }), signinEntityService: this.moduleRef.get<ISigninHistoryDependencies['signinEntityService']>(SigninEntityService, { strict: false }), queryService: this.moduleRef.get<ISigninHistoryDependencies['queryService']>(QueryService, { strict: false }) },
			'i/update-email': { config: this.moduleRef.get<IUpdateEmailDependencies['config']>(DI.config, { strict: false }), serverSettings: this.moduleRef.get<IUpdateEmailDependencies['serverSettings']>(DI.meta, { strict: false }), userProfilesRepository: this.moduleRef.get<IUpdateEmailDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userEntityService: this.moduleRef.get<IUpdateEmailDependencies['userEntityService']>(UserEntityService, { strict: false }), emailService: this.moduleRef.get<IUpdateEmailDependencies['emailService']>(EmailService, { strict: false }), userAuthService: this.moduleRef.get<IUpdateEmailDependencies['userAuthService']>(UserAuthService, { strict: false }), globalEventService: this.moduleRef.get<IUpdateEmailDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
			'invite/create': { registrationTicketsRepository: this.moduleRef.get<InviteCreateDependencies['registrationTicketsRepository']>(DI.registrationTicketsRepository, { strict: false }), inviteCodeEntityService: this.moduleRef.get<InviteCreateDependencies['inviteCodeEntityService']>(InviteCodeEntityService, { strict: false }), idService: this.moduleRef.get<InviteCreateDependencies['idService']>(IdService, { strict: false }), roleService: this.moduleRef.get<InviteCreateDependencies['roleService']>(RoleService, { strict: false }) },
			'invite/delete': { registrationTicketsRepository: this.moduleRef.get<InviteDeleteDependencies['registrationTicketsRepository']>(DI.registrationTicketsRepository, { strict: false }), roleService: this.moduleRef.get<InviteDeleteDependencies['roleService']>(RoleService, { strict: false }) },
			'invite/limit': { registrationTicketsRepository: this.moduleRef.get<InviteLimitDependencies['registrationTicketsRepository']>(DI.registrationTicketsRepository, { strict: false }), roleService: this.moduleRef.get<InviteLimitDependencies['roleService']>(RoleService, { strict: false }), idService: this.moduleRef.get<InviteLimitDependencies['idService']>(IdService, { strict: false }) },
			'invite/list': { registrationTicketsRepository: this.moduleRef.get<InviteListDependencies['registrationTicketsRepository']>(DI.registrationTicketsRepository, { strict: false }), inviteCodeEntityService: this.moduleRef.get<InviteListDependencies['inviteCodeEntityService']>(InviteCodeEntityService, { strict: false }), queryService: this.moduleRef.get<InviteListDependencies['queryService']>(QueryService, { strict: false }) },
			'miauth/gen-token': { accessTokensRepository: this.moduleRef.get<MiauthGenTokenDependencies['accessTokensRepository']>(DI.accessTokensRepository, { strict: false }), idService: this.moduleRef.get<MiauthGenTokenDependencies['idService']>(IdService, { strict: false }), notificationService: this.moduleRef.get<MiauthGenTokenDependencies['notificationService']>(NotificationService, { strict: false }) },
			'my/apps': { appsRepository: this.moduleRef.get<MyAppsDependencies['appsRepository']>(DI.appsRepository, { strict: false }), appEntityService: this.moduleRef.get<MyAppsDependencies['appEntityService']>(AppEntityService, { strict: false }) },
			'request-reset-password': { config: this.moduleRef.get<RequestResetPasswordDependencies['config']>(DI.config, { strict: false }), usersRepository: this.moduleRef.get<RequestResetPasswordDependencies['usersRepository']>(DI.usersRepository, { strict: false }), userProfilesRepository: this.moduleRef.get<RequestResetPasswordDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), passwordResetRequestsRepository: this.moduleRef.get<RequestResetPasswordDependencies['passwordResetRequestsRepository']>(DI.passwordResetRequestsRepository, { strict: false }), idService: this.moduleRef.get<RequestResetPasswordDependencies['idService']>(IdService, { strict: false }), emailService: this.moduleRef.get<RequestResetPasswordDependencies['emailService']>(EmailService, { strict: false }) },
			'reset-password': { passwordResetRequestsRepository: this.moduleRef.get<ResetPasswordDependencies['passwordResetRequestsRepository']>(DI.passwordResetRequestsRepository, { strict: false }), userProfilesRepository: this.moduleRef.get<ResetPasswordDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), idService: this.moduleRef.get<ResetPasswordDependencies['idService']>(IdService, { strict: false }) },
			'username/available': { serverSettings: this.moduleRef.get<UsernameAvailableDependencies['serverSettings']>(DI.meta, { strict: false }), usersRepository: this.moduleRef.get<UsernameAvailableDependencies['usersRepository']>(DI.usersRepository, { strict: false }), usedUsernamesRepository: this.moduleRef.get<UsernameAvailableDependencies['usedUsernamesRepository']>(DI.usedUsernamesRepository, { strict: false }) },
			'verify-email': { userProfilesRepository: this.moduleRef.get<VerifyEmailDependencies['userProfilesRepository']>(DI.userProfilesRepository, { strict: false }), userEntityService: this.moduleRef.get<VerifyEmailDependencies['userEntityService']>(UserEntityService, { strict: false }), globalEventService: this.moduleRef.get<VerifyEmailDependencies['globalEventService']>(GlobalEventService, { strict: false }) },
		});
		return this.router;
	}
}

export type { AuthSessionContext } from './session.effects.js';

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
