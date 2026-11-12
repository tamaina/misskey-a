/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, reactive } from 'vue';
import { ui } from '@features/boot/frontend/shared/config.js';
import { clearCache } from '../../runtime/frontend/utility/clear-cache.js';
import type { ComputedRef } from 'vue';
import { $i } from '@features/auth/frontend/i.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { openInstanceMenu, openToolsMenu } from '@features/navigation/frontend/ui/_common_/common.js';
import { lookup } from '@features/discovery/frontend/utility/lookup.js';
import * as os from '@features/ui/frontend/os.js';
import { getNavbarMessages } from './navbar-locale.js';
import { unisonReload } from '@features/runtime/frontend/utility/unison-reload.js';

// Navbar definitions are imported before the locale runtime may be installed.
const messages = computed(() => getNavbarMessages());

export const navbarItemDef = reactive<{
	[key: string]: {
		title: string;
		icon: string;
		show?: ComputedRef<boolean>;
		indicated?: ComputedRef<boolean>;
		indicateValue?: ComputedRef<string>;
		to?: string;
		action?: (ev: PointerEvent) => void;
	};
}>({
	notifications: {
		get title() {
			return messages.value.notifications;
		},
		icon: 'ti ti-bell',
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadNotification),
		indicateValue: computed(() => {
			if (!$i || $i.unreadNotificationsCount === 0) return '';

			if ($i.unreadNotificationsCount > 99) {
				return '99+';
			} else {
				return $i.unreadNotificationsCount.toString();
			}
		}),
		to: '/my/notifications',
	},
	drive: {
		get title() {
			return messages.value.drive;
		},
		icon: 'ti ti-cloud',
		show: computed(() => $i != null),
		to: '/my/drive',
	},
	followRequests: {
		get title() {
			return messages.value.followRequests;
		},
		icon: 'ti ti-user-plus',
		indicated: computed(() => $i != null && $i.hasPendingReceivedFollowRequest),
		to: '/my/follow-requests',
	},
	explore: {
		get title() {
			return messages.value.explore;
		},
		icon: 'ti ti-hash',
		to: '/explore',
	},
	announcements: {
		get title() {
			return messages.value.announcements;
		},
		icon: 'ti ti-speakerphone',
		indicated: computed(() => $i != null && $i.hasUnreadAnnouncement),
		to: '/announcements',
	},
	search: {
		get title() {
			return messages.value.search;
		},
		icon: 'ti ti-search',
		to: '/search',
	},
	lookup: {
		get title() {
			return messages.value.lookup;
		},
		icon: 'ti ti-world-search',
		action: (ev) => {
			lookup();
		},
	},
	qr: {
		get title() {
			return messages.value.qr;
		},
		icon: 'ti ti-qrcode',
		show: computed(() => $i != null),
		to: '/qr',
	},
	lists: {
		get title() {
			return messages.value.lists;
		},
		icon: 'ti ti-list',
		show: computed(() => $i != null),
		to: '/my/lists',
	},
	antennas: {
		get title() {
			return messages.value.antennas;
		},
		icon: 'ti ti-antenna',
		show: computed(() => $i != null),
		to: '/my/antennas',
	},
	favorites: {
		get title() {
			return messages.value.favorites;
		},
		icon: 'ti ti-star',
		show: computed(() => $i != null),
		to: '/my/favorites',
	},
	pages: {
		get title() {
			return messages.value.pages;
		},
		icon: 'ti ti-news',
		to: '/pages',
	},
	play: {
		title: 'Play',
		icon: 'ti ti-player-play',
		to: '/play',
	},
	gallery: {
		get title() {
			return messages.value.gallery;
		},
		icon: 'ti ti-icons',
		to: '/gallery',
	},
	clips: {
		get title() {
			return messages.value.clip;
		},
		icon: 'ti ti-paperclip',
		show: computed(() => $i != null),
		to: '/my/clips',
	},
	channels: {
		get title() {
			return messages.value.channel;
		},
		icon: 'ti ti-device-tv',
		to: '/channels',
	},
	chat: {
		get title() {
			return messages.value.directMessage_short;
		},
		icon: 'ti ti-messages',
		to: '/chat',
		show: computed(() => $i != null && $i.policies.chatAvailability !== 'unavailable'),
		indicated: computed(() => $i != null && $i.hasUnreadChatMessages),
	},
	achievements: {
		get title() {
			return messages.value.achievements;
		},
		icon: 'ti ti-medal',
		show: computed(() => $i != null),
		to: '/my/achievements',
	},
	games: {
		title: 'Misskey Games',
		icon: 'ti ti-device-gamepad',
		to: '/games',
	},
	ui: {
		get title() {
			return messages.value.switchUi;
		},
		icon: 'ti ti-devices',
		action: (ev) => {
			os.popupMenu([{
				text: messages.value.default,
				active: ui === 'default' || ui === null,
				action: () => {
					miLocalStorage.setItem('ui', 'default');
					unisonReload();
				},
			}, {
				text: messages.value.deck,
				active: ui === 'deck',
				action: () => {
					miLocalStorage.setItem('ui', 'deck');
					unisonReload();
				},
			}], ev.currentTarget ?? ev.target);
		},
	},
	about: {
		get title() {
			return messages.value.about;
		},
		icon: 'ti ti-info-circle',
		action: (ev) => {
			openInstanceMenu(ev);
		},
	},
	tools: {
		get title() {
			return messages.value.tools;
		},
		icon: 'ti ti-tool',
		action: (ev) => {
			openToolsMenu(ev);
		},
	},
	reload: {
		get title() {
			return messages.value.reload;
		},
		icon: 'ti ti-refresh',
		action: (ev) => {
			window.location.reload();
		},
	},
	profile: {
		get title() {
			return messages.value.profile;
		},
		icon: 'ti ti-user',
		show: computed(() => $i != null),
		to: `/@${$i?.username}`,
	},
	cacheClear: {
		get title() {
			return messages.value.clearCache;
		},
		icon: 'ti ti-trash',
		action: (ev) => {
			clearCache();
		},
	},
});
