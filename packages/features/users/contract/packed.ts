/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import {
	packedAnnouncementSchema as __ref_Announcement
} from '../../announcements/contract/packed.js';
import {
	packedNoteSchema as __ref_Note
} from '../../notes/contract/packed.js';
import {
	packedPageSchema as __ref_Page
} from '../../pages/contract/packed.js';
import {
	packedRoleLiteSchema as __ref_RoleLite,
	packedRolePoliciesSchema as __ref_RolePolicies
} from '../../roles/contract/packed.js';

export const packedAchievementSchema = resultObject({
	"name": v.lazy(() => packedAchievementNameSchema),
	"unlockedAt": v.number()
});
export const packedAchievementNameSchema = v.picklist(["notes1", "notes10", "notes100", "notes500", "notes1000", "notes5000", "notes10000", "notes20000", "notes30000", "notes40000", "notes50000", "notes60000", "notes70000", "notes80000", "notes90000", "notes100000", "login3", "login7", "login15", "login30", "login60", "login100", "login200", "login300", "login400", "login500", "login600", "login700", "login800", "login900", "login1000", "passedSinceAccountCreated1", "passedSinceAccountCreated2", "passedSinceAccountCreated3", "loggedInOnBirthday", "loggedInOnNewYearsDay", "noteClipped1", "noteFavorited1", "myNoteFavorited1", "profileFilled", "markedAsCat", "following1", "following10", "following50", "following100", "following300", "followers1", "followers10", "followers50", "followers100", "followers300", "followers500", "followers1000", "collectAchievements30", "viewAchievements3min", "iLoveMisskey", "foundTreasure", "client30min", "client60min", "noteDeletedWithin1min", "postedAtLateNight", "postedAt0min0sec", "selfQuote", "htl20npm", "viewInstanceChart", "outputHelloWorldOnScratchpad", "open3windows", "driveFolderCircularReference", "reactWithoutRead", "clickedClickHere", "justPlainLucky", "setNameToSyuilo", "cookieClicked", "brainDiver", "smashTestNotificationButton", "tutorialCompleted", "bubbleGameExplodingHead", "bubbleGameDoubleExplodingHead"]);
export const packedMeDetailedSchema = v.intersect([v.lazy(() => packedUserLiteSchema), v.lazy(() => packedUserDetailedNotMeOnlySchema), v.lazy(() => packedMeDetailedOnlySchema)]);
export const packedMeDetailedOnlySchema = resultObject({
	"avatarId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"bannerId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"followedMessage": v.nullable(v.string()),
	"isModerator": v.boolean(),
	"isAdmin": v.boolean(),
	"injectFeaturedNote": v.boolean(),
	"receiveAnnouncementEmail": v.boolean(),
	"alwaysMarkNsfw": v.boolean(),
	"autoSensitive": v.boolean(),
	"carefulBot": v.boolean(),
	"autoAcceptFollowed": v.boolean(),
	"noCrawle": v.boolean(),
	"preventAiLearning": v.boolean(),
	"isExplorable": v.boolean(),
	"isDeleted": v.boolean(),
	"twoFactorBackupCodesStock": v.picklist(["full", "partial", "none"]),
	"hideOnlineStatus": v.boolean(),
	"hasUnreadSpecifiedNotes": v.boolean(),
	"hasUnreadMentions": v.boolean(),
	"hasUnreadAnnouncement": v.boolean(),
	"unreadAnnouncements": v.array(v.lazy(() => __ref_Announcement)),
	"hasUnreadAntenna": v.boolean(),
	"hasUnreadChannel": v.boolean(),
	"hasUnreadChatMessages": v.boolean(),
	"hasUnreadNotification": v.boolean(),
	"hasPendingReceivedFollowRequest": v.boolean(),
	"unreadNotificationsCount": v.number(),
	"mutedWords": v.array(v.array(v.string())),
	"hardMutedWords": v.array(v.array(v.string())),
	"mutedInstances": v.array(v.string()),
	"notificationRecieveConfig": resultObject({
	"note": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"follow": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"mention": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"reply": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"renote": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"quote": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"reaction": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"pollEnded": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"scheduledNotePosted": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"scheduledNotePostFailed": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"receiveFollowRequest": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"followRequestAccepted": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"roleAssigned": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"chatRoomInvitationReceived": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"achievementEarned": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"app": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"test": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"login": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"createToken": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})])),
	"exportCompleted": v.optional(v.variant("type", [resultObject({
	"type": v.picklist(["all", "following", "follower", "mutualFollow", "followingOrFollower", "never"])
}), resultObject({
	"type": v.picklist(["list"]),
	"userListId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" }))
})]))
}),
	"emailNotificationTypes": v.array(v.string()),
	"achievements": v.array(v.lazy(() => packedAchievementSchema)),
	"loggedInDays": v.number(),
	"policies": v.lazy(() => __ref_RolePolicies),
	"twoFactorEnabled": v.pipe(v.boolean(), v.metadata({ "default": false })),
	"usePasswordLessLogin": v.pipe(v.boolean(), v.metadata({ "default": false })),
	"securityKeys": v.pipe(v.boolean(), v.metadata({ "default": false })),
	"email": v.optional(v.nullable(v.string())),
	"emailVerified": v.optional(v.nullable(v.boolean())),
	"securityKeysList": v.optional(v.array(resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"name": v.string(),
	"lastUsed": v.pipe(v.string(), v.metadata({ "format": "date-time" }))
})))
});
export const packedUserSchema = v.union([v.lazy(() => packedUserLiteSchema), v.lazy(() => packedUserDetailedSchema)]);
export const packedUserDetailedSchema = v.union([v.lazy(() => packedUserDetailedNotMeSchema), v.lazy(() => packedMeDetailedSchema)]);
export const packedUserDetailedNotMeSchema = v.intersect([v.lazy(() => packedUserLiteSchema), v.lazy(() => packedUserDetailedNotMeOnlySchema)]);
export const packedUserDetailedNotMeOnlySchema = resultObject({
	"url": v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	"uri": v.pipe(v.nullable(v.string()), v.metadata({ "format": "uri" })),
	"movedTo": v.pipe(v.nullable(v.string()), v.metadata({ "format": "uri" })),
	"alsoKnownAs": v.nullable(v.array(v.pipe(v.string(), v.metadata({ "format": "id" })))),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"updatedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"lastFetchedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"bannerUrl": v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	"bannerBlurhash": v.nullable(v.string()),
	"isLocked": v.boolean(),
	"isSilenced": v.boolean(),
	"isSuspended": v.pipe(v.boolean(), v.metadata({ "example": false })),
	"description": v.pipe(v.nullable(v.string()), v.metadata({ "example": "Hi masters, I am Ai!" })),
	"location": v.nullable(v.string()),
	"birthday": v.pipe(v.nullable(v.string()), v.metadata({ "example": "2018-03-12" })),
	"lang": v.pipe(v.nullable(v.string()), v.metadata({ "example": "ja-JP" })),
	"fields": v.pipe(v.array(resultObject({
	"name": v.string(),
	"value": v.string()
})), v.metadata({ "maxItems": 16 })),
	"verifiedLinks": v.array(v.pipe(v.string(), v.metadata({ "format": "url" }))),
	"followersCount": v.number(),
	"followingCount": v.number(),
	"notesCount": v.number(),
	"pinnedNoteIds": v.array(v.pipe(v.string(), v.metadata({ "format": "id" }))),
	"pinnedNotes": v.array(v.lazy(() => __ref_Note)),
	"pinnedPageId": v.nullable(v.string()),
	"pinnedPage": v.nullable(v.lazy(() => __ref_Page)),
	"publicReactions": v.boolean(),
	"followingVisibility": v.picklist(["public", "followers", "private"]),
	"followersVisibility": v.picklist(["public", "followers", "private"]),
	"chatScope": v.picklist(["everyone", "following", "followers", "mutual", "none"]),
	"canChat": v.boolean(),
	"roles": v.array(v.lazy(() => __ref_RoleLite)),
	"followedMessage": v.optional(v.nullable(v.string())),
	"memo": v.nullable(v.string()),
	"moderationNote": v.optional(v.string()),
	"twoFactorEnabled": v.optional(v.boolean()),
	"usePasswordLessLogin": v.optional(v.boolean()),
	"securityKeys": v.optional(v.boolean()),
	"isFollowing": v.optional(v.boolean()),
	"isFollowed": v.optional(v.boolean()),
	"hasPendingFollowRequestFromYou": v.optional(v.boolean()),
	"hasPendingFollowRequestToYou": v.optional(v.boolean()),
	"isBlocking": v.optional(v.boolean()),
	"isBlocked": v.optional(v.boolean()),
	"isMuted": v.optional(v.boolean()),
	"isRenoteMuted": v.optional(v.boolean()),
	"notify": v.optional(v.picklist(["normal", "none"])),
	"withReplies": v.optional(v.boolean())
});
export const packedUserLiteSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"name": v.pipe(v.nullable(v.string()), v.metadata({ "example": "藍" })),
	"username": v.pipe(v.string(), v.metadata({ "example": "ai" })),
	"host": v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`.", "example": "misskey.example.com" })),
	"avatarUrl": v.pipe(v.string(), v.metadata({ "format": "url" })),
	"avatarBlurhash": v.nullable(v.string()),
	"avatarDecorations": v.array(resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"angle": v.optional(v.number()),
	"flipH": v.optional(v.boolean()),
	"url": v.pipe(v.string(), v.metadata({ "format": "url" })),
	"offsetX": v.optional(v.number()),
	"offsetY": v.optional(v.number())
})),
	"isBot": v.optional(v.boolean()),
	"isCat": v.optional(v.boolean()),
	"requireSigninToViewContents": v.optional(v.boolean()),
	"makeNotesFollowersOnlyBefore": v.optional(v.nullable(v.number())),
	"makeNotesHiddenBefore": v.optional(v.nullable(v.number())),
	"instance": v.optional(resultObject({
	"name": v.nullable(v.string()),
	"softwareName": v.nullable(v.string()),
	"softwareVersion": v.nullable(v.string()),
	"iconUrl": v.nullable(v.string()),
	"faviconUrl": v.nullable(v.string()),
	"themeColor": v.nullable(v.string())
})),
	"emojis": v.record(v.string(), v.string()),
	"onlineStatus": v.picklist(["unknown", "online", "active", "offline"]),
	"badgeRoles": v.optional(v.array(resultObject({
	"name": v.string(),
	"iconUrl": v.nullable(v.string()),
	"displayOrder": v.number()
})))
});
