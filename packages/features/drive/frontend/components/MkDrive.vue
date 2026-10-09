<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer style="background: var(--MI_THEME-bg);">
	<template #header>
		<nav :class="$style.nav">
			<div :class="$style.navPath" @contextmenu.prevent.stop="() => {}">
				<XNavFolder
					:class="[$style.navPathItem, { [$style.navCurrent]: folder == null }]"
					:parentFolder="folder"
					@click="cd(null)"
					@upload="onUploadRequested"
				/>
				<template v-for="f in hierarchyFolders">
					<span :class="[$style.navPathItem, $style.navSeparator]"><i class="ti ti-chevron-right"></i></span>
					<XNavFolder
						:folder="f"
						:parentFolder="folder"
						:class="[$style.navPathItem]"
						@click="cd(f)"
						@upload="onUploadRequested"
					/>
				</template>
				<span v-if="folder != null" :class="[$style.navPathItem, $style.navSeparator]"><i class="ti ti-chevron-right"></i></span>
				<span v-if="folder != null" :class="[$style.navPathItem, $style.navCurrent]">{{ folder.name }}</span>
			</div>
			<button class="_button" :class="$style.navMenu" @click="showMenu"><i class="ti ti-dots"></i></button>
		</nav>
	</template>

	<div>
		<div v-if="select === 'folder'">
			<template v-if="folder == null">
				<MkButton v-if="!isRootSelected" @click="isRootSelected = true">
					<i class="ti ti-square"></i> {{ $locale.sfc.selectFolder }}
				</MkButton>
				<MkButton v-else @click="isRootSelected = false">
					<i class="ti ti-checkbox"></i> {{ $locale.sfc.unselectFolder }}
				</MkButton>
			</template>
			<template v-else>
				<MkButton v-if="!selectedFolders.some(f => f.id === folder!.id)" @click="selectedFolders.push(folder)">
					<i class="ti ti-square"></i> {{ $locale.sfc.selectFolder }}
				</MkButton>
				<MkButton v-else @click="selectedFolders = selectedFolders.filter(f => f.id !== folder!.id)">
					<i class="ti ti-checkbox"></i> {{ $locale.sfc.unselectFolder }}
				</MkButton>
			</template>
		</div>

		<div
			ref="main"
			:class="[$style.main, { [$style.fetching]: fetching }]"
			@dragover.prevent.stop="onDragover"
			@dragenter="onDragenter"
			@dragleave="onDragleave"
			@drop.prevent.stop="onDrop"
			@contextmenu.stop="onContextmenu"
		>
			<div :class="$style.tipContainer">
				<MkTip k="drive"><div v-html="$locale.sfc.driveAboutTip"></div></MkTip>
			</div>

			<div :class="$style.folders">
				<XFolder
					v-for="(f, i) in foldersPaginator.items.value"
					:key="f.id"
					v-anim="i"
					:data-scroll-anchor="f.id"
					:folder="f"
					:selectMode="select === 'folder'"
					:isSelected="selectedFolders.some(x => x.id === f.id)"
					@chosen="chooseFolder"
					@unchose="unchoseFolder"
					@click="cd(f)"
					@upload="onUploadRequested"
					@dragstart="isDragSource = true"
					@dragend="isDragSource = false"
				/>
			</div>
			<MkButton v-if="foldersPaginator.canFetchOlder.value" :class="$style.loadMore" primary rounded @click="foldersPaginator.fetchOlder()">{{ $locale.sfc.loadMore }}</MkButton>

			<template v-if="shouldBeGroupedByDate">
				<MkStickyContainer v-for="(item, i) in filesTimeline" :key="`${item.date.getFullYear()}/${item.date.getMonth() + 1}`">
					<template #header>
						<div :class="$style.date">
							<span><i class="ti ti-chevron-down"></i> {{ item.date.getFullYear() }}/{{ item.date.getMonth() + 1 }}</span>
						</div>
					</template>

					<TransitionGroup
						tag="div"
						:enterActiveClass="prefer.s.animation ? $style.transition_files_enterActive : ''"
						:leaveActiveClass="prefer.s.animation ? $style.transition_files_leaveActive : ''"
						:enterFromClass="prefer.s.animation ? $style.transition_files_enterFrom : ''"
						:leaveToClass="prefer.s.animation ? $style.transition_files_leaveTo : ''"
						:moveClass="prefer.s.animation ? $style.transition_files_move : ''"
						:class="$style.files"
					>
						<XFile
							v-for="file in item.items" :key="file.id"
							:data-scroll-anchor="file.id"
							:file="file"
							:folder="folder"
							:isSelected="selectedFiles.some(x => x.id === file.id)"
							@click="onFileClick($event, file)"
							@dragstart="onFileDragstart(file, $event)"
							@dragend="isDragSource = false"
						/>
					</TransitionGroup>
				</MkStickyContainer>
			</template>
			<TransitionGroup
				v-else
				tag="div"
				:enterActiveClass="prefer.s.animation ? $style.transition_files_enterActive : ''"
				:leaveActiveClass="prefer.s.animation ? $style.transition_files_leaveActive : ''"
				:enterFromClass="prefer.s.animation ? $style.transition_files_enterFrom : ''"
				:leaveToClass="prefer.s.animation ? $style.transition_files_leaveTo : ''"
				:moveClass="prefer.s.animation ? $style.transition_files_move : ''"
				:class="$style.files"
			>
				<XFile
					v-for="file in filesPaginator.items.value" :key="file.id"
					:data-scroll-anchor="file.id"
					:file="file"
					:folder="folder"
					:isSelected="selectedFiles.some(x => x.id === file.id)"
					@click="onFileClick($event, file)"
					@dragstart="onFileDragstart(file, $event)"
					@dragend="isDragSource = false"
				/>
			</TransitionGroup>

			<MkButton
				v-show="canFetchFiles"
				v-appear="shouldEnableInfiniteScroll ? fetchMoreFiles : null"
				:class="$style.loadMore"
				primary
				rounded
				@click="fetchMoreFiles"
			>
				{{ $locale.sfc.loadMore }}
			</MkButton>

			<div v-if="filesPaginator.items.value.length == 0 && foldersPaginator.items.value.length == 0 && !fetching" :class="$style.empty">
				<div v-if="draghover">{{ $locale.sfc.dropHereToUpload }}</div>
				<div v-if="!draghover && folder == null"><strong>{{ $locale.sfc.emptyDrive }}</strong></div>
				<div v-if="!draghover && folder != null">{{ $locale.sfc.emptyFolder }}</div>
			</div>
		</div>
		<MkLoading v-if="fetching"/>
		<div v-if="draghover" :class="$style.dropzone"></div>
	</div>

	<template #footer>
		<div v-if="isEditMode" :class="$style.footer">
			<MkButton primary rounded @click="moveFilesBulk()"><i class="ti ti-folder-symlink"></i> {{ $locale.sfc.move }}...</MkButton>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { nextTick, onActivated, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, computed, TransitionGroup, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import XNavFolder from '@features/drive/frontend/components/MkDrive.navFolder.vue';
import XFolder from '@features/drive/frontend/components/MkDrive.folder.vue';
import XFile from '@features/drive/frontend/components/MkDrive.file.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { useStream } from '@features/api/frontend/stream.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { chooseFileFromPcAndUpload, selectDriveFolder } from '@features/drive/frontend/utility/drive.js';
import { store } from '@features/preferences/frontend/store.js';
import { makeDateGroupedTimelineComputedRef } from '@features/timelines/frontend/utility/timeline-date-separate.js';
import { globalEvents, useGlobalEvent } from '@features/runtime/frontend/events.js';
import { checkDragDataType, getDragData, setDragData } from '@features/ui/frontend/drag-and-drop.js';
import { getDriveFileMenu } from '@features/drive/frontend/utility/get-drive-file-menu.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const props = withDefaults(defineProps<{
	initialFolder?: Misskey.entities.DriveFolder | Misskey.entities.DriveFolder['id'] | null;
	type?: string;
	multiple?: boolean;
	select?: 'file' | 'folder' | null;
	forceDisableInfiniteScroll?: boolean;
}>(), {
	initialFolder: null,
	multiple: false,
	select: null,
	forceDisableInfiniteScroll: false,
});

const emit = defineEmits<{
	(ev: 'changeSelectedFiles', v: Misskey.entities.DriveFile[]): void;
	(ev: 'changeSelectedFolders', v: (Misskey.entities.DriveFolder | null)[]): void;
	(ev: 'cd', v: Misskey.entities.DriveFolder | null): void;
}>();

const shouldEnableInfiniteScroll = computed(() => {
	return prefer.r.enableInfiniteScroll.value && !props.forceDisableInfiniteScroll;
});

const folder = ref<Misskey.entities.DriveFolder | null>(null);
const hierarchyFolders = ref<Misskey.entities.DriveFolder[]>([]);

// ドロップされようとしているか
const draghover = ref(false);

// 自身の所有するアイテムがドラッグをスタートさせたか
// (自分自身の階層にドロップできないようにするためのフラグ)
const isDragSource = ref(false);

const isEditMode = ref(false);

const selectedFiles = ref<Misskey.entities.DriveFile[]>([]);
const selectedFolders = ref<Misskey.entities.DriveFolder[]>([]);
const isRootSelected = ref(false);

watch(selectedFiles, () => {
	emit('changeSelectedFiles', selectedFiles.value);
}, { deep: true });

watch([selectedFolders, isRootSelected], () => {
	emit('changeSelectedFolders', isRootSelected.value ? [null, ...selectedFolders.value] : selectedFolders.value);
});

const fetching = ref(true);

