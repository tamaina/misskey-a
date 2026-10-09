<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<time :title="absolute" :class="{ [$style.old1]: colored && (ago > 60 * 60 * 24 * 90), [$style.old2]: colored && (ago > 60 * 60 * 24 * 180) }">
	<template v-if="invalid">{{ $locale.sfc.agoInvalid }}</template>
	<template v-else-if="mode === 'relative'">{{ relative }}</template>
	<template v-else-if="mode === 'absolute'">{{ absolute }}</template>
	<template v-else-if="mode === 'detail'">{{ absolute }} ({{ relative }})</template>
</time>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { dateTimeFormat } from '@features/ui/frontend/shared/intl-const.js';
import { formatRelativeTime, parseTime } from '@features/ui/frontend/shared/relative-time.js';
import type { RelativeTimeLocale } from '@features/ui/frontend/shared/relative-time.js';
import { useLowresTime } from '@features/ui/frontend/shared/use-lowres-time.js';

const props = withDefaults(defineProps<{
	time: Date | string | number | null;
	origin?: Date | null;
	mode?: 'relative' | 'absolute' | 'detail';
	colored?: boolean;
}>(), {
	origin: null,
	mode: 'relative',
});

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const _time = parseTime(props.time);
const invalid = Number.isNaN(_time);
const absolute = !invalid ? dateTimeFormat.format(_time) : $locale.value.sfc.agoInvalid;

const actualNow = useLowresTime();
const now = computed(() => (props.origin ? props.origin.getTime() : actualNow.value));

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const ago = computed(() => (now.value - _time) / 1000/*ms*/);

const relativeTimeLocale: RelativeTimeLocale = {
	ago: {
		yearsAgo: params => interpolateLocaleParameters($locale.value.sfc.agoYearsAgo, params),
		monthsAgo: params => interpolateLocaleParameters($locale.value.sfc.agoMonthsAgo, params),
		weeksAgo: params => interpolateLocaleParameters($locale.value.sfc.agoWeeksAgo, params),
		daysAgo: params => interpolateLocaleParameters($locale.value.sfc.agoDaysAgo, params),
		hoursAgo: params => interpolateLocaleParameters($locale.value.sfc.agoHoursAgo, params),
		minutesAgo: params => interpolateLocaleParameters($locale.value.sfc.agoMinutesAgo, params),
		secondsAgo: params => interpolateLocaleParameters($locale.value.sfc.agoSecondsAgo, params),
	},
	timeIn: {
		years: params => interpolateLocaleParameters($locale.value.sfc.timeInYears, params),
		months: params => interpolateLocaleParameters($locale.value.sfc.timeInMonths, params),
		weeks: params => interpolateLocaleParameters($locale.value.sfc.timeInWeeks, params),
		days: params => interpolateLocaleParameters($locale.value.sfc.timeInDays, params),
		hours: params => interpolateLocaleParameters($locale.value.sfc.timeInHours, params),
		minutes: params => interpolateLocaleParameters($locale.value.sfc.timeInMinutes, params),
		seconds: params => interpolateLocaleParameters($locale.value.sfc.timeInSeconds, params),
	},
	get justNow() { return $locale.value.sfc.agoJustNow; },
};

const relative = computed<string>(() => {
	if (props.mode === 'absolute') return ''; // absoluteではrelativeを使わないので計算しない
	if (invalid) return $locale.value.sfc.agoInvalid;

	return formatRelativeTime(ago.value, relativeTimeLocale);
});
</script>

<style lang="scss" module>
.old1 {
	color: var(--MI_THEME-warn);
}

