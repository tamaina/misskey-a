<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.isSelected]: isSelected }]"
	draggable="true"
	:title="title"
	@contextmenu.stop="onContextmenu"
	@dragstart="onDragstart"
	@dragend="onDragend"
>
	<div style="pointer-events: none;">
		<div v-if="$i?.avatarId == file.id" :class="[$style.label]">
			<img :class="$style.labelImg" src="/client-assets/label.svg"/>
			<p :class="$style.labelText">{{ $locale.sfc.avatar }}</p>
		</div>
		<div v-if="$i?.bannerId == file.id" :class="[$style.label]">
			<img :class="$style.labelImg" src="/client-assets/label.svg"/>
			<p :class="$style.labelText">{{ $locale.sfc.banner }}</p>
		</div>
		<div v-if="file.isSensitive" :class="[$style.label, $style.red]">
			<img :class="$style.labelImg" src="/client-assets/label-red.svg"/>
			<p :class="$style.labelText">{{ $locale.sfc.sensitive }}</p>
		</div>

		<MkDriveFileThumbnail :class="$style.thumbnail" :file="file" fit="contain"/>

		<p :class="$style.name">
			<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name }}</span>
			<span v-if="file.name.lastIndexOf('.') != -1" style="opacity: 0.5;">{{ file.name.substring(file.name.lastIndexOf('.')) }}</span>
		</p>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';
import bytes from '@features/ui/frontend/filters/bytes.js';
import * as os from '@/os.js';
import { $i } from '@/i.js';
import { getDriveFileMenu } from '@features/drive/frontend/utility/get-drive-file-menu.js';
import { setDragData } from '@/drag-and-drop.js';

const props = withDefaults(defineProps<{
	file: Misskey.entities.DriveFile;
	folder: Misskey.entities.DriveFolder | null;
	isSelected?: boolean;
}>(), {
	isSelected: false,
});

const emit = defineEmits<{
	(ev: 'dragstart', dragEvent: DragEvent): void;
	(ev: 'dragend'): void;
}>();

const isDragging = ref(false);

const title = computed(() => `${props.file.name}\n${props.file.type} ${bytes(props.file.size)}`);

function onContextmenu(ev: PointerEvent) {
	os.contextMenu(getDriveFileMenu(props.file, props.folder), ev);
}

function onDragstart(ev: DragEvent) {
	if (ev.dataTransfer) {
		ev.dataTransfer.effectAllowed = 'move';
		setDragData(ev, 'driveFiles', [props.file]);
	}
	isDragging.value = true;

	emit('dragstart', ev);
}

function onDragend() {
	isDragging.value = false;
	emit('dragend');
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	padding: 8px 0 0 0;
	min-height: 180px;
	border-radius: 8px;
	cursor: pointer;

	&:hover {
		background: rgba(#000, 0.05);

		.label {
			&::before,
			&::after {
				background: #0b65a5;
			}

			&.red {
				&::before,
				&::after {
					background: #c12113;
				}
			}
		}
	}

	&:active {
		background: rgba(#000, 0.1);

		.label {
			&::before,
			&::after {
				background: #0b588c;
			}

			&.red {
				&::before,
				&::after {
					background: #ce2212;
				}
			}
		}
	}

	&.isSelected {
		background: var(--MI_THEME-accent);

		&:hover {
			background: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
		}

		&:active {
			background: hsl(from var(--MI_THEME-accent) h s calc(l - 10));
		}

		.label {
			&::before,
			&::after {
				display: none;
			}
		}

		.name {
			color: var(--MI_THEME-fgOnAccent);
		}

		.thumbnail {
			color: var(--MI_THEME-fgOnAccent);
		}
	}
}

.label {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;

	&::before,
	&::after {
		content: "";
		display: block;
		position: absolute;
		z-index: 1;
		background: #0c7ac9;
	}

	&::before {
		top: 0;
		left: 57px;
		width: 28px;
		height: 8px;
	}

	&::after {
		top: 57px;
		left: 0;
		width: 8px;
		height: 28px;
	}

	&.red {
		&::before,
		&::after {
			background: #c12113;
		}
	}
}

.labelImg {
	position: absolute;
	z-index: 2;
	top: 0;
	left: 0;
}

.labelText {
	position: absolute;
	z-index: 3;
	top: 19px;
	left: -28px;
	width: 120px;
	margin: 0;
	text-align: center;
	line-height: 28px;
	color: #fff;
	transform: rotate(-45deg);
}

.thumbnail {
	width: 110px;
	height: 110px;
	margin: auto;
}

.name {
	display: block;
	margin: 8px 0 0 0;
	padding: 0 2px;
	font-size: 82%;
	text-align: center;
	word-break: break-all;
	color: var(--MI_THEME-fg);
	overflow: hidden;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "avatar": "الصورة الرمزية",
  "banner": "الصورة الرأسية",
  "sensitive": "محتوى حساس"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "avatar": "Icona",
  "banner": "Bàner",
  "sensitive": "Sensible"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "avatar": "Avatar",
  "banner": "Baner",
  "sensitive": "NSFW"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Sensitive"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "avatar": "Profilbild",
  "banner": "Banner",
  "sensitive": "Sensibel"
}
</locale>

<locale locale="en-US" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Sensitive"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Marcado como sensible (NSFW)"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "avatar": "Avatar",
  "banner": "Bannière",
  "sensitive": "Contenu sensible"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Konten sensitif"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "avatar": "Foto del profilo",
  "banner": "Intestazione",
  "sensitive": "Esplicito"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "avatar": "アイコン",
  "banner": "バナー",
  "sensitive": "センシティブ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "avatar": "アイコン",
  "banner": "バナー",
  "sensitive": "気いつけて見いや"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Sensitive"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Sensitive"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "avatar": "아바타",
  "banner": "배너",
  "sensitive": "열람 주의"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "NSFW"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Sensitive"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "avatar": "Awatar",
  "banner": "Baner",
  "sensitive": "NSFW"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "avatar": "Avatar",
  "banner": "Capa",
  "sensitive": "Conteúdo sensível"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "avatar": "Аватар",
  "banner": "Шапка",
  "sensitive": "Содержимое не для всех"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "avatar": "Avatar",
  "banner": "BAnner",
  "sensitive": "NSFW"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "avatar": "ไอคอน",
  "banner": "แบนเนอร์",
  "sensitive": "เนื้อหาที่ละเอียดอ่อน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Hassas"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "avatar": "Avatar",
  "banner": "Banner",
  "sensitive": "Sensitive"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "avatar": "Аватар",
  "banner": "Банер",
  "sensitive": "NSFW"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "avatar": "Ảnh đại diện",
  "banner": "Ảnh bìa",
  "sensitive": "Nhạy cảm"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "avatar": "头像",
  "banner": "横幅",
  "sensitive": "敏感内容"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "avatar": "大頭貼",
  "banner": "橫幅",
  "sensitive": "敏感內容"
}
</locale>
