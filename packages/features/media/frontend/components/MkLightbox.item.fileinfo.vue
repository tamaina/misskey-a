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
			<template #key>{{ $locale.sfc.description }}</template>
			<template #value>
				<div :class="$style.pre">{{ content.file.comment ? content.file.comment : `(${$locale.sfc.none})` }}</div>
			</template>
		</MkKeyValue>
	</div>
</template>

<script lang="ts" setup>
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import type { Content } from '@features/media/frontend/components/MkLightbox.item.vue';

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
  "fileName": "اسم الملف",
  "description": "الوصف",
  "none": "لا شيء"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "fileName": "Nom del Fitxer",
  "description": "Descripció",
  "none": "Res"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "fileName": "Název souboru",
  "description": "Popis",
  "none": "Žádný"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "fileName": "Filename",
  "description": "Description",
  "none": "None"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "fileName": "Dateiname",
  "description": "Beschreibung",
  "none": "Nichts"
}
</locale>

<locale locale="en-US" lang="json">
{
  "fileName": "Filename",
  "description": "Description",
  "none": "None"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "fileName": "Nombre de archivo",
  "description": "Descripción",
  "none": "Ninguna"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "fileName": "Nom du fichier",
  "description": "Description",
  "none": "Rien"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "fileName": "Nama berkas",
  "description": "Deskripsi",
  "none": "Tidak ada"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "fileName": "Nome dell'allegato",
  "description": "Descrizione",
  "none": "Nessuna"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "fileName": "ファイル名",
  "description": "説明",
  "none": "なし"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "fileName": "ファイル名",
  "description": "説明",
  "none": "なし"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "fileName": "Filename",
  "description": "Description",
  "none": "None"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "fileName": "Filename",
  "description": "Description",
  "none": "None"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "fileName": "파일명",
  "description": "설명",
  "none": "없음"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "fileName": "Bestandsnaam",
  "description": "Beschrijving",
  "none": "Niets"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "fileName": "Filnavn",
  "description": "Beskrivelse",
  "none": "Ingen"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "fileName": "Nazwa pliku",
  "description": "Opis",
  "none": "Brak"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "fileName": "Nome do Ficheiro",
  "description": "Descrição",
  "none": "Nenhum"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "fileName": "Имя файла",
  "description": "Описание",
  "none": "Ничего"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "fileName": "Názov súboru",
  "description": "Popis",
  "none": "Žiadne"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "fileName": "ชื่อไฟล์",
  "description": "คำอธิบาย",
  "none": "ไม่มี"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "fileName": "Dosya adı",
  "description": "Açıklama",
  "none": "Hiçbiri"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "fileName": "Filename",
  "description": "Description",
  "none": "None"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "fileName": "Ім'я файлу",
  "description": "Опис",
  "none": "Відсутній"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "fileName": "Tên tập tin",
  "description": "Mô tả",
  "none": "Không"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "fileName": "文件名称",
  "description": "描述",
  "none": "无"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "fileName": "檔案名稱",
  "description": "描述",
  "none": "無"
}
</locale>
