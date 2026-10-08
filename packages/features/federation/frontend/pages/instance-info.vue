<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div v-if="instance" class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div v-if="tab === 'overview'" class="_gaps_m">
			<div :class="$style.faviconAndName">
				<img v-if="faviconUrl" :src="faviconUrl" alt="" :class="$style.icon"/>
				<span :class="$style.name">{{ instance.name || `(${$locale.sfc.unknown})` }}</span>
			</div>
			<div style="display: flex; flex-direction: column; gap: 1em;">
				<MkKeyValue :copy="host" oneline>
					<template #key>Host</template>
					<template #value><span class="_monospace"><MkLink :url="`https://${host}`">{{ host }}</MkLink></span></template>
				</MkKeyValue>
				<MkKeyValue oneline>
					<template #key>{{ $locale.sfc.software }}</template>
					<template #value><span class="_monospace">{{ instance.softwareName || `(${$locale.sfc.unknown})` }} / {{ instance.softwareVersion || `(${$locale.sfc.unknown})` }}</span></template>
				</MkKeyValue>
				<MkKeyValue oneline>
					<template #key>{{ $locale.sfc.administrator }}</template>
					<template #value>{{ instance.maintainerName || `(${$locale.sfc.unknown})` }} ({{ instance.maintainerEmail || `(${$locale.sfc.unknown})` }})</template>
				</MkKeyValue>
			</div>
			<MkKeyValue>
				<template #key>{{ $locale.sfc.description }}</template>
				<template #value>{{ instance.description }}</template>
			</MkKeyValue>

			<FormSection v-if="iAmModerator">
				<template #label>Moderation</template>
				<div class="_gaps_s">
					<MkKeyValue>
						<template #key>
							{{ $locale.sfc.deliveryStatus }}
						</template>
						<template #value>
							{{ copyLocaleDictionary($locale.sfc.deliveryTypeLabels)[suspensionState] }}
						</template>
					</MkKeyValue>
					<MkButton v-if="suspensionState === 'none'" :disabled="!instance" danger @click="stopDelivery">{{ $locale.sfc.deliveryStop }}</MkButton>
					<MkButton v-if="suspensionState !== 'none'" :disabled="!instance || suspensionState == 'softwareSuspended'" @click="resumeDelivery">{{ $locale.sfc.deliveryResume }}</MkButton>
					<MkSwitch v-model="isBlocked" :disabled="!meta || !instance" @update:modelValue="toggleBlock">{{ $locale.sfc.blockThisInstance }}</MkSwitch>
					<MkSwitch v-model="isSilenced" :disabled="!meta || !instance" @update:modelValue="toggleSilenced">{{ $locale.sfc.silenceThisInstance }}</MkSwitch>
					<MkSwitch v-model="isMediaSilenced" :disabled="!meta || !instance" @update:modelValue="toggleMediaSilenced">{{ $locale.sfc.mediaSilenceThisInstance }}</MkSwitch>
					<MkButton @click="refreshMetadata"><i class="ti ti-refresh"></i> Refresh metadata</MkButton>
					<MkTextarea v-model="moderationNote" manualSave>
						<template #label>{{ $locale.sfc.moderationNote }}</template>
						<template #caption>{{ $locale.sfc.moderationNoteDescription }}</template>
					</MkTextarea>
				</div>
			</FormSection>

			<FormSection>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ $locale.sfc.registeredAt }}</template>
					<template #value><MkTime mode="detail" :time="instance.firstRetrievedAt"/></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ $locale.sfc.updatedAt }}</template>
					<template #value><MkTime mode="detail" :time="instance.infoUpdatedAt"/></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ $locale.sfc.latestRequestReceivedAt }}</template>
					<template #value><MkTime v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></template>
				</MkKeyValue>
			</FormSection>

			<FormSection>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>Following (Pub)</template>
					<template #value>{{ number(instance.followingCount) }}</template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>Followers (Sub)</template>
					<template #value>{{ number(instance.followersCount) }}</template>
				</MkKeyValue>
			</FormSection>

			<FormSection>
				<template #label>Well-known resources</template>
				<FormLink :to="`https://${host}/.well-known/host-meta`" external style="margin-bottom: 8px;">host-meta</FormLink>
				<FormLink :to="`https://${host}/.well-known/host-meta.json`" external style="margin-bottom: 8px;">host-meta.json</FormLink>
				<FormLink :to="`https://${host}/.well-known/nodeinfo`" external style="margin-bottom: 8px;">nodeinfo</FormLink>
				<FormLink :to="`https://${host}/robots.txt`" external style="margin-bottom: 8px;">robots.txt</FormLink>
				<FormLink :to="`https://${host}/manifest.json`" external style="margin-bottom: 8px;">manifest.json</FormLink>
			</FormSection>
		</div>
		<div v-else-if="tab === 'chart'" class="_gaps_m">
			<div>
				<div :class="$style.selects">
					<MkSelect v-model="chartSrc" :items="chartSrcDef" style="margin: 0 10px 0 0; flex: 1;">
					</MkSelect>
				</div>
				<div>
					<div :class="$style.label">{{ interpolateLocaleParameters($locale.sfc.recentNHours, { n: 90 }) }}</div>
					<MkChart :src="chartSrc" span="hour" :limit="90" :args="{ host: host }" :detailed="true"></MkChart>
					<div :class="$style.label">{{ interpolateLocaleParameters($locale.sfc.recentNDays, { n: 90 }) }}</div>
					<MkChart :src="chartSrc" span="day" :limit="90" :args="{ host: host }" :detailed="true"></MkChart>
				</div>
			</div>
		</div>
		<div v-else-if="tab === 'users'" class="_gaps_m">
			<MkPagination v-slot="{ items }" :paginator="usersPaginator">
				<div :class="$style.users">
					<MkA v-for="user in items" :key="user.id" v-tooltip.mfm="`Last posted: ${user.updatedAt ? dateString(user.updatedAt) : 'unknown'}`" :to="`/admin/user/${user.id}`">
						<MkUserCardMini :user="user"/>
					</MkA>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'raw'" class="_gaps_m">
			<MkObjectView tall :value="instance">
			</MkObjectView>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, watch, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import type { ChartSrc } from '@features/statistics/frontend/components/MkChart.vue';
import MkChart from '@features/statistics/frontend/components/MkChart.vue';
import MkObjectView from '@features/ui/frontend/components/MkObjectView.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import number from '@features/ui/frontend/filters/number.js';
import { iAmModerator, iAmAdmin } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { getProxiedImageUrlNullable } from '@features/drive/frontend/utility/media-proxy.js';
import { dateString } from '@features/ui/frontend/filters/date.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const props = defineProps<{
	host: string;
}>();

const tab = ref('overview');

const {
	model: chartSrc,
	def: chartSrcDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.instanceChartsRequests, value: 'instance-requests' },
		{ label: $locale.value.sfc.instanceChartsUsers, value: 'instance-users' },
		{ label: $locale.value.sfc.instanceChartsUsersTotal, value: 'instance-users-total' },
		{ label: $locale.value.sfc.instanceChartsNotes, value: 'instance-notes' },
		{ label: $locale.value.sfc.instanceChartsNotesTotal, value: 'instance-notes-total' },
		{ label: $locale.value.sfc.instanceChartsFf, value: 'instance-ff' },
		{ label: $locale.value.sfc.instanceChartsFfTotal, value: 'instance-ff-total' },
		{ label: $locale.value.sfc.instanceChartsCacheSize, value: 'instance-drive-usage' },
		{ label: $locale.value.sfc.instanceChartsCacheSizeTotal, value: 'instance-drive-usage-total' },
		{ label: $locale.value.sfc.instanceChartsFiles, value: 'instance-drive-files' },
		{ label: $locale.value.sfc.instanceChartsFilesTotal, value: 'instance-drive-files-total' },
	],
	initialValue: 'instance-requests',
});
const meta = ref<Misskey.entities.AdminMetaResponse | null>(null);
const instance = ref<Misskey.entities.FederationInstance | null>(null);
const suspensionState = ref<'none' | 'manuallySuspended' | 'goneSuspended' | 'autoSuspendedForNotResponding' | 'softwareSuspended'>('none');
const isBlocked = ref(false);
const isSilenced = ref(false);
const isMediaSilenced = ref(false);
const faviconUrl = ref<string | null>(null);
const moderationNote = ref('');

