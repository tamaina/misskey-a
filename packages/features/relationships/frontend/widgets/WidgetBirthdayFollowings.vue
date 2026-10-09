<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :style="`height: ${widgetProps.height}px;`" :showHeader="widgetProps.showHeader" :scrollable="true" class="mkw-bdayfollowings">
	<template #icon><i class="ti ti-cake"></i></template>
	<template #header>{{ $locale.sfc.widgetsBirthdayFollowings }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="fetch"><i class="ti ti-refresh"></i></button></template>

	<MkPagination v-slot="{ items }" :paginator="birthdayUsersPaginator">
		<div>
			<template v-for="(user, i) in items" :key="user.id">
				<div
					v-if="i > 0 && isSeparatorNeeded(birthdayUsersPaginator.items.value[i - 1].birthday, user.birthday)"
				>
					<div :class="$style.date">
						<span><i class="ti ti-chevron-up"></i> {{ getSeparatorInfo(birthdayUsersPaginator.items.value[i - 1].birthday, user.birthday)?.prevText }}</span>
						<span style="height: 1em; width: 1px; background: var(--MI_THEME-divider);"></span>
						<span>{{ getSeparatorInfo(birthdayUsersPaginator.items.value[i - 1].birthday, user.birthday)?.nextText }} <i class="ti ti-chevron-down"></i></span>
					</div>
					<XUser :class="$style.user" :item="user" />
				</div>
				<XUser v-else :class="$style.user" :item="user" />
			</template>
		</div>
	</MkPagination>
</MkContainer>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref, watch } from 'vue';
import { useLowresTime } from '@features/ui/frontend/shared/use-lowres-time.js';
import { isSeparatorNeeded, getSeparatorInfo } from '@features/timelines/frontend/utility/timeline-date-separate.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import XUser from './WidgetBirthdayFollowings.user.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const name = 'birthdayFollowings';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.widgetOptionsShowHeader,
		default: true,
	},
	height: {
		type: 'number' as const,
		label: $locale.value.sfc.widgetOptionsHeight,
		default: 300,
	},
	period: {
		type: 'radio' as const,
		label: $locale.value.sfc.widgetOptionsBirthdayFollowingsPeriod,
		default: '3day',
		options: [{
			value: 'today' as const,
			label: $locale.value.sfc.today,
		}, {
			value: '3day' as const,
			label: interpolateLocaleParameters($locale.value.sfc.dayX, { day: 3 }),
		}, {
			value: 'week' as const,
			label: $locale.value.sfc.oneWeek,
		}, {
			value: 'month' as const,
			label: $locale.value.sfc.oneMonth,
		}],
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(
	name,
	widgetPropsDef,
	props,
	emit,
);

const now = useLowresTime();
const nextDay = new Date();
nextDay.setHours(24, 0, 0, 0);
let nextDayMidnightTime = nextDay.getTime();

const begin = ref<Date>(new Date());
const end = computed(() => {
	switch (widgetProps.period) {
		case '3day':
			return new Date(begin.value.getTime() + 1000 * 60 * 60 * 24 * 3);
		case 'week':
			return new Date(begin.value.getTime() + 1000 * 60 * 60 * 24 * 7);
		case 'month':
			return new Date(begin.value.getTime() + 1000 * 60 * 60 * 24 * 30);
		default:
			return begin.value;
	}
});

const birthdayUsersPaginator = markRaw(new Paginator('users/get-following-users-by-birthday', {
	limit: 18,
	offsetMode: true,
	computedParams: computed(() => {
		if (widgetProps.period === 'today') {
			return {
				birthday: {
					month: begin.value.getMonth() + 1,
					day: begin.value.getDate(),
				},
			};
		} else {
			return {
				birthday: {
					begin: {
						month: begin.value.getMonth() + 1,
						day: begin.value.getDate(),
					},
					end: {
						month: end.value.getMonth() + 1,
						day: end.value.getDate(),
					},
				},
			};
		}
	}),
}));

function fetch() {
	const now = new Date();
	begin.value = now;
}

const UPDATE_INTERVAL = 1000 * 60;
let nextDayTimer: number | null = null;

watch(now, (to) => {
	// 次回更新までに日付が変わる場合、日付が変わった直後に強制的に更新するタイマーをセットする
	if (nextDayMidnightTime - to <= UPDATE_INTERVAL) {
		if (nextDayTimer != null) {
			window.clearTimeout(nextDayTimer);
			nextDayTimer = null;
		}

		nextDayTimer = window.setTimeout(() => {
			fetch();
			nextDay.setHours(24, 0, 0, 0);
			nextDayMidnightTime = nextDay.getTime();
			nextDayTimer = null;
		}, nextDayMidnightTime - to);
	}
}, { immediate: true });

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
	background: var(--MI_THEME-panel);
}

