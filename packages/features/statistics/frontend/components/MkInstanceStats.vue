<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkFoldableSection class="item">
		<template #header>Chart</template>
		<div :class="$style.chart">
			<div class="selects">
				<MkSelect v-model="chartSrc" :items="chartSrcDef" style="margin: 0; flex: 1;"></MkSelect>
				<MkSelect v-model="chartSpan" :items="chartSpanDef" style="margin: 0 0 0 10px;"></MkSelect>
			</div>
			<div class="chart _panel">
				<MkChart :src="chartSrc" :span="chartSpan" :limit="chartLimit" :detailed="true"></MkChart>
			</div>
		</div>
	</MkFoldableSection>

	<MkFoldableSection class="item">
		<template #header>Active users heatmap</template>
		<MkSelect v-model="heatmapSrc" :items="heatmapSrcDef" style="margin: 0 0 12px 0;"></MkSelect>
		<div class="_panel" :class="$style.heatmap">
			<MkHeatmap :src="heatmapSrc" :label="'Read & Write'"/>
		</div>
	</MkFoldableSection>

	<MkFoldableSection class="item">
		<template #header>Retention rate</template>
		<div class="_panel" :class="$style.retentionHeatmap">
			<MkRetentionHeatmap/>
		</div>
		<div class="_panel" :class="$style.retentionLine">
			<MkRetentionLineChart/>
		</div>
	</MkFoldableSection>

	<MkFoldableSection v-if="shouldShowFederation" class="item">
		<template #header>Federation</template>
		<div :class="$style.federation">
			<div class="pies">
				<div class="sub">
					<div class="title">Sub</div>
					<canvas ref="subDoughnutEl"></canvas>
				</div>
				<div class="pub">
					<div class="title">Pub</div>
					<canvas ref="pubDoughnutEl"></canvas>
				</div>
			</div>
		</div>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, computed, useTemplateRef } from 'vue';
import { Chart } from 'chart.js';
import type { MkSelectItem, ItemOption } from '@features/ui/frontend/components/MkSelect.vue';
import type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkChart from '@features/statistics/frontend/components/MkChart.vue';
import { useChartTooltip } from '@features/statistics/frontend/composables/use-chart-tooltip.js';
import { $i } from '@features/auth/frontend/i.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import { instance } from '@features/instance/frontend/instance.js';
import MkHeatmap from '@features/statistics/frontend/components/MkHeatmap.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import MkRetentionHeatmap from '@features/statistics/frontend/components/MkRetentionHeatmap.vue';
import MkRetentionLineChart from '@features/statistics/frontend/components/MkRetentionLineChart.vue';
import { initChart } from '@features/statistics/frontend/utility/init-chart.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { themeManager } from '@features/preferences/frontend/theme.js';

initChart();

const shouldShowFederation = computed(() => instance.federation !== 'none' || $i?.isModerator);

const chartLimit = 500;
const {
	model: chartSpan,
	def: chartSpanDef,
} = useMkSelect({
	items: [
		{ value: 'hour', label: $locale.value.sfc.perHour },
		{ value: 'day', label: $locale.value.sfc.perDay },
	],
	initialValue: 'hour',
});
const {
	model: chartSrc,
	def: chartSrcDef,
} = useMkSelect({
	items: computed<MkSelectItem<ChartSrc>[]>(() => {
		const items: MkSelectItem<ChartSrc>[] = [];

		if (shouldShowFederation.value) {
			items.push({
				type: 'group',
				label: $locale.value.sfc.federation,
				items: [
					{ value: 'federation', label: $locale.value.sfc.chartsFederation },
					{ value: 'ap-request', label: $locale.value.sfc.chartsApRequest },
				],
			});
		}

		items.push({
			type: 'group',
			label: $locale.value.sfc.users,
			items: [
				{ value: 'users', label: $locale.value.sfc.chartsUsersIncDec },
				{ value: 'users-total', label: $locale.value.sfc.chartsUsersTotal },
				{ value: 'active-users', label: $locale.value.sfc.chartsActiveUsers },
			],
		});

		const notesItems: ItemOption<ChartSrc>[] = [
			{ value: 'notes', label: $locale.value.sfc.chartsNotesIncDec },
			{ value: 'local-notes', label: $locale.value.sfc.chartsLocalNotesIncDec },
		];

		if (shouldShowFederation.value) notesItems.push({ value: 'remote-notes', label: $locale.value.sfc.chartsRemoteNotesIncDec });

		notesItems.push(
			{ value: 'notes-total', label: $locale.value.sfc.chartsNotesTotal },
		);

		items.push({
			type: 'group',
			label: $locale.value.sfc.notes,
			items: notesItems,
		});

		items.push({
			type: 'group',
			label: $locale.value.sfc.drive,
			items: [
				{ value: 'drive-files', label: $locale.value.sfc.chartsFilesIncDec },
				{ value: 'drive', label: $locale.value.sfc.chartsStorageUsageIncDec },
			],
		});

		return items;
	}),
	initialValue: 'active-users',
});
const {
	model: heatmapSrc,
	def: heatmapSrcDef,
} = useMkSelect({
	items: computed(() => [
		{ value: 'active-users' as const, label: 'Active Users' },
		{ value: 'notes' as const, label: 'Notes' },
		...(shouldShowFederation.value ? [
			{ value: 'ap-requests-inbox-received' as const, label: 'AP Requests: inboxReceived' },
			{ value: 'ap-requests-deliver-succeeded' as const, label: 'AP Requests: deliverSucceeded' },
			{ value: 'ap-requests-deliver-failed' as const, label: 'AP Requests: deliverFailed' },
		] : []),
	]),
	initialValue: 'active-users',
});

