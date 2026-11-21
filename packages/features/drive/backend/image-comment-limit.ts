/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Maximum image description length stored in DB and accepted by the public API.
 * Surrogate pairs count as one. Changing this hard limit requires a DB schema change.
 */
export const DB_MAX_IMAGE_COMMENT_LENGTH = 512;
