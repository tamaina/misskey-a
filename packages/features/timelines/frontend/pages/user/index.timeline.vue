<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkTab
			v-model="tab"
			:tabs="[
				{ key: 'featured', label: $locale.sfc.featured },
				{ key: 'notes', label: $locale.sfc.notes },
				{ key: 'all', label: $locale.sfc.all },
				{ key: 'files', label: $locale.sfc.withFiles },
			]"
			:class="$style.tab"
		>
		</MkTab>
	</template>
	<MkNotesTimeline v-if="tab === 'featured'" :noGap="true" :paginator="featuredPaginator" :pullToRefresh="false" :class="$style.tl"/>
	<MkNotesTimeline v-else :noGap="true" :paginator="notesPaginator" :pullToRefresh="false" :class="$style.tl"/>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import MkTab from '@features/ui/frontend/components/MkTab.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const tab = ref<'featured' | 'notes' | 'all' | 'files'>('all');

const featuredPaginator = markRaw(new Paginator('users/featured-notes', {
	limit: 10,
	params: {
		userId: props.user.id,
	},
}));

const notesPaginator = markRaw(new Paginator('users/notes', {
	limit: 10,
	computedParams: computed(() => ({
		userId: props.user.id,
		withRenotes: tab.value === 'all',
		withReplies: tab.value === 'all',
		withChannelNotes: tab.value === 'all',
		withFiles: tab.value === 'files',
	})),
}));

defineExpose({
	reload: () => (tab.value === 'featured' ? featuredPaginator : notesPaginator).reload(),
});
</script>

<style lang="scss" module>
.tab {
	padding: calc(var(--MI-margin) / 2) 0;
	background: var(--MI_THEME-bg);
}

.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "featured": "المتداولة",
  "notes": "الملاحظات",
  "all": "الكل",
  "withFiles": "ذات مرفقات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "featured": "Destacat",
  "notes": "Notes",
  "all": "Tot",
  "withFiles": "Incloure arxius"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "featured": "Oblíbené poznámky",
  "notes": "Poznámky",
  "all": "Vše",
  "withFiles": "Včetně souborů"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "featured": "Featured",
  "notes": "Notes",
  "all": "All",
  "withFiles": "Including files"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "featured": "Beliebt",
  "notes": "Notizen",
  "all": "Alle",
  "withFiles": "Notizen mit Dateien"
}
</locale>

<locale locale="en-US" lang="json">
{
  "featured": "Featured",
  "notes": "Notes",
  "all": "All",
  "withFiles": "Including files"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "featured": "Destacados",
  "notes": "Notas",
  "all": "Todo",
  "withFiles": "Adjuntos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "featured": "Tendances",
  "notes": "Notes",
  "all": "Tous",
  "withFiles": "Avec fichiers joints"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "featured": "Sorotan",
  "notes": "Catatan",
  "all": "Semua",
  "withFiles": "Media"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "featured": "In evidenza",
  "notes": "Note",
  "all": "Tutte",
  "withFiles": "Con allegati"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "featured": "ハイライト",
  "notes": "ノート",
  "all": "全て",
  "withFiles": "ファイル付き"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "featured": "ハイライト",
  "notes": "ノート",
  "all": "みんな",
  "withFiles": "ファイル付いとる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "featured": "Featured",
  "notes": "Notes",
  "all": "All",
  "withFiles": "Including files"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "featured": "Featured",
  "notes": "Notes",
  "all": "All",
  "withFiles": "Including files"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "featured": "유행",
  "notes": "노트",
  "all": "전체",
  "withFiles": "미디어"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "featured": "Uitgelicht",
  "notes": "Notities",
  "all": "Alle",
  "withFiles": "Bestanden toevoegen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "featured": "Featured",
  "notes": "Notes",
  "all": "Alle",
  "withFiles": "Including files"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "featured": "Wyróżnione",
  "notes": "Wpisy",
  "all": "Wszystkie",
  "withFiles": "Media"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "featured": "Destaques",
  "notes": "Posts",
  "all": "Todos",
  "withFiles": "Com arquivo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "featured": "Горячее",
  "notes": "Заметки",
  "all": "Все",
  "withFiles": "Заметки с файлами"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "featured": "Obľúbené poznámky",
  "notes": "Poznámky",
  "all": "Všetko",
  "withFiles": "Vrátane súborov"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "featured": "ไฮไลท์",
  "notes": " โน้ต",
  "all": "ทั้งหมด",
  "withFiles": "มีไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "featured": "Öne çıkan",
  "notes": "Notlar",
  "all": "Tümü",
  "withFiles": "Dosyalar dahil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "featured": "Featured",
  "notes": "Notes",
  "all": "All",
  "withFiles": "Including files"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "featured": "Популярні",
  "notes": "Записи",
  "all": "Всі",
  "withFiles": "Файли"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "featured": "Nổi bật",
  "notes": "Bài Viết",
  "all": "Tất cả",
  "withFiles": "Media"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "featured": "热门",
  "notes": "帖子",
  "all": "全部",
  "withFiles": "附件"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "featured": "精選",
  "notes": "貼文",
  "all": "全部",
  "withFiles": "附件"
}
</locale>
