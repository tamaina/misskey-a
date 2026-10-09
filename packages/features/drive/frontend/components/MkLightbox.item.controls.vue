<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="[$style.seekbar]">
		<MkMediaRange
			v-model="rangePercent"
			:buffer="bufferedDataRatio"
		/>
	</div>

	<div :class="[$style.controlsChild, $style.controlsLeft]">
		<button class="_button" :class="$style.controlButton" @click="togglePlayPause">
			<i v-if="isPlaying" class="ti ti-player-pause"></i>
			<i v-else class="ti ti-player-play"></i>
		</button>

		<div :class="[$style.controlsChild, $style.controlsTime]">{{ hms(elapsedTimeMs) }} / {{ hms(durationMs) }}</div>
	</div>
	<div :class="[$style.controlsChild, $style.controlsCenter]">
	</div>
	<div :class="[$style.controlsChild, $style.controlsRight]">
		<button class="_button" :class="$style.controlButton" @click="toggleMute">
			<i v-if="volume === 0" class="ti ti-volume-3"></i>
			<i v-else class="ti ti-volume"></i>
		</button>
		<MkMediaRange
			v-model="volume"
			:class="$style.volumeSeekbar"
		/>
		<button class="_button" :class="$style.controlButton" @click="showMenu">
			<i class="ti ti-settings"></i>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, inject, computed, watch, onBeforeUnmount } from 'vue';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import { DI } from '@features/ui/frontend/di.js';
import { hms } from '@features/ui/frontend/filters/hms.js';
import * as os from '@features/ui/frontend/os.js';
import hasAudio from '@features/drive/frontend/utility/media-has-audio.js';
import MkMediaRange from '@features/drive/frontend/components/MkMediaRange.vue';

const props = withDefaults(defineProps<{
	/** 音量をメディア要素に適用しない（ビジュアライザー用） */
	externalVolumeControl?: boolean;
}>(), {
	externalVolumeControl: false,
});

const volume = defineModel<number>('volume', { required: true });

const mediaEl = inject(DI.mkLightboxItemMediaEl, shallowRef<HTMLVideoElement | HTMLAudioElement | null>(null));
const isVideo = computed(() => mediaEl.value instanceof HTMLVideoElement);

// Menu
const menuShowing = ref(false);

function showMenu(ev: PointerEvent) {
	const menu: MenuItem[] = [
		// TODO: 再生キューに追加
		{
			type: 'switch',
			text: $locale.value.sfc.loop,
			icon: 'ti ti-repeat',
			ref: loop,
		},
		{
			type: 'radio',
			text: $locale.value.sfc.playbackRate,
			icon: 'ti ti-clock-play',
			ref: speed,
			options: [{
				label: '0.25x',
				value: 0.25,
			}, {
				label: '0.5x',
				value: 0.5,
			}, {
				label: '0.75x',
				value: 0.75,
			}, {
				label: '1.0x',
				value: 1,
			}, {
				label: '1.25x',
				value: 1.25,
			}, {
				label: '1.5x',
				value: 1.5,
			}, {
				label: '2.0x',
				value: 2,
			}],
		},
		...(window.document.pictureInPictureEnabled && isVideo.value ? [{
			text: $locale.value.sfc.pip,
			icon: 'ti ti-picture-in-picture',
			action: togglePictureInPicture,
		}] : []),
	];

	menuShowing.value = true;
	os.popupMenu(menu, ev.currentTarget ?? ev.target, {
		align: 'right',
		onClosing: () => {
			menuShowing.value = false;
		},
	});
}

// MediaControl: Common State
const oncePlayed = ref(false);
const isReady = ref(false);
const isPlaying = ref(false); // ユーザーが再生中であることを期待する状態か
const isActuallyPlaying = ref(false); // 実際に再生中か (バッファリング等で一時停止している場合は false)
const elapsedTimeMs = ref(0);
const durationMs = ref(0);
const rangePercent = computed({
	get: () => {
		return (elapsedTimeMs.value / durationMs.value) || 0;
	},
	set: (to) => {
		if (mediaEl.value == null) return;
		mediaEl.value.currentTime = to * durationMs.value / 1000;
	},
});
const speed = ref(1);
const loop = ref(false); // TODO: ドライブファイルのフラグに置き換える
const bufferedEnd = ref(0);
const bufferedDataRatio = computed(() => {
	if (durationMs.value === 0) return 0;
	return bufferedEnd.value / (durationMs.value / 1000);
});

// state の更新はすべてメディア要素のイベント側に任せる
function togglePlayPause() {
	if (!isReady.value) return;

	if (isPlaying.value) {
		mediaEl.value?.pause();
	} else {
		// 自動再生のブロック等で reject しうるが、再生ボタンが出たままになるだけなので握りつぶす
		mediaEl.value?.play().catch(err => {
			if (_DEV_) console.warn('Failed to play media:', err);
		});
	}
}

