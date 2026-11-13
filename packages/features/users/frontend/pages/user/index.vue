<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :tabs="headerTabs" :actions="headerActions" :swipable="true">
	<div v-if="user">
		<XHome v-if="tab === 'home'" :user="user" :refreshUser="refreshUser" @showMoreFiles="() => { tab = 'files'; }"/>
		<XNotes v-else-if="tab === 'notes'" :user="user"/>
		<XFiles v-else-if="tab === 'files'" :user="user"/>
		<XActivity v-else-if="tab === 'activity'" :user="user"/>
		<XAchievements v-else-if="tab === 'achievements'" :user="user"/>
		<XReactions v-else-if="tab === 'reactions'" :user="user"/>
		<XClips v-else-if="tab === 'clips'" :user="user"/>
		<XLists v-else-if="tab === 'lists'" :user="user"/>
		<XPages v-else-if="tab === 'pages'" :user="user"/>
		<XFlashs v-else-if="tab === 'flashs'" :user="user"/>
		<XGallery v-else-if="tab === 'gallery'" :user="user"/>
		<XRaw v-else-if="tab === 'raw'" :user="user"/>
	</div>
	<MkError v-else-if="error" @retry="fetchUser()"/>
	<MkLoading v-else/>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { defineAsyncComponent, computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { acct as getAcct } from '@features/users/frontend/shared/user.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import { serverContext, assertServerContext } from '@features/runtime/frontend/server-context.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const XHome = defineAsyncComponent(() => import('@features/users/frontend/pages/user/home.vue'));
const XNotes = defineAsyncComponent(() => import('@features/notes/frontend/pages/user/notes.vue'));
const XFiles = defineAsyncComponent(() => import('@features/notes/frontend/pages/user/files.vue'));
const XActivity = defineAsyncComponent(() => import('@features/users/frontend/pages/user/activity.vue'));
const XAchievements = defineAsyncComponent(() => import('@features/users/frontend/pages/user/achievements.vue'));
const XReactions = defineAsyncComponent(() => import('@features/notes/frontend/pages/user/reactions.vue'));
const XClips = defineAsyncComponent(() => import('@features/collections/frontend/pages/user/clips.vue'));
const XLists = defineAsyncComponent(() => import('@features/relationships/frontend/pages/user/lists.vue'));
const XPages = defineAsyncComponent(() => import('@features/pages/frontend/pages/user/pages.vue'));
const XFlashs = defineAsyncComponent(() => import('@features/play/frontend/pages/user/flashs.vue'));
const XGallery = defineAsyncComponent(() => import('@features/collections/frontend/pages/user/gallery.vue'));
const XRaw = defineAsyncComponent(() => import('@features/users/frontend/pages/user/raw.vue'));

// contextは非ログイン状態の情報しかないためログイン時は利用できない
const CTX_USER = !$i && assertServerContext(serverContext, 'user') ? serverContext.user : null;

const props = withDefaults(defineProps<{
	acct: string;
	page?: string;
}>(), {
	page: 'home',
});

const tab = ref(props.page);

const user = ref<null | Misskey.entities.UserDetailed>(CTX_USER);
const error = ref<any>(null);

// 初回読込時専用（使える場合はサーバーコンテキストから取得する）
function fetchUser(): void {
	if (props.acct == null) return;

	const { username, host } = Misskey.acct.parse(props.acct);

	if (CTX_USER && CTX_USER.username === username && CTX_USER.host === host) {
		user.value = CTX_USER;
		return;
	}

	user.value = null;
	misskeyApi('users/show', {
		username,
		host,
	}).then(u => {
		user.value = u;
	}).catch(err => {
		error.value = err;
	});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

// 再読込時専用（強制fetch）
async function refreshUser(): Promise<void> {
	if (props.acct == null) return;

	const { username, host } = Misskey.acct.parse(props.acct);
	user.value = await misskeyApi('users/show', { username, host });
}

const headerActions = computed(() => []);

const headerTabs = computed(() => user.value ? [{
	key: 'home',
	title: globalLocale.value.env.overview,
	icon: 'ti ti-home',
}, {
	key: 'notes',
	title: globalLocale.value.env.notes,
	icon: 'ti ti-pencil',
}, {
	key: 'files',
	title: $locale.value.sfc.files,
	icon: 'ti ti-photo',
}, {
	key: 'activity',
	title: $locale.value.sfc.activity,
	icon: 'ti ti-chart-line',
}, ...(user.value.host == null ? [{
	key: 'achievements',
	title: $locale.value.sfc.achievements,
	icon: 'ti ti-medal',
}] : []), ...($i && ($i.id === user.value.id || $i.isAdmin || $i.isModerator)) || user.value.publicReactions ? [{
	key: 'reactions',
	title: $locale.value.sfc.reaction,
	icon: 'ti ti-mood-happy',
}] : [], {
	key: 'clips',
	title: globalLocale.value.env.clips,
	icon: 'ti ti-paperclip',
}, {
	key: 'lists',
	title: globalLocale.value.env.lists,
	icon: 'ti ti-list',
}, {
	key: 'pages',
	title: $locale.value.sfc.pages,
	icon: 'ti ti-news',
}, {
	key: 'flashs',
	title: 'Play',
	icon: 'ti ti-player-play',
}, {
	key: 'gallery',
	title: $locale.value.sfc.gallery,
	icon: 'ti ti-icons',
}, {
	key: 'raw',
	title: 'Raw',
	icon: 'ti ti-code',
}] : []);

definePage(() => ({
	title: globalLocale.value.env.user,
	icon: 'ti ti-user',
	...user.value ? {
		title: user.value.name ? `${user.value.name} (@${user.value.username})` : `@${user.value.username}`,
		subtitle: `@${getAcct(user.value)}`,
		userName: user.value,
		avatar: user.value,
		path: `/@${user.value.username}`,
		share: {
			title: user.value.name,
		},
	} : {},
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"files": "الملفات",
	"activity": "النشاط",
	"achievements": "الإنجازات",
	"reaction": "التفاعلات",
	"pages": "الصفحات",
	"gallery": "المعرض"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"files": "Fitxers",
	"activity": "Activitat",
	"achievements": "Assoliments",
	"reaction": "Reacció ",
	"pages": "Pàgines",
	"gallery": "Galeria"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"files": "Soubor(ů)",
	"activity": "Aktivita",
	"achievements": "Úspěchy",
	"reaction": "Reakce",
	"pages": "Stránky",
	"gallery": "Galerie"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"files": "Files",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"pages": "Pages",
	"gallery": "Gallery"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"files": "Dateien",
	"activity": "Aktivität",
	"achievements": "Errungenschaften",
	"reaction": "Reaktionen",
	"pages": "Seiten",
	"gallery": "Galerie"
}
</locale>

<locale locale="en-US" lang="json">
{
	"files": "Files",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"pages": "Pages",
	"gallery": "Gallery"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"files": "Archivos",
	"activity": "Actividad",
	"achievements": "Logros",
	"reaction": "Reacción",
	"pages": "Páginas",
	"gallery": "Galería"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"files": "Fichiers",
	"activity": "Activité",
	"achievements": "Accomplissements",
	"reaction": "Réactions",
	"pages": "Pages",
	"gallery": "Galerie"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"files": "Berkas",
	"activity": "Aktivitas",
	"achievements": "Pencapaian",
	"reaction": "Reaksi",
	"pages": "Halaman",
	"gallery": "Galeri"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"files": "Allegati",
	"activity": "Attività",
	"achievements": "Conquiste",
	"reaction": "Reazioni",
	"pages": "Pagine",
	"gallery": "Gallerie"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"files": "ファイル",
	"activity": "アクティビティ",
	"achievements": "実績",
	"reaction": "リアクション",
	"pages": "ページ",
	"gallery": "ギャラリー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"files": "ファイル",
	"activity": "アクティビティ",
	"achievements": "実績",
	"reaction": "ツッコミ",
	"pages": "ページ",
	"gallery": "ギャラリー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"files": "Ifuyla",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"pages": "Pages",
	"gallery": "Gallery"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"files": "ಕಡತಗಳು",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"pages": "Pages",
	"gallery": "Gallery"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"files": "파일",
	"activity": "활동",
	"achievements": "도전 과제",
	"reaction": "리액션",
	"pages": "페이지",
	"gallery": "갤러리"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"files": "Bestanden",
	"activity": "Activiteit",
	"achievements": "Achievements",
	"reaction": "Reacties",
	"pages": "Pagina's",
	"gallery": "Galerij"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"files": "Filer",
	"activity": "Aktivitet",
	"achievements": "Prestasjoner",
	"reaction": "Reaksjon",
	"pages": "Sider",
	"gallery": "Galleri"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"files": "Pliki",
	"activity": "Aktywność",
	"achievements": "Osiągnięcia",
	"reaction": "Reakcja",
	"pages": "Strony",
	"gallery": "Galeria"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"files": "Arquivos",
	"activity": "atividade",
	"achievements": "Conquistas",
	"reaction": "Reações",
	"pages": "Páginas",
	"gallery": "Galeria"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"files": "Файлы",
	"activity": "Активность",
	"achievements": "Достижения",
	"reaction": "Реакции",
	"pages": "Страницы",
	"gallery": "Галерея"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"files": "Súbor/y",
	"activity": "Aktivita",
	"achievements": "Achievements",
	"reaction": "Reakcie",
	"pages": "Stránky",
	"gallery": "Galéria"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"files": "ไฟล์",
	"activity": "กิจกรรม",
	"achievements": "ความสำเร็จ",
	"reaction": "รีแอคชั่น",
	"pages": "หน้าเพจ",
	"gallery": "แกลเลอรี่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"files": "Dosyalar",
	"activity": "Etkinlik",
	"achievements": "Başarılar",
	"reaction": "Tepki",
	"pages": "Sayfalar",
	"gallery": "Galeri"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"files": "Files",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"pages": "Pages",
	"gallery": "Gallery"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"files": "Файли",
	"activity": "Активність",
	"achievements": "Досягнення",
	"reaction": "Реакції",
	"pages": "Сторінки",
	"gallery": "Галерея"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"files": "Tập tin",
	"activity": "Hoạt động",
	"achievements": "Thành tích",
	"reaction": "Biểu cảm",
	"pages": "Trang",
	"gallery": "Thư viện ảnh"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"files": "文件",
	"activity": "活动",
	"achievements": "成就",
	"reaction": "回应",
	"pages": "页面",
	"gallery": "相册"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"files": "檔案",
	"activity": "動態",
	"achievements": "成就",
	"reaction": "反應",
	"pages": "頁面",
	"gallery": "相簿"
}
</locale>
