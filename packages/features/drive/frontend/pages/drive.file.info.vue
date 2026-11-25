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
				<button v-if="file.isSensitive" v-tooltip="globalLocale.env.unmarkAsSensitive" class="_button" :class="$style.fileQuickActionsOthersButton" @click="toggleSensitive()">
					<i class="ti ti-eye"></i>
				</button>
				<button v-else v-tooltip="globalLocale.env.markAsSensitive" class="_button" :class="$style.fileQuickActionsOthersButton" @click="toggleSensitive()">
					<i class="ti ti-eye-exclamation"></i>
				</button>
				<a v-tooltip="globalLocale.env.download" :href="file.url" :download="file.name" class="_button" :class="$style.fileQuickActionsOthersButton">
					<i class="ti ti-download"></i>
				</a>
				<button v-tooltip="globalLocale.env.delete" class="_button" :class="[$style.fileQuickActionsOthersButton, $style.danger]" @click="deleteFile()">
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
					<template #key>{{ globalLocale.env.description }}</template>
					<template #value>{{ file.comment ? file.comment : `(${globalLocale.env.none})` }}<i class="ti ti-pencil" :class="$style.kvEditIcon"></i></template>
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
import { useLocale } from 'virtual:vite-vue-internationalization';
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
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const router = useRouter();

const props = defineProps<{
	fileId: string;
}>();

