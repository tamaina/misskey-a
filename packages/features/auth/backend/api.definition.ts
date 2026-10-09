/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs, InferSchemaOutput } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { objectInput, rawObjectInputGuard } from '../../api/backend/transport/input.schema.js';
import { packedJsonValueSchema, packedOptionalJsonValueSchema } from '../../users/backend/json-value.schema.js';
import { packedMeDetailedSchema, packedUserDetailedNotMeSchema } from '../../users/backend/user.schema.js';
import { localUsernameSchema, passwordSchema } from '../../users/backend/user-validation.schema.js';
import { webAuthnRegistrationOptionsSchema, webAuthnAuthenticationOptionsSchema } from './webauthn.schema.js';
import { packedAppSchema, packedInviteCodeSchema, packedSigninSchema, supportedCaptchaProviders } from './auth.schema.js';
import { sessionFailureSchema, fastifyFailureSchema } from './session-errors.schema.js';
import { finishedSigninSchema } from './session.schema.js';

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const uniqueStringArray = (item: v.GenericSchema<string, string>) => v.pipe(v.array(item), v.check(values => new Set(values).size === values.length, 'Expected unique strings'));

export const AdminAccountsCreateContract = oc.$meta({ requestName: 'admin/accounts/create' } as const).route({ method: 'POST', path: '/admin/accounts/create', operationId: 'post___admin___accounts___create', tags: ['admin'] }).errors({ ...commonErrors, 'ACCESS_DENIED': { status: 400, data: apiErrorData }, 'INCORRECT_INITIAL_PASSWORD': { status: 400, data: apiErrorData } }).input(objectInput({
	username: localUsernameSchema,
	password: passwordSchema,
	setupPassword: v.exactOptional(v.nullable(v.string())),
})).output(v.strictObject({ ...packedMeDetailedSchema.entries, token: v.string() }));

export const AdminCaptchaCurrentContract = oc.$meta({ requestName: 'admin/captcha/current' } as const).route({ method: 'POST', path: '/admin/captcha/current', operationId: 'post___admin___captcha___current', tags: ['admin', 'captcha'] }).errors({ ...commonErrors }).input(packedOptionalJsonValueSchema).output(v.strictObject({
	provider: v.picklist(supportedCaptchaProviders),
	hcaptcha: v.strictObject({
		siteKey: v.nullable(v.string()),
		secretKey: v.nullable(v.string()),
	}),
	mcaptcha: v.strictObject({
		siteKey: v.nullable(v.string()),
		secretKey: v.nullable(v.string()),
		instanceUrl: v.nullable(v.string()),
	}),
	recaptcha: v.strictObject({
		siteKey: v.nullable(v.string()),
		secretKey: v.nullable(v.string()),
	}),
	turnstile: v.strictObject({
		siteKey: v.nullable(v.string()),
		secretKey: v.nullable(v.string()),
	}),
}));

export const AdminCaptchaSaveContract = oc.$meta({ requestName: 'admin/captcha/save' } as const).route({ method: 'POST', path: '/admin/captcha/save', operationId: 'post___admin___captcha___save', tags: ['admin', 'captcha'] }).errors({ ...commonErrors, 'INVALID_PROVIDER': { status: 400, data: apiErrorData }, 'INVALID_PARAMETERS': { status: 400, data: apiErrorData }, 'NO_RESPONSE_PROVIDED': { status: 400, data: apiErrorData }, 'REQUEST_FAILED': { status: 500, data: apiErrorData }, 'VERIFICATION_FAILED': { status: 400, data: apiErrorData }, 'UNKNOWN': { status: 500, data: apiErrorData } }).input(objectInput({
	"provider": v.picklist(supportedCaptchaProviders),
	"captchaResult": v.exactOptional(v.nullable(v.string())),
	"sitekey": v.exactOptional(v.nullable(v.string())),
	"secret": v.exactOptional(v.nullable(v.string())),
	"instanceUrl": v.exactOptional(v.nullable(v.string())),
})).output(v.void());

export const AdminInviteCreateContract = oc.$meta({ requestName: 'admin/invite/create' } as const).route({ method: 'POST', path: '/admin/invite/create', operationId: 'post___admin___invite___create', tags: ['admin'] }).errors({ ...commonErrors, 'INVALID_DATE_TIME': { status: 400, data: apiErrorData } }).input(objectInput({
	"count": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 1),
	"expiresAt": v.exactOptional(v.nullable(v.string())),
})).output(v.array(packedInviteCodeSchema));

