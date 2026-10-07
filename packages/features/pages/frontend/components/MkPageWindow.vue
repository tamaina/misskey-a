<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:canResize="true"
	:closeButton="true"
	:buttonsLeft="buttonsLeft"
	:buttonsRight="buttonsRight"
	:contextmenu="contextmenu"
	@closed="emit('closed')"
>
	<template #header>
		<template v-if="pageMetadata">
			<i v-if="pageMetadata.icon" :class="pageMetadata.icon" style="margin-right: 0.5em;"></i>
			<span>{{ pageMetadata.title }}</span>
		</template>
	</template>

	<div :class="$style.root" class="_forceShrinkSpacer">
		<StackingRouterView v-if="prefer.s['experimental.stackingRouterView']" :key="reloadCount.toString() + ':stacking'" :router="windowRouter"/>
		<RouterView v-else :key="reloadCount.toString() + ':non-stacking'" :router="windowRouter"/>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, provide, ref, useTemplateRef, nextTick } from 'vue';
import { url } from '@@/js/config.js';
import type { PageMetadata } from '@features/navigation/frontend/page.js';
import RouterView from '@features/navigation/frontend/components/global/RouterView.vue';
import MkWindow from '@features/ui/frontend/components/MkWindow.vue';
import { popout as _popout } from '@features/ui/frontend/utility/popout.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@features/navigation/frontend/page.js';
import { openingWindowsCount } from '@features/ui/frontend/os.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { createRouter, mainRouter } from '@features/navigation/frontend/router.js';
import { analytics } from '@features/statistics/frontend/analytics.js';
import { DI } from '@features/ui/frontend/di.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const props = defineProps<{
	initialPath: string;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const windowRouter = createRouter(props.initialPath);

const pageMetadata = ref<null | PageMetadata>(null);
const windowEl = useTemplateRef('windowEl');
const _history_ = ref<{ path: string; }[]>([{
	path: windowRouter.getCurrentFullPath(),
}]);
const buttonsLeft = computed(() => {
	return _history_.value.length > 1 ? [{
		icon: 'ti ti-arrow-left',
		title: $locale.value.sfc.goBack,
		onClick: back,
	}] : [];
});
const buttonsRight = computed(() => {
	const buttons = [{
		icon: 'ti ti-reload',
		title: $locale.value.sfc.reload,
		onClick: reload,
	}, {
		icon: 'ti ti-player-eject',
		title: $locale.value.sfc.showInPage,
		onClick: expand,
	}];

	return buttons;
});
const reloadCount = ref(0);

function getSearchMarker(path: string) {
	const hash = path.split('#')[1];
	if (hash == null) return null;
	return hash;
}

const searchMarkerId = ref<string | null>(getSearchMarker(props.initialPath));

windowRouter.addListener('push', ctx => {
	_history_.value.push({ path: ctx.fullPath });
});

windowRouter.addListener('replace', ctx => {
	_history_.value.pop();
	_history_.value.push({ path: ctx.fullPath });
});

windowRouter.addListener('forcePush', ctx => {
	window.open(url + ctx.fullPath, '_blank', 'noopener');
	if (ctx.onInit) {
		nextTick(() => {
			windowEl.value?.close();
		});
	}
});

windowRouter.addListener('forceReplace', ctx => {
	window.open(url + ctx.fullPath, '_blank', 'noopener');
	if (ctx.onInit) {
		nextTick(() => {
			windowEl.value?.close();
		});
	}
});

windowRouter.addListener('change', ctx => {
	if (_DEV_) console.log('windowRouter: change', ctx.fullPath);
	searchMarkerId.value = getSearchMarker(ctx.fullPath);
	analytics.page({
		path: ctx.fullPath,
		title: ctx.fullPath,
	});
});

windowRouter.init(true);

provide(DI.router, windowRouter);
provide(DI.inAppSearchMarkerId, searchMarkerId);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
});
provideReactiveMetadata(pageMetadata);
provide('shouldOmitHeaderTitle', true);
provide('shouldHeaderThin', true);

