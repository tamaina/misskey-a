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
	<template #header><i class="ti ti-copyright"></i> {{ $locale.sfc.title }}</template>

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
				<div class="_gaps_s">
					<MkFolder v-for="(layer, i) in layers" :key="layer.id" :defaultOpen="false" :canPage="false">
						<template #label>
							<div v-if="layer.type === 'text'">{{ $locale.sfc.text }}</div>
							<div v-if="layer.type === 'image'">{{ $locale.sfc.image }}</div>
							<div v-if="layer.type === 'qr'">{{ $locale.sfc.qr }}</div>
							<div v-if="layer.type === 'stripe'">{{ $locale.sfc.stripe }}</div>
							<div v-if="layer.type === 'polkadot'">{{ $locale.sfc.polkadot }}</div>
							<div v-if="layer.type === 'checker'">{{ $locale.sfc.checker }}</div>
						</template>
						<template #footer>
							<div class="_buttons">
								<MkButton iconOnly @click="removeLayer(layer)"><i class="ti ti-trash"></i></MkButton>
								<MkButton iconOnly @click="swapUpLayer(layer)"><i class="ti ti-arrow-up"></i></MkButton>
								<MkButton iconOnly @click="swapDownLayer(layer)"><i class="ti ti-arrow-down"></i></MkButton>
							</div>
						</template>

						<XLayer
							v-model:layer="layers[i]"
						></XLayer>
					</MkFolder>

					<MkButton rounded primary style="margin: 0 auto;" @click="addLayer"><i class="ti ti-plus"></i></MkButton>
				</div>
			</div>
		</template>
	</MkPreviewWithControls>
</MkModalWindow>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import type { WatermarkLayers, WatermarkPreset } from '@features/media/frontend/utility/watermark/WatermarkRenderer.js';
import { WatermarkRenderer } from '@features/media/frontend/utility/watermark/WatermarkRenderer.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkPreviewWithControls from '@features/markup/frontend/components/MkPreviewWithControls.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import XLayer from '@features/media/frontend/components/MkWatermarkEditorDialog.Layer.vue';
import * as os from '@features/ui/frontend/os.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { genId } from '@features/runtime/frontend/utility/id.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const $i = ensureSignin();

function createTextLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'text',
		text: `(c) @${$i.username}`,
		align: { x: 'right', y: 'bottom', margin: 0 },
		scale: 0.3,
		angle: 0,
		opacity: 0.75,
		repeat: false,
		noBoundingBoxExpansion: false,
	};
}

function createImageLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'image',
		imageId: null,
		imageUrl: null,
		align: { x: 'right', y: 'bottom', margin: 0 },
		scale: 0.3,
		angle: 0,
		opacity: 0.75,
		repeat: false,
		noBoundingBoxExpansion: false,
		cover: false,
	};
}

function createQrLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'qr',
		data: '',
		align: { x: 'right', y: 'bottom', margin: 0 },
		scale: 0.3,
		opacity: 1,
	};
}

function createStripeLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'stripe',
		angle: 0.5,
		frequency: 10,
		threshold: 0.1,
		color: [1, 1, 1],
		opacity: 0.75,
	};
}

function createPolkadotLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'polkadot',
		angle: 0.5,
		scale: 3,
		majorRadius: 0.1,
		minorRadius: 0.25,
		majorOpacity: 0.75,
		minorOpacity: 0.5,
		minorDivisions: 4,
		color: [1, 1, 1],
		opacity: 0.75,
	};
}

function createCheckerLayer(): WatermarkPreset['layers'][number] {
	return {
		id: genId(),
		type: 'checker',
		angle: 0.5,
		scale: 3,
		color: [1, 1, 1],
		opacity: 0.75,
	};
}

const props = defineProps<{
	presetEditMode?: boolean;
	preset?: WatermarkPreset | null;
	layers?: WatermarkLayers | null;
	image?: File | null;
}>();

const preset = deepClone(props.preset) ?? {
	id: genId(),
	name: '',
};

const layers = reactive<WatermarkLayers>(props.layers ?? []);

const emit = defineEmits<{
	(ev: 'ok', layers: WatermarkLayers): void;
	(ev: 'presetOk', preset: WatermarkPreset): void;
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

	emit('cancel');
	dialog.value?.close();
}

