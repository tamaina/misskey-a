<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false" data-testid="mkw-clock">
	<div
		:class="[$style.root, {
			[$style.small]: widgetProps.size === 'small',
			[$style.medium]: widgetProps.size === 'medium',
			[$style.large]: widgetProps.size === 'large',
		}]"
	>
		<div v-if="widgetProps.label === 'tz' || widgetProps.label === 'timeAndTz'" class="_monospace" :class="[$style.label, $style.a]">{{ tzAbbrev }}</div>
		<MkAnalogClock
			:class="$style.clock"
			:thickness="widgetProps.thickness"
			:offset="tzOffset"
			:graduations="widgetProps.graduations"
			:fadeGraduations="widgetProps.fadeGraduations"
			:twentyfour="widgetProps.twentyFour"
			:sAnimation="widgetProps.sAnimation"
		/>
		<MkDigitalClock v-if="widgetProps.label === 'time' || widgetProps.label === 'timeAndTz'" :class="[$style.label, $style.c]" class="_monospace" :showS="false" :offset="tzOffset"/>
		<div v-if="widgetProps.label === 'tz' || widgetProps.label === 'timeAndTz'" class="_monospace" :class="[$style.label, $style.d]">{{ tzOffsetLabel }}</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkAnalogClock from '@features/ui/frontend/components/MkAnalogClock.vue';
import MkDigitalClock from '@features/ui/frontend/components/MkDigitalClock.vue';
import { timezones } from '@features/ui/frontend/utility/timezones.js';

const name = 'clock';

const widgetPropsDef = {
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.transparent,
		default: false,
	},
	size: {
		type: 'radio',
		label: $locale.value.sfc.size,
		default: 'medium',
		options: [{
			value: 'small' as const,
			label: $locale.value.sfc.small,
		}, {
			value: 'medium' as const,
			label: $locale.value.sfc.medium,
		}, {
			value: 'large' as const,
			label: $locale.value.sfc.large,
		}],
	},
	thickness: {
		type: 'radio',
		label: $locale.value.sfc.thickness,
		default: 0.2,
		options: [{
			value: 0.1 as const,
			label: $locale.value.sfc.thicknessThin,
		}, {
			value: 0.2 as const,
			label: $locale.value.sfc.thicknessMedium,
		}, {
			value: 0.3 as const,
			label: $locale.value.sfc.thicknessThick,
		}],
	},
	graduations: {
		type: 'radio',
		label: $locale.value.sfc.graduations,
		default: 'numbers',
		options: [{
			value: 'none' as const,
			label: $locale.value.sfc.none,
		}, {
			value: 'dots' as const,
			label: $locale.value.sfc.graduationDots,
		}, {
			value: 'numbers' as const,
			label: $locale.value.sfc.graduationArabic,
		}, /*, {
			value: 'roman' as const,
			label: i18n.ts._widgetOptions._clock.graduationRoman,
		}*/],
	},
	fadeGraduations: {
		type: 'boolean',
		label: $locale.value.sfc.fadeGraduations,
		default: true,
	},
	sAnimation: {
		type: 'radio',
		label: $locale.value.sfc.sAnimation,
		default: 'elastic',
		options: [{
			value: 'none' as const,
			label: $locale.value.sfc.none,
		}, {
			value: 'elastic' as const,
			label: $locale.value.sfc.sAnimationElastic,
		}, {
			value: 'easeOut' as const,
			label: $locale.value.sfc.sAnimationEaseOut,
		}],
	},
	twentyFour: {
		type: 'boolean',
		label: $locale.value.sfc.twentyFour,
		default: false,
	},
	label: {
		type: 'radio',
		label: $locale.value.sfc.label,
		default: 'none',
		options: [{
			value: 'none' as const,
			label: $locale.value.sfc.none,
		}, {
			value: 'time' as const,
			label: $locale.value.sfc.labelTime,
		}, {
			value: 'tz' as const,
			label: $locale.value.sfc.labelTz,
		}, {
			value: 'timeAndTz' as const,
			label: $locale.value.sfc.labelTimeAndTz,
		}],
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
	position: relative;

	&.small {
		padding: 12px;

		> .clock {
			height: 100px;
		}
	}

	&.medium {
		padding: 14px;

		> .clock {
			height: 150px;
		}
	}

	&.large {
		padding: 16px;

		> .clock {
			height: 200px;
		}
	}
}

