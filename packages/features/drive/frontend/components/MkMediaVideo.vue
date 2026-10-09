<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="playerEl"
	tabindex="0"
	:class="[
		$style.root,
		(video.isSensitive && prefer.s.highlightSensitiveMedia) && $style.sensitive,
	]"
	@contextmenu.stop="onContextmenu"
>
	<button v-if="hide" :class="$style.hidden" @click="reveal">
		<div :class="$style.hiddenTextWrapper">
			<b v-if="video.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ $locale.sfc.sensitive }}{{ prefer.s.dataSaver.media ? ` (${$locale.sfc.video}${video.size ? ' ' + bytes(video.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-movie"></i> {{ prefer.s.dataSaver.media && video.size ? bytes(video.size) : $locale.sfc.video }}</b>
			<span style="display: block;">{{ $locale.sfc.clickToShow }}</span>
		</div>
	</button>

	<div v-else :class="$style.videoRoot" @click="emit('mediaClick', $event)">
		<img
			v-if="video.thumbnailUrl"
			:class="$style.video"
			:src="video.thumbnailUrl"
			:alt="video.comment ?? undefined"
		/>
		<video
			v-else
			:class="$style.video"
			:alt="video.comment"
			preload="metadata"
		>
			<source :src="video.url">
		</video>
		<div :class="$style.playIconWrapper">
			<div :class="$style.playIcon">
				<i class="ti ti-player-play"></i>
			</div>
		</div>
		<button :class="[$style.menu, $style.menuBottom]" class="_button" @click.stop="showMenu"><i class="ti ti-dots" style="vertical-align: middle;" aria-hidden="true"></i></button>
		<button :class="[$style.menu, $style.menuTop]" class="_button" @click.stop="hide = true"><i class="ti ti-eye-off" style="vertical-align: middle;" aria-hidden="true"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import type { MediaComponentExposes } from '@features/drive/frontend/types/media-component.js';
import bytes from '@features/ui/frontend/filters/bytes.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import * as os from '@features/ui/frontend/os.js';
import { getFileMenu } from '@features/drive/frontend/utility/get-file-menu.js';
import { shouldHideFileByDefault, canRevealFile } from '@features/drive/frontend/utility/sensitive-file.js';

const props = defineProps<{
	video: Misskey.entities.DriveFile;
}>();

const emit = defineEmits<{
	(event: 'mediaClick', ev: PointerEvent): void;
}>();

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const hide = ref(shouldHideFileByDefault(props.video));

async function reveal() {
	if (!(await canRevealFile(props.video))) {
		return;
	}

	hide.value = false;
}

function showMenu(ev: PointerEvent) {
	os.popupMenu(getFileMenu(props.video, (newHide) => { hide.value = newHide; }), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu(getFileMenu(props.video, (newHide) => { hide.value = newHide; }), ev);
}

defineExpose<MediaComponentExposes>({
	isRevealed: () => !hide.value,
});
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
	position: relative;
	overflow: clip;

	&:focus-visible {
		outline: none;
	}

	&:hover {
		.playIcon {
			scale: 1.2;
		}
	}
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

.hidden {
	width: 100%;
	height: 100%;
	background: #000;
	border: none;
	outline: none;
	font: inherit;
	color: inherit;
	cursor: pointer;
	padding: 12px 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.hiddenTextWrapper {
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.videoRoot {
	background: #000;
	position: relative;
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.video {
	display: block;
	height: 100%;
	width: 100%;
	object-fit: contain;
}

.playIconWrapper {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;
}

.playIcon {
	display: grid;
	place-items: center;
	width: 50px;
	height: 50px;
	border-radius: 100%;
	font-size: 120%;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
	scale: 1;
	transition: scale 100ms ease;
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
</style>

<locale locale="ar-SA" lang="json">
{
	"sensitive": "محتوى حساس",
	"video": "فيديو",
	"clickToShow": "اضغط للعرض"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"sensitive": "Sensible",
	"video": "Vídeo",
	"clickToShow": "Fes clic per mostrar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"sensitive": "NSFW",
	"video": "Video",
	"clickToShow": "Klikněte pro zobrazení"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"sensitive": "Sensitive",
	"video": "Video",
	"clickToShow": "Click to show"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"sensitive": "Sensibel",
	"video": "Video",
	"clickToShow": "Zum Anzeigen anklicken"
}
</locale>

<locale locale="en-US" lang="json">
{
	"sensitive": "Sensitive",
	"video": "Video",
	"clickToShow": "Click to show"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"sensitive": "Marcado como sensible (NSFW)",
	"video": "Video",
	"clickToShow": "Haz clic para verlo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"sensitive": "Contenu sensible",
	"video": "Vidéo",
	"clickToShow": "Cliquer pour afficher"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"sensitive": "Konten sensitif",
	"video": "Video",
	"clickToShow": "Klik untuk melihat"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"sensitive": "Esplicito",
	"video": "Video",
	"clickToShow": "Media nascosto, cliccare solo se si intende vedere"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"sensitive": "センシティブ",
	"video": "動画",
	"clickToShow": "クリックして表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"sensitive": "気いつけて見いや",
	"video": "動画",
	"clickToShow": "押したら見えるで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"sensitive": "Sensitive",
	"video": "Video",
	"clickToShow": "Click to show"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"sensitive": "Sensitive",
	"video": "Video",
	"clickToShow": "Click to show"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"sensitive": "열람 주의",
	"video": "동영상",
	"clickToShow": "클릭하여 보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"sensitive": "NSFW",
	"video": "Video",
	"clickToShow": "Klik om te bekijken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"sensitive": "Sensitive",
	"video": "Video",
	"clickToShow": "Klikk for å vise"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"sensitive": "NSFW",
	"video": "Video",
	"clickToShow": "Kliknij, aby wyświetlić"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"sensitive": "Conteúdo sensível",
	"video": "Vídeo",
	"clickToShow": "Clique para ver"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"sensitive": "Содержимое не для всех",
	"video": "Видео",
	"clickToShow": "Нажмите для просмотра"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"sensitive": "NSFW",
	"video": "Video",
	"clickToShow": "Kliknutím zobrazíte"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"sensitive": "เนื้อหาที่ละเอียดอ่อน",
	"video": "วีดีโอ",
	"clickToShow": "คลิกเพื่อแสดง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"sensitive": "Hassas",
	"video": "Video",
	"clickToShow": "Göstermek için tıklayın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"sensitive": "Sensitive",
	"video": "Video",
	"clickToShow": "Click to show"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"sensitive": "NSFW",
	"video": "Відео",
	"clickToShow": "Натисніть для перегляду"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"sensitive": "Nhạy cảm",
	"video": "Video",
	"clickToShow": "Nhấn để xem"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"sensitive": "敏感内容",
	"video": "视频",
	"clickToShow": "点击以显示"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"sensitive": "敏感內容",
	"video": "影片",
	"clickToShow": "點擊查看"
}
</locale>
