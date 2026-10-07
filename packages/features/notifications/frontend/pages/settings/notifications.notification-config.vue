<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="type" :items="typeDef">
	</MkSelect>

	<MkSelect v-if="type === 'list'" v-model="userListId" :items="userListIdDef">
		<template #label>{{ $locale.sfc.userList }}</template>
	</MkSelect>

	<div class="_buttons">
		<MkButton inline primary :disabled="type === 'list' && userListId === null" @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
const notificationConfigTypes = [
	'all',
	'following',
	'follower',
	'mutualFollow',
	'followingOrFollower',
	'list',
	'never'
] as const;

export type NotificationConfig = {
	type: Exclude<typeof notificationConfigTypes[number], 'list'>;
} | {
	type: 'list';
	userListId: string;
};
</script>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { ref, computed } from 'vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

const props = defineProps<{
	value: NotificationConfig;
	userLists: Misskey.entities.UserList[];
	configurableTypes?: NotificationConfig['type'][]; // If not specified, all types are configurable
}>();

const emit = defineEmits<{
	(ev: 'update', result: NotificationConfig): void;
}>();

const notificationConfigTypesI18nMap: Record<typeof notificationConfigTypes[number], string> = {
	all: $locale.value.sfc.all,
	following: $locale.value.sfc.following,
	follower: $locale.value.sfc.followers,
	mutualFollow: $locale.value.sfc.mutualFollow,
	followingOrFollower: $locale.value.sfc.followingOrFollower,
	list: $locale.value.sfc.userList,
	never: $locale.value.sfc.none,
};

const {
	model: type,
	def: typeDef,
} = useMkSelect({
	items: computed(() => (props.configurableTypes ?? notificationConfigTypes).map((t: NotificationConfig['type']) => ({
		label: notificationConfigTypesI18nMap[t],
		value: t,
	}))),
	initialValue: props.value.type,
});
const {
	model: userListId,
	def: userListIdDef,
} = useMkSelect({
	items: computed(() => props.userLists.map(list => ({
		label: list.name,
		value: list.id,
	}))),
	initialValue: props.value.type === 'list' ? props.value.userListId : null,
});

function save() {
	emit('update', type.value === 'list' ? { type: type.value, userListId: userListId.value! } : { type: type.value });
}
</script>

<locale locale="ar-SA" lang="json">
{
	"all": "الكل",
	"following": "المتابَعون",
	"followers": "المتابِعون",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "القوائم",
	"none": "لا شيء",
	"save": "حفظ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"all": "Tot",
	"following": "Segueixes ",
	"followers": "Seguidors",
	"mutualFollow": "Seguidor mutu",
	"followingOrFollower": "Seguint o seguidor",
	"userList": "Llistes",
	"none": "Res",
	"save": "Desa"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"all": "Vše",
	"following": "Sledovaní",
	"followers": "Sledující",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Seznamy",
	"none": "Žádný",
	"save": "Uložit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"all": "All",
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"none": "None",
	"save": "Save"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"all": "Alle",
	"following": "Folgt",
	"followers": "Gefolgt von",
	"mutualFollow": "Gegenseitig gefolgt",
	"followingOrFollower": "Follow oder Follower",
	"userList": "Liste",
	"none": "Nichts",
	"save": "Speichern"
}
</locale>

