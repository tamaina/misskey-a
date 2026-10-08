<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:withOkButton="true"
	:okButtonDisabled="false"
	@ok="ok()"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.notificationSetting }}</template>

	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<div class="_gaps_m">
			<MkInfo>{{ $locale.sfc.notificationSettingDesc }}</MkInfo>
			<div class="_buttons">
				<MkButton inline @click="disableAll">{{ $locale.sfc.disableAll }}</MkButton>
				<MkButton inline @click="enableAll">{{ $locale.sfc.enableAll }}</MkButton>
			</div>
			<MkSwitch v-for="ntype in notificationTypes" :key="ntype" v-model="typesMap[ntype].value">{{ copyLocaleDictionary($locale.sfc.notificationTypesLabels)[ntype] }}</MkSwitch>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import { notificationTypes } from 'misskey-js';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import type { Ref } from 'vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';

type TypesMap = Record<typeof notificationTypes[number], Ref<boolean>>;

const emit = defineEmits<{
	(ev: 'done', v: { excludeTypes: typeof notificationTypes[number][] }): void,
	(ev: 'closed'): void,
}>();

const props = withDefaults(defineProps<{
	excludeTypes?: typeof notificationTypes[number][];
}>(), {
	excludeTypes: () => [],
});

const dialog = useTemplateRef('dialog');

const typesMap = notificationTypes.reduce((p, t) => ({ ...p, [t]: ref<boolean>(!props.excludeTypes.includes(t)) }), {} as TypesMap);

function ok() {
	emit('done', {
		excludeTypes: (Object.keys(typesMap) as typeof notificationTypes[number][])
			.filter(type => !typesMap[type].value),
	});

	if (dialog.value) dialog.value.close();
}

function disableAll() {
	for (const type of notificationTypes) {
		typesMap[type].value = false;
	}
}

function enableAll() {
	for (const type of notificationTypes) {
		typesMap[type].value = true;
	}
}
</script>

<locale lang="json" locale="ar-SA">
{
	"notificationSetting": "إعدادات التنبيهات",
	"notificationSettingDesc": "اختر نوع التنبيهات المراد عرضها",
	"disableAll": "تعطيل الكل",
	"enableAll": "تشغيل الكل",
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
	}
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"notificationSetting": "Paràmetres de notificacions",
	"notificationSettingDesc": "Selecciona els tipus de notificacions que es mostraran",
	"disableAll": "Deshabilita tot",
	"enableAll": "Habilita tot",
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
	}
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"notificationSetting": "Nastavení oznámení",
	"notificationSettingDesc": "Vyberte typy oznámení k zobrazení.",
	"disableAll": "Vypnout vše",
	"enableAll": "Povolit vše",
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
	}
}
</locale>

<locale lang="json" locale="da-DK">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display.",
	"disableAll": "Disable all",
	"enableAll": "Enable all",
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
	}
}
</locale>

<locale lang="json" locale="de-DE">
{
	"notificationSetting": "Benachrichtigungseinstellungen",
	"notificationSettingDesc": "Wähle die Art der anzuzeigenden Benachrichtigungen.",
	"disableAll": "Alle deaktivieren",
	"enableAll": "Alle aktivieren",
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
	}
}
</locale>

<locale lang="json" locale="en-US">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display.",
	"disableAll": "Disable all",
	"enableAll": "Enable all",
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
	}
}
</locale>

<locale lang="json" locale="es-ES">
{
	"notificationSetting": "Ajustes de Notificaciones",
	"notificationSettingDesc": "Por favor elige el tipo de notificación a mostrar",
	"disableAll": "Desactivar todo",
	"enableAll": "Activar todo",
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
	}
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"notificationSetting": "Paramètres des notifications ",
	"notificationSettingDesc": "Sélectionnez le type de notification à afficher",
	"disableAll": "Tout désactiver",
	"enableAll": "Tout activer",
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
	}
}
</locale>

<locale lang="json" locale="id-ID">
{
	"notificationSetting": "Pengaturan Notifikasi",
	"notificationSettingDesc": "Pilih tipe notifikasi untuk ditampilkan",
	"disableAll": "Nonaktifkan semua",
	"enableAll": "Aktifkan semua",
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
	}
}
</locale>