const usersPaginator = iAmModerator ? markRaw(new Paginator('admin/show-users', {
	limit: 10,
	params: {
		sort: '+updatedAt',
		state: 'all',
		hostname: props.host,
	},
	offsetMode: true,
})) : markRaw(new Paginator('users', {
	limit: 10,
	params: {
		sort: '+updatedAt',
		state: 'all',
		hostname: props.host,
	},
	offsetMode: true,
}));

if (iAmModerator) {
	watch(moderationNote, async () => {
		if (instance.value == null) return;
		await misskeyApi('admin/federation/update-instance', { host: instance.value.host, moderationNote: moderationNote.value });
	});
}

async function _fetch_(): Promise<void> {
	if (iAmAdmin) {
		meta.value = await misskeyApi('admin/meta');
	}
	instance.value = await misskeyApi('federation/show-instance', {
		host: props.host,
	});
	suspensionState.value = instance.value?.suspensionState ?? 'none';
	isBlocked.value = instance.value?.isBlocked ?? false;
	isSilenced.value = instance.value?.isSilenced ?? false;
	isMediaSilenced.value = instance.value?.isMediaSilenced ?? false;
	faviconUrl.value = getProxiedImageUrlNullable(instance.value?.faviconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.value?.iconUrl, 'preview');
	moderationNote.value = instance.value?.moderationNote ?? '';
}

async function toggleBlock(): Promise<void> {
	if (!iAmAdmin) return;
	if (!meta.value) throw new Error('No meta?');
	if (!instance.value) throw new Error('No instance?');
	const { host } = instance.value;
	await misskeyApi('admin/update-meta', {
		blockedHosts: isBlocked.value ? meta.value.blockedHosts.concat([host]) : meta.value.blockedHosts.filter(x => x !== host),
	});
}

async function toggleSilenced(): Promise<void> {
	if (!iAmAdmin) return;
	if (!meta.value) throw new Error('No meta?');
	if (!instance.value) throw new Error('No instance?');
	const { host } = instance.value;
	const silencedHosts = meta.value.silencedHosts ?? [];
	await misskeyApi('admin/update-meta', {
		silencedHosts: isSilenced.value ? silencedHosts.concat([host]) : silencedHosts.filter(x => x !== host),
	});
}

async function toggleMediaSilenced(): Promise<void> {
	if (!iAmAdmin) return;
	if (!meta.value) throw new Error('No meta?');
	if (!instance.value) throw new Error('No instance?');
	const { host } = instance.value;
	const mediaSilencedHosts = meta.value.mediaSilencedHosts ?? [];
	await misskeyApi('admin/update-meta', {
		mediaSilencedHosts: isMediaSilenced.value ? mediaSilencedHosts.concat([host]) : mediaSilencedHosts.filter(x => x !== host),
	});
}

async function stopDelivery(): Promise<void> {
	if (!iAmModerator) return;
	if (!instance.value) throw new Error('No instance?');
	suspensionState.value = 'manuallySuspended';
	await misskeyApi('admin/federation/update-instance', {
		host: instance.value.host,
		isSuspended: true,
	});
}

async function resumeDelivery(): Promise<void> {
	if (!iAmModerator) return;
	if (!instance.value) throw new Error('No instance?');
	suspensionState.value = 'none';
	await misskeyApi('admin/federation/update-instance', {
		host: instance.value.host,
		isSuspended: false,
	});
}

function refreshMetadata(): void {
	if (!iAmModerator) return;
	if (!instance.value) throw new Error('No instance?');
	misskeyApi('admin/federation/refresh-remote-instance-metadata', {
		host: instance.value.host,
	});
	os.alert({
		text: 'Refresh requested',
	});
}

_fetch_();

const headerActions = computed(() => [{
	text: `https://${props.host}`,
	icon: 'ti ti-external-link',
	handler: () => {
		window.open(`https://${props.host}`, '_blank', 'noopener');
	},
}]);

const headerTabs = computed(() => [{
	key: 'overview',
	title: $locale.value.sfc.overview,
	icon: 'ti ti-info-circle',
}, ...(iAmModerator ? [{
	key: 'chart',
	title: $locale.value.sfc.charts,
	icon: 'ti ti-chart-line',
}, {
	key: 'users',
	title: $locale.value.sfc.users,
	icon: 'ti ti-users',
}] : []), {
	key: 'raw',
	title: 'Raw',
	icon: 'ti ti-code',
}]);

definePage(() => ({
	title: props.host,
	icon: 'ti ti-server',
}));
</script>

