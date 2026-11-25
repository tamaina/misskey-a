<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="false" :canPage="false">
	<template #icon><i class="ti ti-pencil"></i></template>
	<template #label>{{ $locale.sfc.preset }}: {{ preset.name === '' ? '(' + globalLocale.env.noName + ')' : preset.name }}</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="edit"><i class="ti ti-pencil"></i> {{ globalLocale.env.edit }}</MkButton>
			<MkButton danger iconOnly style="margin-left: auto;" @click="del"><i class="ti ti-trash"></i></MkButton>
		</div>
	</template>

	<div>
		<canvas ref="canvasEl" :class="$style.previewCanvas"></canvas>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { defineAsyncComponent, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { ImageFrameRenderer } from '@features/drive/frontend/utility/image-frame-renderer/ImageFrameRenderer.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import type { ImageFramePreset } from '@features/drive/frontend/utility/image-frame-renderer/ImageFrameRenderer.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	preset: ImageFramePreset;
}>();

const emit = defineEmits<{
	(ev: 'updatePreset', preset: ImageFramePreset): void,
	(ev: 'del'): void,
}>();

async function edit() {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@features/drive/frontend/components/MkImageFrameEditorDialog.vue')), {
		presetEditMode: true,
		preset: deepClone(props.preset),
		params: deepClone(props.preset.params),
	}, {
		presetOk: (preset) => {
			emit('updatePreset', preset);
		},
		closed: () => dispose(),
	});
}

function del(ev: PointerEvent) {
	os.popupMenu([{
		text: globalLocale.value.env.delete,
		action: () => {
			emit('del');
		},
	}], ev.currentTarget ?? ev.target);
}

const canvasEl = useTemplateRef('canvasEl');

const sampleImage = new Image();
sampleImage.src = '/client-assets/sample/3-2.jpg';

let renderer: ImageFrameRenderer | null = null;

onMounted(() => {
	sampleImage.onload = async () => {
		watch(canvasEl, async () => {
			if (canvasEl.value == null) return;

			renderer = new ImageFrameRenderer({
				canvas: canvasEl.value,
				image: sampleImage,
				exif: null,
				caption: 'Example caption',
				filename: 'example_file_name.jpg',
				renderAsPreview: true,
			});

			await renderer.render(props.preset.params);
		}, { immediate: true });
	};
});

onUnmounted(() => {
	if (renderer != null) {
		renderer.destroy();
		renderer = null;
	}
});

watch(() => props.preset, async () => {
	if (renderer != null) {
		await renderer.render(props.preset.params);
	}
}, { deep: true });
</script>

<style lang="scss" module>
.previewCanvas {
	display: block;
	width: 100%;
	height: 100%;
	max-height: 200px;
	box-sizing: border-box;
	object-fit: contain;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"preset": "إعدادات مسبقة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"preset": "Predefinit"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"preset": "Předvolba"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"preset": "Preset"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"preset": "Vorlage"
}
</locale>

<locale locale="en-US" lang="json">
{
	"preset": "Preset"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"preset": "Predefinido"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"preset": "Préréglage"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"preset": "Prasetel"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"preset": "Preimpostato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"preset": "プリセット"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"preset": "プリセット"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"preset": "Preset"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"preset": "Preset"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"preset": "프리셋"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"preset": "Preset"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"preset": "Preset"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"preset": "Konfiguracja"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"preset": "Predefinições"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"preset": "Шаблоны"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"preset": "Preset"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"preset": "พรีเซ็ต"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"preset": "Ön ayar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"preset": "Preset"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"preset": "Пресет"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"preset": "Mẫu thiết lập"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"preset": "预设值"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"preset": "預設值"
}
</locale>