const subDoughnutEl = useTemplateRef('subDoughnutEl');
const pubDoughnutEl = useTemplateRef('pubDoughnutEl');

let subDoughnutChartInstance: Chart | null = null;
let pubDoughnutChartInstance: Chart | null = null;

const { handler: externalTooltipHandler1 } = useChartTooltip({
	position: 'middle',
});
const { handler: externalTooltipHandler2 } = useChartTooltip({
	position: 'middle',
});

type ChartData = {
	name: string,
	color: string,
	value: number,
	onClick?: () => void,
}[];

function createDoughnut(chartEl: HTMLCanvasElement, tooltip: ReturnType<typeof useChartTooltip>['handler'], data: ChartData) {
	const chartInstance = new Chart(chartEl, {
		type: 'doughnut',
		data: {
			labels: data.map(x => x.name),
			datasets: [{
				backgroundColor: data.map(x => x.color),
				borderColor: themeManager.currentCompiledTheme!.panel,
				borderWidth: 2,
				hoverOffset: 0,
				data: data.map(x => x.value),
			}],
		},
		options: {
			maintainAspectRatio: false,
			layout: {
				padding: {
					left: 16,
					right: 16,
					top: 16,
					bottom: 16,
				},
			},
			onClick: (ev) => {
				if (ev.native == null) return;
				const hit = chartInstance.getElementsAtEventForMode(ev.native, 'nearest', { intersect: true }, false)[0];
				if (hit != null) {
					data[hit.index].onClick?.();
				}
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					mode: 'index',
					animation: {
						duration: 0,
					},
					external: tooltip,
				},
			},
		},
	});

	return chartInstance;
}

onMounted(() => {
	misskeyApiGet('federation/stats', { limit: 30 }).then(fedStats => {
		const subs: ChartData = fedStats.topSubInstances.map(x => ({
			name: x.host,
			color: x.themeColor ?? '#888888',
			value: x.followersCount,
			onClick: () => {
				os.pageWindow(`/instance-info/${x.host}`);
			},
		}));

		subs.push({
			name: '(other)',
			color: '#80808080',
			value: fedStats.otherFollowersCount,
		});

		if (subDoughnutEl.value != null) {
			subDoughnutChartInstance = createDoughnut(subDoughnutEl.value, externalTooltipHandler1, subs);
		}

		const pubs: ChartData = fedStats.topPubInstances.map(x => ({
			name: x.host,
			color: x.themeColor ?? '#888888',
			value: x.followingCount,
			onClick: () => {
				os.pageWindow(`/instance-info/${x.host}`);
			},
		}));

		pubs.push({
			name: '(other)',
			color: '#80808080',
			value: fedStats.otherFollowingCount,
		});

		if (pubDoughnutEl.value != null) {
			pubDoughnutChartInstance = createDoughnut(pubDoughnutEl.value, externalTooltipHandler2, pubs);
		}
	});
});

onUnmounted(() => {
	subDoughnutChartInstance?.destroy();
	pubDoughnutChartInstance?.destroy();
});
</script>

