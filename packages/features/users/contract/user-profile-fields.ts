/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const nameSchema = { type: 'string', minLength: 1, maxLength: 50 } as const;
export const followedMessageSchema = { type: 'string', minLength: 1, maxLength: 256 } as const;
export const locationSchema = { type: 'string', minLength: 1, maxLength: 50 } as const;
