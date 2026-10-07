<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.signinRoot">
	<Transition
		mode="out-in"
		:enterActiveClass="$style.transition_enterActive"
		:leaveActiveClass="$style.transition_leaveActive"
		:enterFromClass="$style.transition_enterFrom"
		:leaveToClass="$style.transition_leaveTo"

		:inert="waiting"
	>
		<!-- 1. 外部サーバーへの転送・username入力・パスキー -->
		<XInput
			v-if="page === 'input'"
			key="input"
			:message="message"
			:openOnRemote="openOnRemote"
			:initialUsername="initialUsername"

			@usernameSubmitted="onUsernameSubmitted"
			@passkeyClick="onPasskeyLogin"
		/>

		<!-- 2. パスワード入力 -->
		<XPassword
			v-else-if="page === 'password'"
			key="password"
			ref="passwordPageEl"

			:user="userInfo!"
			:needCaptcha="needCaptcha"

			@passwordSubmitted="onPasswordSubmitted"
		/>

		<!-- 3. ワンタイムパスワード -->
		<XTotp
			v-else-if="page === 'totp'"
			key="totp"

			@totpSubmitted="onTotpSubmitted"
		/>

		<!-- 4. パスキー -->
		<XPasskey
			v-else-if="page === 'passkey'"
			key="passkey"

			:credentialRequest="credentialRequest!"
			:isPerformingPasswordlessLogin="doingPasskeyFromInputPage"

			@done="onPasskeyDone"
			@useTotp="onUseTotp"
		/>
	</Transition>
	<div v-if="waiting" :class="$style.waitingRoot">
		<MkLoading/>
	</div>
</div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, shallowRef, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON, AuthenticationResponseJSON } from '@simplewebauthn/browser';
import type { OpenOnRemoteOptions } from '@features/auth/frontend/utility/please-login.js';
import type { PwResponse } from '@features/auth/frontend/components/MkSignin.password.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { showSuspendedDialog } from '@features/moderation/frontend/utility/show-suspended-dialog.js';
import * as os from '@features/ui/frontend/os.js';

import XInput from '@features/auth/frontend/components/MkSignin.input.vue';
import XPassword from '@features/auth/frontend/components/MkSignin.password.vue';
import XTotp from '@features/auth/frontend/components/MkSignin.totp.vue';
import XPasskey from '@features/auth/frontend/components/MkSignin.passkey.vue';
import { login } from '@features/auth/frontend/accounts.js';

const emit = defineEmits<{
	(ev: 'login', v: Misskey.entities.SigninFlowResponse & { finished: true }): void;
}>();

const props = withDefaults(defineProps<{
	autoSet?: boolean;
	message?: string,
	openOnRemote?: OpenOnRemoteOptions,
	initialUsername?: string;
}>(), {
	autoSet: false,
	message: '',
	openOnRemote: undefined,
	initialUsername: undefined,
});

const page = ref<'input' | 'password' | 'totp' | 'passkey'>('input');
const waiting = ref(false);

const passwordPageEl = useTemplateRef('passwordPageEl');
const needCaptcha = ref(false);

const userInfo = ref<null | Misskey.entities.UserDetailed>(null);
const password = ref('');

//#region Passkey Passwordless
const credentialRequest = shallowRef<PublicKeyCredentialRequestOptionsJSON | null>(null);
const passkeyContext = ref('');
const doingPasskeyFromInputPage = ref(false);

function onPasskeyLogin(): void {
	if (browserSupportsWebAuthn()) {
		doingPasskeyFromInputPage.value = true;
		waiting.value = true;
		misskeyApi('signin-with-passkey', {})
			.then((res) => {
				passkeyContext.value = res.context ?? '';
				credentialRequest.value = res.option;

				page.value = 'passkey';
				waiting.value = false;
			})
			.catch(onSigninApiError);
	}
}

function onPasskeyDone(credential: AuthenticationResponseJSON): void {
	waiting.value = true;

	if (doingPasskeyFromInputPage.value) {
		misskeyApi('signin-with-passkey', {
			credential: credential,
			context: passkeyContext.value,
		}).then((res) => {
			if (res.signinResponse == null) {
				onSigninApiError();
				return;
			}
			emit('login', res.signinResponse);
			onLoginSucceeded(res.signinResponse);
		}).catch(onSigninApiError);
	} else if (userInfo.value != null) {
		tryLogin({
			username: userInfo.value.username,
			password: password.value,
			credential: credential,
		});
	}
}

