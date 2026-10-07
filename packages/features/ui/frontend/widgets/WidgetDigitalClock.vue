<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-testid="mkw-digitalClock" class="_monospace" :class="[$style.root, { _panel: !widgetProps.transparent }]" :style="{ fontSize: `${widgetProps.fontSize}em` }">
	<div v-if="widgetProps.showLabel" :class="$style.label">{{ tzAbbrev }}</div>
	<div>
		<MkDigitalClock :showMs="widgetProps.showMs" :offset="tzOffset"/>
	</div>
	<div v-if="widgetProps.showLabel" :class="$style.label">{{ tzOffsetLabel }}</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import { timezones } from '@features/ui/frontend/utility/timezones.js';
import MkDigitalClock from '@features/ui/frontend/components/MkDigitalClock.vue';

const name = 'digitalClock';

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
	timezone: {
		type: 'enum',
		label: $locale.value.sfc.timezone,
		default: null,
		enum: [...timezones.map((tz) => ({
			label: tz.name,
			value: tz.name.toLowerCase(),
		})), {
			label: $locale.value.sfc.auto,
			value: null,
		}],
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

const tzAbbrev = computed(() => (widgetProps.timezone === null
	? timezones.find((tz) => tz.name.toLowerCase() === Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase())?.abbrev
	: timezones.find((tz) => tz.name.toLowerCase() === widgetProps.timezone)?.abbrev) ?? '?');

const tzOffset = computed(() => widgetProps.timezone === null
	? 0 - new Date().getTimezoneOffset()
	: timezones.find((tz) => tz.name.toLowerCase() === widgetProps.timezone)?.offset ?? 0);

const tzOffsetLabel = computed(() => (tzOffset.value >= 0 ? '+' : '-') + Math.floor(tzOffset.value / 60).toString().padStart(2, '0') + ':' + (tzOffset.value % 60).toString().padStart(2, '0'));

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 16px 0;
	text-align: center;
}

.label {
	font-size: 65%;
	opacity: 0.7;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "حجم الخط",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "تلقائي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"transparent": "Fons transparent",
	"fontSize": "Mida del text",
	"showMs": "Mostrar mil·lisegons",
	"showLabel": "Mostrar etiqueta",
	"timezone": "Fus horari",
	"auto": "Automàtic "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Velikost písma",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"transparent": "Hintergrund transparent machen",
	"fontSize": "Schriftgröße",
	"showMs": "Millisekunden anzeigen",
	"showLabel": "Beschriftung anzeigen",
	"timezone": "Zeitzone",
	"auto": "Automatisch"
}
</locale>

<locale locale="en-US" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"transparent": "Hacer fondo transparente",
	"fontSize": "Tamaño de la letra",
	"showMs": "Mostrar milisegundos",
	"showLabel": "Mostrar etiqueta",
	"timezone": "Zona horaria",
	"auto": "Automático"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Taille de la police",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Automatique"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Ukuran huruf",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Otomatis"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"transparent": "Sfondo trasparente",
	"fontSize": "Dimensione carattere",
	"showMs": "Millisecondi visibili",
	"showLabel": "Etichetta visibile",
	"timezone": "Fuso orario",
	"auto": "Automatico"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"transparent": "背景を透明にする",
	"fontSize": "フォントサイズ",
	"showMs": "ミリ秒を表示",
	"showLabel": "ラベルを表示",
	"timezone": "タイムゾーン",
	"auto": "自動"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"transparent": "背景を透明にする",
	"fontSize": "字の大きさ",
	"showMs": "ミリ秒を表示",
	"showLabel": "ラベルを表示",
	"timezone": "タイムゾーン",
	"auto": "自動"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"transparent": "배경을 투명하게 설정",
	"fontSize": "글자 크기",
	"showMs": "밀리초 표시",
	"showLabel": "레이블 표시",
	"timezone": "시간대",
	"auto": "자동"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Lettergrootte",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Automatisk"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Rozmiar czcionki",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Automatycznie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Tamanho do texto",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Automático"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Размер шрифта",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Автоматически"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Veľkosť písma",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Automaticky"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"transparent": "ทำพื้นหลังโปรงใส",
	"fontSize": "ขนาดตัวอักษร",
	"showMs": "แสดงมิลลิวินาที",
	"showLabel": "แสดงป้าย",
	"timezone": "เขตเวลา",
	"auto": "อัตโนมัติ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"transparent": "Arka planı şeffaf yapın",
	"fontSize": "Yazı tipi boyutu",
	"showMs": "Milisaniye cinsinden göster",
	"showLabel": "Etiketi Göster",
	"timezone": "Zaman Dilimi ",
	"auto": "Otomatik"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Font size",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Розмір шрифту",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Автоматично"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"transparent": "Make background transparent",
	"fontSize": "Cỡ chữ",
	"showMs": "Show Miliseconds",
	"showLabel": "Show Label",
	"timezone": "Timezone",
	"auto": "Tự động"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"transparent": "使背景透明",
	"fontSize": "字体大小",
	"showMs": "显示毫秒",
	"showLabel": "显示标签",
	"timezone": "时区",
	"auto": "自动"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"transparent": "使背景透明",
	"fontSize": "字體大小",
	"showMs": "顯示毫秒",
	"showLabel": "顯示標記",
	"timezone": "時區",
	"auto": "自動"
}
</locale>
