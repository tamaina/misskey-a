/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { EmojiPacked } from '@features/emojis/contract';

import {
	packedMeDetailedOnlySchema,
	packedMeDetailedSchema,
	packedUserDetailedNotMeOnlySchema,
	packedUserDetailedNotMeSchema,
	packedUserDetailedSchema,
	packedUserLiteSchema,
	packedUserSchema,
} from '../../../features/users/backend/models/json-schema/user.js';
import { packedNoteSchema } from '../../../features/notes/backend/models/json-schema/note.js';
import { packedUserListSchema } from '../../../features/relationships/backend/models/json-schema/user-list.js';
import { packedAppSchema } from '../../../features/auth/backend/models/json-schema/app.js';
import { packedNotificationSchema } from '../../../features/notifications/backend/models/json-schema/notification.js';
import { packedDriveFileSchema } from '../../../features/drive/backend/models/json-schema/drive-file.js';
import { packedDriveFolderSchema } from '../../../features/drive/backend/models/json-schema/drive-folder.js';
import { packedFollowingSchema } from '../../../features/relationships/backend/models/json-schema/following.js';
import { packedMutingSchema } from '../../../features/relationships/backend/models/json-schema/muting.js';
import { packedRenoteMutingSchema } from '../../../features/relationships/backend/models/json-schema/renote-muting.js';
import { packedBlockingSchema } from '../../../features/relationships/backend/models/json-schema/blocking.js';
import { packedNoteReactionSchema, packedNoteReactionWithNoteSchema } from '../../../features/notes/backend/models/json-schema/note-reaction.js';
import { packedHashtagSchema } from '../../../features/discovery/backend/models/json-schema/hashtag.js';
import { packedInviteCodeSchema } from '../../../features/auth/backend/models/json-schema/invite-code.js';
import { packedPageBlockSchema, packedPageSchema } from '../../../features/pages/backend/models/json-schema/page.js';
import { packedNoteFavoriteSchema } from '../../../features/collections/backend/models/json-schema/note-favorite.js';
import { packedChannelSchema } from '../../../features/channels/backend/models/json-schema/channel.js';
import { packedAntennaSchema } from '../../../features/timelines/backend/models/json-schema/antenna.js';
import { packedClipSchema } from '../../../features/collections/backend/models/json-schema/clip.js';
import { packedFederationInstanceSchema } from '../../../features/federation/backend/models/json-schema/federation-instance.js';
import {
	packedQueueCountSchema,
	packedQueueMetricsSchema,
	packedQueueJobSchema,
} from '../../../features/operations/backend/models/json-schema/queue.js';
import { packedGalleryPostSchema } from '../../../features/gallery/backend/models/json-schema/gallery-post.js';
import {
	packedEmojiDetailedAdminSchema,
	packedEmojiDetailedSchema,
	packedEmojiSimpleSchema,
} from '../../../features/emojis/backend/models/json-schema/emoji.js';
import { packedFlashSchema } from '../../../features/play/backend/models/json-schema/flash.js';
import { packedAnnouncementSchema } from '../../../features/announcements/backend/models/json-schema/announcement.js';
import { packedSigninSchema } from '../../../features/auth/backend/models/json-schema/signin.js';
import {
	packedRoleCondFormulaFollowersOrFollowingOrNotesSchema,
	packedRoleCondFormulaLogicsSchema,
	packedRoleCondFormulaValueAssignedRoleSchema,
	packedRoleCondFormulaValueCreatedSchema,
	packedRoleCondFormulaValueIsLocalOrRemoteSchema,
	packedRoleCondFormulaValueNot,
	packedRoleCondFormulaValueSchema,
	packedRoleCondFormulaValueUserSettingBooleanSchema,
	packedRoleLiteSchema,
	packedRolePoliciesSchema,
	packedRoleSchema,
} from '../../../features/roles/backend/models/json-schema/role.js';
import { packedAdSchema } from '../../../features/instance/backend/models/json-schema/ad.js';
import { packedReversiGameDetailedSchema, packedReversiGameLiteSchema } from '../../../features/games/backend/models/json-schema/reversi-game.js';
import {
	packedMetaDetailedOnlySchema,
	packedMetaDetailedSchema,
	packedMetaLiteSchema,
	packedMetaClientOptionsSchema,
} from '../../../features/instance/backend/models/json-schema/meta.js';
import { packedUserWebhookSchema } from '../../../features/integrations/backend/models/json-schema/user-webhook.js';
import { packedSystemWebhookSchema } from '../../../features/integrations/backend/models/json-schema/system-webhook.js';
import { packedAbuseReportNotificationRecipientSchema } from '../../../features/moderation/backend/models/json-schema/abuse-report-notification-recipient.js';
import { packedChatMessageSchema, packedChatMessageLiteSchema, packedChatMessageLiteForRoomSchema, packedChatMessageLiteFor1on1Schema } from '../../../features/chat/backend/models/json-schema/chat-message.js';
import { packedChatRoomSchema } from '../../../features/chat/backend/models/json-schema/chat-room.js';
import { packedChatRoomInvitationSchema } from '../../../features/chat/backend/models/json-schema/chat-room-invitation.js';
import { packedChatRoomMembershipSchema } from '../../../features/chat/backend/models/json-schema/chat-room-membership.js';
import { packedAchievementNameSchema, packedAchievementSchema } from '../../../features/users/backend/models/json-schema/achievement.js';
import { packedNoteDraftSchema } from '../../../features/notes/backend/models/json-schema/note-draft.js';

