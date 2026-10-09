<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a ref="el" :href="to" :class="active ? activeClass : null" @click="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts">
export type MkABehavior = 'window' | 'browser' | null;
</script>

<script lang="ts" setup>
import { computed, inject, useTemplateRef } from 'vue';
import { url } from '@features/boot/frontend/shared/config.js';
import * as os from '@features/ui/frontend/os.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { useRouter } from '@features/navigation/frontend/router.js';

const props = withDefaults(defineProps<{
	to: string;
	activeClass?: null | string;
	behavior?: MkABehavior;
}>(), {
	activeClass: null,
	behavior: null,
});

const behavior = props.behavior ?? inject<MkABehavior>('linkNavigationBehavior', null);
const isWindow = inject<boolean>('inWindow', false);

const el = useTemplateRef('el');

defineExpose({ $el: el });

const router = useRouter();

const active = computed(() => {
	if (props.activeClass == null) return false;
	const resolved = router.resolve(props.to);
	if (resolved == null) return false;
	if (resolved.route.path === router.currentRoute.value.path) return true;
	if (resolved.route.name == null) return false;
	if (router.currentRoute.value.name == null) return false;
	return resolved.route.name === router.currentRoute.value.name;
});

function onContextmenu(ev: PointerEvent) {
	const selection = window.getSelection();
	if (selection && selection.toString() !== '') return;
	os.contextMenu([{
		type: 'label',
		text: props.to,
	}, {
		icon: 'ti ti-app-window',
		text: $locale.value.sfc.openInWindow,
		action: () => {
			os.pageWindow(props.to);
		},
	}, {
		icon: 'ti ti-player-eject',
		text: $locale.value.sfc.showInPage,
		action: () => {
			router.pushByPath(props.to, 'forcePage');
		},
	}, { type: 'divider' }, {
		icon: 'ti ti-external-link',
		text: $locale.value.sfc.openInNewTab,
		action: () => {
			window.open(props.to, '_blank', 'noopener');
		},
	}, {
		icon: 'ti ti-link',
		text: $locale.value.sfc.copyLink,
		action: () => {
			copyToClipboard(`${url}${props.to}`);
		},
	}], ev);
}

function openWindow() {
	os.pageWindow(props.to);
}

function nav(ev: PointerEvent) {
	// 制御キーとの組み合わせは無視（shiftを除く）
	if (ev.metaKey || ev.altKey || ev.ctrlKey) return;

	ev.preventDefault();

	if (behavior === 'browser') {
		if (isWindow) {
			window.open(props.to, '_blank', 'noopener');
		} else {
			window.location.href = props.to;
		}
		return;
	}

	if (behavior === 'window') {
		return openWindow();
	}

	if (ev.shiftKey) {
		return openWindow();
	}

	router.pushByPath(props.to, ev.ctrlKey ? 'forcePage' : null);
}
</script>

<locale locale="ar-SA" lang="json">
{
	"openInWindow": "افتح في نافذة جديدة",
	"showInPage": "اعرض في الصفحة",
	"openInNewTab": "افتح في لسان جديد",
	"copyLink": "انسخ الرابط"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"openInWindow": "Obrir en una finestra nova",
	"showInPage": "Mostrar a la pàgina ",
	"openInNewTab": "Obre a una pestanya nova",
	"copyLink": "Copia l'enllaç"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"openInWindow": "Otevřít v novém okně",
	"showInPage": "Zobrazit na stránce",
	"openInNewTab": "Otevřít v nové kartě",
	"copyLink": "Kopírovat odkaz"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"openInWindow": "Open in window",
	"showInPage": "Show in page",
	"openInNewTab": "Open in new tab",
	"copyLink": "Copy link"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"openInWindow": "In einem Fenster öffnen",
	"showInPage": "In einer Seite anzeigen",
	"openInNewTab": "In neuem Tab öffnen",
	"copyLink": "Link kopieren"
}
</locale>