const sortModeSelect = ref<NonNullable<Misskey.entities.DriveFilesRequest['sort']>>('+createdAt');

const filesPaginator = markRaw(new Paginator('drive/files', {
	limit: 30,
	canFetchDetection: 'limit',
	params: () => ({ // 自動でリロードしたくないためcomputedParamsは使わない
		folderId: folder.value ? folder.value.id : null,
		type: props.type,
		sort: ['-createdAt', '+createdAt'].includes(sortModeSelect.value) ? null : sortModeSelect.value,
	}),
}));
const foldersPaginator = markRaw(new Paginator('drive/folders', {
	limit: 30,
	canFetchDetection: 'limit',
	params: () => ({ // 自動でリロードしたくないためcomputedParamsは使わない
		folderId: folder.value ? folder.value.id : null,
	}),
}));

const canFetchFiles = computed(() => !fetching.value && (filesPaginator.order.value === 'oldest' ? filesPaginator.canFetchNewer.value : filesPaginator.canFetchOlder.value));

async function fetchMoreFiles() {
	if (filesPaginator.order.value === 'oldest') {
		filesPaginator.fetchNewer();
	} else {
		filesPaginator.fetchOlder();
	}
}

const filesTimeline = makeDateGroupedTimelineComputedRef(filesPaginator.items, 'month');
const shouldBeGroupedByDate = computed(() => ['+createdAt', '-createdAt'].includes(sortModeSelect.value));

watch(folder, () => emit('cd', folder.value));
watch(sortModeSelect, () => {
	initialize();
});

async function initialize() {
	fetching.value = true;
	await foldersPaginator.reload();
	filesPaginator.initialDirection = sortModeSelect.value === '-createdAt' ? 'newer' : 'older';
	filesPaginator.order.value = sortModeSelect.value === '-createdAt' ? 'oldest' : 'newest';
	await filesPaginator.reload();
	fetching.value = false;
}

function onStreamDriveFileCreated(file: Misskey.entities.DriveFile) {
	if (file.folderId === (folder.value?.id ?? null)) {
		filesPaginator.prepend(file);
	}
}

