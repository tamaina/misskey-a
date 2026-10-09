<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="370"
	:height="400"
	@close="onClose"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.authentication }}</template>

	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<div style="padding: 0 0 16px 0; text-align: center;">
			<img src="/fluent-emoji/1f510.png" alt="🔐" style="display: block; margin: 0 auto; width: 48px;">
			<div style="margin-top: 16px;">{{ $locale.sfc.authenticationRequiredToContinue }}</div>
		</div>

		<form @submit.prevent="done">
			<div class="_gaps">
				<MkInput ref="passwordInput" v-model="password" :placeholder="$locale.sfc.password" type="password" autocomplete="current-password webauthn" required :withPasswordToggle="true">
					<template #prefix><i class="ti ti-password"></i></template>
				</MkInput>

				<MkInput v-if="$i.twoFactorEnabled" v-model="token" type="text" :pattern="isBackupCode ? '^[A-Z0-9]{32}$' :'^[0-9]{6}$'" autocomplete="one-time-code" required :spellcheck="false" :inputmode="isBackupCode ? undefined : 'numeric'">
					<template #label>{{ $locale.sfc.token }} ({{ $locale.sfc['2fa'] }})</template>
					<template #prefix><i v-if="isBackupCode" class="ti ti-key"></i><i v-else class="ti ti-123"></i></template>
					<template #caption><button class="_textButton" type="button" @click="isBackupCode = !isBackupCode">{{ isBackupCode ? $locale.sfc.useTotp : $locale.sfc.useBackupCode }}</button></template>
				</MkInput>

				<MkButton :disabled="(password ?? '') == '' || ($i.twoFactorEnabled && (token ?? '') == '')" type="submit" primary rounded style="margin: 0 auto;"><i class="ti ti-lock-open"></i> {{ $locale.sfc.continue }}</MkButton>
			</div>
		</form>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef, ref } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

const emit = defineEmits<{
	(ev: 'done', v: { password: string; token: string | null; }): void;
	(ev: 'closed'): void;
	(ev: 'cancelled'): void;
}>();

const dialog = useTemplateRef('dialog');
const passwordInput = useTemplateRef('passwordInput');
const password = ref('');
const isBackupCode = ref(false);
const token = ref<string | null>(null);

function onClose() {
	emit('cancelled');
	if (dialog.value) dialog.value.close();
}

function done() {
	emit('done', { password: password.value, token: token.value });
	if (dialog.value) dialog.value.close();
}

onMounted(() => {
	if (passwordInput.value) passwordInput.value.focus();
});
</script>

<locale locale="ar-SA" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "الكلمة السرية",
	"token": "الرمز المميز",
	"2fa": "الاستيثاق بعاملَيْن",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "متابعة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"authentication": "Autenticació ",
	"authenticationRequiredToContinue": "Si us plau autentificat per continuar",
	"password": "Contrasenya",
	"token": "Codi de verificació",
	"2fa": "Autenticació de doble factor",
	"useTotp": "Usa una contrasenya d'un sol ús",
	"useBackupCode": "Usa un codi de recuperació",
	"continue": "Continuar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Heslo",
	"token": "Token",
	"2fa": "Dvoufázové ověření",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Pokračovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Password",
	"token": "Token",
	"2fa": "Two-factor authentication",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"authentication": "Authentifikation",
	"authenticationRequiredToContinue": "Bitte authentifiziere dich, um fortzufahren",
	"password": "Passwort",
	"token": "Token",
	"2fa": "Zwei-Faktor-Authentifizierung",
	"useTotp": "Gib das Einmalpasswort ein",
	"useBackupCode": "Verwende die Backup-Codes",
	"continue": "Fortfahren"
}
</locale>

