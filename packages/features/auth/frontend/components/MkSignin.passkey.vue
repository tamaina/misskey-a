<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper">
	<div class="_gaps" :class="$style.root">
		<div class="_gaps_s">
			<div :class="$style.passkeyIcon">
				<i class="ti ti-fingerprint"></i>
			</div>
			<div :class="$style.passkeyDescription">{{ $locale.sfc.useSecurityKey }}</div>
		</div>

		<MkButton large primary rounded :disabled="queryingKey" style="margin: 0 auto;" @click="queryKey">{{ $locale.sfc.retry }}</MkButton>

		<MkButton v-if="isPerformingPasswordlessLogin !== true" transparent rounded :disabled="queryingKey" style="margin: 0 auto;" @click="emit('useTotp')">{{ $locale.sfc.useTotp }}</MkButton>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { startAuthentication } from '@simplewebauthn/browser';

import MkButton from '@features/ui/frontend/components/MkButton.vue';

import type { PublicKeyCredentialRequestOptionsJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';

const props = defineProps<{
	credentialRequest: PublicKeyCredentialRequestOptionsJSON;
	isPerformingPasswordlessLogin?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'done', credential: AuthenticationResponseJSON): void;
	(ev: 'useTotp'): void;
}>();

const queryingKey = ref(true);

async function queryKey() {
	queryingKey.value = true;
	await startAuthentication({ optionsJSON: props.credentialRequest })
		.catch(() => {
			return Promise.reject(null);
		})
		.then((credential) => {
			emit('done', credential);
		})
		.finally(() => {
			queryingKey.value = false;
		});
}

onMounted(() => {
	queryKey();
});
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

.passkeyIcon {
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

.passkeyDescription {
	text-align: center;
	font-size: 1.1em;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "حاول مجددًا",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "useSecurityKey": "Segueix les instruccions del teu navegador O dispositiu per fer servir el teu passkey.",
  "retry": "Torna-ho a provar",
  "useTotp": "Usa una contrasenya d'un sol ús"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Opakovat",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Retry",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "useSecurityKey": "Folge bitten den Anweisungen deines Browsers bzw. Gerätes und verwende deinen Hardware-Sicherheitsschlüssel oder Passkey.",
  "retry": "Wiederholen",
  "useTotp": "Gib das Einmalpasswort ein"
}
</locale>

<locale locale="en-US" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Retry",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "useSecurityKey": "Por favor, sigue las instrucciones de tu dispositivo o navegador para usar tu clave de seguridad o tu clave de paso.",
  "retry": "Reintentar",
  "useTotp": "Introduce la contraseña de un solo uso"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "useSecurityKey": "Suivez les instructions de votre navigateur ou de votre appareil pour utiliser une clé de sécurité ou une clé d'accès.",
  "retry": "Réessayer",
  "useTotp": "Entrer un mot de passe à usage unique"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "useSecurityKey": "Mohon ikuti instruksi peramban atau perangkat kamu untuk menggunakan kunci pengaman atau passkey.",
  "retry": "Coba lagi",
  "useTotp": "Gunakan TOTP"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "useSecurityKey": "Per utilizzare la chiave di sicurezza o la passkey, segui le indicazioni del dispositivo",
  "retry": "Riprova",
  "useTotp": "Usare il codice OTP"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "useSecurityKey": "ブラウザまたはデバイスの指示に従って、セキュリティキーまたはパスキーを使用してください。",
  "retry": "再試行",
  "useTotp": "ワンタイムパスワードを使う"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "useSecurityKey": "ブラウザまたはデバイスの言う通りに、セキュリティキーまたはパスキーを使ってや。",
  "retry": "もっぺんやる？",
  "useTotp": "ワンタイムパスワードを使う"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Retry",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Retry",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "useSecurityKey": "브라우저 또는 기기의 안내에 따라 보안 키 또는 패스키를 사용해 주십시오.",
  "retry": "다시 시도",
  "useTotp": "일회용 비밀번호 사용"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Probeer opnieuw",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Prøv igjen",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Spróbuj ponownie",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "useSecurityKey": "Por favor, siga as instruções do seu navegador ou dispositivo para utilizar uma chave de acesso.",
  "retry": "Tente novamente",
  "useTotp": "Digite a senha de uso único"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "useSecurityKey": "Используйте ключ безопасности или Passkey, следуя подсказкам браузера",
  "retry": "Повторить попытку",
  "useTotp": "Включить двухэтапную проверку"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Opakovať",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "useSecurityKey": "โปรดปฏิบัติตามคำแนะนำของเบราว์เซอร์หรืออุปกรณ์ของคุณเพื่อใช้ security key หรือ passkey",
  "retry": "ลองใหม่อีกครั้ง",
  "useTotp": "ใช้รหัสผ่านแบบใช้ครั้งเดียว (TOTP)"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "useSecurityKey": "Güvenlik anahtarını veya şifreni kullanmak için lütfen tarayıcının veya cihazının talimatlarını izle.",
  "retry": "Tekrar dene",
  "useTotp": "Tek Kullanımlık Şifreyi Girin"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "useSecurityKey": "Please follow your browser's or device's instructions to use your security- or passkey.",
  "retry": "Retry",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "useSecurityKey": "Дотримуйтеся інструкцій вашого браузера або пристрою, щоб скористатися ключем безпеки або passkey.",
  "retry": "Спробувати знову",
  "useTotp": "Введіть одноразовий пароль"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "useSecurityKey": "Làm theo hướng dẫn trên trình duyệt hoặc thiết bị của bạn để sử dụng khóa bảo mật hoặc mật mã.",
  "retry": "Thử lại",
  "useTotp": "Enter the One-Time Password"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "useSecurityKey": "请根据浏览器或设备的提示，使用安全密钥或通行密钥。",
  "retry": "重试",
  "useTotp": "使用一次性代码"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "useSecurityKey": "請按照瀏覽器或裝置上的說明來使用安全金鑰或通行金鑰。",
  "retry": "重試",
  "useTotp": "使用一次性密碼"
}
</locale>
