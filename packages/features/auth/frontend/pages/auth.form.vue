<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section>
	<div v-if="permissions.length > 0">
		<p>{{ interpolateLocaleParameters($locale.sfc.authPermission, { name }) }}</p>
		<ul>
			<li v-for="p in permissions" :key="p">{{ (copyLocaleDictionary(globalLocale.env._permissions) as Record<string, string>)[p] ?? p }}</li>
		</ul>
	</div>
	<div>{{ interpolateLocaleParameters($locale.sfc.authShareAccess, { name: `${name} (${app.id})` }) }}</div>
	<p v-if="failed" role="alert">{{ $locale.sfc.issuanceFailed }}</p>
	<MkTokenExpiry v-model="expiry" :disabled="busy"/>
	<div :class="$style.buttons">
		<MkButton inline :disabled="busy" @click="cancel">{{ globalLocale.env.cancel }}</MkButton>
		<MkButton inline primary :disabled="busy" @click="accept">{{ globalLocale.env.accept }}</MkButton>
	</div>
</section>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { ensureSudo } from '../utility/ensure-sudo.js';
import { selectedCredentialExpiry, useCredentialOperation } from '../utility/use-credential-operation.js';
import MkTokenExpiry from '../components/MkTokenExpiry.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	session: Misskey.entities.AuthSessionShowResponse;
}>();

const emit = defineEmits<{
	(event: 'accepted'): void;
	(event: 'denied'): void;
}>();

const expiry = ref<string | null>(null); const failed = ref(false);
const { run, busy } = useCredentialOperation(() => { expiry.value = null; failed.value = false; });

const app = computed(() => props.session.app);

const permissions = computed(() => {
	return props.session.app.permission.filter((p): p is typeof Misskey.permissions[number] => typeof p === 'string');
});

const name = computed(() => {
	const el = window.document.createElement('div');
	el.textContent = app.value.name;
	return el.innerHTML;
});

function cancel() {
	//misskeyApi('auth/deny', {
	//	token: props.session.token,
	//}).then(() => {
	//	emit('denied');
	//});

	emit('denied');
}

async function accept() {
	const target = props.session.token; const targetExpiry = expiry.value;
	await run(async (current, signal) => {
		const owns = () => current() && props.session.token === target;
		failed.value = false;
		try {
		const expiresAt = selectedCredentialExpiry(targetExpiry);
		if (!await ensureSudo(owns, signal) || !owns()) return;
		await misskeyApi('auth/accept', { token: target, ...(expiresAt ? { expiresAt } : {}) });
		if (owns()) emit('accepted');
		} catch { if (owns()) failed.value = true; }
	});
}
</script>

<style lang="scss" module>
.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "أتريد التفويض لـ \"{name}\" بالوصول لحسابك؟"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"authPermission": "{name} demana els següents permisos",
	"authShareAccess": "Vols que {name} pugui accedir al vostre compte?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"authPermission": "{name} požaduje tato oprávnění",
	"authShareAccess": "Chcete autorizovat \"{name}\" pro přístup k tomuto účtu?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"authPermission": "{name} fordert folgende Berechtigungen",
	"authShareAccess": "Möchtest du „{name}“ authorisieren, auf dieses Benutzerkonto zugreifen zu können?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"authPermission": "{name} solicita los siguientes permisos",
	"authShareAccess": "¿Desea permitir el acceso a la cuenta \"{name}\"?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Autoriser \"{name}\" à accéder à votre compte ?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"authPermission": "{name} meminta ijin berikut",
	"authShareAccess": "Apakah kamu ingin mengijinkan \"{name}\" untuk mengakses akun ini?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"authPermission": "{name} richiede i permessi seguenti",
	"authShareAccess": "Vuoi autorizzare {name} ad accedere al tuo profilo?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"authPermission": "{name}は次の権限を要求しています",
	"authShareAccess": "「{name}」がアカウントにアクセスすることを許可しますか？",
	"issuanceFailed": "承認できませんでした。対象アカウント・再認証・有効期限を確認してやり直してください。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"authPermission": "{name}に次の権限つけたってやって",
	"authShareAccess": "「{name}」がアカウントにアクセスすることを許可してええか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"authPermission": "{name}에서 다음 권한을 요청하였습니다",
	"authShareAccess": "‘{name}’에서 계정에 접근하는 것을 허용하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"authPermission": "{name} żąda następujących uprawnień",
	"authShareAccess": "Czy chcesz autoryzować „{name}” do dostępu do tego konta?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"authPermission": "{name} solicita as seguintes permissões",
	"authShareAccess": "Você gostaria de autorizar \"{name}\" para acessar essa conta?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"authPermission": "{name} Запрашивает следующие разрешения:",
	"authShareAccess": "Дать доступ для «{name}» к вашей учётной записи?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Prajete si povoliť \"{name}\", aby mal prístup k tomuto účtu?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"authPermission": "{name} ได้ขอสิทธิ์การเข้าถึงดังต่อไปนี้",
	"authShareAccess": "คุณต้องการอนุญาตให้ \"{name}\" เข้าถึงบัญชีนี้เลยมั้ย?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"authPermission": "{name} aşağıdaki izinleri talep etmektedir.",
	"authShareAccess": "“{name}”nin bu hesaba erişmesine izin vermek ister misiniz?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Would you like to authorize \"{name}\" to access this account?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"authPermission": "{name} requests the following permissions",
	"authShareAccess": "Ви хочете надати \"{name}\" доступ до цього акаунту?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"authPermission": "{name} đang yêu cầu quyền hạn dưới đây",
	"authShareAccess": "Bạn có muốn cho phép \"{name}\" truy cập vào tài khoản này không?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"authPermission": "{name} 需要以下权限",
	"authShareAccess": "您要授权允许 “{name}” 访问您的帐户吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"authPermission": "{name}要求以下的權限",
	"authShareAccess": "要授權「“{name}”」存取您的帳戶嗎？"
}
</locale>
