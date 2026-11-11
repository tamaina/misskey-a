<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/notifications" :label="globalLocale.env.notifications" :keywords="['notifications']" icon="ti ti-bell">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f514.png" color="#ffff00">
			<SearchText>{{ $locale.sfc.settingsNotificationsBanner }}</SearchText>
		</MkFeatureBanner>

		<FormSection first>
			<template #label>{{ $locale.sfc.notificationRecieveConfig }}</template>
			<div class="_gaps_s">
				<MkFolder v-for="type in configurableNotificationTypes" :key="type">
					<template #label>{{ copyLocaleDictionary(globalLocale.env._notification._types)[type] }}</template>
					<template #suffix>
						{{
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'never' ? globalLocale.env.none :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'following' ? globalLocale.env.following :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'follower' ? globalLocale.env.followers :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'mutualFollow' ? $locale.sfc.mutualFollow :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'followingOrFollower' ? $locale.sfc.followingOrFollower :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'list' ? $locale.sfc.userList :
							globalLocale.env.all
						}}
					</template>

					<XNotificationConfig
						:userLists="userLists"
						:value="$i.notificationRecieveConfig[type] ?? { type: 'all' }"
						:configurableTypes="(onlyOnOrOffNotificationTypes as string[]).includes(type) ? ['all', 'never'] : undefined"
						@update="(res) => updateReceiveConfig(type, res)"
					/>
				</MkFolder>
			</div>
		</FormSection>

		<FormSection>
			<SearchMarker
				:keywords="['notify', 'hide', 'user']"
			>
				<MkFolder>
					<template #label><SearchLabel>{{ $locale.sfc.notifyUsers }}</SearchLabel></template>
					<MkPagination v-slot="{items}" :paginator="notifyUserPaginator" withControl>
						<div class="_gaps_s">
							<div v-for="item in items" :key="item.id">
								<div :class="$style.userItemMain">
									<MkA :class="$style.userItemMainBody" :to="userPage(item.followee!)">
										<MkUserCardMini :user="item.followee!"/>
									</MkA>
									<button class="_button" :class="$style.notifyMenu" @click="showNotifyMenu(item.followee!, $event)"><i class="ti ti-dots"></i></button>
								</div>
							</div>
						</div>
					</MkPagination>
				</MkFolder>
			</SearchMarker>
		</FormSection>
		<FormSection>
			<div class="_gaps_m">
				<FormLink to="/settings/sounds">{{ $locale.sfc.notificationSoundSettings }}</FormLink>
			</div>
		</FormSection>
		<FormSection>
			<div class="_gaps_s">
				<MkButton @click="readAllNotifications">{{ $locale.sfc.markAsReadAllNotifications }}</MkButton>
				<MkButton @click="testNotification">{{ $locale.sfc.notificationSendTestNotification }}</MkButton>
				<MkButton @click="flushNotification">{{ $locale.sfc.notificationFlushNotification }}</MkButton>
			</div>
		</FormSection>
		<FormSection>
			<template #label>{{ $locale.sfc.pushNotification }}</template>

			<div class="_gaps_m">
				<MkPushNotificationAllowButton ref="allowButton"/>
				<MkSwitch :disabled="!pushRegistrationInServer" :modelValue="sendReadMessage" @update:modelValue="onChangeSendReadMessage">
					<template #label>{{ $locale.sfc.sendPushNotificationReadMessage }}</template>
					<template #caption>{{ $locale.sfc.sendPushNotificationReadMessageCaption }}</template>
				</MkSwitch>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { useTemplateRef, computed, ref, markRaw } from 'vue';
import { notificationTypes } from 'misskey-js';
import * as Misskey from 'misskey-js';
import XNotificationConfig from '@features/notifications/frontend/pages/settings/notifications.notification-config.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkPushNotificationAllowButton from '@features/notifications/frontend/components/MkPushNotificationAllowButton.vue';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { userPage } from '@features/users/frontend/shared/user.js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import type { NotificationConfig } from '@features/notifications/frontend/pages/settings/notifications.notification-config.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const $i = ensureSignin();

