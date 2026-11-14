<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="tab === 'featured'">
			<MkPagination v-slot="{items}" :paginator="featuredPagesPaginator">
				<div class="_gaps">
					<MkPagePreview v-for="page in items" :key="page.id" :page="page"/>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'my'" class="_gaps">
			<MkButton class="new" @click="create()"><i class="ti ti-plus"></i></MkButton>
			<MkPagination v-slot="{items}" :paginator="myPagesPaginator">
				<div class="_gaps">
					<MkPagePreview v-for="page in items" :key="page.id" :page="page"/>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'liked'">
			<MkPagination v-slot="{items}" :paginator="likedPagesPaginator">
				<div class="_gaps">
					<MkPagePreview v-for="like in items" :key="like.page.id" :page="like.page"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, markRaw, ref } from 'vue';
import MkPagePreview from '@features/pages/frontend/components/MkPagePreview.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const router = useRouter();

const tab = ref('featured');

const featuredPagesPaginator = markRaw(new Paginator('pages/featured', {
	noPaging: true,
}));
const myPagesPaginator = markRaw(new Paginator('i/pages', {
	limit: 5,
}));
const likedPagesPaginator = markRaw(new Paginator('i/page-likes', {
	limit: 5,
}));

function create() {
	router.push('/pages/new');
}

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: globalLocale.value.env.create,
	handler: create,
}]);

const headerTabs = computed(() => [{
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
	title: $locale.value.sfc.pages,
	icon: 'ti ti-note',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"featured": "الأكثر شعبية",
	"my": "صفحاتي",
	"liked": "الصفحات المُعجب بها",
	"pages": "الصفحات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"featured": "Popular",
	"my": "Les meves pàgines ",
	"liked": "Pàgines que m'agraden ",
	"pages": "Pàgines"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"featured": "Populární",
	"my": "Moje stránky",
	"liked": "To se mi líbí stránky",
	"pages": "Stránky"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"featured": "Popular",
	"my": "My Pages",
	"liked": "Liked Pages",
	"pages": "Pages"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"featured": "Beliebt",
	"my": "Meine Seiten",
	"liked": "Seiten, die mir gefallen",
	"pages": "Seiten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"featured": "Popular",
	"my": "My Pages",
	"liked": "Liked Pages",
	"pages": "Pages"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"featured": "Popular",
	"my": "Mis páginas",
	"liked": "Páginas que me gustan",
	"pages": "Páginas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"featured": "Populaire",
	"my": "Mes pages",
	"liked": "Pages favorites",
	"pages": "Pages"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"featured": "Populer",
	"my": "Halaman saya",
	"liked": "Halaman yang disukai",
	"pages": "Halaman"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"featured": "Popolari",
	"my": "Le mie pagine",
	"liked": "Pagine che mi piacciono",
	"pages": "Pagine"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"featured": "人気",
	"my": "自分のページ",
	"liked": "いいねしたページ",
	"pages": "ページ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"featured": "人気",
	"my": "自分のページ",
	"liked": "ええと思ったページ",
	"pages": "ページ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"featured": "Popular",
	"my": "My Pages",
	"liked": "Liked Pages",
	"pages": "Pages"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"featured": "Popular",
	"my": "My Pages",
	"liked": "Liked Pages",
	"pages": "Pages"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"featured": "인기",
	"my": "내 페이지",
	"liked": "좋아요한 페이지",
	"pages": "페이지"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"featured": "Popular",
	"my": "My Pages",
	"liked": "Liked Pages",
	"pages": "Pagina's"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"featured": "Populært",
	"my": "Mine sider",
	"liked": "Liked Pages",
	"pages": "Sider"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"featured": "Wyróżnione",
	"my": "Moje strony",
	"liked": "Polubione strony",
	"pages": "Strony"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"featured": "Populares",
	"my": "Minhas Páginas",
	"liked": "Páginas curtidas",
	"pages": "Páginas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"featured": "Популярные",
	"my": "Свои страницы",
	"liked": "Понравившиеся страницы",
	"pages": "Страницы"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"featured": "Význačné",
	"my": "Moje stránky",
	"liked": "Obľúbené stránky",
	"pages": "Stránky"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"featured": "เป็นที่นิยม",
	"my": "หน้าเพจของฉัน",
	"liked": "หน้าเพจที่ถูกใจ",
	"pages": "หน้าเพจ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"featured": "Popüler",
	"my": "Benzerlerini kaldır",
	"liked": "Beğenilen Sayfalar",
	"pages": "Sayfalar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"featured": "Popular",
	"my": "My Pages",
	"liked": "Liked Pages",
	"pages": "Pages"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"featured": "Популярні",
	"my": "Мої сторінки",
	"liked": "Вподобані сторінки",
	"pages": "Сторінки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"featured": "Nổi tiếng",
	"my": "Trang của tôi",
	"liked": "Trang đã thích",
	"pages": "Trang"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"featured": "热门",
	"my": "我的页面",
	"liked": "喜欢的页面",
	"pages": "页面"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"featured": "熱門",
	"my": "我的頁面",
	"liked": "已讚好的頁面",
	"pages": "頁面"
}
</locale>
