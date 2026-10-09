/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AuthApplicationService } from './api.application.js';
import { AdminAccountsCreateOperation } from './endpoints/admin/accounts/create.js';
import { AdminCaptchaCurrentOperation } from './endpoints/admin/captcha/current.js';
import { AdminCaptchaSaveOperation } from './endpoints/admin/captcha/save.js';
import { AdminInviteCreateOperation } from './endpoints/admin/invite/create.js';
import { AdminInviteListOperation } from './endpoints/admin/invite/list.js';
import { AdminResetPasswordOperation } from './endpoints/admin/reset-password.js';
import { AdminUnsetMfaOperation } from './endpoints/admin/unset-mfa.js';
import { AppCreateOperation } from './endpoints/app/create.js';
import { AppShowOperation } from './endpoints/app/show.js';
import { AuthAcceptOperation } from './endpoints/auth/accept.js';
import { AuthSessionGenerateOperation } from './endpoints/auth/session/generate.js';
import { AuthSessionShowOperation } from './endpoints/auth/session/show.js';
import { AuthSessionUserkeyOperation } from './endpoints/auth/session/userkey.js';
import { EmailAddressAvailableOperation } from './endpoints/email-address/available.js';
import { I2faDoneOperation } from './endpoints/i/2fa/done.js';
import { I2faKeyDoneOperation } from './endpoints/i/2fa/key-done.js';
import { I2faPasswordLessOperation } from './endpoints/i/2fa/password-less.js';
import { I2faRegisterOperation } from './endpoints/i/2fa/register.js';
import { I2faRegisterKeyOperation } from './endpoints/i/2fa/register-key.js';
import { I2faRemoveKeyOperation } from './endpoints/i/2fa/remove-key.js';
import { I2faUnregisterOperation } from './endpoints/i/2fa/unregister.js';
import { I2faUpdateKeyOperation } from './endpoints/i/2fa/update-key.js';
import { IAppsOperation } from './endpoints/i/apps.js';
import { IAuthorizedAppsOperation } from './endpoints/i/authorized-apps.js';
import { IChangePasswordOperation } from './endpoints/i/change-password.js';
import { IRegenerateTokenOperation } from './endpoints/i/regenerate-token.js';
import { IRevokeTokenOperation } from './endpoints/i/revoke-token.js';
import { ISigninHistoryOperation } from './endpoints/i/signin-history.js';
import { IUpdateEmailOperation } from './endpoints/i/update-email.js';
import { InviteCreateOperation } from './endpoints/invite/create.js';
import { InviteDeleteOperation } from './endpoints/invite/delete.js';
import { InviteLimitOperation } from './endpoints/invite/limit.js';
import { InviteListOperation } from './endpoints/invite/list.js';
import { MiauthGenTokenOperation } from './endpoints/miauth/gen-token.js';
import { MyAppsOperation } from './endpoints/my/apps.js';
import { RequestResetPasswordOperation } from './endpoints/request-reset-password.js';
import { ResetPasswordOperation } from './endpoints/reset-password.js';
import { UsernameAvailableOperation } from './endpoints/username/available.js';
import { VerifyEmailOperation } from './endpoints/verify-email.js';

export const authProviders = [AuthApplicationService, AdminAccountsCreateOperation, AdminCaptchaCurrentOperation, AdminCaptchaSaveOperation, AdminInviteCreateOperation, AdminInviteListOperation, AdminResetPasswordOperation, AdminUnsetMfaOperation, AppCreateOperation, AppShowOperation, AuthAcceptOperation, AuthSessionGenerateOperation, AuthSessionShowOperation, AuthSessionUserkeyOperation, EmailAddressAvailableOperation, I2faDoneOperation, I2faKeyDoneOperation, I2faPasswordLessOperation, I2faRegisterOperation, I2faRegisterKeyOperation, I2faRemoveKeyOperation, I2faUnregisterOperation, I2faUpdateKeyOperation, IAppsOperation, IAuthorizedAppsOperation, IChangePasswordOperation, IRegenerateTokenOperation, IRevokeTokenOperation, ISigninHistoryOperation, IUpdateEmailOperation, InviteCreateOperation, InviteDeleteOperation, InviteLimitOperation, InviteListOperation, MiauthGenTokenOperation, MyAppsOperation, RequestResetPasswordOperation, ResetPasswordOperation, UsernameAvailableOperation, VerifyEmailOperation];
