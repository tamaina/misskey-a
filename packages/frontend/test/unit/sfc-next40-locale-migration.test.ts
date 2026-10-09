/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { restoreRssContractBaseline } from './rss-contract-source-rebase.js';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import * as Vue from 'vue';
import { compileScript, parse } from 'vue/compiler-sfc';
import ts from 'typescript';
import { describe, expect, test, vi } from 'vitest';
import { getLocaleMessageNamedKeys } from 'vite-vue-internationalization';
import * as VviRuntime from 'vite-vue-internationalization/runtime';
import { languages, locales } from 'i18n';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import type { Component } from 'vue';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

// Frozen source hashes and access boundaries for this bounded migration batch.
const migrationInputs = [
	{ file: 'packages/features/operations/frontend/pages/admin/job-queue.job.vue', sha256: 'de903947e53e8bcc12f980aea606593400fca33fe8c66ad576e8796cfaa3af56', importOffset: 7029, localeSeparatorNewlines: 1, references: [['ts', 'areYouSure', true], ['ts', 'areYouSure', true]] },
	{ file: 'packages/features/relationships/frontend/widgets/WidgetBirthdayFollowings.user.vue', sha256: '3764d3854cf8ea625adae490c3f30081f6fd6c7e57a2eb0d087016069fb18efe', importOffset: 1032, localeSeparatorNewlines: 1, references: [['ts', 'note', false], ['ts', 'today', true], ['tsx', '_timeIn.days', true], ['tsx', '_ago.daysAgo', true]] },
	{ file: 'packages/features/relationships/frontend/widgets/WidgetUserList.vue', sha256: '39ff3c6e86b1ef326d9c73a57c3edb8d0757a557cf97cc3b596c1beecba72bd0', importOffset: 1595, localeSeparatorNewlines: 1, references: [['ts', '_widgets.userList', false], ['ts', '_widgets._userList.chooseList', false], ['ts', '_widgetOptions.showHeader', true], ['ts', 'selectList', true]] },
	{ file: 'packages/features/ui/frontend/widgets/WidgetUnixClock.vue', sha256: '3f7eecb40dce38777347c0407482d5ae58452ac1bd893ef524e5abd0ea5c6865', importOffset: 797, localeSeparatorNewlines: 1, references: [['ts', '_widgetOptions.transparent', true], ['ts', 'fontSize', true], ['ts', '_widgetOptions._clock.showMs', true], ['ts', '_widgetOptions._clock.showLabel', true]] },
	{ file: 'packages/features/users/frontend/components/MkUserOnlineIndicator.vue', sha256: '26e42dcca4c8f04dfbeaa09a7faa980d185f642f07a7a7e2967e6f8e64af3562', importOffset: 517, localeSeparatorNewlines: 1, references: [['ts', 'online', true], ['ts', 'active', true], ['ts', 'offline', true], ['ts', 'unknown', true]] },
	{ file: 'packages/features/web/frontend/widgets/WidgetRss.vue', sha256: '053d1f177bc439e6bb75efc753eaf03c833f1c3900dad46f839de7a9a8c3ffa2', importOffset: 1476, localeSeparatorNewlines: 1, references: [['ts', '_widgetOptions._rss.url', true], ['ts', '_widgetOptions._rss.refreshIntervalSec', true], ['ts', '_widgetOptions._rss.maxEntries', true], ['ts', '_widgetOptions.showHeader', true]] },
	{ file: 'packages/features/chat/frontend/pages/chat/room.form.vue', sha256: 'c3dbd22fd5cccf3369df57fa6f3396a52cea6c0ba5fb93f78936cd9a638d7f7f', importOffset: 1617, localeSeparatorNewlines: 1, references: [['ts', 'inputMessageHere', false], ['ts', 'send', false], ['ts', 'onlyOneFileCanBeAttached', true], ['ts', 'onlyOneFileCanBeAttached', true], ['ts', 'selectFile', true]] },
	{ file: 'packages/features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.search.vue', sha256: 'bddd95f523ecbe2977b24b931754b7b7f6f058718884ba30fb0efbe2aaac1d74', importOffset: 3618, localeSeparatorNewlines: 1, references: [['ts', 'search', false], ['ts', '_customEmojisManager._gridCommon.sortOrder', false], ['ts', 'search', false], ['ts', 'reset', false], ['ts', '_customEmojisManager._local._list.dialogSelectRoleTitle', true]] },
	{ file: 'packages/features/chat/frontend/pages/chat/home.vue', sha256: '0e6635dbc9dcb0b6b4e113f970f07f7759a4a329e53d08fee85e6d782b1f7480', importOffset: 964, localeSeparatorNewlines: 1, references: [['ts', '_chat.home', true], ['ts', '_chat.invitations', true], ['ts', '_chat.joiningRooms', true], ['ts', '_chat.yourRooms', true], ['ts', 'directMessage', true]] },
	{ file: 'packages/features/discovery/frontend/pages/search.vue', sha256: '59bc98d95c3da2f8874d097ab100f907d28a09e3f20cd87327ffd14b17233bcb', importOffset: 900, localeSeparatorNewlines: 1, references: [['ts', 'notesSearchNotAvailable', false], ['ts', 'usersSearchNotAvailable', false], ['ts', 'notes', true], ['ts', 'users', true], ['ts', 'search', true]] },
	{ file: 'packages/features/emojis/frontend/pages/admin/custom-emojis-manager.logs.vue', sha256: '09370dce117d8b237b30f7b8bf42062f3bcf817654e8ee338eece3a3cb25d8e2', importOffset: 788, localeSeparatorNewlines: 1, references: [['ts', '_customEmojisManager._logs.showSuccessLogSwitch', false], ['ts', '_customEmojisManager._logs.failureLogNothing', false], ['ts', '_customEmojisManager._logs.logNothing', false], ['ts', '_customEmojisManager._gridCommon.copySelectionRows', true], ['ts', '_customEmojisManager._gridCommon.copySelectionRanges', true]] },
	{ file: 'packages/features/instance/frontend/pages/about.vue', sha256: 'aaedc9db4a10607c629c7588a8b7e5d521fd4f7de9ddd9e1367d60c34db10939', importOffset: 953, localeSeparatorNewlines: 1, references: [['ts', 'overview', true], ['ts', 'customEmojis', true], ['ts', 'federation', true], ['ts', 'charts', true], ['ts', 'instanceInfo', true]] },
	{ file: 'packages/features/pages/frontend/pages/pages.vue', sha256: '77029f86e7b421f6204fb677d667679432cf58807f53dfaba27e9a8e5800df7a', importOffset: 1420, localeSeparatorNewlines: 1, references: [['ts', 'create', true], ['ts', '_pages.featured', true], ['ts', '_pages.my', true], ['ts', '_pages.liked', true], ['ts', 'pages', true]] },
	{ file: 'packages/features/play/frontend/pages/scratchpad.vue', sha256: '84304094af0023788e9e5aa95196b29aa4831fa0116091d22e8978d3d2864e32', importOffset: 2972, localeSeparatorNewlines: 1, references: [['ts', 'output', false], ['ts', 'uiInspector', false], ['ts', 'uiInspectorDescription', false], ['ts', 'scratchpadDescription', false], ['ts', 'scratchpad', true]] },
	{ file: 'packages/features/statistics/frontend/pages/user/index.activity.vue', sha256: '43838355cdd1092be276949897aaf4f806bae4c337eadb27cd4890257c8e8e74', importOffset: 919, localeSeparatorNewlines: 1, references: [['ts', 'activity', false], ['ts', 'notes', true], ['ts', 'numberOfProfileView', true], ['ts', 'following', true], ['ts', 'followers', true]] },
	{ file: 'packages/features/play/frontend/pages/flash/flash-index.vue', sha256: '479477b4154744dd013e4d770e0bd111013b93d34692cad19ac465cfbe8bde19', importOffset: 2247, localeSeparatorNewlines: 1, references: [['ts', 'search', false], ['ts', 'create', true], ['ts', 'search', true], ['ts', '_play.featured', true], ['ts', '_play.my', true], ['ts', '_play.liked', true]] },
	{ file: 'packages/features/roles/frontend/pages/admin/roles.policy-editor.folder.vue', sha256: '2ce092650791f7d298bc5c1be6c0c77ca057b8e540e9be800c633085109947b9', importOffset: 1499, localeSeparatorNewlines: 1, references: [['ts', '_role.useBaseValue', false], ['ts', '_role.useBaseValue', false], ['ts', '_role.priority', false], ['ts', '_role._priority.low', true], ['ts', '_role._priority.middle', true], ['ts', '_role._priority.high', true]] },
	{ file: 'packages/features/chat/frontend/pages/chat/room.info.vue', sha256: '6b86f3491f0721d43ab63ea9ab4073459df53a7b3501dc04e11c32dd77767ec7', importOffset: 900, localeSeparatorNewlines: 1, references: [['ts', 'name', false], ['ts', 'description', false], ['ts', 'save', false], ['ts', '_chat.deleteRoom', false], ['ts', '_chat.muteThisRoom', false], ['tsx', 'deleteAreYouSure', true]] },
	{ file: 'packages/features/drive/frontend/pages/settings/drive-cleaner.vue', sha256: '95884fa5e70ef74eb4ca057782937cc92561403fa5bec4a3e9ce797d2f732009', importOffset: 1931, localeSeparatorNewlines: 1, references: [['ts', 'sort', false], ['ts', 'sensitive', false], ['ts', 'registeredDate', false], ['ts', '_drivecleaner.orderBySizeDesc', true], ['ts', '_drivecleaner.orderByCreatedAtAsc', true], ['ts', 'drivecleaner', true]] },
	{ file: 'packages/features/relationships/frontend/pages/list.vue', sha256: '299472293b65a49e401ab4136f4f1c30ebb8bdb3567e3c4d0d008c6306ddcb96', importOffset: 1645, localeSeparatorNewlines: 1, references: [['ts', 'members', false], ['ts', 'unlike', false], ['ts', 'like', false], ['ts', 'import', false], ['ts', 'enterListName', true], ['ts', 'lists', true]] },
	{ file: 'packages/features/relationships/frontend/pages/settings/mute-block.word-mute.vue', sha256: '393bcabd4665dc99eb9fa098f5c5b9fad089a4fa3e5dede93d3cff5d10d0fb94', importOffset: 780, localeSeparatorNewlines: 1, references: [['ts', '_wordMute.muteWords', false], ['ts', '_wordMute.muteWordsDescription', false], ['ts', '_wordMute.muteWordsDescription2', false], ['ts', 'save', false], ['ts', 'regexpError', true], ['tsx', 'regexpErrorDescription', true]] },
	{ file: 'packages/features/roles/frontend/pages/admin/roles.vue', sha256: 'edb0cb6bdc53247b2babc05f4635b782f8c4d7e1218e12c95319c37a58778d49', importOffset: 2096, localeSeparatorNewlines: 1, references: [['ts', '_role.baseRole', false], ['ts', 'save', false], ['ts', '_role.new', false], ['ts', '_role.manualRoles', false], ['ts', '_role.conditionalRoles', false], ['ts', 'roles', true]] },
	{ file: 'packages/features/ui/frontend/widgets/WidgetDigitalClock.vue', sha256: '1833b2c4ccbab356880a16a418da2b6198be8f08b16ab442593e43832eec9851', importOffset: 924, localeSeparatorNewlines: 1, references: [['ts', '_widgetOptions.transparent', true], ['ts', 'fontSize', true], ['ts', '_widgetOptions._clock.showMs', true], ['ts', '_widgetOptions._clock.showLabel', true], ['ts', '_widgetOptions._clock.timezone', true], ['ts', 'auto', true]] },
	{ file: 'packages/features/auth/frontend/pages/settings/accounts.vue', sha256: '22bd6ac4a31420b466050b0a765da8ba7e007f3a6daaf43a5ccb37e7faf5c0fe', importOffset: 1283, localeSeparatorNewlines: 1, references: [['ts', 'accounts', false], ['ts', 'addAccount', false], ['ts', 'switch', true], ['ts', 'remove', true], ['ts', 'existingAccount', true], ['ts', 'createAccount', true], ['ts', 'accounts', true]] },
	{ file: 'packages/features/pages/frontend/components/MkPageWindow.vue', sha256: '033c5b625781ca2a542cd7f79b8156d47743a936e413e7ab982550479cca04f6', importOffset: 1411, localeSeparatorNewlines: 1, references: [['ts', 'goBack', true], ['ts', 'reload', true], ['ts', 'showInPage', true], ['ts', 'showInPage', true], ['ts', 'popout', true], ['ts', 'openInNewTab', true], ['ts', 'copyLink', true]] },
	{ file: 'packages/features/preferences/frontend/pages/registry.vue', sha256: '92a35068f5ee24c2729800e7dd7c042d7e4f0b5f673ec3a73deb433fb32ac62d', importOffset: 1119, localeSeparatorNewlines: 1, references: [['ts', '_registry.createKey', false], ['ts', 'system', false], ['ts', '_registry.createKey', true], ['ts', '_registry.key', true], ['ts', 'value', true], ['ts', '_registry.scope', true], ['ts', 'registry', true]] },
	{ file: 'packages/features/roles/frontend/pages/role.vue', sha256: '69b95512bd7cd743bf690bcd9afed35eecf46e9a023d11efb9dbabf6a66f8a32', importOffset: 1260, localeSeparatorNewlines: 1, references: [['ts', 'nothing', false], ['ts', 'nothing', false], ['ts', 'noRole', true], ['ts', 'somethingHappened', true], ['ts', 'users', true], ['ts', 'timeline', true], ['ts', 'role', true]] },
	{ file: 'packages/features/timelines/frontend/ui/deck/antenna-column.vue', sha256: '135a105867c4c222b9704f607af9c7e066e7b658941709db5459bcfb2223773e', importOffset: 1385, localeSeparatorNewlines: 1, references: [['ts', '_deck._columns.antenna', false], ['ts', 'selectAntenna', true], ['ts', 'createNew', true], ['ts', 'createdAntennas', true], ['ts', 'selectAntenna', true], ['ts', 'editAntenna', true], ['ts', '_deck.newNoteNotificationSettings', true]] },
	{ file: 'packages/features/ui/frontend/components/MkPaginationControl.vue', sha256: '48a07f1b71ec7f9be5c67910c22e19db56aadec75ce4a9851dabb13b88aa7c80', importOffset: 1718, localeSeparatorNewlines: 1, references: [['ts', 'search', false], ['ts', 'filter', false], ['ts', 'dateAndTime', false], ['ts', 'reload', false], ['ts', 'search', false], ['ts', '_order.newest', true], ['ts', '_order.oldest', true]] },
	{ file: 'packages/features/instance/frontend/pages/contact.vue', sha256: 'e29eeb1f0ec86cac641cbb652dcf77c753c5ccb2df699274666b1845707fcf0e', importOffset: 1694, localeSeparatorNewlines: 1, references: [['ts', 'administrator', false], ['ts', 'none', false], ['ts', 'contact', false], ['ts', 'none', false], ['ts', 'inquiry', false], ['ts', 'none', false], ['ts', 'deviceInfo', false], ['ts', 'deviceInfoDescription', false], ['ts', 'inquiry', true]] },
	{ file: 'packages/features/announcements/frontend/pages/announcement.vue', sha256: 'a511e19b1ee6a02578a7fb24ed3291f6098dd91639fd14e3d4dc36c018860642', importOffset: 2616, localeSeparatorNewlines: 1, references: [['ts', 'forYou', false], ['ts', 'createdAt', false], ['ts', 'updatedAt', false], ['ts', 'gotIt', false], ['ts', '_announcement.readConfirmTitle', true], ['tsx', '_announcement.readConfirmText', true], ['ts', 'announcements', true]] },
	{ file: 'packages/features/emojis/frontend/components/global/MkEmoji.vue', sha256: 'ead6d1a851b6081ab9f6e28142ab987fdb8176246427227b659a4769c9a7103e', importOffset: 1034, localeSeparatorNewlines: 1, references: [['tsx', 'muteX', true], ['tsx', 'unmuteX', true], ['ts', 'copy', true], ['ts', 'doReaction', true], ['ts', 'emojiUnmute', true], ['ts', 'emojiMute', true], ['ts', 'addToEmojiPalette', true]] },
	{ file: 'packages/features/drive/frontend/components/MkTutorialDialog.Sensitive.vue', sha256: '4f8eb891384f5be75a099e64a95f05ac9f411ec5c22bfbbe197b28a6bcd86e91', importOffset: 1111, localeSeparatorNewlines: 1, references: [['ts', '_initialTutorial._howToMakeAttachmentsSensitive.description', false], ['ts', '_initialTutorial._howToMakeAttachmentsSensitive.tryThisFile', false], ['ts', '_initialTutorial._howToMakeAttachmentsSensitive.method', false], ['ts', '_initialTutorial.wellDone', false], ['ts', '_initialTutorial._howToMakeAttachmentsSensitive.sensitiveSucceeded', false], ['ts', 'previewNoteText', false], ['ts', '_initialTutorial._howToMakeAttachmentsSensitive._exampleNote.note', true]] },
	{ file: 'packages/features/moderation/frontend/pages/admin/abuse-report/notification-recipient.vue', sha256: 'bfa5869134ef4b4a5be0d31a825fbee73d005485d626a519103aa9af05565386', importOffset: 1856, localeSeparatorNewlines: 1, references: [['ts', '_abuseReport._notificationRecipient.createRecipient', false], ['ts', '_abuseReport._notificationRecipient.recipientType', false], ['ts', '_abuseReport._notificationRecipient.keywords', false], ['ts', 'all', true], ['ts', '_abuseReport._notificationRecipient._recipientType.mail', true], ['ts', '_abuseReport._notificationRecipient._recipientType.webhook', true], ['ts', '_abuseReport._notificationRecipient.deleteConfirm', true]] },
	{ file: 'packages/features/notifications/frontend/components/MkPushNotificationAllowButton.vue', sha256: '17dce4bd8b8bdb3a759fc578b27e59ba83e6b5a785436586b1171e0a641f6874', importOffset: 1529, localeSeparatorNewlines: 1, references: [['ts', 'subscribePushNotification', false], ['ts', 'unsubscribePushNotification', false], ['ts', 'pushNotificationAlreadySubscribed', false], ['ts', 'pushNotificationNotSupported', false], ['ts', 'pleaseAllowPushNotification', true], ['ts', 'browserPushNotificationDisabled', true], ['tsx', 'browserPushNotificationDisabledDescription', true]] },
	{ file: 'packages/features/operations/frontend/pages/admin/federation-job-queue.vue', sha256: '34984c0fbdf66b83fe49145e654854fe669e35b432c7757241ad9b292abc2939', importOffset: 882, localeSeparatorNewlines: 1, references: [['ts', 'retryAllQueuesNow', false], ['ts', 'clearQueue', false], ['ts', 'clearQueueConfirmTitle', true], ['ts', 'clearQueueConfirmText', true], ['ts', 'retryAllQueuesConfirmTitle', true], ['ts', 'retryAllQueuesConfirmText', true], ['ts', 'federationJobs', true]] },
	{ file: 'packages/features/avatar-decorations/frontend/pages/settings/avatar-decoration.vue', sha256: '41dba4e4448d3477976706c3108b79709baf2d2bf07367654d034a269b848828', importOffset: 2490, localeSeparatorNewlines: 1, references: [['ts', 'avatarDecorations', false], ['tsx', '_profile.avatarDecorationMax', false], ['tsx', 'remainingN', false], ['ts', 'inUse', false], ['ts', 'detachAll', false], ['ts', 'other', false], ['ts', 'areYouSure', true], ['ts', 'avatarDecorations', true]] },
	{ file: 'packages/features/collections/frontend/pages/gallery/index.vue', sha256: '2db80cc8f77e4af68044862ccc3135ae7579e325b1c063d4dc334da98d8693c3', importOffset: 2169, localeSeparatorNewlines: 1, references: [['ts', 'recentPosts', false], ['ts', 'popularPosts', false], ['ts', 'postToGallery', false], ['ts', 'create', true], ['ts', 'gallery', true], ['ts', '_gallery.liked', true], ['ts', '_gallery.my', true], ['ts', 'gallery', true]] },
	{ file: 'packages/features/preferences/frontend/pages/settings/emoji-palette.palette.vue', sha256: 'f93db78283a4cdc3babe37d46587375f54ee238aade128b545014ef6f7fdc593', importOffset: 1962, localeSeparatorNewlines: 1, references: [['ts', 'noName', false], ['ts', 'rename', false], ['ts', 'copy', false], ['ts', 'paste', false], ['ts', 'reactionSettingDescription2', false], ['ts', 'remove', true], ['ts', 'rename', true], ['ts', 'delete', true]] },
	{ file: 'packages/features/auth/frontend/pages/auth.vue', sha256: 'f324c47c82dfe0e4f1590d0adcb447278e7320dc5578d8ed97eac93bec852614', importOffset: 1598, localeSeparatorNewlines: 1, references: [['ts', 'somethingHappened', false], ['ts', '_auth.denied', false], ['ts', '_auth.alreadyAuthorized', false], ['ts', '_auth.accepted', false], ['ts', '_auth.callback', false], ['ts', '_auth.pleaseGoBack', false], ['ts', '_auth.pleaseLogin', false], ['ts', '_auth.shareAccessTitle', true]] },
] as const;