watch(layers, async (newValue, oldValue) => {
	if (renderer != null) {
		renderer.render(layers);
	}
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

let renderer: WatermarkRenderer | null = null;
let imageBitmap: ImageBitmap | null = null;

async function initRenderer() {
	if (canvasEl.value == null) return;

	if (sampleImageType.value === '3_2') {
		renderer = new WatermarkRenderer({
			canvas: canvasEl.value,
			renderWidth: 1500,
			renderHeight: 1000,
			image: sampleImage_3_2,
		});
	} else if (sampleImageType.value === '2_3') {
		renderer = new WatermarkRenderer({
			canvas: canvasEl.value,
			renderWidth: 1000,
			renderHeight: 1500,
			image: sampleImage_2_3,
		});
	} else if (imageFile != null) {
		imageBitmap = await window.createImageBitmap(imageFile);

		const MAX_W = 1000;
		const MAX_H = 1000;
		let w = imageBitmap.width;
		let h = imageBitmap.height;

		if (w > MAX_W || h > MAX_H) {
			const scale = Math.min(MAX_W / w, MAX_H / h);
			w = Math.floor(w * scale);
			h = Math.floor(h * scale);
		}

		renderer = new WatermarkRenderer({
			canvas: canvasEl.value,
			renderWidth: w,
			renderHeight: h,
			image: imageBitmap,
		});
	}

	await renderer!.render(layers);
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
			layers: deepClone(layers),
		});
	} else {
		dialog.value?.close();
		if (renderer != null) {
			renderer.destroy();
			renderer = null;
		}

		emit('ok', layers);
	}
}

function addLayer(ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.text,
		action: () => {
			layers.push(createTextLayer());
		},
	}, {
		text: $locale.value.sfc.image,
		action: () => {
			layers.push(createImageLayer());
		},
	}, {
		text: $locale.value.sfc.qr,
		action: () => {
			layers.push(createQrLayer());
		},
	}, {
		text: $locale.value.sfc.stripe,
		action: () => {
			layers.push(createStripeLayer());
		},
	}, {
		text: $locale.value.sfc.polkadot,
		action: () => {
			layers.push(createPolkadotLayer());
		},
	}, {
		text: $locale.value.sfc.checker,
		action: () => {
			layers.push(createCheckerLayer());
		},
	}], ev.currentTarget ?? ev.target);
}

function swapUpLayer(layer: WatermarkPreset['layers'][number]) {
	const index = layers.findIndex(l => l.id === layer.id);
	if (index > 0) {
		const tmp = layers[index - 1];
		layers[index - 1] = layers[index];
		layers[index] = tmp;
	}
}

function swapDownLayer(layer: WatermarkPreset['layers'][number]) {
	const index = layers.findIndex(l => l.id === layer.id);
	if (index < layers.length - 1) {
		const tmp = layers[index + 1];
		layers[index + 1] = layers[index];
		layers[index] = tmp;
	}
}

function removeLayer(layer: WatermarkPreset['layers'][number]) {
	const index = layers.findIndex(l => l.id === layer.id);
	if (index !== -1) {
		layers.splice(index, 1);
	}
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
	"text": "نص",
	"image": "صور",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "معاينة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"quitWithoutSaveConfirm": "Sortir sense desar?",
	"failedToLoadImage": "Error en carregar la imatge",
	"name": "Nom",
	"text": "Text",
	"image": "Imatges",
	"qr": "Codi QR",
	"stripe": "Bandes",
	"polkadot": "Lunars",
	"checker": "Escacs",
	"title": "Editar la marca d'aigua ",
	"preview": "Vista prèvia"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Jméno",
	"text": "Text",
	"image": "Obrázky",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Náhled"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"text": "Text",
	"image": "Images",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Preview"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"quitWithoutSaveConfirm": "Nicht gespeicherte Änderungen verwerfen?",
	"failedToLoadImage": "Bild konnte nicht geladen werden",
	"name": "Name",
	"text": "Text",
	"image": "Bilder",
	"qr": "QR-Code",
	"stripe": "Streifen",
	"polkadot": "Punktmuster",
	"checker": "Prüfer",
	"title": "Wasserzeichen bearbeiten",
	"preview": "Vorschau"
}
</locale>

