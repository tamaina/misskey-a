<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.label" @click="focus"><slot name="label"></slot></div>
	<div :class="[$style.codeEditorRoot, { [$style.focused]: focused }]">
		<div :class="$style.codeEditorScroller">
			<textarea
				ref="inputEl"
				v-model="v"
				:class="[$style.textarea]"
				:disabled="disabled"
				:required="required"
				:readonly="readonly"
				autocomplete="off"
				wrap="off"
				spellcheck="false"
				@focus="focused = true"
				@blur="focused = false"
				@keydown="onKeydown($event)"
				@input="onInput"
			></textarea>
			<XCode :class="$style.codeEditorHighlighter" :codeEditor="true" :code="v" :lang="lang"/>
		</div>
	</div>
	<div :class="$style.caption"><slot name="caption"></slot></div>
	<MkButton v-if="manualSave && changed" primary :class="$style.save" @click="updated"><i class="ti ti-device-floppy"></i> {{ globalLocale.env.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, watch, toRefs, useTemplateRef, nextTick } from 'vue';
import { debounce } from 'throttle-debounce';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import XCode from '@features/markup/frontend/components/MkCode.core.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = withDefaults(defineProps<{
	modelValue: string | null;
	lang?: string;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	debounce?: boolean;
	manualSave?: boolean;
}>(), {
	lang: 'js',
});

const emit = defineEmits<{
	(ev: 'change', _ev: InputEvent): void;
	(ev: 'keydown', _ev: KeyboardEvent): void;
	(ev: 'enter'): void;
	(ev: 'update:modelValue', value: string): void;
}>();

const { modelValue } = toRefs(props);
const v = ref<string>(modelValue.value ?? '');
const focused = ref(false);
const changed = ref(false);
const inputEl = useTemplateRef('inputEl');

function focus() {
	inputEl.value?.focus();
}

function onInput(ev: InputEvent) {
	v.value = (inputEl.value?.value) ?? '';
	changed.value = true;
	emit('change', ev);
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) return;

	emit('keydown', ev);

	if (ev.code === 'Enter') {
		const pos = inputEl.value?.selectionStart ?? 0;
		const posEnd = inputEl.value?.selectionEnd ?? v.value.length;
		if (pos === posEnd) {
			const lines = v.value.slice(0, pos).split('\n');
			const currentLine = lines[lines.length - 1];
			const currentLineSpaces = currentLine.match(/^\s+/);
			const posDelta = currentLineSpaces ? currentLineSpaces[0].length : 0;
			ev.preventDefault();
			v.value = v.value.slice(0, pos) + '\n' + (currentLineSpaces ? currentLineSpaces[0] : '') + v.value.slice(pos);
			nextTick(() => {
				inputEl.value?.setSelectionRange(pos + 1 + posDelta, pos + 1 + posDelta);
			});
		}
		emit('enter');
	}

	if (ev.key === 'Tab') {
		const pos = inputEl.value?.selectionStart ?? 0;
		const posEnd = inputEl.value?.selectionEnd ?? v.value.length;
		v.value = v.value.slice(0, pos) + '\t' + v.value.slice(posEnd);
		nextTick(() => {
			inputEl.value?.setSelectionRange(pos + 1, pos + 1);
		});
		ev.preventDefault();
	}
}

function updated() {
	changed.value = false;
	emit('update:modelValue', v.value);
}

const debouncedUpdated = debounce(1000, updated);

watch(modelValue, newValue => {
	v.value = newValue ?? '';
});

watch(v, newValue => {
	if (!props.manualSave) {
		if (props.debounce) {
			debouncedUpdated();
		} else {
			updated();
		}
	}
});
</script>

<style lang="scss" module>
.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;

	&:empty {
		display: none;
	}
}

.caption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);

	&:empty {
		display: none;
	}
}

.save {
	margin: 8px 0 0 0;
}

.codeEditorRoot {
	min-width: 100%;
	max-width: 100%;
	overflow-x: auto;
	overflow-y: hidden;
	box-sizing: border-box;
	margin: 0;
	border-radius: 6px;
	padding: 0;
	color: var(--MI_THEME-fg);
	border: solid 1px var(--MI_THEME-panel);
	transition: border-color 0.1s ease-out;
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	&:hover {
		border-color: var(--MI_THEME-inputBorderHover) !important;
	}
}

.focused.codeEditorRoot {
	border-color: var(--MI_THEME-accent) !important;
	border-radius: 6px;
}

.codeEditorScroller {
	position: relative;
	display: inline-block;
	min-width: 100%;
	height: 100%;
}

.textarea, .codeEditorHighlighter {
	margin: 0;
}

.textarea {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: inline-block;
	appearance: none;
	resize: none;
	text-align: left;
	color: transparent;
	caret-color: var(--MI_THEME-fg);
	background-color: transparent;
	border: 0;
	border-radius: 6px;
	box-sizing: border-box;
	outline: 0;
	min-width: calc(100% - 24px);
	height: 100%;
	padding: 12px;
	line-height: 1.5em;
	font-size: 1em;
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
}

.textarea::selection {
	color: var(--MI_THEME-bg);
}
</style>

<locale locale="ar-SA" lang="json">
{}
</locale>

<locale locale="ca-ES" lang="json">
{}
</locale>

<locale locale="cs-CZ" lang="json">
{}
</locale>

<locale locale="da-DK" lang="json">
{}
</locale>

<locale locale="de-DE" lang="json">
{}
</locale>

<locale locale="en-US" lang="json">
{}
</locale>

<locale locale="es-ES" lang="json">
{}
</locale>

<locale locale="fr-FR" lang="json">
{}
</locale>

<locale locale="id-ID" lang="json">
{}
</locale>

<locale locale="it-IT" lang="json">
{}
</locale>

<locale locale="ja-JP" lang="json">
{}
</locale>

<locale locale="ja-KS" lang="json">
{}
</locale>

<locale locale="kab-KAB" lang="json">
{}
</locale>

<locale locale="kn-IN" lang="json">
{}
</locale>

<locale locale="ko-KR" lang="json">
{}
</locale>

<locale locale="nl-NL" lang="json">
{}
</locale>

<locale locale="no-NO" lang="json">
{}
</locale>

<locale locale="pl-PL" lang="json">
{}
</locale>

<locale locale="pt-PT" lang="json">
{}
</locale>

<locale locale="ru-RU" lang="json">
{}
</locale>

<locale locale="sk-SK" lang="json">
{}
</locale>

<locale locale="th-TH" lang="json">
{}
</locale>

<locale locale="tr-TR" lang="json">
{}
</locale>

<locale locale="ug-CN" lang="json">
{}
</locale>

<locale locale="uk-UA" lang="json">
{}
</locale>

<locale locale="vi-VN" lang="json">
{}
</locale>

<locale locale="zh-CN" lang="json">
{}
</locale>

<locale locale="zh-TW" lang="json">
{}
</locale>
