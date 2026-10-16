/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Locale } from 'i18n';

/** Select shared actions from the existing catalog; never duplicate their translations. */
export const globalLocaleKeys = ['save', 'delete', 'close'] as const;
export type GlobalLocale = Pick<Locale, typeof globalLocaleKeys[number]>;
