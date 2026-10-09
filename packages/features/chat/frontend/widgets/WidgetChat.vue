<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-chat">
	<template #icon><i class="ti ti-users"></i></template>
	<template #header>{{ $locale.sfc.chat }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configure()"><i class="ti ti-settings"></i></button></template>

	<div>
		<MkChatHistories/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkChatHistories from '@features/chat/frontend/components/MkChatHistories.vue';

const name = 'chat';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<locale locale="ar-SA" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"chat": "Xateja amb aquest usuari",
	"showHeader": "Mostrar la capçalera"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"chat": "Mit dem Benutzer chatten",
	"showHeader": "Kopfzeile anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"chat": "Chatear",
	"showHeader": "Mostrar encabezados"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"chat": "Obrolan pengguna",
	"showHeader": "Show header"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"chat": "Messaggi diretti",
	"showHeader": "Mostra la testata"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"chat": "ダイレクトメッセージ",
	"showHeader": "ヘッダーを表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"chat": "チャットしよか",
	"showHeader": "ヘッダー出す"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"chat": "채팅하기",
	"showHeader": "해더를 표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"chat": "Conversar com usuário",
	"showHeader": "Exibir cabeçalho"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"chat": "Открыть личные сообщения",
	"showHeader": "Show header"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"chat": "แชตเลย",
	"showHeader": "แสดงส่วนหัว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"chat": "Sohbet",
	"showHeader": "Başlığı göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"chat": "Написати цьому користувачу",
	"showHeader": "Show header"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"chat": "Chat with user",
	"showHeader": "Show header"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"chat": "私信",
	"showHeader": "显示标题"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"chat": "聊天",
	"showHeader": "檢視標頭 "
}
</locale>
