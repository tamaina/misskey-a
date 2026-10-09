/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const finiteNumber = v.pipe(v.number(), v.finite());

export const federationInstanceSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"firstRetrievedAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"host": v.pipe(v.string(), v.metadata({ "example": "misskey.example.com" })),
	"usersCount": finiteNumber,
	"notesCount": finiteNumber,
	"followingCount": finiteNumber,
	"followersCount": finiteNumber,
	"isNotResponding": v.boolean(),
	"isSuspended": v.boolean(),
	"suspensionState": v.picklist(["none", "manuallySuspended", "goneSuspended", "autoSuspendedForNotResponding", "softwareSuspended"]),
	"isBlocked": v.boolean(),
	"softwareName": v.pipe(v.nullable(v.string()), v.metadata({ "example": "misskey" })),
	"softwareVersion": v.nullable(v.string()),
	"openRegistrations": v.pipe(v.nullable(v.boolean()), v.metadata({ "example": true })),
	"name": v.nullable(v.string()),
	"description": v.nullable(v.string()),
	"maintainerName": v.nullable(v.string()),
	"maintainerEmail": v.nullable(v.string()),
	"isSilenced": v.boolean(),
	"isMediaSilenced": v.boolean(),
	"iconUrl": v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	"faviconUrl": v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	"themeColor": v.nullable(v.string()),
	"infoUpdatedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"latestRequestReceivedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"moderationNote": v.optional(v.nullable(v.string()))
});
