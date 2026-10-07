<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkCodeEditor v-model="installThemeCode" lang="json5">
		<template #label>{{ $locale.sfc.themeCode }}</template>
	</MkCodeEditor>

	<div class="_buttons">
		<MkButton :disabled="installThemeCode == null || installThemeCode.trim() === ''" inline @click="() => previewTheme(installThemeCode!)"><i class="ti ti-eye"></i> {{ $locale.sfc.preview }}</MkButton>
		<MkButton :disabled="installThemeCode == null || installThemeCode.trim() === ''" primary inline @click="() => install(installThemeCode!)"><i class="ti ti-check"></i> {{ $locale.sfc.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkCodeEditor from '@features/markup/frontend/components/MkCodeEditor.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { themeManager, installTheme, handleThemeInstallError } from '@features/preferences/frontend/theme.js';
import { parseThemeCode } from '@@/js/theme.js';
import * as os from '@features/ui/frontend/os.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';

const router = useRouter();
const installThemeCode = ref<string | null>(null);

function previewTheme(code: string): void {
	try {
		const theme = parseThemeCode(code);
		themeManager.previewTheme(theme);
	} catch (err) {
		os.alert({
			type: 'error',
			text: $locale.value.sfc.themeInvalid,
		});
		console.error(err);
	}
}

async function install(code: string): Promise<void> {
	try {
		const theme = parseThemeCode(code);
		await installTheme(code);
		os.alert({
			type: 'success',
			text: interpolateLocaleParameters($locale.value.sfc.themeInstalled, { name: theme.name }),
		});
		installThemeCode.value = null;
		router.push('/settings/theme');
	} catch (err: any) {
		handleThemeInstallError(err);
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.themeInstall,
	icon: 'ti ti-download',
}));
</script>

<locale lang="json" locale="ar-SA">
{
	"themeCode": "شيفرة القالب",
	"preview": "معاينة",
	"install": "ثبّت",
	"themeInvalid": "تنسيق السمة غير صالح",
	"themeInstalled": "تم تنصيب {name}",
	"themeInstall": "تنصيب قالب"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"themeCode": "Codi del tema",
	"preview": "Vista prèvia",
	"install": "Instal·lació ",
	"themeInvalid": "El format d'aquest tema no és correcte",
	"themeInstalled": "{name} Instal·lat ",
	"themeInstall": "Instal·lar un tema"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"themeCode": "Kód vzhledu",
	"preview": "Náhled",
	"install": "Nainstalovat",
	"themeInvalid": "Formát tohoto tématu je neplatný",
	"themeInstalled": "{name} byl nainstalován",
	"themeInstall": "Nainstalovat vzhled"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"themeCode": "Theme code",
	"preview": "Preview",
	"install": "Install",
	"themeInvalid": "The format of this theme is invalid",
	"themeInstalled": "{name} has been installed",
	"themeInstall": "Install a theme"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"themeCode": "Farbschemencode",
	"preview": "Vorschau",
	"install": "Installieren",
	"themeInvalid": "Der Code dieses Farbschemas ist ungültig",
	"themeInstalled": "{name} wurde installiert",
	"themeInstall": "Farbschemata installieren"
}
</locale>

<locale lang="json" locale="en-US">
{
	"themeCode": "Theme code",
	"preview": "Preview",
	"install": "Install",
	"themeInvalid": "The format of this theme is invalid",
	"themeInstalled": "{name} has been installed",
	"themeInstall": "Install a theme"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"themeCode": "Código del tema",
	"preview": "Vista previa",
	"install": "Instalación",
	"themeInvalid": "El formato del tema no es válido",
	"themeInstalled": "{name} ha sido instalado",
	"themeInstall": "Instalar tema"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"themeCode": "Code du thème",
	"preview": "Aperçu",
	"install": "Installation",
	"themeInvalid": "Le format du thème n'est pas valide",
	"themeInstalled": "{name} a été installé",
	"themeInstall": "Installer un thème"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"themeCode": "Kode tema",
	"preview": "Pratinjau",
	"install": "Pasang",
	"themeInvalid": "Format tema tidak valid",
	"themeInstalled": "{name} telah dipasang",
	"themeInstall": "Pasang tema"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"themeCode": "Codice tema",
	"preview": "Anteprima",
	"install": "Installa",
	"themeInvalid": "Il formato tema non è valido",
	"themeInstalled": "{name} è installato",
	"themeInstall": "Installa un tema"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"themeCode": "テーマコード",
	"preview": "プレビュー",
	"install": "インストール",
	"themeInvalid": "テーマの形式が間違っています",
	"themeInstalled": "{name}をインストールしました",
	"themeInstall": "テーマのインストール"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"themeCode": "テーマコード",
	"preview": "プレビュー",
	"install": "インストール",
	"themeInvalid": "テーマの形式が間違ってるみたいや",
	"themeInstalled": "{name}をインストールしたで。",
	"themeInstall": "テーマのインストール"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"themeCode": "Theme code",
	"preview": "Preview",
	"install": "Install",
	"themeInvalid": "The format of this theme is invalid",
	"themeInstalled": "{name} has been installed",
	"themeInstall": "Install a theme"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"themeCode": "Theme code",
	"preview": "Preview",
	"install": "Install",
	"themeInvalid": "The format of this theme is invalid",
	"themeInstalled": "{name} has been installed",
	"themeInstall": "Install a theme"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"themeCode": "테마 코드",
	"preview": "미리보기",
	"install": "설치",
	"themeInvalid": "테마 형식이 올바르지 않습니다",
	"themeInstalled": "{name} 테마가 설치되었습니다",
	"themeInstall": "테마 설치"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"themeCode": "Theme code",
	"preview": "Voorbeeld",
	"install": "Installeren",
	"themeInvalid": "The format of this theme is invalid",
	"themeInstalled": "{name} has been installed",
	"themeInstall": "Install a theme"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"themeCode": "Theme code",
	"preview": "Preview",
	"install": "Installer",
	"themeInvalid": "The format of this theme is invalid",
	"themeInstalled": "{name} has been installed",
	"themeInstall": "Install a theme"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"themeCode": "Kod motywu",
	"preview": "Podgląd",
	"install": "Zainstaluj",
	"themeInvalid": "Format motywu jest nieprawidłowy.",
	"themeInstalled": "Zainstalowano {name}",
	"themeInstall": "Zainstaluj motyw"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"themeCode": "Código do tema",
	"preview": "Pré-visualizar",
	"install": "Instalar",
	"themeInvalid": "O formato desse tema é invalido",
	"themeInstalled": "{name} foi instalado",
	"themeInstall": "Instalar um tema"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"themeCode": "Код темы",
	"preview": "Предпросмотр",
	"install": "Установить",
	"themeInvalid": "Формат темы некорректный.",
	"themeInstalled": "Тема «{name}» установлена.",
	"themeInstall": "Установить тему"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"themeCode": "Kód témy",
	"preview": "Náhľad",
	"install": "Nainštalovať",
	"themeInvalid": "Formát tejto témy je nesprávny",
	"themeInstalled": "{name} je nainštalovaná",
	"themeInstall": "Nainštalovať tému"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"themeCode": "โค้ดธีม",
	"preview": "แสดงตัวอย่าง",
	"install": "ติดตั้ง",
	"themeInvalid": "รูปแบบของธีมนี้ไม่ถูกต้องนะ",
	"themeInstalled": "{name} ได้รับการติดตั้ง",
	"themeInstall": "ติดตั้งธีม"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"themeCode": "Tema kodu",
	"preview": "Önizleme",
	"install": "Yükle",
	"themeInvalid": "Bu temanın biçimi geçersizdir.",
	"themeInstalled": "{name} kuruldu",
	"themeInstall": "Bir tema yükle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"themeCode": "Theme code",
	"preview": "Preview",
	"install": "Install",
	"themeInvalid": "The format of this theme is invalid",
	"themeInstalled": "{name} has been installed",
	"themeInstall": "Install a theme"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"themeCode": "Код теми",
	"preview": "Попередній перегляд",
	"install": "Встановити",
	"themeInvalid": "Неправильний формат теми",
	"themeInstalled": "Тему {name} встановлено",
	"themeInstall": "Встановити тему"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"themeCode": "Mã theme",
	"preview": "Xem trước",
	"install": "Cài đặt",
	"themeInvalid": "Định dạng của theme này không hợp lệ",
	"themeInstalled": "{name} đã được cài đặt",
	"themeInstall": "Cài đặt theme"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"themeCode": "主题代码",
	"preview": "预览",
	"install": "安装",
	"themeInvalid": "主题格式错误",
	"themeInstalled": "{name} 已安装",
	"themeInstall": "安装主题"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"themeCode": "佈景主題代碼",
	"preview": "預覽",
	"install": "安裝",
	"themeInvalid": "佈景主題格式錯誤",
	"themeInstalled": "{name}已安裝",
	"themeInstall": "安裝佈景主題"
}
</locale>
