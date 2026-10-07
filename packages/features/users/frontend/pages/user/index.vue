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
import { defineAsyncComponent, computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { acct as getAcct } from '@features/users/frontend/filters/user.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import { serverContext, assertServerContext } from '@features/runtime/frontend/server-context.js';

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
	title: $locale.value.sfc.overview,
	icon: 'ti ti-home',
}, {
	key: 'notes',
	title: $locale.value.sfc.notes,
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
	title: $locale.value.sfc.clips,
	icon: 'ti ti-paperclip',
}, {
	key: 'lists',
	title: $locale.value.sfc.lists,
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
	title: $locale.value.sfc.user,
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
	"overview": "ملخص عام",
	"notes": "الملاحظات",
	"files": "الملفات",
	"activity": "النشاط",
	"achievements": "الإنجازات",
	"reaction": "التفاعلات",
	"clips": "مشابك",
	"lists": "القوائم",
	"pages": "الصفحات",
	"gallery": "المعرض",
	"user": "المستخدمون"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"overview": "Visió General",
	"notes": "Notes",
	"files": "Fitxers",
	"activity": "Activitat",
	"achievements": "Assoliments",
	"reaction": "Reacció ",
	"clips": "Retalls",
	"lists": "Llistes",
	"pages": "Pàgines",
	"gallery": "Galeria",
	"user": "Usuaris"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"overview": "Shrnutí",
	"notes": "Poznámky",
	"files": "Soubor(ů)",
	"activity": "Aktivita",
	"achievements": "Úspěchy",
	"reaction": "Reakce",
	"clips": "Oříznout",
	"lists": "Seznamy",
	"pages": "Stránky",
	"gallery": "Galerie",
	"user": "Uživatelé"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"overview": "Overview",
	"notes": "Notes",
	"files": "Files",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"clips": "Clips",
	"lists": "Lists",
	"pages": "Pages",
	"gallery": "Gallery",
	"user": "User"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"overview": "Übersicht",
	"notes": "Notizen",
	"files": "Dateien",
	"activity": "Aktivität",
	"achievements": "Errungenschaften",
	"reaction": "Reaktionen",
	"clips": "Clips",
	"lists": "Listen",
	"pages": "Seiten",
	"gallery": "Galerie",
	"user": "Benutzer"
}
</locale>

