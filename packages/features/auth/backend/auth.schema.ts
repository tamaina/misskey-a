/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput, rawObjectInputGuard } from '../../api/backend/transport/input.schema.js';
import { packedJsonValueSchema, packedJsonObjectSchema, packedOptionalJsonValueSchema, type PackedJsonValue } from '../../users/backend/json-value.schema.js';
import { packedUserLiteSchema, packedMeDetailedSchema, packedUserDetailedNotMeSchema } from '../../users/backend/user.schema.js';
import { localUsernameSchema, passwordSchema } from '../../users/backend/user-validation.schema.js';
import { webAuthnRegistrationOptionsSchema } from './webauthn.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
const uniqueStringArray = (item: v.GenericSchema<string, string>) => v.pipe(v.array(item), v.check(values => new Set(values).size === values.length, 'Expected unique strings'));
export const supportedCaptchaProviders = ['none', 'hcaptcha', 'mcaptcha', 'recaptcha', 'turnstile', 'testcaptcha'] as const;
export const packedAppSchema = v.strictObject({ id: v.string(), name: v.string(), callbackUrl: v.nullable(v.string()), permission: v.array(v.string()), secret: v.optional(v.string()), isAuthorized: v.optional(v.boolean()) });
export const packedInviteCodeSchema = v.strictObject({ id: v.string(), code: v.string(), expiresAt: v.nullable(v.string()), createdAt: v.string(), createdBy: v.nullable(packedUserLiteSchema), usedBy: v.nullable(packedUserLiteSchema), usedAt: v.nullable(v.string()), used: v.boolean() });
// Sign-in headers are persisted jsonb business data, including nonstandard header names.
export const packedSigninSchema = v.strictObject({ id: v.string(), createdAt: v.string(), ip: v.string(), headers: packedJsonObjectSchema, success: v.boolean() });

export const compositionAdminAccountsCreateInput = objectInput({
	username: localUsernameSchema,
	password: passwordSchema,
	setupPassword: v.exactOptional(v.nullable(v.string())),
});

export const compositionAdminAccountsCreateOutput = v.strictObject({ ...packedMeDetailedSchema.entries, token: v.string() });

export const emptyAdminCaptchaCurrentInput = packedOptionalJsonValueSchema;

export const emptyAdminCaptchaCurrentOutput = v.strictObject({
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
});

export const portableAdminCaptchaSaveInput = objectInput({
	"provider": v.picklist(supportedCaptchaProviders),
	"captchaResult": v.exactOptional(v.nullable(v.string())),
	"sitekey": v.exactOptional(v.nullable(v.string())),
	"secret": v.exactOptional(v.nullable(v.string())),
	"instanceUrl": v.exactOptional(v.nullable(v.string())),
});

export const portableAdminCaptchaSaveOutput = v.void();

export const packedAdminInviteCreateInput = objectInput({
	"count": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 1),
	"expiresAt": v.exactOptional(v.nullable(v.string())),
});

export const packedAdminInviteCreateOutput = v.array(packedInviteCodeSchema);

export const packedAdminInviteListInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"type": v.optional(v.picklist(["unused", "used", "expired", "all"]), "all"),
	"sort": v.exactOptional(v.picklist(["+createdAt", "-createdAt", "+usedAt", "-usedAt"])),
});

export const packedAdminInviteListOutput = v.array(packedInviteCodeSchema);

export const inlineAdminResetPasswordInput = objectInput({
	"userId": misskeyId,
});

export const inlineAdminResetPasswordOutput = v.strictObject({
	"password": v.pipe(v.string(), v.metadata({ "minLength": 8, "maxLength": 8 })),
});

export const voidAdminUnsetMfaInput = objectInput({
	"userId": misskeyId,
});

export const voidAdminUnsetMfaOutput = v.void();

export const uniqueAppCreateInput = objectInput({
	"name": v.string(),
	"description": v.string(),
	"permission": uniqueStringArray(v.string()),
	"callbackUrl": v.exactOptional(v.nullable(v.string())),
});

export const uniqueAppCreateOutput = packedAppSchema;

export const packedAppShowInput = objectInput({
	"appId": misskeyId,
});

export const packedAppShowOutput = packedAppSchema;

export const voidAuthAcceptInput = objectInput({
	"token": v.string(),
});

export const voidAuthAcceptOutput = v.void();

export const inlineAuthSessionGenerateInput = objectInput({
	"appSecret": v.string(),
});

export const inlineAuthSessionGenerateOutput = v.strictObject({
	"token": v.string(),
	"url": v.pipe(v.string(), v.metadata({ "format": "url" })),
});

export const packedAuthSessionShowInput = objectInput({
	"token": v.string(),
});

export const packedAuthSessionShowOutput = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"app": packedAppSchema,
	"token": v.string(),
});

export const packedAuthSessionUserkeyInput = objectInput({
	"appSecret": v.string(),
	"token": v.string(),
});

export const packedAuthSessionUserkeyOutput = v.strictObject({
	"accessToken": v.string(),
	"user": packedUserDetailedNotMeSchema,
});

export const inlineEmailAddressAvailableInput = objectInput({
	"emailAddress": v.string(),
});

export const inlineEmailAddressAvailableOutput = v.strictObject({
	"available": v.boolean(),
	"reason": v.nullable(v.string()),
});

export const inlineI2faDoneInput = objectInput({
	"token": v.string(),
});

export const inlineI2faDoneOutput = v.strictObject({
	"backupCodes": v.array(v.string()),
});

export const inlineI2faKeyDoneInput = objectInput({
	password: v.string(),
	token: v.optional(v.nullable(v.string())),
	name: v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(30)),
	credential: packedJsonValueSchema,
});

