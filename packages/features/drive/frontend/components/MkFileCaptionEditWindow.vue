<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:withOkButton="true"
	:okButtonDisabled="false"
	@ok="ok()"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.describeFile }}</template>
	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<MkDriveFileThumbnail v-if="file" :file="file" fit="contain" style="height: 100px; margin-bottom: 16px;"/>
		<MkTextarea v-model="caption" autofocus :placeholder="$locale.sfc.inputNewDescription">
			<template #label>{{ $locale.sfc.caption }}</template>
		</MkTextarea>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { useTemplateRef, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';

const props = defineProps<{
	file?: Misskey.entities.DriveFile | null;
	default?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'done', v: string): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const caption = ref(props.default ?? '');

async function ok() {
	emit('done', caption.value);
	dialog.value?.close();
}
</script>

<locale locale="ar-SA" lang="json">
{
  "describeFile": "أضف تعليقًا توضيحيًا",
  "inputNewDescription": "أدخل تعليقًا توضيحيًا",
  "caption": "التعليق التوضيحي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "describeFile": "Afegir text alternatiu",
  "inputNewDescription": "Escriu el peu de foto.",
  "caption": "Peu de foto"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "describeFile": "Přidat popisek",
  "inputNewDescription": "Zadejte nový popisek",
  "caption": "Titulek"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "describeFile": "Add alt text",
  "inputNewDescription": "Enter new alt text",
  "caption": "Alt text"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "describeFile": "Beschreibung hinzufügen",
  "inputNewDescription": "Gib eine neue Beschreibung ein",
  "caption": "Beschreibung"
}
</locale>

<locale locale="en-US" lang="json">
{
  "describeFile": "Add alt text",
  "inputNewDescription": "Enter new alt text",
  "caption": "Alt text"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "describeFile": "Añadir texto alternativo",
  "inputNewDescription": "Introducir un nuevo texto alternativo",
  "caption": "Texto alternativo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "describeFile": "Ajouter une description d'image",
  "inputNewDescription": "Veuillez entrer une nouvelle description",
  "caption": "Libellé"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "describeFile": "Tambahkan keterangan",
  "inputNewDescription": "Masukkan keterangan disini",
  "caption": "Keterangan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "describeFile": "Aggiungi una descrizione d'immagine",
  "inputNewDescription": "Inserisci una nuova descrizione",
  "caption": "Didascalia"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "describeFile": "キャプションを付ける",
  "inputNewDescription": "新しいキャプションを入力してください",
  "caption": "キャプション"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "describeFile": "キャプションを付ける",
  "inputNewDescription": "新しいキャプションを入れてや",
  "caption": "キャプション"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "describeFile": "Add alt text",
  "inputNewDescription": "Enter new alt text",
  "caption": "Alt text"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "describeFile": "Add alt text",
  "inputNewDescription": "Enter new alt text",
  "caption": "Alt text"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "describeFile": "캡션 추가",
  "inputNewDescription": "새 캡션을 입력해 주세요",
  "caption": "캡션"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "describeFile": "Beschrijving toevoegen",
  "inputNewDescription": "Voer hier het onderschrift in",
  "caption": "Alt text"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "describeFile": "Add alt text",
  "inputNewDescription": "Skriv inn ny bildetekst",
  "caption": "Alt text"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "describeFile": "Dodaj podpis",
  "inputNewDescription": "Proszę wpisać nowy napis",
  "caption": "Legenda"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "describeFile": "Adicionar legenda",
  "inputNewDescription": "Insira uma nova legenda",
  "caption": "legenda"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "describeFile": "Добавить подпись",
  "inputNewDescription": "Введите новую подпись",
  "caption": "Подпись (Automatic Translation)"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "describeFile": "Pridať nadpis",
  "inputNewDescription": "Zadajte nový popis",
  "caption": "Nadpis"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "describeFile": "เพิ่มแคปชั่น",
  "inputNewDescription": "กรุณาใส่แคปชั่นใหม่",
  "caption": "คำอธิบาย"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "describeFile": "Alternatif metin ekle",
  "inputNewDescription": "Yeni alternatif metin girin",
  "caption": "Alternatif metin"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "describeFile": "Add alt text",
  "inputNewDescription": "Enter new alt text",
  "caption": "Alt text"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "describeFile": "Додати підпис",
  "inputNewDescription": "Введіть новий заголовок",
  "caption": "Підпис"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "describeFile": "Thêm mô tả",
  "inputNewDescription": "Nhập mô tả mới",
  "caption": "Mô tả"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "describeFile": "添加描述",
  "inputNewDescription": "请输入新的描述文本",
  "caption": "描述文本"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "describeFile": "新增標題",
  "inputNewDescription": "請輸入新標題 ",
  "caption": "標題"
}
</locale>
