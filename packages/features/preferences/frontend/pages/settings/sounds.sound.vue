<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="type" :items="typeDef">
		<template #label>{{ $locale.sfc.sound }}</template>
	</MkSelect>
	<div v-if="type === '_driveFile_' && driveFileError === true" :class="$style.fileSelectorRoot">
		<MkButton :class="$style.fileSelectorButton" inline rounded primary @click="selectSound">{{ $locale.sfc.selectFile }}</MkButton>
		<div :class="$style.fileErrorRoot">
			<MkCondensedLine>{{ $locale.sfc.driveFileError }}</MkCondensedLine>
		</div>
	</div>
	<div v-else-if="type === '_driveFile_'" :class="$style.fileSelectorRoot">
		<MkButton :class="$style.fileSelectorButton" inline rounded primary @click="selectSound">{{ $locale.sfc.selectFile }}</MkButton>
		<div :class="['_nowrap', !fileUrl && $style.fileNotSelected]">{{ friendlyFileName }}</div>
	</div>
	<MkRange v-model="volume" :min="0" :max="1" :step="0.05" :textConverter="(v) => `${Math.floor(v * 100)}%`">
		<template #label>{{ $locale.sfc.volume }}</template>
	</MkRange>

	<div class="_buttons">
		<MkButton inline @click="listen"><i class="ti ti-player-play"></i> {{ $locale.sfc.listen }}</MkButton>
		<MkButton inline primary :disabled="!hasChanged || driveFileError" @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import type { SoundType } from '@features/preferences/frontend/utility/sound.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import * as os from '@features/ui/frontend/os.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { playMisskeySfxFile, soundsTypes, getSoundDuration } from '@features/preferences/frontend/utility/sound.js';
import { selectFile } from '@features/drive/frontend/utility/drive.js';

const props = defineProps<{
	def: SoundStore;
}>();

const emit = defineEmits<{
	(ev: 'update', result: { type: SoundType; fileId?: string; fileUrl?: string; volume: number; }): void;
}>();

const {
	model: type,
	def: typeDef,
} = useMkSelect({
	items: soundsTypes.map((x) => ({
		label: getSoundTypeName(x),
		value: x,
	})),
	initialValue: props.def.type,
});
const fileId = ref('fileId' in props.def ? props.def.fileId : undefined);
const fileUrl = ref('fileUrl' in props.def ? props.def.fileUrl : undefined);
const fileName = ref<string>('');
const driveFileError = ref(false);
const hasChanged = ref(false);
const volume = ref(props.def.volume);

if (type.value === '_driveFile_' && fileId.value) {
	await misskeyApi('drive/files/show', {
		fileId: fileId.value,
	}).then((res) => {
		fileName.value = res.name;
	}).catch((res) => {
		driveFileError.value = true;
	});
}

function getSoundTypeName(f: SoundType): string {
	switch (f) {
		case null:
			return $locale.value.sfc.none;
		case '_driveFile_':
			return $locale.value.sfc.driveFile;
		default:
			return f;
	}
}

const friendlyFileName = computed<string>(() => {
	if (fileName.value) {
		return fileName.value;
	}
	if (fileUrl.value) {
		return fileUrl.value;
	}

	return $locale.value.sfc.driveFileWarn;
});

function selectSound(ev: PointerEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
		label: $locale.value.sfc.driveFile,
	}).then(async (file) => {
		if (!file.type.startsWith('audio')) {
			os.alert({
				type: 'warning',
				title: $locale.value.sfc.driveFileTypeWarn,
				text: $locale.value.sfc.driveFileTypeWarnDescription,
			});
			return;
		}
		const duration = await getSoundDuration(file.url);
		if (duration >= 2000) {
			const { canceled } = await os.confirm({
				type: 'warning',
				title: $locale.value.sfc.driveFileDurationWarn,
				text: $locale.value.sfc.driveFileDurationWarnDescription,
				okText: $locale.value.sfc.continue,
				cancelText: $locale.value.sfc.cancel,
			});
			if (canceled) return;
		}

		fileUrl.value = file.url;
		fileName.value = file.name;
		fileId.value = file.id;
		driveFileError.value = false;
		hasChanged.value = true;
	});
}