export const inlineI2faKeyDoneOutput = v.strictObject({ id: v.string(), name: v.string() });

export const voidI2faPasswordLessInput = objectInput({
	"value": v.boolean(),
});

export const voidI2faPasswordLessOutput = v.void();

export const inlineI2faRegisterInput = objectInput({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
});

export const inlineI2faRegisterOutput = v.strictObject({
	"qr": v.string(),
	"url": v.string(),
	"secret": v.string(),
	"label": v.string(),
	"issuer": v.string(),
});

export const inlineI2faRegisterKeyInput = objectInput({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
});

export const inlineI2faRegisterKeyOutput = webAuthnRegistrationOptionsSchema;

export const emptyObjectI2faRemoveKeyInput = objectInput({
	password: v.string(),
	token: v.optional(v.nullable(v.string())),
	credentialId: v.string(),
});

export const emptyObjectI2faRemoveKeyOutput = v.intersect([v.strictObject({}), rawObjectInputGuard]);

export const voidI2faUnregisterInput = objectInput({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
});

export const voidI2faUnregisterOutput = v.void();

export const emptyObjectI2faUpdateKeyInput = objectInput({
	name: v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(30)),
	credentialId: v.string(),
});

export const emptyObjectI2faUpdateKeyOutput = v.intersect([v.strictObject({}), rawObjectInputGuard]);

export const inlineIAppsInput = objectInput({
	"sort": v.exactOptional(v.picklist(["+createdAt", "-createdAt", "+lastUsedAt", "-lastUsedAt"])),
});

export const inlineIAppsOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"name": v.optional(v.string()),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"lastUsedAt": v.optional(v.pipe(v.string(), v.metadata({ "format": "date-time" }))),
		"permission": v.pipe(v.array(v.string()), v.metadata({ "uniqueItems": true })),
		"iconUrl": v.exactOptional(v.nullable(v.string())),
		"description": v.exactOptional(v.nullable(v.string())),
	}));

export const inlineIAuthorizedAppsInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"sort": v.optional(v.picklist(["desc", "asc"]), "desc"),
});

export const inlineIAuthorizedAppsOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"name": v.string(),
		"callbackUrl": v.nullable(v.string()),
		"permission": v.pipe(v.array(v.string()), v.metadata({ "uniqueItems": true })),
		"isAuthorized": v.exactOptional(v.boolean()),
	}));

export const voidIChangePasswordInput = objectInput({
	"currentPassword": v.string(),
	"newPassword": v.pipe(v.string(), v.minCodePoints(1)),
	"token": v.exactOptional(v.nullable(v.string())),
});

export const voidIChangePasswordOutput = v.void();

export const voidIRegenerateTokenInput = objectInput({
	"password": v.string(),
});

export const voidIRegenerateTokenOutput = v.void();

/** At least one valid selector is required; the inactive field remains genuine JSON. */
export type AuthTokenSelector =
	| { tokenId: string; token?: PackedJsonValue }
	| { token: string | null; tokenId?: PackedJsonValue };
export const selectorIRevokeTokenInput: v.GenericSchema<AuthTokenSelector, AuthTokenSelector> = v.union([
	objectInput({
		tokenId: misskeyId,
		token: v.exactOptional(packedJsonValueSchema),
	}),
	objectInput({
		token: v.nullable(v.string()),
		tokenId: v.exactOptional(packedJsonValueSchema),
	}),
]);

export const selectorIRevokeTokenOutput = v.void();

export const packedISigninHistoryInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const packedISigninHistoryOutput = v.array(packedSigninSchema);

export const packedIUpdateEmailInput = objectInput({
	"password": v.string(),
	"email": v.exactOptional(v.nullable(v.string())),
	"token": v.exactOptional(v.nullable(v.string())),
});

export const packedIUpdateEmailOutput = packedMeDetailedSchema;

export const packedInviteCreateInput = objectInput({});

export const packedInviteCreateOutput = packedInviteCodeSchema;

export const voidInviteDeleteInput = objectInput({
	"inviteId": misskeyId,
});

export const voidInviteDeleteOutput = v.void();

export const inlineInviteLimitInput = objectInput({});

export const inlineInviteLimitOutput = v.strictObject({
	"remaining": v.nullable(v.pipe(v.number(), v.integer())),
});

export const packedInviteListInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const packedInviteListOutput = v.array(packedInviteCodeSchema);

export const uniqueMiauthGenTokenInput = objectInput({
	"session": v.nullable(v.string()),
	"name": v.exactOptional(v.nullable(v.string())),
	"description": v.exactOptional(v.nullable(v.string())),
	"iconUrl": v.exactOptional(v.nullable(v.string())),
	"permission": uniqueStringArray(v.string()),
});

export const uniqueMiauthGenTokenOutput = v.strictObject({
	"token": v.string(),
});

export const packedMyAppsInput = objectInput({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
});

export const packedMyAppsOutput = v.array(packedAppSchema);

export const voidRequestResetPasswordInput = objectInput({
	"username": v.string(),
	"email": v.string(),
});

export const voidRequestResetPasswordOutput = v.void();

export const voidResetPasswordInput = objectInput({
	"token": v.string(),
	"password": v.string(),
});

export const voidResetPasswordOutput = v.void();

export const remainingUsernameAvailableInput = objectInput({
	"username": v.pipe(v.string(), v.regex(new RegExp("^\\w{1,20}$"))),
});

export const remainingUsernameAvailableOutput = v.strictObject({
	"available": v.boolean(),
});

export const voidVerifyEmailInput = objectInput({
	"code": v.string(),
});

export const voidVerifyEmailOutput = v.void();
