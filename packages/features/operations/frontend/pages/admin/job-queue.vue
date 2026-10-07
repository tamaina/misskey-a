<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer">
		<div v-if="tab === '-'" class="_gaps">
			<div :class="$style.queues">
				<div v-for="q in queueInfos" :key="q.name" :class="$style.queue" @click="tab = q.name">
					<div style="display: flex; align-items: center; font-weight: bold;"><i class="ti ti-http-que" style="margin-right: 0.5em;"></i>{{ q.name }}<i v-if="!q.isPaused" style="color: var(--MI_THEME-success); margin-left: auto;" class="ti ti-player-play"></i></div>
					<div :class="$style.queueCounts">
						<MkKeyValue>
							<template #key>Active</template>
							<template #value>{{ kmg(q.counts.active, 2) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Delayed</template>
							<template #value>{{ kmg(q.counts.delayed, 2) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Waiting</template>
							<template #value>{{ kmg(q.counts.waiting, 2) }}</template>
						</MkKeyValue>
					</div>
					<XChart :dataSet="{ completed: q.metrics.completed.data, failed: q.metrics.failed.data }"/>
				</div>
			</div>
		</div>
		<div v-else-if="queueInfo" class="_gaps">
			<MkFolder :defaultOpen="true">
				<template #label>Overview: {{ tab }}</template>
				<template #icon><i class="ti ti-http-que"></i></template>
				<template #suffix>#{{ queueInfo.db.processId }}:{{ queueInfo.db.port }} / {{ queueInfo.db.runId }}</template>
				<template #caption>{{ queueInfo.qualifiedName }}</template>
				<template #footer>
					<div class="_buttons">
						<MkButton rounded @click="promoteAllJobs"><i class="ti ti-player-track-next"></i> Promote all jobs</MkButton>
						<!-- <MkButton rounded @click="createJob"><i class="ti ti-plus"></i> Add job</MkButton> -->
						<MkButton v-if="queueInfo.isPaused" rounded @click="resumeQueue"><i class="ti ti-player-play"></i> Resume queue</MkButton>
						<MkButton v-else rounded danger @click="pauseQueue"><i class="ti ti-player-pause"></i> Pause queue</MkButton>
						<MkButton rounded danger @click="clearQueue"><i class="ti ti-trash"></i> Empty queue</MkButton>
					</div>
				</template>

				<div class="_gaps">
					<XChart :dataSet="{ completed: queueInfo.metrics.completed.data, failed: queueInfo.metrics.failed.data }" :aspectRatio="5"/>
					<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
						<MkKeyValue>
							<template #key>Active</template>
							<template #value>{{ kmg(queueInfo.counts.active, 2) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Delayed</template>
							<template #value>{{ kmg(queueInfo.counts.delayed, 2) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Waiting</template>
							<template #value>{{ kmg(queueInfo.counts.waiting, 2) }}</template>
						</MkKeyValue>
					</div>
					<hr>
					<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
						<MkKeyValue>
							<template #key>Clients: Connected</template>
							<template #value>{{ queueInfo.db.clients.connected }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Clients: Blocked</template>
							<template #value>{{ queueInfo.db.clients.blocked }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Memory: Peak</template>
							<template #value>{{ bytes(queueInfo.db.memory.peak, 1) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Memory: Total</template>
							<template #value>{{ bytes(queueInfo.db.memory.total, 1) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Memory: Used</template>
							<template #value>{{ bytes(queueInfo.db.memory.used, 1) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>Uptime</template>
							<template #value>{{ queueInfo.db.uptime }}</template>
						</MkKeyValue>
					</div>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="true" :withSpacer="false">
				<template #label>Jobs: {{ tab }}</template>
				<template #icon><i class="ti ti-list-check"></i></template>
				<template #suffix>&lt;A:{{ kmg(queueInfo.counts.active, 2) }}&gt; &lt;D:{{ kmg(queueInfo.counts.delayed, 2) }}&gt; &lt;W:{{ kmg(queueInfo.counts.waiting, 2) }}&gt;</template>
				<template #header>
					<MkTabs
						v-model:tab="jobState"
						:tabs="[{
							key: 'all',
							title: 'All',
							icon: 'ti ti-code-asterisk',
						}, {
							key: 'latest',
							title: 'Latest',
							icon: 'ti ti-logs',
						}, {
							key: 'completed',
							title: 'Completed',
							icon: 'ti ti-check',
						}, {
							key: 'failed',
							title: 'Failed',
							icon: 'ti ti-circle-x',
						}, {
							key: 'active',
							title: 'Active',
							icon: 'ti ti-player-play',
						}, {
							key: 'delayed',
							title: 'Delayed',
							icon: 'ti ti-clock',
						}, {
							key: 'wait',
							title: 'Waiting',
							icon: 'ti ti-hourglass-high',
						}]"
					/>
				</template>
				<template #footer>
					<div class="_buttons">
						<MkButton rounded @click="fetchJobs()"><i class="ti ti-reload"></i> Refresh view</MkButton>
						<MkButton rounded danger style="margin-left: auto;" @click="removeJobs"><i class="ti ti-trash"></i> Remove jobs</MkButton>
					</div>
				</template>

				<div class="_spacer">
					<MkInput
						v-model="searchQuery"
						:placeholder="$locale.sfc.search"
						type="search"
						style="margin-bottom: 16px;"
					>
						<template #prefix><i class="ti ti-search"></i></template>
					</MkInput>

					<MkLoading v-if="jobsFetching"/>
					<MkTl
						v-else
						:events="jobs.map((job) => ({
							id: job.id,
							timestamp: job.finishedOn ?? job.processedOn ?? job.timestamp,
							data: job,
						}))"
						groupBy="h"
						class="_monospace"
					>
						<template #right="{ event: job }">
							<XJob :job="job" :queueType="tab" style="margin: 4px 0;" @needRefresh="refreshJob(job.id)"/>
						</template>
					</MkTl>
				</div>
			</MkFolder>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { debounce } from 'throttle-debounce';
