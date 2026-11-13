/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { toPackedUserLite } from '../../users/backend/user.schema.js';
import {
	packedUserLiteSchema as __ref_UserLite,
} from '../../users/backend/user.schema.js';

export const packedDriveFileSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'name': v.pipe(v.string(), v.metadata({ 'example': '192.jpg' })),
	'type': v.pipe(v.string(), v.metadata({ 'example': 'image/jpeg' })),
	'md5': v.pipe(v.string(), v.metadata({ 'format': 'md5', 'example': '15eca7fba0480996e2245f5185bf39f2' })),
	'size': v.pipe(v.number(), v.metadata({ 'example': 51469 })),
	'isSensitive': v.boolean(),
	'blurhash': v.nullable(v.string()),
	'properties': v.strictObject({
		'width': v.optional(v.pipe(v.number(), v.metadata({ 'example': 1280 }))),
		'height': v.optional(v.pipe(v.number(), v.metadata({ 'example': 720 }))),
		'orientation': v.optional(v.pipe(v.number(), v.metadata({ 'example': 8 }))),
		'avgColor': v.optional(v.pipe(v.string(), v.metadata({ 'example': 'rgb(40,65,87)' }))),
	}),
	'url': v.pipe(v.string(), v.metadata({ 'format': 'url' })),
	'thumbnailUrl': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'url' })),
	'comment': v.nullable(v.string()),
	'folderId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'folder': v.optional(v.nullable(v.lazy(() => packedDriveFolderSchema))),
	'userId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'user': v.optional(v.nullable(v.lazy(() => __ref_UserLite))),
});
const driveFolderBaseSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'name': v.string(),
	'parentId': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'foldersCount': v.optional(v.number()),
	'filesCount': v.optional(v.number()),
});
export type PackedDriveFolder = v.InferOutput<typeof driveFolderBaseSchema> & { parent?: PackedDriveFolder | null | undefined };
export const packedDriveFolderSchema: v.GenericSchema<PackedDriveFolder, PackedDriveFolder> = v.strictObject({
	...driveFolderBaseSchema.entries,
	'parent': v.optional(v.nullable(v.lazy(() => packedDriveFolderSchema))),
});

/** Select the finite public DTO explicitly, including nested serializer output. */
export function toPackedDriveFile(value: v.InferOutput<typeof packedDriveFileSchema>): v.InferOutput<typeof packedDriveFileSchema> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		name: value.name,
		type: value.type,
		md5: value.md5,
		size: value.size,
		isSensitive: value.isSensitive,
		blurhash: (value.blurhash === null ? null : value.blurhash),
		properties: {
			width: (value.properties.width === undefined ? undefined : value.properties.width),
			height: (value.properties.height === undefined ? undefined : value.properties.height),
			orientation: (value.properties.orientation === undefined ? undefined : value.properties.orientation),
			avgColor: (value.properties.avgColor === undefined ? undefined : value.properties.avgColor),
		},
		url: value.url,
		thumbnailUrl: (value.thumbnailUrl === null ? null : value.thumbnailUrl),
		comment: (value.comment === null ? null : value.comment),
		folderId: (value.folderId === null ? null : value.folderId),
		folder: (value.folder === undefined ? undefined : (value.folder === null ? null : toPackedDriveFolder(value.folder))),
		userId: (value.userId === null ? null : value.userId),
		user: (value.user === undefined ? undefined : (value.user === null ? null : toPackedUserLite(value.user))),
	};
}

/** Select the finite public DTO explicitly, including nested serializer output. */
export function toPackedDriveFolder(value: PackedDriveFolder): PackedDriveFolder {
	return {
		id: value.id,
		createdAt: value.createdAt,
		name: value.name,
		parentId: (value.parentId === null ? null : value.parentId),
		foldersCount: (value.foldersCount === undefined ? undefined : value.foldersCount),
		filesCount: (value.filesCount === undefined ? undefined : value.filesCount),
		parent: (value.parent === undefined ? undefined : (value.parent === null ? null : toPackedDriveFolder(value.parent))),
	};
}
