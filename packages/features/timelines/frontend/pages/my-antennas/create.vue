<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<MkAntennaEditor @created="onAntennaCreated"/>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { antennasCache } from '@features/runtime/frontend/cache.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import MkAntennaEditor from '@features/timelines/frontend/components/MkAntennaEditor.vue';

const router = useRouter();

function onAntennaCreated() {
	antennasCache.delete();
	router.push('/my/antennas');
}

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.createAntenna,
	icon: 'ti ti-antenna',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"createAntenna": "Crea una antena"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"createAntenna": "Erstelle eine Antenne"
}
</locale>

<locale locale="en-US" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"createAntenna": "Crear una antena"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"createAntenna": "Créer une antenne"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"createAntenna": "Membuat antena"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"createAntenna": "Crea Antenna"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"createAntenna": "アンテナを作成"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"createAntenna": "アンテナを作る"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"createAntenna": "안테나 만들기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"createAntenna": "Antenne aanmaken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"createAntenna": "Criar  uma antena"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"createAntenna": "Создать антенну"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"createAntenna": "สร้างเสาอากาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"createAntenna": "Bir anten oluşturun"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"createAntenna": "Create an antenna"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"createAntenna": "Створити антену"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"createAntenna": "Tạo Ăngten "
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"createAntenna": "创建天线"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"createAntenna": "建立天線"
}
</locale>
