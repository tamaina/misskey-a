/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { languages } from 'i18n';
import { locales } from './instance-pilot-locale-catalog.js';
import { restoreFinalOwnerHistoricalSource } from './final-owner-locale-baseline.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

const migrations = [
	{ file: 'packages/features/auth/frontend/components/MkSigninDialog.vue', keyPath: 'login' },
	{ file: 'packages/features/auth/frontend/components/MkSignupDialog.vue', keyPath: 'signup' },
	{ file: 'packages/features/auth/frontend/pages/miauth.vue', keyPath: '_auth.byClickingYouWillBeRedirectedToThisUrl' },
	{ file: 'packages/features/chat/frontend/pages/chat/home.joiningRooms.vue', keyPath: '_chat.noRooms' },
	{ file: 'packages/features/chat/frontend/pages/chat/home.ownedRooms.vue', keyPath: '_chat.noRooms' },
	{ file: 'packages/features/discovery/frontend/components/MkAutocomplete.vue', keyPath: 'selectUser' },
	{ file: 'packages/features/drive/frontend/components/MkDrive.navFolder.vue', keyPath: 'drive' },
	{ file: 'packages/features/drive/frontend/components/MkDriveWindow.vue', keyPath: 'drive' },
	{ file: 'packages/features/drive/frontend/pages/admin-file.chat.vue', keyPath: '_fileViewer.thisPageCanBeSeenFromTheAuthor' },
	{ file: 'packages/features/drive/frontend/pages/drive.file.notes.vue', keyPath: '_fileViewer.thisPageCanBeSeenFromTheAuthor' },
	{ file: 'packages/features/emojis/frontend/components/MkEmojiPicker.section.vue', keyPath: 'other' },
	{ file: 'packages/features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.logs.vue', keyPath: '_customEmojisManager._gridCommon.registrationLogs' },
	{ file: 'packages/features/markup/frontend/components/MkCodeEditor.vue', keyPath: 'save' },
	{ file: 'packages/features/drive/frontend/components/MkImageEffectorFxForm.vue', keyPath: 'nothingToConfigure' },
	{ file: 'packages/features/navigation/frontend/components/MkSuperMenu.vue', keyPath: 'search' },
	{ file: 'packages/features/notes/frontend/components/MkNoteSimple.vue', keyPath: 'deletedNote' },
	{ file: 'packages/features/notes/frontend/components/MkPostForm.TextCounter.vue', keyPath: 'textCount' },
	{ file: 'packages/features/operations/frontend/pages/admin/federation-job-queue.chart.vue', keyPath: 'noJobs' },
	{ file: 'packages/features/pages/frontend/pages/page-editor/els/page-editor.el.image.vue', keyPath: '_pages.blocks.image' },
	{ file: 'packages/features/pages/frontend/pages/page-editor/els/page-editor.el.text.vue', keyPath: '_pages.blocks.text' },
	{ file: 'packages/features/roles/frontend/pages/explore.roles.vue', keyPath: 'noRole' },
	{ file: 'packages/features/timelines/frontend/components/MkNotesTimeline.vue', keyPath: 'noNotes' },
	{ file: 'packages/features/ui/frontend/components/MkContainer.vue', keyPath: 'showMore' },
	{ file: 'packages/features/ui/frontend/components/MkInput.vue', keyPath: 'save' },
	{ file: 'packages/features/ui/frontend/components/MkKeyValue.vue', keyPath: 'copy' },
	{ file: 'packages/features/ui/frontend/components/MkMenu.vue', keyPath: 'none' },
	{ file: 'packages/features/ui/frontend/components/MkModalWindow.vue', keyPath: 'done' },
	{ file: 'packages/features/ui/frontend/components/MkOmit.vue', keyPath: 'showMore' },
	{ file: 'packages/features/users/frontend/components/MkAccountMoved.vue', keyPath: 'accountMoved' },
	{ file: 'packages/features/users/frontend/pages/user/raw.vue', keyPath: 'createdAt' },
	{ file: 'packages/features/drive/frontend/components/MkCropperDialog.vue', keyPath: 'cropImage' },
	{ file: 'packages/features/integrations/frontend/components/MkGoogle.vue', keyPath: 'searchByGoogle' },
	{ file: 'packages/features/relationships/frontend/components/MkUserList.vue', keyPath: 'noUsers' },
	{ file: 'packages/features/relationships/frontend/ui/deck/direct-column.vue', keyPath: '_deck._columns.direct' },
	{ file: 'packages/features/relationships/frontend/ui/deck/mentions-column.vue', keyPath: '_deck._columns.mentions' },
	{ file: 'packages/features/navigation/frontend/ui/visitor.vue', keyPath: 'signup' },
	{ file: 'packages/features/navigation/frontend/ui/zen.vue', keyPath: 'goToDeck' },
] as const;

