<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="600"
	@close="onClose"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.signup }}</template>

	<div style="overflow-x: clip;">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<template v-if="!isAcceptedServerRule">
				<XServerRules @done="isAcceptedServerRule = true" @cancel="onClose"/>
			</template>
			<template v-else>
				<XSignup :autoSet="autoSet" @signup="onSignup" @signupEmailPending="onSignupEmailPending"/>
			</template>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { useTemplateRef, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XSignup from '@features/auth/frontend/components/MkSignupDialog.form.vue';
import XServerRules from '@features/auth/frontend/components/MkSignupDialog.rules.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
}>(), {
	autoSet: false,
});

const emit = defineEmits<{
	(ev: 'done', res: Misskey.entities.SignupResponse): void;
	(ev: 'cancelled'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const isAcceptedServerRule = ref(false);

function onClose() {
	emit('cancelled');
	dialog.value?.close();
}

function onSignup(res: Misskey.entities.SignupResponse) {
	emit('done', res);
	dialog.value?.close();
}

function onSignupEmailPending() {
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}
</style>

<locale locale="ar-SA" lang="json">
{
  "signup": "أنشئ حسابًا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "signup": "Registrar-se"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "signup": "Registrace"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "signup": "Sign Up"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "signup": "Registrieren"
}
</locale>

<locale locale="en-US" lang="json">
{
  "signup": "Sign Up"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "signup": "Registrarse"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "signup": "S’inscrire"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "signup": "Daftar"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "signup": "Iscriviti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "signup": "新規登録"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "signup": "新規登録"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "signup": "Jerred"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "signup": "ನೋಂದಣಿ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "signup": "회원 가입"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "signup": "Registreren"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "signup": "Bli med"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "signup": "Zarejestruj się"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "signup": "Registrar-se"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "signup": "Регистрация"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "signup": "Registrovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "signup": "สร้างบัญชีผู้ใช้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "signup": "Kaydol"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "signup": "Sign Up"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "signup": "Реєстрація"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "signup": "Đăng ký"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "signup": "新用户注册"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "signup": "註冊"
}
</locale>
