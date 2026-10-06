<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" :style="{ zIndex }">
	<div :class="[$style.bg]"></div>
	<div ref="spotEl" :class="$style.spot"></div>
	<div ref="bodyEl" :class="$style.body" class="_panel _shadow">
		<div class="_gaps_s">
			<div><b>{{ title }}</b></div>
			<div>{{ description }}</div>
			<div class="_buttons">
				<MkButton v-if="hasPrev" small @click="prev"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
				<MkButton v-if="hasNext" small primary @click="next">{{ $locale.sfc.next }} <i class="ti ti-arrow-right"></i></MkButton>
				<MkButton v-else small primary @click="next">{{ $locale.sfc.done }} <i class="ti ti-check"></i></MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { calcPopupPosition } from '@features/ui/frontend/utility/popup-position.js';
import * as os from '@features/ui/frontend/os.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const props = withDefaults(defineProps<{
	title: string;
	description: string;
	anchorElement?: HTMLElement;
	x?: number;
	y?: number;
	direction?: 'top' | 'bottom' | 'right' | 'left';
	hasPrev: boolean;
	hasNext: boolean;
}>(), {
	direction: 'top',
});

const emit = defineEmits<{
	(prev: 'prev'): void;
	(next: 'next'): void;
}>();

function prev() {
	emit('prev');
}

function next() {
	emit('next');
}

const rootEl = useTemplateRef('rootEl');
const bodyEl = useTemplateRef('bodyEl');
const spotEl = useTemplateRef('spotEl');
const zIndex = os.claimZIndex('high');
const spotX = ref(0);
const spotY = ref(0);
const spotWidth = ref(0);
const spotHeight = ref(0);

function setPosition() {
	if (spotEl.value == null) return;
	if (bodyEl.value == null) return;
	if (props.anchorElement == null) return;

	const rect = props.anchorElement.getBoundingClientRect();
	spotX.value = rect.left;
	spotY.value = rect.top;
	spotWidth.value = rect.width;
	spotHeight.value = rect.height;

	const data = calcPopupPosition(bodyEl.value, {
		anchorElement: props.anchorElement,
		direction: props.direction,
		align: 'center',
		innerMargin: 16,
		x: props.x,
		y: props.y,
	});

	bodyEl.value.style.transformOrigin = data.transformOrigin;
	bodyEl.value.style.left = data.left + 'px';
	bodyEl.value.style.top = data.top + 'px';
}

let loopHandler: number | null = null;

onMounted(() => {
	nextTick(() => {
		setPosition();

		const loop = () => {
			setPosition();
			loopHandler = window.requestAnimationFrame(loop);
		};

		loop();
	});
});

onUnmounted(() => {
	if (loopHandler != null) window.cancelAnimationFrame(loopHandler);
});
</script>

<style lang="scss" module>
.root {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.bg {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.spot {
	--x: v-bind("spotX + 'px'");
	--y: v-bind("spotY + 'px'");
	--width: v-bind("spotWidth + 'px'");
	--height: v-bind("spotHeight + 'px'");
	--padding: 8px;
	position: absolute;
	left: calc(var(--x) - var(--padding));
	top: calc(var(--y) - var(--padding));
	width: calc(var(--width) + var(--padding) * 2);
	height: calc(var(--height) + var(--padding) * 2);
	box-sizing: border-box;
	border: 1px solid transparent;
	border-radius: 8px;
	box-shadow: 0 0 0 9999px #000a;
	transition: left 0.2s ease-out, top 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out;
	animation: blink 1s infinite;
}

.body {
	position: absolute;
	padding: 16px 20px;
	box-sizing: border-box;
	width: max-content;
	max-width: min(500px, 100vw);
}

@keyframes blink {
	0%, 100% {
		background: color(from var(--MI_THEME-accent) srgb r g b / 0.1);
		border: 1px solid color(from var(--MI_THEME-accent) srgb r g b / 0.75);
	}
	50% {
		background: transparent;
		border: 1px solid transparent;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "goBack": "رجوع",
  "next": "التالية",
  "done": "تمّ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "goBack": "Tornar",
  "next": "Següent",
  "done": "Fet"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "goBack": "Zpět",
  "next": "Další",
  "done": "Hotovo"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "goBack": "Back",
  "next": "Next",
  "done": "Done"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "goBack": "Zurück",
  "next": "Weiter",
  "done": "Fertig"
}
</locale>

<locale locale="en-US" lang="json">
{
  "goBack": "Back",
  "next": "Next",
  "done": "Done"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "goBack": "Anterior",
  "next": "Siguiente",
  "done": "Hecho"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "goBack": "Retour",
  "next": "Suivant",
  "done": "Terminé"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "goBack": "Kembali",
  "next": "Selanjutnya",
  "done": "Selesai"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "goBack": "Indietro",
  "next": "Avanti",
  "done": "Fine"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "goBack": "戻る",
  "next": "次",
  "done": "完了"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "goBack": "戻る",
  "next": "次",
  "done": "でけた"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "goBack": "Back",
  "next": "Next",
  "done": "Done"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "goBack": "Back",
  "next": "Next",
  "done": "Done"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "goBack": "뒤로",
  "next": "다음",
  "done": "완료"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "goBack": "Terug",
  "next": "Volgende",
  "done": "Klaar"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "goBack": "Back",
  "next": "Neste",
  "done": "Ferdig"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "goBack": "Wróć",
  "next": "Dalej",
  "done": "Gotowe"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "goBack": "Voltar",
  "next": "Seguinte",
  "done": "Concluído"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "goBack": "Выход",
  "next": "Дальше",
  "done": "Готово"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "goBack": "Späť",
  "next": "Ďalší",
  "done": "Hotovo"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "goBack": "ย้อนกลับ",
  "next": "ถัด\u200Bไป",
  "done": "เสร็จสิ้น"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "goBack": "Geri",
  "next": "Sonraki",
  "done": "Tamam"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "goBack": "Back",
  "next": "Next",
  "done": "Done"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "goBack": "Назад",
  "next": "Далі",
  "done": "Готово"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "goBack": "Quay lại",
  "next": "Kế tiếp",
  "done": "Xong"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "goBack": "返回",
  "next": "下一个",
  "done": "完成"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "goBack": "返回",
  "next": "下一步",
  "done": "完成"
}
</locale>
