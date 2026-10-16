/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Locale } from 'i18n';

/** Select shared labels from the existing catalog; never duplicate their translations. */
export const globalLocaleKeys = ['save', 'delete', 'close', 'somethingHappened', 'search', 'edit', 'cancel', 'ok', 'reload', 'copy', 'next', 'upload', 'preview', 'reset', 'name', 'title', 'description', 'none', 'all', 'default', 'error', 'users', 'areYouSure'] as const;
export type GlobalLocale = Pick<Locale, typeof globalLocaleKeys[number]>;
