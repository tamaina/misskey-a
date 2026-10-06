<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div v-if="invitations.length > 0" class="_gaps_s">
		<MkFolder v-for="invitation in invitations" :key="invitation.id" :defaultOpen="true">
			<template #icon><i class="ti ti-users-group"></i></template>
			<template #label>{{ invitation.room.name }}</template>
			<template #suffix><MkTime :time="invitation.createdAt"/></template>
			<template #footer>
				<div class="_buttons">
					<MkButton primary @click="join(invitation)"><i class="ti ti-plus"></i> {{ $locale.sfc.join }}</MkButton>
					<MkButton danger @click="ignore(invitation)"><i class="ti ti-x"></i> {{ $locale.sfc.ignore }}</MkButton>
				</div>
			</template>

			<div :class="$style.invitationBody">
				<MkAvatar :user="invitation.room.owner" :class="$style.invitationBodyAvatar" link/>
				<div style="flex: 1;" class="_gaps_s">
					<MkUserName :user="invitation.room.owner"/>
					<hr>
					<div>{{ invitation.room.description === '' ? $locale.sfc.noDescription : invitation.room.description }}</div>
				</div>
			</div>
		</MkFolder>
	</div>
	<MkResult v-if="!fetching && invitations.length == 0" type="empty" :text="$locale.sfc.noInvitations"/>
	<MkLoading v-if="fetching"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useRouter } from '@/router.js';
import MkFolder from '@/components/MkFolder.vue';

const router = useRouter();

const fetching = ref(true);
const invitations = ref<Misskey.entities.ChatRoomInvitation[]>([]);

async function fetchInvitations() {
	fetching.value = true;

	const res = await misskeyApi('chat/rooms/invitations/inbox');

	invitations.value = res;

	fetching.value = false;
}

async function join(invitation: Misskey.entities.ChatRoomInvitation) {
	await misskeyApi('chat/rooms/join', {
		roomId: invitation.room.id,
	});

	router.push('/chat/room/:roomId', {
		params: {
			roomId: invitation.room.id,
		},
	});
}

async function ignore(invitation: Misskey.entities.ChatRoomInvitation) {
	await misskeyApi('chat/rooms/invitations/ignore', {
		roomId: invitation.room.id,
	});

	invitations.value = invitations.value.filter(i => i.id !== invitation.id);
}

onMounted(() => {
	fetchInvitations();
});
</script>

<style lang="scss" module>
.invitationBody {
	display: flex;
	align-items: center;
}

.invitationBodyAvatar {
	margin-right: 12px;
	width: 45px;
	height: 45px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "join": "Afegir-se ",
  "ignore": "Ignorar ",
  "noDescription": "No hi ha una descripció ",
  "noInvitations": "No tens cap invitació "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "join": "Beitreten",
  "ignore": "Ignorieren",
  "noDescription": "Keine Beschreibung vorhanden",
  "noInvitations": "Keine Einladungen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "join": "Unirse",
  "ignore": "Ignorar",
  "noDescription": "No hay descripción",
  "noInvitations": "No hay invitación."
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "Il n'y a pas de description",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "join": "Gabung",
  "ignore": "Ignore",
  "noDescription": "Tidak ada deskripsi",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "join": "Entra",
  "ignore": "Ignora",
  "noDescription": "Manca la descrizione",
  "noInvitations": "Nessun invito"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "join": "参加",
  "ignore": "無視",
  "noDescription": "説明文はありません",
  "noInvitations": "招待はありません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "join": "入る",
  "ignore": "ほっとく",
  "noDescription": "説明文はあらへんで",
  "noInvitations": "招待はあらへんで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "join": "참여",
  "ignore": "무시",
  "noDescription": "설명문이 없습니다",
  "noInvitations": "초대장이 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "join": "Entrar",
  "ignore": "Ignorar",
  "noDescription": "Não há descrição",
  "noInvitations": "Sem convites"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "join": "Войти",
  "ignore": "Проигнорировать",
  "noDescription": "Нет описания",
  "noInvitations": "Приглашений нет"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "join": "เข้าร่วม",
  "ignore": "ไม่สนใจ",
  "noDescription": "ไม่มีข้อความอธิบาย",
  "noInvitations": "ไม่มีคำเชิญ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "join": "Katıl",
  "ignore": "Yoksay",
  "noDescription": "Açıklama yok",
  "noInvitations": "Davet yok"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "join": "Приєднатися",
  "ignore": "Ігнорувати",
  "noDescription": "Пояснення відсутнє",
  "noInvitations": "Немає запрошень"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "join": "Join",
  "ignore": "Ignore",
  "noDescription": "There is no explanation",
  "noInvitations": "No invitations"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "join": "加入",
  "ignore": "忽略",
  "noDescription": "没有描述",
  "noInvitations": "没有邀请"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "join": "加入",
  "ignore": "忽視",
  "noDescription": "沒有說明文字",
  "noInvitations": "沒有邀請"
}
</locale>
