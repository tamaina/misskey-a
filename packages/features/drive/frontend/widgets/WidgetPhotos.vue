<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent" :class="$style.root" :data-transparent="widgetProps.transparent ? true : null" data-testid="mkw-photos" class="mkw-photos">
	<template #icon><i class="ti ti-camera"></i></template>
	<template #header>{{ $locale.sfc.photos }}</template>

	<div class="">
		<MkLoading v-if="fetching"/>
		<div v-else :class="$style.stream">
			<div
				v-for="(image, i) in images" :key="i"
				:class="$style.img"
				:style="{ backgroundImage: `url(${thumbnail(image)})` }"
			></div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import { useStream } from '@features/api/frontend/stream.js';
import { getStaticImageUrl } from '@features/drive/frontend/utility/media-proxy.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';

const name = 'photos';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: true,
	},
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.transparent,
		default: false,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const connection = useStream().useChannel('main');
const images = ref<Misskey.entities.DriveFile[]>([]);
const fetching = ref(true);

function onDriveFileCreated(file: Misskey.entities.DriveFile) {
	if (/^image\/.+$/.test(file.type)) {
		images.value.unshift(file);
		if (images.value.length > 9) images.value.pop();
	}
}

const thumbnail = (image: Misskey.entities.DriveFile): string => {
	return prefer.s.disableShowingAnimatedImages
		? getStaticImageUrl(image.url)
		: image.thumbnailUrl ?? image.url;
};

misskeyApi('drive/stream', {
	type: 'image/*',
	limit: 9,
}).then(res => {
	images.value = res;
	fetching.value = false;
});

connection.on('driveFileCreated', onDriveFileCreated);
onUnmounted(() => {
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root[data-transparent] {
	.stream {
		padding: 0;
	}

	.img {
		border: solid 4px transparent;
		border-radius: 8px;
	}
}

.stream {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	padding: 8px;

	.img {
		flex: 1 1 33%;
		width: 33%;
		height: 80px;
		box-sizing: border-box;
		background-position: center center;
		background-size: cover;
		background-clip: content-box;
		border: solid 2px transparent;
		border-radius: 4px;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"photos": "الصور",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"photos": "Fotografies",
	"showHeader": "Mostrar la capçalera",
	"transparent": "Fons transparent"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"photos": "Fotky",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"photos": "Photos",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"photos": "Fotos",
	"showHeader": "Kopfzeile anzeigen",
	"transparent": "Hintergrund transparent machen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"photos": "Photos",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"photos": "Fotos",
	"showHeader": "Mostrar encabezados",
	"transparent": "Hacer fondo transparente"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"photos": "Photos",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"photos": "Foto",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"photos": "Foto",
	"showHeader": "Mostra la testata",
	"transparent": "Sfondo trasparente"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"photos": "フォト",
	"showHeader": "ヘッダーを表示",
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"photos": "フォト",
	"showHeader": "ヘッダー出す",
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"photos": "Photos",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"photos": "Photos",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"photos": "사진",
	"showHeader": "해더를 표시",
	"transparent": "배경을 투명하게 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"photos": "Photos",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"photos": "Bilder",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"photos": "Zdjęcia",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"photos": "Fotos",
	"showHeader": "Exibir cabeçalho",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"photos": "Фото",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"photos": "Fotky",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"photos": "รูปภาพ",
	"showHeader": "แสดงส่วนหัว",
	"transparent": "ทำพื้นหลังโปรงใส"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"photos": "Fotoğraflar",
	"showHeader": "Başlığı göster",
	"transparent": "Arka planı şeffaf yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"photos": "Photos",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"photos": "Фото",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"photos": "Kho ảnh",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"photos": "照片",
	"showHeader": "显示标题",
	"transparent": "使背景透明"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"photos": "照片",
	"showHeader": "檢視標頭 ",
	"transparent": "使背景透明"
}
</locale>
