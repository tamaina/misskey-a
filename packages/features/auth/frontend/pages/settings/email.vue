<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/email" :label="$locale.sfc.email" :keywords="['email']" icon="ti ti-mail">
	<div class="_gaps_m">
		<MkInfo v-if="!instance.enableEmail">{{ $locale.sfc.emailNotSupported }}</MkInfo>

		<MkDisableSection :disabled="!instance.enableEmail">
			<div class="_gaps_m">
				<SearchMarker :keywords="['email', 'address']">
					<FormSection first>
						<template #label><SearchLabel>{{ $locale.sfc.emailAddress }}</SearchLabel></template>
						<MkInput v-model="emailAddress" type="email" manualSave>
							<template #prefix><i class="ti ti-mail"></i></template>
							<template v-if="$i.email && !$i.emailVerified" #caption>{{ $locale.sfc.verificationEmailSent }}</template>
							<template v-else-if="emailAddress === $i.email && $i.emailVerified" #caption><i class="ti ti-check" style="color: var(--MI_THEME-success);"></i> {{ $locale.sfc.emailVerified }}</template>
						</MkInput>
					</FormSection>
				</SearchMarker>

				<FormSection>
					<SearchMarker :keywords="['announcement', 'email']">
						<MkSwitch :modelValue="$i.receiveAnnouncementEmail" @update:modelValue="onChangeReceiveAnnouncementEmail">
							<template #label><SearchLabel>{{ $locale.sfc.receiveAnnouncementFromInstance }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>
				</FormSection>

				<SearchMarker :keywords="['notification', 'email']">
					<FormSection>
						<template #label><SearchLabel>{{ $locale.sfc.emailNotification }}</SearchLabel></template>

						<div class="_gaps_s">
							<MkSwitch v-model="emailNotification_mention">
								{{ $locale.sfc.mention }}
							</MkSwitch>
							<MkSwitch v-model="emailNotification_reply">
								{{ $locale.sfc.reply }}
							</MkSwitch>
							<MkSwitch v-model="emailNotification_quote">
								{{ $locale.sfc.quote }}
							</MkSwitch>
							<MkSwitch v-model="emailNotification_follow">
								{{ $locale.sfc.follow }}
							</MkSwitch>
							<MkSwitch v-model="emailNotification_receiveFollowRequest">
								{{ $locale.sfc.receiveFollowRequest }}
							</MkSwitch>
						</div>
					</FormSection>
				</SearchMarker>
			</div>
		</MkDisableSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed } from 'vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkDisableSection from '@features/ui/frontend/components/MkDisableSection.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { instance } from '@features/instance/frontend/instance.js';

const $i = ensureSignin();

const emailAddress = ref($i.email ?? '');

function onChangeReceiveAnnouncementEmail(v: boolean) {
	misskeyApi('i/update', {
		receiveAnnouncementEmail: v,
	});
}

async function saveEmailAddress() {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	os.apiWithDialog('i/update-email', {
		password: auth.result.password,
		token: auth.result.token,
		email: emailAddress.value,
	});
}

const emailNotification_mention = ref($i.emailNotificationTypes.includes('mention'));
const emailNotification_reply = ref($i.emailNotificationTypes.includes('reply'));
const emailNotification_quote = ref($i.emailNotificationTypes.includes('quote'));
const emailNotification_follow = ref($i.emailNotificationTypes.includes('follow'));
const emailNotification_receiveFollowRequest = ref($i.emailNotificationTypes.includes('receiveFollowRequest'));

const saveNotificationSettings = () => {
	misskeyApi('i/update', {
		emailNotificationTypes: [
			...[emailNotification_mention.value ? 'mention' : null],
			...[emailNotification_reply.value ? 'reply' : null],
			...[emailNotification_quote.value ? 'quote' : null],
			...[emailNotification_follow.value ? 'follow' : null],
			...[emailNotification_receiveFollowRequest.value ? 'receiveFollowRequest' : null],
		].filter(x => x != null),
	});
};

watch([emailNotification_mention, emailNotification_reply, emailNotification_quote, emailNotification_follow, emailNotification_receiveFollowRequest], () => {
	saveNotificationSettings();
});

