<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ $locale.sfc.fileViewerThisPageCanBeSeenFromTheAuthor }}</MkInfo>
	<MkLoading v-if="fetching"/>
	<div v-else-if="file" class="_gaps">
		<div :class="$style.filePreviewRoot">
			<MkMediaList :mediaList="[file]" :user="file.user"></MkMediaList>
		</div>
		<div :class="$style.fileQuickActionsRoot">
			<button class="_button" :class="$style.fileNameEditBtn" @click="rename()">
				<h2 class="_nowrap" :class="$style.fileName">{{ file.name }}</h2>
				<i class="ti ti-pencil" :class="$style.fileNameEditIcon"></i>
			</button>
			<div :class="$style.fileQuickActionsOthers">
				<button v-tooltip="$locale.sfc.createNoteFromTheFile" class="_button" :class="$style.fileQuickActionsOthersButton" @click="postThis()">
					<i class="ti ti-pencil"></i>
				</button>
				<button v-if="file.isSensitive" v-tooltip="$locale.sfc.unmarkAsSensitive" class="_button" :class="$style.fileQuickActionsOthersButton" @click="toggleSensitive()">
					<i class="ti ti-eye"></i>
				</button>
				<button v-else v-tooltip="$locale.sfc.markAsSensitive" class="_button" :class="$style.fileQuickActionsOthersButton" @click="toggleSensitive()">
					<i class="ti ti-eye-exclamation"></i>
				</button>
				<a v-tooltip="$locale.sfc.download" :href="file.url" :download="file.name" class="_button" :class="$style.fileQuickActionsOthersButton">
					<i class="ti ti-download"></i>
				</a>
				<button v-tooltip="$locale.sfc.delete" class="_button" :class="[$style.fileQuickActionsOthersButton, $style.danger]" @click="deleteFile()">
					<i class="ti ti-trash"></i>
				</button>
			</div>
		</div>
		<div class="_gaps_s">
			<button class="_button" :class="$style.kvEditBtn" @click="move()">
				<MkKeyValue>
					<template #key>{{ $locale.sfc.folder }}</template>
					<template #value>{{ folderHierarchy.join(' > ') }}<i class="ti ti-pencil" :class="$style.kvEditIcon"></i></template>
				</MkKeyValue>
			</button>
			<button class="_button" :class="$style.kvEditBtn" @click="describe()">
				<MkKeyValue :class="$style.multiline">
					<template #key>{{ $locale.sfc.description }}</template>
					<template #value>{{ file.comment ? file.comment : `(${$locale.sfc.none})` }}<i class="ti ti-pencil" :class="$style.kvEditIcon"></i></template>
				</MkKeyValue>
			</button>
			<MkKeyValue :class="$style.fileMetaDataChildren">
				<template #key>{{ $locale.sfc.fileViewerUploadedAt }}</template>
				<template #value><MkTime :time="file.createdAt" mode="detail"/></template>
			</MkKeyValue>
			<MkKeyValue :class="$style.fileMetaDataChildren">
				<template #key>{{ $locale.sfc.fileViewerType }}</template>
				<template #value>{{ file.type }}</template>
			</MkKeyValue>
			<MkKeyValue :class="$style.fileMetaDataChildren">
				<template #key>{{ $locale.sfc.fileViewerSize }}</template>
				<template #value>{{ bytes(file.size) }}</template>
			</MkKeyValue>
			<MkKeyValue :class="$style.fileMetaDataChildren" :copy="file.url">
				<template #key>URL</template>
				<template #value>{{ file.url }}</template>
			</MkKeyValue>
		</div>
	</div>
	<MkResult v-else type="empty"/>
</div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkMediaList from '@features/drive/frontend/components/MkMediaList.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import bytes from '@features/ui/frontend/filters/bytes.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { selectDriveFolder } from '@features/drive/frontend/utility/drive.js';
import { globalEvents } from '@features/runtime/frontend/events.js';

const router = useRouter();

const props = defineProps<{
	fileId: string;
}>();

