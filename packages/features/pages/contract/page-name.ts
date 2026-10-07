/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const pageNameSchema = { type: 'string', pattern: /^[^\s:\/?#\[\]@!$&'()*+,;=\\%\x00-\x20]{1,256}$/.source } as const;