export const AdminInviteListContract = oc.$meta({ requestName: 'admin/invite/list' } as const).route({ method: 'POST', path: '/admin/invite/list', operationId: 'post___admin___invite___list', tags: ['admin'] }).errors({ ...commonErrors }).input(objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"type": v.optional(v.picklist(["unused", "used", "expired", "all"]), "all"),
	"sort": v.exactOptional(v.picklist(["+createdAt", "-createdAt", "+usedAt", "-usedAt"])),
})).output(v.array(packedInviteCodeSchema));

export const AdminResetPasswordContract = oc.$meta({ requestName: 'admin/reset-password' } as const).route({ method: 'POST', path: '/admin/reset-password', operationId: 'post___admin___reset-password', tags: ['admin'] }).errors({ ...commonErrors, 'NO_SUCH_USER': { status: 400, data: apiErrorData }, 'ACCESS_DENIED': { status: 400, data: apiErrorData } }).input(objectInput({
	"userId": misskeyId,
})).output(v.strictObject({
	"password": v.pipe(v.string(), v.metadata({ "minLength": 8, "maxLength": 8 })),
}));

export const AdminUnsetMfaContract = oc.$meta({ requestName: 'admin/unset-mfa' } as const).route({ method: 'POST', path: '/admin/unset-mfa', operationId: 'post___admin___unset-mfa', tags: ['admin'] }).errors({ ...commonErrors, 'NO_SUCH_USER': { status: 400, data: apiErrorData }, 'ACCESS_DENIED': { status: 400, data: apiErrorData } }).input(objectInput({
	"userId": misskeyId,
})).output(v.void());

export const AppCreateContract = oc.$meta({ requestName: 'app/create' } as const).route({ method: 'POST', path: '/app/create', operationId: 'post___app___create', tags: ['app'] }).errors({ ...commonErrors }).input(objectInput({
	"name": v.string(),
	"description": v.string(),
	"permission": uniqueStringArray(v.string()),
	"callbackUrl": v.exactOptional(v.nullable(v.string())),
})).output(packedAppSchema);

export const AppShowContract = oc.$meta({ requestName: 'app/show' } as const).route({ method: 'POST', path: '/app/show', operationId: 'post___app___show', tags: ['app'] }).errors({ ...commonErrors, 'NO_SUCH_APP': { status: 400, data: apiErrorData } }).input(objectInput({
	"appId": misskeyId,
})).output(packedAppSchema);

export const AuthAcceptContract = oc.$meta({ requestName: 'auth/accept' } as const).route({ method: 'POST', path: '/auth/accept', operationId: 'post___auth___accept', tags: ['auth'] }).errors({ ...commonErrors, 'NO_SUCH_SESSION': { status: 400, data: apiErrorData } }).input(objectInput({
	"token": v.string(),
})).output(v.void());

export const AuthSessionGenerateContract = oc.$meta({ requestName: 'auth/session/generate' } as const).route({ method: 'POST', path: '/auth/session/generate', operationId: 'post___auth___session___generate', tags: ['auth'] }).errors({ ...commonErrors, 'NO_SUCH_APP': { status: 400, data: apiErrorData } }).input(objectInput({
	"appSecret": v.string(),
})).output(v.strictObject({
	"token": v.string(),
	"url": v.pipe(v.string(), v.metadata({ "format": "url" })),
}));

export const AuthSessionShowContract = oc.$meta({ requestName: 'auth/session/show' } as const).route({ method: 'POST', path: '/auth/session/show', operationId: 'post___auth___session___show', tags: ['auth'] }).errors({ ...commonErrors, 'NO_SUCH_SESSION': { status: 400, data: apiErrorData } }).input(objectInput({
	"token": v.string(),
})).output(v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"app": packedAppSchema,
	"token": v.string(),
}));

export const AuthSessionUserkeyContract = oc.$meta({ requestName: 'auth/session/userkey' } as const).route({ method: 'POST', path: '/auth/session/userkey', operationId: 'post___auth___session___userkey', tags: ['auth'] }).errors({ ...commonErrors, 'NO_SUCH_APP': { status: 400, data: apiErrorData }, 'NO_SUCH_SESSION': { status: 400, data: apiErrorData }, 'PENDING_SESSION': { status: 400, data: apiErrorData } }).input(objectInput({
	"appSecret": v.string(),
	"token": v.string(),
})).output(v.strictObject({
	"accessToken": v.string(),
	"user": packedUserDetailedNotMeSchema,
}));

export const EmailAddressAvailableContract = oc.$meta({ requestName: 'email-address/available' } as const).route({ method: 'POST', path: '/email-address/available', operationId: 'post___email-address___available', tags: ['users'] }).errors({ ...commonErrors }).input(objectInput({
	"emailAddress": v.string(),
})).output(v.strictObject({
	"available": v.boolean(),
	"reason": v.nullable(v.string()),
}));

