<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkButton v-if="$i && ($i.isModerator || $i.policies.canManageCustomEmojis)" primary type="routerLink" to="/custom-emojis-manager">{{ $locale.sfc.manageCustomEmojis }}</MkButton>

	<div class="query">
		<MkInput v-model="q" class="" :placeholder="$locale.sfc.search" autocapitalize="off">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
	</div>

	<MkFoldableSection v-if="searchEmojis">
		<template #header>{{ $locale.sfc.searchResult }}</template>
		<div :class="$style.emojis">
			<EmojiCatalogItem v-for="emoji in searchEmojis" :key="emoji.name" :emoji="emoji"/>
		</div>
	</MkFoldableSection>

	<MkFoldableSection v-for="category in customEmojiCategories" v-once :key="category ?? '___root___'" :expanded="false">
		<template #header>{{ category || $locale.sfc.other }}</template>
		<div :class="$style.emojis">
			<EmojiCatalogItem v-for="emoji in customEmojis.filter(e => e.category === category)" :key="emoji.name" :emoji="emoji"/>
		</div>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { watch, ref } from 'vue';
import type { EmojiSimple } from '../backend/api.schema.js';
import EmojiCatalogItem from './EmojiCatalogItem.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import { customEmojis, customEmojiCategories } from '@features/emojis/frontend/custom-emojis.js';
import { $i } from '@features/auth/frontend/i.js';
import { searchEmojiCatalog } from './search.js';

const q = ref('');
const searchEmojis = ref<EmojiSimple[] | null>(null);

function search() {
	searchEmojis.value = searchEmojiCatalog(customEmojis.value, q.value);
}

watch(q, () => {
	search();
});
</script>

<style lang="scss" module>
.emojis {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	grid-gap: 12px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "manageCustomEmojis": "إدارة الإيموجي المخصصة",
  "search": "البحث",
  "searchResult": "نتائج البحث",
  "other": "منوعات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "manageCustomEmojis": "Gestiona els emojis personalitzats",
  "search": "Cercar",
  "searchResult": "Resultats de la cerca",
  "other": "Altres"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "manageCustomEmojis": "Spravovat vlastní emoji",
  "search": "Vyhledávání",
  "searchResult": "Výsledky hledání",
  "other": "Ostatní"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "manageCustomEmojis": "Manage Custom Emojis",
  "search": "Search",
  "searchResult": "Search results",
  "other": "Other"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "manageCustomEmojis": "Kann benutzerdefinierte Emojis verwalten",
  "search": "Suchen",
  "searchResult": "Suchergebnisse",
  "other": "Anderes"
}
</locale>

<locale locale="en-US" lang="json">
{
  "manageCustomEmojis": "Manage Custom Emojis",
  "search": "Search",
  "searchResult": "Search results",
  "other": "Other"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "manageCustomEmojis": "Administrar emojis personalizados",
  "search": "Buscar",
  "searchResult": "Resultados de búsqueda",
  "other": "Otro"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "manageCustomEmojis": "Gestion des émojis personnalisés",
  "search": "Rechercher",
  "searchResult": "Résultats de la recherche",
  "other": "Autre"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "manageCustomEmojis": "Kelola Emoji Kustom",
  "search": "Cari",
  "searchResult": "Hasil Penelusuran",
  "other": "Lainnya"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "manageCustomEmojis": "Gestisci le emoji personalizzate",
  "search": "Cerca",
  "searchResult": "Risultati della Ricerca",
  "other": "Eccetera"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "manageCustomEmojis": "カスタム絵文字の管理",
  "search": "検索",
  "searchResult": "検索結果",
  "other": "その他"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "manageCustomEmojis": "カスタム絵文字の管理",
  "search": "探す",
  "searchResult": "検索結果やで",
  "other": "その他"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "manageCustomEmojis": "Manage Custom Emojis",
  "search": "Nadi",
  "searchResult": "Search results",
  "other": "Wiyyaḍ"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "manageCustomEmojis": "Manage Custom Emojis",
  "search": "ಹುಡುಕು",
  "searchResult": "Search results",
  "other": "Other"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "manageCustomEmojis": "커스텀 이모지 관리",
  "search": "검색",
  "searchResult": "검색 결과",
  "other": "기타"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "manageCustomEmojis": "Manage Custom Emojis",
  "search": "Zoeken",
  "searchResult": "Zoekresultaten",
  "other": "Ander"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "manageCustomEmojis": "Manage Custom Emojis",
  "search": "Søk",
  "searchResult": "Search results",
  "other": "Andre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "manageCustomEmojis": "Zarządzaj niestandardowymi Emoji",
  "search": "Szukaj",
  "searchResult": "Wyniki wyszukiwania",
  "other": "Inne"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "manageCustomEmojis": "Gerenciar Emojis customizados",
  "search": "Pesquisar",
  "searchResult": "Pesquisar",
  "other": "Outros"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "manageCustomEmojis": "Управлять пользовательскими эмодзи",
  "search": "Поиск",
  "searchResult": "Результаты поиска",
  "other": "Другие"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "manageCustomEmojis": "Manage Custom Emojis",
  "search": "Hľadať",
  "searchResult": "Výsledky hľadania",
  "other": "Ostatní"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "manageCustomEmojis": "จัดการเอโมจิที่กำหนดเอง",
  "search": "ค้นหา",
  "searchResult": "ผลการค้นหา",
  "other": "อื่น ๆ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "manageCustomEmojis": "Özel Emojileri Yönet",
  "search": "Ara",
  "searchResult": "Arama sonuçları",
  "other": "Diğer"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "manageCustomEmojis": "Manage Custom Emojis",
  "search": "ئىزدەش",
  "searchResult": "Search results",
  "other": "Other"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "manageCustomEmojis": "Керування користувацькими емодзі",
  "search": "Пошук",
  "searchResult": "Результати пошуку",
  "other": "Інше"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "manageCustomEmojis": "Quản lý CustomEmoji",
  "search": "Tìm kiếm",
  "searchResult": "Kết quả tìm kiếm",
  "other": "Khác"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "manageCustomEmojis": "管理自定义表情符号",
  "search": "搜索",
  "searchResult": "搜索结果",
  "other": "其他"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "manageCustomEmojis": "管理自訂表情符號",
  "search": "搜尋",
  "searchResult": "搜尋結果",
  "other": "其他"
}
</locale>
