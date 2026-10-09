/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedUserDetailed } from '../../users/backend/user.schema.js';
import { toWebAuthnRegistrationOptions } from './webauthn.schema.js';
import type { AuthOperations } from './api.router.js';
import * as schemas from './auth.schema.js';
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

@Injectable()
export class AuthApplicationService implements AuthOperations<MiLocalUser> {
	constructor(
		private readonly adminAccountsCreateOperation: AdminAccountsCreateOperation,
		private readonly adminCaptchaCurrentOperation: AdminCaptchaCurrentOperation,
		private readonly adminCaptchaSaveOperation: AdminCaptchaSaveOperation,
		private readonly adminInviteCreateOperation: AdminInviteCreateOperation,
		private readonly adminInviteListOperation: AdminInviteListOperation,
		private readonly adminResetPasswordOperation: AdminResetPasswordOperation,
		private readonly adminUnsetMfaOperation: AdminUnsetMfaOperation,
		private readonly appCreateOperation: AppCreateOperation,
		private readonly appShowOperation: AppShowOperation,
		private readonly authAcceptOperation: AuthAcceptOperation,
		private readonly authSessionGenerateOperation: AuthSessionGenerateOperation,
		private readonly authSessionShowOperation: AuthSessionShowOperation,
		private readonly authSessionUserkeyOperation: AuthSessionUserkeyOperation,
		private readonly emailAddressAvailableOperation: EmailAddressAvailableOperation,
		private readonly i2faDoneOperation: I2faDoneOperation,
		private readonly i2faKeyDoneOperation: I2faKeyDoneOperation,
		private readonly i2faPasswordLessOperation: I2faPasswordLessOperation,
		private readonly i2faRegisterOperation: I2faRegisterOperation,
		private readonly i2faRegisterKeyOperation: I2faRegisterKeyOperation,
		private readonly i2faRemoveKeyOperation: I2faRemoveKeyOperation,
		private readonly i2faUnregisterOperation: I2faUnregisterOperation,
		private readonly i2faUpdateKeyOperation: I2faUpdateKeyOperation,
		private readonly iAppsOperation: IAppsOperation,
		private readonly iAuthorizedAppsOperation: IAuthorizedAppsOperation,
		private readonly iChangePasswordOperation: IChangePasswordOperation,
		private readonly iRegenerateTokenOperation: IRegenerateTokenOperation,
		private readonly iRevokeTokenOperation: IRevokeTokenOperation,
		private readonly iSigninHistoryOperation: ISigninHistoryOperation,
		private readonly iUpdateEmailOperation: IUpdateEmailOperation,
		private readonly inviteCreateOperation: InviteCreateOperation,
		private readonly inviteDeleteOperation: InviteDeleteOperation,
		private readonly inviteLimitOperation: InviteLimitOperation,
		private readonly inviteListOperation: InviteListOperation,
		private readonly miauthGenTokenOperation: MiauthGenTokenOperation,
		private readonly myAppsOperation: MyAppsOperation,
		private readonly requestResetPasswordOperation: RequestResetPasswordOperation,
		private readonly resetPasswordOperation: ResetPasswordOperation,
		private readonly usernameAvailableOperation: UsernameAvailableOperation,
		private readonly verifyEmailOperation: VerifyEmailOperation
	) {}