export const I2faDoneContract = oc.$meta({ requestName: 'i/2fa/done' } as const).route({ method: 'POST', path: '/i/2fa/done', operationId: 'post___i___2fa___done', tags: [] }).errors({ ...commonErrors }).input(objectInput({
	"token": v.string(),
})).output(v.strictObject({
	"backupCodes": v.array(v.string()),
}));

export const I2faKeyDoneContract = oc.$meta({ requestName: 'i/2fa/key-done' } as const).route({ method: 'POST', path: '/i/2fa/key-done', operationId: 'post___i___2fa___key-done', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData }, 'TWO_FACTOR_NOT_ENABLED': { status: 400, data: apiErrorData } }).input(objectInput({
	password: v.string(),
	token: v.optional(v.nullable(v.string())),
	name: v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(30)),
	credential: packedJsonValueSchema,
})).output(v.strictObject({ id: v.string(), name: v.string() }));

export const I2faPasswordLessContract = oc.$meta({ requestName: 'i/2fa/password-less' } as const).route({ method: 'POST', path: '/i/2fa/password-less', operationId: 'post___i___2fa___password-less', tags: [] }).errors({ ...commonErrors, 'NO_SECURITY_KEY': { status: 400, data: apiErrorData } }).input(objectInput({
	"value": v.boolean(),
})).output(v.void());

export const I2faRegisterContract = oc.$meta({ requestName: 'i/2fa/register' } as const).route({ method: 'POST', path: '/i/2fa/register', operationId: 'post___i___2fa___register', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData } }).input(objectInput({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
})).output(v.strictObject({
	"qr": v.string(),
	"url": v.string(),
	"secret": v.string(),
	"label": v.string(),
	"issuer": v.string(),
}));

export const I2faRegisterKeyContract = oc.$meta({ requestName: 'i/2fa/register-key' } as const).route({ method: 'POST', path: '/i/2fa/register-key', operationId: 'post___i___2fa___register-key', tags: [] }).errors({ ...commonErrors, 'USER_NOT_FOUND': { status: 400, data: apiErrorData }, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData }, 'TWO_FACTOR_NOT_ENABLED': { status: 400, data: apiErrorData } }).input(objectInput({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
})).output(webAuthnRegistrationOptionsSchema);

export const I2faRemoveKeyContract = oc.$meta({ requestName: 'i/2fa/remove-key' } as const).route({ method: 'POST', path: '/i/2fa/remove-key', operationId: 'post___i___2fa___remove-key', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData } }).input(objectInput({
	password: v.string(),
	token: v.optional(v.nullable(v.string())),
	credentialId: v.string(),
})).output(v.intersect([v.strictObject({}), rawObjectInputGuard]));

export const I2faUnregisterContract = oc.$meta({ requestName: 'i/2fa/unregister' } as const).route({ method: 'POST', path: '/i/2fa/unregister', operationId: 'post___i___2fa___unregister', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData } }).input(objectInput({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
})).output(v.void());

export const I2faUpdateKeyContract = oc.$meta({ requestName: 'i/2fa/update-key' } as const).route({ method: 'POST', path: '/i/2fa/update-key', operationId: 'post___i___2fa___update-key', tags: [] }).errors({ ...commonErrors, 'NO_SUCH_KEY': { status: 400, data: apiErrorData }, 'ACCESS_DENIED': { status: 400, data: apiErrorData } }).input(objectInput({
	name: v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(30)),
	credentialId: v.string(),
})).output(v.intersect([v.strictObject({}), rawObjectInputGuard]));

export const IAppsContract = oc.$meta({ requestName: 'i/apps' } as const).route({ method: 'POST', path: '/i/apps', operationId: 'post___i___apps', tags: [] }).errors({ ...commonErrors }).input(objectInput({
	"sort": v.exactOptional(v.picklist(["+createdAt", "-createdAt", "+lastUsedAt", "-lastUsedAt"])),
})).output(v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"name": v.optional(v.string()),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"lastUsedAt": v.optional(v.pipe(v.string(), v.metadata({ "format": "date-time" }))),
		"permission": v.pipe(v.array(v.string()), v.metadata({ "uniqueItems": true })),
		"iconUrl": v.exactOptional(v.nullable(v.string())),
		"description": v.exactOptional(v.nullable(v.string())),
	})));

