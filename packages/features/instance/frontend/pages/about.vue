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
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { instance } from '@features/instance/frontend/instance.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { loadEmojiCatalog } from '@features/index/frontend';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
	title: globalLocale.value.env.overview,
}, {
	key: 'emojis',
	title: globalLocale.value.env.customEmojis,
	icon: 'ti ti-icons',
}, ...(instance.federation !== 'none' ? [{
	key: 'federation',
	title: $locale.value.sfc.federation,
	icon: 'ti ti-whirl',
}] : []), {
	key: 'charts',
	title: globalLocale.value.env.charts,
	icon: 'ti ti-chart-line',
}]);

definePage(() => ({
	title: $locale.value.sfc.instanceInfo,
	icon: 'ti ti-info-circle',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"federation": "الفديرالية",
	"instanceInfo": "معلومات مثيل الخادم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"federation": "Federació",
	"instanceInfo": "Informació del fitxer d'instal·lació"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"federation": "Federace",
	"instanceInfo": "Informace o instanci"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"federation": "Federation",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"federation": "Föderation",
	"instanceInfo": "Instanzinformationen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"federation": "Federation",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"federation": "Federación",
	"instanceInfo": "Información de la instancia"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"federation": "Fédération",
	"instanceInfo": "Informations sur l’instance"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"federation": "Federasi",
	"instanceInfo": "Informasi Instansi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"federation": "Federazione",
	"instanceInfo": "Informazioni sul server"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"federation": "連合",
	"instanceInfo": "サーバー情報"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"federation": "連合",
	"instanceInfo": "サーバー情報"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"federation": "Federation",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"federation": "Federation",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"federation": "연합",
	"instanceInfo": "서버 정보"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"federation": "Federatie",
	"instanceInfo": "Serverinformatie"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"federation": "Føderasjon",
	"instanceInfo": "Serverinformasjon"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"federation": "Federacja",
	"instanceInfo": "Informacje o instancji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"federation": "Federação",
	"instanceInfo": "Informações da instância"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"federation": "Федерация",
	"instanceInfo": "Информация об инстансе"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"federation": "Federácia",
	"instanceInfo": "Informácie o serveri"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"federation": "สหพันธ์",
	"instanceInfo": "ข้อมูลเซิร์ฟเวอร์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"federation": "Federasyon",
	"instanceInfo": "Sunucu Bilgisi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"federation": "Federation",
	"instanceInfo": "Instance Information"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"federation": "Федіверс",
	"instanceInfo": "Про цей інстанс"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"federation": "Liên hợp",
	"instanceInfo": "Thông tin máy chủ"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"federation": "联邦",
	"instanceInfo": "服务器信息"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"federation": "站台聯邦",
	"instanceInfo": "伺服器資訊"
}
</locale>
