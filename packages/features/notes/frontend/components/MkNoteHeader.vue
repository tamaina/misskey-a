<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<header :class="$style.root">
	<div v-if="mock" :class="$style.name">
		<MkUserName :user="note.user"/>
	</div>
	<MkA v-else v-user-preview="note.user.id" :class="$style.name" :to="userPage(note.user)">
		<MkUserName :user="note.user"/>
	</MkA>
	<div v-if="note.user.isBot" :class="$style.isBot">bot</div>
	<div :class="$style.username"><MkAcct :user="note.user"/></div>
	<div v-if="note.user.badgeRoles" :class="$style.badgeRoles">
		<img v-for="(role, i) in note.user.badgeRoles" :key="i" v-tooltip="role.name" :class="$style.badgeRole" :src="role.iconUrl!"/>
	</div>
	<div :class="$style.info">
		<div v-if="mock">
			<MkTime :time="note.createdAt" colored/>
		</div>
		<MkA v-else :to="notePage(note)">
			<MkTime :time="note.createdAt" colored/>
		</MkA>
		<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)[note.visibility]">
			<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
			<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
			<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
		</span>
		<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="copyLocaleDictionary($locale.sfc.visibilityLabels)['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		<span v-if="note.channel" style="margin-left: 0.5em;" :title="note.channel.name"><i class="ti ti-device-tv"></i></span>
	</div>
</header>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import * as Misskey from 'misskey-js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { notePage } from '@features/notes/frontend/filters/note.js';
import { userPage } from '@features/users/frontend/filters/user.js';
import { DI } from '@features/ui/frontend/di.js';

defineProps<{
	note: Misskey.entities.Note;
}>();

const mock = inject(DI.mock, false);
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: baseline;
	white-space: nowrap;
}

.name {
	flex-shrink: 1;
	display: block;
	margin: 0 .5em 0 0;
	padding: 0;
	overflow: hidden;
	font-size: 1em;
	font-weight: bold;
	text-decoration: none;
	text-overflow: ellipsis;

	&:hover {
		text-decoration: underline;
	}
}

.isBot {
	flex-shrink: 0;
	align-self: center;
	margin: 0 .5em 0 0;
	padding: 1px 6px;
	font-size: 80%;
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 3px;
}

