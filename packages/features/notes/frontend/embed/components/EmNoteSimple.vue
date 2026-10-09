<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<EmAvatar :class="$style.avatar" :user="note.user" link preview/>
	<div :class="$style.main">
		<EmNoteHeader :class="$style.header" :note="note" :mini="true"/>
		<div>
			<p v-if="note.cw != null" :class="$style.cw">
				<EmMfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'respect'" :emojiUrls="note.emojis"/>
				<button style="display: block; width: 100%;" class="_buttonGray _buttonRounded" @click="showContent = !showContent">{{ showContent ? $locale.sfc.cwHide : $locale.sfc.cwShow }}</button>
			</p>
			<div v-show="note.cw == null || showContent">
				<EmSubNoteContent :class="$style.text" :note="note"/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import EmAvatar from '@features/users/frontend/embed/components/EmAvatar.vue';
import EmNoteHeader from '@features/notes/frontend/embed/components/EmNoteHeader.vue';
import EmSubNoteContent from '@features/notes/frontend/embed/components/EmSubNoteContent.vue';
import EmMfm from '@features/markup/frontend/embed/components/EmMfm.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const showContent = ref(false);
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: 0;
	padding: 0;
	font-size: 0.95em;
}

.avatar {
	flex-shrink: 0;
	display: block;
	margin: 0 10px 0 0;
	width: 34px;
	height: 34px;
	border-radius: 8px;
	position: sticky !important;
	top: calc(16px + var(--MI-stickyTop, 0px));
	left: 0;
}

.main {
	flex: 1;
	min-width: 0;
}

.header {
	margin-bottom: 2px;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.text {
	cursor: default;
	margin: 0;
	padding: 0;
}

@container (min-width: 250px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 40px;
		height: 40px;
	}
}

@container (min-width: 350px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 44px;
		height: 44px;
	}
}

@container (min-width: 500px) {
	.avatar {
		margin: 0 12px 0 0;
		width: 48px;
		height: 48px;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"cwHide": "إخفاء",
	"cwShow": "عرض المزيد"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"cwHide": "Amagar",
	"cwShow": "Carregar més"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"cwHide": "Skrýt",
	"cwShow": "Zobrazit více"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"cwHide": "Hide",
	"cwShow": "Show content"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"cwHide": "Inhalt verbergen",
	"cwShow": "Inhalt anzeigen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"cwHide": "Hide",
	"cwShow": "Show content"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"cwHide": "Ocultar",
	"cwShow": "Ver más"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"cwHide": "Masquer",
	"cwShow": "Afficher le contenu"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"cwHide": "Sembunyikan",
	"cwShow": "Lihat konten"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"cwHide": "Nascondere",
	"cwShow": "Continua la lettura..."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"cwHide": "隠す",
	"cwShow": "もっと見る"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"cwHide": "隠す",
	"cwShow": "続き見して！"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"cwHide": "Hide",
	"cwShow": "Wali ugar"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"cwHide": "Hide",
	"cwShow": "ಇನ್ನಷ್ಟು ನೋಡು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"cwHide": "숨기기",
	"cwShow": "더 보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"cwHide": "Hide",
	"cwShow": "Laad meer"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"cwHide": "Skjul",
	"cwShow": "Vis mer"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"cwHide": "Ukryj",
	"cwShow": "Załaduj więcej"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"cwHide": "Esconder",
	"cwShow": "Carregar mais"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"cwHide": "Спрятать",
	"cwShow": "Показать"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"cwHide": "Skryť",
	"cwShow": "Zobraziť viac"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"cwHide": "ซ่อน",
	"cwShow": "ดูเพิ่มเติม"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"cwHide": "Gizle",
	"cwShow": "İçeriği göster"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"cwHide": "Hide",
	"cwShow": "Show content"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"cwHide": "Сховати",
	"cwShow": "Показати більше"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"cwHide": "Ẩn",
	"cwShow": "Tải thêm"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"cwHide": "隐藏",
	"cwShow": "查看更多"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"cwHide": "隱藏",
	"cwShow": "顯示內容"
}
</locale>