function onUseTotp(): void {
	page.value = 'totp';
}
//#endregion

async function onUsernameSubmitted(username: string) {
	waiting.value = true;

	userInfo.value = await misskeyApi('users/show', {
		username,
	}).catch(() => null);

	await tryLogin({
		username,
	});
}

async function onPasswordSubmitted(pw: PwResponse) {
	waiting.value = true;
	password.value = pw.password;

	if (userInfo.value == null) {
		await os.alert({
			type: 'error',
			title: $locale.value.sfc.noSuchUser,
			text: $locale.value.sfc.signinFailed,
		});
		waiting.value = false;
		return;
	} else {
		await tryLogin({
			username: userInfo.value.username,
			password: pw.password,
			'hcaptcha-response': pw.captcha.hCaptchaResponse,
			'm-captcha-response': pw.captcha.mCaptchaResponse,
			'g-recaptcha-response': pw.captcha.reCaptchaResponse,
			'turnstile-response': pw.captcha.turnstileResponse,
			'testcaptcha-response': pw.captcha.testcaptchaResponse,
		});
	}
}

async function onTotpSubmitted(token: string) {
	waiting.value = true;

	if (userInfo.value == null) {
		await os.alert({
			type: 'error',
			title: $locale.value.sfc.noSuchUser,
			text: $locale.value.sfc.signinFailed,
		});
		waiting.value = false;
		return;
	} else {
		await tryLogin({
			username: userInfo.value.username,
			password: password.value,
			token,
		});
	}
}

async function tryLogin(req: Partial<Misskey.entities.SigninFlowRequest>): Promise<Misskey.entities.SigninFlowResponse> {
	const _req = {
		username: req.username ?? userInfo.value?.username,
		...req,
	};

	function assertIsSigninFlowRequest(x: Partial<Misskey.entities.SigninFlowRequest>): x is Misskey.entities.SigninFlowRequest {
		return x.username != null;
	}

	if (!assertIsSigninFlowRequest(_req)) {
		throw new Error('Invalid request');
	}

	return await misskeyApi('signin-flow', _req).then(async (res) => {
		if (res.finished) {
			emit('login', res);
			await onLoginSucceeded(res);
		} else {
			switch (res.next) {
				case 'captcha': {
					needCaptcha.value = true;
					page.value = 'password';
					break;
				}
				case 'password': {
					needCaptcha.value = false;
					page.value = 'password';
					break;
				}
				case 'totp': {
					page.value = 'totp';
					break;
				}
				case 'passkey': {
					if (browserSupportsWebAuthn()) {
						credentialRequest.value = res.authRequest;
						page.value = 'passkey';
					} else {
						page.value = 'totp';
					}
					break;
				}
			}

			if (doingPasskeyFromInputPage.value === true) {
				doingPasskeyFromInputPage.value = false;
				page.value = 'input';
				password.value = '';
			}
			passwordPageEl.value?.resetCaptcha();
			nextTick(() => {
				waiting.value = false;
			});
		}
		return res;
	}).catch((err) => {
		onSigninApiError(err);
		return Promise.reject(err);
	});
}

async function onLoginSucceeded(res: Misskey.entities.SigninFlowResponse & { finished: true }) {
	if (props.autoSet) {
		await login(res.i);
	}
}

