<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { _panel: !widgetProps.transparent }]" data-testid="mkw-calendar">
	<div :class="[$style.calendar, { [$style.isHoliday]: isHoliday }]">
		<p :class="$style.monthAndYear">
			<span :class="$style.year">{{ interpolateLocaleParameters($locale.sfc.yearX, { year }) }}</span>
			<span :class="$style.month">{{ interpolateLocaleParameters($locale.sfc.monthX, { month }) }}</span>
		</p>
		<p v-if="month === 1 && day === 1" class="day">🎉{{ interpolateLocaleParameters($locale.sfc.dayX, { day }) }}<span style="display: inline-block; transform: scaleX(-1);">🎉</span></p>
		<p v-else :class="$style.day">{{ interpolateLocaleParameters($locale.sfc.dayX, { day }) }}</p>
		<p :class="$style.weekDay">{{ weekDay }}</p>
	</div>
	<div :class="$style.info">
		<div :class="$style.infoSection">
			<p :class="$style.infoText">{{ $locale.sfc.today }}<b :class="$style.percentage">{{ dayP.toFixed(1) }}%</b></p>
			<div :class="$style.meter">
				<div :class="$style.meterVal" :style="{ width: `${dayP}%` }"></div>
			</div>
		</div>
		<div :class="$style.infoSection">
			<p :class="$style.infoText">{{ $locale.sfc.thisMonth }}<b :class="$style.percentage">{{ monthP.toFixed(1) }}%</b></p>
			<div :class="$style.meter">
				<div :class="$style.meterVal" :style="{ width: `${monthP}%` }"></div>
			</div>
		</div>
		<div :class="$style.infoSection">
			<p :class="$style.infoText">{{ $locale.sfc.thisYear }}<b :class="$style.percentage">{{ yearP.toFixed(1) }}%</b></p>
			<div :class="$style.meter">
				<div :class="$style.meterVal" :style="{ width: `${yearP}%` }"></div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { useLowresTime, TIME_UPDATE_INTERVAL } from '@features/ui/frontend/shared/use-lowres-time.js';

const name = 'calendar';

const widgetPropsDef = {
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.widgetOptionsTransparent,
		default: false,
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

const fNow = useLowresTime();
const year = ref(0);
const month = ref(0);
const day = ref(0);
const weekDay = ref('');
const yearP = ref(0);
const monthP = ref(0);
const dayP = ref(0);
const isHoliday = ref(false);

const nextDay = new Date();
nextDay.setHours(24, 0, 0, 0);
let nextDayMidnightTime = nextDay.getTime();
let nextDayTimer: number | null = null;

function update(time: number) {
	const now = new Date(time);
	const nd = now.getDate();
	const nm = now.getMonth();
	const ny = now.getFullYear();

	year.value = ny;
	month.value = nm + 1;
	day.value = nd;
	weekDay.value = [
		$locale.value.sfc.weekdaySunday,
		$locale.value.sfc.weekdayMonday,
		$locale.value.sfc.weekdayTuesday,
		$locale.value.sfc.weekdayWednesday,
		$locale.value.sfc.weekdayThursday,
		$locale.value.sfc.weekdayFriday,
		$locale.value.sfc.weekdaySaturday,
	][now.getDay()];

	const dayNumer = now.getTime() - new Date(ny, nm, nd).getTime();
	const dayDenom = 1000/*ms*/ * 60/*s*/ * 60/*m*/ * 24/*h*/;
	const monthNumer = now.getTime() - new Date(ny, nm, 1).getTime();
	const monthDenom = new Date(ny, nm + 1, 1).getTime() - new Date(ny, nm, 1).getTime();
	const yearNumer = now.getTime() - new Date(ny, 0, 1).getTime();
	const yearDenom = new Date(ny + 1, 0, 1).getTime() - new Date(ny, 0, 1).getTime();

	dayP.value = dayNumer / dayDenom * 100;
	monthP.value = monthNumer / monthDenom * 100;
	yearP.value = yearNumer / yearDenom * 100;

	isHoliday.value = now.getDay() === 0 || now.getDay() === 6;
}

watch(fNow, (to) => {
	update(to);

	// 次回更新までに日付が変わる場合、日付が変わった直後に強制的に更新するタイマーをセットする
	if (nextDayMidnightTime - to <= TIME_UPDATE_INTERVAL) {
		if (nextDayTimer != null) {
			window.clearTimeout(nextDayTimer);
			nextDayTimer = null;
		}

		nextDayTimer = window.setTimeout(() => {
			update(nextDayMidnightTime);
			nextDayTimer = null;
		}, nextDayMidnightTime - to);
	}
}, { immediate: true });

watch(day, () => {
	nextDay.setHours(24, 0, 0, 0);
	nextDayMidnightTime = nextDay.getTime();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 16px 0;

	&::after {
		content: "";
		display: block;
		clear: both;
	}
}

.calendar {
	float: left;
	width: 60%;
	text-align: center;

	&.isHoliday {
		> .day {
			color: #ef95a0;
		}
	}
}

.monthAndYear,
.weekDay {
	margin: 0;
	line-height: 18px;
	font-size: 0.9em;
}

.year,
.month {
	margin: 0 4px;
}

.day {
	margin: 10px 0;
	line-height: 32px;
	font-size: 1.75em;
}

.info {
	display: block;
	float: left;
	width: 40%;
	padding: 0 16px 0 0;
	box-sizing: border-box;
}

.infoSection {
	margin-bottom: 8px;

	&:last-child {
		margin-bottom: 4px;
	}

	&:nth-child(1) {
		> .meter > .meterVal {
			background: #f7796c;
		}
	}

	&:nth-child(2) {
		> .meter > .meterVal {
			background: #a1de41;
		}
	}

	&:nth-child(3) {
		> .meter > .meterVal {
			background: #41ddde;
		}
	}
}

.infoText {
	display: flex;
	margin: 0 0 2px 0;
	font-size: 0.75em;
	line-height: 18px;
	opacity: 0.8;
}

.percentage {
	margin-left: auto;
}

.meter {
	width: 100%;
	overflow: hidden;
	background: light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3));
	border-radius: 8px;
}

