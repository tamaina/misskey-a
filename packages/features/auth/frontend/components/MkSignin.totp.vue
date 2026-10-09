<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper">
	<div class="_gaps" :class="$style.root">
		<div class="_gaps_s">
			<div :class="$style.totpIcon">
				<i class="ti ti-key"></i>
			</div>
			<div :class="$style.totpDescription">{{ $locale.sfc['2fa'] }}</div>
		</div>

		<!-- totp入力 -->
		<form class="_gaps_s" @submit.prevent="emit('totpSubmitted', token)">
			<MkInput v-model="token" type="text" :pattern="isBackupCode ? '^[A-Z0-9]{32}$' :'^[0-9]{6}$'" autocomplete="one-time-code" required autofocus :spellcheck="false" :inputmode="isBackupCode ? undefined : 'numeric'">
				<template #label>{{ $locale.sfc.token }} ({{ $locale.sfc['2fa'] }})</template>
				<template #prefix><i v-if="isBackupCode" class="ti ti-key"></i><i v-else class="ti ti-123"></i></template>
				<template #caption><button class="_textButton" type="button" @click="isBackupCode = !isBackupCode">{{ isBackupCode ? $locale.sfc.useTotp : $locale.sfc.useBackupCode }}</button></template>
			</MkInput>

			<MkButton type="submit" large primary rounded style="margin: 0 auto;">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
		</form>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';

const emit = defineEmits<{
	(ev: 'totpSubmitted', token: string): void;
}>();

const token = ref('');
const isBackupCode = ref(false);
</script>

<style lang="scss" module>
.wrapper {
	display: flex;
	align-items: center;
	width: 100%;
	min-height: 336px;

	> .root {
		width: 100%;
	}
}

.totpIcon {
	margin: 0 auto;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	text-align: center;
	height: 64px;
	width: 64px;
	font-size: 24px;
	line-height: 64px;
	border-radius: 50%;
}

.totpDescription {
	text-align: center;
	font-size: 1.1em;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"2fa": "الاستيثاق بعاملَيْن",
	"token": "الرمز المميز",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "متابعة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"2fa": "Autenticació de doble factor",
	"token": "Codi de verificació",
	"useTotp": "Usa una contrasenya d'un sol ús",
	"useBackupCode": "Usa un codi de recuperació",
	"continue": "Continuar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"2fa": "Dvoufázové ověření",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Pokračovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"2fa": "Two-factor authentication",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"2fa": "Zwei-Faktor-Authentifizierung",
	"token": "Token",
	"useTotp": "Gib das Einmalpasswort ein",
	"useBackupCode": "Verwende die Backup-Codes",
	"continue": "Fortfahren"
}
</locale>

<locale locale="en-US" lang="json">
{
	"2fa": "Two-factor authentication",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"2fa": "Autenticación de doble factor",
	"token": "Token",
	"useTotp": "Introduce la contraseña de un solo uso",
	"useBackupCode": "Usar códigos de respaldo",
	"continue": "Continuar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"2fa": "Authentification à deux facteurs",
	"token": "Jeton",
	"useTotp": "Entrer un mot de passe à usage unique",
	"useBackupCode": "Utiliser le codes de secours",
	"continue": "Continuer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"2fa": "Autentikasi 2-faktor",
	"token": "Token",
	"useTotp": "Gunakan TOTP",
	"useBackupCode": "Gunakan kode cadangan",
	"continue": "Lanjutkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"2fa": "Autenticazione a due fattori",
	"token": "Token",
	"useTotp": "Usare il codice OTP",
	"useBackupCode": "Usare il codice usa-e-getta",
	"continue": "Continua"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"2fa": "二要素認証",
	"token": "確認コード",
	"useTotp": "ワンタイムパスワードを使う",
	"useBackupCode": "バックアップコードを使う",
	"continue": "続ける"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"2fa": "二要素認証",
	"token": "確認コード",
	"useTotp": "ワンタイムパスワードを使う",
	"useBackupCode": "バックアップコードを使う",
	"continue": "続けるで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"2fa": "Two-factor authentication",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"2fa": "Two-factor authentication",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"2fa": "2단계 인증",
	"token": "토큰",
	"useTotp": "일회용 비밀번호 사용",
	"useBackupCode": "백업 코드 사용",
	"continue": "계속"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"2fa": "Twee factor authenticatie",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"2fa": "Two-factor authentication",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Fortsett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"2fa": "Klucz 2FA ",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"2fa": "Autenticação de dois fatores",
	"token": "Símbolo",
	"useTotp": "Digite a senha de uso único",
	"useBackupCode": "Usar códigos de “backup”",
	"continue": "Continuar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"2fa": "Двухфакторная аутентификация",
	"token": "Токен",
	"useTotp": "Включить двухэтапную проверку",
	"useBackupCode": "Использовать резервные коды",
	"continue": "Продолжить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"2fa": "Dvojfaktorové overenie (2FA)",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"2fa": "การยืนยันตัวตนแบบสองชั้น",
	"token": "โทเค็น",
	"useTotp": "ใช้รหัสผ่านแบบใช้ครั้งเดียว (TOTP)",
	"useBackupCode": "ใช้รหัสแบ๊กอัป",
	"continue": "ดำเนินการต่อ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"2fa": "İki faktörlü kimlik doğrulama",
	"token": "Token",
	"useTotp": "Tek Kullanımlık Şifreyi Girin",
	"useBackupCode": "Yedek kodları kullanın",
	"continue": "Devam et"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"2fa": "Two-factor authentication",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Continue"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"2fa": "Двофакторна аутентифікація",
	"token": "Токен",
	"useTotp": "Введіть одноразовий пароль",
	"useBackupCode": "Використати резервні коди",
	"continue": "Продовжити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"2fa": "Xác thực 2 yếu tố",
	"token": "Token",
	"useTotp": "Enter the One-Time Password",
	"useBackupCode": "Use the backup codes",
	"continue": "Tiếp tục"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"2fa": "双重认证",
	"token": "Token (令牌)",
	"useTotp": "使用一次性代码",
	"useBackupCode": "使用备用代码",
	"continue": "继续"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"2fa": "雙重驗證",
	"token": "權杖",
	"useTotp": "使用一次性密碼",
	"useBackupCode": "使用備用驗證碼",
	"continue": "繼續"
}
</locale>