const featureMigrations = [
	{
		file: 'packages/features/auth/frontend/components/MkInviteCode.vue',
		keyPaths: [
			'used',
			'expired',
			'unused',
			'copy',
			'delete',
			'invitationCode',
			'inviteCodeCreator',
			'registeredUserUsingInviteCode',
			'unknown',
			'waitingForMailAuth',
			'expirationDate',
			'inviteCodeUsedAt',
			'createdAt',
		],
	},
	{
		file: 'packages/features/auth/frontend/components/MkSignin.passkey.vue',
		keyPaths: [
			'useSecurityKey',
			'retry',
			'useTotp',
		],
	},
	{
		file: 'packages/features/boot/frontend/ui/_common_/ReloadSuggestion.vue',
		keyPaths: [
			'reloadRequiredToApplySettings',
			'reload',
			'skip',
		],
	},
	{
		file: 'packages/features/channels/frontend/components/MkChannelFollowButton.vue',
		keyPaths: [
			'unfollow',
			'follow',
			'processing',
		],
	},
	{
		file: 'packages/features/chat/frontend/components/MkChatHistories.vue',
		keyPaths: [
			'you',
			'_chat.noHistory',
		],
	},
	{
		file: 'packages/features/chat/frontend/pages/chat/home.invitations.vue',
		keyPaths: [
			'_chat.join',
			'_chat.ignore',
			'noDescription',
			'_chat.noInvitations',
		],
	},
	{
		file: 'packages/features/chat/frontend/pages/chat/room.members.vue',
		keyPaths: [
			'_chat.inviteUser',
			'_chat.sentInvitations',
		],
	},
	{
		file: 'packages/features/chat/frontend/pages/chat/room.search.vue',
		keyPaths: [
			'_chat.searchMessages',
			'search',
			'searchResult',
		],
	},
	{
		file: 'packages/features/discovery/frontend/pages/explore.featured.vue',
		keyPaths: [
			'notes',
			'poll',
		],
	},
	{
		file: 'packages/features/drive/frontend/components/MkDrive.file.vue',
		keyPaths: [
			'avatar',
			'banner',
			'sensitive',
		],
	},
	{
		file: 'packages/features/drive/frontend/components/MkDriveFileSelectDialog.vue',
		keyPaths: [
			'selectFiles',
			'selectFile',
		],
	},
	{
		file: 'packages/features/drive/frontend/components/MkDriveFolderSelectDialog.vue',
		keyPaths: [
			'selectFolders',
			'selectFolder',
		],
	},
	{
		file: 'packages/features/drive/frontend/components/MkFileCaptionEditWindow.vue',
		keyPaths: [
			'describeFile',
			'inputNewDescription',
			'caption',
		],
	},
	{
		file: 'packages/features/drive/frontend/components/MkFileListForAdmin.vue',
		keyPaths: [
			'sensitive',
			'system',
			'registeredDate',
		],
	},
	{
		file: 'packages/features/emojis/frontend/components/MkEmojiPicker.vue',
		keyPaths: [
			'search',
			'settings',
			'recentUsed',
			'customEmojis',
			'other',
			'emoji',
		],
	},
	{
		file: 'packages/features/emojis/frontend/components/MkRemoteEmojiEditDialog.vue',
		keyPaths: [
			'name',
			'host',
			'license',
			'import',
		],
	},
	{
		file: 'packages/features/federation/frontend/components/MkRemoteCaution.vue',
		keyPaths: [
			'remoteUserCaution',
			'showOnRemote',
		],
	},
	{
		file: 'packages/features/instance/frontend/pages/admin/server-rules.vue',
		keyPaths: [
			'serverRules',
			'_serverRules.description',
			'add',
			'save',
		],
	},
	{
		file: 'packages/features/integrations/frontend/pages/admin/system-webhook.item.vue',
		keyPaths: [
			'edit',
			'delete',
		],
	},
	{
		file: 'packages/features/integrations/frontend/pages/settings/webhook.new.vue',
		keyPaths: [
			'_webhookSettings.name',
			'_webhookSettings.secret',
			'_webhookSettings.trigger',
			'_webhookSettings._events.follow',
			'_webhookSettings._events.followed',
			'_webhookSettings._events.note',
			'_webhookSettings._events.reply',
			'_webhookSettings._events.renote',
			'_webhookSettings._events.reaction',
			'_webhookSettings._events.mention',
			'create',
		],
	},
	{
		file: 'packages/features/markup/frontend/components/MkCode.vue',
		keyPaths: [
			'code',
			'clickToShow',
		],
	},
	{
		file: 'packages/features/markup/frontend/components/MkUrlPreview.vue',
		keyPaths: [
			'disablePlayer',
			'close',
			'failedToPreviewUrl',
			'expandTweet',
			'enablePlayer',
			'openInWindow',
		],
	},
	{
		file: 'packages/features/drive/frontend/components/MkLightbox.item.fileinfo.vue',
		keyPaths: [
			'fileName',
			'description',
			'none',
		],
	},
	{
		file: 'packages/features/drive/frontend/components/MkMediaBanner.vue',
		keyPaths: [
			'sensitive',
			'clickToShow',
		],
	},
	{
		file: 'packages/features/navigation/frontend/ui/_common_/navbar-h.vue',
		keyPaths: [
			'timeline',
			'controlPanel',
			'settings',
		],
	},
	{
		file: 'packages/features/notes/frontend/components/MkNoteMediaGrid.vue',
		keyPaths: [
			'sensitive',
			'image',
			'clickToShow',
		],
	},
	{
		file: 'packages/features/notes/frontend/components/MkVisibilityPicker.vue',
		keyPaths: [
			'visibility',
			'_visibility.public',
			'_visibility.publicDescription',
			'_visibility.home',
			'_visibility.homeDescription',
			'_visibility.followers',
			'_visibility.followersDescription',
			'_visibility.specified',
			'_visibility.specifiedDescription',
		],
	},
	{
		file: 'packages/features/notes/frontend/pages/user/index.files.vue',
		keyPaths: [
			'files',
			'showMore',
			'nothing',
		],
	},
	{
		file: 'packages/features/notes/frontend/pages/user/notes.vue',
		keyPaths: [
			'featured',
			'notes',
			'all',
			'withFiles',
		],
	},
	{
		file: 'packages/features/notifications/frontend/components/MkStreamingNotificationsTimeline.vue',
		keyPaths: [
			'noNotifications',
			'loadMore',
		],
	},
	{
		file: 'packages/features/pages/frontend/pages/page-editor/els/page-editor.el.note.vue',
		keyPaths: [
			'_pages.blocks.note',
			'_pages.blocks._note.id',
			'_pages.blocks._note.idDescription',
			'_pages.blocks._note.detailed',
		],
	},
	{
		file: 'packages/features/preferences/frontend/ui/_common_/PreferenceRestore.vue',
		keyPaths: [
			'_preferencesBackup.backupFound',
			'restore',
			'skip',
		],
	},
	{
		file: 'packages/features/preferences/frontend/ui/_common_/ThemePreviewing.vue',
		keyPaths: [
			'previewingTheme',
			'previewingThemeRestore',
			'settings',
		],
	},
	{
		file: 'packages/features/relationships/frontend/pages/settings/mute-block.instance-mute.vue',
		keyPaths: [
			'_instanceMute.title',
			'_instanceMute.heading',
			'_instanceMute.instanceMuteDescription',
			'_instanceMute.instanceMuteDescription2',
			'save',
		],
	},
	{
		file: 'packages/features/statistics/frontend/components/MkVisitorDashboard.vue',
		keyPaths: [
			'headlineMisskey',
			'invitationRequiredToRegister',
			'federationSpecified',
			'federationDisabled',
			'joinThisServer',
			'exploreOtherServers',
			'login',
			'users',
			'notes',
			'letsLookAtTimeline',
		],
	},
	{
		file: 'packages/features/timelines/frontend/components/MkAntennaEditorDialog.vue',
		keyPaths: [
			'createAntenna',
			'editAntenna',
		],
	},
	{
		file: 'packages/features/timelines/frontend/components/MkStreamingNotesTimeline.vue',
		keyPaths: [
			'noNotes',
			'newNote',
			'loadMore',
		],
	},
	{
		file: 'packages/features/timelines/frontend/pages/user/index.timeline.vue',
		keyPaths: [
			'featured',
			'notes',
			'all',
			'withFiles',
		],
	},
	{
		file: 'packages/features/ui/frontend/components/MkPullToRefresh.vue',
		keyPaths: [
			'releaseToRefresh',
			'refreshing',
			'pullDownToRefresh',
		],
	},
	{
		file: 'packages/features/ui/frontend/components/MkSpot.vue',
		keyPaths: [
			'goBack',
			'next',
			'done',
		],
	},
	{
		file: 'packages/features/ui/frontend/components/MkSwitch.button.vue',
		keyPaths: [
			'itsOn',
			'itsOff',
		],
	},
	{
		file: 'packages/features/ui/frontend/components/MkTextarea.vue',
		keyPaths: [
			'preview',
			'save',
		],
	},
	{
		file: 'packages/features/ui/frontend/components/global/MkSuspense.vue',
		keyPaths: [
			'somethingHappened',
			'retry',
		],
	},
	{
		file: 'packages/features/users/frontend/components/MkUserInfo.vue',
		keyPaths: [
			'followsYou',
			'noAccountDescription',
			'notes',
			'following',
			'followers',
		],
	},
	{
		file: 'packages/features/users/frontend/components/MkUserPopup.vue',
		keyPaths: [
			'followsYou',
			'noAccountDescription',
			'notes',
			'following',
			'followers',
		],
	},
	{
		file: 'packages/features/users/frontend/components/MkUserSetupDialog.Follow.vue',
		keyPaths: [
			'_initialAccountSetting.followUsers',
			'recommended',
			'popularUsers',
		],
	},
	{
		file: 'packages/features/users/frontend/components/MkUserSetupDialog.User.vue',
		keyPaths: [
			'noAccountDescription',
			'follow',
			'youFollowing',
		],
	},
] as const;

