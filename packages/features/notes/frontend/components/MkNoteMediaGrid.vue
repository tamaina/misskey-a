<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<template v-for="file in note.files">
	<div
		v-if="isHiding(file)"
		:class="[$style.filePreview, { [$style.square]: square }]"
		:data-scroll-anchor="`${note.id}:${file.id}`"
		@click="reveal(file)"
	>
		<MkDriveFileThumbnail
			:file="file"
			fit="cover"
			:highlightWhenSensitive="prefer.s.highlightSensitiveMedia"
			:forceBlurhash="true"
			:large="true"
			:class="$style.file"
		/>
		<div :class="$style.sensitive">
			<div>
				<div v-if="file.isSensitive"><i class="ti ti-eye-exclamation"></i> {{ $locale.sfc.sensitive }}{{ prefer.s.dataSaver.media && file.size ? ` (${bytes(file.size)})` : '' }}</div>
				<div v-else><i class="ti ti-photo"></i> {{ prefer.s.dataSaver.media && file.size ? bytes(file.size) : $locale.sfc.image }}</div>
				<div>{{ $locale.sfc.clickToShow }}</div>
			</div>
		</div>
	</div>
	<MkA v-else :class="[$style.filePreview, { [$style.square]: square }]" :data-scroll-anchor="`${note.id}:${file.id}`" :to="notePage(note)">
		<MkDriveFileThumbnail
			:file="file"
			fit="cover"
			:highlightWhenSensitive="prefer.s.highlightSensitiveMedia"
			:large="true"
			:class="$style.file"
		/>
	</MkA>
</template>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { notePage } from '@features/notes/frontend/filters/note.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { shouldHideFileByDefault, canRevealFile } from '@features/drive/frontend/utility/sensitive-file.js';
import bytes from '@features/ui/frontend/filters/bytes.js';

import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';

defineProps<{
	note: Misskey.entities.Note;
	square?: boolean;
}>();

const showingFiles = ref<Set<string>>(new Set());

function isHiding(file: Misskey.entities.DriveFile) {
	if (shouldHideFileByDefault(file) && !showingFiles.value.has(file.id)) {
		if (!file.isSensitive && !file.type.startsWith('image/')) {
			return false;
		}
		return true;
	}
	return false;
}

async function reveal(file: Misskey.entities.DriveFile) {
	if (!(await canRevealFile(file))) {
		return;
	}

	showingFiles.value.add(file.id);
}
</script>

<style lang="scss" module>
.square {
	width: 100%;
	height: auto;
	aspect-ratio: 1;
}

.filePreview {
	position: relative;
	height: 128px;
	border-radius: calc(var(--MI-radius) / 2);
	overflow: clip;

	&:hover {
		text-decoration: none;
	}

	&.square {
		height: 100%;
	}
}

.file {
	width: 100%;
	height: 100%;
	border-radius: calc(var(--MI-radius) / 2);
}

.sensitive {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
  place-items: center;
	font-size: 0.8em;
	text-align: center;
	padding: 8px;
	border-radius: calc(var(--MI-radius) / 2);
	box-sizing: border-box;
	color: #fff;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(5px);
	cursor: pointer;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "sensitive": "محتوى حساس",
  "image": "صور",
  "clickToShow": "اضغط للعرض"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "sensitive": "Sensible",
  "image": "Imatge",
  "clickToShow": "Fes clic per mostrar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "sensitive": "NSFW",
  "image": "Obrázky",
  "clickToShow": "Klikněte pro zobrazení"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "sensitive": "Sensitive",
  "image": "Image",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "sensitive": "Sensibel",
  "image": "Bild",
  "clickToShow": "Zum Anzeigen anklicken"
}
</locale>

<locale locale="en-US" lang="json">
{
  "sensitive": "Sensitive",
  "image": "Image",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "sensitive": "Marcado como sensible (NSFW)",
  "image": "Imágenes",
  "clickToShow": "Haz clic para verlo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "sensitive": "Contenu sensible",
  "image": "Images",
  "clickToShow": "Cliquer pour afficher"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "sensitive": "Konten sensitif",
  "image": "Gambar",
  "clickToShow": "Klik untuk melihat"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "sensitive": "Esplicito",
  "image": "Immagini",
  "clickToShow": "Media nascosto, cliccare solo se si intende vedere"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "sensitive": "センシティブ",
  "image": "画像",
  "clickToShow": "クリックして表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "sensitive": "気いつけて見いや",
  "image": "画像",
  "clickToShow": "押したら見えるで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "sensitive": "Sensitive",
  "image": "Image",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "sensitive": "Sensitive",
  "image": "Image",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "sensitive": "열람 주의",
  "image": "이미지",
  "clickToShow": "클릭하여 보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "sensitive": "NSFW",
  "image": "Afbeeldingen",
  "clickToShow": "Klik om te bekijken"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "sensitive": "Sensitive",
  "image": "Bilde",
  "clickToShow": "Klikk for å vise"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "sensitive": "NSFW",
  "image": "Zdjęcia",
  "clickToShow": "Kliknij, aby wyświetlić"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "sensitive": "Conteúdo sensível",
  "image": "imagem",
  "clickToShow": "Clique para ver"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "sensitive": "Содержимое не для всех",
  "image": "Изображения",
  "clickToShow": "Нажмите для просмотра"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "sensitive": "NSFW",
  "image": "Obrázky",
  "clickToShow": "Kliknutím zobrazíte"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "sensitive": "เนื้อหาที่ละเอียดอ่อน",
  "image": "รูปภาพ",
  "clickToShow": "คลิกเพื่อแสดง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "sensitive": "Hassas",
  "image": "Görsel",
  "clickToShow": "Göstermek için tıklayın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "sensitive": "Sensitive",
  "image": "Image",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "sensitive": "NSFW",
  "image": "Зображення",
  "clickToShow": "Натисніть для перегляду"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "sensitive": "Nhạy cảm",
  "image": "Hình ảnh",
  "clickToShow": "Nhấn để xem"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "sensitive": "敏感内容",
  "image": "图片",
  "clickToShow": "点击以显示"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "sensitive": "敏感內容",
  "image": "圖片",
  "clickToShow": "點擊查看"
}
</locale>
