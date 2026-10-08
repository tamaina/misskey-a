<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-testid="mkw-rss" class="mkw-rss">
	<template #icon><i class="ti ti-rss"></i></template>
	<template #header>RSS</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configure"><i class="ti ti-settings"></i></button></template>

	<div class="ekmkgxbj">
		<MkLoading v-if="fetching"/>
		<MkResult v-else-if="(!items || items.length === 0) && widgetProps.showHeader" type="empty"/>
		<div v-else :class="$style.feed">
			<a v-for="(item, index) in items" :key="typeof item.link === 'string' ? item.link : index" :class="$style.item" :href="rssDomAttribute(item.link)" rel="nofollow noopener" target="_blank" :title="rssDomAttribute(item.title)">{{ item.title }}</a>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, shallowRef, watch, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { url as base } from '@features/boot/frontend/shared/config.js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import { isAllowedRssLink, rssDomAttribute } from '@features/web/frontend/shared/rss-value.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';

const name = 'rss';

const widgetPropsDef = {
	url: {
		type: 'string',
		label: $locale.value.sfc.url,
		default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
		manualSave: true,
	},
	refreshIntervalSec: {
		type: 'number',
		label: $locale.value.sfc.refreshIntervalSec,
		default: 60,
	},
	maxEntries: {
		type: 'number',
		label: $locale.value.sfc.maxEntries,
		default: 15,
	},
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
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

const rawItems = shallowRef<Misskey.entities.FetchRssResponse['items']>([]);
const items = computed(() => rawItems.value.slice(0, widgetProps.maxEntries));
const fetching = ref(true);
const fetchEndpoint = computed(() => {
	const url = new URL('/api/fetch-rss', base);
	url.searchParams.set('url', widgetProps.url);
	return url.toString();
});
let intervalClear: (() => void) | null | undefined = null;

const tick = () => {
	window.fetch(fetchEndpoint.value, {})
		.then(res => res.json())
		.then((feed: Misskey.entities.FetchRssResponse) => {
			rawItems.value = feed.items.filter(item => isAllowedRssLink(item.link, base));
			fetching.value = false;
		});
};

watch(fetchEndpoint, tick);
watch(() => widgetProps.refreshIntervalSec, () => {
	if (intervalClear != null) {
		intervalClear();
	}
	intervalClear = useInterval(tick, Math.max(10000, widgetProps.refreshIntervalSec * 1000), {
		immediate: true,
		afterMounted: true,
	});
}, { immediate: true });

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.feed {
	padding: 0;
	font-size: 0.9em;
}

.item {
	display: block;
	padding: 8px 16px;
	color: var(--MI_THEME-fg);
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;

	&:nth-child(even) {
		background: rgba(#000, 0.05);
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"url": "URL del canal RSS",
	"refreshIntervalSec": "Interval d'actualitzacions (segons)",
	"maxEntries": "Nombre màxim d'entrades a mostrar",
	"showHeader": "Mostrar la capçalera"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"url": "RSS-Feed-URL",
	"refreshIntervalSec": "Aktualisierungsintervall (Sekunden)",
	"maxEntries": "Maximale Anzahl der angezeigten Einträge",
	"showHeader": "Kopfzeile anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"url": "URL del canal RSS",
	"refreshIntervalSec": "Intervalo de actualización (En segundos)",
	"maxEntries": "Número máximo de elementos a mostrar",
	"showHeader": "Mostrar encabezados"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"url": "URL del Feed RSS",
	"refreshIntervalSec": "Intervallo di aggiornamento (in secondi)",
	"maxEntries": "Quantità massima visualizzabile",
	"showHeader": "Mostra la testata"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"url": "RSSフィードのURL",
	"refreshIntervalSec": "更新間隔(秒)",
	"maxEntries": "最大表示件数",
	"showHeader": "ヘッダーを表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"url": "RSSフィードのURL",
	"refreshIntervalSec": "更新間隔(秒)",
	"maxEntries": "最大表示件数",
	"showHeader": "ヘッダー出す"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"url": "RSS 필드의 URL",
	"refreshIntervalSec": "갱신 간격(초)",
	"maxEntries": "최대 표시 건수",
	"showHeader": "해더를 표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Exibir cabeçalho"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"url": "URL ของฟีด RSS",
	"refreshIntervalSec": "ห้วงอัปเดต (วินาที)",
	"maxEntries": "จำนวนที่แสดงได้สูงสุด",
	"showHeader": "แสดงส่วนหัว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"url": "RSS beslemesi URL'si",
	"refreshIntervalSec": "Güncelleme aralığı (saniye)",
	"maxEntries": "Görüntülenecek maksimum öğe sayısı",
	"showHeader": "Başlığı göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"url": "RSS Feed Url",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"showHeader": "Show header"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"url": "RSS 订阅源网址",
	"refreshIntervalSec": "更新间隔（秒）",
	"maxEntries": "最大显示个数",
	"showHeader": "显示标题"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"url": "RSS 訂閱網址",
	"refreshIntervalSec": "更新間隔（秒）",
	"maxEntries": "最大顯示數量",
	"showHeader": "檢視標頭 "
}
</locale>
