<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper" data-testid="signin-page-password">
	<div class="_gaps" :class="$style.root">
		<div :class="$style.avatar" :style="{ backgroundImage: user ? `url('${user.avatarUrl}')` : undefined }"></div>
		<div :class="$style.welcomeBackMessage">
			<I18n :src="$locale.sfc.welcomeBackWithName" tag="span">
				<template #name><Mfm :text="user.name ?? user.username" :plain="true"/></template>
			</I18n>
		</div>

		<!-- password入力 -->
		<form class="_gaps_s" @submit.prevent="onSubmit">
			<!-- ブラウザ オートコンプリート用 -->
			<input type="hidden" name="username" autocomplete="username" :value="user.username">

			<MkInput v-model="password" :placeholder="$locale.sfc.password" type="password" autocomplete="current-password webauthn" :withPasswordToggle="true" required autofocus data-testid="signin-password">
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #caption><button class="_textButton" type="button" @click="resetPassword">{{ $locale.sfc.forgotPassword }}</button></template>
			</MkInput>

			<div v-if="needCaptcha">
				<MkCaptcha v-if="instance.enableHcaptcha" ref="hcaptcha" v-model="hCaptchaResponse" provider="hcaptcha" :sitekey="instance.hcaptchaSiteKey"/>
				<MkCaptcha v-if="instance.enableMcaptcha" ref="mcaptcha" v-model="mCaptchaResponse" provider="mcaptcha" :sitekey="instance.mcaptchaSiteKey" :instanceUrl="instance.mcaptchaInstanceUrl"/>
				<MkCaptcha v-if="instance.enableRecaptcha" ref="recaptcha" v-model="reCaptchaResponse" provider="recaptcha" :sitekey="instance.recaptchaSiteKey"/>
				<MkCaptcha v-if="instance.enableTurnstile" ref="turnstile" v-model="turnstileResponse" provider="turnstile" :sitekey="instance.turnstileSiteKey"/>
				<MkCaptcha v-if="instance.enableTestcaptcha" ref="testcaptcha" v-model="testcaptchaResponse" provider="testcaptcha" :sitekey="null"/>
			</div>

			<MkButton type="submit" :disabled="needCaptcha && captchaFailed" large primary rounded style="margin: 0 auto;" data-testid="signin-page-password-continue">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
		</form>
	</div>
</div>
</template>

<script lang="ts">
export type PwResponse = {
	password: string;
	captcha: {
		hCaptchaResponse: string | null;
		mCaptchaResponse: string | null;
		reCaptchaResponse: string | null;
		turnstileResponse: string | null;
		testcaptchaResponse: string | null;
	};
};
</script>

<script setup lang="ts">
import { ref, computed, useTemplateRef, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';

import { instance } from '@features/instance/frontend/instance.js';
import * as os from '@features/ui/frontend/os.js';

import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkCaptcha from '@features/auth/frontend/components/MkCaptcha.vue';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
	needCaptcha: boolean;
}>();

const emit = defineEmits<{
	(ev: 'passwordSubmitted', v: PwResponse): void;
}>();

const password = ref('');

const hCaptcha = useTemplateRef('hcaptcha');
const mCaptcha = useTemplateRef('mcaptcha');
const reCaptcha = useTemplateRef('recaptcha');
const turnstile = useTemplateRef('turnstile');
const testcaptcha = useTemplateRef('testcaptcha');

const hCaptchaResponse = ref<string | null>(null);
const mCaptchaResponse = ref<string | null>(null);
const reCaptchaResponse = ref<string | null>(null);
const turnstileResponse = ref<string | null>(null);
const testcaptchaResponse = ref<string | null>(null);

const captchaFailed = computed((): boolean => {
	return (
		(instance.enableHcaptcha && !hCaptchaResponse.value) ||
		(instance.enableMcaptcha && !mCaptchaResponse.value) ||
		(instance.enableRecaptcha && !reCaptchaResponse.value) ||
		(instance.enableTurnstile && !turnstileResponse.value) ||
		(instance.enableTestcaptcha && !testcaptchaResponse.value)
	);
});

function resetPassword(): void {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@features/auth/frontend/components/MkForgotPassword.vue')), {}, {
		closed: () => dispose(),
	});
}

function onSubmit() {
	emit('passwordSubmitted', {
		password: password.value,
		captcha: {
			hCaptchaResponse: hCaptchaResponse.value,
			mCaptchaResponse: mCaptchaResponse.value,
			reCaptchaResponse: reCaptchaResponse.value,
			turnstileResponse: turnstileResponse.value,
			testcaptchaResponse: testcaptchaResponse.value,
		},
	});
}

function resetCaptcha() {
	hCaptcha.value?.reset();
	mCaptcha.value?.reset();
	reCaptcha.value?.reset();
	turnstile.value?.reset();
	testcaptcha.value?.reset();
}