.username {
	flex-shrink: 9999999;
	margin: 0 .5em 0 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.info {
	flex-shrink: 0;
	margin-left: auto;
	font-size: 0.9em;
}

.badgeRoles {
	margin: 0 .5em 0 0;
}

.badgeRole {
	height: 1.3em;
	vertical-align: -20%;

	& + .badgeRole {
		margin-left: 0.2em;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"visibilityLabels": {
		"public": "علني",
		"publicDescription": "ستكون ملاحظتك مرئية لكل المستخدمين",
		"home": "الرئيسي",
		"homeDescription": "انشر في الخيط الزمني الرئيسي فقط",
		"followers": "المتابِعون",
		"followersDescription": "اجعلها مرئية لمتابِعيك فقط",
		"specified": "مباشرة",
		"specifiedDescription": "اجعلها مرئية لمستخدمين محددين",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"visibilityLabels": {
		"public": "Públic ",
		"publicDescription": "La teva nota la podrà veure tothom ",
		"home": "Inici",
		"homeDescription": "Publicar només a la línia de temps d'Inici ",
		"followers": "Seguidors",
		"followersDescription": "Fes només visible per als teus seguidors",
		"specified": "Directe",
		"specifiedDescription": "Fer visible només per alguns usuaris",
		"disableFederation": "Sense federar",
		"disableFederationDescription": "No enviar a altres servidors"
	}
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"visibilityLabels": {
		"public": "Veřejný",
		"publicDescription": "Vaše poznámka bude viditelná pro všechny uživatele",
		"home": "Domů",
		"homeDescription": "Zveřejnit příspěvek pouze na domovskou časovou osu",
		"followers": "Sledující",
		"followersDescription": "Zviditelnit pouze pro své sledující",
		"specified": "Přímý",
		"specifiedDescription": "Zviditelnit pouze pro určité uživatele",
		"disableFederation": "Defederace",
		"disableFederationDescription": "Nepřenášet do jiných instancí"
	}
}
</locale>

<locale lang="json" locale="da-DK">
{
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="de-DE">
{
	"visibilityLabels": {
		"public": "Öffentlich",
		"publicDescription": "Deine Notiz wird global für alle Benutzer sichtbar sein",
		"home": "Startseite",
		"homeDescription": "Notiz nur in die Startseiten-Chronik schicken",
		"followers": "Follower",
		"followersDescription": "Nur für Follower sichtbar",
		"specified": "Direkt",
		"specifiedDescription": "Nur für bestimmte Benutzer sichtbar",
		"disableFederation": "Deföderieren",
		"disableFederationDescription": "Nicht an andere Instanzen übertragen"
	}
}
</locale>

<locale lang="json" locale="en-US">
{
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="es-ES">
{
	"visibilityLabels": {
		"public": "Público",
		"publicDescription": "Visible para todos los usuarios",
		"home": "Inicio",
		"homeDescription": "Visible sólo en la linea de tiempo de inicio",
		"followers": "Seguidores",
		"followersDescription": "Visible sólo para tus seguidores",
		"specified": "Nota directa",
		"specifiedDescription": "Visible sólo para los usuarios elegidos",
		"disableFederation": "No federado",
		"disableFederationDescription": "No enviar a otras instancias"
	}
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Publier à tou·te·s les utilisateur·rice·s",
		"home": "Principal",
		"homeDescription": "Publier sur le fil principal uniquement",
		"followers": "Abonné·e·s",
		"followersDescription": "Publier à vos abonné·e·s uniquement",
		"specified": "Direct",
		"specifiedDescription": "Publier uniquement aux utilisateur·rice·s mentionné·e·s",
		"disableFederation": "Défédérer",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="id-ID">
{
	"visibilityLabels": {
		"public": "Publik",
		"publicDescription": "Catat ke lini masa global",
		"home": "Beranda",
		"homeDescription": "Catat ke lini masa beranda saja",
		"followers": "Pengikut",
		"followersDescription": "Catat ke pengikut saja",
		"specified": "Langsung",
		"specifiedDescription": "Catat ke pengguna yang ditentukan saja",
		"disableFederation": "Matikan federasi",
		"disableFederationDescription": "Jangan kirimkan ke instansi lain"
	}
}
</locale>

<locale lang="json" locale="it-IT">
{
	"visibilityLabels": {
		"public": "Pubblica",
		"publicDescription": "Visibilità pubblica",
		"home": "Home",
		"homeDescription": "Visibile solo nella Home",
		"followers": "Follower",
		"followersDescription": "Visibile solo ai tuoi follower",
		"specified": "Nota diretta",
		"specifiedDescription": "Visibile solo ai profili menzionati",
		"disableFederation": "Gestisci la federazione",
		"disableFederationDescription": "Non spedire attività alle altre istanze remote"
	}
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"visibilityLabels": {
		"public": "パブリック",
		"publicDescription": "全てのユーザーに公開",
		"home": "ホーム",
		"homeDescription": "ホームタイムラインのみに公開",
		"followers": "フォロワー",
		"followersDescription": "自分のフォロワーのみに公開",
		"specified": "指名",
		"specifiedDescription": "指定したユーザーのみに公開",
		"disableFederation": "連合なし",
		"disableFederationDescription": "他サーバーへの配信を行いません"
	}
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"visibilityLabels": {
		"public": "パブリック",
		"publicDescription": "みんなに公開",
		"home": "ホーム",
		"homeDescription": "ホームタイムラインのみに公開するで",
		"followers": "フォロワー",
		"followersDescription": "自分のフォロワーのみに公開するで",
		"specified": "ダイレクト",
		"specifiedDescription": "選んだユーザーのみに公開するで",
		"disableFederation": "連合なし",
		"disableFederationDescription": "他サーバーへは送らんとくわ"
	}
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Imeḍfaṛen",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"visibilityLabels": {
		"public": "공개",
		"publicDescription": "모든 유저에게 공개",
		"home": "홈",
		"homeDescription": "홈 타임라인에만 공개",
		"followers": "팔로워",
		"followersDescription": "팔로워에게만 공개",
		"specified": "다이렉트",
		"specifiedDescription": "지정한 유저에게만 공개",
		"disableFederation": "연합에 보내지 않기",
		"disableFederationDescription": "다른 서버로 보내지 않습니다"
	}
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Startpagina",
		"homeDescription": "Post to home timeline only",
		"followers": "Volgers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Directe notities",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="no-NO">
{
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Hjem",
		"homeDescription": "Post to home timeline only",
		"followers": "Følgere",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"visibilityLabels": {
		"public": "Publiczny",
		"publicDescription": "Twój wpis pojawi się w publicznych osiach czasu",
		"home": "Strona główna",
		"homeDescription": "Publikuj tylko na głównej osi czasu",
		"followers": "Obserwujący",
		"followersDescription": "Widoczne tylko dla obserwujących",
		"specified": "Bezpośredni",
		"specifiedDescription": "Napisz tylko określonym użytkownikom",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Nie przesyłaj do innych instancji"
	}
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"visibilityLabels": {
		"public": "Público",
		"publicDescription": "Sua nota será visível para todos os usuários",
		"home": "Início",
		"homeDescription": "Publicar apenas na linha do tempo Início",
		"followers": "Seguidores",
		"followersDescription": "Tornar visível apenas para os meus seguidores",
		"specified": "Mensagem Direta",
		"specifiedDescription": "Tornar visível apenas para usuários específicos",
		"disableFederation": "Defederar",
		"disableFederationDescription": "Não transmitir às outras instâncias"
	}
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"visibilityLabels": {
		"public": "Общедоступно",
		"publicDescription": "Открыто для всех",
		"home": "Домашняя",
		"homeDescription": "Не для общих лент",
		"followers": "Для подписчиков",
		"followersDescription": "Только вашим подписчикам",
		"specified": "Личное",
		"specifiedDescription": "Тем, кого укажете",
		"disableFederation": "Отключить федерацию",
		"disableFederationDescription": "Не доставляет в другие экземпляры"
	}
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"visibilityLabels": {
		"public": "Verejné",
		"publicDescription": "Vaša poznámku bude viditeľná všetkým používateľom",
		"home": "Domov",
		"homeDescription": "Pridať iba na domácu časovú os",
		"followers": "Sledujúci",
		"followersDescription": "Viditeľné iba tým, ktorí vás sledujú",
		"specified": "Priame",
		"specifiedDescription": "Viditeľné iba pre konkrétnych používateľov",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="th-TH">
{
	"visibilityLabels": {
		"public": "สาธารณะ",
		"publicDescription": "โน้ตของคุณจะปรากฏแก่ผู้ใช้ทุกคน",
		"home": "หน้าหลัก",
		"homeDescription": "โพสต์ลงไทม์ไลน์หลักเท่านั้น",
		"followers": "ผู้ติดตาม",
		"followersDescription": "เฉพาะผู้ติดตามเท่านั้นที่มองเห็นได้",
		"specified": "ไดเร็ค",
		"specifiedDescription": "ทำให้มองเห็นได้เฉพาะผู้ใช้ที่ระบุเท่านั้น",
		"disableFederation": "การปิดใช้งานสหพันธ์",
		"disableFederationDescription": "อย่าส่งข้อมูลไปยังเซิร์ฟเวอร์อื่น"
	}
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"visibilityLabels": {
		"public": "Halka açık",
		"publicDescription": "Notunuz tüm kullanıcılar tarafından görülebilir olacaktır.",
		"home": "Pano",
		"homeDescription": "Yalnızca ana panoya gönder",
		"followers": "Takipçiler",
		"followersDescription": "Sadece takipçilerine görünür hale getir",
		"specified": "Doğrudan",
		"specifiedDescription": "Yalnızca belirli kullanıcılar için görünür hale getir",
		"disableFederation": "Federasyon olmadan",
		"disableFederationDescription": "Diğer sunuculara aktarma"
	}
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"visibilityLabels": {
		"public": "Public",
		"publicDescription": "Your note will be visible for all users",
		"home": "Home",
		"homeDescription": "Post to home timeline only",
		"followers": "Followers",
		"followersDescription": "Make visible to your followers only",
		"specified": "Direct",
		"specifiedDescription": "Make visible for specified users only",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"visibilityLabels": {
		"public": "Публічний",
		"publicDescription": "Для всіх користувачів",
		"home": "Домівка",
		"homeDescription": "Лише на домашній стрічці",
		"followers": "Підписники",
		"followersDescription": "Тільки для підписників",
		"specified": "Особисто",
		"specifiedDescription": "Лише для певних користувачів",
		"disableFederation": "Defederate",
		"disableFederationDescription": "Don't transmit to other instances"
	}
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"visibilityLabels": {
		"public": "Công khai",
		"publicDescription": "Mọi người đều có thể đọc tút của bạn",
		"home": "Trang chính",
		"homeDescription": "Chỉ đăng lên bảng tin nhà",
		"followers": "Người theo dõi",
		"followersDescription": "Dành riêng cho người theo dõi",
		"specified": "Nhắn riêng",
		"specifiedDescription": "Chỉ người được nhắc đến mới thấy",
		"disableFederation": "Không liên hợp",
		"disableFederationDescription": "Không đưa tin cho chủ máy khác"
	}
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"visibilityLabels": {
		"public": "公开",
		"publicDescription": "所有用户均可见",
		"home": "首页",
		"homeDescription": "仅发布至首页",
		"followers": "仅关注者",
		"followersDescription": "仅关注者可见",
		"specified": "指定用户",
		"specifiedDescription": "仅发送至指定用户",
		"disableFederation": "仅限本地",
		"disableFederationDescription": "不发送到其他服务器"
	}
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"visibilityLabels": {
		"public": "公開",
		"publicDescription": "發佈給所有使用者",
		"home": "首頁",
		"homeDescription": "僅發布至首頁的時間軸",
		"followers": "追隨者",
		"followersDescription": "僅發布至關注者",
		"specified": "指定使用者",
		"specifiedDescription": "僅發布至指定使用者",
		"disableFederation": "停用聯邦",
		"disableFederationDescription": "不發送到其他伺服器"
	}
}
</locale>
