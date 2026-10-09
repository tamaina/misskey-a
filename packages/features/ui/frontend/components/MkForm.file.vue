<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkButton inline rounded primary @click="selectButton($event)">{{ $locale.sfc.selectFile }}</MkButton>
	<div :class="['_nowrap', !fileName && $style.fileNotSelected]">{{ friendlyFileName }}</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { computed, ref } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const props = defineProps<{
	fileId?: string | null;
	validate?: (file: Misskey.entities.DriveFile) => Promise<boolean>;
}>();

const emit = defineEmits<{
	(ev: 'update', result: Misskey.entities.DriveFile): void;
}>();

const fileUrl = ref('');
const fileName = ref<string>('');

const friendlyFileName = computed<string>(() => {
	if (fileName.value) {
		return fileName.value;
	}
	if (fileUrl.value) {
		return fileUrl.value;
	}

	return $locale.value.sfc.fileNotSelected;
});

if (props.fileId) {
	misskeyApi('drive/files/show', {
		fileId: props.fileId,
	}).then((apiRes) => {
		fileName.value = apiRes.name;
		fileUrl.value = apiRes.url;
	});
}

function selectButton(ev: PointerEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	}).then(async (file) => {
		if (!file) return;
		if (props.validate && !await props.validate(file)) return;

		emit('update', file);
		fileName.value = file.name;
		fileUrl.value = file.url;
	});
}

</script>

<style module>
.fileNotSelected {
	font-weight: 700;
	color: var(--MI_THEME-infoWarnFg);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"selectFile": "اختر ملفًا",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"selectFile": "Selecciona un fitxer",
	"fileNotSelected": "Cap fitxer seleccionat"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"selectFile": "Vybrat soubor",
	"fileNotSelected": "Nebyl vybrán žádný soubor"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"selectFile": "Select a file",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"selectFile": "Datei auswählen",
	"fileNotSelected": "Keine Datei ausgewählt"
}
</locale>

<locale locale="en-US" lang="json">
{
	"selectFile": "Select a file",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"selectFile": "Elegir archivo",
	"fileNotSelected": "Archivo no seleccionado."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"selectFile": "Choisir le fichier",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"selectFile": "Pilih berkas",
	"fileNotSelected": "Tidak ada berkas yang terpilih"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"selectFile": "Scelta allegato",
	"fileNotSelected": "Nessun file selezionato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"selectFile": "ファイルを選択",
	"fileNotSelected": "ファイルが選択されていません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"selectFile": "ファイル選んでや",
	"fileNotSelected": "ファイルが選択されてへんで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"selectFile": "Select a file",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"selectFile": "Select a file",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"selectFile": "파일 선택",
	"fileNotSelected": "파일을 선택하지 않았습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"selectFile": "Kies een bestand",
	"fileNotSelected": "Geen bestand geselecteerd"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"selectFile": "Velg en fil",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"selectFile": "Wybierz plik",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"selectFile": "Selecione os arquivos",
	"fileNotSelected": "Nenhuma pasta selecionada"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"selectFile": "Выберите файл",
	"fileNotSelected": "Файл не выбран"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"selectFile": "Vyberte súbor",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"selectFile": "เลือกไฟล์",
	"fileNotSelected": "ยังไม่ได้เลือกไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"selectFile": "Dosya seçin",
	"fileNotSelected": "Hiç dosya seçilmedi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"selectFile": "Select a file",
	"fileNotSelected": "No file selected"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"selectFile": "Вибрати файл",
	"fileNotSelected": "Файл не вибрано"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"selectFile": "Chọn tập tin",
	"fileNotSelected": "Chưa chọn tệp nào"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"selectFile": "选择文件",
	"fileNotSelected": "未选择文件"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"selectFile": "選擇檔案",
	"fileNotSelected": "尚未選擇檔案"
}
</locale>
