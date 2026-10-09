<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/email-settings" :label="$locale.sfc.emailServer" :keywords="['email']" icon="ti ti-mail">
			<div class="_gaps_m">
				<SearchMarker>
					<MkSwitch v-model="enableEmail">
						<template #label><SearchLabel>{{ $locale.sfc.enableEmail }}</SearchLabel> ({{ $locale.sfc.recommended }})</template>
						<template #caption><SearchText>{{ $locale.sfc.emailConfigInfo }}</SearchText></template>
					</MkSwitch>
				</SearchMarker>

				<template v-if="enableEmail">
					<SearchMarker>
						<MkInput v-model="email" type="email">
							<template #label><SearchLabel>{{ $locale.sfc.emailAddress }}</SearchLabel></template>
						</MkInput>
					</SearchMarker>

					<SearchMarker>
						<FormSection>
							<template #label><SearchLabel>{{ $locale.sfc.smtpConfig }}</SearchLabel></template>

							<div class="_gaps_m">
								<FormSplit :minWidth="280">
									<SearchMarker>
										<MkInput v-model="smtpHost">
											<template #label><SearchLabel>{{ $locale.sfc.smtpHost }}</SearchLabel></template>
										</MkInput>
									</SearchMarker>
									<SearchMarker>
										<MkInput v-model="smtpPort" type="number">
											<template #label><SearchLabel>{{ $locale.sfc.smtpPort }}</SearchLabel></template>
										</MkInput>
									</SearchMarker>
								</FormSplit>

								<FormSplit :minWidth="280">
									<SearchMarker>
										<MkInput v-model="smtpUser">
											<template #label><SearchLabel>{{ $locale.sfc.smtpUser }}</SearchLabel></template>
										</MkInput>
									</SearchMarker>
									<SearchMarker>
										<MkInput v-model="smtpPass" type="password" autocomplete="new-password">
											<template #label><SearchLabel>{{ $locale.sfc.smtpPass }}</SearchLabel></template>
										</MkInput>
									</SearchMarker>
								</FormSplit>

								<FormInfo>{{ $locale.sfc.emptyToDisableSmtpAuth }}</FormInfo>

								<SearchMarker>
									<MkSwitch v-model="smtpSecure">
										<template #label><SearchLabel>{{ $locale.sfc.smtpSecure }}</SearchLabel></template>
										<template #caption><SearchText>{{ $locale.sfc.smtpSecureInfo }}</SearchText></template>
									</MkSwitch>
								</SearchMarker>
							</div>
						</FormSection>
					</SearchMarker>
				</template>
			</div>
		</SearchMarker>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<div class="_buttons">
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
					<MkButton rounded @click="testEmail"><i class="ti ti-send"></i> {{ $locale.sfc.testEmail }}</MkButton>
				</div>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import FormInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { fetchInstance, instance } from '@features/instance/frontend/instance.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const meta = await misskeyApi('admin/meta');

const enableEmail = ref(meta.enableEmail);
const email = ref(meta.email);
const smtpSecure = ref(meta.smtpSecure);
const smtpHost = ref(meta.smtpHost);
const smtpPort = ref(meta.smtpPort);
const smtpUser = ref(meta.smtpUser);
const smtpPass = ref(meta.smtpPass);

