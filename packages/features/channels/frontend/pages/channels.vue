<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 1200px;">
		<div v-if="tab === 'search'" :class="$style.searchRoot">
			<div class="_gaps">
				<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search" @enter="search">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<MkRadios
					v-model="searchType"
					:options="[
						{ value: 'nameAndDescription', label: $locale.sfc.nameAndDescription },
						{ value: 'nameOnly', label: $locale.sfc.nameOnly },
					]"
					@update:modelValue="search()"
				>
				</MkRadios>
				<MkButton large primary gradate rounded @click="search">{{ $locale.sfc.search }}</MkButton>
			</div>

			<MkFoldableSection v-if="channelPaginator">
				<template #header>{{ $locale.sfc.searchResult }}</template>
				<MkChannelList :key="key" :paginator="channelPaginator"/>
			</MkFoldableSection>
		</div>
		<div v-if="tab === 'featured'">
			<MkPagination v-slot="{items}" :paginator="featuredPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'favorites'">
			<MkPagination v-slot="{items}" :paginator="favoritesPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'following'">
			<MkPagination v-slot="{items}" :paginator="followingPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'owned'" class="_gaps">
			<MkButton v-if="$i?.policies.canCreateChannel" type="routerLink" primary rounded to="/channels/new"><i class="ti ti-plus"></i> {{ $locale.sfc.createNew }}</MkButton>
			<MkPagination v-slot="{items}" :paginator="ownedPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, onMounted, ref, shallowRef } from 'vue';
import MkChannelPreview from '@features/channels/frontend/components/MkChannelPreview.vue';
import MkChannelList from '@features/channels/frontend/components/MkChannelList.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import { $i } from '@features/auth/frontend/i.js';

const router = useRouter();

type SearchType = 'nameAndDescription' | 'nameOnly';

const props = defineProps<{
	query: string;
	type?: SearchType;
}>();

const key = ref('');
const tab = ref('featured');
const searchQuery = ref('');
const searchType = ref<SearchType>('nameAndDescription');
const channelPaginator = shallowRef();

onMounted(() => {
	searchQuery.value = props.query ?? '';
	searchType.value = props.type ?? 'nameAndDescription';
});

const featuredPaginator = markRaw(new Paginator('channels/featured', {
	limit: 10,
	noPaging: true,
}));
const favoritesPaginator = markRaw(new Paginator('channels/my-favorites', {
	limit: 100,
	noPaging: true,
}));
const followingPaginator = markRaw(new Paginator('channels/followed', {
	limit: 10,
}));
const ownedPaginator = markRaw(new Paginator('channels/owned', {
	limit: 10,
}));

async function search() {
	const query = searchQuery.value.toString().trim();

	if (query == null) return;

	const type = searchType.value.toString().trim();

	if (type !== 'nameAndDescription' && type !== 'nameOnly') {
		console.error(`Unrecognized search type: ${type}`);
		return;
	}

	channelPaginator.value = markRaw(new Paginator('channels/search', {
		limit: 10,
		params: {
			query: searchQuery.value,
			type: type,
		},
	}));

	key.value = query + type;
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'search',
	title: $locale.value.sfc.search,
	icon: 'ti ti-search',
}, {
	key: 'featured',
	title: $locale.value.sfc.featured,
	icon: 'ti ti-comet',
}, {
	key: 'favorites',
	title: $locale.value.sfc.favorites,
	icon: 'ti ti-star',
}, {
	key: 'following',
	title: $locale.value.sfc.following,
	icon: 'ti ti-eye',
}, {
	key: 'owned',
	title: $locale.value.sfc.owned,
	icon: 'ti ti-edit',
}]);

definePage(() => ({
	title: $locale.value.sfc.channel,
	icon: 'ti ti-device-tv',
}));
</script>

<style lang="scss" module>
.searchRoot {
	width: 100%;
	max-width: 700px;
	margin: 0 auto;
}

