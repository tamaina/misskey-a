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

	<MkButton primary rounded @click="search">{{ globalLocale.env.search }}</MkButton>

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
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XMessage from '@features/chat/frontend/pages/chat/XMessage.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
  "searchResult": "نتائج البحث"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "searchMessages": "Buscar missatges ",
  "searchResult": "Resultats de la cerca"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Výsledky hledání"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Search results"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "searchMessages": "Nachrichten suchen",
  "searchResult": "Suchergebnisse"
}
</locale>

<locale locale="en-US" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Search results"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "searchMessages": "Buscar mensajes",
  "searchResult": "Resultados de búsqueda"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Résultats de la recherche"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Hasil Penelusuran"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "searchMessages": "Cerca messaggi",
  "searchResult": "Risultati della Ricerca"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "searchMessages": "メッセージを検索",
  "searchResult": "検索結果"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "searchMessages": "メッセージを検索",
  "searchResult": "検索結果やで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Search results"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Search results"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "searchMessages": "메시지 검색",
  "searchResult": "검색 결과"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Zoekresultaten"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Search results"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Wyniki wyszukiwania"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "searchMessages": "Pesquisar mensagens",
  "searchResult": "Pesquisar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "searchMessages": "Поиск сообщений",
  "searchResult": "Результаты поиска"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Výsledky hľadania"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "searchMessages": "ค้นหาข้อความ",
  "searchResult": "ผลการค้นหา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "searchMessages": "Mesajları ara",
  "searchResult": "Arama sonuçları"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Search results"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "searchMessages": "Шукати повідомлення",
  "searchResult": "Результати пошуку"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "searchMessages": "Search messages",
  "searchResult": "Kết quả tìm kiếm"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "searchMessages": "搜索消息",
  "searchResult": "搜索结果"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "searchMessages": "搜尋聊天訊息",
  "searchResult": "搜尋結果"
}
</locale>
