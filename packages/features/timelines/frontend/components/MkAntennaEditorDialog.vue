<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:withOkButton="false"
	:width="500"
	:height="550"
	@close="close()"
	@closed="emit('closed')"
>
	<template #header>{{ antenna == null ? $locale.sfc.createAntenna : $locale.sfc.editAntenna }}</template>
	<XAntennaEditor
		:antenna="antenna"
		@created="onAntennaCreated"
		@updated="onAntennaUpdated"
		@deleted="onAntennaDeleted"
	/>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import XAntennaEditor from '@features/timelines/frontend/components/MkAntennaEditor.vue';

defineProps<{
	antenna?: Misskey.entities.Antenna;
}>();

const emit = defineEmits<{
	(ev: 'created', newAntenna: Misskey.entities.Antenna): void,
	(ev: 'updated', editedAntenna: Misskey.entities.Antenna): void,
	(ev: 'deleted'): void,
	(ev: 'closed'): void,
}>();

const dialog = useTemplateRef('dialog');

function onAntennaCreated(newAntenna: Misskey.entities.Antenna) {
	emit('created', newAntenna);
	dialog.value?.close();
}

function onAntennaUpdated(editedAntenna: Misskey.entities.Antenna) {
	emit('updated', editedAntenna);
	dialog.value?.close();
}

function onAntennaDeleted() {
	emit('deleted');
	dialog.value?.close();
}

function close() {
	dialog.value?.close();
}
</script>

<locale locale="ar-SA" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "عدّل الهوائي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "createAntenna": "Crea una antena",
  "editAntenna": "Modificar antena"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Upravit anténu"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Edit antenna"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "createAntenna": "Erstelle eine Antenne",
  "editAntenna": "Antenne bearbeiten"
}
</locale>

<locale locale="en-US" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Edit antenna"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "createAntenna": "Crear una antena",
  "editAntenna": "Editar antena"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "createAntenna": "Créer une antenne",
  "editAntenna": "Modifier l'antenne"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "createAntenna": "Membuat antena",
  "editAntenna": "Sunting antena"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "createAntenna": "Crea Antenna",
  "editAntenna": "Modifica Antenna"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "createAntenna": "アンテナを作成",
  "editAntenna": "アンテナを編集"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "createAntenna": "アンテナを作る",
  "editAntenna": "アンテナいじる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Edit antenna"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Edit antenna"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "createAntenna": "안테나 만들기",
  "editAntenna": "안테나 편집"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "createAntenna": "Antenne aanmaken",
  "editAntenna": "Antenne bewerken"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Edit antenna"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Edytuj antenę"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "createAntenna": "Criar  uma antena",
  "editAntenna": "Editar antena"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "createAntenna": "Создать антенну",
  "editAntenna": "Редактировать антенну"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Edit antenna"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "createAntenna": "สร้างเสาอากาศ",
  "editAntenna": "แก้ไขเสาอากาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "createAntenna": "Bir anten oluşturun",
  "editAntenna": "Anteni düzenle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "createAntenna": "Create an antenna",
  "editAntenna": "Edit antenna"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "createAntenna": "Створити антену",
  "editAntenna": "Редагувати антену"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "createAntenna": "Tạo Ăngten ",
  "editAntenna": "Chỉnh sửa Ăngten"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "createAntenna": "创建天线",
  "editAntenna": "编辑天线"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "createAntenna": "建立天線",
  "editAntenna": "編輯天線"
}
</locale>
