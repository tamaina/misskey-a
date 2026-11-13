/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

/** AJV counted Unicode code points, not UTF-16 units or grapheme clusters. */
export const imageCommentLength = v.check((value: string) => [...value].length <= 512,
	'Expected at most 512 Unicode code points');
export const imageComment = v.pipe(v.string(), imageCommentLength);
