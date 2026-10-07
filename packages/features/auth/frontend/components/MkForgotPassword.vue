<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="370"
	:height="400"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.forgotPassword }}</template>

	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<form v-if="instance.enableEmail" @submit.prevent="onSubmit">
			<div class="_gaps_m">
				<MkInput v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" :spellcheck="false" autofocus required>
					<template #label>{{ $locale.sfc.username }}</template>
					<template #prefix>@</template>
				</MkInput>

				<MkInput v-model="email" type="email" :spellcheck="false" required>
					<template #label>{{ $locale.sfc.emailAddress }}</template>
					<template #caption>{{ $locale.sfc.enterEmail }}</template>
				</MkInput>

				<MkButton type="submit" rounded :disabled="processing" primary style="margin: 0 auto;">{{ $locale.sfc.send }}</MkButton>

				<MkInfo>{{ $locale.sfc.ifNoEmail }}</MkInfo>
			</div>
		</form>
		<div v-else>
			{{ $locale.sfc.contactAdmin }}
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { instance } from '@features/instance/frontend/instance.js';

const emit = defineEmits<{
	(ev: 'done'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const username = ref('');
const email = ref('');
const processing = ref(false);

async function onSubmit() {
	processing.value = true;
	await os.apiWithDialog('request-reset-password', {
		username: username.value,
		email: email.value,
	});
	emit('done');
	dialog.value?.close();
}
</script>

<locale locale="ar-SA" lang="json">
{
  "forgotPassword": "نسيتَ كلمة السر",
  "username": "اسم المستخدم",
  "emailAddress": "عنوان البريد الالكتروني",
  "enterEmail": "أدخل البريد الإلكتروني المرتبط بحسابك لكي يرسل إليك رابط لإعادة تعيين كلمة المرور.",
  "send": "أرسل",
  "ifNoEmail": "إذا لم تربط حسابك ببريد إلكتروني سيتوجب عليك التواصل مع مدير الموقع.",
  "contactAdmin": "هذا المثيل لا يدعم استخدام البريد الإلكتروني، إن أردت إعادة تعيين كلمة المرور تواصل مع المدير."
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "forgotPassword": "Restableix la contrasenya ",
  "username": "Nom d'usuari",
  "emailAddress": "Adreça de correu electrònic",
  "enterEmail": "Escriu l'adreça de correu electrònic amb la que et vas registrar. S'enviarà un correu electrònic amb un enllaç perquè puguis canviar-la.",
  "send": "Envia",
  "ifNoEmail": "Si no vas fer servir una adreça de correu electrònic per registrar-te, si us plau posa't en contacte amb l'administrador.",
  "contactAdmin": "Aquesta instància no suporta registrar-se amb correu electrònic. Si us plau, contacta amb l'administrador del servidor."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "forgotPassword": "Zapomenuté heslo",
  "username": "Uživatelské jméno",
  "emailAddress": "Emailová adresa",
  "enterEmail": "Zadejte emailovou adresu, kterou jste použili při registraci. Na ni vám pak bude zaslán odkaz, pomocí kterého si můžete obnovit heslo.",
  "send": "Odeslat",
  "ifNoEmail": "Pokud jste při registraci nepoužili email, obraťte se na správce instance.",
  "contactAdmin": "Tato instance nepodporuje používání emailových adres, pro obnovení hesla se obraťte na správce instance."
}
</locale>

<locale locale="da-DK" lang="json">
{
  "forgotPassword": "Forgot password",
  "username": "Username",
  "emailAddress": "Email address",
  "enterEmail": "Enter the email address you used to register. A link with which you can reset your password will then be sent to it.",
  "send": "Send",
  "ifNoEmail": "If you did not use an email during registration, please contact the instance administrator instead.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="de-DE" lang="json">
{
  "forgotPassword": "Passwort vergessen",
  "username": "Benutzername",
  "emailAddress": "Email-Adresse",
  "enterEmail": "Gib die Email-Adresse ein, mit der du dich registriert hast. An diese wird ein Link gesendet, mit dem du dein Passwort zurücksetzen kannst.",
  "send": "Senden",
  "ifNoEmail": "Solltest du bei der Registrierung keine Email-Adresse angegeben haben, wende dich bitte an den Administrator.",
  "contactAdmin": "Diese Instanz unterstützt die Verwendung von Email-Adressen nicht. Wende dich an den Administrator, um dein Passwort zurückzusetzen."
}
</locale>

<locale locale="en-US" lang="json">
{
  "forgotPassword": "Forgot password",
  "username": "Username",
  "emailAddress": "Email address",
  "enterEmail": "Enter the email address you used to register. A link with which you can reset your password will then be sent to it.",
  "send": "Send",
  "ifNoEmail": "If you did not use an email during registration, please contact the instance administrator instead.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="es-ES" lang="json">
{
  "forgotPassword": "Olvidé mi contraseña",
  "username": "Nombre de usuario",
  "emailAddress": "Correo electrónico",
  "enterEmail": "Ingrese el correo usado para registrar la cuenta. Se enviará un link para resetear la contraseña.",
  "send": "Enviar",
  "ifNoEmail": "Si no utilizó un correo para crear la cuenta, contáctese con el administrador.",
  "contactAdmin": "Esta instancia no admite el uso de direcciones de correo electrónico, póngase en contacto con el administrador de la instancia para restablecer su contraseña"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "forgotPassword": "Mot de passe oublié",
  "username": "Nom d’utilisateur·rice",
  "emailAddress": "Adresse e-mail",
  "enterEmail": "Entrez ici l'adresse e-mail que vous avez enregistrée pour votre compte. Un lien vous permettant de réinitialiser votre mot de passe sera envoyé à cette adresse.",
  "send": "Envoyer",
  "ifNoEmail": "Si vous n'avez pas enregistré d'adresse e-mail, merci de contacter l'administrateur·rice de votre instance.",
  "contactAdmin": "Cette instance ne permettant pas l'utilisation d'adresses e-mail, prenez contact avec l'administrateur·rice pour procéder à la réinitialisation de votre mot de passe."
}
</locale>

<locale locale="id-ID" lang="json">
{
  "forgotPassword": "Lupa Kata Sandi",
  "username": "Nama Pengguna",
  "emailAddress": "Alamat surel",
  "enterEmail": "Masukkan alamat surel yang kamu gunakan pada saat mendaftar. Sebuah tautan untuk mengatur ulang kata sandi kamu akan dikirimkan ke alamat surel tersebut.",
  "send": "Kirim",
  "ifNoEmail": "Apabila kamu tidak menggunakan surel pada saat pendaftaran, mohon hubungi admin segera.",
  "contactAdmin": "Instansi ini tidak mendukung menggunakan alamat surel, mohon kontak admin untuk mengatur ulang password kamu."
}
</locale>

<locale locale="it-IT" lang="json">
{
  "forgotPassword": "Hai dimenticato la password?",
  "username": "Nome utente",
  "emailAddress": "Indirizzo di posta elettronica",
  "enterEmail": "Inserisci l'indirizzo di posta elettronica che hai registrato nel tuo profilo. Il collegamento necessario per ripristinare la password verrà inviato a questo indirizzo.",
  "send": "Inviare",
  "ifNoEmail": "Se il tuo indirizzo email non risulta registrato, contatta l'amministrazione dell'istanza.",
  "contactAdmin": "Poiché questa istanza non permette di impostare l'indirizzo mail, contatta l'amministrazione per  ripristinare la password.\n"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "forgotPassword": "パスワードを忘れた",
  "username": "ユーザー名",
  "emailAddress": "メールアドレス",
  "enterEmail": "アカウントに登録したメールアドレスを入力してください。そのアドレス宛てに、パスワードリセット用のリンクが送信されます。",
  "send": "送信",
  "ifNoEmail": "メールアドレスを登録していない場合は、管理者までお問い合わせください。",
  "contactAdmin": "このサーバーではメールがサポートされていないため、パスワードリセットを行う場合は管理者までお問い合わせください。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "forgotPassword": "パスワード忘れたん？",
  "username": "ユーザー名",
  "emailAddress": "メールアドレス",
  "enterEmail": "アカウントに登録したメールアドレスをここに入力してや。そのアドレス宛に、パスワードリセット用のリンクが送られるから待っててな～。",
  "send": "送信",
  "ifNoEmail": "メールアドレスを登録してへんのやったら、管理者まで教えてな～。",
  "contactAdmin": "このサーバーはメールに対応してへんから、パスワードリセットをしたいときは管理者まで教えてな～。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "forgotPassword": "Forgot password",
  "username": "Isem n umseqdac",
  "emailAddress": "Tansa imayl",
  "enterEmail": "Enter the email address you used to register. A link with which you can reset your password will then be sent to it.",
  "send": "Send",
  "ifNoEmail": "If you did not use an email during registration, please contact the instance administrator instead.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "forgotPassword": "Forgot password",
  "username": "ಬಳಕೆಹೆಸರು",
  "emailAddress": "Email address",
  "enterEmail": "Enter the email address you used to register. A link with which you can reset your password will then be sent to it.",
  "send": "Send",
  "ifNoEmail": "If you did not use an email during registration, please contact the instance administrator instead.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "forgotPassword": "비밀번호 재설정",
  "username": "유저명",
  "emailAddress": "메일 주소",
  "enterEmail": "여기에 계정에 등록한 메일 주소를 입력해 주세요. 입력한 메일 주소로 비밀번호 재설정 링크를 발송합니다.",
  "send": "전송",
  "ifNoEmail": "메일 주소를 등록하지 않은 경우, 관리자에 문의해 주십시오.",
  "contactAdmin": "이 서버에서는 메일 기능이 지원되지 않습니다. 비밀번호를 재설정하려면 관리자에게 문의해 주십시오."
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "forgotPassword": "Wachtwoord vergeten",
  "username": "Gebruikersnaam",
  "emailAddress": "Email adres",
  "enterEmail": "Enter the email address you used to register. A link with which you can reset your password will then be sent to it.",
  "send": "Stuur",
  "ifNoEmail": "If you did not use an email during registration, please contact the instance administrator instead.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="no-NO" lang="json">
{
  "forgotPassword": "Glemt passord",
  "username": "Brukernavn",
  "emailAddress": "Email address",
  "enterEmail": "Enter the email address you used to register. A link with which you can reset your password will then be sent to it.",
  "send": "Send",
  "ifNoEmail": "If you did not use an email during registration, please contact the instance administrator instead.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "forgotPassword": "Nie pamiętam hasła",
  "username": "Nazwa użytkownika",
  "emailAddress": "Adres e-mail",
  "enterEmail": "Wpisz adres e-mail użyty do rejestracji. Zostanie do niego wysłany link, za pomocą którego możesz zresetować hasło.",
  "send": "Wyślij",
  "ifNoEmail": "Jeżeli nie podano adresu e-mail podczas rejestracji, skontaktuj się z administratorem zamiast tego.",
  "contactAdmin": "Jeżeli Twoja instancja nie obsługuje adresów e-mail, skontaktuj się zamiast tego z administratorem, aby zresetować hasło."
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "forgotPassword": "Esqueci-me da senha",
  "username": "Nome de usuário",
  "emailAddress": "Endereço de e-mail",
  "enterEmail": "Por favor, insira o endereço de e-mail usado no cadastro de sua conta. Um link para redefinição de senha será enviado para esse endereço.",
  "send": "Enviar",
  "ifNoEmail": "Caso você não tenha registrado um endereço de e-mail, por favor, entre em contato com o administrador.",
  "contactAdmin": "Essa instância não possui suporte ao uso de endereços de email, contate seu administrador para mudar a sua senha."
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "forgotPassword": "Забыли пароль?",
  "username": "Имя пользователя",
  "emailAddress": "Адрес электронной почты",
  "enterEmail": "Введите адрес электронной почты, который ввели при регистрации. На неё будет выслана ссылка для смены пароля.",
  "send": "Отправить",
  "ifNoEmail": "Если вы не ввели свой адрес электронной почты, свяжитесь с администратором ресурса, чтобы сменить пароль.",
  "contactAdmin": "Здесь не используются адреса электронной почты, так что свяжитесь с администратором, чтобы поменять пароль."
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "forgotPassword": "Zabudnuté heslo",
  "username": "Meno používateľa",
  "emailAddress": "Emailová adresa",
  "enterEmail": "Zadajte emailovú adresu, ktorú ste použili pri registrácii. Pošleme vám na ňu odkaz, cez ktorý si môžete obnoviť heslo.",
  "send": "Poslať",
  "ifNoEmail": "Ak ste pri registrácii nepoužili email, prosím kontaktujte administrátora.",
  "contactAdmin": "Tento server nepodporuje používanie emailových adries, prosím kontaktuje administrátor, ktorý vám resetuje heslo."
}
</locale>

<locale locale="th-TH" lang="json">
{
  "forgotPassword": "ลืมรหัสผ่าน",
  "username": "ชื่อผู้ใช้",
  "emailAddress": "ที่อยู่อีเมล",
  "enterEmail": "ป้อนที่อยู่อีเมลที่คุณเคยใช้ในการลงทะเบียนไว้ ลิงก์ที่คุณสามารถรีเซ็ตรหัสผ่านได้นั้นจะถูกส่งไปนะ",
  "send": "ส่ง",
  "ifNoEmail": "หากลงทะเบียนแบบไม่ใช้อีเมล โปรดติดต่อผู้ดูแลระบบ",
  "contactAdmin": "เนื่องจากเซิร์ฟเวอร์นี้ไม่รองรับการส่งอีเมล หากต้องการรีเซ็ตรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "forgotPassword": "Şifremi unuttum",
  "username": "Kullanıcı Adı",
  "emailAddress": "E-Posta adresi",
  "enterEmail": "Kayıt olurken kullandığın E-Posta adresini gir. Şifreni sıfırlayabileceğin bir bağlantı bu adrese gönderilecek.",
  "send": "Gönder",
  "ifNoEmail": "Kayıt sırasında E-Posta kullanmadıysanız, lütfen bunun yerine sunucu yöneticisiyle iletişime geçin.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "forgotPassword": "Forgot password",
  "username": "Username",
  "emailAddress": "Email address",
  "enterEmail": "Enter the email address you used to register. A link with which you can reset your password will then be sent to it.",
  "send": "Send",
  "ifNoEmail": "If you did not use an email during registration, please contact the instance administrator instead.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "forgotPassword": "Я забув пароль",
  "username": "Ім'я користувача",
  "emailAddress": "E-mail адреса",
  "enterEmail": "Enter the email address you used to register. A link with which you can reset your password will then be sent to it.",
  "send": "Відправити",
  "ifNoEmail": "If you did not use an email during registration, please contact the instance administrator instead.",
  "contactAdmin": "This instance does not support using email addresses, please contact the instance administrator to reset your password instead."
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "forgotPassword": "Quên mật khẩu",
  "username": "Tên người dùng",
  "emailAddress": "Địa chỉ email",
  "enterEmail": "Nhập địa chỉ email bạn đã sử dụng để đăng ký. Một liên kết mà bạn có thể đặt lại mật khẩu của mình sau đó sẽ được gửi đến nó.",
  "send": "Gửi",
  "ifNoEmail": "Nếu bạn không sử dụng email lúc đăng ký, vui lòng liên hệ với quản trị viên.",
  "contactAdmin": "Máy chủ này không hỗ trợ sử dụng địa chỉ email, vui lòng liên hệ với quản trị viên để đặt lại mật khẩu của bạn."
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "forgotPassword": "忘记密码",
  "username": "用户名",
  "emailAddress": "电子邮件地址",
  "enterEmail": "请输入您设置的电子邮箱地址，密码重置链接将发送至该邮箱上。",
  "send": "发送",
  "ifNoEmail": "如果您没有设置电子邮件地址，请联系管理员。",
  "contactAdmin": "该服务器不支持发送电子邮件。如果您想重设密码，请联系管理员。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "forgotPassword": "忘記密碼",
  "username": "使用者名稱",
  "emailAddress": "電子郵件位址",
  "enterEmail": "請輸入您的帳戶註冊的電子郵件地址。 密碼重置連結將被發送到該電子郵件地址。",
  "send": "發送",
  "ifNoEmail": "如果您還沒有註冊您的電子郵件地址，請聯繫管理員。 ",
  "contactAdmin": "本伺服器不支援電子郵件，請聯繫您的管理員重置您的密碼。 "
}
</locale>