<locale locale="en-US" lang="json">
{
	"all": "All",
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"none": "None",
	"save": "Save"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"all": "Todo",
	"following": "Siguiendo",
	"followers": "Seguidores",
	"mutualFollow": "Os seguís mutuamente",
	"followingOrFollower": "Siguiendo o seguidor",
	"userList": "Lista",
	"none": "Ninguna",
	"save": "Guardar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"all": "Tous",
	"following": "Abonnements",
	"followers": "Abonné·e·s",
	"mutualFollow": "Abonnement mutuel",
	"followingOrFollower": "Abonnement ou abonné",
	"userList": "Listes",
	"none": "Rien",
	"save": "Enregistrer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"all": "Semua",
	"following": "Ikuti",
	"followers": "Pengikut",
	"mutualFollow": "Saling mengikuti",
	"followingOrFollower": "Mengikuti atau pengikut",
	"userList": "Daftar",
	"none": "Tidak ada",
	"save": "Simpan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"all": "Tutte",
	"following": "Following",
	"followers": "Follower",
	"mutualFollow": "Follow reciproco",
	"followingOrFollower": "Following o Follower",
	"userList": "Liste",
	"none": "Nessuna",
	"save": "Salva"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"all": "全て",
	"following": "フォロー",
	"followers": "フォロワー",
	"mutualFollow": "相互フォロー",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト",
	"none": "なし",
	"save": "保存"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"all": "みんな",
	"following": "フォロー",
	"followers": "フォロワー",
	"mutualFollow": "お互いフォローしてんで",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト",
	"none": "なし",
	"save": "とっとく"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"all": "All",
	"following": "Ig ṭṭafaṛ",
	"followers": "Imeḍfaṛen",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Tibdarin",
	"none": "None",
	"save": "Sekles"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"all": "All",
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"none": "None",
	"save": "ಉಳಿಸಿ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"all": "전체",
	"following": "팔로잉",
	"followers": "팔로워",
	"mutualFollow": "맞팔로우",
	"followingOrFollower": "팔로 중이거나 팔로워",
	"userList": "리스트",
	"none": "없음",
	"save": "저장"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"all": "Alle",
	"following": "Volgend",
	"followers": "Volgers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Gevolgd of volger",
	"userList": "Lijsten",
	"none": "Niets",
	"save": "Opslaan"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"all": "Alle",
	"following": "Følger",
	"followers": "Følgere",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lister",
	"none": "Ingen",
	"save": "Lagre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"all": "Wszystkie",
	"following": "Obserwowani",
	"followers": "Obserwujący",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Listy",
	"none": "Brak",
	"save": "Zapisz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"all": "Todos",
	"following": "Seguindo",
	"followers": "Seguidores",
	"mutualFollow": "Seguidor mútuo",
	"followingOrFollower": "Seguidor ou usuário seguido",
	"userList": "Listas",
	"none": "Nenhum",
	"save": "Salvar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"all": "Все",
	"following": "Подписки",
	"followers": "Подписчики",
	"mutualFollow": "Взаимные подписки",
	"followingOrFollower": "Подписки или подписчики",
	"userList": "Списки",
	"none": "Ничего",
	"save": "Сохранить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"all": "Všetko",
	"following": "Sledujete",
	"followers": "Sledujúci",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Zoznamy",
	"none": "Žiadne",
	"save": "Uložiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"all": "ทั้งหมด",
	"following": "กำลังติดตาม",
	"followers": "ผู้ติดตาม",
	"mutualFollow": "ติดตามซึ่งกันและกัน",
	"followingOrFollower": "กำลังติดตามหรือผู้ติดตาม",
	"userList": "ลิสต์",
	"none": "ไม่มี",
	"save": "บันทึก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"all": "Tümü",
	"following": "Takip",
	"followers": "Takipçi",
	"mutualFollow": "Karşılıklı takip",
	"followingOrFollower": "Takip eden veya takipçi",
	"userList": "Listeler",
	"none": "Hiçbiri",
	"save": "Kaydet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"all": "All",
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists",
	"none": "None",
	"save": "Save"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"all": "Всі",
	"following": "Підписки",
	"followers": "Підписники",
	"mutualFollow": "Взаємна підписка",
	"followingOrFollower": "Підписки або підписники",
	"userList": "Списки",
	"none": "Відсутній",
	"save": "Зберегти"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"all": "Tất cả",
	"following": "Đang theo dõi",
	"followers": "Người theo dõi",
	"mutualFollow": "Theo dõi lẫn nhau",
	"followingOrFollower": "Đang theo dõi hoặc người theo dõi",
	"userList": "Danh sách",
	"none": "Không",
	"save": "Lưu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"all": "全部",
	"following": "关注中",
	"followers": "关注者",
	"mutualFollow": "互相关注",
	"followingOrFollower": "关注中或关注者",
	"userList": "列表",
	"none": "无",
	"save": "保存"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"all": "全部",
	"following": "追隨中",
	"followers": "追隨者",
	"mutualFollow": "互相追隨",
	"followingOrFollower": "追隨中或追隨者",
	"userList": "使用者清單",
	"none": "無",
	"save": "儲存"
}
</locale>
