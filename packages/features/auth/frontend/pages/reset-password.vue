<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div v-if="token" class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div class="_gaps_m">
			<MkInput v-model="password" type="password">
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #label>{{ $locale.sfc.newPassword }}</template>
			</MkInput>

			<p>{{ $locale.sfc.resetSessionsWarning }}</p>
			<MkButton primary @click="save">{{ globalLocale.env.save }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { defineAsyncComponent, onMounted, ref, computed } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { mainRouter } from '@features/navigation/frontend/router.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	token?: string;
}>();

const password = ref('');

async function save() {
	if (props.token == null) return;
	await os.apiWithDialog('reset-password', {
		token: props.token,
		password: password.value,
	});
	mainRouter.push('/');
}

onMounted(async () => {
	if (props.token == null) {
		const { dispose } = await os.popupAsyncWithDialog(import('@features/auth/frontend/components/MkForgotPassword.vue').then(x => x.default), {}, {
			closed: () => dispose(),
		});
		mainRouter.push('/');
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.resetPassword,
	icon: 'ti ti-lock',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"newPassword": "كلمة المرور الجديدة",
	"resetPassword": "أعد تعيين كلمتك السرية"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"newPassword": "Contrasenya nova",
	"resetPassword": "Restableix la contrasenya"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"newPassword": "Nové heslo",
	"resetPassword": "Resetovat heslo"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"newPassword": "New password",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"newPassword": "Neues Passwort",
	"resetPassword": "Passwort zurücksetzen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"newPassword": "New password",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"newPassword": "Contraseña nueva",
	"resetPassword": "Resetear contraseña"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"newPassword": "Nouveau mot de passe",
	"resetPassword": "Réinitialiser le mot de passe"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"newPassword": "Kata sandi baru",
	"resetPassword": "Atur ulang kata sandi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"newPassword": "Nuova Password",
	"resetPassword": "Ripristina la password"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"newPassword": "新しいパスワード",
	"resetPassword": "パスワードをリセット",
	"resetSessionsWarning": "パスワードを再設定すると、すべての端末のログインが無効になります。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"newPassword": "今度のパスワード",
	"resetPassword": "パスワードをリセット"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"newPassword": "New password",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"newPassword": "New password",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"newPassword": "새 비밀번호",
	"resetPassword": "비밀번호 재설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"newPassword": "Nieuwe wachtwoord",
	"resetPassword": "Wachtwoord terugzetten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"newPassword": "Nytt passord",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"newPassword": "Nowe hasło",
	"resetPassword": "Zresetuj hasło"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"newPassword": "Nova senha",
	"resetPassword": "Redefinir senha"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"newPassword": "Новый пароль",
	"resetPassword": "Сброс пароля:"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"newPassword": "Nové heslo",
	"resetPassword": "Resetovať heslo"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"newPassword": "รหัสผ่านใหม่",
	"resetPassword": "รีเซ็ตรหัสผ่าน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"newPassword": "Yeni şifre",
	"resetPassword": "Şifreyi sıfırla"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"newPassword": "New password",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"newPassword": "Новий пароль",
	"resetPassword": "Скинути пароль"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"newPassword": "Mật khẩu mới",
	"resetPassword": "Đặt lại mật khẩu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"newPassword": "新密码",
	"resetPassword": "重置密码"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"newPassword": "新密碼",
	"resetPassword": "重設密碼"
}
</locale>
