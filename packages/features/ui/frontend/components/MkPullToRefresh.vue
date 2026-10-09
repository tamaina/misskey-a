<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="isPulling ? $style.isPulling : null">
	<!-- 小数が含まれるとレンダリングが高頻度になりすぎパフォーマンスが悪化するためround -->
	<div v-if="isPulling" :class="$style.frame" :style="`--frame-min-height: ${Math.round(pullDistance / (PULL_BRAKE_BASE + (pullDistance / PULL_BRAKE_FACTOR)))}px;`">
		<div :class="$style.frameContent">
			<MkLoading v-if="isRefreshing" :class="$style.loader" :em="true"/>
			<i v-else class="ti ti-arrow-bar-to-down" :class="[$style.icon, { [$style.refresh]: isPulledEnough }]"></i>
			<div :class="$style.text">
				<template v-if="isPulledEnough">{{ $locale.sfc.releaseToRefresh }}</template>
				<template v-else-if="isRefreshing">{{ $locale.sfc.refreshing }}</template>
				<template v-else>{{ $locale.sfc.pullDownToRefresh }}</template>
			</div>
		</div>
	</div>

	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { getScrollContainer } from '@features/ui/frontend/shared/scroll.js';
import { isHorizontalSwipeSwiping } from '@features/ui/frontend/utility/touch.js';
import { haptic } from '@features/ui/frontend/utility/haptic.js';

const SCROLL_STOP = 10;
const MAX_PULL_DISTANCE = Infinity;
const FIRE_THRESHOLD = 200;
const RELEASE_TRANSITION_DURATION = 200;
const PULL_BRAKE_BASE = 1.5;
const PULL_BRAKE_FACTOR = 170;

const isPulling = ref(false);
const isPulledEnough = ref(false);
const isRefreshing = ref(false);
const pullDistance = ref(0);

let startScreenY: number | null = null;

const rootEl = useTemplateRef('rootEl');
let scrollEl: HTMLElement | null = null;

const props = withDefaults(defineProps<{
	refresher: () => Promise<void>;
}>(), {
	refresher: () => Promise.resolve(),
});

const emit = defineEmits<{
	(ev: 'refresh'): void;
}>();

function getScreenY(event: TouchEvent | MouseEvent | PointerEvent): number {
	if (('touches' in event) && event.touches[0] && event.touches[0].screenY != null) {
		return event.touches[0].screenY;
	} else if ('screenY' in event) {
		return event.screenY;
	} else {
		return 0; // TSを黙らせるため
	}
}

// When at the top of the page, disable vertical overscroll so passive touch listeners can take over.
function lockDownScroll() {
	if (scrollEl == null) return;
	scrollEl.style.touchAction = 'pan-x pan-down pinch-zoom';
	scrollEl.style.overscrollBehavior = 'auto none';
}

function unlockDownScroll() {
	if (scrollEl == null) return;
	scrollEl.style.touchAction = 'auto';
	scrollEl.style.overscrollBehavior = 'auto contain';
}

function moveStartByMouse(event: MouseEvent) {
	if (event.button !== 1) return;
	if (isRefreshing.value) return;

	const scrollPos = scrollEl!.scrollTop;
	if (scrollPos !== 0) {
		unlockDownScroll();
		return;
	}

	lockDownScroll();

	event.preventDefault(); // 中クリックによるスクロール、テキスト選択などを防ぐ

	isPulling.value = true;
	startScreenY = getScreenY(event);
	pullDistance.value = 0;

	window.addEventListener('mousemove', moving, { passive: true });
	window.addEventListener('mouseup', () => {
		window.removeEventListener('mousemove', moving);
		onPullRelease();
	}, { passive: true, once: true });
}

