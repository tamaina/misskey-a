<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<EmPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad">
	<template #empty>
		<div class="_fullinfo">
			<div>{{ $locale.sfc.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: notes }">
		<div :class="[$style.root]">
			<EmNote v-for="note in notes" :key="note._featuredId_ || note._prId_ || note.id" :class="$style.note" :note="note as Misskey.entities.Note"/>
		</div>
	</template>
</EmPagination>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import EmNote from '@features/notes/frontend/embed/components/EmNote.vue';
import EmPagination from '@features/ui/frontend/embed/components/EmPagination.vue';
import type { Paging } from '@features/ui/frontend/embed/components/EmPagination.vue';
import * as Misskey from 'misskey-js';

withDefaults(defineProps<{
	pagination: Paging;
	noGap?: boolean;
	disableAutoLoad?: boolean;
	ad?: boolean;
}>(), {
	ad: true,
});

const pagingComponent = useTemplateRef('pagingComponent');

defineExpose({
	pagingComponent,
});
</script>

<style lang="scss" module>
.root {
	background: var(--MI_THEME-panel);
}

.note {
	border-bottom: 0.5px solid var(--MI_THEME-divider);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"noNotes": "لم يُعثر على أية ملاحظات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"noNotes": "Cap nota"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"noNotes": "Žádné poznámky"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"noNotes": "No notes"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"noNotes": "Keine Notizen gefunden"
}
</locale>

<locale lang="json" locale="en-US">
{
	"noNotes": "No notes"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"noNotes": "No hay notas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"noNotes": "Aucune note"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"noNotes": "Belum ada catatan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"noNotes": "Nessuna nota!"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"noNotes": "ノートはありません"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"noNotes": "ノートはあらへん"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"noNotes": "No notes"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"noNotes": "ಟಿಪ್ಪಣಿಗಳಿಲ್ಲ"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"noNotes": "노트가 없습니다"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"noNotes": "Geen notities"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"noNotes": "Ingen Notes"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"noNotes": "Brak wpisów"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"noNotes": "Sem notas"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"noNotes": "Нет ни одной заметки"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"noNotes": "Žiadne poznámky"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"noNotes": "ไม่มีโน้ต"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"noNotes": "Not yok"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"noNotes": "No notes"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"noNotes": "Немає нотаток"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"noNotes": "Chưa có bài viết nào."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"noNotes": "没有帖子"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"noNotes": "無貼文"
}
</locale>
