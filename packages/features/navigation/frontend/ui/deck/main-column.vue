<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn
	v-if="prefer.s['deck.alwaysShowMainColumn'] || mainRouter.currentRoute.value.name !== 'index'"
	:column="column"
	:isStacked="isStacked"
	:handleScrollToTop="false"
	@headerClick="onHeaderClick"
>
	<template #header>
		<template v-if="pageMetadata">
			<i :class="pageMetadata.icon"></i>
			{{ pageMetadata.title }}
		</template>
	</template>

	<div ref="rootEl" style="height: 100%;">
		<StackingRouterView v-if="prefer.s['experimental.stackingRouterView']" @contextmenu.stop="onContextmenu"/>
		<RouterView v-else @contextmenu.stop="onContextmenu"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { provide, useTemplateRef, ref } from 'vue';
import { isLink } from '@@/js/is-link.js';
import XColumn from './column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { PageMetadata } from '@features/navigation/frontend/page.js';
import * as os from '@features/ui/frontend/os.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@features/navigation/frontend/page.js';
import { mainRouter } from '@features/navigation/frontend/router.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { DI } from '@features/ui/frontend/di.js';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const pageMetadata = ref<null | PageMetadata>(null);
const rootEl = useTemplateRef('rootEl');

provide(DI.router, mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
});
provideReactiveMetadata(pageMetadata);

/*
function back() {
	history.back();
}
*/
function onContextmenu(ev: PointerEvent) {
	if (!ev.target) return;

	if (isLink(ev.target as HTMLElement)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes((ev.target as HTMLElement).tagName) || (ev.target as HTMLElement).attributes.getNamedItem('contenteditable') != null) return;
	if (window.getSelection()?.toString() !== '') return;
	const path = mainRouter.currentRoute.value.path;
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

function onHeaderClick() {
	if (!rootEl.value) return;
	const scrollEl = rootEl.value.querySelector<HTMLElement>('._pageScrollable,._pageScrollableReversed');
	if (scrollEl) {
		scrollEl.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}
}
</script>

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
