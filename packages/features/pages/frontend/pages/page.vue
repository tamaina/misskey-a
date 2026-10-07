<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<Transition
			:enterActiveClass="prefer.s.animation ? $style.fadeEnterActive : ''"
			:leaveActiveClass="prefer.s.animation ? $style.fadeLeaveActive : ''"
			:enterFromClass="prefer.s.animation ? $style.fadeEnterFrom : ''"
			:leaveToClass="prefer.s.animation ? $style.fadeLeaveTo : ''"
			mode="out-in"
		>
			<div v-if="page" :key="page.id" class="_gaps">
				<div :class="$style.pageMain">
					<div :class="$style.pageBanner">
						<div :class="$style.pageBannerBgRoot">
							<MkImgWithBlurhash
								v-if="page.eyeCatchingImageId"
								:class="$style.pageBannerBg"
								:hash="page.eyeCatchingImage?.blurhash"
								:cover="true"
								:forceBlurhash="true"
							/>
							<img
								v-else-if="instance.backgroundImageUrl || instance.bannerUrl"
								:class="[$style.pageBannerBg, $style.pageBannerBgFallback1]"
								:src="getStaticImageUrl(instance.backgroundImageUrl ?? instance.bannerUrl!)"
							/>
							<div v-else :class="[$style.pageBannerBg, $style.pageBannerBgFallback2]"></div>
						</div>
						<div v-if="page.eyeCatchingImageId" :class="$style.pageBannerImage">
							<MkMediaImage
								:image="page.eyeCatchingImage!"
								:cover="true"
								:disableImageLink="true"
								:class="$style.thumbnail"
							/>
						</div>
						<div :class="$style.pageBannerTitle" class="_gaps_s">
							<h1>{{ page.title || page.name }}</h1>
							<div :class="$style.pageBannerTitleSub">
								<div v-if="page.user" :class="$style.pageBannerTitleUser">
									<MkAvatar :user="page.user" :class="$style.avatar" indicator link preview/> <MkA :to="`/@${username}`"><MkUserName :user="page.user" :nowrap="false"/></MkA>
								</div>
								<div :class="$style.pageBannerTitleSubActions">
									<MkA v-if="page.userId === $i?.id" v-tooltip="$locale.sfc.editThisPage" :to="`/pages/edit/${page.id}`" class="_button" :class="$style.generalActionButton"><i class="ti ti-pencil ti-fw"></i></MkA>
									<button v-tooltip="$locale.sfc.share" class="_button" :class="$style.generalActionButton" @click="share"><i class="ti ti-share ti-fw"></i></button>
								</div>
							</div>
						</div>
					</div>
					<div :class="$style.pageContent">
						<XPage :page="page"/>
					</div>
					<div :class="$style.pageActions">
						<div>
							<MkButton v-if="page.isLiked" v-tooltip="$locale.sfc.unlike" class="button" asLike primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="page.likedCount > 0" class="count">{{ page.likedCount }}</span></MkButton>
							<MkButton v-else v-tooltip="$locale.sfc.like" class="button" asLike @click="like()"><i class="ti ti-heart"></i><span v-if="page.likedCount > 0" class="count">{{ page.likedCount }}</span></MkButton>
						</div>
						<div :class="$style.other">
							<MkA v-if="page.userId === $i?.id" v-tooltip="$locale.sfc.editThisPage" :to="`/pages/edit/${page.id}`" class="_button" :class="$style.generalActionButton"><i class="ti ti-pencil ti-fw"></i></MkA>
							<button v-tooltip="$locale.sfc.copyLink" class="_button" :class="$style.generalActionButton" @click="copyLink"><i class="ti ti-link ti-fw"></i></button>
							<button v-tooltip="$locale.sfc.share" class="_button" :class="$style.generalActionButton" @click="share"><i class="ti ti-share ti-fw"></i></button>
							<button v-if="$i" v-click-anime class="_button" :class="$style.generalActionButton" @click="showMenu"><i class="ti ti-dots ti-fw"></i></button>
						</div>
					</div>
					<div :class="$style.pageUser">
						<MkAvatar :user="page.user" :class="$style.avatar" link preview/>
						<MkA :to="`/@${username}`">
							<MkUserName :user="page.user" :class="$style.name"/>
							<MkAcct :user="page.user" :class="$style.acct"/>
						</MkA>
						<!--<MkFollowButton v-if="!$i || $i.id != page.user.id" :user="page.user!" :inline="true" :transparent="false" :full="true" :class="$style.follow"/>-->
					</div>
					<div :class="$style.pageDate">
						<div><i class="ti ti-clock"></i> {{ $locale.sfc.createdAt }}: <MkTime :time="page.createdAt" mode="detail"/></div>
						<div v-if="page.createdAt != page.updatedAt"><i class="ti ti-clock-edit"></i> {{ $locale.sfc.updatedAt }}: <MkTime :time="page.updatedAt" mode="detail"/></div>
					</div>
				</div>
				<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
				<MkContainer :max-height="300" :foldable="true" class="other">
					<template #icon><i class="ti ti-clock"></i></template>
					<template #header>{{ $locale.sfc.recentPosts }}</template>
					<MkPagination v-slot="{items}" :paginator="otherPostsPaginator" :class="$style.relatedPagesRoot" class="_gaps">
						<MkPagePreview v-for="page in items" :key="page.id" :page="page" :class="$style.relatedPagesItem"/>
					</MkPagination>
				</MkContainer>
			</div>
			<MkError v-else-if="error" @retry="fetchPage()"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, defineAsyncComponent, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@@/js/config.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import XPage from '@features/pages/frontend/components/page/page.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkMediaImage from '@features/media/frontend/components/MkMediaImage.vue';
