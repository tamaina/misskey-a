/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const packedAnnouncementSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"updatedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"text": v.string(),
	"title": v.string(),
	"imageUrl": v.nullable(v.string()),
	"icon": v.picklist(["info", "warning", "error", "success"]),
	"display": v.picklist(["dialog", "normal", "banner"]),
	"needConfirmationToRead": v.boolean(),
	"silence": v.boolean(),
	"forYou": v.boolean(),
	"isRead": v.optional(v.boolean())
});

export const packedRoleLiteSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"name": v.pipe(v.string(), v.metadata({ "example": "New Role" })),
	"color": v.pipe(v.nullable(v.string()), v.metadata({ "example": "#000000" })),
	"iconUrl": v.nullable(v.string()),
	"description": v.string(),
	"isModerator": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"isAdministrator": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"displayOrder": v.pipe(v.pipe(v.number(), v.integer()), v.metadata({ "example": 0 }))
});
export const packedRolePoliciesSchema = v.strictObject({
	"gtlAvailable": v.boolean(),
	"ltlAvailable": v.boolean(),
	"canPublicNote": v.boolean(),
	"mentionLimit": v.pipe(v.number(), v.integer()),
	"canInvite": v.boolean(),
	"inviteLimit": v.pipe(v.number(), v.integer()),
	"inviteLimitCycle": v.pipe(v.number(), v.integer()),
	"inviteExpirationTime": v.pipe(v.number(), v.integer()),
	"canManageCustomEmojis": v.boolean(),
	"canManageAvatarDecorations": v.boolean(),
	"canSearchNotes": v.boolean(),
	"canSearchUsers": v.boolean(),
	"canUseTranslator": v.boolean(),
	"canHideAds": v.boolean(),
	"canCreateChannel": v.boolean(),
	"driveCapacityMb": v.pipe(v.number(), v.integer()),
	"maxFileSizeMb": v.pipe(v.number(), v.integer()),
	"uploadableFileTypes": v.array(v.string()),
	"alwaysMarkNsfw": v.boolean(),
	"canUpdateBioMedia": v.boolean(),
	"pinLimit": v.pipe(v.number(), v.integer()),
	"antennaLimit": v.pipe(v.number(), v.integer()),
	"wordMuteLimit": v.pipe(v.number(), v.integer()),
	"webhookLimit": v.pipe(v.number(), v.integer()),
	"clipLimit": v.pipe(v.number(), v.integer()),
	"noteEachClipsLimit": v.pipe(v.number(), v.integer()),
	"userListLimit": v.pipe(v.number(), v.integer()),
	"userEachUserListsLimit": v.pipe(v.number(), v.integer()),
	"rateLimitFactor": v.number(),
	"avatarDecorationLimit": v.pipe(v.number(), v.integer()),
	"canImportAntennas": v.boolean(),
	"canImportBlocking": v.boolean(),
	"canImportFollowing": v.boolean(),
	"canImportMuting": v.boolean(),
	"canImportUserLists": v.boolean(),
	"chatAvailability": v.picklist(["available", "readonly", "unavailable"]),
	"noteDraftLimit": v.pipe(v.number(), v.integer()),
	"scheduledNoteLimit": v.pipe(v.number(), v.integer()),
	"watermarkAvailable": v.boolean()
});