function onSigninApiError(err?: any): void {
	const id = err?.id ?? null;

	switch (id) {
		case '6cc579cc-885d-43d8-95c2-b8c7fc963280': {
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: $locale.value.sfc.noSuchUser,
			});
			break;
		}
		case '932c904e-9460-45b7-9ce6-7ed33be7eb2c': {
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: $locale.value.sfc.incorrectPassword,
			});
			break;
		}
		case 'e03a5f46-d309-4865-9b69-56282d94e1eb': {
			showSuspendedDialog();
			break;
		}
		case '22d05606-fbcf-421a-a2db-b32610dcfd1b': {
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: $locale.value.sfc.rateLimitExceeded,
			});
			break;
		}
		case 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f': {
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: $locale.value.sfc.incorrectTotp,
			});
			break;
		}
		case '36b96a7d-b547-412d-aeed-2d611cdc8cdc': {
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: $locale.value.sfc.unknownWebAuthnKey,
			});
			break;
		}
		case '93b86c4b-72f9-40eb-9815-798928603d1e': {
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: $locale.value.sfc.passkeyVerificationFailed,
			});
			break;
		}
		case 'b18c89a7-5b5e-4cec-bb5b-0419f332d430': {
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: $locale.value.sfc.passkeyVerificationFailed,
			});
			break;
		}
		case '2d84773e-f7b7-4d0b-8f72-bb69b584c912': {
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: $locale.value.sfc.passkeyVerificationSucceededButPasswordlessLoginDisabled,
			});
			break;
		}
		default: {
			console.error(err);
			os.alert({
				type: 'error',
				title: $locale.value.sfc.loginFailed,
				text: JSON.stringify(err),
			});
		}
	}

	if (doingPasskeyFromInputPage.value === true) {
		doingPasskeyFromInputPage.value = false;
		page.value = 'input';
		password.value = '';
	}
	passwordPageEl.value?.resetCaptcha();
	nextTick(() => {
		waiting.value = false;
	});
}

onBeforeUnmount(() => {
	password.value = '';
	needCaptcha.value = false;
	userInfo.value = null;
});
</script>

<style lang="scss" module>
.transition_enterActive,
.transition_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.signinRoot {
	overflow-x: hidden;
	overflow-x: clip;

	position: relative;
}

.waitingRoot {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: color-mix(in srgb, var(--MI_THEME-panel), transparent 50%);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"noSuchUser": "لم يُعثَر على المستخدم",
	"signinFailed": "فشل الولوج، خطأ في اسم المستخدم أو كلمة المرور.",
	"loginFailed": "فشل الولوج",
	"incorrectPassword": "كلمة السر خاطئة.",
	"rateLimitExceeded": "Rate limit exceeded",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"noSuchUser": "No s'ha trobat l'usuari",
	"signinFailed": "Autenticació sense èxit. Intenta-ho un altre cop utilitzant la contrasenya i el nom correctes.",
	"loginFailed": "S'ha produït un error al accedir.",
	"incorrectPassword": "Contrasenya incorrecta.",
	"rateLimitExceeded": "S'ha arribat al màxim de peticions",
	"incorrectTotp": "La contrasenya no és correcta, o ha caducat.",
	"unknownWebAuthnKey": "Passkey desconeguda",
	"passkeyVerificationFailed": "La verificació a fallat",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "La verificació de la passkey a estat correcta, però s'ha deshabilitat l'inici de sessió sense contrasenya."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"noSuchUser": "Uživatel nebyl nalezen",
	"signinFailed": "Nelze se přihlásit. Zkontrolujte prosím své uživatelské jméno a heslo.",
	"loginFailed": "Přihlášení se nezdařilo.",
	"incorrectPassword": "Nesprávné heslo.",
	"rateLimitExceeded": "Překročení rychlostního limitu",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"noSuchUser": "User not found",
	"signinFailed": "Unable to sign in. The entered username or password is incorrect.",
	"loginFailed": "Failed to sign in",
	"incorrectPassword": "Incorrect password.",
	"rateLimitExceeded": "Rate limit exceeded",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"noSuchUser": "Benutzer nicht gefunden",
	"signinFailed": "Anmeldung fehlgeschlagen. Überprüfe Benutzername und Passswort.",
	"loginFailed": "Anmeldung fehlgeschlagen",
	"incorrectPassword": "Falsches Passwort.",
	"rateLimitExceeded": "Versuchsanzahl überschritten",
	"incorrectTotp": "Das Einmalpasswort ist falsch oder abgelaufen.",
	"unknownWebAuthnKey": "Unbekannter Passkey",
	"passkeyVerificationFailed": "Die Passkey-Verifizierung ist fehlgeschlagen.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Die Verifizierung des Passkeys war erfolgreich, aber die passwortlose Anmeldung ist deaktiviert."
}
</locale>