<style lang="scss" module>
.faviconAndName {
	display: flex;
	align-items: center;
}
.icon {
	display: block;
	margin: 0 16px 0 0;
	height: 64px;
	border-radius: 8px;
}
.name {
	word-break: break-all;
}
.selects {
	display: flex;
	margin: 0 0 16px 0;
}
.label {
	margin-bottom: 12px;
	font-weight: bold;
}
.users {
	display: grid;
	grid-template-columns: repeat(auto-fill,minmax(270px,1fr));
	grid-gap: 12px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"unknown": "مجهول",
	"software": "البرمجية",
	"administrator": "المدير",
	"description": "الوصف",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publishing",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "مُعلّق",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "احجب مثيل الخادم هذا",
	"silenceThisInstance": "Silence this instance",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "مسجل منذ",
	"updatedAt": "حُدّث في",
	"latestRequestReceivedAt": "آخر طلب تُلقي في",
	"recentNHours": "آخر {n} ساعة",
	"recentNDays": "آخر {n} أيام",
	"instanceChartsRequests": "الطلبات",
	"instanceChartsUsers": "تباين عدد المستخدمين",
	"instanceChartsUsersTotal": "تباين عدد المستخدمين",
	"instanceChartsNotes": "تباين عدد الملاحظات",
	"instanceChartsNotesTotal": "تباين عدد الملاحظات",
	"instanceChartsFf": "تباين عدد حسابات المتابَعة/المتابِعة",
	"instanceChartsFfTotal": "تباين عدد حسابات المتابَعة/المتابِعة",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Cumulative total cache size",
	"instanceChartsFiles": "تباين عدد الملفات",
	"instanceChartsFilesTotal": "تباين عدد الملفات",
	"overview": "ملخص عام",
	"charts": "المنحنيات البيانية",
	"users": "المستخدمون"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"unknown": "Desconegut",
	"software": "Programari",
	"administrator": "Administrador/a",
	"description": "Descripció",
	"deliveryStatus": "Estat d'entrega ",
	"deliveryTypeLabels": {
		"none": "S'està publicant",
		"manuallySuspended": "Suspendre manualment",
		"goneSuspended": "Servidor suspès perquè el servidor s'ha esborrat",
		"autoSuspendedForNotResponding": "Servidor suspès perquè el servidor no respon",
		"softwareSuspended": "Suspès perquè el programari ha deixat de desenvolupar-se "
	},
	"deliveryStop": "Anul·lar subscripció ",
	"deliveryResume": "Torna a enviar",
	"blockThisInstance": "Bloca aquesta instància ",
	"silenceThisInstance": "Silencia aquesta instància ",
	"mediaSilenceThisInstance": "Silenciar els arxius d'aquesta instància ",
	"moderationNote": "Nota de moderació ",
	"moderationNoteDescription": "Pots escriure notes que es compartiran entre els moderadors.",
	"registeredAt": "Registrat a",
	"updatedAt": "Actualitzat el",
	"latestRequestReceivedAt": "Última petició rebuda",
	"recentNHours": "Últimes {n} hores",
	"recentNDays": "Últims {n} dies",
	"instanceChartsRequests": "Peticions",
	"instanceChartsUsers": "Diferència entre el nombre d'usuaris",
	"instanceChartsUsersTotal": "Usuaris totals acumulats",
	"instanceChartsNotes": "Diferència entre el nombre de notes",
	"instanceChartsNotesTotal": "Notes totals acumulades",
	"instanceChartsFf": "Diferència en nombre d'usuaris seguits / seguidors",
	"instanceChartsFfTotal": "Nombre total acumulat d'usuaris seguits / seguidors",
	"instanceChartsCacheSize": "Diferència a la mida de la memòria cau",
	"instanceChartsCacheSizeTotal": "Total acumulat de la mida de la memòria cau",
	"instanceChartsFiles": "Diferència al nombre d'arxius",
	"instanceChartsFilesTotal": "Nombre acumulatiu de fitxers",
	"overview": "Visió General",
	"charts": "Gràfics",
	"users": "Usuaris"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"unknown": "Neznámý",
	"software": "Software",
	"administrator": "Administrátor",
	"description": "Popis",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publikuji",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Suspendováno",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Blokovat tuto instanci",
	"silenceThisInstance": "Utišit tuto instanci",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Poznámka moderátora",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Registrován",
	"updatedAt": "Upraveno",
	"latestRequestReceivedAt": "Poslední požadavek přijat",
	"recentNHours": "Posledních {n} hodin",
	"recentNDays": "Posledních {n} dnů",
	"instanceChartsRequests": "Požadavky",
	"instanceChartsUsers": "Rozdíl v počtech uživatelů",
	"instanceChartsUsersTotal": "Kumulativní počet uživatelů",
	"instanceChartsNotes": "Rozdíl v počtu poznámek",
	"instanceChartsNotesTotal": "Kumulativní počet poznámek",
	"instanceChartsFf": "Rozdíl v počtu sledovaných uživatelů / sledujících",
	"instanceChartsFfTotal": "Kumulativní počet sledovaných uživatelů / sledujících",
	"instanceChartsCacheSize": "Rozdíl ve velikosti mezipaměti",
	"instanceChartsCacheSizeTotal": "Kumulativní celková velikost mezipaměti",
	"instanceChartsFiles": "Rozdíl v počtu souborů",
	"instanceChartsFilesTotal": "Kumulativní počet souborů",
	"overview": "Shrnutí",
	"charts": "Grafy",
	"users": "Uživatelé"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"unknown": "Unknown",
	"software": "Software",
	"administrator": "Administrator",
	"description": "Description",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publishing",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Suspend",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Block this instance",
	"silenceThisInstance": "Silence this instance",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Registered at",
	"updatedAt": "Updated at",
	"latestRequestReceivedAt": "Last request received",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"instanceChartsRequests": "Requests",
	"instanceChartsUsers": "Difference in the number of users",
	"instanceChartsUsersTotal": "Cumulative number of users",
	"instanceChartsNotes": "Difference in the number of notes",
	"instanceChartsNotesTotal": "Cumulative number of notes",
	"instanceChartsFf": "Difference in the number of followed users / followers ",
	"instanceChartsFfTotal": "Cumulative number of followed users / followers",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Cumulative total cache size",
	"instanceChartsFiles": "Difference in the number of files",
	"instanceChartsFilesTotal": "Cumulative number of files",
	"overview": "Overview",
	"charts": "Charts",
	"users": "Users"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"unknown": "Unbekannt",
	"software": "Software",
	"administrator": "Administrator",
	"description": "Beschreibung",
	"deliveryStatus": "Auslieferungsstatus",
	"deliveryTypeLabels": {
		"none": "Wird veröffentlicht",
		"manuallySuspended": "Manuell gesperrt",
		"goneSuspended": "Gesperrt wegen Löschung des Servers",
		"autoSuspendedForNotResponding": "Gesperrt, weil der Server nicht antwortet",
		"softwareSuspended": "Ausgesetzt, weil die Software nicht mehr beliefert wird"
	},
	"deliveryStop": "Gesperrt",
	"deliveryResume": "Zustellung wieder fortsetzen",
	"blockThisInstance": "Diese Instanz blockieren",
	"silenceThisInstance": "Instanz stummschalten",
	"mediaSilenceThisInstance": "Medien dieses Servers stummschalten",
	"moderationNote": "Moderationsnotiz",
	"moderationNoteDescription": "Trage hier Notizen ein. Diese sind nur für die Moderatoren sichtbar.",
	"registeredAt": "Registriert am",
	"updatedAt": "Zuletzt geändert am",
	"latestRequestReceivedAt": "Letzte Anfrage erhalten",
	"recentNHours": "Letzte {n} Stunden",
	"recentNDays": "Letzte {n} Tage",
	"instanceChartsRequests": "Anfragen",
	"instanceChartsUsers": "Unterschied in der Anzahl an Benutzern",
	"instanceChartsUsersTotal": "Gesamtanzahl an Benutzern",
	"instanceChartsNotes": "Unterschied in der Anzahl an Notizen",
	"instanceChartsNotesTotal": "Gesamtanzahl an Notizen",
	"instanceChartsFf": "Unterschied in der Anzahl an gefolgten Benutzern und Followern",
	"instanceChartsFfTotal": "Gesamtanzahl an gefolgten Benutzern und Followern",
	"instanceChartsCacheSize": "Unterschied in der Größe des Caches",
	"instanceChartsCacheSizeTotal": "Gesamtgröße des Caches",
	"instanceChartsFiles": "Unterschied in der Anzahl an Dateien",
	"instanceChartsFilesTotal": "Gesamtanzahl an Dateien",
	"overview": "Übersicht",
	"charts": "Diagramme",
	"users": "Benutzer"
}
</locale>

