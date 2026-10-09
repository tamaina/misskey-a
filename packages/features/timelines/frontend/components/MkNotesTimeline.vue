<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :paginator="paginator" :direction="direction" :autoLoad="autoLoad" :pullToRefresh="pullToRefresh" :withControl="withControl" :forceDisableInfiniteScroll="forceDisableInfiniteScroll">
	<template #empty><MkResult type="empty" :text="$locale.sfc.noNotes"/></template>

	<template #default="{ items: notes }">
		<div :class="[$style.root, { [$style.noGap]: noGap, '_gaps': !noGap }]">
			<template v-for="(note, i) in notes" :key="note.id">
				<div
					v-if="i > 0 && isSeparatorNeeded(paginator.items.value[i - 1].createdAt, note.createdAt)"
					:data-scroll-anchor="note.id"
					:class="{ '_gaps': !noGap }"
				>
					<div :class="[$style.date, { [$style.noGap]: noGap }]">
						<span><i class="ti ti-chevron-up"></i> {{ getSeparatorInfo(paginator.items.value[i - 1].createdAt, note.createdAt)?.prevText }}</span>
						<span style="height: 1em; width: 1px; background: var(--MI_THEME-divider);"></span>
						<span>{{ getSeparatorInfo(paginator.items.value[i - 1].createdAt, note.createdAt)?.nextText }} <i class="ti ti-chevron-down"></i></span>
					</div>
					<MkNote :class="$style.note" :note="note" :withHardMute="true"/>
					<div v-if="note._shouldInsertAd_" :class="$style.ad">
						<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
					</div>
				</div>
				<div v-else-if="note._shouldInsertAd_" :class="{ '_gaps': !noGap }" :data-scroll-anchor="note.id">
					<MkNote :class="$style.note" :note="note" :withHardMute="true"/>
					<div :class="$style.ad">
						<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
					</div>
				</div>
				<MkNote v-else :class="$style.note" :note="note" :withHardMute="true" :data-scroll-anchor="note.id"/>
			</template>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup generic="T extends IPaginator<Misskey.entities.Note>">
import * as Misskey from 'misskey-js';
import type { MkPaginationOptions } from '../../../ui/frontend/components/MkPagination.vue';
import type { IPaginator } from '@features/ui/frontend/utility/paginator.js';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import MkPagination from '../../../ui/frontend/components/MkPagination.vue';
import { useGlobalEvent } from '@features/runtime/frontend/events.js';
import { isSeparatorNeeded, getSeparatorInfo } from '@features/timelines/frontend/utility/timeline-date-separate.js';

const props = withDefaults(defineProps<MkPaginationOptions & {
	paginator: T;
	noGap?: boolean;
}>(), {
	autoLoad: true,
	direction: 'down',
	pullToRefresh: true,
	withControl: true,
	forceDisableInfiniteScroll: false,
});

useGlobalEvent('noteDeleted', (noteId) => {
	props.paginator.removeItem(noteId);
});

function reload() {
	return props.paginator.reload();
}

defineExpose({
	reload,
});
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;

	&.noGap {
		background: var(--MI_THEME-panel);

		.note {
			border-bottom: solid 0.5px var(--MI_THEME-divider);
		}

		.ad {
			padding: 8px;
			background-size: auto auto;
			background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, var(--MI_THEME-bg) 8px, var(--MI_THEME-bg) 14px);
			border-bottom: solid 0.5px var(--MI_THEME-divider);
		}
	}

	&:not(.noGap) {
		background: var(--MI_THEME-bg);

		.note {
			background: var(--MI_THEME-panel);
			border-radius: var(--MI-radius);
		}
	}
}

.date {
	display: flex;
	font-size: 85%;
	align-items: center;
	justify-content: center;
	gap: 1em;
	opacity: 0.75;
	padding: 8px 8px;
	margin: 0 auto;

	&.noGap {
		border-bottom: solid 0.5px var(--MI_THEME-divider);
	}
}

.ad:empty {
	display: none;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "noNotes": "لم يُعثر على أية ملاحظات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "noNotes": "Cap nota"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "noNotes": "Žádné poznámky"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "noNotes": "No notes"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "noNotes": "Keine Notizen gefunden"
}
</locale>

<locale locale="en-US" lang="json">
{
  "noNotes": "No notes"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "noNotes": "No hay notas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "noNotes": "Aucune note"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "noNotes": "Belum ada catatan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "noNotes": "Nessuna nota!"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "noNotes": "ノートはありません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "noNotes": "ノートはあらへん"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "noNotes": "No notes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "noNotes": "ಟಿಪ್ಪಣಿಗಳಿಲ್ಲ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "noNotes": "노트가 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "noNotes": "Geen notities"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "noNotes": "Ingen Notes"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "noNotes": "Brak wpisów"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "noNotes": "Sem notas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "noNotes": "Нет ни одной заметки"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "noNotes": "Žiadne poznámky"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "noNotes": "ไม่มีโน้ต"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "noNotes": "Not yok"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "noNotes": "No notes"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "noNotes": "Немає нотаток"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "noNotes": "Chưa có bài viết nào."
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "noNotes": "没有帖子"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "noNotes": "無貼文"
}
</locale>
