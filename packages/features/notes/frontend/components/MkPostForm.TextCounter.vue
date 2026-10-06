<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.textCountRoot]">
	<div :class="$style.textCountLabel">{{ $locale.sfc.textCount }}</div>
	<div
		:class="[$style.textCount,
			{ [$style.danger]: textCountPercentage > 100 },
			{ [$style.warning]: textCountPercentage > 90 && textCountPercentage <= 100 },
		]"
	>
		<div :class="$style.textCountGraph"></div>
		<div><span :class="$style.textCountCurrent">{{ number(textLength) }}</span> / {{ number(maxTextLength) }}</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import { instance } from '@features/instance/frontend/instance.js';
import number from '@features/ui/frontend/filters/number.js';

const props = defineProps<{
	textLength: number;
}>();

const maxTextLength = computed(() => {
	return instance ? instance.maxNoteTextLength : 1000;
});

const textCountPercentage = computed(() => {
	return props.textLength / maxTextLength.value * 100;
});
</script>

<style lang="scss" module>
.textCountRoot {
	padding: 4px 14px;
}

.textCountLabel {
	font-size: 11px;
	opacity: 0.8;
	margin-bottom: 4px;
}

.textCount {
	display: flex;
	gap: var(--MI-marginHalf);
	align-items: center;
	font-size: 12px;
	--countColor: var(--MI_THEME-accent);

	&.danger {
		--countColor: var(--MI_THEME-error);
	}

	&.warning {
		--countColor: var(--MI_THEME-warn);
	}

	.textCountGraph {
		position: relative;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-image: conic-gradient(
			var(--countColor) 0% v-bind("Math.min(100, textCountPercentage) + '%'"),
			rgba(0, 0, 0, .2) v-bind("Math.min(100, textCountPercentage) + '%'") 100%
		);

		&::after {
			content: '';
			position: absolute;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background-color: var(--MI_THEME-popup);
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}

	.textCountCurrent {
		color: var(--countColor);
		font-weight: 700;
		font-size: 18px;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "textCount": "Nombre de caràcters "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "textCount": "Zeichenanzahl"
}
</locale>

<locale locale="en-US" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "textCount": "caracteres"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "textCount": "Quantità di caratteri"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "textCount": "文字数"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "textCount": "文字数"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "textCount": "문자 수"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "textCount": "Contagem de caracteres"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "textCount": "Количество символов"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "textCount": "จำนวนอักขระ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "textCount": "Karakter sayısı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "textCount": "Кількість символів"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "textCount": "Character count"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "textCount": "字数"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "textCount": "字數"
}
</locale>
