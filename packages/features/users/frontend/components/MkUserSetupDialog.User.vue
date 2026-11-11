<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-adaptive-bg class="_panel" style="position: relative;">
	<div :class="$style.banner" :style="user.bannerUrl ? { backgroundImage: `url(${user.bannerUrl})` } : ''"></div>
	<MkAvatar :class="$style.avatar" :user="user" indicator/>
	<div :class="$style.title">
		<div :class="$style.name"><MkUserName :user="user" :nowrap="false"/></div>
		<p :class="$style.username"><MkAcct :user="user"/></p>
	</div>
	<div :class="$style.description">
		<div v-if="user.description" :class="$style.mfm">
			<Mfm :text="user.description" :author="user"/>
		</div>
		<span v-else style="opacity: 0.7;">{{ $locale.sfc.noAccountDescription }}</span>
	</div>
	<div :class="$style.footer">
		<MkButton v-if="!isFollowing" primary gradate rounded full @click="follow"><i class="ti ti-plus"></i> {{ globalLocale.env.follow }}</MkButton>
		<div v-else style="opacity: 0.7; text-align: center;">{{ $locale.sfc.youFollowing }} <i class="ti ti-check"></i></div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import * as Misskey from 'misskey-js';
import { ref } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const isFollowing = ref(false);

async function follow() {
	isFollowing.value = true;
	misskeyApi('following/create', {
		userId: props.user.id,
	});
}
</script>

<style lang="scss" module>
.banner {
	height: 60px;
	background-color: rgba(0, 0, 0, 0.1);
	background-size: cover;
	background-position: center;
}

.avatar {
	display: block;
	position: absolute;
	top: 30px;
	left: 13px;
	z-index: 2;
	width: 58px;
	height: 58px;
	border: solid 4px var(--MI_THEME-panel);
}

.title {
	display: block;
	padding: 10px 0 10px 88px;
}

.name {
	display: inline-block;
	margin: 0;
	font-weight: bold;
	line-height: 16px;
	word-break: break-all;
}

.username {
	display: block;
	margin: 0;
	line-height: 16px;
	font-size: 0.8em;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.description {
	padding: 0 16px 16px 88px;
	font-size: 0.9em;
}

.mfm {
	display: -webkit-box;
	-webkit-line-clamp: 5;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.footer {
	border-top: solid 0.5px var(--MI_THEME-divider);
	padding: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "noAccountDescription": "لم يكتب هذا المستخدم سيرته بعد.",
  "youFollowing": "متابَع"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "noAccountDescription": "Aquest usuari encara no ha escrit la seva biografia.",
  "youFollowing": "Segueixes "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "noAccountDescription": "Tento uživatel zatím nenapsal svou biografii.",
  "youFollowing": "Sleduji"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "noAccountDescription": "This user has not written their bio yet.",
  "youFollowing": "Followed"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "noAccountDescription": "Dieser Nutzer hat seine Profilbeschreibung noch nicht ausgefüllt",
  "youFollowing": "Gefolgt"
}
</locale>

<locale locale="en-US" lang="json">
{
  "noAccountDescription": "This user has not written their bio yet.",
  "youFollowing": "Followed"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "noAccountDescription": "Este usuario no ha escrito su biografía aún",
  "youFollowing": "Siguiendo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "noAccountDescription": "L’utilisateur·rice n’a pas encore renseigné de biographie de présentation sur son profil.",
  "youFollowing": "Abonné·e"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "noAccountDescription": "Belum ada bio",
  "youFollowing": "Mengikuti"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "noAccountDescription": "La persona non ha ancora scritto alcuna autobiografia.",
  "youFollowing": "Following"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "noAccountDescription": "自己紹介はありません",
  "youFollowing": "フォロー中"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "noAccountDescription": "自己紹介食ってもた",
  "youFollowing": "フォロー中やで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "noAccountDescription": "This user has not written their bio yet.",
  "youFollowing": "Followed"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "noAccountDescription": "ಇವರು ಸ್ವಯಂ ಪರಿಚಯ ರಚಿಸಿಲ್ಲ",
  "youFollowing": "Followed"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "noAccountDescription": "자기소개가 없습니다",
  "youFollowing": "팔로잉"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "noAccountDescription": "Deze gebruiker heeft nog geen bio geschreven",
  "youFollowing": "Followed"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "noAccountDescription": "Denne brukeren har ikke skrevet sin biografi ennå.",
  "youFollowing": "Følger"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "noAccountDescription": "Ten użytkownik nie napisał jeszcze swojej biografii.",
  "youFollowing": "Śledzeni"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "noAccountDescription": "Este usuário não tem uma descrição.",
  "youFollowing": "Seguindo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "noAccountDescription": "Пользователь ничего не написал про себя",
  "youFollowing": "Вы подписаны"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "noAccountDescription": "Tento používateľ zatiaľ nenapísal o sebe.",
  "youFollowing": "Sledované"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "noAccountDescription": "ผู้ใช้รายนี้ยังไม่ได้เขียนคำแนะนำตัว",
  "youFollowing": "ติดตามแล้ว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "noAccountDescription": "Bu kullanıcı henüz biyografisini yazmamış.",
  "youFollowing": "Takip edildi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "noAccountDescription": "This user has not written their bio yet.",
  "youFollowing": "Followed"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "noAccountDescription": "Цей користувач ще нічого не написав про себе",
  "youFollowing": "Підписки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "noAccountDescription": "Người này chưa viết mô tả.",
  "youFollowing": "Đang theo dõi"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "noAccountDescription": "此用户尚无自我介绍",
  "youFollowing": "正在关注"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "noAccountDescription": "此使用者尚未自我介紹",
  "youFollowing": "追隨中"
}
</locale>