function moveStartByTouch(event: TouchEvent) {
	if (isRefreshing.value) return;

	const scrollPos = scrollEl!.scrollTop;
	if (scrollPos !== 0) {
		unlockDownScroll();
		return;
	}

	lockDownScroll();

	isPulling.value = true;
	startScreenY = getScreenY(event);
	pullDistance.value = 0;

	window.addEventListener('touchmove', moving, { passive: true });
	window.addEventListener('touchend', () => {
		window.removeEventListener('touchmove', moving);
		onPullRelease();
	}, { passive: true, once: true });
}

function moveBySystem(to: number): Promise<void> {
	return new Promise(r => {
		const startHeight = pullDistance.value;
		const overHeight = pullDistance.value - to;
		if (overHeight < 1) {
			r();
			return;
		}
		const startTime = Date.now();
		let intervalId = window.setInterval(() => {
			const time = Date.now() - startTime;
			if (time > RELEASE_TRANSITION_DURATION) {
				pullDistance.value = to;
				window.clearInterval(intervalId);
				r();
				return;
			}
			const nextHeight = startHeight - (overHeight / RELEASE_TRANSITION_DURATION) * time;
			if (pullDistance.value < nextHeight) return;
			pullDistance.value = nextHeight;
		}, 1);
	});
}

async function fixOverContent() {
	if (pullDistance.value > FIRE_THRESHOLD) {
		await moveBySystem(FIRE_THRESHOLD);
	}
}

async function closeContent() {
	if (pullDistance.value > 0) {
		await moveBySystem(0);
	}
}

function onPullRelease() {
	startScreenY = null;
	if (isPulledEnough.value) {
		isPulledEnough.value = false;
		isRefreshing.value = true;
		fixOverContent().then(() => {
			emit('refresh');
			props.refresher().then(() => {
				refreshFinished();
			});
		});
	} else {
		closeContent().then(() => isPulling.value = false);
	}
}

function toggleScrollLockOnTouchEnd() {
	const scrollPos = scrollEl!.scrollTop;
	if (scrollPos === 0) {
		lockDownScroll();
	} else {
		unlockDownScroll();
	}
}

function moving(event: MouseEvent | TouchEvent) {
	if ((scrollEl?.scrollTop ?? 0) > SCROLL_STOP + pullDistance.value || isHorizontalSwipeSwiping.value) {
		pullDistance.value = 0;
		isPulledEnough.value = false;
		onPullRelease();
		return;
	}

	if (startScreenY === null) {
		startScreenY = getScreenY(event);
	}
	const moveScreenY = getScreenY(event);

	const moveHeight = moveScreenY - startScreenY!;
	pullDistance.value = Math.min(Math.max(moveHeight, 0), MAX_PULL_DISTANCE);

	isPulledEnough.value = pullDistance.value >= FIRE_THRESHOLD;

	if (isPulledEnough.value) haptic();
}

/**
 * emit(refresh)が完了したことを知らせる関数
 *
 * タイムアウトがないのでこれを最終的に実行しないと出たままになる
 */
function refreshFinished() {
	closeContent().then(() => {
		isPulling.value = false;
		isRefreshing.value = false;
	});
}

onMounted(() => {
	if (rootEl.value == null) return;
	scrollEl = getScrollContainer(rootEl.value);
	lockDownScroll();
	rootEl.value.addEventListener('mousedown', moveStartByMouse, { passive: false }); // preventDefaultするため
	rootEl.value.addEventListener('touchstart', moveStartByTouch, { passive: true });
	rootEl.value.addEventListener('touchend', toggleScrollLockOnTouchEnd, { passive: true });
});

onUnmounted(() => {
	unlockDownScroll();
	if (rootEl.value) rootEl.value.removeEventListener('mousedown', moveStartByMouse);
	if (rootEl.value) rootEl.value.removeEventListener('touchstart', moveStartByTouch);
	if (rootEl.value) rootEl.value.removeEventListener('touchend', toggleScrollLockOnTouchEnd);
});
</script>

<style lang="scss" module>
.isPulling {
	will-change: contents;
}