watch([type, volume], ([typeTo, volumeTo], [typeFrom, volumeFrom]) => {
	if (typeFrom !== typeTo && typeTo !== '_driveFile_') {
		fileUrl.value = undefined;
		fileName.value = '';
		fileId.value = undefined;
		driveFileError.value = false;
	}
	hasChanged.value = true;
});

function listen() {
	if (type.value === '_driveFile_' && (!fileUrl.value || !fileId.value)) {
		os.alert({
			type: 'warning',
			text: $locale.value.sfc.driveFileWarn,
		});
		return;
	}

	playMisskeySfxFile(type.value === '_driveFile_' ? {
		type: '_driveFile_',
		fileId: fileId.value as string,
		fileUrl: fileUrl.value as string,
		volume: volume.value,
	} : {
		type: type.value,
		volume: volume.value,
	});
}

function save() {
	if (hasChanged.value === false || driveFileError.value === true) {
		return;
	}

	if (type.value === '_driveFile_' && !fileUrl.value) {
		os.alert({
			type: 'warning',
			text: $locale.value.sfc.driveFileWarn,
		});
		return;
	}

	if (type.value !== '_driveFile_') {
		fileUrl.value = undefined;
		fileName.value = '';
		fileId.value = undefined;
	}

	emit('update', {
		type: type.value,
		fileId: fileId.value,
		fileUrl: fileUrl.value,
		volume: volume.value,
	});

	os.success();
}
</script>

<style module>
.fileSelectorRoot {
	display: flex;
	align-items: center;
	gap: 8px;
}

.fileErrorRoot {
	flex-grow: 1;
	min-width: 0;
	font-weight: 700;
	color: var(--MI_THEME-error);
}

.fileSelectorButton {
	flex-shrink: 0;
}

.fileNotSelected {
	font-weight: 700;
	color: var(--MI_THEME-infoWarnFg);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"none": "لا شيء",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "متابعة",
	"cancel": " إلغاء",
	"sound": "الرنات",
	"selectFile": "اختر ملفًا",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "مستوى الصوت",
	"listen": "استمع",
	"save": "حفظ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"none": "Res",
	"driveFile": "Fer servir un fitxer d'àudio del disc",
	"driveFileWarn": "Seleccionar un fitxer d'àudio del disc",
	"driveFileTypeWarn": "Fitxer no suportat ",
	"driveFileTypeWarnDescription": "Seleccionar un fitxer d'àudio ",
	"driveFileDurationWarn": "L'àudio és massa llarg",
	"driveFileDurationWarnDescription": "Els àudios molt llargs pot interrompre l'ús de Misskey. Vols continuar?",
	"continue": "Continuar",
	"cancel": "Cancel·lar",
	"sound": "So",
	"selectFile": "Selecciona un fitxer",
	"driveFileError": "El so no es pot carregar. Canvia la configuració",
	"volume": "Volum",
	"listen": "Escoltar",
	"save": "Desa"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"none": "Žádný",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Pokračovat",
	"cancel": "Zrušit",
	"sound": "Zvuky",
	"selectFile": "Vybrat soubor",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Hlasitost",
	"listen": "Poslouchat",
	"save": "Uložit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"none": "None",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Continue",
	"cancel": "Cancel",
	"sound": "Sounds",
	"selectFile": "Select a file",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Volume",
	"listen": "Listen",
	"save": "Save"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"none": "Nichts",
	"driveFile": "Audiodatei aus dem Drive verwenden",
	"driveFileWarn": "Wähle eine Audiodatei aus dem Drive",
	"driveFileTypeWarn": "Diese Datei wird nicht unterstützt",
	"driveFileTypeWarnDescription": "Bitte wähle eine Audiodatei",
	"driveFileDurationWarn": "Audio zu lang.",
	"driveFileDurationWarnDescription": "Lange Töne kann die Verwendung von Misskey stören. Trotzdem fortfahren?",
	"continue": "Fortfahren",
	"cancel": "Abbrechen",
	"sound": "Töne",
	"selectFile": "Datei auswählen",
	"driveFileError": "Audio konnte nicht geladen werden. Bitte ändere die Einstellung.",
	"volume": "Lautstärke",
	"listen": "Anhören",
	"save": "Speichern"
}
</locale>