export const refs = {
	UserLite: packedUserLiteSchema,
	UserDetailedNotMeOnly: packedUserDetailedNotMeOnlySchema,
	MeDetailedOnly: packedMeDetailedOnlySchema,
	UserDetailedNotMe: packedUserDetailedNotMeSchema,
	MeDetailed: packedMeDetailedSchema,
	UserDetailed: packedUserDetailedSchema,
	User: packedUserSchema,

	UserList: packedUserListSchema,
	Achievement: packedAchievementSchema,
	AchievementName: packedAchievementNameSchema,
	Ad: packedAdSchema,
	Announcement: packedAnnouncementSchema,
	App: packedAppSchema,
	Note: packedNoteSchema,
	NoteDraft: packedNoteDraftSchema,
	NoteReaction: packedNoteReactionSchema,
	NoteReactionWithNote: packedNoteReactionWithNoteSchema,
	NoteFavorite: packedNoteFavoriteSchema,
	Notification: packedNotificationSchema,
	DriveFile: packedDriveFileSchema,
	DriveFolder: packedDriveFolderSchema,
	Following: packedFollowingSchema,
	Muting: packedMutingSchema,
	RenoteMuting: packedRenoteMutingSchema,
	Blocking: packedBlockingSchema,
	Hashtag: packedHashtagSchema,
	InviteCode: packedInviteCodeSchema,
	Page: packedPageSchema,
	PageBlock: packedPageBlockSchema,
	Channel: packedChannelSchema,
	QueueCount: packedQueueCountSchema,
	QueueMetrics: packedQueueMetricsSchema,
	QueueJob: packedQueueJobSchema,
	Antenna: packedAntennaSchema,
	Clip: packedClipSchema,
	FederationInstance: packedFederationInstanceSchema,
	GalleryPost: packedGalleryPostSchema,
	EmojiSimple: packedEmojiSimpleSchema,
	EmojiDetailed: packedEmojiDetailedSchema,
	EmojiDetailedAdmin: packedEmojiDetailedAdminSchema,
	Flash: packedFlashSchema,
	Signin: packedSigninSchema,
	RoleCondFormulaLogics: packedRoleCondFormulaLogicsSchema,
	RoleCondFormulaValueNot: packedRoleCondFormulaValueNot,
	RoleCondFormulaValueIsLocalOrRemote: packedRoleCondFormulaValueIsLocalOrRemoteSchema,
	RoleCondFormulaValueUserSettingBooleanSchema: packedRoleCondFormulaValueUserSettingBooleanSchema,
	RoleCondFormulaValueAssignedRole: packedRoleCondFormulaValueAssignedRoleSchema,
	RoleCondFormulaValueCreated: packedRoleCondFormulaValueCreatedSchema,
	RoleCondFormulaFollowersOrFollowingOrNotes: packedRoleCondFormulaFollowersOrFollowingOrNotesSchema,
	RoleCondFormulaValue: packedRoleCondFormulaValueSchema,
	RoleLite: packedRoleLiteSchema,
	Role: packedRoleSchema,
	RolePolicies: packedRolePoliciesSchema,
	ReversiGameLite: packedReversiGameLiteSchema,
	ReversiGameDetailed: packedReversiGameDetailedSchema,
	MetaLite: packedMetaLiteSchema,
	MetaDetailedOnly: packedMetaDetailedOnlySchema,
	MetaDetailed: packedMetaDetailedSchema,
	MetaClientOptions: packedMetaClientOptionsSchema,
	UserWebhook: packedUserWebhookSchema,
	SystemWebhook: packedSystemWebhookSchema,
	AbuseReportNotificationRecipient: packedAbuseReportNotificationRecipientSchema,
	ChatMessage: packedChatMessageSchema,
	ChatMessageLite: packedChatMessageLiteSchema,
	ChatMessageLiteFor1on1: packedChatMessageLiteFor1on1Schema,
	ChatMessageLiteForRoom: packedChatMessageLiteForRoomSchema,
	ChatRoom: packedChatRoomSchema,
	ChatRoomInvitation: packedChatRoomInvitationSchema,
	ChatRoomMembership: packedChatRoomMembershipSchema,
};