import MkImgWithBlurhash from '@features/media/frontend/components/MkImgWithBlurhash.vue';
import MkFollowButton from '@features/relationships/frontend/components/MkFollowButton.vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkPagePreview from '@features/pages/frontend/components/MkPagePreview.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import { $i } from '@features/auth/frontend/i.js';
import { isSupportShare } from '@features/navigation/frontend/utility/navigator.js';
import { instance } from '@features/instance/frontend/instance.js';
import { getStaticImageUrl } from '@features/media/frontend/utility/media-proxy.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { getPluginHandlers } from '@features/integrations/frontend/plugin.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const router = useRouter();

const props = defineProps<{
	pageName: string;
	username: string;
}>();

const page = ref<Misskey.entities.Page | null>(null);
const error = ref<any>(null);
const otherPostsPaginator = markRaw(new Paginator('users/pages', {
	limit: 6,
	computedParams: computed(() => page.value ? ({
		userId: page.value.user.id,
	}) : undefined),
}));
const path = computed(() => props.username + '/' + props.pageName);

function fetchPage() {
	page.value = null;
	misskeyApi('pages/show', {
		name: props.pageName,
		username: props.username,
	}).then(async _page => {
		page.value = _page;

		// plugin
		const pageViewInterruptors = getPluginHandlers('page_view_interruptor');
		if (pageViewInterruptors.length > 0) {
			let result: Misskey.entities.Page = deepClone(_page);
			for (const interruptor of pageViewInterruptors) {
				result = await interruptor.handler(result);
			}
			page.value = result;
		}
	}).catch(err => {
		error.value = err;
	});
}

