<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="true"
	@close="cancel()"
	@ok="save()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-device-ipad-horizontal"></i> {{ $locale.sfc.title }}</template>

	<MkPreviewWithControls>
		<template #preview>
			<canvas ref="canvasEl" :class="$style.previewCanvas"></canvas>
			<div :class="$style.previewContainer">
				<div class="_acrylic" :class="$style.previewTitle">{{ $locale.sfc.preview }}</div>
				<div v-if="props.image == null" class="_acrylic" :class="$style.previewControls">
					<button class="_button" :class="[$style.previewControlsButton, sampleImageType === '3_2' ? $style.active : null]" @click="sampleImageType = '3_2'"><i class="ti ti-crop-landscape"></i></button>
					<button class="_button" :class="[$style.previewControlsButton, sampleImageType === '2_3' ? $style.active : null]" @click="sampleImageType = '2_3'"><i class="ti ti-crop-portrait"></i></button>
					<button class="_button" :class="[$style.previewControlsButton]" @click="choiceImage"><i class="ti ti-upload"></i></button>
				</div>
			</div>
		</template>

		<template #controls>
			<div class="_spacer _gaps">
				<MkRange v-model="params.borderThickness" :min="0" :max="0.2" :step="0.01" :continuousUpdate="true">
					<template #label>{{ $locale.sfc.borderThickness }}</template>
				</MkRange>

				<MkInput :modelValue="getHex(params.bgColor)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) params.bgColor = c; }">
					<template #label>{{ $locale.sfc.backgroundColor }}</template>
				</MkInput>

				<MkInput :modelValue="getHex(params.fgColor)" type="color" @update:modelValue="v => { const c = getRgb(v); if (c != null) params.fgColor = c; }">
					<template #label>{{ $locale.sfc.textColor }}</template>
				</MkInput>

				<MkSelect
					v-model="params.font" :items="[
						{ label: $locale.sfc.fontSansSerif, value: 'sans-serif' },
						{ label: $locale.sfc.fontSerif, value: 'serif' },
					]"
				>
					<template #label>{{ $locale.sfc.font }}</template>
				</MkSelect>

				<MkFolder :defaultOpen="params.labelTop.enabled">
					<template #label>{{ $locale.sfc.header }}</template>

					<div class="_gaps">
						<MkSwitch v-model="params.labelTop.enabled">
							<template #label>{{ $locale.sfc.show }}</template>
						</MkSwitch>

						<MkRange v-model="params.labelTop.padding" :min="0.01" :max="0.5" :step="0.01" :continuousUpdate="true">
							<template #label>{{ $locale.sfc.labelThickness }}</template>
						</MkRange>

						<MkRange v-model="params.labelTop.scale" :min="0.5" :max="2.0" :step="0.01" :continuousUpdate="true">
							<template #label>{{ $locale.sfc.labelScale }}</template>
						</MkRange>

						<MkSwitch v-model="params.labelTop.centered">
							<template #label>{{ $locale.sfc.centered }}</template>
						</MkSwitch>

						<MkInput v-model="params.labelTop.textBig">
							<template #label>{{ $locale.sfc.captionMain }}</template>
						</MkInput>

						<MkTextarea v-model="params.labelTop.textSmall">
							<template #label>{{ $locale.sfc.captionSub }}</template>
						</MkTextarea>

						<MkSwitch v-model="params.labelTop.withQrCode">
							<template #label>{{ $locale.sfc.withQrCode }}</template>
						</MkSwitch>
					</div>
				</MkFolder>

				<MkFolder :defaultOpen="params.labelBottom.enabled">
					<template #label>{{ $locale.sfc.footer }}</template>

					<div class="_gaps">
						<MkSwitch v-model="params.labelBottom.enabled">
							<template #label>{{ $locale.sfc.show }}</template>
						</MkSwitch>

						<MkRange v-model="params.labelBottom.padding" :min="0.01" :max="0.5" :step="0.01" :continuousUpdate="true">
							<template #label>{{ $locale.sfc.labelThickness }}</template>
						</MkRange>

						<MkRange v-model="params.labelBottom.scale" :min="0.5" :max="2.0" :step="0.01" :continuousUpdate="true">
							<template #label>{{ $locale.sfc.labelScale }}</template>
						</MkRange>

						<MkSwitch v-model="params.labelBottom.centered">
							<template #label>{{ $locale.sfc.centered }}</template>
						</MkSwitch>

						<MkInput v-model="params.labelBottom.textBig">
							<template #label>{{ $locale.sfc.captionMain }}</template>
						</MkInput>

						<MkTextarea v-model="params.labelBottom.textSmall">
							<template #label>{{ $locale.sfc.captionSub }}</template>
						</MkTextarea>

						<MkSwitch v-model="params.labelBottom.withQrCode">
							<template #label>{{ $locale.sfc.withQrCode }}</template>
						</MkSwitch>
					</div>
				</MkFolder>

				<MkInfo>
					<div>{{ $locale.sfc.availableVariables }}:</div>
					<div><code class="_selectableAtomic">{filename}</code> - {{ $locale.sfc.filename }}</div>
					<div><code class="_selectableAtomic">{filename_without_ext}</code> - {{ $locale.sfc.filename_without_ext }}</div>
					<div><code class="_selectableAtomic">{caption}</code> - {{ $locale.sfc.caption }}</div>
					<div><code class="_selectableAtomic">{year}</code> - {{ $locale.sfc.year }}</div>
					<div><code class="_selectableAtomic">{month}</code> - {{ $locale.sfc.month }}</div>
					<div><code class="_selectableAtomic">{day}</code> - {{ $locale.sfc.day }}</div>
					<div><code class="_selectableAtomic">{hour}</code> - {{ $locale.sfc.hour }}</div>
					<div><code class="_selectableAtomic">{minute}</code> - {{ $locale.sfc.minute }}</div>
					<div><code class="_selectableAtomic">{second}</code> - {{ $locale.sfc.second }}</div>
					<div><code class="_selectableAtomic">{0month}</code> - {{ $locale.sfc.month }} ({{ $locale.sfc.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{0day}</code> - {{ $locale.sfc.day }} ({{ $locale.sfc.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{0hour}</code> - {{ $locale.sfc.hour }} ({{ $locale.sfc.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{0minute}</code> - {{ $locale.sfc.minute }} ({{ $locale.sfc.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{0second}</code> - {{ $locale.sfc.second }} ({{ $locale.sfc.zeroPadding }})</div>
					<div><code class="_selectableAtomic">{camera_model}</code> - {{ $locale.sfc.camera_model }}</div>
					<div><code class="_selectableAtomic">{camera_lens_model}</code> - {{ $locale.sfc.camera_lens_model }}</div>
					<div><code class="_selectableAtomic">{camera_mm}</code> - {{ $locale.sfc.camera_mm }}</div>
					<div><code class="_selectableAtomic">{camera_mm_35}</code> - {{ $locale.sfc.camera_mm_35 }}</div>
					<div><code class="_selectableAtomic">{camera_f}</code> - {{ $locale.sfc.camera_f }}</div>
					<div><code class="_selectableAtomic">{camera_s}</code> - {{ $locale.sfc.camera_s }}</div>
					<div><code class="_selectableAtomic">{camera_iso}</code> - {{ $locale.sfc.camera_iso }}</div>
					<div><code class="_selectableAtomic">{gps_lat}</code> - {{ $locale.sfc.gps_lat }}</div>
					<div><code class="_selectableAtomic">{gps_long}</code> - {{ $locale.sfc.gps_long }}</div>
				</MkInfo>
			</div>
		</template>
	</MkPreviewWithControls>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import ExifReader from 'exifreader';
import { throttle } from 'throttle-debounce';
import MkPreviewWithControls from '@features/markup/frontend/components/MkPreviewWithControls.vue';
import type { ImageFrameParams, ImageFramePreset } from '@features/drive/frontend/utility/image-frame-renderer/ImageFrameRenderer.js';
import { ImageFrameRenderer } from '@features/drive/frontend/utility/image-frame-renderer/ImageFrameRenderer.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { genId } from '@features/runtime/frontend/utility/id.js';

const $i = ensureSignin();

const props = defineProps<{
	presetEditMode?: boolean;
	preset?: ImageFramePreset | null;
	params?: ImageFrameParams | null;
	image?: File | null;
	imageCaption?: string | null;
	imageFilename?: string | null;
}>();

const preset = deepClone(props.preset) ?? {
	id: genId(),
	name: '',
};

const params = reactive<ImageFrameParams>(deepClone(props.params) ?? {
	borderThickness: 0.05,
	borderRadius: 0,
	labelTop: {
		enabled: false,
		scale: 1.0,
		padding: 0.2,
		textBig: '',
		textSmall: '',
		centered: false,
		withQrCode: false,
	},
	labelBottom: {
		enabled: true,
		scale: 1.0,
		padding: 0.2,
		textBig: '{year}/{0month}/{0day}',
		textSmall: '{camera_mm}mm   f/{camera_f}   {camera_s}s   ISO{camera_iso}',
		centered: false,
		withQrCode: true,
	},
	bgColor: [1, 1, 1],
	fgColor: [0, 0, 0],
	font: 'sans-serif',
});

const emit = defineEmits<{
	(ev: 'ok', frame: ImageFrameParams): void;
	(ev: 'presetOk', preset: ImageFramePreset): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

async function cancel() {
	if (props.presetEditMode) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: $locale.value.sfc.quitWithoutSaveConfirm,
		});
		if (canceled) return;
	}

	dialog.value?.close();
}

const updateThrottled = throttle(50, () => {
	if (renderer != null) {
		renderer.render(params);
	}
});

watch(params, async (newValue, oldValue) => {
	updateThrottled();
}, { deep: true });

const canvasEl = useTemplateRef('canvasEl');

const sampleImage_3_2 = new Image();
sampleImage_3_2.src = '/client-assets/sample/3-2.jpg';
const sampleImage_3_2_loading = new Promise<void>(resolve => {
	sampleImage_3_2.onload = () => resolve();
});

const sampleImage_2_3 = new Image();
sampleImage_2_3.src = '/client-assets/sample/2-3.jpg';
const sampleImage_2_3_loading = new Promise<void>(resolve => {
	sampleImage_2_3.onload = () => resolve();
});

const sampleImageType = ref(props.image != null ? 'provided' : '3_2');
watch(sampleImageType, async () => {
	if (sampleImageType.value === 'provided') return;
	if (renderer != null) {
		renderer.destroy(false);
		renderer = null;
		initRenderer();
	}
});

let imageFile = props.image;

async function choiceImage() {
	const files = await os.chooseFileFromPc({ multiple: false });
	if (files.length === 0) return;
	imageFile = files[0];
	sampleImageType.value = 'provided';
	if (renderer != null) {
		renderer.destroy(false);
		renderer = null;
		initRenderer();
	}
}

let renderer: ImageFrameRenderer | null = null;
let imageBitmap: ImageBitmap | null = null;

async function initRenderer() {
	if (canvasEl.value == null) return;

	if (sampleImageType.value === '3_2') {
		renderer = new ImageFrameRenderer({
			canvas: canvasEl.value,
			image: sampleImage_3_2,
			exif: null,
			caption: 'Example caption',
			filename: 'example_file_name.jpg',
			renderAsPreview: true,
		});
	} else if (sampleImageType.value === '2_3') {
		renderer = new ImageFrameRenderer({
			canvas: canvasEl.value,
			image: sampleImage_2_3,
			exif: null,
			caption: 'Example caption',
			filename: 'example_file_name.jpg',
			renderAsPreview: true,
		});
	} else if (imageFile != null) {
		imageBitmap = await window.createImageBitmap(imageFile);

		const exif = ExifReader.load(await imageFile.arrayBuffer());

		renderer = new ImageFrameRenderer({
			canvas: canvasEl.value,
			image: imageBitmap,
			exif: exif,
			caption: props.imageCaption ?? null,
			filename: props.imageFilename ?? null,
			renderAsPreview: true,
		});
	}

	await renderer!.render(params);
}

onMounted(async () => {
	const closeWaiting = os.waiting();

	await nextTick(); // waitingがレンダリングされるまで待つ

	await sampleImage_3_2_loading;
	await sampleImage_2_3_loading;

	try {
		await initRenderer();
	} catch (err) {
		console.error(err);
		os.alert({
			type: 'error',
			text: $locale.value.sfc.failedToLoadImage,
		});
	}

	closeWaiting();
});

onUnmounted(() => {
	if (renderer != null) {
		renderer.destroy();
		renderer = null;
	}
	if (imageBitmap != null) {
		imageBitmap.close();
		imageBitmap = null;
	}
});

async function save() {
	if (props.presetEditMode) {
		const { canceled, result: name } = await os.inputText({
			title: $locale.value.sfc.name,
			default: preset.name,
		});
		if (canceled) return;

		preset.name = name || '';

		dialog.value?.close();
		if (renderer != null) {
			renderer.destroy();
			renderer = null;
		}

		emit('presetOk', {
			...preset,
			params: deepClone(params),
		});
	} else {
		dialog.value?.close();
		if (renderer != null) {
			renderer.destroy();
			renderer = null;
		}

		emit('ok', params);
	}
}

function getHex(c: [number, number, number]) {
	return `#${c.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`;
}

function getRgb(hex: string | number): [number, number, number] | null {
	if (
		typeof hex === 'number' ||
		typeof hex !== 'string' ||
		!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
	) {
		return null;
	}

	const m = hex.slice(1).match(/[0-9a-fA-F]{2}/g);
	if (m == null) return [0, 0, 0];
	return m.map(x => parseInt(x, 16) / 255) as [number, number, number];
}
</script>

<style module>
.previewContainer {
	display: flex;
	flex-direction: column;
	height: 100%;
	user-select: none;
	-webkit-user-drag: none;
}

.previewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.previewControls {
	position: absolute;
	z-index: 100;
	bottom: 8px;
	right: 8px;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px;
	border-radius: 6px;
}

.previewControlsButton {
	&.active {
		color: var(--MI_THEME-accent);
	}
}

.previewSpinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.previewCanvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	padding: 20px;
	box-sizing: border-box;
	object-fit: contain;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "الإسم",
	"title": "Edit frame",
	"preview": "معاينة",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "الخط",
	"header": "Header",
	"show": "المظهر",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "اسم الملف",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"quitWithoutSaveConfirm": "Sortir sense desar?",
	"failedToLoadImage": "Error en carregar la imatge",
	"name": "Nom",
	"title": "Edició de fotogrames ",
	"preview": "Vista prèvia",
	"borderThickness": "Amplada de la vora",
	"backgroundColor": "Color del fons",
	"textColor": "Color del text",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Lletra tipogràfica",
	"header": "Capçalera",
	"show": "Veure",
	"labelThickness": "Amplada de l'etiqueta ",
	"labelScale": "Mida de l'etiqueta ",
	"centered": "Alinea al centre",
	"captionMain": "Peu de foto (gran)",
	"captionSub": "Peu de foto (petit)",
	"withQrCode": "Codi QR",
	"footer": "Peu de pàgina ",
	"availableVariables": "Variables disponibles",
	"filename": "Nom del Fitxer",
	"filename_without_ext": "Nom de l'arxiu sense extensió ",
	"caption": "Títol de l'arxiu",
	"year": "Any",
	"month": "Mes",
	"day": "Dia",
	"hour": "Hora",
	"minute": "Minut",
	"second": "Segon",
	"zeroPadding": "Sense omplir",
	"camera_model": "Nom de la càmera ",
	"camera_lens_model": "Nom de la lent",
	"camera_mm": "Distància focal",
	"camera_mm_35": "Distància focal (equivalent a 35\u202fmm)",
	"camera_f": "Obertura",
	"camera_s": "Velocitat d'obturació",
	"camera_iso": "Sensibilitat ISO",
	"gps_lat": "Latitud ",
	"gps_long": "Longitud "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Jméno",
	"title": "Edit frame",
	"preview": "Náhled",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Písmo",
	"header": "Nadpis",
	"show": "Zobrazit",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Název souboru",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"title": "Edit frame",
	"preview": "Preview",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Font",
	"header": "Header",
	"show": "Show",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Filename",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"quitWithoutSaveConfirm": "Nicht gespeicherte Änderungen verwerfen?",
	"failedToLoadImage": "Das Laden des Bildes ist fehlgeschlagen.",
	"name": "Name",
	"title": "Rahmenbearbeitung",
	"preview": "Vorschau",
	"borderThickness": "Randbreite",
	"backgroundColor": "Hintergrundfarbe",
	"textColor": "Textfarbe",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Schriftart",
	"header": "Kopfzeile",
	"show": "Anzeigen",
	"labelThickness": "Beschriftungsbreite",
	"labelScale": "Etikettenskala",
	"centered": "Zentriert",
	"captionMain": "Überschrift (groß)",
	"captionSub": "Beschriftung (klein)",
	"withQrCode": "QR-Code",
	"footer": "Fußzeile",
	"availableVariables": "Verfügbare Variablen",
	"filename": "Dateiname",
	"filename_without_ext": "Dateiname ohne Erweiterung",
	"caption": "Dateibeschriftung",
	"year": "Jahr der Aufnahme",
	"month": "Monat der Aufnahme",
	"day": "Tag der Aufnahme",
	"hour": "Stunde der Aufnahmezeit",
	"minute": "Minute der Aufnahmezeit",
	"second": "Sekunde der Aufnahmezeit",
	"zeroPadding": "Nullauffüllung",
	"camera_model": "Kameraname",
	"camera_lens_model": "Objektivname",
	"camera_mm": "Brennweite",
	"camera_mm_35": "Brennweite (35-mm-Äquivalent)",
	"camera_f": "Blende",
	"camera_s": "Verschlusszeit",
	"camera_iso": "ISO-Empfindlichkeit",
	"gps_lat": "Breitengrad",
	"gps_long": "Längengrad"
}
</locale>

<locale locale="en-US" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"title": "Edit frame",
	"preview": "Preview",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Font",
	"header": "Header",
	"show": "Show",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Filename",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"quitWithoutSaveConfirm": "¿Descartar cambios no guardados?",
	"failedToLoadImage": "Error al cargar la imagen",
	"name": "Nombre",
	"title": "Edición de Fotos",
	"preview": "Vista previa",
	"borderThickness": "Ancho del borde",
	"backgroundColor": "Color de fondo",
	"textColor": "Color del texto",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Fuente",
	"header": "Título",
	"show": "Apariencia",
	"labelThickness": "Ancho de la etiqueta",
	"labelScale": "Escala de la Etiqueta",
	"centered": "Alinear al centro",
	"captionMain": "Pie de foto (Grande)",
	"captionSub": "Pie de foto (Pequeño)",
	"withQrCode": "Código QR",
	"footer": "Pie de página",
	"availableVariables": "Variables disponibles",
	"filename": "Nombre de archivo",
	"filename_without_ext": "Nombre del archivo sin la extensión",
	"caption": "Título del archivo",
	"year": "Año de rodaje",
	"month": "Mes de la fotografía",
	"day": "Día de la fotografía",
	"hour": "Hora",
	"minute": "Minuto",
	"second": "Segundo",
	"zeroPadding": "Relleno cero",
	"camera_model": "Nombre de la cámara",
	"camera_lens_model": "Modelo de lente",
	"camera_mm": "Distancia focal",
	"camera_mm_35": "Distancia Focal (Equivalente a formato de 35mm)",
	"camera_f": "Apertura de diafragma",
	"camera_s": "Velocidad de Obturación",
	"camera_iso": "Sensibilidad ISO",
	"gps_lat": "Latitud",
	"gps_long": "Longitud"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Nom",
	"title": "Edit frame",
	"preview": "Aperçu",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Police de caractères",
	"header": "Entête",
	"show": "Affichage",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Nom du fichier",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Nama",
	"title": "Edit frame",
	"preview": "Pratinjau",
	"borderThickness": "Frame width",
	"backgroundColor": "Warna latar belakang",
	"textColor": "Text color",
	"fontSansSerif": "Sans-serif",
	"fontSerif": "Serif",
	"font": "Font",
	"header": "Header",
	"show": "Tampilkan",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Nama berkas",
	"filename_without_ext": "Nama berkas tanpa ekstensi",
	"caption": "Keterangan berkas",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"quitWithoutSaveConfirm": "Uscire senza salvare?",
	"failedToLoadImage": "Impossibile caricare l'immagine",
	"name": "Nome",
	"title": "Modifica fotogramma",
	"preview": "Anteprima",
	"borderThickness": "Larghezza del bordo",
	"backgroundColor": "Colore dello sfondo",
	"textColor": "Colore del testo",
	"fontSansSerif": "Sans serif",
	"fontSerif": "Serif",
	"font": "Tipo di carattere",
	"header": "Intestazione",
	"show": "Visualizza",
	"labelThickness": "Spessore etichetta",
	"labelScale": "Dimensione etichetta",
	"centered": "Allinea al centro",
	"captionMain": "Didascalia (grande)",
	"captionSub": "Didascalia (piccola)",
	"withQrCode": "QR Code",
	"footer": "Piè di pagina",
	"availableVariables": "Variabili disponibili",
	"filename": "Nome dell'allegato",
	"filename_without_ext": "Nome file senza estensione",
	"caption": "Didascalia dell'immagine",
	"year": "Anno di scatto",
	"month": "Mese dello scatto",
	"day": "Giorno dello scatto",
	"hour": "Ora dello scatto",
	"minute": "Minuto dello scatto",
	"second": "Secondi dello scatto",
	"zeroPadding": "Al vivo",
	"camera_model": "Modello di fotocamera",
	"camera_lens_model": "Modello della lente",
	"camera_mm": "Lunghezza focale",
	"camera_mm_35": "Lunghezza focale (equivalente a 35 mm)",
	"camera_f": "Diaframma",
	"camera_s": "Velocità otturatore",
	"camera_iso": "Sensibilità ISO",
	"gps_lat": "Latitudine",
	"gps_long": "Longitudine"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"quitWithoutSaveConfirm": "保存せずに終了しますか？",
	"failedToLoadImage": "画像の読み込みに失敗しました",
	"name": "名前",
	"title": "フレームの編集",
	"preview": "プレビュー",
	"borderThickness": "フチの幅",
	"backgroundColor": "背景色",
	"textColor": "文字色",
	"fontSansSerif": "サンセリフ",
	"fontSerif": "セリフ",
	"font": "フォント",
	"header": "ヘッダー",
	"show": "表示",
	"labelThickness": "ラベルの幅",
	"labelScale": "ラベルのスケール",
	"centered": "中央揃え",
	"captionMain": "キャプション(大)",
	"captionSub": "キャプション(小)",
	"withQrCode": "二次元コード",
	"footer": "フッター",
	"availableVariables": "利用可能な変数",
	"filename": "ファイル名",
	"filename_without_ext": "拡張子無しファイル名",
	"caption": "ファイルのキャプション",
	"year": "撮影年",
	"month": "撮影月",
	"day": "撮影日",
	"hour": "撮影した時刻(時)",
	"minute": "撮影した時刻(分)",
	"second": "撮影した時刻(秒)",
	"zeroPadding": "ゼロ埋め",
	"camera_model": "カメラ名",
	"camera_lens_model": "レンズ名",
	"camera_mm": "焦点距離",
	"camera_mm_35": "焦点距離(35mm判換算)",
	"camera_f": "絞り",
	"camera_s": "シャッタースピード",
	"camera_iso": "ISO感度",
	"gps_lat": "緯度",
	"gps_long": "経度"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"quitWithoutSaveConfirm": "保存せずに終わってもええんか？",
	"failedToLoadImage": "あかん、画像読み込まれへんわ",
	"name": "名前",
	"title": "フレームの編集",
	"preview": "プレビュー",
	"borderThickness": "フチの幅",
	"backgroundColor": "背景色",
	"textColor": "文字色",
	"fontSansSerif": "サンセリフ",
	"fontSerif": "セリフ",
	"font": "フォント",
	"header": "ヘッダー",
	"show": "表示",
	"labelThickness": "ラベルの幅",
	"labelScale": "ラベルのスケール",
	"centered": "中央揃え",
	"captionMain": "キャプション(大)",
	"captionSub": "キャプション(小)",
	"withQrCode": "二次元コード",
	"footer": "フッター",
	"availableVariables": "利用可能な変数",
	"filename": "ファイル名",
	"filename_without_ext": "拡張子無しファイル名",
	"caption": "ファイルのキャプション",
	"year": "撮影年",
	"month": "撮影月",
	"day": "撮影日",
	"hour": "撮影した時刻(時)",
	"minute": "撮影した時刻(分)",
	"second": "撮影した時刻(秒)",
	"zeroPadding": "ゼロ埋め",
	"camera_model": "カメラ名",
	"camera_lens_model": "レンズ名",
	"camera_mm": "焦点距離",
	"camera_mm_35": "焦点距離(35mm判換算)",
	"camera_f": "絞り",
	"camera_s": "シャッタースピード",
	"camera_iso": "ISO感度",
	"gps_lat": "緯度",
	"gps_long": "経度"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"title": "Edit frame",
	"preview": "Preview",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Tasefsit",
	"header": "Header",
	"show": "Show",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Filename",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"title": "Edit frame",
	"preview": "Preview",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Font",
	"header": "Header",
	"show": "Show",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Filename",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"quitWithoutSaveConfirm": "보존하지 않고 종료하시겠습니까?",
	"failedToLoadImage": "이미지 로드에 실패했습니다.",
	"name": "이름",
	"title": "프레임 편집",
	"preview": "미리보기",
	"borderThickness": "테두리의 폭",
	"backgroundColor": "배경색",
	"textColor": "글꼴 색상",
	"fontSansSerif": "고딕체",
	"fontSerif": "명조체",
	"font": "폰트",
	"header": "헤더",
	"show": "표시",
	"labelThickness": "라벨의 폭",
	"labelScale": "라벨의 스케일",
	"centered": "중앙 정렬",
	"captionMain": "캡션(대)",
	"captionSub": "캡션(소)",
	"withQrCode": "QR 코드",
	"footer": "꼬리말",
	"availableVariables": "이용 가능한 변수",
	"filename": "파일명",
	"filename_without_ext": "확장자가 없는 파일명",
	"caption": "파일 설명",
	"year": "촬영한 해",
	"month": "촬영한 달",
	"day": "촬영한 날",
	"hour": "촬영한 시각(시)",
	"minute": "촬영한 시각(분)",
	"second": "촬영한 시각(초)",
	"zeroPadding": "0으로 채우기",
	"camera_model": "카메라 이름",
	"camera_lens_model": "렌즈 이름",
	"camera_mm": "초점 거리",
	"camera_mm_35": "초점 거리(35m판 환산)",
	"camera_f": "조리개 조절",
	"camera_s": "셔터 속도",
	"camera_iso": "ISO 감도",
	"gps_lat": "위도",
	"gps_long": "경도"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Naam",
	"title": "Edit frame",
	"preview": "Voorbeeld",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Font",
	"header": "Header",
	"show": "Weergave",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Bestandsnaam",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Navn",
	"title": "Edit frame",
	"preview": "Preview",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Font",
	"header": "Header",
	"show": "Vis",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Filnavn",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Nazwa",
	"title": "Edit frame",
	"preview": "Podgląd",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Bezszeryfowa",
	"fontSerif": "Szeryfowa",
	"font": "Czcionka",
	"header": "Nagłówek",
	"show": "Wyświetlanie",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Nazwa pliku",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"quitWithoutSaveConfirm": "Descartar mudanças?",
	"failedToLoadImage": "Failed to load image",
	"name": "Nome",
	"title": "Edit frame",
	"preview": "Pré-visualizar",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Fonte",
	"header": "Cabeçalho",
	"show": "Visualizar",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "Código QR",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Nome do Ficheiro",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"quitWithoutSaveConfirm": "Выйти без сохранения?",
	"failedToLoadImage": "Не удалось загрузить изображение",
	"name": "Название",
	"title": "Редактировать рамку",
	"preview": "Предпросмотр",
	"borderThickness": "Толщина рамки",
	"backgroundColor": "Цвет фона",
	"textColor": "Цвет текста",
	"fontSansSerif": "Гротеск (без засечек)",
	"fontSerif": "Антиква (с засечками)",
	"font": "Шрифт",
	"header": "Заголовок",
	"show": "Показать",
	"labelThickness": "Толщина границ",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR код",
	"footer": "Нижняя часть",
	"availableVariables": "Supported variables",
	"filename": "Имя файла",
	"filename_without_ext": "Имя файла без расширения",
	"caption": "Описание файла",
	"year": "Год создания",
	"month": "Месяц создания",
	"day": "День создания",
	"hour": "Час создания",
	"minute": "Минуты создания",
	"second": "Секунды создания",
	"zeroPadding": "Без отступов",
	"camera_model": "Модель камеры",
	"camera_lens_model": "Модель линзы",
	"camera_mm": "Фокусное расстояние",
	"camera_mm_35": "Фокусное расстояние (экв. 35 мм)",
	"camera_f": "Диафрагма",
	"camera_s": "Выдержка",
	"camera_iso": "ISO",
	"gps_lat": "Широта",
	"gps_long": "Долгота"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Názov",
	"title": "Edit frame",
	"preview": "Náhľad",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Bezpätkové",
	"fontSerif": "Pätkové",
	"font": "Písmo",
	"header": "Hlavička",
	"show": "Zobraziť",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Názov súboru",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"quitWithoutSaveConfirm": "ต้องการออกโดยไม่บันทึกหรือไม่?",
	"failedToLoadImage": "โหลดภาพล้มเหลว",
	"name": "ชื่อ",
	"title": "แก้ไขเฟรม",
	"preview": "แสดงตัวอย่าง",
	"borderThickness": "ความกว้างขอบ",
	"backgroundColor": "สีพื้นหลัง",
	"textColor": "สีตัวอักษร",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "แบบอักษร",
	"header": "ส่วนหัว",
	"show": "แสดงผล",
	"labelThickness": "ความกว้างป้าย",
	"labelScale": "สเกลของป้าย",
	"centered": "จัดกึ่งกลาง",
	"captionMain": "แคปชั่น (ใหญ่)",
	"captionSub": "แคปชั่น (เล็ก)",
	"withQrCode": "QR โค้ด",
	"footer": "ท้ายกระดาษ",
	"availableVariables": "ตัวแปรที่สามารถใช้ได้",
	"filename": "ชื่อไฟล์",
	"filename_without_ext": "ชื่อไฟล์ที่ไม่มีนามสกุล",
	"caption": "แคปชั่นของไฟล์",
	"year": "ปีที่ถ่าย",
	"month": "เดือนที่ถ่าย",
	"day": "วันที่ถ่าย",
	"hour": "เวลาที่ถ่าย (ชั่วโมง)",
	"minute": "เวลาที่ถ่าย (นาที)",
	"second": "เวลาที่ถ่าย (วินาที)",
	"zeroPadding": "ห่างเป็น 0",
	"camera_model": "ชื่อกล้อง",
	"camera_lens_model": "ชื่อเลนส์",
	"camera_mm": "ความยาวโฟกัส",
	"camera_mm_35": "ทางยาวโฟกัส (เทียบเท่า 35 มม.)",
	"camera_f": "รูรับแสง",
	"camera_s": "ความเร็วชัตเตอร์",
	"camera_iso": "ความไวแสง ISO",
	"gps_lat": "ละติจูด",
	"gps_long": "ลองจิจูด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"quitWithoutSaveConfirm": "Kaydedilmemiş değişiklikleri silmek ister misin?",
	"failedToLoadImage": "Görüntü yükleme başarısız oldu ",
	"name": "İsim",
	"title": "Düzenleme kareleri",
	"preview": "Önizleme",
	"borderThickness": "jantın genişliği",
	"backgroundColor": "Arka Plan Rengi ",
	"textColor": "Metin Rengi ",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Yazı tipi",
	"header": "Başlık",
	"show": "Göster",
	"labelThickness": "Etiket genişliği",
	"labelScale": "Etiket ölçeği",
	"centered": "Merkezlenmiş",
	"captionMain": "Altyazı (büyük)",
	"captionSub": "Altyazı (küçük)",
	"withQrCode": "2 boyutlu kod",
	"footer": "Alt bilgi",
	"availableVariables": "Mevcut değişkenler",
	"filename": "Dosya adı",
	"filename_without_ext": "Uzantısız dosya adları",
	"caption": "Dosya başlığı",
	"year": "Çekim yılı",
	"month": "Çekim ayı",
	"day": "Çekim tarihi",
	"hour": "Fotoğrafın çekildiği zaman (saat)",
	"minute": "Çekim süresi (dakika)",
	"second": "Çekim süresi (saniye)",
	"zeroPadding": "Sıfır doldurma",
	"camera_model": "Kamera Adı",
	"camera_lens_model": "Lens adı",
	"camera_mm": "Odak uzaklığı",
	"camera_mm_35": "Genişlik (35mm)",
	"camera_f": "açıklık",
	"camera_s": "Enstantane hızı",
	"camera_iso": "ISO hassasiyeti",
	"gps_lat": "Enlem",
	"gps_long": "Boylam"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"title": "Edit frame",
	"preview": "Preview",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Font",
	"header": "Header",
	"show": "Show",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Filename",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"quitWithoutSaveConfirm": "Вийти без збереження?",
	"failedToLoadImage": "Не вдалося завантажити зображення",
	"name": "Ім'я",
	"title": "Редагувати рамку",
	"preview": "Попередній перегляд",
	"borderThickness": "Товщина рамки",
	"backgroundColor": "Колір фону",
	"textColor": "Колір тексту",
	"fontSansSerif": "Sans serif",
	"fontSerif": "Serif",
	"font": "Шрифт",
	"header": "Заголовок",
	"show": "Відображення",
	"labelThickness": "Label width",
	"labelScale": "Розмір ",
	"centered": "Центрувати",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR-код",
	"footer": "Нижня частина",
	"availableVariables": "Доступні змінні",
	"filename": "Ім'я файлу",
	"filename_without_ext": "Ім'я файлу без розширення",
	"caption": "Опис файлу",
	"year": "Рік створення",
	"month": "Місяць створення",
	"day": "День створення",
	"hour": "Година створення",
	"minute": "Хвилина створення",
	"second": "Секунда створення",
	"zeroPadding": "Доповнення нулями",
	"camera_model": "Модель камери",
	"camera_lens_model": "Модель лінзи",
	"camera_mm": "Фокусна відстань",
	"camera_mm_35": "Фокусна відстань (у 35 мм форматі)",
	"camera_f": "Діафрагма (f-число)",
	"camera_s": "Витримка",
	"camera_iso": "ISO",
	"gps_lat": "Широта",
	"gps_long": "Довгота"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Tên",
	"title": "Edit frame",
	"preview": "Xem trước",
	"borderThickness": "Frame width",
	"backgroundColor": "Background color",
	"textColor": "Text color",
	"fontSansSerif": "Sans Serif",
	"fontSerif": "Serif",
	"font": "Phông chữ",
	"header": "Ảnh bìa",
	"show": "Hiển thị",
	"labelThickness": "Label width",
	"labelScale": "Label scale",
	"centered": "Centered",
	"captionMain": "Caption (Big)",
	"captionSub": "Caption (Small)",
	"withQrCode": "QR Code",
	"footer": "Footer",
	"availableVariables": "Supported variables",
	"filename": "Tên tập tin",
	"filename_without_ext": "Filename without extension",
	"caption": "File caption",
	"year": "Year of photography",
	"month": "Month of photogrphy",
	"day": "Date of photography",
	"hour": "Time the photo was taken (hour)",
	"minute": "Time the photo was taken (minute)",
	"second": "Time the photo was taken (second)",
	"zeroPadding": "Zero padding",
	"camera_model": "Camera Name",
	"camera_lens_model": "Lens model",
	"camera_mm": "Focal length",
	"camera_mm_35": "Focal length (in 35\u00a0mm format)",
	"camera_f": "Aperture (f-number)",
	"camera_s": "Shutter speed",
	"camera_iso": "ISO",
	"gps_lat": "Latitude",
	"gps_long": "Longitude"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"quitWithoutSaveConfirm": "放弃未保存的更改？",
	"failedToLoadImage": "图片加载失败",
	"name": "名称",
	"title": "编辑边框",
	"preview": "预览",
	"borderThickness": "边框宽度",
	"backgroundColor": "背景颜色",
	"textColor": "文本颜色",
	"fontSansSerif": "无衬线字体",
	"fontSerif": "衬线字体",
	"font": "字体",
	"header": "顶栏",
	"show": "显示",
	"labelThickness": "标签宽度",
	"labelScale": "标签比例",
	"centered": "居中",
	"captionMain": "标题（大）",
	"captionSub": "标题（小）",
	"withQrCode": "二维码",
	"footer": "页脚",
	"availableVariables": "可修改的变量",
	"filename": "文件名称",
	"filename_without_ext": "不带扩展名的文件名",
	"caption": "文件标题",
	"year": "拍摄年",
	"month": "拍摄月",
	"day": "拍摄日",
	"hour": "拍摄时间（时）",
	"minute": "拍摄时间（分）",
	"second": "拍摄时间（秒）",
	"zeroPadding": "填充 0",
	"camera_model": "相机名称",
	"camera_lens_model": "镜头型号",
	"camera_mm": "焦距",
	"camera_mm_35": "焦距（35mm等效）",
	"camera_f": "光圈",
	"camera_s": "快门速度",
	"camera_iso": "ISO",
	"gps_lat": "纬度",
	"gps_long": "经度"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"quitWithoutSaveConfirm": "不儲存就退出嗎？",
	"failedToLoadImage": "圖片載入失敗",
	"name": "名稱",
	"title": "編輯邊框",
	"preview": "預覽",
	"borderThickness": "邊框寬度",
	"backgroundColor": "背景顏色",
	"textColor": "文字顏色",
	"fontSansSerif": "無襯線體",
	"fontSerif": "襯線體",
	"font": "字型",
	"header": "標題",
	"show": "檢視",
	"labelThickness": "標籤寬度",
	"labelScale": "標籤縮放比例",
	"centered": "置中對齊",
	"captionMain": "標題文字（大）",
	"captionSub": "標題文字（小）",
	"withQrCode": "二維條碼",
	"footer": "頁尾",
	"availableVariables": "可使用的變數",
	"filename": "檔案名稱",
	"filename_without_ext": "無副檔名的檔案名稱",
	"caption": "檔案標題",
	"year": "拍攝年份",
	"month": "拍攝月份",
	"day": "拍攝日期",
	"hour": "拍攝時間（小時）",
	"minute": "拍攝時間（分鐘）",
	"second": "拍攝時間（秒）",
	"zeroPadding": "補零",
	"camera_model": "相機名稱",
	"camera_lens_model": "鏡頭型號",
	"camera_mm": "焦距",
	"camera_mm_35": "焦距（換算為 35mm 底片等效焦距）",
	"camera_f": "光圈",
	"camera_s": "快門速度",
	"camera_iso": "ISO 感光度",
	"gps_lat": "緯度",
	"gps_long": "經度"
}
</locale>
