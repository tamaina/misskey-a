<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_gaps_s">
	<MkKeyValue v-if="content.filename != null">
		<template #key>{{ $locale.sfc.fileName }}</template>
		<template #value>{{ content.filename }}</template>
	</MkKeyValue>
	<MkKeyValue v-if="content.file != null">
		<template #key>{{ globalLocale.env.description }}</template>
		<template #value>
			<div :class="$style.pre">{{ content.file.comment ? content.file.comment : `(${globalLocale.env.none})` }}</div>
		</template>
	</MkKeyValue>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import type { Locale } from 'i18n';
import type { Content } from '@features/drive/frontend/components/MkLightbox.item.vue';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	content: Content;
}>();
</script>

<style lang="scss" module>
.root {
	padding: 4px 14px;
}

.pre {
	white-space: pre-wrap;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "fileName": "اسم الملف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "fileName": "Nom del Fitxer"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "fileName": "Název souboru"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "fileName": "Filename"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "fileName": "Dateiname"
}
</locale>

<locale locale="en-US" lang="json">
{
  "fileName": "Filename"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "fileName": "Nombre de archivo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "fileName": "Nom du fichier"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "fileName": "Nama berkas"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "fileName": "Nome dell'allegato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "fileName": "ファイル名"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "fileName": "ファイル名"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "fileName": "Filename"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "fileName": "Filename"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "fileName": "파일명"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "fileName": "Bestandsnaam"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "fileName": "Filnavn"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "fileName": "Nazwa pliku"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "fileName": "Nome do Ficheiro"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "fileName": "Имя файла"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "fileName": "Názov súboru"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "fileName": "ชื่อไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "fileName": "Dosya adı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "fileName": "Filename"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "fileName": "Ім'я файлу"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "fileName": "Tên tập tin"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "fileName": "文件名称"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "fileName": "檔案名稱"
}
</locale>
