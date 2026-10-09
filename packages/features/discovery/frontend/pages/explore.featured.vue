<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<MkTab
		v-model="tab"
		:tabs="[
			{ key: 'notes', label: $locale.sfc.notes },
			{ key: 'polls', label: $locale.sfc.poll },
		]"
		style="margin-bottom: var(--MI-margin);"
	>
	</MkTab>
	<MkNotesTimeline v-if="tab === 'notes'" :paginator="paginatorForNotes"/>
	<MkNotesTimeline v-else-if="tab === 'polls'" :paginator="paginatorForPolls"/>
</div>
</template>

<script lang="ts" setup>
import { markRaw, ref } from 'vue';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import MkTab from '@features/ui/frontend/components/MkTab.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const paginatorForNotes = markRaw(new Paginator('notes/featured', {
	limit: 10,
}));

const paginatorForPolls = markRaw(new Paginator('notes/polls/recommendation', {
	limit: 10,
	offsetMode: true,
	params: {
		excludeChannels: true,
	},
}));

const tab = ref<'notes' | 'polls'>('notes');
</script>

<locale locale="ar-SA" lang="json">
{
  "notes": "الملاحظات",
  "poll": "استطلاع رأي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "notes": "Notes",
  "poll": "Enquesta"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "notes": "Poznámky",
  "poll": "Anketa"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "notes": "Notes",
  "poll": "Poll"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "notes": "Notizen",
  "poll": "Umfrage"
}
</locale>

<locale locale="en-US" lang="json">
{
  "notes": "Notes",
  "poll": "Poll"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "notes": "Notas",
  "poll": "Encuesta"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "notes": "Notes",
  "poll": "Sondage"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "notes": "Catatan",
  "poll": "Angket"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "notes": "Note",
  "poll": "Sondaggio"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "notes": "ノート",
  "poll": "アンケート"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "notes": "ノート",
  "poll": "アンケート"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "notes": "Notes",
  "poll": "Poll"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "notes": "Notes",
  "poll": "Poll"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "notes": "노트",
  "poll": "투표"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "notes": "Notities",
  "poll": "Peiling"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "notes": "Notes",
  "poll": "Avstemning"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "notes": "Wpisy",
  "poll": "Ankieta"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "notes": "Posts",
  "poll": "Enquetes"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "notes": "Заметки",
  "poll": "Опрос"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "notes": "Poznámky",
  "poll": "Hlasovanie"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "notes": " โน้ต",
  "poll": "โพล"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "notes": "Notlar",
  "poll": "Anket"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "notes": "Notes",
  "poll": "Poll"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "notes": "Записи",
  "poll": "Опитування"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "notes": "Bài Viết",
  "poll": "Bình chọn"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "notes": "帖子",
  "poll": "投票"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "notes": "貼文",
  "poll": "票選活動"
}
</locale>