export type Packed<x extends keyof typeof refs> = x extends keyof EmojiPacked ? EmojiPacked[x] : SchemaType<typeof refs[x]>;

export type KeyOf<x extends keyof typeof refs> = x extends keyof EmojiPacked ? keyof EmojiPacked[x] : PropertiesToUnion<typeof refs[x]>;
type PropertiesToUnion<p extends Schema> = p['properties'] extends NonNullable<Obj> ? keyof p['properties'] : never;

type TypeStringef = 'null' | 'boolean' | 'integer' | 'number' | 'string' | 'array' | 'object' | 'any';
type StringDefToType<T extends TypeStringef> =
	T extends 'null' ? null :
	T extends 'boolean' ? boolean :
	T extends 'integer' ? number :
	T extends 'number' ? number :
	T extends 'string' ? string | Date :
	T extends 'array' ? ReadonlyArray<any> :
	T extends 'object' ? Record<string, any> :
	any;

// https://swagger.io/specification/?sbsearch=optional#schema-object
type OfSchema = {
	readonly anyOf?: ReadonlyArray<Schema>;
	readonly oneOf?: ReadonlyArray<Schema>;
	readonly allOf?: ReadonlyArray<Schema>;
};

export interface Schema extends OfSchema {
	readonly type?: TypeStringef;
	readonly nullable?: boolean;
	readonly optional?: boolean;
	readonly prefixItems?: ReadonlyArray<Schema>;
	readonly items?: Schema;
	readonly unevaluatedItems?: Schema | boolean;
	readonly properties?: Obj;
	readonly required?: ReadonlyArray<Extract<keyof NonNullable<this['properties']>, string>>;
	readonly description?: string;
	readonly example?: any;
	readonly format?: string;
	readonly ref?: keyof typeof refs;
	readonly selfRef?: boolean;
	readonly enum?: ReadonlyArray<string | null>;
	readonly default?: (this['type'] extends TypeStringef ? StringDefToType<this['type']> : any) | null;
	readonly maxLength?: number;
	readonly minLength?: number;
	readonly maximum?: number;
	readonly minimum?: number;
	readonly pattern?: string;
	readonly additionalProperties?: Schema | boolean;
}

type RequiredPropertyNames<s extends Obj> = {
	[K in keyof s]:
	// K is not optional
	s[K]['optional'] extends false ? K :
	// K has default value
	s[K]['default'] extends null | string | number | boolean | Record<string, unknown> ? K :
	never
}[keyof s];

export type Obj = Record<string, Schema>;

// https://github.com/misskey-dev/misskey/issues/8535
// To avoid excessive stack depth error,
// deceive TypeScript with UnionToIntersection (or more precisely, `infer` expression within it).
export type ObjType<s extends Obj, RequiredProps extends ReadonlyArray<keyof s>> =
	UnionToIntersection<
		{ -readonly [R in RequiredPropertyNames<s>]-?: SchemaType<s[R]> } &
		{ -readonly [R in RequiredProps[number]]-?: SchemaType<s[R]> } &
		{ -readonly [P in keyof s]?: SchemaType<s[P]> }
	>;

type NullOrUndefined<p extends Schema, T> =
	| (p['nullable'] extends true ? null : never)
	| (p['optional'] extends true ? undefined : never)
	| T;

