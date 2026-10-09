<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { '_forceShrinkSpacer': deviceKind === 'smartphone' }]">
	<XTitlebar v-if="prefer.r.showTitlebar.value" style="flex-shrink: 0;"/>

	<div :class="$style.nonTitlebarArea">
		<XSidebar v-if="!isMobile" :class="$style.sidebar" :showWidgetButton="!showWidgetsSide" @widgetButtonClick="widgetsShowing = true"/>

		<div :class="[$style.contents, !isMobile && prefer.r.showTitlebar.value ? $style.withSidebarAndTitlebar : null]" @contextmenu.stop="onContextmenu">
			<div>
				<XReloadSuggestion v-if="shouldSuggestReload"/>
				<XPreferenceRestore v-if="shouldSuggestRestoreBackup"/>
				<XThemePreviewing v-if="isThemePreviewMode"/>
				<XAnnouncements v-if="$i"/>
				<XStatusBars :class="$style.statusbars"/>
			</div>
			<StackingRouterView v-if="prefer.s['experimental.stackingRouterView']" :class="$style.content"/>
			<RouterView v-else :class="$style.content"/>
			<XMobileFooterMenu v-if="isMobile" ref="navFooter" v-model:drawerMenuShowing="drawerMenuShowing" v-model:widgetsShowing="widgetsShowing"/>
		</div>

		<div v-if="showWidgetsSide && !pageMetadata?.needWideArea" :class="$style.widgets">
			<XWidgets/>
		</div>
	</div>

	<XCommon v-model:drawerMenuShowing="drawerMenuShowing" v-model:widgetsShowing="widgetsShowing"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, provide, onMounted, computed, ref } from 'vue';
import { instanceName } from '@features/boot/frontend/shared/config.js';
import { isLink } from '@features/ui/frontend/shared/is-link.js';
import XCommon from './_common_/common.vue';
import type { PageMetadata } from '@features/navigation/frontend/page.js';
import XMobileFooterMenu from '@features/navigation/frontend/ui/_common_/mobile-footer-menu.vue';
import XPreferenceRestore from '@features/preferences/frontend/ui/_common_/PreferenceRestore.vue';
import XReloadSuggestion from '@features/boot/frontend/ui/_common_/ReloadSuggestion.vue';
import XThemePreviewing from '@features/preferences/frontend/ui/_common_/ThemePreviewing.vue';
import XTitlebar from '@features/navigation/frontend/ui/_common_/titlebar.vue';
import XSidebar from '@features/navigation/frontend/ui/_common_/navbar.vue';
import { isPreviewMode as isThemePreviewMode } from '@features/preferences/frontend/theme.js';
import * as os from '@features/ui/frontend/os.js';
import { $i } from '@features/auth/frontend/i.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@features/navigation/frontend/page.js';
import { deviceKind } from '@features/ui/frontend/utility/device-kind.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { mainRouter } from '@features/navigation/frontend/router.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { shouldSuggestRestoreBackup } from '@features/preferences/frontend/state/utility.js';
import { DI } from '@features/ui/frontend/di.js';
import { shouldSuggestReload } from '@features/boot/frontend/utility/reload-suggest.js';

const XWidgets = defineAsyncComponent(() => import('./_common_/widgets.vue'));
const XStatusBars = defineAsyncComponent(() => import('@features/navigation/frontend/ui/_common_/statusbars.vue'));
const XAnnouncements = defineAsyncComponent(() => import('@features/announcements/frontend/ui/_common_/announcements.vue'));

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const DESKTOP_THRESHOLD = 1100;
const MOBILE_THRESHOLD = 500;

// デスクトップでウィンドウを狭くしたときモバイルUIが表示されて欲しいことはあるので deviceKind === 'desktop' の判定は行わない
const showWidgetsSide = window.innerWidth >= DESKTOP_THRESHOLD;

const isMobile = ref(deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD);
window.addEventListener('resize', () => {
	isMobile.value = deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD;
});

const pageMetadata = ref<null | PageMetadata>(null);
const widgetsShowing = ref(false);

provide(DI.router, mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			window.document.title = pageMetadata.value.title;
		} else {
			window.document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);

const drawerMenuShowing = ref(false);

mainRouter.on('change', () => {
	drawerMenuShowing.value = false;
});

if (window.innerWidth > 1024) {
	const tempUI = miLocalStorage.getItem('ui_temp');
	if (tempUI) {
		miLocalStorage.setItem('ui', tempUI);
		miLocalStorage.removeItem('ui_temp');
		window.location.reload();
	}
}

function onContextmenu(ev: PointerEvent) {
	if (isLink(ev.target as HTMLElement)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes((ev.target as HTMLElement).tagName) || (ev.target as HTMLElement).attributes.getNamedItem('contenteditable') != null) return;
	if (window.getSelection()?.toString() !== '') return;
	const path = mainRouter.getCurrentFullPath();
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: 'ti ti-window-maximize',
		text: $locale.value.sfc.openInWindow,
		action: () => {
			os.pageWindow(path);
		},
	}], ev);
}
</script>

<style lang="scss" module>
$widgets-hide-threshold: 1090px;

.root {
	height: 100dvh;
	overflow: clip;
	contain: strict;
	display: flex;
	flex-direction: column;
	background: var(--MI_THEME-navBg);
}

.nonTitlebarArea {
	display: flex;
	flex: 1;
	min-height: 0;
}

.sidebar {
	border-right: solid 0.5px var(--MI_THEME-divider);
}

.contents {
	display: flex;
	flex-direction: column;
	flex: 1;
	height: 100%;
	min-width: 0;

	&.withSidebarAndTitlebar {
		background: var(--MI_THEME-navBg);
		border-radius: 12px 0 0 0;
		overflow: clip;
	}
}

.content {
	flex: 1;
	min-height: 0;
}

.statusbars {
	position: sticky;
	top: 0;
	left: 0;
}

.widgets {
	width: 350px;
	height: 100%;
	box-sizing: border-box;
	overflow: auto;
	padding: var(--MI-margin) var(--MI-margin) calc(var(--MI-margin) + env(safe-area-inset-bottom, 0px));
	border-left: solid 0.5px var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);

	@media (max-width: $widgets-hide-threshold) {
		display: none;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"openInWindow": "افتح في نافذة جديدة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"openInWindow": "Obrir en una finestra nova"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"openInWindow": "Otevřít v novém okně"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"openInWindow": "Open in window"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"openInWindow": "In einem Fenster öffnen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"openInWindow": "Open in window"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"openInWindow": "Abrir en una ventana"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"openInWindow": "Ouvrir dans une nouvelle fenêtre"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"openInWindow": "Buka di jendela"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"openInWindow": "Apri in una finestra"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"openInWindow": "ウィンドウで開く"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"openInWindow": "ウィンドウで開く"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"openInWindow": "Open in window"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"openInWindow": "Open in window"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"openInWindow": "창으로 열기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"openInWindow": "In een venster openen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"openInWindow": "Åpne i vindu"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"openInWindow": "Otwórz w oknie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"openInWindow": "Abrir em um janela"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"openInWindow": "Открыть в плавающем окне"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"openInWindow": "Otvoriť v novom okne"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"openInWindow": "เปิดในหน้าต่าง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"openInWindow": "Pencerede aç"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"openInWindow": "Open in window"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"openInWindow": "Відкрити у вікні"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"openInWindow": "Mở trong cửa sổ mới"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"openInWindow": "在新窗口中打开"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"openInWindow": "在新視窗開啟"
}
</locale>
