/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { locales } from 'i18n';
import escapes from './shared-global-locale-escapes.json';
import type { RuntimeLocaleDictionary } from 'vite-vue-internationalization/runtime';

// Independently pinned source hashes; translation values remain in locales/*.yml.
export const globalCatalogPilotOwners = [
	{
		"file": "packages/features/collections/frontend/pages/gallery/edit.root.vue",
		"currentSha256": "618c583b4694043f3152b226c024633419d99f236471a1877f0cbd186b18ad34",
		"baselineSha256": "53fe5b78ff387ba19e7de58d01e6c3bab36a237b5c7efc260857547b89ddf845",
		"keys": [
			"save",
			"delete"
		],
		"order": [
			"deleteConfirm",
			"title",
			"description",
			"remove",
			"attachFile",
			"markAsSensitive",
			"save",
			"publish",
			"delete"
		]
	},
	{
		"file": "packages/features/federation/frontend/pages/lookup.vue",
		"currentSha256": "c71dea676bc473147833c8ce042bac2566c95c19afbf0d40ae88ad7d5b6945f9",
		"baselineSha256": "481b50b4cb1e6f31df52a235cd0472500427b192be62cd2db2205ccc9ef775b0",
		"keys": [
			"close"
		],
		"order": [
			"close",
			"goToMisskey",
			"fetchingAsApObject",
			"lookup"
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkWindow.vue",
		"currentSha256": "736c644594a8205d3bf361e7c4764b43294c15f751887f55606dd24eb5a6403c",
		"baselineSha256": "8751a56c744171748ecf6e98432db7383e20ed5d500de7401aa406a2c67ef172",
		"keys": [
			"close"
		],
		"order": [
			"windowRestore",
			"windowMinimize",
			"windowMaximize",
			"close"
		]
	}
,
{
	"file": "packages/features/boot/frontend/pages/welcome.setup.vue",
	"keys": [
		"somethingHappened"
	],
	"currentSha256": "5457fe25be1897b9da20d2f87dce40b4c3a2e55d73ea77b08e968932fcfd87dc",
	"baselineSha256": "fe0288a83b7d0eb29ee74dbe96b0116a60042bb2601cd154c0dae45932a440d6",
	"order": [
		"somethingHappened",
		"permissionDeniedError",
		"operationForbidden",
		"incorrectPassword",
		"installCompleted",
		"firstCreateAccount",
		"initialPasswordForSetup",
		"initialPasswordForSetupDescription",
		"username",
		"usernameInfo",
		"password",
		"processing",
		"next",
		"accountCreated",
		"serverSetting",
		"youCanEasilyConfigureOptimalServerSettingsWithThisWizard",
		"settingsYouMakeHereCanBeChangedLater",
		"skipSettings",
		"settingsCompleted",
		"settingsCompleted_description",
		"settingsCompleted_description2",
		"donationRequest",
		"text1",
		"text2",
		"text3",
		"learnMore",
		"start"
	],
	"expanded": true
},
{
	"file": "packages/features/channels/frontend/pages/channels.vue",
	"keys": [
		"search"
	],
	"currentSha256": "48dc8cd25b654fcc57486e35a72a33e838887c033fb737418fbb7af9a1d475dd",
	"baselineSha256": "52c58c290e4b67682b4c3e06ec86b41ec5fc93e9a0aca9a82213cb040791c52a",
	"order": [
		"search",
		"featured",
		"favorites",
		"following",
		"owned",
		"channel",
		"nameAndDescription",
		"nameOnly",
		"searchResult",
		"createNew"
	],
	"expanded": true
},
{
	"file": "packages/features/chat/frontend/pages/chat/XMessage.vue",
	"keys": [
		"delete"
	],
	"currentSha256": "98ef09d5622a68d03211e4e507adab37983b5c476ecef8063906b4d3eb388feb",
	"baselineSha256": "af8c9fbafba7db1791edf98d12aab6998d8971d72be19deed67ae2cc8a034125",
	"order": [
		"reaction",
		"copyContent",
		"delete",
		"reportAbuse"
	],
	"expanded": true
},
{
	"file": "packages/features/chat/frontend/pages/chat/home.home.vue",
	"keys": [
		"search"
	],
	"currentSha256": "9581454ea3d5190c34853036f2d4b25c5660c969e80181c0a6e288748421928f",
	"baselineSha256": "47d17c6d2dfe97c0d7e28ce471ec851c64c52ea307f572900b4c2f92b1aae658",
	"order": [
		"individualChat",
		"individualChat_description",
		"roomChat",
		"roomChat_description",
		"createRoom",
		"name",
		"startChat",
		"chatIsReadOnlyForThisAccountOrServer",
		"chatNotAvailableForThisAccountOrServer",
		"searchMessages",
		"search",
		"searchResult",
		"history"
	],
	"expanded": true
},
{
	"file": "packages/features/chat/frontend/pages/chat/room.vue",
	"keys": [
		"search",
		"somethingHappened"
	],
	"currentSha256": "17b34b3f46528198b18c908cd526862819876b21beaa0ffb0853b4c923df97b1",
	"baselineSha256": "9693b25b97a6fff6ee8cabfc53e38e312fbfcd0be5e33418e98b6552bbdda003",
	"order": [
		"somethingHappened",
		"youAreNotAMemberOfThisRoomButInvited",
		"doYouAcceptInvitation",
		"areYouSure",
		"inviteUser",
		"leave",
		"messages",
		"members",
		"search",
		"info",
		"directMessage",
		"noMessagesYet",
		"thisUserAllowsChatOnlyFromFollowers",
		"thisUserAllowsChatOnlyFromFollowing",
		"thisUserAllowsChatOnlyFromMutualFollowing",
		"thisUserNotAllowedChatAnyone",
		"inviteUserToChat",
		"loadMore",
		"chatNotAvailableInOtherAccount",
		"chatIsReadOnlyForThisAccountOrServer",
		"chatNotAvailableForThisAccountOrServer",
		"newMessage"
	],
	"expanded": true
},
{
	"file": "packages/features/collections/frontend/pages/gallery/post.vue",
	"keys": [
		"delete",
		"edit"
	],
	"currentSha256": "c0092ae38edd7bb3d10ed69da319cf54f076c59690f8490b959d6a6e24e313b5",
	"baselineSha256": "d103fab6b961758083b7d2977ce5b9884b3111bff0724f8177e20c4bae2d586f",
	"order": [
		"unlikeConfirm",
		"reportAbuse",
		"delete",
		"deleteConfirm",
		"gallery",
		"unlike",
		"like",
		"edit",
		"shareWithNote",
		"copyLink",
		"share",
		"recentPosts"
	],
	"expanded": true
},
{
	"file": "packages/features/discovery/frontend/pages/search.user.vue",
	"keys": [
		"search"
	],
	"currentSha256": "acb909f447cf437c9a74744c6d1277f5677a26c141534e843ce80de1c2e76ef2",
	"baselineSha256": "74355a979c1054c4b433b274248684aed59adc0e64be309f3f756efbcc20ee79",
	"order": [
		"lookupConfirm",
		"fetchingAsApObject",
		"openTagPageConfirm",
		"all",
		"local",
		"remote",
		"search",
		"searchResult"
	],
	"expanded": true
},
{
	"file": "packages/features/drive/frontend/components/MkDrive.folder.vue",
	"keys": [
		"delete",
		"somethingHappened"
	],
	"currentSha256": "6e4d437048ca6fcb35267b30bee04da79516eed9eadbb9e36d05cb2a0abca57c",
	"baselineSha256": "499cf397197d0a3bb34639bbf565c53547b59e10674789246f5e8bff5eb0676b",
	"order": [
		"unableToProcess",
		"circularReferenceFolder",
		"somethingHappened",
		"renameFolder",
		"inputNewFolderName",
		"unableToDelete",
		"hasChildFilesOrFolders",
		"openInWindow",
		"rename",
		"move",
		"delete",
		"copyFolderId",
		"uploadFolder"
	],
	"expanded": true
},
{
	"file": "packages/features/drive/frontend/components/MkDrive.vue",
	"keys": [
		"somethingHappened",
		"edit"
	],
	"currentSha256": "0cf23bdacd54a30006be8726bc653a63e7f95540c0592fc3f416214a6ece6d08",
	"baselineSha256": "768f5a8ad56451dc23e3cae9630c3de472f345f2d3f1841bb9a500cfb78c8934",
	"order": [
		"unableToProcess",
		"circularReferenceFolder",
		"somethingHappened",
		"uploadFromUrl",
		"uploadFromUrlDescription",
		"uploadFromUrlRequested",
		"uploadFromUrlMayTakeTime",
		"createFolder",
		"folderName",
		"renameFolder",
		"inputNewFolderName",
		"unableToDelete",
		"hasChildFilesOrFolders",
		"addFile",
		"upload",
		"fromUrl",
		"drive",
		"sort",
		"registeredDate",
		"descendingOrder",
		"ascendingOrder",
		"size",
		"name",
		"deleteFolder",
		"edit",
		"selectFolder",
		"unselectFolder",
		"driveAboutTip",
		"loadMore",
		"dropHereToUpload",
		"emptyDrive",
		"emptyFolder",
		"move"
	],
	"expanded": true
},
{
	"file": "packages/features/emojis/frontend/pages/custom-emojis-manager.vue",
	"keys": [
		"search"
	],
	"currentSha256": "187e587f7c78dba4464b85b19d5ee8cf370a306f5b033d1a9188659079667168",
	"baselineSha256": "938869ff161f2a9cdc5343d92b2066a9ede499b862dbbd8ff6e25f62ffa4f246",
	"order": [
		"details",
		"import",
		"export",
		"exportRequested",
		"importRequested",
		"deleteConfirm",
		"addEmoji",
		"more",
		"local",
		"remote",
		"customEmojis",
		"search",
		"noCustomEmojis",
		"host"
	],
	"expanded": true
},
{
	"file": "packages/features/integrations/frontend/components/MkSystemWebhookEditor.vue",
	"keys": [
		"cancel",
		"ok"
	],
	"currentSha256": "f631c6d384942949de8d6e572f2d7281b107aa655fe6d9aa45c2b7687b57ed77",
	"baselineSha256": "cb666e648f680d96f51dec09d90ab84f08f26d904728e8c5b9d4dfc09f21d014",
	"order": [
		"internalServerErrorDescription",
		"error",
		"createWebhook",
		"modifyWebhook",
		"name",
		"secret",
		"trigger",
		"abuseReport",
		"abuseReportResolved",
		"userCreated",
		"inactiveModeratorsWarning",
		"inactiveModeratorsInvitationOnlyChanged",
		"testRemarks",
		"enable",
		"ok",
		"cancel"
	],
	"expanded": true
},
{
	"file": "packages/features/moderation/frontend/pages/admin/moderation.vue",
	"keys": [
		"save"
	],
	"currentSha256": "8423791fd8dbcc8650fda960423a103167c2443511759034961d8b1f96165f26",
	"baselineSha256": "7c95232a27f9ff2423a0e61c5a063a7afd30cc8df201a4d1cd4367870c5bd58b",
	"order": [
		"all",
		"localOnly",
		"none",
		"acknowledgeNotesAndEnable",
		"moderation",
		"openRegistration",
		"thisSettingWillAutomaticallyOffWhenModeratorsInactive",
		"openRegistrationWarning",
		"emailRequiredForSignup",
		"recommended",
		"userGeneratedContentsVisibilityForVisitor",
		"userGeneratedContentsVisibilityForVisitor_description",
		"userGeneratedContentsVisibilityForVisitor_description2",
		"preservedUsernames",
		"preservedUsernamesDescription",
		"save",
		"sensitiveWords",
		"sensitiveWordsDescription",
		"sensitiveWordsDescription2",
		"prohibitedWords",
		"prohibitedWordsDescription",
		"prohibitedWordsDescription2",
		"prohibitedWordsForNameOfUser",
		"prohibitedWordsForNameOfUserDescription",
		"hiddenTags",
		"hiddenTagsDescription",
		"silencedInstances",
		"silencedInstancesDescription",
		"mediaSilencedInstances",
		"mediaSilencedInstancesDescription",
		"blockedInstances",
		"blockedInstancesDescription"
	],
	"expanded": true
},
{
	"file": "packages/features/note-search/frontend/pages/search.note.vue",
	"keys": [
		"search"
	],
	"currentSha256": "337f875a4c683300f9a57156ce7fcb5c210a66cb52cdf63ef5b75546f2fc32c4",
	"baselineSha256": "bd432936dd611d7a5d20e7c212b0fcd61b431dd6b7902c8ea7721f843a10fb62",
	"order": [
		"searchScopeAll",
		"searchScopeLocal",
		"searchScopeServer",
		"searchScopeUser",
		"lookupConfirm",
		"openTagPageConfirm",
		"options",
		"postFrom",
		"postTo",
		"serverHostPlaceholder",
		"pleaseEnterServerHost",
		"pleaseSelectUser",
		"selectSelf",
		"selectUser",
		"search",
		"searchResult"
	],
	"expanded": true
},
{
	"file": "packages/features/notifications/frontend/pages/settings/notifications.notification-config.vue",
	"keys": [
		"save"
	],
	"currentSha256": "12084eaf939f8cc8ef1a8039d3233bbdf9b8b7317c7b8762667c59c6820a4184",
	"baselineSha256": "17e3110fbd3866c59c8cfa03a24d7d14d1c6cea4cc2e6b29b8311834cfb5bf25",
	"order": [
		"all",
		"following",
		"followers",
		"mutualFollow",
		"followingOrFollower",
		"userList",
		"none",
		"save"
	],
	"expanded": true
},
{
	"file": "packages/features/operations/frontend/pages/admin/object-storage.vue",
	"keys": [
		"save"
	],
	"currentSha256": "7f991cee9a8840eb6ecec3cf202fe74f4ac84baece5c33165660dc4c99e2f28b",
	"baselineSha256": "4222b25b3dcd055fc97eaa7fc3aeee0b698935813d1cb6909b49217f2e54a3e2",
	"order": [
		"objectStorage",
		"useObjectStorage",
		"objectStorageBaseUrl",
		"objectStorageBaseUrlDesc",
		"objectStorageBucket",
		"objectStorageBucketDesc",
		"objectStoragePrefix",
		"objectStoragePrefixDesc",
		"objectStorageEndpoint",
		"objectStorageEndpointDesc",
		"objectStorageRegion",
		"objectStorageRegionDesc",
		"objectStorageUseSSL",
		"objectStorageUseSSLDesc",
		"objectStorageUseProxy",
		"objectStorageUseProxyDesc",
		"objectStorageSetPublicRead",
		"s3ForcePathStyleDesc",
		"save"
	],
	"expanded": true
},
{
	"file": "packages/features/pages/frontend/pages/page.vue",
	"keys": [
		"delete",
		"edit"
	],
	"currentSha256": "9fcf07cf38b91470295b7865d2a1250a48cc96a7b6c9206b4b0ea5747c62a3ad",
	"baselineSha256": "921cfa9a66c7404f4e0d148b913fc17fb885a1cffb038411c3b4bad21d772ca0",
	"order": [
		"shareWithNote",
		"share",
		"unlikeConfirm",
		"edit",
		"unpin",
		"pin",
		"reportAbuse",
		"delete",
		"deleteConfirm",
		"pages",
		"editThisPage",
		"unlike",
		"like",
		"copyLink",
		"createdAt",
		"updatedAt",
		"recentPosts"
	],
	"expanded": true
},
{
	"file": "packages/features/play/frontend/pages/flash/flash.vue",
	"keys": [
		"delete",
		"reload"
	],
	"currentSha256": "ee389d0014593e13871ac0a669a86b5d71ee0b3d181ddb79e808d78f499e9079",
	"baselineSha256": "e31fd49ae514819d19409e18ac88de62e91a93b8e5e2866235a158736d3953a6",
	"order": [
		"shareWithNote",
		"share",
		"unlikeConfirm",
		"reportAbuse",
		"delete",
		"deleteConfirm",
		"reload",
		"unlike",
		"like",
		"copyLink",
		"numberOfLikes",
		"viewSource",
		"updatedAt",
		"createdAt",
		"editThisPage"
	],
	"expanded": true
},
{
	"file": "packages/features/preferences/frontend/pages/registry.value.vue",
	"keys": [
		"save",
		"delete"
	],
	"currentSha256": "fe1f98c8a59e7cebc6e54e4550efb96ee6ed7a51f2e94b610120522068d78a11",
	"baselineSha256": "f55eb9544c1a7871ed41c73bee6c2c6309f53fdeb2ff30004d93dfc8e52edacb",
	"order": [
		"invalidValue",
		"saveConfirm",
		"deleteConfirm",
		"registry",
		"editTheseSettingsMayBreakAccount",
		"domain",
		"system",
		"scope",
		"key",
		"value",
		"save",
		"updatedAt",
		"delete"
	],
	"expanded": true
},
{
	"file": "packages/features/preferences/frontend/pages/settings/navbar.vue",
	"keys": [
		"save"
	],
	"currentSha256": "2a723bcad873990718f50c879ff24470dd3bf8b7b7e1d55b4589257f8ab45f5c",
	"baselineSha256": "723ca0afdea1eadf070f9599e7ed0a64a00775e0022d6f3b6912b45646a9036d",
	"order": [
		"addItem",
		"divider",
		"navbar",
		"default",
		"save",
		"sideFull",
		"sideIcon",
		"display",
		"showNavbarSubButtons"
	],
	"expanded": true
},
{
	"file": "packages/features/preferences/frontend/pages/settings/sounds.sound.vue",
	"keys": [
		"save",
		"cancel"
	],
	"currentSha256": "6f8c8a4a36005ea3af263bac0857c0d771bce0cf2616cf1afbb0f11b106ae789",
	"baselineSha256": "12fe9cf0b438c3e59346640c32d2f5ca3bf94d52435630d4ab6970a3e31d18f1",
	"order": [
		"none",
		"driveFile",
		"driveFileWarn",
		"driveFileTypeWarn",
		"driveFileTypeWarnDescription",
		"driveFileDurationWarn",
		"driveFileDurationWarnDescription",
		"continue",
		"cancel",
		"sound",
		"selectFile",
		"driveFileError",
		"volume",
		"listen",
		"save"
	],
	"expanded": true
},
{
	"file": "packages/features/preferences/frontend/pages/settings/theme.manage.vue",
	"keys": [
		"copy"
	],
	"currentSha256": "d23c7afe540aa288107850bbe33cec96e0989a8cbf5d67cec22d2557174a0ec6",
	"baselineSha256": "0d9cda002930465caaf37ab5f793fa3fce2c85a2a9c72a8847f98b9e807657b8",
	"order": [
		"installedThemes",
		"builtinThemes",
		"manage",
		"theme",
		"author",
		"description",
		"code",
		"copy",
		"uninstall"
	],
	"expanded": true
},
{
	"file": "packages/features/roles/frontend/pages/admin/roles.edit.vue",
	"keys": [
		"save"
	],
	"currentSha256": "dbc7163673fe80a070bd8349f8ac8dc08a3d408b056e6af7d42b60bb69aa856d",
	"baselineSha256": "27b5f652876b1721cfb8385e86b13fb306b9413b6088f2eb3125480f751e97c7",
	"order": [
		"edit",
		"new",
		"save"
	],
	"expanded": true
},
{
	"file": "packages/features/ui/frontend/components/MkPagination.vue",
	"keys": [
		"reload"
	],
	"currentSha256": "a0fa680ff03fc6ed700a718fd83ecb8f6fb21d28e7239d9e246225de18845843",
	"baselineSha256": "962781234f622f91d3e811be111c2a93006d1e6e367ece0281cd5de17b28870f",
	"order": [
		"reload",
		"loadMore"
	],
	"expanded": true
},
{
	"file": "packages/features/users/frontend/pages/admin/users.vue",
	"keys": [
		"search"
	],
	"currentSha256": "8aebfdb38a5aca9ef144f8dcfb0ded84ff24132dd73fd01b55ca9cef6e03082d",
	"baselineSha256": "52c0ad7178105965a2d7d6270fffd075551c38c3b3ed99a67a024f2ea177cd7a",
	"order": [
		"registeredDate",
		"ascendingOrder",
		"descendingOrder",
		"lastUsed",
		"all",
		"normal",
		"administrator",
		"moderator",
		"suspend",
		"local",
		"remote",
		"username",
		"password",
		"search",
		"addUser",
		"lookup",
		"users",
		"reset",
		"sort",
		"state",
		"instance",
		"host"
	],
	"expanded": true
},
{
	"file": "packages/features/web/frontend/components/MkEmbedCodeGenDialog.vue",
	"keys": [
		"close",
		"copy"
	],
	"currentSha256": "296527b6689c4585b083a40db259aee944bbb531b6c3177a7bd54a5088af8253",
	"baselineSha256": "afa4e4abfbcb45d211457f93ad62e326a7b1926196d6b808588e2c43b8e401b4",
	"order": [
		"syncDeviceDarkMode",
		"light",
		"dark",
		"title",
		"preview",
		"maxHeight",
		"maxHeightDescription",
		"theme",
		"header",
		"rounded",
		"border",
		"maxHeightWarn",
		"previewIsNotActual",
		"applyToPreview",
		"generateCode",
		"codeGenerated",
		"codeGeneratedDescription",
		"copy",
		"close"
	],
	"expanded": true
},
{
	"file": "packages/features/web/frontend/pages/_error_.vue",
	"keys": [
		"reload"
	],
	"currentSha256": "1cd4399fd7b08e3fd2090b332eeb439775d74dc3b6f0c23b621fb9a0de600dd6",
	"baselineSha256": "0268cfb79c93aa4eda6b857807f1dc06f5b87757bec08c7383e7990db58848c3",
	"order": [
		"error",
		"pageLoadError",
		"pageLoadErrorDescription",
		"serverIsDead",
		"newVersionOfClientAvailable",
		"youShouldUpgradeClient",
		"reload",
		"troubleshooting"
	],
	"expanded": true
}
] as const;
const lexicalEscapes: Record<string, Record<string, string[]>> = escapes;
const root = resolve(import.meta.dirname, '../../../..');
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Replay the pre-pilot source only after verifying both complete source boundaries. */
export function restoreGlobalCatalogPilotSource(file: string, source: string): string {
	const owner = globalCatalogPilotOwners.find(owner => owner.file === file);
	if (!owner || sha256(source) === owner.baselineSha256) return source;
	if (sha256(source) !== owner.currentSha256) throw new Error(`Global catalog pilot source differs: ${file}`);
	source = source
		.replace("import { useLocale } from 'virtual:vite-vue-internationalization';\n", '')
		.replace("import type { GlobalLocale } from '@features/runtime/frontend/shared/global-locale.js';\n", '')
		.replace('const globalLocale = useLocale<GlobalLocale>(import.meta.url);\n\n', '')
		.replace('\nconst globalLocale = useLocale<GlobalLocale>(import.meta.url);\n', '');
	for (const key of owner.keys) source = source.replaceAll(`globalLocale.value.env.${key}`, `$locale.value.sfc.${key}`).replaceAll(`globalLocale.env.${key}`, `$locale.sfc.${key}`);
	source = source.replace(/(<locale[^>]*locale="([^"]+)"[^>]*>)([\s\S]*?)<\/locale>/g, (_block, start: string, language: string, content: string) => {
		const current = JSON.parse(content) as Record<string, string>;
		const messages = locales[language];
		if (!messages) throw new Error(`Unexpected global catalog pilot language: ${language}`);
		const original = Object.fromEntries(owner.order.map(key => [key, Object.hasOwn(current, key) ? current[key] : messages[key as keyof typeof messages]]));
		const indent = content.match(/\n([ \t]+)"/)?.[1];
		if (!indent) throw new Error(`Missing global catalog pilot dictionary indent: ${file}`);
		let json = JSON.stringify(original, null, indent);
		for (const escape of lexicalEscapes[file]?.[language] ?? []) json = json.replaceAll(String.fromCharCode(Number.parseInt(escape.slice(2), 16)), escape);
		return `${start}\n${json}\n</locale>`;
	});
	if (sha256(source) !== owner.baselineSha256) throw new Error(`Global catalog pilot baseline differs: ${file}`);
	return source;
}

