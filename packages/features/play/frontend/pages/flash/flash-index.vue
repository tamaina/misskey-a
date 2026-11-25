<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="tab === 'search'">
			<div class="_gaps">
				<MkInput v-model="searchQuery" :large="true" type="search">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<MkButton large primary gradate rounded style="margin: 0 auto;" @click="search">{{ globalLocale.env.search }}</MkButton>
				<MkPagination v-if="searchPaginator" v-slot="{items}" :key="searchKey" :paginator="searchPaginator">
					<div class="_gaps_s">
						<MkFlashPreview v-for="flash in items" :key="flash.id" :flash="flash"/>
					</div>
				</MkPagination>
			</div>
		</div>

		<div v-else-if="tab === 'featured'">
			<MkPagination v-slot="{items}" :paginator="featuredFlashsPaginator">
				<div class="_gaps_s">
					<MkFlashPreview v-for="flash in items" :key="flash.id" :flash="flash"/>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'my'">
			<div class="_gaps">
				<MkButton gradate rounded style="margin: 0 auto;" @click="create()"><i class="ti ti-plus"></i></MkButton>
				<MkPagination v-slot="{items}" :paginator="myFlashsPaginator">
					<div class="_gaps_s">
						<MkFlashPreview v-for="flash in items" :key="flash.id" :flash="flash"/>
					</div>
				</MkPagination>
			</div>
		</div>

		<div v-else-if="tab === 'liked'">
			<MkPagination v-slot="{items}" :paginator="likedFlashsPaginator" withControl>
				<div class="_gaps_s">
					<MkFlashPreview v-for="like in items" :key="like.flash.id" :flash="like.flash"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, markRaw, ref, shallowRef } from 'vue';
import MkFlashPreview from '@features/play/frontend/components/MkFlashPreview.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { IPaginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const router = useRouter();

const tab = ref('featured');

const searchQuery = ref('');
const searchPaginator = shallowRef<Paginator<'flash/search'> | null>(null);
const searchKey = ref(0);

const featuredFlashsPaginator = markRaw(new Paginator('flash/featured', {
	limit: 5,
	offsetMode: true,
}));
const myFlashsPaginator = markRaw(new Paginator('flash/my', {
	limit: 5,
}));
const likedFlashsPaginator = markRaw(new Paginator('flash/my-likes', {
	limit: 5,
	canSearch: true,
	searchParamName: 'search',
}));

function create() {
	router.push('/play/new');
}

function search() {
	if (searchQuery.value.trim() === '') {
		return;
	}

	searchPaginator.value = markRaw(new Paginator('flash/search', {
		params: {
			query: searchQuery.value,
		},
	}));

	searchKey.value++;
}

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: globalLocale.value.env.create,
	handler: create,
}]);

const headerTabs = computed(() => [{
	key: 'search',
	title: globalLocale.value.env.search,
	icon: 'ti ti-search',
}, {
	key: 'featured',
	title: $locale.value.sfc.featured,
	icon: 'ti ti-flare',
}, {
	key: 'my',
	title: $locale.value.sfc.my,
	icon: 'ti ti-edit',
}, {
	key: 'liked',
	title: $locale.value.sfc.liked,
	icon: 'ti ti-heart',
}]);

definePage(() => ({
	title: 'Play',
	icon: 'ti ti-player-play',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"featured": "الأكثر شعبية",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"featured": "Popular",
	"my": "Els meus guions",
	"liked": "Guions que m'han agradat"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"featured": "Populární",
	"my": "Moje Plays",
	"liked": "To se mi líbí Plays"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"featured": "Popular",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"featured": "Beliebt",
	"my": "Meine Plays",
	"liked": "Mit \"Gefällt mir\" markierte Plays"
}
</locale>

<locale locale="en-US" lang="json">
{
	"featured": "Popular",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"featured": "Popular",
	"my": "Mis guiones",
	"liked": "Guiones que te gustaron"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"featured": "Populaire",
	"my": "Mes Play",
	"liked": "Play aimés"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"featured": "Populer",
	"my": "Permainan saya",
	"liked": "Permainan Disukai"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"featured": "Popolari",
	"my": "I miei Play",
	"liked": "Play piaciuti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"featured": "人気",
	"my": "自分のPlay",
	"liked": "いいねしたPlay"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"featured": "人気",
	"my": "自分のPlay",
	"liked": "いいねしたPlay"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"featured": "Popular",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"featured": "Popular",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"featured": "인기",
	"my": "나의 Play",
	"liked": "좋아요 한 Play"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"featured": "Popular",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"featured": "Populært",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"featured": "Wyróżnione",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"featured": "Popular",
	"my": "Meus Plays",
	"liked": "Plays curtidos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"featured": "Популярные",
	"my": "Мои приложения ",
	"liked": "Понравилось"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"featured": "Význačné",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"featured": "เป็นที่นิยม",
	"my": "Play ของฉัน",
	"liked": "Play ที่ถูกใจไว้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"featured": "Popüler",
	"my": "Oyunlarım",
	"liked": "Beğenilen Oyunlar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"featured": "Popular",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"featured": "Популярні",
	"my": "My Plays",
	"liked": "Liked Plays"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"featured": "Nổi tiếng",
	"my": "Play của mình",
	"liked": "Play đã thích"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"featured": "热门",
	"my": "我的 Play",
	"liked": "喜欢的 Play"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"featured": "熱門",
	"my": "自己的 Play",
	"liked": "按讚的 Play"
}
</locale>
