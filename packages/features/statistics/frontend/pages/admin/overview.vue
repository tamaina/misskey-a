<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 1000px;">
	<div ref="rootEl" :class="$style.root">
		<MkFoldableSection class="item">
			<template #header>Stats</template>
			<XStats/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Active users</template>
			<XActiveUsers/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Heatmap</template>
			<XHeatmap/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Retention rate</template>
			<XRetention/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Moderators</template>
			<XModerators/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Federation</template>
			<XFederation/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Instances</template>
			<XInstances/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Ap requests</template>
			<XApRequests/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>New users</template>
			<XUsers/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Deliver queue</template>
			<XQueue domain="deliver"/>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>Inbox queue</template>
			<XQueue domain="inbox"/>
		</MkFoldableSection>
	</div>
</div>
</template>

<script lang="ts" setup>
import { markRaw, onMounted, onBeforeUnmount, nextTick, shallowRef, ref, computed, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import XFederation from '@features/statistics/frontend/pages/admin/overview.federation.vue';
import XInstances from '@features/statistics/frontend/pages/admin/overview.instances.vue';
import XQueue from '@features/statistics/frontend/pages/admin/overview.queue.vue';
import XApRequests from '@features/statistics/frontend/pages/admin/overview.ap-requests.vue';
import XUsers from '@features/statistics/frontend/pages/admin/overview.users.vue';
import XActiveUsers from '@features/statistics/frontend/pages/admin/overview.active-users.vue';
import XStats from '@features/statistics/frontend/pages/admin/overview.stats.vue';
import XRetention from '@features/statistics/frontend/pages/admin/overview.retention.vue';
import XModerators from '@features/statistics/frontend/pages/admin/overview.moderators.vue';
import XHeatmap from '@features/statistics/frontend/pages/admin/overview.heatmap.vue';
import type { InstanceForPie } from '@features/statistics/frontend/pages/admin/overview.pie.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi, misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import { useStream } from '@features/api/frontend/stream.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';

const rootEl = useTemplateRef('rootEl');
const serverInfo = ref<Misskey.entities.ServerInfoResponse | null>(null);
const topSubInstancesForPie = ref<InstanceForPie[] | null>(null);
const topPubInstancesForPie = ref<InstanceForPie[] | null>(null);
const federationPubActive = ref<number | null>(null);
const federationPubActiveDiff = ref<number | null>(null);
const federationSubActive = ref<number | null>(null);
const federationSubActiveDiff = ref<number | null>(null);
const newUsers = ref<Misskey.entities.UserDetailed[] | null>(null);
const activeInstances = shallowRef<Misskey.entities.FederationInstancesResponse | null>(null);
const queueStatsConnection = markRaw(useStream().useChannel('queueStats'));
const now = new Date();
const filesPagination = {
	endpoint: 'admin/drive/files' as const,
	limit: 9,
	noPaging: true,
};

function onInstanceClick(i: Misskey.entities.FederationInstance) {
	os.pageWindow(`/instance-info/${i.host}`);
}

onMounted(async () => {
	/*
	const magicGrid = new MagicGrid({
		container: rootEl,
		static: true,
		animate: true,
	});

	magicGrid.listen();
	*/

	misskeyApiGet('charts/federation', { limit: 2, span: 'day' }).then(chart => {
		federationPubActive.value = chart.pubActive[0];
		federationPubActiveDiff.value = chart.pubActive[0] - chart.pubActive[1];
		federationSubActive.value = chart.subActive[0];
		federationSubActiveDiff.value = chart.subActive[0] - chart.subActive[1];
	});

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

	misskeyApi('admin/server-info').then(serverInfoResponse => {
		serverInfo.value = serverInfoResponse;
	});

	misskeyApi('admin/show-users', {
		limit: 5,
		sort: '+createdAt',
	}).then(res => {
		newUsers.value = res;
	});

	misskeyApi('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 25,
	}).then(res => {
		activeInstances.value = res;
	});

	nextTick(() => {
		queueStatsConnection.send('requestLog', {
			id: genId(),
			length: 100,
		});
	});
});

onBeforeUnmount(() => {
	queueStatsConnection.dispose();
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.dashboard,
	icon: 'ti ti-dashboard',
}));
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
	grid-gap: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"dashboard": "لوحة التحكم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"dashboard": "Tauler de control"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"dashboard": "Přehled"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"dashboard": "Dashboard"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"dashboard": "Dashboard"
}
</locale>

<locale locale="en-US" lang="json">
{
	"dashboard": "Dashboard"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"dashboard": "Panel de control"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"dashboard": "Tableau de bord"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"dashboard": "Dasbor"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"dashboard": "Pannello di controllo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"dashboard": "ダッシュボード"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"dashboard": "ダッシュボード"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"dashboard": "Dashboard"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"dashboard": "Dashboard"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"dashboard": "대시보드"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"dashboard": "Overzicht"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"dashboard": "Dashboard"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"dashboard": "Kokpit"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"dashboard": "Painel de controle"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"dashboard": "Панель управления"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"dashboard": "Prehľad"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"dashboard": "หน้ากระดานหลัก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"dashboard": "Gösterge paneli"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"dashboard": "Dashboard"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"dashboard": "Панель приладів"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"dashboard": "Trang chính"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"dashboard": "管理面板"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"dashboard": "儀表板"
}
</locale>