defineExpose({
	resetCaptcha,
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

.avatar {
	margin: 0 auto 0 auto;
	width: 64px;
	height: 64px;
	background: #ddd;
	background-position: center;
	background-size: cover;
	border-radius: 100%;
}

.welcomeBackMessage {
	text-align: center;
	font-size: 1.1em;
}

.instanceManualSelectButton {
	display: block;
	text-align: center;
	opacity: .7;
	font-size: .8em;

	&:hover {
		text-decoration: underline;
	}
}

.orHr {
	position: relative;
	margin: .4em auto;
	width: 100%;
	height: 1px;
	background: var(--MI_THEME-divider);
}

.orMsg {
	position: absolute;
	top: -.6em;
	display: inline-block;
	padding: 0 1em;
	background: var(--MI_THEME-panel);
	font-size: 0.8em;
	color: var(--MI_THEME-fgOnPanel);
	margin: 0;
	left: 50%;
	transform: translateX(-50%);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"welcomeBackWithName": "مرحبًا بك مجددًا {name}",
	"password": "الكلمة السرية",
	"forgotPassword": "نسيتَ كلمة السر",
	"continue": "متابعة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"welcomeBackWithName": "Benvingut de nou, {name}",
	"password": "Contrasenya",
	"forgotPassword": "Restableix la contrasenya ",
	"continue": "Continuar"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"welcomeBackWithName": "Vítejte zpět, {name}",
	"password": "Heslo",
	"forgotPassword": "Zapomenuté heslo",
	"continue": "Pokračovat"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"welcomeBackWithName": "Welcome back, {name}",
	"password": "Password",
	"forgotPassword": "Forgot password",
	"continue": "Continue"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"welcomeBackWithName": "Willkommen zurück, {name}",
	"password": "Passwort",
	"forgotPassword": "Passwort vergessen",
	"continue": "Fortfahren"
}
</locale>

<locale lang="json" locale="en-US">
{
	"welcomeBackWithName": "Welcome back, {name}",
	"password": "Password",
	"forgotPassword": "Forgot password",
	"continue": "Continue"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"welcomeBackWithName": "Bienvenido otra vez, {name}",
	"password": "Contraseña",
	"forgotPassword": "Olvidé mi contraseña",
	"continue": "Continuar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"welcomeBackWithName": "Heureux de vous revoir, {name}",
	"password": "Mot de passe",
	"forgotPassword": "Mot de passe oublié",
	"continue": "Continuer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"welcomeBackWithName": "Selamat datang kembali, {name}.",
	"password": "Kata sandi",
	"forgotPassword": "Lupa Kata Sandi",
	"continue": "Lanjutkan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"welcomeBackWithName": "Ciao, {name}! Eccoti di nuovo!",
	"password": "Password",
	"forgotPassword": "Hai dimenticato la password?",
	"continue": "Continua"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"welcomeBackWithName": "おかえりなさい、{name}さん",
	"password": "パスワード",
	"forgotPassword": "パスワードを忘れた",
	"continue": "続ける"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"welcomeBackWithName": "まいど、{name}はん",
	"password": "パスワード",
	"forgotPassword": "パスワード忘れたん？",
	"continue": "続けるで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"welcomeBackWithName": "Welcome back, {name}",
	"password": "Awal uffir",
	"forgotPassword": "Forgot password",
	"continue": "Continue"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"welcomeBackWithName": "Welcome back, {name}",
	"password": "ಗುಪ್ತಪದ",
	"forgotPassword": "Forgot password",
	"continue": "Continue"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"welcomeBackWithName": "{name}님, 환영합니다.",
	"password": "비밀번호",
	"forgotPassword": "비밀번호 재설정",
	"continue": "계속"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"welcomeBackWithName": "Welkom terug, {name}",
	"password": "Wachtwoord",
	"forgotPassword": "Wachtwoord vergeten",
	"continue": "Continue"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"welcomeBackWithName": "Welcome back, {name}",
	"password": "Passord",
	"forgotPassword": "Glemt passord",
	"continue": "Fortsett"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"welcomeBackWithName": "Witaj z powrotem, {name}",
	"password": "Hasło",
	"forgotPassword": "Nie pamiętam hasła",
	"continue": "Continue"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"welcomeBackWithName": "Bem-vindo de volta, {name}",
	"password": "Senha",
	"forgotPassword": "Esqueci-me da senha",
	"continue": "Continuar"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"welcomeBackWithName": "С возвращением, {name}!",
	"password": "Пароль",
	"forgotPassword": "Забыли пароль?",
	"continue": "Продолжить"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"welcomeBackWithName": "Vitajte späť, {name}",
	"password": "Heslo",
	"forgotPassword": "Zabudnuté heslo",
	"continue": "Continue"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"welcomeBackWithName": "ยินดีต้อนรับการกลับมานะคะ, คุณ{name}",
	"password": "รหัสผ่าน",
	"forgotPassword": "ลืมรหัสผ่าน",
	"continue": "ดำเนินการต่อ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"welcomeBackWithName": "Hoş geldin, {name}",
	"password": "Şifre",
	"forgotPassword": "Şifremi unuttum",
	"continue": "Devam et"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"welcomeBackWithName": "Welcome back, {name}",
	"password": "Password",
	"forgotPassword": "Forgot password",
	"continue": "Continue"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"welcomeBackWithName": "З поверненням, {name}!",
	"password": "Пароль",
	"forgotPassword": "Я забув пароль",
	"continue": "Продовжити"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"welcomeBackWithName": "Chào mừng trở lại, {name}",
	"password": "Mật khẩu",
	"forgotPassword": "Quên mật khẩu",
	"continue": "Tiếp tục"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"welcomeBackWithName": "欢迎回来，{name}",
	"password": "密码",
	"forgotPassword": "忘记密码",
	"continue": "继续"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"welcomeBackWithName": "歡迎回來，{name}",
	"password": "密碼",
	"forgotPassword": "忘記密碼",
	"continue": "繼續"
}
</locale>