async function testEmail() {
	const { canceled, result: destination } = await os.inputText({
		title: 'To',
		type: 'email',
		default: instance.maintainerEmail ?? '',
		placeholder: 'test@example.com',
		minLength: 1,
	});
	if (canceled) return;
	os.apiWithDialog('admin/send-email', {
		to: destination,
		subject: 'Test email',
		text: 'Yo',
	});
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableEmail: enableEmail.value,
		email: email.value,
		smtpSecure: smtpSecure.value,
		smtpHost: smtpHost.value,
		smtpPort: smtpPort.value,
		smtpUser: smtpUser.value,
		smtpPass: smtpPass.value,
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.emailServer,
	icon: 'ti ti-mail',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>

<locale locale="ar-SA" lang="json">
{
	"emailServer": "خادم البريد الإلكتروني",
	"enableEmail": "Enable email distribution",
	"recommended": "مقترح",
	"emailConfigInfo": "يستخدم لتأكيد عنوان بريدك الإلكتروني ولإعادة تعيين كلمة المرور إن نسيتها.",
	"emailAddress": "عنوان البريد الالكتروني",
	"smtpConfig": "إعدادات خادم SMTP",
	"smtpHost": "المضيف",
	"smtpPort": "المنفذ",
	"smtpUser": "اسم المستخدم",
	"smtpPass": "الكلمة السرية",
	"emptyToDisableSmtpAuth": "اترك اسم المستخدم وكلمة المرور فارغين لتعطيل التحقق من SMTP",
	"smtpSecure": "Use implicit SSL/TLS for SMTP connections",
	"smtpSecureInfo": "عطل هذا الخيار عند استخدام STARTTLS",
	"save": "حفظ",
	"testEmail": "Test email delivery"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"emailServer": "Servidor de correu electrònic ",
	"enableEmail": "Activar l'enviament de correus electrònics ",
	"recommended": "Recomanat",
	"emailConfigInfo": "Es fa servir per confirmar el teu correu quan et registres o oblides la contrasenya ",
	"emailAddress": "Adreça de correu electrònic",
	"smtpConfig": "Configuració del servidor SMTP",
	"smtpHost": "Amfitrió",
	"smtpPort": "Port",
	"smtpUser": "Nom d'usuari",
	"smtpPass": "Contrasenya",
	"emptyToDisableSmtpAuth": "No omplis el nom d'usuari i la contrasenya si vols deshabilitar l'autenticació SMTP",
	"smtpSecure": "Fes servir SSL/TLS per connexions SMTP",
	"smtpSecureInfo": "Desactiva això quan facis servir connexions STARTTLS",
	"save": "Desa",
	"testEmail": "Prova l'enviament de correu "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"emailServer": "Mailový server",
	"enableEmail": "Zapnout email dystribuci",
	"recommended": "Doporučeno",
	"emailConfigInfo": "Používá se na ověření emailové adresy během registrace nebo při zapomenutí hesla.",
	"emailAddress": "Emailová adresa",
	"smtpConfig": "Konfigurace SMTP serveru",
	"smtpHost": "Hostitel",
	"smtpPort": "Port",
	"smtpUser": "Uživatelské jméno",
	"smtpPass": "Heslo",
	"emptyToDisableSmtpAuth": "Zanechte uživatelské jméno a heslo prázdné pro vypnutí SMTP verifikace.",
	"smtpSecure": "Použít implicitní SSL/TLS pro SMTP připojení",
	"smtpSecureInfo": "Toto vypněte pokud používáte STARTTLS",
	"save": "Uložit",
	"testEmail": "Otestovat doručení emailů"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"emailServer": "Email server",
	"enableEmail": "Enable email distribution",
	"recommended": "Recommended",
	"emailConfigInfo": "Used to confirm your email during sign-up or if you forget your password",
	"emailAddress": "Email address",
	"smtpConfig": "SMTP Server Configuration",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Username",
	"smtpPass": "Password",
	"emptyToDisableSmtpAuth": "Leave username and password empty to disable SMTP authentication",
	"smtpSecure": "Use implicit SSL/TLS for SMTP connections",
	"smtpSecureInfo": "Turn this off when using STARTTLS",
	"save": "Save",
	"testEmail": "Test email delivery"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"emailServer": "Email-Server",
	"enableEmail": "Email-Versand aktivieren",
	"recommended": "Empfehlung",
	"emailConfigInfo": "Zur Email-Bestätigung bei Registrierung oder zum Zurücksetzen des Passworts verwendet",
	"emailAddress": "Email-Adresse",
	"smtpConfig": "SMTP-Server Konfiguration",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Benutzername",
	"smtpPass": "Passwort",
	"emptyToDisableSmtpAuth": "Benutzername und Passwort leer lassen, um SMTP-Verifizierung zu deaktivieren",
	"smtpSecure": "Für SMTP-Verbindungen implizit SSL/TLS verwenden",
	"smtpSecureInfo": "Schalte dies aus, falls du STARTTLS verwendest.",
	"save": "Speichern",
	"testEmail": "Emailversand testen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"emailServer": "Email server",
	"enableEmail": "Enable email distribution",
	"recommended": "Recommended",
	"emailConfigInfo": "Used to confirm your email during sign-up or if you forget your password",
	"emailAddress": "Email address",
	"smtpConfig": "SMTP Server Configuration",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Username",
	"smtpPass": "Password",
	"emptyToDisableSmtpAuth": "Leave username and password empty to disable SMTP authentication",
	"smtpSecure": "Use implicit SSL/TLS for SMTP connections",
	"smtpSecureInfo": "Turn this off when using STARTTLS",
	"save": "Save",
	"testEmail": "Test email delivery"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"emailServer": "Servidor de correo",
	"enableEmail": "Activar el envío de correos electrónicos",
	"recommended": "Recomendado",
	"emailConfigInfo": "Usar en caso de validación de correo electrónico y pedido de contraseña",
	"emailAddress": "Correo electrónico",
	"smtpConfig": "Configuración del servidor SMTP",
	"smtpHost": "Host",
	"smtpPort": "Puerto",
	"smtpUser": "Nombre de usuario",
	"smtpPass": "Contraseña",
	"emptyToDisableSmtpAuth": "Deje el nombre del usuario y la contraseña en blanco para deshabilitar la autenticación SMTP",
	"smtpSecure": "Usar SSL/TLS implícito en la conexión SMTP",
	"smtpSecureInfo": "Apagar cuando se use STARTTLS",
	"save": "Guardar",
	"testEmail": "Prueba de envío"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"emailServer": "Serveur de messagerie",
	"enableEmail": "Activer la distribution de courriel",
	"recommended": "Recommandé",
	"emailConfigInfo": "Utilisé pour confirmer votre adresse e-mail et réinitialiser votre mot de passe en cas d’oubli",
	"emailAddress": "Adresse e-mail",
	"smtpConfig": "Paramètres du serveur SMTP",
	"smtpHost": "Serveur distant",
	"smtpPort": "Port",
	"smtpUser": "Nom d’utilisateur·rice",
	"smtpPass": "Mot de passe",
	"emptyToDisableSmtpAuth": "Laisser le nom d’utilisateur et le mot de passe vides pour désactiver la vérification SMTP",
	"smtpSecure": "Utiliser SSL/TLS implicitement dans les connexions SMTP",
	"smtpSecureInfo": "Désactiver cette option lorsque STARTTLS est utilisé",
	"save": "Enregistrer",
	"testEmail": "Tester la distribution de courriel"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"emailServer": "Peladen surel",
	"enableEmail": "Nyalakan distribusi surel",
	"recommended": "Disarankan",
	"emailConfigInfo": "Digunakan untuk mengonfirmasi surel kamu disaat mendaftar dan lupa kata sandi",
	"emailAddress": "Alamat surel",
	"smtpConfig": "Konfigurasi peladen SMTP",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Nama Pengguna",
	"smtpPass": "Kata sandi",
	"emptyToDisableSmtpAuth": "Kosongkan nama pengguna dan kata sandi untuk menonaktifkan verifikasi SMTP",
	"smtpSecure": "Gunakan SSL/TLS implisit untuk koneksi SMTP",
	"smtpSecureInfo": "Matikan ini ketika menggunakan STARTTLS",
	"save": "Simpan",
	"testEmail": "Tes pengiriman surel"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"emailServer": "Server email",
	"enableEmail": "Abilita consegna email",
	"recommended": "Consigliato",
	"emailConfigInfo": "Utilizzato per verificare il tuo indirizzo di posta elettronica e per ripristinare la password",
	"emailAddress": "Indirizzo di posta elettronica",
	"smtpConfig": "Impostazioni del server SMTP",
	"smtpHost": "Host SMTP",
	"smtpPort": "Porta",
	"smtpUser": "Nome utente",
	"smtpPass": "Password",
	"emptyToDisableSmtpAuth": "Lasciare i campi vuoti se non c'è autenticazione SMTP",
	"smtpSecure": "Usare SSL/TLS implicito per le connessioni SMTP",
	"smtpSecureInfo": "Disabilitare quando è attivo STARTTLS.",
	"save": "Salva",
	"testEmail": "Verifica il funzionamento"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"emailServer": "メールサーバー",
	"enableEmail": "メール配信機能を有効化する",
	"recommended": "推奨",
	"emailConfigInfo": "メールアドレスの確認やパスワードリセットの際に使います",
	"emailAddress": "メールアドレス",
	"smtpConfig": "SMTP サーバーの設定",
	"smtpHost": "ホスト",
	"smtpPort": "ポート",
	"smtpUser": "ユーザー名",
	"smtpPass": "パスワード",
	"emptyToDisableSmtpAuth": "ユーザー名とパスワードを空欄にすることで、SMTP認証を無効化出来ます",
	"smtpSecure": "SMTP 接続に暗黙的なSSL/TLSを使用する",
	"smtpSecureInfo": "STARTTLS使用時はオフにします。",
	"save": "保存",
	"testEmail": "配信テスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"emailServer": "メールサーバー",
	"enableEmail": "メール配信を受け取る",
	"recommended": "推奨",
	"emailConfigInfo": "メールアドレスの確認とかパスワードリセットの時に使うで",
	"emailAddress": "メールアドレス",
	"smtpConfig": "SMTP サーバーの設定",
	"smtpHost": "ホスト",
	"smtpPort": "ポート",
	"smtpUser": "ユーザー名",
	"smtpPass": "パスワード",
	"emptyToDisableSmtpAuth": "ユーザー名とパスワードになんも入れんかったら、SMTP認証を無効化するで",
	"smtpSecure": "SMTP 接続に暗黙的なSSL/TLSを使用する",
	"smtpSecureInfo": "STARTTLS使っとる時はオフにしてや。",
	"save": "とっとく",
	"testEmail": "配信テスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"emailServer": "Email server",
	"enableEmail": "Enable email distribution",
	"recommended": "Recommended",
	"emailConfigInfo": "Used to confirm your email during sign-up or if you forget your password",
	"emailAddress": "Tansa imayl",
	"smtpConfig": "SMTP Server Configuration",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Isem n umseqdac",
	"smtpPass": "Awal uffir",
	"emptyToDisableSmtpAuth": "Leave username and password empty to disable SMTP authentication",
	"smtpSecure": "Use implicit SSL/TLS for SMTP connections",
	"smtpSecureInfo": "Turn this off when using STARTTLS",
	"save": "Sekles",
	"testEmail": "Test email delivery"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"emailServer": "Email server",
	"enableEmail": "Enable email distribution",
	"recommended": "Recommended",
	"emailConfigInfo": "Used to confirm your email during sign-up or if you forget your password",
	"emailAddress": "Email address",
	"smtpConfig": "SMTP Server Configuration",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "ಬಳಕೆಹೆಸರು",
	"smtpPass": "ಗುಪ್ತಪದ",
	"emptyToDisableSmtpAuth": "Leave username and password empty to disable SMTP authentication",
	"smtpSecure": "Use implicit SSL/TLS for SMTP connections",
	"smtpSecureInfo": "Turn this off when using STARTTLS",
	"save": "ಉಳಿಸಿ",
	"testEmail": "Test email delivery"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"emailServer": "메일 서버",
	"enableEmail": "이메일 송신 기능 활성화",
	"recommended": "추천",
	"emailConfigInfo": "가입 시 메일 주소 확인이나 비밀번호 초기화 시에 사용합니다.",
	"emailAddress": "메일 주소",
	"smtpConfig": "SMTP 서버 설정",
	"smtpHost": "호스트",
	"smtpPort": "포트",
	"smtpUser": "유저 이름",
	"smtpPass": "비밀번호",
	"emptyToDisableSmtpAuth": "SMTP 인증을 사용하지 않으려면 공란으로 비워둡니다.",
	"smtpSecure": "SMTP 연결에 Implicit SSL/TTS 사용",
	"smtpSecureInfo": "STARTTLS 사용 시에는 해제합니다.",
	"save": "저장",
	"testEmail": "이메일 전송 테스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"emailServer": "Email-Server",
	"enableEmail": "Email distributie inschakelen",
	"recommended": "Recommended",
	"emailConfigInfo": "Wordt gebruikt om je email te bevestigen tijdens het aanmelden of als je je wachtwoord bent vergeten",
	"emailAddress": "Email adres",
	"smtpConfig": "SMTP-server configuratie",
	"smtpHost": "Server",
	"smtpPort": "Poort",
	"smtpUser": "Gebruikersnaam",
	"smtpPass": "Wachtwoord",
	"emptyToDisableSmtpAuth": "Laat gebruikersnaam en wachtwoord leeg om SMTP-authenticatie uit te schakelen.",
	"smtpSecure": "Impliciet SSL/TLS gebruiken voor SMTP-verbindingen",
	"smtpSecureInfo": "Schakel dit uit bij gebruik van STARTTLS",
	"save": "Opslaan",
	"testEmail": "Emailversand testen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"emailServer": "Email server",
	"enableEmail": "Enable email distribution",
	"recommended": "Anbefalt",
	"emailConfigInfo": "Used to confirm your email during sign-up or if you forget your password",
	"emailAddress": "Email address",
	"smtpConfig": "SMTP Server Configuration",
	"smtpHost": "Vert",
	"smtpPort": "Port",
	"smtpUser": "Brukernavn",
	"smtpPass": "Passord",
	"emptyToDisableSmtpAuth": "Leave username and password empty to disable SMTP authentication",
	"smtpSecure": "Use implicit SSL/TLS for SMTP connections",
	"smtpSecureInfo": "Turn this off when using STARTTLS",
	"save": "Lagre",
	"testEmail": "Test email delivery"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"emailServer": "Serwer poczty e-mail",
	"enableEmail": "Włącz dostarczanie wiadomości e-mail",
	"recommended": "Zalecane",
	"emailConfigInfo": "Wykorzystywany do potwierdzenia adresu e-mail w trakcie rejestracji, lub gdy zapomnisz hasła",
	"emailAddress": "Adres e-mail",
	"smtpConfig": "Konfiguracja serwera SMTP",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Nazwa użytkownika",
	"smtpPass": "Hasło",
	"emptyToDisableSmtpAuth": "Pozostaw adres e-mail i hasło puste, aby wyłączyć weryfikację SMTP",
	"smtpSecure": "Użyj niejawnego SSL/TLS dla połączeń SMTP",
	"smtpSecureInfo": "Wyłącz, jeżeli używasz STARTTLS",
	"save": "Zapisz",
	"testEmail": "Przetestuj dostarczanie wiadomości e-mail"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"emailServer": "Servidor de e-mail",
	"enableEmail": "Habilitar envio de e-mails",
	"recommended": "Recomendado",
	"emailConfigInfo": "Usado para confirmar o seu endereço de e-mail e redefinir sua senha",
	"emailAddress": "Endereço de e-mail",
	"smtpConfig": "Configuração do servidor SMTP",
	"smtpHost": "Host",
	"smtpPort": "Porta",
	"smtpUser": "Nome de usuário",
	"smtpPass": "Senha",
	"emptyToDisableSmtpAuth": "Desative a autenticação SMTP deixando o nome de usuário e a senha em branco.",
	"smtpSecure": "Use SSL/TLS implícito para conexões SMTP",
	"smtpSecureInfo": "Desative esta opção ao utilizar STARTTLS.",
	"save": "Salvar",
	"testEmail": "Testar envio de e-mail"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"emailServer": "Сервер электронной почты",
	"enableEmail": "Включить обмен электронной почтой",
	"recommended": "Рекомендуем",
	"emailConfigInfo": "Используется для подтверждения адреса электронной почты и сброса пароля.",
	"emailAddress": "Адрес электронной почты",
	"smtpConfig": "Конфигурация SMTP-сервера",
	"smtpHost": "Хост",
	"smtpPort": "Порт",
	"smtpUser": "Имя пользователя",
	"smtpPass": "Пароль",
	"emptyToDisableSmtpAuth": "Не заполняйте имя пользователя и пароль, чтобы отключить аутентификацию в SMTP.",
	"smtpSecure": "Использовать SSL/TLS",
	"smtpSecureInfo": "Выключите при использовании STARTTLS.",
	"save": "Сохранить",
	"testEmail": "Отправить тестовое письмо"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"emailServer": "Email server",
	"enableEmail": "Zapnúť email",
	"recommended": "Odporúčané",
	"emailConfigInfo": "Používa sa na overenie emaily pri registrácii alebo pri zabudnutí hesla",
	"emailAddress": "Emailová adresa",
	"smtpConfig": "Nastavenia SMTP servera",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Meno používateľa",
	"smtpPass": "Heslo",
	"emptyToDisableSmtpAuth": "Vynechaním mena hesla vypnete SMTP verifikáciu",
	"smtpSecure": "Použiť implicitné SSL/TLS pre SMTP spojenia",
	"smtpSecureInfo": "Toto vypnite keď používate STARTTLS",
	"save": "Uložiť",
	"testEmail": "Doručenie testovacieho emailu"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"emailServer": "เซิร์ฟเวอร์ของอีเมล",
	"enableEmail": "เปิดใช้งานการกระจายอีเมล",
	"recommended": "แนะนำ",
	"emailConfigInfo": "ใช้สำหรับการยืนยันอีเมลหรือการรีเซ็ตรหัสผ่าน",
	"emailAddress": "ที่อยู่อีเมล",
	"smtpConfig": "ตั้งค่าเซิร์ฟเวอร์ SMTP",
	"smtpHost": "โฮสต์",
	"smtpPort": "พอร์ต",
	"smtpUser": "ชื่อผู้ใช้",
	"smtpPass": "รหัสผ่าน",
	"emptyToDisableSmtpAuth": "ปล่อยชื่อผู้ใช้และรหัสผ่านว่างไว้เพื่อปิดใช้งานการยืนยัน SMTP",
	"smtpSecure": "ใช้โดยนัย SSL/TLS สำหรับการเชื่อมต่อ SMTP",
	"smtpSecureInfo": "ปิดสิ่งนี้เมื่อใช้ STARTTLS",
	"save": "บันทึก",
	"testEmail": "ทดสอบการส่งอีเมล"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"emailServer": "E-posta sunucusu",
	"enableEmail": "E-posta dağıtımını etkinleştir",
	"recommended": "Önerilen",
	"emailConfigInfo": "Kayıt sırasında veya şifreni unuttuğunda E-postanı doğrulamak için kullanılır.",
	"emailAddress": "E-Posta adresi",
	"smtpConfig": "SMTP Sunucu yapılandırması",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Kullanıcı adı",
	"smtpPass": "Şifre",
	"emptyToDisableSmtpAuth": "SMTP kimlik doğrulamasını devre dışı bırakmak için kullanıcı adı ve şifre alanlarını boş bırakın.",
	"smtpSecure": "SMTP bağlantıları için örtük SSL/TLS kullanın",
	"smtpSecureInfo": "STARTTLS kullanırken bunu kapatın.",
	"save": "Kaydet",
	"testEmail": "Test E-postası gönderimi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"emailServer": "Email server",
	"enableEmail": "Enable email distribution",
	"recommended": "Recommended",
	"emailConfigInfo": "Used to confirm your email during sign-up or if you forget your password",
	"emailAddress": "Email address",
	"smtpConfig": "SMTP Server Configuration",
	"smtpHost": "Host",
	"smtpPort": "Port",
	"smtpUser": "Username",
	"smtpPass": "Password",
	"emptyToDisableSmtpAuth": "Leave username and password empty to disable SMTP authentication",
	"smtpSecure": "Use implicit SSL/TLS for SMTP connections",
	"smtpSecureInfo": "Turn this off when using STARTTLS",
	"save": "Save",
	"testEmail": "Test email delivery"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"emailServer": "Email сервер",
	"enableEmail": "Увімкнути функцію доставки пошти",
	"recommended": "Рекомендоване",
	"emailConfigInfo": "Використовується для підтвердження електронної пошти підчас реєстрації, а також для відновлення паролю.",
	"emailAddress": "E-mail адреса",
	"smtpConfig": "Налаштування сервера SMTP",
	"smtpHost": "Хост",
	"smtpPort": "Порт",
	"smtpUser": "Ім'я користувача",
	"smtpPass": "Пароль",
	"emptyToDisableSmtpAuth": "Залиште назву користувача і пароль пустими для вимкнення підтвердження SMTP",
	"smtpSecure": "Використовувати безумовне шифрування SSL/TLS для з'єднань SMTP",
	"smtpSecureInfo": "Вимкніть при використанні STARTTLS  ",
	"save": "Зберегти",
	"testEmail": "Тестовий email"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"emailServer": "Email máy chủ",
	"enableEmail": "Bật phân phối email",
	"recommended": "Được đề xuất",
	"emailConfigInfo": "Được dùng để xác minh email của bạn lúc đăng ký hoặc nếu bạn quên mật khẩu của mình",
	"emailAddress": "Địa chỉ email",
	"smtpConfig": "Cấu hình máy chủ SMTP",
	"smtpHost": "Host",
	"smtpPort": "Cổng",
	"smtpUser": "Tên người dùng",
	"smtpPass": "Mật khẩu",
	"emptyToDisableSmtpAuth": "Để trống tên người dùng và mật khẩu để tắt xác thực SMTP",
	"smtpSecure": "Dùng SSL/TLS ngầm định cho các kết nối SMTP",
	"smtpSecureInfo": "Tắt cái này nếu dùng STARTTLS",
	"save": "Lưu",
	"testEmail": "Kiểm tra vận chuyển email"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"emailServer": "邮件服务器",
	"enableEmail": "启用发送邮件功能",
	"recommended": "推荐",
	"emailConfigInfo": "用于确认电子邮件和密码重置",
	"emailAddress": "电子邮件地址",
	"smtpConfig": "SMTP 服务器设置",
	"smtpHost": "主机名",
	"smtpPort": "端口",
	"smtpUser": "用户名",
	"smtpPass": "密码",
	"emptyToDisableSmtpAuth": "用户名和密码留空可以禁用 SMTP 验证",
	"smtpSecure": "在 SMTP 连接中使用隐式 SSL / TLS",
	"smtpSecureInfo": "使用 STARTTLS 时关闭。",
	"save": "保存",
	"testEmail": "邮件发送测试"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"emailServer": "電子郵件伺服器",
	"enableEmail": "啟用發送電子郵件功能",
	"recommended": "推薦",
	"emailConfigInfo": "用於確認電子郵件地址及密碼重置",
	"emailAddress": "電子郵件位址",
	"smtpConfig": "SMTP 伺服器設定",
	"smtpHost": "主機",
	"smtpPort": "埠",
	"smtpUser": "使用者名稱",
	"smtpPass": "密碼",
	"emptyToDisableSmtpAuth": "將使用者名稱和密碼留空以關閉 SMTP 驗證。",
	"smtpSecure": "在 SMTP 連接中使用隱式 SSL/TLS",
	"smtpSecureInfo": "使用 STARTTLS 時關閉。",
	"save": "儲存",
	"testEmail": "測試郵件發送"
}
</locale>
