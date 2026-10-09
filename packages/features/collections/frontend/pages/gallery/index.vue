<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 1400px;">
		<div v-if="tab === 'explore'">
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-clock"></i>{{ $locale.sfc.recentPosts }}</template>
				<MkPagination v-slot="{items}" :paginator="recentPostsPaginator">
					<div :class="$style.items">
						<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
					</div>
				</MkPagination>
			</MkFoldableSection>
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-comet"></i>{{ $locale.sfc.popularPosts }}</template>
				<MkPagination v-slot="{items}" :paginator="popularPostsPaginator">
					<div :class="$style.items">
						<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
					</div>
				</MkPagination>
			</MkFoldableSection>
		</div>
		<div v-else-if="tab === 'liked'">
			<MkPagination v-slot="{items}" :paginator="likedPostsPaginator">
				<div :class="$style.items">
					<MkGalleryPostPreview v-for="like in items" :key="like.id" :post="like.post" class="post"/>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'my'">
			<MkA to="/gallery/new" class="_link" style="margin: 16px;"><i class="ti ti-plus"></i> {{ $locale.sfc.postToGallery }}</MkA>
			<MkPagination v-slot="{items}" :paginator="myPostsPaginator">
				<div :class="$style.items">
					<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { watch, ref, computed, markRaw } from 'vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkGalleryPostPreview from '@features/collections/frontend/components/MkGalleryPostPreview.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const router = useRouter();

const props = defineProps<{
	tag?: string;
}>();

const tab = ref('explore');
const tagsRef = ref();

const recentPostsPaginator = markRaw(new Paginator('gallery/posts', {
	limit: 6,
}));
const popularPostsPaginator = markRaw(new Paginator('gallery/featured', {
	noPaging: true,
}));
const myPostsPaginator = markRaw(new Paginator('i/gallery/posts', {
	limit: 5,
}));
const likedPostsPaginator = markRaw(new Paginator('i/gallery/likes', {
	limit: 5,
}));

watch(() => props.tag, () => {
	if (tagsRef.value) tagsRef.value.tags.toggleContent(props.tag == null);
});

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: $locale.value.sfc.create,
	handler: () => {
		router.push('/gallery/new');
	},
}]);

const headerTabs = computed(() => [{
	key: 'explore',
	title: $locale.value.sfc.gallery,
	icon: 'ti ti-icons',
}, {
	key: 'liked',
	title: $locale.value.sfc.liked,
	icon: 'ti ti-heart',
}, {
	key: 'my',
	title: $locale.value.sfc.my,
	icon: 'ti ti-edit',
}]);

definePage(() => ({
	title: $locale.value.sfc.gallery,
	icon: 'ti ti-icons',
}));
</script>

<style lang="scss" module>
.items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: 0 var(--MI-margin);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"recentPosts": "المشاركات الحديثة",
	"popularPosts": "المشاركات المتداولة",
	"postToGallery": "انشر في المعرض",
	"create": "أنشئ",
	"gallery": "المعرض",
	"liked": "المشاركات المُعجب بها",
	"my": "معرضي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"recentPosts": "Articles recents",
	"popularPosts": "Articles populars",
	"postToGallery": "Crear una nova publicació a la galeria",
	"create": "Crear",
	"gallery": "Galeria",
	"liked": "Publicacions que t'han agradat",
	"my": "La meva Galeria "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"recentPosts": "Poslední příspěvky",
	"popularPosts": "Populární příspěvky",
	"postToGallery": "Vytvořit nový příspěvek v galerii",
	"create": "Vytvořit",
	"gallery": "Galerie",
	"liked": "Oblíbené příspěvky",
	"my": "Moje galerie"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"recentPosts": "Recent posts",
	"popularPosts": "Popular posts",
	"postToGallery": "Create new gallery post",
	"create": "Create",
	"gallery": "Gallery",
	"liked": "Liked Posts",
	"my": "My Gallery"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"recentPosts": "Neue Beiträge",
	"popularPosts": "Beliebte Beiträge",
	"postToGallery": "Neuen Galeriebeitrag erstellen",
	"create": "Erstellen",
	"gallery": "Galerie",
	"liked": "Mit \"Gefällt mir\" markierte Beiträge",
	"my": "Meine Galerie"
}
</locale>

