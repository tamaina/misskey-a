<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :defaultOpen="false" :canPage="false">
	<template #icon><i class="ti ti-pencil"></i></template>
	<template #label>{{ $locale.sfc.preset }}: {{ preset.name === '' ? '(' + $locale.sfc.noName + ')' : preset.name }}</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="edit"><i class="ti ti-pencil"></i> {{ $locale.sfc.edit }}</MkButton>
			<MkButton danger iconOnly style="margin-left: auto;" @click="del"><i class="ti ti-trash"></i></MkButton>
		</div>
	</template>

	<div>
		<canvas ref="canvasEl" :class="$style.previewCanvas"></canvas>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import type { ImageFramePreset } from '@features/media/frontend/utility/image-frame-renderer/ImageFrameRenderer.js';
import { ImageFrameRenderer } from '@features/media/frontend/utility/image-frame-renderer/ImageFrameRenderer.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';

const props = defineProps<{
	preset: ImageFramePreset;
}>();

const emit = defineEmits<{
	(ev: 'updatePreset', preset: ImageFramePreset): void,
	(ev: 'del'): void,
}>();

async function edit() {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@features/media/frontend/components/MkImageFrameEditorDialog.vue')), {
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
		text: $locale.value.sfc.delete,
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
	"preset": "إعدادات مسبقة",
	"noName": "No name",
	"edit": "التعديل",
	"delete": "حذف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"preset": "Predefinit",
	"noName": "No hi ha un nom disponible ",
	"edit": "Editar",
	"delete": "Elimina"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"preset": "Předvolba",
	"noName": "No name",
	"edit": "Upravit",
	"delete": "Smazat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"preset": "Preset",
	"noName": "No name",
	"edit": "Edit",
	"delete": "Delete"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"preset": "Vorlage",
	"noName": "Kein Name",
	"edit": "Bearbeiten",
	"delete": "Löschen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"preset": "Preset",
	"noName": "No name",
	"edit": "Edit",
	"delete": "Delete"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"preset": "Predefinido",
	"noName": "No hay nombre.",
	"edit": "Editar",
	"delete": "Borrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"preset": "Préréglage",
	"noName": "No name",
	"edit": "Editer",
	"delete": "Supprimer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"preset": "Prasetel",
	"noName": "Tidak ada nama",
	"edit": "Sunting",
	"delete": "Hapus"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"preset": "Preimpostato",
	"noName": "Senza nome",
	"edit": "Modifica",
	"delete": "Elimina"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"preset": "プリセット",
	"noName": "名前はありません",
	"edit": "編集",
	"delete": "削除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"preset": "プリセット",
	"noName": "名前はあらへんで",
	"edit": "編集",
	"delete": "ほかす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"preset": "Preset",
	"noName": "No name",
	"edit": "Edit",
	"delete": "Kkes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"preset": "Preset",
	"noName": "No name",
	"edit": "Edit",
	"delete": "ಅಳಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"preset": "프리셋",
	"noName": "이름이 없습니다.",
	"edit": "편집",
	"delete": "삭제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"preset": "Preset",
	"noName": "No name",
	"edit": "Bewerken",
	"delete": "Verwijderen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"preset": "Preset",
	"noName": "No name",
	"edit": "Rediger",
	"delete": "Slett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"preset": "Konfiguracja",
	"noName": "No name",
	"edit": "Edytuj",
	"delete": "Usuń"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"preset": "Predefinições",
	"noName": "Sem nome",
	"edit": "Editar",
	"delete": "Excluir"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"preset": "Шаблоны",
	"noName": "Имя не указано",
	"edit": "Изменить",
	"delete": "Удалить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"preset": "Preset",
	"noName": "No name",
	"edit": "Upraviť",
	"delete": "Odstrániť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"preset": "พรีเซ็ต",
	"noName": "ไม่มีชื่อ",
	"edit": "แก้ไข",
	"delete": "ลบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"preset": "Ön ayar",
	"noName": "İsim yok",
	"edit": "Düzenle",
	"delete": "Sil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"preset": "Preset",
	"noName": "No name",
	"edit": "Edit",
	"delete": "ئۆچۈرۈش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"preset": "Пресет",
	"noName": "Ім'я не вказано",
	"edit": "Редагувати",
	"delete": "Видалити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"preset": "Mẫu thiết lập",
	"noName": "No name",
	"edit": "Sửa",
	"delete": "Xóa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"preset": "预设值",
	"noName": "未命名",
	"edit": "编辑",
	"delete": "删除"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"preset": "預設值",
	"noName": "沒有名稱",
	"edit": "編輯",
	"delete": "刪除"
}
</locale>
