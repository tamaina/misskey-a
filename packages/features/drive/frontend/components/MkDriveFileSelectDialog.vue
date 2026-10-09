<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="800"
	:height="500"
	:withOkButton="true"
	:okButtonDisabled="selected.length === 0"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header>
		{{ multiple ? $locale.sfc.selectFiles : $locale.sfc.selectFile }}
		<span v-if="selected.length > 0" style="margin-left: 8px; opacity: 0.5;">({{ selected.length }})</span>
	</template>
	<MkDrive :multiple="multiple" select="file" :initialFolder="initialFolder" @changeSelectedFiles="onChangeSelection"/>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkDrive from '@features/drive/frontend/components/MkDrive.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';

withDefaults(defineProps<{
	initialFolder?: Misskey.entities.DriveFolder['id'] | null;
	multiple: boolean;
}>(), {
});

const emit = defineEmits<{
	(ev: 'done', r?: Misskey.entities.DriveFile[]): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const selected = ref<Misskey.entities.DriveFile[]>([]);

function ok() {
	emit('done', selected.value);
	dialog.value?.close();
}

function cancel() {
	emit('done');
	dialog.value?.close();
}

function onChangeSelection(v: Misskey.entities.DriveFile[]) {
	selected.value = v;
}
</script>

<locale locale="ar-SA" lang="json">
{
  "selectFiles": "اختر ملفات",
  "selectFile": "اختر ملفًا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "selectFiles": "Selecciona fitxers",
  "selectFile": "Selecciona un fitxer"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "selectFiles": "Vybrat soubory",
  "selectFile": "Vybrat soubor"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "selectFiles": "Select files",
  "selectFile": "Select a file"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "selectFiles": "Dateien auswählen",
  "selectFile": "Datei auswählen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "selectFiles": "Select files",
  "selectFile": "Select a file"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "selectFiles": "Elegir archivos",
  "selectFile": "Elegir archivo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "selectFiles": "Choisir les fichiers",
  "selectFile": "Choisir le fichier"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "selectFiles": "Pilih berkas",
  "selectFile": "Pilih berkas"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "selectFiles": "Scelta allegato",
  "selectFile": "Scelta allegato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "selectFiles": "ファイルを選択",
  "selectFile": "ファイルを選択"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "selectFiles": "ファイル選んでや",
  "selectFile": "ファイル選んでや"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "selectFiles": "Select files",
  "selectFile": "Select a file"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "selectFiles": "Select files",
  "selectFile": "Select a file"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "selectFiles": "파일 선택",
  "selectFile": "파일 선택"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "selectFiles": "Selecteer bestanden",
  "selectFile": "Kies een bestand"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "selectFiles": "Velg filer",
  "selectFile": "Velg en fil"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "selectFiles": "Wybierz pliki",
  "selectFile": "Wybierz plik"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "selectFiles": "Selecione os arquivos",
  "selectFile": "Selecione os arquivos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "selectFiles": "Выберите файлы",
  "selectFile": "Выберите файл"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "selectFiles": "Vyberte súbory",
  "selectFile": "Vyberte súbor"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "selectFiles": "เลือกไฟล์",
  "selectFile": "เลือกไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "selectFiles": "Dosyaları seçin",
  "selectFile": "Dosya seçin"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "selectFiles": "Select files",
  "selectFile": "Select a file"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "selectFiles": "Вибрати файли",
  "selectFile": "Вибрати файл"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "selectFiles": "Chọn nhiều tập tin",
  "selectFile": "Chọn tập tin"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "selectFiles": "选择文件",
  "selectFile": "选择文件"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "selectFiles": "選擇檔案",
  "selectFile": "選擇檔案"
}
</locale>
