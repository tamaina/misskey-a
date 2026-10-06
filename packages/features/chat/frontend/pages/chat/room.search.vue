<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInput
		v-model="searchQuery"
		:placeholder="$locale.sfc.searchMessages"
		type="search"
		@enter="search()"
	>
		<template #prefix><i class="ti ti-search"></i></template>
	</MkInput>

	<MkButton primary rounded @click="search">{{ $locale.sfc.search }}</MkButton>

	<MkFoldableSection v-if="searched">
		<template #header>{{ $locale.sfc.searchResult }}</template>

		<div v-if="searchResults.length > 0" class="_gaps_s">
			<div v-for="message in searchResults" :key="message.id" :class="$style.searchResultItem">
				<XMessage :message="message" :user="message.fromUser" :isSearchResult="true"/>
			</div>
		</div>
		<MkResult v-else type="notFound"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XMessage from '@features/chat/frontend/pages/chat/XMessage.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';

const props = defineProps<{
	userId?: string;
	roomId?: string;
}>();

const searchQuery = ref('');
const searched = ref(false);
const searchResults = ref<Misskey.entities.ChatMessage[]>([]);

async function search() {
	const res = await misskeyApi('chat/messages/search', {
		query: searchQuery.value,
		roomId: props.roomId,
		userId: props.userId,
	});

	searchResults.value = res;
	searched.value = true;
}
</script>

<style lang="scss" module>
.searchResultItem {
	padding: 12px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 12px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "searchMessages": "Search messages",
  "search": "البحث",
  "searchResult": "نتائج البحث"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "searchMessages": "Buscar missatges ",
  "search": "Cercar",
  "searchResult": "Resultats de la cerca"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Vyhledávání",
  "searchResult": "Výsledky hledání"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Search",
  "searchResult": "Search results"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "searchMessages": "Nachrichten suchen",
  "search": "Suchen",
  "searchResult": "Suchergebnisse"
}
</locale>

<locale locale="en-US" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Search",
  "searchResult": "Search results"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "searchMessages": "Buscar mensajes",
  "search": "Buscar",
  "searchResult": "Resultados de búsqueda"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Rechercher",
  "searchResult": "Résultats de la recherche"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Cari",
  "searchResult": "Hasil Penelusuran"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "searchMessages": "Cerca messaggi",
  "search": "Cerca",
  "searchResult": "Risultati della Ricerca"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "searchMessages": "メッセージを検索",
  "search": "検索",
  "searchResult": "検索結果"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "searchMessages": "メッセージを検索",
  "search": "探す",
  "searchResult": "検索結果やで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Nadi",
  "searchResult": "Search results"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "searchMessages": "Search messages",
  "search": "ಹುಡುಕು",
  "searchResult": "Search results"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "searchMessages": "메시지 검색",
  "search": "검색",
  "searchResult": "검색 결과"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Zoeken",
  "searchResult": "Zoekresultaten"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Søk",
  "searchResult": "Search results"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Szukaj",
  "searchResult": "Wyniki wyszukiwania"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "searchMessages": "Pesquisar mensagens",
  "search": "Pesquisar",
  "searchResult": "Pesquisar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "searchMessages": "Поиск сообщений",
  "search": "Поиск",
  "searchResult": "Результаты поиска"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Hľadať",
  "searchResult": "Výsledky hľadania"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "searchMessages": "ค้นหาข้อความ",
  "search": "ค้นหา",
  "searchResult": "ผลการค้นหา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "searchMessages": "Mesajları ara",
  "search": "Ara",
  "searchResult": "Arama sonuçları"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "searchMessages": "Search messages",
  "search": "ئىزدەش",
  "searchResult": "Search results"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "searchMessages": "Шукати повідомлення",
  "search": "Пошук",
  "searchResult": "Результати пошуку"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "searchMessages": "Search messages",
  "search": "Tìm kiếm",
  "searchResult": "Kết quả tìm kiếm"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "searchMessages": "搜索消息",
  "search": "搜索",
  "searchResult": "搜索结果"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "searchMessages": "搜尋聊天訊息",
  "search": "搜尋",
  "searchResult": "搜尋結果"
}
</locale>