.label {
	position: absolute;
	opacity: 0.7;

	&.a {
		top: 14px;
		left: 14px;
	}

	&.b {
		top: 14px;
		right: 14px;
	}

	&.c {
		bottom: 14px;
		left: 14px;
	}

	&.d {
		bottom: 14px;
		right: 14px;
	}
}

.clock {
	margin: auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"transparent": "Make background transparent",
	"size": "الحجم",
	"small": "صغير",
	"medium": "متوسط",
	"large": "كبير",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "لا شيء",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "التسمية",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "تلقائي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"transparent": "Fons transparent",
	"size": "Mida",
	"small": "Petit",
	"medium": "Mitjà",
	"large": "Gran",
	"thickness": "Amplada de l'agulla ",
	"thicknessThin": "Esvelt ",
	"thicknessMedium": "Normal",
	"thicknessThick": "Gruixut ",
	"graduations": "Marques de l'esfera ",
	"none": "Res",
	"graduationDots": "Punt",
	"graduationArabic": "Nombres àrabs ",
	"fadeGraduations": "Efecte gradient ",
	"sAnimation": "Animació de la maneta dels segons",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Suau",
	"twentyFour": "Format 24 hores",
	"label": "Etiqueta",
	"labelTime": "Temps",
	"labelTz": "Fus horari",
	"labelTimeAndTz": "Hora i fus horari",
	"timezone": "Fus horari",
	"auto": "Automàtic "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Velikost",
	"small": "Malé",
	"medium": "Střední",
	"large": "Velké",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Žádný",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Popisek",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Size",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "None",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Label",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"transparent": "Hintergrund transparent machen",
	"size": "Größe",
	"small": "Klein",
	"medium": "Mittel",
	"large": "Groß",
	"thickness": "Dicke",
	"thicknessThin": "Dünn",
	"thicknessMedium": "Normal",
	"thicknessThick": "Dick",
	"graduations": "Zifferblattskala",
	"none": "Nichts",
	"graduationDots": "Punkt",
	"graduationArabic": "Zahlen",
	"fadeGraduations": "Skala ausblenden",
	"sAnimation": "Zweite Animation",
	"sAnimationElastic": "Elastisch",
	"sAnimationEaseOut": "Weich",
	"twentyFour": "24-Stunden-Format",
	"label": "Beschriftung",
	"labelTime": "Uhrzeit",
	"labelTz": "Zeitzone",
	"labelTimeAndTz": "Zeit und Zeitzone",
	"timezone": "Zeitzone",
	"auto": "Automatisch"
}
</locale>

