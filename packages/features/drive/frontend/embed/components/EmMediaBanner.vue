<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a :href="href" target="_blank" :class="$style.root">
	<div :class="$style.label">
		<template v-if="media.type.startsWith('audio')"><i class="ti ti-music"></i> {{ $locale.sfc.audio }}</template>
		<template v-else><i class="ti ti-file"></i> {{ $locale.sfc.file }}</template>
	</div>
	<div :class="$style.go">
		<i class="ti ti-chevron-right"></i>
	</div>
</a>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';

defineProps<{
	media: Misskey.entities.DriveFile;
	href: string;
}>();
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	display: flex;
	align-items: center;
	width: 100%;
	padding: var(--MI-margin);
	margin-top: 4px;
	border: 1px solid var(--MI_THEME-inputBorder);
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-panel);
	transition: background-color .1s, border-color .1s;

	&:hover {
		text-decoration: none;
		border-color: var(--MI_THEME-inputBorderHover);
		background-color: var(--MI_THEME-buttonHoverBg);
	}
}

.label {
	font-size: .9em;
}

.go {
	margin-left: auto;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"audio": "Audio",
	"file": "الملفات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"audio": "So",
	"file": "Fitxers"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"audio": "Zvuk",
	"file": "Soubor(ů)"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"audio": "Audio",
	"file": "File"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"audio": "Audio",
	"file": "Datei"
}
</locale>

<locale lang="json" locale="en-US">
{
	"audio": "Audio",
	"file": "File"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"audio": "Sonido",
	"file": "Archivos"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"audio": "Audio",
	"file": "Fichier"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"audio": "Suara",
	"file": "Berkas"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"audio": "Audio",
	"file": "Allegati"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"audio": "音声",
	"file": "ファイル"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"audio": "音声",
	"file": "ファイル"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"audio": "Audio",
	"file": "Ifuyla"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"audio": "Audio",
	"file": "ಕಡತಗಳು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"audio": "소리",
	"file": "파일"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"audio": "Audio",
	"file": "Bestanden"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"audio": "Audio",
	"file": "Filer"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"audio": "Audio",
	"file": "Pliki"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"audio": "Áudio",
	"file": "Ficheiros"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"audio": "Звук",
	"file": "Файлы"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"audio": "Audio",
	"file": "Súbor/y"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"audio": "เสียง",
	"file": "ไฟล์"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"audio": "Ses",
	"file": "Dosyalar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"audio": "Audio",
	"file": "File"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"audio": "Аудіо",
	"file": "Файли"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"audio": "Âm thanh",
	"file": "Tập tin"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"audio": "音频",
	"file": "文件"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"audio": "音效",
	"file": "檔案"
}
</locale>
