<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button class="_button" :class="$style.root" @click="menu">
	<img :src="emoji.url" :class="$style.img" loading="lazy"/>
	<div :class="$style.body">
		<div :class="$style.name" class="_monospace">{{ emoji.name }}</div>
		<div :class="$style.info">{{ emoji.aliases.join(' ') }}</div>
	</div>
</button>
</template>

<script lang="ts" setup>
import type { EmojiSimple } from '../contract/index.js';
import type { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import MkCustomEmojiDetailedDialog from '@features/emojis/frontend/components/MkCustomEmojiDetailedDialog.vue';
import { $i } from '@/i.js';

const props = defineProps<{
	emoji: EmojiSimple;
}>();

function menu(ev: PointerEvent) {
	const menuItems: MenuItem[] = [];
	menuItems.push({
		type: 'label',
		text: ':' + props.emoji.name + ':',
	}, {
		text: $locale.value.sfc.copy,
		icon: 'ti ti-copy',
		action: () => {
			copyToClipboard(`:${props.emoji.name}:`);
		},
	}, {
		text: $locale.value.sfc.info,
		icon: 'ti ti-info-circle',
		action: async () => {
			const { dispose } = os.popup(MkCustomEmojiDetailedDialog, {
				emoji: await misskeyApiGet('emoji', {
					name: props.emoji.name,
				}),
			}, {
				closed: () => dispose(),
			});
		},
	});

	if ($i?.isModerator ?? $i?.isAdmin) {
		menuItems.push({
			text: $locale.value.sfc.edit,
			icon: 'ti ti-pencil',
			action: async () => {
				const detailedEmoji = await misskeyApiGet('emoji', {
					name: props.emoji.name,
				});
				const { dispose } = await os.popupAsyncWithDialog(import('@features/emojis/frontend/pages/emoji-edit-dialog.vue').then(x => x.default), {
					emoji: detailedEmoji,
				}, {
					closed: () => dispose(),
				});
			},
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
	padding: 12px;
	text-align: left;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	content-visibility: auto;
	contain-intrinsic-size: auto 66px;

	&:hover {
		border-color: var(--MI_THEME-accent);
	}
}

.img {
	width: 42px;
	height: 42px;
	object-fit: contain;
}

.body {
	padding: 0 0 0 8px;
	white-space: nowrap;
	overflow: hidden;
}

.name {
	text-overflow: ellipsis;
	overflow: hidden;
}

.info {
	opacity: 0.5;
	font-size: 0.9em;
	text-overflow: ellipsis;
	overflow: hidden;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "copy": "نسخ",
  "info": "عن",
  "edit": "التعديل"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "copy": "Copiar",
  "info": "Informació",
  "edit": "Editar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "copy": "Kopírovat",
  "info": "Informace",
  "edit": "Upravit"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "copy": "Copy",
  "info": "About",
  "edit": "Edit"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "copy": "Kopieren",
  "info": "Über",
  "edit": "Bearbeiten"
}
</locale>

<locale locale="en-US" lang="json">
{
  "copy": "Copy",
  "info": "About",
  "edit": "Edit"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "copy": "Copiar",
  "info": "Información",
  "edit": "Editar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "copy": "Copier",
  "info": "Informations",
  "edit": "Editer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "copy": "Salin",
  "info": "Informasi",
  "edit": "Sunting"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "copy": "Copia",
  "info": "Informazioni",
  "edit": "Modifica"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "copy": "コピー",
  "info": "情報",
  "edit": "編集"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "copy": "コピー",
  "info": "情報",
  "edit": "編集"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "copy": "Copy",
  "info": "About",
  "edit": "Edit"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "copy": "Copy",
  "info": "About",
  "edit": "Edit"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "copy": "복사",
  "info": "정보",
  "edit": "편집"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "copy": "Kopiëren",
  "info": "Over",
  "edit": "Bewerken"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "copy": "Kopier",
  "info": "Infomasjon",
  "edit": "Rediger"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "copy": "Kopiuj",
  "info": "Informacje",
  "edit": "Edytuj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "copy": "Copiar",
  "info": "Informações",
  "edit": "Editar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "copy": "Копировать",
  "info": "Описание",
  "edit": "Изменить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "copy": "Kopírovať",
  "info": "Informácie",
  "edit": "Upraviť"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "copy": "คัดลอก",
  "info": "เกี่ยวกับ",
  "edit": "แก้ไข"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "copy": "Kopyala",
  "info": "Hakkında",
  "edit": "Düzenle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "copy": "Copy",
  "info": "About",
  "edit": "Edit"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "copy": "Скопіювати",
  "info": "Інформація",
  "edit": "Редагувати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "copy": "Sao chép",
  "info": "Giới thiệu",
  "edit": "Sửa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "copy": "复制",
  "info": "关于",
  "edit": "编辑"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "copy": "複製",
  "info": "資訊",
  "edit": "編輯"
}
</locale>
