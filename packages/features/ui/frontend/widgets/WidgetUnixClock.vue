<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="mkw-unixClock _monospace" :class="{ _panel: !widgetProps.transparent }" :style="{ fontSize: `${widgetProps.fontSize}em` }">
	<div v-if="widgetProps.showLabel" class="label">UNIX Epoch</div>
	<div class="time">
		<span v-text="ss"></span>
		<span v-if="widgetProps.showMs" class="colon" :class="{ showColon }">:</span>
		<span v-if="widgetProps.showMs" v-text="ms"></span>
	</div>
	<div v-if="widgetProps.showLabel" class="label">UTC</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watch } from 'vue';
import { createVisibilityAwareInterval } from '@@/js/interval.js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';

const name = 'unixClock';

const widgetPropsDef = {
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.transparent,
		default: false,
	},
	fontSize: {
		type: 'number',
		label: $locale.value.sfc.fontSize,
		default: 1.5,
		step: 0.1,
	},
	showMs: {
		type: 'boolean',
		label: $locale.value.sfc.showMs,
		default: true,
	},
	showLabel: {
		type: 'boolean',
		label: $locale.value.sfc.showLabel,
		default: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

let disposeInterval: (() => void) | null = null;
let rafRequestId: number | null = null;
const ss = ref('');
const ms = ref('');
const showColon = ref(false);
let prevSec: string | null = null;

watch(showColon, (v) => {
	if (v) {
		window.setTimeout(() => {
			showColon.value = false;
		}, 30);
	}
});

const tick = () => {
	const now = Date.now();
	ss.value = Math.floor(now / 1000).toString();
	ms.value = Math.floor(now % 1000 / 10).toString().padStart(2, '0');
	if (ss.value !== prevSec) showColon.value = true;
	prevSec = ss.value;
};

const clearTimers = () => {
	if (disposeInterval) {
		disposeInterval();
		disposeInterval = null;
	}
	if (rafRequestId) {
		window.cancelAnimationFrame(rafRequestId);
		rafRequestId = null;
	}
};

tick();

watch(() => widgetProps.showMs, (to) => {
	clearTimers();

	if (to) {
		// rafはdocumentが非表示の間はブラウザによって自動的に停止される
		rafRequestId = window.requestAnimationFrame(function loop() {
			tick();
			rafRequestId = window.requestAnimationFrame(loop);
		});
	} else {
		disposeInterval = createVisibilityAwareInterval(tick, 1000);
	}
}, { immediate: true });

onUnmounted(() => {
	clearTimers();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.mkw-unixClock {
	padding: 16px 0;
	text-align: center;

	> .label {
		font-size: 65%;
		opacity: 0.7;
	}

	> .time {
		> .colon {
			opacity: 0;
			transition: opacity 1s ease;

			&.showColon {
				opacity: 1;
				transition: opacity 0s;
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "حجم الخط",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"transparent": "Fons transparent",
	"fontSize": "Mida del text",
	"showMs": "Mostrar mil·lisegons",
	"showLabel": "Mostrar etiqueta"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Velikost písma",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"transparent": "Hintergrund transparent machen",
	"fontSize": "Schriftgröße",
	"showMs": "Millisekunden anzeigen",
	"showLabel": "Beschriftung anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"transparent": "Hacer fondo transparente",
	"fontSize": "Tamaño de la letra",
	"showMs": "Mostrar milisegundos",
	"showLabel": "Mostrar etiqueta"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Taille de la police",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Ukuran huruf",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"transparent": "Sfondo trasparente",
	"fontSize": "Dimensione carattere",
	"showMs": "Millisecondi visibili",
	"showLabel": "Etichetta visibile"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"transparent": "背景を透明にする",
	"fontSize": "フォントサイズ",
	"showMs": "ミリ秒を表示",
	"showLabel": "ラベルを表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"transparent": "背景を透明にする",
	"fontSize": "字の大きさ",
	"showMs": "ミリ秒を表示",
	"showLabel": "ラベルを表示"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"transparent": "배경을 투명하게 설정",
	"fontSize": "글자 크기",
	"showMs": "밀리초 표시",
	"showLabel": "레이블 표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Lettergrootte",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Rozmiar czcionki",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Tamanho do texto",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Размер шрифта",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Veľkosť písma",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"transparent": "ทำพื้นหลังโปรงใส",
	"fontSize": "ขนาดตัวอักษร",
	"showMs": "แสดงมิลลิวินาที",
	"showLabel": "แสดงป้าย"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"transparent": "Arka planı şeffaf yapın",
	"fontSize": "Yazı tipi boyutu",
	"showMs": "Milisaniye cinsinden göster",
	"showLabel": "Etiketi Göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Розмір шрифту",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Cỡ chữ",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"transparent": "使背景透明",
	"fontSize": "字体大小",
	"showMs": "显示毫秒",
	"showLabel": "显示标签"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"transparent": "使背景透明",
	"fontSize": "字體大小",
	"showMs": "顯示毫秒",
	"showLabel": "顯示標記"
}
</locale>
