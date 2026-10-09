<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="800"
	:height="500"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header>
		<i class="ti ti-upload"></i> {{ interpolateLocaleParameters($locale.sfc.uploadNFiles, { n: files.length }) }}
	</template>

	<div :class="$style.root">
		<div :class="[$style.overallProgress, canRetry ? $style.overallProgressError : null]" :style="{ '--op': `${overallProgress}%` }"></div>

		<div class="_gaps_s _spacer">
			<MkTip k="uploader">
				{{ $locale.sfc.uploaderTip }}
			</MkTip>

			<MkUploaderItems :items="items" @showMenu="(item, ev) => showPerItemMenu(item, ev)" @showMenuViaContextmenu="(item, ev) => showPerItemMenuViaContextmenu(item, ev)"/>

			<div v-if="props.multiple">
				<MkButton style="margin: auto;" :iconOnly="true" rounded @click="chooseFile($event)"><i class="ti ti-plus"></i></MkButton>
			</div>

			<div>{{ interpolateLocaleParameters($locale.sfc.uploaderMaxFileSizeIsX, { x: $i.policies.maxFileSizeMb + 'MB' }) }}</div>

			<!-- クライアントで検出するMIME typeとサーバーで検出するMIME typeが異なる場合があり、混乱の元になるのでとりあえず隠しとく -->
			<!-- https://github.com/misskey-dev/misskey/issues/16091 -->
			<!-- https://github.com/misskey-dev/misskey/issues/16663 -->
			<!--<div>{{ $locale.sfc.uploaderAllowedTypes }}: {{ $i.policies.uploadableFileTypes.join(', ') }}</div>-->
		</div>
	</div>

	<template #footer>
		<div class="_buttonsCenter">
			<MkButton v-if="uploader.uploading.value" rounded @click="abortWithConfirm()"><i class="ti ti-x"></i> {{ $locale.sfc.abort }}</MkButton>
			<MkButton v-else-if="!firstUploadAttempted" primary rounded :disabled="!uploader.readyForUpload.value" @click="upload()"><i class="ti ti-upload"></i> {{ $locale.sfc.upload }}</MkButton>

			<MkButton v-if="canRetry" rounded @click="upload()"><i class="ti ti-reload"></i> {{ $locale.sfc.retry }}</MkButton>
			<MkButton v-if="canDone" rounded @click="done()"><i class="ti ti-arrow-right"></i> {{ $locale.sfc.done }}</MkButton>
		</div>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import type { UploaderFeatures, UploaderItem } from '@features/drive/frontend/composables/use-uploader.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { useUploader } from '@features/drive/frontend/composables/use-uploader.js';
import MkUploaderItems from '@features/drive/frontend/components/MkUploaderItems.vue';

const $i = ensureSignin();

const props = withDefaults(defineProps<{
	files: File[];
	folderId?: string | null;
	multiple?: boolean;
	features?: UploaderFeatures;
}>(), {
	multiple: true,
});

const emit = defineEmits<{
	(ev: 'done', driveFiles: Misskey.entities.DriveFile[]): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const uploader = useUploader({
	multiple: props.multiple,
	folderId: props.folderId,
	features: props.features,
});

onMounted(() => {
	uploader.addFiles(props.files);
});

const items = uploader.items;

const firstUploadAttempted = ref(false);
const canRetry = computed(() => firstUploadAttempted.value && uploader.readyForUpload.value);
const canDone = computed(() => items.value.some(item => item.uploaded != null));
const overallProgress = computed(() => {
	const max = items.value.length;
	if (max === 0) return 0;
	const v = items.value.reduce((acc, item) => {
		if (item.uploaded) return acc + 1;
		if (item.progress) return acc + (item.progress.value / item.progress.max);
		return acc;
	}, 0);
	return Math.round((v / max) * 100);
});

watch(items, () => {
	if (items.value.length === 0) {
		emit('canceled');
		dialog.value?.close();
		return;
	}

	if (items.value.every(item => item.uploaded)) {
		emit('done', items.value.map(item => item.uploaded!));
		dialog.value?.close();
	}
}, { deep: true });

async function cancel() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: $locale.value.sfc.uploaderAbortConfirm,
		okText: $locale.value.sfc.yes,
		cancelText: $locale.value.sfc.no,
	});
	if (canceled) return;

	uploader.abortAll();
	emit('canceled');
	dialog.value?.close();
}