import { useInterval } from '@@/js/use-interval.js';
import XChart from '@features/operations/frontend/pages/admin/job-queue.chart.vue';
import XJob from '@features/operations/frontend/pages/admin/job-queue.job.vue';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkTabs from '@features/ui/frontend/components/MkTabs.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkTl from '@features/ui/frontend/components/MkTl.vue';
import kmg from '@features/ui/frontend/filters/kmg.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import bytes from '@features/ui/frontend/filters/bytes.js';

const tab = ref<typeof Misskey.queueTypes[number] | '-'>('-');
const jobState = ref<Misskey.entities.AdminQueueJobsRequest['state'][number] | 'all' | 'latest'>('all');
const jobs = ref<Misskey.entities.QueueJob[]>([]);
const jobsFetching = ref(true);
const queueInfos = ref<Misskey.entities.AdminQueueQueuesResponse>([]);
const queueInfo = ref<Misskey.entities.AdminQueueQueueStatsResponse | null>(null);
const searchQuery = ref('');

async function fetchQueues() {
	if (tab.value !== '-') return;
	queueInfos.value = await misskeyApi('admin/queue/queues');
}

async function fetchCurrentQueue() {
	if (tab.value === '-') return;
	queueInfo.value = await misskeyApi('admin/queue/queue-stats', { queue: tab.value });
}

async function fetchJobs() {
	if (tab.value === '-') return;
	jobsFetching.value = true;
	const state = jobState.value;
	jobs.value = await misskeyApi('admin/queue/jobs', {
		queue: tab.value,
		state: state === 'all' ? ['completed', 'failed', 'active', 'delayed', 'wait'] : state === 'latest' ? ['completed', 'failed'] : [state],
		search: searchQuery.value.trim() === '' ? undefined : searchQuery.value,
	}).then((res: Misskey.entities.AdminQueueJobsResponse) => {
		if (state === 'all') {
			res.sort((a, b) => (a.processedOn ?? a.timestamp) > (b.processedOn ?? b.timestamp) ? -1 : 1);
		} else if (state === 'latest') {
			res.sort((a, b) => a.processedOn! > b.processedOn! ? -1 : 1);
		} else if (state === 'delayed') {
			res.sort((a, b) => (a.processedOn ?? a.timestamp) > (b.processedOn ?? b.timestamp) ? -1 : 1);
		}
		return res;
	});
	jobsFetching.value = false;
}

watch([tab], async () => {
	if (tab.value === '-') {
		fetchQueues();
	} else {
		fetchCurrentQueue();
		fetchJobs();
	}
}, { immediate: true });

watch([jobState], () => {
	fetchJobs();
});

const search = debounce(1000, () => {
	fetchJobs();
});

watch([searchQuery], () => {
	search();
});

useInterval(() => {
	if (tab.value === '-') {
		fetchQueues();
	} else {
		fetchCurrentQueue();
	}
}, 1000 * 10, {
	immediate: false,
	afterMounted: true,
});

async function clearQueue() {
	if (tab.value === '-') return;

	const { canceled } = await os.confirm({
		type: 'warning',
		title: $locale.value.sfc.areYouSure,
	});
	if (canceled) return;

	os.apiWithDialog('admin/queue/clear', { queue: tab.value, state: '*' });

	fetchCurrentQueue();
	fetchJobs();
}

async function promoteAllJobs() {
	if (tab.value === '-') return;

	const { canceled } = await os.confirm({
		type: 'warning',
		title: $locale.value.sfc.areYouSure,
	});
	if (canceled) return;

	os.apiWithDialog('admin/queue/promote-jobs', { queue: tab.value });

	fetchCurrentQueue();
	fetchJobs();
}

async function pauseQueue() {
	if (tab.value === '-') return;

	const { canceled } = await os.confirm({
		type: 'warning',
		title: $locale.value.sfc.areYouSure,
	});
	if (canceled) return;

	await os.apiWithDialog('admin/queue/pause', { queue: tab.value });

	fetchCurrentQueue();
	fetchJobs();
}

