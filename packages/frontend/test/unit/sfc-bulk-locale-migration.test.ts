/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
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
import { languages } from 'i18n';
import { locales } from './instance-pilot-locale-catalog.js';
import { I18n } from '@features/runtime/frontend/shared/i18n.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.js';
import { restorePwaShareSourceBaseline } from './pwa-share-source-rebase.js';
import type { Component, ComputedRef } from 'vue';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

const migrations = [
	{
		"file": "packages/features/chat/frontend/pages/chat/message.vue",
		"sha256": "642d11cf229a49055aecb3e12d62d657bcc29cbb0abc07e105625015a31b09f2",
		"importOffset": 547,
		"keyPaths": [
			"directMessage"
		],
		"references": [
			{
				"keyPath": "directMessage",
				"localKey": "directMessage",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.directMessage"
			}
		]
	},
	{
		"file": "packages/features/games/frontend/widgets/WidgetClicker.vue",
		"sha256": "8efeb2171e4102abefbd2f7d18ecbbed2bd7740a84aedba59b03df198c1ea4ac",
		"importOffset": 654,
		"keyPaths": [
			"_widgetOptions.showHeader"
		],
		"references": [
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/ads.vue",
		"sha256": "dc31f788552ae309e901f64af935b9de5071e63e8e66fb830ff6a747f1dff103",
		"importOffset": 474,
		// The original EOF blank line also separates the first locale block.
		"localeSeparatorNewlines": 0,
		"keyPaths": [
			"ads"
		],
		"references": [
			{
				"keyPath": "ads",
				"localKey": "ads",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.ads"
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/widgets/WidgetInstanceCloud.vue",
		"sha256": "4c1d3ec40e32b13efa8d9d7573eff904a25b8b5d1cd7105244235e2fc4b6f1fa",
		"importOffset": 1394,
		"keyPaths": [
			"_widgetOptions.transparent"
		],
		"references": [
			{
				"keyPath": "_widgetOptions.transparent",
				"localKey": "transparent",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.transparent"
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/components/MkLightbox.item.audio-visualizer.vue",
		"sha256": "91ecbcb9fc91002baf99821d0830fac033c603fca721cd057368d6b7bd8ada9b",
		"importOffset": 1035,
		"keyPaths": [
			"cannotPreview"
		],
		"references": [
			{
				"keyPath": "cannotPreview",
				"localKey": "cannotPreview",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.cannotPreview"
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/ui/deck/main-column.vue",
		"sha256": "9b0257c910be4e132e97c5ac179ea47d7ebafd0a22daf818e1634d64ad4993b8",
		"importOffset": 1080,
		"keyPaths": [
			"openInWindow"
		],
		"references": [
			{
				"keyPath": "openInWindow",
				"localKey": "openInWindow",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.openInWindow"
			}
		]
	},
	{
		"file": "packages/features/navigation/frontend/ui/universal.vue",
		"sha256": "f4d760fcfc49b1cbec4a4ee176158d5550c1a0fc5fbc7b6972c402e7addcf545",
		"importOffset": 2438,
		"keyPaths": [
			"openInWindow"
		],
		"references": [
			{
				"keyPath": "openInWindow",
				"localKey": "openInWindow",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.openInWindow"
			}
		]
	},
	{
		"file": "packages/features/operations/frontend/pages/admin/database.vue",
		"sha256": "fadb732cb7c00eaf27e933eb5c88858f279ae4bb32bd6bff4660e1cf3db5fca6",
		"importOffset": 974,
		"keyPaths": [
			"database"
		],
		"references": [
			{
				"keyPath": "database",
				"localKey": "database",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.database"
			}
		]
	},
	{
		"file": "packages/features/play/frontend/widgets/WidgetAichan.vue",
		"sha256": "289c401f13e41e175ecd5a18aec36c2516fb83cd5642873ac76cc9e784730936",
		"importOffset": 560,
		"keyPaths": [
			"_widgetOptions.transparent"
		],
		"references": [
			{
				"keyPath": "_widgetOptions.transparent",
				"localKey": "transparent",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.transparent"
			}
		]
	},
	{
		"file": "packages/features/statistics/frontend/pages/admin/overview.vue",
		"sha256": "e1aa2bb74daef46a691ce103cb3fb32922dfc9e0582eaca7ed9773871d9ee96f",
		"importOffset": 2933,
		"keyPaths": [
			"dashboard"
		],
		"references": [
			{
				"keyPath": "dashboard",
				"localKey": "dashboard",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.dashboard"
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/pages/my-antennas/create.vue",
		"sha256": "f43d6e35e58c74ee8d87aea7e6aa0095983f99fd8c7c6b8f9dcae53672237e72",
		"importOffset": 308,
		"keyPaths": [
			"createAntenna"
		],
		"references": [
			{
				"keyPath": "createAntenna",
				"localKey": "createAntenna",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.createAntenna"
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/pages/preview.vue",
		"sha256": "0e7dcab89fed489dcb8e634654c5dccd639b7ba1428b9e3dec5424abd4dc024b",
		"importOffset": 282,
		"keyPaths": [
			"preview"
		],
		"references": [
			{
				"keyPath": "preview",
				"localKey": "preview",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.preview"
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/achievements.vue",
		"sha256": "44a4d25b7bc17bcc96e3973c80a2b441f1e7ce96704ce8eaffc23128a9b4af1c",
		"importOffset": 436,
		"keyPaths": [
			"achievements"
		],
		"references": [
			{
				"keyPath": "achievements",
				"localKey": "achievements",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.achievements"
			}
		]
	},
	{
		"file": "packages/features/chat/frontend/widgets/WidgetChat.vue",
		"sha256": "c0f82824a3ded602b0593ac72426896d886f8a030ee2a4593718bf9cd6725623",
		"importOffset": 950,
		"keyPaths": [
			"_widgets.chat",
			"_widgetOptions.showHeader"
		],
		"references": [
			{
				"keyPath": "_widgets.chat",
				"localKey": "chat",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.chat"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			}
		]
	},
	{
		"file": "packages/features/federation/frontend/widgets/WidgetFederation.vue",
		"sha256": "77380206b098f05395a3b9293092469dbe458d834ca79cf3a79c394e70beebc5",
		"importOffset": 1716,
		"keyPaths": [
			"_widgets.federation",
			"_widgetOptions.showHeader"
		],
		"references": [
			{
				"keyPath": "_widgets.federation",
				"localKey": "federation",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.federation"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			}
		]
	},
	{
		"file": "packages/features/collections/frontend/pages/gallery/edit.vue",
		"sha256": "560df77f2639f195f5ad45b2f45ee3c30273194fb4f9bdff8c60507ba45cdcf2",
		"importOffset": 456,
		"keyPaths": [
			"edit",
			"postToGallery"
		],
		"references": [
			{
				"keyPath": "edit",
				"localKey": "edit",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.edit"
			},
			{
				"keyPath": "postToGallery",
				"localKey": "postToGallery",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.postToGallery"
			}
		]
	},
	{
		"file": "packages/features/integrations/frontend/pages/admin/system-webhook.vue",
		"sha256": "5078fda8e3ad7d24e9463124c263f00224270f3d96bdf38277fe95a00a7076da",
		"importOffset": 1198,
		"keyPaths": [
			"_webhookSettings.createWebhook",
			"_webhookSettings.deleteConfirm"
		],
		"references": [
			{
				"keyPath": "_webhookSettings.createWebhook",
				"localKey": "createWebhook",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.createWebhook"
			},
			{
				"keyPath": "_webhookSettings.deleteConfirm",
				"localKey": "deleteConfirm",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.deleteConfirm"
			}
		]
	},
	{
		"file": "packages/features/notifications/frontend/ui/deck/notifications-column.vue",
		"sha256": "9ec49864056d04a259ada6220d14a6769e0580598332e91e29361c379bf09710",
		"importOffset": 996,
		"keyPaths": [
			"_deck._columns.notifications",
			"notificationSetting"
		],
		"references": [
			{
				"keyPath": "_deck._columns.notifications",
				"localKey": "notifications",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.notifications"
			},
			{
				"keyPath": "notificationSetting",
				"localKey": "notificationSetting",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.notificationSetting"
			}
		]
	},
	{
		"file": "packages/features/operations/frontend/widgets/WidgetJobQueue.vue",
		"sha256": "851efd4e1333b4ee00098a16682d03b9d79a5fa0d45815db71fa126c5c55d84a",
		"importOffset": 3509,
		"keyPaths": [
			"_widgetOptions.transparent",
			"_widgetOptions._jobQueue.sound"
		],
		"references": [
			{
				"keyPath": "_widgetOptions.transparent",
				"localKey": "transparent",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.transparent"
			},
			{
				"keyPath": "_widgetOptions._jobQueue.sound",
				"localKey": "sound",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.sound"
			}
		]
	},
	{
		"file": "packages/features/pages/frontend/pages/page-editor/els/page-editor.el.section.vue",
		"sha256": "ffd254446d04e31e3eca64db95c294733eda7fb09bec37ff3bb70ca591a7266e",
		"importOffset": 1018,
		"keyPaths": [
			"_pages.enterSectionTitle",
			"_pages.chooseBlock"
		],
		"references": [
			{
				"keyPath": "_pages.enterSectionTitle",
				"localKey": "enterSectionTitle",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.enterSectionTitle"
			},
			{
				"keyPath": "_pages.chooseBlock",
				"localKey": "chooseBlock",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.chooseBlock"
			}
		]
	},
	{
		"file": "packages/features/play/frontend/widgets/WidgetAiscriptApp.vue",
		"sha256": "c9f7812c02b995daab310114322658d655e7dc21915a53b84aae1d714ccf9cf0",
		"importOffset": 1185,
		"keyPaths": [
			"script",
			"_widgetOptions.showHeader"
		],
		"references": [
			{
				"keyPath": "script",
				"localKey": "script",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.script"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/pages/my-antennas/edit.vue",
		"sha256": "0c413580443a861993aecd0be7cce06f3687045ae8822f25c49f064f06b175d1",
		"importOffset": 553,
		"keyPaths": [
			"timeline",
			"editAntenna"
		],
		"references": [
			{
				"keyPath": "timeline",
				"localKey": "timeline",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.timeline"
			},
			{
				"keyPath": "editAntenna",
				"localKey": "editAntenna",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.editAntenna"
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkForm.file.vue",
		"sha256": "be9a1d99b7139a840a783a7f5bcce6b6d6728d90d5e8d20073add0688e8ca48c",
		"importOffset": 431,
		"keyPaths": [
			"selectFile",
			"fileNotSelected"
		],
		"references": [
			{
				"keyPath": "selectFile",
				"localKey": "selectFile",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.selectFile"
			},
			{
				"keyPath": "fileNotSelected",
				"localKey": "fileNotSelected",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.fileNotSelected"
			}
		]
	},
	{
		"file": "packages/features/instance/frontend/pages/admin/external-services.vue",
		"sha256": "2ee9c48955cc51c17587efe6e152457a27e35eccb3a5ba806f521657a700fc53",
		"importOffset": 2360,
		"keyPaths": [
			"externalServices",
			"beta"
		],
		"references": [
			{
				"keyPath": "externalServices",
				"localKey": "externalServices",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.externalServices"
			},
			{
				"keyPath": "beta",
				"localKey": "beta",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.beta"
			},
			{
				"keyPath": "externalServices",
				"localKey": "externalServices",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.externalServices"
			}
		]
	},
	{
		"file": "packages/features/users/frontend/pages/settings/profiles.vue",
		"sha256": "8cae850c23acd81641ced16b3e138cb672ffdae27dc61e09d6e8bacbe4d997ba",
		"importOffset": 721,
		"keyPaths": [
			"_preferencesProfile.manageProfiles",
			"delete"
		],
		"references": [
			{
				"keyPath": "_preferencesProfile.manageProfiles",
				"localKey": "manageProfiles",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.manageProfiles"
			},
			{
				"keyPath": "delete",
				"localKey": "delete",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.delete"
			},
			{
				"keyPath": "_preferencesProfile.manageProfiles",
				"localKey": "manageProfiles",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.manageProfiles"
			}
		]
	},
	{
		"file": "packages/features/avatar-decorations/frontend/pages/avatar-decorations.vue",
		"sha256": "611d30c51b0eaeedc5e3a2a8509b7bb5d8c723c480f00a356dd29421cede9f43",
		"importOffset": 1320,
		"keyPaths": [
			"other",
			"add",
			"avatarDecorations"
		],
		"references": [
			{
				"keyPath": "other",
				"localKey": "other",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.other"
			},
			{
				"keyPath": "add",
				"localKey": "add",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.add"
			},
			{
				"keyPath": "avatarDecorations",
				"localKey": "avatarDecorations",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.avatarDecorations"
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/pages/tag.vue",
		"sha256": "6fe24bed735a0a5df21905bcf5628a1422f9b0963e1448fe352205028f31526a",
		"importOffset": 1028,
		"keyPaths": [
			"postToHashtag",
			"more",
			"embed"
		],
		"references": [
			{
				"keyPath": "postToHashtag",
				"localKey": "postToHashtag",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.postToHashtag"
			},
			{
				"keyPath": "more",
				"localKey": "more",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.more"
			},
			{
				"keyPath": "embed",
				"localKey": "embed",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.embed"
			}
		]
	},
	{
		"file": "packages/features/discovery/frontend/widgets/WidgetTrends.vue",
		"sha256": "ad1fdc96ee680a4dc4a3df7a7c475a5df08ce8575ced3b72b5e1d29c4804a211",
		"importOffset": 1554,
		"keyPaths": [
			"_widgets.trends",
			"nUsersMentioned",
			"_widgetOptions.showHeader"
		],
		"references": [
			{
				"keyPath": "_widgets.trends",
				"localKey": "trends",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.trends"
			},
			{
				"keyPath": "nUsersMentioned",
				"localKey": "nUsersMentioned",
				"kind": "tsx",
				"script": false,
				"replacement": "$l.sfc.nUsersMentioned"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/drive.file.vue",
		"sha256": "5d953baf3a8a79f0423883662829d75db081ba7a5198d865fc13d0149b48916a",
		"importOffset": 665,
		"keyPaths": [
			"info",
			"_fileViewer.attachedNotes",
			"_fileViewer.title"
		],
		"references": [
			{
				"keyPath": "info",
				"localKey": "info",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.info"
			},
			{
				"keyPath": "_fileViewer.attachedNotes",
				"localKey": "attachedNotes",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.attachedNotes"
			},
			{
				"keyPath": "_fileViewer.title",
				"localKey": "title",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.title"
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/widgets/WidgetPhotos.vue",
		"sha256": "d3d9aee86cdafc7cd8be6468d92d3501e26dbaa6884b7cce4ab0604cd56960b7",
		"importOffset": 1493,
		"keyPaths": [
			"_widgets.photos",
			"_widgetOptions.showHeader",
			"_widgetOptions.transparent"
		],
		"references": [
			{
				"keyPath": "_widgets.photos",
				"localKey": "photos",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.photos"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			},
			{
				"keyPath": "_widgetOptions.transparent",
				"localKey": "transparent",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.transparent"
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/widgets/WidgetSlideshow.vue",
		"sha256": "79ec3a6a63a50be196d5a671aafc7f7f278069ed79fe056fd46075092dc5675b",
		"importOffset": 1170,
		"keyPaths": [
			"folder",
			"nothing",
			"_widgetOptions.height"
		],
		"references": [
			{
				"keyPath": "folder",
				"localKey": "folder",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.folder"
			},
			{
				"keyPath": "nothing",
				"localKey": "nothing",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.nothing"
			},
			{
				"keyPath": "_widgetOptions.height",
				"localKey": "height",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.height"
			}
		]
	},
	{
		"file": "packages/features/notifications/frontend/widgets/WidgetNotifications.vue",
		"sha256": "8de19ed9127da29a71727ca46548252b0089ac3aa127557e80ffc2674d99fb53",
		"importOffset": 1416,
		"keyPaths": [
			"notifications",
			"_widgetOptions.showHeader",
			"height"
		],
		"references": [
			{
				"keyPath": "notifications",
				"localKey": "notifications",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.notifications"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			},
			{
				"keyPath": "height",
				"localKey": "height",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.height"
			}
		]
	},
	{
		"file": "packages/features/play/frontend/widgets/WidgetAiscript.vue",
		"sha256": "37d2157c49c8158426cbaa6a494c25fe06c4a9973387410a4f898cbe3fb6e840",
		"importOffset": 1433,
		"keyPaths": [
			"_widgets.aiscript",
			"_widgetOptions.showHeader",
			"script"
		],
		"references": [
			{
				"keyPath": "_widgets.aiscript",
				"localKey": "aiscript",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.aiscript"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			},
			{
				"keyPath": "script",
				"localKey": "script",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.script"
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/statusbar.vue",
		"sha256": "35356d677d2ce3d194232687a45515d279a4974dcb402c9aa9277affa01db638",
		"importOffset": 921,
		"keyPaths": [
			"notSet",
			"add",
			"statusbar"
		],
		"references": [
			{
				"keyPath": "notSet",
				"localKey": "notSet",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.notSet"
			},
			{
				"keyPath": "add",
				"localKey": "add",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.add"
			},
			{
				"keyPath": "statusbar",
				"localKey": "statusbar",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.statusbar"
			}
		]
	},
	{
		"file": "packages/features/share/frontend/pages/qr.vue",
		"sha256": "c3ab7206c834144274d0aa21346197e59380547c845a339dc492fe6d0f10362c",
		"importOffset": 879,
		"keyPaths": [
			"_qr.showTabTitle",
			"_qr.readTabTitle",
			"qr"
		],
		"references": [
			{
				"keyPath": "_qr.showTabTitle",
				"localKey": "showTabTitle",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.showTabTitle"
			},
			{
				"keyPath": "_qr.readTabTitle",
				"localKey": "readTabTitle",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.readTabTitle"
			},
			{
				"keyPath": "qr",
				"localKey": "qr",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.qr"
			}
		]
	},
	{
		"file": "packages/features/share/frontend/pages/share.vue",
		"sha256": "718eedeccaac2a6e5b33e2487eaa4a3fd3a17828571303ef10f1a8c3c444cb74",
		"importOffset": 1404,
		"keyPaths": [
			"close",
			"goToMisskey",
			"share"
		],
		"references": [
			{
				"keyPath": "close",
				"localKey": "close",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.close"
			},
			{
				"keyPath": "goToMisskey",
				"localKey": "goToMisskey",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.goToMisskey"
			},
			{
				"keyPath": "share",
				"localKey": "share",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.share"
			}
		]
	},
	{
		"file": "packages/features/statistics/frontend/widgets/server-metric/index.vue",
		"sha256": "632ea9206e0061c2417a0cedbf7c5ad5d6e36ab81c5a8ccc245432ef0752f840",
		"importOffset": 2036,
		"keyPaths": [
			"_widgets.serverMetric",
			"_widgetOptions.showHeader",
			"_widgetOptions.transparent"
		],
		"references": [
			{
				"keyPath": "_widgets.serverMetric",
				"localKey": "serverMetric",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.serverMetric"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			},
			{
				"keyPath": "_widgetOptions.transparent",
				"localKey": "transparent",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.transparent"
			}
		]
	},
	{
		"file": "packages/features/statistics/frontend/widgets/WidgetActivity.vue",
		"sha256": "38d3e2f5da320d7e21846333a09e9501a9426197c25f237b7dffdf8515f577f2",
		"importOffset": 1535,
		"keyPaths": [
			"_widgets.activity",
			"_widgetOptions.showHeader",
			"_widgetOptions.transparent"
		],
		"references": [
			{
				"keyPath": "_widgets.activity",
				"localKey": "activity",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.activity"
			},
			{
				"keyPath": "_widgetOptions.showHeader",
				"localKey": "showHeader",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.showHeader"
			},
			{
				"keyPath": "_widgetOptions.transparent",
				"localKey": "transparent",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.transparent"
			}
		]
	},
	{
		"file": "packages/features/timelines/frontend/pages/my-antennas/index.vue",
		"sha256": "200bed1e15cd1dc5dd7e80b513c5c419b38d023beef475f988ad45c8f4761dc2",
		"importOffset": 859,
		"keyPaths": [
			"add",
			"reload",
			"manageAntennas"
		],
		"references": [
			{
				"keyPath": "add",
				"localKey": "add",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.add"
			},
			{
				"keyPath": "reload",
				"localKey": "reload",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.reload"
			},
			{
				"keyPath": "manageAntennas",
				"localKey": "manageAntennas",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.manageAntennas"
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/global/MkTip.vue",
		"sha256": "d416a25f6db591298d2606b6ca5a454f6912e4dd2cb70b805897d755d1002530",
		"importOffset": 641,
		"keyPaths": [
			"tip",
			"gotIt",
			"hideAllTips"
		],
		"references": [
			{
				"keyPath": "tip",
				"localKey": "tip",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.tip"
			},
			{
				"keyPath": "gotIt",
				"localKey": "gotIt",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.gotIt"
			},
			{
				"keyPath": "hideAllTips",
				"localKey": "hideAllTips",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.hideAllTips"
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/components/MkFormFooter.vue",
		"sha256": "216167e9611240a8d02adaf145cfe69587e57ccd75b0629db0d2045a00fd8f17",
		"importOffset": 772,
		"keyPaths": [
			"thereAreNChanges",
			"discard",
			"save"
		],
		"references": [
			{
				"keyPath": "thereAreNChanges",
				"localKey": "thereAreNChanges",
				"kind": "tsx",
				"script": false,
				"replacement": "$l.sfc.thereAreNChanges"
			},
			{
				"keyPath": "discard",
				"localKey": "discard",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.discard"
			},
			{
				"keyPath": "save",
				"localKey": "save",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.save"
			}
		]
	},
	{
		"file": "packages/features/ui/frontend/widgets/WidgetButton.vue",
		"sha256": "c9ed96e87e24b610fcbf7e294a0255cc8b0fa81e526d14155e3dd1ee1cc2897e",
		"importOffset": 890,
		"keyPaths": [
			"label",
			"_widgetOptions._button.colored",
			"script"
		],
		"references": [
			{
				"keyPath": "label",
				"localKey": "label",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.label"
			},
			{
				"keyPath": "_widgetOptions._button.colored",
				"localKey": "colored",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.colored"
			},
			{
				"keyPath": "script",
				"localKey": "script",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.script"
			}
		]
	},
	{
		"file": "packages/features/channels/frontend/ui/deck/channel-column.vue",
		"sha256": "f42d86f45b5c3e7e2472a09d9ed66c6b064003b7fc7ca9f8e5a197f113734bc1",
		"importOffset": 1637,
		"keyPaths": [
			"_deck._columns.channel",
			"selectChannel",
			"_deck.newNoteNotificationSettings"
		],
		"references": [
			{
				"keyPath": "_deck._columns.channel",
				"localKey": "channel",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.channel"
			},
			{
				"keyPath": "selectChannel",
				"localKey": "selectChannel",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.selectChannel"
			},
			{
				"keyPath": "selectChannel",
				"localKey": "selectChannel",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.selectChannel"
			},
			{
				"keyPath": "_deck.newNoteNotificationSettings",
				"localKey": "newNoteNotificationSettings",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.newNoteNotificationSettings"
			}
		]
	},
	{
		"file": "packages/features/roles/frontend/ui/deck/role-timeline-column.vue",
		"sha256": "f1f874346cd07418b3ee832cf6ff08f43de2512533fdd7dae00b1a7f0e260e3c",
		"importOffset": 1238,
		"keyPaths": [
			"_deck._columns.roleTimeline",
			"role",
			"_deck.newNoteNotificationSettings"
		],
		"references": [
			{
				"keyPath": "_deck._columns.roleTimeline",
				"localKey": "roleTimeline",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.roleTimeline"
			},
			{
				"keyPath": "role",
				"localKey": "role",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.role"
			},
			{
				"keyPath": "role",
				"localKey": "role",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.role"
			},
			{
				"keyPath": "_deck.newNoteNotificationSettings",
				"localKey": "newNoteNotificationSettings",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.newNoteNotificationSettings"
			}
		]
	},
	{
		"file": "packages/features/operations/frontend/pages/admin/job-queue.vue",
		"sha256": "4846839c7db8dfb369ccbfb237af0dc2aa234bcb9957ab36307e7b5247930daa",
		"importOffset": 6682,
		"keyPaths": [
			"search",
			"areYouSure",
			"jobQueue"
		],
		"references": [
			{
				"keyPath": "search",
				"localKey": "search",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.search"
			},
			{
				"keyPath": "areYouSure",
				"localKey": "areYouSure",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.areYouSure"
			},
			{
				"keyPath": "areYouSure",
				"localKey": "areYouSure",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.areYouSure"
			},
			{
				"keyPath": "areYouSure",
				"localKey": "areYouSure",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.areYouSure"
			},
			{
				"keyPath": "areYouSure",
				"localKey": "areYouSure",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.areYouSure"
			},
			{
				"keyPath": "jobQueue",
				"localKey": "jobQueue",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.jobQueue"
			},
			{
				"keyPath": "jobQueue",
				"localKey": "jobQueue",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.jobQueue"
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/settings/drive.ImageFrameItem.vue",
		"sha256": "3d756d212743ed10b57b2eb219fe05b399f91adbd953f90dfbca8050687f793a",
		"importOffset": 1176,
		"keyPaths": [
			"preset",
			"noName",
			"edit",
			"delete"
		],
		"references": [
			{
				"keyPath": "preset",
				"localKey": "preset",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.preset"
			},
			{
				"keyPath": "noName",
				"localKey": "noName",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.noName"
			},
			{
				"keyPath": "edit",
				"localKey": "edit",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.edit"
			},
			{
				"keyPath": "delete",
				"localKey": "delete",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.delete"
			}
		]
	},
	{
		"file": "packages/features/drive/frontend/pages/settings/drive.WatermarkItem.vue",
		"sha256": "235084c2be4a01c73b00ebcb14cd455949d892507a9ffc9d418d5ae8741223a8",
		"importOffset": 1150,
		"keyPaths": [
			"preset",
			"noName",
			"edit",
			"delete"
		],
		"references": [
			{
				"keyPath": "preset",
				"localKey": "preset",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.preset"
			},
			{
				"keyPath": "noName",
				"localKey": "noName",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.noName"
			},
			{
				"keyPath": "edit",
				"localKey": "edit",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.edit"
			},
			{
				"keyPath": "delete",
				"localKey": "delete",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.delete"
			}
		]
	},
	{
		"file": "packages/features/emojis/frontend/pages/admin/custom-emojis-manager2.vue",
		"sha256": "1abbb35175857410f34f53535c3193ef5216b408fb27bff394009cb30b0e4207",
		"importOffset": 470,
		"keyPaths": [
			"local",
			"remote",
			"_customEmojisManager._local.tabTitleRegister",
			"customEmojis"
		],
		"references": [
			{
				"keyPath": "local",
				"localKey": "local",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.local"
			},
			{
				"keyPath": "remote",
				"localKey": "remote",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.remote"
			},
			{
				"keyPath": "_customEmojisManager._local.tabTitleRegister",
				"localKey": "tabTitleRegister",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.tabTitleRegister"
			},
			{
				"keyPath": "customEmojis",
				"localKey": "customEmojis",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.customEmojis"
			}
		]
	},
	{
		"file": "packages/features/federation/frontend/pages/lookup.vue",
		"sha256": "52ea7faac0da573f49dc04c1a52beb9d47440e16e11efdb25e5ede4d184a3b25",
		"importOffset": 755,
		"keyPaths": [
			"close",
			"goToMisskey",
			"fetchingAsApObject",
			"lookup"
		],
		"references": [
			{
				"keyPath": "close",
				"localKey": "close",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.close"
			},
			{
				"keyPath": "goToMisskey",
				"localKey": "goToMisskey",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.goToMisskey"
			},
			{
				"keyPath": "fetchingAsApObject",
				"localKey": "fetchingAsApObject",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.fetchingAsApObject"
			},
			{
				"keyPath": "lookup",
				"localKey": "lookup",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.lookup"
			}
		]
	},
	{
		"file": "packages/features/preferences/frontend/pages/settings/custom-css.vue",
		"sha256": "3568b5f2d3844dfd5f128132077f086f3fa4d62ad792f192064941d60d84fcbb",
		"importOffset": 843,
		"keyPaths": [
			"customCssWarn",
			"customCssIsDisabledBecauseSafeMode",
			"reloadToApplySetting",
			"customCss"
		],
		"references": [
			{
				"keyPath": "customCssWarn",
				"localKey": "customCssWarn",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.customCssWarn"
			},
			{
				"keyPath": "customCssIsDisabledBecauseSafeMode",
				"localKey": "customCssIsDisabledBecauseSafeMode",
				"kind": "ts",
				"script": false,
				"replacement": "$locale.sfc.customCssIsDisabledBecauseSafeMode"
			},
			{
				"keyPath": "reloadToApplySetting",
				"localKey": "reloadToApplySetting",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.reloadToApplySetting"
			},
			{
				"keyPath": "customCss",
				"localKey": "customCss",
				"kind": "ts",
				"script": true,
				"replacement": "$locale.value.sfc.customCss"
			}
		]
	}
] as const;

function getLocaleValue(language: string, keyPath: string): string {
	const value = keyPath.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], locales[language]);
	if (typeof value !== 'string') throw new Error(`Expected locale text at ${language}:${keyPath}`);
	return value;
}

function getBlocks(file: string, source = readFileSync(resolve(repoRoot, file), 'utf8')): Map<string, Record<string, string>> {
	const { descriptor, errors } = parse(source, { filename: file });
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
	for (const name of ['PageWithHeader', 'MkA', 'MkAvatar', 'MkUserName', 'MkCondensedLine']) app.component(name, slotContainer);
	app.component('MkSuspense', Vue.defineComponent({ setup: (_props, { slots }) => () => Vue.h('div', slots.default?.({ result: null })) }));
	app.component('MkTime', Vue.defineComponent({ setup: () => () => null }));
	// eslint-disable-next-line vue/multi-word-component-names -- Match the existing application global.
	app.component('Mfm', Vue.defineComponent({ props: ['text'], setup: props => () => Vue.h('span', props.text) }));
	const element = document.createElement('div');
	app.mount(element);
	return { app, element };
}

describe('expanded literal SFC-local locale migration', () => {
	test.each(migrations)('$file compiles with actual VVI-injected computed refs and template bindings', async ({ file }) => {
		expect(await compileSource(file)).toContain('virtual:vite-vue-internationalization');
	});

	test.each(migrations)('$file preserves every translation, placeholder, occurrence and source boundary', migration => {
		const { file, sha256, importOffset, keyPaths, references } = migration;
		const source = restorePwaShareSourceBaseline(file, readFileSync(resolve(repoRoot, file), 'utf8'));
		const blocks = getBlocks(file, source);
		expect([...blocks.keys()]).toEqual(languages);
		expect(source).not.toMatch(/\bi18n\s*\./);
		expect(source).not.toContain("from '@features/runtime/frontend/i18n.js'");
		const uniqueReferences = [...new Map(references.map(reference => [reference.replacement, reference])).values()];
		for (const { replacement } of uniqueReferences) {
			expect(source.split(replacement).length - 1).toBe(references.filter(reference => reference.replacement === replacement).length);
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
		const separatorNewlines = 'localeSeparatorNewlines' in migration ? migration.localeSeparatorNewlines : 1;
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

	// Locale settings request a reload. Exercise fresh localized mounts in each
	// language while retaining the actual component's reactive/event boundaries.
	test.each(['ja-JP', 'en-US'])('compiled gallery metadata reacts to post ID changes after a %s boot', async language => {
		const file = 'packages/features/collections/frontend/pages/gallery/edit.vue';
		let metadata: ComputedRef<{ title: string }> | undefined;
		const api = vi.fn();
		const component = await compileComponent(file, {
			'@features/collections/frontend/pages/gallery/edit.root.vue': { default: slotContainer },
			'@features/api/frontend/utility/misskey-api.js': { misskeyApi: api },
			'@features/navigation/frontend/page.js': { definePage: (getter: () => { title: string }) => { metadata = Vue.computed(getter); } },
		});
		const postId = Vue.ref<string>();
		const parent = Vue.defineComponent({ setup: () => () => Vue.h(component, { postId: postId.value }) });
		const mounted = await mountLocalized(language, file, parent);
		try {
			expect(metadata!.value.title).toBe(locales[language].postToGallery);
			postId.value = 'existing';
			await Vue.nextTick();
			expect(metadata!.value.title).toBe(locales[language].edit);
			postId.value = undefined;
			await Vue.nextTick();
			expect(metadata!.value.title).toBe(locales[language].postToGallery);
			expect(api).not.toHaveBeenCalled();
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled file selector retains cancel, validation and later computed labels in %s', async language => {
		const file = 'packages/features/ui/frontend/components/MkForm.file.vue';
		const rejected = { id: 'rejected', name: 'Rejected', url: '/rejected' };
		const accepted = { id: 'accepted', name: 'Accepted', url: '/accepted' };
		const later = { id: 'later', name: '', url: '/later' };
		const select = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(rejected).mockResolvedValueOnce(accepted).mockResolvedValueOnce(later);
		const validate = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(true);
		const update = vi.fn();
		const api = vi.fn();
		const component = await compileComponent(file, {
			'@features/ui/frontend/components/MkButton.vue': { default: slotButton },
			'@features/drive/frontend/utility/drive.js': { selectFile: select },
			'@features/api/frontend/utility/misskey-api.js': { misskeyApi: api },
		});
		const mounted = await mountLocalized(language, file, component, { validate, onUpdate: update });
		const click = async () => {
			mounted.element.querySelector('button')!.click();
			await new Promise<void>(resolve => window.setTimeout(resolve, 0));
		};
		try {
			expect(mounted.element.textContent).toContain(locales[language].selectFile);
			expect(mounted.element.textContent).toContain(locales[language].fileNotSelected);
			await click();
			expect(validate).not.toHaveBeenCalled();
			expect(update).not.toHaveBeenCalled();
			await click();
			expect(validate).toHaveBeenNthCalledWith(1, rejected);
			expect(update).not.toHaveBeenCalled();
			expect(mounted.element.textContent).toContain(locales[language].fileNotSelected);
			await click();
			expect(update).toHaveBeenNthCalledWith(1, accepted);
			expect(mounted.element.textContent).toContain('Accepted');
			expect(mounted.element.textContent).not.toContain(locales[language].fileNotSelected);
			await click();
			expect(update).toHaveBeenNthCalledWith(2, later);
			expect(mounted.element.textContent).toContain('/later');
			expect(mounted.element.textContent).not.toContain('Accepted');
			expect(api).not.toHaveBeenCalled();
			expect(select).toHaveBeenCalledTimes(4);
			for (const [options] of select.mock.calls) expect(options).toEqual({ anchorElement: mounted.element.querySelector('button'), multiple: false });
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled form footer reacts to count, disabled saving and discard state in %s', async language => {
		const file = 'packages/features/ui/frontend/components/MkFormFooter.vue';
		const modified = Vue.ref(true);
		const modifiedCount = Vue.ref(2);
		const canSaving = Vue.ref(false);
		const save = vi.fn();
		const discard = vi.fn(() => { modified.value = false; });
		const form = { modified, modifiedCount, save, discard };
		const component = await compileComponent(file, { '@features/ui/frontend/components/MkButton.vue': { default: slotButton } });
		const parent = Vue.defineComponent({ setup: () => () => Vue.h(component, { form, canSaving: canSaving.value }) });
		const mounted = await mountLocalized(language, file, parent);
		try {
			expect(mounted.element.textContent).toContain(legacyFormat(language, 'thereAreNChanges', { n: 2 }));
			expect(mounted.element.querySelectorAll('button')[0].textContent).toContain(locales[language].discard);
			expect(mounted.element.querySelectorAll('button')[1].textContent).toContain(locales[language].save);
			mounted.element.querySelectorAll('button')[1].click();
			expect(save).not.toHaveBeenCalled();
			modifiedCount.value = 7;
			canSaving.value = true;
			await Vue.nextTick();
			expect(mounted.element.textContent).toContain(legacyFormat(language, 'thereAreNChanges', { n: 7 }));
			mounted.element.querySelectorAll('button')[1].click();
			expect(save).toHaveBeenCalledOnce();
			mounted.element.querySelectorAll('button')[0].click();
			await Vue.nextTick();
			expect(discard).toHaveBeenCalledOnce();
			expect(mounted.element.querySelectorAll('button')).toHaveLength(0);
			modified.value = true;
			modifiedCount.value = 1;
			await Vue.nextTick();
			expect(mounted.element.textContent).toContain(legacyFormat(language, 'thereAreNChanges', { n: 1 }));
		} finally { mounted.app.unmount(); }
	});

	test.each(['ja-JP', 'en-US'])('compiled custom CSS watcher localizes later confirmations and preserves cancel/reload in %s', async language => {
		const file = 'packages/features/preferences/frontend/pages/settings/custom-css.vue';
		const confirmation = vi.fn().mockResolvedValueOnce({ canceled: true }).mockResolvedValueOnce({ canceled: false });
		const reload = vi.fn();
		const setItem = vi.fn();
		let metadata: ComputedRef<{ title: string }> | undefined;
		const editor = Vue.defineComponent({
			props: ['modelValue'],
			setup: (props, { emit }) => () => Vue.h('textarea', {
				value: props.modelValue,
				onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
			}),
		});
		const component = await compileComponent(file, {
			'@features/markup/frontend/components/MkCodeEditor.vue': { default: editor },
			'@features/ui/frontend/components/MkInfo.vue': { default: slotContainer },
			'@features/boot/frontend/shared/config.js': { isSafeMode: true },
			'@features/ui/frontend/os.js': { confirm: confirmation },
			'@features/runtime/frontend/utility/unison-reload.js': { unisonReload: reload },
			'@features/preferences/frontend/local-storage.js': { miLocalStorage: { getItem: () => 'initial', setItem } },
			'@features/navigation/frontend/page.js': { definePage: (getter: () => { title: string }) => { metadata = Vue.computed(getter); } },
		});
		const mounted = await mountLocalized(language, file, component);
		const edit = async (value: string) => {
			const textarea = mounted.element.querySelector('textarea')!;
			textarea.value = value;
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			await new Promise<void>(resolve => window.setTimeout(resolve, 0));
		};
		try {
			expect(metadata!.value.title).toBe(locales[language].customCss);
			expect(mounted.element.textContent).toContain(locales[language].customCssWarn);
			expect(mounted.element.textContent).toContain(locales[language].customCssIsDisabledBecauseSafeMode);
			expect(setItem).not.toHaveBeenCalled();
			expect(confirmation).not.toHaveBeenCalled();
			await edit('first');
			expect(setItem).toHaveBeenNthCalledWith(1, 'customCss', 'first');
			expect(confirmation).toHaveBeenNthCalledWith(1, { type: 'info', text: locales[language].reloadToApplySetting });
			expect(reload).not.toHaveBeenCalled();
			await edit('second');
			expect(setItem).toHaveBeenNthCalledWith(2, 'customCss', 'second');
			expect(confirmation).toHaveBeenNthCalledWith(2, { type: 'info', text: locales[language].reloadToApplySetting });
			expect(reload).toHaveBeenCalledOnce();
		} finally { mounted.app.unmount(); }
	});
});