function upload() {
	firstUploadAttempted.value = true;
	uploader.upload();
}

async function abortWithConfirm() {
	const { canceled } = await os.confirm({
		type: 'question',
		text: $locale.value.sfc.uploaderAbortConfirm,
		okText: $locale.value.sfc.yes,
		cancelText: $locale.value.sfc.no,
	});
	if (canceled) return;

	uploader.abortAll();
}

async function done() {
	if (!uploader.allItemsUploaded.value) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: $locale.value.sfc.uploaderDoneConfirm,
			okText: $locale.value.sfc.yes,
			cancelText: $locale.value.sfc.no,
		});
		if (canceled) return;
	}

	emit('done', items.value.filter(item => item.uploaded != null).map(item => item.uploaded!));
	dialog.value?.close();
}

async function chooseFile(ev: PointerEvent) {
	const newFiles = await os.chooseFileFromPc({ multiple: true });
	uploader.addFiles(newFiles);
}

function showPerItemMenu(item: UploaderItem, ev: PointerEvent) {
	const menu = uploader.getMenu(item);
	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function showPerItemMenuViaContextmenu(item: UploaderItem, ev: PointerEvent) {
	const menu = uploader.getMenu(item);
	os.contextMenu(menu, ev);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.overallProgress {
	position: absolute;
	top: 0;
	left: 0;
	width: var(--op);
	height: 4px;
	background: var(--MI_THEME-accent);
	border-radius: 0 999px 999px 0;
	transition: width 0.2s ease;

	&.overallProgressError {
		background: var(--MI_THEME-warn);
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "ارفع",
	"retry": "حاول مجددًا",
	"done": "تمّ",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "نعم",
	"no": "لا",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"uploadNFiles": "Pujar {n} arxius",
	"uploaderTip": "L'arxiu encara no s'ha carregat. En aquest quadre de diàleg, pots comprovar, canviar el nom, comprimir i retallar l'arxiu abans de pujar-lo. Quan estigui llest pots iniciar la càrrega polsant el boto \"Pujar\"",
	"uploaderMaxFileSizeIsX": "La mida màxima d'arxiu que es pot pujar és {x}.",
	"uploaderAllowedTypes": "Tipus de fitxers que en podeu pujar",
	"abort": "Cancel·lar",
	"upload": "Puja",
	"retry": "Torna-ho a provar",
	"done": "Fet",
	"uploaderAbortConfirm": "Hi ha un arxiu que no s'ha pujat, vols cancel·lar?",
	"yes": "Sí ",
	"no": "No",
	"uploaderDoneConfirm": "Hi han fitxers no pujats, vols completar-los?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"uploadNFiles": "Uploadovat {n} souborů",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Nahrát soubory",
	"retry": "Opakovat",
	"done": "Hotovo",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Ano",
	"no": "Ne",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Upload",
	"retry": "Retry",
	"done": "Done",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Yes",
	"no": "No",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"uploadNFiles": "Lade {n} Dateien hoch",
	"uploaderTip": "Die Datei ist noch nicht hochgeladen worden. In diesem Dialog kannst du die Datei vor dem Hochladen anzeigen, umbenennen, komprimieren und zuschneiden. Wenn du fertig bist, klicke auf „Hochladen“, um den Upload zu starten.",
	"uploaderMaxFileSizeIsX": "Die maximale Dateigröße, die hochgeladen werden kann, beträgt {x}.",
	"uploaderAllowedTypes": "Hochladbare Dateitypen",
	"abort": "Abbrechen",
	"upload": "Hochladen",
	"retry": "Wiederholen",
	"done": "Fertig",
	"uploaderAbortConfirm": "Einige Dateien wurden nicht hochgeladen. Möchtest du den Vorgang abbrechen?",
	"yes": "Ja",
	"no": "Nein",
	"uploaderDoneConfirm": "Einige Dateien wurden nicht hochgeladen. Möchtest du den Vorgang fortsetzen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Upload",
	"retry": "Retry",
	"done": "Done",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Yes",
	"no": "No",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"uploadNFiles": "Subir {n} archivos",
	"uploaderTip": "El archivo aún no se ha cargado, por lo que este cuadro de diálogo te permite confirmar, renombrar, comprimir y recortar el archivo antes de cargarlo. Cuando esté listo, puedes iniciar la carga pulsando el botón \"Cargar\".",
	"uploaderMaxFileSizeIsX": "El tamaño máximo de archivo que se puede cargar es de {x}",
	"uploaderAllowedTypes": "Tipos de archivos que se pueden cargar.",
	"abort": "Abortar",
	"upload": "Subir",
	"retry": "Reintentar",
	"done": "Hecho",
	"uploaderAbortConfirm": "Algunos archivos no se han cargado, ¿deseas cancelar?",
	"yes": "Si",
	"no": "No",
	"uploaderDoneConfirm": "Algunos archivos no se han cargado, ¿deseas continuar de todos modos?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Téléverser",
	"retry": "Réessayer",
	"done": "Terminé",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Oui",
	"no": "Non",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"uploadNFiles": "Unggah berkas {n}",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Jenis berkas yang dapat diunggah",
	"abort": "Abort",
	"upload": "Unggah",
	"retry": "Coba lagi",
	"done": "Selesai",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Iya",
	"no": "Tidak",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"uploadNFiles": "Caricare {n} file singolarmente",
	"uploaderTip": "Il file non è ancora stato caricato. Puoi controllare, rinominare, comprimere, ritagliare, prima del caricamento. Quando hai finito, premi il bottone \"Carica\" \u200b\u200bper completare.",
	"uploaderMaxFileSizeIsX": "La dimensione massima del file che puoi caricare è {x}.",
	"uploaderAllowedTypes": "Tipi di file caricabili",
	"abort": "Annulla",
	"upload": "Carica",
	"retry": "Riprova",
	"done": "Fine",
	"uploaderAbortConfirm": "Alcuni file non sono stati caricati. Vuoi annullare l'operazione?",
	"yes": "Sì",
	"no": "No",
	"uploaderDoneConfirm": "Alcuni file non sono stati caricati. Vuoi completarli?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"uploadNFiles": "{n}個のファイルをアップロード",
	"uploaderTip": "ファイルはまだアップロードされていません。このダイアログで、アップロード前の確認・リネーム・圧縮・クロッピングなどが行えます。準備が出来たら、「アップロード」ボタンを押してアップロードを開始できます。",
	"uploaderMaxFileSizeIsX": "アップロード可能な最大ファイルサイズは{x}です。",
	"uploaderAllowedTypes": "アップロード可能なファイル種別",
	"abort": "中止",
	"upload": "アップロード",
	"retry": "再試行",
	"done": "完了",
	"uploaderAbortConfirm": "アップロードされていないファイルがありますが、中止しますか？",
	"yes": "はい",
	"no": "いいえ",
	"uploaderDoneConfirm": "アップロードされていないファイルがありますが、完了しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"uploadNFiles": "{n}個のファイルをアップロード",
	"uploaderTip": "ファイルはまだアップロードされてへんで。このダイアログで、アップロードする前に確認・リネーム・圧縮・クロッピングとかをできるで。準備が出来たら、「アップロード」ボタンを押してアップロードしてな。",
	"uploaderMaxFileSizeIsX": "アップロードできるファイルサイズは{x}までやで。",
	"uploaderAllowedTypes": "アップロード可能なファイル種別",
	"abort": "中止",
	"upload": "アップロード",
	"retry": "もっぺんやる？",
	"done": "でけた",
	"uploaderAbortConfirm": "アップロードされてへんファイルがあるんやけど、やめてもええんか？",
	"yes": "ええで",
	"no": "あかん",
	"uploaderDoneConfirm": "アップロードされてへんファイルがあるんやけど、完了してもええんか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Upload",
	"retry": "Retry",
	"done": "Done",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Yes",
	"no": "No",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Upload",
	"retry": "Retry",
	"done": "Done",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Yes",
	"no": "No",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"uploadNFiles": "{n}개의 파일을 업로",
	"uploaderTip": "파일은 아직 업로드되지 않았습니다. 이 다이얼로그에서 업로드 전의 확인, 이름 바꾸기, 압축, 자르기 등을 하실 수 있습니다. 준비가 되셨다면 '업로드' 버튼을 클릭해 업로드를 시작하실 수 있습니다.",
	"uploaderMaxFileSizeIsX": "업로드 가능한 최대 파일 크기는 {x}입니다.",
	"uploaderAllowedTypes": "업로드 가능한 파일 유형",
	"abort": "중지",
	"upload": "업로드",
	"retry": "다시 시도",
	"done": "완료",
	"uploaderAbortConfirm": "업로드되지 않은 파일이 있습니다만, 그만 두시겠습니까?",
	"yes": "예",
	"no": "아니오",
	"uploaderDoneConfirm": "업로드되지 않은 파일이 있습니다만, 완료하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Uploaden",
	"retry": "Probeer opnieuw",
	"done": "Klaar",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Ja",
	"no": "Nee",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Laste opp",
	"retry": "Prøv igjen",
	"done": "Ferdig",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Ja",
	"no": "Nei",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Wyślij",
	"retry": "Spróbuj ponownie",
	"done": "Gotowe",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Tak",
	"no": "Nie",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"uploadNFiles": "Enviar {n} arquivos",
	"uploaderTip": "O arquivo não foi enviado. Então, esse diálogo permite que você confirme, renomeie, comprima e recorte o arquivo antes de enviar. Quando estiver pronto, você pode enviar apertando  o botão \"Enviar\".",
	"uploaderMaxFileSizeIsX": "O tamanho máximo de arquivos enviados é {x}",
	"uploaderAllowedTypes": "Tipos de arquivo enviáveis",
	"abort": "Abortar",
	"upload": "Fazer upload",
	"retry": "Tente novamente",
	"done": "Concluído",
	"uploaderAbortConfirm": "Alguns arquivos não foram enviados, deseja abortar?",
	"yes": "Sim",
	"no": "Não",
	"uploaderDoneConfirm": "Alguns arquivos não foram enviados, deseja continuar mesmo assim?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"uploadNFiles": "Загрузить {n} файл",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Отменить",
	"upload": "Загрузить",
	"retry": "Повторить попытку",
	"done": "Готово",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Да",
	"no": "Нет",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Nahrať súbor",
	"retry": "Opakovať",
	"done": "Hotovo",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Áno",
	"no": "Nie",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"uploadNFiles": "อัปโหลด {n} ไฟล์",
	"uploaderTip": "ยังไม่มีไฟล์ถูกอัปโหลด สามารถ ตรวจสอบ ลบชื่อไฟล์ บีบอัด หรือครอปตัดภาพ ก่อนอัปโหลดได้ในหน้านี้ เมื่อพร้อมแล้วให้กดปุ่ม “อัปโหลด” เพื่อเริ่มการอัปโหลด",
	"uploaderMaxFileSizeIsX": "ขนาดไฟล์สูงสุดที่สามารถอัปโหลดได้คือ {x}",
	"uploaderAllowedTypes": "ประเภทไฟล์ที่สามารถอัปโหลดได้",
	"abort": "หยุดและยกเลิก",
	"upload": "อัปโหลด",
	"retry": "ลองใหม่อีกครั้ง",
	"done": "เสร็จสิ้น",
	"uploaderAbortConfirm": "มีไฟล์ที่ยังไม่ได้อัปโหลด ต้องการยกเลิกหรือไม่?",
	"yes": "ใช่",
	"no": "ไม่",
	"uploaderDoneConfirm": "มีไฟล์ที่ยังไม่ได้อัปโหลด ต้องการดำเนินการให้เสร็จสิ้นหรือไม่?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"uploadNFiles": "{n} dosya yükle",
	"uploaderTip": "Dosya henüz yüklenmediğinden, bu iletişim kutusu yüklemeden önce dosyayı onaylamanıza, yeniden adlandırmana, sıkıştırmana ve kırpmana olanak tanır. Hazır olduğunda, “Yükle” düğmesine basarak yüklemeyi başlatabilirsin.",
	"uploaderMaxFileSizeIsX": "Yükleyebileceğin maksimum dosya boyutu {x}",
	"uploaderAllowedTypes": "Yüklenebilir dosya türleri",
	"abort": "İptal",
	"upload": "Yükle",
	"retry": "Tekrar dene",
	"done": "Tamam",
	"uploaderAbortConfirm": "Bazı dosyalar yüklenmedi, iptal etmek ister misin?",
	"yes": "Evet",
	"no": "Hayır",
	"uploaderDoneConfirm": "Bazı dosyalar yüklenmedi, yine de devam etmek istiyor musun?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"uploadNFiles": "Upload {n} files",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Upload",
	"retry": "Retry",
	"done": "Done",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Yes",
	"no": "No",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"uploadNFiles": "Завантажити {n} файлів",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Перервати",
	"upload": "Завантажити",
	"retry": "Спробувати знову",
	"done": "Готово",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Так",
	"no": "Ні",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"uploadNFiles": "Tải lên {n} tập tin",
	"uploaderTip": "The file has not yet been uploaded so this dialog allows you to confirm, rename, compress, and crop the file before uploading. When ready, you can start uploading by pressing the “Upload” button.",
	"uploaderMaxFileSizeIsX": "The maximum file size that can be uploaded is {x}",
	"uploaderAllowedTypes": "Uploadable file types",
	"abort": "Abort",
	"upload": "Tải lên",
	"retry": "Thử lại",
	"done": "Xong",
	"uploaderAbortConfirm": "Some files have not been uploaded, do you want to abort?",
	"yes": "Đồng ý",
	"no": "Từ chối",
	"uploaderDoneConfirm": "Some files have not been uploaded, do you want to continue anyway?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"uploadNFiles": "上传 {n} 个文件",
	"uploaderTip": "文件尚未上传。在此对话框中，您可以进行上传前的确认、重命名、压缩和裁剪等操作。准备就绪后，点击 “上传” 按钮即可开始上传。",
	"uploaderMaxFileSizeIsX": "可上传最大 {x} 的文件。",
	"uploaderAllowedTypes": "可上传的文件类型",
	"abort": "中止",
	"upload": "本地上传",
	"retry": "重试",
	"done": "完成",
	"uploaderAbortConfirm": "还有未上传的文件，要中止吗？",
	"yes": "是",
	"no": "否",
	"uploaderDoneConfirm": "部分文件尚未上传，是否继续？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"uploadNFiles": "上傳了 {n} 個檔案",
	"uploaderTip": "檔案尚未上傳。您可以在此對話框中進行上傳前的確認、重新命名、壓縮、裁切等操作。準備完成後，請點選「上傳」按鈕開始上傳。\n",
	"uploaderMaxFileSizeIsX": "可上傳的最大檔案大小為 {x}。",
	"uploaderAllowedTypes": "可上傳的檔案類型。",
	"abort": "取消",
	"upload": "上傳",
	"retry": "重試",
	"done": "完成",
	"uploaderAbortConfirm": "有些檔案尚未上傳，您要中止嗎？",
	"yes": "是",
	"no": "否",
	"uploaderDoneConfirm": "有些檔案尚未上傳，是否要完成上傳？"
}
</locale>
