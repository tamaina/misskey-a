<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :refresher="() => reloadTimeline()">
	<template #header><i class="ti ti-mail" style="margin-right: 8px;"></i>{{ column.name || $locale.sfc.direct }}</template>

	<MkNotesTimeline :paginator="paginator"/>
</XColumn>
</template>

<script lang="ts" setup>
import { markRaw, ref } from 'vue';
import XColumn from './column.vue';
import type { Column } from '@/deck.js';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const paginator = markRaw(new Paginator('notes/mentions', {
	limit: 10,
	params: {
		visibility: 'specified',
	},
}));

function reloadTimeline() {
	return new Promise<void>((res) => {
		paginator.reload().then(() => {
			res();
		});
	});
}
</script>

<locale locale="ar-SA" lang="json">
{
  "direct": "مباشرة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "direct": "Publicacions directes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "direct": "Přímé poznámky"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "direct": "Direct notes"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "direct": "Direktnachrichten"
}
</locale>

<locale locale="en-US" lang="json">
{
  "direct": "Direct notes"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "direct": "Notas directas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "direct": "Direct"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "direct": "Langsung"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "direct": "Note Dirette"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "direct": "指名"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "direct": "ダイレクト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "direct": "Direct notes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "direct": "ನೇರ ಟಿಪ್ಪಣಿಗಳು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "direct": "다이렉트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "direct": "Directe notities"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "direct": "Direkte"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "direct": "Bezpośredni"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "direct": "Notas diretas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "direct": "Личное"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "direct": "Priame poznámky"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "direct": "ไดเร็กต์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "direct": "Doğrudan notlar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "direct": "Direct notes"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "direct": "Особисте"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "direct": "Nhắn riêng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "direct": "指定用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "direct": "指定使用者"
}
</locale>
