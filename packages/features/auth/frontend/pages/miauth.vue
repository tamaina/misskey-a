<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithAnimBg>
	<div :class="$style.formContainer">
		<div :class="$style.form">
			<MkAuthConfirm
				ref="authRoot"
				:name="name"
				:icon="icon || undefined"
				:permissions="_permissions"
				@accept="onAccept"
				@deny="onDeny"
			>
				<template #consentAdditionalInfo>
					<div v-if="callback != null" class="_gaps_s" :class="$style.redirectRoot">
						<div>{{ $locale.sfc.byClickingYouWillBeRedirectedToThisUrl }}</div>
						<div class="_monospace" :class="$style.redirectUrl">{{ callback }}</div>
					</div>
				</template>
			</MkAuthConfirm>
		</div>
	</div>
</PageWithAnimBg>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkAuthConfirm from '@features/auth/frontend/components/MkAuthConfirm.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';

const props = defineProps<{
	session: string;
	callback?: string;
	name?: string;
	icon?: string;
	permission?: string; // コンマ区切り
}>();

const _permissions = computed(() => {
	return (props.permission ? props.permission.split(',').filter((p): p is typeof Misskey.permissions[number] => (Misskey.permissions as readonly string[]).includes(p)) : []);
});

const authRoot = useTemplateRef('authRoot');

async function onAccept(token: string) {
	await misskeyApi('miauth/gen-token', {
		session: props.session,
		name: props.name,
		iconUrl: props.icon,
		permission: _permissions.value,
	}, token).then(() => {
		if (props.callback && props.callback !== '') {
			const cbUrl = new URL(props.callback);
			if (['javascript:', 'file:', 'data:', 'mailto:', 'tel:', 'vbscript:'].includes(cbUrl.protocol)) throw new Error('invalid url');
			cbUrl.searchParams.set('session', props.session);
			window.location.href = cbUrl.toString();
		} else {
			authRoot.value?.showUI('success');
		}
	}).catch(() => {
		authRoot.value?.showUI('failed');
	});
}

function onDeny() {
	authRoot.value?.showUI('denied');
}

definePage(() => ({
	title: 'MiAuth',
	icon: 'ti ti-apps',
}));
</script>

<style lang="scss" module>
.formContainer {
	min-height: 100svh;
	padding: 32px 32px calc(env(safe-area-inset-bottom, 0px) + 32px) 32px;
	box-sizing: border-box;
	display: grid;
	place-content: center;
}

.form {
	position: relative;
	z-index: 10;
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-panel);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: clip;
	max-width: 500px;
	width: calc(100vw - 64px);
	height: min(65svh, calc(100svh - calc(env(safe-area-inset-bottom, 0px) + 64px)));
	overflow-y: scroll;
}

.redirectRoot {
	padding: 16px;
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-bg);
}

.redirectUrl {
	font-size: 90%;
	padding: 12px;
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-panel);
	overflow-x: scroll;
	white-space: nowrap;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "Si es garanteix l'accés, seràs redirigit automàticament a la següent adreça URL"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "Wenn der Zugang gewährt wird, wirst du automatisch zu folgender URL weitergeleitet"
}
</locale>

<locale locale="en-US" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "Cuando el acceso es concedido, serás automáticamente redireccionado a la siguiente URL"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "Consentendo l'accesso, si verrà reindirizzati presso questo indirizzo URL"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "アクセスを許可すると、自動で以下のURLに遷移します"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "アクセスを許したら、自動で下のURLに遷移するで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "접근을 허용하면 자동으로 다음 URL로 이동합니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "Quando o acesso for permitido, você será redirecionado para o seguinte endereço"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "หากอนุญาตการเข้าถึง ระบบจะเปลี่ยนเส้นทางไปยัง URL ด้านล่างโดยอัตโนมัติ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "Erişim izni verildiğinde, otomatik olarak aşağıdaki URL'ye yönlendirileceksin."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "When access is granted, you will automatically be redirected to the following URL"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "允许访问后将会自动重定向到以下 URL"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "byClickingYouWillBeRedirectedToThisUrl": "如果授予存取權限，就會自動導向到以下的網址"
}
</locale>
