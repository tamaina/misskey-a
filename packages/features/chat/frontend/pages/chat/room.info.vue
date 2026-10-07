<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInput v-model="name_" :disabled="!isOwner">
		<template #label>{{ $locale.sfc.name }}</template>
	</MkInput>

	<MkTextarea v-model="description_" :disabled="!isOwner">
		<template #label>{{ $locale.sfc.description }}</template>
	</MkTextarea>

	<MkButton v-if="isOwner" primary @click="save">{{ $locale.sfc.save }}</MkButton>

	<hr>

	<MkButton v-if="isOwner || ($i.isAdmin || $i.isModerator)" danger @click="del">{{ $locale.sfc.deleteRoom }}</MkButton>

	<MkSwitch v-if="!isOwner" v-model="isMuted">
		<template #label>{{ $locale.sfc.muteThisRoom }}</template>
	</MkSwitch>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { useRouter } from '@features/navigation/frontend/router.js';

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
	"name": "الإسم",
	"description": "الوصف",
	"save": "حفظ",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "متأكد من أنك تريد حذف {x}؟"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"name": "Nom",
	"description": "Descripció",
	"save": "Desa",
	"deleteRoom": "Esborrar la sala",
	"muteThisRoom": "Silenciar aquesta sala",
	"deleteAreYouSure": "Segur que vols esborrar «{x}»?"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"name": "Jméno",
	"description": "Popis",
	"save": "Uložit",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"name": "Name",
	"description": "Description",
	"save": "Save",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"name": "Name",
	"description": "Beschreibung",
	"save": "Speichern",
	"deleteRoom": "Raum löschen",
	"muteThisRoom": "Raum stummschalten",
	"deleteAreYouSure": "Möchtest du „{x}“ wirklich löschen?"
}
</locale>

<locale locale="en-US" lang="json">
{
	"name": "Name",
	"description": "Description",
	"save": "Save",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"name": "Nombre",
	"description": "Descripción",
	"save": "Guardar",
	"deleteRoom": "Borrar sala",
	"muteThisRoom": "Silenciar esta sala",
	"deleteAreYouSure": "¿Desea borrar \"{x}\"?"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"name": "Nom",
	"description": "Description",
	"save": "Enregistrer",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} » ?"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"name": "Nama",
	"description": "Deskripsi",
	"save": "Simpan",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"name": "Nome",
	"description": "Descrizione",
	"save": "Salva",
	"deleteRoom": "Elimina stanza",
	"muteThisRoom": "Silenzia stanza",
	"deleteAreYouSure": "Vuoi davvero eliminare \"{x}\"?"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"name": "名前",
	"description": "説明",
	"save": "保存",
	"deleteRoom": "グループを削除",
	"muteThisRoom": "このグループをミュート",
	"deleteAreYouSure": "「{x}」を削除しますか？"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"name": "名前",
	"description": "説明",
	"save": "とっとく",
	"deleteRoom": "ルームをほかす",
	"muteThisRoom": "このグループをミュート",
	"deleteAreYouSure": "「{x}」はほかしてええか？"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"name": "Name",
	"description": "Description",
	"save": "Sekles",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"name": "Name",
	"description": "Description",
	"save": "ಉಳಿಸಿ",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"name": "이름",
	"description": "설명",
	"save": "저장",
	"deleteRoom": "방을 삭제하기",
	"muteThisRoom": "이 방을 뮤트하기",
	"deleteAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"name": "Naam",
	"description": "Beschrijving",
	"save": "Opslaan",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"name": "Navn",
	"description": "Beskrivelse",
	"save": "Lagre",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Er du sikker på at du vil slette \"{x}\"?"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"name": "Nazwa",
	"description": "Opis",
	"save": "Zapisz",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Czy na pewno chcesz usunąć „{x}”?"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"name": "Nome",
	"description": "Descrição",
	"save": "Salvar",
	"deleteRoom": "Excluir sala",
	"muteThisRoom": "Silenciar sala",
	"deleteAreYouSure": "Deseja excluir \"{x}\"?"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"name": "Название",
	"description": "Описание",
	"save": "Сохранить",
	"deleteRoom": "Удалить комнату",
	"muteThisRoom": "Заглушить комнату",
	"deleteAreYouSure": "Хотите удалить «{x}»?"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"name": "Názov",
	"description": "Popis",
	"save": "Uložiť",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Naozaj chcete odstrániť \"{x}\"?"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"name": "ชื่อ",
	"description": "คำอธิบาย",
	"save": "บันทึก",
	"deleteRoom": "ลบห้อง",
	"muteThisRoom": "ปิดเสียงห้องนี้",
	"deleteAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"name": "İsim",
	"description": "Açıklama",
	"save": "Kaydet",
	"deleteRoom": "Odayı sil",
	"muteThisRoom": "Sessiz oda",
	"deleteAreYouSure": "“{x}” öğesini silmek istediğinizden emin misin?"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"name": "Name",
	"description": "Description",
	"save": "Save",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"name": "Ім'я",
	"description": "Опис",
	"save": "Зберегти",
	"deleteRoom": "Видалити групу",
	"muteThisRoom": "Заглушити цю групу",
	"deleteAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"name": "Tên",
	"description": "Mô tả",
	"save": "Lưu",
	"deleteRoom": "Delete room",
	"muteThisRoom": "Mute room",
	"deleteAreYouSure": "Bạn có chắc muốn xóa \"{x}\"?"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"name": "名称",
	"description": "描述",
	"save": "保存",
	"deleteRoom": "删除群聊",
	"muteThisRoom": "消息免打扰",
	"deleteAreYouSure": "要删掉「{x}」吗？"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"name": "名稱",
	"description": "描述",
	"save": "儲存",
	"deleteRoom": "刪除聊天室",
	"muteThisRoom": "此聊天室已靜音",
	"deleteAreYouSure": "確定要刪掉「{x}」嗎？"
}
</locale>
