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
import { inject } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@features/navigation/frontend/types/menu';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { DI } from '@features/ui/frontend/di.js';
import { globalEvents } from '@features/runtime/frontend/events.js';
import type { Content } from '@features/media/frontend/components/MkLightbox.item.vue';
import { isPreviewable, getType } from '@features/media/frontend/utility/lightbox.js';

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
		text: interpolateLocaleParameters($locale.value.sfc.driveFileDeleteConfirm, { name: file.name }),
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
		text: file.isSensitive ? $locale.value.sfc.unmarkAsSensitive : $locale.value.sfc.markAsSensitive,
		icon: file.isSensitive ? 'ti ti-eye-exclamation' : 'ti ti-eye',
		action: () => { toggleSensitive(file); },
	}, {
		text: $locale.value.sfc.describeFile,
		icon: 'ti ti-text-caption',
		action: () => { describe(file); },
	});

	if (isPreviewable(file.type)) {
		menuItems.push({
			text: $locale.value.sfc.preview,
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
				const { dispose } = await os.popupAsyncWithDialog(import('@features/media/frontend/components/MkLightbox.vue').then(x => x.default), {
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
	"driveFileDeleteConfirm": "أمتأكد من حذف ملف {name}؟ كل الملاحظات المُرفق بها هذا الملف ستحذف.",
	"enterFileName": "ادخل اسم الملف",
	"renameFile": "إعادة تسمية الملف",
	"unmarkAsSensitive": "ألغ تعيينه كمحتوى حساس",
	"markAsSensitive": "علّمه كمحتوى حساس",
	"describeFile": "أضف تعليقًا توضيحيًا",
	"preview": "معاينة",
	"attachCancel": "أزل المرفق",
	"deleteFile": "حُذف الملف",
	"copyFileId": "انسخ معرّف الملف"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"driveFileDeleteConfirm": "Estàs segur que vols suprimir el fitxer \"{name}\"? Les notes associades a aquest fitxer també seran esborrades.",
	"enterFileName": "Defineix nom del fitxer",
	"renameFile": "Canvia el nom del fitxer",
	"unmarkAsSensitive": "Deixar de marcar com a sensible",
	"markAsSensitive": "Marcar com a sensible",
	"describeFile": "Afegir text alternatiu",
	"preview": "Vista prèvia",
	"attachCancel": "Eliminar el fitxer adjunt",
	"deleteFile": "Esborrar l'arxiu ",
	"copyFileId": "Copiar ID de l'arxiu"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"driveFileDeleteConfirm": "Opravdu chcete smazat soubor \"{name}\"? Poznámky, ke kterým je tento soubor připojen, budou také smazány.",
	"enterFileName": "Zadejte název souboru",
	"renameFile": "Přejmenovat soubor",
	"unmarkAsSensitive": "Odznačit jako NSFW",
	"markAsSensitive": "Označit jako NSFW",
	"describeFile": "Přidat popisek",
	"preview": "Náhled",
	"attachCancel": "Odstranit přílohu",
	"deleteFile": "Smazat soubor",
	"copyFileId": "Kopírovat ID souboru"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"driveFileDeleteConfirm": "Are you sure you want to delete \"{name}\"? All notes with this file attached will also be deleted.",
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"describeFile": "Add alt text",
	"preview": "Preview",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"driveFileDeleteConfirm": "Möchtest du die Datei „{name}“ wirklich löschen? Einige Inhalte, die diese Datei verwenden, werden auch verschwinden.",
	"enterFileName": "Dateinamen eingeben",
	"renameFile": "Datei umbenennen",
	"unmarkAsSensitive": "Als nicht sensibel markieren",
	"markAsSensitive": "Als sensibel markieren",
	"describeFile": "Beschreibung hinzufügen",
	"preview": "Vorschau",
	"attachCancel": "Anhang entfernen",
	"deleteFile": "Datei löschen",
	"copyFileId": "Datei-ID kopieren"
}
</locale>

<locale lang="json" locale="en-US">
{
	"driveFileDeleteConfirm": "Are you sure you want to delete \"{name}\"? All notes with this file attached will also be deleted.",
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"describeFile": "Add alt text",
	"preview": "Preview",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"driveFileDeleteConfirm": "¿Desea borrar el archivo \"{name}\"? Las notas que tengan este archivo como adjunto serán eliminadas",
	"enterFileName": "Introduce el nombre del archivo",
	"renameFile": "Renombrar archivo",
	"unmarkAsSensitive": "No marcar como sensible",
	"markAsSensitive": "Marcar como sensible",
	"describeFile": "Añadir texto alternativo",
	"preview": "Vista previa",
	"attachCancel": "Quitar adjunto",
	"deleteFile": "Eliminar archivo",
	"copyFileId": "Copiar ID de archivo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"driveFileDeleteConfirm": "Êtes-vous sûr·e de vouloir supprimer le fichier « {name} » ? Les notes avec ce fichier joint seront aussi supprimées.",
	"enterFileName": "Entrer le nom du fichier",
	"renameFile": "Renommer le fichier",
	"unmarkAsSensitive": "Supprimer le marquage comme sensible",
	"markAsSensitive": "Marquer comme sensible",
	"describeFile": "Ajouter une description d'image",
	"preview": "Aperçu",
	"attachCancel": "Supprimer le fichier joint",
	"deleteFile": "Supprimer le fichier",
	"copyFileId": "Copier l'identifiant du fichier"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"driveFileDeleteConfirm": "Hapus {name}? Catatan dengan berkas terkait juga akan terhapus.",
	"enterFileName": "Masukkan nama berkas",
	"renameFile": "Ubah nama berkas",
	"unmarkAsSensitive": "Hapus tanda konten sensitif",
	"markAsSensitive": "Tandai sebagai konten sensitif",
	"describeFile": "Tambahkan keterangan",
	"preview": "Pratinjau",
	"attachCancel": "Hapus lampiran",
	"deleteFile": "Hapus berkas",
	"copyFileId": "Salin Berkas"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"driveFileDeleteConfirm": "Vuoi davvero eliminare il file \"{name}\", e le Note a cui è stato allegato?",
	"enterFileName": "Nome del file",
	"renameFile": "Rinomina file",
	"unmarkAsSensitive": "Non segnare come esplicito ",
	"markAsSensitive": "Segna come esplicito",
	"describeFile": "Aggiungi una descrizione d'immagine",
	"preview": "Anteprima",
	"attachCancel": "Rimuovi allegato",
	"deleteFile": "Elimina un file dal Drive",
	"copyFileId": "Copia ID del file"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"driveFileDeleteConfirm": "ファイル「{name}」を削除しますか？このファイルを使用した一部のコンテンツも削除されます。",
	"enterFileName": "ファイル名を入力",
	"renameFile": "ファイル名を変更",
	"unmarkAsSensitive": "センシティブを解除する",
	"markAsSensitive": "センシティブとして設定",
	"describeFile": "キャプションを付ける",
	"preview": "プレビュー",
	"attachCancel": "添付取り消し",
	"deleteFile": "ファイルを削除",
	"copyFileId": "ファイルIDをコピー"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"driveFileDeleteConfirm": "ファイル「{name}」をほかしてええか？このファイルを添付したノートも消えてまうで。",
	"enterFileName": "ファイル名を入れてや",
	"renameFile": "ファイル名をいらう",
	"unmarkAsSensitive": "別にええんじゃね？",
	"markAsSensitive": "ちょっと見せられへんわ",
	"describeFile": "キャプションを付ける",
	"preview": "プレビュー",
	"attachCancel": "のっけるのやめる",
	"deleteFile": "ファイルをほかす",
	"copyFileId": "ファイルIDをコピー"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"driveFileDeleteConfirm": "Are you sure you want to delete \"{name}\"? All notes with this file attached will also be deleted.",
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"describeFile": "Add alt text",
	"preview": "Preview",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"driveFileDeleteConfirm": "\"{name}\" ಕಡತವನ್ನು ಅಳಿಸಲು ನೀವು ಬಯಸುವಿರಾ? ಈ ನೋಡಿರಿ ಲಗತ್ತಿಸಲಾದ ಟಿಪ್ಪಣಿ ಸಹ ಕಣ್ಮರೆಯಾಗುತ್ತದೆ.",
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"describeFile": "Add alt text",
	"preview": "Preview",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"driveFileDeleteConfirm": "‘{name}’ 파일을 삭제하시겠습니까? 이 파일을 사용하는 일부 콘텐츠도 삭제됩니다.",
	"enterFileName": "파일명을 입력",
	"renameFile": "파일 이름 변경",
	"unmarkAsSensitive": "열람주의 해제",
	"markAsSensitive": "열람주의로 설정",
	"describeFile": "캡션 추가",
	"preview": "미리보기",
	"attachCancel": "첨부 취소",
	"deleteFile": "파일 삭제",
	"copyFileId": "파일 ID 복사"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"driveFileDeleteConfirm": "Weet je zeker dat je het bestand \"{name}\" wilt verwijderen? Notities met dit bestand als bijlage worden ook verwijderd.",
	"enterFileName": "Invoeren bestandsnaam",
	"renameFile": "Wijzig bestandsnaam",
	"unmarkAsSensitive": "Geen NSFW",
	"markAsSensitive": "Markeren als NSFW",
	"describeFile": "Beschrijving toevoegen",
	"preview": "Voorbeeld",
	"attachCancel": "Verwijder bijlage",
	"deleteFile": "Bestand verwijderen",
	"copyFileId": "Kopieer veld ID"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"driveFileDeleteConfirm": "Er du sikker på at du vil slette \"{name}\"? Det vil også forsvinne fra alt innhold som bruker det.",
	"enterFileName": "Skriv inn filnavn",
	"renameFile": "Endre filnavn",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"describeFile": "Add alt text",
	"preview": "Preview",
	"attachCancel": "Fjern vedlegg",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"driveFileDeleteConfirm": "Czy chcesz usunąć plik \"{name}\"? Zniknie również notatka, do której dołączony jest ten plik.",
	"enterFileName": "Wprowadź nazwę pliku",
	"renameFile": "Zmień nazwę pliku",
	"unmarkAsSensitive": "Cofnij NSFW",
	"markAsSensitive": "Oznacz jako NSFW",
	"describeFile": "Dodaj podpis",
	"preview": "Podgląd",
	"attachCancel": "Usuń załącznik",
	"deleteFile": "Usuń plik",
	"copyFileId": "Kopiuj ID pliku"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"driveFileDeleteConfirm": "Deseja excluir o arquivo '{name}'? Qualquer conteúdo que use este arquivo também será removido.",
	"enterFileName": "Digite o nome do arquivo",
	"renameFile": "Renomear ficheiro",
	"unmarkAsSensitive": "Desmarcar como sensível",
	"markAsSensitive": "Marcar como sensível",
	"describeFile": "Adicionar legenda",
	"preview": "Pré-visualizar",
	"attachCancel": "Remover anexo",
	"deleteFile": "Excluir arquivo",
	"copyFileId": "Copiar o ID do arquivo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"driveFileDeleteConfirm": "Удалить файл «{name}»? Заметки с ним также будут удалены.",
	"enterFileName": "Введите имя файла",
	"renameFile": "Переименовать файл",
	"unmarkAsSensitive": "Снять отметку «не для всех»",
	"markAsSensitive": "Отметить как «не для всех»",
	"describeFile": "Добавить подпись",
	"preview": "Предпросмотр",
	"attachCancel": "Удалить вложение",
	"deleteFile": "Удалить файл",
	"copyFileId": "Скопировать ID файла"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"driveFileDeleteConfirm": "Naozaj chcete odstrániť súbor \"{name}\"? Poznámky s týmto súborom sa odstránia tiež.",
	"enterFileName": "Zadajte názov súboru",
	"renameFile": "Premenovať súbor",
	"unmarkAsSensitive": "Odznačiť NSFW",
	"markAsSensitive": "Označiť ako NSFW",
	"describeFile": "Pridať nadpis",
	"preview": "Náhľad",
	"attachCancel": "Odstrániť prílohu",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"driveFileDeleteConfirm": "ต้องการลบไฟล์ “{name}” ใช่ไหม? โน้ตที่แนบมากับไฟล์นี้ก็จะถูกลบไปด้วย",
	"enterFileName": "พิมพ์ชื่อไฟล์",
	"renameFile": "เปลี่ยนชื่อไฟล์",
	"unmarkAsSensitive": "ยกเลิกทำเครื่องหมายว่ามีเนื้อหาละเอียดอ่อน",
	"markAsSensitive": "ทำเครื่องหมายว่ามีเนื้อหาละเอียดอ่อน",
	"describeFile": "เพิ่มแคปชั่น",
	"preview": "แสดงตัวอย่าง",
	"attachCancel": "ยกเลิกแนบไฟล์",
	"deleteFile": "ลบไฟล์ออก",
	"copyFileId": "คัดลอกไฟล์ ID"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"driveFileDeleteConfirm": "“{name}” dosyasını silmek istediğinden emin misin? Bu dosyaya ekli tüm notlar da silinecek.",
	"enterFileName": "Dosya ismini gir",
	"renameFile": "Dosyayı yeniden adlandır",
	"unmarkAsSensitive": "Hassas içerik işaretini kaldır",
	"markAsSensitive": "Hassas içerik olarak işaretle",
	"describeFile": "Alternatif metin ekle",
	"preview": "Önizleme",
	"attachCancel": "Eki kaldır",
	"deleteFile": "Dosyayı sil",
	"copyFileId": "Dosya ID'yi kopyala"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"driveFileDeleteConfirm": "Are you sure you want to delete \"{name}\"? All notes with this file attached will also be deleted.",
	"enterFileName": "Enter filename",
	"renameFile": "Rename file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"describeFile": "Add alt text",
	"preview": "Preview",
	"attachCancel": "Remove attachment",
	"deleteFile": "Delete file",
	"copyFileId": "Copy file ID"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"driveFileDeleteConfirm": "Ви впевнені, що хочете видалити файл {name}? Нотатки із цим файлом також буде видалено.",
	"enterFileName": "Введіть ім'я файлу",
	"renameFile": "Перейменувати файл",
	"unmarkAsSensitive": "Зняти позначку NSFW",
	"markAsSensitive": "Позначити як NSFW",
	"describeFile": "Додати підпис",
	"preview": "Попередній перегляд",
	"attachCancel": "Видалити вкладення",
	"deleteFile": "Видалити файл",
	"copyFileId": "Скопіювати ідентифікатор файлу."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"driveFileDeleteConfirm": "Bạn có chắc muốn xóa tập tin \"{name}\"? Tút liên quan cũng sẽ bị xóa theo.",
	"enterFileName": "Nhập tên tập tin",
	"renameFile": "Đổi tên tập tin",
	"unmarkAsSensitive": "Bỏ đánh dấu nhạy cảm",
	"markAsSensitive": "Đánh dấu là nhạy cảm",
	"describeFile": "Thêm mô tả",
	"preview": "Xem trước",
	"attachCancel": "Gỡ tập tin đính kèm",
	"deleteFile": "Xoá tệp tin",
	"copyFileId": "Sao chép ID tập tin"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"driveFileDeleteConfirm": "确认删除文件 “{name}” 吗？使用此文件的帖子也将被删除。",
	"enterFileName": "输入文件名",
	"renameFile": "重命名文件",
	"unmarkAsSensitive": "取消标记为敏感内容",
	"markAsSensitive": "标记为敏感内容",
	"describeFile": "添加描述",
	"preview": "预览",
	"attachCancel": "移除附件",
	"deleteFile": "删除文件",
	"copyFileId": "复制文件ID"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"driveFileDeleteConfirm": "確定要刪除檔案「{name}」嗎？使用此檔案的貼文也會跟著被刪除。",
	"enterFileName": "請輸入檔案名稱",
	"renameFile": "重新命名檔案",
	"unmarkAsSensitive": "取消標記為敏感內容",
	"markAsSensitive": "標記為敏感內容",
	"describeFile": "新增標題",
	"preview": "預覽",
	"attachCancel": "移除附件",
	"deleteFile": "刪除檔案",
	"copyFileId": "複製檔案 ID"
}
</locale>
