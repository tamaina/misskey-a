/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { toPackedRecord } from './json-value.schema.js';
import { packedNoteSchema as __ref_Note, } from '../../notes/backend/note.schema.js';
import { toPackedNote } from '../../notes/backend/note.schema.js';
import { notificationSettings, toPackedNotificationSettings } from './notification-settings.schema.js';
import { packedAnnouncementSchema as __ref_Announcement, } from './user-related.schema.js';
import { packedPageSchema as __ref_Page, toPackedPage, type PageWireInput } from './page.schema.js';
import { packedRoleLiteSchema as __ref_RoleLite, packedRolePoliciesSchema as __ref_RolePolicies, } from './user-related.schema.js';
export const packedAchievementNameSchema = v.picklist(['notes1', 'notes10', 'notes100', 'notes500', 'notes1000', 'notes5000', 'notes10000', 'notes20000', 'notes30000', 'notes40000', 'notes50000', 'notes60000', 'notes70000', 'notes80000', 'notes90000', 'notes100000', 'login3', 'login7', 'login15', 'login30', 'login60', 'login100', 'login200', 'login300', 'login400', 'login500', 'login600', 'login700', 'login800', 'login900', 'login1000', 'passedSinceAccountCreated1', 'passedSinceAccountCreated2', 'passedSinceAccountCreated3', 'loggedInOnBirthday', 'loggedInOnNewYearsDay', 'noteClipped1', 'noteFavorited1', 'myNoteFavorited1', 'profileFilled', 'markedAsCat', 'following1', 'following10', 'following50', 'following100', 'following300', 'followers1', 'followers10', 'followers50', 'followers100', 'followers300', 'followers500', 'followers1000', 'collectAchievements30', 'viewAchievements3min', 'iLoveMisskey', 'foundTreasure', 'client30min', 'client60min', 'noteDeletedWithin1min', 'postedAtLateNight', 'postedAt0min0sec', 'selfQuote', 'htl20npm', 'viewInstanceChart', 'outputHelloWorldOnScratchpad', 'open3windows', 'driveFolderCircularReference', 'reactWithoutRead', 'clickedClickHere', 'justPlainLucky', 'setNameToSyuilo', 'cookieClicked', 'brainDiver', 'smashTestNotificationButton', 'tutorialCompleted', 'bubbleGameExplodingHead', 'bubbleGameDoubleExplodingHead']);
export const packedAchievementSchema = v.strictObject({
	'name': packedAchievementNameSchema,
	'unlockedAt': v.number(),
});
export const packedUserSecurityKeySchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'name': v.string(),
	'lastUsed': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
});
// Self announcements are raw entity rows plus createdAt, not Announcement serializer results.
const selfAnnouncementFields = v.omit(__ref_Announcement, ['forYou', 'isRead']);
export const packedSelfUnreadAnnouncementSchema = v.strictObject({
	...selfAnnouncementFields.entries,
	isActive: v.boolean(),
	forExistingUsers: v.boolean(),
	userId: v.nullable(v.string()),
});
export const packedMeDetailedOnlySchema = v.strictObject({
	'avatarId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'bannerId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id' })),
	'followedMessage': v.nullable(v.string()),
	'isModerator': v.boolean(),
	'isAdmin': v.boolean(),
	'injectFeaturedNote': v.boolean(),
	'receiveAnnouncementEmail': v.boolean(),
	'alwaysMarkNsfw': v.boolean(),
	'autoSensitive': v.boolean(),
	'carefulBot': v.boolean(),
	'autoAcceptFollowed': v.boolean(),
	'followApprovalLocalSeconds': v.nullable(v.pipe(v.number(), v.integer())),
	'followApprovalRemoteSeconds': v.nullable(v.pipe(v.number(), v.integer())),
	'noCrawle': v.boolean(),
	'preventAiLearning': v.boolean(),
	'isExplorable': v.boolean(),
	'isDeleted': v.boolean(),
	'twoFactorBackupCodesStock': v.picklist(['full', 'partial', 'none']),
	'hideOnlineStatus': v.boolean(),
	'hasUnreadSpecifiedNotes': v.boolean(),
	'hasUnreadMentions': v.boolean(),
	'hasUnreadAnnouncement': v.boolean(),
	'unreadAnnouncements': v.array(packedSelfUnreadAnnouncementSchema),
	'hasUnreadAntenna': v.boolean(),
	'hasUnreadChannel': v.boolean(),
	'hasUnreadChatMessages': v.boolean(),
	'hasUnreadNotification': v.boolean(),
	'hasPendingReceivedFollowRequest': v.boolean(),
	'unreadNotificationsCount': v.number(),
	'mutedWords': v.array(v.union([v.string(), v.array(v.string())])),
	'hardMutedWords': v.array(v.union([v.string(), v.array(v.string())])),
	'mutedInstances': v.array(v.string()),
	'mutingNotificationTypes': v.array(v.string()),
	'notificationRecieveConfig': notificationSettings,
	'emailNotificationTypes': v.array(v.string()),
	'achievements': v.array(packedAchievementSchema),
	'loggedInDays': v.number(),
	'policies': v.lazy(() => __ref_RolePolicies),
	'twoFactorEnabled': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'usePasswordLessLogin': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'securityKeys': v.pipe(v.boolean(), v.metadata({ 'default': false })),
	'email': v.optional(v.nullable(v.string())),
	'emailVerified': v.optional(v.nullable(v.boolean())),
	'securityKeysList': v.optional(v.array(packedUserSecurityKeySchema)),
});
export const packedUserDetailedNotMeOnlySchema = v.strictObject({
	'url': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'url' })),
	'uri': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'uri' })),
	'movedTo': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'uri' })),
	'alsoKnownAs': v.nullable(v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' })))),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'updatedAt': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' })),
	'lastFetchedAt': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' })),
	'bannerUrl': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'url' })),
	'bannerBlurhash': v.nullable(v.string()),
	'isLocked': v.boolean(),
	'isSilenced': v.boolean(),
	'isSuspended': v.pipe(v.boolean(), v.metadata({ 'example': false })),
	'description': v.pipe(v.nullable(v.string()), v.metadata({ 'example': 'Hi masters, I am Ai!' })),
	'location': v.nullable(v.string()),
	'birthday': v.pipe(v.nullable(v.string()), v.metadata({ 'example': '2018-03-12' })),
	'lang': v.pipe(v.nullable(v.string()), v.metadata({ 'example': 'ja-JP' })),
	'fields': v.pipe(v.array(v.strictObject({
		'name': v.string(),
		'value': v.string(),
	})), v.metadata({ 'maxItems': 16 })),
	'verifiedLinks': v.array(v.pipe(v.string(), v.metadata({ 'format': 'url' }))),
	'followersCount': v.number(),
	'followingCount': v.number(),
	'notesCount': v.number(),
	'pinnedNoteIds': v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' }))),
	'pinnedNotes': v.array(v.lazy(() => __ref_Note)),
	'pinnedPageId': v.nullable(v.string()),
	'pinnedPage': v.nullable(v.lazy(() => __ref_Page)),
	'publicReactions': v.boolean(),
	'followingVisibility': v.picklist(['public', 'followers', 'private']),
	'followersVisibility': v.picklist(['public', 'followers', 'private']),
	'chatScope': v.picklist(['everyone', 'following', 'followers', 'mutual', 'none']),
	'canChat': v.boolean(),
	'roles': v.array(v.lazy(() => __ref_RoleLite)),
	'followedMessage': v.optional(v.nullable(v.string())),
	'memo': v.nullable(v.string()),
	'moderationNote': v.optional(v.string()),
	'twoFactorEnabled': v.optional(v.boolean()),
	'usePasswordLessLogin': v.optional(v.boolean()),
	'securityKeys': v.optional(v.boolean()),
	'isFollowing': v.optional(v.boolean()),
	'isFollowed': v.optional(v.boolean()),
	'hasPendingFollowRequestFromYou': v.optional(v.boolean()),
	'hasPendingFollowRequestToYou': v.optional(v.boolean()),
	'isBlocking': v.optional(v.boolean()),
	'isBlocked': v.optional(v.boolean()),
	'isMuted': v.optional(v.boolean()),
	'isRenoteMuted': v.optional(v.boolean()),
	'notify': v.optional(v.picklist(['normal', 'none'])),
	'withReplies': v.optional(v.boolean()),
});
const userLiteEntries = {
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'name': v.pipe(v.nullable(v.string()), v.metadata({ 'example': '藍' })),
	'username': v.pipe(v.string(), v.metadata({ 'example': 'ai' })),
	'host': v.pipe(v.nullable(v.string()), v.metadata({ 'description': 'The local host is represented with `null`.', 'example': 'misskey.example.com' })),
	'avatarUrl': v.pipe(v.string(), v.metadata({ 'format': 'url' })),
	'avatarBlurhash': v.nullable(v.string()),
	'avatarDecorations': v.array(v.strictObject({
		'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
		'angle': v.optional(v.number()),
		'flipH': v.optional(v.boolean()),
		'url': v.pipe(v.string(), v.metadata({ 'format': 'url' })),
		'offsetX': v.optional(v.number()),
		'offsetY': v.optional(v.number()),
	})),
	'isBot': v.optional(v.boolean()),
	'isCat': v.optional(v.boolean()),
	'requireSigninToViewContents': v.optional(v.boolean()),
	'makeNotesFollowersOnlyBefore': v.optional(v.nullable(v.number())),
	'makeNotesHiddenBefore': v.optional(v.nullable(v.number())),
	'instance': v.optional(v.strictObject({
		'name': v.nullable(v.string()),
		'softwareName': v.nullable(v.string()),
		'softwareVersion': v.nullable(v.string()),
		'iconUrl': v.nullable(v.string()),
		'faviconUrl': v.nullable(v.string()),
		'themeColor': v.nullable(v.string()),
	})),
	'emojis': v.record(v.string(), v.string()),
	'onlineStatus': v.picklist(['unknown', 'online', 'active', 'offline']),
	'badgeRoles': v.optional(v.array(v.strictObject({
		'name': v.string(),
		'iconUrl': v.nullable(v.string()),
		'displayOrder': v.number(),
	}))),
} as const;
export type PackedUserLiteSchema = v.StrictObjectSchema<typeof userLiteEntries, undefined>;
export const packedUserLiteSchema: PackedUserLiteSchema = v.strictObject(userLiteEntries);
// Each strict variant contains its complete field set; no strict intersection side rejects sibling fields.
type UserDetailedEntries = typeof packedUserLiteSchema.entries & typeof packedUserDetailedNotMeOnlySchema.entries;
type MeDetailedEntries = Omit<UserDetailedEntries, keyof typeof packedMeDetailedOnlySchema.entries> & typeof packedMeDetailedOnlySchema.entries;
export type PackedUserDetailedNotMeSchema = v.StrictObjectSchema<UserDetailedEntries, undefined>;
export const packedUserDetailedNotMeSchema: PackedUserDetailedNotMeSchema = v.strictObject({ ...packedUserLiteSchema.entries, ...packedUserDetailedNotMeOnlySchema.entries });
export type PackedMeDetailedSchema = v.StrictObjectSchema<MeDetailedEntries, undefined>;
export const packedMeDetailedSchema: PackedMeDetailedSchema = v.strictObject({ ...packedUserLiteSchema.entries, ...packedUserDetailedNotMeOnlySchema.entries, ...packedMeDetailedOnlySchema.entries });
export type PackedUserDetailedSchema = v.UnionSchema<[
	PackedUserDetailedNotMeSchema,
	PackedMeDetailedSchema
], undefined>;
export const packedUserDetailedSchema: PackedUserDetailedSchema = v.union([packedUserDetailedNotMeSchema, packedMeDetailedSchema]);
export type PackedUserSchema = v.UnionSchema<[
	typeof packedUserLiteSchema,
	PackedUserDetailedSchema
], undefined>;
export const packedUserSchema: PackedUserSchema = v.union([packedUserLiteSchema, packedUserDetailedSchema]);
export type PackedUserLite = v.InferOutput<typeof packedUserLiteSchema>;
export type PackedUserDetailedNotMe = v.InferOutput<typeof packedUserDetailedNotMeSchema>;
export type PackedMeDetailed = v.InferOutput<typeof packedMeDetailedSchema>;
export type PackedUserDetailed = v.InferOutput<typeof packedUserDetailedSchema>;
export type PackedUser = v.InferOutput<typeof packedUserSchema>;
type UserSecurityKeyWireInput = Omit<v.InferOutput<typeof packedUserSecurityKeySchema>, 'lastUsed'> & {
	lastUsed: Date | string;
};
type SelfUnreadAnnouncementWireInput = Omit<v.InferOutput<typeof packedSelfUnreadAnnouncementSchema>, 'updatedAt'> & {
	updatedAt: Date | string | null;
};
export type UserDetailedNotMeWireInput = Omit<PackedUserDetailedNotMe, 'pinnedPage'> & {
	pinnedPage: PageWireInput | null;
};
export type MeDetailedWireInput = Omit<PackedMeDetailed, 'securityKeysList' | 'unreadAnnouncements' | 'pinnedPage'> & {
	pinnedPage: PageWireInput | null;
	securityKeysList?: UserSecurityKeyWireInput[] | undefined;
	unreadAnnouncements: SelfUnreadAnnouncementWireInput[];
};
export type UserDetailedWireInput = UserDetailedNotMeWireInput | MeDetailedWireInput;
export type UserWireInput = PackedUserLite | UserDetailedWireInput;
/** Select the finite public user fields without exposing unrelated entity properties. */
export function toPackedUserLite(user: PackedUserLite): PackedUserLite {
	return {
		id: user.id,
		name: user.name,
		username: user.username,
		host: user.host,
		avatarUrl: user.avatarUrl,
		avatarBlurhash: user.avatarBlurhash,
		avatarDecorations: user.avatarDecorations.map(decoration => ({ id: decoration.id, url: decoration.url, ...(decoration.angle === undefined ? {} : { angle: decoration.angle }), ...(decoration.flipH === undefined ? {} : { flipH: decoration.flipH }), ...(decoration.offsetX === undefined ? {} : { offsetX: decoration.offsetX }), ...(decoration.offsetY === undefined ? {} : { offsetY: decoration.offsetY }) })),
		...(user.isBot === undefined ? {} : { isBot: user.isBot }),
		...(user.isCat === undefined ? {} : { isCat: user.isCat }),
		...(user.requireSigninToViewContents === undefined ? {} : { requireSigninToViewContents: user.requireSigninToViewContents }),
		...(user.makeNotesFollowersOnlyBefore === undefined ? {} : { makeNotesFollowersOnlyBefore: user.makeNotesFollowersOnlyBefore }),
		...(user.makeNotesHiddenBefore === undefined ? {} : { makeNotesHiddenBefore: user.makeNotesHiddenBefore }),
		...(user.instance === undefined ? {} : { instance: { name: user.instance.name, softwareName: user.instance.softwareName, softwareVersion: user.instance.softwareVersion, iconUrl: user.instance.iconUrl, faviconUrl: user.instance.faviconUrl, themeColor: user.instance.themeColor } }),
		emojis: toPackedRecord(user.emojis),
		onlineStatus: user.onlineStatus,
		...(user.badgeRoles === undefined ? {} : { badgeRoles: user.badgeRoles.map(role => ({ name: role.name, iconUrl: role.iconUrl, displayOrder: role.displayOrder })) }),
	};
}

