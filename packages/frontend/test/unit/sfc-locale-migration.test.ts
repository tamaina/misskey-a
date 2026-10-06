/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { languages, locales } from 'i18n';

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
	{ file: 'packages/features/media/frontend/components/MkImageEffectorFxForm.vue', keyPath: 'nothingToConfigure' },
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
	{ file: 'packages/frontend/src/components/MkCropperDialog.vue', keyPath: 'cropImage' },
	{ file: 'packages/frontend/src/components/MkGoogle.vue', keyPath: 'searchByGoogle' },
	{ file: 'packages/frontend/src/components/MkUserList.vue', keyPath: 'noUsers' },
	{ file: 'packages/frontend/src/ui/deck/direct-column.vue', keyPath: '_deck._columns.direct' },
	{ file: 'packages/frontend/src/ui/deck/mentions-column.vue', keyPath: '_deck._columns.mentions' },
	{ file: 'packages/frontend/src/ui/visitor.vue', keyPath: 'signup' },
	{ file: 'packages/frontend/src/ui/zen.vue', keyPath: 'goToDeck' },
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
		file: 'packages/features/media/frontend/components/MkLightbox.item.fileinfo.vue',
		keyPaths: [
			'fileName',
			'description',
			'none',
		],
	},
	{
		file: 'packages/features/media/frontend/components/MkMediaBanner.vue',
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
		const source = readFileSync(resolve(repoRoot, file), 'utf8');
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
		const source = readFileSync(resolve(repoRoot, file), 'utf8');
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