async function resumeQueue() {
	if (tab.value === '-') return;

	await os.apiWithDialog('admin/queue/resume', { queue: tab.value });

	fetchCurrentQueue();
	fetchJobs();
}

async function removeJobs() {
	if (tab.value === '-' || jobState.value === 'latest') return;

	const { canceled } = await os.confirm({
		type: 'warning',
		title: $locale.value.sfc.areYouSure,
	});
	if (canceled) return;

	os.apiWithDialog('admin/queue/clear', { queue: tab.value, state: jobState.value === 'all' ? '*' : jobState.value });

	fetchCurrentQueue();
	fetchJobs();
}

async function refreshJob(jobId: string) {
	if (tab.value === '-') return;
	const newJob = await misskeyApi('admin/queue/show-job', { queue: tab.value, jobId });
	const index = jobs.value.findIndex((job) => job.id === jobId);
	if (index !== -1) {
		jobs.value[index] = newJob;
	}
}

const headerActions = computed(() => []);

const headerTabs = computed<{
	key: string;
	title: string;
	icon?: string;
}[]>(() => [{
	key: '-',
	title: $locale.value.sfc.jobQueue,
	icon: 'ti ti-list-check',
}, ...Misskey.queueTypes.map((q) => ({
	key: q,
	title: q,
}))]);

definePage(() => ({
	title: $locale.value.sfc.jobQueue,
	icon: 'ti ti-clock-play',
	needWideArea: true,
}));
</script>

<style lang="scss" module>
.queues {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 14px;
}

.queue {
	padding: 14px 18px;
	background-color: var(--MI_THEME-panel);
	border-radius: 8px;
	cursor: pointer;
}

.queueCounts {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
	gap: 8px;
	font-size: 85%;
	margin: 6px 0;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"search": "البحث",
	"areYouSure": "Are you sure?",
	"jobQueue": "قائمة الانتظار"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"search": "Cercar",
	"areYouSure": "Estàs segur?",
	"jobQueue": "Cua de feines"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"search": "Vyhledávání",
	"areYouSure": "Jste si jistí?",
	"jobQueue": "Fronta úloh"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"search": "Search",
	"areYouSure": "Are you sure?",
	"jobQueue": "Job Queue"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"search": "Suchen",
	"areYouSure": "Bist du sicher?",
	"jobQueue": "Job-Warteschlange"
}
</locale>

<locale locale="en-US" lang="json">
{
	"search": "Search",
	"areYouSure": "Are you sure?",
	"jobQueue": "Job Queue"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"search": "Buscar",
	"areYouSure": "¿Estás conforme?",
	"jobQueue": "Cola de trabajos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"search": "Rechercher",
	"areYouSure": "Êtes-vous sûr·e ?",
	"jobQueue": "File d’attente"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"search": "Cari",
	"areYouSure": "Apakah kamu yakin?",
	"jobQueue": "Antrian kerja"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"search": "Cerca",
	"areYouSure": "Confermi?",
	"jobQueue": "Coda di lavoro"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"search": "検索",
	"areYouSure": "よろしいですか？",
	"jobQueue": "ジョブキュー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"search": "探す",
	"areYouSure": "いいん？",
	"jobQueue": "ジョブキュー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"search": "Nadi",
	"areYouSure": "Are you sure?",
	"jobQueue": "Job Queue"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"search": "ಹುಡುಕು",
	"areYouSure": "Are you sure?",
	"jobQueue": "Job Queue"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"search": "검색",
	"areYouSure": "계속 진행하시겠습니까?",
	"jobQueue": "작업 대기열"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"search": "Zoeken",
	"areYouSure": "Weet je het zeker?",
	"jobQueue": "Job Queue"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"search": "Søk",
	"areYouSure": "Are you sure?",
	"jobQueue": "Job Queue"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"search": "Szukaj",
	"areYouSure": "Na pewno?",
	"jobQueue": "Kolejka zadań"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"search": "Pesquisar",
	"areYouSure": "Tem certeza?",
	"jobQueue": "Fila de tarefas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"search": "Поиск",
	"areYouSure": "Вы уверены?",
	"jobQueue": "Очередь заданий"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"search": "Hľadať",
	"areYouSure": "Are you sure?",
	"jobQueue": "Fronta úloh"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"search": "ค้นหา",
	"areYouSure": "แน่ใจแล้วใช่ไหมคะ?",
	"jobQueue": "คิวงาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"search": "Ara",
	"areYouSure": "Emin misin?",
	"jobQueue": "İşlem sırası"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"search": "ئىزدەش",
	"areYouSure": "Are you sure?",
	"jobQueue": "Job Queue"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"search": "Пошук",
	"areYouSure": "Ви впевнені?",
	"jobQueue": "Черга завдань"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"search": "Tìm kiếm",
	"areYouSure": "Bạn chắc chứ?",
	"jobQueue": "Công việc chờ xử lý"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"search": "搜索",
	"areYouSure": "你确定吗？",
	"jobQueue": "作业队列"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"search": "搜尋",
	"areYouSure": "是否確定？",
	"jobQueue": "工作佇列"
}
</locale>