function toPackedUserPolicies(policies: v.InferOutput<typeof __ref_RolePolicies>): v.InferOutput<typeof __ref_RolePolicies> {
	return {
		gtlAvailable: policies.gtlAvailable,
		ltlAvailable: policies.ltlAvailable,
		canPublicNote: policies.canPublicNote,
		mentionLimit: policies.mentionLimit,
		canInvite: policies.canInvite,
		inviteLimit: policies.inviteLimit,
		inviteLimitCycle: policies.inviteLimitCycle,
		inviteExpirationTime: policies.inviteExpirationTime,
		canManageCustomEmojis: policies.canManageCustomEmojis,
		canManageAvatarDecorations: policies.canManageAvatarDecorations,
		canSearchNotes: policies.canSearchNotes,
		canSearchUsers: policies.canSearchUsers,
		canUseTranslator: policies.canUseTranslator,
		canHideAds: policies.canHideAds,
		canCreateChannel: policies.canCreateChannel,
		driveCapacityMb: policies.driveCapacityMb,
		maxFileSizeMb: policies.maxFileSizeMb,
		uploadableFileTypes: [...policies.uploadableFileTypes],
		alwaysMarkNsfw: policies.alwaysMarkNsfw,
		canUpdateBioMedia: policies.canUpdateBioMedia,
		pinLimit: policies.pinLimit,
		antennaLimit: policies.antennaLimit,
		wordMuteLimit: policies.wordMuteLimit,
		webhookLimit: policies.webhookLimit,
		clipLimit: policies.clipLimit,
		noteEachClipsLimit: policies.noteEachClipsLimit,
		userListLimit: policies.userListLimit,
		userEachUserListsLimit: policies.userEachUserListsLimit,
		rateLimitFactor: policies.rateLimitFactor,
		avatarDecorationLimit: policies.avatarDecorationLimit,
		canImportAntennas: policies.canImportAntennas,
		canImportBlocking: policies.canImportBlocking,
		canImportFollowing: policies.canImportFollowing,
		canImportMuting: policies.canImportMuting,
		canImportUserLists: policies.canImportUserLists,
		chatAvailability: policies.chatAvailability,
		noteDraftLimit: policies.noteDraftLimit,
		scheduledNoteLimit: policies.scheduledNoteLimit,
		watermarkAvailable: policies.watermarkAvailable,
	};
}

