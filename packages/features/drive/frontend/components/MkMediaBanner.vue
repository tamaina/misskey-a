<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div v-if="hide" :class="$style.sensitive" @click="reveal">
		<span style="font-size: 1.6em;"><i class="ti ti-alert-triangle"></i></span>
		<b>{{ $locale.sfc.sensitive }}</b>
		<span>{{ $locale.sfc.clickToShow }}</span>
	</div>
	<a
		v-else :class="$style.download"
		:href="media.url"
		:title="media.name"
		:download="media.name"
	>
		<span style="font-size: 1.6em;"><i class="ti ti-download"></i></span>
		<b>{{ media.name }}</b>
	</a>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { shouldHideFileByDefault, canRevealFile } from '@features/drive/frontend/utility/sensitive-file.js';

const props = defineProps<{
	media: Misskey.entities.DriveFile;
}>();

const hide = ref(shouldHideFileByDefault(props.media));

async function reveal() {
	if (!(await canRevealFile(props.media))) {
		return;
	}

	hide.value = false;
}
</script>

<style lang="scss" module>
.root {
	width: 100%;
	border-radius: 4px;
	margin-top: 4px;
	overflow: clip;
}

.download,
.sensitive {
	display: flex;
	align-items: center;
	font-size: 12px;
	padding: 8px 12px;
	white-space: nowrap;
}

.download {
}

.sensitive {
	background: #111;
	color: #fff;
}

.audio {
	border-radius: 8px;
	overflow: clip;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "sensitive": "محتوى حساس",
  "clickToShow": "اضغط للعرض"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "sensitive": "Sensible",
  "clickToShow": "Fes clic per mostrar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "sensitive": "NSFW",
  "clickToShow": "Klikněte pro zobrazení"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "sensitive": "Sensitive",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "sensitive": "Sensibel",
  "clickToShow": "Zum Anzeigen anklicken"
}
</locale>

<locale locale="en-US" lang="json">
{
  "sensitive": "Sensitive",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "sensitive": "Marcado como sensible (NSFW)",
  "clickToShow": "Haz clic para verlo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "sensitive": "Contenu sensible",
  "clickToShow": "Cliquer pour afficher"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "sensitive": "Konten sensitif",
  "clickToShow": "Klik untuk melihat"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "sensitive": "Esplicito",
  "clickToShow": "Media nascosto, cliccare solo se si intende vedere"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "sensitive": "センシティブ",
  "clickToShow": "クリックして表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "sensitive": "気いつけて見いや",
  "clickToShow": "押したら見えるで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "sensitive": "Sensitive",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "sensitive": "Sensitive",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "sensitive": "열람 주의",
  "clickToShow": "클릭하여 보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "sensitive": "NSFW",
  "clickToShow": "Klik om te bekijken"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "sensitive": "Sensitive",
  "clickToShow": "Klikk for å vise"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "sensitive": "NSFW",
  "clickToShow": "Kliknij, aby wyświetlić"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "sensitive": "Conteúdo sensível",
  "clickToShow": "Clique para ver"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "sensitive": "Содержимое не для всех",
  "clickToShow": "Нажмите для просмотра"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "sensitive": "NSFW",
  "clickToShow": "Kliknutím zobrazíte"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "sensitive": "เนื้อหาที่ละเอียดอ่อน",
  "clickToShow": "คลิกเพื่อแสดง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "sensitive": "Hassas",
  "clickToShow": "Göstermek için tıklayın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "sensitive": "Sensitive",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "sensitive": "NSFW",
  "clickToShow": "Натисніть для перегляду"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "sensitive": "Nhạy cảm",
  "clickToShow": "Nhấn để xem"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "sensitive": "敏感内容",
  "clickToShow": "点击以显示"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "sensitive": "敏感內容",
  "clickToShow": "點擊查看"
}
</locale>
