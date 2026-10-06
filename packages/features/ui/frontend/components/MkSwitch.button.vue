<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span
	v-tooltip="checked ? $locale.sfc.itsOn : $locale.sfc.itsOff"
	:class="{
		[$style.button]: true,
		[$style.buttonChecked]: checked,
		[$style.buttonDisabled]: props.disabled
	}"
	data-testid="switch-toggle"
	@click.prevent.stop="toggle"
>
	<div :class="{ [$style.knob]: true, [$style.knobChecked]: checked }"></div>
</span>
</template>

<script lang="ts" setup>
import { toRefs } from 'vue';
import type { Ref } from 'vue';

const props = withDefaults(defineProps<{
	checked: boolean | Ref<boolean>;
	disabled?: boolean | Ref<boolean>;
}>(), {
	disabled: false,
});

const emit = defineEmits<{
	(ev: 'toggle'): void;
}>();

const checked = toRefs(props).checked;
const toggle = () => {
	emit('toggle');
};
</script>

<style lang="scss" module>
.button {
	--height: 21px;

	position: relative;
	display: inline-flex;
	flex-shrink: 0;
	margin: 0;
	box-sizing: border-box;
	width: calc(var(--height) * 1.6);
	height: calc(var(--height) + 2px); // 枠線
	outline: none;
	background: var(--MI_THEME-switchOffBg);
	background-clip: content-box;
	border: solid 1px var(--MI_THEME-switchOffBg);
	border-radius: 999px;
	cursor: pointer;
	transition: inherit;
	user-select: none;
}

.buttonChecked {
	background-color: var(--MI_THEME-switchOnBg) !important;
	border-color: var(--MI_THEME-switchOnBg) !important;
}

.buttonDisabled {
	cursor: not-allowed;
}

.knob {
	position: absolute;
	box-sizing: border-box;
	top: 3px;
	width: calc(var(--height) - 6px);
	height: calc(var(--height) - 6px);
	border-radius: 999px;
	transition: all 0.2s ease;

	&:not(.knobChecked) {
		left: 3px;
		background: var(--MI_THEME-switchOffFg);
	}
}

.knobChecked {
	left: calc(calc(100% - var(--height)) + 3px);
	background: var(--MI_THEME-switchOnFg);
}
</style>

<locale locale="ar-SA" lang="json">
{
  "itsOn": "مفعّل",
  "itsOff": "معطّل"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "itsOn": "Activat",
  "itsOff": "Desactivat"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "itsOn": "Zapnuto",
  "itsOff": "Vypnuto"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "itsOn": "Enabled",
  "itsOff": "Disabled"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "itsOn": "Eingeschaltet",
  "itsOff": "Ausgeschaltet"
}
</locale>

<locale locale="en-US" lang="json">
{
  "itsOn": "Enabled",
  "itsOff": "Disabled"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "itsOn": "¡Está encendido!",
  "itsOff": "¡Está apagado!"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "itsOn": "Activé",
  "itsOff": "Désactivé"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "itsOn": "Aktif",
  "itsOff": "Nonaktif"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "itsOn": "Abilitato",
  "itsOff": "Disabilitato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "itsOn": "オンになっています",
  "itsOff": "オフになっています"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "itsOn": "オンになっとるよ",
  "itsOff": "オフになってるで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "itsOn": "Enabled",
  "itsOff": "Disabled"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "itsOn": "Enabled",
  "itsOff": "Disabled"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "itsOn": "켜져 있습니다",
  "itsOff": "꺼져 있습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "itsOn": "Ingeschakeld",
  "itsOff": "Uitgeschakeld"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "itsOn": "Enabled",
  "itsOff": "Disabled"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "itsOn": "Włączone",
  "itsOff": "Wyłączone"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "itsOn": "Ativado",
  "itsOff": "Desativado"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "itsOn": "Включено",
  "itsOff": "Выключено"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "itsOn": "Zapnuté",
  "itsOff": "Vypnuté"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "itsOn": "เปิดใช้งาน",
  "itsOff": "ปิดใช้งาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "itsOn": "Etkin",
  "itsOff": "Devre Dışı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "itsOn": "Enabled",
  "itsOff": "Disabled"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "itsOn": "Увімкнено",
  "itsOff": "Вимкнено"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "itsOn": "Đã bật",
  "itsOff": "Đã tắt"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "itsOn": "已开启",
  "itsOff": "已关闭"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "itsOn": "已開啟",
  "itsOff": "已關閉"
}
</locale>
