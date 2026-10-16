<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div class="_root">
			<Transition :name="prefer.s.animation ? 'fade' : ''" mode="out-in">
				<div v-if="post" class="rkxwuolj">
					<div class="files">
						<div v-for="file in post.files" :key="file.id" class="file">
							<img :src="file.url"/>
						</div>
					</div>
					<div class="body">
						<div class="title">{{ post.title }}</div>
						<div class="description"><Mfm v-if="post.description != null" :text="post.description"/></div>
						<div class="info">
							<i class="ti ti-clock"></i> <MkTime :time="post.createdAt" mode="detail"/>
						</div>
						<div class="actions">
							<div class="like">
								<MkButton v-if="post.isLiked" v-tooltip="$locale.sfc.unlike" class="button" primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="post.likedCount > 0" class="count">{{ post.likedCount }}</span></MkButton>
								<MkButton v-else v-tooltip="$locale.sfc.like" class="button" @click="like()"><i class="ti ti-heart"></i><span v-if="post.likedCount > 0" class="count">{{ post.likedCount }}</span></MkButton>
							</div>
							<div class="other">
								<button v-if="$i && $i.id === post.user.id" v-tooltip="globalLocale.env.edit" v-click-anime class="_button" @click="edit"><i class="ti ti-pencil ti-fw"></i></button>
								<button v-tooltip="$locale.sfc.shareWithNote" v-click-anime class="_button" @click="shareWithNote"><i class="ti ti-repeat ti-fw"></i></button>
								<button v-tooltip="$locale.sfc.copyLink" v-click-anime class="_button" @click="copyLink"><i class="ti ti-link ti-fw"></i></button>
								<button v-if="isSupportShare()" v-tooltip="$locale.sfc.share" v-click-anime class="_button" @click="share"><i class="ti ti-share ti-fw"></i></button>
								<button v-if="$i && $i.id !== post.user.id" v-click-anime class="_button" @click="showMenu"><i class="ti ti-dots ti-fw"></i></button>
							</div>
						</div>
						<div class="user">
							<MkAvatar :user="post.user" class="avatar" link preview/>
							<div class="name">
								<MkUserName :user="post.user" style="display: block;"/>
								<MkAcct :user="post.user"/>
							</div>
							<!--<MkFollowButton v-if="!$i || $i.id != post.user.id" v-model:user="post.user" :inline="true" :transparent="false" :full="true" large class="koudoku"/>-->
						</div>
					</div>
					<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
					<MkContainer :max-height="300" :foldable="true" class="other">
						<template #icon><i class="ti ti-clock"></i></template>
						<template #header>{{ $locale.sfc.recentPosts }}</template>
						<MkPagination v-slot="{items}" :paginator="otherPostsPaginator">
							<div class="sdrarzaf">
								<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
							</div>
						</MkPagination>
					</MkContainer>
				</div>
				<MkError v-else-if="error" @retry="fetchPost()"/>
				<MkLoading v-else/>
			</Transition>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import type { GlobalLocale } from '@features/runtime/frontend/shared/global-locale.js';