function toPackedUserDetailedPublic(user: UserDetailedWireInput): PackedUserDetailedNotMe {
	return {
		...toPackedUserLite(user),
		url: user.url,
		uri: user.uri,
		movedTo: user.movedTo,
		alsoKnownAs: user.alsoKnownAs === null ? null : [...user.alsoKnownAs],
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		lastFetchedAt: user.lastFetchedAt,
		bannerUrl: user.bannerUrl,
		bannerBlurhash: user.bannerBlurhash,
		isLocked: user.isLocked,
		isSilenced: user.isSilenced,
		isSuspended: user.isSuspended,
		description: user.description,
		location: user.location,
		birthday: user.birthday,
		lang: user.lang,
		fields: user.fields.map(field => ({ name: field.name, value: field.value })),
		verifiedLinks: [...user.verifiedLinks],
		followersCount: user.followersCount,
		followingCount: user.followingCount,
		notesCount: user.notesCount,
		pinnedNoteIds: [...user.pinnedNoteIds],
		pinnedNotes: user.pinnedNotes.map(toPackedNote),
		pinnedPageId: user.pinnedPageId,
		pinnedPage: user.pinnedPage === null ? null : toPackedPage(user.pinnedPage),
		publicReactions: user.publicReactions,
		followingVisibility: user.followingVisibility,
		followersVisibility: user.followersVisibility,
		chatScope: user.chatScope,
		canChat: user.canChat,
		roles: user.roles.map(role => ({ id: role.id, name: role.name, color: role.color, iconUrl: role.iconUrl, description: role.description, isModerator: role.isModerator, isAdministrator: role.isAdministrator, displayOrder: role.displayOrder })),
		...(user.followedMessage === undefined ? {} : { followedMessage: user.followedMessage }),
		memo: user.memo,
		...(user.moderationNote === undefined ? {} : { moderationNote: user.moderationNote }),
		...(user.twoFactorEnabled === undefined ? {} : { twoFactorEnabled: user.twoFactorEnabled }),
		...(user.usePasswordLessLogin === undefined ? {} : { usePasswordLessLogin: user.usePasswordLessLogin }),
		...(user.securityKeys === undefined ? {} : { securityKeys: user.securityKeys }),
		...(user.isFollowing === undefined ? {} : { isFollowing: user.isFollowing }),
		...(user.isFollowed === undefined ? {} : { isFollowed: user.isFollowed }),
		...(user.hasPendingFollowRequestFromYou === undefined ? {} : { hasPendingFollowRequestFromYou: user.hasPendingFollowRequestFromYou }),
		...(user.hasPendingFollowRequestToYou === undefined ? {} : { hasPendingFollowRequestToYou: user.hasPendingFollowRequestToYou }),
		...(user.isBlocking === undefined ? {} : { isBlocking: user.isBlocking }),
		...(user.isBlocked === undefined ? {} : { isBlocked: user.isBlocked }),
		...(user.isMuted === undefined ? {} : { isMuted: user.isMuted }),
		...(user.isRenoteMuted === undefined ? {} : { isRenoteMuted: user.isRenoteMuted }),
		...(user.notify === undefined ? {} : { notify: user.notify }),
		...(user.withReplies === undefined ? {} : { withReplies: user.withReplies }),
	};
}

