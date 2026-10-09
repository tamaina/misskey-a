<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<span :class="$style.icon">
		<i class="ti ti-info-circle"></i>
	</span>
	<span :class="$style.title">{{ $locale.sfc.previewingTheme }}</span>
	<span :class="$style.body"><button class="_textButton" style="color: var(--MI_THEME-fgOnAccent);" @click="restore">{{ $locale.sfc.previewingThemeRestore }}</button> | <MkA class="_textButton" style="color: var(--MI_THEME-fgOnAccent);" to="/settings/theme">{{ $locale.sfc.settings }}</MkA></span>
</div>
</template>

<script lang="ts" setup>
import { themeManager } from '@features/preferences/frontend/theme.js';

function restore() {
	themeManager.clearPreview();
}
</script>

<style lang="scss" module>
.root {
	--height: 24px;
	font-size: 0.85em;
	display: flex;
	vertical-align: bottom;
	width: 100%;
	line-height: var(--height);
	height: var(--height);
	overflow: clip;
	contain: strict;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
}

.icon {
	margin-left: 10px;
	animation: blink 2s infinite;
}

.title {
	padding: 0 10px;
	font-weight: bold;
}

.body {
	min-width: 0;
	flex: 1;
	overflow: clip;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "استرجاع",
  "settings": "الاعدادات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "previewingTheme": "Previsualització del tema",
  "previewingThemeRestore": "Restaurar",
  "settings": "Preferències"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Obnovit",
  "settings": "Nastavení"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore",
  "settings": "Settings"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Wiederherstellen",
  "settings": "Einstellungen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore",
  "settings": "Settings"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "previewingTheme": "Vista previa del tema",
  "previewingThemeRestore": "Regresar",
  "settings": "Configuración"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restaurer",
  "settings": "Paramètres"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Kembalikan",
  "settings": "Pengaturan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "previewingTheme": "Anteprima del Tema",
  "previewingThemeRestore": "Ripristina",
  "settings": "Impostazioni"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "previewingTheme": "テーマのプレビュー中",
  "previewingThemeRestore": "元に戻す",
  "settings": "設定"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "previewingTheme": "テーマのプレビュー中",
  "previewingThemeRestore": "元に戻す",
  "settings": "設定"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore",
  "settings": "Iɣewwaṛen"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore",
  "settings": "ಸಿದ್ಧತೆಗಳು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "previewingTheme": "테마 미리보기 중",
  "previewingThemeRestore": "복구",
  "settings": "설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Herstellen",
  "settings": "Instellingen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore",
  "settings": "Innstillinger"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Przywróć",
  "settings": "Ustawienia"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restaurar",
  "settings": "Configurações"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Восстановить",
  "settings": "Настройки"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Obnoviť",
  "settings": "Nastavenia"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "เลิกทำ",
  "settings": "การตั้งค่า"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Geri yükle",
  "settings": "Ayarlar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore",
  "settings": "Settings"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "previewingTheme": "Попередній перегляд теми",
  "previewingThemeRestore": "Відновити",
  "settings": "Налаштування"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Khôi phục",
  "settings": "Cài đặt"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "previewingTheme": "正在预览主题",
  "previewingThemeRestore": "还原",
  "settings": "设置"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "previewingTheme": "正在預覽主題",
  "previewingThemeRestore": "復原",
  "settings": "設定"
}
</locale>
