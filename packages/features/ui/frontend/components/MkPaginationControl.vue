<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.control">
		<MkSelect v-model="order" :class="$style.order" :items="orderDef">
			<template #prefix><i class="ti ti-arrows-sort"></i></template>
		</MkSelect>
		<MkButton v-if="paginator.canSearch" v-tooltip="globalLocale.env.search" iconOnly transparent rounded :active="searchOpened" @click="searchOpened = !searchOpened"><i class="ti ti-search"></i></MkButton>
		<MkButton v-if="canFilter" v-tooltip="globalLocale.env.filter" iconOnly transparent rounded :active="filterOpened" @click="filterOpened = !filterOpened"><i class="ti ti-filter"></i></MkButton>
		<MkButton v-tooltip="$locale.sfc.dateAndTime" iconOnly transparent rounded :active="date != null" @click="date = date == null ? Date.now() : null"><i class="ti ti-calendar-clock"></i></MkButton>
		<MkButton v-tooltip="globalLocale.env.reload" iconOnly transparent rounded @click="paginator.reload()"><i class="ti ti-refresh"></i></MkButton>
	</div>

	<MkInput
		v-if="searchOpened"
		v-model="q"
		type="search"
		debounce
	>
		<template #label>{{ globalLocale.env.search }}</template>
		<template #prefix><i class="ti ti-search"></i></template>
	</MkInput>

	<MkInput
		v-if="date != null"
		type="date"
		:modelValue="formatDateTimeString(new Date(date), 'yyyy-MM-dd')"
		@update:modelValue="date = new Date($event).getTime()"
	>
	</MkInput>

	<slot v-if="filterOpened"></slot>
</div>
</template>

<script lang="ts" setup generic="T extends IPaginator">
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, watch } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import { formatDateTimeString } from '@features/ui/frontend/utility/format-time-string.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import type { IPaginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = withDefaults(defineProps<{
	paginator: T;
	canFilter?: boolean;
	filterOpened?: boolean;
}>(), {
	canFilter: false,
	filterOpened: false,
});

const searchOpened = ref(false);
const filterOpened = ref(props.filterOpened);

const {
	model: order,
	def: orderDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.newest, value: 'newest' },
		{ label: $locale.value.sfc.oldest, value: 'oldest' },
	],
	initialValue: 'newest',
});
const date = ref<number | null>(null);
const q = ref<string | null>(null);

watch(order, () => {
	props.paginator.order.value = order.value;
	props.paginator.initialDirection = order.value === 'oldest' ? 'newer' : 'older';
	props.paginator.reload();
});

watch(date, () => {
	props.paginator.initialDate = date.value;
	props.paginator.reload();
});

watch(q, () => {
	props.paginator.searchQuery.value = q.value;
	props.paginator.reload();
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 10px;
}

.control {
	display: flex;
	align-items: center;
	gap: 4px;
}

.order {
	flex: 1;
	margin-right: 6px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"dateAndTime": "Data i hora",
	"newest": "Més recent",
	"oldest": "Antigues primer"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"dateAndTime": "Zeit",
	"newest": "Neueste zuerst",
	"oldest": "Älteste zuerst"
}
</locale>

<locale locale="en-US" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"dateAndTime": "Fecha y hora",
	"newest": "Más reciente primero",
	"oldest": "Más antiguos primero"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"dateAndTime": "Date et heure",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"dateAndTime": "Tanggal dan Waktu",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"dateAndTime": "Data e Ora",
	"newest": "Più recenti",
	"oldest": "Meno recenti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"dateAndTime": "日時",
	"newest": "新しい順",
	"oldest": "古い順"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"dateAndTime": "日時",
	"newest": "新しい順",
	"oldest": "古い順"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"dateAndTime": "일시",
	"newest": "최신 순",
	"oldest": "오래된 순"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"dateAndTime": "Data e Hora",
	"newest": "Priorizar Mais Novos",
	"oldest": "Priorizar Mais Antigos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"dateAndTime": "Дата и время",
	"newest": "Новейшие",
	"oldest": "Старейшие"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"dateAndTime": "วันเวลา",
	"newest": "เรียงจากใหม่ไปเก่า",
	"oldest": "เรียงจากเก่าไปใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"dateAndTime": "Zaman damgası",
	"newest": "Önce yeni",
	"oldest": "Önce eski"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"dateAndTime": "Timestamp",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"dateAndTime": "Дата та час",
	"newest": "Найновіші спочатку",
	"oldest": "Спочатку старі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"dateAndTime": "Ngày và giờ",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"dateAndTime": "日期和时间",
	"newest": "从新到旧",
	"oldest": "从旧到新"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"dateAndTime": "日期與時間",
	"newest": "最新的在前",
	"oldest": "最舊的在前"
}
</locale>