import { computed, watch, ref, defineAsyncComponent, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@features/boot/frontend/shared/config.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkGalleryPostPreview from '@features/collections/frontend/components/MkGalleryPostPreview.vue';
import MkFollowButton from '@features/relationships/frontend/components/MkFollowButton.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { $i } from '@features/auth/frontend/i.js';
import { isSupportShare } from '@features/navigation/frontend/utility/navigator.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const globalLocale = useLocale<GlobalLocale>(import.meta.url);

const router = useRouter();

const props = defineProps<{
	postId: string;
}>();

const post = ref<Misskey.entities.GalleryPost | null>(null);
const error = ref<any>(null);
const otherPostsPaginator = markRaw(new Paginator('users/gallery/posts', {
	limit: 6,
	computedParams: computed(() => ({
		userId: post.value!.user.id,
	})),
}));

function fetchPost() {
	post.value = null;
	misskeyApi('gallery/posts/show', {
		postId: props.postId,
	}).then(_post => {
		post.value = _post;
	}).catch(_error => {
		error.value = _error;
	});
}

function copyLink() {
	if (!post.value) return;
	copyToClipboard(`${url}/gallery/${post.value.id}`);
}

function share() {
	if (!post.value) return;
	navigator.share({
		title: post.value.title,
		text: post.value.description ?? undefined,
		url: `${url}/gallery/${post.value.id}`,
	});
}

function shareWithNote() {
	if (!post.value) return;
	os.post({
		initialText: `${post.value.title} ${url}/gallery/${post.value.id}`,
		instant: true,
	});
}

function like() {
	if (!post.value) return;
	os.apiWithDialog('gallery/posts/like', {
		postId: props.postId,
	}).then(() => {
		post.value!.isLiked = true;
		post.value!.likedCount++;
	});
}

async function unlike() {
	if (!post.value) return;
	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('gallery/posts/unlike', {
		postId: props.postId,
	}).then(() => {
		post.value!.isLiked = false;
		post.value!.likedCount--;
	});
}

function edit() {
	router.push('/gallery/:postId/edit', {
		params: {
			postId: props.postId,
		},
	});
}

async function reportAbuse() {
	if (!post.value) return;

	const pageUrl = `${url}/gallery/${post.value.id}`;

	const { dispose } = await os.popupAsyncWithDialog(import('@features/moderation/frontend/components/MkAbuseReportWindow.vue').then(x => x.default), {
		user: post.value.user,
		initialComment: `Post: ${pageUrl}\n-----\n`,
	}, {
		closed: () => dispose(),
	});
}

function showMenu(ev: PointerEvent) {
	if (!post.value) return;

	const menuItems: MenuItem[] = [];

	if ($i && $i.id !== post.value.userId) {
		menuItems.push({
			icon: 'ti ti-exclamation-circle',
			text: $locale.value.sfc.reportAbuse,
			action: reportAbuse,
		});

		if ($i.isModerator || $i.isAdmin) {
			menuItems.push({
				type: 'divider',
			}, {
				icon: 'ti ti-trash',
				text: globalLocale.value.env.delete,
				danger: true,
				action: () => os.confirm({
					type: 'warning',
					text: $locale.value.sfc.deleteConfirm,
				}).then(({ canceled }) => {
					if (canceled || !post.value) return;

					os.apiWithDialog('gallery/posts/delete', { postId: post.value.id });
				}),
			});
		}
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

watch(() => props.postId, fetchPost, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: post.value ? post.value.title : $locale.value.sfc.gallery,
	...post.value ? {
		avatar: post.value.user,
	} : {},
}));
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.rkxwuolj {
	> .files {
		> .file {
			> img {
				display: block;
				max-width: 100%;
				max-height: 500px;
				margin: 0 auto;
			}

			& + .file {
				margin-top: 16px;
			}
		}
	}

	> .body {
		padding: 32px;

		> .title {
			font-weight: bold;
			font-size: 1.2em;
			margin-bottom: 16px;
		}

		> .info {
			margin-top: 16px;
			font-size: 90%;
			opacity: 0.7;
		}

		> .actions {
			display: flex;
			align-items: center;
			margin-top: 16px;
			padding: 16px 0 0 0;
			border-top: solid 0.5px var(--MI_THEME-divider);

			> .like {
				> .button {
					--MI_THEME-accent: rgb(241 97 132);
					--MI_THEME-X8: rgb(241 92 128);
					--MI_THEME-buttonBg: rgb(216 71 106 / 5%);
					--MI_THEME-buttonHoverBg: rgb(216 71 106 / 10%);
					color: #ff002f;

					::v-deep(.count) {
						margin-left: 0.5em;
					}
				}
			}

			> .other {
				margin-left: auto;

				> button {
					padding: 8px;
					margin: 0 8px;

					&:hover {
						color: var(--MI_THEME-fgHighlighted);
					}
				}
			}
		}

		> .user {
			margin-top: 16px;
			padding: 16px 0 0 0;
			border-top: solid 0.5px var(--MI_THEME-divider);
			display: flex;
			align-items: center;
			flex-wrap: wrap;

			> .avatar {
				width: 52px;
				height: 52px;
			}

			> .name {
				margin: 0 0 0 12px;
				font-size: 90%;
			}

			> .koudoku {
				margin-left: auto;
			}
		}
	}
}

.sdrarzaf {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: var(--MI-margin);

	> .post {

	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"unlikeConfirm": "أتريد إلغاء إعجابك؟",
	"reportAbuse": "أبلغ",
	"deleteConfirm": "أمتأكد من الحذف؟",
	"gallery": "المعرض",
	"unlike": "أزل الإعجاب",
	"like": "أعجبني",
	"shareWithNote": "شاركه في ملاحظة",
	"copyLink": "انسخ الرابط",
	"share": "شارِك",
	"recentPosts": "المشاركات الحديثة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"unlikeConfirm": "Vols esborrar el teu m'agrada?",
	"reportAbuse": "Denuncia un abús ",
	"deleteConfirm": "Segur que vols esborrar?",
	"gallery": "Galeria",
	"unlike": "Ja no m'agrada",
	"like": "M'agrada ",
	"shareWithNote": "Comparteix amb una nota",
	"copyLink": "Copia l'enllaç",
	"share": "Comparteix",
	"recentPosts": "Articles recents"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"unlikeConfirm": "Opravdu chcete odstranit like?",
	"reportAbuse": "Nahlášení",
	"deleteConfirm": "Opravdu smazat?",
	"gallery": "Galerie",
	"unlike": "Už se mi to nelíbí",
	"like": "To se mi líbí",
	"shareWithNote": "Sdílet s poznámkou",
	"copyLink": "Kopírovat odkaz",
	"share": "Sdílet",
	"recentPosts": "Poslední příspěvky"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"deleteConfirm": "Really delete?",
	"gallery": "Gallery",
	"unlike": "Remove like",
	"like": "Like",
	"shareWithNote": "Share with note",
	"copyLink": "Copy link",
	"share": "Share",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"unlikeConfirm": "\"Gefällt mir\" wirklich entfernen?",
	"reportAbuse": "Melden",
	"deleteConfirm": "Wirklich löschen?",
	"gallery": "Galerie",
	"unlike": "\"Gefällt mir\" entfernen",
	"like": "Gefällt mir",
	"shareWithNote": "Mit Notiz teilen",
	"copyLink": "Link kopieren",
	"share": "Teilen",
	"recentPosts": "Neue Beiträge"
}
</locale>

<locale locale="en-US" lang="json">
{
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"deleteConfirm": "Really delete?",
	"gallery": "Gallery",
	"unlike": "Remove like",
	"like": "Like",
	"shareWithNote": "Share with note",
	"copyLink": "Copy link",
	"share": "Share",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"unlikeConfirm": "¿Quitar como favorito?",
	"reportAbuse": "Reportar",
	"deleteConfirm": "¿Desea eliminarlo?",
	"gallery": "Galería",
	"unlike": "Quitar me gusta",
	"like": "¡Muy bien!",
	"shareWithNote": "Compartir con una nota",
	"copyLink": "Copiar enlace",
	"share": "Compartir",
	"recentPosts": "Publicaciones recientes"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"unlikeConfirm": "Êtes-vous sûr·e de ne plus vouloir aimer cette publication ?",
	"reportAbuse": "Signaler",
	"deleteConfirm": "Confirmez-vous la suppression?",
	"gallery": "Galerie",
	"unlike": "Je n’aime pas",
	"like": "J'aime",
	"shareWithNote": "Partager dans une note",
	"copyLink": "Copier le lien",
	"share": "Partager",
	"recentPosts": "Les plus récentes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"unlikeConfirm": "Yakin ingin hapus sukamu?",
	"reportAbuse": "Laporkan",
	"deleteConfirm": "Yakin hapus?",
	"gallery": "Galeri",
	"unlike": "Hapus suka",
	"like": "Suka",
	"shareWithNote": "Bagikan dengan catatan",
	"copyLink": "Salin tautan",
	"share": "Bagikan",
	"recentPosts": "Postingan terbaru"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"unlikeConfirm": "Non ti piace più?",
	"reportAbuse": "Segnalare",
	"deleteConfirm": "Rimuovere?",
	"gallery": "Gallerie",
	"unlike": "Non mi piace più",
	"like": "Mi piace!",
	"shareWithNote": "Condividere in nota",
	"copyLink": "Copia il link",
	"share": "Condividi",
	"recentPosts": "Pubblicazioni recenti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"unlikeConfirm": "いいね解除しますか？",
	"reportAbuse": "通報",
	"deleteConfirm": "削除しますか？",
	"gallery": "ギャラリー",
	"unlike": "いいね解除",
	"like": "いいね！",
	"shareWithNote": "ノートで共有",
	"copyLink": "リンクをコピー",
	"share": "共有",
	"recentPosts": "最近の投稿"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"unlikeConfirm": "いいね解除するんか？",
	"reportAbuse": "通報",
	"deleteConfirm": "ホンマにほかすで？",
	"gallery": "ギャラリー",
	"unlike": "良くないわ",
	"like": "ええやん！",
	"shareWithNote": "ノートで共有",
	"copyLink": "リンクをコピー",
	"share": "わけわけ",
	"recentPosts": "最近の投稿"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"deleteConfirm": "Really delete?",
	"gallery": "Gallery",
	"unlike": "Remove like",
	"like": "Like",
	"shareWithNote": "Share with note",
	"copyLink": "Copy link",
	"share": "Share",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"deleteConfirm": "Really delete?",
	"gallery": "Gallery",
	"unlike": "Remove like",
	"like": "Like",
	"shareWithNote": "Share with note",
	"copyLink": "ಲಿಂಕನ್ನು ನಕಲಿಸು",
	"share": "Share",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"unlikeConfirm": "좋아요를 취소할까요?",
	"reportAbuse": "신고",
	"deleteConfirm": "삭제하시겠습니까?",
	"gallery": "갤러리",
	"unlike": "좋아요 취소",
	"like": "좋아요!",
	"shareWithNote": "노트로 공유",
	"copyLink": "링크 복사",
	"share": "공유",
	"recentPosts": "최근 게시물"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"unlikeConfirm": "Wil je echt je like verwijderen?",
	"reportAbuse": "Meld",
	"deleteConfirm": "Echt verwijderen?",
	"gallery": "Galerij",
	"unlike": "Remove like",
	"like": "Like",
	"shareWithNote": "Delen met notitie",
	"copyLink": "Kopiëren link",
	"share": "Delen",
	"recentPosts": "Recente berichten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Rappoter",
	"deleteConfirm": "Vil du slette?",
	"gallery": "Galleri",
	"unlike": "Liker ikke",
	"like": "Liker!",
	"shareWithNote": "Share with note",
	"copyLink": "Kopier lenke",
	"share": "Del",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"unlikeConfirm": "Na pewno chcesz usunąć\u00a0polubienie?",
	"reportAbuse": "Zgłoś",
	"deleteConfirm": "Na pewno usunąć?",
	"gallery": "Galeria",
	"unlike": "Cofnij polubienie",
	"like": "Polub",
	"shareWithNote": "Udostępnij z wpisem",
	"copyLink": "Skopiuj odnośnik",
	"share": "Udostępnij",
	"recentPosts": "Ostatnie wpisy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"unlikeConfirm": "Deseja realmente deixar de curtir?",
	"reportAbuse": "Denunciar",
	"deleteConfirm": "Confirma a exclusão?",
	"gallery": "Galeria",
	"unlike": "Remover curtida",
	"like": "Curtir",
	"shareWithNote": "Compartilhar em Notas",
	"copyLink": "Copiar link",
	"share": "Compartilhar",
	"recentPosts": "Notas recentes"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"unlikeConfirm": "В самом деле убрать «нравится»?",
	"reportAbuse": "Жалоба",
	"deleteConfirm": "Удалить?",
	"gallery": "Галерея",
	"unlike": "Отменить «нравится»",
	"like": "Нравится!",
	"shareWithNote": "Поделиться заметкой",
	"copyLink": "Скопировать ссылку",
	"share": "Поделиться",
	"recentPosts": "Недавние публикации"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"unlikeConfirm": "Naozaj odstrániť váš like?",
	"reportAbuse": "Nahlásiť",
	"deleteConfirm": "Naozaj odstrániť?",
	"gallery": "Galéria",
	"unlike": "Nepáči sa mi",
	"like": "Páči sa mi",
	"shareWithNote": "Zdieľať s poznámkou",
	"copyLink": "Kopírovať odkaz",
	"share": "Zdieľať",
	"recentPosts": "Najnovšie príspevky"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"unlikeConfirm": "ต้องการเลิกถูกใจใช่ไหม?",
	"reportAbuse": "รายงาน",
	"deleteConfirm": "ต้องการลบใช่ไหม?",
	"gallery": "แกลเลอรี่",
	"unlike": "เลิกถูกใจ",
	"like": "ถูกใจ!",
	"shareWithNote": "แบ่งปันด้วยโน้ต",
	"copyLink": "คัดลอกลิงก์",
	"share": "แบ่งปัน",
	"recentPosts": "โพสต์ล่าสุด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"unlikeConfirm": "Cidden beğenini kaldırmak mı istiyorsun?",
	"reportAbuse": "Rapor",
	"deleteConfirm": "Cidden silmek istiyor musunuz?",
	"gallery": "Galeri",
	"unlike": "Benzerlerini kaldır",
	"like": "Beğen",
	"shareWithNote": "Notla paylaş",
	"copyLink": "Link kopyala",
	"share": "Paylaş",
	"recentPosts": "Son gönderiler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"unlikeConfirm": "Really remove your like?",
	"reportAbuse": "Report",
	"deleteConfirm": "Really delete?",
	"gallery": "Gallery",
	"unlike": "Remove like",
	"like": "Like",
	"shareWithNote": "Share with note",
	"copyLink": "Copy link",
	"share": "Share",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"unlikeConfirm": "Бажаєте відписатися від подібних?",
	"reportAbuse": "Поскаржитись",
	"deleteConfirm": "Ви дійсно бажаєте це видалити?",
	"gallery": "Галерея",
	"unlike": "Не вподобати",
	"like": "Вподобати",
	"shareWithNote": "Поділитися нотаткою",
	"copyLink": "Скопіювати посилання",
	"share": "Поділитись",
	"recentPosts": "Нещодавні дописи"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"unlikeConfirm": "Bạn có chắc muốn bỏ thích ?",
	"reportAbuse": "Báo cáo",
	"deleteConfirm": "Bạn có muốn xóa không?",
	"gallery": "Thư viện ảnh",
	"unlike": "Bỏ thích",
	"like": "Thích",
	"shareWithNote": "Chia sẻ kèm với tút",
	"copyLink": "Chép liên kết",
	"share": "Chia sẻ",
	"recentPosts": "Tút gần đây"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"unlikeConfirm": "取消赞？",
	"reportAbuse": "举报",
	"deleteConfirm": "确定删除?",
	"gallery": "相册",
	"unlike": "取消喜欢",
	"like": "喜欢！",
	"shareWithNote": "分享到帖文",
	"copyLink": "复制链接",
	"share": "分享",
	"recentPosts": "最新发布"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"unlikeConfirm": "要取消按讚嗎？",
	"reportAbuse": "檢舉",
	"deleteConfirm": "你確定要刪除嗎？",
	"gallery": "相簿",
	"unlike": "收回讚好",
	"like": "讚好",
	"shareWithNote": "在貼文中分享",
	"copyLink": "複製連結",
	"share": "分享",
	"recentPosts": "最新貼文"
}
</locale>