.old1.old2 {
	color: var(--MI_THEME-error);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"agoInvalid": "لا يوجد شيء هنا",
	"agoYearsAgo": "منذ {n} سنوات",
	"agoMonthsAgo": "منذ {n} أشهر",
	"agoWeeksAgo": "منذ {n} أسابيع",
	"agoDaysAgo": "منذ {n} أيام",
	"agoHoursAgo": "منذ {n} ساعة",
	"agoMinutesAgo": "منذ {n} دقائق",
	"agoSecondsAgo": "منذ {n} ثوانٍ",
	"agoJustNow": "اللحظة",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"agoInvalid": "Res",
	"agoYearsAgo": "Fa {n} anys",
	"agoMonthsAgo": "Fa {n} mesos",
	"agoWeeksAgo": "Fa {n} setmanes",
	"agoDaysAgo": "Fa {n} dies",
	"agoHoursAgo": "Fa {n} hores",
	"agoMinutesAgo": "Fa {n} minuts",
	"agoSecondsAgo": "Fa {n} segons",
	"agoJustNow": "Ara mateix",
	"timeInYears": "En {n} anys",
	"timeInMonths": "En {n} mesos",
	"timeInWeeks": "En {n} setmanes",
	"timeInDays": "En {n} dies",
	"timeInHours": "En {n} hores",
	"timeInMinutes": "En {n} minuts",
	"timeInSeconds": "En {n} segons"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"agoInvalid": "Nic nebylo nalezeno",
	"agoYearsAgo": "Před {n}r",
	"agoMonthsAgo": "Před {n}m",
	"agoWeeksAgo": "Před {n}t",
	"agoDaysAgo": "Před {n}d",
	"agoHoursAgo": "Před {n}h",
	"agoMinutesAgo": "Před {n}min",
	"agoSecondsAgo": "Před {n}s",
	"agoJustNow": "Teď",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"agoInvalid": "None",
	"agoYearsAgo": "{n}y ago",
	"agoMonthsAgo": "{n}mo ago",
	"agoWeeksAgo": "{n}w ago",
	"agoDaysAgo": "{n}d ago",
	"agoHoursAgo": "{n}h ago",
	"agoMinutesAgo": "{n}m ago",
	"agoSecondsAgo": "{n}s ago",
	"agoJustNow": "Just now",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"agoInvalid": "Ungültig",
	"agoYearsAgo": "vor {n} Jahr(en)",
	"agoMonthsAgo": "vor {n} Monat(en)",
	"agoWeeksAgo": "vor {n} Woche(n)",
	"agoDaysAgo": "vor {n} Tag(en)",
	"agoHoursAgo": "vor {n} Stunde(n)",
	"agoMinutesAgo": "vor {n} Minute(n)",
	"agoSecondsAgo": "vor {n} Sekunde(n)",
	"agoJustNow": "Gerade eben",
	"timeInYears": "In {n} Jahren",
	"timeInMonths": "In {n} Monaten",
	"timeInWeeks": "In {n} Wochen",
	"timeInDays": "In {n} Tagen",
	"timeInHours": "In {n} Std.",
	"timeInMinutes": "In {n} Min.",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="en-US">
{
	"agoInvalid": "None",
	"agoYearsAgo": "{n}y ago",
	"agoMonthsAgo": "{n}mo ago",
	"agoWeeksAgo": "{n}w ago",
	"agoDaysAgo": "{n}d ago",
	"agoHoursAgo": "{n}h ago",
	"agoMinutesAgo": "{n}m ago",
	"agoSecondsAgo": "{n}s ago",
	"agoJustNow": "Just now",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"agoInvalid": "No hay nada que ver aqui",
	"agoYearsAgo": "Hace {n} años",
	"agoMonthsAgo": "Hace {n} meses",
	"agoWeeksAgo": "Hace {n} semanas",
	"agoDaysAgo": "Hace {n} días",
	"agoHoursAgo": "Hace {n} horas",
	"agoMinutesAgo": "Hace {n} minutos",
	"agoSecondsAgo": "Hace {n} segundos",
	"agoJustNow": "Justo ahora",
	"timeInYears": "En {n} años",
	"timeInMonths": "En {n}M",
	"timeInWeeks": "En {n}sem.",
	"timeInDays": "En {n}d",
	"timeInHours": "En {n}h",
	"timeInMinutes": "En {n}m",
	"timeInSeconds": "En {n} segundos"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"agoInvalid": "Il n'y a rien à voir ici",
	"agoYearsAgo": "Il y a {n} ans",
	"agoMonthsAgo": "Il y a {n} mois",
	"agoWeeksAgo": "Il y a {n} semaines",
	"agoDaysAgo": "Il y a {n} jours",
	"agoHoursAgo": "Il y a {n} heures",
	"agoMinutesAgo": "Il y a {n}min",
	"agoSecondsAgo": "Il y a {n}s",
	"agoJustNow": "à l’instant",
	"timeInYears": "Dans {n}a",
	"timeInMonths": "Dans {n} mois",
	"timeInWeeks": "Dans {n} sem.",
	"timeInDays": "Dans {n}j",
	"timeInHours": "Dans {n}h",
	"timeInMinutes": "Dans {n}min",
	"timeInSeconds": "Dans {n}s"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"agoInvalid": "Tidak ada sama sekali disini",
	"agoYearsAgo": "{n} tahun lalu",
	"agoMonthsAgo": "{n} bulan lalu",
	"agoWeeksAgo": "{n} minggu lalu",
	"agoDaysAgo": "{n} hari lalu",
	"agoHoursAgo": "{n} jam lalu",
	"agoMinutesAgo": "{n} menit lalu",
	"agoSecondsAgo": "{n} detik lalu",
	"agoJustNow": "Baru saja",
	"timeInYears": "dalam {n} tahun",
	"timeInMonths": "dalam {n} bulan",
	"timeInWeeks": "dalam {n} minggu",
	"timeInDays": "dalam {n} hari",
	"timeInHours": "dalam {n} jam",
	"timeInMinutes": "dalam {n} menit",
	"timeInSeconds": "dalam {n} detik"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"agoInvalid": "Niente da visualizzare",
	"agoYearsAgo": "{n} anni fa",
	"agoMonthsAgo": "{n} mesi fa",
	"agoWeeksAgo": "{n} sett. fa",
	"agoDaysAgo": "{n} gg fa",
	"agoHoursAgo": "{n} ore fa",
	"agoMinutesAgo": "{n} min fa",
	"agoSecondsAgo": "{n} sec fa",
	"agoJustNow": "Adesso",
	"timeInYears": "Tra {n} anni",
	"timeInMonths": "Tra {n} mesi",
	"timeInWeeks": "Tra {n} settimane",
	"timeInDays": "Tra {n} giorni",
	"timeInHours": "Tra {n} ore",
	"timeInMinutes": "Tra {n} minuti",
	"timeInSeconds": "Tra {n} secondi"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"agoInvalid": "日時の解析に失敗",
	"agoYearsAgo": "{n}年前",
	"agoMonthsAgo": "{n}ヶ月前",
	"agoWeeksAgo": "{n}週間前",
	"agoDaysAgo": "{n}日前",
	"agoHoursAgo": "{n}時間前",
	"agoMinutesAgo": "{n}分前",
	"agoSecondsAgo": "{n}秒前",
	"agoJustNow": "たった今",
	"timeInYears": "{n}年後",
	"timeInMonths": "{n}ヶ月後",
	"timeInWeeks": "{n}週間後",
	"timeInDays": "{n}日後",
	"timeInHours": "{n}時間後",
	"timeInMinutes": "{n}分後",
	"timeInSeconds": "{n}秒後"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"agoInvalid": "あらへん",
	"agoYearsAgo": "{n}年前",
	"agoMonthsAgo": "{n}ヶ月前",
	"agoWeeksAgo": "{n}週間前",
	"agoDaysAgo": "{n}日前",
	"agoHoursAgo": "{n}時間前",
	"agoMinutesAgo": "{n}分前",
	"agoSecondsAgo": "{n}秒前",
	"agoJustNow": "ついさっき",
	"timeInYears": "{n}年後",
	"timeInMonths": "{n}ヶ月後",
	"timeInWeeks": "{n}週間後",
	"timeInDays": "{n}日後",
	"timeInHours": "{n}時間後",
	"timeInMinutes": "{n}分後",
	"timeInSeconds": "{n}秒後"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"agoInvalid": "None",
	"agoYearsAgo": "{n}y ago",
	"agoMonthsAgo": "{n}mo ago",
	"agoWeeksAgo": "{n}w ago",
	"agoDaysAgo": "{n}d ago",
	"agoHoursAgo": "{n}h ago",
	"agoMinutesAgo": "{n}m ago",
	"agoSecondsAgo": "{n}s ago",
	"agoJustNow": "Just now",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"agoInvalid": "None",
	"agoYearsAgo": "{n}y ago",
	"agoMonthsAgo": "{n}mo ago",
	"agoWeeksAgo": "{n}w ago",
	"agoDaysAgo": "{n}d ago",
	"agoHoursAgo": "{n}h ago",
	"agoMinutesAgo": "{n}m ago",
	"agoSecondsAgo": "{n}s ago",
	"agoJustNow": "Just now",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"agoInvalid": "없음",
	"agoYearsAgo": "{n}년 전",
	"agoMonthsAgo": "{n}개월 전",
	"agoWeeksAgo": "{n}주 전",
	"agoDaysAgo": "{n}일 전",
	"agoHoursAgo": "{n}시간 전",
	"agoMinutesAgo": "{n}분 전",
	"agoSecondsAgo": "{n}초 전",
	"agoJustNow": "방금 전",
	"timeInYears": "{n}년 후",
	"timeInMonths": "{n}개월 후",
	"timeInWeeks": "{n}주 후",
	"timeInDays": "{n}일 후",
	"timeInHours": "{n}시간 후",
	"timeInMinutes": "{n}분 후",
	"timeInSeconds": "{n}초 후"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"agoInvalid": "None",
	"agoYearsAgo": "{n}y ago",
	"agoMonthsAgo": "{n}mo ago",
	"agoWeeksAgo": "{n}w ago",
	"agoDaysAgo": "{n}d ago",
	"agoHoursAgo": "{n}h ago",
	"agoMinutesAgo": "{n}m ago",
	"agoSecondsAgo": "{n}s ago",
	"agoJustNow": "Just now",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"agoInvalid": "Ingenting",
	"agoYearsAgo": "{n} år siden",
	"agoMonthsAgo": "{n} måneder siden",
	"agoWeeksAgo": "{n} uker siden",
	"agoDaysAgo": "{n}d siden",
	"agoHoursAgo": "{n}t siden",
	"agoMinutesAgo": "{n}m siden",
	"agoSecondsAgo": "{n}s siden",
	"agoJustNow": "Akkurat nå",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"agoInvalid": "Nie ma tu niczego",
	"agoYearsAgo": "{n} lat temu",
	"agoMonthsAgo": "{n} mies. temu",
	"agoWeeksAgo": "{n} tyg. temu",
	"agoDaysAgo": "{n} dni temu",
	"agoHoursAgo": "{n} godz. temu",
	"agoMinutesAgo": "{n} min. temu",
	"agoSecondsAgo": "{n} sek. temu",
	"agoJustNow": "Przed chwilą",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"agoInvalid": "Não há nada aqui",
	"agoYearsAgo": "{n} anos atrás",
	"agoMonthsAgo": "{n} meses atrás",
	"agoWeeksAgo": "{n} semanas atrás",
	"agoDaysAgo": "{n}d atrás",
	"agoHoursAgo": "{n}h atrás",
	"agoMinutesAgo": "{n}m atrás",
	"agoSecondsAgo": "{n}s atrás",
	"agoJustNow": "Agora mesmo",
	"timeInYears": "Em {n} anos",
	"timeInMonths": "Em {n} meses",
	"timeInWeeks": "Em {n} semanas",
	"timeInDays": "Em {n}d",
	"timeInHours": "Em {n}h",
	"timeInMinutes": "Em {n}m",
	"timeInSeconds": "Em {n}s"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"agoInvalid": "Ничего нет",
	"agoYearsAgo": "{n} г. назад",
	"agoMonthsAgo": "{n} мес. назад",
	"agoWeeksAgo": "{n} нед. назад",
	"agoDaysAgo": "{n} сут назад",
	"agoHoursAgo": "{n} ч назад",
	"agoMinutesAgo": "{n} мин назад",
	"agoSecondsAgo": "{n} с назад",
	"agoJustNow": "Только что",
	"timeInYears": "Через {n} г.",
	"timeInMonths": "Через {n} мес.",
	"timeInWeeks": "Через {n} нед.",
	"timeInDays": "Через {n} сут",
	"timeInHours": "Через {n} ч",
	"timeInMinutes": "Через {n} мин",
	"timeInSeconds": "Через {n} с"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"agoInvalid": "Nič tu nie je",
	"agoYearsAgo": "pred {n} rokmi",
	"agoMonthsAgo": "pred {n} mesiacmi",
	"agoWeeksAgo": "pred {n} týždňami",
	"agoDaysAgo": "pred {n} dňami",
	"agoHoursAgo": "pred {n} hodinami",
	"agoMinutesAgo": "pred {n} minútami",
	"agoSecondsAgo": "pred {n} sekundami",
	"agoJustNow": "Teraz",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"agoInvalid": "ไม่พบผลลัพธ์",
	"agoYearsAgo": "{n} ปีที่ผ่านมา",
	"agoMonthsAgo": "{n} เดือนที่แล้ว",
	"agoWeeksAgo": "{n} สัปดาห์ที่แล้ว",
	"agoDaysAgo": "{n} วันที่ผ่านมา",
	"agoHoursAgo": "{n} ชั่วโมงที่แล้ว",
	"agoMinutesAgo": "{n} นาทีที่แล้ว",
	"agoSecondsAgo": "{n} วินาทีที่แล้ว",
	"agoJustNow": "เมื่อกี๊นี้",
	"timeInYears": "ใน {n} ปี",
	"timeInMonths": "ใน {n} เดือน",
	"timeInWeeks": "ใน {n} สัปดาห์",
	"timeInDays": "ใน {n} วัน",
	"timeInHours": "ใน {n} ชั่วโมง",
	"timeInMinutes": "ใน {n} นาที",
	"timeInSeconds": "ใน {n} วินาที"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"agoInvalid": "Geçersiz",
	"agoYearsAgo": "{n} yıl",
	"agoMonthsAgo": "{n} ay",
	"agoWeeksAgo": "{n} hafta",
	"agoDaysAgo": "{n} gün",
	"agoHoursAgo": "{n} sa",
	"agoMinutesAgo": "{n} dk",
	"agoSecondsAgo": "{n} sn",
	"agoJustNow": "Şimdi",
	"timeInYears": "{n} yıl içinde",
	"timeInMonths": "{n} ay içinde",
	"timeInWeeks": "{n} hafta içinde",
	"timeInDays": "{n} gün içinde",
	"timeInHours": "{n} saat içinde",
	"timeInMinutes": "{n} dakika içinde",
	"timeInSeconds": "{n} saniye içinde"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"agoInvalid": "None",
	"agoYearsAgo": "{n}y ago",
	"agoMonthsAgo": "{n}mo ago",
	"agoWeeksAgo": "{n}w ago",
	"agoDaysAgo": "{n}d ago",
	"agoHoursAgo": "{n}h ago",
	"agoMinutesAgo": "{n}m ago",
	"agoSecondsAgo": "{n}s ago",
	"agoJustNow": "Just now",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"agoInvalid": "Тут нічого немає",
	"agoYearsAgo": "{n} р. тому",
	"agoMonthsAgo": "{n} міс. тому",
	"agoWeeksAgo": "{n} тиж. тому",
	"agoDaysAgo": "{n}д тому",
	"agoHoursAgo": "{n}г тому",
	"agoMinutesAgo": "{n}х тому",
	"agoSecondsAgo": "{n}с тому",
	"agoJustNow": "Щойно",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"agoInvalid": "Không có gì ở đây",
	"agoYearsAgo": "{n} năm trước",
	"agoMonthsAgo": "{n} tháng trước",
	"agoWeeksAgo": "{n} tuần trước",
	"agoDaysAgo": "{n} ngày trước",
	"agoHoursAgo": "{n} giờ trước",
	"agoMinutesAgo": "{n} phút trước",
	"agoSecondsAgo": "{n}s trước",
	"agoJustNow": "Vừa xong",
	"timeInYears": "In {n}y",
	"timeInMonths": "In {n}mo",
	"timeInWeeks": "In {n}w",
	"timeInDays": "In {n}d",
	"timeInHours": "In {n}h",
	"timeInMinutes": "In {n}m",
	"timeInSeconds": "In {n}s"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"agoInvalid": "没有",
	"agoYearsAgo": "{n}年前",
	"agoMonthsAgo": "{n}个月前",
	"agoWeeksAgo": "{n}周前",
	"agoDaysAgo": "{n}天前",
	"agoHoursAgo": "{n}小时前",
	"agoMinutesAgo": "{n}分钟前",
	"agoSecondsAgo": "{n}秒前",
	"agoJustNow": "刚刚",
	"timeInYears": "{n}年后",
	"timeInMonths": "{n}个月后",
	"timeInWeeks": "{n}周后",
	"timeInDays": "{n}天后",
	"timeInHours": "{n}小时后",
	"timeInMinutes": "{n}分钟后",
	"timeInSeconds": "{n}秒后"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"agoInvalid": "無",
	"agoYearsAgo": "{n}年前",
	"agoMonthsAgo": "{n}個月前",
	"agoWeeksAgo": "{n}周前",
	"agoDaysAgo": "{n}天前",
	"agoHoursAgo": "{n}小時前",
	"agoMinutesAgo": "{n}分鐘前",
	"agoSecondsAgo": "{n}秒前",
	"agoJustNow": "剛剛",
	"timeInYears": "{n}年後",
	"timeInMonths": "{n}個月後",
	"timeInWeeks": "{n}週後",
	"timeInDays": "{n}天後",
	"timeInHours": "{n}小時後",
	"timeInMinutes": "{n}分鐘後",
	"timeInSeconds": "{n}秒後"
}
</locale>
