<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSuspense v-slot="{ result }" :p="_fetch_">
	<XRoot :post="result"/>
</MkSuspense>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XRoot from '@features/collections/frontend/pages/gallery/edit.root.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	postId?: string,
}>();

function _fetch_() {
	if (props.postId == null) {
		return Promise.resolve(null);
	} else {
		return misskeyApi('gallery/posts/show', {
			postId: props.postId,
		});
	}
}

definePage(() => ({
	title: props.postId ? globalLocale.value.env.edit : $locale.value.sfc.postToGallery,
	icon: 'ti ti-pencil',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"postToGallery": "انشر في المعرض"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"postToGallery": "Crear una nova publicació a la galeria"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"postToGallery": "Vytvořit nový příspěvek v galerii"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"postToGallery": "Neuen Galeriebeitrag erstellen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"postToGallery": "Crear una nueva publicación en la galería"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"postToGallery": "Publier dans la galerie"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"postToGallery": "Posting ke galeri"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"postToGallery": "Pubblicare nella galleria"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"postToGallery": "ギャラリーへ投稿"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"postToGallery": "ギャラリーへ投稿"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"postToGallery": "갤러리에 업로드"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"postToGallery": "Nieuw galerijbericht maken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"postToGallery": "Opublikuj w galerii"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"postToGallery": "Criar publicação em galeria"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"postToGallery": "Опубликовать в галерею"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"postToGallery": "Vytvoriť nový príspevok v galérii"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"postToGallery": "สร้างโพสต์แกลเลอรี่ใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"postToGallery": "Yeni galeri gönderisi oluştur"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"postToGallery": "Допис у галерею"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"postToGallery": "Tạo tút có ảnh"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"postToGallery": "发布相册"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"postToGallery": "發佈到相簿"
}
</locale>
