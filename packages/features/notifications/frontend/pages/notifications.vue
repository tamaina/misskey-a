<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div v-if="tab === 'all'">
			<MkStreamingNotificationsTimeline :class="$style.notifications" :excludeTypes="excludeTypes"/>
		</div>
		<div v-else-if="tab === 'mentions'">
			<MkNotesTimeline :paginator="mentionsPaginator"/>
		</div>
		<div v-else-if="tab === 'directNotes'">
			<MkNotesTimeline :paginator="directNotesPaginator"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import { notificationTypes } from 'misskey-js';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
import MkStreamingNotificationsTimeline from '@features/notifications/frontend/components/MkStreamingNotificationsTimeline.vue';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const tab = ref('all');
const includeTypes = ref<string[] | null>(null);
const excludeTypes = computed(() => includeTypes.value ? notificationTypes.filter(t => !includeTypes.value!.includes(t)) : null);

const mentionsPaginator = markRaw(new Paginator('notes/mentions', {
	limit: 10,
}));

const directNotesPaginator = markRaw(new Paginator('notes/mentions', {
	limit: 10,
	params: {
		visibility: 'specified',
	},
}));

function setFilter(ev: PointerEvent) {
	const typeItems = notificationTypes.map(t => ({
		text: copyLocaleDictionary($locale.value.sfc.notificationTypesLabels)[t],
		active: (includeTypes.value && includeTypes.value.includes(t)) ?? false,
		action: () => {
			includeTypes.value = [t];
		},
	}));
	const items = includeTypes.value != null ? [{
		icon: 'ti ti-x',
		text: $locale.value.sfc.clear,
		action: () => {
			includeTypes.value = null;
		},
	}, { type: 'divider' as const }, ...typeItems] : typeItems;
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

const headerActions = computed<PageHeaderItem[]>(() => ([tab.value === 'all' ? {
	text: $locale.value.sfc.filter,
	icon: 'ti ti-filter',
	highlighted: includeTypes.value != null,
	handler: setFilter,
} : undefined, tab.value === 'all' ? {
	text: $locale.value.sfc.markAllAsRead,
	icon: 'ti ti-check',
	handler: () => {
		os.apiWithDialog('notifications/mark-all-as-read', {});
	},
} : undefined] as (PageHeaderItem | undefined)[]).filter(x => x !== undefined));

const headerTabs = computed(() => [{
	key: 'all',
	title: $locale.value.sfc.all,
	icon: 'ti ti-point',
}, {
	key: 'mentions',
	title: $locale.value.sfc.mentions,
	icon: 'ti ti-at',
}, {
	key: 'directNotes',
	title: $locale.value.sfc.directNotes,
	icon: 'ti ti-mail',
}]);

definePage(() => ({
	title: $locale.value.sfc.notifications,
	icon: 'ti ti-bell',
}));
</script>

<style module lang="scss">
.notifications {
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"notificationTypesLabels": {
		"all": "الكل",
		"note": "New notes",
		"follow": "متابِعون جدد",
		"mention": "الإشارات",
		"reply": "الردود",
		"renote": "أعاد النشر",
		"quote": "الاقتباسات",
		"reaction": "التفاعل",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "طلبات المتابعة",
		"followRequestAccepted": "طلبات المتابعة المقبولة",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "لِج",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "إشعارات التطبيقات المرتبطة"
	},
	"clear": "عودة",
	"filter": "رشّح",
	"markAllAsRead": "علّم الكل كمقروء",
	"all": "الكل",
	"mentions": "الإشارات",
	"directNotes": "رسالة خاصة",
	"notifications": "الإشعارات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"notificationTypesLabels": {
		"all": "Tots",
		"note": "Notes noves",
		"follow": "Segueix-me",
		"mention": "Menció",
		"reply": "Respostes",
		"renote": "Impulsos",
		"quote": "Citar",
		"reaction": "Reaccions",
		"pollEnded": "Enquesta terminada",
		"scheduledNotePosted": "Nota programada amb èxit ",
		"scheduledNotePostFailed": "Ha fallat la programació de la nota",
		"receiveFollowRequest": "Rebuda una petició de seguiment",
		"followRequestAccepted": "Petició de seguiment acceptada",
		"roleAssigned": "Rol donat",
		"chatRoomInvitationReceived": "Invitat a la sala de xat",
		"achievementEarned": "Assoliment desbloquejat",
		"exportCompleted": "Exportació completada",
		"login": "Iniciar sessió",
		"createToken": "Creació de tokens d'accés ",
		"test": "Prova la notificació",
		"app": "Notificacions d'aplicacions"
	},
	"clear": "Tornar",
	"filter": "Filtrar",
	"markAllAsRead": "Marcar tot com llegit",
	"all": "Tot",
	"mentions": "Mencions",
	"directNotes": "Notes directes",
	"notifications": "Notificacions"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"notificationTypesLabels": {
		"all": "Vše",
		"note": "New notes",
		"follow": "Sledovaní",
		"mention": "Zmínění",
		"reply": "Odpovědi",
		"renote": "Přeposlat",
		"quote": "Citovat",
		"reaction": "Reakce",
		"pollEnded": "Anketa končí",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Obdržené žádosti o sledování",
		"followRequestAccepted": "Přijaté žádosti o sledování",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Úspěch odemčen",
		"exportCompleted": "The export has been completed",
		"login": "Přihlásit se",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Oznámení z propojených aplikací"
	},
	"clear": "Vrátit",
	"filter": "Filtr",
	"markAllAsRead": "Označit všechno jako přečtené",
	"all": "Vše",
	"mentions": "Zmínění",
	"directNotes": "Přímé poznámky",
	"notifications": "Oznámení"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"notificationTypesLabels": {
		"all": "All",
		"note": "New notes",
		"follow": "New followers",
		"mention": "Mentions",
		"reply": "Replies",
		"renote": "Renotes",
		"quote": "Quotes",
		"reaction": "Reactions",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Received follow requests",
		"followRequestAccepted": "Accepted follow requests",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "Sign In",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Notifications from linked apps"
	},
	"clear": "Return",
	"filter": "Filter",
	"markAllAsRead": "Mark all as read",
	"all": "All",
	"mentions": "Mentions",
	"directNotes": "Direct notes",
	"notifications": "Notifications"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"notificationTypesLabels": {
		"all": "Alle",
		"note": "Neue Notizen",
		"follow": "Neue Follower",
		"mention": "Erwähnungen",
		"reply": "Antworten",
		"renote": "Renotes",
		"quote": "Zitationen",
		"reaction": "Reaktionen",
		"pollEnded": "Ende von Umfragen",
		"scheduledNotePosted": "Der geplante Beitrag wurde erfolgreich veröffentlicht.",
		"scheduledNotePostFailed": "Der geplante Beitrag ist fehlgeschlagen.",
		"receiveFollowRequest": "Erhaltene Follow-Anfragen",
		"followRequestAccepted": "Akzeptierte Follow-Anfragen",
		"roleAssigned": "Rolle zugewiesen",
		"chatRoomInvitationReceived": "Einladungen zum Chatraum",
		"achievementEarned": "Errungenschaft freigeschaltet",
		"exportCompleted": "Der Export ist abgeschlossen",
		"login": "Anmeldung",
		"createToken": "Erstellung von Zugriffstokens",
		"test": "Test-Benachrichtigungen",
		"app": "Benachrichtigungen von Apps"
	},
	"clear": "Zurückkehren",
	"filter": "Filter",
	"markAllAsRead": "Alle als gelesen markieren",
	"all": "Alle",
	"mentions": "Erwähnungen",
	"directNotes": "Direktnachrichten",
	"notifications": "Benachrichtigungen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"notificationTypesLabels": {
		"all": "All",
		"note": "New notes",
		"follow": "New followers",
		"mention": "Mentions",
		"reply": "Replies",
		"renote": "Renotes",
		"quote": "Quotes",
		"reaction": "Reactions",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Received follow requests",
		"followRequestAccepted": "Accepted follow requests",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "Sign In",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Notifications from linked apps"
	},
	"clear": "Return",
	"filter": "Filter",
	"markAllAsRead": "Mark all as read",
	"all": "All",
	"mentions": "Mentions",
	"directNotes": "Direct notes",
	"notifications": "Notifications"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"notificationTypesLabels": {
		"all": "Todo",
		"note": "Nuevas notas",
		"follow": "Siguiendo",
		"mention": "Menciones",
		"reply": "Respuestas",
		"renote": "Renotas",
		"quote": "Citar",
		"reaction": "Reacción",
		"pollEnded": "La encuesta terminó",
		"scheduledNotePosted": "Publicación programada con éxito",
		"scheduledNotePostFailed": "Publicación programada fallida",
		"receiveFollowRequest": "Recibió una solicitud de seguimiento",
		"followRequestAccepted": "El seguimiento fue aceptado",
		"roleAssigned": "Rol asignado",
		"chatRoomInvitationReceived": "Invitado a la sala de chat.",
		"achievementEarned": "Logro desbloqueado",
		"exportCompleted": "La exportación se ha completado",
		"login": "Iniciar sesión",
		"createToken": "Crear tokens de acceso",
		"test": "Pruebas de nofiticaciones",
		"app": "Notificaciones desde aplicaciones"
	},
	"clear": "Limpiar",
	"filter": "Filtrar",
	"markAllAsRead": "Marcar todo como leído",
	"all": "Todo",
	"mentions": "Menciones",
	"directNotes": "Notas directas",
	"notifications": "Notificaciones"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"notificationTypesLabels": {
		"all": "Toutes",
		"note": "Nouvelles notes",
		"follow": "Nouvel·le abonné·e",
		"mention": "Mentions",
		"reply": "Réponses",
		"renote": "Renotes",
		"quote": "Citations",
		"reaction": "Réactions",
		"pollEnded": "Sondages se cloturant",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Demande d'abonnement reçue",
		"followRequestAccepted": "Demande d'abonnement acceptée",
		"roleAssigned": "Rôle reçu",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Déverrouillage d'accomplissement",
		"exportCompleted": "The export has been completed",
		"login": "Se connecter",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Notifications provenant des apps"
	},
	"clear": "Effacer",
	"filter": "Filtre",
	"markAllAsRead": "Tout marquer comme lu",
	"all": "Tous",
	"mentions": "Mentions",
	"directNotes": "Notes directes",
	"notifications": "Notifications"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"notificationTypesLabels": {
		"all": "Semua",
		"note": "Catatan baru",
		"follow": "Ikuti",
		"mention": "Sebut",
		"reply": "Balasan",
		"renote": "Renote",
		"quote": "Kutip",
		"reaction": "Reaksi",
		"pollEnded": "Jajak pendapat berakhir",
		"scheduledNotePosted": "Note terjadwal berhasil",
		"scheduledNotePostFailed": "Note terjadwal gagal",
		"receiveFollowRequest": "Permintaan mengikuti diterima",
		"followRequestAccepted": "Permintaan mengikuti disetujui",
		"roleAssigned": "Peran Diberikan",
		"chatRoomInvitationReceived": "Diundang ke dalam ruang chat",
		"achievementEarned": "Pencapaian didapatkan",
		"exportCompleted": "Ekspor telah selesai",
		"login": "Masuk",
		"createToken": "Buat token akses",
		"test": "Tes notifikasi",
		"app": "Notifikasi dari aplikasi tertaut"
	},
	"clear": "Bersihkan",
	"filter": "Saring",
	"markAllAsRead": "Tandai semua telah dibaca",
	"all": "Semua",
	"mentions": "Sebutan",
	"directNotes": "Catatan langsung",
	"notifications": "Notifikasi"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"notificationTypesLabels": {
		"all": "Tutte",
		"note": "Nuove Note",
		"follow": "Follower",
		"mention": "Menzioni",
		"reply": "Risposte",
		"renote": "Rinota",
		"quote": "Cita",
		"reaction": "Reazioni",
		"pollEnded": "Sondaggio terminato",
		"scheduledNotePosted": "Nota pianificata correttamente",
		"scheduledNotePostFailed": "La pianificazione della Nota è fallita",
		"receiveFollowRequest": "Richieste di follow in arrivo",
		"followRequestAccepted": "Richieste di follow accettate",
		"roleAssigned": "Ruolo concesso",
		"chatRoomInvitationReceived": "Invito in una stanza di chat",
		"achievementEarned": "Risultato raggiunto",
		"exportCompleted": "Esportazione completata",
		"login": "Accessi",
		"createToken": "Aggiunto un token di accesso",
		"test": "Notifiche di test",
		"app": "Notifiche da applicazioni"
	},
	"clear": "Cancella",
	"filter": "Filtri",
	"markAllAsRead": "Segna tutti come già letti",
	"all": "Tutte",
	"mentions": "Menzioni",
	"directNotes": "Note dirette",
	"notifications": "Notifiche"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"notificationTypesLabels": {
		"all": "すべて",
		"note": "ユーザーの新規投稿",
		"follow": "フォロー",
		"mention": "メンション",
		"reply": "リプライ",
		"renote": "リノート",
		"quote": "引用",
		"reaction": "リアクション",
		"pollEnded": "アンケートが終了",
		"scheduledNotePosted": "予約投稿が成功した",
		"scheduledNotePostFailed": "予約投稿が失敗した",
		"receiveFollowRequest": "フォロー申請を受け取った",
		"followRequestAccepted": "フォローが受理された",
		"roleAssigned": "ロールが付与された",
		"chatRoomInvitationReceived": "ダイレクトメッセージのグループへ招待された",
		"achievementEarned": "実績の獲得",
		"exportCompleted": "エクスポートが完了した",
		"login": "ログイン",
		"createToken": "アクセストークンの作成",
		"test": "通知のテスト",
		"app": "連携アプリからの通知"
	},
	"clear": "クリア",
	"filter": "フィルタ",
	"markAllAsRead": "全て既読にする",
	"all": "全て",
	"mentions": "メンション",
	"directNotes": "指名",
	"notifications": "通知"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"notificationTypesLabels": {
		"all": "すべて",
		"note": "あんたらの新規投稿",
		"follow": "フォロー",
		"mention": "あんた宛て",
		"reply": "リプライ",
		"renote": "リノート",
		"quote": "引用",
		"reaction": "ツッコミ",
		"pollEnded": "アンケートが終了したで",
		"scheduledNotePosted": "予約投稿が成功した",
		"scheduledNotePostFailed": "予約投稿が失敗した",
		"receiveFollowRequest": "フォロー許可してほしいみたいやで",
		"followRequestAccepted": "フォローが受理されたで",
		"roleAssigned": "ロールが付与された",
		"chatRoomInvitationReceived": "ダイレクトメッセージのグループへ招待された",
		"achievementEarned": "実績の獲得",
		"exportCompleted": "エクスポート終わった",
		"login": "ログイン",
		"createToken": "アクセストークンの作成",
		"test": "通知テスト",
		"app": "連携アプリからの通知や"
	},
	"clear": "クリア",
	"filter": "フィルタ",
	"markAllAsRead": "もうみな読んでもうたわ",
	"all": "みんな",
	"mentions": "あんた宛て",
	"directNotes": "ダイレクト投稿",
	"notifications": "通知"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"notificationTypesLabels": {
		"all": "All",
		"note": "New notes",
		"follow": "Ig ṭṭafaṛ",
		"mention": "Bder",
		"reply": "Replies",
		"renote": "Renotes",
		"quote": "Quotes",
		"reaction": "Reactions",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Received follow requests",
		"followRequestAccepted": "Accepted follow requests",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "Sign In",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Notifications from linked apps"
	},
	"clear": "Return",
	"filter": "Filter",
	"markAllAsRead": "Mark all as read",
	"all": "All",
	"mentions": "Mentions",
	"directNotes": "Direct notes",
	"notifications": "Ilɣuyen"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"notificationTypesLabels": {
		"all": "All",
		"note": "New notes",
		"follow": "New followers",
		"mention": "ಹೆಸರಿಸಿದ",
		"reply": "Replies",
		"renote": "Renotes",
		"quote": "Quotes",
		"reaction": "Reactions",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Received follow requests",
		"followRequestAccepted": "Accepted follow requests",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "ಪ್ರವೇಶ",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Notifications from linked apps"
	},
	"clear": "Return",
	"filter": "Filter",
	"markAllAsRead": "Mark all as read",
	"all": "All",
	"mentions": "ಹೆಸರಿಸಿದ",
	"directNotes": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
	"notifications": "ಅಧಿಸೂಚನೆಗಳು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"notificationTypesLabels": {
		"all": "전부",
		"note": "유저의 새 글",
		"follow": "팔로잉",
		"mention": "멘션",
		"reply": "답글",
		"renote": "리노트",
		"quote": "인용",
		"reaction": "리액션",
		"pollEnded": "투표가 종료됨",
		"scheduledNotePosted": "예약 게시에 성공했습니다",
		"scheduledNotePostFailed": "예약 게시에 실패했습니다",
		"receiveFollowRequest": "팔로우 요청을 받았을 때",
		"followRequestAccepted": "팔로우 요청이 승인되었을 때",
		"roleAssigned": "역할이 부여됨",
		"chatRoomInvitationReceived": "채팅방에 초대됨",
		"achievementEarned": "도전 과제 획득",
		"exportCompleted": "추출을 성공함",
		"login": "로그인",
		"createToken": "액세스 토큰 만들기",
		"test": "알림 테스트",
		"app": "연동된 앱을 통한 알림"
	},
	"clear": "지우기",
	"filter": "필터",
	"markAllAsRead": "모두 읽은 상태로 표시",
	"all": "전체",
	"mentions": "받은 멘션",
	"directNotes": "다이렉트 노트",
	"notifications": "알림"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"notificationTypesLabels": {
		"all": "All",
		"note": "New notes",
		"follow": "Volgend",
		"mention": "Vermelding",
		"reply": "Replies",
		"renote": "Herdelen",
		"quote": "Quote",
		"reaction": "Reacties",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Received follow requests",
		"followRequestAccepted": "Accepted follow requests",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "Inloggen",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Notifications from linked apps"
	},
	"clear": "Terugkeren",
	"filter": "Filter",
	"markAllAsRead": "Alles als gelezen markeren",
	"all": "Alle",
	"mentions": "Vermeldingen",
	"directNotes": "Directe notities",
	"notifications": "Meldingen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"notificationTypesLabels": {
		"all": "All",
		"note": "New notes",
		"follow": "Nye følgere",
		"mention": "Mentions",
		"reply": "Svar",
		"renote": "Renotes",
		"quote": "Sitater",
		"reaction": "Reaksjoner",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Received follow requests",
		"followRequestAccepted": "Accepted follow requests",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "Logg inn",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Notifications from linked apps"
	},
	"clear": "Tøm",
	"filter": "Filter",
	"markAllAsRead": "Merk alt som lest",
	"all": "Alle",
	"mentions": "Mentions",
	"directNotes": "Direct notes",
	"notifications": "Varsler"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"notificationTypesLabels": {
		"all": "Wszystkie",
		"note": "New notes",
		"follow": "Nowi obserwujący",
		"mention": "Wspomnij",
		"reply": "Odpowiedzi",
		"renote": "Udostępnij",
		"quote": "Cytuj",
		"reaction": "Reakcja",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Otrzymano prośbę o możliwość obserwacji",
		"followRequestAccepted": "Przyjęto prośbę o możliwość obserwacji",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "Zaloguj się",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Powiadomienia z aplikacji"
	},
	"clear": "Wróć",
	"filter": "Filtr",
	"markAllAsRead": "Oznacz wszystkie jako przeczytane",
	"all": "Wszystkie",
	"mentions": "Wspomnienia",
	"directNotes": "Bezpośrednie wpisy",
	"notifications": "Powiadomienia"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"notificationTypesLabels": {
		"all": "Todas",
		"note": "Novas notas",
		"follow": "Seguindo",
		"mention": "Menção",
		"reply": "Respostas",
		"renote": "Repostar",
		"quote": "Citações",
		"reaction": "Reações",
		"pollEnded": "Enquetes terminando",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Recebeu pedidos de seguidor",
		"followRequestAccepted": "Aceitou pedidos de seguidor",
		"roleAssigned": "Cargo dado",
		"chatRoomInvitationReceived": "Convite de conversa recebido",
		"achievementEarned": "Conquista desbloqueada",
		"exportCompleted": "A exportação foi concluída",
		"login": "Iniciar sessão",
		"createToken": "Criar token de acesso",
		"test": "Notificação teste",
		"app": "Notificações de aplicativos conectados"
	},
	"clear": "Limpar",
	"filter": "Filtrar",
	"markAllAsRead": "Marcar todas como lidas",
	"all": "Todos",
	"mentions": "Menções",
	"directNotes": "Notas diretas",
	"notifications": "Notificações"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"notificationTypesLabels": {
		"all": "Все",
		"note": "New notes",
		"follow": "Подписки",
		"mention": "Упоминания",
		"reply": "Ответы",
		"renote": "Репосты",
		"quote": "Цитаты",
		"reaction": "Реакции",
		"pollEnded": "Окончания опросов",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Получен запрос на подписку",
		"followRequestAccepted": "Запрос на подписку одобрен",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Пригласили в чат",
		"achievementEarned": "Получение достижений",
		"exportCompleted": "The export has been completed",
		"login": "Войти",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Уведомления из приложений"
	},
	"clear": "Очистить",
	"filter": "Фильтры",
	"markAllAsRead": "Отметить всё как прочитанное",
	"all": "Все",
	"mentions": "Упоминания",
	"directNotes": "Личные сообщения",
	"notifications": "Уведомления"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"notificationTypesLabels": {
		"all": "Všetky",
		"note": "New notes",
		"follow": "Sledujete",
		"mention": "Zmienka",
		"reply": "Odpovede",
		"renote": "Preposlať",
		"quote": "Citovať",
		"reaction": "Reakcie",
		"pollEnded": "Hlasovanie skončilo",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Doručené žiadosti o sledovanie",
		"followRequestAccepted": "Schválené žiadosti o sledovanie",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "Prihlásiť sa",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Oznámenia z prepojených aplikácií"
	},
	"clear": "Vrátiť",
	"filter": "Filter",
	"markAllAsRead": "Označiť všetko ako prečítané",
	"all": "Všetko",
	"mentions": "Zmienky",
	"directNotes": "Priame poznámky",
	"notifications": "Oznámenia"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"notificationTypesLabels": {
		"all": "ทั้งหมด",
		"note": "โน้ตใหม่",
		"follow": "กำลังติดตาม",
		"mention": "กล่าวถึง",
		"reply": "ตอบกลับ",
		"renote": "รีโน้ต",
		"quote": "อ้างอิง",
		"reaction": "รีแอคชั่น",
		"pollEnded": "โพลสิ้นสุดแล้ว",
		"scheduledNotePosted": "โพสต์กำหนดเวลาสำเร็จ",
		"scheduledNotePostFailed": "โพสต์กำหนดเวลาล้มเหลว",
		"receiveFollowRequest": "ได้รับคำร้องขอติดตาม",
		"followRequestAccepted": "อนุมัติให้ติดตามแล้ว",
		"roleAssigned": "ให้บทบาท",
		"chatRoomInvitationReceived": "เชิญเข้าห้องแชต",
		"achievementEarned": "ปลดล็อกความสำเร็จแล้ว",
		"exportCompleted": "กระบวนการส่งออกข้อมูลได้เสร็จสิ้นสมบูรณ์แล้ว",
		"login": "เข้าสู่ระบบ",
		"createToken": "สร้างโทเค็นการเข้าถึง",
		"test": "ทดสอบระบบแจ้งเตือน",
		"app": "การแจ้งเตือนจากแอปที่มีลิงก์"
	},
	"clear": "ล้าง",
	"filter": "กรอง",
	"markAllAsRead": "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว",
	"all": "ทั้งหมด",
	"mentions": "กล่าวถึงคุณ",
	"directNotes": "โพสต์แบบไดเร็กต์",
	"notifications": "เเจ้งเตือน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"notificationTypesLabels": {
		"all": "Tümü",
		"note": "Yeni notlar",
		"follow": "Yeni takipçiler",
		"mention": "Bahsetmeler",
		"reply": "Yanıtlar",
		"renote": "Renote",
		"quote": "Alıntılar",
		"reaction": "Tepki",
		"pollEnded": "Anketler sona eriyor",
		"scheduledNotePosted": "Planlanan gönderi başarılı",
		"scheduledNotePostFailed": "Planlanan gönderi başarısız oldu",
		"receiveFollowRequest": "Takip istekleri alındı",
		"followRequestAccepted": "Kabul edilen takip istekleri",
		"roleAssigned": "Verilen rol",
		"chatRoomInvitationReceived": "Sohbet odasına davet edildi",
		"achievementEarned": "Başarı kilidi açıldı",
		"exportCompleted": "İhracat işlemi tamamlandı.",
		"login": "Oturum Aç",
		"createToken": "Erişim jetonu oluştur",
		"test": "Bildirim testi",
		"app": "Bağlı uygulamalardan gelen bildirimler"
	},
	"clear": "Temizle",
	"filter": "Filtre",
	"markAllAsRead": "Tümünü okundu olarak işaretle",
	"all": "Tümü",
	"mentions": "Bahsetmeler",
	"directNotes": "Doğrudan notlar",
	"notifications": "Bildirimler"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"notificationTypesLabels": {
		"all": "All",
		"note": "New notes",
		"follow": "New followers",
		"mention": "Mentions",
		"reply": "Replies",
		"renote": "Renotes",
		"quote": "Quotes",
		"reaction": "Reactions",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Received follow requests",
		"followRequestAccepted": "Accepted follow requests",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "كىرىش",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Notifications from linked apps"
	},
	"clear": "Return",
	"filter": "Filter",
	"markAllAsRead": "Mark all as read",
	"all": "All",
	"mentions": "Mentions",
	"directNotes": "Direct notes",
	"notifications": "Notifications"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"notificationTypesLabels": {
		"all": "Все",
		"note": "New notes",
		"follow": "Підписки",
		"mention": "Згадка",
		"reply": "Відповіді",
		"renote": "Поширення",
		"quote": "Цитування",
		"reaction": "Реакції",
		"pollEnded": "Polls ending",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Запити на підписку",
		"followRequestAccepted": "Прийняті підписки",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Achievement unlocked",
		"exportCompleted": "The export has been completed",
		"login": "Увійти",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Сповіщення від додатків"
	},
	"clear": "Очистити",
	"filter": "Фільтр",
	"markAllAsRead": "Позначити всі як прочитані",
	"all": "Всі",
	"mentions": "Згадки",
	"directNotes": "Прямі повідомлення",
	"notifications": "Сповіщення"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"notificationTypesLabels": {
		"all": "Toàn bộ",
		"note": "New notes",
		"follow": "Đang theo dõi",
		"mention": "Nhắc đến",
		"reply": "Lượt trả lời",
		"renote": "Đăng lại",
		"quote": "Trích dẫn",
		"reaction": "Biểu cảm",
		"pollEnded": "Bình chọn kết thúc",
		"scheduledNotePosted": "Scheduled note was successful",
		"scheduledNotePostFailed": "Scheduled note failed",
		"receiveFollowRequest": "Yêu cầu theo dõi",
		"followRequestAccepted": "Yêu cầu theo dõi được chấp nhận",
		"roleAssigned": "Role given",
		"chatRoomInvitationReceived": "Invited to chat room",
		"achievementEarned": "Hoàn thành Achievement",
		"exportCompleted": "The export has been completed",
		"login": "Đăng nhập",
		"createToken": "Create access token",
		"test": "Notification test",
		"app": "Từ app liên kết"
	},
	"clear": "Hoàn lại",
	"filter": "Bộ lọc",
	"markAllAsRead": "Đánh dấu tất cả đã đọc",
	"all": "Tất cả",
	"mentions": "Lượt nhắc",
	"directNotes": "Nhắn riêng",
	"notifications": "Thông báo"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"notificationTypesLabels": {
		"all": "全部",
		"note": "用户的新帖子",
		"follow": "关注中",
		"mention": "提及",
		"reply": "回复",
		"renote": "转贴",
		"quote": "引用",
		"reaction": "回应",
		"pollEnded": "问卷调查结束",
		"scheduledNotePosted": "定时发送成功",
		"scheduledNotePostFailed": "定时发送失败",
		"receiveFollowRequest": "收到关注请求",
		"followRequestAccepted": "关注请求已通过",
		"roleAssigned": "授予的角色",
		"chatRoomInvitationReceived": "您已被邀请加入群聊",
		"achievementEarned": "取得的成就",
		"exportCompleted": "已完成导出",
		"login": "登录",
		"createToken": "创建访问令牌",
		"test": "测试通知",
		"app": "关联应用的通知"
	},
	"clear": "清除",
	"filter": "筛选",
	"markAllAsRead": "全部标记为已读",
	"all": "全部",
	"mentions": "提到我的",
	"directNotes": "私信",
	"notifications": "通知"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"notificationTypesLabels": {
		"all": "全部 ",
		"note": "使用者的最新貼文",
		"follow": "追隨中",
		"mention": "提及",
		"reply": "回覆",
		"renote": "轉發",
		"quote": "引用",
		"reaction": "反應",
		"pollEnded": "問卷調查結束",
		"scheduledNotePosted": "預約發佈成功",
		"scheduledNotePostFailed": "預約發佈失敗",
		"receiveFollowRequest": "已收到追隨請求",
		"followRequestAccepted": "追隨請求已接受",
		"roleAssigned": "已授予角色",
		"chatRoomInvitationReceived": "已被邀請加入聊天室",
		"achievementEarned": "獲得成就",
		"exportCompleted": "已完成匯出。",
		"login": "登入",
		"createToken": "建立存取權杖",
		"test": "通知測試",
		"app": "應用程式通知"
	},
	"clear": "清除",
	"filter": "篩選",
	"markAllAsRead": "全部標示為已讀",
	"all": "全部",
	"mentions": "提及",
	"directNotes": "指定使用者",
	"notifications": "通知"
}
</locale>