<locale locale="en-US" lang="json">
{
	"recentPosts": "Recent posts",
	"popularPosts": "Popular posts",
	"postToGallery": "Create new gallery post",
	"create": "Create",
	"gallery": "Gallery",
	"liked": "Liked Posts",
	"my": "My Gallery"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"recentPosts": "Publicaciones recientes",
	"popularPosts": "Más vistos",
	"postToGallery": "Crear una nueva publicación en la galería",
	"create": "Crear",
	"gallery": "Galería",
	"liked": "Publicaciones que me gustan",
	"my": "Mi galería"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"recentPosts": "Les plus récentes",
	"popularPosts": "Les plus consultées",
	"postToGallery": "Publier dans la galerie",
	"create": "Créer",
	"gallery": "Galerie",
	"liked": " Publications que j'ai aimées",
	"my": "Mes publications"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"recentPosts": "Postingan terbaru",
	"popularPosts": "Postingan populer",
	"postToGallery": "Posting ke galeri",
	"create": "Buat",
	"gallery": "Galeri",
	"liked": "Postingan yang disukai",
	"my": "Postingan saya"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"recentPosts": "Pubblicazioni recenti",
	"popularPosts": "Le più visualizzate",
	"postToGallery": "Pubblicare nella galleria",
	"create": "Crea",
	"gallery": "Gallerie",
	"liked": "Pubblicazioni che mi piacciono",
	"my": "Le mie pubblicazioni"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"recentPosts": "最近の投稿",
	"popularPosts": "人気の投稿",
	"postToGallery": "ギャラリーへ投稿",
	"create": "作成",
	"gallery": "ギャラリー",
	"liked": "いいねした投稿",
	"my": "自分の投稿"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"recentPosts": "最近の投稿",
	"popularPosts": "人気の投稿",
	"postToGallery": "ギャラリーへ投稿",
	"create": "作成",
	"gallery": "ギャラリー",
	"liked": "いいねした投稿",
	"my": "あんたの投稿"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"recentPosts": "Recent posts",
	"popularPosts": "Popular posts",
	"postToGallery": "Create new gallery post",
	"create": "Create",
	"gallery": "Gallery",
	"liked": "Liked Posts",
	"my": "My Gallery"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"recentPosts": "Recent posts",
	"popularPosts": "Popular posts",
	"postToGallery": "Create new gallery post",
	"create": "Create",
	"gallery": "Gallery",
	"liked": "Liked Posts",
	"my": "My Gallery"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"recentPosts": "최근 게시물",
	"popularPosts": "인기 게시물",
	"postToGallery": "갤러리에 업로드",
	"create": "생성",
	"gallery": "갤러리",
	"liked": "좋아요 한 갤러리",
	"my": "내 갤러리"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"recentPosts": "Recente berichten",
	"popularPosts": "Populair berichten",
	"postToGallery": "Nieuw galerijbericht maken",
	"create": "Creëer",
	"gallery": "Galerij",
	"liked": "Liked Posts",
	"my": "My Gallery"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"recentPosts": "Recent posts",
	"popularPosts": "Popular posts",
	"postToGallery": "Create new gallery post",
	"create": "Opprett",
	"gallery": "Galleri",
	"liked": "Liked Posts",
	"my": "My Gallery"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"recentPosts": "Ostatnie wpisy",
	"popularPosts": "Popularne wpisy",
	"postToGallery": "Opublikuj w galerii",
	"create": "Utwórz",
	"gallery": "Galeria",
	"liked": "Polubione wpisy",
	"my": "Moja galeria"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"recentPosts": "Notas recentes",
	"popularPosts": "Notas populares",
	"postToGallery": "Criar publicação em galeria",
	"create": "Criar",
	"gallery": "Galeria",
	"liked": "Postagens curtidas",
	"my": "Minha Galeria"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"recentPosts": "Недавние публикации",
	"popularPosts": "Популярные публикации",
	"postToGallery": "Опубликовать в галерею",
	"create": "Создать",
	"gallery": "Галерея",
	"liked": "Понравившееся",
	"my": "Личная"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"recentPosts": "Najnovšie príspevky",
	"popularPosts": "Populárne príspevky",
	"postToGallery": "Vytvoriť nový príspevok v galérii",
	"create": "Vytvoriť",
	"gallery": "Galéria",
	"liked": "Obľúbené príspevky",
	"my": "Moja galéria"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"recentPosts": "โพสต์ล่าสุด",
	"popularPosts": "โพสต์ติดอันดับ",
	"postToGallery": "สร้างโพสต์แกลเลอรี่ใหม่",
	"create": "สร้าง",
	"gallery": "แกลเลอรี่",
	"liked": "โพสต์ที่ถูกใจ",
	"my": "แกลลอรี่ของฉัน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"recentPosts": "Son gönderiler",
	"popularPosts": "Popüler gönderiler",
	"postToGallery": "Yeni galeri gönderisi oluştur",
	"create": "Oluştur",
	"gallery": "Galeri",
	"liked": "Beğenilen Gönderiler",
	"my": "Benim Galerim"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"recentPosts": "Recent posts",
	"popularPosts": "Popular posts",
	"postToGallery": "Create new gallery post",
	"create": "Create",
	"gallery": "Gallery",
	"liked": "Liked Posts",
	"my": "My Gallery"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"recentPosts": "Нещодавні дописи",
	"popularPosts": "Популярні дописи",
	"postToGallery": "Допис у галерею",
	"create": "Створити",
	"gallery": "Галерея",
	"liked": "Вподобане",
	"my": "Моя галерея"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"recentPosts": "Tút gần đây",
	"popularPosts": "Tút được xem nhiều nhất",
	"postToGallery": "Tạo tút có ảnh",
	"create": "Tạo",
	"gallery": "Thư viện ảnh",
	"liked": "Tút Đã Thích",
	"my": "Kho Ảnh"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"recentPosts": "最新发布",
	"popularPosts": "热门投稿",
	"postToGallery": "发布相册",
	"create": "创建",
	"gallery": "相册",
	"liked": "喜欢的相册",
	"my": "我的相册"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"recentPosts": "最新貼文",
	"popularPosts": "熱門的貼文",
	"postToGallery": "發佈到相簿",
	"create": "新增",
	"gallery": "相簿",
	"liked": "喜歡的貼文",
	"my": "我的貼文"
}
</locale>