function getLocaleValue(locale: string, keyPath: string): unknown {
	return keyPath.split('.').reduce<unknown>((value, key) => {
		if (value === null || typeof value !== 'object') return undefined;
		return (value as Record<string, unknown>)[key];
	}, locales[locale]);
}

describe('SFC-local locale migration', () => {
	test.each(migrations)('$file preserves all effective translations', ({ file, keyPath }) => {
		const source = restoreFinalOwnerHistoricalSource(file, readFileSync(resolve(repoRoot, file), 'utf8'));
		const localKey = keyPath.split('.').at(-1)!;
		const localReference = `$locale.sfc.${localKey}`;
		const oldReference = `i18n.ts.${keyPath}`;
		const localeBlocks = new Map<string, Record<string, unknown>>();

		for (const match of source.matchAll(/<locale\s+locale="([^"]+)"\s+lang="json">([\s\S]*?)<\/locale>/g)) {
			expect(localeBlocks.has(match[1])).toBe(false);
			localeBlocks.set(match[1], JSON.parse(match[2]) as Record<string, unknown>);
		}

		expect([...localeBlocks.keys()]).toEqual(languages);
		expect(source.split(oldReference).length - 1).toBe(0);
		expect(source.split(localReference).length - 1).toBe(1);

		for (const language of languages) {
			const actual = localeBlocks.get(language)?.[localKey];
			const expected = getLocaleValue(language, keyPath);
			expect(typeof actual).toBe('string');
			expect(actual).toBe(expected);
		}
	});
});

