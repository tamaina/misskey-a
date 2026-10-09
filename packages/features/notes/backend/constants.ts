/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const PER_NOTE_REACTION_USER_PAIR_CACHE_MAX = 16;

// If you change DB_* values, you must also change the DB schema.
/**
 * Maximum note text length that can be stored in DB.
 * Surrogate pairs count as one
 */
export const DB_MAX_NOTE_TEXT_LENGTH = 8192;
