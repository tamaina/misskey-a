/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useLocale } from 'virtual:vite-vue-internationalization';
import Messages from './navbar-messages.vue';
import type { Locale } from 'i18n';

/** Capture raw owner messages after the entry has activated its loaded runtime. */
export function getNavbarMessages() {
	const globalLocale = useLocale<Locale>(import.meta.url);
	return {
		...Messages.$locale,
		search: globalLocale.value.env.search,
		favorites: globalLocale.value.env.favorites,
		lists: globalLocale.value.env.lists,
		reload: globalLocale.value.env.reload,
		antennas: globalLocale.value.env.antennas,
		default: globalLocale.value.env.default,
		drive: globalLocale.value.env.drive,
		clip: globalLocale.value.env.clip,
		announcements: globalLocale.value.env.announcements,
		channel: globalLocale.value.env.channel,
		notifications: globalLocale.value.env.notifications,
	};
}
