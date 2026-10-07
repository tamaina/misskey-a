<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_gaps">
	<template v-if="layer.type === 'text'">
		<MkInput v-model="layer.text">
			<template #label>{{ $locale.sfc.text }}</template>
		</MkInput>

		<FormSlot>
			<template #label>{{ $locale.sfc.position }}</template>
			<MkPositionSelector
				v-model:x="layer.align.x"
				v-model:y="layer.align.y"
			></MkPositionSelector>
		</FormSlot>

		<MkRange
			:modelValue="layer.align.margin ?? 0"
			:min="0"
			:max="0.25"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
			@update:modelValue="(v) => (layer as Extract<WatermarkPreset['layers'][number], { type: 'text' }>).align.margin = v"
		>
			<template #label>{{ $locale.sfc.margin }}</template>
		</MkRange>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.angle"
			:min="-1"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.angle }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.opacity }}</template>
		</MkRange>

		<MkSwitch v-model="layer.repeat">
			<template #label>{{ $locale.sfc.repeat }}</template>
		</MkSwitch>

		<MkSwitch v-model="layerPreserveBoundingRect">
			<template #label>{{ $locale.sfc.preserveBoundingRect }}</template>
		</MkSwitch>
	</template>

	<template v-else-if="layer.type === 'image'">
		<MkButton inline rounded primary @click="chooseFile">{{ $locale.sfc.selectFile }}</MkButton>

		<FormSlot>
			<template #label>{{ $locale.sfc.position }}</template>
			<MkPositionSelector
				v-model:x="layer.align.x"
				v-model:y="layer.align.y"
			></MkPositionSelector>
		</FormSlot>

		<MkRange
			:modelValue="layer.align.margin ?? 0"
			:min="0"
			:max="0.25"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
			@update:modelValue="(v) => (layer as Extract<WatermarkPreset['layers'][number], { type: 'image' }>).align.margin = v"
		>
			<template #label>{{ $locale.sfc.margin }}</template>
		</MkRange>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.angle"
			:min="-1"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.angle }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.opacity }}</template>
		</MkRange>

		<MkSwitch v-model="layer.repeat">
			<template #label>{{ $locale.sfc.repeat }}</template>
		</MkSwitch>

		<MkSwitch v-model="layer.cover">
			<template #label>{{ $locale.sfc.cover }}</template>
		</MkSwitch>

		<MkSwitch v-model="layerPreserveBoundingRect">
			<template #label>{{ $locale.sfc.preserveBoundingRect }}</template>
		</MkSwitch>
	</template>

	<template v-else-if="layer.type === 'qr'">
		<MkInput v-model="layer.data" debounce>
			<template #label>{{ $locale.sfc.text }}</template>
			<template #caption>{{ $locale.sfc.leaveBlankToAccountUrl }}</template>
		</MkInput>

		<FormSlot>
			<template #label>{{ $locale.sfc.position }}</template>
			<MkPositionSelector
				v-model:x="layer.align.x"
				v-model:y="layer.align.y"
			></MkPositionSelector>
		</FormSlot>

		<MkRange
			:modelValue="layer.align.margin ?? 0"
			:min="0"
			:max="0.25"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
			@update:modelValue="(v) => (layer as Extract<WatermarkPreset['layers'][number], { type: 'qr' }>).align.margin = v"
		>
			<template #label>{{ $locale.sfc.margin }}</template>
		</MkRange>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.opacity }}</template>
		</MkRange>
	</template>

	<template v-else-if="layer.type === 'stripe'">
		<MkRange
			v-model="layer.frequency"
			:min="1"
			:max="30"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.stripeFrequency }}</template>
		</MkRange>

		<MkRange
			v-model="layer.threshold"
			:min="0"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.stripeWidth }}</template>
		</MkRange>

		<MkRange
			v-model="layer.angle"
			:min="-1"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.angle }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.opacity }}</template>
		</MkRange>
	</template>

	<template v-else-if="layer.type === 'polkadot'">
		<MkRange
			v-model="layer.angle"
			:min="-1"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.angle }}</template>
		</MkRange>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="10"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.majorRadius"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.polkadotMainDotRadius }}</template>
		</MkRange>

		<MkRange
			v-model="layer.majorOpacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.polkadotMainDotOpacity }}</template>
		</MkRange>

		<MkRange
			v-model="layer.minorDivisions"
			:min="0"
			:max="16"
			:step="1"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.polkadotSubDotDivisions }}</template>
		</MkRange>

		<MkRange
			v-model="layer.minorRadius"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.polkadotSubDotRadius }}</template>
		</MkRange>

		<MkRange
			v-model="layer.minorOpacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.polkadotSubDotOpacity }}</template>
		</MkRange>
	</template>

	<template v-else-if="layer.type === 'checker'">
		<MkRange
			v-model="layer.angle"
			:min="-1"
			:max="1"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.angle }}</template>
		</MkRange>

		<MkRange
			v-model="layer.scale"
			:min="0"
			:max="10"
			:step="0.01"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.scale }}</template>
		</MkRange>

		<MkRange
			v-model="layer.opacity"
			:min="0"
			:max="1"
			:step="0.01"
			:textConverter="(v) => (v * 100).toFixed(1) + '%'"
			continuousUpdate
		>
			<template #label>{{ $locale.sfc.opacity }}</template>
		</MkRange>
	</template>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import * as Misskey from 'misskey-js';
