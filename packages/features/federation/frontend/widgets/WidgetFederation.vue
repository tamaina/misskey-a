<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-testid="mkw-federation" class="mkw-federation">
	<template #icon><i class="ti ti-whirl"></i></template>
	<template #header>{{ $locale.sfc.federation }}</template>

	<div class="wbrkwalb">
		<MkLoading v-if="fetching"/>
		<TransitionGroup v-else tag="div" :name="prefer.s.animation ? 'chart' : ''" class="instances">
			<div v-for="(instance, i) in instances" :key="instance.id" class="instance">
				<img :src="getInstanceIcon(instance)" alt=""/>
				<div class="body">
					<MkA class="a" :to="`/instance-info/${instance.host}`" behavior="window" :title="instance.host">{{ instance.host }}</MkA>
					<p>{{ instance.softwareName || '?' }} {{ instance.softwareVersion }}</p>
				</div>
				<MkMiniChart class="chart" :src="charts[i].requests.received"/>
			</div>
		</TransitionGroup>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkMiniChart from '@features/statistics/frontend/components/MkMiniChart.vue';
import { misskeyApi, misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import { getProxiedImageUrlNullable } from '@features/media/frontend/utility/media-proxy.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const name = 'federation';

const widgetPropsDef = {
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

const instances = ref<Misskey.entities.FederationInstance[]>([]);
const charts = ref<Misskey.entities.ChartsInstanceResponse[]>([]);
const fetching = ref(true);

async function fetchInstances() {
	const fetchedInstances = await misskeyApi('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 5,
	});
	const fetchedCharts = await Promise.all(fetchedInstances.map(i => misskeyApiGet('charts/instance', { host: i.host, limit: 16, span: 'hour' })));
	instances.value = fetchedInstances;
	charts.value = fetchedCharts;
	fetching.value = false;
}

useInterval(fetchInstances, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

function getInstanceIcon(instance: Misskey.entities.FederationInstance): string {
	return getProxiedImageUrlNullable(instance.iconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? '/client-assets/dummy.png';
}

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.wbrkwalb {
	$bodyTitleHieght: 18px;
	$bodyInfoHieght: 16px;

	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .instances {
		.chart-move {
			transition: transform 1s ease;
		}

		> .instance {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 0.5px var(--MI_THEME-divider);

			> img {
				display: block;
				width: ($bodyTitleHieght + $bodyInfoHieght);
				height: ($bodyTitleHieght + $bodyInfoHieght);
				object-fit: cover;
				border-radius: 4px;
				margin-right: 8px;
			}

			> .body {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--MI_THEME-fg);
				padding-right: 8px;

				> .a {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: $bodyTitleHieght;
				}

				> p {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					line-height: $bodyInfoHieght;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"federation": "الفديرالية",
	"showHeader": "Show header"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"federation": "Federació",
	"showHeader": "Mostrar la capçalera"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"federation": "Federace",
	"showHeader": "Show header"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"federation": "Federation",
	"showHeader": "Show header"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"federation": "Föderation",
	"showHeader": "Kopfzeile anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"federation": "Federation",
	"showHeader": "Show header"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"federation": "Federación",
	"showHeader": "Mostrar encabezados"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"federation": "Fédération",
	"showHeader": "Show header"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"federation": "Federasi",
	"showHeader": "Show header"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"federation": "Federazione",
	"showHeader": "Mostra la testata"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"federation": "連合",
	"showHeader": "ヘッダーを表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"federation": "連合",
	"showHeader": "ヘッダー出す"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"federation": "Federation",
	"showHeader": "Show header"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"federation": "Federation",
	"showHeader": "Show header"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"federation": "연합",
	"showHeader": "해더를 표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"federation": "Federatie",
	"showHeader": "Show header"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"federation": "Føderasjon",
	"showHeader": "Show header"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"federation": "Federacja",
	"showHeader": "Show header"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"federation": "Federação",
	"showHeader": "Exibir cabeçalho"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"federation": "Федерация",
	"showHeader": "Show header"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"federation": "Federácia",
	"showHeader": "Show header"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"federation": "สหพันธ์",
	"showHeader": "แสดงส่วนหัว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"federation": "Federasyon",
	"showHeader": "Başlığı göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"federation": "Federation",
	"showHeader": "Show header"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"federation": "Федіверс",
	"showHeader": "Show header"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"federation": "Liên hợp",
	"showHeader": "Show header"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"federation": "联邦",
	"showHeader": "显示标题"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"federation": "聯邦宇宙",
	"showHeader": "檢視標頭 "
}
</locale>
