<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div v-if="memberships.length > 0" class="_gaps_s">
		<XRoom v-for="membership in memberships" :key="membership.id" :room="membership.room!"/>
	</div>
	<MkResult v-if="!fetching && memberships.length == 0" type="empty" :text="$locale.sfc.noRooms"/>
	<MkLoading v-if="fetching"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XRoom from '@features/chat/frontend/pages/chat/XRoom.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const fetching = ref(true);
const memberships = ref<Misskey.entities.ChatRoomMembership[]>([]);

async function fetchRooms() {
	fetching.value = true;

	const res = await misskeyApi('chat/rooms/joining');

	memberships.value = res;

	fetching.value = false;
}

onMounted(() => {
	fetchRooms();
});
</script>

<style lang="scss" module>

</style>

<locale locale="ar-SA" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "noRooms": "No hi ha cap sala"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "noRooms": "Keine Räume gefunden"
}
</locale>

<locale locale="en-US" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "noRooms": "No te has unido a ninguna sala "
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "noRooms": "Nessuna stanza"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "noRooms": "グループはありません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "noRooms": "ルームはあらへんで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "noRooms": "방이 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "noRooms": "Nenhuma sala encontrada"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "noRooms": "Комнат не найдено"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "noRooms": "ไม่มีห้อง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "noRooms": "Oda bulunamadı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "noRooms": "Груп не знайдено"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "noRooms": "No rooms found"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "noRooms": "没有群聊"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "noRooms": "沒有可用的聊天室"
}
</locale>
