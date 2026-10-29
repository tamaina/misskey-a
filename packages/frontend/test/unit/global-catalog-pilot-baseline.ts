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
		"currentSha256": "604972bddeb811f2e5c8302d4eeb84004cdc231d22765619f4b56ab47cbc6f21",
		"baselineSha256": "53fe5b78ff387ba19e7de58d01e6c3bab36a237b5c7efc260857547b89ddf845",
		"keys": [
			"save",
			"delete",
			"title",
			"description"
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
		"currentSha256": "06bc1932d7942c37183bff8ed82f2469da2bc41cb8210e944905ccedaa4a1a3c",
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
		"currentSha256": "8b79ea75214325a89ddbb2db5cc4d054cfb56a41a4e21760f9ef702b5a85cf63",
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
	},
	{
		"file": "packages/features/boot/frontend/pages/welcome.setup.vue",
		"keys": [
			"somethingHappened",
			"next"
		],
		"currentSha256": "b8687e01986c67fea2bacabfd60380adcdcae260913c9d4cf3d565d18db1e136",
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
			"search",
			"favorites"
		],
		"currentSha256": "631263469940d924c6eea86aef7773ecf7080c23c51eb42f9558e4cf44cda52b",
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
		"currentSha256": "110f539bb610b55d846352ba6589c5c260c8c433690f30407779e7161cc640ee",
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
			"search",
			"name"
		],
		"currentSha256": "033c6f694127c3b6001ee033e0b50be8142f60a2a6dd59579209ae7fe7613515",
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
			"somethingHappened",
			"areYouSure"
		],
		"currentSha256": "a522380fcbe7a70cc3bf6078a6d8c3809543c953e49f0bda991b7926cd7b7e90",
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
		"currentSha256": "53de05e6df0fdc92ef5a50942bc75d0c19edd8c0aef132225b2d18d20870c945",
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
			"search",
			"all"
		],
		"currentSha256": "bca7cfa17bc272931d4c43eab86d032f7c5663815470c08d96c40bc22637ef65",
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
		"currentSha256": "59ae6db550b776f41ae536bf5b2f7f759d8615e9a97c24270b6220ae16cd3339",
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
			"edit",
			"upload",
			"name"
		],
		"currentSha256": "b6c073be48ce077e54becc82794e8e65417408a803c29b9fca9cffb3704d8752",
		"baselineSha256": "768f5a8ad56451dc23e3cae9630c3de472f345f2d3f1841bb9a500cfb78c8934",
		"edits": [
			{
				"start": 4064,
				"end": 4122,
				"current": "\t\t\t\t\t\t\t:isDisabled=\"excludeSensitive && file.isSensitive\"\n",
				"baseline": ""
			},
			{
				"start": 5016,
				"end": 5072,
				"current": "\t\t\t\t\t:isDisabled=\"excludeSensitive && file.isSensitive\"\n",
				"baseline": ""
			},
			{
				"start": 8113,
				"end": 8142,
				"current": "\texcludeSensitive?: boolean;\n",
				"baseline": ""
			},
			{
				"start": 8265,
				"end": 8291,
				"current": "\texcludeSensitive: false,\n",
				"baseline": ""
			},
			{
				"start": 16606,
				"end": 16664,
				"current": "\tif (props.excludeSensitive && file.isSensitive) return;\n\n",
				"baseline": ""
			}
		],
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
			"search",
			"customEmojis"
		],
		"currentSha256": "539d6d120be2cc18c424904135f3c44fe411ea336d37517d0fa71c2c155499d1",
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
			"ok",
			"error"
		],
		"currentSha256": "2e6f9560480ca52a665f94e080cfd4c8b31122929b83c68f35f15a5a9cac4aec",
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
		"currentSha256": "975f8d3f144659224224518bd4508992ee27bbd76482bd93f9bace4e66806bfc",
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
		"currentSha256": "66952e6c16d38bbf4e53cdc89870ae1f66efbacd7774ac4036f9e00e9327669b",
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
			"save",
			"none",
			"all",
			"following"
		],
		"currentSha256": "a11780019bb1a762818d28ad8964588205dcbc6e52247c4c3c9579135a69acb3",
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
		"currentSha256": "f9ca9d232631e20c0ee23cab1039d68c8d0199ac71f7906807ba1d269c5377e2",
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
		"currentSha256": "c08a17e936d9830d989738c53eee08cfde582fc7bbf8264866aa1d4f96b7f210",
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
		"currentSha256": "737bad2c31571e398a0d415903278d0797b99c152329098ea8388cbe0a26d9ae",
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
		"currentSha256": "158691df2da647c3be47a65076df7b697baee072a6f7c803b5ef4d89b12ee678",
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
			"save",
			"default"
		],
		"currentSha256": "cd06f4f487a02dc9a8704283c79f337ceddc67184349dd5190f6be8a558ef556",
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
			"cancel",
			"none"
		],
		"currentSha256": "025afe316e5f46dfc8f0b073f98177836e288a855466138a8097258fc78a131f",
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
			"copy",
			"description"
		],
		"currentSha256": "614e85f595d3876aa2c3bcc89411bcae788a957a3b1fad9d81e9f1df552c3e6b",
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
		"currentSha256": "5db4455ca96904230d849d39acf6fda25f34dfb60b401240946a323d6361a382",
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
		"currentSha256": "ee2766ab106e0cd120ea5fabace836fbb62860fc6e1c3d02ff96b82ee98a9129",
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
			"search",
			"reset",
			"all",
			"users"
		],
		"currentSha256": "7d699f6da878a0c74a09ecafb5c5516dbee102e126f8f084a38c882e26837f02",
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
			"copy",
			"preview"
		],
		"currentSha256": "0242fc6bb9e1d7bad3075d91961ba656bcd78f35c036327c1dc33478738e5880",
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
			"reload",
			"error"
		],
		"currentSha256": "cea807950601a45580119a52c60e998d6034d166a2abb6d0e5e84d4af18d8f21",
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
	// Reverse exact reviewed upstream follow-up edits made after the pilot before replaying it.
	if ('edits' in owner) {
		for (const edit of [...owner.edits].reverse()) {
			if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Global catalog pilot follow-up boundary differs: ${file}`);
			source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
		}
	}
	source = source
		.replace("import { useLocale } from 'virtual:vite-vue-internationalization';\n", '')
		.replace("import type { Locale } from 'i18n';\n", '')
		.replace('const globalLocale = useLocale<Locale>(import.meta.url);\n\n', '')
		.replace('\nconst globalLocale = useLocale<Locale>(import.meta.url);\n', '');
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
