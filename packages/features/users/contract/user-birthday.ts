/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const birthdaySchema = { type: 'string', pattern: '^([0-9]{4})-([0-9]{2})-([0-9]{2})$' } as const;