function onFileDragstart(file: Misskey.entities.DriveFile, ev: DragEvent) {
	if (isEditMode.value) {
		if (!selectedFiles.value.some(f => f.id === file.id)) {
			selectedFiles.value.push(file);
		}

		if (ev.dataTransfer) {
			ev.dataTransfer.effectAllowed = 'move';
			setDragData(ev, 'driveFiles', selectedFiles.value);
		}
	}

	isDragSource.value = true;
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	// ドラッグ元が自分自身の所有するアイテムだったら
	if (isDragSource.value) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = 'none';
		return;
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
	if (!isDragSource.value) draghover.value = true;
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev: DragEvent): void | boolean {
	draghover.value = false;

	if (!ev.dataTransfer) return;

	// ドロップされてきたものがファイルだったら
	if (ev.dataTransfer.files.length > 0) {
		os.launchUploader(Array.from(ev.dataTransfer.files), {
			folderId: folder.value?.id ?? null,
		});
		return;
	}

	//#region ドライブのファイル
	{
		const droppedData = getDragData(ev, 'driveFiles');
		if (droppedData != null) {
			misskeyApi('drive/files/move-bulk', {
				fileIds: droppedData.map(f => f.id),
				folderId: folder.value ? folder.value.id : null,
			}).then(() => {
				globalEvents.emit('driveFilesUpdated', droppedData.map(x => ({
					...x,
					folderId: folder.value ? folder.value.id : null,
					folder: folder.value,
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
			if (folder.value && droppedFolder.id === folder.value.id) return false;
			if (foldersPaginator.items.value.some(f => f.id === droppedFolder.id)) return false;
			misskeyApi('drive/folders/update', {
				folderId: droppedFolder.id,
				parentId: folder.value ? folder.value.id : null,
			}).then(() => {
				globalEvents.emit('driveFoldersUpdated', [droppedFolder].map(x => ({
					...x,
					parentId: folder.value ? folder.value.id : null,
					parent: folder.value,
				})));
			}).catch(err => {
				switch (err.code) {
					case 'RECURSIVE_NESTING':
						claimAchievement('driveFolderCircularReference');
						os.alert({
							type: 'error',
							title: $locale.value.sfc.unableToProcess,
							text: $locale.value.sfc.circularReferenceFolder,
						});
						break;
					default:
						os.alert({
							type: 'error',
							text: $locale.value.sfc.somethingHappened,
						});
				}
			});
		}
	}
	//#endregion
}

function onUploadRequested(files: File[], folder?: Misskey.entities.DriveFolder | null) {
	os.launchUploader(files, {
		folderId: folder?.id ?? null,
	});
}

async function urlUpload() {
	const { canceled, result: url } = await os.inputText({
		title: $locale.value.sfc.uploadFromUrl,
		type: 'url',
		placeholder: $locale.value.sfc.uploadFromUrlDescription,
	});
	if (canceled || !url) return;

	await os.apiWithDialog('drive/files/upload-from-url', {
		url: url,
		folderId: folder.value ? folder.value.id : undefined,
	});

	os.alert({
		title: $locale.value.sfc.uploadFromUrlRequested,
		text: $locale.value.sfc.uploadFromUrlMayTakeTime,
	});
}

async function createFolder() {
	const { canceled, result: name } = await os.inputText({
		title: $locale.value.sfc.createFolder,
		placeholder: $locale.value.sfc.folderName,
	});
	if (canceled || name == null) return;

	const createdFolder = await os.apiWithDialog('drive/folders/create', {
		name: name,
		parentId: folder.value ? folder.value.id : undefined,
	});

	foldersPaginator.prepend(createdFolder);
}

async function renameFolder(folderToRename: Misskey.entities.DriveFolder) {
	const { canceled, result: name } = await os.inputText({
		title: $locale.value.sfc.renameFolder,
		placeholder: $locale.value.sfc.inputNewFolderName,
		default: folderToRename.name,
	});
	if (canceled) return;

	const updatedFolder = await os.apiWithDialog('drive/folders/update', {
		folderId: folderToRename.id,
		name: name,
	});

	globalEvents.emit('driveFoldersUpdated', [updatedFolder]);
}

function deleteFolder(folderToDelete: Misskey.entities.DriveFolder) {
	misskeyApi('drive/folders/delete', {
		folderId: folderToDelete.id,
	}).then(() => {
		// 削除時に親フォルダに移動
		cd(folderToDelete.parentId);
		globalEvents.emit('driveFoldersDeleted', [folderToDelete]);
	}).catch(err => {
		switch (err.id) {
			case 'b0fc8a17-963c-405d-bfbc-859a487295e1':
				os.alert({
					type: 'error',
					title: $locale.value.sfc.unableToDelete,
					text: $locale.value.sfc.hasChildFilesOrFolders,
				});
				break;
			default:
				os.alert({
					type: 'error',
					text: $locale.value.sfc.unableToDelete,
				});
		}
	});
}

function onFileClick(ev: PointerEvent, file: Misskey.entities.DriveFile) {
	if (ev.shiftKey) {
		isEditMode.value = true;
	}

	if (props.select === 'file' || isEditMode.value) {
		const isAlreadySelected = selectedFiles.value.some(f => f.id === file.id);

		if (isEditMode.value) {
			if (isAlreadySelected) {
				selectedFiles.value = selectedFiles.value.filter(f => f.id !== file.id);
			} else {
				selectedFiles.value.push(file);
			}
			return;
		}

		if (props.multiple) {
			if (isAlreadySelected) {
				selectedFiles.value = selectedFiles.value.filter(f => f.id !== file.id);
			} else {
				selectedFiles.value.push(file);
			}
		} else {
			if (isAlreadySelected) {
				//emit('selected', file);
			} else {
				selectedFiles.value = [file];
			}
		}
	} else {
		os.popupMenu(getDriveFileMenu(file, folder.value), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
	}
}

function chooseFolder(folderToChoose: Misskey.entities.DriveFolder) {
	const isAlreadySelected = selectedFolders.value.some(f => f.id === folderToChoose.id);
	if (props.multiple) {
		if (isAlreadySelected) {
			selectedFolders.value = selectedFolders.value.filter(f => f.id !== folderToChoose.id);
		} else {
			selectedFolders.value.push(folderToChoose);
		}
	} else {
		if (isAlreadySelected) {
			//emit('selected', folderToChoose);
		} else {
			selectedFolders.value = [folderToChoose];
		}
	}
}

function unchoseFolder(folderToUnchose: Misskey.entities.DriveFolder) {
	selectedFolders.value = selectedFolders.value.filter(f => f.id !== folderToUnchose.id);
}

function cd(target?: Misskey.entities.DriveFolder | Misskey.entities.DriveFolder['id' | 'parentId']) {
	if (!target) {
		goRoot();
		return;
	} else if (typeof target === 'object') {
		target = target.id;
	}

	fetching.value = true;

	misskeyApi('drive/folders/show', {
		folderId: target,
	}).then(folderToMove => {
		folder.value = folderToMove;
		hierarchyFolders.value = [];

		const dive = (folderToDive: Misskey.entities.DriveFolder) => {
			hierarchyFolders.value.unshift(folderToDive);
			if (folderToDive.parent) dive(folderToDive.parent);
		};

		if (folderToMove.parent) dive(folderToMove.parent);

		initialize();
	});
}

async function moveFilesBulk() {
	if (selectedFiles.value.length === 0) return;

	const { canceled, folders } = await selectDriveFolder(folder.value ? folder.value.id : null);

	if (canceled) return;

	await os.apiWithDialog('drive/files/move-bulk', {
		fileIds: selectedFiles.value.map(f => f.id),
		folderId: folders[0] ? folders[0].id : null,
	});

	globalEvents.emit('driveFilesUpdated', selectedFiles.value.map(x => ({
		...x,
		folderId: folders[0] ? folders[0].id : null,
		folder: folders[0] ?? null,
	})));
}

function goRoot() {
	// 既にrootにいるなら何もしない
	if (folder.value == null) return;

	folder.value = null;
	hierarchyFolders.value = [];
	initialize();
}

function getMenu() {
	const menu: MenuItem[] = [];

	menu.push({
		text: $locale.value.sfc.addFile,
		type: 'label',
	}, {
		text: $locale.value.sfc.upload,
		icon: 'ti ti-upload',
		action: () => {
			chooseFileFromPcAndUpload({
				multiple: true,
				folderId: folder.value?.id,
			});
		},
	}, {
		text: $locale.value.sfc.fromUrl,
		icon: 'ti ti-link',
		action: () => { urlUpload(); },
	}, { type: 'divider' }, {
		text: folder.value ? folder.value.name : $locale.value.sfc.drive,
		type: 'label',
	});

	menu.push({
		type: 'parent',
		text: $locale.value.sfc.sort,
		icon: 'ti ti-arrows-sort',
		children: [{
			text: `${$locale.value.sfc.registeredDate} (${$locale.value.sfc.descendingOrder})`,
			icon: 'ti ti-sort-descending-letters',
			action: () => { sortModeSelect.value = '+createdAt'; },
			active: sortModeSelect.value === '+createdAt',
		}, {
			text: `${$locale.value.sfc.registeredDate} (${$locale.value.sfc.ascendingOrder})`,
			icon: 'ti ti-sort-ascending-letters',
			action: () => { sortModeSelect.value = '-createdAt'; },
			active: sortModeSelect.value === '-createdAt',
		}, {
			text: `${$locale.value.sfc.size} (${$locale.value.sfc.descendingOrder})`,
			icon: 'ti ti-sort-descending-letters',
			action: () => { sortModeSelect.value = '+size'; },
			active: sortModeSelect.value === '+size',
		}, {
			text: `${$locale.value.sfc.size} (${$locale.value.sfc.ascendingOrder})`,
			icon: 'ti ti-sort-ascending-letters',
			action: () => { sortModeSelect.value = '-size'; },
			active: sortModeSelect.value === '-size',
		}, {
			text: `${$locale.value.sfc.name} (${$locale.value.sfc.descendingOrder})`,
			icon: 'ti ti-sort-descending-letters',
			action: () => { sortModeSelect.value = '+name'; },
			active: sortModeSelect.value === '+name',
		}, {
			text: `${$locale.value.sfc.name} (${$locale.value.sfc.ascendingOrder})`,
			icon: 'ti ti-sort-ascending-letters',
			action: () => { sortModeSelect.value = '-name'; },
			active: sortModeSelect.value === '-name',
		}],
	});

	if (folder.value) {
		menu.push({
			text: $locale.value.sfc.renameFolder,
			icon: 'ti ti-forms',
			action: () => { if (folder.value) renameFolder(folder.value); },
		}, {
			text: $locale.value.sfc.deleteFolder,
			icon: 'ti ti-trash',
			action: () => { deleteFolder(folder.value as Misskey.entities.DriveFolder); },
		});
	}

	menu.push({
		text: $locale.value.sfc.createFolder,
		icon: 'ti ti-folder-plus',
		action: () => { createFolder(); },
	}, { type: 'divider' }, {
		type: 'switch',
		text: $locale.value.sfc.edit,
		icon: 'ti ti-pointer',
		ref: isEditMode,
	});

	return menu;
}

function showMenu(ev: PointerEvent) {
	os.popupMenu(getMenu(), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu(getMenu(), ev);
}

useGlobalEvent('driveFileCreated', (file) => {
	if (file.folderId === (folder.value?.id ?? null)) {
		filesPaginator.prepend(file);
	}
});

useGlobalEvent('driveFilesUpdated', (files) => {
	for (const f of files) {
		if (filesPaginator.items.value.some(x => x.id === f.id)) {
			if (f.folderId === (folder.value?.id ?? null)) {
				filesPaginator.updateItem(f.id, () => f);
			} else {
				filesPaginator.removeItem(f.id);
			}
		} else {
			if (f.folderId === (folder.value?.id ?? null)) {
				filesPaginator.prepend(f);
			}
		}
	}
});

useGlobalEvent('driveFilesDeleted', (files) => {
	for (const f of files) {
		filesPaginator.removeItem(f.id);
	}
});

useGlobalEvent('driveFoldersUpdated', (folders) => {
	for (const f of folders) {
		if (foldersPaginator.items.value.some(x => x.id === f.id)) {
			if (f.parentId === (folder.value?.id ?? null)) {
				foldersPaginator.updateItem(f.id, () => f);
			} else {
				foldersPaginator.removeItem(f.id);
			}
		} else {
			if (f.parentId === (folder.value?.id ?? null)) {
				foldersPaginator.prepend(f);
			}
		}
	}
});

useGlobalEvent('driveFoldersDeleted', (folders) => {
	for (const f of folders) {
		foldersPaginator.removeItem(f.id);
	}
});

let connection: Misskey.IChannelConnection<Misskey.Channels['drive']> | null = null;

onMounted(() => {
	if (store.s.realtimeMode) {
		connection = useStream().useChannel('drive');
		connection.on('fileCreated', onStreamDriveFileCreated);
	}

	if (props.initialFolder) {
		cd(props.initialFolder);
	} else {
		initialize();
	}
});

onActivated(() => {
});

onBeforeUnmount(() => {
	if (connection != null) {
		connection.dispose();
	}
});
</script>

<style lang="scss" module>
.transition_files_move,
.transition_files_enterActive,
.transition_files_leaveActive {
	transition: all 0.2s ease;
}
.transition_files_enterFrom,
.transition_files_leaveTo {
	opacity: 0;
}
.transition_files_leaveActive {
	position: absolute;
}

.nav {
	display: flex;
	width: 100%;
	padding: 0 8px;
	box-sizing: border-box;
	overflow: auto;
	font-size: 0.9em;
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.75);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.navPath {
	display: inline-block;
	vertical-align: bottom;
	line-height: 42px;
	white-space: nowrap;
}

.navPathItem {
	display: inline-block;
	margin: 0;
	padding: 0 8px;
	line-height: 42px;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
	}

	&.navCurrent {
		font-weight: bold;
		cursor: default;

		&:hover {
			text-decoration: none;
		}
	}

	&.navSeparator {
		margin: 0;
		padding: 0;
		opacity: 0.5;
		cursor: default;
	}
}

.navMenu {
	margin-left: auto;
	padding: 0 12px;
}

.main {
	min-height: 100cqh;
	user-select: none;

	&.fetching {
		cursor: wait !important;
		opacity: 0.5;
		pointer-events: none;
	}
}

.tipContainer:not(:empty) {
	padding: 16px 32px;
}

.folders,
.files {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	grid-gap: 12px;
	padding: 16px 32px;
}

@container (max-width: 600px) {
	.tipContainer:not(:empty) {
		padding: 16px;
	}

	.folders,
	.files {
		padding: 16px;
	}
}

.date {
	padding: 8px 16px;
	font-size: 90%;
	-webkit-backdrop-filter: var(--MI-blur, blur(8px));
	backdrop-filter: var(--MI-blur, blur(8px));
	background-color: color(from var(--MI_THEME-bg) srgb r g b / 0.85);
}

.loadMore {
	margin: 16px auto;
}

.footer {
	padding: 8px 16px;
	font-size: 90%;
	-webkit-backdrop-filter: var(--MI-blur, blur(8px));
	backdrop-filter: var(--MI-blur, blur(8px));
	background-color: color(from var(--MI_THEME-bg) srgb r g b / 0.85);
}

.empty {
	padding: 16px;
	text-align: center;
	pointer-events: none;
	opacity: 0.5;
}

.dropzone {
	position: absolute;
	left: 0;
	top: 38px;
	width: 100%;
	height: calc(100% - 38px);
	border: dashed 2px var(--MI_THEME-focus);
	pointer-events: none;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"unableToProcess": "يتعذر إكمال العملية",
	"circularReferenceFolder": "المجلد المستهدف ينتمي للمجلد الذي تريد حذفه",
	"somethingHappened": "حدث خطأ",
	"uploadFromUrl": "ارفع عبر رابط",
	"uploadFromUrlDescription": "رابط الملف المراد رفعه",
	"uploadFromUrlRequested": "الرفع مطلوب",
	"uploadFromUrlMayTakeTime": "سيستغرق بعض الوقت لاتمام الرفع ",
	"createFolder": "أنشئ مجلدًا",
	"folderName": "اسم المجلد",
	"renameFolder": "إعادة تسمية المجلد",
	"inputNewFolderName": "ادخل الإسم الجديد للمجلد",
	"unableToDelete": "لا يمكن حذفه",
	"hasChildFilesOrFolders": "الان الملف غير فارغ. لا يمكن حذفه",
	"addFile": "إضافة ملف",
	"upload": "ارفع",
	"fromUrl": "عبر رابط",
	"drive": "قرص التخرين",
	"sort": "ترتيب حسب",
	"registeredDate": "انضم في",
	"descendingOrder": "تنازلي",
	"ascendingOrder": "تصاعدي",
	"size": "الحجم",
	"name": "الإسم",
	"deleteFolder": "احذف هذا المجلد",
	"edit": "التعديل",
	"selectFolder": "اختر مجلدًا",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "عرض المزيد",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "قرص التخزين فارغ",
	"emptyFolder": "هذا المجلد فارغ",
	"move": "أنقل"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"unableToProcess": "L'operació no pot ser completada ",
	"circularReferenceFolder": "La carpeta destinatària és una subcarpeta de la carpeta a la qual la desitges moure",
	"somethingHappened": "S'ha produït un error",
	"uploadFromUrl": "Carrega des d'un enllaç",
	"uploadFromUrlDescription": "Enllaç del fitxer que vols carregar",
	"uploadFromUrlRequested": "Càrrega sol·licitada",
	"uploadFromUrlMayTakeTime": "La càrrega des de l'enllaç pot trigar un temps",
	"createFolder": "Crea una carpeta",
	"folderName": "Nom de la carpeta",
	"renameFolder": "Canvia el nom de la carpeta",
	"inputNewFolderName": "Introduïu el nom de la carpeta nova",
	"unableToDelete": "No es pot eliminar",
	"hasChildFilesOrFolders": "No és possible esborrar aquesta carpeta ja que no és buida",
	"addFile": "Afegeix un fitxer",
	"upload": "Puja",
	"fromUrl": "Des d'un enllaç",
	"drive": "Disc",
	"sort": "Ordena",
	"registeredDate": "Data de registre",
	"descendingOrder": "Descendent",
	"ascendingOrder": "Ascendent",
	"size": "Mida",
	"name": "Nom",
	"deleteFolder": "Elimina la carpeta",
	"edit": "Editar",
	"selectFolder": "Selecció de carpeta",
	"unselectFolder": "Deixa de seleccionar la carpeta",
	"driveAboutTip": "Al Disc veure's una llista de tots els arxius que has anat pujant.\u003cbr>\nPots tornar-los a fer servir adjuntant-los a notes noves o pots adelantar-te i pujar arxius per publicar-los més tard!\u003cbr>\n\u003cb>Tingués en compte que si esborres un arxiu també desapareixerà de tots els llocs on l'has fet servir (notes, pàgines, avatars, imatges de capçalera, etc.)\u003c/b>\u003cbr>\nTambé pots crear carpetes per organitzar les.",
	"loadMore": "Carregar més",
	"dropHereToUpload": "Arrossega els arxius fins aquí per pujar-los al servidor",
	"emptyDrive": "El teu Disc és buit",
	"emptyFolder": "La carpeta està buida",
	"move": "Mou"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"unableToProcess": "Operace nebyla dokončena.",
	"circularReferenceFolder": "Koncová složka je podsložka složky, kterou chcete přesunout.",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"uploadFromUrl": "Nahrát z URL adresy",
	"uploadFromUrlDescription": "URL adresa souboru, který chcete nahrát",
	"uploadFromUrlRequested": "Upload zažádán",
	"uploadFromUrlMayTakeTime": "Může trvat nějakou dobu, dokud nebude dokončeno nahrávání.",
	"createFolder": "Vytvořit složku",
	"folderName": "Název složky",
	"renameFolder": "Přejmenovat složku",
	"inputNewFolderName": "Zadejte název nové složky",
	"unableToDelete": "Nelze smazat",
	"hasChildFilesOrFolders": "Nemůžete odstranit složku, která není prázdná.",
	"addFile": "Přidat soubor",
	"upload": "Nahrát soubory",
	"fromUrl": "Z URL",
	"drive": "Úložiště",
	"sort": "Seřadit",
	"registeredDate": "Datum registrace",
	"descendingOrder": "Sestupně",
	"ascendingOrder": "Vzestupně",
	"size": "Velikost",
	"name": "Jméno",
	"deleteFolder": "Odstranit složku",
	"edit": "Upravit",
	"selectFolder": "Vyberte složku",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Zobrazit více",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Váš disk je prázdný",
	"emptyFolder": "Tato složka je prázdná",
	"move": "Přesunout"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"uploadFromUrl": "Upload from a URL",
	"uploadFromUrlDescription": "URL of the file you want to upload",
	"uploadFromUrlRequested": "Upload requested",
	"uploadFromUrlMayTakeTime": "It may take some time until the upload is complete.",
	"createFolder": "Create a folder",
	"folderName": "Folder name",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"addFile": "Add a file",
	"upload": "Upload",
	"fromUrl": "From URL",
	"drive": "Drive",
	"sort": "Sorting order",
	"registeredDate": "Joined on",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"size": "Size",
	"name": "Name",
	"deleteFolder": "Delete this folder",
	"edit": "Edit",
	"selectFolder": "Select a folder",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Load more",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Your Drive is empty",
	"emptyFolder": "This folder is empty",
	"move": "Move"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"unableToProcess": "Der Vorgang konnte nicht abgeschlossen werden",
	"circularReferenceFolder": "Der Zielordner ist ein Unterorder des Ordners, den du verschieben möchtest.",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"uploadFromUrl": "Von einer URL hochladen",
	"uploadFromUrlDescription": "URL der hochzuladenden Datei",
	"uploadFromUrlRequested": "Upload angefordert",
	"uploadFromUrlMayTakeTime": "Es kann eine Weile dauern, bis das Hochladen abgeschlossen ist.",
	"createFolder": "Ordner erstellen",
	"folderName": "Ordnername",
	"renameFolder": "Ordner umbenennen",
	"inputNewFolderName": "Gib einen neuen Ordnernamen ein",
	"unableToDelete": "Nicht löschbar",
	"hasChildFilesOrFolders": "Dieser Ordner kann nicht gelöscht werden, da er nicht leer ist.",
	"addFile": "Datei hinzufügen",
	"upload": "Hochladen",
	"fromUrl": "Von einer URL",
	"drive": "Drive",
	"sort": "Sortieren",
	"registeredDate": "Registrationsdatum",
	"descendingOrder": "Absteigende Reihenfolge",
	"ascendingOrder": "Aufsteigende Reihenfolge",
	"size": "Größe",
	"name": "Name",
	"deleteFolder": "Ordner löschen",
	"edit": "Bearbeiten",
	"selectFolder": "Ordner auswählen",
	"unselectFolder": "Ordnerauswahl aufheben",
	"driveAboutTip": "In Drive sehen Sie eine Liste der Dateien, die Sie in der Vergangenheit hochgeladen haben. \u003cbr>\nSie können diese Dateien wiederverwenden um sie zu beispiel an Notizen anzuhängen, oder sie können Dateien vorab hochzuladen, um sie später zu versenden! \u003cbr>\n\u003cb>Wenn Sie eine Datei löschen, verschwindet sie auch von allen Stellen, an denen Sie sie verwendet haben (Notizen, Seiten, Avatare, Banner usw.).\u003c/b>\u003cbr>\nSie können auch Ordner erstellen, um sie zu organisieren.",
	"loadMore": "Mehr laden",
	"dropHereToUpload": "Dateien hier ablegen, um sie hochzuladen.",
	"emptyDrive": "Deine Drive ist leer",
	"emptyFolder": "Dieser Ordner ist leer",
	"move": "Verschieben"
}
</locale>

<locale locale="en-US" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"uploadFromUrl": "Upload from a URL",
	"uploadFromUrlDescription": "URL of the file you want to upload",
	"uploadFromUrlRequested": "Upload requested",
	"uploadFromUrlMayTakeTime": "It may take some time until the upload is complete.",
	"createFolder": "Create a folder",
	"folderName": "Folder name",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"addFile": "Add a file",
	"upload": "Upload",
	"fromUrl": "From URL",
	"drive": "Drive",
	"sort": "Sorting order",
	"registeredDate": "Joined on",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"size": "Size",
	"name": "Name",
	"deleteFolder": "Delete this folder",
	"edit": "Edit",
	"selectFolder": "Select a folder",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Load more",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Your Drive is empty",
	"emptyFolder": "This folder is empty",
	"move": "Move"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"unableToProcess": "La operación no se puede llevar a cabo",
	"circularReferenceFolder": "La carpeta de destino es una sub-carpeta de la carpeta que quieres mover.",
	"somethingHappened": "Ocurrió un error",
	"uploadFromUrl": "Subir desde una URL",
	"uploadFromUrlDescription": "URL del fichero que quieres subir",
	"uploadFromUrlRequested": "Subida solicitada",
	"uploadFromUrlMayTakeTime": "Subir el fichero puede tardar un tiempo.",
	"createFolder": "Crear carpeta",
	"folderName": "Nombre de la carpeta",
	"renameFolder": "Renombrar carpeta",
	"inputNewFolderName": "Ingrese un nuevo nombre de la carpeta",
	"unableToDelete": "No se puede borrar",
	"hasChildFilesOrFolders": "No se puede borrar esta carpeta. No está vacía.",
	"addFile": "Agregar archivo",
	"upload": "Subir",
	"fromUrl": "Desde la URL",
	"drive": "Drive",
	"sort": "Ordenar",
	"registeredDate": "Fecha de registro",
	"descendingOrder": "Descendente",
	"ascendingOrder": "Ascendente",
	"size": "Tamaño",
	"name": "Nombre",
	"deleteFolder": "Borrar carpeta",
	"edit": "Editar",
	"selectFolder": "Seleccione una carpeta",
	"unselectFolder": "Deseleccionar carpeta",
	"driveAboutTip": "En Drive, aparecerá una lista de los archivos que has subido en el pasado. \u003cbr> \nPuedes reutilizar estos archivos al adjuntarlos a notas, o puedes subir archivos por adelantado para publicarlos más tarde. \u003cbr> \n\u003cb>Ten cuidado al eliminar un archivo, ya que no estará disponible en todos los lugares donde se utilizó (como notas, páginas, avatares, banners, etc.).\u003c/b> \u003cbr> \nTambién puedes crear carpetas para organizar tus archivos.",
	"loadMore": "Ver más",
	"dropHereToUpload": "Arrastra los archivos aquí para subirlos.",
	"emptyDrive": "El drive está vacío",
	"emptyFolder": "La carpeta está vacía",
	"move": "Mover"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"unableToProcess": "L’opération n’a pas pu être complétée.",
	"circularReferenceFolder": "Le dossier de destination est un sous-dossier du dossier que vous souhaitez déplacer.",
	"somethingHappened": "Une erreur est survenue",
	"uploadFromUrl": "Téléverser via une URL",
	"uploadFromUrlDescription": "URL du fichier que vous souhaitez téléverser",
	"uploadFromUrlRequested": "Téléversement demandé",
	"uploadFromUrlMayTakeTime": "Le téléversement de votre fichier peut prendre un certain temps.",
	"createFolder": "Créer un dossier",
	"folderName": "Nom du dossier",
	"renameFolder": "Renommer le dossier",
	"inputNewFolderName": "Entrez un nouveau nom de dossier",
	"unableToDelete": "Suppression impossible",
	"hasChildFilesOrFolders": "Impossible de supprimer ce dossier car il n'est pas vide.",
	"addFile": "Ajouter un fichier",
	"upload": "Téléverser",
	"fromUrl": "Depuis une URL",
	"drive": "Disque",
	"sort": "Trier",
	"registeredDate": "Inscrit le",
	"descendingOrder": "Descendant",
	"ascendingOrder": "Ascendant",
	"size": "Taille",
	"name": "Nom",
	"deleteFolder": "Supprimer le dossier",
	"edit": "Editer",
	"selectFolder": "Sélectionnez un dossier",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Afficher plus …",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Le Disque est vide",
	"emptyFolder": "Le dossier est vide",
	"move": "Déplacer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"unableToProcess": "Operasi tersebut tidak dapat diselesaikan.",
	"circularReferenceFolder": "Folder tujuan adalah subfolder dari folder yang ingin kamu pindahkan.",
	"somethingHappened": "Terjadi kesalahan",
	"uploadFromUrl": "Unggah dari URL",
	"uploadFromUrlDescription": "URL berkas yang ingin kamu unggah",
	"uploadFromUrlRequested": "Pengunggahan telah diminta",
	"uploadFromUrlMayTakeTime": "Membutuhkan beberapa waktu hingga pengunggahan selesai",
	"createFolder": "Buat folder",
	"folderName": "Nama folder",
	"renameFolder": "Ubah nama folder",
	"inputNewFolderName": "Masukkan nama folder yang baru",
	"unableToDelete": "Tidak dapat menghapus",
	"hasChildFilesOrFolders": "Karena folder ini tidak kosong, maka tidak dapat dihapus.",
	"addFile": "Tambahkan berkas",
	"upload": "Unggah",
	"fromUrl": "Dari URL",
	"drive": "Drive",
	"sort": "Urutkan",
	"registeredDate": "Bergabung pada",
	"descendingOrder": "Urutkan menurun",
	"ascendingOrder": "Urutkan naik",
	"size": "Ukuran",
	"name": "Nama",
	"deleteFolder": "Hapus folder",
	"edit": "Sunting",
	"selectFolder": "Pilih folder",
	"unselectFolder": "Membatalkan seleksi folder",
	"driveAboutTip": "Dalam Drive, daftar berkas yang telah anda unggah sebelumnya akan ditampilkan. \u003cbr>\nAnda dapat menggunakan kembali berkas-berkas tersebut dalam lampiran note, atau mengunggah berkas sekarang untuk dipublikasikan nanti. \u003cbr>\n\u003cb>Harap berhati-hati ketika menghapus berkas, karena berkas tersebut akan tidak bisa diakses di semua tempat yang menggunakan berkas tersebut (seperti note, halaman, avatar, banner, dll.)\u003c/b>\u003cbr>\nAnda juga dapat membuat folder untuk menata berkas-berkas anda.",
	"loadMore": "Selebihnya",
	"dropHereToUpload": "Lepas berkas di sini untuk diunggah",
	"emptyDrive": "Drive kosong",
	"emptyFolder": "Folder kosong",
	"move": "Pindah"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"unableToProcess": "Impossibile compiere l'operazione",
	"circularReferenceFolder": "La cartella di destinazione è una sottocartella della cartella che vuoi spostare.",
	"somethingHappened": "Si è verificato un problema",
	"uploadFromUrl": "Incolla URL immagine",
	"uploadFromUrlDescription": "URL del file che vuoi caricare",
	"uploadFromUrlRequested": "Caricamento richiesto",
	"uploadFromUrlMayTakeTime": "Il caricamento del file può richiedere tempo.",
	"createFolder": "Nuova cartella",
	"folderName": "Nome della cartella",
	"renameFolder": "Rinomina cartella",
	"inputNewFolderName": "Inserisci nome della nuova cartella",
	"unableToDelete": "Eliminazione impossibile",
	"hasChildFilesOrFolders": "Impossibile eliminare la cartella perché non è vuota",
	"addFile": "Allega",
	"upload": "Carica",
	"fromUrl": "Dall'URL",
	"drive": "Drive",
	"sort": "Ordina per",
	"registeredDate": "Data iscrizione",
	"descendingOrder": "Diminuisce",
	"ascendingOrder": "Aumenta",
	"size": "Dimensioni",
	"name": "Nome",
	"deleteFolder": "Elimina cartella",
	"edit": "Modifica",
	"selectFolder": "Seleziona cartella",
	"unselectFolder": "Deseleziona la cartella",
	"driveAboutTip": "Il Drive mostra l'elenco di file caricati in passato. Puoi organizzarli in cartelle, riusarli allegandoli ad altre note, o caricarli in anticipo e poi pubblicarli in un secondo momento. Tieni presente che se elimini un file, non sarà più visibile in nessuno degli oggetti a cui è allegato (Note, pagine, avatar, banner, ecc.)",
	"loadMore": "Mostra di più",
	"dropHereToUpload": "Trascina qui il tuo file per caricarlo",
	"emptyDrive": "Il Drive è vuoto",
	"emptyFolder": "La cartella è vuota",
	"move": "Sposta"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"unableToProcess": "操作を完了できません",
	"circularReferenceFolder": "移動先のフォルダーは、移動するフォルダーのサブフォルダーです。",
	"somethingHappened": "問題が発生しました",
	"uploadFromUrl": "URLアップロード",
	"uploadFromUrlDescription": "アップロードしたいファイルのURL",
	"uploadFromUrlRequested": "アップロードをリクエストしました",
	"uploadFromUrlMayTakeTime": "アップロードが完了するまで時間がかかる場合があります。",
	"createFolder": "フォルダーを作成",
	"folderName": "フォルダー名",
	"renameFolder": "フォルダー名を変更",
	"inputNewFolderName": "新しいフォルダ名を入力してください",
	"unableToDelete": "削除できません",
	"hasChildFilesOrFolders": "このフォルダは空でないため、削除できません。",
	"addFile": "ファイルを追加",
	"upload": "アップロード",
	"fromUrl": "URLから",
	"drive": "ドライブ",
	"sort": "ソート",
	"registeredDate": "登録日",
	"descendingOrder": "降順",
	"ascendingOrder": "昇順",
	"size": "サイズ",
	"name": "名前",
	"deleteFolder": "フォルダーを削除",
	"edit": "編集",
	"selectFolder": "フォルダーを選択",
	"unselectFolder": "フォルダーの選択を解除",
	"driveAboutTip": "ドライブでは、過去にアップロードしたファイルの一覧が表示されます。\u003cbr>\nノートに添付する際に再利用したり、あとで投稿するファイルを予めアップロードしておくこともできます。\u003cbr>\n\u003cb>ファイルを削除すると、今までそのファイルを使用した全ての場所(ノート、ページ、アバター、バナー等)からも見えなくなるので注意してください。\u003c/b>\u003cbr>\nフォルダを作って整理することもできます。",
	"loadMore": "もっと見る",
	"dropHereToUpload": "ここにファイルをドロップしてアップロード",
	"emptyDrive": "ドライブは空です",
	"emptyFolder": "フォルダーは空です",
	"move": "移動"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"unableToProcess": "なんか奥の方で詰まってもうた",
	"circularReferenceFolder": "移動先のフォルダーは、移動するフォルダーのサブフォルダーや。",
	"somethingHappened": "なんかあかんわ",
	"uploadFromUrl": "URLアップロード",
	"uploadFromUrlDescription": "このURLのファイルをアップロードしたいねん",
	"uploadFromUrlRequested": "アップロードしたい言うといたで",
	"uploadFromUrlMayTakeTime": "アップロード終わるんにちょい時間かかるかもしれへんわ。",
	"createFolder": "フォルダー作る",
	"folderName": "フォルダー名",
	"renameFolder": "フォルダー名を変える",
	"inputNewFolderName": "今度のフォルダ名は何にするん？",
	"unableToDelete": "消せんかったわ",
	"hasChildFilesOrFolders": "このフォルダは空っぽちゃうから消されへん",
	"addFile": "ファイルを追加",
	"upload": "アップロード",
	"fromUrl": "URLから",
	"drive": "ドライブ",
	"sort": "並び替え",
	"registeredDate": "始めた日",
	"descendingOrder": "大きい順",
	"ascendingOrder": "小さい順",
	"size": "大きさ",
	"name": "名前",
	"deleteFolder": "フォルダーをほかす",
	"edit": "編集",
	"selectFolder": "フォルダ選んでや",
	"unselectFolder": "フォルダーの選択を解除",
	"driveAboutTip": "ドライブでは、今までアップロードしたファイルがずらーっと表示されるで。\u003cbr>\nノートにファイルをもっかいのっけたり、あとで投稿するファイルをその辺に置いとくこともできるねん。\u003cbr>\n\u003cb>ファイルをほかすと、前にそのファイルをのっけた全部の場所(ノート、ページ、アバター、バナー等)からも見えんくなるから気いつけてな。\u003c/b>\u003cbr>\nフォルダを作って整理することもできるで。",
	"loadMore": "まだまだあるで！",
	"dropHereToUpload": "ここにファイルをドロップしてアップロード",
	"emptyDrive": "ドライブは空っぽや",
	"emptyFolder": "このフォルダーは空や",
	"move": "移すで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"uploadFromUrl": "Upload from a URL",
	"uploadFromUrlDescription": "URL of the file you want to upload",
	"uploadFromUrlRequested": "Upload requested",
	"uploadFromUrlMayTakeTime": "It may take some time until the upload is complete.",
	"createFolder": "Create a folder",
	"folderName": "Folder name",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"addFile": "Add a file",
	"upload": "Upload",
	"fromUrl": "From URL",
	"drive": "Drive",
	"sort": "Sorting order",
	"registeredDate": "Joined on",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"size": "Size",
	"name": "Name",
	"deleteFolder": "Delete this folder",
	"edit": "Edit",
	"selectFolder": "Select a folder",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Wali ugar",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Your Drive is empty",
	"emptyFolder": "This folder is empty",
	"move": "Move"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"uploadFromUrl": "Upload from a URL",
	"uploadFromUrlDescription": "URL of the file you want to upload",
	"uploadFromUrlRequested": "Upload requested",
	"uploadFromUrlMayTakeTime": "It may take some time until the upload is complete.",
	"createFolder": "Create a folder",
	"folderName": "Folder name",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"addFile": "Add a file",
	"upload": "Upload",
	"fromUrl": "From URL",
	"drive": "Drive",
	"sort": "Sorting order",
	"registeredDate": "Joined on",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"size": "Size",
	"name": "Name",
	"deleteFolder": "Delete this folder",
	"edit": "Edit",
	"selectFolder": "Select a folder",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "ಇನ್ನಷ್ಟು ನೋಡು",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Your Drive is empty",
	"emptyFolder": "This folder is empty",
	"move": "Move"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"unableToProcess": "작업을 완료할 수 없습니다",
	"circularReferenceFolder": "지정한 폴더가 이동할 폴더의 하위 폴더입니다.",
	"somethingHappened": "오류가 발생했습니다",
	"uploadFromUrl": "URL 업로드",
	"uploadFromUrlDescription": "업로드하려는 파일의 URL",
	"uploadFromUrlRequested": "업로드를 요청했습니다",
	"uploadFromUrlMayTakeTime": "업로드가 완료될 때까지 시간이 소요될 수 있습니다.",
	"createFolder": "폴더 만들기",
	"folderName": "폴더 이름",
	"renameFolder": "폴더 이름 바꾸기",
	"inputNewFolderName": "바꿀 폴더명을 입력해 주세요",
	"unableToDelete": "삭제할 수 없습니다",
	"hasChildFilesOrFolders": "이 폴더는 비어있지 않기 때문에 삭제할 수 없습니다.",
	"addFile": "파일 추가",
	"upload": "업로드",
	"fromUrl": "URL로부터",
	"drive": "드라이브",
	"sort": "정렬",
	"registeredDate": "등록일",
	"descendingOrder": "내림차순",
	"ascendingOrder": "오름차순",
	"size": "크기",
	"name": "이름",
	"deleteFolder": "폴더 삭제",
	"edit": "편집",
	"selectFolder": "폴더 선택",
	"unselectFolder": "폴더 선택 해제",
	"driveAboutTip": "드라이브는 이전에 업로드한 파일 목록을 표시해요. \u003cbr>\n노트에 첨부할 때 다시 사용하거나 나중에 게시할 파일을 미리 업로드할 수 있어요. \u003cbr>\n\u003cb>파일을 삭제하면, 지금까지 그 파일을 사용한 모든 장소(노트, 페이지, 아바타, 배너 등)에서도 보이지 않게 되므로 주의해 주세요. 폴더를 만들고 정리할 수도 있어요.\u003c/b>\u003cbr>",
	"loadMore": "더 보기",
	"dropHereToUpload": "업로드할 파일을 여기로 드롭하십시오",
	"emptyDrive": "드라이브가 비어 있습니다",
	"emptyFolder": "폴더가 비어 있습니다",
	"move": "이동"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"unableToProcess": "De operatie kan niet worden voltooid.",
	"circularReferenceFolder": "De bestemmingsmap is een submap van de map die je wilt verplaatsen.",
	"somethingHappened": "Er is iets misgegaan.",
	"uploadFromUrl": "Uploaden vanaf een URL",
	"uploadFromUrlDescription": "URL van het bestand dat je wil uploaden",
	"uploadFromUrlRequested": "Uploadverzoek",
	"uploadFromUrlMayTakeTime": "Het kan even duren voordat het uploaden voltooid is.",
	"createFolder": "Map aanmaken",
	"folderName": "Mapnaam",
	"renameFolder": "Map hernoemen",
	"inputNewFolderName": "Naam invoeren voor nieuwe map",
	"unableToDelete": "Kan niet worden verwijderd",
	"hasChildFilesOrFolders": "Omdat deze map niet leeg is, kan die niet worden verwijderd.",
	"addFile": "Bestand toevoegen",
	"upload": "Uploaden",
	"fromUrl": "Van  URL",
	"drive": "Schijf",
	"sort": "Sorteren",
	"registeredDate": "Inschrijvingsdatum",
	"descendingOrder": "Aflopende volgorde",
	"ascendingOrder": "Oplopende volgorde",
	"size": "Size",
	"name": "Naam",
	"deleteFolder": "Map verwijderen",
	"edit": "Bewerken",
	"selectFolder": "Kies een map",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Laad meer",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Jouw Drive is leeg.",
	"emptyFolder": "Deze map is leeg",
	"move": "Move"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "Målmappen er en undermappe til mappen du ønsker å flytte.",
	"somethingHappened": "En feil har oppstått",
	"uploadFromUrl": "Last opp fra en URL",
	"uploadFromUrlDescription": "URL til filen du vil laste opp",
	"uploadFromUrlRequested": "Upload requested",
	"uploadFromUrlMayTakeTime": "It may take some time until the upload is complete.",
	"createFolder": "Opprett en mappe",
	"folderName": "Mappenavn",
	"renameFolder": "Endre mappenavn",
	"inputNewFolderName": "Skriv inn et nytt mappenavn",
	"unableToDelete": "Kan ikke slette",
	"hasChildFilesOrFolders": "Siden denne mappen ikke er tom, kan den ikke slettes.",
	"addFile": "Legg til en fil",
	"upload": "Laste opp",
	"fromUrl": "Fra URL",
	"drive": "Drive",
	"sort": "Sorting order",
	"registeredDate": "Joined on",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"size": "Størrelse",
	"name": "Navn",
	"deleteFolder": "Slett denne mappen",
	"edit": "Rediger",
	"selectFolder": "Velg en mappe",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Vis mer",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Your Drive is empty",
	"emptyFolder": "Denne mappen er tom",
	"move": "Flytt"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"unableToProcess": "Nie udało się dokończyć działania.",
	"circularReferenceFolder": "Katalog docelowy jest podkatalogiem katalogu, który chcesz przenieść.",
	"somethingHappened": "Coś poszło nie tak",
	"uploadFromUrl": "Wyślij z adresu URL",
	"uploadFromUrlDescription": "Adres URL pliku, który chcesz wysłać",
	"uploadFromUrlRequested": "Zażądano wysłania",
	"uploadFromUrlMayTakeTime": "Wysyłanie może chwilę potrwać.",
	"createFolder": "Utwórz katalog",
	"folderName": "Nazwa katalogu",
	"renameFolder": "Zmień nazwę katalogu",
	"inputNewFolderName": "Wprowadź nową nazwę katalogu",
	"unableToDelete": "Nie można usunąć",
	"hasChildFilesOrFolders": "Ponieważ ten katalog nie jest pusty, nie może być usunięty.",
	"addFile": "Dodaj plik",
	"upload": "Wyślij",
	"fromUrl": "Z adresu URL",
	"drive": "Dysk",
	"sort": "Sortuj",
	"registeredDate": "Zarejestrowano",
	"descendingOrder": "Malejąco",
	"ascendingOrder": "Rosnąco",
	"size": "Rozmiar",
	"name": "Nazwa",
	"deleteFolder": "Usuń ten katalog",
	"edit": "Edytuj",
	"selectFolder": "Wybierz folder",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Załaduj więcej",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Dysk jest pusty",
	"emptyFolder": "Ten katalog jest pusty",
	"move": "Przenieś"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"unableToProcess": "Não é possível concluir a operação",
	"circularReferenceFolder": "A pasta de destino é uma subpasta da pasta que você deseja mover.",
	"somethingHappened": "Ocorreu um erro",
	"uploadFromUrl": "Enviar por URL",
	"uploadFromUrlDescription": "URL do arquivo que você deseja enviar",
	"uploadFromUrlRequested": "Upload solicitado",
	"uploadFromUrlMayTakeTime": "Pode levar algum tempo para que o upload seja concluído.",
	"createFolder": "Criar pasta",
	"folderName": "Nome da pasta",
	"renameFolder": "Renomear Pasta",
	"inputNewFolderName": "Por favor, digite um novo nome para a pasta!",
	"unableToDelete": "Não é possível excluir",
	"hasChildFilesOrFolders": "Esta pasta não está vazia e não pode ser excluída.",
	"addFile": "Adicionar arquivo",
	"upload": "Fazer upload",
	"fromUrl": "Da URL",
	"drive": "Drive",
	"sort": "Ordenação",
	"registeredDate": "Data de registro",
	"descendingOrder": "Descendente",
	"ascendingOrder": "Ascendente",
	"size": "Tamanho",
	"name": "Nome",
	"deleteFolder": "Excluir pasta",
	"edit": "Editar",
	"selectFolder": "Selecionar uma pasta",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "No Drive, uma lista de arquivos enviados no passado será exibida. \u003cbr>\nVocê pode reutilizar esses arquivos anexando-os às notas, ou você pode enviar arquivos para publicar posteriormente. \u003cbr>\n\u003cb>Cuidado ao excluir um arquivo, pois ele será removido de quaisquer outros lugares onde está sendo utilizado (notas, páginas, avatares, banners, etc.)\u003c/b>\u003cbr>\nVocê também pode criar pastas para organizar seus arquivos.",
	"loadMore": "Carregar mais",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "O drive está vazio",
	"emptyFolder": "A pasta está vazia",
	"move": "Mover"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"unableToProcess": "Не удаётся завершить операцию",
	"circularReferenceFolder": "Вы пытаетесь переместить папку внутрь себя.",
	"somethingHappened": "Что-то пошло не так",
	"uploadFromUrl": "Загрузить по ссылке",
	"uploadFromUrlDescription": "Ссылка на файл, который хотите загрузить",
	"uploadFromUrlRequested": "Загрузка выбранного",
	"uploadFromUrlMayTakeTime": "Загрузка может занять некоторое время.",
	"createFolder": "Создать папку",
	"folderName": "Имя папки",
	"renameFolder": "Переименовать папку",
	"inputNewFolderName": "Пожалуйста, введите новое имя папки!",
	"unableToDelete": "Удаление невозможно",
	"hasChildFilesOrFolders": "Эта папка не пуста и не может быть удалена.",
	"addFile": "Добавить файл",
	"upload": "Загрузить",
	"fromUrl": "По ссылке",
	"drive": "Диск",
	"sort": "Сортировать",
	"registeredDate": "Дата регистрации",
	"descendingOrder": "По убыванию",
	"ascendingOrder": "По возрастанию",
	"size": "Размер",
	"name": "Название",
	"deleteFolder": "Удалить папку",
	"edit": "Изменить",
	"selectFolder": "Выберите папку",
	"unselectFolder": "Снять выбор",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Загрузить ещё",
	"dropHereToUpload": "Переместите файл сюда",
	"emptyDrive": "Диск пуст",
	"emptyFolder": "Папка пуста",
	"move": "Переместить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"unableToProcess": "Operáciu sa nepodarilo dokončiť.",
	"circularReferenceFolder": "Cieľový priečinok je podpriečinkom priečinka, ktorý chcete presunúť.",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"uploadFromUrl": "Nahrať z URL adresy",
	"uploadFromUrlDescription": "URL adresa nahrávaného súboru",
	"uploadFromUrlRequested": "Upload vyžiadaný",
	"uploadFromUrlMayTakeTime": "Nahrávanie môže nejaký čas trvať.",
	"createFolder": "Vytvoriť priečinok",
	"folderName": "Názov priečinka",
	"renameFolder": "Premenovať priečinok",
	"inputNewFolderName": "Zadajte nový názov priečinka",
	"unableToDelete": "Nedá sa odstrániť",
	"hasChildFilesOrFolders": "Nemôžete odstrániť priečinok sú súbormi.",
	"addFile": "Pridať súbor",
	"upload": "Nahrať súbor",
	"fromUrl": "Z URL",
	"drive": "Disk",
	"sort": "Zoradiť",
	"registeredDate": "Dátum registrácie",
	"descendingOrder": "Zostupne",
	"ascendingOrder": "Vzostupne",
	"size": "Veľkosť",
	"name": "Názov",
	"deleteFolder": "Odstrániť priečinok",
	"edit": "Upraviť",
	"selectFolder": "Vyberte priečinok",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Zobraziť viac",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Váš disk je prázdny",
	"emptyFolder": "Tento priečinok je prázdny",
	"move": "Pohyb"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"unableToProcess": "ไม่สามารถดำเนินการให้เสร็จสิ้นได้",
	"circularReferenceFolder": "โฟลเดอร์ปลายทางคือโฟลเดอร์ย่อยของโฟลเดอร์ที่คุณกำลังย้าย",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"uploadFromUrl": "อัปโหลดจาก URL",
	"uploadFromUrlDescription": "URL ของไฟล์ที่คุณต้องการอัปโหลด",
	"uploadFromUrlRequested": "ร้องขอการอัปโหลดแล้ว",
	"uploadFromUrlMayTakeTime": "การอัปโหลดอาจใช้เวลาสักครู่จึงจะเสร็จสมบูรณ์",
	"createFolder": "สร้างโฟลเดอร์",
	"folderName": "ชื่อโฟลเดอร์",
	"renameFolder": "เปลี่ยนชื่อโฟลเดอร์",
	"inputNewFolderName": "กรุณาใส่ชื่อโฟลเดอร์ใหม่",
	"unableToDelete": "ไม่สามารถลบออกได้",
	"hasChildFilesOrFolders": "เนื่องจากโฟลเดอร์นี้ไม่ว่างเปล่า จึงไม่สามารถลบ",
	"addFile": "เพิ่มไฟล์",
	"upload": "อัปโหลด",
	"fromUrl": "จาก URL",
	"drive": "ไดรฟ์",
	"sort": "เรียงลำดับ",
	"registeredDate": "วันที่ลงทะเบียน",
	"descendingOrder": "เรียงลำดับลง",
	"ascendingOrder": "เรียงลำดับขึ้น",
	"size": "ขนาด",
	"name": "ชื่อ",
	"deleteFolder": "ลบโฟลเดอร์",
	"edit": "แก้ไข",
	"selectFolder": "เลือกโฟลเดอร์",
	"unselectFolder": "ยกเลิกการเลือกโฟลเดอร์",
	"driveAboutTip": "ในไดรฟ์จะแสดงรายการไฟล์ที่เคยอัปโหลดไว้ก่อนหน้า\u003cbr>\nสามารถนำมาใช้ซ้ำเมื่อแนบไฟล์ในโน้ต หรือตั้งค่าให้อัปโหลดไฟล์ล่วงหน้าเพื่อนำไปโพสต์ทีหลังได้\u003cbr>\n\u003cb>โปรดระวัง เมื่อลบไฟล์ ไฟล์นั้นจะไม่แสดงในทุกที่ที่เคยใช้ไฟล์นี้ (โน้ต, หน้าเพจ, อวตาร, แบนเนอร์ ฯลฯ)\u003c/b>\u003cbr>\nสามารถสร้างโฟลเดอร์เพื่อจัดระเบียบได้",
	"loadMore": "แสดงเพิ่มเติม",
	"dropHereToUpload": "ดรอปไฟล์ลงที่นี่เพื่ออัปโหลด",
	"emptyDrive": "ไดรฟ์ของคุณว่างเปล่านะ",
	"emptyFolder": "โฟลเดอร์นี้ว่างเปล่า",
	"move": "ย้าย"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"unableToProcess": "İşlem tamamlanamadı.",
	"circularReferenceFolder": "Hedef klasör, taşımak istediğiniz klasörün bir alt klasörü.",
	"somethingHappened": "Bir hata oluştu",
	"uploadFromUrl": "URL'den yükle",
	"uploadFromUrlDescription": "Yüklemek istediğiniz dosyanın URL'si",
	"uploadFromUrlRequested": "Yükleme istendi",
	"uploadFromUrlMayTakeTime": "Yükleme işleminin tamamlanması biraz zaman alabilir.",
	"createFolder": "Bir klasör oluşturun",
	"folderName": "Klasör adı",
	"renameFolder": "Bu klasörü yeniden adlandır",
	"inputNewFolderName": "Yeni bir klasör adı girin",
	"unableToDelete": "Silinemiyor",
	"hasChildFilesOrFolders": "Bu klasör boş olmadığı için silinemez.",
	"addFile": "Bir dosya ekle",
	"upload": "Yükle",
	"fromUrl": "URL'den",
	"drive": "Drive",
	"sort": "Sıralama düzeni",
	"registeredDate": "Katılma tarihi",
	"descendingOrder": "Azalan",
	"ascendingOrder": "Artan",
	"size": "Boyut",
	"name": "İsim",
	"deleteFolder": "Bu klasörü sil",
	"edit": "Düzenle",
	"selectFolder": "Klasör seçin",
	"unselectFolder": "Klasör seçimini kaldır",
	"driveAboutTip": "Drive'da, geçmişte yüklediğin dosyaların bir listesi görüntülenir. \u003cbr>\nBu dosyaları notlara eklerken yeniden kullanabilir veya daha sonra paylaşmak üzere önceden yükleyebilirsin. \u003cbr>\n\u003cb>Bir dosyayı silerken dikkatli ol, çünkü kullanıldığı her yerde (notlar, sayfalar, avatarlar, afişler vb.) mevcut olmayacakt.\u003c/b> \u003cbr>\nAyrıca dosyalarını düzenlemek için klasörler oluşturabilirsin.",
	"loadMore": "Daha fazla yükle",
	"dropHereToUpload": "Yüklemek için dosyalarınızı buraya sürükleyin.",
	"emptyDrive": "Drive boş",
	"emptyFolder": "Bu klasör boş",
	"move": "Taşı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"uploadFromUrl": "Upload from a URL",
	"uploadFromUrlDescription": "URL of the file you want to upload",
	"uploadFromUrlRequested": "Upload requested",
	"uploadFromUrlMayTakeTime": "It may take some time until the upload is complete.",
	"createFolder": "Create a folder",
	"folderName": "Folder name",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"addFile": "Add a file",
	"upload": "Upload",
	"fromUrl": "From URL",
	"drive": "Drive",
	"sort": "Sorting order",
	"registeredDate": "Joined on",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"size": "Size",
	"name": "Name",
	"deleteFolder": "Delete this folder",
	"edit": "Edit",
	"selectFolder": "Select a folder",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "In Drive, a list of files you've uploaded in the past will be displayed. \u003cbr>  \nYou can reuse these files when attaching them to notes, or you can upload files in advance to post later. \u003cbr>  \n\u003cb>Be careful when deleting a file, as it will not be available in all places where it was used (such as notes, pages, avatars, banners, etc.).\u003c/b> \u003cbr>  \nYou can also create folders to organize your files.",
	"loadMore": "Load more",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Your Drive is empty",
	"emptyFolder": "This folder is empty",
	"move": "Move"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"unableToProcess": "Не вдається завершити операцію",
	"circularReferenceFolder": "Ви намагаєтесь перемістити папку в її підпапку.",
	"somethingHappened": "Щось пішло не так",
	"uploadFromUrl": "Завантажити з посилання",
	"uploadFromUrlDescription": "Посилання на файл для завантаження",
	"uploadFromUrlRequested": "Завантаження розпочалось",
	"uploadFromUrlMayTakeTime": "Завантаження може зайняти деякий час.",
	"createFolder": "Створити теку",
	"folderName": "Ім'я теки",
	"renameFolder": "Перейменувати теку",
	"inputNewFolderName": "Введіть ім'я нової теки",
	"unableToDelete": "Видалення неможливе",
	"hasChildFilesOrFolders": "Ця тека не порожня і не може бути видалена",
	"addFile": "Додати файл",
	"upload": "Завантажити",
	"fromUrl": "З посилання",
	"drive": "Диск",
	"sort": "Сортування",
	"registeredDate": "Приєднання",
	"descendingOrder": "За спаданням",
	"ascendingOrder": "За зростанням",
	"size": "Розмір",
	"name": "Ім'я",
	"deleteFolder": "Видалити теку",
	"edit": "Редагувати",
	"selectFolder": "Вибрати теку",
	"unselectFolder": "Скасувати вибір теки",
	"driveAboutTip": "У Диску відображатиметься список файлів, які ви раніше завантажили.\u003cbr>Ви можете повторно використовувати ці файли, прикріплюючи їх до нотаток, або завантажувати файли заздалегідь, щоб опублікувати їх пізніше.\u003cbr>\u003cb>Будьте обережні під час видалення файлу, адже він стане недоступним усюди, де використовувався (наприклад, у нотатках, сторінках, аватарах, банерах тощо).\u003c/b>\u003cbr>Ви також можете створювати теки, щоб упорядкувати файли.",
	"loadMore": "Показати більше",
	"dropHereToUpload": "Перетягніть файли сюди, щоб завантажити",
	"emptyDrive": "Диск порожній",
	"emptyFolder": "Тека порожня",
	"move": "Пересунути"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"unableToProcess": "Không thể hoàn tất hành động",
	"circularReferenceFolder": "Thư mục đích là một thư mục con của thư mục bạn muốn di chuyển.",
	"somethingHappened": "Xảy ra lỗi",
	"uploadFromUrl": "Tải lên bằng một URL",
	"uploadFromUrlDescription": "URL của tập tin bạn muốn tải lên",
	"uploadFromUrlRequested": "Đã yêu cầu tải lên",
	"uploadFromUrlMayTakeTime": "Sẽ mất một khoảng thời gian để tải lên xong.",
	"createFolder": "Tạo thư mục",
	"folderName": "Tên thư mục",
	"renameFolder": "Đổi tên thư mục",
	"inputNewFolderName": "Nhập tên mới cho thư mục",
	"unableToDelete": "Không thể xóa",
	"hasChildFilesOrFolders": "Không thể xóa cho đến khi không còn gì trong thư mục.",
	"addFile": "Thêm tập tin",
	"upload": "Tải lên",
	"fromUrl": "Từ URL",
	"drive": "Ổ đĩa",
	"sort": "Sắp xếp",
	"registeredDate": "Tham gia",
	"descendingOrder": "Giảm dần",
	"ascendingOrder": "Tăng dần",
	"size": "Kích thước",
	"name": "Tên",
	"deleteFolder": "Xóa thư mục",
	"edit": "Sửa",
	"selectFolder": "Chọn thư mục",
	"unselectFolder": "Deselect folder",
	"driveAboutTip": "Trong Drive, danh sách các tệp bạn đã tải lên trước đây sẽ được hiển thị.\u003cbr>\nBạn có thể sử dụng lại chúng khi đính kèm vào ghi chú, hoặc tải lên trước các tệp để đăng sau.\u003cbr>\n\u003cb>Lưu ý rằng nếu bạn xóa một tệp, tệp đó cũng sẽ biến mất khỏi tất cả những nơi đã sử dụng tệp đó (ghi chú, trang, ảnh đại diện, biểu ngữ, v.v.).\u003c/b>\u003cbr>\nBạn cũng có thể tạo các thư mục để sắp xếp chúng.",
	"loadMore": "Tải thêm",
	"dropHereToUpload": "Drop files here to upload",
	"emptyDrive": "Ổ đĩa của bạn trống trơn",
	"emptyFolder": "Thư mục trống",
	"move": "Di chuyển"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"unableToProcess": "操作无法完成",
	"circularReferenceFolder": "目标文件夹是要移动的文件夹的子文件夹。",
	"somethingHappened": "出错了",
	"uploadFromUrl": "从网址上传",
	"uploadFromUrlDescription": "输入文件的 URL",
	"uploadFromUrlRequested": "请求上传",
	"uploadFromUrlMayTakeTime": "上传可能需要一些时间完成。",
	"createFolder": "新建文件夹",
	"folderName": "文件夹名称",
	"renameFolder": "重命名文件夹",
	"inputNewFolderName": "请输入新文件夹名",
	"unableToDelete": "无法删除",
	"hasChildFilesOrFolders": "此文件夹中有文件，无法删除。",
	"addFile": "添加文件",
	"upload": "本地上传",
	"fromUrl": "从 URL",
	"drive": "网盘",
	"sort": "排序",
	"registeredDate": "注册于",
	"descendingOrder": "降序",
	"ascendingOrder": "升序",
	"size": "大小",
	"name": "名称",
	"deleteFolder": "删除文件夹",
	"edit": "编辑",
	"selectFolder": "选择文件夹",
	"unselectFolder": "取消全选文件夹",
	"driveAboutTip": "网盘可以显示以前上传的文件。\u003cbr>\n也可以在发布帖子时重复使用文件，或在发布帖子前预先上传文件。\u003cbr>\n\u003cb>删除文件时，其将从至今为止所有用到该文件的地方（如帖子、页面、头像、横幅）消失。\u003c/b>\u003cbr>\n也可以新建文件夹来整理文件。",
	"loadMore": "查看更多",
	"dropHereToUpload": "将文件拖动到这里来上传",
	"emptyDrive": "网盘中无文件",
	"emptyFolder": "此文件夹为空",
	"move": "移动"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"unableToProcess": "操作無法完成",
	"circularReferenceFolder": "目標文件夾是您要移動的文件夾的子文件夾。",
	"somethingHappened": "發生錯誤",
	"uploadFromUrl": "從 URL 上傳",
	"uploadFromUrlDescription": "您要上傳的檔案網址",
	"uploadFromUrlRequested": "已請求上傳",
	"uploadFromUrlMayTakeTime": "還需要一些時間才能完成上傳。",
	"createFolder": "新增資料夾",
	"folderName": "資料夾名稱",
	"renameFolder": "重新命名資料夾",
	"inputNewFolderName": "輸入新資料夾的名稱",
	"unableToDelete": "無法刪除",
	"hasChildFilesOrFolders": "此文件夾不是空的，無法刪除。",
	"addFile": "加入附件",
	"upload": "上傳",
	"fromUrl": "從 URL 上傳",
	"drive": "雲端硬碟",
	"sort": "排序",
	"registeredDate": "註冊日期",
	"descendingOrder": "降冪",
	"ascendingOrder": "昇冪",
	"size": "大小",
	"name": "名稱",
	"deleteFolder": "刪除資料夾",
	"edit": "編輯",
	"selectFolder": "選擇資料夾",
	"unselectFolder": "取消選擇資料夾",
	"driveAboutTip": "在「雲端硬碟」中，會顯示過去上傳的檔案列表。\u003cbr>\n可以在附加到貼文時重新利用，或者事先上傳之後再用於發布。\u003cbr>\n\u003cb>請注意，刪除檔案後，之前使用過該檔案的所有地方（貼文、頁面、大頭貼、橫幅等）也會一併無法顯示。\u003c/b>\u003cbr>\n也可以建立資料夾來整理檔案。",
	"loadMore": "載入更多",
	"dropHereToUpload": "將檔案拖放至此處即可上傳",
	"emptyDrive": "雲端硬碟為空",
	"emptyFolder": "資料夾為空",
	"move": "移動 "
}
</locale>