.meterVal {
	height: 4px;
	transition: width .3s cubic-bezier(0.23, 1, 0.32, 1);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "اليوم",
	"thisMonth": "هذا الشهر",
	"thisYear": "هذا العام",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "الأحد",
	"weekdayMonday": "الإثنين",
	"weekdayTuesday": "الثلاثاء",
	"weekdayWednesday": "الأربعاء",
	"weekdayThursday": "الخميس",
	"weekdayFriday": "الجمعة",
	"weekdaySaturday": "السبت"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Avui",
	"thisMonth": "Aquest mes",
	"thisYear": "Enguany",
	"widgetOptionsTransparent": "Fons transparent",
	"weekdaySunday": "Diumenge",
	"weekdayMonday": "Dilluns",
	"weekdayTuesday": "Dimarts",
	"weekdayWednesday": "Dimecres",
	"weekdayThursday": "Dijous",
	"weekdayFriday": "Divendres",
	"weekdaySaturday": "Dissabte"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Dnes",
	"thisMonth": "Tento měsíc",
	"thisYear": "Tento rok",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Neděle",
	"weekdayMonday": "Pondělí",
	"weekdayTuesday": "Úterý",
	"weekdayWednesday": "Středa",
	"weekdayThursday": "Čtvrtek",
	"weekdayFriday": "Pátek",
	"weekdaySaturday": "Sobota"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Today",
	"thisMonth": "Month",
	"thisYear": "Year",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Heute",
	"thisMonth": "Monat",
	"thisYear": "Jahr",
	"widgetOptionsTransparent": "Hintergrund transparent machen",
	"weekdaySunday": "Sonntag",
	"weekdayMonday": "Montag",
	"weekdayTuesday": "Dienstag",
	"weekdayWednesday": "Mittwoch",
	"weekdayThursday": "Donnerstag",
	"weekdayFriday": "Freitag",
	"weekdaySaturday": "Samstag"
}
</locale>

