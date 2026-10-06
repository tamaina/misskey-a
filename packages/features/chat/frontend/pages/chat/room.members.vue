<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkButton v-if="isOwner" primary rounded style="margin: 0 auto;" @click="emit('inviteUser')"><i class="ti ti-plus"></i> {{ $locale.sfc.inviteUser }}</MkButton>

	<MkA :class="$style.membershipBody" :to="`${userPage(room.owner)}`">
		<MkUserCardMini :user="room.owner"/>
	</MkA>

	<hr v-if="memberships.length > 0">

	<div v-for="membership in memberships" :key="membership.id" :class="$style.membership">
		<MkA :class="$style.membershipBody" :to="`${userPage(membership.user!)}`">
			<MkUserCardMini :user="membership.user!"/>
		</MkA>
	</div>

	<template v-if="isOwner">
		<hr>

		<div>{{ $locale.sfc.sentInvitations }}</div>

		<div v-for="invitation in invitations" :key="invitation.id" :class="$style.invitation">
			<MkA :class="$style.invitationBody" :to="`${userPage(invitation.user)}`">
				<MkUserCardMini :user="invitation.user"/>
			</MkA>
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import { userPage } from '@features/users/frontend/filters/user.js';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

const props = defineProps<{
	room: Misskey.entities.ChatRoom;
}>();

const emit = defineEmits<{
	(ev: 'inviteUser'): void,
}>();

const isOwner = computed(() => {
	return props.room.ownerId === $i.id;
});

const memberships = ref<Misskey.entities.ChatRoomMembership[]>([]);
const invitations = ref<Misskey.entities.ChatRoomInvitation[]>([]);

onMounted(async () => {
	memberships.value = await misskeyApi('chat/rooms/members', {
		roomId: props.room.id,
		limit: 50,
	});

	if (isOwner.value) {
		invitations.value = await misskeyApi('chat/rooms/invitations/outbox', {
			roomId: props.room.id,
			limit: 50,
		});
	}
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
}

.invitation {
	display: flex;
}

.invitationBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "inviteUser": "Invitar usuaris",
  "sentInvitations": "Enviar invitacions"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "inviteUser": "Benutzer einladen",
  "sentInvitations": "Verschickte Einladungen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "inviteUser": "Invitar  usuarios",
  "sentInvitations": "Invitaciones enviadas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "inviteUser": "Invita persona",
  "sentInvitations": "Inviti spediti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "inviteUser": "ユーザーを招待",
  "sentInvitations": "送信した招待"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "inviteUser": "ユーザーを招待",
  "sentInvitations": "送信した招待"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "inviteUser": "유저를 초대",
  "sentInvitations": "초대를 보내기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "inviteUser": "Convidar Usuários",
  "sentInvitations": "Convites Enviados"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "inviteUser": "Пригласить пользователей",
  "sentInvitations": "Отправленные приглашения"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "inviteUser": "เชิญผู้ใช้",
  "sentInvitations": "คำเชิญที่ส่งไปแล้ว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "inviteUser": "Kullanıcıları Davet Et",
  "sentInvitations": "Gönderilen Davetler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "inviteUser": "Запросити користувачів",
  "sentInvitations": "Відправленні запрошення"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "inviteUser": "Invite Users",
  "sentInvitations": "Sent Invites"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "inviteUser": "邀请用户",
  "sentInvitations": "已发送的邀请"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "inviteUser": "邀請使用者",
  "sentInvitations": "已傳送的邀請"
}
</locale>
