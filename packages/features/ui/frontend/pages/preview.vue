<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkSample/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSample from '@features/markup/frontend/components/MkPreview.vue';
import { definePage } from '@features/navigation/frontend/page.js';

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(computed(() => ({
	title: $locale.value.sfc.preview,
	icon: 'ti ti-eye',
})));
</script>

<locale locale="ar-SA" lang="json">
{
	"preview": "معاينة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"preview": "Vista prèvia"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"preview": "Náhled"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"preview": "Preview"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"preview": "Vorschau"
}
</locale>

<locale locale="en-US" lang="json">
{
	"preview": "Preview"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"preview": "Vista previa"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"preview": "Aperçu"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"preview": "Pratinjau"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"preview": "Anteprima"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"preview": "プレビュー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"preview": "プレビュー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"preview": "Preview"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"preview": "Preview"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"preview": "미리보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"preview": "Voorbeeld"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"preview": "Preview"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"preview": "Podgląd"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"preview": "Pré-visualizar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"preview": "Предпросмотр"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"preview": "Náhľad"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"preview": "แสดงตัวอย่าง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"preview": "Önizleme"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"preview": "Preview"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"preview": "Попередній перегляд"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"preview": "Xem trước"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"preview": "预览"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"preview": "預覽"
}
</locale>