	'admin/accounts/create': AuthOperations<MiLocalUser>['admin/accounts/create'] = async (input, actor, token, _ip) => { const result = await this.adminAccountsCreateOperation.execute(input, actor, token); return v.parse(schemas.compositionAdminAccountsCreateOutput, { ...toPackedUserDetailed(result), token: result.token }); };
	'admin/captcha/current': AuthOperations<MiLocalUser>['admin/captcha/current'] = async (input, actor, token, _ip) => { return v.parse(schemas.emptyAdminCaptchaCurrentOutput, await this.adminCaptchaCurrentOperation.execute()); };
	'admin/captcha/save': AuthOperations<MiLocalUser>['admin/captcha/save'] = async (input, actor, token, _ip) => { return v.parse(schemas.portableAdminCaptchaSaveOutput, await this.adminCaptchaSaveOperation.execute(input)); };
	'admin/invite/create': AuthOperations<MiLocalUser>['admin/invite/create'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedAdminInviteCreateOutput, await this.adminInviteCreateOperation.execute(input, actor)); };
	'admin/invite/list': AuthOperations<MiLocalUser>['admin/invite/list'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedAdminInviteListOutput, await this.adminInviteListOperation.execute(input, actor)); };
	'admin/reset-password': AuthOperations<MiLocalUser>['admin/reset-password'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineAdminResetPasswordOutput, await this.adminResetPasswordOperation.execute(input, actor)); };
	'admin/unset-mfa': AuthOperations<MiLocalUser>['admin/unset-mfa'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidAdminUnsetMfaOutput, await this.adminUnsetMfaOperation.execute(input, actor)); };
	'app/create': AuthOperations<MiLocalUser>['app/create'] = async (input, actor, token, _ip) => { return v.parse(schemas.uniqueAppCreateOutput, await this.appCreateOperation.execute(input, actor)); };
	'app/show': AuthOperations<MiLocalUser>['app/show'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedAppShowOutput, await this.appShowOperation.execute(input, actor, token)); };
	'auth/accept': AuthOperations<MiLocalUser>['auth/accept'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidAuthAcceptOutput, await this.authAcceptOperation.execute(input, actor)); };
	'auth/session/generate': AuthOperations<MiLocalUser>['auth/session/generate'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineAuthSessionGenerateOutput, await this.authSessionGenerateOperation.execute(input, actor)); };
	'auth/session/show': AuthOperations<MiLocalUser>['auth/session/show'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedAuthSessionShowOutput, await this.authSessionShowOperation.execute(input, actor)); };
	'auth/session/userkey': AuthOperations<MiLocalUser>['auth/session/userkey'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedAuthSessionUserkeyOutput, await this.authSessionUserkeyOperation.execute(input, actor)); };
	'email-address/available': AuthOperations<MiLocalUser>['email-address/available'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineEmailAddressAvailableOutput, await this.emailAddressAvailableOperation.execute(input, actor)); };
	'i/2fa/done': AuthOperations<MiLocalUser>['i/2fa/done'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineI2faDoneOutput, await this.i2faDoneOperation.execute(input, actor)); };
	'i/2fa/key-done': AuthOperations<MiLocalUser>['i/2fa/key-done'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineI2faKeyDoneOutput, await this.i2faKeyDoneOperation.execute(input, actor)); };
	'i/2fa/password-less': AuthOperations<MiLocalUser>['i/2fa/password-less'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidI2faPasswordLessOutput, await this.i2faPasswordLessOperation.execute(input, actor)); };
	'i/2fa/register': AuthOperations<MiLocalUser>['i/2fa/register'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineI2faRegisterOutput, await this.i2faRegisterOperation.execute(input, actor)); };
	'i/2fa/register-key': AuthOperations<MiLocalUser>['i/2fa/register-key'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineI2faRegisterKeyOutput, toWebAuthnRegistrationOptions(await this.i2faRegisterKeyOperation.execute(input, actor))); };
	'i/2fa/remove-key': AuthOperations<MiLocalUser>['i/2fa/remove-key'] = async (input, actor, token, _ip) => { return v.parse(schemas.emptyObjectI2faRemoveKeyOutput, await this.i2faRemoveKeyOperation.execute(input, actor)); };
	'i/2fa/unregister': AuthOperations<MiLocalUser>['i/2fa/unregister'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidI2faUnregisterOutput, await this.i2faUnregisterOperation.execute(input, actor)); };
	'i/2fa/update-key': AuthOperations<MiLocalUser>['i/2fa/update-key'] = async (input, actor, token, _ip) => { return v.parse(schemas.emptyObjectI2faUpdateKeyOutput, await this.i2faUpdateKeyOperation.execute(input, actor)); };
	'i/apps': AuthOperations<MiLocalUser>['i/apps'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineIAppsOutput, await this.iAppsOperation.execute(input, actor)); };
	'i/authorized-apps': AuthOperations<MiLocalUser>['i/authorized-apps'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineIAuthorizedAppsOutput, await this.iAuthorizedAppsOperation.execute(input, actor)); };
	'i/change-password': AuthOperations<MiLocalUser>['i/change-password'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidIChangePasswordOutput, await this.iChangePasswordOperation.execute(input, actor)); };
	'i/regenerate-token': AuthOperations<MiLocalUser>['i/regenerate-token'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidIRegenerateTokenOutput, await this.iRegenerateTokenOperation.execute(input, actor)); };
	'i/revoke-token': AuthOperations<MiLocalUser>['i/revoke-token'] = async (input, actor, token, _ip) => { return v.parse(schemas.selectorIRevokeTokenOutput, await this.iRevokeTokenOperation.execute(input, actor, token)); };
	'i/signin-history': AuthOperations<MiLocalUser>['i/signin-history'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedISigninHistoryOutput, await this.iSigninHistoryOperation.execute(input, actor)); };
	'i/update-email': AuthOperations<MiLocalUser>['i/update-email'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedIUpdateEmailOutput, toPackedUserDetailed(await this.iUpdateEmailOperation.execute(input, actor))); };
	'invite/create': AuthOperations<MiLocalUser>['invite/create'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedInviteCreateOutput, await this.inviteCreateOperation.execute(input, actor)); };
	'invite/delete': AuthOperations<MiLocalUser>['invite/delete'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidInviteDeleteOutput, await this.inviteDeleteOperation.execute(input, actor)); };
	'invite/limit': AuthOperations<MiLocalUser>['invite/limit'] = async (input, actor, token, _ip) => { return v.parse(schemas.inlineInviteLimitOutput, await this.inviteLimitOperation.execute(input, actor)); };
	'invite/list': AuthOperations<MiLocalUser>['invite/list'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedInviteListOutput, await this.inviteListOperation.execute(input, actor)); };
	'miauth/gen-token': AuthOperations<MiLocalUser>['miauth/gen-token'] = async (input, actor, token, _ip) => { return v.parse(schemas.uniqueMiauthGenTokenOutput, await this.miauthGenTokenOperation.execute(input, actor)); };
	'my/apps': AuthOperations<MiLocalUser>['my/apps'] = async (input, actor, token, _ip) => { return v.parse(schemas.packedMyAppsOutput, await this.myAppsOperation.execute(input, actor)); };
	'request-reset-password': AuthOperations<MiLocalUser>['request-reset-password'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidRequestResetPasswordOutput, await this.requestResetPasswordOperation.execute(input, actor)); };
	'reset-password': AuthOperations<MiLocalUser>['reset-password'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidResetPasswordOutput, await this.resetPasswordOperation.execute(input, actor)); };
	'username/available': AuthOperations<MiLocalUser>['username/available'] = async (input, actor, token, _ip) => { return v.parse(schemas.remainingUsernameAvailableOutput, await this.usernameAvailableOperation.execute(input, actor)); };
	'verify-email': AuthOperations<MiLocalUser>['verify-email'] = async (input, actor, token, _ip) => { return v.parse(schemas.voidVerifyEmailOutput, await this.verifyEmailOperation.execute(input)); };
}
