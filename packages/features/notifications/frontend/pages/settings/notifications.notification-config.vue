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
const notificationConfigTypes = [
	'all',
	'following',
	'follower',
	'mutualFollow',
	'followingOrFollower',
	'list',
	'never',
] as const;

export type NotificationConfig = {
	type: Exclude<typeof notificationConfigTypes[number], 'list'>;
} | {
	type: 'list';
	userListId: string;
};
</script>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import type { Locale } from 'i18n';
import * as Misskey from 'misskey-js';
import { ref, computed } from 'vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

const globalLocale = useLocale<Locale>(import.meta.url);

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
	following: globalLocale.value.env.following,
	follower: globalLocale.value.env.followers,
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
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "القوائم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"mutualFollow": "Seguidor mutu",
	"followingOrFollower": "Seguint o seguidor",
	"userList": "Llistes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Seznamy"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"mutualFollow": "Gegenseitig gefolgt",
	"followingOrFollower": "Follow oder Follower",
	"userList": "Liste"
}
</locale>

<locale locale="en-US" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"mutualFollow": "Os seguís mutuamente",
	"followingOrFollower": "Siguiendo o seguidor",
	"userList": "Lista"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"mutualFollow": "Abonnement mutuel",
	"followingOrFollower": "Abonnement ou abonné",
	"userList": "Listes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"mutualFollow": "Saling mengikuti",
	"followingOrFollower": "Mengikuti atau pengikut",
	"userList": "Daftar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"mutualFollow": "Follow reciproco",
	"followingOrFollower": "Following o Follower",
	"userList": "Liste"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"mutualFollow": "相互フォロー",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"mutualFollow": "お互いフォローしてんで",
	"followingOrFollower": "フォロー中またはフォロワー",
	"userList": "リスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Tibdarin"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"mutualFollow": "맞팔로우",
	"followingOrFollower": "팔로 중이거나 팔로워",
	"userList": "리스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Gevolgd of volger",
	"userList": "Lijsten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lister"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Listy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"mutualFollow": "Seguidor mútuo",
	"followingOrFollower": "Seguidor ou usuário seguido",
	"userList": "Listas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"mutualFollow": "Взаимные подписки",
	"followingOrFollower": "Подписки или подписчики",
	"userList": "Списки"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Zoznamy"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"mutualFollow": "ติดตามซึ่งกันและกัน",
	"followingOrFollower": "กำลังติดตามหรือผู้ติดตาม",
	"userList": "ลิสต์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"mutualFollow": "Karşılıklı takip",
	"followingOrFollower": "Takip eden veya takipçi",
	"userList": "Listeler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"mutualFollow": "Mutual follow",
	"followingOrFollower": "Following or follower",
	"userList": "Lists"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"mutualFollow": "Взаємна підписка",
	"followingOrFollower": "Підписки або підписники",
	"userList": "Списки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"mutualFollow": "Theo dõi lẫn nhau",
	"followingOrFollower": "Đang theo dõi hoặc người theo dõi",
	"userList": "Danh sách"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"mutualFollow": "互相关注",
	"followingOrFollower": "关注中或关注者",
	"userList": "列表"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"mutualFollow": "互相追隨",
	"followingOrFollower": "追隨中或追隨者",
	"userList": "使用者清單"
}
</locale>
