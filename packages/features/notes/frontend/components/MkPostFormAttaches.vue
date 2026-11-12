<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-show="props.modelValue.length != 0" :class="$style.root">
	<MkDraggable
		:modelValue="props.modelValue"
		:class="$style.files"
		direction="horizontal"
		withGaps
		@update:modelValue="v => emit('update:modelValue', v)"
	>
		<template #default="{ item }">
			<div
				:class="$style.file"
				role="button"
				tabindex="0"
				@click="showFileMenu(item, $event)"
				@keydown.space.enter="showFileMenu(item, $event)"
				@contextmenu.prevent.stop="showFileMenu(item, $event)"
			>
				<!-- pointer-eventsをnoneにしておかないとiOSなどでドラッグしたときに画像の方に判定が持ってかれる -->
				<MkDriveFileThumbnail style="pointer-events: none;" :data-id="item.id" :class="$style.thumbnail" :file="item" fit="cover"/>
				<div v-if="item.isSensitive" :class="$style.sensitive" style="pointer-events: none;">
					<i class="ti ti-eye-exclamation" style="margin: auto;"></i>
				</div>
			</div>
		</template>
	</MkDraggable>
	<p
		:class="[$style.remain, {
			[$style.exceeded]: props.modelValue.length > 16,
		}]"
	>
		{{ props.modelValue.length }}/16
	</p>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { inject } from 'vue';
import * as Misskey from 'misskey-js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { DI } from '@features/ui/frontend/di.js';
import { globalEvents } from '@features/runtime/frontend/events.js';
import { isPreviewable, getType } from '@features/drive/frontend/utility/lightbox.js';
import type { Content } from '@features/drive/frontend/components/MkLightbox.item.vue';
import type { MenuItem } from '@features/navigation/frontend/types/menu';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	modelValue: Misskey.entities.DriveFile[];
	detachMediaFn?: (id: string) => void;
}>();

const mock = inject(DI.mock, false);

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.DriveFile[]): void;
	(ev: 'detach', id: string): void;
	(ev: 'changeSensitive', file: Misskey.entities.DriveFile, isSensitive: boolean): void;
	(ev: 'changeName', file: Misskey.entities.DriveFile, newName: string): void;
}>();

let menuShowing = false;

function detachMedia(id: string) {
	if (mock) return;

	if (props.detachMediaFn) {
		props.detachMediaFn(id);
	} else {
		emit('detach', id);
	}
}

async function detachAndDeleteMedia(file: Misskey.entities.DriveFile) {
	if (mock) return;

	detachMedia(file.id);

	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters(globalLocale.value.env.driveFileDeleteConfirm, { name: file.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('drive/files/delete', {
		fileId: file.id,
	});

	globalEvents.emit('driveFilesDeleted', [file]);
}

function toggleSensitive(file: Misskey.entities.DriveFile) {
	if (mock) {
		emit('changeSensitive', file, !file.isSensitive);
		return;
	}

	misskeyApi('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	}).then(() => {
		emit('changeSensitive', file, !file.isSensitive);
	});
}

async function rename(file: Misskey.entities.DriveFile) {
	if (mock) return;

	const { canceled, result } = await os.inputText({
		title: $locale.value.sfc.enterFileName,
		default: file.name,
		minLength: 1,
	});
	if (canceled) return;
	misskeyApi('drive/files/update', {
		fileId: file.id,
		name: result,
	}).then(() => {
		emit('changeName', file, result);
		file.name = result;
	});
}

async function describe(file: Misskey.entities.DriveFile) {
	if (mock) return;

	const { dispose } = await os.popupAsyncWithDialog(import('@features/drive/frontend/components/MkFileCaptionEditWindow.vue').then(x => x.default), {
		default: file.comment !== null ? file.comment : '',
		file: file,
	}, {
		done: caption => {
			let comment = caption.length === 0 ? null : caption;
			misskeyApi('drive/files/update', {
				fileId: file.id,
				comment: comment,
			}).then(() => {
				file.comment = comment;
			});
		},
		closed: () => dispose(),
	});
}

function showFileMenu(file: Misskey.entities.DriveFile, ev: PointerEvent | KeyboardEvent): void {
	if (menuShowing) return;

	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: $locale.value.sfc.renameFile,
		icon: 'ti ti-forms',
		action: () => { rename(file); },
	}, {
		text: file.isSensitive ? globalLocale.value.env.unmarkAsSensitive : globalLocale.value.env.markAsSensitive,
		icon: file.isSensitive ? 'ti ti-eye-exclamation' : 'ti ti-eye',
		action: () => { toggleSensitive(file); },
	}, {
		text: $locale.value.sfc.describeFile,
		icon: 'ti ti-text-caption',
		action: () => { describe(file); },
	});

	if (isPreviewable(file.type)) {
		menuItems.push({
			text: globalLocale.value.env.preview,
			icon: 'ti ti-photo-search',
			action: async () => {
				const constents = props.modelValue.filter(item => isPreviewable(item.type)).map<Content>(item => ({
					id: item.id,
					type: getType(item.type),
					url: item.url,
					thumbnailUrl: item.thumbnailUrl,
					width: item.properties.width,
					height: item.properties.height,
					filename: item.name,
					file: item,
					//sourceElement: TODO
				}));
				const { dispose } = await os.popupAsyncWithDialog(import('@features/drive/frontend/components/MkLightbox.vue').then(x => x.default), {
					defaultIndex: constents.findIndex(content => content.id === file.id),
					contents: constents,
					initiallyRevealedContentIds: [file.id],
				}, {
					closed: () => dispose(),
				});
			},
		});
	}

	menuItems.push({
		type: 'divider',
	}, {
		text: $locale.value.sfc.attachCancel,
		icon: 'ti ti-circle-x',
		action: () => { detachMedia(file.id); },
	}, {
		text: $locale.value.sfc.deleteFile,
		icon: 'ti ti-trash',
		danger: true,
		action: () => { detachAndDeleteMedia(file); },
	});

	if (prefer.s.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: $locale.value.sfc.copyFileId,
			action: () => {
				copyToClipboard(file.id);
			},
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target).then(() => menuShowing = false);
	menuShowing = true;
}
</script>

