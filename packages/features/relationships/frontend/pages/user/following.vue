<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 1000px;">
		<Transition name="fade" mode="out-in">
			<div v-if="user">
				<XFollowList :user="user" type="following"/>
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
		subtitle: $locale.value.sfc.following,
		userName: user.value,
		avatar: user.value,
	} : {},
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"user": "المستخدمون",
	"following": "المتابَعون"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"user": "Usuaris",
	"following": "Segueixes "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"user": "Uživatelé",
	"following": "Sledovaní"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"user": "User",
	"following": "Following"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"user": "Benutzer",
	"following": "Folgt"
}
</locale>

<locale locale="en-US" lang="json">
{
	"user": "User",
	"following": "Following"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"user": "Usuarios",
	"following": "Siguiendo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"user": "Utilisateur·rice·s",
	"following": "Abonnements"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"user": "Pengguna",
	"following": "Ikuti"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"user": "Profilo",
	"following": "Following"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"user": "ユーザー",
	"following": "フォロー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"user": "ユーザー",
	"following": "フォロー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"user": "User",
	"following": "Ig ṭṭafaṛ"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"user": "ಬಳಕೆದಾರ",
	"following": "Following"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"user": "유저",
	"following": "팔로잉"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"user": "Gebruikers",
	"following": "Volgend"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"user": "Brukere",
	"following": "Følger"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"user": "Użytkownicy",
	"following": "Obserwowani"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"user": "Usuário",
	"following": "Seguindo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"user": "Пользователи",
	"following": "Подписки"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"user": "Používatelia",
	"following": "Sledujete"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"user": "ผู้ใช้",
	"following": "กำลังติดตาม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"user": "Kullanıcı",
	"following": "Takip"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"user": "User",
	"following": "Following"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"user": "Користувачі",
	"following": "Підписки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"user": "Người dùng",
	"following": "Đang theo dõi"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"user": "用户",
	"following": "关注中"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"user": "使用者",
	"following": "追隨中"
}
</locale>
