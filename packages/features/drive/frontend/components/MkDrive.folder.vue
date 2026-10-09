<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.draghover]: draghover }]"
	draggable="true"
	:title="title"
	@contextmenu.stop="onContextmenu"
	@mouseover="onMouseover"
	@mouseout="onMouseout"
	@dragover.prevent.stop="onDragover"
	@dragenter.prevent="onDragenter"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
	@dragstart="onDragstart"
	@dragend="onDragend"
>
	<svg :class="[$style.shape]" viewBox="0 0 200 150" preserveAspectRatio="none">
		<path d="M190,25C195.523,25 200,29.477 200,35C200,58.415 200,116.585 200,140C200,145.523 195.523,150 190,150C155.86,150 44.14,150 10,150C4.477,150 0,145.523 0,140C0,112.727 0,37.273 0,10C0,4.477 4.477,0 10,-0C26.642,0 59.332,0 70.858,0C73.51,-0 76.054,1.054 77.929,2.929C82.74,7.74 92.26,17.26 97.071,22.071C98.946,23.946 101.49,25 104.142,25C118.808,25 168.535,25 190,25Z" style="fill:var(--MI_THEME-accentedBg);"/>
	</svg>
	<div :class="$style.name">{{ folder.name }}</div>
	<div v-if="prefer.s.uploadFolder == folder.id" :class="$style.upload">
		{{ $locale.sfc.uploadFolder }}
	</div>
	<button v-if="selectMode" class="_button" :class="$style.checkboxWrapper" @click.prevent.stop="checkboxClicked">
		<div :class="[$style.checkbox, { [$style.checked]: isSelected, 'ti ti-check': isSelected }]"></div>
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { globalEvents } from '@features/runtime/frontend/events.js';
import { checkDragDataType, getDragData, setDragData } from '@features/ui/frontend/drag-and-drop.js';
import { selectDriveFolder } from '@features/drive/frontend/utility/drive.js';

const props = withDefaults(defineProps<{
	folder: Misskey.entities.DriveFolder;
	isSelected?: boolean;
	selectMode?: boolean;
}>(), {
	isSelected: false,
	selectMode: false,
});

const emit = defineEmits<{
	(ev: 'chosen', v: Misskey.entities.DriveFolder): void;
	(ev: 'unchose', v: Misskey.entities.DriveFolder): void;
	(ev: 'upload', files: File[], folder: Misskey.entities.DriveFolder): void;
	(ev: 'dragstart'): void;
	(ev: 'dragend'): void;
}>();

const hover = ref(false);
const draghover = ref(false);
const isDragging = ref(false);

const title = computed(() => props.folder.name);

function checkboxClicked() {
	if (props.isSelected) {
		emit('unchose', props.folder);
	} else {
		emit('chosen', props.folder);
	}
}

function onMouseover() {
	hover.value = true;
}