<style lang="scss" module>
.root {
	padding: 8px 16px;
	position: relative;
}

.files {
	display: flex;
	flex-wrap: wrap;
}

.file {
	position: relative;
	width: 64px;
	height: 64px;
	border-radius: 4px;
	overflow: hidden;
	cursor: move;

	&:focus-visible {
		outline-offset: 4px;
	}
}

.thumbnail {
	width: 100%;
	height: 100%;
	z-index: 1;
	color: var(--MI_THEME-fg);
}

.sensitive {
	display: flex;
	position: absolute;
	width: 64px;
	height: 64px;
	top: 0;
	left: 0;
	z-index: 2;
	background: rgba(17, 17, 17, .7);
	color: #fff;
}

.remain {
	display: block;
	position: absolute;
	top: 8px;
	right: 8px;
	margin: 0;
	padding: 0;
	font-size: 90%;

	&.exceeded {
		color: var(--MI_THEME-error);
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"enterFileName": "ادخل اسم الملف",
	"renameFile": "إعادة تسمية الملف",
	"describeFile": "أضف تعليقًا توضيحيًا",
	"attachCancel": "أزل المرفق",
	"deleteFile": "حُذف الملف",
	"copyFileId": "انسخ معرّف الملف"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"enterFileName": "Defineix nom del fitxer",
	"renameFile": "Canvia el nom del fitxer",
	"describeFile": "Afegir text alternatiu",
	"attachCancel": "Eliminar el fitxer adjunt",
	"deleteFile": "Esborrar l'arxiu ",
	"copyFileId": "Copiar ID de l'arxiu"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"enterFileName": "Zadejte název souboru",
	"renameFile": "Přejmenovat soubor",
	"describeFile": "Přidat popisek",
	"attachCancel": "Odstranit přílohu",
	"deleteFile": "Smazat soubor",
	"copyFileId": "Kopírovat ID souboru"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"describeFile": "Add alt text",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"enterFileName": "Dateinamen eingeben",
	"renameFile": "Datei umbenennen",
	"describeFile": "Beschreibung hinzufügen",
	"attachCancel": "Anhang entfernen",
	"deleteFile": "Datei löschen",
	"copyFileId": "Datei-ID kopieren"
}
</locale>

<locale lang="json" locale="en-US">
{
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"describeFile": "Add alt text",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"enterFileName": "Introduce el nombre del archivo",
	"renameFile": "Renombrar archivo",
	"describeFile": "Añadir texto alternativo",
	"attachCancel": "Quitar adjunto",
	"deleteFile": "Eliminar archivo",
	"copyFileId": "Copiar ID de archivo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"enterFileName": "Entrer le nom du fichier",
	"renameFile": "Renommer le fichier",
	"describeFile": "Ajouter une description d'image",
	"attachCancel": "Supprimer le fichier joint",
	"deleteFile": "Supprimer le fichier",
	"copyFileId": "Copier l'identifiant du fichier"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"enterFileName": "Masukkan nama berkas",
	"renameFile": "Ubah nama berkas",
	"describeFile": "Tambahkan keterangan",
	"attachCancel": "Hapus lampiran",
	"deleteFile": "Hapus berkas",
	"copyFileId": "Salin Berkas"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"enterFileName": "Nome del file",
	"renameFile": "Rinomina file",
	"describeFile": "Aggiungi una descrizione d'immagine",
	"attachCancel": "Rimuovi allegato",
	"deleteFile": "Elimina un file dal Drive",
	"copyFileId": "Copia ID del file"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"enterFileName": "ファイル名を入力",
	"renameFile": "ファイル名を変更",
	"describeFile": "キャプションを付ける",
	"attachCancel": "添付取り消し",
	"deleteFile": "ファイルを削除",
	"copyFileId": "ファイルIDをコピー"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"enterFileName": "ファイル名を入れてや",
	"renameFile": "ファイル名をいらう",
	"describeFile": "キャプションを付ける",
	"attachCancel": "のっけるのやめる",
	"deleteFile": "ファイルをほかす",
	"copyFileId": "ファイルIDをコピー"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"describeFile": "Add alt text",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"describeFile": "Add alt text",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"enterFileName": "파일명을 입력",
	"renameFile": "파일 이름 변경",
	"describeFile": "캡션 추가",
	"attachCancel": "첨부 취소",
	"deleteFile": "파일 삭제",
	"copyFileId": "파일 ID 복사"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"enterFileName": "Invoeren bestandsnaam",
	"renameFile": "Wijzig bestandsnaam",
	"describeFile": "Beschrijving toevoegen",
	"attachCancel": "Verwijder bijlage",
	"deleteFile": "Bestand verwijderen",
	"copyFileId": "Kopieer veld ID"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"enterFileName": "Skriv inn filnavn",
	"renameFile": "Endre filnavn",
	"describeFile": "Add alt text",
	"attachCancel": "Fjern vedlegg",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"enterFileName": "Wprowadź nazwę pliku",
	"renameFile": "Zmień nazwę pliku",
	"describeFile": "Dodaj podpis",
	"attachCancel": "Usuń załącznik",
	"deleteFile": "Usuń plik",
	"copyFileId": "Kopiuj ID pliku"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"enterFileName": "Digite o nome do arquivo",
	"renameFile": "Renomear ficheiro",
	"describeFile": "Adicionar legenda",
	"attachCancel": "Remover anexo",
	"deleteFile": "Excluir arquivo",
	"copyFileId": "Copiar o ID do arquivo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"enterFileName": "Введите имя файла",
	"renameFile": "Переименовать файл",
	"describeFile": "Добавить подпись",
	"attachCancel": "Удалить вложение",
	"deleteFile": "Удалить файл",
	"copyFileId": "Скопировать ID файла"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"enterFileName": "Zadajte názov súboru",
	"renameFile": "Premenovať súbor",
	"describeFile": "Pridať nadpis",
	"attachCancel": "Odstrániť prílohu",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"enterFileName": "พิมพ์ชื่อไฟล์",
	"renameFile": "เปลี่ยนชื่อไฟล์",
	"describeFile": "เพิ่มแคปชั่น",
	"attachCancel": "ยกเลิกแนบไฟล์",
	"deleteFile": "ลบไฟล์ออก",
	"copyFileId": "คัดลอกไฟล์ ID"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"enterFileName": "Dosya ismini gir",
	"renameFile": "Dosyayı yeniden adlandır",
	"describeFile": "Alternatif metin ekle",
	"attachCancel": "Eki kaldır",
	"deleteFile": "Dosyayı sil",
	"copyFileId": "Dosya ID'yi kopyala"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"describeFile": "Add alt text",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"enterFileName": "Введіть ім'я файлу",
	"renameFile": "Перейменувати файл",
	"describeFile": "Додати підпис",
	"attachCancel": "Видалити вкладення",
	"deleteFile": "Видалити файл",
	"copyFileId": "Скопіювати ідентифікатор файлу."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"enterFileName": "Nhập tên tập tin",
	"renameFile": "Đổi tên tập tin",
	"describeFile": "Thêm mô tả",
	"attachCancel": "Gỡ tập tin đính kèm",
	"deleteFile": "Xoá tệp tin",
	"copyFileId": "Sao chép ID tập tin"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"enterFileName": "输入文件名",
	"renameFile": "重命名文件",
	"describeFile": "添加描述",
	"attachCancel": "移除附件",
	"deleteFile": "删除文件",
	"copyFileId": "复制文件ID"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"enterFileName": "請輸入檔案名稱",
	"renameFile": "重新命名檔案",
	"describeFile": "新增標題",
	"attachCancel": "移除附件",
	"deleteFile": "刪除檔案",
	"copyFileId": "複製檔案 ID"
}
</locale>
