<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" :dragStartCallback="dragStartCallback" @remove="() => emit('remove')">
	<template #header><i class="ti ti-align-left"></i> {{ $locale.sfc.text }}</template>

	<section>
		<textarea ref="inputEl" v-model="text" :class="$style.textarea"></textarea>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
import { watch, ref, useTemplateRef, onMounted, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '@features/pages/frontend/pages/page-editor/page-editor.container.vue';
import { Autocomplete } from '@features/discovery/frontend/utility/autocomplete.js';

const props = defineProps<{
	dragStartCallback?: (ev: DragEvent) => void;
	modelValue: Misskey.entities.PageBlock & { type: 'text' }
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'text' }): void;
	(ev: 'remove'): void;
}>();

let autocomplete: Autocomplete;

const text = ref(props.modelValue.text ?? '');
const inputEl = useTemplateRef('inputEl');

watch(text, () => {
	emit('update:modelValue', {
		...props.modelValue,
		text: text.value,
	});
});

onMounted(() => {
	if (inputEl.value == null) return;
	autocomplete = new Autocomplete(inputEl.value, text);
});

onUnmounted(() => {
	autocomplete.detach();
});
</script>

<style lang="scss" module>
.textarea {
	display: block;
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	width: 100%;
	min-width: 100%;
	min-height: 150px;
	border: none;
	box-shadow: none;
	padding: 16px;
	background: transparent;
	color: var(--MI_THEME-fg);
	font-size: 14px;
	box-sizing: border-box;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "text": "نص"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="en-US" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "text": "Texto"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "text": "Texte"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "text": "Teks"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "text": "Testo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "text": "テキスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "text": "テキスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "text": "텍스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "text": "Tekst"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "text": "Tekst"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "text": "Texto"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "text": "Текст"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "text": "ข้อความ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "text": "Metin"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "text": "Text"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "text": "Текст"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "text": "Văn bản"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "text": "文本"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "text": "文字"
}
</locale>