const fetching = ref(true);
const file = ref<Misskey.entities.DriveFile>();
const folderHierarchy = computed(() => {
	if (!file.value) return [$locale.value.sfc.drive];
	const folderNames = [$locale.value.sfc.drive];

	function get(folder: Misskey.entities.DriveFolder) {
		if (folder.parent) get(folder.parent);
		folderNames.push(folder.name);
	}

	if (file.value.folder) get(file.value.folder);
	return folderNames;
});
const isImage = computed(() => file.value?.type.startsWith('image/'));

async function _fetch_() {
	fetching.value = true;

	file.value = await misskeyApi('drive/files/show', {
		fileId: props.fileId,
	}).catch((err) => {
		console.error(err);
		return undefined;
	});

	fetching.value = false;
}

function postThis() {
	if (file.value == null) return;

	os.post({
		initialFiles: [file.value],
		instant: true,
	});
}

function move() {
	if (file.value == null) return;

	const f = file.value;

	selectDriveFolder(null).then(({ canceled, folders }) => {
		if (canceled) return;
		misskeyApi('drive/files/update', {
			fileId: f.id,
			folderId: folders[0] ? folders[0].id : null,
		}).then(async () => {
			await _fetch_();
		});
	});
}

function toggleSensitive() {
	if (file.value == null) return;

	os.apiWithDialog('drive/files/update', {
		fileId: file.value.id,
		isSensitive: !file.value.isSensitive,
	}).then(async () => {
		await _fetch_();
	}).catch(err => {
		os.alert({
			type: 'error',
			title: $locale.value.sfc.error,
			text: err.message,
		});
	});
}

function rename() {
	if (file.value == null) return;

	const f = file.value;

	os.inputText({
		title: $locale.value.sfc.renameFile,
		placeholder: $locale.value.sfc.inputNewFileName,
		default: file.value.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		os.apiWithDialog('drive/files/update', {
			fileId: f.id,
			name: name,
		}).then(async () => {
			await _fetch_();
		});
	});
}

async function describe() {
	if (file.value == null) return;

	const f = file.value;

	const { dispose } = await os.popupAsyncWithDialog(import('@features/drive/frontend/components/MkFileCaptionEditWindow.vue').then(x => x.default), {
		default: file.value.comment ?? '',
		file: file.value,
	}, {
		done: caption => {
			os.apiWithDialog('drive/files/update', {
				fileId: f.id,
				comment: caption.length === 0 ? null : caption,
			}).then(async () => {
				await _fetch_();
			});
		},
		closed: () => dispose(),
	});
}

