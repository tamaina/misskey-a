<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_panel" :class="$style.root">
	<div :class="$style.banner" :style="user.bannerUrl ? { backgroundImage: `url(${prefer.s.disableShowingAnimatedImages ? getStaticImageUrl(user.bannerUrl) : user.bannerUrl})` } : ''"></div>
	<MkA :to="userPage(user)">
		<MkAvatar :class="$style.avatar" :user="user" indicator/>
	</MkA>
	<div :class="$style.title">
		<MkA :class="$style.name" :to="userPage(user)"><MkUserName :user="user" :nowrap="false"/></MkA>
		<p :class="$style.username"><MkAcct :user="user"/></p>
	</div>
	<span v-if="$i && $i.id !== user.id && user.isFollowed" :class="$style.followed">{{ $locale.sfc.followsYou }}</span>
	<div :class="$style.description">
		<div v-if="user.description" :class="$style.mfm">
			<Mfm :text="user.description" :author="user"/>
		</div>
		<span v-else style="opacity: 0.7;">{{ $locale.sfc.noAccountDescription }}</span>
	</div>
	<div :class="$style.status">
		<MkA :class="$style.statusItem" :to="userPage(user, 'notes')">
			<p :class="$style.statusItemLabel">{{ $locale.sfc.notes }}</p><span :class="$style.statusItemValue">{{ number(user.notesCount) }}</span>
		</MkA>
		<MkA v-if="isFollowingVisibleForMe(user)" :class="$style.statusItem" :to="userPage(user, 'following')">
			<p :class="$style.statusItemLabel">{{ $locale.sfc.following }}</p><span :class="$style.statusItemValue">{{ number(user.followingCount) }}</span>
		</MkA>
		<MkA v-if="isFollowersVisibleForMe(user)" :class="$style.statusItem" :to="userPage(user, 'followers')">
			<p :class="$style.statusItemLabel">{{ $locale.sfc.followers }}</p><span :class="$style.statusItemValue">{{ number(user.followersCount) }}</span>
		</MkA>
	</div>
	<MkFollowButton v-if="user.id != $i?.id" :class="$style.follow" :user="user" mini/>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import MkFollowButton from '@features/relationships/frontend/components/MkFollowButton.vue';
import number from '@features/ui/frontend/filters/number.js';
import { userPage } from '@features/users/frontend/filters/user.js';
import { $i } from '@features/auth/frontend/i.js';
import { isFollowingVisibleForMe, isFollowersVisibleForMe } from '@features/relationships/frontend/utility/isFfVisibleForMe.js';
import { getStaticImageUrl } from '@features/drive/frontend/utility/media-proxy.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

defineProps<{
	user: Misskey.entities.UserDetailed;
}>();
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.banner {
	height: 84px;
	background-color: rgba(0, 0, 0, 0.1);
	background-size: cover;
	background-position: center;
}

