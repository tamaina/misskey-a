/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { createAuthRouter } from './api.router.js';
import type { AdminAccountsCreateDependencies } from './endpoints/admin/accounts/create.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { SignupService } from './services/SignupService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { AdminCaptchaCurrentDependencies } from './endpoints/admin/captcha/current.js';
import { CaptchaService } from './services/CaptchaService.js';
import type { AdminCaptchaSaveDependencies } from './endpoints/admin/captcha/save.js';
import type { AdminInviteCreateDependencies } from './endpoints/admin/invite/create.js';
import { InviteCodeEntityService } from './serializers/InviteCodeEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import type { AdminInviteListDependencies } from './endpoints/admin/invite/list.js';
import type { AdminResetPasswordDependencies } from './endpoints/admin/reset-password.js';
import type { AdminUnsetMfaDependencies } from './endpoints/admin/unset-mfa.js';
import type { AppCreateDependencies } from './endpoints/app/create.js';
import { AppEntityService } from './serializers/AppEntityService.js';
import type { AppShowDependencies } from './endpoints/app/show.js';
import type { AuthAcceptDependencies } from './endpoints/auth/accept.js';
import type { AuthSessionGenerateDependencies } from './endpoints/auth/session/generate.js';
import type { AuthSessionShowDependencies } from './endpoints/auth/session/show.js';
import { AuthSessionEntityService } from './serializers/AuthSessionEntityService.js';
import type { AuthSessionUserkeyDependencies } from './endpoints/auth/session/userkey.js';
import type { EmailAddressAvailableDependencies } from './endpoints/email-address/available.js';
import { EmailService } from '@features/email/backend/services/EmailService.js';
import type { I2faDoneDependencies } from './endpoints/i/2fa/done.js';
import { UserAuthService } from './services/UserAuthService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { I2faKeyDoneDependencies } from './endpoints/i/2fa/key-done.js';
import { WebAuthnService } from './services/WebAuthnService.js';
import type { I2faPasswordLessDependencies } from './endpoints/i/2fa/password-less.js';
import type { I2faRegisterDependencies } from './endpoints/i/2fa/register.js';
import type { I2faRegisterKeyDependencies } from './endpoints/i/2fa/register-key.js';
import type { I2faRemoveKeyDependencies } from './endpoints/i/2fa/remove-key.js';
import type { I2faUnregisterDependencies } from './endpoints/i/2fa/unregister.js';
import type { I2faUpdateKeyDependencies } from './endpoints/i/2fa/update-key.js';
import type { IAppsDependencies } from './endpoints/i/apps.js';
import type { IAuthorizedAppsDependencies } from './endpoints/i/authorized-apps.js';
import type { IChangePasswordDependencies } from './endpoints/i/change-password.js';
import type { IRegenerateTokenDependencies } from './endpoints/i/regenerate-token.js';
import type { IRevokeTokenDependencies } from './endpoints/i/revoke-token.js';
import type { ISigninHistoryDependencies } from './endpoints/i/signin-history.js';
import { SigninEntityService } from './serializers/SigninEntityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { IUpdateEmailDependencies } from './endpoints/i/update-email.js';
import type { InviteCreateDependencies } from './endpoints/invite/create.js';
import type { InviteDeleteDependencies } from './endpoints/invite/delete.js';
import type { InviteLimitDependencies } from './endpoints/invite/limit.js';
import type { InviteListDependencies } from './endpoints/invite/list.js';
import type { MiauthGenTokenDependencies } from './endpoints/miauth/gen-token.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import type { MyAppsDependencies } from './endpoints/my/apps.js';
import type { RequestResetPasswordDependencies } from './endpoints/request-reset-password.js';
import type { ResetPasswordDependencies } from './endpoints/reset-password.js';
import type { UsernameAvailableDependencies } from './endpoints/username/available.js';
import type { VerifyEmailDependencies } from './endpoints/verify-email.js';
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
