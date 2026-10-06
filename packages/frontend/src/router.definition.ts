/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import type { AsyncComponentLoader } from 'vue';
import { loadNotFoundPage } from '@features/index/frontend';
import type { RouteDef } from '@/lib/nirax.js';
import { $i, iAmModerator } from '@/i.js';
import MkLoading from '@features/web/frontend/pages/_loading_.vue';
import MkError from '@features/web/frontend/pages/_error_.vue';
import PageTimeline from '@features/timelines/frontend/pages/timeline.vue';

export const page = (loader: AsyncComponentLoader) => defineAsyncComponent({
	loader: loader,
	loadingComponent: MkLoading,
	errorComponent: MkError,
});

function chatPage(...args: Parameters<typeof page>) {
	return $i?.policies.chatAvailability !== 'unavailable' ? page(...args) : page(loadNotFoundPage);
}

export const ROUTE_DEF = [{
	name: 'index',
	path: '/',
	component: $i ? PageTimeline : page(() => import('@features/web/frontend/pages/welcome.vue')),
}, {
	path: '/timeline',
	component: PageTimeline,
}, {
	path: '/@:username/pages/:pageName(*)',
	component: page(() => import('@features/pages/frontend/pages/page.vue')),
}, {
	path: '/@:acct/following',
	component: page(() => import('@features/relationships/frontend/pages/user/following.vue')),
}, {
	path: '/@:acct/followers',
	component: page(() => import('@features/relationships/frontend/pages/user/followers.vue')),
}, {
	name: 'user',
	path: '/@:acct/:page?',
	component: page(() => import('@features/users/frontend/pages/user/index.vue')),
}, {
	name: 'note',
	path: '/notes/:noteId/:initialTab?',
	component: page(() => import('@features/notes/frontend/pages/note.vue')),
}, {
	name: 'list',
	path: '/list/:listId',
	component: page(() => import('@features/relationships/frontend/pages/list.vue')),
}, {
	path: '/clips/:clipId',
	component: page(() => import('@features/collections/frontend/pages/clip.vue')),
}, {
	path: '/chat',
	component: chatPage(() => import('@features/chat/frontend/pages/chat/home.vue')),
	loginRequired: true,
}, {
	path: '/chat/user/:userId',
	component: chatPage(() => import('@features/chat/frontend/pages/chat/room.vue')),
	loginRequired: true,
}, {
	path: '/chat/room/:roomId',
	component: chatPage(() => import('@features/chat/frontend/pages/chat/room.vue')),
	loginRequired: true,
}, {
	path: '/chat/messages/:messageId',
	component: chatPage(() => import('@features/chat/frontend/pages/chat/message.vue')),
	loginRequired: true,
}, {
	path: '/instance-info/:host',
	component: page(() => import('@features/federation/frontend/pages/instance-info.vue')),
}, {
	name: 'settings',
	path: '/settings',
	component: page(() => import('@features/navigation/frontend/pages/settings/index.vue')),
	loginRequired: true,
	children: [{
		path: '/profile',
		name: 'profile',
		component: page(() => import('@features/users/frontend/pages/settings/profile.vue')),
	}, {
		path: '/avatar-decoration',
		name: 'avatarDecoration',
		component: page(() => import('@features/avatar-decorations/frontend/pages/settings/avatar-decoration.vue')),
	}, {
		path: '/privacy',
		name: 'privacy',
		component: page(() => import('@/pages/settings/privacy.vue')),
	}, {
		path: '/emoji-palette',
		name: 'emoji-palette',
		component: page(() => import('@features/preferences/frontend/pages/settings/emoji-palette.vue')),
	}, {
		path: '/drive',
		name: 'drive',
		component: page(() => import('@features/drive/frontend/pages/settings/drive.vue')),
	}, {
		path: '/drive/cleaner',
		name: 'drive',
		component: page(() => import('@features/drive/frontend/pages/settings/drive-cleaner.vue')),
	}, {
		path: '/notifications',
		name: 'notifications',
		component: page(() => import('@features/notifications/frontend/pages/settings/notifications.vue')),
	}, {
		path: '/email',
		name: 'email',
		component: page(() => import('@/pages/settings/email.vue')),
	}, {
		path: '/security',
		name: 'security',
		component: page(() => import('@features/auth/frontend/pages/settings/security.vue')),
	}, {
		path: '/preferences',
		name: 'preferences',
		component: page(() => import('@features/preferences/frontend/pages/settings/preferences.vue')),
	}, {
		path: '/theme/install',
		name: 'theme',
		component: page(() => import('@features/preferences/frontend/pages/settings/theme.install.vue')),
	}, {
		path: '/theme/manage',
		name: 'theme',
		component: page(() => import('@features/preferences/frontend/pages/settings/theme.manage.vue')),
	}, {
		path: '/theme',
		name: 'theme',
		component: page(() => import('@features/preferences/frontend/pages/settings/theme.vue')),
	}, {
		path: '/navbar',
		name: 'navbar',
		component: page(() => import('@features/preferences/frontend/pages/settings/navbar.vue')),
	}, {
		path: '/statusbar',
		name: 'statusbar',
		component: page(() => import('@features/preferences/frontend/pages/settings/statusbar.vue')),
	}, {
		path: '/sounds',
		name: 'sounds',
		component: page(() => import('@features/preferences/frontend/pages/settings/sounds.vue')),
	}, {
		path: '/plugin/install',
		name: 'plugin',
		component: page(() => import('@features/integrations/frontend/pages/settings/plugin.install.vue')),
	}, {
		path: '/plugin',
		name: 'plugin',
		component: page(() => import('@features/integrations/frontend/pages/settings/plugin.vue')),
	}, {
		path: '/account-data',
		name: 'account-data',
		component: page(() => import('@features/portability/frontend/pages/settings/account-data.vue')),
	}, {
		path: '/mute-block',
		name: 'mute-block',
		component: page(() => import('@features/relationships/frontend/pages/settings/mute-block.vue')),
	}, {
		path: '/connect',
		name: 'connect',
		component: page(() => import('@features/auth/frontend/pages/settings/connect.vue')),
	}, {
		path: '/apps',
		name: 'connect',
		component: page(() => import('@features/auth/frontend/pages/settings/apps.vue')),
	}, {
		path: '/webhook/edit/:webhookId',
		name: 'connect',
		component: page(() => import('@features/integrations/frontend/pages/settings/webhook.edit.vue')),
	}, {
		path: '/webhook/new',
		name: 'connect',
		component: page(() => import('@features/integrations/frontend/pages/settings/webhook.new.vue')),
	}, {
		path: '/deck',
		name: 'deck',
		component: page(() => import('@features/preferences/frontend/pages/settings/deck.vue')),
	}, {
		path: '/custom-css',
		name: 'preferences',
		component: page(() => import('@features/preferences/frontend/pages/settings/custom-css.vue')),
	}, {
		path: '/profiles',
		name: 'profiles',
		component: page(() => import('@features/users/frontend/pages/settings/profiles.vue')),
	}, {
		path: '/accounts',
		name: 'profile',
		component: page(() => import('@features/auth/frontend/pages/settings/accounts.vue')),
	}, {
		path: '/other',
		name: 'other',
		component: page(() => import('@/pages/settings/other.vue')),
	}, {
		path: '/',
		component: page(() => import('@features/navigation/frontend/pages/_empty_.vue')),
	}],
}, {
	path: '/reset-password/:token?',
	component: page(() => import('@features/auth/frontend/pages/reset-password.vue')),
}, {
	path: '/signup-complete/:code',
	component: page(() => import('@features/auth/frontend/pages/signup-complete.vue')),
}, {
	path: '/verify-email/:code',
	component: page(() => import('@features/auth/frontend/pages/verify-email.vue')),
}, {
	path: '/announcements',
	component: page(() => import('@features/announcements/frontend/pages/announcements.vue')),
}, {
	path: '/announcements/:announcementId',
	component: page(() => import('@features/announcements/frontend/pages/announcement.vue')),
}, {
	path: '/about',
	component: page(() => import('@features/instance/frontend/pages/about.vue')),
	hash: 'initialTab',
}, {
	path: '/contact',
	component: page(() => import('@features/instance/frontend/pages/contact.vue')),
}, {
	path: '/about-misskey',
	component: page(() => import('@features/web/frontend/pages/about-misskey.vue')),
}, {
	path: '/invite',
	name: 'invite',
	component: page(() => import('@features/auth/frontend/pages/invite.vue')),
}, {
	path: '/ads',
	component: page(() => import('@features/instance/frontend/pages/ads.vue')),
}, {
	path: '/theme-editor',
	component: page(() => import('@features/preferences/frontend/pages/theme-editor.vue')),
	loginRequired: true,
}, {
	path: '/roles/:roleId',
	component: page(() => import('@features/roles/frontend/pages/role.vue')),
}, {
	path: '/user-tags/:tag',
	component: page(() => import('@features/discovery/frontend/pages/user-tag.vue')),
}, {
	path: '/explore',
	component: page(() => import('@features/discovery/frontend/pages/explore.vue')),
	hash: 'initialTab',
}, {
	path: '/search',
	component: page(() => import('@features/discovery/frontend/pages/search.vue')),
	query: {
		q: 'query',
		userId: 'userId',
		username: 'username',
		host: 'host',
		channel: 'channel',
		type: 'type',
		origin: 'origin',
	},
}, {
	// Legacy Compatibility
	path: '/authorize-follow',
	redirect: '/lookup',
	loginRequired: true,
}, {
	// Mastodon Compatibility
	path: '/authorize_interaction',
	redirect: '/lookup',
	loginRequired: true,
}, {
	path: '/lookup',
	component: page(() => import('@features/federation/frontend/pages/lookup.vue')),
	loginRequired: true,
}, {
	path: '/share',
	component: page(() => import('@features/notes/frontend/pages/share.vue')),
	loginRequired: true,
}, {
	path: '/api-console',
	component: page(() => import('@features/api/frontend/pages/api-console.vue')),
	loginRequired: true,
}, {
	path: '/scratchpad',
	component: page(() => import('@features/play/frontend/pages/scratchpad.vue')),
}, {
	path: '/preview',
	component: page(() => import('@features/ui/frontend/pages/preview.vue')),
}, {
	path: '/auth/:token',
	component: page(() => import('@features/auth/frontend/pages/auth.vue')),
}, {
	path: '/miauth/:session',
	component: page(() => import('@features/auth/frontend/pages/miauth.vue')),
	query: {
		callback: 'callback',
		name: 'name',
		icon: 'icon',
		permission: 'permission',
	},
}, {
	path: '/oauth/authorize',
	component: page(() => import('@features/auth/frontend/pages/oauth.vue')),
}, {
	path: '/tags/:tag',
	component: page(() => import('@features/discovery/frontend/pages/tag.vue')),
}, {
	path: '/pages/new',
	component: page(() => import('@features/pages/frontend/pages/page-editor/page-editor.vue')),
	loginRequired: true,
}, {
	path: '/pages/edit/:initPageId',
	component: page(() => import('@features/pages/frontend/pages/page-editor/page-editor.vue')),
	loginRequired: true,
}, {
	path: '/pages',
	component: page(() => import('@features/pages/frontend/pages/pages.vue')),
}, {
	path: '/play/:id/edit',
	component: page(() => import('@features/play/frontend/pages/flash/flash-edit.vue')),
	loginRequired: true,
}, {
	path: '/play/new',
	component: page(() => import('@features/play/frontend/pages/flash/flash-edit.vue')),
	loginRequired: true,
}, {
	path: '/play/:id',
	component: page(() => import('@features/play/frontend/pages/flash/flash.vue')),
}, {
	path: '/play',
	component: page(() => import('@features/play/frontend/pages/flash/flash-index.vue')),
}, {
	path: '/gallery/:postId/edit',
	component: page(() => import('@features/gallery/frontend/pages/gallery/edit.vue')),
	loginRequired: true,
}, {
	path: '/gallery/new',
	component: page(() => import('@features/gallery/frontend/pages/gallery/edit.vue')),
	loginRequired: true,
}, {
	path: '/gallery/:postId',
	component: page(() => import('@features/gallery/frontend/pages/gallery/post.vue')),
}, {
	path: '/gallery',
	component: page(() => import('@features/gallery/frontend/pages/gallery/index.vue')),
}, {
	path: '/channels/:channelId/edit',
	component: page(() => import('@features/channels/frontend/pages/channel-editor.vue')),
	loginRequired: true,
}, {
	path: '/channels/new',
	component: page(() => import('@features/channels/frontend/pages/channel-editor.vue')),
	loginRequired: true,
}, {
	path: '/channels/:channelId',
	component: page(() => import('@features/channels/frontend/pages/channel.vue')),
}, {
	path: '/channels',
	component: page(() => import('@features/channels/frontend/pages/channels.vue')),
}, {
	path: '/custom-emojis-manager',
	component: page(() => import('@features/emojis/frontend/pages/custom-emojis-manager.vue')),
}, {
	path: '/avatar-decorations',
	name: 'avatarDecorations',
	component: page(() => import('@features/avatar-decorations/frontend/pages/avatar-decorations.vue')),
}, {
	path: '/registry/keys/:domain/:path(*)?',
	component: page(() => import('@features/preferences/frontend/pages/registry.keys.vue')),
}, {
	path: '/registry/value/:domain/:path(*)?',
	component: page(() => import('@features/preferences/frontend/pages/registry.value.vue')),
}, {
	path: '/registry',
	component: page(() => import('@features/preferences/frontend/pages/registry.vue')),
}, {
	path: '/install-extentions',
	redirect: '/install-extensions',
	loginRequired: true,
}, {
	path: '/install-extensions',
	component: page(() => import('@features/integrations/frontend/pages/install-extensions.vue')),
	loginRequired: true,
}, {
	path: '/admin/user/:userId',
	component: iAmModerator ? page(() => import('@features/moderation/frontend/pages/admin-user.vue')) : page(loadNotFoundPage),
}, {
	path: '/admin/file/:fileId',
	component: iAmModerator ? page(() => import('@features/drive/frontend/pages/admin-file.vue')) : page(loadNotFoundPage),
}, {
	path: '/admin',
	component: iAmModerator ? page(() => import('@features/navigation/frontend/pages/admin/index.vue')) : page(loadNotFoundPage),
	children: [{
		path: '/overview',
		name: 'overview',
		component: page(() => import('@features/statistics/frontend/pages/admin/overview.vue')),
	}, {
		path: '/users',
		name: 'users',
		component: page(() => import('@/pages/admin/users.vue')),
	}, {
		path: '/emojis',
		name: 'emojis',
		component: page(() => import('@features/emojis/frontend/pages/custom-emojis-manager.vue')),
	}, {
		path: '/emojis2',
		name: 'emojis2',
		component: page(() => import('@features/emojis/frontend/pages/admin/custom-emojis-manager2.vue')),
	}, {
		path: '/avatar-decorations',
		name: 'avatarDecorations',
		component: page(() => import('@features/avatar-decorations/frontend/pages/avatar-decorations.vue')),
	}, {
		path: '/federation-job-queue',
		name: 'federationJobQueue',
		component: page(() => import('@features/operations/frontend/pages/admin/federation-job-queue.vue')),
	}, {
		path: '/job-queue',
		name: 'jobQueue',
		component: page(() => import('@features/operations/frontend/pages/admin/job-queue.vue')),
	}, {
		path: '/files',
		name: 'files',
		component: page(() => import('@features/drive/frontend/pages/admin/files.vue')),
	}, {
		path: '/federation',
		name: 'federation',
		component: page(() => import('@features/federation/frontend/pages/admin/federation.vue')),
	}, {
		path: '/announcements',
		name: 'announcements',
		component: page(() => import('@features/announcements/frontend/pages/admin/announcements.vue')),
	}, {
		path: '/ads',
		name: 'ads',
		component: page(() => import('@features/instance/frontend/pages/admin/ads.vue')),
	}, {
		path: '/roles/:id/edit',
		name: 'roles',
		component: page(() => import('@features/roles/frontend/pages/admin/roles.edit.vue')),
	}, {
		path: '/roles/new',
		name: 'roles',
		component: page(() => import('@features/roles/frontend/pages/admin/roles.edit.vue')),
	}, {
		path: '/roles/:id',
		name: 'roles',
		component: page(() => import('@features/roles/frontend/pages/admin/roles.role.vue')),
	}, {
		path: '/roles',
		name: 'roles',
		component: page(() => import('@features/roles/frontend/pages/admin/roles.vue')),
	}, {
		path: '/database',
		name: 'database',
		component: page(() => import('@features/operations/frontend/pages/admin/database.vue')),
	}, {
		path: '/abuses',
		name: 'abuses',
		component: page(() => import('@features/moderation/frontend/pages/admin/abuses.vue')),
	}, {
		path: '/modlog',
		name: 'modlog',
		component: page(() => import('@features/moderation/frontend/pages/admin/modlog.vue')),
	}, {
		path: '/settings',
		name: 'settings',
		component: page(() => import('@features/instance/frontend/pages/admin/settings.vue')),
	}, {
		path: '/branding',
		name: 'branding',
		component: page(() => import('@features/instance/frontend/pages/admin/branding.vue')),
	}, {
		path: '/moderation',
		name: 'moderation',
		component: page(() => import('@/pages/admin/moderation.vue')),
	}, {
		path: '/email-settings',
		name: 'email-settings',
		component: page(() => import('@features/instance/frontend/pages/admin/email-settings.vue')),
	}, {
		path: '/object-storage',
		name: 'object-storage',
		component: page(() => import('@features/operations/frontend/pages/admin/object-storage.vue')),
	}, {
		path: '/security',
		name: 'security',
		component: page(() => import('@/pages/admin/security.vue')),
	}, {
		path: '/relays',
		name: 'relays',
		component: page(() => import('@features/federation/frontend/pages/admin/relays.vue')),
	}, {
		path: '/external-services',
		name: 'external-services',
		component: page(() => import('@/pages/admin/external-services.vue')),
	}, {
		path: '/performance',
		name: 'performance',
		component: page(() => import('@features/statistics/frontend/pages/admin/performance.vue')),
	}, {
		path: '/invites',
		name: 'invites',
		component: page(() => import('@features/auth/frontend/pages/admin/invites.vue')),
	}, {
		path: '/abuse-report-notification-recipient',
		name: 'abuse-report-notification-recipient',
		component: page(() => import('@features/moderation/frontend/pages/admin/abuse-report/notification-recipient.vue')),
	}, {
		path: '/system-webhook',
		name: 'system-webhook',
		component: page(() => import('@features/integrations/frontend/pages/admin/system-webhook.vue')),
	}, {
		path: '/',
		component: page(() => import('@features/navigation/frontend/pages/_empty_.vue')),
	}],
}, {
	path: '/my/notifications',
	component: page(() => import('@features/notifications/frontend/pages/notifications.vue')),
	loginRequired: true,
}, {
	path: '/my/favorites',
	component: page(() => import('@features/collections/frontend/pages/favorites.vue')),
	loginRequired: true,
}, {
	path: '/my/achievements',
	component: page(() => import('@features/users/frontend/pages/achievements.vue')),
	loginRequired: true,
}, {
	path: '/my/drive/folder/:folder',
	component: page(() => import('@features/drive/frontend/pages/drive.vue')),
	loginRequired: true,
}, {
	path: '/my/drive',
	component: page(() => import('@features/drive/frontend/pages/drive.vue')),
	loginRequired: true,
}, {
	path: '/my/drive/file/:fileId',
	component: page(() => import('@features/drive/frontend/pages/drive.file.vue')),
	loginRequired: true,
}, {
	path: '/my/follow-requests',
	component: page(() => import('@features/relationships/frontend/pages/follow-requests.vue')),
	loginRequired: true,
}, {
	path: '/my/lists/:listId',
	component: page(() => import('@features/relationships/frontend/pages/my-lists/list.vue')),
	loginRequired: true,
}, {
	path: '/my/lists',
	component: page(() => import('@features/relationships/frontend/pages/my-lists/index.vue')),
	loginRequired: true,
}, {
	path: '/my/clips',
	component: page(() => import('@features/collections/frontend/pages/my-clips/index.vue')),
	loginRequired: true,
}, {
	path: '/my/antennas/create',
	component: page(() => import('@features/timelines/frontend/pages/my-antennas/create.vue')),
	loginRequired: true,
}, {
	path: '/my/antennas/:antennaId',
	component: page(() => import('@features/timelines/frontend/pages/my-antennas/edit.vue')),
	loginRequired: true,
}, {
	path: '/my/antennas',
	component: page(() => import('@features/timelines/frontend/pages/my-antennas/index.vue')),
	loginRequired: true,
}, {
	path: '/timeline/list/:listId',
	component: page(() => import('@/pages/user-list-timeline.vue')),
	loginRequired: true,
}, {
	path: '/timeline/antenna/:antennaId',
	component: page(() => import('@features/timelines/frontend/pages/antenna-timeline.vue')),
	loginRequired: true,
}, {
	path: '/clicker',
	component: page(() => import('@features/games/frontend/pages/clicker.vue')),
	loginRequired: true,
}, {
	path: '/games',
	component: page(() => import('@features/games/frontend/pages/games.vue')),
	loginRequired: false,
}, {
	path: '/bubble-game',
	component: page(() => import('@features/games/frontend/pages/drop-and-fusion.vue')),
	loginRequired: true,
}, {
	path: '/reversi',
	component: page(() => import('@features/games/frontend/pages/reversi/index.vue')),
	loginRequired: false,
}, {
	path: '/reversi/g/:gameId',
	component: page(() => import('@features/games/frontend/pages/reversi/game.vue')),
	loginRequired: false,
}, {
	path: '/qr',
	component: page(() => import('@/pages/qr.vue')),
	loginRequired: true,
}, {
	path: '/debug',
	component: page(() => import('@features/ui/frontend/pages/debug.vue')),
	loginRequired: false,
}, {
	// テスト用リダイレクト設定。ログイン中ユーザのプロフィールにリダイレクトする
	path: '/redirect-test',
	redirect: $i ? `@${$i.username}` : '/',
	loginRequired: true,
}, {
	path: '/:(*)',
	component: page(loadNotFoundPage),
}] as const satisfies RouteDef[];