const contextmenu = computed(() => ([{
	icon: 'ti ti-player-eject',
	text: $locale.value.sfc.showInPage,
	action: expand,
}, {
	icon: 'ti ti-window-maximize',
	text: $locale.value.sfc.popout,
	action: popout,
}, {
	icon: 'ti ti-external-link',
	text: $locale.value.sfc.openInNewTab,
	action: () => {
		window.open(url + windowRouter.getCurrentFullPath(), '_blank', 'noopener');
		windowEl.value?.close();
	},
}, {
	icon: 'ti ti-link',
	text: $locale.value.sfc.copyLink,
	action: () => {
		copyToClipboard(url + windowRouter.getCurrentFullPath());
	},
}]));

function back() {
	_history_.value.pop();
	windowRouter.replaceByPath(_history_.value.at(-1)!.path);
}

function reload() {
	reloadCount.value++;
}

function close() {
	windowEl.value?.close();
}

function expand() {
	mainRouter.pushByPath(windowRouter.getCurrentFullPath(), 'forcePage');
	windowEl.value?.close();
}

function popout() {
	_popout(windowRouter.getCurrentFullPath(), windowEl.value?.$el);
	windowEl.value?.close();
}

onMounted(() => {
	analytics.page({
		path: props.initialPath,
		title: props.initialPath,
	});

	openingWindowsCount.value++;
	if (openingWindowsCount.value >= 3) {
		claimAchievement('open3windows');
	}
});

onUnmounted(() => {
	openingWindowsCount.value--;
});

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.root {
	height: 100%;
	background: var(--MI_THEME-bg);

	--MI-margin: var(--MI-marginHalf);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"goBack": "رجوع",
	"reload": "انعش",
	"showInPage": "اعرض في الصفحة",
	"popout": "منبثقة",
	"openInNewTab": "افتح في لسان جديد",
	"copyLink": "انسخ الرابط"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"goBack": "Tornar",
	"reload": "Actualitzar",
	"showInPage": "Mostrar a la pàgina ",
	"popout": "Finestra emergent",
	"openInNewTab": "Obre a una pestanya nova",
	"copyLink": "Copia l'enllaç"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"goBack": "Zpět",
	"reload": "Aktualizovat",
	"showInPage": "Zobrazit na stránce",
	"popout": "Pop-out",
	"openInNewTab": "Otevřít v nové kartě",
	"copyLink": "Kopírovat odkaz"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"goBack": "Back",
	"reload": "Refresh",
	"showInPage": "Show in page",
	"popout": "Pop-out",
	"openInNewTab": "Open in new tab",
	"copyLink": "Copy link"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"goBack": "Zurück",
	"reload": "Aktualisieren",
	"showInPage": "In einer Seite anzeigen",
	"popout": "Pop-Up",
	"openInNewTab": "In neuem Tab öffnen",
	"copyLink": "Link kopieren"
}
</locale>

