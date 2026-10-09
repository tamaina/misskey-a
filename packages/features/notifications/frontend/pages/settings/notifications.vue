<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/notifications" :label="$locale.sfc.notifications" :keywords="['notifications']" icon="ti ti-bell">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f514.png" color="#ffff00">
			<SearchText>{{ $locale.sfc.settingsNotificationsBanner }}</SearchText>
		</MkFeatureBanner>

		<FormSection first>
			<template #label>{{ $locale.sfc.notificationRecieveConfig }}</template>
			<div class="_gaps_s">
				<MkFolder v-for="type in configurableNotificationTypes" :key="type">
					<template #label>{{ copyLocaleDictionary($locale.sfc.notificationTypesLabels)[type] }}</template>
					<template #suffix>
						{{
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'never' ? $locale.sfc.none :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'following' ? $locale.sfc.following :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'follower' ? $locale.sfc.followers :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'mutualFollow' ? $locale.sfc.mutualFollow :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'followingOrFollower' ? $locale.sfc.followingOrFollower :
							$i.notificationRecieveConfig[type as (typeof configurableNotificationTypes)[number]]?.type === 'list' ? $locale.sfc.userList :
							$locale.sfc.all
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
							<div v-for="item in items" :key="item.id" :class="[$style.userItem ]">
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
import { useTemplateRef, computed, ref, markRaw } from 'vue';
import { notificationTypes } from 'misskey-js';
import * as Misskey from 'misskey-js';
import XNotificationConfig from '@features/notifications/frontend/pages/settings/notifications.notification-config.vue';
import type { NotificationConfig } from '@features/notifications/frontend/pages/settings/notifications.notification-config.vue';
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
		text: $locale.value.sfc.resetAreYouSure,
	});

	if (canceled) return;

	os.apiWithDialog('notifications/flush', {});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.notifications,
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
	"notifications": "الإشعارات",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "لا شيء",
	"following": "المتابَعون",
	"followers": "المتابِعون",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "القوائم",
	"all": "الكل",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "وضع جميع الإشعارات كأنها مقروءة",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "إرسال الإشعارات",
	"sendPushNotificationReadMessage": "احذف الإشعارات فور قراءتها",
	"sendPushNotificationReadMessageCaption": "هذا قد يزيد من معدل استهلاك الطاقة لجهازك.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "هل تريد إعادة التعيين؟"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"notifications": "Notificacions",
	"settingsNotificationsBanner": "Pots configurar el tipus i l'abast de les notificacions que es rebran del servidor, també les notificacions emergents.",
	"notificationRecieveConfig": "Paràmetres de notificacions",
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
	"none": "Res",
	"following": "Segueixes ",
	"followers": "Seguidors",
	"mutualFollow": "Seguidor mutu",
	"followingOrFollower": "Seguint o seguidor",
	"userList": "Llistes",
	"all": "Tot",
	"notifyUsers": "Usuaris que han activat les notificacions de publicacions",
	"notificationSoundSettings": "Configuració del so de notificació",
	"markAsReadAllNotifications": "Marca totes les notificacions com a llegides",
	"notificationSendTestNotification": "Enviar notificació de prova",
	"notificationFlushNotification": "Netejar notificacions",
	"pushNotification": "Enviament de notificacions",
	"sendPushNotificationReadMessage": "Esborrar les notificacions enviades quan s'hagin llegit",
	"sendPushNotificationReadMessageCaption": "Això pot fer que el teu dispositiu consumeixi més bateria",
	"unnotifyNotes": "Deixar de notificar quan hi hagi notes noves",
	"notifyNotes": "Notificar quan hi hagi notes noves",
	"resetAreYouSure": "Segur que vols restablir-ho?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"notifications": "Oznámení",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "Žádný",
	"following": "Sledovaní",
	"followers": "Sledující",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Seznamy",
	"all": "Vše",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Označit všechna oznámení za přečtená",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push oznámení",
	"sendPushNotificationReadMessage": "Odstraněnit oznámení push po jejich přečtení",
	"sendPushNotificationReadMessageCaption": "Tohle může zvýšit spotřebu energie vašeho zařízení.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Opravdu resetovat?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"notifications": "Notifications",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "None",
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"all": "All",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Really reset?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"notifications": "Benachrichtigungen",
	"settingsNotificationsBanner": "Sie können die Arten und den Umfang der Benachrichtigungen vom Server und der Push- Mitteilungen konfigurieren.",
	"notificationRecieveConfig": "Benachrichtigungseinstellungen",
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
	"none": "Nichts",
	"following": "Folgt",
	"followers": "Gefolgt von",
	"mutualFollow": "Gegenseitig gefolgt",
	"followingOrFollower": "Follow oder Follower",
	"userList": "Liste",
	"all": "Alle",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Benachrichtigungston festlegen",
	"markAsReadAllNotifications": "Alle Benachrichtigungen als gelesen markieren",
	"notificationSendTestNotification": "Testbenachrichtigung senden",
	"notificationFlushNotification": "Benachrichtigungen löschen",
	"pushNotification": "Push-Benachrichtigungen",
	"sendPushNotificationReadMessage": "Push-Benachrichtigungen löschen, sobald sie gelesen wurden",
	"sendPushNotificationReadMessageCaption": "Dies kann gegebenenfalls den Batterieverbrauch deines Gerätes erhöhen.",
	"unnotifyNotes": "Nicht über neue Notizen benachrichtigen",
	"notifyNotes": "Über neue Notizen benachrichtigen",
	"resetAreYouSure": "Wirklich zurücksetzen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"notifications": "Notifications",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "None",
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"all": "All",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Really reset?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"notifications": "Notificaciones",
	"settingsNotificationsBanner": "Puede configurar los tipos y el alcance de las notificaciones del servidor y las notificaciones push.",
	"notificationRecieveConfig": "Ajustes de Notificaciones",
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
	"none": "Ninguna",
	"following": "Siguiendo",
	"followers": "Seguidores",
	"mutualFollow": "Os seguís mutuamente",
	"followingOrFollower": "Siguiendo o seguidor",
	"userList": "Lista",
	"all": "Todo",
	"notifyUsers": "Cuentas con notificaciones activadas",
	"notificationSoundSettings": "Configuración del sonido de las notificaciones",
	"markAsReadAllNotifications": "Marcar todas las notificaciones como leídas",
	"notificationSendTestNotification": "Enviar notificación de prueba",
	"notificationFlushNotification": "Limpiar notificaciones",
	"pushNotification": "Alerta emergente",
	"sendPushNotificationReadMessage": "Eliminar las notificaciones push después de leer las notificaciones y los mensajes",
	"sendPushNotificationReadMessageCaption": "La notificación \"{emptyPushNotificationMessage}\" aparecerá momentáneamente. Esto puede aumentar el consumo de batería del dispositivo.",
	"unnotifyNotes": "Dejar de notificar nuevas notas",
	"notifyNotes": "Notificar nuevas notas",
	"resetAreYouSure": "¿Desea reestablecer?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"notifications": "Notifications",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Paramètres des notifications",
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
	"none": "Rien",
	"following": "Abonnements",
	"followers": "Abonné·e·s",
	"mutualFollow": "Abonnement mutuel",
	"followingOrFollower": "Abonnement ou abonné",
	"userList": "Listes",
	"all": "Tous",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Marquer toutes les notifications comme lues",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Notifications push",
	"sendPushNotificationReadMessage": "Supprimer les notifications push une fois que les notifications ou messages pertinents ont été lus.",
	"sendPushNotificationReadMessageCaption": "Cela peut augmenter la consommation de batterie de votre appareil.",
	"unnotifyNotes": "Ne pas notifier pour la publication des notes",
	"notifyNotes": "Notifier à propos des nouvelles notes",
	"resetAreYouSure": "Voulez-vous réinitialiser ?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"notifications": "Notifikasi",
	"settingsNotificationsBanner": "Anda dapat mengatur tipe dan rentang notifikasi dari peladen dan notifikasi push.",
	"notificationRecieveConfig": "Pengaturan notifikasi",
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
	"none": "Tidak ada",
	"following": "Ikuti",
	"followers": "Pengikut",
	"mutualFollow": "Saling mengikuti",
	"followingOrFollower": "Mengikuti atau pengikut",
	"userList": "Daftar",
	"all": "Semua",
	"notifyUsers": "Pengguna dengan notifikasi pos yang dinyalakan",
	"notificationSoundSettings": "Pengaturan suara notifikasi",
	"markAsReadAllNotifications": "Tandai semua notifikasi telah dibaca",
	"notificationSendTestNotification": "Kirim tes notifikasi",
	"notificationFlushNotification": "Bersihkan notifikasi",
	"pushNotification": "Notifikasi dorong",
	"sendPushNotificationReadMessage": "Hapus notifikasi dorong ketika notifikasi relevan atau pesan telah dibaca",
	"sendPushNotificationReadMessageCaption": "Notifikasi berisi teks「{emptyPushNotificationMessage}」akan ditampilkan dalam waktu pendek. Ini mungkin dapat menambah pemakaian baterai pada perangkat kamu.",
	"unnotifyNotes": "Berhenti memberitahu mengenai catatan baru",
	"notifyNotes": "Beritahu mengenai catatan baru",
	"resetAreYouSure": "Yakin mau atur ulang?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"notifications": "Notifiche",
	"settingsNotificationsBanner": "Puoi impostare il tipo di notifiche da ricevere dal server e anche le notifiche push.",
	"notificationRecieveConfig": "Preferenze di notifica",
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
	"none": "Nessuna",
	"following": "Following",
	"followers": "Follower",
	"mutualFollow": "Follow reciproco",
	"followingOrFollower": "Following o Follower",
	"userList": "Liste",
	"all": "Tutte",
	"notifyUsers": "Persone che hanno attivato le notifiche di pubblicazione",
	"notificationSoundSettings": "Preferenze di notifica",
	"markAsReadAllNotifications": "Segnare tutte le notifiche come lette",
	"notificationSendTestNotification": "Spedisci una notifica di prova",
	"notificationFlushNotification": "Azzera le notifiche",
	"pushNotification": "Notifiche Push",
	"sendPushNotificationReadMessage": "Eliminare le notifiche push dopo la relativa lettura",
	"sendPushNotificationReadMessageCaption": "Se possibile, verrà mostrata brevemente una notifica con il testo \"{emptyPushNotificationMessage}\". Potrebbe influire negativamente sulla durata della batteria.",
	"unnotifyNotes": "Interrompi le notifiche di nuove Note",
	"notifyNotes": "Notifica nuove Note",
	"resetAreYouSure": "Ripristinare?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"notifications": "通知",
	"settingsNotificationsBanner": "サーバーからの受信する通知の種類と範囲や、プッシュ通知の設定が行えます。",
	"notificationRecieveConfig": "通知の受信設定",
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
	"none": "なし",
	"following": "フォロー",
	"followers": "フォロワー",
	"mutualFollow": "相互フォロー",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト",
	"all": "全て",
	"notifyUsers": "投稿通知を設定したユーザー",
	"notificationSoundSettings": "通知音の設定",
	"markAsReadAllNotifications": "すべての通知を既読にする",
	"notificationSendTestNotification": "テスト通知を送信する",
	"notificationFlushNotification": "通知の履歴をリセットする",
	"pushNotification": "プッシュ通知",
	"sendPushNotificationReadMessage": "通知が既読になったらプッシュ通知を削除する",
	"sendPushNotificationReadMessageCaption": "端末の電池消費量が増加する可能性があります。",
	"unnotifyNotes": "投稿の通知を解除",
	"notifyNotes": "投稿を通知",
	"resetAreYouSure": "リセットしますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"notifications": "通知",
	"settingsNotificationsBanner": "サーバーから受け取る通知の種類とか範囲、プッシュ通知の設定ができるで。",
	"notificationRecieveConfig": "通知もらうかの設定",
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
	"none": "なし",
	"following": "フォロー",
	"followers": "フォロワー",
	"mutualFollow": "お互いフォローしてんで",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト",
	"all": "みんな",
	"notifyUsers": "投稿通知を設定したユーザー",
	"notificationSoundSettings": "通知音の設定",
	"markAsReadAllNotifications": "通知はもう全部読んだわ",
	"notificationSendTestNotification": "テスト通知を送信するで",
	"notificationFlushNotification": "通知の履歴をリセットする",
	"pushNotification": "プッシュ通知",
	"sendPushNotificationReadMessage": "通知やメッセージが既読になったらプッシュ通知を消すで",
	"sendPushNotificationReadMessageCaption": "あんたの端末の電池使う量が増えるかもしれん。",
	"unnotifyNotes": "投稿の通知やめる",
	"notifyNotes": "投稿を通知",
	"resetAreYouSure": "リセットしてええん？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"notifications": "Ilɣuyen",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "None",
	"following": "Ig ṭṭafaṛ",
	"followers": "Imeḍfaṛen",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Tibdarin",
	"all": "All",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Really reset?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"notifications": "ಅಧಿಸೂಚನೆಗಳು",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "None",
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"all": "All",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Really reset?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"notifications": "알림",
	"settingsNotificationsBanner": "서버에서 받는 알림의 종류 및 범위, 푸시 알림 설정을 합니다.",
	"notificationRecieveConfig": "알림 설정",
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
	"none": "없음",
	"following": "팔로잉",
	"followers": "팔로워",
	"mutualFollow": "맞팔로우",
	"followingOrFollower": "팔로 중이거나 팔로워",
	"userList": "리스트",
	"all": "전체",
	"notifyUsers": "게시물 알림을 설정한 사용자",
	"notificationSoundSettings": "알림 설정",
	"markAsReadAllNotifications": "모든 알림을 읽은 상태로 표시",
	"notificationSendTestNotification": "테스트 알림 보내기",
	"notificationFlushNotification": "알림 이력을 초기화",
	"pushNotification": "푸시 알림",
	"sendPushNotificationReadMessage": "푸시 알림이나 메시지를 읽은 뒤 푸시 알림을 삭제",
	"sendPushNotificationReadMessageCaption": "「{emptyPushNotificationMessage}」이라는 알림이 잠깐 표시됩니다. 기기의 전력 소비량이 증가할 수 있습니다.",
	"unnotifyNotes": "새 노트 알림 끄기",
	"notifyNotes": "새 노트 알림 켜기",
	"resetAreYouSure": "초기화 하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"notifications": "Meldingen",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "Niets",
	"following": "Volgend",
	"followers": "Volgers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Gevolgd of volger",
	"userList": "Lijsten",
	"all": "Alle",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Markeer alle meldingen als gelezen",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Pushberichten",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Resetten?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"notifications": "Varsler",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "Ingen",
	"following": "Følger",
	"followers": "Følgere",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lister",
	"all": "Alle",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Merk alle varsler som lest",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push-varsler",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Really reset?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"notifications": "Powiadomienia",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "Brak",
	"following": "Obserwowani",
	"followers": "Obserwujący",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Listy",
	"all": "Wszystkie",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Oznacz wszystkie powiadomienia jako przeczytane",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Powiadomienia",
	"sendPushNotificationReadMessage": "Usuń powiadomienia push po przeczytaniu powiadomień i wiadomości.",
	"sendPushNotificationReadMessageCaption": "Chwilowo pojawi się powiadomienie \"{emptyPushNotificationMessage}\". Może wzrosnąć zużycie baterii urządzenia.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Czy na pewno chcesz zresetować?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"notifications": "Notificações",
	"settingsNotificationsBanner": "Você pode configurar os tipos e intervalo das notificações do servidor, além de notificações push.",
	"notificationRecieveConfig": "Configurações de Notificação",
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
	"none": "Nenhum",
	"following": "Seguindo",
	"followers": "Seguidores",
	"mutualFollow": "Seguidor mútuo",
	"followingOrFollower": "Seguidor ou usuário seguido",
	"userList": "Listas",
	"all": "Todos",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Configurações de som de notificações",
	"markAsReadAllNotifications": "Marcar todas as notificações como lidas",
	"notificationSendTestNotification": "Enviar notificação de teste",
	"notificationFlushNotification": "Limpar notificações",
	"pushNotification": "Notificações Push",
	"sendPushNotificationReadMessage": "Apagar notificações push quando elas foram lidas",
	"sendPushNotificationReadMessageCaption": "Pode aumentar o consumo de energia do dispositivo.",
	"unnotifyNotes": "Deixar de notificar sobre novas notas",
	"notifyNotes": "Notificar sobre novas notas",
	"resetAreYouSure": "Deseja reiniciar?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"notifications": "Уведомления",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Настроить оповещения",
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
	"none": "Ничего",
	"following": "Подписки",
	"followers": "Подписчики",
	"mutualFollow": "Взаимные подписки",
	"followingOrFollower": "Подписки или подписчики",
	"userList": "Списки",
	"all": "Все",
	"notifyUsers": "Пользователи с включёнными уведомлениями о заметках",
	"notificationSoundSettings": "Настройки звука уведомлений",
	"markAsReadAllNotifications": "Отметить все уведомления как прочитанные",
	"notificationSendTestNotification": "Отправить тестовое уведомление",
	"notificationFlushNotification": "Очистить уведомления",
	"pushNotification": "Push-уведомления",
	"sendPushNotificationReadMessage": "Удалять push-уведомления когда сообщение или прочитано",
	"sendPushNotificationReadMessageCaption": "На мгновение появится уведомление \"{emptyPushNotificationMessage}\". Расход заряда батареи может увеличиться ",
	"unnotifyNotes": "Отписаться от сообщений",
	"notifyNotes": "Оповещать о публикациях",
	"resetAreYouSure": "На самом деле сбросить?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"notifications": "Oznámenia",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "Žiadne",
	"following": "Sledujete",
	"followers": "Sledujúci",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Zoznamy",
	"all": "Všetko",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Označiť všetky oznámenia ako prečítané",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifikácie",
	"sendPushNotificationReadMessage": "Odstrániť push notifikácie po ich prečítaní",
	"sendPushNotificationReadMessageCaption": "Na chvíľu sa zobrazí oznámenie \"{emptyPushNotificationMessage}\". Môže to zvýšiť spotrebu batérie zariadenia.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Naozaj resetovať?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"notifications": "เเจ้งเตือน",
	"settingsNotificationsBanner": "สามารถตั้งค่าประเภทและขอบเขตของการแจ้งเตือนที่รับจากเซิร์ฟเวอร์ รวมถึงการแจ้งเตือนแบบพุช",
	"notificationRecieveConfig": "การตั้งค่าการแจ้งเตือน",
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
	"none": "ไม่มี",
	"following": "กำลังติดตาม",
	"followers": "ผู้ติดตาม",
	"mutualFollow": "ติดตามซึ่งกันและกัน",
	"followingOrFollower": "กำลังติดตามหรือผู้ติดตาม",
	"userList": "ลิสต์",
	"all": "ทั้งหมด",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "ตั้งค่าเสียงแจ้งเตือน",
	"markAsReadAllNotifications": "ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว",
	"notificationSendTestNotification": "ส่งทดสอบการแจ้งเตือน",
	"notificationFlushNotification": "ล้างประวัติการแจ้งเตือน",
	"pushNotification": "การแจ้งเตือนแบบพุช",
	"sendPushNotificationReadMessage": "ลบการแจ้งเตือนแบบพุชเมื่ออ่านการแจ้งเตือนหรือข้อความที่เกี่ยวข้องแล้ว",
	"sendPushNotificationReadMessageCaption": "อาจทำให้อุปกรณ์ของคุณใช้พลังงานมากขึ้น",
	"unnotifyNotes": "หยุดการแจ้งเตือนเกี่ยวกับโน้ตใหม่",
	"notifyNotes": "แจ้งเตือนเกี่ยวกับโพสต์ใหม่",
	"resetAreYouSure": "รีเซ็ตเลยไหม?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"notifications": "Bildirimler",
	"settingsNotificationsBanner": "Sunucudan gelen bildirimlerin türlerini ve kapsamını ve push bildirimlerini yapılandırabilirsin.",
	"notificationRecieveConfig": "Bildirim Ayarları",
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
	"none": "Hiçbiri",
	"following": "Takip",
	"followers": "Takipçi",
	"mutualFollow": "Karşılıklı takip",
	"followingOrFollower": "Takip eden veya takipçi",
	"userList": "Listeler",
	"all": "Tümü",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Bildirim sesi ayarları",
	"markAsReadAllNotifications": "Tüm bildirimleri okundu olarak işaretle",
	"notificationSendTestNotification": "Test bildirimi gönder",
	"notificationFlushNotification": "Bildirimleri temizle",
	"pushNotification": "Push bildirimleri",
	"sendPushNotificationReadMessage": "Okunduktan sonra push bildirimlerini silin",
	"sendPushNotificationReadMessageCaption": "Bu, cihazınızın güç tüketimini artırabilir.",
	"unnotifyNotes": "Yeni notlar hakkında bildirim almayı durdur",
	"notifyNotes": "Yeni notlar hakkında bildirimde bulun",
	"resetAreYouSure": "Cidden sıfırlansın mı?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"notifications": "Notifications",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Notification Settings",
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
	"none": "None",
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"all": "All",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Notification sound settings",
	"markAsReadAllNotifications": "Mark all notifications as read",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push notifications",
	"sendPushNotificationReadMessage": "Delete push notifications once they have been read",
	"sendPushNotificationReadMessageCaption": "This may increase the power consumption of your device.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Really reset?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"notifications": "Сповіщення",
	"settingsNotificationsBanner": "Ви можете налаштовувати типи та кількість сповіщень від сервера також як і спливні сповіщення.",
	"notificationRecieveConfig": "Налаштування сповіщень",
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
	"none": "Відсутній",
	"following": "Підписки",
	"followers": "Підписники",
	"mutualFollow": "Взаємна підписка",
	"followingOrFollower": "Підписки або підписники",
	"userList": "Списки",
	"all": "Всі",
	"notifyUsers": "Користувачі, які ввімкнули сповіщення про публікації",
	"notificationSoundSettings": "Вибрати звук сповіщення",
	"markAsReadAllNotifications": "Позначити всі сповіщення як прочитані",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Push сповіщення",
	"sendPushNotificationReadMessage": "Видаляти push-сповіщення після прочитання",
	"sendPushNotificationReadMessageCaption": "Це може збільшити споживання енергії вашим пристроєм.",
	"unnotifyNotes": "Припинити сповіщати про нові нотатки",
	"notifyNotes": "Сповіщати про нові нотатки",
	"resetAreYouSure": "Справді скинути?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"notifications": "Thông báo",
	"settingsNotificationsBanner": "You can configure the types and range of notifications from the server and push notifications.",
	"notificationRecieveConfig": "Cài đặt thông báo",
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
	"none": "Không",
	"following": "Đang theo dõi",
	"followers": "Người theo dõi",
	"mutualFollow": "Theo dõi lẫn nhau",
	"followingOrFollower": "Đang theo dõi hoặc người theo dõi",
	"userList": "Danh sách",
	"all": "Tất cả",
	"notifyUsers": "Users with post notifications enabled",
	"notificationSoundSettings": "Cài đặt âm thanh thông báo",
	"markAsReadAllNotifications": "Đánh dấu tất cả các thông báo là đã đọc",
	"notificationSendTestNotification": "Send test notification",
	"notificationFlushNotification": "Clear notifications",
	"pushNotification": "Thông báo đẩy",
	"sendPushNotificationReadMessage": "Xóa thông báo đẩy sau khi đọc thông báo hay tin nhắn",
	"sendPushNotificationReadMessageCaption": "Thông báo như {emptyPushNotificationMessage} sẽ hiển thị trong giây phút. Tiêu tốn pin của máy bạn có thể tăng lên hơn nữa.",
	"unnotifyNotes": "Stop notifying about new notes",
	"notifyNotes": "Notify about new notes",
	"resetAreYouSure": "Bạn có chắc muốn đặt lại?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"notifications": "通知",
	"settingsNotificationsBanner": "可在此设置从服务器接收的通知的种类和范围，以及推送通知的设置。",
	"notificationRecieveConfig": "通知接收设置",
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
	"none": "无",
	"following": "关注中",
	"followers": "关注者",
	"mutualFollow": "互相关注",
	"followingOrFollower": "关注中或关注者",
	"userList": "列表",
	"all": "全部",
	"notifyUsers": "已开启发帖通知的用户",
	"notificationSoundSettings": "设置通知声音",
	"markAsReadAllNotifications": "将所有通知标为已读",
	"notificationSendTestNotification": "发送测试通知",
	"notificationFlushNotification": "重置通知历史",
	"pushNotification": "推送通知",
	"sendPushNotificationReadMessage": "删除已读推送通知消息",
	"sendPushNotificationReadMessageCaption": "您终端设备的电池消耗可能会增加。",
	"unnotifyNotes": "关闭发帖通知",
	"notifyNotes": "开启发帖通知",
	"resetAreYouSure": "确定要重置吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"notifications": "通知",
	"settingsNotificationsBanner": "您可以設定從伺服器接收通知的類型和範圍，以及推送通知。",
	"notificationRecieveConfig": "接受通知的設定",
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
	"none": "無",
	"following": "追隨中",
	"followers": "追隨者",
	"mutualFollow": "互相追隨",
	"followingOrFollower": "追隨中或追隨者",
	"userList": "使用者清單",
	"all": "全部",
	"notifyUsers": "設定了貼文通知的使用者",
	"notificationSoundSettings": "設定通知音效",
	"markAsReadAllNotifications": "標記所有通知為已讀",
	"notificationSendTestNotification": "發送測試通知",
	"notificationFlushNotification": "重置通知歷史紀錄",
	"pushNotification": "推播通知",
	"sendPushNotificationReadMessage": "如果已閱讀通知與訊息，就刪除推播通知",
	"sendPushNotificationReadMessageCaption": "可能會導致裝置的電池消耗量增加。",
	"unnotifyNotes": "關閉貼文通知",
	"notifyNotes": "開啟貼文通知",
	"resetAreYouSure": "確定要重設嗎？"
}
</locale>
