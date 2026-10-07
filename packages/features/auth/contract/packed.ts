/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import {
	packedUserLiteSchema as __ref_UserLite
} from '../../users/contract/packed.js';

export const packedAppSchema = v.strictObject({
	"id": v.string(),
	"name": v.string(),
	"callbackUrl": v.nullable(v.string()),
	"permission": v.array(v.string()),
	"secret": v.optional(v.string()),
	"isAuthorized": v.optional(v.boolean())
});
export const packedInviteCodeSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"code": v.pipe(v.string(), v.metadata({ "example": "GR6S02ERUA5VR" })),
	"expiresAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"createdBy": v.nullable(v.lazy(() => __ref_UserLite)),
	"usedBy": v.nullable(v.lazy(() => __ref_UserLite)),
	"usedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"used": v.boolean()
});
export const packedSigninSchema = v.strictObject({
	"id": v.string(),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"ip": v.string(),
	"headers": resultObject({}),
	"success": v.boolean()
});