const fetching = ref(true);
const file = ref<Misskey.entities.DriveFile>();
const folderHierarchy = computed(() => {
	if (!file.value) return [globalLocale.value.env.drive];
	const folderNames = [globalLocale.value.env.drive];

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
			title: globalLocale.value.env.error,
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
		text: interpolateLocaleParameters(globalLocale.value.env.driveFileDeleteConfirm, { name: file.value.name }),
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
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "إعادة تسمية الملف",
	"inputNewFileName": "ادخل الإسم الجديد للملف"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Aquesta pàgina només la pot veure l'usuari que ha pujat aquest fitxer.",
	"createNoteFromTheFile": "Escriu una nota incloent aquest fitxer",
	"folder": "Carpeta ",
	"fileViewerUploadedAt": "Pujat el",
	"fileViewerType": "Tipus de fitxer",
	"fileViewerSize": "Mida",
	"renameFile": "Canvia el nom del fitxer",
	"inputNewFileName": "Introduïu el nom de fitxer nou"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Vytvořit poznámku z tohodle souboru",
	"folder": "Složka ",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Přejmenovat soubor",
	"inputNewFileName": "Zadejte nový název"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Nur der Benutzer, der diese Datei hochgeladen hat, kann diese Seite sehen.",
	"createNoteFromTheFile": "Notiz für diese Datei schreiben",
	"folder": "Ordner",
	"fileViewerUploadedAt": "Hochgeladen am",
	"fileViewerType": "Dateityp",
	"fileViewerSize": "Dateigröße",
	"renameFile": "Datei umbenennen",
	"inputNewFileName": "Gib einen neuen Dateinamen ein"
}
</locale>

<locale lang="json" locale="en-US">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Esta página solo puede ser vista por el autor.",
	"createNoteFromTheFile": "Componer una nota desde éste archivo",
	"folder": "Carpeta",
	"fileViewerUploadedAt": "Subido el",
	"fileViewerType": "Tipo de archivo",
	"fileViewerSize": "Tamaño del archivo",
	"renameFile": "Renombrar archivo",
	"inputNewFileName": "Ingrese un nuevo nombre de archivo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Cette page ne peut être vue que par l'utilisateur qui a téléversé ce fichier.",
	"createNoteFromTheFile": "Rédiger une note de ce fichier",
	"folder": "Dossier",
	"fileViewerUploadedAt": "Date de téléversement",
	"fileViewerType": "Type du fichier",
	"fileViewerSize": "Taille du fichier",
	"renameFile": "Renommer le fichier",
	"inputNewFileName": "Entrez un nouveau nom de fichier"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Halaman ini hanya dapat dilihat oleh pengguna yang mengunggah bekas ini.",
	"createNoteFromTheFile": "Buat catatan dari berkas ini",
	"folder": "Folder",
	"fileViewerUploadedAt": "Diunggah pada",
	"fileViewerType": "Jenis berkas",
	"fileViewerSize": "Ukuran berkas",
	"renameFile": "Ubah nama berkas",
	"inputNewFileName": "Masukkan nama berkas yang baru"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Questa pagina può essere vista solo da chi ha caricato il file.",
	"createNoteFromTheFile": "Crea Nota da questo file",
	"folder": "Cartella",
	"fileViewerUploadedAt": "Caricato il",
	"fileViewerType": "Tipo di file",
	"fileViewerSize": "Dimensioni file",
	"renameFile": "Rinomina file",
	"inputNewFileName": "Inserisci nome del nuovo file"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "このページは、このファイルをアップロードしたユーザーしか閲覧できません。",
	"createNoteFromTheFile": "このファイルからノートを作成",
	"folder": "フォルダー",
	"fileViewerUploadedAt": "追加日",
	"fileViewerType": "ファイルタイプ",
	"fileViewerSize": "ファイルサイズ",
	"renameFile": "ファイル名を変更",
	"inputNewFileName": "新しいファイル名を入力してください"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "このページはこのファイルをアップした人しか見れへんねん。",
	"createNoteFromTheFile": "このファイル使うてノート作るで",
	"folder": "フォルダー",
	"fileViewerUploadedAt": "追加した日",
	"fileViewerType": "ファイルの種類",
	"fileViewerSize": "ファイルのでかさ",
	"renameFile": "ファイル名をいらう",
	"inputNewFileName": "今度のファイル名は何にするん？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "이 페이지는 파일 소유자만 열람할 수 있습니다",
	"createNoteFromTheFile": "이 파일로 노트를 작성",
	"folder": "폴더",
	"fileViewerUploadedAt": "업로드 날짜",
	"fileViewerType": "파일 유형",
	"fileViewerSize": "파일 크기",
	"renameFile": "파일 이름 변경",
	"inputNewFileName": "바꿀 파일명을 입력해 주세요"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Map",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Wijzig bestandsnaam",
	"inputNewFileName": "Voer een nieuwe naam in"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Endre filnavn",
	"inputNewFileName": "Skriv inn et nytt filnavn"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Zmień nazwę pliku",
	"inputNewFileName": "Wprowadź nową nazwę pliku"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Essa página só pode ser vista pelo usuário que enviou esse arquivo.",
	"createNoteFromTheFile": "Compor nota a partir desse arquivo",
	"folder": "Pasta",
	"fileViewerUploadedAt": "Adicionado em",
	"fileViewerType": "Tipo de arquivo",
	"fileViewerSize": "Tamanho do arquivo",
	"renameFile": "Renomear ficheiro",
	"inputNewFileName": "Por favor, digite um novo nome para a pasta!"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Создать заметку из этого файла",
	"folder": "Папка",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Переименовать файл",
	"inputNewFileName": "Введите имя нового файла"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Premenovať súbor",
	"inputNewFileName": "Zadajte nový názov"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "เฉพาะผู้ใช้ที่อัปโหลดไฟล์นี้เท่านั้นที่สามารถดูหน้าเพจนี้ได้",
	"createNoteFromTheFile": "เรียบเรียงโน้ตจากไฟล์นี้",
	"folder": "โฟลเดอร์",
	"fileViewerUploadedAt": "วันที่เข้าร่วม",
	"fileViewerType": "ประเภทไฟล์",
	"fileViewerSize": "ขนาดไฟล์",
	"renameFile": "เปลี่ยนชื่อไฟล์",
	"inputNewFileName": "ป้อนชื่อไฟล์ใหม่"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "Bu sayfa, bu dosyayı yükleyen kullanıcı tarafından görülebilir.",
	"createNoteFromTheFile": "Bu dosyadan not oluşturun",
	"folder": "Dosya",
	"fileViewerUploadedAt": "Yüklendiği tarih",
	"fileViewerType": "Dosya türü",
	"fileViewerSize": "Dosya boyutu",
	"renameFile": "Dosyayı yeniden adlandır",
	"inputNewFileName": "Yeni bir dosya adı girin"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Folder",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Rename file",
	"inputNewFileName": "Enter a new filename"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Створити нотатку з цього файла",
	"folder": "Тека",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Перейменувати файл",
	"inputNewFileName": "Введіть ім'я нового файлу"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file.",
	"createNoteFromTheFile": "Compose note from this file",
	"folder": "Thư mục",
	"fileViewerUploadedAt": "Uploaded at",
	"fileViewerType": "File type",
	"fileViewerSize": "Filesize",
	"renameFile": "Đổi tên tập tin",
	"inputNewFileName": "Nhập tên mới cho tập tin"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "此页只能被该文件的上传者查看。",
	"createNoteFromTheFile": "使用该文件发帖",
	"folder": "文件夹",
	"fileViewerUploadedAt": "添加日期",
	"fileViewerType": "文件类型",
	"fileViewerSize": "文件大小",
	"renameFile": "重命名文件",
	"inputNewFileName": "请输入新文件名"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"fileViewerThisPageCanBeSeenFromTheAuthor": "本頁面僅限上傳了這個檔案的使用者可以檢視。",
	"createNoteFromTheFile": "由此檔案建立貼文",
	"folder": "資料夾",
	"fileViewerUploadedAt": "加入日期",
	"fileViewerType": "檔案類型 ",
	"fileViewerSize": "檔案大小",
	"renameFile": "重新命名檔案",
	"inputNewFileName": "輸入檔案名稱"
}
</locale>
