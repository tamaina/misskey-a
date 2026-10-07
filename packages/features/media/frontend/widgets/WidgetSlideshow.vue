<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-testid="mkw-slideshow" class="kvausudm _panel mkw-slideshow" :style="{ height: widgetProps.height + 'px' }">
	<div @click="choose">
		<p v-if="widgetProps.folderId == null">
			{{ $locale.sfc.folder }}
		</p>
		<p v-if="widgetProps.folderId != null && images.length === 0 && !fetching">{{ $locale.sfc.nothing }}</p>
		<div ref="slideA" class="slide a"></div>
		<div ref="slideB" class="slide b"></div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { selectDriveFolder } from '@features/drive/frontend/utility/drive.js';

const name = 'slideshow';

const widgetPropsDef = {
	height: {
		type: 'number',
		label: $locale.value.sfc.height,
		default: 300,
	},
	folderId: {
		type: 'string',
		default: null as string | null,
		hidden: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const images = ref<Misskey.entities.DriveFile[]>([]);
const fetching = ref(true);
const slideA = useTemplateRef('slideA');
const slideB = useTemplateRef('slideB');

const change = () => {
	if (images.value.length === 0 || slideA.value == null || slideB.value == null) return;

	const index = Math.floor(Math.random() * images.value.length);
	const img = `url(${ images.value[index].url })`;

	slideB.value.style.backgroundImage = img;

	slideB.value.classList.add('anime');
	window.setTimeout(() => {
		// 既にこのウィジェットがunmountされていたら要素がない
		if (slideA.value == null) return;

		slideA.value.style.backgroundImage = img;

		slideB.value!.classList.remove('anime');
	}, 1000);
};

const fetch = () => {
	if (slideA.value == null || slideB.value == null) return;
	fetching.value = true;

	misskeyApi('drive/files', {
		folderId: widgetProps.folderId,
		type: 'image/*',
		limit: 100,
	}).then(res => {
		images.value = res;
		fetching.value = false;
		slideA.value!.style.backgroundImage = '';
		slideB.value!.style.backgroundImage = '';
		change();
	});
};

const choose = () => {
	selectDriveFolder(null).then(({ folders, canceled }) => {
		if (canceled || folders[0] == null) {
			return;
		}
		widgetProps.folderId = folders[0].id;
		save();
		fetch();
	});
};

useInterval(change, 10000, {
	immediate: false,
	afterMounted: true,
});

onMounted(() => {
	if (widgetProps.folderId != null) {
		fetch();
	}
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.kvausudm {
	position: relative;

	> div {
		width: 100%;
		height: 100%;
		cursor: pointer;

		> p {
			display: block;
			margin: 1em;
			text-align: center;
			color: #888;
		}

		> * {
			pointer-events: none;
		}

		> .slide {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-size: cover;
			background-position: center;

			&.b {
				opacity: 0;
			}

			&.anime {
				transition: opacity 1s;
				opacity: 1;
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"folder": "Folder",
	"nothing": "لا يوجد شيء هنا",
	"height": "الإرتفاع"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"folder": "Carpeta ",
	"nothing": "No hi ha res per veure aquí ",
	"height": "Alçada "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"folder": "Složka ",
	"nothing": "Nic nebylo nalezeno",
	"height": "Výška"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"folder": "Folder",
	"nothing": "There's nothing to see here",
	"height": "Height"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"folder": "Ordner",
	"nothing": "Hier gibt es nichts zu sehen",
	"height": "Höhe"
}
</locale>

<locale locale="en-US" lang="json">
{
	"folder": "Folder",
	"nothing": "There's nothing to see here",
	"height": "Height"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"folder": "Carpeta",
	"nothing": "No hay nada que ver aqui",
	"height": "Altura"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"folder": "Dossier",
	"nothing": "Il n'y a rien à voir ici",
	"height": "Hauteur"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"folder": "Folder",
	"nothing": "Tidak ada sama sekali disini",
	"height": "Tinggi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"folder": "Cartella",
	"nothing": "Niente da visualizzare",
	"height": "Altezza"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"folder": "フォルダー",
	"nothing": "ありません",
	"height": "高さ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"folder": "フォルダー",
	"nothing": "あらへん",
	"height": "高さ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"folder": "Folder",
	"nothing": "There's nothing to see here",
	"height": "Height"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"folder": "Folder",
	"nothing": "There's nothing to see here",
	"height": "Height"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"folder": "폴더",
	"nothing": "아무것도 없습니다",
	"height": "높이"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"folder": "Map",
	"nothing": "Niets te zien hier",
	"height": "Hoogte"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"folder": "Folder",
	"nothing": "Ingenting",
	"height": "Høyde"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"folder": "Folder",
	"nothing": "Nie ma tu niczego",
	"height": "Wysokość"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"folder": "Pasta",
	"nothing": "Não há nada aqui",
	"height": "Altura"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"folder": "Папка",
	"nothing": "Ничего нет",
	"height": "Высота"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"folder": "Folder",
	"nothing": "Nič tu nie je",
	"height": "Výška"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"folder": "โฟลเดอร์",
	"nothing": "ไม่พบผลลัพธ์",
	"height": "ความสูง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"folder": "Dosya",
	"nothing": "Burada görülecek bir şey yok.",
	"height": "Yükseklik"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"folder": "Folder",
	"nothing": "There's nothing to see here",
	"height": "Height"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"folder": "Тека",
	"nothing": "Тут нічого немає",
	"height": "Висота"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"folder": "Thư mục",
	"nothing": "Không có gì ở đây",
	"height": "Chiều cao"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"folder": "文件夹",
	"nothing": "无",
	"height": "高度"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"folder": "資料夾",
	"nothing": "查無項目",
	"height": "高度"
}
</locale>
