<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m" :class="$style.extInstallerRoot">
	<div :class="$style.extInstallerIconWrapper">
		<i v-if="isPlugin" class="ti ti-plug"></i>
		<i v-else-if="isTheme" class="ti ti-palette"></i>
		<!-- 拡張用？ -->
		<i v-else class="ti ti-download"></i>
	</div>

	<h2 v-if="isPlugin" :class="$style.extInstallerTitle">{{ $locale.sfc.externalResourceInstallerPluginTitle }}</h2>
	<h2 v-else-if="isTheme" :class="$style.extInstallerTitle">{{ $locale.sfc.externalResourceInstallerThemeTitle }}</h2>

	<MkInfo :warn="true">{{ $locale.sfc.externalResourceInstallerCheckVendorBeforeInstall }}</MkInfo>

	<div v-if="extension.type === 'plugin'" class="_gaps_s">
		<MkFolder :defaultOpen="true">
			<template #icon><i class="ti ti-info-circle"></i></template>
			<template #label>{{ $locale.sfc.metadata }}</template>

			<div class="_gaps_s">
				<FormSplit>
					<MkKeyValue>
						<template #key>{{ globalLocale.env.name }}</template>
						<template #value>{{ extension.meta.name }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ $locale.sfc.author }}</template>
						<template #value>{{ extension.meta.author }}</template>
					</MkKeyValue>
				</FormSplit>
				<MkKeyValue>
					<template #key>{{ globalLocale.env.description }}</template>
					<template #value>{{ extension.meta.description ?? globalLocale.env.none }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.version }}</template>
					<template #value>{{ extension.meta.version }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ globalLocale.env.permission }}</template>
					<template #value>
						<ul v-if="extension.meta.permissions && extension.meta.permissions.length > 0" :class="$style.extInstallerKVList">
							<li v-for="permission in extension.meta.permissions" :key="permission">{{ (copyLocaleDictionary(globalLocale.env._permissions) as Record<string, string>)[permission] ?? permission }}</li>
						</ul>
						<template v-else>{{ globalLocale.env.none }}</template>
					</template>
				</MkKeyValue>
			</div>
		</MkFolder>

		<MkFolder :withSpacer="false">
			<template #icon><i class="ti ti-code"></i></template>
			<template #label>{{ $locale.sfc.pluginViewSource }}</template>

			<MkCode :code="extension.raw"/>
		</MkFolder>
	</div>
	<div v-else-if="extension.type === 'theme'" class="_gaps_s">
		<MkFolder :defaultOpen="true">
			<template #icon><i class="ti ti-info-circle"></i></template>
			<template #label>{{ $locale.sfc.metadata }}</template>

			<div class="_gaps_s">
				<FormSplit>
					<MkKeyValue>
						<template #key>{{ globalLocale.env.name }}</template>
						<template #value>{{ extension.meta.name }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ $locale.sfc.author }}</template>
						<template #value>{{ extension.meta.author }}</template>
					</MkKeyValue>
				</FormSplit>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.externalResourceInstallerMetaBase }}</template>
					<template #value>{{ { light: $locale.sfc.light, dark: $locale.sfc.dark, none: globalLocale.env.none }[extension.meta.base ?? 'none'] }}</template>
				</MkKeyValue>
			</div>
		</MkFolder>

		<MkFolder :withSpacer="false">
			<template #icon><i class="ti ti-code"></i></template>
			<template #label>{{ $locale.sfc.themeCode }}</template>

			<MkCode :code="extension.raw"/>
		</MkFolder>
	</div>

	<slot name="additionalInfo"></slot>

	<div class="_buttonsCenter">
		<MkButton danger rounded large @click="emits('cancel')"><i class="ti ti-x"></i> {{ globalLocale.env.cancel }}</MkButton>
		<MkButton gradate rounded large @click="emits('confirm')"><i class="ti ti-download"></i> {{ globalLocale.env.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import * as Misskey from 'misskey-js';

export type Extension = {
	type: 'plugin';
	raw: string;
	meta: {
		name: string;
		version: string;
		author: string;
		description?: string;
		permissions?: (typeof Misskey.permissions)[number][];
		config?: Record<string, unknown>;
	};
} | {
	type: 'theme';
	raw: string;
	meta: {
		name: string;
		author: string;
		base?: 'light' | 'dark';
	};
};
</script>
<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import type { Locale } from 'i18n';
import { computed } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import MkCode from '@features/markup/frontend/components/MkCode.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';

const globalLocale = useLocale<Locale>(import.meta.url);

const isPlugin = computed(() => props.extension.type === 'plugin');
const isTheme = computed(() => props.extension.type === 'theme');

const props = defineProps<{
	extension: Extension;
}>();

const emits = defineEmits<{
	(ev: 'confirm'): void;
	(ev: 'cancel'): void;
}>();
</script>

<style lang="scss" module>
.extInstallerRoot {
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	padding: 20px;
}

.extInstallerIconWrapper {
	width: 48px;
	height: 48px;
	font-size: 20px;
	line-height: 48px;
	text-align: center;
	border-radius: 50%;
	margin-left: auto;
	margin-right: auto;

	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.extInstallerTitle {
	font-size: 1.2rem;
	text-align: center;
	margin: 0;
}

.extInstallerKVList {
	margin-top: 0;
	margin-bottom: 0;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "البيانات الوصفية",
	"author": "الكاتب",
	"version": "الإصدار",
	"pluginViewSource": "اظهر المصدر",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "فاتح",
	"dark": "داكن",
	"themeCode": "شيفرة القالب"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"externalResourceInstallerPluginTitle": "Vols instal·lar aquest afegit?",
	"externalResourceInstallerThemeTitle": "Vols instal·lar aquest tema?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Assegura't que qui distribueix aquest recurs és fiable abans d'instal·lar-ho.",
	"metadata": "Metadades",
	"author": "Autor",
	"version": "Versió",
	"pluginViewSource": "Veure l'origen ",
	"externalResourceInstallerMetaBase": "Paleta de colors base",
	"light": "Clar",
	"dark": "Fosc",
	"themeCode": "Codi del tema"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Autor",
	"version": "Verze",
	"pluginViewSource": "Zobrazit zdroj",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Světlý",
	"dark": "Tmavý",
	"themeCode": "Kód vzhledu"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Author",
	"version": "Version",
	"pluginViewSource": "View source",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Light",
	"dark": "Dark",
	"themeCode": "Theme code"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"externalResourceInstallerPluginTitle": "Möchtest du dieses Plugin installieren?",
	"externalResourceInstallerThemeTitle": "Möchten du dieses Farbschema installieren?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Überprüfe vor Installation die Vertrauenswürdigkeit des Vertreibers.",
	"metadata": "Metadaten",
	"author": "Autor",
	"version": "Version",
	"pluginViewSource": "Quelltext anzeigen",
	"externalResourceInstallerMetaBase": "Farbschemavorlage",
	"light": "Hell",
	"dark": "Dunkel",
	"themeCode": "Farbschemencode"
}
</locale>

<locale lang="json" locale="en-US">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Author",
	"version": "Version",
	"pluginViewSource": "View source",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Light",
	"dark": "Dark",
	"themeCode": "Theme code"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"externalResourceInstallerPluginTitle": "¿Quieres instalar este plugin?",
	"externalResourceInstallerThemeTitle": "¿Quieres instalar este tema?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Asegúrate de que el distribuidor de este recurso es de confianza antes de proceder a la instalación.",
	"metadata": "Metadatos",
	"author": "Autor",
	"version": "Versión",
	"pluginViewSource": "Ver la fuente",
	"externalResourceInstallerMetaBase": "Esquema de color base",
	"light": "Claro",
	"dark": "Oscuro",
	"themeCode": "Código del tema"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"externalResourceInstallerPluginTitle": "Voulez-vous installer cette extension ?",
	"externalResourceInstallerThemeTitle": "Voulez-vous installer ce thème ?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Veuillez confirmer que le distributeur est fiable avant l'installation.",
	"metadata": "Métadonnées",
	"author": "Auteur·rice",
	"version": "Version",
	"pluginViewSource": "Afficher la source",
	"externalResourceInstallerMetaBase": "Palette de couleurs de base",
	"light": "Clair",
	"dark": "Sombre",
	"themeCode": "Code du thème"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"externalResourceInstallerPluginTitle": "Apakah kamu ingin memasang plugin ini?",
	"externalResourceInstallerThemeTitle": "Apakah kamu ingin memasang tema ini?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Pastikan sumber dari sumber daya ini terpercaya sebelum melakukan pemasangan.",
	"metadata": "Metadata",
	"author": "Pembuat",
	"version": "Versi",
	"pluginViewSource": "Lihat sumber",
	"externalResourceInstallerMetaBase": "Skema warna dasar",
	"light": "Terang",
	"dark": "Gelap",
	"themeCode": "Kode tema"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"externalResourceInstallerPluginTitle": "Vuoi davvero installare questo componente aggiuntivo?",
	"externalResourceInstallerThemeTitle": "Vuoi davvero installare questa variazione grafica?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Prima di installare, assicurati che la fonte sia affidabile.",
	"metadata": "Metadato",
	"author": "Autore",
	"version": "Versione",
	"pluginViewSource": "Visualizza sorgente",
	"externalResourceInstallerMetaBase": "Combinazione base di colori",
	"light": "Chiaro",
	"dark": "Scuro",
	"themeCode": "Codice tema"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"externalResourceInstallerPluginTitle": "このプラグインをインストールしますか？",
	"externalResourceInstallerThemeTitle": "このテーマをインストールしますか？",
	"externalResourceInstallerCheckVendorBeforeInstall": "配布元が信頼できるかを確認した上でインストールしてください。",
	"metadata": "メタデータ",
	"author": "作者",
	"version": "バージョン",
	"pluginViewSource": "ソースを表示",
	"externalResourceInstallerMetaBase": "基本のカラースキーム",
	"light": "ライト",
	"dark": "ダーク",
	"themeCode": "テーマコード"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"externalResourceInstallerPluginTitle": "このプラグイン、インストールする？",
	"externalResourceInstallerThemeTitle": "このテーマインストールする？",
	"externalResourceInstallerCheckVendorBeforeInstall": "配ってるとこが信頼できるか確認した上でインストールしてな。",
	"metadata": "メタデータ",
	"author": "作者",
	"version": "バージョン",
	"pluginViewSource": "ソース見る",
	"externalResourceInstallerMetaBase": "基本のカラースキーム",
	"light": "ライト",
	"dark": "ダーク",
	"themeCode": "テーマコード"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Author",
	"version": "Version",
	"pluginViewSource": "View source",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Light",
	"dark": "Dark",
	"themeCode": "Theme code"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Author",
	"version": "Version",
	"pluginViewSource": "View source",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Light",
	"dark": "Dark",
	"themeCode": "Theme code"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"externalResourceInstallerPluginTitle": "이 플러그인을 설치하시겠습니까?",
	"externalResourceInstallerThemeTitle": "이 테마를 설치하시겠습니까?",
	"externalResourceInstallerCheckVendorBeforeInstall": "제공자를 신뢰할 수 있는 경우에만 설치하십시오.",
	"metadata": "메타데이터",
	"author": "작성자",
	"version": "버전",
	"pluginViewSource": "소스 보기",
	"externalResourceInstallerMetaBase": "기본 컬러 스키마",
	"light": "라이트",
	"dark": "다크",
	"themeCode": "테마 코드"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Auteur",
	"version": "Versie",
	"pluginViewSource": "View source",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Licht",
	"dark": "Donker",
	"themeCode": "Theme code"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Forfatter",
	"version": "Versjon",
	"pluginViewSource": "View source",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Lys",
	"dark": "Mørk",
	"themeCode": "Theme code"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadane",
	"author": "Autor",
	"version": "Wersja",
	"pluginViewSource": "Zobacz źródło",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Jasny",
	"dark": "Ciemny",
	"themeCode": "Kod motywu"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"externalResourceInstallerPluginTitle": "Deseja instalar esse plugin?",
	"externalResourceInstallerThemeTitle": "Deseja instalar esse tema?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Tenha certeza de que o distribuidor desse recurso é confiável antes da instalação.",
	"metadata": "Metadados",
	"author": "Autor",
	"version": "Versão",
	"pluginViewSource": "Ver código-fonte",
	"externalResourceInstallerMetaBase": "Paleta de cores base",
	"light": "Claro",
	"dark": "Escuro",
	"themeCode": "Código do tema"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Метаданные",
	"author": "Автор",
	"version": "Версия",
	"pluginViewSource": "Просмотр исходника",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Светлый",
	"dark": "Тёмный",
	"themeCode": "Код темы"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadáta",
	"author": "Autor",
	"version": "Verzia",
	"pluginViewSource": "Ukázať zdroj",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Svetlá",
	"dark": "Tmavá",
	"themeCode": "Kód témy"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"externalResourceInstallerPluginTitle": "ต้องการติดตั้งปลั๊กอินนี้ใช่ไหม?",
	"externalResourceInstallerThemeTitle": "ต้องการติดตั้งธีมนี้ใช่ไหม?",
	"externalResourceInstallerCheckVendorBeforeInstall": "โปรดตรวจสอบให้แน่ใจว่าแหล่งแจกหน่ายมีความน่าเชื่อถือก่อนทำการติดตั้ง",
	"metadata": "เมทาเดต้า",
	"author": "ผู้เขียน",
	"version": "เวอร์ชั่น",
	"pluginViewSource": "ดูต้นฉบับ",
	"externalResourceInstallerMetaBase": "โทนสีพื้นฐาน",
	"light": "สว่าง",
	"dark": "มืด",
	"themeCode": "โค้ดธีม"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"externalResourceInstallerPluginTitle": "Bu eklentiyi yüklemek ister misin?",
	"externalResourceInstallerThemeTitle": "Bu temayı yüklemek ister misin?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Yüklemeden önce bu kaynağın dağıtımcısının güvenilir olduğundan emin olun.",
	"metadata": "Meta veri",
	"author": "Yazar",
	"version": "Sürüm",
	"pluginViewSource": "Kaynak görüntüle",
	"externalResourceInstallerMetaBase": "Temel renk şeması",
	"light": "Aydınlık",
	"dark": "Karanlık",
	"themeCode": "Tema kodu"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Author",
	"version": "Version",
	"pluginViewSource": "View source",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Light",
	"dark": "Dark",
	"themeCode": "Theme code"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Метадані",
	"author": "Автор",
	"version": "Версія",
	"pluginViewSource": "Переглянути вихідний код",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Світла",
	"dark": "Темна",
	"themeCode": "Код теми"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"externalResourceInstallerPluginTitle": "Do you want to install this plugin?",
	"externalResourceInstallerThemeTitle": "Do you want to install this theme?",
	"externalResourceInstallerCheckVendorBeforeInstall": "Make sure the distributor of this resource is trustworthy before installation.",
	"metadata": "Metadata",
	"author": "Tác giả",
	"version": "Phiên bản",
	"pluginViewSource": "Xem mã nguồn",
	"externalResourceInstallerMetaBase": "Base color scheme",
	"light": "Sáng",
	"dark": "Tối",
	"themeCode": "Mã theme"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"externalResourceInstallerPluginTitle": "要安装此插件吗？",
	"externalResourceInstallerThemeTitle": "要安装此主题吗？",
	"externalResourceInstallerCheckVendorBeforeInstall": "请在安装前确保来源可靠",
	"metadata": "元数据",
	"author": "作者",
	"version": "版本",
	"pluginViewSource": "查看源代码",
	"externalResourceInstallerMetaBase": "基本配色方案",
	"light": "浅色",
	"dark": "深色",
	"themeCode": "主题代码"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"externalResourceInstallerPluginTitle": "要安裝此外掛嘛？",
	"externalResourceInstallerThemeTitle": "要安裝此佈景主題嗎？",
	"externalResourceInstallerCheckVendorBeforeInstall": "安裝前請確認提供者是可信賴的。",
	"metadata": "詮釋資料",
	"author": "作者",
	"version": "版本",
	"pluginViewSource": "檢視原始碼",
	"externalResourceInstallerMetaBase": "基本配色方案",
	"light": "淺色",
	"dark": "深色",
	"themeCode": "佈景主題代碼"
}
</locale>
