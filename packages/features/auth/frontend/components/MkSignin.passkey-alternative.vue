<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkButton transparent rounded :disabled="disabled" style="margin: 0 auto;" @click="emit('choose')">{{ $locale.sfc.signinWithPasskey }}</MkButton>
</template>

<script setup lang="ts">
import MkButton from '@features/ui/frontend/components/MkButton.vue';

defineProps<{ disabled: boolean }>();
const emit = defineEmits<{ (ev: 'choose'): void }>();
</script>

<locale locale="ar-SA" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"signinWithPasskey": "Inicia sessió amb Passkey"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"signinWithPasskey": "Mit Passkey anmelden"
}
</locale>

<locale locale="en-US" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"signinWithPasskey": "Iniciar sesión con  clave de acceso"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"signinWithPasskey": "Se connecter avec une clé d'accès"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"signinWithPasskey": "Masuk dengan kunci sandi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"signinWithPasskey": "Accedi con passkey"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"signinWithPasskey": "パスキーでログイン"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"signinWithPasskey": "パスキーでログイン"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"signinWithPasskey": "패스키로 로그인"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"signinWithPasskey": "Entrar com Passkey"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"signinWithPasskey": "Войдите в систему, используя свой пароль"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"signinWithPasskey": "ลงชื่อเข้าใช้ด้วย Passkey"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"signinWithPasskey": "Geçiş Anahtarı ile giriş yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"signinWithPasskey": "Sign in with Passkey"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"signinWithPasskey": "Увійти, використовуючи Passkey"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"signinWithPasskey": "Đăng nhập bằng mật khẩu của bạn"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"signinWithPasskey": "使用通行密钥登录"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"signinWithPasskey": "使用通行金鑰登入"
}
</locale>