async function deleteFile() {
	if (file.value == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.driveFileDeleteConfirm, { name: file.value.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('drive/files/delete', {
		fileId: file.value.id,
	});

	globalEvents.emit('driveFilesDeleted', [file.value]);

	router.replace('/my/drive');
}

onMounted(async () => {
	await _fetch_();
});
</script>

<style lang="scss" module>

.filePreviewRoot {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
	// MkMediaList 内の上部マージン 4px
	padding: calc(1rem - 4px) 1rem 1rem;
}

.fileQuickActionsRoot {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

@container (min-width: 500px) {
	.fileQuickActionsRoot {
		flex-direction: row;
		align-items: center;
	}
}

.fileQuickActionsOthers {
	margin-left: auto;
	margin-right: 1rem;
	display: flex;
	gap: 8px;

	.fileQuickActionsOthersButton {
		padding: .5rem;
		border-radius: 99rem;

		&:hover,
		&:focus-visible {
			background-color: var(--MI_THEME-accentedBg);
			color: var(--MI_THEME-accent);
			text-decoration: none;
			outline: none;
		}

		&.danger {
			color: #ff2a2a;
		}

		&.danger:hover,
		&.danger:focus-visible {
			background-color: rgba(255, 42, 42, .15);
		}
	}
}

.fileNameEditBtn {
	padding: .5rem 1rem;
	display: flex;
	align-items: center;
	min-width: 0;
	font-weight: 700;
	border-radius: var(--MI-radius);
	font-size: .8rem;

	>.fileNameEditIcon {
		color: transparent;
		visibility: hidden;
		padding-left: .5rem;
	}

	>.fileName {
		margin: 0;
	}

	&:hover {
		background-color: var(--MI_THEME-accentedBg);

		>.fileName,
		>.fileNameEditIcon {
			visibility: visible;
			color: var(--MI_THEME-accent);
		}
	}
}

.fileMetaDataChildren {
	padding: .5rem 1rem;
}

.multiline {
	white-space: pre-wrap;
}

.kvEditBtn {
	text-align: start;
	display: block;
	width: 100%;
	padding: .5rem 1rem;
	border-radius: var(--MI-radius);

	.kvEditIcon {
		display: inline-block;
		color: transparent;
		visibility: hidden;
		padding-left: .5rem;
	}

	&:hover {
		color: var(--MI_THEME-accent);
		background-color: var(--MI_THEME-accentedBg);

		.kvEditIcon {
			color: var(--MI_THEME-accent);
			visibility: visible;
		}
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "أنشئ ملاحظة من هذا الملف",
	"unmarkAsSensitive": "ألغ تعيينه كمحتوى حساس",
	"markAsSensitive": "علّمه كمحتوى حساس",
	"download": "تنزيل",
	"delete": "حذف",
	"folder": "Folder",
	"description": "الوصف",
	"none": "لا شيء",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "قرص التخرين",
	"error": "خطأ",
	"renameFile": "إعادة تسمية الملف",
	"inputNewFileName": "ادخل الإسم الجديد للملف",
	"driveFileDeleteConfirm": "أمتأكد من حذف ملف {name}؟ كل الملاحظات المُرفق بها هذا الملف ستحذف."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Aquesta pàgina només la pot veure l'usuari que ha pujat aquest fitxer.",
	"createNoteFromTheFile": "Escriu una nota incloent aquest fitxer",
	"unmarkAsSensitive": "Deixar de marcar com a sensible",
	"markAsSensitive": "Marcar com a sensible",
	"download": "Descarregar",
	"delete": "Elimina",
	"folder": "Carpeta ",
	"description": "Descripció",
	"none": "Res",
	"fileViewerUploadedAt": "Pujat el",
	"fileViewerType": "Tipus de fitxer",
	"fileViewerSize": "Mida",
	"drive": "Disc",
	"error": "Error",
	"renameFile": "Canvia el nom del fitxer",
	"inputNewFileName": "Introduïu el nom de fitxer nou",
	"driveFileDeleteConfirm": "Estàs segur que vols suprimir el fitxer \"{name}\"? Les notes associades a aquest fitxer també seran esborrades."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Vytvořit poznámku z tohodle souboru",
	"unmarkAsSensitive": "Odznačit jako NSFW",
	"markAsSensitive": "Označit jako NSFW",
	"download": "Stáhnout",
	"delete": "Smazat",
	"folder": "Složka ",
	"description": "Popis",
	"none": "Žádný",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Úložiště",
	"error": "Chyba",
	"renameFile": "Přejmenovat soubor",
	"inputNewFileName": "Zadejte nový název",
	"driveFileDeleteConfirm": "Opravdu chcete smazat soubor \"{name}\"? Poznámky, ke kterým je tento soubor připojen, budou také smazány."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"download": "Download",
	"delete": "Delete",
	"folder": "Folder",
	"description": "Description",
	"none": "None",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Drive",
	"error": "Error",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename",
	"driveFileDeleteConfirm": "Are you sure you want to delete \"{name}\"? All notes with this file attached will also be deleted."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Nur der Benutzer, der diese Datei hochgeladen hat, kann diese Seite sehen.",
	"createNoteFromTheFile": "Notiz für diese Datei schreiben",
	"unmarkAsSensitive": "Als nicht sensibel markieren",
	"markAsSensitive": "Als sensibel markieren",
	"download": "Herunterladen",
	"delete": "Löschen",
	"folder": "Ordner",
	"description": "Beschreibung",
	"none": "Nichts",
	"fileViewerUploadedAt": "Hochgeladen am",
	"fileViewerType": "Dateityp",
	"fileViewerSize": "Dateigröße",
	"drive": "Drive",
	"error": "Fehler",
	"renameFile": "Datei umbenennen",
	"inputNewFileName": "Gib einen neuen Dateinamen ein",
	"driveFileDeleteConfirm": "Möchtest du die Datei „{name}“ wirklich löschen? Einige Inhalte, die diese Datei verwenden, werden auch verschwinden."
}
</locale>

<locale lang="json" locale="en-US">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"download": "Download",
	"delete": "Delete",
	"folder": "Folder",
	"description": "Description",
	"none": "None",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Drive",
	"error": "Error",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename",
	"driveFileDeleteConfirm": "Are you sure you want to delete \"{name}\"? All notes with this file attached will also be deleted."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Esta página solo puede ser vista por el autor.",
	"createNoteFromTheFile": "Componer una nota desde éste archivo",
	"unmarkAsSensitive": "No marcar como sensible",
	"markAsSensitive": "Marcar como sensible",
	"download": "Descargar",
	"delete": "Borrar",
	"folder": "Carpeta",
	"description": "Descripción",
	"none": "Ninguna",
	"fileViewerUploadedAt": "Subido el",
	"fileViewerType": "Tipo de archivo",
	"fileViewerSize": "Tamaño del archivo",
	"drive": "Drive",
	"error": "Error",
	"renameFile": "Renombrar archivo",
	"inputNewFileName": "Ingrese un nuevo nombre de archivo",
	"driveFileDeleteConfirm": "¿Desea borrar el archivo \"{name}\"? Las notas que tengan este archivo como adjunto serán eliminadas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Cette page ne peut être vue que par l'utilisateur qui a téléversé ce fichier.",
	"createNoteFromTheFile": "Rédiger une note de ce fichier",
	"unmarkAsSensitive": "Supprimer le marquage comme sensible",
	"markAsSensitive": "Marquer comme sensible",
	"download": "Télécharger",
	"delete": "Supprimer",
	"folder": "Dossier",
	"description": "Description",
	"none": "Rien",
	"fileViewerUploadedAt": "Date de téléversement",
	"fileViewerType": "Type du fichier",
	"fileViewerSize": "Taille du fichier",
	"drive": "Disque",
	"error": "Erreur",
	"renameFile": "Renommer le fichier",
	"inputNewFileName": "Entrez un nouveau nom de fichier",
	"driveFileDeleteConfirm": "Êtes-vous sûr·e de vouloir supprimer le fichier « {name} » ? Les notes avec ce fichier joint seront aussi supprimées."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Halaman ini hanya dapat dilihat oleh pengguna yang mengunggah bekas ini.",
	"createNoteFromTheFile": "Buat catatan dari berkas ini",
	"unmarkAsSensitive": "Hapus tanda konten sensitif",
	"markAsSensitive": "Tandai sebagai konten sensitif",
	"download": "Unduh",
	"delete": "Hapus",
	"folder": "Folder",
	"description": "Deskripsi",
	"none": "Tidak ada",
	"fileViewerUploadedAt": "Diunggah pada",
	"fileViewerType": "Jenis berkas",
	"fileViewerSize": "Ukuran berkas",
	"drive": "Drive",
	"error": "Galat",
	"renameFile": "Ubah nama berkas",
	"inputNewFileName": "Masukkan nama berkas yang baru",
	"driveFileDeleteConfirm": "Hapus {name}? Catatan dengan berkas terkait juga akan terhapus."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Questa pagina può essere vista solo da chi ha caricato il file.",
	"createNoteFromTheFile": "Crea Nota da questo file",
	"unmarkAsSensitive": "Non segnare come esplicito ",
	"markAsSensitive": "Segna come esplicito",
	"download": "Scarica",
	"delete": "Elimina",
	"folder": "Cartella",
	"description": "Descrizione",
	"none": "Nessuna",
	"fileViewerUploadedAt": "Caricato il",
	"fileViewerType": "Tipo di file",
	"fileViewerSize": "Dimensioni file",
	"drive": "Drive",
	"error": "Errore",
	"renameFile": "Rinomina file",
	"inputNewFileName": "Inserisci nome del nuovo file",
	"driveFileDeleteConfirm": "Vuoi davvero eliminare il file \"{name}\", e le Note a cui è stato allegato?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "このページは、このファイルをアップロードしたユーザーしか閲覧できません。",
	"createNoteFromTheFile": "このファイルからノートを作成",
	"unmarkAsSensitive": "センシティブを解除する",
	"markAsSensitive": "センシティブとして設定",
	"download": "ダウンロード",
	"delete": "削除",
	"folder": "フォルダー",
	"description": "説明",
	"none": "なし",
	"fileViewerUploadedAt": "追加日",
	"fileViewerType": "ファイルタイプ",
	"fileViewerSize": "ファイルサイズ",
	"drive": "ドライブ",
	"error": "エラー",
	"renameFile": "ファイル名を変更",
	"inputNewFileName": "新しいファイル名を入力してください",
	"driveFileDeleteConfirm": "ファイル「{name}」を削除しますか？このファイルを使用した一部のコンテンツも削除されます。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "このページはこのファイルをアップした人しか見れへんねん。",
	"createNoteFromTheFile": "このファイル使うてノート作るで",
	"unmarkAsSensitive": "別にええんじゃね？",
	"markAsSensitive": "ちょっと見せられへんわ",
	"download": "ダウンロード",
	"delete": "ほかす",
	"folder": "フォルダー",
	"description": "説明",
	"none": "なし",
	"fileViewerUploadedAt": "追加した日",
	"fileViewerType": "ファイルの種類",
	"fileViewerSize": "ファイルのでかさ",
	"drive": "ドライブ",
	"error": "おかしなったで",
	"renameFile": "ファイル名をいらう",
	"inputNewFileName": "今度のファイル名は何にするん？",
	"driveFileDeleteConfirm": "ファイル「{name}」をほかしてええか？このファイルを添付したノートも消えてまうで。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"download": "Sider",
	"delete": "Kkes",
	"folder": "Folder",
	"description": "Description",
	"none": "None",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Drive",
	"error": "Error",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename",
	"driveFileDeleteConfirm": "Are you sure you want to delete \"{name}\"? All notes with this file attached will also be deleted."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"download": "ಜಾಲದಿಂದಿಳಿಸು",
	"delete": "ಅಳಿಸು",
	"folder": "Folder",
	"description": "Description",
	"none": "None",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Drive",
	"error": "Error",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename",
	"driveFileDeleteConfirm": "\"{name}\" ಕಡತವನ್ನು ಅಳಿಸಲು ನೀವು ಬಯಸುವಿರಾ? ಈ ನೋಡಿರಿ ಲಗತ್ತಿಸಲಾದ ಟಿಪ್ಪಣಿ ಸಹ ಕಣ್ಮರೆಯಾಗುತ್ತದೆ."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "이 페이지는 파일 소유자만 열람할 수 있습니다",
	"createNoteFromTheFile": "이 파일로 노트를 작성",
	"unmarkAsSensitive": "열람주의 해제",
	"markAsSensitive": "열람주의로 설정",
	"download": "다운로드",
	"delete": "삭제",
	"folder": "폴더",
	"description": "설명",
	"none": "없음",
	"fileViewerUploadedAt": "업로드 날짜",
	"fileViewerType": "파일 유형",
	"fileViewerSize": "파일 크기",
	"drive": "드라이브",
	"error": "오류",
	"renameFile": "파일 이름 변경",
	"inputNewFileName": "바꿀 파일명을 입력해 주세요",
	"driveFileDeleteConfirm": "‘{name}’ 파일을 삭제하시겠습니까? 이 파일을 사용하는 일부 콘텐츠도 삭제됩니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Geen NSFW",
	"markAsSensitive": "Markeren als NSFW",
	"download": "Downloaden",
	"delete": "Verwijderen",
	"folder": "Map",
	"description": "Beschrijving",
	"none": "Niets",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Schijf",
	"error": "Fout",
	"renameFile": "Wijzig bestandsnaam",
	"inputNewFileName": "Voer een nieuwe naam in",
	"driveFileDeleteConfirm": "Weet je zeker dat je het bestand \"{name}\" wilt verwijderen? Notities met dit bestand als bijlage worden ook verwijderd."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"download": "Nedlastinger",
	"delete": "Slett",
	"folder": "Folder",
	"description": "Beskrivelse",
	"none": "Ingen",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Drive",
	"error": "Feil",
	"renameFile": "Endre filnavn",
	"inputNewFileName": "Skriv inn et nytt filnavn",
	"driveFileDeleteConfirm": "Er du sikker på at du vil slette \"{name}\"? Det vil også forsvinne fra alt innhold som bruker det."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Cofnij NSFW",
	"markAsSensitive": "Oznacz jako NSFW",
	"download": "Pobierz",
	"delete": "Usuń",
	"folder": "Folder",
	"description": "Opis",
	"none": "Brak",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Dysk",
	"error": "Błąd",
	"renameFile": "Zmień nazwę pliku",
	"inputNewFileName": "Wprowadź nową nazwę pliku",
	"driveFileDeleteConfirm": "Czy chcesz usunąć plik \"{name}\"? Zniknie również notatka, do której dołączony jest ten plik."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Essa página só pode ser vista pelo usuário que enviou esse arquivo.",
	"createNoteFromTheFile": "Compor nota a partir desse arquivo",
	"unmarkAsSensitive": "Desmarcar como sensível",
	"markAsSensitive": "Marcar como sensível",
	"download": "Descarregar",
	"delete": "Excluir",
	"folder": "Pasta",
	"description": "Descrição",
	"none": "Nenhum",
	"fileViewerUploadedAt": "Adicionado em",
	"fileViewerType": "Tipo de arquivo",
	"fileViewerSize": "Tamanho do arquivo",
	"drive": "Drive",
	"error": "Erro",
	"renameFile": "Renomear ficheiro",
	"inputNewFileName": "Por favor, digite um novo nome para a pasta!",
	"driveFileDeleteConfirm": "Deseja excluir o arquivo '{name}'? Qualquer conteúdo que use este arquivo também será removido."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Создать заметку из этого файла",
	"unmarkAsSensitive": "Снять отметку «не для всех»",
	"markAsSensitive": "Отметить как «не для всех»",
	"download": "Скачать",
	"delete": "Удалить",
	"folder": "Папка",
	"description": "Описание",
	"none": "Ничего",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Диск",
	"error": "Ошибка",
	"renameFile": "Переименовать файл",
	"inputNewFileName": "Введите имя нового файла",
	"driveFileDeleteConfirm": "Удалить файл «{name}»? Заметки с ним также будут удалены."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Odznačiť NSFW",
	"markAsSensitive": "Označiť ako NSFW",
	"download": "Stiahnuť",
	"delete": "Odstrániť",
	"folder": "Folder",
	"description": "Popis",
	"none": "Žiadne",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Disk",
	"error": "Chyba",
	"renameFile": "Premenovať súbor",
	"inputNewFileName": "Zadajte nový názov",
	"driveFileDeleteConfirm": "Naozaj chcete odstrániť súbor \"{name}\"? Poznámky s týmto súborom sa odstránia tiež."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "เฉพาะผู้ใช้ที่อัปโหลดไฟล์นี้เท่านั้นที่สามารถดูหน้าเพจนี้ได้",
	"createNoteFromTheFile": "เรียบเรียงโน้ตจากไฟล์นี้",
	"unmarkAsSensitive": "ยกเลิกทำเครื่องหมายว่ามีเนื้อหาละเอียดอ่อน",
	"markAsSensitive": "ทำเครื่องหมายว่ามีเนื้อหาละเอียดอ่อน",
	"download": "ดาวน์โหลด",
	"delete": "ลบ",
	"folder": "โฟลเดอร์",
	"description": "คำอธิบาย",
	"none": "ไม่มี",
	"fileViewerUploadedAt": "วันที่เข้าร่วม",
	"fileViewerType": "ประเภทไฟล์",
	"fileViewerSize": "ขนาดไฟล์",
	"drive": "ไดรฟ์",
	"error": "ผิดพลาด!",
	"renameFile": "เปลี่ยนชื่อไฟล์",
	"inputNewFileName": "ป้อนชื่อไฟล์ใหม่",
	"driveFileDeleteConfirm": "ต้องการลบไฟล์ “{name}” ใช่ไหม? โน้ตที่แนบมากับไฟล์นี้ก็จะถูกลบไปด้วย"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Bu sayfa, bu dosyayı yükleyen kullanıcı tarafından görülebilir.",
	"createNoteFromTheFile": "Bu dosyadan not oluşturun",
	"unmarkAsSensitive": "Hassas içerik işaretini kaldır",
	"markAsSensitive": "Hassas içerik olarak işaretle",
	"download": "İndir",
	"delete": "Sil",
	"folder": "Dosya",
	"description": "Açıklama",
	"none": "Hiçbiri",
	"fileViewerUploadedAt": "Yüklendiği tarih",
	"fileViewerType": "Dosya türü",
	"fileViewerSize": "Dosya boyutu",
	"drive": "Drive",
	"error": "Hata",
	"renameFile": "Dosyayı yeniden adlandır",
	"inputNewFileName": "Yeni bir dosya adı girin",
	"driveFileDeleteConfirm": "“{name}” dosyasını silmek istediğinden emin misin? Bu dosyaya ekli tüm notlar da silinecek."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Unmark as sensitive",
	"markAsSensitive": "Mark as sensitive",
	"download": "Download",
	"delete": "ئۆچۈرۈش",
	"folder": "Folder",
	"description": "Description",
	"none": "None",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Drive",
	"error": "Error",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename",
	"driveFileDeleteConfirm": "Are you sure you want to delete \"{name}\"? All notes with this file attached will also be deleted."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Створити нотатку з цього файла",
	"unmarkAsSensitive": "Зняти позначку NSFW",
	"markAsSensitive": "Позначити як NSFW",
	"download": "Завантажити",
	"delete": "Видалити",
	"folder": "Тека",
	"description": "Опис",
	"none": "Відсутній",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Диск",
	"error": "Помилка",
	"renameFile": "Перейменувати файл",
	"inputNewFileName": "Введіть ім'я нового файлу",
	"driveFileDeleteConfirm": "Ви впевнені, що хочете видалити файл {name}? Нотатки із цим файлом також буде видалено."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"unmarkAsSensitive": "Bỏ đánh dấu nhạy cảm",
	"markAsSensitive": "Đánh dấu là nhạy cảm",
	"download": "Tải xuống",
	"delete": "Xóa",
	"folder": "Thư mục",
	"description": "Mô tả",
	"none": "Không",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"drive": "Ổ đĩa",
	"error": "Lỗi",
	"renameFile": "Đổi tên tập tin",
	"inputNewFileName": "Nhập tên mới cho tập tin",
	"driveFileDeleteConfirm": "Bạn có chắc muốn xóa tập tin \"{name}\"? Tút liên quan cũng sẽ bị xóa theo."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "此页只能被该文件的上传者查看。",
	"createNoteFromTheFile": "使用该文件发帖",
	"unmarkAsSensitive": "取消标记为敏感内容",
	"markAsSensitive": "标记为敏感内容",
	"download": "下载",
	"delete": "删除",
	"folder": "文件夹",
	"description": "描述",
	"none": "无",
	"fileViewerUploadedAt": "添加日期",
	"fileViewerType": "文件类型",
	"fileViewerSize": "文件大小",
	"drive": "网盘",
	"error": "错误",
	"renameFile": "重命名文件",
	"inputNewFileName": "请输入新文件名",
	"driveFileDeleteConfirm": "确认删除文件 “{name}” 吗？使用此文件的帖子也将被删除。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "本頁面僅限上傳了這個檔案的使用者可以檢視。",
	"createNoteFromTheFile": "由此檔案建立貼文",
	"unmarkAsSensitive": "取消標記為敏感內容",
	"markAsSensitive": "標記為敏感內容",
	"download": "下載",
	"delete": "刪除",
	"folder": "資料夾",
	"description": "描述",
	"none": "無",
	"fileViewerUploadedAt": "加入日期",
	"fileViewerType": "檔案類型 ",
	"fileViewerSize": "檔案大小",
	"drive": "雲端硬碟",
	"error": "錯誤",
	"renameFile": "重新命名檔案",
	"inputNewFileName": "輸入檔案名稱",
	"driveFileDeleteConfirm": "確定要刪除檔案「{name}」嗎？使用此檔案的貼文也會跟著被刪除。"
}
</locale>