<locale lang="json" locale="en-US">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Today",
	"thisMonth": "Month",
	"thisYear": "Year",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"yearX": "Año {year}",
	"monthX": "Mes {month}",
	"dayX": "Día {day}",
	"today": "Hoy",
	"thisMonth": "Este mes",
	"thisYear": "Este año",
	"widgetOptionsTransparent": "Hacer fondo transparente",
	"weekdaySunday": "Domingo",
	"weekdayMonday": "Lunes",
	"weekdayTuesday": "Martes",
	"weekdayWednesday": "Miércoles",
	"weekdayThursday": "Jueves",
	"weekdayFriday": "Viernes",
	"weekdaySaturday": "Sábado"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Aujourd’hui",
	"thisMonth": "Ce mois-ci",
	"thisYear": "Cette année",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Dimanche",
	"weekdayMonday": "Lundi",
	"weekdayTuesday": "Mardi",
	"weekdayWednesday": "Mercredi",
	"weekdayThursday": "Jeudi",
	"weekdayFriday": "Vendredi",
	"weekdaySaturday": "Samedi"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Hari ini",
	"thisMonth": "Bulan ini",
	"thisYear": "Tahun ini",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Minggu",
	"weekdayMonday": "Senin",
	"weekdayTuesday": "Selasa",
	"weekdayWednesday": "Rabu",
	"weekdayThursday": "Kamis",
	"weekdayFriday": "Jumat",
	"weekdaySaturday": "Sabtu"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Oggi",
	"thisMonth": "Mese",
	"thisYear": "Anno",
	"widgetOptionsTransparent": "Sfondo trasparente",
	"weekdaySunday": "Domenica",
	"weekdayMonday": "Lunedì",
	"weekdayTuesday": "Martedì",
	"weekdayWednesday": "Mercoledì",
	"weekdayThursday": "Giovedì",
	"weekdayFriday": "Venerdì",
	"weekdaySaturday": "Sabato"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"yearX": "{year}年",
	"monthX": "{month}月",
	"dayX": "{day}日",
	"today": "今日",
	"thisMonth": "今月",
	"thisYear": "今年",
	"widgetOptionsTransparent": "背景を透明にする",
	"weekdaySunday": "日曜日",
	"weekdayMonday": "月曜日",
	"weekdayTuesday": "火曜日",
	"weekdayWednesday": "水曜日",
	"weekdayThursday": "木曜日",
	"weekdayFriday": "金曜日",
	"weekdaySaturday": "土曜日"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"yearX": "{year}年",
	"monthX": "{month}月",
	"dayX": "{day}日",
	"today": "今日",
	"thisMonth": "今月",
	"thisYear": "今年",
	"widgetOptionsTransparent": "背景を透明にする",
	"weekdaySunday": "日曜日",
	"weekdayMonday": "月曜日",
	"weekdayTuesday": "火曜日",
	"weekdayWednesday": "水曜日",
	"weekdayThursday": "木曜日",
	"weekdayFriday": "金曜日",
	"weekdaySaturday": "土曜日"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Today",
	"thisMonth": "Month",
	"thisYear": "Year",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Today",
	"thisMonth": "Month",
	"thisYear": "Year",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"yearX": "{year}년",
	"monthX": "{month}월",
	"dayX": "{day}일",
	"today": "오늘",
	"thisMonth": "이달",
	"thisYear": "올해",
	"widgetOptionsTransparent": "배경을 투명하게 설정",
	"weekdaySunday": "일요일",
	"weekdayMonday": "월요일",
	"weekdayTuesday": "화요일",
	"weekdayWednesday": "수요일",
	"weekdayThursday": "목요일",
	"weekdayFriday": "금요일",
	"weekdaySaturday": "토요일"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Vandaag",
	"thisMonth": "Maand",
	"thisYear": "Jaar",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "I dag",
	"thisMonth": "Måned",
	"thisYear": "År",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Søndag",
	"weekdayMonday": "Mandag",
	"weekdayTuesday": "Tirsdag",
	"weekdayWednesday": "Onsdag",
	"weekdayThursday": "Torsdag",
	"weekdayFriday": "Fredag",
	"weekdaySaturday": "Lørdag"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Dziś",
	"thisMonth": "Miesiąc",
	"thisYear": "Rok",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Niedziela",
	"weekdayMonday": "Poniedziałek",
	"weekdayTuesday": "Wtorek",
	"weekdayWednesday": "Środa",
	"weekdayThursday": "Czwartek",
	"weekdayFriday": "Piątek",
	"weekdaySaturday": "Sobota"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"yearX": "Ano {year}",
	"monthX": "mês de {month}",
	"dayX": " Dia {day}",
	"today": "Hoje",
	"thisMonth": "Este mês",
	"thisYear": "Este ano",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Domingo",
	"weekdayMonday": "Segunda-feira",
	"weekdayTuesday": "Terça-feira",
	"weekdayWednesday": "Quarta-feira",
	"weekdayThursday": "Quinta-feira",
	"weekdayFriday": "Sexta-feira",
	"weekdaySaturday": "Sábado"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"yearX": "{year} год",
	"monthX": "{month} месяц",
	"dayX": "{day} день",
	"today": "Этот день",
	"thisMonth": "Этот месяц",
	"thisYear": "Этот год",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Воскресенье",
	"weekdayMonday": "Понедельник",
	"weekdayTuesday": "Вторник",
	"weekdayWednesday": "Среда",
	"weekdayThursday": "Четверг",
	"weekdayFriday": "Пятница",
	"weekdaySaturday": "Суббота"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Dnes",
	"thisMonth": "Mesiac",
	"thisYear": "Rok",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Nedeľa",
	"weekdayMonday": "Pondelok",
	"weekdayTuesday": "Utorok",
	"weekdayWednesday": "Streda",
	"weekdayThursday": "Štvrtok",
	"weekdayFriday": "Piatok",
	"weekdaySaturday": "Sobota"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"yearX": "{year}",
	"monthX": "เดือน {month}",
	"dayX": "{day}",
	"today": "วันนี้",
	"thisMonth": "เดือนนี้",
	"thisYear": "ปีนี้",
	"widgetOptionsTransparent": "ทำพื้นหลังโปรงใส",
	"weekdaySunday": "วันอาทิตย์",
	"weekdayMonday": "วันจันทร์",
	"weekdayTuesday": "วันอังคาร",
	"weekdayWednesday": "วันพุธ",
	"weekdayThursday": "วันพฤหัสบดี",
	"weekdayFriday": "วันศุกร์",
	"weekdaySaturday": "วันเสาร์"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Bugün",
	"thisMonth": "Ay",
	"thisYear": "Yıl",
	"widgetOptionsTransparent": "Arka planı şeffaf yapın",
	"weekdaySunday": "Pazar",
	"weekdayMonday": "Pazartesi",
	"weekdayTuesday": "Salı",
	"weekdayWednesday": "Çarşamba",
	"weekdayThursday": "Perşembe",
	"weekdayFriday": "Cuma",
	"weekdaySaturday": "Cumartesi"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Today",
	"thisMonth": "Month",
	"thisYear": "Year",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "День",
	"thisMonth": "Місяць",
	"thisYear": "Рік",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Неділя",
	"weekdayMonday": "Понеділок",
	"weekdayTuesday": "Вівторок",
	"weekdayWednesday": "Середа",
	"weekdayThursday": "Четвер",
	"weekdayFriday": "П'ятниця",
	"weekdaySaturday": "Субота"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"yearX": "{year}",
	"monthX": "{month}",
	"dayX": "{day}",
	"today": "Hôm nay",
	"thisMonth": "Tháng",
	"thisYear": "Năm",
	"widgetOptionsTransparent": "Make background transparent",
	"weekdaySunday": "Chủ Nhật",
	"weekdayMonday": "Thứ Hai",
	"weekdayTuesday": "Thứ Ba",
	"weekdayWednesday": "Thứ Tư",
	"weekdayThursday": "Thứ Năm",
	"weekdayFriday": "Thứ Sáu",
	"weekdaySaturday": "Thứ Bảy"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"yearX": "{year}年",
	"monthX": "{month}月",
	"dayX": "{day}日",
	"today": "今天",
	"thisMonth": "本月",
	"thisYear": "今年",
	"widgetOptionsTransparent": "使背景透明",
	"weekdaySunday": "星期日",
	"weekdayMonday": "星期一",
	"weekdayTuesday": "星期二",
	"weekdayWednesday": "星期三",
	"weekdayThursday": "星期四",
	"weekdayFriday": "星期五",
	"weekdaySaturday": "星期六"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"yearX": "{year} 年",
	"monthX": "{month} 月",
	"dayX": "{day} 日",
	"today": "本日",
	"thisMonth": "本月",
	"thisYear": "本年",
	"widgetOptionsTransparent": "使背景透明",
	"weekdaySunday": "星期天",
	"weekdayMonday": "星期一",
	"weekdayTuesday": "星期二",
	"weekdayWednesday": "星期三",
	"weekdayThursday": "星期四",
	"weekdayFriday": "星期五",
	"weekdaySaturday": "星期六"
}
</locale>