.user {
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.date {
	display: flex;
	font-size: 85%;
	align-items: center;
	justify-content: center;
	gap: 1em;
	opacity: 0.75;
	padding: 8px 8px;
	margin: 0 auto;
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "الإرتفاع",
	"widgetOptionsBirthdayFollowingsPeriod": "المدة",
	"today": "اليوم",
	"dayX": "{day}",
	"oneWeek": "أسبوع",
	"oneMonth": "شهر"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"widgetsBirthdayFollowings": "Usuaris que fan l'aniversari avui",
	"widgetOptionsShowHeader": "Mostrar la capçalera",
	"widgetOptionsHeight": "Alçada ",
	"widgetOptionsBirthdayFollowingsPeriod": "Període",
	"today": "Avui",
	"dayX": "{day}",
	"oneWeek": "Una setmana",
	"oneMonth": "Un mes"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Výška",
	"widgetOptionsBirthdayFollowingsPeriod": "Trvání",
	"today": "Dnes",
	"dayX": "{day}",
	"oneWeek": "1 týden",
	"oneMonth": "1 měsíc"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Height",
	"widgetOptionsBirthdayFollowingsPeriod": "Duration",
	"today": "Today",
	"dayX": "{day}",
	"oneWeek": "One week",
	"oneMonth": "One month"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"widgetsBirthdayFollowings": "Nutzer, die heute Geburtstag haben",
	"widgetOptionsShowHeader": "Kopfzeile anzeigen",
	"widgetOptionsHeight": "Höhe",
	"widgetOptionsBirthdayFollowingsPeriod": "Dauer",
	"today": "Heute",
	"dayX": "{day}",
	"oneWeek": "Eine Woche",
	"oneMonth": "1 Monat"
}
</locale>

<locale lang="json" locale="en-US">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Height",
	"widgetOptionsBirthdayFollowingsPeriod": "Duration",
	"today": "Today",
	"dayX": "{day}",
	"oneWeek": "One week",
	"oneMonth": "One month"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"widgetsBirthdayFollowings": "Hoy cumplen años",
	"widgetOptionsShowHeader": "Mostrar encabezados",
	"widgetOptionsHeight": "Altura",
	"widgetOptionsBirthdayFollowingsPeriod": "Duración",
	"today": "Hoy",
	"dayX": "Día {day}",
	"oneWeek": "1 semana",
	"oneMonth": "1 mes"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"widgetsBirthdayFollowings": "Utilisateurs qui fêtent l'anniversaire aujourd'hui",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Hauteur",
	"widgetOptionsBirthdayFollowingsPeriod": "Durée",
	"today": "Aujourd’hui",
	"dayX": "{day}",
	"oneWeek": "1 semaine",
	"oneMonth": "Un mois"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"widgetsBirthdayFollowings": "Pengguna yang merayakan hari ulang tahunnya hari ini",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Tinggi",
	"widgetOptionsBirthdayFollowingsPeriod": "Durasi",
	"today": "Hari ini",
	"dayX": "{day}",
	"oneWeek": "1 Bulan",
	"oneMonth": "satu bulan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"widgetsBirthdayFollowings": "Compleanni del giorno",
	"widgetOptionsShowHeader": "Mostra la testata",
	"widgetOptionsHeight": "Altezza",
	"widgetOptionsBirthdayFollowingsPeriod": "Durata",
	"today": "Oggi",
	"dayX": "{day}",
	"oneWeek": "1 settimana",
	"oneMonth": "Un mese"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"widgetsBirthdayFollowings": "もうすぐ誕生日のユーザー",
	"widgetOptionsShowHeader": "ヘッダーを表示",
	"widgetOptionsHeight": "高さ",
	"widgetOptionsBirthdayFollowingsPeriod": "期間",
	"today": "今日",
	"dayX": "{day}日",
	"oneWeek": "1週間",
	"oneMonth": "1ヶ月"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"widgetsBirthdayFollowings": "今日誕生日のツレ",
	"widgetOptionsShowHeader": "ヘッダー出す",
	"widgetOptionsHeight": "高さ",
	"widgetOptionsBirthdayFollowingsPeriod": "期間",
	"today": "今日",
	"dayX": "{day}日",
	"oneWeek": "1週間",
	"oneMonth": "1ヶ月"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Height",
	"widgetOptionsBirthdayFollowingsPeriod": "Duration",
	"today": "Today",
	"dayX": "{day}",
	"oneWeek": "One week",
	"oneMonth": "One month"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Height",
	"widgetOptionsBirthdayFollowingsPeriod": "Duration",
	"today": "Today",
	"dayX": "{day}",
	"oneWeek": "One week",
	"oneMonth": "One month"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"widgetsBirthdayFollowings": "곧 생일인 사용자",
	"widgetOptionsShowHeader": "해더를 표시",
	"widgetOptionsHeight": "높이",
	"widgetOptionsBirthdayFollowingsPeriod": "기간",
	"today": "오늘",
	"dayX": "{day}일",
	"oneWeek": "일주일",
	"oneMonth": "1개월"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Hoogte",
	"widgetOptionsBirthdayFollowingsPeriod": "Duration",
	"today": "Vandaag",
	"dayX": "{day}",
	"oneWeek": "One week",
	"oneMonth": "One month"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Høyde",
	"widgetOptionsBirthdayFollowingsPeriod": "Duration",
	"today": "I dag",
	"dayX": "{day}",
	"oneWeek": "1 uke",
	"oneMonth": "1 måned"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Wysokość",
	"widgetOptionsBirthdayFollowingsPeriod": "Czas trwania",
	"today": "Dziś",
	"dayX": "{day}",
	"oneWeek": "1 tydzień",
	"oneMonth": "jeden miesiąc"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"widgetsBirthdayFollowings": "Usuários de aniversário hoje",
	"widgetOptionsShowHeader": "Exibir cabeçalho",
	"widgetOptionsHeight": "Altura",
	"widgetOptionsBirthdayFollowingsPeriod": "Duração",
	"today": "Hoje",
	"dayX": " Dia {day}",
	"oneWeek": "1 semana",
	"oneMonth": "1 mês"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"widgetsBirthdayFollowings": "Пользователи, у которых сегодня день рождения",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Высота",
	"widgetOptionsBirthdayFollowingsPeriod": "Длительность",
	"today": "Этот день",
	"dayX": "{day} день",
	"oneWeek": "1 неделя",
	"oneMonth": "1 месяц"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Výška",
	"widgetOptionsBirthdayFollowingsPeriod": "Trvanie",
	"today": "Dnes",
	"dayX": "{day}",
	"oneWeek": "1 týždeň",
	"oneMonth": "1 mesiac"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"widgetsBirthdayFollowings": "วันเกิดผู้ใช้ในวันนี้",
	"widgetOptionsShowHeader": "แสดงส่วนหัว",
	"widgetOptionsHeight": "ความสูง",
	"widgetOptionsBirthdayFollowingsPeriod": "ระยะเวลา",
	"today": "วันนี้",
	"dayX": "{day}",
	"oneWeek": "1 สัปดาห์",
	"oneMonth": "หนึ่งเดือน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"widgetsBirthdayFollowings": "Bugünün Doğum Günleri",
	"widgetOptionsShowHeader": "Başlığı göster",
	"widgetOptionsHeight": "Yükseklik",
	"widgetOptionsBirthdayFollowingsPeriod": "Süre",
	"today": "Bugün",
	"dayX": "{day}",
	"oneWeek": "1 hafta",
	"oneMonth": "1 ay"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Height",
	"widgetOptionsBirthdayFollowingsPeriod": "Duration",
	"today": "Today",
	"dayX": "{day}",
	"oneWeek": "One week",
	"oneMonth": "One month"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Висота",
	"widgetOptionsBirthdayFollowingsPeriod": "Тривалість",
	"today": "День",
	"dayX": "{day}",
	"oneWeek": "1 тиждень",
	"oneMonth": "1 місяць"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"widgetsBirthdayFollowings": "Today's Birthdays",
	"widgetOptionsShowHeader": "Show header",
	"widgetOptionsHeight": "Chiều cao",
	"widgetOptionsBirthdayFollowingsPeriod": "Thời hạn",
	"today": "Hôm nay",
	"dayX": "{day}",
	"oneWeek": "1 tuần",
	"oneMonth": "1 tháng"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"widgetsBirthdayFollowings": "今天是他们的生日",
	"widgetOptionsShowHeader": "显示标题",
	"widgetOptionsHeight": "高度",
	"widgetOptionsBirthdayFollowingsPeriod": "期限",
	"today": "今天",
	"dayX": "{day}日",
	"oneWeek": "1 周",
	"oneMonth": "1个月"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"widgetsBirthdayFollowings": "今天生日的使用者",
	"widgetOptionsShowHeader": "檢視標頭 ",
	"widgetOptionsHeight": "高度",
	"widgetOptionsBirthdayFollowingsPeriod": "時長",
	"today": "本日",
	"dayX": "{day} 日",
	"oneWeek": "一週",
	"oneMonth": "一個月"
}
</locale>
