<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<MkPolkadots v-if="tab === 'home'" accented :height="200" style="margin-bottom: -200px;"/>
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<XHome v-if="tab === 'home'"/>
		<XInvitations v-else-if="tab === 'invitations'"/>
		<XJoiningRooms v-else-if="tab === 'joiningRooms'"/>
		<XOwnedRooms v-else-if="tab === 'ownedRooms'"/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import XHome from '@features/chat/frontend/pages/chat/home.home.vue';
import XInvitations from '@features/chat/frontend/pages/chat/home.invitations.vue';
import XJoiningRooms from '@features/chat/frontend/pages/chat/home.joiningRooms.vue';
import XOwnedRooms from '@features/chat/frontend/pages/chat/home.ownedRooms.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import MkPolkadots from '@features/ui/frontend/components/MkPolkadots.vue';

const tab = ref('home');

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'home',
	title: $locale.value.sfc.home,
	icon: 'ti ti-home',
}, {
	key: 'invitations',
	title: $locale.value.sfc.invitations,
	icon: 'ti ti-ticket',
}, {
	key: 'joiningRooms',
	title: $locale.value.sfc.joiningRooms,
	icon: 'ti ti-users-group',
}, {
	key: 'ownedRooms',
	title: $locale.value.sfc.yourRooms,
	icon: 'ti ti-settings',
}]);

definePage(() => ({
	title: $locale.value.sfc.directMessage,
	icon: 'ti ti-messages',
}));
</script>

<style lang="scss" module>
</style>

<locale locale="ar-SA" lang="json">
{
	"home": "الرئيسي",
	"invitations": "دعوة",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"home": "Inici",
	"invitations": "Convida",
	"joiningRooms": "Sales a les quals participes",
	"yourRooms": "Sales creades",
	"directMessage": "Xateja amb aquest usuari"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"home": "Domů",
	"invitations": "Pozvat",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"home": "Home",
	"invitations": "Invite",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"home": "Startseite",
	"invitations": "Einladen",
	"joiningRooms": "Raum beitreten",
	"yourRooms": "Erstellte Räume",
	"directMessage": "Mit dem Benutzer chatten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"home": "Home",
	"invitations": "Invite",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"home": "Inicio",
	"invitations": "Invitar",
	"joiningRooms": "Salas que te has unido",
	"yourRooms": "Salas creadas",
	"directMessage": "Chatear"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"home": "Principal",
	"invitations": "Inviter",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"home": "Beranda",
	"invitations": "Undang",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Obrolan pengguna"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"home": "Home",
	"invitations": "Inviti",
	"joiningRooms": "Stanze a cui partecipi",
	"yourRooms": "Le tue stanze",
	"directMessage": "Chattare insieme"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"home": "ホーム",
	"invitations": "招待",
	"joiningRooms": "参加中のグループ",
	"yourRooms": "作成したグループ",
	"directMessage": "ダイレクトメッセージ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"home": "ホーム",
	"invitations": "来てや",
	"joiningRooms": "参加中のグループ",
	"yourRooms": "作成したグループ",
	"directMessage": "チャットしよか"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"home": "Home",
	"invitations": "Invite",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"home": "Home",
	"invitations": "Invite",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"home": "홈",
	"invitations": "초대",
	"joiningRooms": "참가 중인 방",
	"yourRooms": "만들어진 방",
	"directMessage": "채팅하기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"home": "Startpagina",
	"invitations": "Uitnodigen",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"home": "Hjem",
	"invitations": "Inviter",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"home": "Strona główna",
	"invitations": "Zaproś",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"home": "Início",
	"invitations": "Convidar",
	"joiningRooms": "Salas ingressadas",
	"yourRooms": "Salas criadas",
	"directMessage": "Conversar com usuário"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"home": "Главная",
	"invitations": "Пригласить",
	"joiningRooms": "Комнаты",
	"yourRooms": "Ваши комнаты",
	"directMessage": "Личные сообщения"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"home": "Domov",
	"invitations": "Pozvať",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"home": "หน้าหลัก",
	"invitations": "คำเชิญ",
	"joiningRooms": "ห้องที่เข้าร่วมอยู่",
	"yourRooms": "ห้องที่สร้างไว้",
	"directMessage": "แชตเลย"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"home": "Ana Sayfa",
	"invitations": "Davet",
	"joiningRooms": "Katıldığı odalar",
	"yourRooms": "Oluşturulan odalar",
	"directMessage": "Kullanıcıyla sohbet et"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"home": "Home",
	"invitations": "Invite",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"home": "Домівка",
	"invitations": "Запросити",
	"joiningRooms": "Чати, до яких ви доєднанні",
	"yourRooms": "Створені групи",
	"directMessage": "Чат із користувачем"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"home": "Trang chính",
	"invitations": "Mời",
	"joiningRooms": "Joined rooms",
	"yourRooms": "Created rooms",
	"directMessage": "Chat with user"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"home": "首页",
	"invitations": "邀请",
	"joiningRooms": "已加入的群聊",
	"yourRooms": "已创建的群聊",
	"directMessage": "私信"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"home": "首頁",
	"invitations": "邀請",
	"joiningRooms": "已加入的聊天室",
	"yourRooms": "已建立的聊天室",
	"directMessage": "直接訊息"
}
</locale>
