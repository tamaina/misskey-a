<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper" data-testid="signin-page-input">
	<div :class="$style.root">
		<div :class="$style.avatar">
			<i class="ti ti-user"></i>
		</div>

		<!-- ログイン画面メッセージ -->
		<MkInfo v-if="message">
			{{ message }}
		</MkInfo>

		<!-- 外部サーバーへの転送 -->
		<div v-if="openOnRemote" class="_gaps_m">
			<div class="_gaps_s">
				<MkButton type="button" rounded primary style="margin: 0 auto;" @click="openRemote(openOnRemote)">
					{{ $locale.sfc.continueOnRemote }} <i class="ti ti-external-link"></i>
				</MkButton>
				<button type="button" class="_button" :class="$style.instanceManualSelectButton" @click="specifyHostAndOpenRemote(openOnRemote)">
					{{ $locale.sfc.specifyServerHost }}
				</button>
			</div>
			<div :class="$style.orHr">
				<p :class="$style.orMsg">{{ $locale.sfc.or }}</p>
			</div>
		</div>

		<!-- username入力 -->
		<form class="_gaps_s" @submit.prevent="emit('usernameSubmitted', username)">
			<MkInput v-model="username" :placeholder="$locale.sfc.username" type="text" pattern="^[a-zA-Z0-9_]+$" :spellcheck="false" autocomplete="username webauthn" autofocus required data-testid="signin-username">
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
			</MkInput>
			<MkButton type="submit" large primary rounded style="margin: 0 auto;" data-testid="signin-page-input-continue">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
		</form>

		<!-- パスワードレスログイン -->
		<div :class="$style.orHr">
			<p :class="$style.orMsg">{{ $locale.sfc.or }}</p>
		</div>
		<div>
			<MkButton type="submit" style="margin: auto auto;" large rounded primary gradate @click="emit('passkeyClick', $event)">
				<i class="ti ti-device-usb" style="font-size: medium;"></i>{{ $locale.sfc.signinWithPasskey }}
			</MkButton>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { toUnicode } from 'punycode.js';

import { query, extractDomain } from '@features/web/frontend/shared/url.js';
import { host as configHost } from '@features/boot/frontend/shared/config.js';
import type { OpenOnRemoteOptions } from '@features/auth/frontend/utility/please-login.js';
import * as os from '@features/ui/frontend/os.js';

import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';

const props = withDefaults(defineProps<{
	message?: string,
	openOnRemote?: OpenOnRemoteOptions,
	initialUsername?: string;
}>(), {
	message: '',
	openOnRemote: undefined,
	initialUsername: undefined,
});

const emit = defineEmits<{
	(ev: 'usernameSubmitted', v: string): void;
	(ev: 'passkeyClick', v: PointerEvent): void;
}>();

const host = toUnicode(configHost);

const username = ref(props.initialUsername ?? '');

//#region Open on remote
function openRemote(options: OpenOnRemoteOptions, targetHost?: string): void {
	switch (options.type) {
		case 'web':
		case 'lookup': {
			let _path: string;

			if (options.type === 'lookup') {
				// TODO: v2024.7.0以降が浸透してきたら正式なURLに変更する▼
				// _path = `/lookup?uri=${encodeURIComponent(_path)}`;
				_path = `/authorize-follow?acct=${encodeURIComponent(options.url)}`;
			} else {
				_path = options.path;
			}

			if (targetHost) {
				window.open(`https://${targetHost}${_path}`, '_blank', 'noopener');
			} else {
				window.open(`https://misskey-hub.net/mi-web/?path=${encodeURIComponent(_path)}`, '_blank', 'noopener');
			}
			break;
		}
		case 'share': {
			const params = query(options.params);
			if (targetHost) {
				window.open(`https://${targetHost}/share?${params}`, '_blank', 'noopener');
			} else {
				window.open(`https://misskey-hub.net/share/?${params}`, '_blank', 'noopener');
			}
			break;
		}
	}
}

async function specifyHostAndOpenRemote(options: OpenOnRemoteOptions): Promise<void> {
	const { canceled, result: hostTemp } = await os.inputText({
		title: $locale.value.sfc.inputHostName,
		placeholder: 'misskey.example.com',
	});

	if (canceled) return;

	let targetHost: string | null = hostTemp;

	// ドメイン部分だけを取り出す
	targetHost = extractDomain(targetHost ?? '');
	if (targetHost == null) {
		os.alert({
			type: 'error',
			title: $locale.value.sfc.invalidValue,
			text: $locale.value.sfc.tryAgain,
		});
		return;
	}
	openRemote(options, targetHost);
}
//#endregion
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

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
	margin: 0 auto;
	background-color: color-mix(in srgb, var(--MI_THEME-fg), transparent 85%);
	color: color-mix(in srgb, var(--MI_THEME-fg), transparent 25%);
	text-align: center;
	height: 64px;
	width: 64px;
	font-size: 24px;
	line-height: 64px;
	border-radius: 50%;
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