<locale locale="en-US" lang="json">
{
	"openInWindow": "Open in window",
	"showInPage": "Show in page",
	"openInNewTab": "Open in new tab",
	"copyLink": "Copy link"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"openInWindow": "Abrir en una ventana",
	"showInPage": "Mostrar en la página",
	"openInNewTab": "Abrir en una Nueva Pestaña",
	"copyLink": "Copiar enlace"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"openInWindow": "Ouvrir dans une nouvelle fenêtre",
	"showInPage": "Afficher dans la page",
	"openInNewTab": "Ouvrir dans un nouvel onglet",
	"copyLink": "Copier le lien"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"openInWindow": "Buka di jendela",
	"showInPage": "Tampilkan di halaman",
	"openInNewTab": "Buka di tab baru",
	"copyLink": "Salin tautan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"openInWindow": "Apri in una finestra",
	"showInPage": "Visualizza in pagina",
	"openInNewTab": "Apri in una nuova scheda",
	"copyLink": "Copia il link"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"openInWindow": "ウィンドウで開く",
	"showInPage": "ページで表示",
	"openInNewTab": "新しいタブで開く",
	"copyLink": "リンクをコピー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"openInWindow": "ウィンドウで開く",
	"showInPage": "ページで表示",
	"openInNewTab": "新しいタブで開く",
	"copyLink": "リンクをコピー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"openInWindow": "Open in window",
	"showInPage": "Show in page",
	"openInNewTab": "Open in new tab",
	"copyLink": "Copy link"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"openInWindow": "Open in window",
	"showInPage": "Show in page",
	"openInNewTab": "Open in new tab",
	"copyLink": "ಲಿಂಕನ್ನು ನಕಲಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"openInWindow": "창으로 열기",
	"showInPage": "페이지로 보기",
	"openInNewTab": "새 탭에서 열기",
	"copyLink": "링크 복사"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"openInWindow": "In een venster openen",
	"showInPage": "Weergeven in een pagina",
	"openInNewTab": "In nieuw tabblad openen",
	"copyLink": "Kopiëren link"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"openInWindow": "Åpne i vindu",
	"showInPage": "Show in page",
	"openInNewTab": "Åpne i ny fane",
	"copyLink": "Kopier lenke"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"openInWindow": "Otwórz w oknie",
	"showInPage": "Pokaż na stronie",
	"openInNewTab": "Otwórz w nowej karcie",
	"copyLink": "Skopiuj odnośnik"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"openInWindow": "Abrir em um janela",
	"showInPage": "Ver na página",
	"openInNewTab": "Abrir em nova aba",
	"copyLink": "Copiar link"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"openInWindow": "Открыть в плавающем окне",
	"showInPage": "Показать страницу",
	"openInNewTab": "Открыть в новой вкладке",
	"copyLink": "Скопировать ссылку"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"openInWindow": "Otvoriť v novom okne",
	"showInPage": "Zobraziť v stránke",
	"openInNewTab": "Otvoriť v novom tabe",
	"copyLink": "Kopírovať odkaz"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"openInWindow": "เปิดในหน้าต่าง",
	"showInPage": "แสดงในเพจ",
	"openInNewTab": "เปิดในแท็บใหม่",
	"copyLink": "คัดลอกลิงก์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"openInWindow": "Pencerede aç",
	"showInPage": "Sayfada göster",
	"openInNewTab": "Yeni sekmede aç",
	"copyLink": "Link kopyala"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"openInWindow": "Open in window",
	"showInPage": "Show in page",
	"openInNewTab": "Open in new tab",
	"copyLink": "Copy link"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"openInWindow": "Відкрити у вікні",
	"showInPage": "Показати на сторінці",
	"openInNewTab": "Відкрити в новій вкладці",
	"copyLink": "Скопіювати посилання"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"openInWindow": "Mở trong cửa sổ mới",
	"showInPage": "Hiện trong trang",
	"openInNewTab": "Mở trong tab mới",
	"copyLink": "Chép liên kết"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"openInWindow": "在新窗口中打开",
	"showInPage": "在页面中显示",
	"openInNewTab": "在新标签页中打开",
	"copyLink": "复制链接"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"openInWindow": "在新視窗開啟",
	"showInPage": "在頁面中顯示",
	"openInNewTab": "在新分頁中開啟",
	"copyLink": "複製連結"
}
</locale>
