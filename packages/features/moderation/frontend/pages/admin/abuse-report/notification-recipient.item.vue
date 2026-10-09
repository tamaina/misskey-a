<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_panel _gaps_s">
	<div :class="$style.rightDivider" style="width: 80px;"><span :class="`ti ${methodIcon}`"></span> {{ methodName }}</div>
	<div :class="$style.rightDivider" style="flex: 0.5">{{ entity.name }}</div>
	<div :class="$style.rightDivider" style="flex: 1">
		<div v-if="method === 'email' && user">
			{{
				`${$locale.sfc.notifiedUser}: ` + ((user.name) ? `${user.name}(${user.username})` : user.username)
			}}
		</div>
		<div v-if="method === 'webhook' && systemWebhook">
			{{ `${$locale.sfc.notifiedWebhook}: ` + systemWebhook.name }}
		</div>
	</div>
	<div :class="$style.recipientButtons" style="margin-left: auto">
		<button :class="$style.recipientButton" @click="onEditButtonClicked()">
			<span class="ti ti-settings"></span>
		</button>
		<button :class="$style.recipientButton" @click="onDeleteButtonClicked()">
			<span class="ti ti-trash"></span>
		</button>
	</div>
</div>
</template>

<script setup lang="ts">
import { entities } from 'misskey-js';
import { computed, toRefs } from 'vue';

const emit = defineEmits<{
	(ev: 'edit', id: entities.AbuseReportNotificationRecipient['id']): void;
	(ev: 'delete', id: entities.AbuseReportNotificationRecipient['id']): void;
}>();

const props = defineProps<{
	entity: entities.AbuseReportNotificationRecipient;
}>();

const { entity } = toRefs(props);

const method = computed(() => entity.value.method);
const user = computed(() => entity.value.user);
const systemWebhook = computed(() => entity.value.systemWebhook);
const methodIcon = computed(() => {
	switch (entity.value.method) {
		case 'email':
			return 'ti-mail';
		case 'webhook':
			return 'ti-webhook';
		default:
			return 'ti-help';
	}
});
const methodName = computed(() => {
	switch (entity.value.method) {
		case 'email':
			return $locale.value.sfc.mail;
		case 'webhook':
			return $locale.value.sfc.webhook;
		default:
			return '不明';
	}
});

function onEditButtonClicked() {
	emit('edit', entity.value.id);
}

function onDeleteButtonClicked() {
	emit('delete', entity.value.id);
}
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	padding: 4px 8px;
}

.rightDivider {
	border-right: 0.5px solid var(--MI_THEME-divider);
}

.recipientButtons {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	margin-right: -4;
}

.recipientButton {
	background-color: transparent;
	border: none;
	border-radius: 9999px;
	box-sizing: border-box;
	margin-top: -2px;
	margin-bottom: -2px;
	padding: 8px;

	&:hover {
		background-color: var(--MI_THEME-buttonBg);
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"mail": "البريد الإلكتروني ",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"mail": "Correu electrònic",
	"webhook": "Webhook",
	"notifiedUser": "Usuaris que s'han de notificar ",
	"notifiedWebhook": "Webhook que s'ha de fer servir"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Zu benachrichtigender Benutzer",
	"notifiedWebhook": "Zu verwendender Webhook"
}
</locale>

<locale locale="en-US" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"mail": "Correo",
	"webhook": "Webhook",
	"notifiedUser": "Usuarios a notificar",
	"notifiedWebhook": "Webhook a utilizar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"mail": "E-mail ",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"mail": "Surel",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Profili da notificare",
	"notifiedWebhook": "Webhook da usare"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"mail": "メール",
	"webhook": "Webhook",
	"notifiedUser": "通知先ユーザー",
	"notifiedWebhook": "使用するWebhook"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"mail": "メール",
	"webhook": "Webhook",
	"notifiedUser": "通知先ユーザー",
	"notifiedWebhook": "使用するWebhook"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"mail": "Imayl",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"mail": "이메일",
	"webhook": "Webhook",
	"notifiedUser": "알릴 유저",
	"notifiedWebhook": "사용할 Webhook"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"mail": "E-post",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"mail": "Adres e-mail",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"mail": "E-mail",
	"webhook": "Webhook",
	"notifiedUser": "Usuários para notificar",
	"notifiedWebhook": "Webhook usado"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"mail": "Электронная почта",
	"webhook": "Вебхук",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Используемый Вебхук"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"mail": "อีเมล",
	"webhook": "Webhook",
	"notifiedUser": "ผู้ใช้ที่ได้รับการแจ้งเตือน",
	"notifiedWebhook": "Webhook ที่ใช้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"mail": "E-Posta",
	"webhook": "Webhook",
	"notifiedUser": "Bildirilecek kullanıcılar",
	"notifiedWebhook": "Kullanılacak webhook"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"mail": "E-mail",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"mail": "Email",
	"webhook": "Webhook",
	"notifiedUser": "Users to notify",
	"notifiedWebhook": "Webhook to use"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"mail": "邮箱",
	"webhook": "Webhook",
	"notifiedUser": "通知的用户",
	"notifiedWebhook": "使用的 webhook"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"mail": "電子郵件",
	"webhook": "Webhook",
	"notifiedUser": "通知的使用者",
	"notifiedWebhook": "使用的 Webhook"
}
</locale>