/** Preserve selected viewer fields and normalize the entity-backed dates at the wire boundary. */
export function toPackedUserDetailed(user: MeDetailedWireInput): PackedMeDetailed;
export function toPackedUserDetailed(user: UserDetailedNotMeWireInput): PackedUserDetailedNotMe;
export function toPackedUserDetailed(user: UserDetailedWireInput): PackedUserDetailed;
export function toPackedUserDetailed(user: UserDetailedWireInput): PackedUserDetailed {
	const details = toPackedUserDetailedPublic(user);
	if (!('unreadAnnouncements' in user)) return details;
	return {
		...details,
		avatarId: user.avatarId,
		bannerId: user.bannerId,
		followedMessage: user.followedMessage,
		isModerator: user.isModerator,
		isAdmin: user.isAdmin,
		injectFeaturedNote: user.injectFeaturedNote,
		receiveAnnouncementEmail: user.receiveAnnouncementEmail,
		alwaysMarkNsfw: user.alwaysMarkNsfw,
		autoSensitive: user.autoSensitive,
		carefulBot: user.carefulBot,
		autoAcceptFollowed: user.autoAcceptFollowed,
		followApprovalLocalSeconds: user.followApprovalLocalSeconds,
		followApprovalRemoteSeconds: user.followApprovalRemoteSeconds,
		noCrawle: user.noCrawle,
		preventAiLearning: user.preventAiLearning,
		isExplorable: user.isExplorable,
		isDeleted: user.isDeleted,
		twoFactorBackupCodesStock: user.twoFactorBackupCodesStock,
		hideOnlineStatus: user.hideOnlineStatus,
		hasUnreadSpecifiedNotes: user.hasUnreadSpecifiedNotes,
		hasUnreadMentions: user.hasUnreadMentions,
		hasUnreadAnnouncement: user.hasUnreadAnnouncement,
		unreadAnnouncements: user.unreadAnnouncements.map(announcement => ({
			id: announcement.id, createdAt: announcement.createdAt, text: announcement.text, title: announcement.title,
			imageUrl: announcement.imageUrl, icon: announcement.icon, display: announcement.display,
			needConfirmationToRead: announcement.needConfirmationToRead, silence: announcement.silence,
			isActive: announcement.isActive, forExistingUsers: announcement.forExistingUsers, userId: announcement.userId,
			updatedAt: announcement.updatedAt instanceof Date ? announcement.updatedAt.toISOString() : announcement.updatedAt,
		})),
		hasUnreadAntenna: user.hasUnreadAntenna,
		hasUnreadChannel: user.hasUnreadChannel,
		hasUnreadChatMessages: user.hasUnreadChatMessages,
		hasUnreadNotification: user.hasUnreadNotification,
		hasPendingReceivedFollowRequest: user.hasPendingReceivedFollowRequest,
		unreadNotificationsCount: user.unreadNotificationsCount,
		mutedWords: user.mutedWords.map(value => Array.isArray(value) ? [...value] : value),
		hardMutedWords: user.hardMutedWords.map(value => Array.isArray(value) ? [...value] : value),
		mutedInstances: [...user.mutedInstances],
		mutingNotificationTypes: [...user.mutingNotificationTypes],
		notificationRecieveConfig: toPackedNotificationSettings(user.notificationRecieveConfig),
		emailNotificationTypes: [...user.emailNotificationTypes],
		achievements: user.achievements.map(achievement => ({ name: achievement.name, unlockedAt: achievement.unlockedAt })),
		loggedInDays: user.loggedInDays,
		policies: toPackedUserPolicies(user.policies),
		twoFactorEnabled: user.twoFactorEnabled,
		usePasswordLessLogin: user.usePasswordLessLogin,
		securityKeys: user.securityKeys,
		...(user.email === undefined ? {} : { email: user.email }),
		...(user.emailVerified === undefined ? {} : { emailVerified: user.emailVerified }),
		...(user.securityKeysList === undefined ? {} : { securityKeysList: user.securityKeysList.map(key => ({ id: key.id, name: key.name, lastUsed: key.lastUsed instanceof Date ? key.lastUsed.toISOString() : key.lastUsed })) }),
	};
}
export function toPackedUser(user: UserDetailedWireInput): PackedUserDetailed;
export function toPackedUser(user: PackedUserLite): PackedUserLite;
export function toPackedUser(user: UserWireInput): PackedUser;
export function toPackedUser(user: UserWireInput): PackedUser {
	return 'pinnedNotes' in user ? toPackedUserDetailed(user) : toPackedUserLite(user);
}
