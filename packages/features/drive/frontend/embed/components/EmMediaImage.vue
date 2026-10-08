<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[hide ? $style.hidden : $style.visible]" @click="onclick">
	<a
		:title="image.name"
		:class="$style.imageContainer"
		:href="href ?? image.url"
		target="_blank"
		rel="noopener"
	>
		<EmImgWithBlurhash
			:hash="image.blurhash"
			:src="hide ? null : url"
			:forceBlurhash="hide"
			:cover="hide || cover"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:width="image.properties.width"
			:height="image.properties.height"
			:style="hide ? 'filter: brightness(0.7);' : null"
		/>
	</a>
	<template v-if="hide">
		<div :class="$style.hiddenText">
			<div :class="$style.hiddenTextWrapper">
				<b v-if="image.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ $locale.sfc.sensitive }}</b>
				<b v-else style="display: block;"><i class="ti ti-photo"></i> {{ $locale.sfc.image }}</b>
				<span style="display: block;">{{ $locale.sfc.clickToShow }}</span>
			</div>
		</div>
	</template>
	<div :class="$style.indicators">
		<div v-if="['image/gif', 'image/apng'].includes(image.type)" :class="$style.indicator">GIF</div>
		<div v-if="image.comment" :class="$style.indicator">ALT</div>
		<div v-if="image.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="$locale.sfc.sensitive"><i class="ti ti-eye-exclamation"></i></div>
	</div>
	<i v-if="!hide" class="ti ti-eye-off" :class="$style.hide" @click.stop="hide = true"></i>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import EmImgWithBlurhash from '@features/drive/frontend/embed/components/EmImgWithBlurhash.vue';

const props = withDefaults(defineProps<{
	image: Misskey.entities.DriveFile;
	href?: string;
	raw?: boolean;
	cover?: boolean;
}>(), {
	cover: false,
});

const hide = ref(props.image.isSensitive);

const url = computed(() => (props.raw)
	? props.image.url
	: props.image.thumbnailUrl,
);

async function onclick(ev: PointerEvent) {
	if (hide.value) {
		ev.stopPropagation();
		hide.value = false;
	}
}
</script>

<style lang="scss" module>
.hidden {
	position: relative;
}

.hiddenText {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
}

.hide {
	display: block;
	position: absolute;
	border-radius: 6px;
	background-color: var(--MI_THEME-fg);
	color: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
	font-size: 12px;
	opacity: .5;
	padding: 5px 8px;
	text-align: center;
	cursor: pointer;
	top: 12px;
	right: 12px;
}

.hiddenTextWrapper {
	display: table-cell;
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.visible {
	position: relative;
	//box-shadow: 0 0 0 1px var(--MI_THEME-divider) inset;
	background: var(--MI_THEME-bg);
	background-size: 16px 16px;
}

html[data-color-scheme=dark] .visible {
	--c: rgb(255 255 255 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

html[data-color-scheme=light] .visible {
	--c: rgb(0 0 0 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

.imageContainer {
	display: block;
	overflow: hidden;
	width: 100%;
	height: 100%;
	background-position: center;
	background-size: contain;
	background-repeat: no-repeat;
}

.indicators {
	display: inline-flex;
	position: absolute;
	top: 10px;
	left: 10px;
	pointer-events: none;
	opacity: .5;
	gap: 6px;
}

.indicator {
	/* Hardcode to black because either --MI_THEME-bg or --MI_THEME-fg makes it hard to read in dark/light mode */
	background-color: black;
	border-radius: 6px;
	color: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
	display: inline-block;
	font-weight: bold;
	font-size: 0.8em;
	padding: 2px 5px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"sensitive": "محتوى حساس",
	"image": "صور",
	"clickToShow": "اضغط للعرض"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"sensitive": "Sensible",
	"image": "Imatge",
	"clickToShow": "Fes clic per mostrar"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"sensitive": "NSFW",
	"image": "Obrázky",
	"clickToShow": "Klikněte pro zobrazení"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"sensitive": "Sensitive",
	"image": "Image",
	"clickToShow": "Click to show"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"sensitive": "Sensibel",
	"image": "Bild",
	"clickToShow": "Zum Anzeigen anklicken"
}
</locale>

<locale lang="json" locale="en-US">
{
	"sensitive": "Sensitive",
	"image": "Image",
	"clickToShow": "Click to show"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"sensitive": "Marcado como sensible (NSFW)",
	"image": "Imágenes",
	"clickToShow": "Haz clic para verlo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"sensitive": "Contenu sensible",
	"image": "Images",
	"clickToShow": "Cliquer pour afficher"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"sensitive": "Konten sensitif",
	"image": "Gambar",
	"clickToShow": "Klik untuk melihat"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"sensitive": "Esplicito",
	"image": "Immagini",
	"clickToShow": "Media nascosto, cliccare solo se si intende vedere"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"sensitive": "センシティブ",
	"image": "画像",
	"clickToShow": "クリックして表示"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"sensitive": "気いつけて見いや",
	"image": "画像",
	"clickToShow": "押したら見えるで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"sensitive": "Sensitive",
	"image": "Image",
	"clickToShow": "Click to show"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"sensitive": "Sensitive",
	"image": "Image",
	"clickToShow": "Click to show"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"sensitive": "열람 주의",
	"image": "이미지",
	"clickToShow": "클릭하여 보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"sensitive": "NSFW",
	"image": "Afbeeldingen",
	"clickToShow": "Klik om te bekijken"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"sensitive": "Sensitive",
	"image": "Bilde",
	"clickToShow": "Klikk for å vise"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"sensitive": "NSFW",
	"image": "Zdjęcia",
	"clickToShow": "Kliknij, aby wyświetlić"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"sensitive": "Conteúdo sensível",
	"image": "imagem",
	"clickToShow": "Clique para ver"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"sensitive": "Содержимое не для всех",
	"image": "Изображения",
	"clickToShow": "Нажмите для просмотра"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"sensitive": "NSFW",
	"image": "Obrázky",
	"clickToShow": "Kliknutím zobrazíte"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"sensitive": "เนื้อหาที่ละเอียดอ่อน",
	"image": "รูปภาพ",
	"clickToShow": "คลิกเพื่อแสดง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"sensitive": "Hassas",
	"image": "Görsel",
	"clickToShow": "Göstermek için tıklayın"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"sensitive": "Sensitive",
	"image": "Image",
	"clickToShow": "Click to show"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"sensitive": "NSFW",
	"image": "Зображення",
	"clickToShow": "Натисніть для перегляду"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"sensitive": "Nhạy cảm",
	"image": "Hình ảnh",
	"clickToShow": "Nhấn để xem"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"sensitive": "敏感内容",
	"image": "图片",
	"clickToShow": "点击以显示"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"sensitive": "敏感內容",
	"image": "圖片",
	"clickToShow": "點擊查看"
}
</locale>
