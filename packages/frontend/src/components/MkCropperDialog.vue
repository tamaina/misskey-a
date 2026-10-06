<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="800"
	:height="500"
	:scroll="false"
	:withOkButton="true"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.cropImage }}</template>
	<div class="mk-cropper-dialog" :style="`--vw: 100%; --vh: 100%;`">
		<Transition name="fade">
			<div v-if="loading" class="loading">
				<MkLoading/>
			</div>
		</Transition>
		<div class="container">
			<img ref="imgEl" :src="imgUrl" style="display: none;" @load="onImageLoad">
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup generic="F extends File | Blob">
import { onMounted, useTemplateRef, ref, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import Cropper from 'cropperjs';
import tinycolor from 'tinycolor2';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import { themeManager } from '@/theme.js';

const props = defineProps<{
	imageFile: F;
	aspectRatio: number | null;
	uploadFolder?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'ok', cropped: F): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const imgUrl = URL.createObjectURL(props.imageFile);
const dialogEl = useTemplateRef('dialogEl');
const imgEl = useTemplateRef('imgEl');
let cropper: Cropper | null = null;
const loading = ref(true);

async function ok() {
	const promise = new Promise<Blob>(async (res) => {
		if (cropper == null) throw new Error('Cropper is not initialized');

		const croppedImage = await cropper.getCropperImage()!;
		const croppedSection = await cropper.getCropperSelection()!;

		// 拡大率を計算し、(ほぼ)元の大きさに戻す
		const zoomedRate = croppedImage.getBoundingClientRect().width / croppedImage.clientWidth;
		const widthToRender = croppedSection.getBoundingClientRect().width / zoomedRate;

		const croppedCanvas = await croppedSection.$toCanvas({ width: widthToRender });
		croppedCanvas.toBlob(blob => {
			if (!blob) return;
			res(blob);
		});
	});

	const f = await promise;
	let finalFile: F;
	if (props.imageFile instanceof File) {
		finalFile = new File([f], props.imageFile.name, { type: f.type }) as F;
	} else {
		finalFile = f as F;
	}

	emit('ok', finalFile);
	if (dialogEl.value != null) dialogEl.value.close();
}

function cancel() {
	emit('cancel');
	if (dialogEl.value != null) dialogEl.value.close();
}

function onImageLoad() {
	loading.value = false;

	if (cropper) {
		cropper.getCropperImage()!.$center('contain');
		cropper.getCropperSelection()!.$center();
	}
}

onMounted(() => {
	if (imgEl.value == null) return; // TSを黙らすため

	cropper = new Cropper(imgEl.value, {
	});

	const themeValue = themeManager.currentCompiledTheme!;

	const selection = cropper.getCropperSelection()!;
	selection.themeColor = tinycolor(themeValue.accent).toHexString();
	if (props.aspectRatio != null) selection.aspectRatio = props.aspectRatio;
	selection.initialAspectRatio = props.aspectRatio ?? 1;
	selection.outlined = true;

	window.setTimeout(() => {
		if (cropper == null) return;
		cropper.getCropperImage()!.$center('contain');
		selection.$center();
	}, 100);

	// モーダルオープンアニメーションが終わったあとで再度調整
	window.setTimeout(() => {
		if (cropper == null) return;
		cropper.getCropperImage()!.$center('contain');
		selection.$center();
	}, 500);
});

onUnmounted(() => {
	URL.revokeObjectURL(imgUrl);
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease 0.5s;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.mk-cropper-dialog {
	display: flex;
	flex-direction: column;
	width: var(--vw);
	height: var(--vh);
	position: relative;

	> .loading {
		position: absolute;
		z-index: 10;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-backdrop-filter: var(--MI-blur, blur(10px));
		backdrop-filter: var(--MI-blur, blur(10px));
		background: rgba(0, 0, 0, 0.5);
	}

	> .container {
		flex: 1;
		width: 100%;
		height: 100%;

		> ::v-deep(cropper-canvas) {
			width: 100%;
			height: 100%;

			> cropper-selection > cropper-handle[action="move"] {
				background: transparent;
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "cropImage": "اقتصاص الصورة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "cropImage": "Retalla la imatge"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "cropImage": "Oříznout obrázek"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "cropImage": "Crop image"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "cropImage": "Bild zuschneiden"
}
</locale>

<locale locale="en-US" lang="json">
{
  "cropImage": "Crop image"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "cropImage": "Recortar Imagen"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "cropImage": "Recadrer l'image"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "cropImage": "potong gambar"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "cropImage": "Ritaglia l'immagine"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "cropImage": "画像のクロップ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "cropImage": "画像切り取り"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "cropImage": "Crop image"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "cropImage": "Crop image"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "cropImage": "이미지 자르기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "cropImage": "Afbeelding bijsnijden"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "cropImage": "Crop image"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "cropImage": "Przytnij obraz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "cropImage": "Recortar imagem"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "cropImage": "Кадрирование"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "cropImage": "Orezanie obrázku"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "cropImage": "ครอบตัดรูปภาพ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "cropImage": "Görüntüyü kırp"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "cropImage": "Crop image"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "cropImage": "Кадрування"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "cropImage": "Cắt hình ảnh"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "cropImage": "裁剪图像"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "cropImage": "圖片裁剪"
}
</locale>
