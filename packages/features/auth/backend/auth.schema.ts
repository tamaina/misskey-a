/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedJsonObjectSchema, toPackedJsonObject } from '../../users/backend/json-value.schema.js';
import { packedUserLiteSchema, toPackedUserLite } from '../../users/backend/user.schema.js';
export const supportedCaptchaProviders = ['none', 'hcaptcha', 'mcaptcha', 'recaptcha', 'turnstile', 'testcaptcha'] as const;
export const packedAppSchema = v.strictObject({ id: v.string(), name: v.string(), callbackUrl: v.nullable(v.string()), permission: v.array(v.string()), secret: v.optional(v.string()), isAuthorized: v.optional(v.boolean()) });
export const packedInviteCodeSchema = v.strictObject({ id: v.string(), code: v.string(), expiresAt: v.nullable(v.string()), createdAt: v.string(), createdBy: v.nullable(packedUserLiteSchema), usedBy: v.nullable(packedUserLiteSchema), usedAt: v.nullable(v.string()), used: v.boolean() });
// Sign-in headers are persisted jsonb business data, including nonstandard header names.
export const packedSigninSchema = v.strictObject({ id: v.string(), createdAt: v.string(), ip: v.string(), headers: packedJsonObjectSchema, success: v.boolean() });

export type PackedApp = v.InferOutput<typeof packedAppSchema>;
export function toPackedApp(app: PackedApp, includeSecret = false): PackedApp {
	return { id: app.id, name: app.name, callbackUrl: app.callbackUrl, permission: [...app.permission],
		...(includeSecret && app.secret !== undefined ? { secret: app.secret } : {}),
		...(app.isAuthorized === undefined ? {} : { isAuthorized: app.isAuthorized }) };
}
export function toPackedInviteCode(code: v.InferOutput<typeof packedInviteCodeSchema>): v.InferOutput<typeof packedInviteCodeSchema> {
	return { id: code.id, code: code.code, expiresAt: code.expiresAt, createdAt: code.createdAt,
		createdBy: code.createdBy === null ? null : toPackedUserLite(code.createdBy),
		usedBy: code.usedBy === null ? null : toPackedUserLite(code.usedBy), usedAt: code.usedAt, used: code.used };
}
export function toPackedSignin(signin: v.InferOutput<typeof packedSigninSchema>): v.InferOutput<typeof packedSigninSchema> {
	return { id: signin.id, createdAt: signin.createdAt, ip: signin.ip, headers: toPackedJsonObject(signin.headers), success: signin.success };
}
