<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked">
	<template #header><i class="ti ti-messages" style="margin-right: 8px;"></i>{{ column.name || $locale.sfc.chat }}</template>

	<div style="padding: 8px;" class="_gaps">
		<MkInfo v-if="$i.policies.chatAvailability === 'readonly'">{{ $locale.sfc.chatIsReadOnlyForThisAccountOrServer }}</MkInfo>
		<MkInfo v-else-if="$i.policies.chatAvailability === 'unavailable'" warn>{{ $locale.sfc.chatNotAvailableForThisAccountOrServer }}</MkInfo>
		<MkChatHistories v-if="$i.policies.chatAvailability !== 'unavailable'"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { ensureSignin } from '@features/auth/frontend/i.js';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkChatHistories from '@features/chat/frontend/components/MkChatHistories.vue';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const $i = ensureSignin();
</script>

<locale locale="ar-SA" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "chat": "Xateja amb aquest usuari",
  "chatIsReadOnlyForThisAccountOrServer": "El xat és només de lectura en aquest servidor o compte. No es poden escriure nous missatges ni crear o unir-se a sales de xat.",
  "chatNotAvailableForThisAccountOrServer": "El xat no està disponible per aquest servidor o aquest compte."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="da-DK" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="de-DE" lang="json">
{
  "chat": "Mit dem Benutzer chatten",
  "chatIsReadOnlyForThisAccountOrServer": "Der Chat ist auf dieser Instanz oder diesem Konto nur zum Lesen freigegeben. Es ist nicht möglich, neue Nachrichten zu schreiben oder Chaträume zu erstellen oder zu betreten.",
  "chatNotAvailableForThisAccountOrServer": "Der Chat ist auf diesem Server oder für dieses Konto nicht aktiviert."
}
</locale>

<locale locale="en-US" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="es-ES" lang="json">
{
  "chat": "Chatear",
  "chatIsReadOnlyForThisAccountOrServer": "El chat es de sólo lectura en esta instancia o esta cuenta. No puedes escribir nuevos mensajes ni crear/unirte a salas de chat.",
  "chatNotAvailableForThisAccountOrServer": "El chat no está habilitado en este servidor ni para esta cuenta."
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="id-ID" lang="json">
{
  "chat": "Obrolan pengguna",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="it-IT" lang="json">
{
  "chat": "Chatta con questa persona",
  "chatIsReadOnlyForThisAccountOrServer": "Le chat, su questo server o su questo profilo, sono di sola lettura. Impossibile scrivere in chat o creare e partecipare a stanze.",
  "chatNotAvailableForThisAccountOrServer": "Questo server, o questo profilo ha disabilitato la chat."
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "chat": "ダイレクトメッセージ",
  "chatIsReadOnlyForThisAccountOrServer": "このサーバー、またはこのアカウントでダイレクトメッセージは読み取り専用となっています。新たに書き込んだり、グループを作成・参加したりすることはできません。",
  "chatNotAvailableForThisAccountOrServer": "このサーバー、またはこのアカウントでダイレクトメッセージは有効化されていません。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "chat": "チャットしよか",
  "chatIsReadOnlyForThisAccountOrServer": "このサーバー、もしくはこのアカウントでチャットが読み取り専用になっとるわ。新しく書き込んだり、チャットルームを作ったり参加したりはできへんで。",
  "chatNotAvailableForThisAccountOrServer": "このサーバー、もしくはこのアカウントでチャットが有効にされてへんで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "chat": "채팅하기",
  "chatIsReadOnlyForThisAccountOrServer": "이 서버 또는 이 계정에서 채팅은 읽기 전용입니다. 새로 쓰거나 채팅 룸을 만들거나 참가할 수 없습니다.",
  "chatNotAvailableForThisAccountOrServer": "이 서버 또는 이 계정에서 채팅이 활성화되어 있지 않습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="no-NO" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "chat": "Conversar com usuário",
  "chatIsReadOnlyForThisAccountOrServer": "Conversas são apenas para leitura nesse servidor ou para essa conta. Não é possível escrever novas mensagens ou criar/ingressar novas conversas.",
  "chatNotAvailableForThisAccountOrServer": "Conversas não estão habilitadas nesse servidor ou para essa conta."
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "chat": "Открыть личные сообщения",
  "chatIsReadOnlyForThisAccountOrServer": "На этом сервере или для этого пользователя личные сообщения доступны только в режиме чтения. Вы не можете отправлять новые сообщения, создавать группы или присоединяться к ним.",
  "chatNotAvailableForThisAccountOrServer": "Личные сообщения выключены для этого аккаунта или на этом сервере."
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="th-TH" lang="json">
{
  "chat": "แชตเลย",
  "chatIsReadOnlyForThisAccountOrServer": "แชตบนเซิร์ฟเวอร์นี้ หรือบัญชีนี้ เป็นแบบอ่านอย่างเดียว ไม่สามารถส่งข้อความใหม่ สร้างหรือเข้าร่วมห้องแชตได้",
  "chatNotAvailableForThisAccountOrServer": "แชตไม่ได้เปิดใช้งานบนเซิร์ฟเวอร์นี้ หรือบัญชีนี้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "chat": "Sohbet",
  "chatIsReadOnlyForThisAccountOrServer": "Bu sunucuda veya bu hesapta sohbet okunur modundadır. Yeni mesaj yazamaz veya sohbet odası oluşturamaz/katılamazsınız.",
  "chatNotAvailableForThisAccountOrServer": "Bu sunucuda veya bu hesapta sohbet özelliği etkin değildir."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "chat": "Написати цьому користувачу",
  "chatIsReadOnlyForThisAccountOrServer": "Чат доступний лише для читання для цього сервера або облікового запису. Ви не можете друкувати нові повідомлення або створювати/доєлнуватися до груп.",
  "chatNotAvailableForThisAccountOrServer": "Чат не увімкнено на цьому сервері або для цього облікового запису."
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "chat": "Chat with user",
  "chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
  "chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account."
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "chat": "私信",
  "chatIsReadOnlyForThisAccountOrServer": "此服务器或者账户内的聊天为只读。无法发布新信息或创建及加入群聊。",
  "chatNotAvailableForThisAccountOrServer": "此服务器或者账户还未开启聊天功能。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "chat": "聊天",
  "chatIsReadOnlyForThisAccountOrServer": "在此伺服器或此帳戶上的聊天是唯讀的。您無法發布新訊息、建立或加入聊天室。",
  "chatNotAvailableForThisAccountOrServer": "這個伺服器或這個帳號的聊天功能尚未啟用。"
}
</locale>
