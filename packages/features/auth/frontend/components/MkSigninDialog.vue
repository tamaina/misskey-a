<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal
	ref="modal"
	:preferType="'dialog'"
	@click="onClose"
	@closed="emit('closed')"
>
	<div :class="$style.root">
		<div :class="$style.header">
			<div :class="$style.headerText"><i class="ti ti-login-2"></i> {{ $locale.sfc.login }}</div>
			<button :class="$style.closeButton" class="_button" @click="onClose"><i class="ti ti-x"></i></button>
		</div>
		<div :class="$style.content">
			<MkSignin :autoSet="autoSet" :message="message" :openOnRemote="openOnRemote" :initialUsername="initialUsername" @login="onLogin"/>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { useTemplateRef } from 'vue';
import type { OpenOnRemoteOptions } from '@features/auth/frontend/utility/please-login.js';
import MkSignin from '@features/auth/frontend/components/MkSignin.vue';
import MkModal from '@features/ui/frontend/components/MkModal.vue';

withDefaults(defineProps<{
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

const emit = defineEmits<{
	(ev: 'done', v: Misskey.entities.SigninFlowResponse & { finished: true }): void;
	(ev: 'closed'): void;
	(ev: 'cancelled'): void;
}>();

const modal = useTemplateRef('modal');

function onClose() {
	emit('cancelled');
	if (modal.value) modal.value.close();
}

function onLogin(res: Misskey.entities.SigninFlowResponse & { finished: true }) {
	emit('done', res);
	if (modal.value) modal.value.close();
}
</script>

<style lang="scss" module>
.root {
	overflow: auto;
	margin: auto;
	position: relative;
	width: 100%;
	max-width: 400px;
	height: 100%;
	max-height: 450px;
	box-sizing: border-box;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.header {
	position: sticky;
	top: 0;
	left: 0;
	width: 100%;
	height: 50px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	font-weight: bold;
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	z-index: 1;
}

.headerText {
	padding: 0 20px;
	box-sizing: border-box;
}

.closeButton {
	margin-left: auto;
	padding: 16px;
	font-size: 16px;
	line-height: 16px;
}

.content {
	padding: 32px;
	box-sizing: border-box;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "login": "لِج"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "login": "Iniciar sessió"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "login": "Přihlásit se"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "login": "Sign In"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "login": "Anmelden"
}
</locale>

<locale locale="en-US" lang="json">
{
  "login": "Sign In"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "login": "Iniciar sesión"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "login": "Se connecter"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "login": "Masuk"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "login": "Accedi"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "login": "ログイン"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "login": "ログイン"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "login": "Sign In"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "login": "ಪ್ರವೇಶ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "login": "로그인"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "login": "Inloggen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "login": "Logg inn"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "login": "Zaloguj się"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "login": "Iniciar sessão"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "login": "Войти"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "login": "Prihlásiť sa"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "login": "เข้าสู่ระบบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "login": "Oturum Aç"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "login": "كىرىش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "login": "Увійти"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "login": "Đăng nhập"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "login": "登录"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "login": "登入"
}
</locale>