function share(ev: PointerEvent) {
	if (!page.value) return;

	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: $locale.value.sfc.shareWithNote,
		icon: 'ti ti-pencil',
		action: shareWithNote,
	});

	if (isSupportShare()) {
		menuItems.push({
			text: $locale.value.sfc.share,
			icon: 'ti ti-share',
			action: shareWithNavigator,
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

function copyLink() {
	if (!page.value) return;

	copyToClipboard(`${url}/@${page.value.user.username}/pages/${page.value.name}`);
}

function shareWithNote() {
	if (!page.value) return;

	os.post({
		initialText: `${page.value.title || page.value.name}\n${url}/@${page.value.user.username}/pages/${page.value.name}`,
		instant: true,
	});
}

function shareWithNavigator() {
	if (!page.value) return;

	navigator.share({
		title: page.value.title ?? page.value.name,
		text: page.value.summary ?? undefined,
		url: `${url}/@${page.value.user.username}/pages/${page.value.name}`,
	});
}

function like() {
	if (!page.value) return;

	os.apiWithDialog('pages/like', {
		pageId: page.value.id,
	}).then(() => {
		page.value!.isLiked = true;
		page.value!.likedCount++;
	});
}

async function unlike() {
	if (!page.value) return;

	const confirm = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('pages/unlike', {
		pageId: page.value.id,
	}).then(() => {
		page.value!.isLiked = false;
		page.value!.likedCount--;
	});
}

function pin(pin: boolean) {
	if (!page.value) return;

	os.apiWithDialog('i/update', {
		pinnedPageId: pin ? page.value.id : null,
	});
}

async function reportAbuse() {
	if (!page.value) return;

	const pageUrl = `${url}/@${props.username}/pages/${props.pageName}`;

	const { dispose } = await os.popupAsyncWithDialog(import('@features/moderation/frontend/components/MkAbuseReportWindow.vue').then(x => x.default), {
		user: page.value.user,
		initialComment: `Page: ${pageUrl}\n-----\n`,
	}, {
		closed: () => dispose(),
	});
}

function showMenu(ev: PointerEvent) {
	if (!page.value) return;

	const menuItems: MenuItem[] = [];

	if ($i && $i.id === page.value.userId) {
		menuItems.push({
			icon: 'ti ti-pencil',
			text: $locale.value.sfc.edit,
			action: () => router.push('/pages/edit/:initPageId', {
				params: {
					initPageId: page.value!.id,
				},
			}),
		});

		if ($i.pinnedPageId === page.value.id) {
			menuItems.push({
				icon: 'ti ti-pinned-off',
				text: $locale.value.sfc.unpin,
				action: () => pin(false),
			});
		} else {
			menuItems.push({
				icon: 'ti ti-pin',
				text: $locale.value.sfc.pin,
				action: () => pin(true),
			});
		}
	} else if ($i && $i.id !== page.value.userId) {
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
				text: $locale.value.sfc.delete,
				danger: true,
				action: () => os.confirm({
					type: 'warning',
					text: $locale.value.sfc.deleteConfirm,
				}).then(({ canceled }) => {
					if (canceled || !page.value) return;

					os.apiWithDialog('pages/delete', { pageId: page.value.id });
				}),
			});
		}
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

watch(() => path.value, fetchPage, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: page.value ? page.value.title || page.value.name : $locale.value.sfc.pages,
	...page.value ? {
		avatar: page.value.user,
		path: `/@${page.value.user.username}/pages/${page.value.name}`,
		share: {
			title: page.value.title || page.value.name,
			text: page.value.summary,
		},
	} : {},
}));
</script>

<style lang="scss" module>
.fadeEnterActive,
.fadeLeaveActive {
	transition: opacity 0.125s ease;
}
.fadeEnterFrom,
.fadeLeaveTo {
	opacity: 0;
}

.generalActionButton {
	height: 2.5rem;
	width: 2.5rem;
	text-align: center;
	border-radius: 99rem;

	& :global(.ti) {
		line-height: 2.5rem;
	}

	&:hover,
	&:focus-visible {
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
		text-decoration: none;
		outline: none;
	}
}

.pageMain {
	border-radius: var(--MI-radius);
	padding: 2rem;
	background: var(--MI_THEME-panel);
	box-sizing: border-box;
}

.pageBanner {
	width: calc(100% + 4rem);
	margin: -2rem -2rem 1.5rem;
	border-radius: var(--MI-radius) var(--MI-radius) 0 0;
	overflow: hidden;
	position: relative;

	> .pageBannerBgRoot {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;

		.pageBannerBg {
			width: 100%;
			height: 100%;
			object-fit: cover;
			opacity: .2;
			filter: brightness(1.2);
		}

		.pageBannerBgFallback1 {
			filter: blur(20px);
		}

		.pageBannerBgFallback2 {
			background-color: var(--MI_THEME-accentedBg);
		}

		&::after {
			content: '';
			position: absolute;
			left: 0;
			bottom: 0;
			width: 100%;
			height: 100px;
			background: linear-gradient(0deg, var(--MI_THEME-panel), transparent);
		}
	}

	> .pageBannerImage {
		position: relative;
		padding-top: 56.25%;

		> .thumbnail {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}
	}

	> .pageBannerTitle {
		position: relative;
		padding: 1.5rem 2rem;

		h1 {
			font-size: 2rem;
			font-weight: 700;
			color: var(--MI_THEME-fg);
			margin: 0;
		}

		.pageBannerTitleSub {
			display: flex;
			align-items: center;
			width: 100%;
		}

		.pageBannerTitleUser {
			--height: 32px;
			flex-shrink: 0;
			line-height: var(--height);

			.avatar {
				height: var(--height);
				width: var(--height);
			}
		}

		.pageBannerTitleSubActions {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			gap: var(--MI-marginHalf);
			margin-left: auto;
		}
	}
}