async function showNotifyMenu(user: Misskey.entities.UserDetailed, ev: PointerEvent) {
	os.popupMenu([{
		text: (user.notify === 'normal') ? $locale.value.sfc.unnotifyNotes : $locale.value.sfc.notifyNotes,
		icon: (user.notify === 'normal') ? 'ti ti-x' : 'ti ti-plus',
		action: async () => {
			await os.apiWithDialog('following/update', {
				userId: user.id,
				notify: user.notify === 'normal' ? 'none' : 'normal',
			}).then(() => {
				user.notify = user.notify === 'normal' ? 'none' : 'normal';
			});
		},
	}], ev.currentTarget ?? ev.target);
}

const notifyUserPaginator = markRaw(new Paginator('following/list', {
	limit: 10,
	params: {
		notification: true,
	},
}));

const nonConfigurableNotificationTypes = ['note', 'roleAssigned', 'followRequestAccepted', 'test', 'exportCompleted'] as const satisfies (typeof notificationTypes[number])[];

const configurableNotificationTypes = notificationTypes.filter(type => !nonConfigurableNotificationTypes.includes(type as any)) as Exclude<typeof notificationTypes[number], typeof nonConfigurableNotificationTypes[number]>[];

const onlyOnOrOffNotificationTypes = ['app', 'achievementEarned', 'login', 'createToken', 'scheduledNotePosted', 'scheduledNotePostFailed'] as const satisfies (typeof notificationTypes[number])[];

const allowButton = useTemplateRef('allowButton');
const pushRegistrationInServer = computed(() => allowButton.value?.pushRegistrationInServer);
const sendReadMessage = computed(() => pushRegistrationInServer.value?.sendReadMessage || false);
const userLists = await misskeyApi('users/lists/list');

async function readAllNotifications() {
	await os.apiWithDialog('notifications/mark-all-as-read', {});
}

async function updateReceiveConfig(type: typeof notificationTypes[number], value: NotificationConfig) {
	await os.apiWithDialog('i/update', {
		notificationRecieveConfig: {
			...$i.notificationRecieveConfig,
			[type]: value,
		},
	}).then(i => {
		$i.notificationRecieveConfig = i.notificationRecieveConfig;
	});
}

function onChangeSendReadMessage(v: boolean) {
	if (!pushRegistrationInServer.value) return;

	os.apiWithDialog('sw/update-registration', {
		endpoint: pushRegistrationInServer.value.endpoint,
		sendReadMessage: v,
	}).then(res => {
		if (!allowButton.value)	return;
		allowButton.value.pushRegistrationInServer = res;
	});
}

function testNotification(): void {
	misskeyApi('notifications/test-notification');
}

async function flushNotification() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: globalLocale.value.env.resetAreYouSure,
	});

	if (canceled) return;

	os.apiWithDialog('notifications/flush', {});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: globalLocale.value.env.notifications,
	icon: 'ti ti-bell',
}));
</script>

<style lang="scss" module>
.userItemMain {
	display: flex;
}

.userItemMainBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}

