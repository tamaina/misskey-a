/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lang, version } from '@features/boot/frontend/shared/config.js';
import type { Locale } from 'i18n';

// VVI labels do not depend on this compatibility catalog; a failed catalog must not block boot.
export let locale: Locale = await window.fetch(`/assets/locales/${lang}.${version}.json`)
	.then(response => response.ok ? response.json() : null)
	.catch(() => null);

export function updateLocale(newLocale: Locale): void {
	locale = newLocale;
}