/** Verify live owner and global scopes before replaying the existing raw-owner oracle. */
export function restoreGlobalCatalogPilotDictionary(file: string, language: string, dictionary: RuntimeLocaleDictionary, global: RuntimeLocaleDictionary): RuntimeLocaleDictionary {
	const owner = globalCatalogPilotOwners.find(owner => owner.file === file);
	if (!owner) return dictionary;
	const source = readFileSync(resolve(root, file), 'utf8');
	const baseline = restoreGlobalCatalogPilotSource(file, source);
	const collect = (text: string): Record<string, string> => {
		const block = parse(text).descriptor.customBlocks.find(block => block.type === 'locale' && block.attrs.locale === language);
		if (!block) throw new Error(`Missing global catalog pilot language: ${file}:${language}`);
		return JSON.parse(block.content) as Record<string, string>;
	};
	if (JSON.stringify(Object.fromEntries(Object.entries(dictionary))) !== JSON.stringify(collect(source))) throw new Error(`Global catalog pilot loader differs: ${file}:${language}`);
	for (const key of owner.keys) {
		if (typeof global[key] !== 'string' || global[key] !== locales[language]?.[key]) throw new Error(`Global catalog pilot shared label differs: ${language}:${key}`);
	}
	const restored = Object.fromEntries(owner.order.map(key => [key, Object.hasOwn(dictionary, key) ? dictionary[key] : global[key]]));
	if (JSON.stringify(restored) !== JSON.stringify(collect(baseline))) throw new Error(`Global catalog pilot historical dictionary differs: ${file}:${language}`);
	return restored;
}
