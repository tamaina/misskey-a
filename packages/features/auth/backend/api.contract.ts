/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc, type InferContractRouterInputs, type InferContractRouterOutputs, type InferSchemaOutput } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import * as schemas from './auth.schema.js';
export const AdminAccountsCreateContract = oc.$meta<{ requestName: 'admin/accounts/create' }>({ requestName: 'admin/accounts/create' }).route({ method: 'POST', path: '/admin/accounts/create', operationId: 'post___admin___accounts___create', tags: ['admin'] }).errors({ ...commonErrors, 'ACCESS_DENIED': { status: 400, data: apiErrorData }, 'INCORRECT_INITIAL_PASSWORD': { status: 400, data: apiErrorData } }).input(schemas.compositionAdminAccountsCreateInput).output(schemas.compositionAdminAccountsCreateOutput);
export const AdminCaptchaCurrentContract = oc.$meta<{ requestName: 'admin/captcha/current' }>({ requestName: 'admin/captcha/current' }).route({ method: 'POST', path: '/admin/captcha/current', operationId: 'post___admin___captcha___current', tags: ['admin', 'captcha'] }).errors({ ...commonErrors }).input(schemas.emptyAdminCaptchaCurrentInput).output(schemas.emptyAdminCaptchaCurrentOutput);
export const AdminCaptchaSaveContract = oc.$meta<{ requestName: 'admin/captcha/save' }>({ requestName: 'admin/captcha/save' }).route({ method: 'POST', path: '/admin/captcha/save', operationId: 'post___admin___captcha___save', tags: ['admin', 'captcha'] }).errors({ ...commonErrors, 'INVALID_PROVIDER': { status: 400, data: apiErrorData }, 'INVALID_PARAMETERS': { status: 400, data: apiErrorData }, 'NO_RESPONSE_PROVIDED': { status: 400, data: apiErrorData }, 'REQUEST_FAILED': { status: 500, data: apiErrorData }, 'VERIFICATION_FAILED': { status: 400, data: apiErrorData }, 'UNKNOWN': { status: 500, data: apiErrorData } }).input(schemas.portableAdminCaptchaSaveInput).output(schemas.portableAdminCaptchaSaveOutput);
export const AdminInviteCreateContract = oc.$meta<{ requestName: 'admin/invite/create' }>({ requestName: 'admin/invite/create' }).route({ method: 'POST', path: '/admin/invite/create', operationId: 'post___admin___invite___create', tags: ['admin'] }).errors({ ...commonErrors, 'INVALID_DATE_TIME': { status: 400, data: apiErrorData } }).input(schemas.packedAdminInviteCreateInput).output(schemas.packedAdminInviteCreateOutput);
export const AdminInviteListContract = oc.$meta<{ requestName: 'admin/invite/list' }>({ requestName: 'admin/invite/list' }).route({ method: 'POST', path: '/admin/invite/list', operationId: 'post___admin___invite___list', tags: ['admin'] }).errors({ ...commonErrors }).input(schemas.packedAdminInviteListInput).output(schemas.packedAdminInviteListOutput);
export const AdminResetPasswordContract = oc.$meta<{ requestName: 'admin/reset-password' }>({ requestName: 'admin/reset-password' }).route({ method: 'POST', path: '/admin/reset-password', operationId: 'post___admin___reset-password', tags: ['admin'] }).errors({ ...commonErrors, 'NO_SUCH_USER': { status: 400, data: apiErrorData }, 'ACCESS_DENIED': { status: 400, data: apiErrorData } }).input(schemas.inlineAdminResetPasswordInput).output(schemas.inlineAdminResetPasswordOutput);
export const AdminUnsetMfaContract = oc.$meta<{ requestName: 'admin/unset-mfa' }>({ requestName: 'admin/unset-mfa' }).route({ method: 'POST', path: '/admin/unset-mfa', operationId: 'post___admin___unset-mfa', tags: ['admin'] }).errors({ ...commonErrors, 'NO_SUCH_USER': { status: 400, data: apiErrorData }, 'ACCESS_DENIED': { status: 400, data: apiErrorData } }).input(schemas.voidAdminUnsetMfaInput).output(schemas.voidAdminUnsetMfaOutput);
export const AppCreateContract = oc.$meta<{ requestName: 'app/create' }>({ requestName: 'app/create' }).route({ method: 'POST', path: '/app/create', operationId: 'post___app___create', tags: ['app'] }).errors({ ...commonErrors }).input(schemas.uniqueAppCreateInput).output(schemas.uniqueAppCreateOutput);
export const AppShowContract = oc.$meta<{ requestName: 'app/show' }>({ requestName: 'app/show' }).route({ method: 'POST', path: '/app/show', operationId: 'post___app___show', tags: ['app'] }).errors({ ...commonErrors, 'NO_SUCH_APP': { status: 400, data: apiErrorData } }).input(schemas.packedAppShowInput).output(schemas.packedAppShowOutput);
export const AuthAcceptContract = oc.$meta<{ requestName: 'auth/accept' }>({ requestName: 'auth/accept' }).route({ method: 'POST', path: '/auth/accept', operationId: 'post___auth___accept', tags: ['auth'] }).errors({ ...commonErrors, 'NO_SUCH_SESSION': { status: 400, data: apiErrorData } }).input(schemas.voidAuthAcceptInput).output(schemas.voidAuthAcceptOutput);
export const AuthSessionGenerateContract = oc.$meta<{ requestName: 'auth/session/generate' }>({ requestName: 'auth/session/generate' }).route({ method: 'POST', path: '/auth/session/generate', operationId: 'post___auth___session___generate', tags: ['auth'] }).errors({ ...commonErrors, 'NO_SUCH_APP': { status: 400, data: apiErrorData } }).input(schemas.inlineAuthSessionGenerateInput).output(schemas.inlineAuthSessionGenerateOutput);
export const AuthSessionShowContract = oc.$meta<{ requestName: 'auth/session/show' }>({ requestName: 'auth/session/show' }).route({ method: 'POST', path: '/auth/session/show', operationId: 'post___auth___session___show', tags: ['auth'] }).errors({ ...commonErrors, 'NO_SUCH_SESSION': { status: 400, data: apiErrorData } }).input(schemas.packedAuthSessionShowInput).output(schemas.packedAuthSessionShowOutput);
export const AuthSessionUserkeyContract = oc.$meta<{ requestName: 'auth/session/userkey' }>({ requestName: 'auth/session/userkey' }).route({ method: 'POST', path: '/auth/session/userkey', operationId: 'post___auth___session___userkey', tags: ['auth'] }).errors({ ...commonErrors, 'NO_SUCH_APP': { status: 400, data: apiErrorData }, 'NO_SUCH_SESSION': { status: 400, data: apiErrorData }, 'PENDING_SESSION': { status: 400, data: apiErrorData } }).input(schemas.packedAuthSessionUserkeyInput).output(schemas.packedAuthSessionUserkeyOutput);
export const EmailAddressAvailableContract = oc.$meta<{ requestName: 'email-address/available' }>({ requestName: 'email-address/available' }).route({ method: 'POST', path: '/email-address/available', operationId: 'post___email-address___available', tags: ['users'] }).errors({ ...commonErrors }).input(schemas.inlineEmailAddressAvailableInput).output(schemas.inlineEmailAddressAvailableOutput);
export const I2faDoneContract = oc.$meta<{ requestName: 'i/2fa/done' }>({ requestName: 'i/2fa/done' }).route({ method: 'POST', path: '/i/2fa/done', operationId: 'post___i___2fa___done', tags: [] }).errors({ ...commonErrors }).input(schemas.inlineI2faDoneInput).output(schemas.inlineI2faDoneOutput);
export const I2faKeyDoneContract = oc.$meta<{ requestName: 'i/2fa/key-done' }>({ requestName: 'i/2fa/key-done' }).route({ method: 'POST', path: '/i/2fa/key-done', operationId: 'post___i___2fa___key-done', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData }, 'TWO_FACTOR_NOT_ENABLED': { status: 400, data: apiErrorData } }).input(schemas.inlineI2faKeyDoneInput).output(schemas.inlineI2faKeyDoneOutput);
export const I2faPasswordLessContract = oc.$meta<{ requestName: 'i/2fa/password-less' }>({ requestName: 'i/2fa/password-less' }).route({ method: 'POST', path: '/i/2fa/password-less', operationId: 'post___i___2fa___password-less', tags: [] }).errors({ ...commonErrors, 'NO_SECURITY_KEY': { status: 400, data: apiErrorData } }).input(schemas.voidI2faPasswordLessInput).output(schemas.voidI2faPasswordLessOutput);
export const I2faRegisterContract = oc.$meta<{ requestName: 'i/2fa/register' }>({ requestName: 'i/2fa/register' }).route({ method: 'POST', path: '/i/2fa/register', operationId: 'post___i___2fa___register', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData } }).input(schemas.inlineI2faRegisterInput).output(schemas.inlineI2faRegisterOutput);
export const I2faRegisterKeyContract = oc.$meta<{ requestName: 'i/2fa/register-key' }>({ requestName: 'i/2fa/register-key' }).route({ method: 'POST', path: '/i/2fa/register-key', operationId: 'post___i___2fa___register-key', tags: [] }).errors({ ...commonErrors, 'USER_NOT_FOUND': { status: 400, data: apiErrorData }, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData }, 'TWO_FACTOR_NOT_ENABLED': { status: 400, data: apiErrorData } }).input(schemas.inlineI2faRegisterKeyInput).output(schemas.inlineI2faRegisterKeyOutput);
export const I2faRemoveKeyContract = oc.$meta<{ requestName: 'i/2fa/remove-key' }>({ requestName: 'i/2fa/remove-key' }).route({ method: 'POST', path: '/i/2fa/remove-key', operationId: 'post___i___2fa___remove-key', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData } }).input(schemas.emptyObjectI2faRemoveKeyInput).output(schemas.emptyObjectI2faRemoveKeyOutput);
export const I2faUnregisterContract = oc.$meta<{ requestName: 'i/2fa/unregister' }>({ requestName: 'i/2fa/unregister' }).route({ method: 'POST', path: '/i/2fa/unregister', operationId: 'post___i___2fa___unregister', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData } }).input(schemas.voidI2faUnregisterInput).output(schemas.voidI2faUnregisterOutput);
export const I2faUpdateKeyContract = oc.$meta<{ requestName: 'i/2fa/update-key' }>({ requestName: 'i/2fa/update-key' }).route({ method: 'POST', path: '/i/2fa/update-key', operationId: 'post___i___2fa___update-key', tags: [] }).errors({ ...commonErrors, 'NO_SUCH_KEY': { status: 400, data: apiErrorData }, 'ACCESS_DENIED': { status: 400, data: apiErrorData } }).input(schemas.emptyObjectI2faUpdateKeyInput).output(schemas.emptyObjectI2faUpdateKeyOutput);
export const IAppsContract = oc.$meta<{ requestName: 'i/apps' }>({ requestName: 'i/apps' }).route({ method: 'POST', path: '/i/apps', operationId: 'post___i___apps', tags: [] }).errors({ ...commonErrors }).input(schemas.inlineIAppsInput).output(schemas.inlineIAppsOutput);
export const IAuthorizedAppsContract = oc.$meta<{ requestName: 'i/authorized-apps' }>({ requestName: 'i/authorized-apps' }).route({ method: 'POST', path: '/i/authorized-apps', operationId: 'post___i___authorized-apps', tags: [] }).errors({ ...commonErrors }).input(schemas.inlineIAuthorizedAppsInput).output(schemas.inlineIAuthorizedAppsOutput);
export const IChangePasswordContract = oc.$meta<{ requestName: 'i/change-password' }>({ requestName: 'i/change-password' }).route({ method: 'POST', path: '/i/change-password', operationId: 'post___i___change-password', tags: [] }).errors({ ...commonErrors }).input(schemas.voidIChangePasswordInput).output(schemas.voidIChangePasswordOutput);
export const IRegenerateTokenContract = oc.$meta<{ requestName: 'i/regenerate-token' }>({ requestName: 'i/regenerate-token' }).route({ method: 'POST', path: '/i/regenerate-token', operationId: 'post___i___regenerate-token', tags: [] }).errors({ ...commonErrors }).input(schemas.voidIRegenerateTokenInput).output(schemas.voidIRegenerateTokenOutput);
export const IRevokeTokenContract = oc.$meta<{ requestName: 'i/revoke-token' }>({ requestName: 'i/revoke-token' }).route({ method: 'POST', path: '/i/revoke-token', operationId: 'post___i___revoke-token', tags: [] }).errors({ ...commonErrors, 'CREDENTIAL_REQUIRED': { status: 401, data: apiErrorData }, 'PERMISSION_DENIED': { status: 403, data: apiErrorData } }).input(schemas.selectorIRevokeTokenInput).output(schemas.selectorIRevokeTokenOutput);
export const ISigninHistoryContract = oc.$meta<{ requestName: 'i/signin-history' }>({ requestName: 'i/signin-history' }).route({ method: 'POST', path: '/i/signin-history', operationId: 'post___i___signin-history', tags: [] }).errors({ ...commonErrors }).input(schemas.packedISigninHistoryInput).output(schemas.packedISigninHistoryOutput);
export const IUpdateEmailContract = oc.$meta<{ requestName: 'i/update-email' }>({ requestName: 'i/update-email' }).route({ method: 'POST', path: '/i/update-email', operationId: 'post___i___update-email', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData }, 'UNAVAILABLE': { status: 400, data: apiErrorData }, 'EMAIL_REQUIRED': { status: 400, data: apiErrorData } }).input(schemas.packedIUpdateEmailInput).output(schemas.packedIUpdateEmailOutput);
export const InviteCreateContract = oc.$meta<{ requestName: 'invite/create' }>({ requestName: 'invite/create' }).route({ method: 'POST', path: '/invite/create', operationId: 'post___invite___create', tags: ['meta'] }).errors({ ...commonErrors, 'EXCEEDED_LIMIT_OF_CREATE_INVITE_CODE': { status: 400, data: apiErrorData } }).input(schemas.packedInviteCreateInput).output(schemas.packedInviteCreateOutput);
export const InviteDeleteContract = oc.$meta<{ requestName: 'invite/delete' }>({ requestName: 'invite/delete' }).route({ method: 'POST', path: '/invite/delete', operationId: 'post___invite___delete', tags: ['meta'] }).errors({ ...commonErrors, 'NO_SUCH_INVITE_CODE': { status: 400, data: apiErrorData }, 'CAN_NOT_DELETE_INVITE_CODE': { status: 400, data: apiErrorData }, 'ACCESS_DENIED': { status: 400, data: apiErrorData } }).input(schemas.voidInviteDeleteInput).output(schemas.voidInviteDeleteOutput);
export const InviteLimitContract = oc.$meta<{ requestName: 'invite/limit' }>({ requestName: 'invite/limit' }).route({ method: 'POST', path: '/invite/limit', operationId: 'post___invite___limit', tags: ['meta'] }).errors({ ...commonErrors }).input(schemas.inlineInviteLimitInput).output(schemas.inlineInviteLimitOutput);
export const InviteListContract = oc.$meta<{ requestName: 'invite/list' }>({ requestName: 'invite/list' }).route({ method: 'POST', path: '/invite/list', operationId: 'post___invite___list', tags: ['meta'] }).errors({ ...commonErrors }).input(schemas.packedInviteListInput).output(schemas.packedInviteListOutput);
export const MiauthGenTokenContract = oc.$meta<{ requestName: 'miauth/gen-token' }>({ requestName: 'miauth/gen-token' }).route({ method: 'POST', path: '/miauth/gen-token', operationId: 'post___miauth___gen-token', tags: ['auth'] }).errors({ ...commonErrors }).input(schemas.uniqueMiauthGenTokenInput).output(schemas.uniqueMiauthGenTokenOutput);
export const MyAppsContract = oc.$meta<{ requestName: 'my/apps' }>({ requestName: 'my/apps' }).route({ method: 'POST', path: '/my/apps', operationId: 'post___my___apps', tags: ['account', 'app'] }).errors({ ...commonErrors }).input(schemas.packedMyAppsInput).output(schemas.packedMyAppsOutput);
export const RequestResetPasswordContract = oc.$meta<{ requestName: 'request-reset-password' }>({ requestName: 'request-reset-password' }).route({ method: 'POST', path: '/request-reset-password', operationId: 'post___request-reset-password', tags: ['reset password'] }).errors({ ...commonErrors }).input(schemas.voidRequestResetPasswordInput).output(schemas.voidRequestResetPasswordOutput);
export const ResetPasswordContract = oc.$meta<{ requestName: 'reset-password' }>({ requestName: 'reset-password' }).route({ method: 'POST', path: '/reset-password', operationId: 'post___reset-password', tags: ['reset password'] }).errors({ ...commonErrors }).input(schemas.voidResetPasswordInput).output(schemas.voidResetPasswordOutput);
export const UsernameAvailableContract = oc.$meta<{ requestName: 'username/available' }>({ requestName: 'username/available' }).route({ method: 'POST', path: '/username/available', operationId: 'post___username___available', tags: ['users'] }).errors({ ...commonErrors }).input(schemas.remainingUsernameAvailableInput).output(schemas.remainingUsernameAvailableOutput);
export const VerifyEmailContract = oc.$meta<{ requestName: 'verify-email' }>({ requestName: 'verify-email' }).route({ method: 'POST', path: '/verify-email', operationId: 'post___verify-email', tags: ['account'] }).errors({ ...commonErrors, 'NO_SUCH_CODE': { status: 400, data: apiErrorData } }).input(schemas.voidVerifyEmailInput).output(schemas.voidVerifyEmailOutput);
export const authContract = {
	'admin/accounts/create': AdminAccountsCreateContract,
	'admin/captcha/current': AdminCaptchaCurrentContract,
	'admin/captcha/save': AdminCaptchaSaveContract,
	'admin/invite/create': AdminInviteCreateContract,
	'admin/invite/list': AdminInviteListContract,
	'admin/reset-password': AdminResetPasswordContract,
	'admin/unset-mfa': AdminUnsetMfaContract,
	'app/create': AppCreateContract,
	'app/show': AppShowContract,
	'auth/accept': AuthAcceptContract,
	'auth/session/generate': AuthSessionGenerateContract,
	'auth/session/show': AuthSessionShowContract,
	'auth/session/userkey': AuthSessionUserkeyContract,
	'email-address/available': EmailAddressAvailableContract,
	'i/2fa/done': I2faDoneContract,
	'i/2fa/key-done': I2faKeyDoneContract,
	'i/2fa/password-less': I2faPasswordLessContract,
	'i/2fa/register': I2faRegisterContract,
	'i/2fa/register-key': I2faRegisterKeyContract,
	'i/2fa/remove-key': I2faRemoveKeyContract,
	'i/2fa/unregister': I2faUnregisterContract,
	'i/2fa/update-key': I2faUpdateKeyContract,
	'i/apps': IAppsContract,
	'i/authorized-apps': IAuthorizedAppsContract,
	'i/change-password': IChangePasswordContract,
	'i/regenerate-token': IRegenerateTokenContract,
	'i/revoke-token': IRevokeTokenContract,
	'i/signin-history': ISigninHistoryContract,
	'i/update-email': IUpdateEmailContract,
	'invite/create': InviteCreateContract,
	'invite/delete': InviteDeleteContract,
	'invite/limit': InviteLimitContract,
	'invite/list': InviteListContract,
	'miauth/gen-token': MiauthGenTokenContract,
	'my/apps': MyAppsContract,
	'request-reset-password': RequestResetPasswordContract,
	'reset-password': ResetPasswordContract,
	'username/available': UsernameAvailableContract,
	'verify-email': VerifyEmailContract,
};
export type AuthInputs = InferContractRouterInputs<typeof authContract>;
export type AuthParsedInputs = { [Name in keyof typeof authContract]: InferSchemaOutput<NonNullable<(typeof authContract)[Name]['~orpc']['inputSchema']>> };
export type AuthOutputs = InferContractRouterOutputs<typeof authContract>;