<locale locale="en-US" lang="json">
{
	"noSuchUser": "User not found",
	"signinFailed": "Unable to sign in. The entered username or password is incorrect.",
	"loginFailed": "Failed to sign in",
	"incorrectPassword": "Incorrect password.",
	"rateLimitExceeded": "Rate limit exceeded",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"noSuchUser": "No se encuentra el usuario",
	"signinFailed": "Autenticación fallida. Asegúrate de haber usado el nombre de usuario y contraseña correctos.",
	"loginFailed": "Error al iniciar sesión.",
	"incorrectPassword": "La contraseña es incorrecta",
	"rateLimitExceeded": "Se excedió el límite de peticiones",
	"incorrectTotp": "La contraseña de un solo uso es incorrecta o ha caducado.",
	"unknownWebAuthnKey": "Esto no se ha registrado llave maestra.",
	"passkeyVerificationFailed": "La verificación de la clave de acceso ha fallado.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "La verificación de la clave de acceso ha sido satisfactoria pero se ha deshabilitado el inicio de sesión sin contraseña."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"noSuchUser": "Utilisateur·rice non trouvé·e",
	"signinFailed": "Échec d’authentification. Veuillez vérifier que votre nom d’utilisateur et mot de passe sont corrects.",
	"loginFailed": "Échec de la connexion",
	"incorrectPassword": "Le mot de passe est incorrect.",
	"rateLimitExceeded": "Limite de taux dépassée",
	"incorrectTotp": "Le mot de passe à usage unique est incorrect ou a expiré.",
	"unknownWebAuthnKey": "Clé d'accès inconnue.",
	"passkeyVerificationFailed": "La vérification de la clé d'accès a échoué.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "La vérification de la clé d'accès a réussi, mais la connexion sans mot de passe est désactivée."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"noSuchUser": "Pengguna tidak ditemukan",
	"signinFailed": "Tidak dapat masuk. Nama pengguna atau kata sandi yang kamu masukkan salah.",
	"loginFailed": "Gagal untuk masuk",
	"incorrectPassword": "Kata sandi salah.",
	"rateLimitExceeded": "Batas sudah terlampaui",
	"incorrectTotp": "Password sekali pakai salah dimasukkan atau sudah kadaluarsa.",
	"unknownWebAuthnKey": "Kunci sandi tidak terdaftar.",
	"passkeyVerificationFailed": "Verifikasi kunci sandi gagal.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Verifikasi kunci sandi berhasil, namun pemasukan tanpa sandi dinonaktifkan."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"noSuchUser": "Profilo non trovato",
	"signinFailed": "Autenticazione non riuscita. Controlla la tua password e nome utente.",
	"loginFailed": "Accesso non riuscito",
	"incorrectPassword": "La password è errata.",
	"rateLimitExceeded": "Superato il limite di richieste.",
	"incorrectTotp": "Il codice OTP è sbagliato, oppure scaduto.",
	"unknownWebAuthnKey": "Questa è una passkey sconosciuta.",
	"passkeyVerificationFailed": "La verifica della passkey non è riuscita.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "La verifica della passkey è riuscita, ma l'accesso senza password è disabilitato."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"noSuchUser": "ユーザーが見つかりません",
	"signinFailed": "ログインできませんでした。ユーザー名とパスワードを確認してください。",
	"loginFailed": "ログインに失敗しました",
	"incorrectPassword": "パスワードが間違っています。",
	"rateLimitExceeded": "レート制限を超えました",
	"incorrectTotp": "ワンタイムパスワードが間違っているか、期限切れになっています。",
	"unknownWebAuthnKey": "登録されていないパスキーです。",
	"passkeyVerificationFailed": "パスキーの検証に失敗しました。",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "パスキーの検証に成功しましたが、パスワードレスログインが無効になっています。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"noSuchUser": "ユーザーが見つからへんで",
	"signinFailed": "ログインできんかったで。もっかいユーザー名とパスワードを確認してみてや。",
	"loginFailed": "ログインに失敗してもうた…",
	"incorrectPassword": "パスワードがちゃうわ。",
	"rateLimitExceeded": "レート制限が超えたみたいやで",
	"incorrectTotp": "ワンタイムパスワードが間違っとるか、期限が切れとるみたいやな。",
	"unknownWebAuthnKey": "登録されてへんパスキーやな。",
	"passkeyVerificationFailed": "パスキーの検証に失敗したで。",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "パスキーの検証は成功したんやけど、パスワードレスログインが無効になっとるわ。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"noSuchUser": "User not found",
	"signinFailed": "Unable to sign in. The entered username or password is incorrect.",
	"loginFailed": "Failed to sign in",
	"incorrectPassword": "Incorrect password.",
	"rateLimitExceeded": "Rate limit exceeded",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"noSuchUser": "User not found",
	"signinFailed": "Unable to sign in. The entered username or password is incorrect.",
	"loginFailed": "Failed to sign in",
	"incorrectPassword": "Incorrect password.",
	"rateLimitExceeded": "Rate limit exceeded",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"noSuchUser": "유저를 찾을 수 없습니다",
	"signinFailed": "로그인할 수 없습니다. 유저 이름과 비밀번호를 확인해 주십시오.",
	"loginFailed": "로그인에 실패했습니다",
	"incorrectPassword": "비밀번호가 올바르지 않습니다.",
	"rateLimitExceeded": "요청 제한 횟수를 초과하였습니다",
	"incorrectTotp": "OTP 번호가 틀렸거나 유효기간이 만료되어 있을 수 있습니다.",
	"unknownWebAuthnKey": "등록되지 않은 패스키입니다.",
	"passkeyVerificationFailed": "패스키 검증을 실패했습니다.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "입력된 패스키는 정상적이나, 비밀번호 없이 로그인 하는 기능이 비활성화 되어있습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"noSuchUser": "Gebruiker niet gevonden",
	"signinFailed": "Inloggen mislukt. Controleer gebruikersnaam en wachtwoord.",
	"loginFailed": "Aanmelding mislukt.",
	"incorrectPassword": "Onjuist wachtwoord.",
	"rateLimitExceeded": "Rate limit exceeded",
	"incorrectTotp": "Het eenmalige wachtwoord is incorrect of verlopen",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"noSuchUser": "Bruker ikke funnet",
	"signinFailed": "Kunne ikke logge inn. Det oppgitte brukernavnet eller passordet er feil.",
	"loginFailed": "Kunne ikke logge inn",
	"incorrectPassword": "Incorrect password.",
	"rateLimitExceeded": "Rate limit exceeded",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"noSuchUser": "Nie znaleziono użytkownika",
	"signinFailed": "Nie udało się zalogować. Wprowadzona nazwa użytkownika lub hasło są nieprawidłowe.",
	"loginFailed": "Nie udało się zalogować",
	"incorrectPassword": "Nieprawidłowe hasło.",
	"rateLimitExceeded": "Limit szybkości przekroczony",
	"incorrectTotp": "Hasło pojedynczego użytku jest nie poprawne, lub straciło ważność",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"noSuchUser": "Usuário não encontrado",
	"signinFailed": "Não foi possível fazer login. Por favor, verifique o nome de usuário e a senha.",
	"loginFailed": "Falha ao logar",
	"incorrectPassword": "Senha inválida.",
	"rateLimitExceeded": "Taxa limite excedido",
	"incorrectTotp": "A senha de uso único está incorreta ou expirou.",
	"unknownWebAuthnKey": "Passkey desconhecida",
	"passkeyVerificationFailed": "A verificação com Passkey falhou.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "A verificação com Passkey teve êxito, mas a entrada sem senha está desabilitada."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"noSuchUser": "Таких пользователей не найдено",
	"signinFailed": "Невозможно войти в систему. Введенное вами имя пользователя или пароль неверны.",
	"loginFailed": "Неудачная попытка входа",
	"incorrectPassword": "Пароль неверен.",
	"rateLimitExceeded": "Ограничение скорости превышено",
	"incorrectTotp": "Введен неверный одноразовый пароль или срок его действия истек.",
	"unknownWebAuthnKey": "Неизвестный ключ",
	"passkeyVerificationFailed": "Ошибка проверка ключа доступа ",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Проверка Passkey выполнена, но вход без пароля отключен"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"noSuchUser": "Používateľ sa nenašiel",
	"signinFailed": "Nedá sa prihlásiť. Skontrolujte prosím meno používateľa a heslo.",
	"loginFailed": "Prihlásenie sa nepodarilo.",
	"incorrectPassword": "Nesprávne heslo.",
	"rateLimitExceeded": "Prekročený limit rýchlosti",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"noSuchUser": "ไม่พบผู้ใช้",
	"signinFailed": "ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน",
	"loginFailed": "การเข้าสู่ระบบไม่สำเร็จ",
	"incorrectPassword": "รหัสผ่านไม่ถูกต้อง",
	"rateLimitExceeded": "เกินขีดจำกัดอัตรา",
	"incorrectTotp": "รหัสยืนยันตัวตนแบบใช้ครั้งเดียวที่ท่านได้ระบุมานั้น ไม่ถูกต้องหรือหมดอายุลงแล้วค่ะ",
	"unknownWebAuthnKey": "เป็น Passkey ที่ยังไม่ได้ลงทะเบียน",
	"passkeyVerificationFailed": "การยืนยัน Passkey ล้มเหลว",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "การยืนยัน Passkey สำเร็จ แต่การเข้าสู่ระบบแบบไม่ใช้รหัสผ่านถูกปิดใช้งานอยู่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"noSuchUser": "Kullanıcı bulunamadı",
	"signinFailed": "Giriş yapılamıyor. Girilen kullanıcı adı veya şifre yanlış.",
	"loginFailed": "Giriş başarısız oldu",
	"incorrectPassword": "Yanlış şifre.",
	"rateLimitExceeded": "Hız sınırı aşıldı",
	"incorrectTotp": "Tek kullanımlık şifre yanlış veya süresi dolmuş.",
	"unknownWebAuthnKey": "Bilinmeyen Geçiş Anahtarı",
	"passkeyVerificationFailed": "Geçiş Anahtarı doğrulama başarısız oldu.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Geçiş anahtarı doğrulaması başarılı oldu ancak şifresiz oturum açma devre dışıdır."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"noSuchUser": "User not found",
	"signinFailed": "Unable to sign in. The entered username or password is incorrect.",
	"loginFailed": "Failed to sign in",
	"incorrectPassword": "Incorrect password.",
	"rateLimitExceeded": "Rate limit exceeded",
	"incorrectTotp": "The one-time password is incorrect or has expired.",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Passkey verification has failed.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"noSuchUser": "Користувача не знайдено",
	"signinFailed": "Не вдалося увійти. Введені ім’я користувача або пароль неправильнi.",
	"loginFailed": "Не вдалося увійти",
	"incorrectPassword": "Неправильний пароль.",
	"rateLimitExceeded": "Ліміт швидкості перевищено",
	"incorrectTotp": "Одноразовий пароль неправильний або його термін дії минув.",
	"unknownWebAuthnKey": "Невідомий Passkey",
	"passkeyVerificationFailed": "Помилка під час верифікації Passkey",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Верифікація Passkey пройшла успішно, але вхід без пароля вимкнено."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"noSuchUser": "Không tìm thấy người dùng",
	"signinFailed": "Không thể đăng nhập. Vui lòng kiểm tra tên người dùng và mật khẩu của bạn.",
	"loginFailed": "Đăng nhập không thành công",
	"incorrectPassword": "Sai mật khẩu.",
	"rateLimitExceeded": "Giới hạn quá mức",
	"incorrectTotp": "Mã OTP không đúng hoặc đã quá hạn",
	"unknownWebAuthnKey": "Unknown Passkey",
	"passkeyVerificationFailed": "Xác minh mật khẩu không thành công.",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "Passkey verification has succeeded but password-less login is disabled."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"noSuchUser": "未找到该用户",
	"signinFailed": "无法登录，请检查您的用户名和密码是否正确。",
	"loginFailed": "登录失败",
	"incorrectPassword": "密码错误",
	"rateLimitExceeded": "已超过速率限制",
	"incorrectTotp": "一次性密码不正确或已过期",
	"unknownWebAuthnKey": "此通行密钥未注册。",
	"passkeyVerificationFailed": "验证通行密钥失败。",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "通行密钥验证成功，但账户未开启无密码登录。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"noSuchUser": "使用者不存在",
	"signinFailed": "登入失敗。 請檢查使用者名稱和密碼。",
	"loginFailed": "登入失敗",
	"incorrectPassword": "密碼錯誤。",
	"rateLimitExceeded": "已超過速率限制",
	"incorrectTotp": "一次性密碼錯誤，或者已過期。",
	"unknownWebAuthnKey": "未註冊的通行金鑰。",
	"passkeyVerificationFailed": "驗證通行金鑰失敗。",
	"passkeyVerificationSucceededButPasswordlessLoginDisabled": "雖然驗證通行金鑰成功，但是無密碼登入的方式是停用的。"
}
</locale>
