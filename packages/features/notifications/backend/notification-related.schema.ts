/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedUserLiteSchema } from '../../users/backend/user.schema.js';
import { emptyRoleFormulaSchema } from '../../roles/backend/role.schema.js';
import { packedJsonValueSchema as jsonValueSchema, type PackedJsonValue } from '../../users/backend/json-value.schema.js';

export type PackedRolePolicyOverride = {
	value?: PackedJsonValue | undefined;
	priority?: number | undefined;
	useDefault?: boolean | undefined;
};
const rolePolicyOverridesSchema: v.GenericSchema<Record<string, PackedRolePolicyOverride>> = v.record(v.string(), v.strictObject({
	value: v.optional(jsonValueSchema),
	priority: v.optional(v.pipe(v.number(), v.finite(), v.integer())),
	useDefault: v.optional(v.boolean()),
}));

const roleDetailSchema = v.strictObject({
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'updatedAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'target': v.picklist(['manual', 'conditional']),
	'condFormula': v.union([v.lazy(() => packedRoleCondFormulaValueSchema), emptyRoleFormulaSchema]),
	'isPublic': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'isExplorable': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'asBadge': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'preserveAssignmentOnMoveAccount': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'canEditMembersByModerator': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'policies': rolePolicyOverridesSchema,
	'usersCount': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
});
export const packedRoleCondFormulaFollowersOrFollowingOrNotesSchema = v.strictObject({
	'id': v.string(),
	'type': v.picklist(['followersLessThanOrEq', 'followersMoreThanOrEq', 'followingLessThanOrEq', 'followingMoreThanOrEq', 'notesLessThanOrEq', 'notesMoreThanOrEq']),
	'value': v.pipe(v.number(), v.finite()),
});
const roleLogicBaseSchema = v.strictObject({
	'id': v.string(),
	'type': v.picklist(['and', 'or']),
});
export type PackedRoleLogic = v.InferOutput<typeof roleLogicBaseSchema> & { values: PackedRoleFormula[] };
export const packedRoleCondFormulaLogicsSchema: v.GenericSchema<PackedRoleLogic, PackedRoleLogic> = v.strictObject({
	...roleLogicBaseSchema.entries,
	'values': v.array(v.lazy(() => packedRoleCondFormulaValueSchema)),
});
export type PackedRoleFormula = PackedRoleLogic | PackedRoleNot | v.InferOutput<typeof packedRoleCondFormulaValueIsLocalOrRemoteSchema | typeof packedRoleCondFormulaValueUserSettingBooleanSchema | typeof packedRoleCondFormulaValueAssignedRoleSchema | typeof packedRoleCondFormulaValueCreatedSchema | typeof packedRoleCondFormulaFollowersOrFollowingOrNotesSchema>;
export const packedRoleCondFormulaValueSchema: v.GenericSchema<PackedRoleFormula, PackedRoleFormula> = v.union([v.lazy(() => packedRoleCondFormulaLogicsSchema), v.lazy(() => packedRoleCondFormulaValueNot), v.lazy(() => packedRoleCondFormulaValueIsLocalOrRemoteSchema), v.lazy(() => packedRoleCondFormulaValueUserSettingBooleanSchema), v.lazy(() => packedRoleCondFormulaValueAssignedRoleSchema), v.lazy(() => packedRoleCondFormulaValueCreatedSchema), v.lazy(() => packedRoleCondFormulaFollowersOrFollowingOrNotesSchema)]);
export const packedRoleCondFormulaValueAssignedRoleSchema = v.strictObject({
	'id': v.string(),
	'type': v.picklist(['roleAssignedTo']),
	'roleId': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
});
export const packedRoleCondFormulaValueCreatedSchema = v.strictObject({
	'id': v.string(),
	'type': v.picklist(['createdLessThan', 'createdMoreThan']),
	'sec': v.pipe(v.number(), v.finite()),
});
export const packedRoleCondFormulaValueIsLocalOrRemoteSchema = v.strictObject({
	'id': v.string(),
	'type': v.picklist(['isLocal', 'isRemote']),
});
const roleNotBaseSchema = v.strictObject({
	'id': v.string(),
	'type': v.picklist(['not']),
});
export type PackedRoleNot = v.InferOutput<typeof roleNotBaseSchema> & { value: PackedRoleFormula };
export const packedRoleCondFormulaValueNot: v.GenericSchema<PackedRoleNot, PackedRoleNot> = v.strictObject({
	...roleNotBaseSchema.entries,
	'value': v.lazy(() => packedRoleCondFormulaValueSchema),
});
export const packedRoleCondFormulaValueUserSettingBooleanSchema = v.strictObject({
	'id': v.string(),
	'type': v.picklist(['isSuspended', 'isLocked', 'isBot', 'isCat', 'isExplorable']),
});
export const packedRoleLiteSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'name': v.pipe(v.string(), v.metadata({ 'example': 'New Role' })),
	'color': v.pipe(v.nullable(v.string()), v.metadata({ 'example': '#000000' })),
	'iconUrl': v.nullable(v.string()),
	'description': v.string(),
	'isModerator': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'isAdministrator': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'displayOrder': v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.metadata({ 'example': 0 })),
});
export const packedRolePoliciesSchema = v.strictObject({
	'gtlAvailable': v.boolean(),
	'ltlAvailable': v.boolean(),
	'canPublicNote': v.boolean(),
	'mentionLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'canInvite': v.boolean(),
	'inviteLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'inviteLimitCycle': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'inviteExpirationTime': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'canManageCustomEmojis': v.boolean(),
	'canManageAvatarDecorations': v.boolean(),
	'canSearchNotes': v.boolean(),
	'canSearchUsers': v.boolean(),
	'canUseTranslator': v.boolean(),
	'canHideAds': v.boolean(),
	'canCreateChannel': v.boolean(),
	'driveCapacityMb': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'maxFileSizeMb': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'uploadableFileTypes': v.array(v.string()),
	'alwaysMarkNsfw': v.boolean(),
	'canUpdateBioMedia': v.boolean(),
	'pinLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'antennaLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'wordMuteLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'webhookLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'clipLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'noteEachClipsLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'userListLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'userEachUserListsLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'rateLimitFactor': v.pipe(v.number(), v.finite()),
	'avatarDecorationLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'canImportAntennas': v.boolean(),
	'canImportBlocking': v.boolean(),
	'canImportFollowing': v.boolean(),
	'canImportMuting': v.boolean(),
	'canImportUserLists': v.boolean(),
	'chatAvailability': v.picklist(['available', 'readonly', 'unavailable']),
	'noteDraftLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'scheduledNoteLimit': v.pipe(v.pipe(v.number(), v.finite()), v.integer()),
	'watermarkAvailable': v.boolean(),
});

// Compose the complete finite envelope before closing it; stored formula variants retain their explicit legacy boundary.
export const packedRoleSchema = v.strictObject({ ...packedRoleLiteSchema.entries, ...roleDetailSchema.entries });

export const packedChatRoomSchema = v.strictObject({
	'id': v.string(),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'ownerId': v.string(),
	'owner': v.lazy(() => packedUserLiteSchema),
	'name': v.string(),
	'description': v.string(),
	'isMuted': v.optional(v.boolean()),
	'invitationExists': v.optional(v.boolean()),
});
export const packedChatRoomInvitationSchema = v.strictObject({
	'id': v.string(),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'userId': v.string(),
	'user': v.lazy(() => packedUserLiteSchema),
	'roomId': v.string(),
	'room': v.lazy(() => packedChatRoomSchema),
});
