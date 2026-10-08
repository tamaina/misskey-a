/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { jsonObjectWithRest } from '../../api/contract/json-object.js';
import { jsonValueSchema } from '../../api/contract/json-value.js';
import {
	packedRolePoliciesSchema as __ref_RolePolicies
} from '../../roles/contract/packed.js';

export const packedAdSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"expiresAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"startsAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"place": v.string(),
	"priority": v.string(),
	"ratio": v.number(),
	"url": v.string(),
	"imageUrl": v.string(),
	"memo": v.string(),
	"dayOfWeek": v.pipe(v.number(), v.integer()),
	"isSensitive": v.boolean()
});
// admin/update-meta persists all clientOptions keys and serializers return them verbatim.
export const packedMetaClientOptionsSchema = jsonObjectWithRest({
	"entrancePageStyle": v.picklist(["classic", "simple"]),
	"showTimelineForVisitor": v.boolean(),
	"showActivitiesForVisitor": v.boolean()
}, jsonValueSchema);
export const packedMetaDetailedOnlySchema = v.strictObject({
	"features": v.optional(v.strictObject({
	"registration": v.boolean(),
	"emailRequiredForSignup": v.boolean(),
	"localTimeline": v.boolean(),
	"globalTimeline": v.boolean(),
	"hcaptcha": v.boolean(),
	"turnstile": v.boolean(),
	"recaptcha": v.boolean(),
	"objectStorage": v.boolean(),
	"serviceWorker": v.boolean(),
	"miauth": v.optional(v.pipe(v.boolean(), v.metadata({ "default": true })))
})),
	"proxyAccountName": v.nullable(v.string()),
	"requireSetup": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"cacheRemoteFiles": v.boolean(),
	"cacheRemoteSensitiveFiles": v.boolean()
});
export const packedMetaLiteSchema = v.strictObject({
	"maintainerName": v.nullable(v.string()),
	"maintainerEmail": v.nullable(v.string()),
	"version": v.string(),
	"providesTarball": v.boolean(),
	"name": v.nullable(v.string()),
	"shortName": v.nullable(v.string()),
	"uri": v.pipe(v.string(), v.metadata({ "format": "url", "example": "https://misskey.example.com" })),
	"description": v.nullable(v.string()),
	"langs": v.array(v.string()),
	"tosUrl": v.nullable(v.string()),
	"repositoryUrl": v.pipe(v.nullable(v.string()), v.metadata({ "default": "https://github.com/misskey-dev/misskey" })),
	"feedbackUrl": v.pipe(v.nullable(v.string()), v.metadata({ "default": "https://github.com/misskey-dev/misskey/issues/new" })),
	"defaultDarkTheme": v.nullable(v.string()),
	"defaultLightTheme": v.nullable(v.string()),
	"clientOptions": v.lazy(() => packedMetaClientOptionsSchema),
	"disableRegistration": v.boolean(),
	"emailRequiredForSignup": v.boolean(),
	"enableHcaptcha": v.boolean(),
	"hcaptchaSiteKey": v.nullable(v.string()),
	"enableMcaptcha": v.boolean(),
	"mcaptchaSiteKey": v.nullable(v.string()),
	"mcaptchaInstanceUrl": v.nullable(v.string()),
	"enableRecaptcha": v.boolean(),
	"recaptchaSiteKey": v.nullable(v.string()),
	"enableTurnstile": v.boolean(),
	"turnstileSiteKey": v.nullable(v.string()),
	"enableTestcaptcha": v.boolean(),
	"googleAnalyticsMeasurementId": v.nullable(v.string()),
	"swPublickey": v.nullable(v.string()),
	"mascotImageUrl": v.pipe(v.string(), v.metadata({ "default": "/assets/ai.png" })),
	"bannerUrl": v.nullable(v.string()),
	"serverErrorImageUrl": v.nullable(v.string()),
	"infoImageUrl": v.nullable(v.string()),
	"notFoundImageUrl": v.nullable(v.string()),
	"iconUrl": v.nullable(v.string()),
	"maxNoteTextLength": v.number(),
	"ads": v.array(v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"url": v.pipe(v.string(), v.metadata({ "format": "url" })),
	"place": v.string(),
	"ratio": v.number(),
	"imageUrl": v.pipe(v.string(), v.metadata({ "format": "url" })),
	"dayOfWeek": v.pipe(v.number(), v.integer()),
	"isSensitive": v.optional(v.boolean())
})),
	"notesPerOneAd": v.pipe(v.number(), v.metadata({ "default": 0 })),
	"enableEmail": v.boolean(),
	"enableServiceWorker": v.boolean(),
	"translatorAvailable": v.boolean(),
	// These configured extension objects are delivered as JSON, not executable SDK options.
	"sentryForFrontend": v.nullable(v.strictObject({
		"options": jsonObjectWithRest({ "dsn": v.string() }, jsonValueSchema),
		"vueIntegration": v.optional(v.nullable(jsonObjectWithRest({}, jsonValueSchema))),
		"browserTracingIntegration": v.optional(v.nullable(jsonObjectWithRest({}, jsonValueSchema))),
		"replayIntegration": v.optional(v.nullable(jsonObjectWithRest({}, jsonValueSchema))),
	})),
	"mediaProxy": v.string(),
	"enableUrlPreview": v.boolean(),
	"backgroundImageUrl": v.nullable(v.string()),
	"impressumUrl": v.nullable(v.string()),
	"logoImageUrl": v.nullable(v.string()),
	"privacyPolicyUrl": v.nullable(v.string()),
	"inquiryUrl": v.nullable(v.string()),
	"serverRules": v.array(v.string()),
	"themeColor": v.nullable(v.string()),
	"policies": v.lazy(() => __ref_RolePolicies),
	"noteSearchableScope": v.pipe(v.picklist(["local", "global"]), v.metadata({ "default": "local" })),
	"maxFileSize": v.number(),
	"federation": v.picklist(["all", "specified", "none"])
});

// Flatten public entries: strict intersection sides would reject each other's finite fields.
export const packedMetaDetailedSchema = v.strictObject({
	...packedMetaLiteSchema.entries,
	...packedMetaDetailedOnlySchema.entries,
});