import type { WatermarkPreset } from '@features/media/frontend/utility/watermark/WatermarkRenderer.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import MkPositionSelector from '@features/ui/frontend/components/MkPositionSelector.vue';
import * as os from '@features/ui/frontend/os.js';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const layer = defineModel<WatermarkPreset['layers'][number]>('layer', { required: true });

const layerPreserveBoundingRect = computed({
	get: () => {
		if (layer.value.type === 'text' || layer.value.type === 'image') {
			return !layer.value.noBoundingBoxExpansion;
		}
		return false;
	},
	set: (v: boolean) => {
		if (layer.value.type === 'text' || layer.value.type === 'image') {
			layer.value.noBoundingBoxExpansion = !v;
		}
	},
});

const driveFile = ref<Misskey.entities.DriveFile | null>(null);
const driveFileError = ref(false);
onMounted(async () => {
	if (layer.value.type === 'image' && layer.value.imageId != null) {
		await misskeyApi('drive/files/show', {
			fileId: layer.value.imageId,
		}).then((res) => {
			driveFile.value = res;
		}).catch((err) => {
			driveFileError.value = true;
		});
	}
});

function chooseFile(ev: PointerEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
		label: $locale.value.sfc.selectFile,
		features: {
			watermark: false,
		},
	}).then((file) => {
		if (layer.value.type !== 'image') return;
		if (!file.type.startsWith('image')) {
			os.alert({
				type: 'warning',
				title: $locale.value.sfc.driveFileTypeWarn,
				text: $locale.value.sfc.driveFileTypeWarnDescription,
			});
			return;
		}

		layer.value.imageId = file.id;
		layer.value.imageUrl = file.url;
		driveFileError.value = false;
	});
}
</script>

<style module>
.root {

}
</style>

