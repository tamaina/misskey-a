<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-show="!fetching" :class="$style.root">
		<div v-if="topSubInstancesForPie && topPubInstancesForPie" class="pies">
			<div class="pie deliver _panel">
				<div class="title">Sub</div>
				<XPie :data="topSubInstancesForPie" class="chart"/>
				<div class="subTitle">Top 10</div>
			</div>
			<div class="pie inbox _panel">
				<div class="title">Pub</div>
				<XPie :data="topPubInstancesForPie" class="chart"/>
				<div class="subTitle">Top 10</div>
			</div>
		</div>
		<div v-if="!fetching" class="items">
			<div class="item _panel sub">
				<div class="icon"><i class="ti ti-world-download"></i></div>
				<div class="body">
					<div v-if="federationSubActive != null" class="value">
						{{ number(federationSubActive) }}
						<MkNumberDiff v-if="federationSubActiveDiff != null" v-tooltip="$locale.sfc.dayOverDayChanges" class="diff" :value="federationSubActiveDiff"></MkNumberDiff>
					</div>
					<div class="label">Sub</div>
				</div>
			</div>
			<div class="item _panel pub">
				<div class="icon"><i class="ti ti-world-upload"></i></div>
				<div class="body">
					<div v-if="federationPubActive != null" class="value">
						{{ number(federationPubActive) }}
						<MkNumberDiff v-if="federationPubActiveDiff != null" v-tooltip="$locale.sfc.dayOverDayChanges" class="diff" :value="federationPubActiveDiff"></MkNumberDiff>
					</div>
					<div class="label">Pub</div>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import XPie from '@features/statistics/frontend/pages/admin/overview.pie.vue';
import type { InstanceForPie } from '@features/statistics/frontend/pages/admin/overview.pie.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import number from '@features/ui/frontend/filters/number.js';
import MkNumberDiff from '@features/ui/frontend/components/MkNumberDiff.vue';
import { useChartTooltip } from '@features/statistics/frontend/composables/use-chart-tooltip.js';

const topSubInstancesForPie = ref<InstanceForPie[] | null>(null);
const topPubInstancesForPie = ref<InstanceForPie[] | null>(null);
const federationPubActive = ref<number | null>(null);
const federationPubActiveDiff = ref<number | null>(null);
const federationSubActive = ref<number | null>(null);
const federationSubActiveDiff = ref<number | null>(null);
const fetching = ref(true);

const { handler: externalTooltipHandler } = useChartTooltip();

onMounted(async () => {
	const chart = await misskeyApiGet('charts/federation', { limit: 2, span: 'day' });
	federationPubActive.value = chart.pubActive[0];
	federationPubActiveDiff.value = chart.pubActive[0] - chart.pubActive[1];
	federationSubActive.value = chart.subActive[0];
	federationSubActiveDiff.value = chart.subActive[0] - chart.subActive[1];

	misskeyApiGet('federation/stats', { limit: 10 }).then(res => {
		topSubInstancesForPie.value = [
			...res.topSubInstances.map(x => ({
				name: x.host,
				color: x.themeColor,
				value: x.followersCount,
				onClick: () => {
					os.pageWindow(`/instance-info/${x.host}`);
				},
			})),
			{ name: '(other)', color: '#80808080', value: res.otherFollowersCount },
		];
		topPubInstancesForPie.value = [
			...res.topPubInstances.map(x => ({
				name: x.host,
				color: x.themeColor,
				value: x.followingCount,
				onClick: () => {
					os.pageWindow(`/instance-info/${x.host}`);
				},
			})),
			{ name: '(other)', color: '#80808080', value: res.otherFollowingCount },
		];
	});

	fetching.value = false;
});
</script>

<style lang="scss" module>
.root {

	&:global {
		> .pies {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin-bottom: 12px;

			> .pie {
				position: relative;
				padding: 12px;

				> .title {
					position: absolute;
					top: 20px;
					left: 20px;
					font-size: 90%;
				}

				> .chart {
					max-height: 150px;
				}

				> .subTitle {
					position: absolute;
					bottom: 20px;
					right: 20px;
					font-size: 85%;
				}
			}
		}

		> .items {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;

			> .item {
				display: flex;
				box-sizing: border-box;
				padding: 12px;

				> .icon {
					display: grid;
					place-items: center;
					height: 100%;
					aspect-ratio: 1;
					margin-right: 12px;
					background: var(--MI_THEME-accentedBg);
					color: var(--MI_THEME-accent);
					border-radius: 10px;
				}

				&.sub {
					> .icon {
						background: #d5ba0026;
						color: #dfc300;
					}
				}

				&.pub {
					> .icon {
						background: #00cf2326;
						color: #00cd5b;
					}
				}

				> .body {
					padding: 2px 0;

					> .value {
						font-size: 1.2em;
						font-weight: bold;

						> .diff {
							font-size: 0.65em;
							font-weight: normal;
						}
					}

					> .label {
						font-size: 0.8em;
						opacity: 0.5;
					}
				}
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "dayOverDayChanges": "يوميا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "dayOverDayChanges": "Canvis ahir"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "dayOverDayChanges": "Denně"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "dayOverDayChanges": "Veränderung zu Gestern"
}
</locale>

<locale locale="en-US" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "dayOverDayChanges": "Dif diaria"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "dayOverDayChanges": "Journalier"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "dayOverDayChanges": "Harian"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "dayOverDayChanges": "Giornaliero"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "dayOverDayChanges": "前日比"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "dayOverDayChanges": "前日比"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "dayOverDayChanges": "어제보다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "dayOverDayChanges": "Dagelijkse wijzigingen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "dayOverDayChanges": "Codziennie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "dayOverDayChanges": "Dia anterior"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "dayOverDayChanges": "За день"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "dayOverDayChanges": "Medzidenné zmeny"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "dayOverDayChanges": "เทียบกับเมื่อวาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "dayOverDayChanges": "Dünkü değişiklikler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "dayOverDayChanges": "Changes to yesterday"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "dayOverDayChanges": "Доба"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "dayOverDayChanges": "Thay đổi hôm qua"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "dayOverDayChanges": "与前一日相比"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "dayOverDayChanges": "與昨日相比"
}
</locale>
