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
		{{ multiple ? $locale.sfc.selectFolders : $locale.sfc.selectFolder }}
		<span v-if="multiple && selected.length > 0" style="margin-left: 8px; opacity: 0.5;">({{ selected.length }})</span>
	</template>
	<MkDrive :multiple="multiple" select="folder" :initialFolder="initialFolder" @changeSelectedFolders="onChangeSelection"/>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkDrive from '@features/drive/frontend/components/MkDrive.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';

withDefaults(defineProps<{
	initialFolder?: Misskey.entities.DriveFolder['id'] | null;
	multiple?: boolean;
}>(), {
	initialFolder: null,
	multiple: false,
});

const emit = defineEmits<{
	(ev: 'done', r?: (Misskey.entities.DriveFolder | null)[]): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const selected = ref<(Misskey.entities.DriveFolder | null)[]>([]);

function ok() {
	emit('done', selected.value);
	dialog.value?.close();
}

function cancel() {
	emit('done');
	dialog.value?.close();
}

function onChangeSelection(v: (Misskey.entities.DriveFolder | null)[]) {
	selected.value = v;
}
</script>

<locale locale="ar-SA" lang="json">
{
  "selectFolders": "اختر مجلدات",
  "selectFolder": "اختر مجلدًا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "selectFolders": "Selecció de carpetes",
  "selectFolder": "Selecció de carpeta"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "selectFolders": "Vyberte složky",
  "selectFolder": "Vyberte složku"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "selectFolders": "Select folders",
  "selectFolder": "Select a folder"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "selectFolders": "Ordner auswählen",
  "selectFolder": "Ordner auswählen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "selectFolders": "Select folders",
  "selectFolder": "Select a folder"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "selectFolders": "Seleccione carpetas",
  "selectFolder": "Seleccione una carpeta"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "selectFolders": "Sélectionnez des dossiers",
  "selectFolder": "Sélectionnez un dossier"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "selectFolders": "Pilih folder",
  "selectFolder": "Pilih folder"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "selectFolders": "Seleziona cartella",
  "selectFolder": "Seleziona cartella"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "selectFolders": "フォルダーを選択",
  "selectFolder": "フォルダーを選択"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "selectFolders": "フォルダ選んでや",
  "selectFolder": "フォルダ選んでや"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "selectFolders": "Select folders",
  "selectFolder": "Select a folder"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "selectFolders": "Select folders",
  "selectFolder": "Select a folder"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "selectFolders": "폴더 선택",
  "selectFolder": "폴더 선택"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "selectFolders": "Kies mappen",
  "selectFolder": "Kies een map"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "selectFolders": "Velg mapper",
  "selectFolder": "Velg en mappe"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "selectFolders": "Wybierz foldery",
  "selectFolder": "Wybierz folder"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "selectFolders": "Selecionar uma pasta",
  "selectFolder": "Selecionar uma pasta"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "selectFolders": "Выберите папки",
  "selectFolder": "Выберите папку"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "selectFolders": "Vyberte priečinky",
  "selectFolder": "Vyberte priečinok"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "selectFolders": "เลือกโฟลเดอร์",
  "selectFolder": "เลือกโฟลเดอร์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "selectFolders": "Klasörleri seçin",
  "selectFolder": "Klasör seçin"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "selectFolders": "Select folders",
  "selectFolder": "Select a folder"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "selectFolders": "Вибрати теки",
  "selectFolder": "Вибрати теку"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "selectFolders": "Chọn nhiều thư mục",
  "selectFolder": "Chọn thư mục"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "selectFolders": "选择多个文件夹",
  "selectFolder": "选择文件夹"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "selectFolders": "選擇資料夾",
  "selectFolder": "選擇資料夾"
}
</locale>
