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
	<span :class="$style.body"><button class="_textButton" style="color: var(--MI_THEME-fgOnAccent);" @click="restore">{{ $locale.sfc.previewingThemeRestore }}</button> | <MkA class="_textButton" style="color: var(--MI_THEME-fgOnAccent);" to="/settings/theme">{{ globalLocale.env.settings }}</MkA></span>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { themeManager } from '@features/preferences/frontend/theme.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
  "previewingThemeRestore": "استرجاع"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "previewingTheme": "Previsualització del tema",
  "previewingThemeRestore": "Restaurar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Obnovit"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Wiederherstellen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "previewingTheme": "Vista previa del tema",
  "previewingThemeRestore": "Regresar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restaurer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Kembalikan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "previewingTheme": "Anteprima del Tema",
  "previewingThemeRestore": "Ripristina"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "previewingTheme": "テーマのプレビュー中",
  "previewingThemeRestore": "元に戻す"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "previewingTheme": "テーマのプレビュー中",
  "previewingThemeRestore": "元に戻す"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "previewingTheme": "테마 미리보기 중",
  "previewingThemeRestore": "복구"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Herstellen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Przywróć"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restaurar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Восстановить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Obnoviť"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "เลิกทำ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Geri yükle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Restore"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "previewingTheme": "Попередній перегляд теми",
  "previewingThemeRestore": "Відновити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "previewingTheme": "Previewing theme",
  "previewingThemeRestore": "Khôi phục"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "previewingTheme": "正在预览主题",
  "previewingThemeRestore": "还原"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "previewingTheme": "正在預覽主題",
  "previewingThemeRestore": "復原"
}
</locale>
