/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authContract } from './api.contract.js';
import type { ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { createAdminAccountsCreateProcedure, type AdminAccountsCreateDependencies } from './endpoints/admin/accounts/create.js';
import { createAdminCaptchaCurrentProcedure, type AdminCaptchaCurrentDependencies } from './endpoints/admin/captcha/current.js';
import { createAdminCaptchaSaveProcedure, type AdminCaptchaSaveDependencies } from './endpoints/admin/captcha/save.js';
import { createAdminInviteCreateProcedure, type AdminInviteCreateDependencies } from './endpoints/admin/invite/create.js';
import { createAdminInviteListProcedure, type AdminInviteListDependencies } from './endpoints/admin/invite/list.js';
import { createAdminResetPasswordProcedure, type AdminResetPasswordDependencies } from './endpoints/admin/reset-password.js';
import { createAdminUnsetMfaProcedure, type AdminUnsetMfaDependencies } from './endpoints/admin/unset-mfa.js';
import { createAppCreateProcedure, type AppCreateDependencies } from './endpoints/app/create.js';
import { createAppShowProcedure, type AppShowDependencies } from './endpoints/app/show.js';
import { createAuthAcceptProcedure, type AuthAcceptDependencies } from './endpoints/auth/accept.js';
import { createAuthSessionGenerateProcedure, type AuthSessionGenerateDependencies } from './endpoints/auth/session/generate.js';
import { createAuthSessionShowProcedure, type AuthSessionShowDependencies } from './endpoints/auth/session/show.js';
import { createAuthSessionUserkeyProcedure, type AuthSessionUserkeyDependencies } from './endpoints/auth/session/userkey.js';
import { createEmailAddressAvailableProcedure, type EmailAddressAvailableDependencies } from './endpoints/email-address/available.js';
import { createI2faDoneProcedure, type I2faDoneDependencies } from './endpoints/i/2fa/done.js';
import { createI2faKeyDoneProcedure, type I2faKeyDoneDependencies } from './endpoints/i/2fa/key-done.js';
import { createI2faPasswordLessProcedure, type I2faPasswordLessDependencies } from './endpoints/i/2fa/password-less.js';
import { createI2faRegisterProcedure, type I2faRegisterDependencies } from './endpoints/i/2fa/register.js';
import { createI2faRegisterKeyProcedure, type I2faRegisterKeyDependencies } from './endpoints/i/2fa/register-key.js';
import { createI2faRemoveKeyProcedure, type I2faRemoveKeyDependencies } from './endpoints/i/2fa/remove-key.js';
import { createI2faUnregisterProcedure, type I2faUnregisterDependencies } from './endpoints/i/2fa/unregister.js';
import { createI2faUpdateKeyProcedure, type I2faUpdateKeyDependencies } from './endpoints/i/2fa/update-key.js';
import { createIAppsProcedure, type IAppsDependencies } from './endpoints/i/apps.js';
import { createIAuthorizedAppsProcedure, type IAuthorizedAppsDependencies } from './endpoints/i/authorized-apps.js';
import { createIChangePasswordProcedure, type IChangePasswordDependencies } from './endpoints/i/change-password.js';
import { createIRegenerateTokenProcedure, type IRegenerateTokenDependencies } from './endpoints/i/regenerate-token.js';
import { createIRevokeTokenProcedure, type IRevokeTokenDependencies } from './endpoints/i/revoke-token.js';
import { createISigninHistoryProcedure, type ISigninHistoryDependencies } from './endpoints/i/signin-history.js';
import { createIUpdateEmailProcedure, type IUpdateEmailDependencies } from './endpoints/i/update-email.js';
import { createInviteCreateProcedure, type InviteCreateDependencies } from './endpoints/invite/create.js';
import { createInviteDeleteProcedure, type InviteDeleteDependencies } from './endpoints/invite/delete.js';
import { createInviteLimitProcedure, type InviteLimitDependencies } from './endpoints/invite/limit.js';
import { createInviteListProcedure, type InviteListDependencies } from './endpoints/invite/list.js';
import { createMiauthGenTokenProcedure, type MiauthGenTokenDependencies } from './endpoints/miauth/gen-token.js';
import { createMyAppsProcedure, type MyAppsDependencies } from './endpoints/my/apps.js';
import { createRequestResetPasswordProcedure, type RequestResetPasswordDependencies } from './endpoints/request-reset-password.js';
import { createResetPasswordProcedure, type ResetPasswordDependencies } from './endpoints/reset-password.js';
import { createUsernameAvailableProcedure, type UsernameAvailableDependencies } from './endpoints/username/available.js';
import { createVerifyEmailProcedure, type VerifyEmailDependencies } from './endpoints/verify-email.js';
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