.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
	gap: var(--MI-margin);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"search": "البحث",
	"featured": "المتداوَلة",
	"favorites": "المفضلات",
	"following": "متابَع",
	"owned": "قنواتي",
	"channel": "القنوات",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "نتائج البحث",
	"createNew": "أنشِئ جديد"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"search": "Cercar",
	"featured": "Popular",
	"favorites": "Favorits",
	"following": "Seguin",
	"owned": "Propietat",
	"channel": "Canals",
	"nameAndDescription": "Nom i descripció ",
	"nameOnly": "Nom només ",
	"searchResult": "Resultats de la cerca",
	"createNew": "Crear"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"search": "Vyhledávání",
	"featured": "Trendy",
	"favorites": "Oblíbené",
	"following": "Sledovaný",
	"owned": "Vlastněný",
	"channel": "Kanály",
	"nameAndDescription": "Název a popis",
	"nameOnly": "Pouze název",
	"searchResult": "Výsledky hledání",
	"createNew": "Vytvořit nový"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"search": "Search",
	"featured": "Trending",
	"favorites": "Favorites",
	"following": "Followed",
	"owned": "Owned",
	"channel": "Channels",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Search results",
	"createNew": "Create new"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"search": "Suchen",
	"featured": "Trends",
	"favorites": "Favoriten",
	"following": "Gefolgt",
	"owned": "In Besitz",
	"channel": "Kanäle",
	"nameAndDescription": "Name und Beschreibung",
	"nameOnly": "Nur Name",
	"searchResult": "Suchergebnisse",
	"createNew": "Neu erstellen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"search": "Search",
	"featured": "Trending",
	"favorites": "Favorites",
	"following": "Followed",
	"owned": "Owned",
	"channel": "Channels",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Search results",
	"createNew": "Create new"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"search": "Buscar",
	"featured": "Tendencias",
	"favorites": "Favoritos",
	"following": "Siguiendo",
	"owned": "Dueño",
	"channel": "Canal",
	"nameAndDescription": "Nombre y descripción",
	"nameOnly": "Sólo nombre",
	"searchResult": "Resultados de búsqueda",
	"createNew": "Crear Nuevo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"search": "Rechercher",
	"featured": "Tendances",
	"favorites": "Favoris",
	"following": "Abonné·e",
	"owned": "Mes canaux",
	"channel": "Canaux",
	"nameAndDescription": "Nom et description",
	"nameOnly": "Nom seulement",
	"searchResult": "Résultats de la recherche",
	"createNew": "Créer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"search": "Cari",
	"featured": "Tren",
	"favorites": "Favorit",
	"following": "Mengikuti",
	"owned": "Dimiliki",
	"channel": "Kanal",
	"nameAndDescription": "Nama dan deskripsi",
	"nameOnly": "Hanya nama",
	"searchResult": "Hasil Penelusuran",
	"createNew": "Buat baru"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"search": "Cerca",
	"featured": "Popolari nel canale",
	"favorites": "Preferiti",
	"following": "Following",
	"owned": "I miei canali",
	"channel": "Canale",
	"nameAndDescription": "Nome e descrizione",
	"nameOnly": "Solo il nome",
	"searchResult": "Risultati della Ricerca",
	"createNew": "Crea"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"search": "検索",
	"featured": "トレンド",
	"favorites": "お気に入り",
	"following": "フォロー中",
	"owned": "管理中",
	"channel": "チャンネル",
	"nameAndDescription": "名前と説明",
	"nameOnly": "名前のみ",
	"searchResult": "検索結果",
	"createNew": "新規作成"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"search": "探す",
	"featured": "トレンド",
	"favorites": "お気に入り",
	"following": "フォロー中やで",
	"owned": "管理しとる",
	"channel": "チャンネル",
	"nameAndDescription": "名前と説明",
	"nameOnly": "名前だけ",
	"searchResult": "検索結果やで",
	"createNew": "新しく作るで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"search": "Nadi",
	"featured": "Trending",
	"favorites": "Favorites",
	"following": "Followed",
	"owned": "Owned",
	"channel": "Channels",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Search results",
	"createNew": "Create new"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"search": "ಹುಡುಕು",
	"featured": "Trending",
	"favorites": "ಮೆಚ್ಚಿನವುಗಳು",
	"following": "Followed",
	"owned": "Owned",
	"channel": "Channels",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Search results",
	"createNew": "Create new"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"search": "검색",
	"featured": "트렌드",
	"favorites": "즐겨찾기",
	"following": "팔로잉",
	"owned": "관리중",
	"channel": "채널",
	"nameAndDescription": "이름과 설명",
	"nameOnly": "이름만",
	"searchResult": "검색 결과",
	"createNew": "새로 만들기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"search": "Zoeken",
	"featured": "Trending",
	"favorites": "Toevoegen aan favorieten",
	"following": "Followed",
	"owned": "Owned",
	"channel": "Kanalen",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Zoekresultaten",
	"createNew": "Nieuwe aanmaken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"search": "Søk",
	"featured": "Populært",
	"favorites": "Favoritter",
	"following": "Følger",
	"owned": "Owned",
	"channel": "Kanaler",
	"nameAndDescription": "Navn og beskrivelse",
	"nameOnly": "Name only",
	"searchResult": "Search results",
	"createNew": "Create new"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"search": "Szukaj",
	"featured": "Na czasie",
	"favorites": "Ulubione",
	"following": "Śledzeni",
	"owned": "Własny",
	"channel": "Kanały",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Wyniki wyszukiwania",
	"createNew": "Utwórz nowy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"search": "Pesquisar",
	"featured": "Destaques",
	"favorites": "Favoritos",
	"following": "Seguindo",
	"owned": "Autoral",
	"channel": "Canais",
	"nameAndDescription": "Nome e descrição",
	"nameOnly": "Apenas o nome",
	"searchResult": "Pesquisar",
	"createNew": "Criar novo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"search": "Поиск",
	"featured": "Актуальные",
	"favorites": "Избранное",
	"following": "Подписки",
	"owned": "Собственные",
	"channel": "Каналы",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Результаты поиска",
	"createNew": "Новый документ"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"search": "Hľadať",
	"featured": "Trendy",
	"favorites": "Obľúbené",
	"following": "Sledované",
	"owned": "Vlastnené",
	"channel": "Kanály",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Výsledky hľadania",
	"createNew": "Vytvoriť nový"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"search": "ค้นหา",
	"featured": "เทรนด์",
	"favorites": "รายการโปรด",
	"following": "ติดตามแล้ว",
	"owned": "เจ้าของ",
	"channel": "ช่อง",
	"nameAndDescription": "ชื่อและคำอธิบาย",
	"nameOnly": "ชื่อเท่านั้น",
	"searchResult": "ผลการค้นหา",
	"createNew": "สร้างใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"search": "Ara",
	"featured": "Trend olan",
	"favorites": "Favoriler",
	"following": "Takip edildi",
	"owned": "Sahip olunan",
	"channel": "Kanallar",
	"nameAndDescription": "Adı ve açıklaması",
	"nameOnly": "Sadece isim",
	"searchResult": "Arama sonuçları",
	"createNew": "Yeni oluştur"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"search": "ئىزدەش",
	"featured": "Trending",
	"favorites": "Favorites",
	"following": "Followed",
	"owned": "Owned",
	"channel": "Channels",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Search results",
	"createNew": "Create new"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"search": "Пошук",
	"featured": "Тренди",
	"favorites": "Обране",
	"following": "Підписки",
	"owned": "Owned",
	"channel": "Канали",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Результати пошуку",
	"createNew": "Створити новий"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"search": "Tìm kiếm",
	"featured": "Xu hướng",
	"favorites": "Lượt thích",
	"following": "Đang theo dõi",
	"owned": "Do tôi quản lý",
	"channel": "Kênh",
	"nameAndDescription": "Name and description",
	"nameOnly": "Name only",
	"searchResult": "Kết quả tìm kiếm",
	"createNew": "Tạo mới"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"search": "搜索",
	"featured": "热门",
	"favorites": "收藏",
	"following": "正在关注",
	"owned": "我的频道",
	"channel": "频道",
	"nameAndDescription": "名称与描述",
	"nameOnly": "仅名称",
	"searchResult": "搜索结果",
	"createNew": "新建"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"search": "搜尋",
	"featured": "熱門貼文",
	"favorites": "我的最愛",
	"following": "追隨中",
	"owned": "管理中",
	"channel": "頻道",
	"nameAndDescription": "名稱",
	"nameOnly": "僅名稱",
	"searchResult": "搜尋結果",
	"createNew": "新建"
}
</locale>