<locale locale="en-US" lang="json">
{
	"none": "None",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Continue",
	"cancel": "Cancel",
	"sound": "Sounds",
	"selectFile": "Select a file",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Volume",
	"listen": "Listen",
	"save": "Save"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"none": "Ninguna",
	"driveFile": "Usar un archivo de audio en Drive",
	"driveFileWarn": "Selecciona un archivo de audio en Drive.",
	"driveFileTypeWarn": "Este archivo es incompatible",
	"driveFileTypeWarnDescription": "Selecciona un archivo de audio",
	"driveFileDurationWarn": "La duración del audio es demasiado larga.",
	"driveFileDurationWarnDescription": "Usar un audio de larga duración puede llegar a molestar mientras usas Misskey. ¿Quieres continuar?",
	"continue": "Continuar",
	"cancel": "Cancelar",
	"sound": "Sonidos",
	"selectFile": "Elegir archivo",
	"driveFileError": "No puedo cargar el sonido. Por favor cambia la configuración.",
	"volume": "Volumen",
	"listen": "Escuchar",
	"save": "Guardar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"none": "Rien",
	"driveFile": "Utiliser un effet sonore sur le Disque",
	"driveFileWarn": "Veuillez sélectionner le fichier sur le Disque",
	"driveFileTypeWarn": "Ce fichier n'est pas pris en charge",
	"driveFileTypeWarnDescription": "Veuillez sélectionner un fichier audio",
	"driveFileDurationWarn": "L'effet sonore est trop long",
	"driveFileDurationWarnDescription": "Utiliser un effet sonore long peut affecter l'utilisation de Misskey. Voulez-vous encore continuer ?",
	"continue": "Continuer",
	"cancel": "Annuler",
	"sound": "Sons",
	"selectFile": "Choisir le fichier",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Volume",
	"listen": "Écouter",
	"save": "Enregistrer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"none": "Tidak ada",
	"driveFile": "Menggunakan berkas audio dalam Drive",
	"driveFileWarn": "Pilih berkas audio dari Drive",
	"driveFileTypeWarn": "Berkas ini tidak didukung",
	"driveFileTypeWarnDescription": "Pilih berkas audio",
	"driveFileDurationWarn": "Audio ini terlalu panjang",
	"driveFileDurationWarnDescription": "Audio panjang dapat mengganggu penggunaan Misskey. Masih ingin melanjutkan?",
	"continue": "Lanjutkan",
	"cancel": "Batalkan",
	"sound": "Bunyi",
	"selectFile": "Pilih berkas",
	"driveFileError": "Tak bisa memuat audio. Mohon ubah pengaturan",
	"volume": "Volume",
	"listen": "Dengarkan",
	"save": "Simpan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"none": "Nessuna",
	"driveFile": "Suoni del Drive",
	"driveFileWarn": "Seleziona file dal dispositivo",
	"driveFileTypeWarn": "Formato file non supportato",
	"driveFileTypeWarnDescription": "Per favore, scegli un file di tipo audio",
	"driveFileDurationWarn": "La durata dell'audio è troppo lunga",
	"driveFileDurationWarnDescription": "Scegliere un audio lungo potrebbe interferire con l'uso di Misskey. Vuoi continuare lo stesso?",
	"continue": "Continua",
	"cancel": "Annulla",
	"sound": "Suono",
	"selectFile": "Scelta allegato",
	"driveFileError": "Impossibile caricare l'audio. Si prega di modificare le impostazioni",
	"volume": "Volume",
	"listen": "Ascolta",
	"save": "Salva"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"none": "なし",
	"driveFile": "ドライブの音声を使用",
	"driveFileWarn": "ドライブのファイルを選択してください",
	"driveFileTypeWarn": "このファイルは対応していません",
	"driveFileTypeWarnDescription": "音声ファイルを選択してください",
	"driveFileDurationWarn": "音声が長すぎます",
	"driveFileDurationWarnDescription": "長い音声を使用するとMisskeyの使用に支障をきたす可能性があります。それでも続行しますか？",
	"continue": "続ける",
	"cancel": "キャンセル",
	"sound": "サウンド",
	"selectFile": "ファイルを選択",
	"driveFileError": "音声が読み込めませんでした。設定を変更してください",
	"volume": "音量",
	"listen": "聴く",
	"save": "保存"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"none": "なし",
	"driveFile": "ドライブん中の音使う",
	"driveFileWarn": "ドライブん中のファイル選びや",
	"driveFileTypeWarn": "このファイルは対応しとらへん",
	"driveFileTypeWarnDescription": "音声ファイルを選びや",
	"driveFileDurationWarn": "音が長すぎるわ",
	"driveFileDurationWarnDescription": "長い音使うたらMisskey使うのに良うないかもしれへんで。それでもええか？",
	"continue": "続けるで",
	"cancel": "やめる",
	"sound": "音",
	"selectFile": "ファイル選んでや",
	"driveFileError": "音声が読み込めへんかったで。設定を変更せえや",
	"volume": "音のでかさ",
	"listen": "聴く",
	"save": "とっとく"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"none": "None",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Continue",
	"cancel": "Cancel",
	"sound": "Sounds",
	"selectFile": "Select a file",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Volume",
	"listen": "Listen",
	"save": "Sekles"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"none": "None",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Continue",
	"cancel": "ರದ್ದು",
	"sound": "Sounds",
	"selectFile": "Select a file",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Volume",
	"listen": "Listen",
	"save": "ಉಳಿಸಿ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"none": "없음",
	"driveFile": "드라이브에 있는 오디오를 사용",
	"driveFileWarn": "드라이브에 있는 파일을 선택하세요.",
	"driveFileTypeWarn": "이 파이",
	"driveFileTypeWarnDescription": "오디오 파일을 선택하세요.",
	"driveFileDurationWarn": "오디오가 너무 깁니다",
	"driveFileDurationWarnDescription": "긴 오디오로 설정할 경우 미스키 사용에 지장이 갈 수도 있습니다. 그래도 괜찮습니까?",
	"continue": "계속",
	"cancel": "취소",
	"sound": "소리",
	"selectFile": "파일 선택",
	"driveFileError": "오디오를 불러올 수 없습니다. 설정을 바꿔주세요.",
	"volume": "음량",
	"listen": "듣기",
	"save": "저장"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"none": "Niets",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Continue",
	"cancel": "Annuleren",
	"sound": "Geluid",
	"selectFile": "Kies een bestand",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Volume",
	"listen": "Luisteren",
	"save": "Opslaan"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"none": "Ingen",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Fortsett",
	"cancel": "Avbryt",
	"sound": "Sounds",
	"selectFile": "Velg en fil",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Volum",
	"listen": "Lytt",
	"save": "Lagre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"none": "Brak",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Continue",
	"cancel": "Anuluj",
	"sound": "Dźwięki",
	"selectFile": "Wybierz plik",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Głośność",
	"listen": "Słuchaj",
	"save": "Zapisz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"none": "Nenhum",
	"driveFile": "Usar um arquivo de áudio do Drive.",
	"driveFileWarn": "Selecione um arquivo de áudio do Drive.",
	"driveFileTypeWarn": "Esse arquivo não é compatível",
	"driveFileTypeWarnDescription": "Selecione um arquivo de áudio",
	"driveFileDurationWarn": "O áudio é muito longo.",
	"driveFileDurationWarnDescription": "Áudios longos podem atrapalhar o funcionamento do Misskey. Deseja continuar?",
	"continue": "Continuar",
	"cancel": "Cancelar",
	"sound": "Sons",
	"selectFile": "Selecione os arquivos",
	"driveFileError": "Não foi possível carregar o som. Por favor, altere a configuração.",
	"volume": "Volume",
	"listen": "Ouvir",
	"save": "Salvar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"none": "Ничего",
	"driveFile": "Использовать аудиофайл с Диска.",
	"driveFileWarn": "Выбрать аудиофайл с Диска.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Продолжить",
	"cancel": "Отмена",
	"sound": "Звуки",
	"selectFile": "Выберите файл",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Громкость",
	"listen": "Слушать",
	"save": "Сохранить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"none": "Žiadne",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Continue",
	"cancel": "Zrušiť",
	"sound": "Zvuky",
	"selectFile": "Vyberte súbor",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Hlasitosť",
	"listen": "Počúvať",
	"save": "Uložiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"none": "ไม่มี",
	"driveFile": "ใช้เสียงจากไดรฟ์",
	"driveFileWarn": "เลือกไฟล์ในไดรฟ์ของคุณ",
	"driveFileTypeWarn": "ไม่รองรับไฟล์นี้",
	"driveFileTypeWarnDescription": "กรุณาเลือกไฟล์เสียง",
	"driveFileDurationWarn": "เสียงยาวเกินไป",
	"driveFileDurationWarnDescription": "การใช้เสียงที่ยาว อาจรบกวนการใช้งาน Misskey, ต้องการดำเนินการต่อใช่ไหม?",
	"continue": "ดำเนินการต่อ",
	"cancel": "ยกเลิก",
	"sound": "เสียง",
	"selectFile": "เลือกไฟล์",
	"driveFileError": "ไม่สามารถโหลดไฟล์เสียงได้ กรุณาเปลี่ยนแปลงการตั้งค่า",
	"volume": "ระดับเสียง",
	"listen": "ฟัง",
	"save": "บันทึก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"none": "Hiçbiri",
	"driveFile": "Drive'da bir ses dosyası kullanın.",
	"driveFileWarn": "Drive'dan bir ses dosyası seçin.",
	"driveFileTypeWarn": "Bu dosya desteklenmiyor",
	"driveFileTypeWarnDescription": "Bir ses dosyası seçin",
	"driveFileDurationWarn": "Ses kaydı çok uzun.",
	"driveFileDurationWarnDescription": "Uzun sesli mesajlar Misskey'in kullanımını engelleyebilir. Devam etmek istiyor musunuz?",
	"continue": "Devam et",
	"cancel": "Vazgeç",
	"sound": "Ses",
	"selectFile": "Dosya seçin",
	"driveFileError": "Ses yüklenemedi. Lütfen ayarları değiştir.",
	"volume": "Ses hacmi",
	"listen": "Dinle",
	"save": "Kaydet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"none": "None",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Continue",
	"cancel": "Cancel",
	"sound": "Sounds",
	"selectFile": "Select a file",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Volume",
	"listen": "Listen",
	"save": "Save"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"none": "Відсутній",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Продовжити",
	"cancel": "Скасувати",
	"sound": "Звуки",
	"selectFile": "Вибрати файл",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Гучність",
	"listen": "Слухати",
	"save": "Зберегти"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"none": "Không",
	"driveFile": "Use an audio file in Drive.",
	"driveFileWarn": "Select an audio file from Drive.",
	"driveFileTypeWarn": "This file is not supported",
	"driveFileTypeWarnDescription": "Select an audio file",
	"driveFileDurationWarn": "The audio is too long.",
	"driveFileDurationWarnDescription": "Long audio may disrupt using Misskey. Still continue?",
	"continue": "Tiếp tục",
	"cancel": "Hủy",
	"sound": "Âm thanh",
	"selectFile": "Chọn tập tin",
	"driveFileError": "It couldn't load the sound. Please change the setting.",
	"volume": "Âm lượng",
	"listen": "Nghe",
	"save": "Lưu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"none": "无",
	"driveFile": "使用网盘内的音频",
	"driveFileWarn": "选择网盘上的文件",
	"driveFileTypeWarn": "不支持此文件",
	"driveFileTypeWarnDescription": "请选择音频文件",
	"driveFileDurationWarn": "音频过长",
	"driveFileDurationWarnDescription": "使用长音频可能会影响 Misskey 的使用。即使这样也要继续吗？",
	"continue": "继续",
	"cancel": "取消",
	"sound": "提示音",
	"selectFile": "选择文件",
	"driveFileError": "无法读取声音。请更改设置。",
	"volume": "音量",
	"listen": "试听",
	"save": "保存"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"none": "無",
	"driveFile": "使用雲端硬碟的音效檔案",
	"driveFileWarn": "請選擇雲端硬碟中的檔案",
	"driveFileTypeWarn": "不支援此檔案",
	"driveFileTypeWarnDescription": "請選擇音效檔案",
	"driveFileDurationWarn": "音效太長了",
	"driveFileDurationWarnDescription": "使用長音效檔可能會影響 Misskey 的使用體驗。仍要使用此檔案嗎？",
	"continue": "繼續",
	"cancel": "取消",
	"sound": "音效",
	"selectFile": "選擇檔案",
	"driveFileError": "無法載入語音。請變更設定",
	"volume": "音量",
	"listen": "聆聽",
	"save": "儲存"
}
</locale>
