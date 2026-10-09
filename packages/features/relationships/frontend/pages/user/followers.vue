<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 1000px;">
		<Transition name="fade" mode="out-in">
			<div v-if="user">
				<XFollowList :user="user" type="followers"/>
			</div>
			<MkError v-else-if="error" @retry="fetchUser()"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XFollowList from '@features/relationships/frontend/pages/user/follow-list.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';

const props = withDefaults(defineProps<{
	acct: string;
}>(), {
});

const user = ref<null | Misskey.entities.UserDetailed>(null);
const error = ref<any>(null);

function fetchUser(): void {
	if (props.acct == null) return;
	user.value = null;
	misskeyApi('users/show', Misskey.acct.parse(props.acct)).then(u => {
		user.value = u;
	}).catch(err => {
		error.value = err;
	});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.user,
	icon: 'ti ti-user',
	...user.value ? {
		title: user.value.name ? `${user.value.name} (@${user.value.username})` : `@${user.value.username}`,
		subtitle: $locale.value.sfc.followers,
		userName: user.value,
		avatar: user.value,
	} : {},
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"user": "المستخدمون",
	"followers": "المتابِعون"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"user": "Usuaris",
	"followers": "Seguidors"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"user": "Uživatelé",
	"followers": "Sledující"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"user": "User",
	"followers": "Followers"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"user": "Benutzer",
	"followers": "Gefolgt von"
}
</locale>

<locale locale="en-US" lang="json">
{
	"user": "User",
	"followers": "Followers"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"user": "Usuarios",
	"followers": "Seguidores"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"user": "Utilisateur·rice·s",
	"followers": "Abonné·e·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"user": "Pengguna",
	"followers": "Pengikut"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"user": "Profilo",
	"followers": "Follower"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"user": "ユーザー",
	"followers": "フォロワー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"user": "ユーザー",
	"followers": "フォロワー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"user": "User",
	"followers": "Imeḍfaṛen"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"user": "ಬಳಕೆದಾರ",
	"followers": "Followers"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"user": "유저",
	"followers": "팔로워"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"user": "Gebruikers",
	"followers": "Volgers"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"user": "Brukere",
	"followers": "Følgere"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"user": "Użytkownicy",
	"followers": "Obserwujący"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"user": "Usuário",
	"followers": "Seguidores"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"user": "Пользователи",
	"followers": "Подписчики"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"user": "Používatelia",
	"followers": "Sledujúci"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"user": "ผู้ใช้",
	"followers": "ผู้ติดตาม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"user": "Kullanıcı",
	"followers": "Takipçi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"user": "User",
	"followers": "Followers"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"user": "Користувачі",
	"followers": "Підписники"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"user": "Người dùng",
	"followers": "Người theo dõi"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"user": "用户",
	"followers": "关注者"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"user": "使用者",
	"followers": "追隨者"
}
</locale>