<style lang="scss" module>
.root {
	&:global {
		> .item {
			margin-bottom: 16px;
		}
	}
}

.chart {
	&:global {
		> .selects {
			display: flex;
			margin-bottom: 12px;
		}

		> .chart {
			padding: 16px;
		}
	}
}

.heatmap {
	padding: 16px;
	margin-bottom: 16px;
}

.retentionHeatmap {
	padding: 16px;
	margin-bottom: 16px;
}

.retentionLine {
	padding: 16px;
	margin-bottom: 16px;
}

.federation {
	&:global {
		> .pies {
			display: flex;
			gap: 16px;

			> .sub, > .pub {
				flex: 1;
				min-width: 0;
				position: relative;
				background: var(--MI_THEME-panel);
				border-radius: var(--MI-radius);
				padding: 24px;
				max-height: 300px;

				> .title {
					position: absolute;
					top: 24px;
					left: 24px;
				}
			}

			@media (max-width: 600px) {
				flex-direction: column;
			}
		}
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"perHour": "في الساعة",
	"perDay": "في اليوم",
	"federation": "الفديرالية",
	"chartsFederation": "الفديرالية",
	"chartsApRequest": "الطلبات",
	"users": "المستخدمون",
	"chartsUsersIncDec": "تباين عدد المستخدمين",
	"chartsUsersTotal": "مجموع عدد المستخدمين والمستخدمات",
	"chartsActiveUsers": "المستخدمون النشطون",
	"chartsNotesIncDec": "تباين عدد الملاحظات",
	"chartsLocalNotesIncDec": "تباين عدد الملاحظات المحلية",
	"chartsRemoteNotesIncDec": "تباين عدد الملاحظات البعيدة",
	"chartsNotesTotal": "إجمالي الملاحظات",
	"notes": "الملاحظات",
	"drive": "قرص التخرين",
	"chartsFilesIncDec": "تباين عدد الملفات",
	"chartsStorageUsageIncDec": "التباين في استغلال مساحة التخزين"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"perHour": "Per hora",
	"perDay": "Per dia",
	"federation": "Federació",
	"chartsFederation": "Federació",
	"chartsApRequest": "Peticions",
	"users": "Usuaris",
	"chartsUsersIncDec": "Diferència entre el nombre d'usuaris",
	"chartsUsersTotal": "Nombre total d'usuaris",
	"chartsActiveUsers": "Usuaris actius",
	"chartsNotesIncDec": "Diferència entre el nombre de notes",
	"chartsLocalNotesIncDec": "Diferencia en el nombre de notes locals",
	"chartsRemoteNotesIncDec": "Diferencia en el nombre de notes remotes",
	"chartsNotesTotal": "Nombre total de notes",
	"notes": "Notes",
	"drive": "Disc",
	"chartsFilesIncDec": "Diferencia en el nombre de fitxers",
	"chartsStorageUsageIncDec": "Diferencia en l'emmagatzematge usat"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"perHour": "za hodinu",
	"perDay": "za den",
	"federation": "Federace",
	"chartsFederation": "Federace",
	"chartsApRequest": "Požadavek",
	"users": "Uživatelé",
	"chartsUsersIncDec": "Rozdíl v počtech uživatelů",
	"chartsUsersTotal": "Celkem uživatelů",
	"chartsActiveUsers": "Aktivní uživatelé",
	"chartsNotesIncDec": "Rozdíl v počtu poznámek",
	"chartsLocalNotesIncDec": "Rozdíl v počtu místních poznámek",
	"chartsRemoteNotesIncDec": "Rozdíl v počtu vzdálených poznámek",
	"chartsNotesTotal": "Celkový počet poznámek",
	"notes": "Poznámky",
	"drive": "Úložiště",
	"chartsFilesIncDec": "Rozdíl v počtu souborů",
	"chartsStorageUsageIncDec": "Rozdíl ve využití úložiště"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"perHour": "Per Hour",
	"perDay": "Per Day",
	"federation": "Federation",
	"chartsFederation": "Federation",
	"chartsApRequest": "Requests",
	"users": "Users",
	"chartsUsersIncDec": "Difference in the number of users",
	"chartsUsersTotal": "Total number of users",
	"chartsActiveUsers": "Active users",
	"chartsNotesIncDec": "Difference in the number of notes",
	"chartsLocalNotesIncDec": "Difference in the number of local notes",
	"chartsRemoteNotesIncDec": "Difference in the number of remote notes",
	"chartsNotesTotal": "Total number of notes",
	"notes": "Notes",
	"drive": "Drive",
	"chartsFilesIncDec": "Difference in the number of files",
	"chartsStorageUsageIncDec": "Difference in storage usage"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"perHour": "Pro Stunde",
	"perDay": "Pro Tag",
	"federation": "Föderation",
	"chartsFederation": "Föderation",
	"chartsApRequest": "Anfragen",
	"users": "Benutzer",
	"chartsUsersIncDec": "Unterschied in der Anzahl von Benutzern",
	"chartsUsersTotal": "Anzahl aller Benutzer",
	"chartsActiveUsers": "Aktive Benutzer",
	"chartsNotesIncDec": "Unterschied in der Anzahl an Notizen",
	"chartsLocalNotesIncDec": "Unterschied in der Anzahl an lokalen Notizen",
	"chartsRemoteNotesIncDec": "Unterschied in der Anzahl an Notizen von fremden Instanzen",
	"chartsNotesTotal": "Anzahl aller Notizen",
	"notes": "Notizen",
	"drive": "Drive",
	"chartsFilesIncDec": "Unterschied in der Anzahl an Dateien",
	"chartsStorageUsageIncDec": "Unterschied in der Höhe der Speichernutzung"
}
</locale>

<locale lang="json" locale="en-US">
{
	"perHour": "Per Hour",
	"perDay": "Per Day",
	"federation": "Federation",
	"chartsFederation": "Federation",
	"chartsApRequest": "Requests",
	"users": "Users",
	"chartsUsersIncDec": "Difference in the number of users",
	"chartsUsersTotal": "Total number of users",
	"chartsActiveUsers": "Active users",
	"chartsNotesIncDec": "Difference in the number of notes",
	"chartsLocalNotesIncDec": "Difference in the number of local notes",
	"chartsRemoteNotesIncDec": "Difference in the number of remote notes",
	"chartsNotesTotal": "Total number of notes",
	"notes": "Notes",
	"drive": "Drive",
	"chartsFilesIncDec": "Difference in the number of files",
	"chartsStorageUsageIncDec": "Difference in storage usage"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"perHour": "por hora",
	"perDay": "por día",
	"federation": "Federación",
	"chartsFederation": "Federación",
	"chartsApRequest": "Pedidos",
	"users": "Usuarios",
	"chartsUsersIncDec": "Variación de usuarios",
	"chartsUsersTotal": "Total de usuarios",
	"chartsActiveUsers": "Cantidad de usuarios activos",
	"chartsNotesIncDec": "Variación de la cantidad de notas",
	"chartsLocalNotesIncDec": "Variación de la cantidad de notas locales",
	"chartsRemoteNotesIncDec": "Variación de la cantidad de notas remotas",
	"chartsNotesTotal": "Total de notas",
	"notes": "Notas",
	"drive": "Drive",
	"chartsFilesIncDec": "Variación de cantidad de archivos",
	"chartsStorageUsageIncDec": "Variación de uso del almacenamiento"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"perHour": "par heure",
	"perDay": "par jour",
	"federation": "Fédération",
	"chartsFederation": "Fédération",
	"chartsApRequest": "Requêtes",
	"users": "Utilisateur·rice·s",
	"chartsUsersIncDec": "Variation du nombre d'utilisateur·rice·s",
	"chartsUsersTotal": "Nombre des utilisateur·rice·s au total",
	"chartsActiveUsers": "Nombre d'utilisateurices actif·ve·s",
	"chartsNotesIncDec": "Variation du nombre des notes",
	"chartsLocalNotesIncDec": "Variation du nombre de notes locales",
	"chartsRemoteNotesIncDec": "Variation du nombre de notes distantes",
	"chartsNotesTotal": "Nombre total des notes",
	"notes": "Notes",
	"drive": "Disque",
	"chartsFilesIncDec": "Variation du nombre de fichiers",
	"chartsStorageUsageIncDec": "Variation de l'utilisation du stockage"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"perHour": "per Jam",
	"perDay": "per Hari",
	"federation": "Federasi",
	"chartsFederation": "Federasi",
	"chartsApRequest": "Permintaan",
	"users": "Pengguna",
	"chartsUsersIncDec": "Perbedaan dalam # pengguna",
	"chartsUsersTotal": "Jumlah # pengguna",
	"chartsActiveUsers": "Pengguna aktif",
	"chartsNotesIncDec": "Perbedaan # dalam catatan",
	"chartsLocalNotesIncDec": "Perbedaan # dalam catatan lokal",
	"chartsRemoteNotesIncDec": "Perbedaan # dalam catatan instansi luar",
	"chartsNotesTotal": "Total # catatan",
	"notes": "Catatan",
	"drive": "Drive",
	"chartsFilesIncDec": "Perbedaan # dalam berkas",
	"chartsStorageUsageIncDec": "Perbedaan dalam penggunaan penyimpanan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"perHour": "orario",
	"perDay": "giornaliero",
	"federation": "Federazione",
	"chartsFederation": "Federazione",
	"chartsApRequest": "Richieste",
	"users": "Profili",
	"chartsUsersIncDec": "Variazione del numero di utenti",
	"chartsUsersTotal": "Numero totale di utenti",
	"chartsActiveUsers": "Numero di utenti attivi",
	"chartsNotesIncDec": "Variazione del numero di note",
	"chartsLocalNotesIncDec": "Variazione del numero di note locali",
	"chartsRemoteNotesIncDec": "Variazione del numero di note distanti",
	"chartsNotesTotal": "Numero di note in totale",
	"notes": "Note",
	"drive": "Drive",
	"chartsFilesIncDec": "Variazione del numero dei file",
	"chartsStorageUsageIncDec": "Variazione dell'utilizzo dell'immagazzinamento"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"perHour": "1時間ごと",
	"perDay": "1日ごと",
	"federation": "連合",
	"chartsFederation": "連合",
	"chartsApRequest": "リクエスト",
	"users": "ユーザー",
	"chartsUsersIncDec": "ユーザーの増減",
	"chartsUsersTotal": "ユーザーの合計",
	"chartsActiveUsers": "アクティブユーザー数",
	"chartsNotesIncDec": "ノートの増減",
	"chartsLocalNotesIncDec": "ローカルのノートの増減",
	"chartsRemoteNotesIncDec": "リモートのノートの増減",
	"chartsNotesTotal": "ノートの合計",
	"notes": "ノート",
	"drive": "ドライブ",
	"chartsFilesIncDec": "ファイルの増減",
	"chartsStorageUsageIncDec": "ストレージ使用量の増減"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"perHour": "1時間ごと",
	"perDay": "1日ごと",
	"federation": "連合",
	"chartsFederation": "連合",
	"chartsApRequest": "リクエスト",
	"users": "ユーザー",
	"chartsUsersIncDec": "ユーザーの増減",
	"chartsUsersTotal": "ユーザーの合計",
	"chartsActiveUsers": "いまおるユーザー数",
	"chartsNotesIncDec": "ノートの増減",
	"chartsLocalNotesIncDec": "ローカルのノートの増減",
	"chartsRemoteNotesIncDec": "リモートのノートの増減",
	"chartsNotesTotal": "ノートの合計",
	"notes": "ノート",
	"drive": "ドライブ",
	"chartsFilesIncDec": "ファイルの増減",
	"chartsStorageUsageIncDec": "ストレージ使用量の増減"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"perHour": "Per Hour",
	"perDay": "Per Day",
	"federation": "Federation",
	"chartsFederation": "Federation",
	"chartsApRequest": "Requests",
	"users": "Users",
	"chartsUsersIncDec": "Difference in the number of users",
	"chartsUsersTotal": "Total number of users",
	"chartsActiveUsers": "Active users",
	"chartsNotesIncDec": "Difference in the number of notes",
	"chartsLocalNotesIncDec": "Difference in the number of local notes",
	"chartsRemoteNotesIncDec": "Difference in the number of remote notes",
	"chartsNotesTotal": "Total number of notes",
	"notes": "Notes",
	"drive": "Drive",
	"chartsFilesIncDec": "Difference in the number of files",
	"chartsStorageUsageIncDec": "Difference in storage usage"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"perHour": "Per Hour",
	"perDay": "Per Day",
	"federation": "Federation",
	"chartsFederation": "Federation",
	"chartsApRequest": "Requests",
	"users": "ಬಳಕೆದಾರ",
	"chartsUsersIncDec": "Difference in the number of users",
	"chartsUsersTotal": "Total number of users",
	"chartsActiveUsers": "Active users",
	"chartsNotesIncDec": "Difference in the number of notes",
	"chartsLocalNotesIncDec": "Difference in the number of local notes",
	"chartsRemoteNotesIncDec": "Difference in the number of remote notes",
	"chartsNotesTotal": "Total number of notes",
	"notes": "Notes",
	"drive": "Drive",
	"chartsFilesIncDec": "Difference in the number of files",
	"chartsStorageUsageIncDec": "Difference in storage usage"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"perHour": "1시간마다",
	"perDay": "1일마다",
	"federation": "연합",
	"chartsFederation": "연합",
	"chartsApRequest": "요청",
	"users": "유저",
	"chartsUsersIncDec": "유저 수 증감",
	"chartsUsersTotal": "유저 수 합계",
	"chartsActiveUsers": "활동 유저 수",
	"chartsNotesIncDec": "노트 수 증감",
	"chartsLocalNotesIncDec": "로컬 노트 수 증감",
	"chartsRemoteNotesIncDec": "리모트 노트 수 증감",
	"chartsNotesTotal": "노트 수 합계",
	"notes": "노트",
	"drive": "드라이브",
	"chartsFilesIncDec": "파일 수 증감",
	"chartsStorageUsageIncDec": "스토리지 사용량 증감"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"perHour": "Per uur",
	"perDay": "Per dag",
	"federation": "Federatie",
	"chartsFederation": "Federatie",
	"chartsApRequest": "Requests",
	"users": "Gebruikers",
	"chartsUsersIncDec": "Difference in the number of users",
	"chartsUsersTotal": "Total number of users",
	"chartsActiveUsers": "Active users",
	"chartsNotesIncDec": "Difference in the number of notes",
	"chartsLocalNotesIncDec": "Difference in the number of local notes",
	"chartsRemoteNotesIncDec": "Difference in the number of remote notes",
	"chartsNotesTotal": "Total number of notes",
	"notes": "Notities",
	"drive": "Schijf",
	"chartsFilesIncDec": "Difference in the number of files",
	"chartsStorageUsageIncDec": "Difference in storage usage"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"perHour": "Per time",
	"perDay": "Per dag",
	"federation": "Føderasjon",
	"chartsFederation": "Føderasjon",
	"chartsApRequest": "Requests",
	"users": "Brukere",
	"chartsUsersIncDec": "Difference in the number of users",
	"chartsUsersTotal": "Total number of users",
	"chartsActiveUsers": "Active users",
	"chartsNotesIncDec": "Difference in the number of notes",
	"chartsLocalNotesIncDec": "Difference in the number of local notes",
	"chartsRemoteNotesIncDec": "Difference in the number of remote notes",
	"chartsNotesTotal": "Total number of notes",
	"notes": "Notes",
	"drive": "Drive",
	"chartsFilesIncDec": "Forskjell på antall filer",
	"chartsStorageUsageIncDec": "Difference in storage usage"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"perHour": "co godzinę",
	"perDay": "co dzień",
	"federation": "Federacja",
	"chartsFederation": "Federacja",
	"chartsApRequest": "Żądania",
	"users": "Użytkownicy",
	"chartsUsersIncDec": "Różnica w liczbie użytkowników",
	"chartsUsersTotal": "Łącznie # użytkowników",
	"chartsActiveUsers": "Aktywni użytkownicy",
	"chartsNotesIncDec": "Różnica w liczbie wpisów",
	"chartsLocalNotesIncDec": "Difference in the number of local notes",
	"chartsRemoteNotesIncDec": "Difference in the number of remote notes",
	"chartsNotesTotal": "Całkowita liczba wpisów",
	"notes": "Wpisy",
	"drive": "Dysk",
	"chartsFilesIncDec": "Różnica w liczbie plików",
	"chartsStorageUsageIncDec": "Różnica w wykorzystaniu pamięci"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"perHour": "Por Hora",
	"perDay": "Por dia",
	"federation": "Federação",
	"chartsFederation": "União",
	"chartsApRequest": "Solicitações",
	"users": "Usuários",
	"chartsUsersIncDec": "Diferença no número de usuários",
	"chartsUsersTotal": "Número total de usuários",
	"chartsActiveUsers": "Usuários ativos",
	"chartsNotesIncDec": "Diferença no número de notas",
	"chartsLocalNotesIncDec": "Diferença no número de notas locais",
	"chartsRemoteNotesIncDec": "Diferença no número de notas remotas",
	"chartsNotesTotal": "Número total de notas",
	"notes": "Posts",
	"drive": "Drive",
	"chartsFilesIncDec": "Diferença no número de arquivos",
	"chartsStorageUsageIncDec": "Diferença no uso de armazenamento"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"perHour": "По часам",
	"perDay": "По дням",
	"federation": "Федерация",
	"chartsFederation": "Федерация",
	"chartsApRequest": "Запросы",
	"users": "Пользователи",
	"chartsUsersIncDec": "Изменение числа пользователей",
	"chartsUsersTotal": "Количество пользователей",
	"chartsActiveUsers": "Активные пользователи",
	"chartsNotesIncDec": "Изменение числа заметок",
	"chartsLocalNotesIncDec": "Изменения числа локальных заметок",
	"chartsRemoteNotesIncDec": "Изменения числа заметок с других сайтов",
	"chartsNotesTotal": "Общее количество заметок",
	"notes": "Заметки",
	"drive": "Диск",
	"chartsFilesIncDec": "Изменения числа файлов",
	"chartsStorageUsageIncDec": "Изменения заполнения хранилища"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"perHour": "za hodinu",
	"perDay": "za deň",
	"federation": "Federácia",
	"chartsFederation": "Federácia",
	"chartsApRequest": "Žiadosti",
	"users": "Používatelia",
	"chartsUsersIncDec": "Rozdiel v počte používateľov",
	"chartsUsersTotal": "Celkový počet používateľov",
	"chartsActiveUsers": "Aktívni používatelia",
	"chartsNotesIncDec": "Rozdiel v počte poznámok",
	"chartsLocalNotesIncDec": "Rozdiel v počte lokálnych poznámok",
	"chartsRemoteNotesIncDec": "Rozdiel v počte vzdialených poznámok",
	"chartsNotesTotal": "Celkový počet poznámok",
	"notes": "Poznámky",
	"drive": "Disk",
	"chartsFilesIncDec": "Rozdiel v počte súborov",
	"chartsStorageUsageIncDec": "Rozdiel využitého úložiska"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"perHour": "ต่อชั่วโมง",
	"perDay": "ต่อวัน",
	"federation": "สหพันธ์",
	"chartsFederation": "สหพันธ์",
	"chartsApRequest": "คำขอ",
	"users": "ผู้ใช้",
	"chartsUsersIncDec": "การเพิ่มลดของจำนวนผู้ใช้",
	"chartsUsersTotal": "จำนวนผู้ใช้งานทั้งหมด",
	"chartsActiveUsers": "จำนวนผู้ใช้งานที่ยังมีความเคลื่อนไหวอยู่",
	"chartsNotesIncDec": "การเพิ่มลดของจำนวนโน้ต",
	"chartsLocalNotesIncDec": "การเพิ่มลดของจำนวนโน้ตท้องถิ่น",
	"chartsRemoteNotesIncDec": "การเพิ่มลดของจำนวนโน้ตระยะไกล",
	"chartsNotesTotal": "จำนวนโน้ตทั้งหมด",
	"notes": " โน้ต",
	"drive": "ไดรฟ์",
	"chartsFilesIncDec": "การเพิ่มลดของจำนวนไฟล์",
	"chartsStorageUsageIncDec": "การเพิ่มลดในการใช้พื้นที่เก็บข้อมูล"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"perHour": "Saatlik",
	"perDay": "Günlük",
	"federation": "Federasyon",
	"chartsFederation": "Federasyon",
	"chartsApRequest": "Talepler",
	"users": "Kullanıcılar",
	"chartsUsersIncDec": "Kullanıcı sayısındaki fark",
	"chartsUsersTotal": "Toplam kullanıcı sayısı",
	"chartsActiveUsers": "Aktif kullanıcılar",
	"chartsNotesIncDec": "Not sayısındaki fark",
	"chartsLocalNotesIncDec": "Yerel notaların sayısındaki fark",
	"chartsRemoteNotesIncDec": "Uzak notların sayısındaki fark",
	"chartsNotesTotal": "Toplam not sayısı",
	"notes": "Notlar",
	"drive": "Drive",
	"chartsFilesIncDec": "Dosya sayısındaki fark",
	"chartsStorageUsageIncDec": "Depolama kullanımı farkı"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"perHour": "Per Hour",
	"perDay": "Per Day",
	"federation": "Federation",
	"chartsFederation": "Federation",
	"chartsApRequest": "Requests",
	"users": "Users",
	"chartsUsersIncDec": "Difference in the number of users",
	"chartsUsersTotal": "Total number of users",
	"chartsActiveUsers": "Active users",
	"chartsNotesIncDec": "Difference in the number of notes",
	"chartsLocalNotesIncDec": "Difference in the number of local notes",
	"chartsRemoteNotesIncDec": "Difference in the number of remote notes",
	"chartsNotesTotal": "Total number of notes",
	"notes": "Notes",
	"drive": "Drive",
	"chartsFilesIncDec": "Difference in the number of files",
	"chartsStorageUsageIncDec": "Difference in storage usage"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"perHour": "Щогодинно",
	"perDay": "Щоденно",
	"federation": "Федіверс",
	"chartsFederation": "Федіверс",
	"chartsApRequest": "Запити",
	"users": "Користувачі",
	"chartsUsersIncDec": "Зміни кількості користувачів",
	"chartsUsersTotal": "Загальна кількість користувачів",
	"chartsActiveUsers": "Активні користувачі",
	"chartsNotesIncDec": "Зміни кількості нотаток",
	"chartsLocalNotesIncDec": "Зміни кількості локальних нотаток",
	"chartsRemoteNotesIncDec": "Зміни кількості віддалених нотаток",
	"chartsNotesTotal": "Загальна кількість нотаток",
	"notes": "Записи",
	"drive": "Диск",
	"chartsFilesIncDec": "Зміни кількості файлів",
	"chartsStorageUsageIncDec": "Difference in storage usage"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"perHour": "Mỗi Giờ",
	"perDay": "Mỗi Ngày",
	"federation": "Liên hợp",
	"chartsFederation": "Liên hợp",
	"chartsApRequest": "Yêu cầu",
	"users": "Người dùng",
	"chartsUsersIncDec": "Sự khác biệt về số lượng người dùng",
	"chartsUsersTotal": "Tổng số người dùng",
	"chartsActiveUsers": "Số người đang hoạt động",
	"chartsNotesIncDec": "Sự khác biệt về số lượng tút",
	"chartsLocalNotesIncDec": "Sự khác biệt về số lượng tút máy chủ này",
	"chartsRemoteNotesIncDec": "Sự khác biệt về số lượng tút từ máy chủ khác",
	"chartsNotesTotal": "Tổng số sút",
	"notes": "Bài Viết",
	"drive": "Ổ đĩa",
	"chartsFilesIncDec": "Sự khác biệt về số lượng tập tin",
	"chartsStorageUsageIncDec": "Sự khác biệt về dung lượng lưu trữ"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"perHour": "每小时",
	"perDay": "每天",
	"federation": "联邦",
	"chartsFederation": "联邦",
	"chartsApRequest": "请求",
	"users": "用户",
	"chartsUsersIncDec": "用户数量：增加/减少",
	"chartsUsersTotal": "用户总数",
	"chartsActiveUsers": "活跃用户数",
	"chartsNotesIncDec": "帖子：增加/减少",
	"chartsLocalNotesIncDec": "本地帖子量增减",
	"chartsRemoteNotesIncDec": "远程帖子量增减",
	"chartsNotesTotal": "帖子总数",
	"notes": "帖子",
	"drive": "网盘",
	"chartsFilesIncDec": "文件总数增减",
	"chartsStorageUsageIncDec": "存储空间用量增减"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"perHour": "每小時",
	"perDay": "每日",
	"federation": "站台聯邦",
	"chartsFederation": "聯邦宇宙",
	"chartsApRequest": "請求",
	"users": "使用者",
	"chartsUsersIncDec": "使用者增減",
	"chartsUsersTotal": "使用者合計",
	"chartsActiveUsers": "活躍使用者",
	"chartsNotesIncDec": "貼文増減",
	"chartsLocalNotesIncDec": "本地貼文増減",
	"chartsRemoteNotesIncDec": "遠端貼文數目增减",
	"chartsNotesTotal": "貼文總數",
	"notes": "貼文",
	"drive": "雲端硬碟",
	"chartsFilesIncDec": "檔案增減",
	"chartsStorageUsageIncDec": "儲存空間增減"
}
</locale>
