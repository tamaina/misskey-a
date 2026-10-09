<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkButton
	v-if="supported && !pushRegistrationInServer"
	type="button"
	primary
	:gradate="gradate"
	:rounded="rounded"
	:inline="inline"
	:autofocus="autofocus"
	:wait="wait"
	:full="full"
	@click="subscribe"
>
	{{ $locale.sfc.subscribePushNotification }}
</MkButton>
<MkButton
	v-else-if="!showOnlyToRegister && ($i ? pushRegistrationInServer : pushSubscription)"
	type="button"
	:primary="false"
	:gradate="gradate"
	:rounded="rounded"
	:inline="inline"
	:autofocus="autofocus"
	:wait="wait"
	:full="full"
	@click="unsubscribe"
>
	{{ $locale.sfc.unsubscribePushNotification }}
</MkButton>
<MkButton v-else-if="$i && pushRegistrationInServer" disabled :rounded="rounded" :inline="inline" :wait="wait" :full="full">
	{{ $locale.sfc.pushNotificationAlreadySubscribed }}
</MkButton>
<MkButton v-else-if="!supported" disabled :rounded="rounded" :inline="inline" :wait="wait" :full="full">
	{{ $locale.sfc.pushNotificationNotSupported }}
</MkButton>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { instanceName } from '@features/boot/frontend/shared/config.js';
import { $i } from '@features/auth/frontend/i.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { instance } from '@features/instance/frontend/instance.js';
import { apiWithDialog, promiseDialog, alert } from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { getAccounts } from '@features/auth/frontend/accounts.js';
import { encodePushSubscriptionKey } from '@features/notifications/frontend/utility/encode-push-subscription-key.js';

defineProps<{
	primary?: boolean;
	gradate?: boolean;
	rounded?: boolean;
	inline?: boolean;
	link?: boolean;
	to?: string;
	autofocus?: boolean;
	wait?: boolean;
	danger?: boolean;
	full?: boolean;
	showOnlyToRegister?: boolean;
}>();

// ServiceWorker registration
const registration = ref<ServiceWorkerRegistration | undefined>();
// If this browser supports push notification
const supported = ref(false);
// If this browser has already subscribed to push notification
const pushSubscription = ref<PushSubscription | null>(null);
const pushRegistrationInServer = ref<{ state?: string; key?: string; userId: string; endpoint: string; sendReadMessage: boolean; } | undefined>();

async function subscribe() {
	if (!registration.value || !supported.value || !instance.swPublickey) return;

	if ('Notification' in window) {
		let permission = Notification.permission;

		if (Notification.permission === 'default') {
			permission = await promiseDialog(Notification.requestPermission(), null, null, $locale.value.sfc.pleaseAllowPushNotification);
		}

		if (permission !== 'granted') {
			alert({
				type: 'error',
				title: $locale.value.sfc.browserPushNotificationDisabled,
				text: $l.value.sfc.browserPushNotificationDisabledDescription({ serverName: instanceName }),
			});
			return;
		}
	}

	// SEE: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe#Parameters
	await promiseDialog(registration.value.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(instance.swPublickey),
	})
		.then(async subscription => {
			pushSubscription.value = subscription;

			// Register
			pushRegistrationInServer.value = await misskeyApi('sw/register', {
				endpoint: subscription.endpoint,
				auth: encodePushSubscriptionKey(subscription.getKey('auth')),
				publickey: encodePushSubscriptionKey(subscription.getKey('p256dh')),
			});
		}, async err => { // When subscribe failed
			// 通知が許可されていなかったとき
			if (err?.name === 'NotAllowedError') {
				console.info('User denied the notification permission request.');
				return;
			}

			// 違うapplicationServerKey (または gcm_sender_id)のサブスクリプションが
			// 既に存在していることが原因でエラーになった可能性があるので、
			// そのサブスクリプションを解除しておく
			// （これは実行されなさそうだけど、おまじない的に古い実装から残してある）
			await unsubscribe();
		}), null, null);
}