<locale lang="json" locale="en-US">
{
	"unknown": "Unknown",
	"software": "Software",
	"administrator": "Administrator",
	"description": "Description",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publishing",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Suspend",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Block this instance",
	"silenceThisInstance": "Silence this instance",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Registered at",
	"updatedAt": "Updated at",
	"latestRequestReceivedAt": "Last request received",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"instanceChartsRequests": "Requests",
	"instanceChartsUsers": "Difference in the number of users",
	"instanceChartsUsersTotal": "Cumulative number of users",
	"instanceChartsNotes": "Difference in the number of notes",
	"instanceChartsNotesTotal": "Cumulative number of notes",
	"instanceChartsFf": "Difference in the number of followed users / followers ",
	"instanceChartsFfTotal": "Cumulative number of followed users / followers",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Cumulative total cache size",
	"instanceChartsFiles": "Difference in the number of files",
	"instanceChartsFilesTotal": "Cumulative number of files",
	"overview": "Overview",
	"charts": "Charts",
	"users": "Users"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"unknown": "Desconocido",
	"software": "Software",
	"administrator": "Administrador",
	"description": "Descripción",
	"deliveryStatus": "Estado de la entrega",
	"deliveryTypeLabels": {
		"none": "Publicando",
		"manuallySuspended": "Suspendido manualmente",
		"goneSuspended": "El servidor se ha suspendido debido a la eliminación del servidor",
		"autoSuspendedForNotResponding": "El servidor se suspende debido a que el servidor no responde.",
		"softwareSuspended": "Suspendido porque este software ya no se distribuye a"
	},
	"deliveryStop": "Suspendido",
	"deliveryResume": "Resumen de entrega",
	"blockThisInstance": "Bloquear instancia",
	"silenceThisInstance": "Silenciar esta instancia",
	"mediaSilenceThisInstance": "Silencia la Multimedia(Imágenes,videos...) para este servidor",
	"moderationNote": "Nota de moderación",
	"moderationNoteDescription": "Puedes rellenar notas que solo se comparten entre moderadores.",
	"registeredAt": "Registrado en",
	"updatedAt": "Actualizado",
	"latestRequestReceivedAt": "Última petición recibida",
	"recentNHours": "Últimas {n} horas",
	"recentNDays": "Últimos {n} días",
	"instanceChartsRequests": "Pedidos",
	"instanceChartsUsers": "Variación de usuarios",
	"instanceChartsUsersTotal": "Total acumulado de usuarios",
	"instanceChartsNotes": "Variación de la cantidad de notas",
	"instanceChartsNotesTotal": "Total acumulado de la cantidad de notas",
	"instanceChartsFf": "Variación de cantidad de seguidos/seguidores",
	"instanceChartsFfTotal": "Total acumulado de cantidad de seguidos/seguidores",
	"instanceChartsCacheSize": "Variación del tamaño de la caché",
	"instanceChartsCacheSizeTotal": "Total acumulado del tamaño de la caché",
	"instanceChartsFiles": "Variación de cantidad de archivos",
	"instanceChartsFilesTotal": "Total acumulado de cantidad de archivos",
	"overview": "Resumen",
	"charts": "Métricas",
	"users": "Usuarios"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"unknown": "Inconnu",
	"software": "Logiciel",
	"administrator": "Administrateur",
	"description": "Description",
	"deliveryStatus": "Statut de la diffusion",
	"deliveryTypeLabels": {
		"none": "Publié",
		"manuallySuspended": "Suspendre manuellement",
		"goneSuspended": "L'instance est suspendue en raison de la suppression de ce dernier",
		"autoSuspendedForNotResponding": "L'instance est suspendue car elle ne répond pas",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Suspendu·e",
	"deliveryResume": "Reprendre",
	"blockThisInstance": "Bloquer cette instance",
	"silenceThisInstance": "Mettre cette instance en sourdine",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Note de modération",
	"moderationNoteDescription": "Vous pouvez remplir des notes qui seront partagés seulement entre modérateurs.",
	"registeredAt": "Premier contact le",
	"updatedAt": "Mis à jour le",
	"latestRequestReceivedAt": "Dernière requête reçue",
	"recentNHours": "Dernières {n} heures",
	"recentNDays": "Derniers {n} jours",
	"instanceChartsRequests": "Requêtes",
	"instanceChartsUsers": "Variation du nombre d'utilisateur·rice·s",
	"instanceChartsUsersTotal": "Total cumulé du nombre d'utilisateur·rice·s",
	"instanceChartsNotes": "Variation du nombre de notes",
	"instanceChartsNotesTotal": "Nombre total cumulé des notes",
	"instanceChartsFf": "Variation des abonné·e·s / abonnements",
	"instanceChartsFfTotal": "Total cumulé du nombre d'abonné·e·s / abonnements",
	"instanceChartsCacheSize": "Variation de la taille du cache",
	"instanceChartsCacheSizeTotal": "Total cumulé de la taille du cache",
	"instanceChartsFiles": "Variation du nombre de fichiers",
	"instanceChartsFilesTotal": "Total cumulé du nombre de fichiers",
	"overview": "Aperçu",
	"charts": "Graphiques",
	"users": "Utilisateur·rice·s"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"unknown": "Tidak diketahui",
	"software": "Perangkat lunak",
	"administrator": "Admin",
	"description": "Deskripsi",
	"deliveryStatus": "Status pengiriman",
	"deliveryTypeLabels": {
		"none": "Sedang menyiarkan langsung",
		"manuallySuspended": "Ditangguhkan manual",
		"goneSuspended": "Sedang ditangguhkan untuk penghapusan peladen",
		"autoSuspendedForNotResponding": "Sedang ditangguhkan karena peladen tidak menjawab",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Ditangguhkan",
	"deliveryResume": "Lanjutkan pengiriman",
	"blockThisInstance": "Blokir instansi ini",
	"silenceThisInstance": "Senyapkan instansi ini",
	"mediaSilenceThisInstance": "Senyapkan media dari peladen ini",
	"moderationNote": "Catatan moderasi",
	"moderationNoteDescription": "Anda dapat mengisi note yang hanya akan dibagikan diantara moderator.",
	"registeredAt": "Terdaftar",
	"updatedAt": "Diperbarui pada",
	"latestRequestReceivedAt": "Permintaan terakhir diterima pada",
	"recentNHours": "{n} jam terakhir",
	"recentNDays": "{n} hari terakhir",
	"instanceChartsRequests": "Permintaan",
	"instanceChartsUsers": "Perbedaan dalam # pengguna",
	"instanceChartsUsersTotal": "Jumlah # pengguna kumulatif",
	"instanceChartsNotes": "Perbedaan # dalam catatan",
	"instanceChartsNotesTotal": "Jumlah # catatan kumulatif",
	"instanceChartsFf": "Perbedaan jumlah # dalam pengikut",
	"instanceChartsFfTotal": "Jumlah # pengikut kumulatif",
	"instanceChartsCacheSize": "Perbedaan dalam ukuran tembolok",
	"instanceChartsCacheSizeTotal": "Total ukuran tembolok kumulatif",
	"instanceChartsFiles": "Perbedaan dalam # berkas",
	"instanceChartsFilesTotal": "Jumlah # berkas kumulatif",
	"overview": "Ikhtisar",
	"charts": "Grafik",
	"users": "Pengguna"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"unknown": "Sconosciuto",
	"software": "Software",
	"administrator": "Amministratore",
	"description": "Descrizione",
	"deliveryStatus": "Stato della consegna",
	"deliveryTypeLabels": {
		"none": "Pubblicazione",
		"manuallySuspended": "Sospesa manualmente",
		"goneSuspended": "Sospensione server a causa dell'eliminazione",
		"autoSuspendedForNotResponding": "Sospensione del server a causa di mancata risposta",
		"softwareSuspended": "Attualmente non disponibile perché il software non è più distribuito"
	},
	"deliveryStop": "Sospensione",
	"deliveryResume": "Riprendi la consegna",
	"blockThisInstance": "Bloccare l'istanza",
	"silenceThisInstance": "Silenziare l'istanza",
	"mediaSilenceThisInstance": "Silenzia i media dell'istanza",
	"moderationNote": "Promemoria di moderazione",
	"moderationNoteDescription": "Puoi scrivere promemoria condivisi solo tra moderatori.",
	"registeredAt": "Prima federazione",
	"updatedAt": "Aggiornato il",
	"latestRequestReceivedAt": "Ultima richiesta ricevuta",
	"recentNHours": "Ultime {n} ore",
	"recentNDays": "Ultimi {n} giorni",
	"instanceChartsRequests": "Richieste",
	"instanceChartsUsers": "Variazione del numero di profili",
	"instanceChartsUsersTotal": "Totale cumulativo di utenti",
	"instanceChartsNotes": "Variazione del numero di note",
	"instanceChartsNotesTotal": "Totale cumulato di note",
	"instanceChartsFf": "Variazione dei follow/ follower",
	"instanceChartsFfTotal": "Totale cumulato dei follow/ follower",
	"instanceChartsCacheSize": "Variazione dello spazio occupato dalla cache",
	"instanceChartsCacheSizeTotal": "Totale cumulato dello spazio occupato dalla cache",
	"instanceChartsFiles": "Variazione del numero di file",
	"instanceChartsFilesTotal": "Totale cumulato del numero di file",
	"overview": "Anteprima",
	"charts": "Grafici",
	"users": "Profili"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"unknown": "不明",
	"software": "ソフトウェア",
	"administrator": "管理者",
	"description": "説明",
	"deliveryStatus": "配信状態",
	"deliveryTypeLabels": {
		"none": "配信中",
		"manuallySuspended": "手動停止中",
		"goneSuspended": "サーバー削除のため停止中",
		"autoSuspendedForNotResponding": "サーバー応答なしのため停止中",
		"softwareSuspended": "配信停止中のソフトウェアであるため停止中"
	},
	"deliveryStop": "配信停止",
	"deliveryResume": "配信再開",
	"blockThisInstance": "このサーバーをブロック",
	"silenceThisInstance": "サーバーをサイレンス",
	"mediaSilenceThisInstance": "サーバーをメディアサイレンス",
	"moderationNote": "モデレーションノート",
	"moderationNoteDescription": "モデレーター間でだけ共有されるメモを記入することができます。",
	"registeredAt": "初観測",
	"updatedAt": "更新日時",
	"latestRequestReceivedAt": "直近のリクエスト受信",
	"recentNHours": "直近{n}時間",
	"recentNDays": "直近{n}日",
	"instanceChartsRequests": "リクエスト",
	"instanceChartsUsers": "ユーザーの増減",
	"instanceChartsUsersTotal": "ユーザーの累積",
	"instanceChartsNotes": "ノートの増減",
	"instanceChartsNotesTotal": "ノートの累積",
	"instanceChartsFf": "フォロー/フォロワーの増減",
	"instanceChartsFfTotal": "フォロー/フォロワーの累積",
	"instanceChartsCacheSize": "キャッシュサイズの増減",
	"instanceChartsCacheSizeTotal": "キャッシュサイズの累積",
	"instanceChartsFiles": "ファイル数の増減",
	"instanceChartsFilesTotal": "ファイル数の累積",
	"overview": "概要",
	"charts": "チャート",
	"users": "ユーザー"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"unknown": "不明",
	"software": "ソフトウェア",
	"administrator": "管理者",
	"description": "説明",
	"deliveryStatus": "配信状態",
	"deliveryTypeLabels": {
		"none": "配信しとる",
		"manuallySuspended": "手動停止中",
		"goneSuspended": "サーバー削除のため停止中",
		"autoSuspendedForNotResponding": "サーバー応答せえへんから停止中",
		"softwareSuspended": "配信停止中のソフトウェアやから停止中"
	},
	"deliveryStop": "配信せぇへん",
	"deliveryResume": "配信再開",
	"blockThisInstance": "このサーバーをブロックすんで",
	"silenceThisInstance": "サーバーサイレンスすんで？",
	"mediaSilenceThisInstance": "サーバーをメディアサイレンス",
	"moderationNote": "モデレーションノート",
	"moderationNoteDescription": "モデレーターの中だけで共有するメモを入れれるで。",
	"registeredAt": "初観測",
	"updatedAt": "更新日時",
	"latestRequestReceivedAt": "ちょっと前のリクエスト受信",
	"recentNHours": "直近{n}時間",
	"recentNDays": "直近{n}日",
	"instanceChartsRequests": "リクエスト",
	"instanceChartsUsers": "ユーザーの増減",
	"instanceChartsUsersTotal": "ユーザーの累積",
	"instanceChartsNotes": "ノートの増減",
	"instanceChartsNotesTotal": "ノートの累積",
	"instanceChartsFf": "フォロー/フォロワーの増減",
	"instanceChartsFfTotal": "フォロー/フォロワーの累積",
	"instanceChartsCacheSize": "キャッシュサイズの増減",
	"instanceChartsCacheSizeTotal": "キャッシュサイズの累積",
	"instanceChartsFiles": "ファイル数の増減",
	"instanceChartsFilesTotal": "ファイル数の累積",
	"overview": "概要",
	"charts": "チャート",
	"users": "ユーザー"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"unknown": "Unknown",
	"software": "Software",
	"administrator": "Administrator",
	"description": "Description",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publishing",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Suspend",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Block this instance",
	"silenceThisInstance": "Silence this instance",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Registered at",
	"updatedAt": "Updated at",
	"latestRequestReceivedAt": "Last request received",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"instanceChartsRequests": "Requests",
	"instanceChartsUsers": "Difference in the number of users",
	"instanceChartsUsersTotal": "Cumulative number of users",
	"instanceChartsNotes": "Difference in the number of notes",
	"instanceChartsNotesTotal": "Cumulative number of notes",
	"instanceChartsFf": "Difference in the number of followed users / followers ",
	"instanceChartsFfTotal": "Cumulative number of followed users / followers",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Cumulative total cache size",
	"instanceChartsFiles": "Difference in the number of files",
	"instanceChartsFilesTotal": "Cumulative number of files",
	"overview": "Overview",
	"charts": "Charts",
	"users": "Users"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"unknown": "Unknown",
	"software": "Software",
	"administrator": "Administrator",
	"description": "Description",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publishing",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Suspend",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Block this instance",
	"silenceThisInstance": "Silence this instance",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Registered at",
	"updatedAt": "Updated at",
	"latestRequestReceivedAt": "Last request received",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"instanceChartsRequests": "Requests",
	"instanceChartsUsers": "Difference in the number of users",
	"instanceChartsUsersTotal": "Cumulative number of users",
	"instanceChartsNotes": "Difference in the number of notes",
	"instanceChartsNotesTotal": "Cumulative number of notes",
	"instanceChartsFf": "Difference in the number of followed users / followers ",
	"instanceChartsFfTotal": "Cumulative number of followed users / followers",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Cumulative total cache size",
	"instanceChartsFiles": "Difference in the number of files",
	"instanceChartsFilesTotal": "Cumulative number of files",
	"overview": "Overview",
	"charts": "Charts",
	"users": "ಬಳಕೆದಾರ"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"unknown": "알 수 없음",
	"software": "소프트웨어",
	"administrator": "관리자",
	"description": "설명",
	"deliveryStatus": "전송 상태",
	"deliveryTypeLabels": {
		"none": "배포 중",
		"manuallySuspended": "수동 정지 중",
		"goneSuspended": "서버 삭제를 이유로 정지 중",
		"autoSuspendedForNotResponding": "서버 응답 없음을 이유로 정지 중",
		"softwareSuspended": "전달 정지 중인 소프트웨어이므로 정지 중"
	},
	"deliveryStop": "정지됨",
	"deliveryResume": "전송 다시 시작",
	"blockThisInstance": "이 서버를 차단",
	"silenceThisInstance": "서버를 사일런스",
	"mediaSilenceThisInstance": "서버의 미디어를 사일런스",
	"moderationNote": "조정 기록",
	"moderationNoteDescription": "모더레이터 역할을 가진 유저만 보이는 메모를 적을 수 있습니다.",
	"registeredAt": "등록 날짜",
	"updatedAt": "수정한 날짜",
	"latestRequestReceivedAt": "마지막으로 요청을 받은 시간",
	"recentNHours": "최근 {n}시간",
	"recentNDays": "최근 {n}일",
	"instanceChartsRequests": "요청",
	"instanceChartsUsers": "유저 수 차이",
	"instanceChartsUsersTotal": "누적 유저 수",
	"instanceChartsNotes": "노트 수 증감",
	"instanceChartsNotesTotal": "누적 노트 수",
	"instanceChartsFf": "팔로잉/팔로워 증감",
	"instanceChartsFfTotal": "누적 팔로잉/팔로워 수",
	"instanceChartsCacheSize": "캐시 용량 증감",
	"instanceChartsCacheSizeTotal": "누적 캐시 용량",
	"instanceChartsFiles": "파일 수 증감",
	"instanceChartsFilesTotal": "누적 파일 수",
	"overview": "요약",
	"charts": "차트",
	"users": "유저"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"unknown": "Onbekend",
	"software": "Software",
	"administrator": "Beheerder",
	"description": "Beschrijving",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publiceren",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Opgeschort",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Blokkeer deze server",
	"silenceThisInstance": "Instantie dempen",
	"mediaSilenceThisInstance": "Media van deze server dempen",
	"moderationNote": "Moderatienotitie",
	"moderationNoteDescription": "Voer hier notities in. Deze zijn alleen zichtbaar voor de moderators.",
	"registeredAt": "Geregistreerd op",
	"updatedAt": "Laatst gewijzigd at",
	"latestRequestReceivedAt": "Laatste aanvraag ontvangen",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"instanceChartsRequests": "Requests",
	"instanceChartsUsers": "Difference in the number of users",
	"instanceChartsUsersTotal": "Cumulative number of users",
	"instanceChartsNotes": "Difference in the number of notes",
	"instanceChartsNotesTotal": "Cumulative number of notes",
	"instanceChartsFf": "Difference in the number of followed users / followers ",
	"instanceChartsFfTotal": "Cumulative number of followed users / followers",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Cumulative total cache size",
	"instanceChartsFiles": "Difference in the number of files",
	"instanceChartsFilesTotal": "Cumulative number of files",
	"overview": "Overzicht",
	"charts": "Grafieken",
	"users": "Gebruikers"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"unknown": "Ukjent",
	"software": "Programvare",
	"administrator": "Administrator",
	"description": "Beskrivelse",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publishing",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Suspendert",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Blokker denne serveren",
	"silenceThisInstance": "Silence this instance",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Registrerte seg",
	"updatedAt": "Updated at",
	"latestRequestReceivedAt": "Siste forespørsel mottatt",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"instanceChartsRequests": "Requests",
	"instanceChartsUsers": "Forskjell på antall brukere",
	"instanceChartsUsersTotal": "Cumulative number of users",
	"instanceChartsNotes": "Difference in the number of notes",
	"instanceChartsNotesTotal": "Cumulative number of notes",
	"instanceChartsFf": "Forskjell på antall Følg/Følgere",
	"instanceChartsFfTotal": "Cumulative number of followed users / followers",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Cumulative total cache size",
	"instanceChartsFiles": "Forskjell på antall filer",
	"instanceChartsFilesTotal": "Cumulative number of files",
	"overview": "Overview",
	"charts": "Diagrammer",
	"users": "Brukere"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"unknown": "Nieznane",
	"software": "Oprogramowanie",
	"administrator": "Admin",
	"description": "Opis",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publikowanie",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Zawieszono",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Zablokuj tę instancję",
	"silenceThisInstance": "Wycisz tę instancję",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Notka moderacyjna",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Zarejestrowano",
	"updatedAt": "Zaktualizowano",
	"latestRequestReceivedAt": "Ostatnie żądanie otrzymano o",
	"recentNHours": "W ciągu ostatnich {n} godzin",
	"recentNDays": "W ciągu ostatnich {n} dni",
	"instanceChartsRequests": "Żądania",
	"instanceChartsUsers": "Różnica w liczbie użytkowników",
	"instanceChartsUsersTotal": "Cumulative number of users",
	"instanceChartsNotes": "Różnica w liczbie wpisów",
	"instanceChartsNotesTotal": "Łącznie # wpisów",
	"instanceChartsFf": "Różnica w # obserwujących",
	"instanceChartsFfTotal": "Łączna liczba # obserwujących",
	"instanceChartsCacheSize": "Różnica w rozmiarze pamięci podręcznej",
	"instanceChartsCacheSizeTotal": "Łączny rozmiar pamięci podręcznej",
	"instanceChartsFiles": "Różnica # plików",
	"instanceChartsFilesTotal": "Łącznie # plików",
	"overview": "Przegląd",
	"charts": "Wykresy",
	"users": "Użytkownicy"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"unknown": "Desconhecido",
	"software": "Software",
	"administrator": "Administrador",
	"description": "Descrição",
	"deliveryStatus": "Estado de entrega",
	"deliveryTypeLabels": {
		"none": "Publicando",
		"manuallySuspended": "Suspenso manualmente",
		"goneSuspended": "Servidor foi suspenso devido ao seu apagamento",
		"autoSuspendedForNotResponding": "Servidor foi suspenso por não responder",
		"softwareSuspended": "Suspenso, pois esse software não está recebendo conteúdo"
	},
	"deliveryStop": "Suspenso",
	"deliveryResume": "Continuar entrega",
	"blockThisInstance": "Bloquear esta instância",
	"silenceThisInstance": "Silenciar essa instância",
	"mediaSilenceThisInstance": "Silenciar a mídia dessa instância",
	"moderationNote": "Nota de moderação",
	"moderationNoteDescription": "Você pode preencher notas que serão compartilhadas apenas com moderadores.",
	"registeredAt": "Registrado em",
	"updatedAt": "Última atualização",
	"latestRequestReceivedAt": "Última solicitação recebida",
	"recentNHours": "Últimas {n} horas",
	"recentNDays": "Últimos {n} dias",
	"instanceChartsRequests": "Solicitações",
	"instanceChartsUsers": "Diferença no número de usuários",
	"instanceChartsUsersTotal": "Número cumulativo de usuários",
	"instanceChartsNotes": "Diferença no número de notas",
	"instanceChartsNotesTotal": "Número cumulativo de notas",
	"instanceChartsFf": "Diferença entre número de usuários seguidos/seguidores",
	"instanceChartsFfTotal": "Número cumulativo de usuários seguidos/seguidores",
	"instanceChartsCacheSize": "Diferença do tamanho do cache",
	"instanceChartsCacheSizeTotal": "Tamanho cumulativo do cache",
	"instanceChartsFiles": "Diferença no número de arquivos",
	"instanceChartsFilesTotal": "Número cumulativo de arquivos",
	"overview": "Visão geral",
	"charts": "Gráfico",
	"users": "Usuários"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"unknown": "Неизвестно",
	"software": "Программы",
	"administrator": "Администратор",
	"description": "Описание",
	"deliveryStatus": "Статус отправки",
	"deliveryTypeLabels": {
		"none": "Публикация",
		"manuallySuspended": "Остановлено вручную",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Остановить",
	"deliveryResume": "Продолжить отправку",
	"blockThisInstance": "Блокировать этот инстанс",
	"silenceThisInstance": "Заглушить этот инстанс",
	"mediaSilenceThisInstance": "Заглушить сервер",
	"moderationNote": "Примечания модератора",
	"moderationNoteDescription": "Вы можете заполнять заметки, которые будут доступны только модераторам.",
	"registeredAt": "Первое наблюдение",
	"updatedAt": "Обновлено",
	"latestRequestReceivedAt": "Последний полученный запрос",
	"recentNHours": "Последние {n} ч",
	"recentNDays": "Последние {n} сут",
	"instanceChartsRequests": "Запросы",
	"instanceChartsUsers": "Изменение числа пользователей",
	"instanceChartsUsersTotal": "Суммарное количество пользователей",
	"instanceChartsNotes": "Изменение числа заметок",
	"instanceChartsNotesTotal": "Суммарное количество заметок",
	"instanceChartsFf": "Изменения числа подписчиков",
	"instanceChartsFfTotal": "Суммарное количество подписчиков",
	"instanceChartsCacheSize": "Изменения размера кэша",
	"instanceChartsCacheSizeTotal": "Суммарный размер кэша",
	"instanceChartsFiles": "Изменения числа файлов",
	"instanceChartsFilesTotal": "Суммарное количество файлов",
	"overview": "Обзор",
	"charts": "Диаграммы",
	"users": "Пользователи"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"unknown": "Neznáme",
	"software": "Softvér",
	"administrator": "Administrátor",
	"description": "Popis",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Zverejňovanie",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Zmrazené",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Blokovať tento server",
	"silenceThisInstance": "Silence this instance",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Registrácia",
	"updatedAt": "Upravené",
	"latestRequestReceivedAt": "Posledná prijatá požiadavka",
	"recentNHours": "Posledných {n} hodín",
	"recentNDays": "Posledných {n} dní",
	"instanceChartsRequests": "Žiadosti",
	"instanceChartsUsers": "Rozdiel v počte používateľov",
	"instanceChartsUsersTotal": "Celkom spolu počet používateľov",
	"instanceChartsNotes": "Rozdiel v počte poznámok",
	"instanceChartsNotesTotal": "Celkom spolu počet poznámok",
	"instanceChartsFf": "Rozdiel v počte sledovaných/sledujúcich",
	"instanceChartsFfTotal": "Celkom spolu počet sledovaných / sledujúcich",
	"instanceChartsCacheSize": "Rozdiel vo veľkosti cache",
	"instanceChartsCacheSizeTotal": "Celkom spolu veľkosť cache",
	"instanceChartsFiles": "Rozdiel v počte súborov",
	"instanceChartsFilesTotal": "Celkom spolu počet súborov",
	"overview": "Prehľad",
	"charts": "Grafy",
	"users": "Používatelia"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"unknown": "ไม่ทราบสถานะ",
	"software": "ซอฟต์แวร์",
	"administrator": "ผู้ดูแลระบบ",
	"description": "คำอธิบาย",
	"deliveryStatus": "สถานะการจัดส่ง",
	"deliveryTypeLabels": {
		"none": "กำลังเผยแพร่",
		"manuallySuspended": "หยุดชั่วคราวด้วยตนเอง",
		"goneSuspended": "เซิร์ฟเวอร์ถูกระงับเนื่องจากมีการลบเซิร์ฟเวอร์นี้",
		"autoSuspendedForNotResponding": "เซิร์ฟเวอร์ถูกระงับเนื่องจากไม่ตอบสนอง",
		"softwareSuspended": "หยุดให้บริการ เนื่องจากเป็นซอฟต์แวร์ที่ถูกระงับการเผยแพร่"
	},
	"deliveryStop": "ระงับการส่ง",
	"deliveryResume": "จัดส่งต่อ",
	"blockThisInstance": "บล็อกเซิร์ฟเวอร์นี้",
	"silenceThisInstance": "ปิดปากเซิร์ฟเวอร์นี้",
	"mediaSilenceThisInstance": "ปิดปากสื่อของเซิร์ฟเวอร์นี้",
	"moderationNote": "โน้ตการกลั่นกรอง",
	"moderationNoteDescription": "สามารถจดเมโมที่จะแบ่งปันเฉพาะระหว่างผู้ควบคุมได้",
	"registeredAt": "วันที่ลงทะเบียน",
	"updatedAt": "อัปเดตล่าสุด",
	"latestRequestReceivedAt": "คำขอล่าสุดที่ได้รับ",
	"recentNHours": "ล่าสุด {n} ชั่วโมงที่แล้ว",
	"recentNDays": "ล่าสุด {n} วันที่แล้ว",
	"instanceChartsRequests": "คำขอ",
	"instanceChartsUsers": "การเพิ่มลดของจำนวนผู้ใช้งาน",
	"instanceChartsUsersTotal": "จำนวนผู้ใช้งานสะสม",
	"instanceChartsNotes": "การเพิ่มลดของจำนวนโน้ต",
	"instanceChartsNotesTotal": "จำนวนโน้ตสะสม",
	"instanceChartsFf": "การเพิ่มลดของการติดตาม/ผู้ติดตาม",
	"instanceChartsFfTotal": "จำนวนสะสมของการติดตาม/ผู้ติดตาม",
	"instanceChartsCacheSize": "การเพิ่มลดขนาดของแคช",
	"instanceChartsCacheSizeTotal": "ขนาดแคชสะสม",
	"instanceChartsFiles": "การเพิ่มลดของจำนวนไฟล์",
	"instanceChartsFilesTotal": "จำนวนไฟล์สะสม",
	"overview": "ภาพรวม",
	"charts": "แผนภูมิ",
	"users": "ผู้ใช้"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"unknown": "Bilinmiyor",
	"software": "Yazılım",
	"administrator": "Yönetici",
	"description": "Açıklama",
	"deliveryStatus": "Teslimat durumu",
	"deliveryTypeLabels": {
		"none": "Paylaşım",
		"manuallySuspended": "Manuel olarak askıya alınmış",
		"goneSuspended": "Sunucu, sunucunun silinmesi nedeniyle askıya alınmıştır.",
		"autoSuspendedForNotResponding": "Sunucu yanıt vermediği için askıya alınmıştır.",
		"softwareSuspended": "Bu yazılım artık dağıtılmadığı için askıya alınmıştır."
	},
	"deliveryStop": "Askıya al",
	"deliveryResume": "Teslimat özgeçmişi",
	"blockThisInstance": "Bu sunucuyu engelle",
	"silenceThisInstance": "Bu sunucuyu sustur",
	"mediaSilenceThisInstance": "Medya bu sunucuyu sustursun",
	"moderationNote": "Moderasyon notu",
	"moderationNoteDescription": "Moderatörler arasında paylaşılacak notları girebilirsin.",
	"registeredAt": "Kayıtlı",
	"updatedAt": "Güncellendi",
	"latestRequestReceivedAt": "Son talep alındı",
	"recentNHours": "Son {n} saat",
	"recentNDays": "Son {n} gün",
	"instanceChartsRequests": "Talepler",
	"instanceChartsUsers": "Kullanıcı sayısındaki fark",
	"instanceChartsUsersTotal": "Toplam kullanıcı sayısı",
	"instanceChartsNotes": "Not sayısındaki fark",
	"instanceChartsNotesTotal": "Toplam not sayısı",
	"instanceChartsFf": "Takip  / Takipçi sayısı farkı",
	"instanceChartsFfTotal": "Takip  / Takipçi toplam sayısı",
	"instanceChartsCacheSize": "Önbellek boyutundaki fark",
	"instanceChartsCacheSizeTotal": "Önbelleğin toplam boyutu",
	"instanceChartsFiles": "Dosya sayısındaki fark",
	"instanceChartsFilesTotal": "Toplam dosya sayısı",
	"overview": "Genel Bakış",
	"charts": "Grafikler",
	"users": "Kullanıcılar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"unknown": "Unknown",
	"software": "Software",
	"administrator": "Administrator",
	"description": "Description",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Publishing",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Suspend",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Block this instance",
	"silenceThisInstance": "Silence this instance",
	"mediaSilenceThisInstance": "Media-silence this server",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"registeredAt": "Registered at",
	"updatedAt": "Updated at",
	"latestRequestReceivedAt": "Last request received",
	"recentNHours": "Last {n} hours",
	"recentNDays": "Last {n} days",
	"instanceChartsRequests": "Requests",
	"instanceChartsUsers": "Difference in the number of users",
	"instanceChartsUsersTotal": "Cumulative number of users",
	"instanceChartsNotes": "Difference in the number of notes",
	"instanceChartsNotesTotal": "Cumulative number of notes",
	"instanceChartsFf": "Difference in the number of followed users / followers ",
	"instanceChartsFfTotal": "Cumulative number of followed users / followers",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Cumulative total cache size",
	"instanceChartsFiles": "Difference in the number of files",
	"instanceChartsFilesTotal": "Cumulative number of files",
	"overview": "Overview",
	"charts": "Charts",
	"users": "Users"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"unknown": "Невідомо",
	"software": "Програмне забезпечення",
	"administrator": "Адмін",
	"description": "Опис",
	"deliveryStatus": "Статус доставлення",
	"deliveryTypeLabels": {
		"none": "Публікація",
		"manuallySuspended": "Призупинено власноруч",
		"goneSuspended": "Сервер призупинено через видалення серверу",
		"autoSuspendedForNotResponding": "Сервер призупинено через відсутність відповідей",
		"softwareSuspended": "Призупинено через припинення оновлення програмного забезпечення"
	},
	"deliveryStop": "Призупинено",
	"deliveryResume": "Відновити доставлення",
	"blockThisInstance": "Заблокувати цей інстанс",
	"silenceThisInstance": "Обмежити цей інстанс",
	"mediaSilenceThisInstance": "Обмежити медіа з цього сервера",
	"moderationNote": "Модераторська нотатка",
	"moderationNoteDescription": "Ви можете додати нотатки, які будуть доступні лише модераторам.\n",
	"registeredAt": "Реєстрація",
	"updatedAt": "Останнє оновлення",
	"latestRequestReceivedAt": "Останній запит прийнято",
	"recentNHours": "Останні {n} годин",
	"recentNDays": "Останні {n} днів",
	"instanceChartsRequests": "Запити",
	"instanceChartsUsers": "Зміни кількості користувачів",
	"instanceChartsUsersTotal": "Сумарна кількість користувачів",
	"instanceChartsNotes": "Різниця кількості зроблених записів",
	"instanceChartsNotesTotal": "Сумарна кількість нотаток",
	"instanceChartsFf": "Різниця кількості підписників",
	"instanceChartsFfTotal": "Кількість підписників",
	"instanceChartsCacheSize": "Difference in cache size",
	"instanceChartsCacheSizeTotal": "Сумарний розмір кешу",
	"instanceChartsFiles": "Різниця в кількості файлів",
	"instanceChartsFilesTotal": "Сумарна кількість файлів",
	"overview": "Огляд",
	"charts": "Графіки",
	"users": "Користувачі"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"unknown": "Chưa biết",
	"software": "Phần mềm",
	"administrator": "Quản trị viên",
	"description": "Mô tả",
	"deliveryStatus": "Delivery status",
	"deliveryTypeLabels": {
		"none": "Đang đăng",
		"manuallySuspended": "Manually suspended",
		"goneSuspended": "Server is suspended due to server deletion",
		"autoSuspendedForNotResponding": "Server is suspended due to no responding",
		"softwareSuspended": "Suspended as this software is no longer being distributed to"
	},
	"deliveryStop": "Đã vô hiệu hóa",
	"deliveryResume": "Delivery resume",
	"blockThisInstance": "Chặn máy chủ này",
	"silenceThisInstance": "Máy chủ im lặng",
	"mediaSilenceThisInstance": "Tắt nội dung đa phương tiện từ máy chủ này",
	"moderationNote": "Ghi chú kiểm duyệt",
	"moderationNoteDescription": "Bạn có thể điền vào những ghi chú chỉ được chia sẻ giữa những người kiểm duyệt.",
	"registeredAt": "Đăng ký vào",
	"updatedAt": "Cập nhật lúc",
	"latestRequestReceivedAt": "Yêu cầu cuối nhận lúc",
	"recentNHours": "{n}h trước",
	"recentNDays": "{n} ngày trước",
	"instanceChartsRequests": "Lượt yêu cầu",
	"instanceChartsUsers": "Sự khác biệt về số lượng người dùng",
	"instanceChartsUsersTotal": "Số lượng người dùng tích lũy",
	"instanceChartsNotes": "Sự khác biệt về số lượng tút",
	"instanceChartsNotesTotal": "Số lượng tút tích lũy",
	"instanceChartsFf": "Sự khác biệt về số lượng người dùng được theo dõi/người theo dõi",
	"instanceChartsFfTotal": "Số lượng người dùng được theo dõi/người theo dõi tích lũy",
	"instanceChartsCacheSize": "Sự khác biệt về dung lượng bộ nhớ đệm",
	"instanceChartsCacheSizeTotal": "Dung lượng bộ nhớ đệm tích lũy",
	"instanceChartsFiles": "Sự khác biệt về số lượng tập tin",
	"instanceChartsFilesTotal": "Số lượng tập tin tích lũy",
	"overview": "Tổng quan",
	"charts": "Đồ thị",
	"users": "Người dùng"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"unknown": "未知",
	"software": "软件",
	"administrator": "管理员",
	"description": "描述",
	"deliveryStatus": "投递状态",
	"deliveryTypeLabels": {
		"none": "投递中",
		"manuallySuspended": "手动停止中",
		"goneSuspended": "因服务器被删除而停止",
		"autoSuspendedForNotResponding": "因服务器无应答而停止",
		"softwareSuspended": "因有停止投递的软件而停止"
	},
	"deliveryStop": "停止投递",
	"deliveryResume": "继续投递",
	"blockThisInstance": "屏蔽此服务器",
	"silenceThisInstance": "静音此服务器",
	"mediaSilenceThisInstance": "隐藏此服务器的媒体文件",
	"moderationNote": "管理笔记",
	"moderationNoteDescription": "可以用来记录仅在管理员之间共享的笔记。",
	"registeredAt": "初次观测",
	"updatedAt": "更新日期",
	"latestRequestReceivedAt": "上次收到的请求",
	"recentNHours": "最近{n}小时",
	"recentNDays": "最近{n}天",
	"instanceChartsRequests": "请求",
	"instanceChartsUsers": "用户数量：增加/减少",
	"instanceChartsUsersTotal": "用户总计",
	"instanceChartsNotes": "帖子：增加/减少",
	"instanceChartsNotesTotal": "帖子总计",
	"instanceChartsFf": "关注/被关注：数量变化",
	"instanceChartsFfTotal": "关注/被关注者总计",
	"instanceChartsCacheSize": "缓存大小：增加/减少",
	"instanceChartsCacheSizeTotal": "缓存大小总计",
	"instanceChartsFiles": "文件总数增减",
	"instanceChartsFilesTotal": "文件数总计",
	"overview": "概览",
	"charts": "图表",
	"users": "用户"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"unknown": "未知",
	"software": "軟體",
	"administrator": "管理員",
	"description": "描述",
	"deliveryStatus": "傳送狀態",
	"deliveryTypeLabels": {
		"none": "發送中",
		"manuallySuspended": "手動暫停中",
		"goneSuspended": "因為伺服器刪除所以暫停中",
		"autoSuspendedForNotResponding": "因為伺服器沒有回應所以暫停中",
		"softwareSuspended": "此軟體因已停止發佈，目前無法使用"
	},
	"deliveryStop": "停止發送",
	"deliveryResume": "恢復發送",
	"blockThisInstance": "封鎖此伺服器",
	"silenceThisInstance": "禁言此伺服器",
	"mediaSilenceThisInstance": "將這個伺服器的媒體設為禁言（隱藏媒體預覽）",
	"moderationNote": "管理筆記",
	"moderationNoteDescription": "您可以編寫僅在審查員之間共用的註解。",
	"registeredAt": "初次觀測",
	"updatedAt": "最後更新",
	"latestRequestReceivedAt": "上次收到的請求",
	"recentNHours": "過去 {n} 小時",
	"recentNDays": "過去 {n} 天",
	"instanceChartsRequests": "請求",
	"instanceChartsUsers": "使用者增減",
	"instanceChartsUsersTotal": "使用者總數",
	"instanceChartsNotes": "貼文增減",
	"instanceChartsNotesTotal": "累計貼文",
	"instanceChartsFf": "追隨／追隨者增減",
	"instanceChartsFfTotal": "追隨／追隨者總數",
	"instanceChartsCacheSize": "快取用量增減",
	"instanceChartsCacheSizeTotal": "快取用量總數",
	"instanceChartsFiles": "檔案總數增減",
	"instanceChartsFilesTotal": "檔案總數累計",
	"overview": "概覽",
	"charts": "圖表",
	"users": "使用者"
}
</locale>
