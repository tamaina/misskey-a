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
		<MkButton inline primary :disabled="type === 'list' && userListId === null" @click="save"><i class="ti ti-check"></i> {{ globalLocale.env.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { useLocale } from 'virtual:vite-vue-internationalization';
import type { GlobalLocale } from '@features/runtime/frontend/shared/global-locale.js';
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

const globalLocale = useLocale<GlobalLocale>(import.meta.url);

const props = defineProps<{
	value: NotificationConfig;
	userLists: Misskey.entities.UserList[];
	configurableTypes?: NotificationConfig['type'][]; // If not specified, all types are configurable
}>();

const emit = defineEmits<{
	(ev: 'update', result: NotificationConfig): void;
}>();

const notificationConfigTypesI18nMap: Record<typeof notificationConfigTypes[number], string> = {
	all: globalLocale.value.env.all,
	following: $locale.value.sfc.following,
	follower: $locale.value.sfc.followers,
	mutualFollow: $locale.value.sfc.mutualFollow,
	followingOrFollower: $locale.value.sfc.followingOrFollower,
	list: $locale.value.sfc.userList,
	never: globalLocale.value.env.none,
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
	"following": "المتابَعون",
	"followers": "المتابِعون",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "القوائم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"following": "Segueixes ",
	"followers": "Seguidors",
	"mutualFollow": "Seguidor mutu",
	"followingOrFollower": "Seguint o seguidor",
	"userList": "Llistes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"following": "Sledovaní",
	"followers": "Sledující",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Seznamy"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"following": "Folgt",
	"followers": "Gefolgt von",
	"mutualFollow": "Gegenseitig gefolgt",
	"followingOrFollower": "Follow oder Follower",
	"userList": "Liste"
}
</locale>

<locale locale="en-US" lang="json">
{
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"following": "Siguiendo",
	"followers": "Seguidores",
	"mutualFollow": "Os seguís mutuamente",
	"followingOrFollower": "Siguiendo o seguidor",
	"userList": "Lista"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"following": "Abonnements",
	"followers": "Abonné·e·s",
	"mutualFollow": "Abonnement mutuel",
	"followingOrFollower": "Abonnement ou abonné",
	"userList": "Listes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"following": "Ikuti",
	"followers": "Pengikut",
	"mutualFollow": "Saling mengikuti",
	"followingOrFollower": "Mengikuti atau pengikut",
	"userList": "Daftar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"following": "Following",
	"followers": "Follower",
	"mutualFollow": "Follow reciproco",
	"followingOrFollower": "Following o Follower",
	"userList": "Liste"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"following": "フォロー",
	"followers": "フォロワー",
	"mutualFollow": "相互フォロー",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"following": "フォロー",
	"followers": "フォロワー",
	"mutualFollow": "お互いフォローしてんで",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"following": "Ig ṭṭafaṛ",
	"followers": "Imeḍfaṛen",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Tibdarin"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"following": "팔로잉",
	"followers": "팔로워",
	"mutualFollow": "맞팔로우",
	"followingOrFollower": "팔로 중이거나 팔로워",
	"userList": "리스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"following": "Volgend",
	"followers": "Volgers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Gevolgd of volger",
	"userList": "Lijsten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"following": "Følger",
	"followers": "Følgere",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lister"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"following": "Obserwowani",
	"followers": "Obserwujący",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Listy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"following": "Seguindo",
	"followers": "Seguidores",
	"mutualFollow": "Seguidor mútuo",
	"followingOrFollower": "Seguidor ou usuário seguido",
	"userList": "Listas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"following": "Подписки",
	"followers": "Подписчики",
	"mutualFollow": "Взаимные подписки",
	"followingOrFollower": "Подписки или подписчики",
	"userList": "Списки"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"following": "Sledujete",
	"followers": "Sledujúci",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Zoznamy"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"following": "กำลังติดตาม",
	"followers": "ผู้ติดตาม",
	"mutualFollow": "ติดตามซึ่งกันและกัน",
	"followingOrFollower": "กำลังติดตามหรือผู้ติดตาม",
	"userList": "ลิสต์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"following": "Takip",
	"followers": "Takipçi",
	"mutualFollow": "Karşılıklı takip",
	"followingOrFollower": "Takip eden veya takipçi",
	"userList": "Listeler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"following": "Following",
	"followers": "Followers",
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"following": "Підписки",
	"followers": "Підписники",
	"mutualFollow": "Взаємна підписка",
	"followingOrFollower": "Підписки або підписники",
	"userList": "Списки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"following": "Đang theo dõi",
	"followers": "Người theo dõi",
	"mutualFollow": "Theo dõi lẫn nhau",
	"followingOrFollower": "Đang theo dõi hoặc người theo dõi",
	"userList": "Danh sách"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"following": "关注中",
	"followers": "关注者",
	"mutualFollow": "互相关注",
	"followingOrFollower": "关注中或关注者",
	"userList": "列表"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"following": "追隨中",
	"followers": "追隨者",
	"mutualFollow": "互相追隨",
	"followingOrFollower": "追隨中或追隨者",
	"userList": "使用者清單"
}
</locale>
