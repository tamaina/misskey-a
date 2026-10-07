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
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XRoot from '@features/gallery/frontend/pages/gallery/edit.root.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';

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
	title: props.postId ? $locale.value.sfc.edit : $locale.value.sfc.postToGallery,
	icon: 'ti ti-pencil',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"edit": "التعديل",
	"postToGallery": "انشر في المعرض"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"edit": "Editar",
	"postToGallery": "Crear una nova publicació a la galeria"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"edit": "Upravit",
	"postToGallery": "Vytvořit nový příspěvek v galerii"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"edit": "Edit",
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"edit": "Bearbeiten",
	"postToGallery": "Neuen Galeriebeitrag erstellen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"edit": "Edit",
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"edit": "Editar",
	"postToGallery": "Crear una nueva publicación en la galería"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"edit": "Editer",
	"postToGallery": "Publier dans la galerie"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"edit": "Sunting",
	"postToGallery": "Posting ke galeri"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"edit": "Modifica",
	"postToGallery": "Pubblicare nella galleria"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"edit": "編集",
	"postToGallery": "ギャラリーへ投稿"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"edit": "編集",
	"postToGallery": "ギャラリーへ投稿"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"edit": "Edit",
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"edit": "Edit",
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"edit": "편집",
	"postToGallery": "갤러리에 업로드"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"edit": "Bewerken",
	"postToGallery": "Nieuw galerijbericht maken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"edit": "Rediger",
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"edit": "Edytuj",
	"postToGallery": "Opublikuj w galerii"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"edit": "Editar",
	"postToGallery": "Criar publicação em galeria"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"edit": "Изменить",
	"postToGallery": "Опубликовать в галерею"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"edit": "Upraviť",
	"postToGallery": "Vytvoriť nový príspevok v galérii"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"edit": "แก้ไข",
	"postToGallery": "สร้างโพสต์แกลเลอรี่ใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"edit": "Düzenle",
	"postToGallery": "Yeni galeri gönderisi oluştur"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"edit": "Edit",
	"postToGallery": "Create new gallery post"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"edit": "Редагувати",
	"postToGallery": "Допис у галерею"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"edit": "Sửa",
	"postToGallery": "Tạo tút có ảnh"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"edit": "编辑",
	"postToGallery": "发布相册"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"edit": "編輯",
	"postToGallery": "發佈到相簿"
}
</locale>