// https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
// Get intersection from union
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type ArrayToIntersection<T extends ReadonlyArray<Schema>> =
	T extends readonly [infer Head, ...infer Tail]
		? Head extends Schema
			? Tail extends ReadonlyArray<Schema>
				? Tail extends []
					? SchemaType<Head>
					: SchemaType<Head> & ArrayToIntersection<Tail>
				: never
			: never
		: never;

// https://github.com/misskey-dev/misskey/pull/8144#discussion_r785287552
// To get union, we use `Foo extends any ? Hoge<Foo> : never`
type UnionSchemaType<a extends readonly any[], X extends Schema = a[number]> = X extends any ? SchemaType<X> : never;
//type UnionObjectSchemaType<a extends readonly any[], X extends Schema = a[number]> = X extends any ? ObjectSchemaType<X> : never;
type UnionObjType<s extends Obj, a extends readonly any[], X extends ReadonlyArray<keyof s> = a[number]> = X extends any ? ObjType<s, X> : never;
type ArrayUnion<T> = T extends any ? Array<T> : never;
type ArrayToTuple<X extends ReadonlyArray<Schema>> = { [K in keyof X]: SchemaType<X[K]> };

type ObjectSchemaTypeDef<p extends Schema> =
	p['ref'] extends keyof typeof refs ? Packed<p['ref']> :
	p['properties'] extends NonNullable<Obj> ?
		p['anyOf'] extends ReadonlyArray<Schema> ? p['anyOf'][number]['required'] extends ReadonlyArray<keyof p['properties']> ?
			UnionObjType<p['properties'], NonNullable<p['anyOf'][number]['required']>> & ObjType<p['properties'], NonNullable<p['required']>>
			: never
		: ObjType<p['properties'], NonNullable<p['required']>>
		:
		p['anyOf'] extends ReadonlyArray<Schema> ? UnionSchemaType<p['anyOf']> :
		p['allOf'] extends ReadonlyArray<Schema> ? ArrayToIntersection<p['allOf']> :
		p['additionalProperties'] extends true ? Record<string, any> :
		p['additionalProperties'] extends Schema ?
			p['additionalProperties'] extends infer AdditionalProperties ?
				AdditionalProperties extends Schema ?
					Record<string, SchemaType<AdditionalProperties>> :
					never :
				never :
			any;

export type SchemaTypeDef<p extends Schema> =
	p['type'] extends 'null' ? null :
	p['type'] extends 'integer' ? number :
	p['type'] extends 'number' ? number :
	p['type'] extends 'string' ? (
		p['enum'] extends readonly (string | null)[] ?
			p['enum'][number] :
			p['format'] extends 'date-time' ? string : // Dateにする？？
			string
	) :
		p['type'] extends 'boolean' ? boolean :
		p['type'] extends 'object' ? ObjectSchemaTypeDef<p> :
		p['type'] extends 'array' ? (
			p['items'] extends OfSchema ? (
				p['items']['anyOf'] extends ReadonlyArray<Schema> ? UnionSchemaType<NonNullable<p['items']['anyOf']>>[] :
				p['items']['oneOf'] extends ReadonlyArray<Schema> ? ArrayUnion<UnionSchemaType<NonNullable<p['items']['oneOf']>>> :
				p['items']['allOf'] extends ReadonlyArray<Schema> ? UnionToIntersection<UnionSchemaType<NonNullable<p['items']['allOf']>>>[] :
				never
			) :
				p['prefixItems'] extends ReadonlyArray<Schema> ? (
					p['items'] extends NonNullable<Schema> ? [...ArrayToTuple<p['prefixItems']>, ...SchemaType<p['items']>[]] :
					p['items'] extends false ? ArrayToTuple<p['prefixItems']> :
					p['unevaluatedItems'] extends false ? ArrayToTuple<p['prefixItems']> :
					[...ArrayToTuple<p['prefixItems']>, ...unknown[]]
				) :
					p['items'] extends NonNullable<Schema> ? SchemaType<p['items']>[] :
					any[]
		) :
			p['anyOf'] extends ReadonlyArray<Schema> ? UnionSchemaType<p['anyOf']> :
			p['allOf'] extends ReadonlyArray<Schema> ? ArrayToIntersection<p['allOf']> :
			p['oneOf'] extends ReadonlyArray<Schema> ? UnionSchemaType<p['oneOf']> :
			any;

export type SchemaType<p extends Schema> = NullOrUndefined<p, SchemaTypeDef<p>>;
