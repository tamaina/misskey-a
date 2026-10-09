<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="initializing || message == null">
			<MkLoading/>
		</div>
		<div v-else>
			<XMessage :message="message" :isSearchResult="true"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import XMessage from '@features/chat/frontend/pages/chat/XMessage.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';

const props = defineProps<{
	messageId: string;
}>();

const initializing = ref(true);
const message = ref<Misskey.entities.ChatMessage | null>();

async function initialize() {
	initializing.value = true;

	message.value = await misskeyApi('chat/messages/show', {
		messageId: props.messageId,
	});

	initializing.value = false;
}

onMounted(() => {
	initialize();
});

definePage({
	title: $locale.value.sfc.directMessage,
});
</script>

<locale locale="ar-SA" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"directMessage": "Xateja amb aquest usuari"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"directMessage": "Mit dem Benutzer chatten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"directMessage": "Chatear"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"directMessage": "Obrolan pengguna"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"directMessage": "Chattare insieme"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"directMessage": "ダイレクトメッセージ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"directMessage": "チャットしよか"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"directMessage": "채팅하기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"directMessage": "Conversar com usuário"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"directMessage": "Личные сообщения"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"directMessage": "แชตเลย"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"directMessage": "Kullanıcıyla sohbet et"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"directMessage": "Чат із користувачем"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"directMessage": "Chat with user"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"directMessage": "私信"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"directMessage": "直接訊息"
}
</locale>
