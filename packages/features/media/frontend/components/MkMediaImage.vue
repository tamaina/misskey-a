<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[hide ? $style.hidden : $style.visible, (image.isSensitive && prefer.s.highlightSensitiveMedia) && $style.sensitive]" @click="onClick" @contextmenu.stop="onContextmenu">
	<component
		:is="disableImageLink ? 'div' : 'a'"
		v-bind="disableImageLink ? {
			title: image.name,
			class: $style.imageContainer,
		} : {
			title: image.name,
			class: $style.imageContainer,
			href: image.url,
			style: 'cursor: zoom-in;'
		}"
	>
		<MkImgWithBlurhash
			v-if="prefer.s.enableHighQualityImagePlaceholders"
			:hash="image.blurhash"
			:src="(prefer.s.dataSaver.media && hide) ? null : url"
			:forceBlurhash="hide"
			:cover="hide || cover"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:width="image.properties.width"
			:height="image.properties.height"
			:style="hide ? 'filter: brightness(0.7);' : null"
			:class="$style.image"
			:marker="marker"
		/>
		<div
			v-else-if="prefer.s.dataSaver.media || hide"
			:title="image.comment || image.name"
			:style="hide ? 'background: #888;' : null"
			:class="$style.image"
		></div>
		<img
			v-else
			:src="url"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:class="$style.image"
			:data-marker="marker"
		/>
	</component>
	<template v-if="hide">
		<div :class="$style.hiddenText">
			<div :class="$style.hiddenTextWrapper">
				<b v-if="image.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ $locale.sfc.sensitive }}{{ prefer.s.dataSaver.media ? ` (${$locale.sfc.image}${image.size ? ' ' + bytes(image.size) : ''})` : '' }}</b>
				<b v-else style="display: block;"><i class="ti ti-photo"></i> {{ prefer.s.dataSaver.media && image.size ? bytes(image.size) : $locale.sfc.image }}</b>
				<span v-if="controls" style="display: block;">{{ $locale.sfc.clickToShow }}</span>
			</div>
		</div>
	</template>
	<template v-else-if="controls">
		<div :class="$style.indicators">
			<div v-if="['image/gif', 'image/apng'].includes(image.type)" :class="$style.indicator">GIF</div>
			<div v-if="image.comment" :class="$style.indicator">ALT</div>
			<div v-if="image.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="$locale.sfc.sensitive"><i class="ti ti-eye-exclamation"></i></div>
		</div>
		<button :class="[$style.menu, $style.menuBottom]" class="_button" @click.stop="showMenu"><i class="ti ti-dots" style="vertical-align: middle;" aria-hidden="true"></i></button>
		<button :class="[$style.menu, $style.menuTop]" class="_button" @click.stop="hide = true"><i class="ti ti-eye-off" style="vertical-align: middle;" aria-hidden="true"></i></button>
	</template>
</div>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import type { MediaComponentExposes } from '@features/media/frontend/types/media-component.js';
import { getStaticImageUrl } from '@features/media/frontend/utility/media-proxy.js';
import bytes from '@features/ui/frontend/filters/bytes.js';
import MkImgWithBlurhash from '@features/media/frontend/components/MkImgWithBlurhash.vue';
import * as os from '@features/ui/frontend/os.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { shouldHideFileByDefault, canRevealFile } from '@features/drive/frontend/utility/sensitive-file.js';
import { getFileMenu } from '@features/drive/frontend/utility/get-file-menu.js';

const props = withDefaults(defineProps<{
	image: Misskey.entities.DriveFile;
	raw?: boolean;
	cover?: boolean;
	disableImageLink?: boolean;
	controls?: boolean;
	marker?: string;
}>(), {
	cover: false,
	disableImageLink: false,
	controls: true,
});

const emit = defineEmits<{
	(event: 'mediaClick', ev: PointerEvent): void;
}>();

const hide = ref(true);

const url = computed(() => (props.raw || prefer.s.loadRawImages)
	? props.image.url
	: prefer.s.disableShowingAnimatedImages
		? getStaticImageUrl(props.image.url)
		: props.image.thumbnailUrl!,
);

async function onClick(ev: PointerEvent) {
	if (!props.controls) {
		emit('mediaClick', ev);
		return;
	}

	if (hide.value) {
		ev.stopPropagation();
		if (!(await canRevealFile(props.image))) {
			return;
		}

		hide.value = false;
	} else {
		emit('mediaClick', ev);
	}
}

// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
watch(() => props.image, (newImage) => {
	hide.value = shouldHideFileByDefault(newImage);
}, {
	deep: true,
	immediate: true,
});

function showMenu(ev: PointerEvent) {
	os.popupMenu(getFileMenu(props.image, (newHide) => { hide.value = newHide; }), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu(getFileMenu(props.image, (newHide) => { hide.value = newHide; }), ev);
}

defineExpose<MediaComponentExposes>({
	isRevealed: () => !hide.value,
});
</script>

<style lang="scss" module>
.hidden {
	position: relative;
}

.sensitive {
	position: relative;

	&::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		border-radius: inherit;
		box-shadow: inset 0 0 0 4px var(--MI_THEME-warn);
	}
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

.menu {
	display: block;
	position: absolute;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	color: #fff;
	font-size: 0.8em;
	width: 28px;
	height: 28px;
	text-align: center;
}

.menuBottom {
	border-radius: 8px 0 8px 0;
	bottom: 0;
	right: 0;
}

.menuTop {
	border-radius: 0 8px 0 8px;
	top: 0;
	right: 0;
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

.image {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center;
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
