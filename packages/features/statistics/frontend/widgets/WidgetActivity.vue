<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent" data-testid="mkw-activity" class="mkw-activity">
	<template #icon><i class="ti ti-chart-line"></i></template>
	<template #header>{{ $locale.sfc.activity }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="toggleView()"><i class="ti ti-selector"></i></button></template>

	<div>
		<MkLoading v-if="fetching"/>
		<template v-else>
			<XCalendar v-show="widgetProps.view === 0" :activity="activity ?? []"/>
			<XChart v-show="widgetProps.view === 1" :activity="activity ?? []"/>
		</template>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentProps, WidgetComponentEmits, WidgetComponentExpose } from '../../../ui/frontend/widgets/widget.js';
import XCalendar from '@features/statistics/frontend/widgets/WidgetActivity.calendar.vue';
import XChart from '@features/statistics/frontend/widgets/WidgetActivity.chart.vue';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import { misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

const name = 'activity';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: true,
	},
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.transparent,
		default: false,
	},
	view: {
		type: 'number',
		default: 0,
		hidden: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const activity = ref<{
	total: number;
	notes: number;
	replies: number;
	renotes: number;
}[] | null>(null);
const fetching = ref(true);

const toggleView = () => {
	if (widgetProps.view === 1) {
		widgetProps.view = 0;
	} else {
		widgetProps.view++;
	}
	save();
};

misskeyApiGet('charts/user/notes', {
	userId: $i.id,
	span: 'day',
	limit: 7 * 21,
}).then(res => {
	activity.value = res.diffs.normal.map((_, i) => ({
		total: res.diffs.normal[i] + res.diffs.reply[i] + res.diffs.renote[i],
		notes: res.diffs.normal[i],
		replies: res.diffs.reply[i],
		renotes: res.diffs.renote[i],
	}));
	fetching.value = false;
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<locale locale="ar-SA" lang="json">
{
	"activity": "النشاط",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"activity": "Activitat",
	"showHeader": "Mostrar la capçalera",
	"transparent": "Fons transparent"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"activity": "Aktivita",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"activity": "Activity",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"activity": "Aktivität",
	"showHeader": "Kopfzeile anzeigen",
	"transparent": "Hintergrund transparent machen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"activity": "Activity",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"activity": "Actividad",
	"showHeader": "Mostrar encabezados",
	"transparent": "Hacer fondo transparente"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"activity": "Activité",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"activity": "Aktivitas",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"activity": "Attività",
	"showHeader": "Mostra la testata",
	"transparent": "Sfondo trasparente"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"activity": "アクティビティ",
	"showHeader": "ヘッダーを表示",
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"activity": "アクティビティ",
	"showHeader": "ヘッダー出す",
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"activity": "Activity",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"activity": "Activity",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"activity": "활동",
	"showHeader": "해더를 표시",
	"transparent": "배경을 투명하게 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"activity": "Activiteit",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"activity": "Aktivitet",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"activity": "Aktywność",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"activity": "Atividades",
	"showHeader": "Exibir cabeçalho",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"activity": "Активность",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"activity": "Aktivita",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"activity": "กิจกรรม",
	"showHeader": "แสดงส่วนหัว",
	"transparent": "ทำพื้นหลังโปรงใส"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"activity": "Etkinlik",
	"showHeader": "Başlığı göster",
	"transparent": "Arka planı şeffaf yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"activity": "Activity",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"activity": "Активність",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"activity": "Hoạt động",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"activity": "活动",
	"showHeader": "显示标题",
	"transparent": "使背景透明"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"activity": "動態",
	"showHeader": "檢視標頭 ",
	"transparent": "使背景透明"
}
</locale>
