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

const messages = getNavbarMessages();
const defaultUiLabel = messages.default;
const deckUiLabel = messages.deck;

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
		title: messages.notifications,
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
		title: messages.drive,
		icon: 'ti ti-cloud',
		show: computed(() => $i != null),
		to: '/my/drive',
	},
	followRequests: {
		title: messages.followRequests,
		icon: 'ti ti-user-plus',
		indicated: computed(() => $i != null && $i.hasPendingReceivedFollowRequest),
		to: '/my/follow-requests',
	},
	explore: {
		title: messages.explore,
		icon: 'ti ti-hash',
		to: '/explore',
	},
	announcements: {
		title: messages.announcements,
		icon: 'ti ti-speakerphone',
		indicated: computed(() => $i != null && $i.hasUnreadAnnouncement),
		to: '/announcements',
	},
	search: {
		title: messages.search,
		icon: 'ti ti-search',
		to: '/search',
	},
	lookup: {
		title: messages.lookup,
		icon: 'ti ti-world-search',
		action: (ev) => {
			lookup();
		},
	},
	qr: {
		title: messages.qr,
		icon: 'ti ti-qrcode',
		show: computed(() => $i != null),
		to: '/qr',
	},
	lists: {
		title: messages.lists,
		icon: 'ti ti-list',
		show: computed(() => $i != null),
		to: '/my/lists',
	},
	antennas: {
		title: messages.antennas,
		icon: 'ti ti-antenna',
		show: computed(() => $i != null),
		to: '/my/antennas',
	},
	favorites: {
		title: messages.favorites,
		icon: 'ti ti-star',
		show: computed(() => $i != null),
		to: '/my/favorites',
	},
	pages: {
		title: messages.pages,
		icon: 'ti ti-news',
		to: '/pages',
	},
	play: {
		title: 'Play',
		icon: 'ti ti-player-play',
		to: '/play',
	},
	gallery: {
		title: messages.gallery,
		icon: 'ti ti-icons',
		to: '/gallery',
	},
	clips: {
		title: messages.clip,
		icon: 'ti ti-paperclip',
		show: computed(() => $i != null),
		to: '/my/clips',
	},
	channels: {
		title: messages.channel,
		icon: 'ti ti-device-tv',
		to: '/channels',
	},
	chat: {
		title: messages.directMessage_short,
		icon: 'ti ti-messages',
		to: '/chat',
		show: computed(() => $i != null && $i.policies.chatAvailability !== 'unavailable'),
		indicated: computed(() => $i != null && $i.hasUnreadChatMessages),
	},
	achievements: {
		title: messages.achievements,
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
		title: messages.switchUi,
		icon: 'ti ti-devices',
		action: (ev) => {
			os.popupMenu([{
				text: defaultUiLabel,
				active: ui === 'default' || ui === null,
				action: () => {
					miLocalStorage.setItem('ui', 'default');
					unisonReload();
				},
			}, {
				text: deckUiLabel,
				active: ui === 'deck',
				action: () => {
					miLocalStorage.setItem('ui', 'deck');
					unisonReload();
				},
			}], ev.currentTarget ?? ev.target);
		},
	},
	about: {
		title: messages.about,
		icon: 'ti ti-info-circle',
		action: (ev) => {
			openInstanceMenu(ev);
		},
	},
	tools: {
		title: messages.tools,
		icon: 'ti ti-tool',
		action: (ev) => {
			openToolsMenu(ev);
		},
	},
	reload: {
		title: messages.reload,
		icon: 'ti ti-refresh',
		action: (ev) => {
			window.location.reload();
		},
	},
	profile: {
		title: messages.profile,
		icon: 'ti ti-user',
		show: computed(() => $i != null),
		to: `/@${$i?.username}`,
	},
	cacheClear: {
		title: messages.clearCache,
		icon: 'ti ti-trash',
		action: (ev) => {
			clearCache();
		},
	},
});
