<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.draghover]: draghover }]"
	@dragover.prevent.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<i v-if="folder == null" class="ti ti-cloud" style="margin-right: 4px;"></i>
	<span>{{ folder == null ? $locale.sfc.drive : folder.name }}</span>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { globalEvents } from '@/events.js';
import { checkDragDataType, getDragData } from '@/drag-and-drop.js';

const props = defineProps<{
	folder?: Misskey.entities.DriveFolder;
	parentFolder: Misskey.entities.DriveFolder | null;
}>();

const emit = defineEmits<{
	(ev: 'upload', files: File[], folder?: Misskey.entities.DriveFolder | null): void;
}>();

const draghover = ref(false);

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	// このフォルダがルートかつカレントディレクトリならドロップ禁止
	if (props.folder == null && props.parentFolder == null) {
		ev.dataTransfer.dropEffect = 'none';
	}

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	if (isFile || checkDragDataType(ev, ['driveFiles', 'driveFolders'])) {
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	} else {
		ev.dataTransfer.dropEffect = 'none';
	}

	return false;
}

function onDragenter() {
	if (props.folder || props.parentFolder) draghover.value = true;
}

function onDragleave() {
	if (props.folder || props.parentFolder) draghover.value = false;
}

function onDrop(ev: DragEvent) {
	draghover.value = false;

	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length > 0) {
		emit('upload', Array.from(ev.dataTransfer.files), props.folder);
		return;
	}

	//#region ドライブのファイル
	{
		const droppedData = getDragData(ev, 'driveFiles');
		if (droppedData != null) {
			misskeyApi('drive/files/move-bulk', {
				fileIds: droppedData.map(f => f.id),
				folderId: props.folder ? props.folder.id : null,
			}).then(() => {
				globalEvents.emit('driveFilesUpdated', droppedData.map(x => ({
					...x,
					folderId: props.folder ? props.folder.id : null,
					folder: props.folder ?? null,
				})));
			});
		}
	}
	//#endregion

	//#region ドライブのフォルダ
	{
		const droppedData = getDragData(ev, 'driveFolders');
		if (droppedData != null) {
			const droppedFolder = droppedData[0];
			// 移動先が自分自身ならreject
			if (props.folder && droppedFolder.id === props.folder.id) return;
			misskeyApi('drive/folders/update', {
				folderId: droppedFolder.id,
				parentId: props.folder ? props.folder.id : null,
			}).then(() => {
				globalEvents.emit('driveFoldersUpdated', [droppedFolder].map(x => ({
					...x,
					parentId: props.folder ? props.folder.id : null,
					parent: props.folder ?? null,
				})));
			});
		}
	}
	//#endregion
}
</script>

<style lang="scss" module>
.root {
	&.draghover {
		background: #eee;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "drive": "قرص التخرين"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "drive": "Disc"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "drive": "Úložiště"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="en-US" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "drive": "Disque"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "drive": "ドライブ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "drive": "ドライブ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "drive": "드라이브"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "drive": "Schijf"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "drive": "Dysk"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "drive": "Диск"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "drive": "Disk"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "drive": "ไดรฟ์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "drive": "Drive"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "drive": "Диск"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "drive": "Ổ đĩa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "drive": "网盘"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "drive": "雲端硬碟"
}
</locale>