.notifyMenu {
	width: 32px;
	height: 32px;
	align-self: center;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "القوائم",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "وضع جميع الإشعارات كأنها مقروءة",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "إرسال الإشعارات",
	"sendPushNotificationReadMessage": "احذف الإشعارات فور قراءتها",
	"sendPushNotificationReadMessageCaption": "هذا قد يزيد من معدل استهلاك الطاقة لجهازك.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"settingsNotificationsBanner": "Pots configurar el tipus i l'abast de les notificacions que es rebran del servidor, també les notificacions emergents.",
	"notificationRecieveConfig": "Paràmetres de notificacions",
	"mutualFollow": "Seguidor mutu",
	"followingOrFollower": "Seguint o seguidor",
	"userList": "Llistes",
	"notifyUsers": "Usuaris que han activat les notificacions de publicacions",
	"notificationSoundSettings": "Configuració del so de notificació",
	"markAsReadAllNotifications": "Marca totes les notificacions com a llegides",
	"notificationSendTestNotification": "Enviar notificació de prova",
	"notificationFlushNotification": "Netejar notificacions",
	"pushNotification": "Enviament de notificacions",
	"sendPushNotificationReadMessage": "Esborrar les notificacions enviades quan s'hagin llegit",
	"sendPushNotificationReadMessageCaption": "Això pot fer que el teu dispositiu consumeixi més bateria",
	"unnotifyNotes": "Deixar de notificar quan hi hagi notes noves",
	"notifyNotes": "Notificar quan hi hagi notes noves"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Seznamy",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Označit všechna oznámení za přečtená",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push oznámení",
	"sendPushNotificationReadMessage": "Odstraněnit oznámení push po jejich přečtení",
	"sendPushNotificationReadMessageCaption": "Tohle může zvýšit spotřebu energie vašeho zařízení.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"settingsNotificationsBanner": "Sie können die Arten und den Umfang der Benachrichtigungen vom Server und der Push- Mitteilungen konfigurieren.",
	"notificationRecieveConfig": "Benachrichtigungseinstellungen",
	"mutualFollow": "Gegenseitig gefolgt",
	"followingOrFollower": "Follow oder Follower",
	"userList": "Liste",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Benachrichtigungston festlegen",
	"markAsReadAllNotifications": "Alle Benachrichtigungen als gelesen markieren",
	"notificationSendTestNotification": "Testbenachrichtigung senden",
	"notificationFlushNotification": "Benachrichtigungen löschen",
	"pushNotification": "Push-Benachrichtigungen",
	"sendPushNotificationReadMessage": "Push-Benachrichtigungen löschen, sobald sie gelesen wurden",
	"sendPushNotificationReadMessageCaption": "Dies kann gegebenenfalls den Batterieverbrauch deines Gerätes erhöhen.",
	"unnotifyNotes": "Nicht über neue Notizen benachrichtigen",
	"notifyNotes": "Über neue Notizen benachrichtigen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"settingsNotificationsBanner": "Puede configurar los tipos y el alcance de las notificaciones del servidor y las notificaciones push.",
	"notificationRecieveConfig": "Ajustes de Notificaciones",
	"mutualFollow": "Os seguís mutuamente",
	"followingOrFollower": "Siguiendo o seguidor",
	"userList": "Lista",
	"notifyUsers": "Cuentas con notificaciones activadas",
	"notificationSoundSettings": "Configuración del sonido de las notificaciones",
	"markAsReadAllNotifications": "Marcar todas las notificaciones como leídas",
	"notificationSendTestNotification": "Enviar notificación de prueba",
	"notificationFlushNotification": "Limpiar notificaciones",
	"pushNotification": "Alerta emergente",
	"sendPushNotificationReadMessage": "Eliminar las notificaciones push después de leer las notificaciones y los mensajes",
	"sendPushNotificationReadMessageCaption": "La notificación \"{emptyPushNotificationMessage}\" aparecerá momentáneamente. Esto puede aumentar el consumo de batería del dispositivo.",
	"unnotifyNotes": "Dejar de notificar nuevas notas",
	"notifyNotes": "Notificar nuevas notas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Paramètres des notifications",
	"mutualFollow": "Abonnement mutuel",
	"followingOrFollower": "Abonnement ou abonné",
	"userList": "Listes",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Marquer toutes les notifications comme lues",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Notifications push",
	"sendPushNotificationReadMessage": "Supprimer les notifications push une fois que les notifications ou messages pertinents ont été lus.",
	"sendPushNotificationReadMessageCaption": "Cela peut augmenter la consommation de batterie de votre appareil.",
	"unnotifyNotes": "Ne pas notifier pour la publication des notes",
	"notifyNotes": "Notifier à propos des nouvelles notes"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"settingsNotificationsBanner": "Anda dapat mengatur tipe dan rentang notifikasi dari peladen dan notifikasi push.",
	"notificationRecieveConfig": "Pengaturan notifikasi",
	"mutualFollow": "Saling mengikuti",
	"followingOrFollower": "Mengikuti atau pengikut",
	"userList": "Daftar",
	"notifyUsers": "Pengguna dengan notifikasi pos yang dinyalakan",
	"notificationSoundSettings": "Pengaturan suara notifikasi",
	"markAsReadAllNotifications": "Tandai semua notifikasi telah dibaca",
	"notificationSendTestNotification": "Kirim tes notifikasi",
	"notificationFlushNotification": "Bersihkan notifikasi",
	"pushNotification": "Notifikasi dorong",
	"sendPushNotificationReadMessage": "Hapus notifikasi dorong ketika notifikasi relevan atau pesan telah dibaca",
	"sendPushNotificationReadMessageCaption": "Notifikasi berisi teks「{emptyPushNotificationMessage}」akan ditampilkan dalam waktu pendek. Ini mungkin dapat menambah pemakaian baterai pada perangkat kamu.",
	"unnotifyNotes": "Berhenti memberitahu mengenai catatan baru",
	"notifyNotes": "Beritahu mengenai catatan baru"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"settingsNotificationsBanner": "Puoi impostare il tipo di notifiche da ricevere dal server e anche le notifiche push.",
	"notificationRecieveConfig": "Preferenze di notifica",
	"mutualFollow": "Follow reciproco",
	"followingOrFollower": "Following o Follower",
	"userList": "Liste",
	"notifyUsers": "Persone che hanno attivato le notifiche di pubblicazione",
	"notificationSoundSettings": "Preferenze di notifica",
	"markAsReadAllNotifications": "Segnare tutte le notifiche come lette",
	"notificationSendTestNotification": "Spedisci una notifica di prova",
	"notificationFlushNotification": "Azzera le notifiche",
	"pushNotification": "Notifiche Push",
	"sendPushNotificationReadMessage": "Eliminare le notifiche push dopo la relativa lettura",
	"sendPushNotificationReadMessageCaption": "Se possibile, verrà mostrata brevemente una notifica con il testo \"{emptyPushNotificationMessage}\". Potrebbe influire negativamente sulla durata della batteria.",
	"unnotifyNotes": "Interrompi le notifiche di nuove Note",
	"notifyNotes": "Notifica nuove Note"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"settingsNotificationsBanner": "サーバーからの受信する通知の種類と範囲や、プッシュ通知の設定が行えます。",
	"notificationRecieveConfig": "通知の受信設定",
	"mutualFollow": "相互フォロー",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト",
	"notifyUsers": "投稿通知を設定したユーザー",
	"notificationSoundSettings": "通知音の設定",
	"markAsReadAllNotifications": "すべての通知を既読にする",
	"notificationSendTestNotification": "テスト通知を送信する",
	"notificationFlushNotification": "通知の履歴をリセットする",
	"pushNotification": "プッシュ通知",
	"sendPushNotificationReadMessage": "通知が既読になったらプッシュ通知を削除する",
	"sendPushNotificationReadMessageCaption": "端末の電池消費量が増加する可能性があります。",
	"unnotifyNotes": "投稿の通知を解除",
	"notifyNotes": "投稿を通知"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"settingsNotificationsBanner": "サーバーから受け取る通知の種類とか範囲、プッシュ通知の設定ができるで。",
	"notificationRecieveConfig": "通知もらうかの設定",
	"mutualFollow": "お互いフォローしてんで",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト",
	"notifyUsers": "投稿通知を設定したユーザー",
	"notificationSoundSettings": "通知音の設定",
	"markAsReadAllNotifications": "通知はもう全部読んだわ",
	"notificationSendTestNotification": "テスト通知を送信するで",
	"notificationFlushNotification": "通知の履歴をリセットする",
	"pushNotification": "プッシュ通知",
	"sendPushNotificationReadMessage": "通知やメッセージが既読になったらプッシュ通知を消すで",
	"sendPushNotificationReadMessageCaption": "あんたの端末の電池使う量が増えるかもしれん。",
	"unnotifyNotes": "投稿の通知やめる",
	"notifyNotes": "投稿を通知"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Tibdarin",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"settingsNotificationsBanner": "서버에서 받는 알림의 종류 및 범위, 푸시 알림 설정을 합니다.",
	"notificationRecieveConfig": "알림 설정",
	"mutualFollow": "맞팔로우",
	"followingOrFollower": "팔로 중이거나 팔로워",
	"userList": "리스트",
	"notifyUsers": "게시물 알림을 설정한 사용자",
	"notificationSoundSettings": "알림 설정",
	"markAsReadAllNotifications": "모든 알림을 읽은 상태로 표시",
	"notificationSendTestNotification": "테스트 알림 보내기",
	"notificationFlushNotification": "알림 이력을 초기화",
	"pushNotification": "푸시 알림",
	"sendPushNotificationReadMessage": "푸시 알림이나 메시지를 읽은 뒤 푸시 알림을 삭제",
	"sendPushNotificationReadMessageCaption": "「{emptyPushNotificationMessage}」이라는 알림이 잠깐 표시됩니다. 기기의 전력 소비량이 증가할 수 있습니다.",
	"unnotifyNotes": "새 노트 알림 끄기",
	"notifyNotes": "새 노트 알림 켜기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Gevolgd of volger",
	"userList": "Lijsten",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Markeer alle meldingen als gelezen",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Pushberichten",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lister",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Merk alle varsler som lest",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push-varsler",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Listy",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Oznacz wszystkie powiadomienia jako przeczytane",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Powiadomienia",
	"sendPushNotificationReadMessage": "Usuń powiadomienia push po przeczytaniu powiadomień i wiadomości.",
	"sendPushNotificationReadMessageCaption": "Chwilowo pojawi się powiadomienie \"{emptyPushNotificationMessage}\". Może wzrosnąć zużycie baterii urządzenia.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"settingsNotificationsBanner": "Você pode configurar os tipos e intervalo das notificações do servidor, além de notificações push.",
	"notificationRecieveConfig": "Configurações de Notificação",
	"mutualFollow": "Seguidor mútuo",
	"followingOrFollower": "Seguidor ou usuário seguido",
	"userList": "Listas",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Configurações de som de notificações",
	"markAsReadAllNotifications": "Marcar todas as notificações como lidas",
	"notificationSendTestNotification": "Enviar notificação de teste",
	"notificationFlushNotification": "Limpar notificações",
	"pushNotification": "Notificações Push",
	"sendPushNotificationReadMessage": "Apagar notificações push quando elas foram lidas",
	"sendPushNotificationReadMessageCaption": "Pode aumentar o consumo de energia do dispositivo.",
	"unnotifyNotes": "Deixar de notificar sobre novas notas",
	"notifyNotes": "Notificar sobre novas notas"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Настроить оповещения",
	"mutualFollow": "Взаимные подписки",
	"followingOrFollower": "Подписки или подписчики",
	"userList": "Списки",
	"notifyUsers": "Пользователи с включёнными уведомлениями о заметках",
	"notificationSoundSettings": "Настройки звука уведомлений",
	"markAsReadAllNotifications": "Отметить все уведомления как прочитанные",
	"notificationSendTestNotification": "Отправить тестовое уведомление",
	"notificationFlushNotification": "Очистить уведомления",
	"pushNotification": "Push-уведомления",
	"sendPushNotificationReadMessage": "Удалять push-уведомления когда сообщение или прочитано",
	"sendPushNotificationReadMessageCaption": "На мгновение появится уведомление \"{emptyPushNotificationMessage}\". Расход заряда батареи может увеличиться ",
	"unnotifyNotes": "Отписаться от сообщений",
	"notifyNotes": "Оповещать о публикациях"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Zoznamy",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Označiť všetky oznámenia ako prečítané",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifikácie",
	"sendPushNotificationReadMessage": "Odstrániť push notifikácie po ich prečítaní",
	"sendPushNotificationReadMessageCaption": "Na chvíľu sa zobrazí oznámenie \"{emptyPushNotificationMessage}\". Môže to zvýšiť spotrebu batérie zariadenia.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"settingsNotificationsBanner": "สามารถตั้งค่าประเภทและขอบเขตของการแจ้งเตือนที่รับจากเซิร์ฟเวอร์ รวมถึงการแจ้งเตือนแบบพุช",
	"notificationRecieveConfig": "การตั้งค่าการแจ้งเตือน",
	"mutualFollow": "ติดตามซึ่งกันและกัน",
	"followingOrFollower": "กำลังติดตามหรือผู้ติดตาม",
	"userList": "ลิสต์",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "ตั้งค่าเสียงแจ้งเตือน",
	"markAsReadAllNotifications": "ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว",
	"notificationSendTestNotification": "ส่งทดสอบการแจ้งเตือน",
	"notificationFlushNotification": "ล้างประวัติการแจ้งเตือน",
	"pushNotification": "การแจ้งเตือนแบบพุช",
	"sendPushNotificationReadMessage": "ลบการแจ้งเตือนแบบพุชเมื่ออ่านการแจ้งเตือนหรือข้อความที่เกี่ยวข้องแล้ว",
	"sendPushNotificationReadMessageCaption": "อาจทำให้อุปกรณ์ของคุณใช้พลังงานมากขึ้น",
	"unnotifyNotes": "หยุดการแจ้งเตือนเกี่ยวกับโน้ตใหม่",
	"notifyNotes": "แจ้งเตือนเกี่ยวกับโพสต์ใหม่"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"settingsNotificationsBanner": "Sunucudan gelen bildirimlerin türlerini ve kapsamını ve push bildirimlerini yapılandırabilirsin.",
	"notificationRecieveConfig": "Bildirim Ayarları",
	"mutualFollow": "Karşılıklı takip",
	"followingOrFollower": "Takip eden veya takipçi",
	"userList": "Listeler",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Bildirim sesi ayarları",
	"markAsReadAllNotifications": "Tüm bildirimleri okundu olarak işaretle",
	"notificationSendTestNotification": "Test bildirimi gönder",
	"notificationFlushNotification": "Bildirimleri temizle",
	"pushNotification": "Push bildirimleri",
	"sendPushNotificationReadMessage": "Okunduktan sonra push bildirimlerini silin",
	"sendPushNotificationReadMessageCaption": "Bu, cihazınızın güç tüketimini artırabilir.",
	"unnotifyNotes": "Yeni notlar hakkında bildirim almayı durdur",
	"notifyNotes": "Yeni notlar hakkında bildirimde bulun"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"settingsNotificationsBanner": "Ви можете налаштовувати типи та кількість сповіщень від сервера також як і спливні сповіщення.",
	"notificationRecieveConfig": "Налаштування сповіщень",
	"mutualFollow": "Взаємна підписка",
	"followingOrFollower": "Підписки або підписники",
	"userList": "Списки",
	"notifyUsers": "Користувачі, які ввімкнули сповіщення про публікації",
	"notificationSoundSettings": "Вибрати звук сповіщення",
	"markAsReadAllNotifications": "Позначити всі сповіщення як прочитані",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push сповіщення",
	"sendPushNotificationReadMessage": "Видаляти push-сповіщення після прочитання",
	"sendPushNotificationReadMessageCaption": "Це може збільшити споживання енергії вашим пристроєм.",
	"unnotifyNotes": "Припинити сповіщати про нові нотатки",
	"notifyNotes": "Сповіщати про нові нотатки"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Cài đặt thông báo",
	"mutualFollow": "Theo dõi lẫn nhau",
	"followingOrFollower": "Đang theo dõi hoặc người theo dõi",
	"userList": "Danh sách",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Cài đặt âm thanh thông báo",
	"markAsReadAllNotifications": "Đánh dấu tất cả các thông báo là đã đọc",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Thông báo đẩy",
	"sendPushNotificationReadMessage": "Xóa thông báo đẩy sau khi đọc thông báo hay tin nhắn",
	"sendPushNotificationReadMessageCaption": "Thông báo như {emptyPushNotificationMessage} sẽ hiển thị trong giây phút. Tiêu tốn pin của máy bạn có thể tăng lên hơn nữa.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"settingsNotificationsBanner": "可在此设置从服务器接收的通知的种类和范围，以及推送通知的设置。",
	"notificationRecieveConfig": "通知接收设置",
	"mutualFollow": "互相关注",
	"followingOrFollower": "关注中或关注者",
	"userList": "列表",
	"notifyUsers": "已开启发帖通知的用户",
	"notificationSoundSettings": "设置通知声音",
	"markAsReadAllNotifications": "将所有通知标为已读",
	"notificationSendTestNotification": "发送测试通知",
	"notificationFlushNotification": "重置通知历史",
	"pushNotification": "推送通知",
	"sendPushNotificationReadMessage": "删除已读推送通知消息",
	"sendPushNotificationReadMessageCaption": "您终端设备的电池消耗可能会增加。",
	"unnotifyNotes": "关闭发帖通知",
	"notifyNotes": "开启发帖通知"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"settingsNotificationsBanner": "您可以設定從伺服器接收通知的類型和範圍，以及推送通知。",
	"notificationRecieveConfig": "接受通知的設定",
	"mutualFollow": "互相追隨",
	"followingOrFollower": "追隨中或追隨者",
	"userList": "使用者清單",
	"notifyUsers": "設定了貼文通知的使用者",
	"notificationSoundSettings": "設定通知音效",
	"markAsReadAllNotifications": "標記所有通知為已讀",
	"notificationSendTestNotification": "發送測試通知",
	"notificationFlushNotification": "重置通知歷史紀錄",
	"pushNotification": "推播通知",
	"sendPushNotificationReadMessage": "如果已閱讀通知與訊息，就刪除推播通知",
	"sendPushNotificationReadMessageCaption": "可能會導致裝置的電池消耗量增加。",
	"unnotifyNotes": "關閉貼文通知",
	"notifyNotes": "開啟貼文通知"
}
</locale>