.pageContent {
	contain: content;
	margin-bottom: 1.5rem;
}

.pageActions {
	display: flex;
	align-items: center;

	border-top: 1px solid var(--MI_THEME-divider);
	padding-top: 1.5rem;
	margin-bottom: 1.5rem;

	> .other {
		margin-left: auto;
		display: flex;
		gap: var(--MI-marginHalf);
	}
}

.pageUser {
	display: flex;
	align-items: center;

	border-top: 1px solid var(--MI_THEME-divider);
	padding-top: 1.5rem;
	margin-bottom: 1.5rem;

	.avatar,
	.name,
	.acct {
		display: block;
	}

	.avatar {
		width: 4rem;
		height: 4rem;
		margin-right: 1rem;
	}

	.name {
		font-size: 110%;
		font-weight: 700;
	}

	.acct {
		font-size: 90%;
		opacity: 0.7;
	}

	.follow {
		margin-left: auto;
	}
}

.pageDate {
	margin-bottom: 1.5rem;
}

.pageLinks {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: var(--MI-marginHalf);
}

.relatedPagesRoot {
	padding: var(--MI-margin);
}

.relatedPagesItem > article {
	background-color: var(--MI_THEME-panelHighlight) !important;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"shareWithNote": "شاركه في ملاحظة",
	"share": "شارِك",
	"unlikeConfirm": "أتريد إلغاء إعجابك؟",
	"edit": "التعديل",
	"unpin": "فكها من ملفك الشخصي",
	"pin": "ثبتها على الصفحة الشخصية",
	"reportAbuse": "أبلغ",
	"delete": "حذف",
	"deleteConfirm": "أمتأكد من الحذف؟",
	"pages": "الصفحات",
	"editThisPage": "عدّل هذه الصفحة",
	"unlike": "أزل الإعجاب",
	"like": "أعجبني",
	"copyLink": "انسخ الرابط",
	"createdAt": "أُنشئ في",
	"updatedAt": "حُدّث في",
	"recentPosts": "المشاركات الحديثة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"shareWithNote": "Comparteix amb una nota",
	"share": "Comparteix",
	"unlikeConfirm": "Vols esborrar el teu m'agrada?",
	"edit": "Editar",
	"unpin": "Para de fixar del perfil",
	"pin": "Fixa al perfil",
	"reportAbuse": "Denuncia un abús ",
	"delete": "Elimina",
	"deleteConfirm": "Segur que vols esborrar?",
	"pages": "Pàgines",
	"editThisPage": "Editar la pàgina",
	"unlike": "Treure m'agrada ",
	"like": "M'agrada ",
	"copyLink": "Copia l'enllaç",
	"createdAt": "Creat el",
	"updatedAt": "Actualitzat el",
	"recentPosts": "Articles recents"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"shareWithNote": "Sdílet s poznámkou",
	"share": "Sdílet",
	"unlikeConfirm": "Opravdu chcete odstranit like?",
	"edit": "Upravit",
	"unpin": "Odepnout",
	"pin": "Připnout",
	"reportAbuse": "Nahlášení",
	"delete": "Smazat",
	"deleteConfirm": "Opravdu smazat?",
	"pages": "Stránky",
	"editThisPage": "Upravit tuto stránku",
	"unlike": "Už se mi to nelíbí",
	"like": "To se mi líbí",
	"copyLink": "Kopírovat odkaz",
	"createdAt": "Vytvořeno",
	"updatedAt": "Upraveno",
	"recentPosts": "Poslední příspěvky"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"edit": "Edit",
	"unpin": "Unpin from profile",
	"pin": "Pin to profile",
	"reportAbuse": "Report",
	"delete": "Delete",
	"deleteConfirm": "Really delete?",
	"pages": "Pages",
	"editThisPage": "Edit this Page",
	"unlike": "Remove like",
	"like": "Like",
	"copyLink": "Copy link",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"shareWithNote": "Mit Notiz teilen",
	"share": "Teilen",
	"unlikeConfirm": "\"Gefällt mir\" wirklich entfernen?",
	"edit": "Bearbeiten",
	"unpin": "Von deinem Profil lösen",
	"pin": "An dein Profil anheften",
	"reportAbuse": "Melden",
	"delete": "Löschen",
	"deleteConfirm": "Wirklich löschen?",
	"pages": "Seiten",
	"editThisPage": "Diese Seite bearbeiten",
	"unlike": "\"Gefällt mir\" entfernen",
	"like": "Gefällt mir",
	"copyLink": "Link kopieren",
	"createdAt": "Erstellt am",
	"updatedAt": "Zuletzt geändert am",
	"recentPosts": "Neue Beiträge"
}
</locale>

