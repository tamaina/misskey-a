/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';

export const MAX_ANKI_MEDIA_BYTES = 256 * 1024;
export const ankiMediaIdSchema = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
export const ankiMediaMimeTypeSchema = v.picklist(['image/png', 'audio/wav']);
export const ankiMediaAssetSchema = v.strictObject({
	id: ankiMediaIdSchema,
	mimeType: ankiMediaMimeTypeSchema,
	data: v.pipe(v.string(), v.minLength(4), v.maxLength(4 * Math.ceil(MAX_ANKI_MEDIA_BYTES / 3)),
		v.regex(/^[A-Za-z0-9+/]+={0,2}$/), v.check(value => value.length % 4 === 0)),
});
export const ankiMediaAssetsSchema = v.pipe(v.array(ankiMediaAssetSchema), v.maxLength(2),
	v.check(assets => new Set(assets.map(asset => asset.mimeType)).size === assets.length
		&& new Set(assets.map(asset => asset.id)).size === assets.length));

export type AnkiMediaAsset = v.InferOutput<typeof ankiMediaAssetSchema>;
export const ankiMediaUriPattern = /^fukushu-media:([a-f0-9]{64})$/;