<locale lang="json" locale="it-IT">
{
	"notificationSetting": "Impostazioni notifiche",
	"notificationSettingDesc": "Scegli quali notifiche mostrare.",
	"disableAll": "Disabilitare tutto",
	"enableAll": "Abilita tutto",
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
	}
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"notificationSetting": "通知設定",
	"notificationSettingDesc": "表示する通知の種別を選択してください。",
	"disableAll": "全て無効にする",
	"enableAll": "全て有効にする",
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
	}
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"notificationSetting": "通知設定",
	"notificationSettingDesc": "出す通知の種類えらんでや。",
	"disableAll": "全部使えへんようにする",
	"enableAll": "全部使えるようにする",
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
	}
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display.",
	"disableAll": "Disable all",
	"enableAll": "Enable all",
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
	}
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display.",
	"disableAll": "Disable all",
	"enableAll": "Enable all",
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
	}
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"notificationSetting": "알림 설정",
	"notificationSettingDesc": "표시할 알림의 종류를 선택해 주세요.",
	"disableAll": "전체 해제",
	"enableAll": "전체 선택",
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
	}
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"notificationSetting": "Instellingen meldingen",
	"notificationSettingDesc": "Selecteer het type meldingen dat moet worden weergegeven.",
	"disableAll": "Alle deactiveren",
	"enableAll": "Alle activeren",
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
	}
}
</locale>

<locale lang="json" locale="no-NO">
{
	"notificationSetting": "Varslingsinnstillinger",
	"notificationSettingDesc": "Select the types of notification to display.",
	"disableAll": "Disable all",
	"enableAll": "Enable all",
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
	}
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"notificationSetting": "Ustawienia powiadomień",
	"notificationSettingDesc": "Wybierz rodzaj powiadomień do wyświetlania",
	"disableAll": "Wyłącz wszystko",
	"enableAll": "Włącz wszystko",
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
	}
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"notificationSetting": "Configurações de notificação",
	"notificationSettingDesc": "Selecione o tipo de notificação a ser exibido.",
	"disableAll": "Desabilitar tudo",
	"enableAll": "Habilitar tudo",
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
	}
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"notificationSetting": "Настройки уведомлений",
	"notificationSettingDesc": "Выберите тип уведомлений для отображения",
	"disableAll": "Выключить всё",
	"enableAll": "Включить все",
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
	}
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"notificationSetting": "Nastavenia oznámení",
	"notificationSettingDesc": "Vyberte typ oznámení na zobrazenie",
	"disableAll": "Vypnúť všetko",
	"enableAll": "Povoliť všetko",
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
	}
}
</locale>

<locale lang="json" locale="th-TH">
{
	"notificationSetting": "ตั้งค่าการแจ้งเตือน",
	"notificationSettingDesc": "เลือกประเภทการแจ้งเตือนที่ต้องการจะแสดง",
	"disableAll": "ปิดการใช้งานทั้งหมด",
	"enableAll": "เปิดใช้งานทั้งหมด",
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
	}
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"notificationSetting": "Bildirim ayarları",
	"notificationSettingDesc": "Görüntülemek istediğiniz bildirim türlerini seçin.",
	"disableAll": "Tümünü devre dışı bırak",
	"enableAll": "Tümünü etkinleştir",
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
	}
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display.",
	"disableAll": "Disable all",
	"enableAll": "Enable all",
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
	}
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"notificationSetting": "Параметри сповіщень",
	"notificationSettingDesc": "Виберіть типи сповіщень для відображення",
	"disableAll": "Вимкнути все",
	"enableAll": "Увімкнути все",
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
	}
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"notificationSetting": "Cài đặt thông báo",
	"notificationSettingDesc": "Chọn loại thông báo bạn muốn hiển thị.",
	"disableAll": "Tắt toàn bộ",
	"enableAll": "Bật toàn bộ",
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
	}
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"notificationSetting": "通知设置",
	"notificationSettingDesc": "选择要显示的通知类型。",
	"disableAll": "禁用全部",
	"enableAll": "启用全部",
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
	}
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"notificationSetting": "通知設定",
	"notificationSettingDesc": "選擇顯示通知的類型",
	"disableAll": "停用全部",
	"enableAll": "啟用全部",
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
	}
}
</locale>