.frame {
	position: relative;
	overflow: clip;

	width: 100%;
	min-height: var(--frame-min-height, 0px);

	mask-image: linear-gradient(90deg, #000 0%, #000 80%, transparent);
	-webkit-mask-image: -webkit-linear-gradient(90deg, #000 0%, #000 80%, transparent);

	pointer-events: none;
}

.frameContent {
	position: absolute;
	bottom: 0;
	width: 100%;
	margin: 5px 0;
	display: flex;
	flex-direction: column;
	align-items: center;

	> .icon, > .loader {
		margin: 6px 0;
	}

	> .icon {
		transition: transform .25s;

		&.refresh {
			transform: rotate(180deg);
		}
	}

	> .text {
		margin: 5px 0;
		font-size: 90%;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "releaseToRefresh": "Deixar anar per actualitzar",
  "refreshing": "Recarregant...",
  "pullDownToRefresh": "Llisca cap a baix per recarregar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "releaseToRefresh": "Zum Aktualisieren loslassen",
  "refreshing": "Wird aktualisiert...",
  "pullDownToRefresh": "Zum Aktualisieren ziehen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "releaseToRefresh": "Suelta para recargar",
  "refreshing": "Recargando...",
  "pullDownToRefresh": "Tira hacia abajo para recargar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "releaseToRefresh": "Relâcher pour rafraîchir",
  "refreshing": "Rafraîchissement...",
  "pullDownToRefresh": "Tirer vers le bas pour rafraîchir"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "releaseToRefresh": "Lepaskan untuk memuat ulang",
  "refreshing": "Sedang memuat ulang...",
  "pullDownToRefresh": "Tarik ke bawah untuk memuat ulang"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "releaseToRefresh": "Rilascia per aggiornare",
  "refreshing": "Aggiornamento...",
  "pullDownToRefresh": "Trascinare per aggiornare"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "releaseToRefresh": "離してリロード",
  "refreshing": "リロード中",
  "pullDownToRefresh": "引っ張ってリロード"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "releaseToRefresh": "離したらリロード",
  "refreshing": "リロードしとる",
  "pullDownToRefresh": "引っ張ってリロードするで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "releaseToRefresh": "놓아서 새로고침",
  "refreshing": "새로고침 중",
  "pullDownToRefresh": "아래로 내려서 새로고침"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "releaseToRefresh": "Solte para atualizar",
  "refreshing": "Atualizando...",
  "pullDownToRefresh": "Puxe para baixo para atualizar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "releaseToRefresh": "Отпустите, чтобы обновить",
  "refreshing": "Обновление...",
  "pullDownToRefresh": "Опустите что бы обновить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "releaseToRefresh": "ปล่อยเพื่อรีเฟรช",
  "refreshing": "กำลังรีเฟรช...",
  "pullDownToRefresh": "ดึงลงเพื่อรีเฟรช"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "releaseToRefresh": "Yenilemek için serbest bırak",
  "refreshing": "Yenileniyor...",
  "pullDownToRefresh": "Yenilemek için aşağı çekin"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "releaseToRefresh": "Release to refresh",
  "refreshing": "Refreshing...",
  "pullDownToRefresh": "Pull down to refresh"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "releaseToRefresh": "Відпустіть, щоб оновити",
  "refreshing": "Оновлення...",
  "pullDownToRefresh": "Потягніть вниз, щоб оновити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "releaseToRefresh": "Thả để làm mới",
  "refreshing": "Đang làm mới",
  "pullDownToRefresh": "Kéo xuống để làm mới"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "releaseToRefresh": "松开以刷新",
  "refreshing": "刷新中",
  "pullDownToRefresh": "下拉以刷新"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "releaseToRefresh": "放開以更新內容",
  "refreshing": "載入更新中",
  "pullDownToRefresh": "往下拉來更新內容"
}
</locale>