<locale locale="ar-SA" lang="json">
{
	"selectFile": "اختر ملفًا",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "نص",
	"position": "الموضع",
	"margin": "Margin",
	"scale": "الحجم",
	"angle": "Angle",
	"opacity": "الشفافية",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"selectFile": "Selecciona un fitxer",
	"driveFileTypeWarn": "Aquest arxiu no és compatible",
	"driveFileTypeWarnDescription": "Selecciona un arxiu d'imatge ",
	"text": "Text",
	"position": "Posició ",
	"margin": "Marge",
	"scale": "Mida",
	"angle": "Angle",
	"opacity": "Opacitat",
	"repeat": "Repetir",
	"preserveBoundingRect": "Ajusta'l per evitar que sobresortir en fer la rotació ",
	"cover": "Cobrir-ho tot",
	"leaveBlankToAccountUrl": "Si deixes aquest camp buit, es farà servir l'URL del teu compte",
	"stripeFrequency": "Freqüència de la banda",
	"stripeWidth": "Amplada de la banda",
	"polkadotMainDotRadius": "Mida del lunar principal",
	"polkadotMainDotOpacity": "Opacitat del lunar principal",
	"polkadotSubDotDivisions": "Nombre de punts secundaris",
	"polkadotSubDotRadius": "Mida del lunar secundari",
	"polkadotSubDotOpacity": "Opacitat del lunar secundari"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"selectFile": "Vybrat soubor",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Text",
	"position": "Pozice",
	"margin": "Margin",
	"scale": "Velikost",
	"angle": "Angle",
	"opacity": "Průhlednost",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"selectFile": "Select a file",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Text",
	"position": "Position",
	"margin": "Margin",
	"scale": "Size",
	"angle": "Angle",
	"opacity": "Opacity",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"selectFile": "Datei auswählen",
	"driveFileTypeWarn": "Diese Datei wird nicht unterstützt",
	"driveFileTypeWarnDescription": "Bilddatei auswählen",
	"text": "Text",
	"position": "Position",
	"margin": "Abstand",
	"scale": "Größe",
	"angle": "Winkel",
	"opacity": "Transparenz",
	"repeat": "Wiederholen",
	"preserveBoundingRect": "So einstellen, dass beim Drehen nichts herausragt",
	"cover": "Alles bedecken",
	"leaveBlankToAccountUrl": "Wenn Sie es leer lassen, wird das Profilbild des Kontos verwendet.",
	"stripeFrequency": "Linienanzahl",
	"stripeWidth": "Linienbreite",
	"polkadotMainDotRadius": "Größe des Hauptpunktes",
	"polkadotMainDotOpacity": "Deckkraft des Hauptpunktes",
	"polkadotSubDotDivisions": "Anzahl der Unterpunkte",
	"polkadotSubDotRadius": "Größe des Unterpunktes",
	"polkadotSubDotOpacity": "Deckkraft des Unterpunktes"
}
</locale>