<locale locale="en-US" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"text": "Text",
	"image": "Images",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Preview"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"quitWithoutSaveConfirm": "¿Descartar cambios no guardados?",
	"failedToLoadImage": "Error al cargar la imagen",
	"name": "Nombre",
	"text": "Texto",
	"image": "Imágenes",
	"qr": "Código QR",
	"stripe": "Rayas",
	"polkadot": "Patrón de Lunares",
	"checker": "Patrón de Damas / Tablero de Ajedrez",
	"title": "Editar la marca de agua",
	"preview": "Vista previa"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Nom",
	"text": "Texte",
	"image": "Images",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Aperçu"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Nama",
	"text": "Teks",
	"image": "Gambar",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Pratinjau"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"quitWithoutSaveConfirm": "Uscire senza salvare?",
	"failedToLoadImage": "Impossibile caricare l'immagine",
	"name": "Nome",
	"text": "Testo",
	"image": "Immagini",
	"qr": "QR Code",
	"stripe": "Strisce",
	"polkadot": "A pallini",
	"checker": "Scacchiera",
	"title": "Modifica la filigrana",
	"preview": "Anteprima"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"quitWithoutSaveConfirm": "保存せずに終了しますか？",
	"failedToLoadImage": "画像の読み込みに失敗しました",
	"name": "名前",
	"text": "テキスト",
	"image": "画像",
	"qr": "二次元コード",
	"stripe": "ストライプ",
	"polkadot": "ポルカドット",
	"checker": "チェッカー",
	"title": "ウォーターマークの編集",
	"preview": "プレビュー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"quitWithoutSaveConfirm": "保存せずに終わってもええんか？",
	"failedToLoadImage": "あかん、画像読み込まれへんわ",
	"name": "名前",
	"text": "テキスト",
	"image": "画像",
	"qr": "二次元コード",
	"stripe": "ストライプ",
	"polkadot": "ポルカドット",
	"checker": "チェッカー",
	"title": "ウォーターマークの編集",
	"preview": "プレビュー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"text": "Text",
	"image": "Images",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Preview"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"text": "Text",
	"image": "Images",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Preview"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"quitWithoutSaveConfirm": "보존하지 않고 종료하시겠습니까?",
	"failedToLoadImage": "이미지 로딩에 실패했습니다.",
	"name": "이름",
	"text": "텍스트",
	"image": "이미지",
	"qr": "QR 코드",
	"stripe": "줄무늬",
	"polkadot": "물방울 무늬",
	"checker": "체크 무늬",
	"title": "워터마크 편집",
	"preview": "미리보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Naam",
	"text": "Text",
	"image": "Afbeeldingen",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Voorbeeld"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Navn",
	"text": "Tekst",
	"image": "Bilder",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Preview"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Nazwa",
	"text": "Tekst",
	"image": "Zdjęcia",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Podgląd"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"quitWithoutSaveConfirm": "Descartar mudanças?",
	"failedToLoadImage": "Failed to load image",
	"name": "Nome",
	"text": "Texto",
	"image": "imagem",
	"qr": "Código QR",
	"stripe": "Listras",
	"polkadot": "Bolinhas",
	"checker": "Xadrez",
	"title": "Editar marca d'água",
	"preview": "Pré-visualizar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Не удалось загрузить изображение",
	"name": "Название",
	"text": "Текст",
	"image": "Изображения",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Предпросмотр"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Názov",
	"text": "Text",
	"image": "Obrázky",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Náhľad"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"quitWithoutSaveConfirm": "ต้องการออกโดยไม่บันทึกหรือไม่?",
	"failedToLoadImage": "โหลดภาพล้มเหลว",
	"name": "ชื่อ",
	"text": "ข้อความ",
	"image": "รูปภาพ",
	"qr": "QR โค้ด",
	"stripe": "ริ้ว",
	"polkadot": "ลายจุด",
	"checker": "ช่องตาราง",
	"title": "แก้ไขลายน้ำ",
	"preview": "แสดงตัวอย่าง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"quitWithoutSaveConfirm": "Kaydedilmemiş değişiklikleri silmek ister misin?",
	"failedToLoadImage": "Görüntü yükleme başarısız oldu ",
	"name": "İsim",
	"text": "Metin",
	"image": "Görseller",
	"qr": "2 boyutlu kod",
	"stripe": "Çizgiler",
	"polkadot": "Nokta deseni",
	"checker": "Kontrolcü",
	"title": "Filigranı Düzenle",
	"preview": "Önizleme"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Name",
	"text": "Text",
	"image": "Images",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Preview"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Не вдалося завантажити зображення",
	"name": "Ім'я",
	"text": "Текст",
	"image": "Зображення",
	"qr": "QR-код",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Попередній перегляд"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"quitWithoutSaveConfirm": "Discard unsaved changes?",
	"failedToLoadImage": "Failed to load image",
	"name": "Tên",
	"text": "Văn bản",
	"image": "Hình ảnh",
	"qr": "QR Code",
	"stripe": "Stripes",
	"polkadot": "Polkadot",
	"checker": "Checker",
	"title": "Edit Watermark",
	"preview": "Xem trước"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"quitWithoutSaveConfirm": "放弃未保存的更改？",
	"failedToLoadImage": "图片加载失败",
	"name": "名称",
	"text": "文本",
	"image": "图片",
	"qr": "二维码",
	"stripe": "条纹",
	"polkadot": "波点",
	"checker": "检查",
	"title": "编辑水印",
	"preview": "预览"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"quitWithoutSaveConfirm": "不儲存就退出嗎？",
	"failedToLoadImage": "圖片載入失敗",
	"name": "名稱",
	"text": "文字",
	"image": "圖片",
	"qr": "二維條碼",
	"stripe": "條紋",
	"polkadot": "波卡圓點",
	"checker": "棋盤格",
	"title": "編輯浮水印",
	"preview": "預覽"
}
</locale>