<locale locale="ar-SA" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "قيمة غير صالحة.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "أو",
	"username": "اسم المستخدم",
	"continue": "متابعة",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"inputHostName": "Introdueix el domini",
	"invalidValue": "Valor invàlid.",
	"tryAgain": "Intenta-ho més tard.",
	"continueOnRemote": "Veure perfil original",
	"specifyServerHost": "Especifica un servidor directament",
	"or": "O",
	"username": "Nom d'usuari",
	"continue": "Continuar",
	"signinWithPasskey": "Inicia sessió amb Passkey"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"inputHostName": "Zadejte doménu",
	"invalidValue": "Neplatná hodnota.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Pokračujte na původní profil",
	"specifyServerHost": "Specify a server host directly",
	"or": "Nebo",
	"username": "Uživatelské jméno",
	"continue": "Pokračovat",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Invalid value.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "Or",
	"username": "Username",
	"continue": "Continue",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"inputHostName": "Gib die Domain an",
	"invalidValue": "Dieser Wert ist ungültig.",
	"tryAgain": "Bitte später erneut versuchen",
	"continueOnRemote": "Weiter auf Remote-Server",
	"specifyServerHost": "Server-Host auswählen",
	"or": "Oder",
	"username": "Benutzername",
	"continue": "Fortfahren",
	"signinWithPasskey": "Mit Passkey anmelden"
}
</locale>

