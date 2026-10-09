/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toUnicode } from 'punycode.js';
import { defineAsyncComponent, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { host, url } from '@features/boot/frontend/shared/config.js';
import type { Router } from '@features/navigation/frontend/router.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import FeatureLocaleMessages from '@features/users/frontend/ts-messages.vue';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { $i, iAmModerator } from '@features/auth/frontend/i.js';
import { notesSearchAvailable, canSearchNonLocalNotes } from '@features/roles/frontend/utility/check-permissions.js';
import { antennasCache, rolesCache, userListsCache } from '@features/runtime/frontend/cache.js';
import { mainRouter } from '@features/navigation/frontend/router.js';
import { genEmbedCode } from '@features/web/frontend/utility/get-embed-code.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { getPluginHandlers } from '@features/integrations/frontend/plugin.js';

export function getUserMenu(user: Misskey.entities.UserDetailed, router: Router = mainRouter) {
	const meId = $i ? $i.id : null;

	const cleanups = [] as (() => void)[];

	async function toggleMute() {
		if (user.isMuted) {
			os.apiWithDialog('mute/delete', {
				userId: user.id,
			}).then(() => {
				user.isMuted = false;
			});
		} else {
			const { canceled, result: period } = await os.select({
				title: FeatureLocaleMessages.$locale.mutePeriod,
				items: [{
					value: 'indefinitely', label: FeatureLocaleMessages.$locale.indefinitely,
				}, {
					value: 'tenMinutes', label: FeatureLocaleMessages.$locale.tenMinutes,
				}, {
					value: 'oneHour', label: FeatureLocaleMessages.$locale.oneHour,
				}, {
					value: 'oneDay', label: FeatureLocaleMessages.$locale.oneDay,
				}, {
					value: 'oneWeek', label: FeatureLocaleMessages.$locale.oneWeek,
				}],
				default: 'indefinitely',
			});
			if (canceled) return;

			const expiresAt = period === 'indefinitely' ? null
				: period === 'tenMinutes' ? Date.now() + (1000 * 60 * 10)
				: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
				: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
				: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
				: null;

			os.apiWithDialog('mute/create', {
				userId: user.id,
				expiresAt,
			}).then(() => {
				user.isMuted = true;
			});
		}
	}

	async function toggleRenoteMute() {
		os.apiWithDialog(user.isRenoteMuted ? 'renote-mute/delete' : 'renote-mute/create', {
			userId: user.id,
		}).then(() => {
			user.isRenoteMuted = !user.isRenoteMuted;
		});
	}

	async function toggleBlock() {
		if (!await getConfirmed(user.isBlocking ? FeatureLocaleMessages.$locale.unblockConfirm : FeatureLocaleMessages.$locale.blockConfirm)) return;

		os.apiWithDialog(user.isBlocking ? 'blocking/delete' : 'blocking/create', {
			userId: user.id,
		}).then(() => {
			user.isBlocking = !user.isBlocking;
		});
	}

	async function toggleNotify() {
		os.apiWithDialog('following/update', {
			userId: user.id,
			notify: user.notify === 'normal' ? 'none' : 'normal',
		}).then(() => {
			user.notify = user.notify === 'normal' ? 'none' : 'normal';
		});
	}

	async function reportAbuse() {
		const { dispose } = await os.popupAsyncWithDialog(import('@features/moderation/frontend/components/MkAbuseReportWindow.vue').then(x => x.default), {
			user: user,
		}, {
			closed: () => dispose(),
		});
	}

	async function getConfirmed(text: string): Promise<boolean> {
		const confirm = await os.confirm({
			type: 'warning',
			title: 'confirm',
			text,
		});

		return !confirm.canceled;
	}

	async function userInfoUpdate() {
		os.apiWithDialog('federation/update-remote-user', {
			userId: user.id,
		});
	}

	async function invalidateFollow() {
		if (!await getConfirmed(FeatureLocaleMessages.$locale.breakFollowConfirm)) return;

		os.apiWithDialog('following/invalidate', {
			userId: user.id,
		}).then(() => {
			user.isFollowed = !user.isFollowed;
		});
	}

	async function editMemo(): Promise<void> {
		const userDetailed = await misskeyApi('users/show', {
			userId: user.id,
		});

		const { canceled, result } = await os.form(FeatureLocaleMessages.$locale.editMemo, {
			memo: {
				type: 'string',
				required: true,
				multiline: true,
				label: FeatureLocaleMessages.$locale.memo,
				default: userDetailed.memo,
			},
		});

		if (canceled) return;

		os.apiWithDialog('users/update-memo', {
			memo: result.memo,
			userId: user.id,
		});
	}

	const menuItems: MenuItem[] = [];

	if (iAmModerator) {
		menuItems.push({
			icon: 'ti ti-user-exclamation',
			text: FeatureLocaleMessages.$locale.moderation,
			action: () => {
				router.push('/admin/user/:userId', {
					params: {
						userId: user.id,
					},
				});
			},
		}, { type: 'divider' });
	}

	menuItems.push({
		icon: 'ti ti-at',
		text: FeatureLocaleMessages.$locale.copyUsername,
		action: () => {
			copyToClipboard(`@${user.username}@${user.host ?? host}`);
		},
	});

	menuItems.push({
		icon: 'ti ti-share',
		text: FeatureLocaleMessages.$locale.copyProfileUrl,
		action: () => {
			const canonical = user.host === null ? `@${user.username}` : `@${user.username}@${toUnicode(user.host)}`;
			copyToClipboard(`${url}/${canonical}`);
		},
	});

	menuItems.push({
		icon: 'ti ti-rss',
		text: FeatureLocaleMessages.$locale.copyRSS,
		action: () => {
			copyToClipboard(`${user.host ?? host}/@${user.username}.atom`);
		},
	});

	if (user.host != null && user.url != null) {
		menuItems.push({
			icon: 'ti ti-external-link',
			text: FeatureLocaleMessages.$locale.showOnRemote,
			action: () => {
				if (user.url == null) return;
				window.open(user.url, '_blank', 'noopener');
			},
		});
	} else {
		menuItems.push({
			icon: 'ti ti-code',
			text: FeatureLocaleMessages.$locale.embed,
			type: 'parent',
			children: [{
				text: FeatureLocaleMessages.$locale.noteOfThisUser,
				action: () => {
					genEmbedCode('user-timeline', user.id);
				},
			}], // TODO: ユーザーカードの埋め込みなど
		});
	}

	if ($i && meId === user.id) {
		menuItems.push({
			icon: 'ti ti-qrcode',
			text: FeatureLocaleMessages.$locale.qr,
			action: () => {
				router.push('/qr');
			},
		});
	}

	if (notesSearchAvailable && (user.host == null || canSearchNonLocalNotes)) {
		menuItems.push({
			icon: 'ti ti-search',
			text: FeatureLocaleMessages.$locale.searchThisUsersNotes,
			action: () => {
				const query = {
						username: user.username,
					} as { username: string, host?: string };

				if (user.host !== null) {
					query.host = user.host;
				}

				router.push('/search', {
					query
				});
			},
		});
	}

	if ($i) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-pencil',
			text: FeatureLocaleMessages.$locale.editMemo,
			action: editMemo,
		}, {
			type: 'parent',
			icon: 'ti ti-list',
			text: FeatureLocaleMessages.$locale.addToList,
			children: async () => {
				const lists = await userListsCache.fetch();
				return lists.map(list => {
					const isListed = ref(list.userIds?.includes(user.id) ?? false);
					cleanups.push(watch(isListed, () => {
						if (isListed.value) {
							os.apiWithDialog('users/lists/push', {
								listId: list.id,
								userId: user.id,
							}).then(() => {
								list.userIds?.push(user.id);
							});
						} else {
							os.apiWithDialog('users/lists/pull', {
								listId: list.id,
								userId: user.id,
							}).then(() => {
								list.userIds?.splice(list.userIds.indexOf(user.id), 1);
							});
						}
					}));

					return {
						type: 'switch',
						text: list.name,
						ref: isListed,
					};
				});
			},
		}, {
			type: 'parent',
			icon: 'ti ti-antenna',
			text: FeatureLocaleMessages.$locale.addToAntenna,
			children: async () => {
				const antennas = await antennasCache.fetch();
				const canonical = user.host === null ? `@${user.username}` : `@${user.username}@${toUnicode(user.host)}`;
				return antennas.filter((a) => a.src === 'users').map(antenna => ({
					text: antenna.name,
					action: async () => {
						await os.apiWithDialog('antennas/update', {
							antennaId: antenna.id,
							name: antenna.name,
							keywords: antenna.keywords,
							excludeKeywords: antenna.excludeKeywords,
							src: antenna.src,
							userListId: antenna.userListId,
							users: [...antenna.users, canonical],
							caseSensitive: antenna.caseSensitive,
							withReplies: antenna.withReplies,
							withFile: antenna.withFile,
						});
						antennasCache.delete();
					},
				}));
			},
		});
	}

	if ($i && meId !== user.id) {
		if (iAmModerator) {
			menuItems.push({
				type: 'parent',
				icon: 'ti ti-badges',
				text: FeatureLocaleMessages.$locale.roles,
				children: async () => {
					const roles = await rolesCache.fetch();

					return roles.filter(r => r.target === 'manual').map(r => ({
						text: r.name,
						action: async () => {
							const { canceled, result: period } = await os.select({
								title: FeatureLocaleMessages.$locale.period + ': ' + r.name,
								items: [{
									value: 'indefinitely', label: FeatureLocaleMessages.$locale.indefinitely,
								}, {
									value: 'oneHour', label: FeatureLocaleMessages.$locale.oneHour,
								}, {
									value: 'oneDay', label: FeatureLocaleMessages.$locale.oneDay,
								}, {
									value: 'oneWeek', label: FeatureLocaleMessages.$locale.oneWeek,
								}, {
									value: 'oneMonth', label: FeatureLocaleMessages.$locale.oneMonth,
								}],
								default: 'indefinitely',
							});
							if (canceled) return;

							const expiresAt = period === 'indefinitely' ? null
								: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
								: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
								: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
								: period === 'oneMonth' ? Date.now() + (1000 * 60 * 60 * 24 * 30)
								: null;

							os.apiWithDialog('admin/roles/assign', { roleId: r.id, userId: user.id, expiresAt });
						},
					}));
				},
			});
		}

		// フォローしたとしても user.isFollowing はリアルタイム更新されないので不便なため
		//if (user.isFollowing) {
		const withRepliesRef = ref(user.withReplies ?? false);

		menuItems.push({
			type: 'switch',
			icon: 'ti ti-messages',
			text: FeatureLocaleMessages.$locale.showRepliesToOthersInTimeline,
			ref: withRepliesRef,
		}, {
			icon: user.notify === 'none' ? 'ti ti-bell' : 'ti ti-bell-off',
			text: user.notify === 'none' ? FeatureLocaleMessages.$locale.notifyNotes : FeatureLocaleMessages.$locale.unnotifyNotes,
			action: toggleNotify,
		});

		watch(withRepliesRef, (withReplies) => {
			misskeyApi('following/update', {
				userId: user.id,
				withReplies,
			}).then(() => {
				user.withReplies = withReplies;
			});
		});
		//}

		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-pencil-heart',
			text: FeatureLocaleMessages.$locale.createUserSpecifiedNote,
			action: () => {
				const canonical = user.host === null ? `@${user.username}` : `@${user.username}@${user.host}`;
				os.post({ specified: user, initialText: `${canonical} ` });
			},
		});

		if ($i.policies.chatAvailability === 'available' && user.canChat && user.host == null) {
			menuItems.push({
				type: 'link',
				icon: 'ti ti-messages',
				text: FeatureLocaleMessages.$locale._chat.chatWithThisUser,
				to: `/chat/user/${user.id}`,
			});
		}

		menuItems.push({ type: 'divider' }, {
			icon: user.isMuted ? 'ti ti-eye' : 'ti ti-eye-off',
			text: user.isMuted ? FeatureLocaleMessages.$locale.unmute : FeatureLocaleMessages.$locale.mute,
			action: toggleMute,
		}, {
			icon: user.isRenoteMuted ? 'ti ti-repeat' : 'ti ti-repeat-off',
			text: user.isRenoteMuted ? FeatureLocaleMessages.$locale.renoteUnmute : FeatureLocaleMessages.$locale.renoteMute,
			action: toggleRenoteMute,
		}, {
			icon: 'ti ti-ban',
			text: user.isBlocking ? FeatureLocaleMessages.$locale.unblock : FeatureLocaleMessages.$locale.block,
			action: toggleBlock,
		});

		if (user.isFollowed) {
			menuItems.push({
				icon: 'ti ti-link-off',
				text: FeatureLocaleMessages.$locale.breakFollow,
				action: invalidateFollow,
			});
		}

		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-exclamation-circle',
			text: FeatureLocaleMessages.$locale.reportAbuse,
			action: reportAbuse,
		});
	}

	if ($i != null && user.host !== null) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-refresh',
			text: FeatureLocaleMessages.$locale.updateRemoteUser,
			action: userInfoUpdate,
		});
	}

	if (prefer.s.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: FeatureLocaleMessages.$locale.copyUserId,
			action: () => {
				copyToClipboard(user.id);
			},
		});
	}

	if ($i && meId === user.id) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-pencil',
			text: FeatureLocaleMessages.$locale.editProfile,
			action: () => {
				router.push('/settings/profile');
			},
		});
	}

	const userActions = getPluginHandlers('user_action');
	if (userActions.length > 0) {
		menuItems.push({ type: 'divider' }, ...userActions.map(action => ({
			icon: 'ti ti-plug',
			text: action.title,
			action: () => {
				action.handler(user);
			},
		})));
	}

	return {
		menu: menuItems,
		cleanup: () => {
			if (_DEV_) console.log('user menu cleanup', cleanups);
			for (const cl of cleanups) {
				cl();
			}
		},
	};
}