<locale locale="en-US" lang="json">
{
	"overview": "Overview",
	"notes": "Notes",
	"files": "Files",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"clips": "Clips",
	"lists": "Lists",
	"pages": "Pages",
	"gallery": "Gallery",
	"user": "User"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"overview": "Resumen",
	"notes": "Notas",
	"files": "Archivos",
	"activity": "Actividad",
	"achievements": "Logros",
	"reaction": "Reacción",
	"clips": "Clip",
	"lists": "Listas",
	"pages": "Páginas",
	"gallery": "Galería",
	"user": "Usuarios"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"overview": "Aperçu",
	"notes": "Notes",
	"files": "Fichiers",
	"activity": "Activité",
	"achievements": "Accomplissements",
	"reaction": "Réactions",
	"clips": "Clips",
	"lists": "Listes",
	"pages": "Pages",
	"gallery": "Galerie",
	"user": "Utilisateur·rice·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"overview": "Ikhtisar",
	"notes": "Catatan",
	"files": "Berkas",
	"activity": "Aktivitas",
	"achievements": "Pencapaian",
	"reaction": "Reaksi",
	"clips": "Klip",
	"lists": "Daftar",
	"pages": "Halaman",
	"gallery": "Galeri",
	"user": "Pengguna"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"overview": "Anteprima",
	"notes": "Note",
	"files": "Allegati",
	"activity": "Attività",
	"achievements": "Conquiste",
	"reaction": "Reazioni",
	"clips": "Clip",
	"lists": "Liste",
	"pages": "Pagine",
	"gallery": "Gallerie",
	"user": "Profilo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"overview": "概要",
	"notes": "ノート",
	"files": "ファイル",
	"activity": "アクティビティ",
	"achievements": "実績",
	"reaction": "リアクション",
	"clips": "クリップ",
	"lists": "リスト",
	"pages": "ページ",
	"gallery": "ギャラリー",
	"user": "ユーザー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"overview": "概要",
	"notes": "ノート",
	"files": "ファイル",
	"activity": "アクティビティ",
	"achievements": "実績",
	"reaction": "ツッコミ",
	"clips": "クリップ",
	"lists": "リスト",
	"pages": "ページ",
	"gallery": "ギャラリー",
	"user": "ユーザー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"overview": "Overview",
	"notes": "Notes",
	"files": "Ifuyla",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"clips": "Clips",
	"lists": "Tibdarin",
	"pages": "Pages",
	"gallery": "Gallery",
	"user": "User"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"overview": "Overview",
	"notes": "Notes",
	"files": "ಕಡತಗಳು",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"clips": "Clips",
	"lists": "Lists",
	"pages": "Pages",
	"gallery": "Gallery",
	"user": "ಬಳಕೆದಾರ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"overview": "요약",
	"notes": "노트",
	"files": "파일",
	"activity": "활동",
	"achievements": "도전 과제",
	"reaction": "리액션",
	"clips": "클립",
	"lists": "리스트",
	"pages": "페이지",
	"gallery": "갤러리",
	"user": "유저"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"overview": "Overzicht",
	"notes": "Notities",
	"files": "Bestanden",
	"activity": "Activiteit",
	"achievements": "Achievements",
	"reaction": "Reacties",
	"clips": "Clips",
	"lists": "Lijsten",
	"pages": "Pagina's",
	"gallery": "Galerij",
	"user": "Gebruikers"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"overview": "Overview",
	"notes": "Notes",
	"files": "Filer",
	"activity": "Aktivitet",
	"achievements": "Prestasjoner",
	"reaction": "Reaksjon",
	"clips": "Clips",
	"lists": "Lister",
	"pages": "Sider",
	"gallery": "Galleri",
	"user": "Brukere"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"overview": "Przegląd",
	"notes": "Wpisy",
	"files": "Pliki",
	"activity": "Aktywność",
	"achievements": "Osiągnięcia",
	"reaction": "Reakcja",
	"clips": "Klipy",
	"lists": "Listy",
	"pages": "Strony",
	"gallery": "Galeria",
	"user": "Użytkownicy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"overview": "Visão geral",
	"notes": "Posts",
	"files": "Arquivos",
	"activity": "atividade",
	"achievements": "Conquistas",
	"reaction": "Reações",
	"clips": "Clipe",
	"lists": "Listas",
	"pages": "Páginas",
	"gallery": "Galeria",
	"user": "Usuário"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"overview": "Обзор",
	"notes": "Заметки",
	"files": "Файлы",
	"activity": "Активность",
	"achievements": "Достижения",
	"reaction": "Реакции",
	"clips": "Подборки",
	"lists": "Списки",
	"pages": "Страницы",
	"gallery": "Галерея",
	"user": "Пользователи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"overview": "Prehľad",
	"notes": "Poznámky",
	"files": "Súbor/y",
	"activity": "Aktivita",
	"achievements": "Achievements",
	"reaction": "Reakcie",
	"clips": "Klip",
	"lists": "Zoznamy",
	"pages": "Stránky",
	"gallery": "Galéria",
	"user": "Používatelia"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"overview": "ภาพรวม",
	"notes": " โน้ต",
	"files": "ไฟล์",
	"activity": "กิจกรรม",
	"achievements": "ความสำเร็จ",
	"reaction": "รีแอคชั่น",
	"clips": "คลิป",
	"lists": "รายชื่อ",
	"pages": "หน้าเพจ",
	"gallery": "แกลเลอรี่",
	"user": "ผู้ใช้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"overview": "Genel Bakış",
	"notes": "Notlar",
	"files": "Dosyalar",
	"activity": "Etkinlik",
	"achievements": "Başarılar",
	"reaction": "Tepki",
	"clips": "Klipler",
	"lists": "Listeler",
	"pages": "Sayfalar",
	"gallery": "Galeri",
	"user": "Kullanıcı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"overview": "Overview",
	"notes": "Notes",
	"files": "Files",
	"activity": "Activity",
	"achievements": "Achievements",
	"reaction": "Reactions",
	"clips": "Clips",
	"lists": "Lists",
	"pages": "Pages",
	"gallery": "Gallery",
	"user": "User"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"overview": "Огляд",
	"notes": "Записи",
	"files": "Файли",
	"activity": "Активність",
	"achievements": "Досягнення",
	"reaction": "Реакції",
	"clips": "Добірки",
	"lists": "Списки",
	"pages": "Сторінки",
	"gallery": "Галерея",
	"user": "Користувачі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"overview": "Tổng quan",
	"notes": "Bài Viết",
	"files": "Tập tin",
	"activity": "Hoạt động",
	"achievements": "Thành tích",
	"reaction": "Biểu cảm",
	"clips": "Lưu bài viết",
	"lists": "Danh sách",
	"pages": "Trang",
	"gallery": "Thư viện ảnh",
	"user": "Người dùng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"overview": "概览",
	"notes": "帖子",
	"files": "文件",
	"activity": "活动",
	"achievements": "成就",
	"reaction": "回应",
	"clips": "便签",
	"lists": "列表",
	"pages": "页面",
	"gallery": "相册",
	"user": "用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"overview": "概覽",
	"notes": "貼文",
	"files": "檔案",
	"activity": "動態",
	"achievements": "成就",
	"reaction": "反應",
	"clips": "摘錄",
	"lists": "清單",
	"pages": "頁面",
	"gallery": "相簿",
	"user": "使用者"
}
</locale>