async function unsubscribe() {
	if (!pushSubscription.value) return;

	const params = {
		endpoint: pushSubscription.value.endpoint,
		auth: encodePushSubscriptionKey(pushSubscription.value.getKey('auth')),
		publickey: encodePushSubscriptionKey(pushSubscription.value.getKey('p256dh')),
	};
	const accounts = await getAccounts();

	pushRegistrationInServer.value = undefined;

	if ($i && accounts.length >= 2) {
		// ブラウザの購読は他アカウントと共有しているので、このアカウントの登録のみ解除する
		apiWithDialog('sw/unregister', params, $i.token);
	} else {
		// ブラウザの購読ごと解除するので、この購読に紐づく全アカウントの登録を解除する
		pushSubscription.value.unsubscribe();
		apiWithDialog('sw/unregister', params, null);
		pushSubscription.value = null;
	}
}

/**
 * Convert the URL safe base64 string to a Uint8Array
 * @param base64String base64 string
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

if (navigator.serviceWorker == null) {
	// TODO: よしなに？
} else {
	navigator.serviceWorker.ready.then(async swr => {
		registration.value = swr;

		pushSubscription.value = await registration.value.pushManager.getSubscription();

		if (instance.swPublickey && ('PushManager' in window) && $i && $i.token) {
			supported.value = true;

			if (pushSubscription.value) {
				const res = await misskeyApi('sw/show-registration', {
					endpoint: pushSubscription.value.endpoint,
				});

				if (res) {
					pushRegistrationInServer.value = res;
				}
			}
		}
	});
}

defineExpose({
	pushRegistrationInServer: pushRegistrationInServer,
});
</script>

<locale locale="ar-SA" lang="json">
{
	"subscribePushNotification": "فعّل إرسال الإشعارات",
	"unsubscribePushNotification": "عطل إرسال الإشعارات",
	"pushNotificationAlreadySubscribed": "إرسال الإشعارات مفعل سلفًا",
	"pushNotificationNotSupported": "متصفحك لا يدعم إرسال الإشعارات أو المثيل لا يدعمها.",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"subscribePushNotification": "Activar l'enviament de notificacions",
	"unsubscribePushNotification": "Desactivar l'enviament de notificacions",
	"pushNotificationAlreadySubscribed": "L'enviament de notificacions ja és activat",
	"pushNotificationNotSupported": "El teu navegador o la teva instància no suporta l'enviament de notificacions ",
	"pleaseAllowPushNotification": "Si us plau, permet les notificacions del navegador",
	"browserPushNotificationDisabled": "No s'ha pogut obtenir permisos per les notificacions",
	"browserPushNotificationDisabledDescription": "No tens permisos per enviar notificacions des de {serverName}. Activa les notificacions a la configuració del teu navegador i tornar-ho a intentar."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"subscribePushNotification": "Povolit push oznamení",
	"unsubscribePushNotification": "Vypnout push oznámení",
	"pushNotificationAlreadySubscribed": "Push oznámení jsou už zapnuté",
	"pushNotificationNotSupported": "Tenhle prohlížeč nepodporuje push oznámení",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"subscribePushNotification": "Enable push notifications",
	"unsubscribePushNotification": "Disable push notifications",
	"pushNotificationAlreadySubscribed": "Push notifications are already enabled",
	"pushNotificationNotSupported": "Your browser or instance does not support push notifications",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"subscribePushNotification": "Push-Benachrichtigungen aktivieren",
	"unsubscribePushNotification": "Push-Benachrichtigungen deaktivieren",
	"pushNotificationAlreadySubscribed": "Push-Benachrichtigungen sind bereits aktiviert",
	"pushNotificationNotSupported": "Entweder dein Browser oder deine Instanz unterstützt Push-Benachrichtigungen nicht",
	"pleaseAllowPushNotification": "Bitte erlauben Sie Benachrichtigungen in Ihrem Browser.",
	"browserPushNotificationDisabled": "Das Abrufen der Berechtigung zum Senden von Benachrichtigungen ist fehlgeschlagen.",
	"browserPushNotificationDisabledDescription": "Sie haben keine Berechtigung, Benachrichtigungen von {serverName} zu senden. Bitte erlauben Sie Benachrichtigungen in den Browser-Einstellungen und versuchen Sie es erneut."
}
</locale>

<locale locale="en-US" lang="json">
{
	"subscribePushNotification": "Enable push notifications",
	"unsubscribePushNotification": "Disable push notifications",
	"pushNotificationAlreadySubscribed": "Push notifications are already enabled",
	"pushNotificationNotSupported": "Your browser or instance does not support push notifications",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"subscribePushNotification": "Activar las notificaciones emergentes",
	"unsubscribePushNotification": "Desactivar las notificaciones emergentes",
	"pushNotificationAlreadySubscribed": "Notificaciones emergentes ya activadas",
	"pushNotificationNotSupported": "El navegador o la instancia no admiten notificaciones push",
	"pleaseAllowPushNotification": "Por favor, permita las notificaciones y la configuración del navegador.",
	"browserPushNotificationDisabled": "No se ha podido obtener permiso para enviar notificaciones.",
	"browserPushNotificationDisabledDescription": "No tienes permiso para enviar notificaciones desde {serverName}. Permite las notificaciones en la configuración de tu navegador y vuelve a intentarlo."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"subscribePushNotification": "Autoriser les notifications push",
	"unsubscribePushNotification": "Désactiver les notifications push",
	"pushNotificationAlreadySubscribed": "Les notifications push sont déjà activées",
	"pushNotificationNotSupported": "Votre navigateur ou votre instance ne prend pas en charge les notifications push",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"subscribePushNotification": "Nyalakan notifikasi dorong",
	"unsubscribePushNotification": "Matikan notifikasi dorong",
	"pushNotificationAlreadySubscribed": "Notifikasi dorong telah dinyalakan",
	"pushNotificationNotSupported": "Browser atau instansi kamu tidak mendukung notifikasi dorong",
	"pleaseAllowPushNotification": "Mohon nyalakan notifikasi push di peramban anda",
	"browserPushNotificationDisabled": "Gagal mendapatkan ijin untuk mengirim notifikasi",
	"browserPushNotificationDisabledDescription": "Anda tidak memiliki ijin untuk mengirim notifikasi dari {serverName}. Mohon ijinkan notifikasi di pengaturan peramban anda dan coba lagi."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"subscribePushNotification": "Attivare le notifiche push",
	"unsubscribePushNotification": "Disattivare le notifiche push",
	"pushNotificationAlreadySubscribed": "Le notifiche push sono già attivate",
	"pushNotificationNotSupported": "Il client o il server non supporta le notifiche push",
	"pleaseAllowPushNotification": "Per favore, acconsenti alla ricezione di notifiche nel browser",
	"browserPushNotificationDisabled": "Non è stato possibile ottenere il consenso alla ricezione di notifche",
	"browserPushNotificationDisabledDescription": "Non hai concesso a {serverName} di spedire notifiche. Per favore, acconsenti alla ricezione nelle impostazioni del browser e riprova."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"subscribePushNotification": "プッシュ通知を有効化",
	"unsubscribePushNotification": "プッシュ通知を停止する",
	"pushNotificationAlreadySubscribed": "プッシュ通知は有効です",
	"pushNotificationNotSupported": "ブラウザかサーバーがプッシュ通知に非対応",
	"pleaseAllowPushNotification": "ブラウザの通知設定を許可してください",
	"browserPushNotificationDisabled": "通知の送信権限の取得に失敗しました",
	"browserPushNotificationDisabledDescription": "{serverName}から通知を送信する権限がありません。ブラウザの設定から通知を許可して再度お試しください。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"subscribePushNotification": "プッシュ通知をオンにするで",
	"unsubscribePushNotification": "プッシュ通知を止めるで",
	"pushNotificationAlreadySubscribed": "プッシュ通知はオンになってるで",
	"pushNotificationNotSupported": "ブラウザかサーバーがプッシュ通知に対応してないみたいやで。",
	"pleaseAllowPushNotification": "ブラウザの通知設定を許可してな",
	"browserPushNotificationDisabled": "通知の送信権限が取れんかったわ",
	"browserPushNotificationDisabledDescription": "今 {serverName} から通知を送るための権限が無いから、ブラウザの設定で通知を許可してもっかい試してな。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"subscribePushNotification": "Enable push notifications",
	"unsubscribePushNotification": "Disable push notifications",
	"pushNotificationAlreadySubscribed": "Push notifications are already enabled",
	"pushNotificationNotSupported": "Your browser or instance does not support push notifications",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"subscribePushNotification": "Enable push notifications",
	"unsubscribePushNotification": "Disable push notifications",
	"pushNotificationAlreadySubscribed": "Push notifications are already enabled",
	"pushNotificationNotSupported": "Your browser or instance does not support push notifications",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"subscribePushNotification": "푸시 알림 켜기",
	"unsubscribePushNotification": "푸시 알림 끄기",
	"pushNotificationAlreadySubscribed": "푸시 알림이 이미 켜져 있습니다",
	"pushNotificationNotSupported": "브라우저나 서버에서 푸시 알림이 지원되지 않습니다",
	"pleaseAllowPushNotification": "브라우저의 알림 설정을 허가해 주십시오.",
	"browserPushNotificationDisabled": "알림 송신 권한 얻기에 실패했습니다.",
	"browserPushNotificationDisabledDescription": "{serverName}에서의 알림 송신 권한이 없습니다. 브라우저의 설정에서 알림을 허가해 다시 시도해 주십시오."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"subscribePushNotification": "Push meldingen inschakelen",
	"unsubscribePushNotification": "Pushberichten uitschakelen",
	"pushNotificationAlreadySubscribed": "Pushberichtrn al ingeschakeld",
	"pushNotificationNotSupported": "Your browser or instance does not support push notifications",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"subscribePushNotification": "Enable push notifications",
	"unsubscribePushNotification": "Disable push notifications",
	"pushNotificationAlreadySubscribed": "Push notifications are already enabled",
	"pushNotificationNotSupported": "Your browser or instance does not support push notifications",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"subscribePushNotification": "Włącz powiadomienia",
	"unsubscribePushNotification": "Wyłącz powiadomienia push",
	"pushNotificationAlreadySubscribed": "Powiadomienia push są włączone",
	"pushNotificationNotSupported": "Przeglądarka lub instancja nie obsługuje powiadomień push",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"subscribePushNotification": "Ativar notificações push",
	"unsubscribePushNotification": "Desativar notificações push",
	"pushNotificationAlreadySubscribed": "Notificações push já estão habilitadas",
	"pushNotificationNotSupported": "Seu navegador ou instância não tem suporte às notificações push",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"subscribePushNotification": "Включить push-уведомления",
	"unsubscribePushNotification": "Выключить push-уведомления",
	"pushNotificationAlreadySubscribed": "Push-уведомления уже включены",
	"pushNotificationNotSupported": "Push-уведмления не поддерживаются инстансом или браузером",
	"pleaseAllowPushNotification": "Пожалуйста, разрешите уведомление в браузере от сайта",
	"browserPushNotificationDisabled": "Вы не дали разрешение на уведомления сайту",
	"browserPushNotificationDisabledDescription": "Разрешите уведомления в настройках браузера от {serverName}, чтобы включить PUSH уведомления"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"subscribePushNotification": "Push notifikácie zapnuté",
	"unsubscribePushNotification": "Vypnúť push notifikácie",
	"pushNotificationAlreadySubscribed": "Push notifikácie sú zapnuté",
	"pushNotificationNotSupported": "Prehliadač alebo server nepodporujú push notifikácie",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"subscribePushNotification": "เปิดการแจ้งเตือนแบบพุช",
	"unsubscribePushNotification": "ปิดการแจ้งเตือนแบบพุช",
	"pushNotificationAlreadySubscribed": "การแจ้งเตือนแบบพุชได้เปิดใช้งานแล้ว",
	"pushNotificationNotSupported": "เบราว์เซอร์หรือเซิร์ฟเวอร์ไม่รองรับการแจ้งเตือนแบบพุช",
	"pleaseAllowPushNotification": "โปรดอนุญาตการตั้งค่าการแจ้งเตือนของเบราว์เซอร์",
	"browserPushNotificationDisabled": "ขอสิทธิ์ส่งการแจ้งเตือนล้มเหลว",
	"browserPushNotificationDisabledDescription": "ไม่มีสิทธิ์ในการส่งการแจ้งเตือนจาก {serverName} โปรดอนุญาตการแจ้งเตือนในตั้งค่าของเบราว์เซอร์ แล้วลองอีกครั้ง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"subscribePushNotification": "Push bildirimlerini etkinleştir",
	"unsubscribePushNotification": "Push bildirimlerini kapat",
	"pushNotificationAlreadySubscribed": "Push bildirimleri zaten açık",
	"pushNotificationNotSupported": "Push bildirimleri sunucu veya tarayıcı tarafından desteklenmiyor",
	"pleaseAllowPushNotification": "Lütfen tarayıcı ayarlarınızdan bildirimlere izin verin.",
	"browserPushNotificationDisabled": "Bildirim gönderme izni alınamadı.",
	"browserPushNotificationDisabledDescription": "{serverName} sunucusundan bildirim gönderme izniniz yok. Lütfen tarayıcı ayarlarınızdan bildirimlere izin verin ve tekrar deneyin."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"subscribePushNotification": "Enable push notifications",
	"unsubscribePushNotification": "Disable push notifications",
	"pushNotificationAlreadySubscribed": "Push notifications are already enabled",
	"pushNotificationNotSupported": "Your browser or instance does not support push notifications",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"subscribePushNotification": "Увімкнути push-сповіщення",
	"unsubscribePushNotification": "Вимкнути push-сповіщення",
	"pushNotificationAlreadySubscribed": "Push-сповіщення вже увімкнено",
	"pushNotificationNotSupported": "Ваш браузер або інстанс не підтримує push-сповіщення",
	"pleaseAllowPushNotification": "Увімкніть push-сповіщення у браузері",
	"browserPushNotificationDisabled": "Не вдалося отримати дозвіл на надсилання сповіщень",
	"browserPushNotificationDisabledDescription": "Немає дозволу на надсилання сповіщень від {serverName}. Дозвольте сповіщення в налаштуваннях браузера й спробуйте ще раз."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"subscribePushNotification": "Bật thông báo đẩy",
	"unsubscribePushNotification": "Tắt thông báo đẩy",
	"pushNotificationAlreadySubscribed": "Đang bật thông báo đẩy",
	"pushNotificationNotSupported": "Trình duyệt của bạn không hỗ trợ thông báo đẩy.",
	"pleaseAllowPushNotification": "Please enable push notifications in your browser",
	"browserPushNotificationDisabled": "Failed to acquire permission to send notifications",
	"browserPushNotificationDisabledDescription": "You do not have permission to send notifications from {serverName}. Please allow notifications in your browser settings and try again."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"subscribePushNotification": "启用推送通知消息",
	"unsubscribePushNotification": "停用推送通知消息",
	"pushNotificationAlreadySubscribed": "推送通知消息已启用",
	"pushNotificationNotSupported": "浏览器或服务器不支持推送通知消息",
	"pleaseAllowPushNotification": "请在浏览器中启用推送通知",
	"browserPushNotificationDisabled": "未能获取发送通知的权限",
	"browserPushNotificationDisabledDescription": "{serverName}无权限发送通知。请在浏览器设置中允许通知后重新尝试。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"subscribePushNotification": "啟用推播通知",
	"unsubscribePushNotification": "停用推播通知",
	"pushNotificationAlreadySubscribed": "推播通知啟用中",
	"pushNotificationNotSupported": "瀏覽器或伺服器不支援推播通知",
	"pleaseAllowPushNotification": "請允許瀏覽器的通知設定",
	"browserPushNotificationDisabled": "取得通知發送權限失敗",
	"browserPushNotificationDisabledDescription": "您沒有權限從 {serverName} 發送通知。請在瀏覽器設定中允許通知，然後再試一次。"
}
</locale>
