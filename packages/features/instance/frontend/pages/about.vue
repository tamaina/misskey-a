<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div v-if="tab === 'overview'" class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 20px;">
		<XOverview/>
	</div>
	<div v-else-if="tab === 'emojis'" class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
		<XEmojis/>
	</div>
	<div v-else-if="instance.federation !== 'none' && tab === 'federation'" class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
		<XFederation/>
	</div>
	<div v-else-if="tab === 'charts'" class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
		<MkInstanceStats/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { instance } from '@features/instance/frontend/instance.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { loadEmojiCatalog } from '@features/index/frontend';

const XOverview = defineAsyncComponent(() => import('@features/instance/frontend/pages/about.overview.vue'));
const XEmojis = defineAsyncComponent(loadEmojiCatalog);
const XFederation = defineAsyncComponent(() => import('@features/instance/frontend/pages/about.federation.vue'));
const MkInstanceStats = defineAsyncComponent(() => import('@features/statistics/frontend/components/MkInstanceStats.vue'));

const props = withDefaults(defineProps<{
	initialTab?: string;
}>(), {
	initialTab: 'overview',
});

const tab = ref(props.initialTab);

watch(tab, () => {
	if (tab.value === 'charts') {
		claimAchievement('viewInstanceChart');
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'overview',
	title: $locale.value.sfc.overview,
}, {
	key: 'emojis',
	title: $locale.value.sfc.customEmojis,
	icon: 'ti ti-icons',
}, ...(instance.federation !== 'none' ? [{
	key: 'federation',
	title: $locale.value.sfc.federation,
	icon: 'ti ti-whirl',
}] : []), {
	key: 'charts',
	title: $locale.value.sfc.charts,
	icon: 'ti ti-chart-line',
}]);

definePage(() => ({
	title: $locale.value.sfc.instanceInfo,
	icon: 'ti ti-info-circle',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"overview": "ملخص عام",
	"customEmojis": "إيموجي مخصص",
	"federation": "الفديرالية",
	"charts": "المنحنيات البيانية",
	"instanceInfo": "معلومات مثيل الخادم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"overview": "Visió General",
	"customEmojis": "Emojis personalitzats",
	"federation": "Federació",
	"charts": "Gràfics",
	"instanceInfo": "Informació del fitxer d'instal·lació"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"overview": "Shrnutí",
	"customEmojis": "Vlastní emoji",
	"federation": "Federace",
	"charts": "Grafy",
	"instanceInfo": "Informace o instanci"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"overview": "Overview",
	"customEmojis": "Custom Emoji",
	"federation": "Federation",
	"charts": "Charts",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"overview": "Übersicht",
	"customEmojis": "Benutzerdefinierte Emojis",
	"federation": "Föderation",
	"charts": "Diagramme",
	"instanceInfo": "Instanzinformationen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"overview": "Overview",
	"customEmojis": "Custom Emoji",
	"federation": "Federation",
	"charts": "Charts",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"overview": "Resumen",
	"customEmojis": "Emojis personalizados",
	"federation": "Federación",
	"charts": "Métricas",
	"instanceInfo": "Información de la instancia"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"overview": "Aperçu",
	"customEmojis": "Émojis personnalisés",
	"federation": "Fédération",
	"charts": "Graphiques",
	"instanceInfo": "Informations sur l’instance"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"overview": "Ikhtisar",
	"customEmojis": "Emoji kustom",
	"federation": "Federasi",
	"charts": "Grafik",
	"instanceInfo": "Informasi Instansi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"overview": "Anteprima",
	"customEmojis": "Emoji personalizzate",
	"federation": "Federazione",
	"charts": "Grafici",
	"instanceInfo": "Informazioni sul server"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"overview": "概要",
	"customEmojis": "カスタム絵文字",
	"federation": "連合",
	"charts": "チャート",
	"instanceInfo": "サーバー情報"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"overview": "概要",
	"customEmojis": "カスタム絵文字",
	"federation": "連合",
	"charts": "チャート",
	"instanceInfo": "サーバー情報"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"overview": "Overview",
	"customEmojis": "Custom Emoji",
	"federation": "Federation",
	"charts": "Charts",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"overview": "Overview",
	"customEmojis": "Custom Emoji",
	"federation": "Federation",
	"charts": "Charts",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"overview": "요약",
	"customEmojis": "커스텀 이모지",
	"federation": "연합",
	"charts": "차트",
	"instanceInfo": "서버 정보"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"overview": "Overzicht",
	"customEmojis": "Eigen emoji",
	"federation": "Federatie",
	"charts": "Grafieken",
	"instanceInfo": "Serverinformatie"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"overview": "Overview",
	"customEmojis": "Custom Emoji",
	"federation": "Føderasjon",
	"charts": "Diagrammer",
	"instanceInfo": "Serverinformasjon"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"overview": "Przegląd",
	"customEmojis": "Niestandardowe emoji",
	"federation": "Federacja",
	"charts": "Wykresy",
	"instanceInfo": "Informacje o instancji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"overview": "Visão geral",
	"customEmojis": "Emoji personalizado",
	"federation": "Federação",
	"charts": "Gráfico",
	"instanceInfo": "Informações da instância"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"overview": "Обзор",
	"customEmojis": "Собственные эмодзи",
	"federation": "Федерация",
	"charts": "Диаграммы",
	"instanceInfo": "Информация об инстансе"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"overview": "Prehľad",
	"customEmojis": "Vlastné emoji",
	"federation": "Federácia",
	"charts": "Grafy",
	"instanceInfo": "Informácie o serveri"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"overview": "ภาพรวม",
	"customEmojis": "เอโมจิที่กำหนดเอง",
	"federation": "สหพันธ์",
	"charts": "แผนภูมิ",
	"instanceInfo": "ข้อมูลเซิร์ฟเวอร์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"overview": "Genel Bakış",
	"customEmojis": "Özel Emoji",
	"federation": "Federasyon",
	"charts": "Grafikler",
	"instanceInfo": "Sunucu Bilgisi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"overview": "Overview",
	"customEmojis": "Custom Emoji",
	"federation": "Federation",
	"charts": "Charts",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"overview": "Огляд",
	"customEmojis": "Кастомні емоджі",
	"federation": "Федіверс",
	"charts": "Графіки",
	"instanceInfo": "Про цей інстанс"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"overview": "Tổng quan",
	"customEmojis": "Tùy chỉnh emoji",
	"federation": "Liên hợp",
	"charts": "Đồ thị",
	"instanceInfo": "Thông tin máy chủ"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"overview": "概览",
	"customEmojis": "自定义表情符号",
	"federation": "联邦",
	"charts": "图表",
	"instanceInfo": "服务器信息"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"overview": "概覽",
	"customEmojis": "自訂表情符號",
	"federation": "站台聯邦",
	"charts": "圖表",
	"instanceInfo": "伺服器資訊"
}
</locale>