<locale locale="en-US" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Invalid value.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "Or",
	"username": "Username",
	"continue": "Continue",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"inputHostName": "Introduce el dominio",
	"invalidValue": "Este no es un valor válido.",
	"tryAgain": "Por favor , inténtalo de nuevo",
	"continueOnRemote": "Continuar en una instancia remota",
	"specifyServerHost": "Especifica una instancia directamente",
	"or": "O",
	"username": "Nombre de usuario",
	"continue": "Continuar",
	"signinWithPasskey": "Iniciar sesión con  clave de acceso"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Cette valeur est invalide.",
	"tryAgain": "Veuillez réessayer plus tard",
	"continueOnRemote": "Continuer sur l'instance distante",
	"specifyServerHost": "Specify a server host directly",
	"or": "OU",
	"username": "Nom d’utilisateur·rice",
	"continue": "Continuer",
	"signinWithPasskey": "Se connecter avec une clé d'accès"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"inputHostName": "Masukkan nama domain",
	"invalidValue": "Nilai tidak valid.",
	"tryAgain": "Silahkan coba lagi.",
	"continueOnRemote": "Lihat di peladen asal",
	"specifyServerHost": "Tentukan domain peladen",
	"or": "atau",
	"username": "Nama Pengguna",
	"continue": "Lanjutkan",
	"signinWithPasskey": "Masuk dengan kunci sandi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"inputHostName": "Digita il nome del dominio ",
	"invalidValue": "Questo non è un valore valido.",
	"tryAgain": "Per favore riprova",
	"continueOnRemote": "Continua da remoto",
	"specifyServerHost": "Indica l'indirizzo dell'istanza",
	"or": "oppure",
	"username": "Nome utente",
	"continue": "Continua",
	"signinWithPasskey": "Accedi con passkey"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"inputHostName": "ドメインを入力してください",
	"invalidValue": "有効な値ではありません。",
	"tryAgain": "もう一度お試しください。",
	"continueOnRemote": "リモートで続行",
	"specifyServerHost": "サーバーのドメインを直接指定",
	"or": "もしくは",
	"username": "ユーザー名",
	"continue": "続ける",
	"signinWithPasskey": "パスキーでログイン"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"inputHostName": "ドメインを入力してや",
	"invalidValue": "有効な値じゃないみたいやで。",
	"tryAgain": "もう一度試しいや。",
	"continueOnRemote": "リモートで続行",
	"specifyServerHost": "サーバーのドメインを直接指定",
	"or": "それか",
	"username": "ユーザー名",
	"continue": "続けるで",
	"signinWithPasskey": "パスキーでログイン"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Invalid value.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "Or",
	"username": "Isem n umseqdac",
	"continue": "Continue",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Invalid value.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "Or",
	"username": "ಬಳಕೆಹೆಸರು",
	"continue": "Continue",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"inputHostName": "도메인을 입력하세요",
	"invalidValue": "올바른 값이 아닙니다.",
	"tryAgain": "다시 시도해 주세요.",
	"continueOnRemote": "리모트에서 계속",
	"specifyServerHost": "서버 도메인 직접 지정",
	"or": "혹은",
	"username": "유저명",
	"continue": "계속",
	"signinWithPasskey": "패스키로 로그인"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"inputHostName": "Domein invullen",
	"invalidValue": "Ongeldige waarde.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Verder op remote server",
	"specifyServerHost": "Serverhost uitkiezen",
	"or": "Of",
	"username": "Gebruikersnaam",
	"continue": "Continue",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Verdien er ugyldig.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "eller",
	"username": "Brukernavn",
	"continue": "Fortsett",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Nieprawidłowa wartość.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "Lub",
	"username": "Nazwa użytkownika",
	"continue": "Continue",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"inputHostName": "Insira o domínio",
	"invalidValue": "Valor inválido",
	"tryAgain": "Por favor, tente novamente mais tarde",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Especificar uma instância diretamente",
	"or": "Ou",
	"username": "Nome de usuário",
	"continue": "Continuar",
	"signinWithPasskey": "Entrar com Passkey"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"inputHostName": "Введите домен",
	"invalidValue": "Недопустимое значение.",
	"tryAgain": "Попробуйте еще раз позже",
	"continueOnRemote": "Продолжить на удалённом сервере",
	"specifyServerHost": "Укажите сервер напрямую",
	"or": "или",
	"username": "Имя пользователя",
	"continue": "Продолжить",
	"signinWithPasskey": "Войдите в систему, используя свой пароль"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Nesprávna hodnota.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "Alebo",
	"username": "Meno používateľa",
	"continue": "Continue",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"inputHostName": "โปรดป้อนโดเมน",
	"invalidValue": "ค่านี้ไม่ถูกต้อง",
	"tryAgain": "โปรดลองอีกครั้ง",
	"continueOnRemote": "ดำเนินการต่อบนเซิร์ฟเวอร์ฝั่งระยะไกล",
	"specifyServerHost": "ระบุโดเมนของเซิร์ฟเวอร์โดยตรง",
	"or": "หรือ",
	"username": "ชื่อผู้ใช้",
	"continue": "ดำเนินการต่อ",
	"signinWithPasskey": "ลงชื่อเข้าใช้ด้วย Passkey"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"inputHostName": "Alan adını girin",
	"invalidValue": "Geçersiz değer.",
	"tryAgain": "Lütfen daha sonra tekrar dene.",
	"continueOnRemote": "Uzak bir sunucuda devam edin",
	"specifyServerHost": "Doğrudan bir sunucu ana bilgisayarı belirtin",
	"or": "veya",
	"username": "Kullanıcı Adı",
	"continue": "Devam et",
	"signinWithPasskey": "Geçiş Anahtarı ile giriş yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"inputHostName": "Enter the domain",
	"invalidValue": "Invalid value.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Continue on a remote server",
	"specifyServerHost": "Specify a server host directly",
	"or": "Or",
	"username": "Username",
	"continue": "Continue",
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"inputHostName": "Введіть домен",
	"invalidValue": "Некоректне значення.",
	"tryAgain": "Повторіть спробу.",
	"continueOnRemote": "Продовжити на віддаленому сервері",
	"specifyServerHost": "Вказати хост сервера вручну",
	"or": "або",
	"username": "Ім'я користувача",
	"continue": "Продовжити",
	"signinWithPasskey": "Увійти, використовуючи Passkey"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"inputHostName": "Nhập địa chỉ máy chủ",
	"invalidValue": "Giá trị không hợp lệ.",
	"tryAgain": "Please try again later",
	"continueOnRemote": "Tiếp tục trên phiên bản từ xa",
	"specifyServerHost": "Thiết lập một máy chủ",
	"or": "Hoặc",
	"username": "Tên người dùng",
	"continue": "Tiếp tục",
	"signinWithPasskey": "Đăng nhập bằng mật khẩu của bạn"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"inputHostName": "请输入域名",
	"invalidValue": "无效值。",
	"tryAgain": "请再试一次",
	"continueOnRemote": "转到所在服务器继续",
	"specifyServerHost": "直接输入服务器域名",
	"or": "或者",
	"username": "用户名",
	"continue": "继续",
	"signinWithPasskey": "使用通行密钥登录"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"inputHostName": "請輸入域名",
	"invalidValue": "輸入值無效。",
	"tryAgain": "請再試一次。",
	"continueOnRemote": "在遠端伺服器繼續",
	"specifyServerHost": "直接指定伺服器網域",
	"or": "或者",
	"username": "使用者名稱",
	"continue": "繼續",
	"signinWithPasskey": "使用通行金鑰登入"
}
</locale>