.avatar {
	display: block;
	position: absolute;
	top: 62px;
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

.followed {
	position: absolute;
	top: 12px;
	left: 12px;
	padding: 4px 8px;
	color: #fff;
	background: rgba(0, 0, 0, 0.7);
	font-size: 0.7em;
	border-radius: 6px;
}

.description {
	padding: 16px;
	font-size: 0.8em;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.mfm {
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.status {
	padding: 10px 16px;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.statusItem {
	display: inline-block;
	width: 33%;
}

.statusItemLabel {
	margin: 0;
	font-size: 0.7em;
	color: var(--MI_THEME-fg);
}

.statusItemValue {
	font-size: 1em;
	color: var(--MI_THEME-accent);
}

.follow {
	position: absolute !important;
	top: 8px;
	right: 8px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "followsYou": "يتابعك",
  "noAccountDescription": "لم يكتب هذا المستخدم سيرته بعد.",
  "notes": "الملاحظات",
  "following": "المتابَعون",
  "followers": "المتابِعون"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "followsYou": "Et segueix",
  "noAccountDescription": "Aquest usuari encara no ha escrit la seva biografia.",
  "notes": "Notes",
  "following": "Segueixes ",
  "followers": "Seguidors"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "followsYou": "Sledují vás",
  "noAccountDescription": "Tento uživatel zatím nenapsal svou biografii.",
  "notes": "Poznámky",
  "following": "Sledovaní",
  "followers": "Sledující"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "followsYou": "Follows you",
  "noAccountDescription": "This user has not written their bio yet.",
  "notes": "Notes",
  "following": "Following",
  "followers": "Followers"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "followsYou": "Folgt dir",
  "noAccountDescription": "Dieser Nutzer hat seine Profilbeschreibung noch nicht ausgefüllt",
  "notes": "Notizen",
  "following": "Folgt",
  "followers": "Gefolgt von"
}
</locale>

<locale locale="en-US" lang="json">
{
  "followsYou": "Follows you",
  "noAccountDescription": "This user has not written their bio yet.",
  "notes": "Notes",
  "following": "Following",
  "followers": "Followers"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "followsYou": "Te sigue",
  "noAccountDescription": "Este usuario no ha escrito su biografía aún",
  "notes": "Notas",
  "following": "Siguiendo",
  "followers": "Seguidores"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "followsYou": "Vous suit",
  "noAccountDescription": "L’utilisateur·rice n’a pas encore renseigné de biographie de présentation sur son profil.",
  "notes": "Notes",
  "following": "Abonnements",
  "followers": "Abonné·e·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "followsYou": "Mengikuti kamu",
  "noAccountDescription": "Belum ada bio",
  "notes": "Catatan",
  "following": "Ikuti",
  "followers": "Pengikut"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "followsYou": "Follower",
  "noAccountDescription": "La persona non ha ancora scritto alcuna autobiografia.",
  "notes": "Note",
  "following": "Following",
  "followers": "Follower"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "followsYou": "フォローされています",
  "noAccountDescription": "自己紹介はありません",
  "notes": "ノート",
  "following": "フォロー",
  "followers": "フォロワー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "followsYou": "フォローされとるで",
  "noAccountDescription": "自己紹介食ってもた",
  "notes": "ノート",
  "following": "フォロー",
  "followers": "フォロワー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "followsYou": "Yeṭṭafaṛ-ik·em-id",
  "noAccountDescription": "This user has not written their bio yet.",
  "notes": "Notes",
  "following": "Ig ṭṭafaṛ",
  "followers": "Imeḍfaṛen"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "followsYou": "Follows you",
  "noAccountDescription": "ಇವರು ಸ್ವಯಂ ಪರಿಚಯ ರಚಿಸಿಲ್ಲ",
  "notes": "Notes",
  "following": "Following",
  "followers": "Followers"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "followsYou": "나를 팔로우 합니다",
  "noAccountDescription": "자기소개가 없습니다",
  "notes": "노트",
  "following": "팔로잉",
  "followers": "팔로워"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "followsYou": "Volgt jou",
  "noAccountDescription": "Deze gebruiker heeft nog geen bio geschreven",
  "notes": "Notities",
  "following": "Volgend",
  "followers": "Volgers"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "followsYou": "Følger deg",
  "noAccountDescription": "Denne brukeren har ikke skrevet sin biografi ennå.",
  "notes": "Notes",
  "following": "Følger",
  "followers": "Følgere"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "followsYou": "Obserwuje Cię",
  "noAccountDescription": "Ten użytkownik nie napisał jeszcze swojej biografii.",
  "notes": "Wpisy",
  "following": "Obserwowani",
  "followers": "Obserwujący"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "followsYou": "Te seguem",
  "noAccountDescription": "Este usuário não tem uma descrição.",
  "notes": "Posts",
  "following": "Seguindo",
  "followers": "Seguidores"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "followsYou": "Читает вас",
  "noAccountDescription": "Пользователь ничего не написал про себя",
  "notes": "Заметки",
  "following": "Подписки",
  "followers": "Подписчики"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "followsYou": "Sledujú vás",
  "noAccountDescription": "Tento používateľ zatiaľ nenapísal o sebe.",
  "notes": "Poznámky",
  "following": "Sledujete",
  "followers": "Sledujúci"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "followsYou": "ติดตามคุณ",
  "noAccountDescription": "ผู้ใช้รายนี้ยังไม่ได้เขียนคำแนะนำตัว",
  "notes": " โน้ต",
  "following": "กำลังติดตาม",
  "followers": "ผู้ติดตาม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "followsYou": "Sizi takip ediyor",
  "noAccountDescription": "Bu kullanıcı henüz biyografisini yazmamış.",
  "notes": "Notlar",
  "following": "Takip",
  "followers": "Takipçi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "followsYou": "Follows you",
  "noAccountDescription": "This user has not written their bio yet.",
  "notes": "Notes",
  "following": "Following",
  "followers": "Followers"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "followsYou": "Підписаний(-а) на вас",
  "noAccountDescription": "Цей користувач ще нічого не написав про себе",
  "notes": "Записи",
  "following": "Підписки",
  "followers": "Підписники"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "followsYou": "Theo dõi bạn",
  "noAccountDescription": "Người này chưa viết mô tả.",
  "notes": "Bài Viết",
  "following": "Đang theo dõi",
  "followers": "Người theo dõi"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "followsYou": "正在关注你",
  "noAccountDescription": "此用户尚无自我介绍",
  "notes": "帖子",
  "following": "关注中",
  "followers": "关注者"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "followsYou": "追隨你的人",
  "noAccountDescription": "此使用者尚未自我介紹",
  "notes": "貼文",
  "following": "追隨中",
  "followers": "追隨者"
}
</locale>
