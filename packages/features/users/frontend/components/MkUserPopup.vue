<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_popup_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_popup_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_popup_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_popup_leaveTo : ''"
	appear @afterLeave="emit('closed')"
>
	<div v-if="showing" :class="$style.root" class="_popup _shadow" :style="{ zIndex, top: top + 'px', left: left + 'px' }" @mouseover="() => { emit('mouseover'); }" @mouseleave="() => { emit('mouseleave'); }">
		<MkError v-if="error" @retry="fetchUser()"/>
		<div v-else-if="user != null">
			<div :class="$style.banner" :style="user.bannerUrl ? { backgroundImage: `url(${prefer.s.disableShowingAnimatedImages ? getStaticImageUrl(user.bannerUrl) : user.bannerUrl})` } : ''">
				<span v-if="$i && $i.id != user.id && user.isFollowed" :class="$style.followed">{{ $locale.sfc.followsYou }}</span>
			</div>
			<svg viewBox="0 0 128 128" :class="$style.avatarBack">
				<g transform="matrix(1.6,0,0,1.6,-38.4,-51.2)">
					<path d="M64,32C81.661,32 96,46.339 96,64C95.891,72.184 104,72 104,72C104,72 74.096,80 64,80C52.755,80 24,72 24,72C24,72 31.854,72.018 32,64C32,46.339 46.339,32 64,32Z" style="fill: var(--MI_THEME-popup);"/>
				</g>
			</svg>
			<MkA :to="userPage(user)">
				<MkAvatar :class="$style.avatar" :user="user" indicator/>
			</MkA>
			<div :class="$style.title">
				<MkA :class="$style.name" :to="userPage(user)"><MkUserName :user="user" :nowrap="false"/></MkA>
				<div :class="$style.username"><MkAcct :user="user"/></div>
			</div>
			<div :class="$style.description">
				<Mfm v-if="user.description" :class="$style.mfm" :text="user.description" :author="user"/>
				<div v-else style="opacity: 0.7;">{{ $locale.sfc.noAccountDescription }}</div>
			</div>
			<div :class="$style.status">
				<MkA :class="$style.statusItem" :to="userPage(user, 'notes')">
					<div :class="$style.statusItemLabel">{{ $locale.sfc.notes }}</div>
					<div>{{ number(user.notesCount) }}</div>
				</MkA>
				<MkA v-if="isFollowingVisibleForMe(user)" :class="$style.statusItem" :to="userPage(user, 'following')">
					<div :class="$style.statusItemLabel">{{ $locale.sfc.following }}</div>
					<div>{{ number(user.followingCount) }}</div>
				</MkA>
				<MkA v-if="isFollowersVisibleForMe(user)" :class="$style.statusItem" :to="userPage(user, 'followers')">
					<div :class="$style.statusItemLabel">{{ $locale.sfc.followers }}</div>
					<div>{{ number(user.followersCount) }}</div>
				</MkA>
			</div>
			<button class="_button" :class="$style.menu" @click="showMenu"><i class="ti ti-dots"></i></button>
			<MkFollowButton v-if="$i && user.id != $i.id" v-model:user="user" :class="$style.follow" mini/>
		</div>
		<div v-else>
			<MkLoading/>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkFollowButton from '@features/relationships/frontend/components/MkFollowButton.vue';
import { userPage } from '@features/users/frontend/filters/user.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { getUserMenu } from '@features/users/frontend/utility/get-user-menu.js';
import number from '@features/ui/frontend/filters/number.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';
import { isFollowingVisibleForMe, isFollowersVisibleForMe } from '@/utility/isFfVisibleForMe.js';
import { getStaticImageUrl } from '@/utility/media-proxy.js';

const props = defineProps<{
	showing: boolean;
	q: string | Misskey.entities.UserDetailed;
	source: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'mouseover'): void;
	(ev: 'mouseleave'): void;
}>();

const zIndex = os.claimZIndex('middle');
const user = ref<Misskey.entities.UserDetailed | null>(null);
const top = ref(0);
const left = ref(0);
const error = ref(false);

function showMenu(ev: PointerEvent) {
	if (user.value == null) return;
	const { menu, cleanup } = getUserMenu(user.value);
	os.popupMenu(menu, ev.currentTarget ?? ev.target).finally(cleanup);
}

async function fetchUser() {
	if (typeof props.q === 'object') {
		user.value = props.q;
		error.value = false;
	} else {
		const query: Misskey.entities.UsersShowRequest = props.q.startsWith('@') ?
			Misskey.acct.parse(props.q.substring(1)) :
			{ userId: props.q };

		// @ts-expect-error payloadの引数側の型が正常に解決されない
		misskeyApi('users/show', query).then(res => {
			if (!props.showing) return;
			user.value = res;
			error.value = false;
		}, () => {
			error.value = true;
		});
	}
}

onMounted(() => {
	fetchUser();

	const rect = props.source.getBoundingClientRect();
	const x = ((rect.left + (props.source.offsetWidth / 2)) - (300 / 2)) + window.scrollX;
	const y = rect.top + props.source.offsetHeight + window.scrollY;

	top.value = y;
	left.value = x;
});
</script>

<style lang="scss" module>
.transition_popup_enterActive,
.transition_popup_leaveActive {
	transition: opacity 0.15s, transform 0.15s !important;
}
.transition_popup_enterFrom,
.transition_popup_leaveTo {
	opacity: 0;
	transform: scale(0.9);
}

.root {
	position: absolute;
	width: 300px;
	overflow: clip;
	transform-origin: center top;
}

.banner {
	height: 78px;
	background-color: rgba(0, 0, 0, 0.1);
	background-size: cover;
	background-position: center;
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

.avatarBack {
	width: 100px;
	position: absolute;
	top: 28px;
	left: 0;
	right: 0;
	margin: 0 auto;
}

.avatar {
	display: block;
	position: absolute;
	top: 38px;
	left: 0;
	right: 0;
	margin: 0 auto;
	z-index: 2;
	width: 58px;
	height: 58px;
}

.title {
	position: relative;
	z-index: 3;
	display: block;
	padding: 8px 26px 16px 26px;
	margin-top: 16px;
	text-align: center;
}

.name {
	display: inline-block;
	font-weight: bold;
	word-break: break-all;
}

.username {
	display: block;
	font-size: 0.8em;
	opacity: 0.7;
}

.description {
	padding: 16px 26px;
	font-size: 0.8em;
	text-align: center;
	border-top: solid 1px var(--MI_THEME-divider);
	border-bottom: solid 1px var(--MI_THEME-divider);
}

.mfm {
	display: -webkit-box;
	-webkit-line-clamp: 5;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.status {
	padding: 16px 26px 16px 26px;
}

.statusItem {
	display: inline-block;
	width: 33%;
	text-align: center;
}

.statusItemLabel {
	font-size: 0.7em;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}

.menu {
	position: absolute;
	top: 8px;
	right: 44px;
	padding: 6px;
	background: var(--MI_THEME-panel);
	border-radius: 999px;
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