const migrations = migrationInputs.map(input => ({
	...input,
	keyPaths: [...new Set(input.references.map(([, keyPath]) => keyPath))],
	references: input.references.map(([kind, keyPath, script]) => ({
		kind, keyPath, script,
		replacement: `${kind === 'tsx' ? '$l' : '$locale'}${script ? '.value' : ''}.sfc.${keyPath.split('.').at(-1)}`,
	})),
}));

function getLocaleValue(language: string, keyPath: string): string {
	const value = keyPath.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], locales[language]);
	if (typeof value !== 'string') throw new Error(`Expected locale text at ${language}:${keyPath}`);
	return value;
}

function getBlocks(file: string): Map<string, Record<string, string>> {
	const { descriptor, errors } = parse(readFileSync(resolve(repoRoot, file), 'utf8'), { filename: file });
	expect(errors).toEqual([]);
	const blocks = descriptor.customBlocks.filter(block => block.type === 'locale');
	const result = new Map<string, Record<string, string>>();
	for (const block of blocks) {
		expect(block.attrs.lang).toBe('json');
		expect(result.has(String(block.attrs.locale))).toBe(false);
		result.set(String(block.attrs.locale), JSON.parse(block.content) as Record<string, string>);
	}
	return result;
}

function placeholders(message: string): string[] {
	return [...new Set([...message.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();
}

function legacyFormat(language: string, keyPath: string, values: Record<string, string | number>): string {
	const legacy = new I18n(locales[language]);
	const formatter = keyPath.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], legacy.tsx);
	return (formatter as (parameters: Record<string, string | number>) => string)(values);
}

// Compile the actual migrated component through the installed VVI transform and
// Vue compiler. Inject only its external collaborators, leaving setup/render and
// the real VVI computed refs/localizers intact.
const compiledSources = new Map<string, string>();

async function compileSource(file: string): Promise<string> {
	const cached = compiledSources.get(file);
	if (cached) return cached;
	const filename = resolve(repoRoot, file);
	const source = readFileSync(filename, 'utf8');
	const plugin = pluginVvi();
	const configure = plugin.configResolved;
	const transform = plugin.transform;
	if (typeof configure !== 'function' || !transform || typeof transform === 'function') throw new Error('Expected VVI hooks');
	configure.call({} as never, { root: resolve(repoRoot, 'packages/frontend'), command: 'serve', base: '/', build: { ssr: false } } as never);
	const transformed = await transform.handler.call({} as never, source, filename);
	const transformedSource = typeof transformed === 'string' ? transformed : transformed?.code?.toString() ?? source;
	const { descriptor, errors } = parse(transformedSource, { filename });
	expect(errors).toEqual([]);
	const compiled = compileScript(descriptor, { id: file, inlineTemplate: true });
	const output = ts.transpileModule(compiled.content, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		reportDiagnostics: true,
	});
	expect(output.diagnostics).toEqual([]);
	compiledSources.set(file, output.outputText);
	return output.outputText;
}

