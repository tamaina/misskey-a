<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :refresher="() => reloadTimeline()">
	<template #header><i class="ti ti-at" style="margin-right: 8px;"></i>{{ column.name || $locale.sfc.mentions }}</template>

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
  "mentions": "الإشارات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "mentions": "Mencions"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "mentions": "Zmínění"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "mentions": "Mentions"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "mentions": "Erwähnungen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "mentions": "Mentions"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "mentions": "Menciones"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "mentions": "Mentions"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "mentions": "Sebutan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "mentions": "Menzioni"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "mentions": "メンション"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "mentions": "あんた宛て"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "mentions": "Mentions"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "mentions": "ಹೆಸರಿಸಿದ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "mentions": "받은 멘션"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "mentions": "Vermeldingen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "mentions": "Mentions"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "mentions": "Wspomnienia"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "mentions": "Menções"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "mentions": "Упоминания"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "mentions": "Zmienky"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "mentions": "กล่าวถึงคุณ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "mentions": "Bahsetmeler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "mentions": "Mentions"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "mentions": "Згадки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "mentions": "Lượt nhắc"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "mentions": "提及"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "mentions": "提及"
}
</locale>
