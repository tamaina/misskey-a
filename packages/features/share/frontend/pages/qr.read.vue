<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="$style.root"
	:style="{
		'--MI-QrReadViewHeight': 'calc(100cqh - var(--MI-stickyTop, 0px) - var(--MI-stickyBottom, 0px))',
		'--MI-QrReadVideoHeight': 'min(calc(var(--MI-QrReadViewHeight) * 0.3), 512px)',
	}"
>
	<MkStickyContainer>
		<template #header>
			<div :class="$style.view">
				<video ref="videoEl" :class="$style.video" autoplay muted playsinline></video>
				<div ref="overlayEl"></div>
				<div :class="$style.controls">
					<MkButton v-tooltip="$locale.sfc.scanFile" iconOnly @click="upload"><i class="ti ti-photo-plus"></i></MkButton>

					<MkButton v-if="qrStarted" v-tooltip="$locale.sfc.stopQr" iconOnly @click="stopQr"><i class="ti ti-player-play"></i></MkButton>
					<MkButton v-else v-tooltip="$locale.sfc.startQr" iconOnly danger @click="startQr"><i class="ti ti-player-pause"></i></MkButton>

					<MkButton v-tooltip="$locale.sfc.chooseCamera" iconOnly @click="chooseCamera"><i class="ti ti-camera-rotate"></i></MkButton>

					<MkButton v-if="!flashCanToggle" v-tooltip="$locale.sfc.cannotToggleFlash" iconOnly disabled><i class="ti ti-bolt"></i></MkButton>
					<MkButton v-else-if="!flash" v-tooltip="$locale.sfc.turnOnFlash" iconOnly @click="toggleFlash(true)"><i class="ti ti-bolt-off"></i></MkButton>
					<MkButton v-else v-tooltip="$locale.sfc.turnOffFlash" iconOnly @click="toggleFlash(false)"><i class="ti ti-bolt-filled"></i></MkButton>
				</div>
			</div>
		</template>
		<div
			:class="['_spacer', $style.contents]"
			:style="{
				'--MI_SPACER-w': '800px'
			}"
		>
			<MkStickyContainer>
				<template #header>
					<MkTab
						v-model="tab"
						:tabs="[
							{ key: 'users', label: $locale.sfc.users },
							{ key: 'notes', label: $locale.sfc.notes },
							{ key: 'all', label: $locale.sfc.all },
						]"
						:class="$style.tab"
					>
					</MkTab>
				</template>
				<div v-if="tab === 'users'" :class="[$style.users, '_margin']" style="padding-bottom: var(--MI-margin);">
					<MkUserInfo v-for="user in users" :key="user.id" :user="user"/>
				</div>
				<div v-else-if="tab === 'notes'" class="_margin _gaps" style="padding-bottom: var(--MI-margin);">
					<MkNote v-for="note in notes" :key="note.id" :note="note" :class="$style.note"/>
				</div>
				<div v-else-if="tab === 'all'" class="_margin _gaps" style="padding-bottom: var(--MI-margin);">
					<MkQrReadRawViewer v-for="result in Array.from(results).reverse()" :key="result" :data="result"/>
				</div>
			</MkStickyContainer>
		</div>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import QrScanner from 'qr-scanner';
import { onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import * as misskey from 'misskey-js';
import { getScrollContainer } from '@features/ui/frontend/shared/scroll.js';
import type { ApShowResponse } from 'misskey-js/entities.js';
import * as os from '@features/ui/frontend/os.js';
import MkUserInfo from '@features/users/frontend/components/MkUserInfo.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import MkTab from '@features/ui/frontend/components/MkTab.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkQrReadRawViewer from '@features/share/frontend/pages/qr.read.raw-viewer.vue';

const LIST_RERENDER_INTERVAL = 1500;

const rootEl = useTemplateRef('rootEl');
const videoEl = useTemplateRef('videoEl');
const overlayEl = useTemplateRef('overlayEl');

const scannerInstance = shallowRef<QrScanner | null>(null);

const tab = ref<'users' | 'notes' | 'all'>('users');

// higher is recent
const results = ref(new Set<string>());
// lower is recent
const uris = ref<string[]>([]);
const sources = new Map<string, ApShowResponse | null>();
const users = ref<(misskey.entities.UserDetailed)[]>([]);
const usersCount = ref(0);
const notes = ref<misskey.entities.Note[]>([]);
const notesCount = ref(0);

const timer = ref<number | null>(null);

function updateLists() {
	const responses = uris.value.map(uri => sources.get(uri)).filter((r): r is ApShowResponse => !!r);
	users.value = responses.filter(r => r.type === 'User').map(r => r.object).filter((u) => !!u);
	usersCount.value = users.value.length;
	notes.value = responses.filter(r => r.type === 'Note').map(r => r.object).filter((n) => !!n);
	notesCount.value = notes.value.length;
	updateRequired.value = false;
}

const updateRequired = ref(false);

watch(uris, () => {
	if (timer.value) {
		updateRequired.value = true;
		return;
	}

	updateLists();

	timer.value = window.setTimeout(() => {
		timer.value = null;
		if (updateRequired.value) {
			updateLists();
		}
	}, LIST_RERENDER_INTERVAL) as number;
});

watch(tab, () => {
	if (timer.value) {
		window.clearTimeout(timer.value);
		timer.value = null;
	}
	updateLists();
});

async function processResult(result: QrScanner.ScanResult) {
	if (!result) return;
	const trimmed = result.data.trim();

	if (!trimmed) return;

	const haveExisted = results.value.has(trimmed);
	results.value.add(trimmed);

	try {
		new URL(trimmed);
	} catch {
		if (!haveExisted) {
			tab.value = 'all';
		}
		return;
	}

	if (uris.value[0] !== trimmed) {
		// 並べ替え
		uris.value = [trimmed, ...uris.value.slice(0, 29).filter(u => u !== trimmed)];
	}

	if (sources.has(trimmed)) return;
	// Start fetching user info
	sources.set(trimmed, null);

	await misskeyApi('ap/show', { uri: trimmed })
		.then(data => {
			if (data.type === 'User') {
				sources.set(trimmed, data);
				tab.value = 'users';
			} else if (data.type === 'Note') {
				sources.set(trimmed, data);
				tab.value = 'notes';
			}
			updateLists();
		})
		.catch(err => {
			tab.value = 'all';
			throw err;
		});
}

const qrStarted = ref(true);
const flashCanToggle = ref(false);
const flash = ref(false);

async function upload() {
	os.chooseFileFromPc({ multiple: true }).then(files => {
		if (files.length === 0) return;
		for (const file of files) {
			QrScanner.scanImage(file, { returnDetailedScanResult: true })
				.then(result => {
					processResult(result);
				})
				.catch(err => {
					if (err.toString().includes('No QR code found')) {
						os.alert({
							type: 'info',
							text: $locale.value.sfc.noQrCodeFound,
						});
					} else {
						os.alert({
							type: 'error',
							text: err.toString(),
						});
						console.error(err);
					}
				});
		}
	});
}

async function chooseCamera() {
	if (!scannerInstance.value) return;
	const cameras = await QrScanner.listCameras(true);
	if (cameras.length === 0) {
		os.alert({
			type: 'error',
		});
		return;
	}

	const select = await os.select({
		title: $locale.value.sfc.chooseCamera,
		items: cameras.map(camera => ({
			label: camera.label,
			value: camera.id,
		})),
	});
	if (select.canceled) return;
	if (select.result == null) return;

	await scannerInstance.value.setCamera(select.result);
	flashCanToggle.value = await scannerInstance.value.hasFlash();
	flash.value = scannerInstance.value.isFlashOn();
}

async function toggleFlash(to = false) {
	if (!scannerInstance.value) return;

	flash.value = to;
	if (flash.value) {
		await scannerInstance.value.turnFlashOn();
	} else {
		await scannerInstance.value.turnFlashOff();
	}
}

// hasFlashなどの後続の処理がカメラを再起動する可能性があるため、
// start() が完了するまでの間に停止された場合は結果を破棄する必要がある
let initializeId = 0;

function startQr() {
	if (!scannerInstance.value) return;
	const currentInitializeId = ++initializeId;
	qrStarted.value = false;
	scannerInstance.value.start()
		.then(async () => {
			if (currentInitializeId !== initializeId) return;
			qrStarted.value = true;
			if (!scannerInstance.value) return;
			const hasFlash = await scannerInstance.value.hasFlash();
			if (currentInitializeId !== initializeId) return;
			flashCanToggle.value = hasFlash;
			flash.value = scannerInstance.value.isFlashOn();
		})
		.catch(err => {
			if (currentInitializeId !== initializeId) return;
			qrStarted.value = false;
			os.alert({
				type: 'error',
				text: err.toString(),
			});
			console.error(err);
		});
}

function stopQr() {
	initializeId++;
	if (!scannerInstance.value) return;
	scannerInstance.value.stop();
	qrStarted.value = false;
}

onActivated(() => {
	startQr();
});

onDeactivated(() => {
	stopQr();
});

const alertLock = ref(false);

onMounted(() => {
	if (!videoEl.value || !overlayEl.value) {
		os.alert({
			type: 'error',
			text: $locale.value.sfc.somethingHappened,
		});
		return;
	}

	scannerInstance.value = new QrScanner(
		videoEl.value,
		processResult,
		{
			highlightScanRegion: true,
			highlightCodeOutline: true,
			overlay: overlayEl.value,
			calculateScanRegion(video: HTMLVideoElement): QrScanner.ScanRegion {
				const aspectRatio = video.videoWidth / video.videoHeight;
				const SHORT_SIDE_SIZE_DOWNSCALED = 360;
				return {
					x: 0,
					y: 0,
					width: video.videoWidth,
					height: video.videoHeight,
					downScaledWidth: aspectRatio > 1 ? Math.round(SHORT_SIDE_SIZE_DOWNSCALED * aspectRatio) : SHORT_SIDE_SIZE_DOWNSCALED,
					downScaledHeight: aspectRatio > 1 ? SHORT_SIDE_SIZE_DOWNSCALED : Math.round(SHORT_SIDE_SIZE_DOWNSCALED / aspectRatio),
				};
			},
			onDecodeError(err) {
				if (err.toString().includes('No QR code found')) return;
				if (alertLock.value) return;
				alertLock.value = true;
				os.alert({
					type: 'error',
					text: err.toString(),
				}).finally(() => {
					alertLock.value = false;
				});
			},
		},
	);

	startQr();
});

onUnmounted(() => {
	if (timer.value) {
		window.clearTimeout(timer.value);
		timer.value = null;
	}

	initializeId++;
	scannerInstance.value?.destroy();
});
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.view {
	position: sticky;
	top: var(--MI-stickyTop, 0);
	z-index: 1;
	background: var(--MI_THEME-bg);
	background-size: 16px 16px;
	width: 100%;
	height: var(--MI-QrReadVideoHeight);
}

.video {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.controls {
	width: 100%;
	position: absolute;
	right: 10px;
	bottom: 10px;
	display: flex;
	justify-content: end;
	align-items: center;
	gap: 10px;
}

html[data-color-scheme=dark] .view {
	--c: rgb(255 255 255 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

html[data-color-scheme=light] .view {
	--c: rgb(0 0 0 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

.contents {
	padding-top: calc(var(--MI-margin) / 2);
}

.tab {
	padding: calc(var(--MI-margin) / 2) 0;
	background: var(--MI_THEME-bg);
}

.users {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--MI-margin);
}

.note {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "حدث خطأ",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "المستخدمون",
	"notes": "الملاحظات",
	"all": "الكل"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"noQrCodeFound": "No s'ha trobat cap codi QR",
	"chooseCamera": "Seleccionar càmera ",
	"somethingHappened": "S'ha produït un error",
	"scanFile": "Escanejar la imatge des del dispositiu",
	"stopQr": "Parar el lector de codis QR",
	"startQr": "Reiniciar el lector de codis QR",
	"cannotToggleFlash": "No es pot activar el flaix",
	"turnOnFlash": "Activar el flaix",
	"turnOffFlash": "Apagar el flaix",
	"users": "Usuaris",
	"notes": "Notes",
	"all": "Tot"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Uživatelé",
	"notes": "Poznámky",
	"all": "Vše"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "An error has occurred",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Users",
	"notes": "Notes",
	"all": "All"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"noQrCodeFound": "QR-Code wurde nicht gefunden",
	"chooseCamera": "Kamera auswählen",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"scanFile": "Gerätebilder scannen",
	"stopQr": "QR-Code-Leser stoppen",
	"startQr": "QR-Code-Leser starten",
	"cannotToggleFlash": "Blitzauswahl nicht möglich",
	"turnOnFlash": "Blitz einschalten",
	"turnOffFlash": "Blitz ausschalten",
	"users": "Benutzer",
	"notes": "Notizen",
	"all": "Alle"
}
</locale>

<locale locale="en-US" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "An error has occurred",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Users",
	"notes": "Notes",
	"all": "All"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"noQrCodeFound": "No se encontró el código QR",
	"chooseCamera": "Seleccione cámara",
	"somethingHappened": "Ocurrió un error",
	"scanFile": "Escanear imagen desde un dispositivo",
	"stopQr": "Detener el lector de códigos QR",
	"startQr": "Reiniciar el lector de códigos QR",
	"cannotToggleFlash": "No se puede activar el flash",
	"turnOnFlash": "Encender el flash",
	"turnOffFlash": "Apagar el flash",
	"users": "Usuarios",
	"notes": "Notas",
	"all": "Todo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Une erreur est survenue",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Utilisateur·rice·s",
	"notes": "Notes",
	"all": "Tous"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Terjadi kesalahan",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Pengguna",
	"notes": "Catatan",
	"all": "Semua"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"noQrCodeFound": "Non trovo alcun QR Code",
	"chooseCamera": "Seleziona fotocamera",
	"somethingHappened": "Si è verificato un problema",
	"scanFile": "Scansiona immagine nel dispositivo",
	"stopQr": "Interrompi lettura QR Code",
	"startQr": "Inizia lettura QR Code",
	"cannotToggleFlash": "Flash non controllabile",
	"turnOnFlash": "Accendi il flash",
	"turnOffFlash": "Spegni il flash",
	"users": "Profili",
	"notes": "Note",
	"all": "Tutte"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"noQrCodeFound": "QRコードが見つかりません",
	"chooseCamera": "カメラを選択",
	"somethingHappened": "問題が発生しました",
	"scanFile": "端末の画像をスキャン",
	"stopQr": "コードリーダーを停止",
	"startQr": "コードリーダーを再開",
	"cannotToggleFlash": "ライト選択不可",
	"turnOnFlash": "ライトをオンにする",
	"turnOffFlash": "ライトをオフにする",
	"users": "ユーザー",
	"notes": "ノート",
	"all": "全て"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"noQrCodeFound": "QRコードが見つかりません",
	"chooseCamera": "カメラを選択",
	"somethingHappened": "なんかあかんわ",
	"scanFile": "端末の画像をスキャン",
	"stopQr": "コードリーダーを停止",
	"startQr": "コードリーダーを再開",
	"cannotToggleFlash": "ライト選択不可",
	"turnOnFlash": "ライトをオンにする",
	"turnOffFlash": "ライトをオフにする",
	"users": "ユーザー",
	"notes": "ノート",
	"all": "みんな"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "An error has occurred",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Users",
	"notes": "Notes",
	"all": "All"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "An error has occurred",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "ಬಳಕೆದಾರ",
	"notes": "Notes",
	"all": "All"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"noQrCodeFound": "QR 코드를 찾을 수 없습니다.",
	"chooseCamera": "카메라 선택",
	"somethingHappened": "오류가 발생했습니다",
	"scanFile": "단말기의 이미지 스캔",
	"stopQr": "코드 리더 정지",
	"startQr": "코드 리더 재개",
	"cannotToggleFlash": "플래시 선택 불가",
	"turnOnFlash": "플래시 켜기",
	"turnOffFlash": "플래시 끄기",
	"users": "유저",
	"notes": "노트",
	"all": "전체"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Er is iets misgegaan.",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Gebruikers",
	"notes": "Notities",
	"all": "Alle"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "En feil har oppstått",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Brukere",
	"notes": "Notes",
	"all": "Alle"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Coś poszło nie tak",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Użytkownicy",
	"notes": "Wpisy",
	"all": "Wszystkie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"noQrCodeFound": "Nenhum código QR encontrado",
	"chooseCamera": "Escolher câmera",
	"somethingHappened": "Ocorreu um erro",
	"scanFile": "Escanear imagem de dispositivo",
	"stopQr": "Deixar o leitor de códigos QR",
	"startQr": "Retornar ao leitor de códigos QR",
	"cannotToggleFlash": "Não foi possível ligar a lanterna",
	"turnOnFlash": "Ligar a lanterna",
	"turnOffFlash": "Desligar a lanterna",
	"users": "Usuários",
	"notes": "Posts",
	"all": "Todos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Что-то пошло не так",
	"scanFile": "Отсканировать изображение с устройства",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Пользователи",
	"notes": "Заметки",
	"all": "Все"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Používatelia",
	"notes": "Poznámky",
	"all": "Všetko"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"noQrCodeFound": "ไม่พบ QR โค้ด",
	"chooseCamera": "เลือกกล้อง",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"scanFile": "สแกนภาพจากอุปกรณ์",
	"stopQr": "หยุดตัวอ่าน QR โค้ด",
	"startQr": "เริ่มตัวอ่าน QR โค้ด",
	"cannotToggleFlash": "ไม่สามารถเลือกแสงแฟลชได้",
	"turnOnFlash": "ปิดแสงแฟลช",
	"turnOffFlash": "เปิดแสงแฟลช",
	"users": "ผู้ใช้",
	"notes": " โน้ต",
	"all": "ทั้งหมด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"noQrCodeFound": "QR kodu bulunamadı",
	"chooseCamera": "Kamera Seç",
	"somethingHappened": "Bir hata oluştu",
	"scanFile": "Cihazdaki görüntüyü tarayın",
	"stopQr": "Kod okuyucuyu durdurun",
	"startQr": "Özgeçmiş Kodu Okuyucu",
	"cannotToggleFlash": "Işık seçeneği mevcut değil.",
	"turnOnFlash": "Işığı açın",
	"turnOffFlash": "Işığı kapatın",
	"users": "Kullanıcılar",
	"notes": "Notlar",
	"all": "Tümü"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "An error has occurred",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Users",
	"notes": "Notes",
	"all": "All"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Щось пішло не так",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Користувачі",
	"notes": "Записи",
	"all": "Всі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"noQrCodeFound": "No QR code found",
	"chooseCamera": "Choose camera",
	"somethingHappened": "Xảy ra lỗi",
	"scanFile": "Scan image from device",
	"stopQr": "Stop QR code reader",
	"startQr": "Resume QR code reader",
	"cannotToggleFlash": "Unable to toggle flashlight",
	"turnOnFlash": "Turn on flashlight",
	"turnOffFlash": "Turn off flashlight",
	"users": "Người dùng",
	"notes": "Bài Viết",
	"all": "Tất cả"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"noQrCodeFound": "未找到二维码",
	"chooseCamera": "切换镜头",
	"somethingHappened": "出错了",
	"scanFile": "从设备扫描图像",
	"stopQr": "关闭扫码器",
	"startQr": "重新打开二维码扫描器",
	"cannotToggleFlash": "无法开关闪光灯",
	"turnOnFlash": "开启闪光灯",
	"turnOffFlash": "关闭闪光灯",
	"users": "用户",
	"notes": "帖子",
	"all": "全部"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"noQrCodeFound": "找不到 QR code",
	"chooseCamera": "選擇相機",
	"somethingHappened": "發生錯誤",
	"scanFile": "掃描在裝置上的影像",
	"stopQr": "停止條碼掃描器",
	"startQr": "啟動條碼掃描器",
	"cannotToggleFlash": "無法切換閃光燈",
	"turnOnFlash": "開啟閃光燈",
	"turnOffFlash": "關閉閃光燈",
	"users": "使用者",
	"notes": "貼文",
	"all": "全部"
}
</locale>
