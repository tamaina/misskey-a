<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkPagination :paginator="paginator">
			<template #empty><MkResult type="empty" :text="$locale.sfc.noNotes"/></template>

			<template #default="{ items }">
				<MkNote v-for="item in items" :key="item.id" :note="item.note" :class="$style.note"/>
			</template>
		</MkPagination>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const paginator = markRaw(new Paginator('i/favorites', {
	limit: 10,
}));

definePage(() => ({
	title: $locale.value.sfc.favorites,
	icon: 'ti ti-star',
}));
</script>

<style lang="scss" module>
.note {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"noNotes": "لم يُعثر على أية ملاحظات",
	"favorites": "المفضلات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"noNotes": "Cap nota",
	"favorites": "Favorits"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"noNotes": "Žádné poznámky",
	"favorites": "Oblíbené"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"noNotes": "No notes",
	"favorites": "Favorites"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"noNotes": "Keine Notizen gefunden",
	"favorites": "Favoriten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"noNotes": "No notes",
	"favorites": "Favorites"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"noNotes": "No hay notas",
	"favorites": "Favoritos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"noNotes": "Aucune note",
	"favorites": "Favoris"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"noNotes": "Belum ada catatan",
	"favorites": "Favorit"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"noNotes": "Nessuna nota!",
	"favorites": "Preferiti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"noNotes": "ノートはありません",
	"favorites": "お気に入り"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"noNotes": "ノートはあらへん",
	"favorites": "お気に入り"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"noNotes": "No notes",
	"favorites": "Favorites"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"noNotes": "ಟಿಪ್ಪಣಿಗಳಿಲ್ಲ",
	"favorites": "ಮೆಚ್ಚಿನವುಗಳು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"noNotes": "노트가 없습니다",
	"favorites": "즐겨찾기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"noNotes": "Geen notities",
	"favorites": "Toevoegen aan favorieten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"noNotes": "Ingen Notes",
	"favorites": "Favoritter"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"noNotes": "Brak wpisów",
	"favorites": "Ulubione"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"noNotes": "Sem notas",
	"favorites": "Favoritos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"noNotes": "Нет ни одной заметки",
	"favorites": "Избранное"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"noNotes": "Žiadne poznámky",
	"favorites": "Obľúbené"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"noNotes": "ไม่มีโน้ต",
	"favorites": "รายการโปรด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"noNotes": "Not yok",
	"favorites": "Favoriler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"noNotes": "No notes",
	"favorites": "Favorites"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"noNotes": "Немає нотаток",
	"favorites": "Обране"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"noNotes": "Chưa có bài viết nào.",
	"favorites": "Lượt thích"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"noNotes": "没有帖子",
	"favorites": "收藏"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"noNotes": "無貼文",
	"favorites": "我的最愛"
}
</locale>