export const IAuthorizedAppsContract = oc.$meta({ requestName: 'i/authorized-apps' } as const).route({ method: 'POST', path: '/i/authorized-apps', operationId: 'post___i___authorized-apps', tags: [] }).errors({ ...commonErrors }).input(objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"sort": v.optional(v.picklist(["desc", "asc"]), "desc"),
})).output(v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"name": v.string(),
		"callbackUrl": v.nullable(v.string()),
		"permission": v.pipe(v.array(v.string()), v.metadata({ "uniqueItems": true })),
		"isAuthorized": v.exactOptional(v.boolean()),
	})));

export const IChangePasswordContract = oc.$meta({ requestName: 'i/change-password' } as const).route({ method: 'POST', path: '/i/change-password', operationId: 'post___i___change-password', tags: [] }).errors({ ...commonErrors }).input(objectInput({
	"currentPassword": v.string(),
	"newPassword": v.pipe(v.string(), v.minCodePoints(1)),
	"token": v.exactOptional(v.nullable(v.string())),
})).output(v.void());

export const IRegenerateTokenContract = oc.$meta({ requestName: 'i/regenerate-token' } as const).route({ method: 'POST', path: '/i/regenerate-token', operationId: 'post___i___regenerate-token', tags: [] }).errors({ ...commonErrors }).input(objectInput({
	"password": v.string(),
})).output(v.void());

export const IRevokeTokenContract = oc.$meta({ requestName: 'i/revoke-token' } as const).route({ method: 'POST', path: '/i/revoke-token', operationId: 'post___i___revoke-token', tags: [] }).errors({ ...commonErrors, 'CREDENTIAL_REQUIRED': { status: 401, data: apiErrorData }, 'PERMISSION_DENIED': { status: 403, data: apiErrorData } }).input(v.union([
	objectInput({
		tokenId: misskeyId,
		token: v.exactOptional(packedJsonValueSchema),
	}),
	objectInput({
		token: v.nullable(v.string()),
		tokenId: v.exactOptional(packedJsonValueSchema),
	}),
])).output(v.void());

export const ISigninHistoryContract = oc.$meta({ requestName: 'i/signin-history' } as const).route({ method: 'POST', path: '/i/signin-history', operationId: 'post___i___signin-history', tags: [] }).errors({ ...commonErrors }).input(objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(packedSigninSchema));

export const IUpdateEmailContract = oc.$meta({ requestName: 'i/update-email' } as const).route({ method: 'POST', path: '/i/update-email', operationId: 'post___i___update-email', tags: [] }).errors({ ...commonErrors, 'INCORRECT_PASSWORD': { status: 400, data: apiErrorData }, 'UNAVAILABLE': { status: 400, data: apiErrorData }, 'EMAIL_REQUIRED': { status: 400, data: apiErrorData } }).input(objectInput({
	"password": v.string(),
	"email": v.exactOptional(v.nullable(v.string())),
	"token": v.exactOptional(v.nullable(v.string())),
})).output(packedMeDetailedSchema);

export const InviteCreateContract = oc.$meta({ requestName: 'invite/create' } as const).route({ method: 'POST', path: '/invite/create', operationId: 'post___invite___create', tags: ['meta'] }).errors({ ...commonErrors, 'EXCEEDED_LIMIT_OF_CREATE_INVITE_CODE': { status: 400, data: apiErrorData } }).input(objectInput({})).output(packedInviteCodeSchema);

export const InviteDeleteContract = oc.$meta({ requestName: 'invite/delete' } as const).route({ method: 'POST', path: '/invite/delete', operationId: 'post___invite___delete', tags: ['meta'] }).errors({ ...commonErrors, 'NO_SUCH_INVITE_CODE': { status: 400, data: apiErrorData }, 'CAN_NOT_DELETE_INVITE_CODE': { status: 400, data: apiErrorData }, 'ACCESS_DENIED': { status: 400, data: apiErrorData } }).input(objectInput({
	"inviteId": misskeyId,
})).output(v.void());

export const InviteLimitContract = oc.$meta({ requestName: 'invite/limit' } as const).route({ method: 'POST', path: '/invite/limit', operationId: 'post___invite___limit', tags: ['meta'] }).errors({ ...commonErrors }).input(objectInput({})).output(v.strictObject({
	"remaining": v.nullable(v.pipe(v.number(), v.integer())),
}));

export const InviteListContract = oc.$meta({ requestName: 'invite/list' } as const).route({ method: 'POST', path: '/invite/list', operationId: 'post___invite___list', tags: ['meta'] }).errors({ ...commonErrors }).input(objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
})).output(v.array(packedInviteCodeSchema));