function countExactPropertyReference(source: string, reference: string): number {
	let count = 0;
	let offset = 0;
	while (true) {
		const index = source.indexOf(reference, offset);
		if (index === -1) return count;
		const next = source[index + reference.length];
		if (next === undefined || !/[A-Za-z0-9_$]/.test(next)) count++;
		offset = index + reference.length;
	}
}

describe('Feature SFC-local locale migration', () => {
	test.each(featureMigrations)('$file preserves all simple labels in all active locales', ({ file, keyPaths }) => {
		const source = restoreFinalOwnerHistoricalSource(file, readFileSync(resolve(repoRoot, file), 'utf8'));
		const localKeys = keyPaths.map(keyPath => keyPath.split('.').at(-1)!);
		const localeBlocks = new Map<string, Record<string, unknown>>();

		for (const match of source.matchAll(/<locale\s+locale="([^"]+)"\s+lang="json">([\s\S]*?)<\/locale>/g)) {
			expect(localeBlocks.has(match[1])).toBe(false);
			localeBlocks.set(match[1], JSON.parse(match[2]) as Record<string, unknown>);
		}

		expect([...localeBlocks.keys()]).toEqual(languages);
		expect(source).not.toMatch(/\bi18n\s*\./);
		expect(source).not.toMatch(/import\s+\{\s*i18n\s*\}\s+from\s+['"]@\/i18n(?:\.js)?['"]/);
		for (const keyPath of keyPaths) {
			const localKey = keyPath.split('.').at(-1)!;
			const oldReference = 'i18n.ts.' + keyPath;
			const localReference = '$locale.sfc.' + localKey;
			expect(countExactPropertyReference(source, oldReference)).toBe(0);
			expect(countExactPropertyReference(source, localReference)).toBe(1);
		}

		for (const language of languages) {
			const dictionary = localeBlocks.get(language)!;
			expect(Object.keys(dictionary).sort()).toEqual([...localKeys].sort());
			for (const keyPath of keyPaths) {
				const localKey = keyPath.split('.').at(-1)!;
				expect(typeof dictionary[localKey]).toBe('string');
				expect(dictionary[localKey]).toBe(getLocaleValue(language, keyPath));
			}
		}
	});
});

const additionalStaticMigrations = [
	{
		file: "packages/features/statistics/frontend/pages/admin/overview.federation.vue",
		"keyPaths": [
			{
				keyPath: "dayOverDayChanges",
				occurrences: 2
			}
		]
	},
	{
		file: "packages/features/statistics/frontend/pages/admin/overview.stats.vue",
		"keyPaths": [
			{
				keyPath: "dayOverDayChanges",
				occurrences: 2
			}
		]
	},
	{
		file: "packages/features/navigation/frontend/ui/_common_/widgets.vue",
		"keyPaths": [
			{
				keyPath: "editWidgetsExit",
				occurrences: 1
			},
			{
				keyPath: "editWidgets",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/share/frontend/pages/qr.read.raw-viewer.vue",
		"keyPaths": [
			{
				keyPath: "_qr.mfm",
				occurrences: 1
			},
			{
				keyPath: "_qr.raw",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/ui/frontend/components/MkForm.vue",
		"keyPaths": [
			{
				keyPath: "optional",
				occurrences: 6
			},
			{
				keyPath: "nothingToConfigure",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/api/frontend/ui/_common_/stream-indicator.vue",
		"keyPaths": [
			{
				keyPath: "disconnectedFromServer",
				occurrences: 1
			},
			{
				keyPath: "reload",
				occurrences: 1
			},
			{
				keyPath: "doNothing",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/chat/frontend/ui/deck/chat-column.vue",
		"keyPaths": [
			{
				keyPath: "_deck._columns.chat",
				occurrences: 1
			},
			{
				keyPath: "_chat.chatIsReadOnlyForThisAccountOrServer",
				occurrences: 1
			},
			{
				keyPath: "_chat.chatNotAvailableForThisAccountOrServer",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/navigation/frontend/ui/_common_/common.vue",
		"keyPaths": [
			{
				keyPath: "loggedInAsBot",
				occurrences: 1
			},
			{
				keyPath: "safeModeEnabled",
				occurrences: 1
			},
			{
				keyPath: "turnItOff",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/boot/frontend/components/MkUpdated.vue",
		"keyPaths": [
			{
				keyPath: "misskeyUpdated",
				occurrences: 1
			},
			{
				keyPath: "thankYouForTestingBeta",
				occurrences: 1
			},
			{
				keyPath: "whatIsNew",
				occurrences: 1
			},
			{
				keyPath: "gotIt",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/roles/frontend/components/MkRoleSelectDialog.vue",
		"keyPaths": [
			{
				keyPath: "add",
				occurrences: 1
			},
			{
				keyPath: "_roleSelectDialog.notSelected",
				occurrences: 1
			},
			{
				keyPath: "ok",
				occurrences: 1
			},
			{
				keyPath: "cancel",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/ui/frontend/components/MkWindow.vue",
		"keyPaths": [
			{
				keyPath: "windowRestore",
				occurrences: 2
			},
			{
				keyPath: "windowMinimize",
				occurrences: 1
			},
			{
				keyPath: "windowMaximize",
				occurrences: 1
			},
			{
				keyPath: "close",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/users/frontend/components/MkUserSelectDialog.vue",
		"keyPaths": [
			{
				keyPath: "selectUser",
				occurrences: 1
			},
			{
				keyPath: "username",
				occurrences: 2
			},
			{
				keyPath: "host",
				occurrences: 1
			},
			{
				keyPath: "noUsers",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/auth/frontend/components/MkForgotPassword.vue",
		"keyPaths": [
			{
				keyPath: "forgotPassword",
				occurrences: 1
			},
			{
				keyPath: "username",
				occurrences: 1
			},
			{
				keyPath: "emailAddress",
				occurrences: 1
			},
			{
				keyPath: "_forgotPassword.enterEmail",
				occurrences: 1
			},
			{
				keyPath: "send",
				occurrences: 1
			},
			{
				keyPath: "_forgotPassword.ifNoEmail",
				occurrences: 1
			},
			{
				keyPath: "_forgotPassword.contactAdmin",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/avatar-decorations/frontend/pages/settings/avatar-decoration.dialog.vue",
		"keyPaths": [
			{
				keyPath: "avatarDecorations",
				occurrences: 1
			},
			{
				keyPath: "angle",
				occurrences: 1
			},
			{
				keyPath: "position",
				occurrences: 2
			},
			{
				keyPath: "flip",
				occurrences: 1
			},
			{
				keyPath: "update",
				occurrences: 1
			},
			{
				keyPath: "detach",
				occurrences: 1
			},
			{
				keyPath: "attach",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/discovery/frontend/pages/explore.users.vue",
		"keyPaths": [
			{
				keyPath: "local",
				occurrences: 1
			},
			{
				keyPath: "remote",
				occurrences: 1
			},
			{
				keyPath: "pinnedUsers",
				occurrences: 1
			},
			{
				keyPath: "popularUsers",
				occurrences: 2
			},
			{
				keyPath: "recentlyUpdatedUsers",
				occurrences: 2
			},
			{
				keyPath: "recentlyRegisteredUsers",
				occurrences: 1
			},
			{
				keyPath: "popularTags",
				occurrences: 1
			},
			{
				keyPath: "recentlyDiscoveredUsers",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/emojis/frontend/components/MkCustomEmojiDetailedDialog.vue",
		"keyPaths": [
			{
				keyPath: "name",
				occurrences: 1
			},
			{
				keyPath: "tags",
				occurrences: 1
			},
			{
				keyPath: "none",
				occurrences: 3
			},
			{
				keyPath: "category",
				occurrences: 1
			},
			{
				keyPath: "sensitive",
				occurrences: 1
			},
			{
				keyPath: "yes",
				occurrences: 2
			},
			{
				keyPath: "no",
				occurrences: 2
			},
			{
				keyPath: "localOnly",
				occurrences: 1
			},
			{
				keyPath: "license",
				occurrences: 1
			},
			{
				keyPath: "emojiUrl",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/users/frontend/components/MkUserSetupDialog.Privacy.vue",
		"keyPaths": [
			{
				keyPath: "_initialAccountSetting.theseSettingsCanEditLater",
				occurrences: 1
			},
			{
				keyPath: "makeFollowManuallyApprove",
				occurrences: 2
			},
			{
				keyPath: "on",
				occurrences: 4
			},
			{
				keyPath: "off",
				occurrences: 4
			},
			{
				keyPath: "lockedAccountInfo",
				occurrences: 1
			},
			{
				keyPath: "hideOnlineStatus",
				occurrences: 2
			},
			{
				keyPath: "hideOnlineStatusDescription",
				occurrences: 1
			},
			{
				keyPath: "noCrawle",
				occurrences: 2
			},
			{
				keyPath: "noCrawleDescription",
				occurrences: 1
			},
			{
				keyPath: "preventAiLearning",
				occurrences: 2
			},
			{
				keyPath: "preventAiLearningDescription",
				occurrences: 1
			},
			{
				keyPath: "_initialAccountSetting.youCanEditMoreSettingsInSettingsPageLater",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/moderation/frontend/components/MkAbuseReport.vue",
		"keyPaths": [
			{
				keyPath: "_abuseUserReport.resolve",
				occurrences: 3
			},
			{
				keyPath: "_abuseUserReport.accept",
				occurrences: 1
			},
			{
				keyPath: "_abuseUserReport.reject",
				occurrences: 1
			},
			{
				keyPath: "other",
				occurrences: 1
			},
			{
				keyPath: "_abuseUserReport.forward",
				occurrences: 1
			},
			{
				keyPath: "_abuseUserReport.forwardDescription",
				occurrences: 1
			},
			{
				keyPath: "target",
				occurrences: 1
			},
			{
				keyPath: "details",
				occurrences: 1
			},
			{
				keyPath: "reporter",
				occurrences: 1
			},
			{
				keyPath: "moderationNote",
				occurrences: 1
			},
			{
				keyPath: "none",
				occurrences: 1
			},
			{
				keyPath: "moderationNoteDescription",
				occurrences: 1
			},
			{
				keyPath: "moderator",
				occurrences: 1
			}
		]
	},
	{
		file: "packages/features/boot/frontend/components/MkServerSetupWizard.vue",
		"keyPaths": [
			{
				keyPath: "instanceName",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.howWillYouUseMisskey",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._use.single",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._use.single_description",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._use.group",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._use.group_description",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._use.open",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._use.open_description",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._use.single_youCanCreateMultipleAccounts",
				occurrences: 1
			},
			{
				keyPath: "advice",
				occurrences: 3
			},
			{
				keyPath: "_serverSetupWizard.openServerAdvice",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.openServerAntiSpamAdvice",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.howManyUsersDoYouExpect",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._scale.small",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._scale.medium",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard._scale.large",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.largeScaleServerAdvice",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.doYouConnectToFediverse",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.doYouConnectToFediverse_description1",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.doYouConnectToFediverse_description2",
				occurrences: 1
			},
			{
				keyPath: "learnMore",
				occurrences: 1
			},
			{
				keyPath: "yes",
				occurrences: 14
			},
			{
				keyPath: "no",
				occurrences: 15
			},
			{
				keyPath: "_serverSetupWizard.youCanConfigureMoreFederationSettingsLater",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.remoteContentsCleaning",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.remoteContentsCleaning_description",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.adminInfo",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.adminInfo_description",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.adminInfo_mustBeFilled",
				occurrences: 1
			},
			{
				keyPath: "maintainerName",
				occurrences: 1
			},
			{
				keyPath: "maintainerEmail",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.followingSettingsAreRecommended",
				occurrences: 1
			},
			{
				keyPath: "_serverSettings.singleUserMode",
				occurrences: 1
			},
			{
				keyPath: "_serverSettings.openRegistration",
				occurrences: 1
			},
			{
				keyPath: "emailRequiredForSignup",
				occurrences: 1
			},
			{
				keyPath: "federation",
				occurrences: 1
			},
			{
				keyPath: "all",
				occurrences: 1
			},
			{
				keyPath: "_serverSettings.remoteNotesCleaning",
				occurrences: 1
			},
			{
				keyPath: "_serverSettings.fanoutTimelineDbFallback",
				occurrences: 1
			},
			{
				keyPath: "_serverSettings.entrancePageStyle",
				occurrences: 1
			},
			{
				keyPath: "_role.baseRole",
				occurrences: 10
			},
			{
				keyPath: "_role._options.rateLimitFactor",
				occurrences: 1
			},
			{
				keyPath: "_role._options.driveCapacity",
				occurrences: 1
			},
			{
				keyPath: "_role._options.userListMax",
				occurrences: 1
			},
			{
				keyPath: "_role._options.antennaMax",
				occurrences: 1
			},
			{
				keyPath: "_role._options.webhookMax",
				occurrences: 1
			},
			{
				keyPath: "_role._options.canImportFollowing",
				occurrences: 1
			},
			{
				keyPath: "_role._options.canImportMuting",
				occurrences: 1
			},
			{
				keyPath: "_role._options.canImportBlocking",
				occurrences: 1
			},
			{
				keyPath: "_role._options.canImportUserLists",
				occurrences: 1
			},
			{
				keyPath: "_role._options.canImportAntennas",
				occurrences: 1
			},
			{
				keyPath: "_serverSetupWizard.applyTheseSettings",
				occurrences: 1
			}
		]
	}
] as const;

describe('Additional static SFC-local locale migrations', () => {
	test.each(additionalStaticMigrations)('$file preserves every static label in all active locales', ({ file, keyPaths }) => {
		const source = restoreFinalOwnerHistoricalSource(file, readFileSync(resolve(repoRoot, file), 'utf8'));
		const localKeys = keyPaths.map(({ keyPath }) => keyPath.split('.').at(-1)!);
		const localeBlocks = new Map<string, Record<string, unknown>>();

		for (const match of source.matchAll(/<locale\s+locale="([^"]+)"\s+lang="json">([\s\S]*?)<\/locale>/g)) {
			expect(localeBlocks.has(match[1])).toBe(false);
			localeBlocks.set(match[1], JSON.parse(match[2]) as Record<string, unknown>);
		}

		expect([...localeBlocks.keys()]).toEqual(languages);
		expect(source).not.toMatch(/\bi18n\s*\./);
		expect(source).not.toMatch(/import\s+\{\s*i18n\s*\}\s+from\s+['"](?:@\/|@features\/runtime\/frontend\/)i18n(?:\.js)?['"]/);
		for (const { keyPath, occurrences } of keyPaths) {
			const localKey = keyPath.split('.').at(-1)!;
			const oldReference = 'i18n.ts.' + keyPath;
			const localReference = '$locale.sfc.' + localKey;
			expect(countExactPropertyReference(source, oldReference)).toBe(0);
			expect(countExactPropertyReference(source, localReference)).toBe(occurrences);
		}

		for (const language of languages) {
			const dictionary = localeBlocks.get(language)!;
			expect(Object.keys(dictionary).sort()).toEqual([...localKeys].sort());
			for (const { keyPath } of keyPaths) {
				const localKey = keyPath.split('.').at(-1)!;
				expect(typeof dictionary[localKey]).toBe('string');
				expect(dictionary[localKey]).toBe(getLocaleValue(language, keyPath));
			}
		}
	});
});