function togglePictureInPicture() {
	// ブラウザ側で許可されていない場合等にrejectしうるが、表示が変わらないだけなので握りつぶす
	if (window.document.pictureInPictureElement) {
		window.document.exitPictureInPicture().catch(err => {
			if (_DEV_) console.warn('Failed to exit picture-in-picture:', err);
		});
	} else if (isVideo.value) {
		(mediaEl.value as HTMLVideoElement).requestPictureInPicture().catch(err => {
			if (_DEV_) console.warn('Failed to enter picture-in-picture:', err);
		});
	}
}

function toggleMute() {
	if (volume.value === 0) {
		volume.value = .25;
	} else {
		volume.value = 0;
	}
}

let abortController: AbortController | null = null;
let loopObserver: MutationObserver | null = null;

// currentTime だけは進捗を通知するイベントが timeupdate しかなく、
// これは 4Hz 程度でしか発火しないためシークバーがカクつく。
// そのため再生中に限り requestAnimationFrame で補間する
let elapsedTickFrameId: number | null = null;

function syncElapsedTime() {
	if (mediaEl.value == null) return;
	elapsedTimeMs.value = mediaEl.value.currentTime * 1000;
}

function elapsedTick() {
	syncElapsedTime();
	elapsedTickFrameId = window.requestAnimationFrame(elapsedTick);
}

function startElapsedTick() {
	if (elapsedTickFrameId != null) return;
	elapsedTickFrameId = window.requestAnimationFrame(elapsedTick);
}

function stopElapsedTick() {
	if (elapsedTickFrameId == null) return;
	window.cancelAnimationFrame(elapsedTickFrameId);
	elapsedTickFrameId = null;
}

function syncDuration() {
	const duration = mediaEl.value?.duration;
	// メタデータ読み込み前は NaN、ライブストリームでは Infinity になりうる
	durationMs.value = duration != null && Number.isFinite(duration) ? duration * 1000 : 0;
}

function syncBuffered() {
	const buffered = mediaEl.value?.buffered;
	if (buffered == null || buffered.length === 0) {
		bufferedEnd.value = 0;
		return;
	}

	// シークすると読み込み済みの範囲が複数に分かれるため、最も先まで到達している位置を採用する
	let end = 0;
	for (let i = 0; i < buffered.length; i++) {
		if (buffered.end(i) > end) end = buffered.end(i);
	}
	bufferedEnd.value = end;
}

function syncReady() {
	const el = mediaEl.value;
	isReady.value = el != null && el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
}

function init() {
	const el: HTMLMediaElement | null = mediaEl.value;
	if (el == null) return;

	abortController = new AbortController();
	const signal = abortController.signal;

	const on = (type: keyof HTMLMediaElementEventMap, listener: () => void) => {
		el.addEventListener(type, listener, { signal });
	};

	on('play', () => {
		isPlaying.value = true;
		oncePlayed.value = true;
		startElapsedTick();
	});

	on('playing', () => {
		isActuallyPlaying.value = true;
		startElapsedTick();
	});

	on('waiting', () => {
		isActuallyPlaying.value = false;
		stopElapsedTick();
	});

	on('pause', () => {
		isPlaying.value = false;
		isActuallyPlaying.value = false;
		stopElapsedTick();
	});

	on('ended', () => {
		oncePlayed.value = false;
		isPlaying.value = false;
		isActuallyPlaying.value = false;
		stopElapsedTick();
		syncElapsedTime();
	});

	on('timeupdate', syncElapsedTime);
	on('seeking', syncElapsedTime);
	on('seeked', () => {
		syncElapsedTime();
		syncBuffered();
	});

	on('durationchange', syncDuration);
	on('loadstart', syncReady);
	on('canplay', syncReady);
	on('canplaythrough', syncReady);
	on('loadedmetadata', () => {
		syncDuration();
		syncBuffered();
		syncReady();
	});
	on('progress', syncBuffered);
	on('emptied', () => {
		isReady.value = false;
		isPlaying.value = false;
		isActuallyPlaying.value = false;
		oncePlayed.value = false;
		stopElapsedTick();
		syncDuration();
		syncBuffered();
		syncElapsedTime();
	});

	// ネイティブUIやブラウザのコンテキストメニューから変更されうるもの
	// (externalVolumeControl時は要素の音量を100%に固定しているので、取り込むと表示が壊れる)
	if (!props.externalVolumeControl) {
		on('volumechange', () => {
			const to = el.muted ? 0 : el.volume;
			if (volume.value !== to) volume.value = to;
		});
	}

	on('ratechange', () => {
		if (speed.value !== el.playbackRate) speed.value = el.playbackRate;
	});

	// loop には変更イベントが無いが、属性の変化を監視すればネイティブUI経由の変更も拾える
	loopObserver = new MutationObserver(() => {
		if (loop.value !== el.loop) loop.value = el.loop;
	});
	loopObserver.observe(el, { attributes: true, attributeFilter: ['loop'] });

	// 現在の要素の状態を state に取り込む
	// (コントロール表示前に再生が始まっている場合等)
	syncReady();
	syncDuration();
	syncBuffered();
	syncElapsedTime();
	loop.value = el.loop;
	speed.value = el.playbackRate;
	isPlaying.value = !el.paused;
	if (!el.paused) {
		oncePlayed.value = true;
		startElapsedTick();
	}

	if (!props.externalVolumeControl) {
		el.volume = volume.value;
	}

	// 音声トラックを持たない動画はGIFのように扱う
	if (isVideo.value) {
		hasAudio(el).then(had => {
			// 判定を待っている間に teardown / 再 init されている可能性があるので、世代が変わっていたら何もしない
			if (signal.aborted) return;
			if (!had) {
				el.loop = el.muted = true;
				el.play().catch(err => {
					if (_DEV_) console.warn('Failed to play media:', err);
				});
			}
		});
	}
}

