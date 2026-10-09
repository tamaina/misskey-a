<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type }" :zPriority="'high'" :anchorElement="anchorElement" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<div class="_popup" :class="{ [$style.root]: true, [$style.asDrawer]: type === 'drawer' }">
		<div :class="[$style.label, $style.item]">
			{{ $locale.sfc.visibility }}
		</div>
		<button key="public" :disabled="isSilenced || isReplyVisibilitySpecified" class="_button" :class="[$style.item, { [$style.active]: v === 'public' }]" data-index="1" @click="choose('public')">
			<div :class="$style.icon"><i class="ti ti-world"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ $locale.sfc.public }}</span>
				<span :class="$style.itemDescription">{{ $locale.sfc.publicDescription }}</span>
			</div>
		</button>
		<button key="home" :disabled="isReplyVisibilitySpecified" class="_button" :class="[$style.item, { [$style.active]: v === 'home' }]" data-index="2" @click="choose('home')">
			<div :class="$style.icon"><i class="ti ti-home"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ $locale.sfc.home }}</span>
				<span :class="$style.itemDescription">{{ $locale.sfc.homeDescription }}</span>
			</div>
		</button>
		<button key="followers" :disabled="isReplyVisibilitySpecified" class="_button" :class="[$style.item, { [$style.active]: v === 'followers' }]" data-index="3" @click="choose('followers')">
			<div :class="$style.icon"><i class="ti ti-lock"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ $locale.sfc.followers }}</span>
				<span :class="$style.itemDescription">{{ $locale.sfc.followersDescription }}</span>
			</div>
		</button>
		<button key="specified" class="_button" :class="[$style.item, { [$style.active]: v === 'specified' }]" data-index="4" @click="choose('specified')">
			<div :class="$style.icon"><i class="ti ti-mail"></i></div>
			<div :class="$style.body">
				<span :class="$style.itemTitle">{{ $locale.sfc.specified }}</span>
				<span :class="$style.itemDescription">{{ $locale.sfc.specifiedDescription }}</span>
			</div>
		</button>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { nextTick, useTemplateRef, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkModal from '@features/ui/frontend/components/MkModal.vue';

const modal = useTemplateRef('modal');

const props = withDefaults(defineProps<{
	currentVisibility: typeof Misskey.noteVisibilities[number];
	isSilenced: boolean;
	anchorElement?: HTMLElement | null;
	isReplyVisibilitySpecified?: boolean;
}>(), {
});

const emit = defineEmits<{
	(ev: 'changeVisibility', v: typeof Misskey.noteVisibilities[number]): void;
	(ev: 'closed'): void;
}>();

const v = ref(props.currentVisibility);

function choose(visibility: typeof Misskey.noteVisibilities[number]): void {
	v.value = visibility;
	emit('changeVisibility', visibility);
	nextTick(() => {
		if (modal.value) modal.value.close();
	});
}
</script>

<style lang="scss" module>
.root {
	min-width: 240px;
	padding: 8px 0;

	&.asDrawer {
		padding: 12px 0 max(env(safe-area-inset-bottom, 0px), 12px) 0;
		width: 100%;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		.label {
			pointer-events: none;
			font-size: 12px;
			padding-bottom: 4px;
			opacity: 0.7;
		}

		.item {
			font-size: 14px;
			padding: 10px 24px;
		}
	}
}

.label {
	pointer-events: none;
	font-size: 10px;
	padding-bottom: 4px;
	opacity: 0.7;
}

.item {
	display: flex;
	padding: 8px 14px;
	font-size: 12px;
	text-align: left;
	width: 100%;
	box-sizing: border-box;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	&:active {
		background: rgba(0, 0, 0, 0.1);
	}

	&.active {
		color: var(--MI_THEME-accent);
	}
}

.icon {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-right: 10px;
	width: 16px;
	top: 0;
	bottom: 0;
	margin-top: auto;
	margin-bottom: auto;
}

.body {
	flex: 1 1 auto;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.itemTitle {
	display: block;
	font-weight: bold;
}

.itemDescription {
	opacity: 0.6;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "visibility": "الظهور",
  "public": "علني",
  "publicDescription": "ستكون ملاحظتك مرئية لكل المستخدمين",
  "home": "الرئيسي",
  "homeDescription": "انشر في الخيط الزمني الرئيسي فقط",
  "followers": "المتابِعون",
  "followersDescription": "اجعلها مرئية لمتابِعيك فقط",
  "specified": "مباشرة",
  "specifiedDescription": "اجعلها مرئية لمستخدمين محددين"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "visibility": "Visibilitat",
  "public": "Públic ",
  "publicDescription": "La teva nota la podrà veure tothom ",
  "home": "Inici",
  "homeDescription": "Publicar només a la línia de temps d'Inici ",
  "followers": "Seguidors",
  "followersDescription": "Fes només visible per als teus seguidors",
  "specified": "Directe",
  "specifiedDescription": "Fer visible només per alguns usuaris"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "visibility": "Viditelnost",
  "public": "Veřejný",
  "publicDescription": "Vaše poznámka bude viditelná pro všechny uživatele",
  "home": "Domů",
  "homeDescription": "Zveřejnit příspěvek pouze na domovskou časovou osu",
  "followers": "Sledující",
  "followersDescription": "Zviditelnit pouze pro své sledující",
  "specified": "Přímý",
  "specifiedDescription": "Zviditelnit pouze pro určité uživatele"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "visibility": "Visibility",
  "public": "Public",
  "publicDescription": "Your note will be visible for all users",
  "home": "Home",
  "homeDescription": "Post to home timeline only",
  "followers": "Followers",
  "followersDescription": "Make visible to your followers only",
  "specified": "Direct",
  "specifiedDescription": "Make visible for specified users only"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "visibility": "Sichtbarkeit",
  "public": "Öffentlich",
  "publicDescription": "Deine Notiz wird global für alle Benutzer sichtbar sein",
  "home": "Startseite",
  "homeDescription": "Notiz nur in die Startseiten-Chronik schicken",
  "followers": "Follower",
  "followersDescription": "Nur für Follower sichtbar",
  "specified": "Direkt",
  "specifiedDescription": "Nur für bestimmte Benutzer sichtbar"
}
</locale>

<locale locale="en-US" lang="json">
{
  "visibility": "Visibility",
  "public": "Public",
  "publicDescription": "Your note will be visible for all users",
  "home": "Home",
  "homeDescription": "Post to home timeline only",
  "followers": "Followers",
  "followersDescription": "Make visible to your followers only",
  "specified": "Direct",
  "specifiedDescription": "Make visible for specified users only"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "visibility": "Visibilidad",
  "public": "Público",
  "publicDescription": "Visible para todos los usuarios",
  "home": "Inicio",
  "homeDescription": "Visible sólo en la linea de tiempo de inicio",
  "followers": "Seguidores",
  "followersDescription": "Visible sólo para tus seguidores",
  "specified": "Nota directa",
  "specifiedDescription": "Visible sólo para los usuarios elegidos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "visibility": "Visibilité",
  "public": "Public",
  "publicDescription": "Publier à tou·te·s les utilisateur·rice·s",
  "home": "Principal",
  "homeDescription": "Publier sur le fil principal uniquement",
  "followers": "Abonné·e·s",
  "followersDescription": "Publier à vos abonné·e·s uniquement",
  "specified": "Direct",
  "specifiedDescription": "Publier uniquement aux utilisateur·rice·s mentionné·e·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "visibility": "Visibilitas",
  "public": "Publik",
  "publicDescription": "Catat ke lini masa global",
  "home": "Beranda",
  "homeDescription": "Catat ke lini masa beranda saja",
  "followers": "Pengikut",
  "followersDescription": "Catat ke pengikut saja",
  "specified": "Langsung",
  "specifiedDescription": "Catat ke pengguna yang ditentukan saja"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "visibility": "Visibilità",
  "public": "Pubblica",
  "publicDescription": "Visibilità pubblica",
  "home": "Home",
  "homeDescription": "Visibile solo nella Home",
  "followers": "Follower",
  "followersDescription": "Visibile solo ai tuoi follower",
  "specified": "Nota diretta",
  "specifiedDescription": "Visibile solo ai profili menzionati"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "visibility": "公開範囲",
  "public": "パブリック",
  "publicDescription": "全てのユーザーに公開",
  "home": "ホーム",
  "homeDescription": "ホームタイムラインのみに公開",
  "followers": "フォロワー",
  "followersDescription": "自分のフォロワーのみに公開",
  "specified": "指名",
  "specifiedDescription": "指定したユーザーのみに公開"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "visibility": "公開範囲",
  "public": "パブリック",
  "publicDescription": "みんなに公開",
  "home": "ホーム",
  "homeDescription": "ホームタイムラインのみに公開するで",
  "followers": "フォロワー",
  "followersDescription": "自分のフォロワーのみに公開するで",
  "specified": "ダイレクト",
  "specifiedDescription": "選んだユーザーのみに公開するで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "visibility": "Visibility",
  "public": "Public",
  "publicDescription": "Your note will be visible for all users",
  "home": "Home",
  "homeDescription": "Post to home timeline only",
  "followers": "Imeḍfaṛen",
  "followersDescription": "Make visible to your followers only",
  "specified": "Direct",
  "specifiedDescription": "Make visible for specified users only"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "visibility": "Visibility",
  "public": "Public",
  "publicDescription": "Your note will be visible for all users",
  "home": "Home",
  "homeDescription": "Post to home timeline only",
  "followers": "Followers",
  "followersDescription": "Make visible to your followers only",
  "specified": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
  "specifiedDescription": "Make visible for specified users only"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "visibility": "공개 범위",
  "public": "공개",
  "publicDescription": "모든 유저에게 공개",
  "home": "홈",
  "homeDescription": "홈 타임라인에만 공개",
  "followers": "팔로워",
  "followersDescription": "팔로워에게만 공개",
  "specified": "다이렉트",
  "specifiedDescription": "지정한 유저에게만 공개"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "visibility": "Zichtbaarheid",
  "public": "Public",
  "publicDescription": "Your note will be visible for all users",
  "home": "Startpagina",
  "homeDescription": "Post to home timeline only",
  "followers": "Volgers",
  "followersDescription": "Make visible to your followers only",
  "specified": "Directe notities",
  "specifiedDescription": "Make visible for specified users only"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "visibility": "Visibility",
  "public": "Public",
  "publicDescription": "Your note will be visible for all users",
  "home": "Hjem",
  "homeDescription": "Post to home timeline only",
  "followers": "Følgere",
  "followersDescription": "Make visible to your followers only",
  "specified": "Direct",
  "specifiedDescription": "Make visible for specified users only"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "visibility": "Widoczność",
  "public": "Publiczny",
  "publicDescription": "Twój wpis pojawi się w publicznych osiach czasu",
  "home": "Strona główna",
  "homeDescription": "Publikuj tylko na głównej osi czasu",
  "followers": "Obserwujący",
  "followersDescription": "Widoczne tylko dla obserwujących",
  "specified": "Bezpośredni",
  "specifiedDescription": "Napisz tylko określonym użytkownikom"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "visibility": "Visibilidade",
  "public": "Público",
  "publicDescription": "Sua nota será visível para todos os usuários",
  "home": "Início",
  "homeDescription": "Publicar apenas na linha do tempo Início",
  "followers": "Seguidores",
  "followersDescription": "Tornar visível apenas para os meus seguidores",
  "specified": "Mensagem Direta",
  "specifiedDescription": "Tornar visível apenas para usuários específicos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "visibility": "Видимость",
  "public": "Общедоступно",
  "publicDescription": "Открыто для всех",
  "home": "Домашняя",
  "homeDescription": "Не для общих лент",
  "followers": "Для подписчиков",
  "followersDescription": "Только вашим подписчикам",
  "specified": "Личное",
  "specifiedDescription": "Тем, кого укажете"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "visibility": "Viditeľnosť",
  "public": "Verejné",
  "publicDescription": "Vaša poznámku bude viditeľná všetkým používateľom",
  "home": "Domov",
  "homeDescription": "Pridať iba na domácu časovú os",
  "followers": "Sledujúci",
  "followersDescription": "Viditeľné iba tým, ktorí vás sledujú",
  "specified": "Priame",
  "specifiedDescription": "Viditeľné iba pre konkrétnych používateľov"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "visibility": "การมองเห็น",
  "public": "สาธารณะ",
  "publicDescription": "โน้ตของคุณจะปรากฏแก่ผู้ใช้ทุกคน",
  "home": "หน้าหลัก",
  "homeDescription": "โพสต์ลงไทม์ไลน์หลักเท่านั้น",
  "followers": "ผู้ติดตาม",
  "followersDescription": "เฉพาะผู้ติดตามเท่านั้นที่มองเห็นได้",
  "specified": "ไดเร็ค",
  "specifiedDescription": "ทำให้มองเห็นได้เฉพาะผู้ใช้ที่ระบุเท่านั้น"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "visibility": "Görünürlük",
  "public": "Halka açık",
  "publicDescription": "Notunuz tüm kullanıcılar tarafından görülebilir olacaktır.",
  "home": "Pano",
  "homeDescription": "Yalnızca ana panoya gönder",
  "followers": "Takipçiler",
  "followersDescription": "Sadece takipçilerine görünür hale getir",
  "specified": "Doğrudan",
  "specifiedDescription": "Yalnızca belirli kullanıcılar için görünür hale getir"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "visibility": "Visibility",
  "public": "Public",
  "publicDescription": "Your note will be visible for all users",
  "home": "Home",
  "homeDescription": "Post to home timeline only",
  "followers": "Followers",
  "followersDescription": "Make visible to your followers only",
  "specified": "Direct",
  "specifiedDescription": "Make visible for specified users only"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "visibility": "Видимість",
  "public": "Публічний",
  "publicDescription": "Для всіх користувачів",
  "home": "Домівка",
  "homeDescription": "Лише на домашній стрічці",
  "followers": "Підписники",
  "followersDescription": "Тільки для підписників",
  "specified": "Особисто",
  "specifiedDescription": "Лише для певних користувачів"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "visibility": "Hiển thị",
  "public": "Công khai",
  "publicDescription": "Mọi người đều có thể đọc tút của bạn",
  "home": "Trang chính",
  "homeDescription": "Chỉ đăng lên bảng tin nhà",
  "followers": "Người theo dõi",
  "followersDescription": "Dành riêng cho người theo dõi",
  "specified": "Nhắn riêng",
  "specifiedDescription": "Chỉ người được nhắc đến mới thấy"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "visibility": "可见性",
  "public": "公开",
  "publicDescription": "所有用户均可见",
  "home": "首页",
  "homeDescription": "仅发布至首页",
  "followers": "仅关注者",
  "followersDescription": "仅关注者可见",
  "specified": "指定用户",
  "specifiedDescription": "仅发送至指定用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "visibility": "可見性",
  "public": "公開",
  "publicDescription": "發佈給所有使用者",
  "home": "首頁",
  "homeDescription": "僅發布至首頁的時間軸",
  "followers": "追隨者",
  "followersDescription": "僅發布至關注者",
  "specified": "指定使用者",
  "specifiedDescription": "僅發布至指定使用者"
}
</locale>