export const MiauthGenTokenContract = oc.$meta({ requestName: 'miauth/gen-token' } as const).route({ method: 'POST', path: '/miauth/gen-token', operationId: 'post___miauth___gen-token', tags: ['auth'] }).errors({ ...commonErrors }).input(objectInput({
	"session": v.nullable(v.string()),
	"name": v.exactOptional(v.nullable(v.string())),
	"description": v.exactOptional(v.nullable(v.string())),
	"iconUrl": v.exactOptional(v.nullable(v.string())),
	"permission": uniqueStringArray(v.string()),
})).output(v.strictObject({
	"token": v.string(),
}));

export const MyAppsContract = oc.$meta({ requestName: 'my/apps' } as const).route({ method: 'POST', path: '/my/apps', operationId: 'post___my___apps', tags: ['account', 'app'] }).errors({ ...commonErrors }).input(objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
})).output(v.array(packedAppSchema));

export const RequestResetPasswordContract = oc.$meta({ requestName: 'request-reset-password' } as const).route({ method: 'POST', path: '/request-reset-password', operationId: 'post___request-reset-password', tags: ['reset password'] }).errors({ ...commonErrors }).input(objectInput({
	"username": v.string(),
	"email": v.string(),
})).output(v.void());

export const ResetPasswordContract = oc.$meta({ requestName: 'reset-password' } as const).route({ method: 'POST', path: '/reset-password', operationId: 'post___reset-password', tags: ['reset password'] }).errors({ ...commonErrors }).input(objectInput({
	"token": v.string(),
	"password": v.string(),
})).output(v.void());

export const UsernameAvailableContract = oc.$meta({ requestName: 'username/available' } as const).route({ method: 'POST', path: '/username/available', operationId: 'post___username___available', tags: ['users'] }).errors({ ...commonErrors }).input(objectInput({
	"username": v.pipe(v.string(), v.regex(new RegExp("^\\w{1,20}$"))),
})).output(v.strictObject({
	"available": v.boolean(),
}));

export const VerifyEmailContract = oc.$meta({ requestName: 'verify-email' } as const).route({ method: 'POST', path: '/verify-email', operationId: 'post___verify-email', tags: ['account'] }).errors({ ...commonErrors, 'NO_SUCH_CODE': { status: 400, data: apiErrorData } }).input(objectInput({
	"code": v.string(),
})).output(v.void());

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

const httpErrors = { SESSION_HTTP_ERROR: { status: 400, data: fastifyFailureSchema }, INTERNAL_SERVER_ERROR: { status: 500, data: fastifyFailureSchema } };

export const authSessionsContract = {
	signup: oc.$meta({ requestName: 'signup' } as const).route({ method: 'POST', path: '/signup', tags: ['auth'], operationId: 'post___signup' }).errors(httpErrors).input(packedOptionalJsonValueSchema).output(v.union([v.strictObject({ ...packedMeDetailedSchema.entries, token: v.string() }), v.void()])),
	signupPending: oc.$meta({ requestName: 'signup-pending' } as const).route({ method: 'POST', path: '/signup-pending', tags: ['auth'], operationId: 'post___signup_pending' }).errors(httpErrors).input(packedOptionalJsonValueSchema).output(finishedSigninSchema),
	signinFlow: oc.$meta({ requestName: 'signin-flow' } as const).route({ method: 'POST', path: '/signin-flow', tags: ['auth'], operationId: 'post___signin_flow' }).errors(httpErrors).input(packedOptionalJsonValueSchema).output(v.union([v.union([
	finishedSigninSchema,
	v.strictObject({ finished: v.literal(false), next: v.picklist(['captcha', 'password', 'totp']) }),
	v.strictObject({ finished: v.literal(false), next: v.literal('passkey'), authRequest: webAuthnAuthenticationOptionsSchema }),
]), sessionFailureSchema, v.void()])),
	signinWithPasskey: oc.$meta({ requestName: 'signin-with-passkey' } as const).route({ method: 'POST', path: '/signin-with-passkey', tags: ['auth'], operationId: 'post___signin_with_passkey' }).errors(httpErrors).input(packedOptionalJsonValueSchema).output(v.union([
	v.strictObject({ option: webAuthnAuthenticationOptionsSchema, context: v.string() }),
	v.strictObject({ signinResponse: finishedSigninSchema }), sessionFailureSchema,
])),
};

export const sessionContract = { authSessions: authSessionsContract };

export type AuthSessionInputs = InferContractRouterInputs<typeof authSessionsContract>;

export type AuthSessionOutputs = InferContractRouterOutputs<typeof authSessionsContract>;
