<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInput v-model="name_" :disabled="!isOwner">
		<template #label>{{ globalLocale.env.name }}</template>
	</MkInput>

	<MkTextarea v-model="description_" :disabled="!isOwner">
		<template #label>{{ globalLocale.env.description }}</template>
	</MkTextarea>

	<MkButton v-if="isOwner" primary @click="save">{{ globalLocale.env.save }}</MkButton>

	<hr>

	<MkButton v-if="isOwner || ($i.isAdmin || $i.isModerator)" danger @click="del">{{ $locale.sfc.deleteRoom }}</MkButton>

	<MkSwitch v-if="!isOwner" v-model="isMuted">
		<template #label>{{ $locale.sfc.muteThisRoom }}</template>
	</MkSwitch>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { useRouter } from '@features/navigation/frontend/router.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const router = useRouter();
const $i = ensureSignin();

const props = defineProps<{
	room: Misskey.entities.ChatRoom;
}>();

const isOwner = computed(() => {
	return props.room.ownerId === $i.id;
});

const name_ = ref(props.room.name);
const description_ = ref(props.room.description);

function save() {
	os.apiWithDialog('chat/rooms/update', {
		roomId: props.room.id,
		name: name_.value,
		description: description_.value,
	});
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: $l.value.sfc.deleteAreYouSure({ x: name_.value }),
	});
	if (canceled) return;

	await os.apiWithDialog('chat/rooms/delete', {
		roomId: props.room.id,
	});
	router.push('/chat');
}

const isMuted = ref(props.room.isMuted ?? false);

watch(isMuted, async () => {
	await os.apiWithDialog('chat/rooms/mute', {
		roomId: props.room.id,
		mute: isMuted.value,
	});
});
</script>

<style lang="scss" module>
.membership {
	display: flex;
}

.membershipBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"deleteRoom": "Esborrar la sala",
	"muteThisRoom": "Silenciar aquesta sala"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"deleteRoom": "Raum löschen",
	"muteThisRoom": "Raum stummschalten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"deleteRoom": "Borrar sala",
	"muteThisRoom": "Silenciar esta sala"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"deleteRoom": "Elimina stanza",
	"muteThisRoom": "Silenzia stanza"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"deleteRoom": "グループを削除",
	"muteThisRoom": "このグループをミュート"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"deleteRoom": "ルームをほかす",
	"muteThisRoom": "このグループをミュート"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"deleteRoom": "방을 삭제하기",
	"muteThisRoom": "이 방을 뮤트하기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"deleteRoom": "Excluir sala",
	"muteThisRoom": "Silenciar sala"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"deleteRoom": "Удалить комнату",
	"muteThisRoom": "Заглушить комнату"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"deleteRoom": "ลบห้อง",
	"muteThisRoom": "ปิดเสียงห้องนี้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"deleteRoom": "Odayı sil",
	"muteThisRoom": "Sessiz oda"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"deleteRoom": "Видалити групу",
	"muteThisRoom": "Заглушити цю групу"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"deleteRoom": "删除群聊",
	"muteThisRoom": "消息免打扰"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"deleteRoom": "刪除聊天室",
	"muteThisRoom": "此聊天室已靜音"
}
</locale>
