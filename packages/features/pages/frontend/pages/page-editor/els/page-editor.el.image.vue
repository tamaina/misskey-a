<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" :dragStartCallback="dragStartCallback" @remove="() => emit('remove')">
	<template #header><i class="ti ti-photo"></i> {{ $locale.sfc.image }}</template>
	<template #func>
		<button @click="choose()">
			<i class="ti ti-folder"></i>
		</button>
	</template>

	<section>
		<MkDriveFileThumbnail v-if="file" style="height: 150px;" :file="file" fit="contain" @click="choose()"/>
	</section>
</XContainer>
</template>

<script lang="ts" setup>

import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '@features/pages/frontend/pages/page-editor/page-editor.container.vue';
import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';

const props = defineProps<{
	dragStartCallback?: (ev: DragEvent) => void;
	modelValue: Misskey.entities.PageBlock & { type: 'image' };
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'image' }): void;
	(ev: 'remove'): void;
}>();

const file = ref<Misskey.entities.DriveFile | null>(null);

async function choose() {
	chooseDriveFile({ multiple: false }).then((fileResponse) => {
		file.value = fileResponse[0];
		emit('update:modelValue', {
			...props.modelValue,
			fileId: file.value.id,
		});
	});
}

onMounted(async () => {
	if (props.modelValue.fileId == null) {
		await choose();
	} else {
		misskeyApi('drive/files/show', {
			fileId: props.modelValue.fileId,
		}).then(fileResponse => {
			file.value = fileResponse;
		});
	}
});
</script>

<locale locale="ar-SA" lang="json">
{
  "image": "صور"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "image": "Imatges"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "image": "Obrázky"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "image": "Images"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "image": "Bild"
}
</locale>

<locale locale="en-US" lang="json">
{
  "image": "Images"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "image": "Imagen"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "image": "Images"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "image": "Gambar"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "image": "Immagini"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "image": "画像"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "image": "画像"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "image": "Images"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "image": "Images"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "image": "이미지"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "image": "Afbeeldingen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "image": "Bilde"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "image": "Zdjęcia"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "image": "imagem"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "image": "Изображения"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "image": "Obrázky"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "image": "รูปภาพ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "image": "Görseller"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "image": "Images"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "image": "Зображення"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "image": "Hình ảnh"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "image": "图片"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "image": "圖片"
}
</locale>
