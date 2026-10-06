/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';

export const packedRoleSchema = v.intersect([v.lazy(() => packedRoleLiteSchema), resultObject({
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"updatedAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"target": v.picklist(["manual", "conditional"]),
	"condFormula": v.lazy(() => packedRoleCondFormulaValueSchema),
	"isPublic": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"isExplorable": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"asBadge": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"preserveAssignmentOnMoveAccount": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"canEditMembersByModerator": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"policies": v.record(v.string(), v.union([resultObject({
	"value": v.optional(v.union([v.pipe(v.number(), v.integer()), v.boolean()])),
	"priority": v.optional(v.pipe(v.number(), v.integer())),
	"useDefault": v.optional(v.boolean())
})])),
	"usersCount": v.pipe(v.number(), v.integer())
})]);
export const packedRoleCondFormulaFollowersOrFollowingOrNotesSchema = resultObject({
	"id": v.string(),
	"type": v.picklist(["followersLessThanOrEq", "followersMoreThanOrEq", "followingLessThanOrEq", "followingMoreThanOrEq", "notesLessThanOrEq", "notesMoreThanOrEq"]),
	"value": v.number()
});
const roleLogicBaseSchema = resultObject({
"id": v.string(),
"type": v.picklist(["and", "or"])
});
export type PackedRoleLogic = v.InferOutput<typeof roleLogicBaseSchema> & { values: PackedRoleFormula[] };
export const packedRoleCondFormulaLogicsSchema: v.GenericSchema<PackedRoleLogic, PackedRoleLogic> = resultObject({
...roleLogicBaseSchema.entries,
"values": v.array(v.lazy(() => packedRoleCondFormulaValueSchema))
});
export type PackedRoleFormula = PackedRoleLogic | PackedRoleNot | v.InferOutput<typeof packedRoleCondFormulaValueIsLocalOrRemoteSchema | typeof packedRoleCondFormulaValueUserSettingBooleanSchema | typeof packedRoleCondFormulaValueAssignedRoleSchema | typeof packedRoleCondFormulaValueCreatedSchema | typeof packedRoleCondFormulaFollowersOrFollowingOrNotesSchema>;
export const packedRoleCondFormulaValueSchema: v.GenericSchema<PackedRoleFormula, PackedRoleFormula> = v.union([v.lazy(() => packedRoleCondFormulaLogicsSchema), v.lazy(() => packedRoleCondFormulaValueNot), v.lazy(() => packedRoleCondFormulaValueIsLocalOrRemoteSchema), v.lazy(() => packedRoleCondFormulaValueUserSettingBooleanSchema), v.lazy(() => packedRoleCondFormulaValueAssignedRoleSchema), v.lazy(() => packedRoleCondFormulaValueCreatedSchema), v.lazy(() => packedRoleCondFormulaFollowersOrFollowingOrNotesSchema)]);
export const packedRoleCondFormulaValueAssignedRoleSchema = resultObject({
	"id": v.string(),
	"type": v.picklist(["roleAssignedTo"]),
	"roleId": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" }))
});
export const packedRoleCondFormulaValueCreatedSchema = resultObject({
	"id": v.string(),
	"type": v.picklist(["createdLessThan", "createdMoreThan"]),
	"sec": v.number()
});
export const packedRoleCondFormulaValueIsLocalOrRemoteSchema = resultObject({
	"id": v.string(),
	"type": v.picklist(["isLocal", "isRemote"])
});
const roleNotBaseSchema = resultObject({
"id": v.string(),
"type": v.picklist(["not"])
});
export type PackedRoleNot = v.InferOutput<typeof roleNotBaseSchema> & { value: PackedRoleFormula };
export const packedRoleCondFormulaValueNot: v.GenericSchema<PackedRoleNot, PackedRoleNot> = resultObject({
...roleNotBaseSchema.entries,
"value": v.lazy(() => packedRoleCondFormulaValueSchema)
});
export const packedRoleCondFormulaValueUserSettingBooleanSchema = resultObject({
	"id": v.string(),
	"type": v.picklist(["isSuspended", "isLocked", "isBot", "isCat", "isExplorable"])
});
export const packedRoleLiteSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"name": v.pipe(v.string(), v.metadata({ "example": "New Role" })),
	"color": v.pipe(v.nullable(v.string()), v.metadata({ "example": "#000000" })),
	"iconUrl": v.nullable(v.string()),
	"description": v.string(),
	"isModerator": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"isAdministrator": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"displayOrder": v.pipe(v.pipe(v.number(), v.integer()), v.metadata({ "example": 0 }))
});
export const packedRolePoliciesSchema = resultObject({
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
	"rateLimitFactor": v.pipe(v.number(), v.integer()),
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