async function compileComponent(file: string, dependencies: Record<string, unknown> = {}): Promise<Component> {
	const output = await compileSource(file);
	const exports: { default?: Component } = {};
	runInNewContext(output, {
		exports,
		require(specifier: string) {
			if (specifier === 'vue') return Vue;
			if (specifier === 'virtual:vite-vue-internationalization') return VviRuntime;
			if (Object.hasOwn(dependencies, specifier)) return { __esModule: true, ...(dependencies[specifier] as Record<string, unknown>) };
			throw new Error(`Unexpected component dependency: ${specifier}`);
		},
		window, document, navigator, console, IntersectionObserver: window.IntersectionObserver,
	}, { filename: file });
	if (!exports.default) throw new Error(`Missing compiled component: ${file}`);
	return exports.default;
}

async function runtimeFor(language: string, files: readonly string[]) {
	const modules = Object.fromEntries(files.map(file => [
		'/' + file.replace(/^packages\//, ''),
		getBlocks(file).get(language)!,
	]));
	const runtime = VviRuntime.createInternationalization({
		primaryLocale: 'ja-JP', initialLocale: language,
		loaders: { [language]: async () => ({ modules }) },
	});
	await runtime.ready;
	await runtime.loadLocale(language);
	return runtime;
}

const slotContainer = Vue.defineComponent({
	setup: (_props, { slots }) => () => Vue.h('div', slots.default?.()),
});
const slotButton = Vue.defineComponent({
	setup: (_props, { slots }) => () => Vue.h('button', slots.default?.()),
});

async function mountLocalized(language: string, file: string, component: Component, props: Record<string, unknown> = {}) {
	const runtime = await runtimeFor(language, [file]);
	const app = Vue.createApp(component, props);
	app.use(runtime);
	app.config.globalProperties.$style = new Proxy({}, { get: (_target, key) => String(key) });
	app.directive('tooltip', { mounted: (element, binding) => element.setAttribute('data-tooltip', String(binding.value)), updated: (element, binding) => element.setAttribute('data-tooltip', String(binding.value)) });
	for (const name of ['PageWithHeader', 'MkA', 'MkAvatar', 'MkUserName', 'MkCondensedLine']) app.component(name, slotContainer);
	app.component('MkSuspense', Vue.defineComponent({ setup: (_props, { slots }) => () => Vue.h('div', slots.default?.({ result: null })) }));
	app.component('MkTime', Vue.defineComponent({ setup: () => () => null }));
	// eslint-disable-next-line vue/multi-word-component-names -- Match the existing application global.
	app.component('Mfm', Vue.defineComponent({ props: ['text'], setup: props => () => Vue.h('span', props.text) }));
	const element = document.createElement('div');
	app.mount(element);
	return { app, element };
}

function modelField(tag: 'input' | 'textarea') {
	return Vue.defineComponent({
	props: ['modelValue', 'disabled'],
	setup: (props, { emit, slots }) => () => Vue.h('label', [
		slots.default?.(), slots.label?.(), slots.caption?.(),
		Vue.h(tag, { value: props.modelValue, disabled: props.disabled, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) }),
	]),
	});
}