function teardown() {
	abortController?.abort();
	abortController = null;
	loopObserver?.disconnect();
	loopObserver = null;
	stopElapsedTick();
	isReady.value = false;
	// メディア要素を差し替えた場合、古い要素のイベントはもう届かないのでここで戻しておく
	// (isPlaying / loop / speed 等は init() が新しい要素から取り込み直す)
	isActuallyPlaying.value = false;
	oncePlayed.value = false;
}

watch(volume, (to) => {
	if (props.externalVolumeControl) return; // 適用は音量を受け取った側 (Web Audio経路) が行う
	if (mediaEl.value == null) return;
	mediaEl.value.volume = to;
	mediaEl.value.muted = to === 0;
});

watch(speed, (to) => {
	if (mediaEl.value == null) return;
	mediaEl.value.playbackRate = to;
});

watch(loop, (to) => {
	if (mediaEl.value == null) return;
	mediaEl.value.loop = to;
});

watch(mediaEl, () => {
	teardown();
	init();
}, { immediate: true });

onBeforeUnmount(teardown);

defineExpose({
	isPlaying,
	isReady,
	isActuallyPlaying,
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-areas:
		"seekbar seekbar seekbar"
		"left center right";
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 4px 8px;
	width: 100%;
}

.controlsChild {
	display: flex;
	align-items: center;
	gap: 4px;
}

.controlsLeft {
	grid-area: left;
}

.controlsRight {
	grid-area: right;
}

.controlsCenter {
	grid-area: center;
	justify-content: center;
}

.controlButton {
	padding: 6px;
	border-radius: 4px;

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	&:hover {
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
	}

	&:focus-visible {
		outline: none;
	}
}

.controlsTime {
	font-size: 85%;
}

.seekbar {
	grid-area: seekbar;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"loop": "Reproducció en bucle",
	"playbackRate": "Velocitat de reproducció ",
	"pip": "Imatge sobre impressionada "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"loop": "Endloswiedergabe",
	"playbackRate": "Wiedergabegeschwindigkeit",
	"pip": "Bild-in-Bild"
}
</locale>

<locale locale="en-US" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"loop": "Reproducción en bucle",
	"playbackRate": "Velocidad de reproducción",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Vitesse de lecture",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"loop": "Ulangi Pemutaran",
	"playbackRate": "Kecepatan Pemutaran",
	"pip": "Gambar dalam Gambar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"loop": "Ripetizione infinita",
	"playbackRate": "Velocità di riproduzione",
	"pip": "Sovraimpressione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"loop": "ループ再生",
	"playbackRate": "再生速度",
	"pip": "ピクチャインピクチャ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"loop": "ループ再生",
	"playbackRate": "再生速度",
	"pip": "ピクチャインピクチャ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"loop": "반복 재생",
	"playbackRate": "재생 속도",
	"pip": "화면 속 화면"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"loop": "Reprodução em Loop",
	"playbackRate": "Velocidade de Reprodução",
	"pip": "Picture-in-Picture"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"loop": "เล่นวนซ้ำ",
	"playbackRate": "ความเร็วในการเล่น",
	"pip": "ภาพซ้อนภาพ (PiP)"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"loop": "Döngüsel oynatma",
	"playbackRate": "Oynatma Hızı",
	"pip": "Resim içinde resim"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"loop": "Loop playback",
	"playbackRate": "Playback Speed",
	"pip": "Picture in Picture"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"loop": "循环播放",
	"playbackRate": "播放速度",
	"pip": "画中画"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"loop": "循環播放",
	"playbackRate": "播放速度",
	"pip": "畫中畫"
}
</locale>