<locale locale="en-US" lang="json">
{
	"goBack": "Back",
	"reload": "Refresh",
	"showInPage": "Show in page",
	"popout": "Pop-out",
	"openInNewTab": "Open in new tab",
	"copyLink": "Copy link"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"goBack": "Anterior",
	"reload": "Recargar",
	"showInPage": "Mostrar en la página",
	"popout": "Popout",
	"openInNewTab": "Abrir en una Nueva Pestaña",
	"copyLink": "Copiar enlace"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"goBack": "Retour",
	"reload": "Rafraîchir",
	"showInPage": "Afficher dans la page",
	"popout": "Fenêtre contextuelle",
	"openInNewTab": "Ouvrir dans un nouvel onglet",
	"copyLink": "Copier le lien"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"goBack": "Kembali",
	"reload": "Muat ulang",
	"showInPage": "Tampilkan di halaman",
	"popout": "Pop-out",
	"openInNewTab": "Buka di tab baru",
	"copyLink": "Salin tautan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"goBack": "Indietro",
	"reload": "Ricarica",
	"showInPage": "Visualizza in pagina",
	"popout": "Finestra pop-out",
	"openInNewTab": "Apri in una nuova scheda",
	"copyLink": "Copia il link"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"goBack": "戻る",
	"reload": "リロード",
	"showInPage": "ページで表示",
	"popout": "ポップアウト",
	"openInNewTab": "新しいタブで開く",
	"copyLink": "リンクをコピー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"goBack": "戻る",
	"reload": "リロード",
	"showInPage": "ページで表示",
	"popout": "ポップアウト",
	"openInNewTab": "新しいタブで開く",
	"copyLink": "リンクをコピー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"goBack": "Back",
	"reload": "Refresh",
	"showInPage": "Show in page",
	"popout": "Pop-out",
	"openInNewTab": "Open in new tab",
	"copyLink": "Copy link"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"goBack": "Back",
	"reload": "Refresh",
	"showInPage": "Show in page",
	"popout": "Pop-out",
	"openInNewTab": "Open in new tab",
	"copyLink": "ಲಿಂಕನ್ನು ನಕಲಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"goBack": "뒤로",
	"reload": "새로고침",
	"showInPage": "페이지로 보기",
	"popout": "새 창으로 열기",
	"openInNewTab": "새 탭에서 열기",
	"copyLink": "링크 복사"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"goBack": "Terug",
	"reload": "Verversen",
	"showInPage": "Weergeven in een pagina",
	"popout": "Pop-Up",
	"openInNewTab": "In nieuw tabblad openen",
	"copyLink": "Kopiëren link"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"goBack": "Back",
	"reload": "Refresh",
	"showInPage": "Show in page",
	"popout": "Pop-out",
	"openInNewTab": "Åpne i ny fane",
	"copyLink": "Kopier lenke"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"goBack": "Wróć",
	"reload": "Odśwież",
	"showInPage": "Pokaż na stronie",
	"popout": "Popout",
	"openInNewTab": "Otwórz w nowej karcie",
	"copyLink": "Skopiuj odnośnik"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"goBack": "Voltar",
	"reload": "Recarregar",
	"showInPage": "Ver na página",
	"popout": "Sair",
	"openInNewTab": "Abrir em nova aba",
	"copyLink": "Copiar link"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"goBack": "Выход",
	"reload": "Перезагрузить",
	"showInPage": "Показать страницу",
	"popout": "Развернуть",
	"openInNewTab": "Открыть в новой вкладке",
	"copyLink": "Скопировать ссылку"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"goBack": "Späť",
	"reload": "Obnoviť",
	"showInPage": "Zobraziť v stránke",
	"popout": "Pop-out",
	"openInNewTab": "Otvoriť v novom tabe",
	"copyLink": "Kopírovať odkaz"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"goBack": "ย้อนกลับ",
	"reload": "รีโหลด",
	"showInPage": "แสดงในเพจ",
	"popout": "ป๊อปเอาต์",
	"openInNewTab": "เปิดในแท็บใหม่",
	"copyLink": "คัดลอกลิงก์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"goBack": "Geri",
	"reload": "Yenile",
	"showInPage": "Sayfada göster",
	"popout": "Açılır pencere",
	"openInNewTab": "Yeni sekmede aç",
	"copyLink": "Link kopyala"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"goBack": "Back",
	"reload": "Refresh",
	"showInPage": "Show in page",
	"popout": "Pop-out",
	"openInNewTab": "Open in new tab",
	"copyLink": "Copy link"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"goBack": "Назад",
	"reload": "Оновити",
	"showInPage": "Показати на сторінці",
	"popout": "Від'єднати",
	"openInNewTab": "Відкрити в новій вкладці",
	"copyLink": "Скопіювати посилання"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"goBack": "Quay lại",
	"reload": "Tải lại",
	"showInPage": "Hiện trong trang",
	"popout": "Pop-out",
	"openInNewTab": "Mở trong tab mới",
	"copyLink": "Chép liên kết"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"goBack": "返回",
	"reload": "刷新",
	"showInPage": "在页面中显示",
	"popout": "弹窗",
	"openInNewTab": "在新标签页中打开",
	"copyLink": "复制链接"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"goBack": "返回",
	"reload": "重新整理",
	"showInPage": "在頁面中顯示",
	"popout": "彈出式視窗",
	"openInNewTab": "在新分頁中開啟",
	"copyLink": "複製連結"
}
</locale>
