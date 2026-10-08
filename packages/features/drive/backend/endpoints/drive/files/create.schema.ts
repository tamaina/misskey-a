/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

const finiteNumber = v.pipe(v.number(), v.finite());

/** AJV counted Unicode code points, not UTF-16 units or grapheme clusters. */
export const imageCommentLength = v.check((value: string) => [...value].length <= 512,
	'Expected at most 512 Unicode code points');
export const imageComment = v.pipe(v.string(), imageCommentLength);

export const driveCreateFields = {
	folderId: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/))), null),
	name: v.optional(v.nullable(v.string()), null),
	comment: v.optional(v.nullable(imageComment), null),
	isSensitive: v.optional(v.boolean(), false),
	force: v.optional(v.boolean(), false),
};

/** Only fields consumed by the service; upload resources live in server context. */
export const driveCreateInput = v.object(driveCreateFields);
export const driveCreateWireInput = v.object({ ...driveCreateFields, file: v.blob() });

/** pack(..., { self: true }) always emits null folder/user details. */
export const driveCreateOutput = v.strictObject({
	id: v.string(),
	createdAt: v.string(),
	name: v.string(),
	type: v.string(),
	md5: v.string(),
	size: finiteNumber,
	isSensitive: v.boolean(),
	blurhash: v.nullable(v.string()),
	properties: v.strictObject({
		width: v.optional(finiteNumber),
		height: v.optional(finiteNumber),
		orientation: v.optional(finiteNumber),
		avgColor: v.optional(v.string()),
	}),
	url: v.string(),
	thumbnailUrl: v.nullable(v.string()),
	comment: v.nullable(v.string()),
	folderId: v.nullable(v.string()),
	folder: v.null(),
	userId: v.null(),
	user: v.null(),
});

export type DriveCreateInput = v.InferOutput<typeof driveCreateInput>;
export type DriveCreateOutput = v.InferOutput<typeof driveCreateOutput>;
