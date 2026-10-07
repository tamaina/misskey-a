<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="scrollContainer" class="_pageScrollable">
	<MkDrive @cd="x => folder = x"/>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkDrive from '@features/drive/frontend/components/MkDrive.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { useScrollPositionKeeper } from '@features/ui/frontend/composables/use-scroll-position-keeper.js';

const scrollContainer = useTemplateRef('scrollContainer');
useScrollPositionKeeper(scrollContainer);

const folder = ref<Misskey.entities.DriveFolder | null>(null);

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: folder.value ? folder.value.name : $locale.value.sfc.drive,
	icon: 'ti ti-cloud',
	hideHeader: true,
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"drive": "قرص التخرين"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"drive": "Disc"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"drive": "Úložiště"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="en-US" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"drive": "Disque"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"drive": "ドライブ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"drive": "ドライブ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"drive": "드라이브"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"drive": "Schijf"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"drive": "Dysk"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"drive": "Диск"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"drive": "Disk"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"drive": "ไดรฟ์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"drive": "Drive"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"drive": "Диск"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"drive": "Ổ đĩa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"drive": "网盘"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"drive": "雲端硬碟"
}
</locale>
