/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedJsonObjectSchema } from '../../users/backend/json-value.schema.js';
import { packedUserLiteSchema } from '../../users/backend/user.schema.js';
export const supportedCaptchaProviders = ['none', 'hcaptcha', 'mcaptcha', 'recaptcha', 'turnstile', 'testcaptcha'] as const;
export const packedAppSchema = v.strictObject({ id: v.string(), name: v.string(), callbackUrl: v.nullable(v.string()), permission: v.array(v.string()), secret: v.optional(v.string()), isAuthorized: v.optional(v.boolean()) });
export const packedInviteCodeSchema = v.strictObject({ id: v.string(), code: v.string(), expiresAt: v.nullable(v.string()), createdAt: v.string(), createdBy: v.nullable(packedUserLiteSchema), usedBy: v.nullable(packedUserLiteSchema), usedAt: v.nullable(v.string()), used: v.boolean() });
// Sign-in headers are persisted jsonb business data, including nonstandard header names.
export const packedSigninSchema = v.strictObject({ id: v.string(), createdAt: v.string(), ip: v.string(), headers: packedJsonObjectSchema, success: v.boolean() });