<locale locale="en-US" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Size",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "None",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Label",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"transparent": "Hacer fondo transparente",
	"size": "Tamaño",
	"small": "Pequeño",
	"medium": "Mediano",
	"large": "Grande",
	"thickness": "Grosor de la aguja",
	"thicknessThin": "Delgada",
	"thicknessMedium": "Normal",
	"thicknessThick": "Gruesa",
	"graduations": "Marcas del dial",
	"none": "Ninguna",
	"graduationDots": "Puntos",
	"graduationArabic": "Números decimales",
	"fadeGraduations": "Desvanecer la escala",
	"sAnimation": "Animación de la manecilla de los segundos",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Suave",
	"twentyFour": "Formato 24 horas",
	"label": "Etiqueta",
	"labelTime": "Hora",
	"labelTz": "Zona horaria",
	"labelTimeAndTz": "Hora y zona horaria",
	"timezone": "Zona horaria",
	"auto": "Automático"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Taille",
	"small": "Petit",
	"medium": "Moyen",
	"large": "Grand",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Rien",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Étiquette",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Automatique"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Ukuran",
	"small": "Kecil",
	"medium": "Sedang",
	"large": "Besar",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Tidak ada",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Label",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Otomatis"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"transparent": "Sfondo trasparente",
	"size": "Dimensioni",
	"small": "Piccolo",
	"medium": "Medio",
	"large": "Grande",
	"thickness": "Spessore lancette",
	"thicknessThin": "Sottili",
	"thicknessMedium": "Medie",
	"thicknessThick": "Larghe",
	"graduations": "Quadrante",
	"none": "Nessuna",
	"graduationDots": "Punti",
	"graduationArabic": "Numeri",
	"fadeGraduations": "Sfumatura",
	"sAnimation": "Animazione dei secondi",
	"sAnimationElastic": "Realistica",
	"sAnimationEaseOut": "Morbida",
	"twentyFour": "Formato 24 ore",
	"label": "Etichetta",
	"labelTime": "Orario",
	"labelTz": "Fuso orario",
	"labelTimeAndTz": "Orario e fuso orario",
	"timezone": "Fuso orario",
	"auto": "Automatico"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"transparent": "背景を透明にする",
	"size": "サイズ",
	"small": "小",
	"medium": "中",
	"large": "大",
	"thickness": "針の太さ",
	"thicknessThin": "細い",
	"thicknessMedium": "普通",
	"thicknessThick": "太い",
	"graduations": "文字盤の目盛り",
	"none": "なし",
	"graduationDots": "ドット",
	"graduationArabic": "アラビア数字",
	"fadeGraduations": "目盛りをフェード",
	"sAnimation": "秒針のアニメーション",
	"sAnimationElastic": "リアル",
	"sAnimationEaseOut": "滑らか",
	"twentyFour": "24時間表示",
	"label": "ラベル",
	"labelTime": "時刻",
	"labelTz": "タイムゾーン",
	"labelTimeAndTz": "時刻とタイムゾーン",
	"timezone": "タイムゾーン",
	"auto": "自動"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"transparent": "背景を透明にする",
	"size": "大きさ",
	"small": "ちいさい",
	"medium": "ふつう",
	"large": "でかい",
	"thickness": "針の太さ",
	"thicknessThin": "細い",
	"thicknessMedium": "普通",
	"thicknessThick": "太い",
	"graduations": "文字盤の目盛り",
	"none": "なし",
	"graduationDots": "ドット",
	"graduationArabic": "アラビア数字",
	"fadeGraduations": "目盛りをフェード",
	"sAnimation": "秒針のアニメーション",
	"sAnimationElastic": "リアル",
	"sAnimationEaseOut": "滑らか",
	"twentyFour": "24時間表示",
	"label": "ラベル",
	"labelTime": "時刻",
	"labelTz": "タイムゾーン",
	"labelTimeAndTz": "時刻とタイムゾーン",
	"timezone": "タイムゾーン",
	"auto": "自動"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Size",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "None",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Label",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Size",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "None",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Label",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"transparent": "배경을 투명하게 설정",
	"size": "크기",
	"small": "작게",
	"medium": "보통",
	"large": "크게",
	"thickness": "시곗바늘의 두께",
	"thicknessThin": "얇게",
	"thicknessMedium": "보통",
	"thicknessThick": "굵게",
	"graduations": "문자반의 눈금",
	"none": "없음",
	"graduationDots": "도트",
	"graduationArabic": "아라비아 숫자",
	"fadeGraduations": "눈금 페이드",
	"sAnimation": "초침 애니메이션",
	"sAnimationElastic": "사실적으로",
	"sAnimationEaseOut": "매끄럽게",
	"twentyFour": "24시간 표시",
	"label": "라벨",
	"labelTime": "시각",
	"labelTz": "시간대",
	"labelTimeAndTz": "시각과 시간대",
	"timezone": "시간대",
	"auto": "자동"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Size",
	"small": "Klein",
	"medium": "Medium",
	"large": "Groot",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Niets",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Label",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Størrelse",
	"small": "Liten",
	"medium": "Medium",
	"large": "Stor",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Ingen",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Label",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Automatisk"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Rozmiar",
	"small": "Małe",
	"medium": "Średnie",
	"large": "Duże",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Brak",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Etykieta",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Automatycznie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Tamanho",
	"small": "Pequeno",
	"medium": "Médio",
	"large": "Grande",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Nenhum",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Etiqueta",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Automático"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Размер",
	"small": "Мелко",
	"medium": "Средне",
	"large": "Крупно",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Ничего",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Метка",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Автоматически"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Veľkosť",
	"small": "Malé",
	"medium": "Stredné",
	"large": "Veľké",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Žiadne",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Popisok",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Automaticky"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"transparent": "ทำพื้นหลังโปรงใส",
	"size": "ขนาด",
	"small": "เล็ก",
	"medium": "ปานกลาง",
	"large": "ใหญ่",
	"thickness": "ความหนาเข็ม",
	"thicknessThin": "บาง",
	"thicknessMedium": "ปานกลาง",
	"thicknessThick": "หนา",
	"graduations": "ขีดบอกค่าบนหน้าปัด",
	"none": "ไม่มี",
	"graduationDots": "จุด",
	"graduationArabic": "เลขอารบิก",
	"fadeGraduations": "เฟดหน้าปัด",
	"sAnimation": "การเคลื่อนไหวของเข็มวินาที",
	"sAnimationElastic": "สมจริง",
	"sAnimationEaseOut": "ลื่นๆ",
	"twentyFour": "ระบบ 24 ชั่วโมง",
	"label": "ป้าย",
	"labelTime": "เวลา",
	"labelTz": "เขตเวลา",
	"labelTimeAndTz": "เวลาและเขตเวลา",
	"timezone": "เขตเวลา",
	"auto": "อัตโนมัติ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"transparent": "Arka planı şeffaf yapın",
	"size": "Boyut",
	"small": "Küçük",
	"medium": "Orta",
	"large": "Büyük",
	"thickness": "İğne kalınlığı",
	"thicknessThin": "İnce",
	"thicknessMedium": "Normal",
	"thicknessThick": "Kalın",
	"graduations": "Kadran ölçeği",
	"none": "Hiçbiri",
	"graduationDots": "Nokta",
	"graduationArabic": "Arap rakamları",
	"fadeGraduations": "ölçeği soluklaştır",
	"sAnimation": "İkinci el animasyon",
	"sAnimationElastic": "Gerçek",
	"sAnimationEaseOut": "Düz",
	"twentyFour": "24 saat ekran",
	"label": "Etiket",
	"labelTime": "Zaman",
	"labelTz": "Zaman Dilimi",
	"labelTimeAndTz": "Zaman ve Saat Dilimi",
	"timezone": "Zaman Dilimi ",
	"auto": "Otomatik"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Size",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "None",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Label",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Auto"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Розмір",
	"small": "Маленький",
	"medium": "Середній",
	"large": "Крупний",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Відсутній",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Назва",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Автоматично"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"transparent": "Make background transparent",
	"size": "Kích thước",
	"small": "Nhỏ",
	"medium": "Vừa",
	"large": "Lớn",
	"thickness": "Needle thickness",
	"thicknessThin": "Thin",
	"thicknessMedium": "Normal",
	"thicknessThick": "Thick",
	"graduations": "Dial markings",
	"none": "Không",
	"graduationDots": "Dot",
	"graduationArabic": "Arabic numbers",
	"fadeGraduations": "Fade the scale",
	"sAnimation": "Second hand animation",
	"sAnimationElastic": "Real",
	"sAnimationEaseOut": "Smooth",
	"twentyFour": "24 Hour Format",
	"label": "Nhãn",
	"labelTime": "Time",
	"labelTz": "Timezone",
	"labelTimeAndTz": "Time and time zone",
	"timezone": "Timezone",
	"auto": "Tự động"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"transparent": "使背景透明",
	"size": "大小",
	"small": "小",
	"medium": "中",
	"large": "大",
	"thickness": "指针宽度",
	"thicknessThin": "细",
	"thicknessMedium": "普通",
	"thicknessThick": "粗",
	"graduations": "表盘刻度",
	"none": "无",
	"graduationDots": "点",
	"graduationArabic": "阿拉伯数字",
	"fadeGraduations": "淡化表盘",
	"sAnimation": "秒针动效",
	"sAnimationElastic": "跳动",
	"sAnimationEaseOut": "平滑",
	"twentyFour": "24 小时制",
	"label": "标签",
	"labelTime": "时间",
	"labelTz": "时区",
	"labelTimeAndTz": "时间和时区",
	"timezone": "时区",
	"auto": "自动"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"transparent": "使背景透明",
	"size": "尺寸",
	"small": "小",
	"medium": "中",
	"large": "大",
	"thickness": "指針粗細",
	"thicknessThin": "細",
	"thicknessMedium": "普通",
	"thicknessThick": "粗",
	"graduations": "刻度盤",
	"none": "無",
	"graduationDots": "圓點",
	"graduationArabic": "阿拉伯數字",
	"fadeGraduations": "刻度淡出",
	"sAnimation": "秒針的動畫效果",
	"sAnimationElastic": "真實的",
	"sAnimationEaseOut": "滑順",
	"twentyFour": "24 小時制",
	"label": "標籤",
	"labelTime": "時間",
	"labelTz": "時區",
	"labelTimeAndTz": "時間與時區",
	"timezone": "時區",
	"auto": "自動"
}
</locale>
