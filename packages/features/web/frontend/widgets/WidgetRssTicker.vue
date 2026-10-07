<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="widgetProps.showHeader" class="mkw-rss-ticker">
	<template #icon><i class="ti ti-rss"></i></template>
	<template #header>RSS</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configure"><i class="ti ti-settings"></i></button></template>

	<div :class="$style.feed">
		<div v-if="fetching" :class="$style.loading">
			<MkEllipsis/>
		</div>
		<div v-else>
			<Transition :name="$style.change" mode="default" appear>
				<MkMarqueeText :key="key" :duration="widgetProps.duration" :reverse="widgetProps.reverse">
					<span v-for="item in items" :key="item.link" :class="$style.item">
						<a :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a><span :class="$style.divider"></span>
					</span>
				</MkMarqueeText>
			</Transition>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { url as base } from '@@/js/config.js';
import { useInterval } from '@@/js/use-interval.js';
import { tryParseUrl } from '@@/js/url.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkMarqueeText from '@features/ui/frontend/components/MkMarqueeText.vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import { shuffle } from '@features/runtime/frontend/utility/shuffle.js';

const name = 'rssTicker';

const widgetPropsDef = {
	url: {
		type: 'string',
		label: $locale.value.sfc.url,
		default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
		manualSave: true,
	},
	shuffle: {
		type: 'boolean',
		label: $locale.value.sfc.shuffle,
		default: true,
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
	duration: {
		type: 'range',
		label: $locale.value.sfc.duration,
		default: 70,
		step: 1,
		min: 5,
		max: 200,
	},
	reverse: {
		type: 'boolean',
		label: $locale.value.sfc.reverse,
		default: false,
	},
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: false,
	},
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.transparent,
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

const rawItems = ref<Misskey.entities.FetchRssResponse['items']>([]);
const items = computed(() => {
	const newItems = rawItems.value.slice(0, widgetProps.maxEntries);
	if (widgetProps.shuffle) {
		shuffle(newItems);
	}
	return newItems;
});
const fetching = ref(true);
const fetchEndpoint = computed(() => {
	const url = new URL('/api/fetch-rss', base);
	url.searchParams.set('url', widgetProps.url);
	return url;
});
let intervalClear: (() => void) | null | undefined = null;

const key = ref(0);

const tick = () => {
	window.fetch(fetchEndpoint.value, {})
		.then(res => res.json())
		.then((feed: Misskey.entities.FetchRssResponse) => {
			rawItems.value = feed.items.filter((item) => {
				if (!item.link) return false;
				const itemUrl = tryParseUrl(item.link, base);
				return itemUrl != null && ['http:', 'https:'].includes(itemUrl.protocol);
			});
			fetching.value = false;
			key.value++;
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
.change {
	&:global(-enter-active),
	&:global(-leave-active) {
		position: absolute;
		top: 0;
		transition: all 1s ease;
	}
	&:global(-enter-from) {
		opacity: 0;
		transform: translateY(-100%);
	}
	&:global(-leave-to) {
		opacity: 0;
		transform: translateY(100%);
	}
}

.feed {
	--height: 42px;
	padding: 0;
	font-size: 0.9em;
	line-height: var(--height);
	height: var(--height);
	contain: strict;
}

.loading {
	text-align: center;
}

.item {
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	color: var(--MI_THEME-fg);
}

.divider {
	display: inline-block;
	width: 0.5px;
	height: 16px;
	margin: 0 1em;
	background: var(--MI_THEME-divider);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"url": "URL del canal RSS",
	"shuffle": "Visualització aleatòria ",
	"refreshIntervalSec": "Interval d'actualitzacions (segons)",
	"maxEntries": "Nombre màxim d'entrades a mostrar",
	"duration": "Velocitat desplaçament bàner informatiu ",
	"reverse": "Desplaçament contrari",
	"showHeader": "Mostrar la capçalera",
	"transparent": "Fons transparent"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"url": "RSS-Feed-URL",
	"shuffle": "Zufällige Anzeigereihenfolge",
	"refreshIntervalSec": "Aktualisierungsintervall (Sekunden)",
	"maxEntries": "Maximale Anzahl der angezeigten Einträge",
	"duration": "Banner-Scrollgeschwindigkeit (in Sekunden)",
	"reverse": "In andere Richtung scrollen",
	"showHeader": "Kopfzeile anzeigen",
	"transparent": "Hintergrund transparent machen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"url": "URL del canal RSS",
	"shuffle": "Orden de visualización aleatorio",
	"refreshIntervalSec": "Intervalo de actualización (En segundos)",
	"maxEntries": "Número máximo de elementos a mostrar",
	"duration": "Velocidad de desplazamiento del baner (En segundos)",
	"reverse": "Desplázate en la dirección opuesta.",
	"showHeader": "Mostrar encabezados",
	"transparent": "Hacer fondo transparente"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"url": "URL del Feed RSS",
	"shuffle": "Ordine casuale",
	"refreshIntervalSec": "Intervallo di aggiornamento (in secondi)",
	"maxEntries": "Quantità massima visualizzabile",
	"duration": "Velocità di scorrimento del ticker (in secondi)",
	"reverse": "Direzione inversa",
	"showHeader": "Mostra la testata",
	"transparent": "Sfondo trasparente"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"url": "RSSフィードのURL",
	"shuffle": "表示順をシャッフル",
	"refreshIntervalSec": "更新間隔(秒)",
	"maxEntries": "最大表示件数",
	"duration": "ティッカーのスクロール速度(秒)",
	"reverse": "逆方向にスクロール",
	"showHeader": "ヘッダーを表示",
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"url": "RSSフィードのURL",
	"shuffle": "表示順をシャッフル",
	"refreshIntervalSec": "更新間隔(秒)",
	"maxEntries": "最大表示件数",
	"duration": "ティッカーのスクロール速度(秒)",
	"reverse": "逆方向にスクロール",
	"showHeader": "ヘッダー出す",
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"url": "RSS 필드의 URL",
	"shuffle": "표시 순서 셔플",
	"refreshIntervalSec": "갱신 간격(초)",
	"maxEntries": "최대 표시 건수",
	"duration": "티커 스크롤 속도(초)",
	"reverse": "역방향으로 스크롤",
	"showHeader": "해더를 표시",
	"transparent": "배경을 투명하게 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Exibir cabeçalho",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"url": "URL ของฟีด RSS",
	"shuffle": "สุ่มลำดับ",
	"refreshIntervalSec": "ห้วงอัปเดต (วินาที)",
	"maxEntries": "จำนวนที่แสดงได้สูงสุด",
	"duration": "ความเร็วทิกเกอร์ (วินาที)",
	"reverse": "วิ่งไปอีกทาง",
	"showHeader": "แสดงส่วนหัว",
	"transparent": "ทำพื้นหลังโปรงใส"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"url": "RSS beslemesi URL'si",
	"shuffle": "Görüntüleme sırasını karıştır",
	"refreshIntervalSec": "Güncelleme aralığı (saniye)",
	"maxEntries": "Görüntülenecek maksimum öğe sayısı",
	"duration": "Kaydırma yazısı hızı (saniye)",
	"reverse": "Geriye doğru kaydır",
	"showHeader": "Başlığı göster",
	"transparent": "Arka planı şeffaf yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"url": "RSS Feed Url",
	"shuffle": "Random display order",
	"refreshIntervalSec": "Update interval (in seconds)",
	"maxEntries": "Maximum number of items to display",
	"duration": "Banner scroll speed (in seconds)",
	"reverse": "Scroll in the opposite direction",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"url": "RSS 订阅源网址",
	"shuffle": "随机顺序",
	"refreshIntervalSec": "更新间隔（秒）",
	"maxEntries": "最大显示个数",
	"duration": "滚动速度（秒）",
	"reverse": "反方向滚动",
	"showHeader": "显示标题",
	"transparent": "使背景透明"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"url": "RSS 訂閱網址",
	"shuffle": "顯示順序隨機排列",
	"refreshIntervalSec": "更新間隔（秒）",
	"maxEntries": "最大顯示數量",
	"duration": "RSS 跑馬燈的捲動速度（秒）",
	"reverse": "反方向滾動",
	"showHeader": "檢視標頭 ",
	"transparent": "使背景透明"
}
</locale>
