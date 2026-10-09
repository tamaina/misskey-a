/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedUserLiteSchema, packedUserDetailedNotMeSchema, packedMeDetailedSchema, packedSelfUnreadAnnouncementSchema, packedUserSecurityKeySchema } from '../user.schema.js';

// TypeORM materializes unselected class fields as own undefined properties.
// These keys stay native-only and disappear under the existing JSON.stringify transport.
export const nativeUserSecurityKeySchema = v.strictObject({
	...packedUserSecurityKeySchema.entries,
	lastUsed: v.date(),
	userId: v.optional(v.undefined()),
	user: v.optional(v.undefined()),
	publicKey: v.optional(v.undefined()),
	counter: v.optional(v.undefined()),
	credentialDeviceType: v.optional(v.undefined()),
	credentialBackedUp: v.optional(v.undefined()),
	transports: v.optional(v.undefined()),
});
export const nativeSelfUnreadAnnouncementSchema = v.strictObject({
	...packedSelfUnreadAnnouncementSchema.entries,
	updatedAt: v.nullable(v.date()),
	user: v.optional(v.undefined()),
});
export const nativeMeDetailedSchema = v.strictObject({
	...packedMeDetailedSchema.entries,
	securityKeysList: v.optional(v.array(nativeUserSecurityKeySchema)),
	unreadAnnouncements: v.array(nativeSelfUnreadAnnouncementSchema),
});
export const nativeUserDetailedSchema = v.union([packedUserDetailedNotMeSchema, nativeMeDetailedSchema]);
export const nativeUserSchema = v.union([packedUserLiteSchema, nativeUserDetailedSchema]);
export type NativeUser = v.InferOutput<typeof nativeUserSchema>;
export type NativeUserLite = v.InferOutput<typeof packedUserLiteSchema>;
export type NativeUserDetailedNotMe = v.InferOutput<typeof packedUserDetailedNotMeSchema>;
export type NativeMeDetailed = v.InferOutput<typeof nativeMeDetailedSchema>;
export type NativeUserDetailed = v.InferOutput<typeof nativeUserDetailedSchema>;
export type UserPackSchema = 'MeDetailed' | 'UserDetailedNotMe' | 'UserDetailed' | 'UserLite';
export type NativePackedUser<S extends UserPackSchema, Viewer = { id: string } | null | undefined> =
	S extends 'UserLite' ? NativeUserLite : Viewer extends null | undefined ? NativeUserDetailedNotMe : NativeUserDetailed;
