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

			<MkButton primary @click="save">{{ $locale.sfc.save }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted, ref, computed } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { mainRouter } from '@features/navigation/frontend/router.js';

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
	"save": "حفظ",
	"resetPassword": "أعد تعيين كلمتك السرية"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"newPassword": "Contrasenya nova",
	"save": "Desa",
	"resetPassword": "Restableix la contrasenya"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"newPassword": "Nové heslo",
	"save": "Uložit",
	"resetPassword": "Resetovat heslo"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"newPassword": "New password",
	"save": "Save",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"newPassword": "Neues Passwort",
	"save": "Speichern",
	"resetPassword": "Passwort zurücksetzen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"newPassword": "New password",
	"save": "Save",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"newPassword": "Contraseña nueva",
	"save": "Guardar",
	"resetPassword": "Resetear contraseña"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"newPassword": "Nouveau mot de passe",
	"save": "Enregistrer",
	"resetPassword": "Réinitialiser le mot de passe"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"newPassword": "Kata sandi baru",
	"save": "Simpan",
	"resetPassword": "Atur ulang kata sandi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"newPassword": "Nuova Password",
	"save": "Salva",
	"resetPassword": "Ripristina la password"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"newPassword": "新しいパスワード",
	"save": "保存",
	"resetPassword": "パスワードをリセット"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"newPassword": "今度のパスワード",
	"save": "とっとく",
	"resetPassword": "パスワードをリセット"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"newPassword": "New password",
	"save": "Sekles",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"newPassword": "New password",
	"save": "ಉಳಿಸಿ",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"newPassword": "새 비밀번호",
	"save": "저장",
	"resetPassword": "비밀번호 재설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"newPassword": "Nieuwe wachtwoord",
	"save": "Opslaan",
	"resetPassword": "Wachtwoord terugzetten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"newPassword": "Nytt passord",
	"save": "Lagre",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"newPassword": "Nowe hasło",
	"save": "Zapisz",
	"resetPassword": "Zresetuj hasło"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"newPassword": "Nova senha",
	"save": "Salvar",
	"resetPassword": "Redefinir senha"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"newPassword": "Новый пароль",
	"save": "Сохранить",
	"resetPassword": "Сброс пароля:"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"newPassword": "Nové heslo",
	"save": "Uložiť",
	"resetPassword": "Resetovať heslo"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"newPassword": "รหัสผ่านใหม่",
	"save": "บันทึก",
	"resetPassword": "รีเซ็ตรหัสผ่าน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"newPassword": "Yeni şifre",
	"save": "Kaydet",
	"resetPassword": "Şifreyi sıfırla"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"newPassword": "New password",
	"save": "Save",
	"resetPassword": "Reset password"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"newPassword": "Новий пароль",
	"save": "Зберегти",
	"resetPassword": "Скинути пароль"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"newPassword": "Mật khẩu mới",
	"save": "Lưu",
	"resetPassword": "Đặt lại mật khẩu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"newPassword": "新密码",
	"save": "保存",
	"resetPassword": "重置密码"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"newPassword": "新密碼",
	"save": "儲存",
	"resetPassword": "重設密碼"
}
</locale>