<locale locale="en-US" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"edit": "Edit",
	"unpin": "Unpin from profile",
	"pin": "Pin to profile",
	"reportAbuse": "Report",
	"delete": "Delete",
	"deleteConfirm": "Really delete?",
	"pages": "Pages",
	"editThisPage": "Edit this Page",
	"unlike": "Remove like",
	"like": "Like",
	"copyLink": "Copy link",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"shareWithNote": "Compartir con una nota",
	"share": "Compartir",
	"unlikeConfirm": "¿Quitar como favorito?",
	"edit": "Editar",
	"unpin": "Desfijar",
	"pin": "Fijar al perfil",
	"reportAbuse": "Reportar",
	"delete": "Borrar",
	"deleteConfirm": "¿Desea eliminarlo?",
	"pages": "Páginas",
	"editThisPage": "Editar esta página",
	"unlike": "Quitar me gusta",
	"like": "Me gusta",
	"copyLink": "Copiar enlace",
	"createdAt": "Fecha de creación",
	"updatedAt": "Actualizado",
	"recentPosts": "Publicaciones recientes"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"shareWithNote": "Partager dans une note",
	"share": "Partager",
	"unlikeConfirm": "Êtes-vous sûr·e de ne plus vouloir aimer cette publication ?",
	"edit": "Editer",
	"unpin": "Désépingler",
	"pin": "Épingler sur le profil",
	"reportAbuse": "Signaler",
	"delete": "Supprimer",
	"deleteConfirm": "Confirmez-vous la suppression?",
	"pages": "Pages",
	"editThisPage": "Éditer cette page",
	"unlike": "Je n’aime pas",
	"like": "Favori",
	"copyLink": "Copier le lien",
	"createdAt": "Date de création",
	"updatedAt": "Mis à jour le",
	"recentPosts": "Les plus récentes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"shareWithNote": "Bagikan dengan catatan",
	"share": "Bagikan",
	"unlikeConfirm": "Yakin ingin hapus sukamu?",
	"edit": "Sunting",
	"unpin": "Lepas sematan",
	"pin": "Sematkan",
	"reportAbuse": "Laporkan",
	"delete": "Hapus",
	"deleteConfirm": "Yakin hapus?",
	"pages": "Halaman",
	"editThisPage": "Sunting Halaman ini",
	"unlike": "Hapus suka",
	"like": "Suka",
	"copyLink": "Salin tautan",
	"createdAt": "Dibuat pada",
	"updatedAt": "Diperbarui pada",
	"recentPosts": "Postingan terbaru"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"shareWithNote": "Condividere in nota",
	"share": "Condividi",
	"unlikeConfirm": "Non ti piace più?",
	"edit": "Modifica",
	"unpin": "Non fissare sul profilo",
	"pin": "Fissa sul profilo",
	"reportAbuse": "Segnalare",
	"delete": "Elimina",
	"deleteConfirm": "Rimuovere?",
	"pages": "Pagine",
	"editThisPage": "Modifica questa pagina",
	"unlike": "Togli Mi piace",
	"like": "Mi piace",
	"copyLink": "Copia il link",
	"createdAt": "Data di creazione",
	"updatedAt": "Aggiornato il",
	"recentPosts": "Pubblicazioni recenti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"shareWithNote": "ノートで共有",
	"share": "共有",
	"unlikeConfirm": "いいね解除しますか？",
	"edit": "編集",
	"unpin": "ピン留め解除",
	"pin": "ピン留め",
	"reportAbuse": "通報",
	"delete": "削除",
	"deleteConfirm": "削除しますか？",
	"pages": "ページ",
	"editThisPage": "このページを編集",
	"unlike": "いいね解除",
	"like": "いいね",
	"copyLink": "リンクをコピー",
	"createdAt": "作成日時",
	"updatedAt": "更新日時",
	"recentPosts": "最近の投稿"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"shareWithNote": "ノートで共有",
	"share": "わけわけ",
	"unlikeConfirm": "いいね解除するんか？",
	"edit": "編集",
	"unpin": "ピン留めやめる",
	"pin": "ピン留めしとく",
	"reportAbuse": "通報",
	"delete": "ほかす",
	"deleteConfirm": "ホンマにほかすで？",
	"pages": "ページ",
	"editThisPage": "このページを編集",
	"unlike": "良くないわ",
	"like": "ええやん",
	"copyLink": "リンクをコピー",
	"createdAt": "作成した日",
	"updatedAt": "更新日時",
	"recentPosts": "最近の投稿"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"edit": "Edit",
	"unpin": "Unpin from profile",
	"pin": "Pin to profile",
	"reportAbuse": "Report",
	"delete": "Kkes",
	"deleteConfirm": "Really delete?",
	"pages": "Pages",
	"editThisPage": "Edit this Page",
	"unlike": "Remove like",
	"like": "Like",
	"copyLink": "Copy link",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"edit": "Edit",
	"unpin": "ಪ್ರೊಫ಼ೈಲಿಂದ ಅಂಟುತೆಗೆ",
	"pin": "ಪ್ರೊಫ಼ೈಲಿಗೆ ಅಂಟಿಸು",
	"reportAbuse": "Report",
	"delete": "ಅಳಿಸು",
	"deleteConfirm": "Really delete?",
	"pages": "Pages",
	"editThisPage": "Edit this Page",
	"unlike": "Remove like",
	"like": "Like",
	"copyLink": "ಲಿಂಕನ್ನು ನಕಲಿಸು",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"shareWithNote": "노트로 공유",
	"share": "공유",
	"unlikeConfirm": "좋아요를 취소할까요?",
	"edit": "편집",
	"unpin": "프로필에서 고정 해제",
	"pin": "프로필에 고정",
	"reportAbuse": "신고",
	"delete": "삭제",
	"deleteConfirm": "삭제하시겠습니까?",
	"pages": "페이지",
	"editThisPage": "이 페이지를 편집",
	"unlike": "좋아요 해제",
	"like": "좋아요",
	"copyLink": "링크 복사",
	"createdAt": "생성된 날짜",
	"updatedAt": "수정한 날짜",
	"recentPosts": "최근 게시물"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"shareWithNote": "Delen met notitie",
	"share": "Delen",
	"unlikeConfirm": "Wil je echt je like verwijderen?",
	"edit": "Bewerken",
	"unpin": "Losmaken van profielpagina",
	"pin": "Vastmaken aan profielpagina",
	"reportAbuse": "Meld",
	"delete": "Verwijderen",
	"deleteConfirm": "Echt verwijderen?",
	"pages": "Pagina's",
	"editThisPage": "Edit this Page",
	"unlike": "Remove like",
	"like": "Like",
	"copyLink": "Kopiëren link",
	"createdAt": "Aangemaakt at",
	"updatedAt": "Laatst gewijzigd at",
	"recentPosts": "Recente berichten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Del",
	"unlikeConfirm": "Really remove your like?",
	"edit": "Rediger",
	"unpin": "Fjern fra profil",
	"pin": "Fest til profil",
	"reportAbuse": "Rappoter",
	"delete": "Slett",
	"deleteConfirm": "Vil du slette?",
	"pages": "Sider",
	"editThisPage": "Edit this Page",
	"unlike": "Liker ikke",
	"like": "Liker",
	"copyLink": "Kopier lenke",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"shareWithNote": "Udostępnij z wpisem",
	"share": "Udostępnij",
	"unlikeConfirm": "Na pewno chcesz usunąć\u00a0polubienie?",
	"edit": "Edytuj",
	"unpin": "Odepnij z profilu",
	"pin": "Przypnij do profilu",
	"reportAbuse": "Zgłoś",
	"delete": "Usuń",
	"deleteConfirm": "Na pewno usunąć?",
	"pages": "Strony",
	"editThisPage": "Edytuj tę stronę",
	"unlike": "Cofnij polubienie",
	"like": "Lubię",
	"copyLink": "Skopiuj odnośnik",
	"createdAt": "Utworzono",
	"updatedAt": "Zaktualizowano",
	"recentPosts": "Ostatnie wpisy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"shareWithNote": "Compartilhar em Notas",
	"share": "Compartilhar",
	"unlikeConfirm": "Deseja realmente deixar de curtir?",
	"edit": "Editar",
	"unpin": "Desafixar do perfil",
	"pin": "Fixar no perfil",
	"reportAbuse": "Denunciar",
	"delete": "Excluir",
	"deleteConfirm": "Confirma a exclusão?",
	"pages": "Páginas",
	"editThisPage": "Editar essa Página",
	"unlike": "Remover curtida",
	"like": "Curtir",
	"copyLink": "Copiar link",
	"createdAt": "Data de criação",
	"updatedAt": "Última atualização",
	"recentPosts": "Notas recentes"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"shareWithNote": "Поделиться заметкой",
	"share": "Поделиться",
	"unlikeConfirm": "В самом деле убрать «нравится»?",
	"edit": "Изменить",
	"unpin": "Открепить от профиля",
	"pin": "Закрепить в профиле",
	"reportAbuse": "Жалоба",
	"delete": "Удалить",
	"deleteConfirm": "Удалить?",
	"pages": "Страницы",
	"editThisPage": "Правка этой страницы",
	"unlike": "Отменить «нравится»",
	"like": "Нравится",
	"copyLink": "Скопировать ссылку",
	"createdAt": "Создано",
	"updatedAt": "Обновлено",
	"recentPosts": "Недавние публикации"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"shareWithNote": "Zdieľať s poznámkou",
	"share": "Zdieľať",
	"unlikeConfirm": "Naozaj odstrániť váš like?",
	"edit": "Upraviť",
	"unpin": "Odopnúť",
	"pin": "Pripnúť",
	"reportAbuse": "Nahlásiť",
	"delete": "Odstrániť",
	"deleteConfirm": "Naozaj odstrániť?",
	"pages": "Stránky",
	"editThisPage": "Upraviť túto stránku",
	"unlike": "Nepáči sa mi",
	"like": "Páči sa mi",
	"copyLink": "Kopírovať odkaz",
	"createdAt": "Vytvorené",
	"updatedAt": "Upravené",
	"recentPosts": "Najnovšie príspevky"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"shareWithNote": "แบ่งปันด้วยโน้ต",
	"share": "แบ่งปัน",
	"unlikeConfirm": "ต้องการเลิกถูกใจใช่ไหม?",
	"edit": "แก้ไข",
	"unpin": "เลิกปักหมุด",
	"pin": "ปักหมุด",
	"reportAbuse": "รายงาน",
	"delete": "ลบ",
	"deleteConfirm": "ต้องการลบใช่ไหม?",
	"pages": "หน้าเพจ",
	"editThisPage": "แก้ไขเพจนี้",
	"unlike": "เลิกถูกใจ",
	"like": "ถูกใจ",
	"copyLink": "คัดลอกลิงก์",
	"createdAt": "สร้างเมื่อ",
	"updatedAt": "อัปเดตล่าสุด",
	"recentPosts": "โพสต์ล่าสุด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"shareWithNote": "Notla paylaş",
	"share": "Paylaş",
	"unlikeConfirm": "Cidden beğenini kaldırmak mı istiyorsun?",
	"edit": "Düzenle",
	"unpin": "Profilden sabitlemeyi kaldır",
	"pin": "Profiline sabitle",
	"reportAbuse": "Rapor",
	"delete": "Sil",
	"deleteConfirm": "Cidden silmek istiyor musunuz?",
	"pages": "Sayfalar",
	"editThisPage": "Bu sayfayı düzenle",
	"unlike": "Benzerlerini kaldır",
	"like": "Beğen",
	"copyLink": "Link kopyala",
	"createdAt": "Oluşturuldu",
	"updatedAt": "Güncellendi",
	"recentPosts": "Son gönderiler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"shareWithNote": "Share with note",
	"share": "Share",
	"unlikeConfirm": "Really remove your like?",
	"edit": "Edit",
	"unpin": "Unpin from profile",
	"pin": "pinned",
	"reportAbuse": "Report",
	"delete": "ئۆچۈرۈش",
	"deleteConfirm": "Really delete?",
	"pages": "Pages",
	"editThisPage": "Edit this Page",
	"unlike": "Remove like",
	"like": "Like",
	"copyLink": "Copy link",
	"createdAt": "Created at",
	"updatedAt": "Updated at",
	"recentPosts": "Recent posts"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"shareWithNote": "Поділитися нотаткою",
	"share": "Поділитись",
	"unlikeConfirm": "Бажаєте відписатися від подібних?",
	"edit": "Редагувати",
	"unpin": "Відкріпити",
	"pin": "Закріпити",
	"reportAbuse": "Поскаржитись",
	"delete": "Видалити",
	"deleteConfirm": "Ви дійсно бажаєте це видалити?",
	"pages": "Сторінки",
	"editThisPage": "Редагувати цю сторінку",
	"unlike": "Не вподобати",
	"like": "Вподобати",
	"copyLink": "Скопіювати посилання",
	"createdAt": "Створено",
	"updatedAt": "Останнє оновлення",
	"recentPosts": "Нещодавні дописи"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"shareWithNote": "Chia sẻ kèm với tút",
	"share": "Chia sẻ",
	"unlikeConfirm": "Bạn có chắc muốn bỏ thích ?",
	"edit": "Sửa",
	"unpin": "Bỏ ghim",
	"pin": "Ghim",
	"reportAbuse": "Báo cáo",
	"delete": "Xóa",
	"deleteConfirm": "Bạn có muốn xóa không?",
	"pages": "Trang",
	"editThisPage": "Sửa Trang này",
	"unlike": "Bỏ thích",
	"like": "Thích",
	"copyLink": "Chép liên kết",
	"createdAt": "Ngày tạo",
	"updatedAt": "Cập nhật lúc",
	"recentPosts": "Tút gần đây"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"shareWithNote": "分享到帖文",
	"share": "分享",
	"unlikeConfirm": "取消赞？",
	"edit": "编辑",
	"unpin": "取消置顶",
	"pin": "置顶",
	"reportAbuse": "举报",
	"delete": "删除",
	"deleteConfirm": "确定删除?",
	"pages": "页面",
	"editThisPage": "编辑此页面",
	"unlike": "取消喜欢",
	"like": "喜欢",
	"copyLink": "复制链接",
	"createdAt": "创建日期",
	"updatedAt": "更新日期",
	"recentPosts": "最新发布"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"shareWithNote": "在貼文中分享",
	"share": "分享",
	"unlikeConfirm": "要取消按讚嗎？",
	"edit": "編輯",
	"unpin": "取消置頂",
	"pin": "置頂",
	"reportAbuse": "檢舉",
	"delete": "刪除",
	"deleteConfirm": "你確定要刪除嗎？",
	"pages": "頁面",
	"editThisPage": "編輯此頁面",
	"unlike": "收回讚好",
	"like": "讚好",
	"copyLink": "複製連結",
	"createdAt": "建立於",
	"updatedAt": "最後更新",
	"recentPosts": "最新貼文"
}
</locale>