onMounted(() => {
	watch(emailAddress, () => {
		saveEmailAddress();
	});
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.email,
	icon: 'ti ti-mail',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"email": "البريد الإلكتروني ",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "عنوان البريد الالكتروني",
	"verificationEmailSent": "أُرسل بريد التحقق. أنقر على الرابط المضمن لإكمال التحقق.",
	"emailVerified": "تُحقّق من بريدك الإلكتروني",
	"receiveAnnouncementFromInstance": "استلم إشعارات من هذا المثيل",
	"emailNotification": "إشعارات البريد الكتروني",
	"mention": "الإشارات",
	"reply": "الردود",
	"quote": "الاقتباسات",
	"follow": "متابِعون جدد",
	"receiveFollowRequest": "طلبات المتابعة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"email": "Correu electrònic",
	"emailNotSupported": "Aquesta instància no suporta l'enviament de correus electrònics ",
	"emailAddress": "Adreça de correu electrònic",
	"verificationEmailSent": "S'ha enviat un correu electrònic de verificació. Fes clic a l'enllaç per completar la verificació.",
	"emailVerified": "El correu electrònic s'ha verificat",
	"receiveAnnouncementFromInstance": "Rep notificacions d'aquesta instància ",
	"emailNotification": "Notificacions per correu electrònic ",
	"mention": "Menció",
	"reply": "Respostes",
	"quote": "Citar",
	"follow": "Segueix-me",
	"receiveFollowRequest": "Rebuda una petició de seguiment"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"email": "Email",
	"emailNotSupported": "Tahle instance nepodporuje zasílání emailů",
	"emailAddress": "Emailová adresa",
	"verificationEmailSent": "Ověřovací email byl zaslán. Ověření dokončíte kliknutím na odkaz v emailu.",
	"emailVerified": "Váš e-mail byl ověřen",
	"receiveAnnouncementFromInstance": "Dostávat oznámení z téhle instance",
	"emailNotification": "Emailové oznámení",
	"mention": "Zmínění",
	"reply": "Odpovědi",
	"quote": "Citovat",
	"follow": "Sledovaní",
	"receiveFollowRequest": "Obdržené žádosti o sledování"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"email": "Email",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "Email address",
	"verificationEmailSent": "A verification email has been sent. Please follow the included link to complete verification.",
	"emailVerified": "Email has been verified",
	"receiveAnnouncementFromInstance": "Receive notifications from this instance",
	"emailNotification": "Email notifications",
	"mention": "Mentions",
	"reply": "Replies",
	"quote": "Quotes",
	"follow": "New followers",
	"receiveFollowRequest": "Received follow requests"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"email": "Email",
	"emailNotSupported": "Diese Instanz unterstützt das Versenden von Emails nicht",
	"emailAddress": "Email-Adresse",
	"verificationEmailSent": "Eine Bestätigungsmail wurde an deine Email-Adresse versendet. Besuche den dort enthaltenen Link, um die Verifizierung abzuschließen.",
	"emailVerified": "Email-Adresse bestätigt",
	"receiveAnnouncementFromInstance": "Benachrichtigungen von dieser Instanz empfangen",
	"emailNotification": "Email-Benachrichtigungen",
	"mention": "Erwähnungen",
	"reply": "Antworten",
	"quote": "Zitationen",
	"follow": "Neue Follower",
	"receiveFollowRequest": "Erhaltene Follow-Anfragen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"email": "Email",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "Email address",
	"verificationEmailSent": "A verification email has been sent. Please follow the included link to complete verification.",
	"emailVerified": "Email has been verified",
	"receiveAnnouncementFromInstance": "Receive notifications from this instance",
	"emailNotification": "Email notifications",
	"mention": "Mentions",
	"reply": "Replies",
	"quote": "Quotes",
	"follow": "New followers",
	"receiveFollowRequest": "Received follow requests"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"email": "Correo",
	"emailNotSupported": "Esta instancia no soporta el envío de correo electrónico",
	"emailAddress": "Correo electrónico",
	"verificationEmailSent": "Se le ha enviado un correo electrónico de confirmación. Por favor, acceda al enlace proporcionado en el correo electrónico para completar la configuración.",
	"emailVerified": "Su dirección de correo electrónico ha sido verificada.",
	"receiveAnnouncementFromInstance": "Recibir notificaciones de la instancia",
	"emailNotification": "Notificaciones por correo electrónico",
	"mention": "Menciones",
	"reply": "Respuestas",
	"quote": "Citar",
	"follow": "Siguiendo",
	"receiveFollowRequest": "Recibió una solicitud de seguimiento"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"email": "E-mail ",
	"emailNotSupported": "Cette instance ne prend pas en charge l'envoi de courriels",
	"emailAddress": "Adresse e-mail",
	"verificationEmailSent": "Un e-mail de vérification a été envoyé. Veuillez accéder au lien pour compléter la vérification.",
	"emailVerified": "Votre adresse e-mail a été vérifiée.",
	"receiveAnnouncementFromInstance": "Recevoir les messages d'information de l'instance",
	"emailNotification": "Notifications par courriel",
	"mention": "Mentions",
	"reply": "Réponses",
	"quote": "Citations",
	"follow": "Nouvel·le abonné·e",
	"receiveFollowRequest": "Demande d'abonnement reçue"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"email": "Surel",
	"emailNotSupported": "Instansi ini tidak mendukung mengirim surel",
	"emailAddress": "Alamat surel",
	"verificationEmailSent": "Surel verifikasi telah dikirimkan. Mohon akses tautan yang telah disertakan untuk menyelesaikan verifikasi.",
	"emailVerified": "Surel telah diverifikasi",
	"receiveAnnouncementFromInstance": "Terima pengumuman dari instansi ini",
	"emailNotification": "Notifikasi surel",
	"mention": "Sebut",
	"reply": "Balasan",
	"quote": "Kutip",
	"follow": "Ikuti",
	"receiveFollowRequest": "Permintaan mengikuti diterima"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"email": "Email",
	"emailNotSupported": "L'istanza non supporta l'invio di email",
	"emailAddress": "Indirizzo di posta elettronica",
	"verificationEmailSent": "Una mail di verifica è stata inviata. Si prega di accedere al collegamento per compiere la verifica.",
	"emailVerified": "Il tuo indirizzo email è stato verificato",
	"receiveAnnouncementFromInstance": "Ricevi i messaggi informativi dall'istanza",
	"emailNotification": "Eventi per notifiche via mail",
	"mention": "Menzioni",
	"reply": "Risposte",
	"quote": "Cita",
	"follow": "Follower",
	"receiveFollowRequest": "Richieste di follow in arrivo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"email": "メール",
	"emailNotSupported": "このサーバーではメール配信はサポートされていません",
	"emailAddress": "メールアドレス",
	"verificationEmailSent": "確認のメールを送信しました。メールに記載されたリンクにアクセスして、設定を完了してください。",
	"emailVerified": "メールアドレスが確認されました",
	"receiveAnnouncementFromInstance": "サーバーからのお知らせを受け取る",
	"emailNotification": "メール通知",
	"mention": "メンション",
	"reply": "リプライ",
	"quote": "引用",
	"follow": "フォロー",
	"receiveFollowRequest": "フォロー申請を受け取った"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"email": "メール",
	"emailNotSupported": "このサーバーはメール配信がサポートされてへんみたいやわ",
	"emailAddress": "メールアドレス",
	"verificationEmailSent": "無事確認のメールを送れたで。メールに書いてあるリンクにアクセスして、設定を完了してなー。",
	"emailVerified": "メールアドレスは確認されたで",
	"receiveAnnouncementFromInstance": "サーバーからのお知らせを受け取る",
	"emailNotification": "メール通知",
	"mention": "あんた宛て",
	"reply": "リプライ",
	"quote": "引用",
	"follow": "フォロー",
	"receiveFollowRequest": "フォロー許可してほしいみたいやで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"email": "Imayl",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "Tansa imayl",
	"verificationEmailSent": "A verification email has been sent. Please follow the included link to complete verification.",
	"emailVerified": "Email has been verified",
	"receiveAnnouncementFromInstance": "Receive notifications from this instance",
	"emailNotification": "Ilɣa imayl",
	"mention": "Bder",
	"reply": "Replies",
	"quote": "Quotes",
	"follow": "Ig ṭṭafaṛ",
	"receiveFollowRequest": "Received follow requests"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"email": "Email",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "Email address",
	"verificationEmailSent": "A verification email has been sent. Please follow the included link to complete verification.",
	"emailVerified": "Email has been verified",
	"receiveAnnouncementFromInstance": "Receive notifications from this instance",
	"emailNotification": "Email notifications",
	"mention": "ಹೆಸರಿಸಿದ",
	"reply": "Replies",
	"quote": "Quotes",
	"follow": "New followers",
	"receiveFollowRequest": "Received follow requests"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"email": "이메일",
	"emailNotSupported": "이 서버에서는 메일 전송을 지원하지 않습니다",
	"emailAddress": "메일 주소",
	"verificationEmailSent": "확인 메일을 발송하였습니다. 설정을 완료하려면 메일에 첨부된 링크를 확인해 주세요.",
	"emailVerified": "메일 주소가 확인되었습니다.",
	"receiveAnnouncementFromInstance": "이 서버의 알림을 이메일로 수신할게요",
	"emailNotification": "메일 알림",
	"mention": "멘션",
	"reply": "답글",
	"quote": "인용",
	"follow": "팔로잉",
	"receiveFollowRequest": "팔로우 요청을 받았을 때"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"email": "Email",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "Email adres",
	"verificationEmailSent": "Er is een bevestigingsmail naar uw e-mailadres verzonden. Ga naar de link in de e-mail om het verificatieproces te voltooien.",
	"emailVerified": "Emailadres bevestigd",
	"receiveAnnouncementFromInstance": "Meldingen ontvangen van deze instantie",
	"emailNotification": "E-mailmeldingen",
	"mention": "Vermelding",
	"reply": "Replies",
	"quote": "Quote",
	"follow": "Volgend",
	"receiveFollowRequest": "Received follow requests"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"email": "E-post",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "Email address",
	"verificationEmailSent": "A verification email has been sent. Please follow the included link to complete verification.",
	"emailVerified": "Email has been verified",
	"receiveAnnouncementFromInstance": "Receive notifications from this instance",
	"emailNotification": "E-postvarsler",
	"mention": "Mentions",
	"reply": "Svar",
	"quote": "Sitater",
	"follow": "Nye følgere",
	"receiveFollowRequest": "Received follow requests"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"email": "Adres e-mail",
	"emailNotSupported": "Wysyłanie wiadomości E-mail nie jest obsługiwane na tym serwerze",
	"emailAddress": "Adres e-mail",
	"verificationEmailSent": "Wiadomość weryfikacyjna została wysłana. Odwiedź uwzględniony odnośnik, aby ukończyć weryfikację.",
	"emailVerified": "Adres e-mail został potwierdzony",
	"receiveAnnouncementFromInstance": "Otrzymuj powiadomienia e-mail z tej instancji",
	"emailNotification": "Powiadomienia e-mail",
	"mention": "Wspomnij",
	"reply": "Odpowiedzi",
	"quote": "Cytuj",
	"follow": "Nowi obserwujący",
	"receiveFollowRequest": "Otrzymano prośbę o możliwość obserwacji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"email": "E-mail",
	"emailNotSupported": "O envio de e-mails não é suportado nesta instância",
	"emailAddress": "Endereço de e-mail",
	"verificationEmailSent": "Um e-mail de confirmação foi enviado. Siga o link no e-mail para concluir a verificação.",
	"emailVerified": "O endereço de e-mail foi confirmado",
	"receiveAnnouncementFromInstance": "Receba as notificações da instância",
	"emailNotification": "Notificações por e-mail",
	"mention": "Menção",
	"reply": "Respostas",
	"quote": "Citações",
	"follow": "Seguindo",
	"receiveFollowRequest": "Recebeu pedidos de seguidor"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"email": "Электронная почта",
	"emailNotSupported": "Доставка почты не поддерживается на этом сервере",
	"emailAddress": "Адрес электронной почты",
	"verificationEmailSent": "Вам отправлено письмо для подтверждения. Пройдите, пожалуйста, по ссылке из письма, чтобы завершить проверку.",
	"emailVerified": "Адрес электронной почты подтверждён.",
	"receiveAnnouncementFromInstance": "Получать оповещения с инстанса",
	"emailNotification": "Уведомления по электронной почте",
	"mention": "Упоминания",
	"reply": "Ответы",
	"quote": "Цитаты",
	"follow": "Подписки",
	"receiveFollowRequest": "Получен запрос на подписку"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"email": "Email",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "Emailová adresa",
	"verificationEmailSent": "Odoslali sme overovací email. Overenie dokončíte kliknutím na odkaz v emaili.",
	"emailVerified": "Email overený",
	"receiveAnnouncementFromInstance": "Prijať notifikácie z tohoto servera",
	"emailNotification": "Emailové upozornenia",
	"mention": "Zmienka",
	"reply": "Odpovede",
	"quote": "Citovať",
	"follow": "Sledujete",
	"receiveFollowRequest": "Doručené žiadosti o sledovanie"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"email": "อีเมล",
	"emailNotSupported": "เซิร์ฟเวอร์นี้ไม่รองรับการส่งอีเมล",
	"emailAddress": "ที่อยู่อีเมล",
	"verificationEmailSent": "ได้ส่งอีเมลยืนยันแล้ว กรุณาเข้าลิงก์ที่ระบุในอีเมลเพื่อทำการตั้งค่าให้เสร็จสิ้น",
	"emailVerified": "อีเมลได้รับการยืนยันแล้ว",
	"receiveAnnouncementFromInstance": "รับการแจ้งเตือนจากเซิร์ฟเวอร์นี้",
	"emailNotification": "การแจ้งเตือนทางอีเมล",
	"mention": "กล่าวถึง",
	"reply": "ตอบกลับ",
	"quote": "อ้างอิง",
	"follow": "กำลังติดตาม",
	"receiveFollowRequest": "ได้รับคำร้องขอติดตาม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"email": "E-Posta",
	"emailNotSupported": "Bu sunucu, E-Posta göndermeyi desteklemiyor.",
	"emailAddress": "E-Posta adresi",
	"verificationEmailSent": "Doğrulama e-postası gönderildi. Doğrulamayı tamamlamak için e-postadaki bağlantıyı takip edin.",
	"emailVerified": "E-posta adresi doğrulandı.",
	"receiveAnnouncementFromInstance": "Bu sunucudan bildirimler alın",
	"emailNotification": "E-posta bildirimi",
	"mention": "Bahsetmeler",
	"reply": "Yanıtlar",
	"quote": "Alıntılar",
	"follow": "Yeni takipçiler",
	"receiveFollowRequest": "Takip istekleri alındı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"email": "Email",
	"emailNotSupported": "This instance does not support sending emails",
	"emailAddress": "Email address",
	"verificationEmailSent": "A verification email has been sent. Please follow the included link to complete verification.",
	"emailVerified": "Email has been verified",
	"receiveAnnouncementFromInstance": "Receive notifications from this instance",
	"emailNotification": "Email notifications",
	"mention": "Mentions",
	"reply": "Replies",
	"quote": "Quotes",
	"follow": "New followers",
	"receiveFollowRequest": "Received follow requests"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"email": "E-mail",
	"emailNotSupported": "Цей інстанс не підтримує надсилання електронних листів.",
	"emailAddress": "E-mail адреса",
	"verificationEmailSent": "Електронний лист з підтвердженням відісланий. Будь ласка перейдіть по посиланню в листі для підтвердження.",
	"emailVerified": "Електронну пошту підтверджено.",
	"receiveAnnouncementFromInstance": "Отримувати оповіщення з інстансу",
	"emailNotification": "Сповіщення електронною поштою",
	"mention": "Згадка",
	"reply": "Відповіді",
	"quote": "Цитування",
	"follow": "Підписки",
	"receiveFollowRequest": "Запити на підписку"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"email": "Email",
	"emailNotSupported": "Máy chủ này không hỗ trợ gửi email",
	"emailAddress": "Địa chỉ email",
	"verificationEmailSent": "Một email xác minh đã được gửi. Vui lòng nhấn vào liên kết đính kèm để hoàn tất xác minh.",
	"emailVerified": "Email đã được xác minh",
	"receiveAnnouncementFromInstance": "Nhận thông báo từ máy chủ này",
	"emailNotification": "Thông báo email",
	"mention": "Nhắc đến",
	"reply": "Lượt trả lời",
	"quote": "Trích dẫn",
	"follow": "Đang theo dõi",
	"receiveFollowRequest": "Yêu cầu theo dõi"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"email": "邮箱",
	"emailNotSupported": "此服务器不支持发送邮件",
	"emailAddress": "电子邮件地址",
	"verificationEmailSent": "已发送确认电子邮件。请访问电子邮件中的链接以完成设置。",
	"emailVerified": "电子邮件地址已验证",
	"receiveAnnouncementFromInstance": "从服务器接收通知",
	"emailNotification": "邮件通知",
	"mention": "提及",
	"reply": "回复",
	"quote": "引用",
	"follow": "关注中",
	"receiveFollowRequest": "收到关注请求"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"email": "電子郵件",
	"emailNotSupported": "這個伺服器不支援寄送郵件",
	"emailAddress": "電子郵件位址",
	"verificationEmailSent": "已發送驗證電子郵件。請點擊進入電子郵件中的連結以完成驗證。",
	"emailVerified": "已成功驗證您的電子郵件地址",
	"receiveAnnouncementFromInstance": "接收來自伺服器的通知",
	"emailNotification": "郵件通知",
	"mention": "提及",
	"reply": "回覆",
	"quote": "引用",
	"follow": "追隨中",
	"receiveFollowRequest": "已收到追隨請求"
}
</locale>