function onMouseout() {
	hover.value = false;
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	// 自分自身がドラッグされている場合
	if (isDragging.value) {
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
}

function onDragenter() {
	if (!isDragging.value) draghover.value = true;
}

function onDragleave() {
	draghover.value = false;
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
				folderId: props.folder.id,
			}).then(() => {
				globalEvents.emit('driveFilesUpdated', droppedData.map(x => ({
					...x,
					folderId: props.folder.id,
					folder: props.folder,
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
			if (droppedFolder.id === props.folder.id) return;

			misskeyApi('drive/folders/update', {
				folderId: droppedFolder.id,
				parentId: props.folder.id,
			}).then(() => {
				globalEvents.emit('driveFoldersUpdated', [droppedFolder].map(x => ({
					...x,
					parentId: props.folder.id,
					parent: props.folder,
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

function onDragstart(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	ev.dataTransfer.effectAllowed = 'move';
	setDragData(ev, 'driveFolders', [props.folder]);
	isDragging.value = true;

	// 親ブラウザに対して、ドラッグが開始されたフラグを立てる
	// (=あなたの子供が、ドラッグを開始しましたよ)
	emit('dragstart');
}

function onDragend() {
	isDragging.value = false;
	emit('dragend');
}

function rename() {
	os.inputText({
		title: $locale.value.sfc.renameFolder,
		placeholder: $locale.value.sfc.inputNewFolderName,
		default: props.folder.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		misskeyApi('drive/folders/update', {
			folderId: props.folder.id,
			name: name,
		}).then(() => {
			globalEvents.emit('driveFoldersUpdated', [{
				...props.folder,
				name: name,
			}]);
		});
	});
}

function move() {
	selectDriveFolder(null).then(({ canceled, folders }) => {
		if (canceled || (folders[0] && folders[0].id === props.folder.id)) return;

		misskeyApi('drive/folders/update', {
			folderId: props.folder.id,
			parentId: folders[0] ? folders[0].id : null,
		}).then(() => {
			globalEvents.emit('driveFoldersUpdated', [{
				...props.folder,
				parentId: folders[0] ? folders[0].id : null,
				parent: folders[0] ?? null,
			}]);
		});
	});
}

function deleteFolder() {
	misskeyApi('drive/folders/delete', {
		folderId: props.folder.id,
	}).then(() => {
		if (prefer.s.uploadFolder === props.folder.id) {
			prefer.commit('uploadFolder', null);
		}
		globalEvents.emit('driveFoldersDeleted', [props.folder]);
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

function setAsUploadFolder() {
	prefer.commit('uploadFolder', props.folder.id);
}

function onContextmenu(ev: PointerEvent) {
	let menu: MenuItem[];
	menu = [{
		text: $locale.value.sfc.openInWindow,
		icon: 'ti ti-app-window',
		action: async () => {
			const { dispose } = await os.popupAsyncWithDialog(import('@features/drive/frontend/components/MkDriveWindow.vue').then(x => x.default), {
				initialFolder: props.folder,
			}, {
				closed: () => dispose(),
			});
		},
	}, { type: 'divider' }, {
		text: $locale.value.sfc.rename,
		icon: 'ti ti-forms',
		action: rename,
	}, {
		text: $locale.value.sfc.move,
		icon: 'ti ti ti-folder-symlink',
		action: move,
	}, { type: 'divider' }, {
		text: $locale.value.sfc.delete,
		icon: 'ti ti-trash',
		danger: true,
		action: deleteFolder,
	}];
	if (prefer.s.devMode) {
		menu = menu.concat([{ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: $locale.value.sfc.copyFolderId,
			action: () => {
				copyToClipboard(props.folder.id);
			},
		}]);
	}
	os.contextMenu(menu, ev);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	height: 90px;
	padding: 24px 16px;
	box-sizing: border-box;
	cursor: pointer;

	&.draghover {
		&::after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -4px;
			right: -4px;
			bottom: -4px;
			left: -4px;
			border: 2px dashed var(--MI_THEME-focus);
			border-radius: 4px;
		}
	}
}

.shape {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.checkboxWrapper {
	position: absolute;
	border-radius: 50%;
	bottom: 2px;
	right: 2px;
	padding: 8px;
	box-sizing: border-box;

	> .checkbox {
		position: relative;
		width: 18px;
		height: 18px;
		background: #fff;
		border: solid 2px var(--MI_THEME-divider);
		border-radius: 4px;
		box-sizing: border-box;

		&.checked {
			border-color: var(--MI_THEME-accent);
			background: var(--MI_THEME-accent);

			&::before {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				color: #fff;
				font-size: 12px;
				line-height: 18px;
			}
		}
	}

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.name {
	font-size: 0.9em;
}

.icon {
	margin-right: 4px;
	margin-left: 2px;
	text-align: left;
}

.upload {
	font-size: 0.8em;
	text-align: right;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"unableToProcess": "يتعذر إكمال العملية",
	"circularReferenceFolder": "المجلد المستهدف ينتمي للمجلد الذي تريد حذفه",
	"somethingHappened": "حدث خطأ",
	"renameFolder": "إعادة تسمية المجلد",
	"inputNewFolderName": "ادخل الإسم الجديد للمجلد",
	"unableToDelete": "لا يمكن حذفه",
	"hasChildFilesOrFolders": "الان الملف غير فارغ. لا يمكن حذفه",
	"openInWindow": "افتح في نافذة جديدة",
	"rename": "إعادة التسمية",
	"move": "أنقل",
	"delete": "حذف",
	"copyFolderId": "انسخ معرّف المجلد",
	"uploadFolder": "المجلد الافتراضي للرفع"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"unableToProcess": "L'operació no pot ser completada ",
	"circularReferenceFolder": "La carpeta destinatària és una subcarpeta de la carpeta a la qual la desitges moure",
	"somethingHappened": "S'ha produït un error",
	"renameFolder": "Canvia el nom de la carpeta",
	"inputNewFolderName": "Introduïu el nom de la carpeta nova",
	"unableToDelete": "No es pot eliminar",
	"hasChildFilesOrFolders": "No és possible esborrar aquesta carpeta ja que no és buida",
	"openInWindow": "Obrir en una finestra nova",
	"rename": "Canvia el nom",
	"move": "Mou",
	"delete": "Elimina",
	"copyFolderId": "Copiar ID de la carpeta",
	"uploadFolder": "Carpeta per defecte on desar els arxius pujats"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"unableToProcess": "Operace nebyla dokončena.",
	"circularReferenceFolder": "Koncová složka je podsložka složky, kterou chcete přesunout.",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"renameFolder": "Přejmenovat složku",
	"inputNewFolderName": "Zadejte název nové složky",
	"unableToDelete": "Nelze smazat",
	"hasChildFilesOrFolders": "Nemůžete odstranit složku, která není prázdná.",
	"openInWindow": "Otevřít v novém okně",
	"rename": "Přejmenovat",
	"move": "Přesunout",
	"delete": "Smazat",
	"copyFolderId": "Kopírovat ID složky",
	"uploadFolder": "Výchozí lokace pro upload"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"openInWindow": "Open in window",
	"rename": "Rename",
	"move": "Move",
	"delete": "Delete",
	"copyFolderId": "Copy folder ID",
	"uploadFolder": "Default folder for uploads"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"unableToProcess": "Der Vorgang konnte nicht abgeschlossen werden",
	"circularReferenceFolder": "Der Zielordner ist ein Unterorder des Ordners, den du verschieben möchtest.",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"renameFolder": "Ordner umbenennen",
	"inputNewFolderName": "Gib einen neuen Ordnernamen ein",
	"unableToDelete": "Nicht löschbar",
	"hasChildFilesOrFolders": "Dieser Ordner kann nicht gelöscht werden, da er nicht leer ist.",
	"openInWindow": "In einem Fenster öffnen",
	"rename": "Umbenennen",
	"move": "Verschieben",
	"delete": "Löschen",
	"copyFolderId": "Ordner-ID kopieren",
	"uploadFolder": "Standardordner für Uploads"
}
</locale>

<locale locale="en-US" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"openInWindow": "Open in window",
	"rename": "Rename",
	"move": "Move",
	"delete": "Delete",
	"copyFolderId": "Copy folder ID",
	"uploadFolder": "Default folder for uploads"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"unableToProcess": "La operación no se puede llevar a cabo",
	"circularReferenceFolder": "La carpeta de destino es una sub-carpeta de la carpeta que quieres mover.",
	"somethingHappened": "Ocurrió un error",
	"renameFolder": "Renombrar carpeta",
	"inputNewFolderName": "Ingrese un nuevo nombre de la carpeta",
	"unableToDelete": "No se puede borrar",
	"hasChildFilesOrFolders": "No se puede borrar esta carpeta. No está vacía.",
	"openInWindow": "Abrir en una ventana",
	"rename": "Renombrar",
	"move": "Mover",
	"delete": "Borrar",
	"copyFolderId": "Copiar ID de carpeta",
	"uploadFolder": "Carpeta de subidas por defecto"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"unableToProcess": "L’opération n’a pas pu être complétée.",
	"circularReferenceFolder": "Le dossier de destination est un sous-dossier du dossier que vous souhaitez déplacer.",
	"somethingHappened": "Une erreur est survenue",
	"renameFolder": "Renommer le dossier",
	"inputNewFolderName": "Entrez un nouveau nom de dossier",
	"unableToDelete": "Suppression impossible",
	"hasChildFilesOrFolders": "Impossible de supprimer ce dossier car il n'est pas vide.",
	"openInWindow": "Ouvrir dans une nouvelle fenêtre",
	"rename": "Renommer",
	"move": "Déplacer",
	"delete": "Supprimer",
	"copyFolderId": "Copier l'identifiant du dossier",
	"uploadFolder": "Emplacement de téléversement par défaut"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"unableToProcess": "Operasi tersebut tidak dapat diselesaikan.",
	"circularReferenceFolder": "Folder tujuan adalah subfolder dari folder yang ingin kamu pindahkan.",
	"somethingHappened": "Terjadi kesalahan",
	"renameFolder": "Ubah nama folder",
	"inputNewFolderName": "Masukkan nama folder yang baru",
	"unableToDelete": "Tidak dapat menghapus",
	"hasChildFilesOrFolders": "Karena folder ini tidak kosong, maka tidak dapat dihapus.",
	"openInWindow": "Buka di jendela",
	"rename": "Ubah nama",
	"move": "Pindah",
	"delete": "Hapus",
	"copyFolderId": "Salin Folder",
	"uploadFolder": "Lokasi unggah folder bawaan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"unableToProcess": "Impossibile compiere l'operazione",
	"circularReferenceFolder": "La cartella di destinazione è una sottocartella della cartella che vuoi spostare.",
	"somethingHappened": "Si è verificato un problema",
	"renameFolder": "Rinomina cartella",
	"inputNewFolderName": "Inserisci nome della nuova cartella",
	"unableToDelete": "Eliminazione impossibile",
	"hasChildFilesOrFolders": "Impossibile eliminare la cartella perché non è vuota",
	"openInWindow": "Apri in una finestra",
	"rename": "Modifica nome",
	"move": "Sposta",
	"delete": "Elimina",
	"copyFolderId": "Copia ID della cartella",
	"uploadFolder": "Destinazione caricamento predefinita"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"unableToProcess": "操作を完了できません",
	"circularReferenceFolder": "移動先のフォルダーは、移動するフォルダーのサブフォルダーです。",
	"somethingHappened": "問題が発生しました",
	"renameFolder": "フォルダー名を変更",
	"inputNewFolderName": "新しいフォルダ名を入力してください",
	"unableToDelete": "削除できません",
	"hasChildFilesOrFolders": "このフォルダは空でないため、削除できません。",
	"openInWindow": "ウィンドウで開く",
	"rename": "名前を変更",
	"move": "移動",
	"delete": "削除",
	"copyFolderId": "フォルダーIDをコピー",
	"uploadFolder": "既定アップロード先"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"unableToProcess": "なんか奥の方で詰まってもうた",
	"circularReferenceFolder": "移動先のフォルダーは、移動するフォルダーのサブフォルダーや。",
	"somethingHappened": "なんかあかんわ",
	"renameFolder": "フォルダー名を変える",
	"inputNewFolderName": "今度のフォルダ名は何にするん？",
	"unableToDelete": "消せんかったわ",
	"hasChildFilesOrFolders": "このフォルダは空っぽちゃうから消されへん",
	"openInWindow": "ウィンドウで開く",
	"rename": "名前を変えるで",
	"move": "移すで",
	"delete": "ほかす",
	"copyFolderId": "フォルダーIDをコピー",
	"uploadFolder": "とりあえずアップロードしたやつ置いとく所"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"openInWindow": "Open in window",
	"rename": "Rename",
	"move": "Move",
	"delete": "Kkes",
	"copyFolderId": "Copy folder ID",
	"uploadFolder": "Default folder for uploads"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"openInWindow": "Open in window",
	"rename": "Rename",
	"move": "Move",
	"delete": "ಅಳಿಸು",
	"copyFolderId": "Copy folder ID",
	"uploadFolder": "Default folder for uploads"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"unableToProcess": "작업을 완료할 수 없습니다",
	"circularReferenceFolder": "지정한 폴더가 이동할 폴더의 하위 폴더입니다.",
	"somethingHappened": "오류가 발생했습니다",
	"renameFolder": "폴더 이름 바꾸기",
	"inputNewFolderName": "바꿀 폴더명을 입력해 주세요",
	"unableToDelete": "삭제할 수 없습니다",
	"hasChildFilesOrFolders": "이 폴더는 비어있지 않기 때문에 삭제할 수 없습니다.",
	"openInWindow": "창으로 열기",
	"rename": "이름 변경",
	"move": "이동",
	"delete": "삭제",
	"copyFolderId": "폴더 ID 복사",
	"uploadFolder": "기본 업로드 위치"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"unableToProcess": "De operatie kan niet worden voltooid.",
	"circularReferenceFolder": "De bestemmingsmap is een submap van de map die je wilt verplaatsen.",
	"somethingHappened": "Er is iets misgegaan.",
	"renameFolder": "Map hernoemen",
	"inputNewFolderName": "Naam invoeren voor nieuwe map",
	"unableToDelete": "Kan niet worden verwijderd",
	"hasChildFilesOrFolders": "Omdat deze map niet leeg is, kan die niet worden verwijderd.",
	"openInWindow": "In een venster openen",
	"rename": "Hernoemen",
	"move": "Move",
	"delete": "Verwijderen",
	"copyFolderId": "Kopieer folder ID",
	"uploadFolder": "Standaardmap voor uploaden"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "Målmappen er en undermappe til mappen du ønsker å flytte.",
	"somethingHappened": "En feil har oppstått",
	"renameFolder": "Endre mappenavn",
	"inputNewFolderName": "Skriv inn et nytt mappenavn",
	"unableToDelete": "Kan ikke slette",
	"hasChildFilesOrFolders": "Siden denne mappen ikke er tom, kan den ikke slettes.",
	"openInWindow": "Åpne i vindu",
	"rename": "Endre navn",
	"move": "Flytt",
	"delete": "Slett",
	"copyFolderId": "Copy folder ID",
	"uploadFolder": "Default folder for uploads"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"unableToProcess": "Nie udało się dokończyć działania.",
	"circularReferenceFolder": "Katalog docelowy jest podkatalogiem katalogu, który chcesz przenieść.",
	"somethingHappened": "Coś poszło nie tak",
	"renameFolder": "Zmień nazwę katalogu",
	"inputNewFolderName": "Wprowadź nową nazwę katalogu",
	"unableToDelete": "Nie można usunąć",
	"hasChildFilesOrFolders": "Ponieważ ten katalog nie jest pusty, nie może być usunięty.",
	"openInWindow": "Otwórz w oknie",
	"rename": "Zmień nazwę",
	"move": "Przenieś",
	"delete": "Usuń",
	"copyFolderId": "Kopiuj ID folderu",
	"uploadFolder": "Domyślne położenie wysłanych"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"unableToProcess": "Não é possível concluir a operação",
	"circularReferenceFolder": "A pasta de destino é uma subpasta da pasta que você deseja mover.",
	"somethingHappened": "Ocorreu um erro",
	"renameFolder": "Renomear Pasta",
	"inputNewFolderName": "Por favor, digite um novo nome para a pasta!",
	"unableToDelete": "Não é possível excluir",
	"hasChildFilesOrFolders": "Esta pasta não está vazia e não pode ser excluída.",
	"openInWindow": "Abrir em um janela",
	"rename": "Renomear",
	"move": "Mover",
	"delete": "Excluir",
	"copyFolderId": "Copiar o ID da pasta",
	"uploadFolder": "Destino de upload padrão"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"unableToProcess": "Не удаётся завершить операцию",
	"circularReferenceFolder": "Вы пытаетесь переместить папку внутрь себя.",
	"somethingHappened": "Что-то пошло не так",
	"renameFolder": "Переименовать папку",
	"inputNewFolderName": "Пожалуйста, введите новое имя папки!",
	"unableToDelete": "Удаление невозможно",
	"hasChildFilesOrFolders": "Эта папка не пуста и не может быть удалена.",
	"openInWindow": "Открыть в плавающем окне",
	"rename": "Переименовать",
	"move": "Переместить",
	"delete": "Удалить",
	"copyFolderId": "Скопировать ID папки",
	"uploadFolder": "Место загрузки по умолчанию"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"unableToProcess": "Operáciu sa nepodarilo dokončiť.",
	"circularReferenceFolder": "Cieľový priečinok je podpriečinkom priečinka, ktorý chcete presunúť.",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"renameFolder": "Premenovať priečinok",
	"inputNewFolderName": "Zadajte nový názov priečinka",
	"unableToDelete": "Nedá sa odstrániť",
	"hasChildFilesOrFolders": "Nemôžete odstrániť priečinok sú súbormi.",
	"openInWindow": "Otvoriť v novom okne",
	"rename": "Premenovať",
	"move": "Pohyb",
	"delete": "Odstrániť",
	"copyFolderId": "Copy folder ID",
	"uploadFolder": "Predvolený priečinok pre nahrávanie"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"unableToProcess": "ไม่สามารถดำเนินการให้เสร็จสิ้นได้",
	"circularReferenceFolder": "โฟลเดอร์ปลายทางคือโฟลเดอร์ย่อยของโฟลเดอร์ที่คุณกำลังย้าย",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"renameFolder": "เปลี่ยนชื่อโฟลเดอร์",
	"inputNewFolderName": "กรุณาใส่ชื่อโฟลเดอร์ใหม่",
	"unableToDelete": "ไม่สามารถลบออกได้",
	"hasChildFilesOrFolders": "เนื่องจากโฟลเดอร์นี้ไม่ว่างเปล่า จึงไม่สามารถลบ",
	"openInWindow": "เปิดในหน้าต่าง",
	"rename": "เปลี่ยนชื่อ",
	"move": "ย้าย",
	"delete": "ลบ",
	"copyFolderId": "คัดลอกโฟลเดอร์ ID",
	"uploadFolder": "โฟลเดอร์เริ่มต้นสำหรับอัปโหลด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"unableToProcess": "İşlem tamamlanamadı.",
	"circularReferenceFolder": "Hedef klasör, taşımak istediğiniz klasörün bir alt klasörü.",
	"somethingHappened": "Bir hata oluştu",
	"renameFolder": "Bu klasörü yeniden adlandır",
	"inputNewFolderName": "Yeni bir klasör adı girin",
	"unableToDelete": "Silinemiyor",
	"hasChildFilesOrFolders": "Bu klasör boş olmadığı için silinemez.",
	"openInWindow": "Pencerede aç",
	"rename": "Yeniden adlandır",
	"move": "Taşı",
	"delete": "Sil",
	"copyFolderId": "Klasör ID'yi kopyala",
	"uploadFolder": "Yüklemeler için varsayılan klasör"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"unableToProcess": "The operation could not be completed",
	"circularReferenceFolder": "The destination folder is a subfolder of the folder you wish to move.",
	"somethingHappened": "An error has occurred",
	"renameFolder": "Rename this folder",
	"inputNewFolderName": "Enter a new folder name",
	"unableToDelete": "Unable to delete",
	"hasChildFilesOrFolders": "Since this folder is not empty, it can not be deleted.",
	"openInWindow": "Open in window",
	"rename": "Rename",
	"move": "Move",
	"delete": "ئۆچۈرۈش",
	"copyFolderId": "Copy folder ID",
	"uploadFolder": "Default folder for uploads"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"unableToProcess": "Не вдається завершити операцію",
	"circularReferenceFolder": "Ви намагаєтесь перемістити папку в її підпапку.",
	"somethingHappened": "Щось пішло не так",
	"renameFolder": "Перейменувати теку",
	"inputNewFolderName": "Введіть ім'я нової теки",
	"unableToDelete": "Видалення неможливе",
	"hasChildFilesOrFolders": "Ця тека не порожня і не може бути видалена",
	"openInWindow": "Відкрити у вікні",
	"rename": "Перейменувати",
	"move": "Пересунути",
	"delete": "Видалити",
	"copyFolderId": "Копіювати ID теки",
	"uploadFolder": "Місце для завантаження за замовчуванням"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"unableToProcess": "Không thể hoàn tất hành động",
	"circularReferenceFolder": "Thư mục đích là một thư mục con của thư mục bạn muốn di chuyển.",
	"somethingHappened": "Xảy ra lỗi",
	"renameFolder": "Đổi tên thư mục",
	"inputNewFolderName": "Nhập tên mới cho thư mục",
	"unableToDelete": "Không thể xóa",
	"hasChildFilesOrFolders": "Không thể xóa cho đến khi không còn gì trong thư mục.",
	"openInWindow": "Mở trong cửa sổ mới",
	"rename": "Đổi tên",
	"move": "Di chuyển",
	"delete": "Xóa",
	"copyFolderId": "Sao chép ID thư mục",
	"uploadFolder": "Thư mục tải lên mặc định"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"unableToProcess": "操作无法完成",
	"circularReferenceFolder": "目标文件夹是要移动的文件夹的子文件夹。",
	"somethingHappened": "出错了",
	"renameFolder": "重命名文件夹",
	"inputNewFolderName": "请输入新文件夹名",
	"unableToDelete": "无法删除",
	"hasChildFilesOrFolders": "此文件夹中有文件，无法删除。",
	"openInWindow": "在新窗口中打开",
	"rename": "重命名",
	"move": "移动",
	"delete": "删除",
	"copyFolderId": "复制文件夹ID",
	"uploadFolder": "默认上传文件夹"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"unableToProcess": "操作無法完成",
	"circularReferenceFolder": "目標文件夾是您要移動的文件夾的子文件夾。",
	"somethingHappened": "發生錯誤",
	"renameFolder": "重新命名資料夾",
	"inputNewFolderName": "輸入新資料夾的名稱",
	"unableToDelete": "無法刪除",
	"hasChildFilesOrFolders": "此文件夾不是空的，無法刪除。",
	"openInWindow": "在新視窗開啟",
	"rename": "重新命名",
	"move": "移動 ",
	"delete": "刪除",
	"copyFolderId": "複製資料夾ID",
	"uploadFolder": "預設上傳資料夾"
}
</locale>