const modelInput = modelField('input');
const modelTextarea = modelField('textarea');

const flushEvents = async () => { await new Promise<void>(resolve => window.setTimeout(resolve, 0)); };

function changeInput(element: Element, value: string) {
	const input = element as HTMLInputElement;
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

function replacementOccurrences(source: string, replacement: string): number {
	const escaped = replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return [...source.matchAll(new RegExp(escaped + '(?![\\w$])', 'g'))].length;
}

describe('next bounded SFC-local locale migration', () => {
	test.each(migrations)('$file compiles with actual VVI-injected computed refs and template bindings', async ({ file }) => {
		expect(await compileSource(file)).toContain('virtual:vite-vue-internationalization');
	});

	test.each(migrations)('$file preserves every translation, placeholder, occurrence and source boundary', migration => {
		const { file, sha256, importOffset, keyPaths, references } = migration;
		const source = restoreRssContractBaseline(file, readFileSync(resolve(repoRoot, file), 'utf8'));
		const blocks = getBlocks(file);
		expect([...blocks.keys()]).toEqual(languages);
		expect(source).not.toMatch(/\bi18n\s*\./);
		expect(source).not.toContain("from '@features/runtime/frontend/i18n.js'");
		const uniqueReferences = [...new Map(references.map(reference => [reference.replacement, reference])).values()].sort((a, b) => b.replacement.length - a.replacement.length);
		for (const { replacement } of uniqueReferences) {
			expect(replacementOccurrences(source, replacement)).toBe(references.filter(reference => reference.replacement === replacement).length);
		}
		for (const language of languages) {
			const dictionary = blocks.get(language)!;
			expect(Object.keys(dictionary).sort()).toEqual(keyPaths.map(path => path.split('.').at(-1)!).sort());
			for (const keyPath of keyPaths) {
				const localKey = keyPath.split('.').at(-1)!;
				const expected = getLocaleValue(language, keyPath);
				expect(dictionary[localKey]).toBe(expected);
				expect(placeholders(dictionary[localKey])).toEqual(placeholders(expected));
				expect(getLocaleMessageNamedKeys(dictionary[localKey]).sort()).toEqual(placeholders(expected));
			}
		}
		// Reconstruct the complete original SFC byte-for-byte, including import position.
		// This guards setup snapshots, computed/event boundaries, arguments, slots and styles.
		const localeStart = source.indexOf('<locale locale=');
		const separatorNewlines = migration.localeSeparatorNewlines;
		expect(localeStart).toBeGreaterThanOrEqual(separatorNewlines);
		expect(source.slice(localeStart - separatorNewlines, localeStart)).toBe('\n'.repeat(separatorNewlines));
		let reversed = source.slice(0, localeStart - separatorNewlines);
		for (const { replacement, kind, keyPath } of uniqueReferences) reversed = reversed.split(replacement).join(`i18n.${kind}.${keyPath}`);
		const legacyImport = "import { i18n } from '@features/runtime/frontend/i18n.js';\n";
		reversed = reversed.slice(0, importOffset) + legacyImport + reversed.slice(importOffset);
		expect(createHash('sha256').update(reversed).digest('hex')).toBe(sha256);
	});

	const parameterized = migrations.flatMap(({ file, references }) => [...new Set(references.filter(reference => reference.kind === 'tsx').map(reference => reference.keyPath))].map(keyPath => ({ file, keyPath })));
	test.each(parameterized)('$keyPath formats all 28 languages identically to the legacy formatter', async ({ file, keyPath }) => {
		for (const language of languages) {
			const runtime = await runtimeFor(language, [file]);
			Vue.createApp({}).use(runtime);
			const localizer = VviRuntime.createComponentLocalizer('/' + file.replace(/^packages\//, ''));
			const formatter = localizer[keyPath.split('.').at(-1)!];
			if (typeof formatter !== 'function') throw new Error(`Expected formatter for ${keyPath}`);
			for (const value of [0, 1, 12, -5, "名前 {x} | @:linked & <b> ' $ 東京"]) {
				const values = Object.fromEntries(placeholders(getLocaleValue(language, keyPath)).map(key => [key, value]));
				expect(formatter(values)).toBe(legacyFormat(language, keyPath, values));
			}
		}
	});

	// Language selection follows the existing reload/remount path. Both fresh
	// localized boots retain the actual component's computed/event boundaries.
	test.each(['ja-JP', 'en-US'])('compiled online indicator recomputes tooltip across all statuses after a %s boot', async language => {
		const file = 'packages/features/users/frontend/components/MkUserOnlineIndicator.vue';
		const user = Vue.reactive({ onlineStatus: 'online' });
		const component = await compileComponent(file);
		const mounted = await mountLocalized(language, file, component, { user });
		try {
			for (const status of ['online', 'active', 'offline', 'unknown'] as const) {
				user.onlineStatus = status;
				await Vue.nextTick();
				expect(mounted.element.firstElementChild!.getAttribute('data-tooltip')).toBe(locales[language][status]);
				expect(mounted.element.firstElementChild!.classList.contains('status_' + status)).toBe(true);
			}
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled birthday countdown reacts to user and clock changes and retains posting in %s', async language => {
		const file = 'packages/features/relationships/frontend/widgets/WidgetBirthdayFollowings.user.vue';
		const now = Vue.ref(new Date(2026, 9, 7, 13, 30).getTime());
		const item = Vue.reactive({ birthday: '2026-10-09', user: { username: 'birthday', host: 'example.test' } });
		const post = vi.fn();
		const component = await compileComponent(file, {
			'@features/users/frontend/components/MkUserCardMini.vue': { default: Vue.defineComponent({ setup: (_props, { slots }) => () => Vue.h('div', slots.sub?.()) }) },
			'@features/ui/frontend/os.js': { post },
			'@features/ui/frontend/shared/use-lowres-time.js': { useLowresTime: () => now },
			'@features/users/frontend/shared/user.js': { userPage: () => '/user', acct: () => 'birthday@example.test' },
		});
		const mounted = await mountLocalized(language, file, component, { item });
		try {
			expect(mounted.element.textContent).toContain(legacyFormat(language, '_timeIn.days', { n: 2 }));
			item.birthday = '2026-10-07';
			await Vue.nextTick();
			expect(mounted.element.textContent).toContain(locales[language].today);
			now.value = new Date(2026, 9, 10, 9, 15).getTime();
			await Vue.nextTick();
			expect(mounted.element.textContent).toContain(legacyFormat(language, '_ago.daysAgo', { n: 3 }));
			item.birthday = '2026-10-11';
			await Vue.nextTick();
			expect(mounted.element.textContent).toContain(legacyFormat(language, '_timeIn.days', { n: 1 }));
			expect(mounted.element.querySelector('button')!.getAttribute('data-tooltip')).toBe(locales[language].note);
			mounted.element.querySelector('button')!.click();
			expect(post).toHaveBeenCalledExactlyOnceWith({ initialText: '@birthday@example.test ', instant: true });
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled chat room deletion uses the current name and preserves cancellation in %s', async language => {
		const file = 'packages/features/chat/frontend/pages/chat/room.info.vue';
		const confirmation = vi.fn().mockResolvedValueOnce({ canceled: true }).mockResolvedValueOnce({ canceled: false });
		const api = vi.fn().mockResolvedValue(undefined);
		const push = vi.fn();
		const component = await compileComponent(file, {
			'@features/ui/frontend/components/MkButton.vue': { default: slotButton },
			'@features/ui/frontend/components/MkInput.vue': { default: modelInput },
			'@features/ui/frontend/components/MkTextarea.vue': { default: modelTextarea },
			'@features/ui/frontend/components/MkSwitch.vue': { default: slotContainer },
			'@features/ui/frontend/os.js': { confirm: confirmation, apiWithDialog: api },
			'@features/auth/frontend/i.js': { ensureSignin: () => ({ id: 'owner' }) },
			'@features/navigation/frontend/router.js': { useRouter: () => ({ push }) },
		});
		const mounted = await mountLocalized(language, file, component, { room: { id: 'room', ownerId: 'owner', name: 'Initial', description: 'Description' } });
		try {
			expect(confirmation).not.toHaveBeenCalled();
			changeInput(mounted.element.querySelector('input')!, 'Later {x} | @:linked <b>');
			await Vue.nextTick();
			mounted.element.querySelectorAll('button')[0].click();
			expect(api).toHaveBeenCalledExactlyOnceWith('chat/rooms/update', { roomId: 'room', name: 'Later {x} | @:linked <b>', description: 'Description' });
			api.mockClear();
			mounted.element.querySelectorAll('button')[1].click();
			await flushEvents();
			expect(confirmation).toHaveBeenNthCalledWith(1, { type: 'warning', text: legacyFormat(language, 'deleteAreYouSure', { x: 'Later {x} | @:linked <b>' }) });
			expect(api).not.toHaveBeenCalled();
			expect(push).not.toHaveBeenCalled();
			changeInput(mounted.element.querySelector('input')!, 'Accepted name');
			await Vue.nextTick();
			mounted.element.querySelectorAll('button')[1].click();
			await flushEvents();
			expect(confirmation).toHaveBeenNthCalledWith(2, { type: 'warning', text: legacyFormat(language, 'deleteAreYouSure', { x: 'Accepted name' }) });
			expect(api).toHaveBeenCalledExactlyOnceWith('chat/rooms/delete', { roomId: 'room' });
			expect(push).toHaveBeenCalledExactlyOnceWith('/chat');
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled word mute retains invalid-regexp localization, save gating and valid output in %s', async language => {
		const file = 'packages/features/relationships/frontend/pages/settings/mute-block.word-mute.vue';
		const alert = vi.fn();
		const save = vi.fn();
		const component = await compileComponent(file, {
			'@features/ui/frontend/components/MkTextarea.vue': { default: modelTextarea },
			'@features/ui/frontend/components/MkButton.vue': { default: slotButton },
			'@features/ui/frontend/os.js': { alert },
		});
		const mounted = await mountLocalized(language, file, component, { muted: [['first', 'word']], onSave: save });
		try {
			expect(mounted.element.querySelector('button')!.disabled).toBe(true);
			changeInput(mounted.element.querySelector('textarea')!, 'first word\n/[/');
			await Vue.nextTick();
			expect(mounted.element.querySelector('button')!.disabled).toBe(false);
			mounted.element.querySelector('button')!.click();
			await flushEvents();
			expect(alert).toHaveBeenCalledOnce();
			expect(alert.mock.calls[0][0].title).toBe(locales[language].regexpError);
			expect(alert.mock.calls[0][0].text).toContain(legacyFormat(language, 'regexpErrorDescription', { tab: 'word mute', line: 2 }) + '\nSyntaxError:');
			expect(save).not.toHaveBeenCalled();
			expect(mounted.element.querySelector('button')!.disabled).toBe(false);
			changeInput(mounted.element.querySelector('textarea')!, ' keep together \n/^foo/i\n\nbar ');
			await Vue.nextTick();
			mounted.element.querySelector('button')!.click();
			await flushEvents();
			expect(save).toHaveBeenCalledExactlyOnceWith([['keep', 'together'], '/^foo/i', ['bar']]);
			expect(mounted.element.querySelector('button')!.disabled).toBe(true);
			mounted.element.querySelector('button')!.click();
			expect(save).toHaveBeenCalledOnce();
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled pagination keeps setup labels, watcher timing and filter slot in %s', async language => {
		const file = 'packages/features/ui/frontend/components/MkPaginationControl.vue';
		const order = Vue.ref('newest');
		let items: { label: string; value: string }[] | undefined;
		const paginator = { canSearch: true, order: Vue.ref('newest'), initialDirection: 'older', initialDate: null as number | null, searchQuery: Vue.ref<string | null>(null), reload: vi.fn() };
		const component = await compileComponent(file, {
			'@features/ui/frontend/components/MkButton.vue': { default: slotButton },
			'@features/ui/frontend/components/MkSelect.vue': { default: slotContainer },
			'@features/ui/frontend/components/MkInput.vue': { default: modelInput },
			'@features/ui/frontend/utility/format-time-string.js': { formatDateTimeString: () => '2026-10-07' },
			'@features/ui/frontend/composables/use-mkselect.js': { useMkSelect: (options: { items: { label: string; value: string }[] }) => { items = options.items; return { model: order, def: options.items }; } },
		});
		const parent = Vue.defineComponent({ setup: () => () => Vue.h(component, { paginator, canFilter: true }, { default: () => Vue.h('span', { 'data-filter': '' }, 'filter contents') }) });
		const mounted = await mountLocalized(language, file, parent);
		try {
			expect(items).toEqual([{ label: locales[language]._order.newest, value: 'newest' }, { label: locales[language]._order.oldest, value: 'oldest' }]);
			expect(paginator.reload).not.toHaveBeenCalled();
			order.value = 'oldest';
			await Vue.nextTick();
			expect(paginator.order.value).toBe('oldest');
			expect(paginator.initialDirection).toBe('newer');
			expect(paginator.reload).toHaveBeenCalledTimes(1);
			const buttons = mounted.element.querySelectorAll('button');
			expect([...buttons].map(button => button.getAttribute('data-tooltip'))).toEqual([locales[language].search, locales[language].filter, locales[language].dateAndTime, locales[language].reload]);
			buttons[1].click();
			await Vue.nextTick();
			expect(mounted.element.querySelector('[data-filter]')!.textContent).toBe('filter contents');
			buttons[1].click();
			await Vue.nextTick();
			expect(mounted.element.querySelector('[data-filter]')).toBeNull();
			buttons[2].click();
			await Vue.nextTick();
			expect(paginator.initialDate).toEqual(expect.any(Number));
			expect(paginator.reload).toHaveBeenCalledTimes(2);
			buttons[2].click();
			await Vue.nextTick();
			expect(paginator.initialDate).toBeNull();
			expect(paginator.reload).toHaveBeenCalledTimes(3);
			buttons[0].click();
			await Vue.nextTick();
			changeInput(mounted.element.querySelector('input')!, 'later query');
			await Vue.nextTick();
			expect(paginator.searchQuery.value).toBe('later query');
			expect(paginator.reload).toHaveBeenCalledTimes(4);
			buttons[3].click();
			expect(paginator.reload).toHaveBeenCalledTimes(5);
		} finally { mounted.app.unmount(); }
	});
});