<locale locale="en-US" lang="json">
{
	"selectFile": "Select a file",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Text",
	"position": "Position",
	"margin": "Margin",
	"scale": "Size",
	"angle": "Angle",
	"opacity": "Opacity",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"selectFile": "Elegir archivo",
	"driveFileTypeWarn": "Este archivo es incompatible",
	"driveFileTypeWarnDescription": "Elegir una imagen",
	"text": "Texto",
	"position": "Posición",
	"margin": "Margen",
	"scale": "Tamaño",
	"angle": "Ángulo",
	"opacity": "Opacidad",
	"repeat": "Repetir",
	"preserveBoundingRect": "Ajuste para evitar que se desborde al rotar.",
	"cover": "Cubrir todo",
	"leaveBlankToAccountUrl": "Si dejas este campo en blanco, se utilizará la URL de tu cuenta.",
	"stripeFrequency": "Número de líneas.",
	"stripeWidth": "Anchura de línea",
	"polkadotMainDotRadius": "Tamaño del círculo principal.",
	"polkadotMainDotOpacity": "Opacidad del círculo principal",
	"polkadotSubDotDivisions": "Número de subpuntos.",
	"polkadotSubDotRadius": "Tamaño del círculo secundario.",
	"polkadotSubDotOpacity": "Opacidad del círculo secundario"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"selectFile": "Choisir le fichier",
	"driveFileTypeWarn": "Ce fichier n'est pas pris en charge",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Texte",
	"position": "Position",
	"margin": "Margin",
	"scale": "Taille",
	"angle": "Angle",
	"opacity": "Transparence",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"selectFile": "Pilih berkas",
	"driveFileTypeWarn": "Berkas ini tidak didukung",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Teks",
	"position": "Posisi",
	"margin": "Margin",
	"scale": "Ukuran",
	"angle": "Sudut",
	"opacity": "Opasitas",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"selectFile": "Scelta allegato",
	"driveFileTypeWarn": "Formato file non supportato",
	"driveFileTypeWarnDescription": "Per favore seleziona un file immagine",
	"text": "Testo",
	"position": "Posizione",
	"margin": "Margine",
	"scale": "Dimensioni",
	"angle": "Angolo",
	"opacity": "Opacità",
	"repeat": "Disposizione",
	"preserveBoundingRect": "Fai in modo da non eccedere durante la rotazione",
	"cover": "Coprire tutto",
	"leaveBlankToAccountUrl": "Il valore vuoto indica la URL dell'account",
	"stripeFrequency": "Il numero di linee",
	"stripeWidth": "Larghezza della linea",
	"polkadotMainDotRadius": "Dimensione del punto principale",
	"polkadotMainDotOpacity": "Opacità del punto principale",
	"polkadotSubDotDivisions": "Quantità di punti secondari",
	"polkadotSubDotRadius": "Dimensione del punto secondario",
	"polkadotSubDotOpacity": "Opacità del punto secondario"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"selectFile": "ファイルを選択",
	"driveFileTypeWarn": "このファイルは対応していません",
	"driveFileTypeWarnDescription": "画像ファイルを選択してください",
	"text": "テキスト",
	"position": "位置",
	"margin": "マージン",
	"scale": "サイズ",
	"angle": "角度",
	"opacity": "不透明度",
	"repeat": "敷き詰める",
	"preserveBoundingRect": "回転時はみ出ないように調整する",
	"cover": "全体に被せる",
	"leaveBlankToAccountUrl": "空欄にするとアカウントのURLになります",
	"stripeFrequency": "ラインの数",
	"stripeWidth": "ラインの幅",
	"polkadotMainDotRadius": "メインドットの大きさ",
	"polkadotMainDotOpacity": "メインドットの不透明度",
	"polkadotSubDotDivisions": "サブドットの数",
	"polkadotSubDotRadius": "サブドットの大きさ",
	"polkadotSubDotOpacity": "サブドットの不透明度"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"selectFile": "ファイル選んでや",
	"driveFileTypeWarn": "このファイルは対応しとらへん",
	"driveFileTypeWarnDescription": "画像ファイルを選んでや",
	"text": "テキスト",
	"position": "位置",
	"margin": "マージン",
	"scale": "大きさ",
	"angle": "角度",
	"opacity": "不透明度",
	"repeat": "敷き詰める",
	"preserveBoundingRect": "回転時はみ出ないように調整する",
	"cover": "全体に被せる",
	"leaveBlankToAccountUrl": "空欄にするとアカウントのURLになります",
	"stripeFrequency": "ラインの数",
	"stripeWidth": "ラインの幅",
	"polkadotMainDotRadius": "メインドットの大きさ",
	"polkadotMainDotOpacity": "メインドットの不透明度",
	"polkadotSubDotDivisions": "サブドットの数",
	"polkadotSubDotRadius": "サブドットの大きさ",
	"polkadotSubDotOpacity": "サブドットの不透明度"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"selectFile": "Select a file",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Text",
	"position": "Position",
	"margin": "Margin",
	"scale": "Size",
	"angle": "Angle",
	"opacity": "Opacity",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"selectFile": "Select a file",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Text",
	"position": "Position",
	"margin": "Margin",
	"scale": "Size",
	"angle": "Angle",
	"opacity": "Opacity",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"selectFile": "파일 선택",
	"driveFileTypeWarn": "이 파이",
	"driveFileTypeWarnDescription": "이미지 파일을 선택해주십시오.",
	"text": "텍스트",
	"position": "위치",
	"margin": "여백",
	"scale": "크기",
	"angle": "각도",
	"opacity": "불투명도",
	"repeat": "전면에 깔기",
	"preserveBoundingRect": "회전 시 빠져나오지 않도록 조정",
	"cover": "전체에 붙이기",
	"leaveBlankToAccountUrl": "빈칸일 경우 계정의 URL로 됩니다.",
	"stripeFrequency": "라인의 수",
	"stripeWidth": "라인의 폭",
	"polkadotMainDotRadius": "주요 물방울의 크기",
	"polkadotMainDotOpacity": "주요 물방울의 불투명도",
	"polkadotSubDotDivisions": "서브 물방울의 수",
	"polkadotSubDotRadius": "서브 물방울의 크기",
	"polkadotSubDotOpacity": "서브 물방울의 불투명도"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"selectFile": "Kies een bestand",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Text",
	"position": "Position",
	"margin": "Margin",
	"scale": "Size",
	"angle": "Angle",
	"opacity": "Opacity",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"selectFile": "Velg en fil",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Tekst",
	"position": "Position",
	"margin": "Margin",
	"scale": "Størrelse",
	"angle": "Angle",
	"opacity": "Opacity",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"selectFile": "Wybierz plik",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Tekst",
	"position": "Position",
	"margin": "Margin",
	"scale": "Rozmiar",
	"angle": "Angle",
	"opacity": "Przezroczystość",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"selectFile": "Selecione os arquivos",
	"driveFileTypeWarn": "Esse arquivo não é compatível",
	"driveFileTypeWarnDescription": "Escolha um arquivo de imagem",
	"text": "Texto",
	"position": "Posição",
	"margin": "Margem",
	"scale": "Tamanho",
	"angle": "Ângulo",
	"opacity": "Opacidade",
	"repeat": "Espalhar pelo conteúdo",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cobrir tudo",
	"leaveBlankToAccountUrl": "Deixe em branco para utilizar URL da conta",
	"stripeFrequency": "Número de linhas",
	"stripeWidth": "Largura da linha",
	"polkadotMainDotRadius": "Raio da bolinha principal",
	"polkadotMainDotOpacity": "Opacidade da bolinha principal",
	"polkadotSubDotDivisions": "Número de bolinhas adicionais",
	"polkadotSubDotRadius": "Raio das bolinhas adicionais",
	"polkadotSubDotOpacity": "Opacidade da bolinha secundária"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"selectFile": "Выберите файл",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Текст",
	"position": "Позиция",
	"margin": "Margin",
	"scale": "Размер",
	"angle": "Угол",
	"opacity": "Непрозрачность",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"selectFile": "Vyberte súbor",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Text",
	"position": "Position",
	"margin": "Margin",
	"scale": "Veľkosť",
	"angle": "Angle",
	"opacity": "Priehľadnosť",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"selectFile": "เลือกไฟล์",
	"driveFileTypeWarn": "ไม่รองรับไฟล์นี้",
	"driveFileTypeWarnDescription": "กรุณาเลือกไฟล์ภาพ",
	"text": "ข้อความ",
	"position": "ตำแหน่ง",
	"margin": "ระยะขอบ",
	"scale": "ขนาด",
	"angle": "แองเกิล",
	"opacity": "ความทึบแสง",
	"repeat": "ปูให้เต็มพื้นที่",
	"preserveBoundingRect": "ปรับไม่ให้ล้นขอบเมื่อหมุน",
	"cover": "ซ้อนทับทั่วทั้งพื้นที่",
	"leaveBlankToAccountUrl": "เว้นว่างไว้หากต้องการใช้ URL ของบัญชีแทน",
	"stripeFrequency": "จำนวนเส้น",
	"stripeWidth": "ความกว้างเส้น",
	"polkadotMainDotRadius": "ขนาดของจุดหลัก",
	"polkadotMainDotOpacity": "ความทึบของจุดหลัก",
	"polkadotSubDotDivisions": "จำนวนจุดรอง",
	"polkadotSubDotRadius": "ขนาดของจุดรอง",
	"polkadotSubDotOpacity": "ความทึบของจุดรอง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"selectFile": "Dosya seçin",
	"driveFileTypeWarn": "Bu dosya desteklenmiyor",
	"driveFileTypeWarnDescription": "Bir görüntü dosyası seçin",
	"text": "Metin",
	"position": "Pozisyon",
	"margin": "Kenar",
	"scale": "Boyut",
	"angle": "Açı",
	"opacity": "Opaklık",
	"repeat": "her yere yayılmış",
	"preserveBoundingRect": "Döndürme sırasında dışarı çıkmayacak şekilde ayarlayın.",
	"cover": "Her şeyi örtün",
	"leaveBlankToAccountUrl": "Boş bırakılması durumunda hesap URL'si görüntülenecektir.",
	"stripeFrequency": "Satır sayısı",
	"stripeWidth": "Çizgi genişliği",
	"polkadotMainDotRadius": "Ana noktanın boyutu",
	"polkadotMainDotOpacity": "Ana noktanın opaklığı",
	"polkadotSubDotDivisions": "Alt nokta sayısı.",
	"polkadotSubDotRadius": "İkincil noktanın boyutu",
	"polkadotSubDotOpacity": "İkincil noktanın opaklığı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"selectFile": "Select a file",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Text",
	"position": "Position",
	"margin": "Margin",
	"scale": "Size",
	"angle": "Angle",
	"opacity": "Opacity",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"selectFile": "Вибрати файл",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Текст",
	"position": "Позиція",
	"margin": "Margin",
	"scale": "Розмір",
	"angle": "Кут",
	"opacity": "Непрозорість",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"selectFile": "Chọn tập tin",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Choose an image file",
	"text": "Văn bản",
	"position": "Vị trí",
	"margin": "Margin",
	"scale": "Kích thước",
	"angle": "Góc",
	"opacity": "Độ trong suốt",
	"repeat": "spread all over",
	"preserveBoundingRect": "Adjust to prevent overflow when rotating",
	"cover": "Cover everything",
	"leaveBlankToAccountUrl": "Leave blank to use account URL",
	"stripeFrequency": "Lines count",
	"stripeWidth": "Line width",
	"polkadotMainDotRadius": "Size of the main dot",
	"polkadotMainDotOpacity": "Opacity of the main dot",
	"polkadotSubDotDivisions": "Number of sub-dots.",
	"polkadotSubDotRadius": "Size of the secondary dot",
	"polkadotSubDotOpacity": "Opacity of the secondary dot"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"selectFile": "选择文件",
	"driveFileTypeWarn": "不支持此文件",
	"driveFileTypeWarnDescription": "请选择图像文件",
	"text": "文本",
	"position": "位置",
	"margin": "边距",
	"scale": "大小",
	"angle": "角度",
	"opacity": "不透明度",
	"repeat": "平铺",
	"preserveBoundingRect": "调整为旋转时不超出范围",
	"cover": "覆盖所有",
	"leaveBlankToAccountUrl": "留空则为账户 URL",
	"stripeFrequency": "线条数量",
	"stripeWidth": "线条宽度",
	"polkadotMainDotRadius": "主波点的大小",
	"polkadotMainDotOpacity": "主波点的不透明度",
	"polkadotSubDotDivisions": "副波点的数量",
	"polkadotSubDotRadius": "副波点的大小",
	"polkadotSubDotOpacity": "副波点的不透明度"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"selectFile": "選擇檔案",
	"driveFileTypeWarn": "不支援此檔案",
	"driveFileTypeWarnDescription": "請選擇圖片檔案",
	"text": "文字",
	"position": "位置",
	"margin": "邊界",
	"scale": "大小",
	"angle": "角度",
	"opacity": "透明度",
	"repeat": "佈局",
	"preserveBoundingRect": "調整使其在旋轉時不會突出",
	"cover": "覆蓋整體",
	"leaveBlankToAccountUrl": "若留空則使用帳戶的 URL",
	"stripeFrequency": "線條數量",
	"stripeWidth": "線條寬度",
	"polkadotMainDotRadius": "主圓點的尺寸",
	"polkadotMainDotOpacity": "主圓點的不透明度",
	"polkadotSubDotDivisions": "子圓點的數量",
	"polkadotSubDotRadius": "子圓點的尺寸",
	"polkadotSubDotOpacity": "子圓點的不透明度"
}
</locale>
