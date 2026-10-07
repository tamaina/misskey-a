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
		<MkButton v-if="paginator.canSearch" v-tooltip="$locale.sfc.search" iconOnly transparent rounded :active="searchOpened" @click="searchOpened = !searchOpened"><i class="ti ti-search"></i></MkButton>
		<MkButton v-if="canFilter" v-tooltip="$locale.sfc.filter" iconOnly transparent rounded :active="filterOpened" @click="filterOpened = !filterOpened"><i class="ti ti-filter"></i></MkButton>
		<MkButton v-tooltip="$locale.sfc.dateAndTime" iconOnly transparent rounded :active="date != null" @click="date = date == null ? Date.now() : null"><i class="ti ti-calendar-clock"></i></MkButton>
		<MkButton v-tooltip="$locale.sfc.reload" iconOnly transparent rounded @click="paginator.reload()"><i class="ti ti-refresh"></i></MkButton>
	</div>

	<MkInput
		v-if="searchOpened"
		v-model="q"
		type="search"
		debounce
	>
		<template #label>{{ $locale.sfc.search }}</template>
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
import { ref, watch } from 'vue';
import type { IPaginator } from '@features/ui/frontend/utility/paginator.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import { formatDateTimeString } from '@features/ui/frontend/utility/format-time-string.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

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
	"search": "البحث",
	"filter": "رشّح",
	"dateAndTime": "Timestamp",
	"reload": "انعش",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"search": "Cercar",
	"filter": "Filtrar",
	"dateAndTime": "Data i hora",
	"reload": "Actualitzar",
	"newest": "Més recent",
	"oldest": "Antigues primer"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"search": "Vyhledávání",
	"filter": "Filtr",
	"dateAndTime": "Timestamp",
	"reload": "Aktualizovat",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"search": "Search",
	"filter": "Filter",
	"dateAndTime": "Timestamp",
	"reload": "Refresh",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"search": "Suchen",
	"filter": "Filter",
	"dateAndTime": "Zeit",
	"reload": "Aktualisieren",
	"newest": "Neueste zuerst",
	"oldest": "Älteste zuerst"
}
</locale>

<locale locale="en-US" lang="json">
{
	"search": "Search",
	"filter": "Filter",
	"dateAndTime": "Timestamp",
	"reload": "Refresh",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"search": "Buscar",
	"filter": "Filtrar",
	"dateAndTime": "Fecha y hora",
	"reload": "Recargar",
	"newest": "Más reciente primero",
	"oldest": "Más antiguos primero"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"search": "Rechercher",
	"filter": "Filtre",
	"dateAndTime": "Date et heure",
	"reload": "Rafraîchir",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"search": "Cari",
	"filter": "Saring",
	"dateAndTime": "Tanggal dan Waktu",
	"reload": "Muat ulang",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"search": "Cerca",
	"filter": "Filtri",
	"dateAndTime": "Data e Ora",
	"reload": "Ricarica",
	"newest": "Più recenti",
	"oldest": "Meno recenti"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"search": "検索",
	"filter": "フィルタ",
	"dateAndTime": "日時",
	"reload": "リロード",
	"newest": "新しい順",
	"oldest": "古い順"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"search": "探す",
	"filter": "フィルタ",
	"dateAndTime": "日時",
	"reload": "リロード",
	"newest": "新しい順",
	"oldest": "古い順"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"search": "Nadi",
	"filter": "Filter",
	"dateAndTime": "Timestamp",
	"reload": "Refresh",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"search": "ಹುಡುಕು",
	"filter": "Filter",
	"dateAndTime": "Timestamp",
	"reload": "Refresh",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"search": "검색",
	"filter": "필터",
	"dateAndTime": "일시",
	"reload": "새로고침",
	"newest": "최신 순",
	"oldest": "오래된 순"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"search": "Zoeken",
	"filter": "Filter",
	"dateAndTime": "Timestamp",
	"reload": "Verversen",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"search": "Søk",
	"filter": "Filter",
	"dateAndTime": "Timestamp",
	"reload": "Refresh",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"search": "Szukaj",
	"filter": "Filtr",
	"dateAndTime": "Timestamp",
	"reload": "Odśwież",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"search": "Pesquisar",
	"filter": "Filtrar",
	"dateAndTime": "Data e Hora",
	"reload": "Recarregar",
	"newest": "Priorizar Mais Novos",
	"oldest": "Priorizar Mais Antigos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"search": "Поиск",
	"filter": "Фильтры",
	"dateAndTime": "Дата и время",
	"reload": "Перезагрузить",
	"newest": "Новейшие",
	"oldest": "Старейшие"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"search": "Hľadať",
	"filter": "Filter",
	"dateAndTime": "Timestamp",
	"reload": "Obnoviť",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"search": "ค้นหา",
	"filter": "กรอง",
	"dateAndTime": "วันเวลา",
	"reload": "รีโหลด",
	"newest": "เรียงจากใหม่ไปเก่า",
	"oldest": "เรียงจากเก่าไปใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"search": "Ara",
	"filter": "Filtre",
	"dateAndTime": "Zaman damgası",
	"reload": "Yenile",
	"newest": "Önce yeni",
	"oldest": "Önce eski"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"search": "ئىزدەش",
	"filter": "Filter",
	"dateAndTime": "Timestamp",
	"reload": "Refresh",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"search": "Пошук",
	"filter": "Фільтр",
	"dateAndTime": "Дата та час",
	"reload": "Оновити",
	"newest": "Найновіші спочатку",
	"oldest": "Спочатку старі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"search": "Tìm kiếm",
	"filter": "Bộ lọc",
	"dateAndTime": "Ngày và giờ",
	"reload": "Tải lại",
	"newest": "Newest First",
	"oldest": "Oldest First"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"search": "搜索",
	"filter": "筛选",
	"dateAndTime": "日期和时间",
	"reload": "刷新",
	"newest": "从新到旧",
	"oldest": "从旧到新"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"search": "搜尋",
	"filter": "篩選",
	"dateAndTime": "日期與時間",
	"reload": "重新整理",
	"newest": "最新的在前",
	"oldest": "最舊的在前"
}
</locale>