<locale locale="en-US" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Password",
	"token": "Token",
	"2fa": "Two-factor authentication",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"authentication": "Autenticación",
	"authenticationRequiredToContinue": "Por favor, autentifícate para continuar",
	"password": "Contraseña",
	"token": "Token",
	"2fa": "Autenticación de doble factor",
	"useTotp": "Introduce la contraseña de un solo uso",
	"useBackupCode": "Usar códigos de respaldo",
	"continue": "Continuar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"authentication": "Authentification",
	"authenticationRequiredToContinue": "Veuillez vous authentifier pour continuer",
	"password": "Mot de passe",
	"token": "Jeton",
	"2fa": "Authentification à deux facteurs",
	"useTotp": "Entrer un mot de passe à usage unique",
	"useBackupCode": "Utiliser le codes de secours",
	"continue": "Continuer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"authentication": "Autentikasi",
	"authenticationRequiredToContinue": "Mohon autentikasikan terlebih dahulu sebelum melanjutkan",
	"password": "Kata sandi",
	"token": "Token",
	"2fa": "Autentikasi 2-faktor",
	"useTotp": "Gunakan TOTP",
	"useBackupCode": "Gunakan kode cadangan",
	"continue": "Lanjutkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"authentication": "Autenticazione",
	"authenticationRequiredToContinue": "Per procedere, è richiesta l'autenticazione",
	"password": "Password",
	"token": "Token",
	"2fa": "Autenticazione a due fattori",
	"useTotp": "Usare il codice OTP",
	"useBackupCode": "Usare il codice usa-e-getta",
	"continue": "Continua"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"authentication": "認証",
	"authenticationRequiredToContinue": "続けるには認証を行ってください",
	"password": "パスワード",
	"token": "確認コード",
	"2fa": "二要素認証",
	"useTotp": "ワンタイムパスワードを使う",
	"useBackupCode": "バックアップコードを使う",
	"continue": "続ける"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"authentication": "認証",
	"authenticationRequiredToContinue": "続けるんなら認証してや。",
	"password": "パスワード",
	"token": "確認コード",
	"2fa": "二要素認証",
	"useTotp": "ワンタイムパスワードを使う",
	"useBackupCode": "バックアップコードを使う",
	"continue": "続けるで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Awal uffir",
	"token": "Token",
	"2fa": "Two-factor authentication",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "ಗುಪ್ತಪದ",
	"token": "Token",
	"2fa": "Two-factor authentication",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"authentication": "인증",
	"authenticationRequiredToContinue": "계속하려면 인증하십시오",
	"password": "비밀번호",
	"token": "토큰",
	"2fa": "2단계 인증",
	"useTotp": "일회용 비밀번호 사용",
	"useBackupCode": "백업 코드 사용",
	"continue": "계속"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Wachtwoord",
	"token": "Token",
	"2fa": "Twee factor authenticatie",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Passord",
	"token": "Token",
	"2fa": "Two-factor authentication",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Fortsett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Hasło",
	"token": "Token",
	"2fa": "Klucz 2FA ",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"authentication": "Autenticação",
	"authenticationRequiredToContinue": "Por favor, autentique-se para continuar",
	"password": "Senha",
	"token": "Símbolo",
	"2fa": "Autenticação de dois fatores",
	"useTotp": "Digite a senha de uso único",
	"useBackupCode": "Usar códigos de “backup”",
	"continue": "Continuar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"authentication": "Аутентификация",
	"authenticationRequiredToContinue": "Пожалуйста, пройдите аутентификацию, чтобы продолжить",
	"password": "Пароль",
	"token": "Токен",
	"2fa": "Двухфакторная аутентификация",
	"useTotp": "Включить двухэтапную проверку",
	"useBackupCode": "Использовать резервные коды",
	"continue": "Продолжить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Heslo",
	"token": "Token",
	"2fa": "Dvojfaktorové overenie (2FA)",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"authentication": "การตรวจสอบสิทธิ์",
	"authenticationRequiredToContinue": "กรุณายืนยันตัวตนทางอิเล็กทรอนิกส์เพื่อดำเนินการต่อ",
	"password": "รหัสผ่าน",
	"token": "โทเค็น",
	"2fa": "การยืนยันตัวตนแบบสองชั้น",
	"useTotp": "ใช้รหัสผ่านแบบใช้ครั้งเดียว (TOTP)",
	"useBackupCode": "ใช้รหัสแบ๊กอัป",
	"continue": "ดำเนินการต่อ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"authentication": "Kimlik doğrulama",
	"authenticationRequiredToContinue": "Devam etmek için lütfen kimlik doğrulaması yapın.",
	"password": "Şifre",
	"token": "Token",
	"2fa": "İki faktörlü kimlik doğrulama",
	"useTotp": "Tek Kullanımlık Şifreyi Girin",
	"useBackupCode": "Yedek kodları kullanın",
	"continue": "Devam et"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"authentication": "Authentication",
	"authenticationRequiredToContinue": "Please authenticate to continue",
	"password": "Password",
	"token": "Token",
	"2fa": "Two-factor authentication",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"authentication": "Автентикація",
	"authenticationRequiredToContinue": "Будь ласка, автентифікуйтеся, щоб продовжити",
	"password": "Пароль",
	"token": "Токен",
	"2fa": "Двофакторна аутентифікація",
	"useTotp": "Введіть одноразовий пароль",
	"useBackupCode": "Використати резервні коди",
	"continue": "Продовжити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"authentication": "Xác thực",
	"authenticationRequiredToContinue": "Vui lòng xác thực để tiếp tục",
	"password": "Mật khẩu",
	"token": "Token",
	"2fa": "Xác thực 2 yếu tố",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Tiếp tục"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"authentication": "验证",
	"authenticationRequiredToContinue": "要继续，请先进行验证",
	"password": "密码",
	"token": "Token (令牌)",
	"2fa": "双重认证",
	"useTotp": "使用一次性代码",
	"useBackupCode": "使用备用代码",
	"continue": "继续"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"authentication": "驗證",
	"authenticationRequiredToContinue": "請於繼續前完成驗證",
	"password": "密碼",
	"token": "權杖",
	"2fa": "雙重驗證",
	"useTotp": "使用一次性密碼",
	"useBackupCode": "使用備用驗證碼",
	"continue": "繼續"
}
</locale>
