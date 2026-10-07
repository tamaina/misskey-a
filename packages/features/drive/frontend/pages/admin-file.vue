<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSuspense v-slot="{ result }" :p="_fetch_" @resolved="(result) => file = result.file">
	<XRoot v-if="result.file != null && result.info != null" :file="result.file" :info="result.info"/>
</MkSuspense>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XRoot from '@features/drive/frontend/pages/admin-file.root.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';

const props = defineProps<{
	fileId: string,
}>();

function _fetch_() {
	return Promise.all([
		misskeyApi('drive/files/show', { fileId: props.fileId }),
		misskeyApi('admin/drive/show-file', { fileId: props.fileId }),
	]).then((result) => ({
		file: result[0],
		info: result[1],
	}));
}

const file = ref<Misskey.entities.DriveFile | null>(null);

definePage(() => ({
	title: file.value ? `${$locale.value.sfc.file}: ${file.value.name}` : $locale.value.sfc.file,
	icon: 'ti ti-file',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"file": "الملفات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"file": "Fitxers"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"file": "Soubor(ů)"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"file": "File"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"file": "Datei"
}
</locale>

<locale locale="en-US" lang="json">
{
	"file": "File"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"file": "Archivos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"file": "Fichier"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"file": "Berkas"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"file": "Allegati"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"file": "ファイル"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"file": "ファイル"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"file": "Ifuyla"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"file": "ಕಡತಗಳು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"file": "파일"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"file": "Bestanden"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"file": "Filer"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"file": "Pliki"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"file": "Ficheiros"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"file": "Файлы"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"file": "Súbor/y"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"file": "ไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"file": "Dosyalar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"file": "File"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"file": "Файли"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"file": "Tập tin"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"file": "文件"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"file": "檔案"
}
</locale>
