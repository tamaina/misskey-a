<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/performance" :label="$locale.sfc.performance" :keywords="['performance']" icon="ti ti-bolt">
			<div class="_gaps">
				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableServerMachineStats" @change="onChange_enableServerMachineStats">
							<template #label><SearchLabel>{{ $locale.sfc.enableServerMachineStats }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableIdenticonGeneration" @change="onChange_enableIdenticonGeneration">
							<template #label><SearchLabel>{{ $locale.sfc.enableIdenticonGeneration }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableChartsForRemoteUser" @change="onChange_enableChartsForRemoteUser">
							<template #label><SearchLabel>{{ $locale.sfc.enableChartsForRemoteUser }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableStatsForFederatedInstances" @change="onChange_enableStatsForFederatedInstances">
							<template #label><SearchLabel>{{ $locale.sfc.enableStatsForFederatedInstances }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableChartsForFederatedInstances" @change="onChange_enableChartsForFederatedInstances">
							<template #label><SearchLabel>{{ $locale.sfc.enableChartsForFederatedInstances }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="showRoleBadgesOfRemoteUsers" @change="onChange_showRoleBadgesOfRemoteUsers">
							<template #label><SearchLabel>{{ $locale.sfc.showRoleBadgesOfRemoteUsers }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<MkFolder :defaultOpen="true">
						<template #icon><SearchIcon><i class="ti ti-bolt"></i></SearchIcon></template>
						<template #label><SearchLabel>Misskey® Fan-out Timeline Technology™ (FTT)</SearchLabel></template>
						<template v-if="fttForm.savedState.enableFanoutTimeline" #suffix>Enabled</template>
						<template v-else #suffix>Disabled</template>
						<template v-if="fttForm.modified.value" #footer>
							<MkFormFooter :form="fttForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker>
								<MkSwitch v-model="fttForm.state.enableFanoutTimeline">
									<template #label><SearchLabel>{{ $locale.sfc.enable }}</SearchLabel><span v-if="fttForm.modifiedStates.enableFanoutTimeline" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption>
										<div><SearchText>{{ $locale.sfc.fanoutTimelineDescription }}</SearchText></div>
										<div><MkLink target="_blank" url="https://misskey-hub.net/docs/for-admin/features/ftt/">{{ $locale.sfc.details }}</MkLink></div>
									</template>
								</MkSwitch>
							</SearchMarker>

							<template v-if="fttForm.state.enableFanoutTimeline">
								<SearchMarker :keywords="['db', 'database', 'fallback']">
									<MkSwitch v-model="fttForm.state.enableFanoutTimelineDbFallback">
										<template #label><SearchLabel>{{ $locale.sfc.fanoutTimelineDbFallback }}</SearchLabel><span v-if="fttForm.modifiedStates.enableFanoutTimelineDbFallback" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption><SearchText>{{ $locale.sfc.fanoutTimelineDbFallbackDescription }}</SearchText></template>
									</MkSwitch>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="fttForm.state.perLocalUserUserTimelineCacheMax" type="number">
										<template #label><SearchLabel>perLocalUserUserTimelineCacheMax</SearchLabel><span v-if="fttForm.modifiedStates.perLocalUserUserTimelineCacheMax" class="_modified">{{ $locale.sfc.modified }}</span></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="fttForm.state.perRemoteUserUserTimelineCacheMax" type="number">
										<template #label><SearchLabel>perRemoteUserUserTimelineCacheMax</SearchLabel><span v-if="fttForm.modifiedStates.perRemoteUserUserTimelineCacheMax" class="_modified">{{ $locale.sfc.modified }}</span></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="fttForm.state.perUserHomeTimelineCacheMax" type="number">
										<template #label><SearchLabel>perUserHomeTimelineCacheMax</SearchLabel><span v-if="fttForm.modifiedStates.perUserHomeTimelineCacheMax" class="_modified">{{ $locale.sfc.modified }}</span></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="fttForm.state.perUserListTimelineCacheMax" type="number">
										<template #label><SearchLabel>perUserListTimelineCacheMax</SearchLabel><span v-if="fttForm.modifiedStates.perUserListTimelineCacheMax" class="_modified">{{ $locale.sfc.modified }}</span></template>
									</MkInput>
								</SearchMarker>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker>
					<MkFolder :defaultOpen="true">
						<template #icon><SearchIcon><i class="ti ti-bolt"></i></SearchIcon></template>
						<template #label><SearchLabel>Misskey® Reactions Boost Technology™ (RBT)</SearchLabel></template>
						<template v-if="rbtForm.savedState.enableReactionsBuffering" #suffix>Enabled</template>
						<template v-else #suffix>Disabled</template>
						<template v-if="rbtForm.modified.value" #footer>
							<MkFormFooter :form="rbtForm"/>
						</template>

						<div class="_gaps_m">
							<SearchMarker>
								<MkSwitch v-model="rbtForm.state.enableReactionsBuffering">
									<template #label><SearchLabel>{{ $locale.sfc.enable }}</SearchLabel><span v-if="rbtForm.modifiedStates.enableReactionsBuffering" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.reactionsBufferingDescription }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker>
					<MkFolder :defaultOpen="true">
						<template #icon><SearchIcon><i class="ti ti-recycle"></i></SearchIcon></template>
						<template #label><SearchLabel>Remote Notes Cleaning (仮)</SearchLabel></template>
						<template v-if="remoteNotesCleaningForm.savedState.enableRemoteNotesCleaning" #suffix>Enabled</template>
						<template v-else #suffix>Disabled</template>
						<template v-if="remoteNotesCleaningForm.modified.value" #footer>
							<MkFormFooter :form="remoteNotesCleaningForm"/>
						</template>

						<div class="_gaps_m">
							<MkSwitch v-model="remoteNotesCleaningForm.state.enableRemoteNotesCleaning">
								<template #label><SearchLabel>{{ $locale.sfc.enable }}</SearchLabel><span v-if="remoteNotesCleaningForm.modifiedStates.enableRemoteNotesCleaning" class="_modified">{{ $locale.sfc.modified }}</span></template>
								<template #caption><SearchText>{{ $locale.sfc.remoteNotesCleaning_description }}</SearchText></template>
							</MkSwitch>

							<template v-if="remoteNotesCleaningForm.state.enableRemoteNotesCleaning">
								<MkInput v-model="remoteNotesCleaningForm.state.remoteNotesCleaningExpiryDaysForEachNotes" type="number">
									<template #label><SearchLabel>{{ $locale.sfc.remoteNotesCleaningExpiryDaysForEachNotes }}</SearchLabel> ({{ $locale.sfc.inDays }})<span v-if="remoteNotesCleaningForm.modifiedStates.remoteNotesCleaningExpiryDaysForEachNotes" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #suffix>{{ $locale.sfc.day }}</template>
								</MkInput>

								<MkInput v-model="remoteNotesCleaningForm.state.remoteNotesCleaningMaxProcessingDurationInMinutes" type="number">
									<template #label><SearchLabel>{{ $locale.sfc.remoteNotesCleaningMaxProcessingDuration }}</SearchLabel> ({{ $locale.sfc.inMinutes }})<span v-if="remoteNotesCleaningForm.modifiedStates.remoteNotesCleaningMaxProcessingDurationInMinutes" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #suffix>{{ $locale.sfc.minute }}</template>
								</MkInput>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { fetchInstance } from '@features/instance/frontend/instance.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import { useForm } from '@features/ui/frontend/composables/use-form.js';
import MkFormFooter from '@features/ui/frontend/components/MkFormFooter.vue';

const meta = await misskeyApi('admin/meta');

const enableServerMachineStats = ref(meta.enableServerMachineStats);
const enableIdenticonGeneration = ref(meta.enableIdenticonGeneration);
const enableChartsForRemoteUser = ref(meta.enableChartsForRemoteUser);
const enableStatsForFederatedInstances = ref(meta.enableStatsForFederatedInstances);
const enableChartsForFederatedInstances = ref(meta.enableChartsForFederatedInstances);
const showRoleBadgesOfRemoteUsers = ref(meta.showRoleBadgesOfRemoteUsers);

function onChange_enableServerMachineStats(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableServerMachineStats: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableIdenticonGeneration(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableIdenticonGeneration: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableChartsForRemoteUser(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableChartsForRemoteUser: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableStatsForFederatedInstances(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableStatsForFederatedInstances: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableChartsForFederatedInstances(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableChartsForFederatedInstances: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_showRoleBadgesOfRemoteUsers(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		showRoleBadgesOfRemoteUsers: value,
	}).then(() => {
		fetchInstance(true);
	});
}

const fttForm = useForm({
	enableFanoutTimeline: meta.enableFanoutTimeline,
	enableFanoutTimelineDbFallback: meta.enableFanoutTimelineDbFallback,
	perLocalUserUserTimelineCacheMax: meta.perLocalUserUserTimelineCacheMax,
	perRemoteUserUserTimelineCacheMax: meta.perRemoteUserUserTimelineCacheMax,
	perUserHomeTimelineCacheMax: meta.perUserHomeTimelineCacheMax,
	perUserListTimelineCacheMax: meta.perUserListTimelineCacheMax,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableFanoutTimeline: state.enableFanoutTimeline,
		enableFanoutTimelineDbFallback: state.enableFanoutTimelineDbFallback,
		perLocalUserUserTimelineCacheMax: state.perLocalUserUserTimelineCacheMax,
		perRemoteUserUserTimelineCacheMax: state.perRemoteUserUserTimelineCacheMax,
		perUserHomeTimelineCacheMax: state.perUserHomeTimelineCacheMax,
		perUserListTimelineCacheMax: state.perUserListTimelineCacheMax,
	});
	fetchInstance(true);
});

const rbtForm = useForm({
	enableReactionsBuffering: meta.enableReactionsBuffering,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableReactionsBuffering: state.enableReactionsBuffering,
	});
	fetchInstance(true);
});

const remoteNotesCleaningForm = useForm({
	enableRemoteNotesCleaning: meta.enableRemoteNotesCleaning,
	remoteNotesCleaningExpiryDaysForEachNotes: meta.remoteNotesCleaningExpiryDaysForEachNotes,
	remoteNotesCleaningMaxProcessingDurationInMinutes: meta.remoteNotesCleaningMaxProcessingDurationInMinutes,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableRemoteNotesCleaning: state.enableRemoteNotesCleaning,
		remoteNotesCleaningExpiryDaysForEachNotes: state.remoteNotesCleaningExpiryDaysForEachNotes,
		remoteNotesCleaningMaxProcessingDurationInMinutes: state.remoteNotesCleaningMaxProcessingDurationInMinutes,
	});
	fetchInstance(true);
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.performance,
	icon: 'ti ti-bolt',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "نشر إحصائيات عتاد الخادم",
	"turnOffToImprovePerformance": "تفعيله قد يزيد الأداء.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "تشغيل",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "التفاصيل",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "ي",
	"day": "ي",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "د",
	"minute": "د"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"performance": "Rendiment",
	"enableServerMachineStats": "Publicar estadístiques del maquinari del servidor",
	"turnOffToImprovePerformance": "Desactivant aquesta opció es pot millorar el rendiment.",
	"enableIdenticonGeneration": "Activar la generació d'icones d'identificació ",
	"enableChartsForRemoteUser": "Generar gràfiques d'usuaris remots",
	"enableStatsForFederatedInstances": "Activa les estadístiques de les instàncies remotes federades",
	"enableChartsForFederatedInstances": "Generar gràfiques d'instàncies remotes",
	"showRoleBadgesOfRemoteUsers": "Mostrar insígnies de rols d'instàncies remotes ",
	"enable": "Habilita",
	"modified": "Modificat",
	"fanoutTimelineDescription": "Quan es troba activat millora bastant el rendiment quan es recuperen les línies de temps i redueix la carrega de la base de dades. Com a contrapunt, l'ús de memòria de Redis es veurà incrementada. Considera d'estabilitat aquesta opció en cas de tenir un servidor amb poca memòria o si tens problemes de inestabilitat.",
	"details": "Detalls",
	"fanoutTimelineDbFallback": "Carregar de la base de dades",
	"fanoutTimelineDbFallbackDescription": "Quan s'activa, la línia de temps fa servir la base de dades per consultes adicionals si la línia de temps no es troba a la memòria cau. Si és desactiva la càrrega del servidor és veure reduïda, però també és reduirà el nombre de línies de temps que és poden obtenir.",
	"reactionsBufferingDescription": "Quan s'activa aquesta opció millora bastant el rendiment en recuperar les línies de temps reduint la càrrega de la base. Com a contrapunt, augmentarà  l'ús de memòria de Redís. Desactiva aquesta opció en cas de tenir un servidor amb poca memòria o si tens problemes d'inestabilitat.",
	"remoteNotesCleaning_description": "Quan activis aquesta opció, periòdicament es netejaran les notes remotes que no es consultin, això evitarà que la base de dades se",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Duració mínima de conservació de les notes",
	"inDays": "Di(a)(es)",
	"day": "Di(a)(es)",
	"remoteNotesCleaningMaxProcessingDuration": "Duració màxima del temps de funcionament del procés de neteja",
	"inMinutes": "Minut(s)",
	"minute": "Minut(s)"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Zveřejněnit statistiky hardwaru serveru",
	"turnOffToImprovePerformance": "Vypnutí této funkce může zvýšit výkon.",
	"enableIdenticonGeneration": "Povolit generování identicon uživatele",
	"enableChartsForRemoteUser": "Vygenerovat grafy dat vzdálených uživatelů",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Vygenerovat grafy dat vzdálených instancí",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Povolit",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Detaily",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "Dnů",
	"day": "Dnů",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "Minut",
	"minute": "Minut"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Enable",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Details",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "Day(s)",
	"day": "Day(s)",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "Minute(s)",
	"minute": "Minute(s)"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"performance": "Leistung",
	"enableServerMachineStats": "Hardwareinformationen des Servers veröffentlichen",
	"turnOffToImprovePerformance": "Deaktivierung kann zu höherer Leistung führen.",
	"enableIdenticonGeneration": "Generierung von Benutzer-Identicons aktivieren",
	"enableChartsForRemoteUser": "Diagramme für Nutzer fremder Instanzen erstellen",
	"enableStatsForFederatedInstances": "Abruf von Informationen über förderierte Server",
	"enableChartsForFederatedInstances": "Diagramme für fremde Instanzen erstellen",
	"showRoleBadgesOfRemoteUsers": "Rollensymbole anzeigen, die Remote-Benutzern zugewiesen wurden.",
	"enable": "Aktivieren",
	"modified": "Bearbeitet",
	"fanoutTimelineDescription": "Ist diese Option aktiviert, kann eine erhebliche Verbesserung im Abrufen von Chroniken und eine Reduzierung der Datenbankbelastung erzielt werden, im Gegenzug zu einer Steigerung in der Speichernutzung von Redis. Bei geringem Serverspeicher oder Serverinstabilität kann diese Option deaktiviert werden.",
	"details": "Details",
	"fanoutTimelineDbFallback": "Auf die Datenbank zurückfallen",
	"fanoutTimelineDbFallbackDescription": "Ist diese Option aktiviert, wird die Chronik auf zusätzliche Abfragen in der Datenbank zurückgreifen, wenn sich die Chronik nicht im Cache befindet. Eine Deaktivierung führt zu geringerer Serverlast, aber schränkt den Zeitraum der abrufbaren Chronik ein. ",
	"reactionsBufferingDescription": "Wenn diese Option aktiviert ist, kann sie die Leistung beim Erstellen von Reaktionen erheblich verbessern und die Belastung der Datenbank verringern. Allerdings steigt die Speichernutzung von Redis.",
	"remoteNotesCleaning_description": "Wenn diese Option aktiviert ist, werden Remote-Beiträge, die eine bestimmte Zeit überschritten haben, regelmäßig bereinigt, um ein Aufblähen der Datenbank zu verhindern.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Mindestaufbewahrungsdauer für Notizen",
	"inDays": "Tag(en)",
	"day": "Tag(en)",
	"remoteNotesCleaningMaxProcessingDuration": "Maximale fortlaufende Dauer des Reinigungsverarbeitungsprozesses",
	"inMinutes": "Minute(n)",
	"minute": "Minute(n)"
}
</locale>

<locale locale="en-US" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Enable",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Details",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "Day(s)",
	"day": "Day(s)",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "Minute(s)",
	"minute": "Minute(s)"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"performance": "Rendimiento",
	"enableServerMachineStats": "Publicar estadísticas de hardware del servidor",
	"turnOffToImprovePerformance": "Desactivar esto puede aumentar el rendimiento.",
	"enableIdenticonGeneration": "Activar generación de identicon por usuario",
	"enableChartsForRemoteUser": "Generar gráficas de usuarios remotos.",
	"enableStatsForFederatedInstances": "Activar las estadísticas de las instancias remotas federadas",
	"enableChartsForFederatedInstances": "Generar gráficos de servidores remotos",
	"showRoleBadgesOfRemoteUsers": "Mostrar la insignia de rol asignada a los usuarios remotos.",
	"enable": "Activar",
	"modified": "Modificado",
	"fanoutTimelineDescription": "Incrementa el rendimiento de forma significativa cuando se obtienen las líneas de tiempo y reduce la carga en la base de datos. A cambio, el uso de la memoria en Redis incrementará. Considera desactivar esta opción en caso de que tu servidor tenga poca memoria o detectes inestabilidad.",
	"details": "Detalles",
	"fanoutTimelineDbFallback": "Cargar desde la base de datos",
	"fanoutTimelineDbFallbackDescription": "Cuando esta opción está habilitada, la carga de peticiones adicionales de la línea de tiempo se hará desde la base de datos cuando éstas no se encuentren en la caché. Al deshabilitar esta opción se reduce la carga del servidor, pero limita el número de líneas de tiempo que pueden obtenerse.",
	"reactionsBufferingDescription": "Cuando se activa, el rendimiento durante la creación de reacciones mejorará considerablemente, reduciendo la carga de la base de datos. Sin embargo, aumentará el uso de memoria de Redis.",
	"remoteNotesCleaning_description": "Al habilitar esta opción, se limpiarán periódicamente las entradas remotas antiguas que no se consultan, lo que evitará que la base de datos se sature.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Días mínimos para conservar las notas",
	"inDays": "Días",
	"day": "Días",
	"remoteNotesCleaningMaxProcessingDuration": "Tiempo máximo de funcionamiento continuo del proceso de limpieza",
	"inMinutes": "Minutos",
	"minute": "Minutos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publier les statistiques du matériel du serveur",
	"turnOffToImprovePerformance": "Désactiver peut améliorer la performance.",
	"enableIdenticonGeneration": "Générer les identicons des utilisateurs",
	"enableChartsForRemoteUser": "Générer les graphiques pour les utilisateurs distants",
	"enableStatsForFederatedInstances": "Recevoir les statistiques des instances distantes",
	"enableChartsForFederatedInstances": "Générer les graphiques pour les instances distantes",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Activer",
	"modified": "Modifié",
	"fanoutTimelineDescription": "Si activée, la performance de la récupération de la chronologie augmentera considérablement et la charge sur la base de données sera réduite. En revanche, l'utilisation de la mémoire de Redis augmentera. Considérez désactiver cette option si le serveur est bas en mémoire ou instable.",
	"details": "Détails",
	"fanoutTimelineDbFallback": "Recours à la base de données",
	"fanoutTimelineDbFallbackDescription": "Si activée, une demande supplémentaire à la base de données est effectuée comme solution de rechange quand le fil n'est pas mis en cache. Si désactivée, la demande à la base de données n'est pas effectuée, ce qui réduit davantage la charge du serveur mais limite l'étendue du fil récupérable.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "j",
	"day": "j",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "min",
	"minute": "min"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"performance": "Kinerja",
	"enableServerMachineStats": "Tampilkan informasi mesin peladen menjadi publik",
	"turnOffToImprovePerformance": "Matikan untuk tingkatkan performa.",
	"enableIdenticonGeneration": "Nyalakan pembuatan Identicon per pengguna",
	"enableChartsForRemoteUser": "Buat bagan data pengguna instansi luar",
	"enableStatsForFederatedInstances": "Terima informasi peladen luar",
	"enableChartsForFederatedInstances": "Buat bagan data peladen instansi luar",
	"showRoleBadgesOfRemoteUsers": "Tampilkan lencana peran untuk pengguna jarak jauh",
	"enable": "Aktifkan",
	"modified": "Diubah",
	"fanoutTimelineDescription": "Dapat meningkatkan performa dalam pengambilan data linimasa dan mengurangi beban pada database ketika dinyalakan. Sebagai gantinya, penggunaan memory pada Redis akan meningkan. Pertimbangkan untuk menonaktifkan fitur ini jika mengalami kekurangan memori pada server atau menyebabkan server tidak stabil.",
	"details": "Selengkapnya",
	"fanoutTimelineDbFallback": "Fallback ke database",
	"fanoutTimelineDbFallbackDescription": "Ketika diaktifkan, lini masa akan fallback ke database untuk melakukan kueri tambahan apabila linimasa tidak disimpan dalam cache. Menonaktifkan ini dapat mengurangi beban server dengan mengeliminasi proses fallback, namun dapat berakibat membatasi jarak data dari lini masa yang dapat diambil.",
	"reactionsBufferingDescription": "Ketika diaktifkan, performa saat membuat reaksi akan meningkat drastis, mengurangi beban database. Namun, penggunaan memori Redis akan meningkat.",
	"remoteNotesCleaning_description": "Ketika diaktifkan, note yang tidak terpakai dan kadaluarsa dari instansi luar akan dibersihkan secara berkala untuk mencegah membengkaknya database.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "hari",
	"day": "hari",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "menit",
	"minute": "menit"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"performance": "Prestazioni",
	"enableServerMachineStats": "Pubblicare le informazioni sul server",
	"turnOffToImprovePerformance": "Disattiva, per migliorare le prestazioni",
	"enableIdenticonGeneration": "Generazione automatica delle Identicon",
	"enableChartsForRemoteUser": "Abilita i grafici per i profili remoti",
	"enableStatsForFederatedInstances": "Informazioni statistiche sui server federati",
	"enableChartsForFederatedInstances": "Abilita i grafici per le istanze federate",
	"showRoleBadgesOfRemoteUsers": "Visualizza i badge per i ruoli concessi ai profili remoti",
	"enable": "Abilita",
	"modified": "Modificato",
	"fanoutTimelineDescription": "Attivando questa funzionalità migliori notevolmente la capacità delle Timeline di collezionare Note, riducendo il carico sul database. Tuttavia, aumenterà l'impiego di memoria RAM per Redis. Disattiva se il tuo server ha poca RAM o la funzionalità è irregolare.",
	"details": "Dettagli",
	"fanoutTimelineDbFallback": "Elaborazione dati alternativa",
	"fanoutTimelineDbFallbackDescription": "Attivando l'elaborazione alternativa, verrà interrogato ulteriormente il database se la timeline non è nella cache. \nDisattivando, si può ridurre ulteriormente il carico del server, evitando l'elaborazione alternativa, ma limitando l'intervallo recuperabile delle timeline.",
	"reactionsBufferingDescription": "Attivando questa opzione, puoi migliorare significativamente le prestazioni durante la creazione delle reazioni e ridurre il carico sul database. Tuttavia, aumenterà l'impiego di memoria Redis.",
	"remoteNotesCleaning_description": "Se abilitata, verranno periodicamente rimosse le vecchie Note remote senza relazioni, per ridurre il sovraccarico del sistema.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Periodo minimo di conservazione delle note",
	"inDays": "giorni",
	"day": "giorni",
	"remoteNotesCleaningMaxProcessingDuration": "Durata massima del processo di pulizia",
	"inMinutes": "min",
	"minute": "min"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"performance": "パフォーマンス",
	"enableServerMachineStats": "サーバーのマシン情報を公開する",
	"turnOffToImprovePerformance": "オフにするとパフォーマンスが向上します。",
	"enableIdenticonGeneration": "ユーザーごとのIdenticon生成を有効にする",
	"enableChartsForRemoteUser": "リモートユーザーのチャートを生成",
	"enableStatsForFederatedInstances": "リモートサーバーの情報を取得",
	"enableChartsForFederatedInstances": "リモートサーバーのチャートを生成",
	"showRoleBadgesOfRemoteUsers": "リモートユーザーに付与したロールバッジを表示する",
	"enable": "有効にする",
	"modified": "変更あり",
	"fanoutTimelineDescription": "有効にすると、各種タイムラインを取得する際のパフォーマンスが大幅に向上し、データベースへの負荷を軽減することが可能です。ただし、Redisのメモリ使用量は増加します。サーバーのメモリ容量が少ない場合、または動作が不安定な場合は無効にすることができます。",
	"details": "詳細",
	"fanoutTimelineDbFallback": "データベースへのフォールバック",
	"fanoutTimelineDbFallbackDescription": "有効にすると、タイムラインがキャッシュされていない場合にDBへ追加で問い合わせを行うフォールバック処理を行います。無効にすると、フォールバック処理を行わないことでさらにサーバーの負荷を軽減することができますが、タイムラインが取得できる範囲に制限が生じます。",
	"reactionsBufferingDescription": "有効にすると、リアクション作成時のパフォーマンスが大幅に向上し、データベースへの負荷を軽減することが可能です。ただし、Redisのメモリ使用量は増加します。",
	"remoteNotesCleaning_description": "有効にすると、一定期間経過したリモートの投稿を定期的にクリーンアップしてデータベースの肥大化を抑制します。",
	"remoteNotesCleaningExpiryDaysForEachNotes": "最低ノート保持日数",
	"inDays": "日",
	"day": "日",
	"remoteNotesCleaningMaxProcessingDuration": "最大クリーニング処理継続時間",
	"inMinutes": "分",
	"minute": "分"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"performance": "パフォーマンス",
	"enableServerMachineStats": "サーバーのマシン情報見せびらかすで",
	"turnOffToImprovePerformance": "オフにしたらえらい軽うなるで。",
	"enableIdenticonGeneration": "ユーザーごとのIdenticon生成を有効にする",
	"enableChartsForRemoteUser": "リモートユーザーのチャートを作る",
	"enableStatsForFederatedInstances": "リモートサーバの情報を取得",
	"enableChartsForFederatedInstances": "リモートサーバーのチャートを作る",
	"showRoleBadgesOfRemoteUsers": "リモートユーザーに付与したロールバッジを表示する",
	"enable": "有効にするで",
	"modified": "変更あり",
	"fanoutTimelineDescription": "入れると、おのおのタイムラインを取得するときにめちゃめちゃ動きが良うなって、データベースが軽くなるわ。でも、Redisのメモリ使う量が増えるから注意な。サーバーのメモリが足りんときとか、動きが変なときは切れるで。",
	"details": "もっと",
	"fanoutTimelineDbFallback": "データベースにフォールバックする",
	"fanoutTimelineDbFallbackDescription": "有効にしたら、タイムラインがキャッシュん中に入ってないときにDBにもっかい問い合わせるフォールバック処理ってのをやっとくで。切ったらフォールバック処理をやらんからサーバーはもっと軽くなんねんけど、タイムラインの取得範囲がちょっと減るで。",
	"reactionsBufferingDescription": "有効にしたら、リアクション作るときのパフォーマンスがすっごい上がって、データベースへの負荷が減るで。代わりに、Redisのメモリ使用は増えるで。",
	"remoteNotesCleaning_description": "つけると、参照されてへん古いリモートの投稿を定期的にクリーンアップしてデータベースの肥大化を抑えてくれるで。",
	"remoteNotesCleaningExpiryDaysForEachNotes": "最低ノート保持日数",
	"inDays": "日",
	"day": "日",
	"remoteNotesCleaningMaxProcessingDuration": "最大クリーニング処理継続時間",
	"inMinutes": "分",
	"minute": "分"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Enable",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Details",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "Day(s)",
	"day": "Day(s)",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "Minute(s)",
	"minute": "Minute(s)"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Enable",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Details",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "Day(s)",
	"day": "Day(s)",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "Minute(s)",
	"minute": "Minute(s)"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"performance": "퍼포먼스",
	"enableServerMachineStats": "서버의 머신 사양을 공개하기",
	"turnOffToImprovePerformance": "이 기능을 끄면 성능이 향상될 수 있습니다.",
	"enableIdenticonGeneration": "유저마다의 Identicon 생성 유효화",
	"enableChartsForRemoteUser": "리모트 유저의 차트를 생성",
	"enableStatsForFederatedInstances": "리모트 서버 정보 받아오기",
	"enableChartsForFederatedInstances": "리모트 서버의 차트를 생성",
	"showRoleBadgesOfRemoteUsers": "리모트 유저의 역할 배지 표시",
	"enable": "사용",
	"modified": "변경 있음",
	"fanoutTimelineDescription": "활성화하면 각종 타임라인을 가져올 때의 성능을 대폭 향상하며, 데이터베이스의 부하를 줄일 수 있습니다. 단, Redis의 메모리 사용량이 증가합니다. 서버의 메모리 용량이 작거나, 서비스가 불안정해지는 경우 비활성화할 수 있습니다.",
	"details": "자세히",
	"fanoutTimelineDbFallback": "데이터베이스를 예비로 사용하기",
	"fanoutTimelineDbFallbackDescription": "활성화하면 타임라인의 캐시되어 있지 않은 부분에 대해 DB에 질의하여 정보를 가져옵니다. 비활성화하면 이를 실행하지 않음으로써 서버의 부하를 줄일 수 있지만, 타임라인에서 가져올 수 있는 게시물 범위가 한정됩니다.",
	"reactionsBufferingDescription": "활성화 한 경우, 리액션 작성 퍼포먼스가 대폭 향상되어 DB의 부하를 줄일 수 있으나, Redis의 메모리 사용량이 많아집니다.",
	"remoteNotesCleaning_description": "더 이상 사용되지 않는 오래된 리모트 노트를 정기적으로 정리하여, 데이터 베이스의 사용량을 절약할 수 있습니다.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "리모트 노트 저장 최소 일수",
	"inDays": "일",
	"day": "일",
	"remoteNotesCleaningMaxProcessingDuration": "리모트 노트 자동 정리 최대 실행 시간",
	"inMinutes": "분",
	"minute": "분"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Statistieken van remote servers ontvangen",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Inschakelen",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Details",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "Day(s)",
	"day": "Day(s)",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "Minute(s)",
	"minute": "Minute(s)"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Enable",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Details",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "Dager",
	"day": "Dager",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "Minutter",
	"minute": "Minutter"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Włącz",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Szczegóły",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "dzień",
	"day": "dzień",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "minuta",
	"minute": "minuta"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"performance": "Desempenho",
	"enableServerMachineStats": "Publicar estatísticas do hardware do servidor",
	"turnOffToImprovePerformance": "Desligar isso pode melhorar o desempenho.",
	"enableIdenticonGeneration": "Habilitar geração de identicon de usuário",
	"enableChartsForRemoteUser": "Gerar gráficos estatísticos de usuários remotos",
	"enableStatsForFederatedInstances": "Receber estatísticas de servidores remotos",
	"enableChartsForFederatedInstances": "Gerar gráficos estatísticos de instâncias remotas",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Habilitar",
	"modified": "Modificado",
	"fanoutTimelineDescription": "Melhora significativamente a performance do retorno da linha do tempo e reduz o impacto no banco de dados quando habilitado. Em contrapartida, o uso de memória do Redis aumentará. Considere desabilitar em casos de baixa disponibilidade de memória ou instabilidade do servidor.",
	"details": "Detalhes",
	"fanoutTimelineDbFallback": "\"Fallback\" ao banco de dados",
	"fanoutTimelineDbFallbackDescription": "Quando habilitado, a linha do tempo irá recuar ao banco de dados caso consultas adicionais sejam feitas e ela não estiver em cache. Quando desabilitado, o impacto no servidor será reduzido ao eliminar o recuo, mas limita a quantidade de linhas do tempo que podem ser recebidas.",
	"reactionsBufferingDescription": "Quando ativado, o desempenho durante a criação de uma reação será melhorado substancialmente, reduzindo a carga do banco de dados. Porém, a o uso de memória do Redis irá aumentar.",
	"remoteNotesCleaning_description": "Quando habilitado, notas remotas obsoletas e não utilizadas serão periodicamente limpadas para previnir sobrecarga no banco de dados.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Mínimo de dias para retenção de notas",
	"inDays": "Dia(s)",
	"day": "Dia(s)",
	"remoteNotesCleaningMaxProcessingDuration": "Maximizar tempo de processamento da limpeza",
	"inMinutes": "Minuto(s)",
	"minute": "Minuto(s)"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"performance": "Производительность",
	"enableServerMachineStats": "Опубликовать характеристики сервера",
	"turnOffToImprovePerformance": "Отключение этого параметра может повысить производительность.",
	"enableIdenticonGeneration": "Включить генерацию иконки пользователя",
	"enableChartsForRemoteUser": "Создание диаграмм для удалённых пользователей",
	"enableStatsForFederatedInstances": "Получить информацию об удаленном сервере",
	"enableChartsForFederatedInstances": "Создание диаграмм для удалённых серверов",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Включить",
	"modified": "Изменено",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Подробнее",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "сут",
	"day": "сут",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "мин",
	"minute": "мин"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Povoliť",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Detaily",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "dní",
	"day": "dní",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "min",
	"minute": "min"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"performance": "ประสิทธิภาพ\u200b",
	"enableServerMachineStats": "เผยแพร่สถานะฮาร์ดแวร์ของเซิร์ฟเวอร์",
	"turnOffToImprovePerformance": "การปิดส่วนนี้สามารถเพิ่มประสิทธิภาพได้",
	"enableIdenticonGeneration": "เปิดใช้งานผู้ใช้สร้างตัวระบุ",
	"enableChartsForRemoteUser": "สร้างแผนภูมิข้อมูลผู้ใช้ระยะไกล",
	"enableStatsForFederatedInstances": "ดึงข้อมูลจากเซิร์ฟเวอร์ระยะไกล",
	"enableChartsForFederatedInstances": "สร้างแผนภูมิของเซิร์ฟเวอร์ระยะไกล",
	"showRoleBadgesOfRemoteUsers": "แสดงตราบทบาทที่มอบให้กับผู้ใช้ระยะไกล",
	"enable": "เปิดใช้งาน",
	"modified": "แก้ไข",
	"fanoutTimelineDescription": "เพิ่มประสิทธิภาพการดึงข้อมูลไทม์ไลน์อย่างมาก และลดภาระในฐานข้อมูลเมื่อเปิดใช้งาน ในทางกลับกัน การใช้หน่วยความจำของ Redis จะเพิ่มขึ้น ลองปิดการใช้งานนี้ในกรณีที่หน่วยความจำเซิร์ฟเวอร์เหลือน้อยหรือเซิร์ฟเวอร์ไม่เสถียร",
	"details": "รายละเอียด",
	"fanoutTimelineDbFallback": "ฟอลแบ๊กกลับฐานข้อมูล",
	"fanoutTimelineDbFallbackDescription": "เมื่อเปิดใช้งาน หากไม่ได้แคชไทม์ไลน์ ไทม์ไลน์จะฟอลแบ๊กไปยังฐานข้อมูลสำหรับการ query เพิ่มเติม การปิดใช้งานจะช่วยลดภาระของเซิร์ฟเวอร์ด้วยการกำจัดกระบวนฟอลแบ๊ก แต่มันก็จะจำกัดช่วงเวลาไทม์ไลน์ที่สามารถดึงข้อมูลได้",
	"reactionsBufferingDescription": "เมื่อเปิดใช้งานฟังก์ชันนี้ก็จะช่วยลด latency ในการสร้างปฏิกิริยา แต่อาจจะส่งผลให้ memory footprint ของ Redis เพิ่มขึ้นนะ",
	"remoteNotesCleaning_description": "เมื่อเปิดใช้งาน จะทำการล้างโพสต์จากระยะไกลเก่าที่ไม่ถูกอ้างอิง เป็นระยะ เพื่อลดการขยายตัวของฐานข้อมูล",
	"remoteNotesCleaningExpiryDaysForEachNotes": "จำนวนวันที่ต้องเก็บโน้ตไว้อย่างน้อย",
	"inDays": "วัน",
	"day": "วัน",
	"remoteNotesCleaningMaxProcessingDuration": "ระยะเวลาสูงสุดของการประมวลผลการล้างข้อมูล",
	"inMinutes": "นาที",
	"minute": "นาที"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"performance": "Başarım",
	"enableServerMachineStats": "Sunucu donanım istatistiklerini yayınla",
	"turnOffToImprovePerformance": "Devre dışı bırakma, daha yüksek performansa yol açabilir.",
	"enableIdenticonGeneration": "Kullanıcı identicon oluşturmayı etkinleştir",
	"enableChartsForRemoteUser": "Uzak kullanıcı veri grafikleri oluşturun",
	"enableStatsForFederatedInstances": "Uzak sunucu istatistiklerini alın",
	"enableChartsForFederatedInstances": "Uzak sunucu veri grafikleri oluşturun",
	"showRoleBadgesOfRemoteUsers": "Uzaktan kullanıcılara verilen rol rozetlerini görüntüle",
	"enable": "Etkin",
	"modified": "Değiştirilmiş",
	"fanoutTimelineDescription": "Etkinleştirildiğinde Pano alma performansını büyük ölçüde artırır ve veritabanı yükünü azaltır. Bunun karşılığında Redis'in bellek kullanımı artacaktır. Sunucu belleği düşükse veya sunucu kararsızsa bunu devre dışı bırakmayı düşün.",
	"details": "Ayrıntılar",
	"fanoutTimelineDbFallback": "Veritabanına geri dön",
	"fanoutTimelineDbFallbackDescription": "Etkinleştirildiğinde, Pano önbelleğe alınmamışsa ek sorgular için veritabanına geri döner. Bu özelliği devre dışı bırakmak, geri dönüş sürecini ortadan kaldırarak sunucu yükünü daha da azaltır, ancak alınabilecek panoların aralığını sınırlar.",
	"reactionsBufferingDescription": "Etkinleştirildiğinde, reaksiyon oluşturma sırasında performans büyük ölçüde artacak ve veritabanı üzerindeki yük azalacaktır. Ancak, Redis bellek kullanımı artacakt.",
	"remoteNotesCleaning_description": "Etkinleştirildiğinde, kullanılmayan ve güncelliğini yitirmiş uzak notlar, veritabanının şişmesini önlemek için periyodik olarak temizlenecek.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Notları saklamak için minimum gün sayısı",
	"inDays": "Gün(ler)",
	"day": "Gün(ler)",
	"remoteNotesCleaningMaxProcessingDuration": "Maksimum temizleme işlem süresi",
	"inMinutes": "Dakika(lar)",
	"minute": "Dakika(lar)"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Generate remote user data charts",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Enable",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Details",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "Day(s)",
	"day": "Day(s)",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "Minute(s)",
	"minute": "Minute(s)"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"performance": "Продуктивність",
	"enableServerMachineStats": "Публікувати статистику серверного обладнання",
	"turnOffToImprovePerformance": "Вимкнення цієї опції може підвищити продуктивність.",
	"enableIdenticonGeneration": "Увімкнути генерацію ідентиконів користувачів",
	"enableChartsForRemoteUser": "Створити графіки даних віддалених користувачів",
	"enableStatsForFederatedInstances": "Отримувати статистику віддаленого сервера",
	"enableChartsForFederatedInstances": "Створити графіки даних віддалених інстансів",
	"showRoleBadgesOfRemoteUsers": "Відображати значки ролей, призначені віддаленим користувачам",
	"enable": "Увімкнути",
	"modified": "Змінено",
	"fanoutTimelineDescription": "Сильно покращує продуктивність отримання стрічки й зменшує навантаженість на базу даних, якщо ввімкнуто. Натомість Redis споживатиму більшу кількість пам'яті. Розгляньте вимкнення у випадку малої кількості пам'яті серверу або його нестабільності.",
	"details": "Детальніше",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "д",
	"day": "д",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "х",
	"minute": "х"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"performance": "Performance",
	"enableServerMachineStats": "Publish server hardware stats",
	"turnOffToImprovePerformance": "Tắt mục này có thể cải thiện hiệu năng.",
	"enableIdenticonGeneration": "Enable user identicon generation",
	"enableChartsForRemoteUser": "Tạo biểu đồ người dùng từ xa",
	"enableStatsForFederatedInstances": "Receive remote server stats",
	"enableChartsForFederatedInstances": "Generate remote instance data charts",
	"showRoleBadgesOfRemoteUsers": "Display the role badges assigned to remote users",
	"enable": "Bật",
	"modified": "Modified",
	"fanoutTimelineDescription": "Greatly increases performance of timeline retrieval and reduces load on the database when enabled. In exchange, memory usage of Redis will increase. Consider disabling this in case of low server memory or server instability.",
	"details": "Chi tiết",
	"fanoutTimelineDbFallback": "Fallback to database",
	"fanoutTimelineDbFallbackDescription": "When enabled, the timeline will fall back to the database for additional queries if the timeline is not cached. Disabling it further reduces the server load by eliminating the fallback process, but limits the range of timelines that can be retrieved.",
	"reactionsBufferingDescription": "When enabled, performance during reaction creation will be greatly improved, reducing the load on the database. However, Redis memory usage will increase.",
	"remoteNotesCleaning_description": "When enabled, unused and outdated remote notes will be periodically cleaned up to prevent database bloat.",
	"remoteNotesCleaningExpiryDaysForEachNotes": "Minimum days to retain notes",
	"inDays": "ngày",
	"day": "ngày",
	"remoteNotesCleaningMaxProcessingDuration": "Maximum cleanup processing time",
	"inMinutes": "phút",
	"minute": "phút"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"performance": "性能",
	"enableServerMachineStats": "公开服务器硬件统计信息",
	"turnOffToImprovePerformance": "关闭该选项可以提高性能。",
	"enableIdenticonGeneration": "启用生成用户 Identicon",
	"enableChartsForRemoteUser": "生成远程用户的图表",
	"enableStatsForFederatedInstances": "获取远程服务器的信息",
	"enableChartsForFederatedInstances": "生成远程服务器的图表",
	"showRoleBadgesOfRemoteUsers": "显示远程用户的角色徽章",
	"enable": "启用",
	"modified": "有变更",
	"fanoutTimelineDescription": "当启用时，可显著提高获取各种时间线时的性能，并减轻数据库的负荷。但是相对的 Redis 的内存使用量将会增加。如果服务器的内存不是很大，又或者运行不稳定的话可以把它关掉。",
	"details": "详情",
	"fanoutTimelineDbFallback": "回退到数据库",
	"fanoutTimelineDbFallbackDescription": "当启用时，若时间线未被缓存，则将额外查询数据库。禁用该功能可通过不执行回退处理进一步减少服务器负载，但会限制可检索的时间线范围。",
	"reactionsBufferingDescription": "开启时可显著提高发送回应时的性能，及减轻数据库负荷。但 Redis 的内存用量会相应增加。",
	"remoteNotesCleaning_description": "启用后，将自动清理已无法找到的旧的远程投稿，可减缓数据库的增长。",
	"remoteNotesCleaningExpiryDaysForEachNotes": "最短帖子保留期限",
	"inDays": "天",
	"day": "天",
	"remoteNotesCleaningMaxProcessingDuration": "最长清理持续时间",
	"inMinutes": "分钟",
	"minute": "分钟"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"performance": "性能",
	"enableServerMachineStats": "公佈伺服器的機器資訊",
	"turnOffToImprovePerformance": "關閉時會提高性能。",
	"enableIdenticonGeneration": "啟用生成使用者的 Identicon ",
	"enableChartsForRemoteUser": "生成遠端使用者的圖表",
	"enableStatsForFederatedInstances": "取得遠端伺服器資訊",
	"enableChartsForFederatedInstances": "生成遠端伺服器的圖表",
	"showRoleBadgesOfRemoteUsers": "顯示授予遠端使用者的角色徽章",
	"enable": "啟用",
	"modified": "已變更",
	"fanoutTimelineDescription": "如果啟用的話，檢索各個時間軸的性能會顯著提昇，資料庫的負荷也會減少。不過，Redis 的記憶體使用量會增加。如果伺服器的記憶體容量比較少或者運行不穩定，可以停用。",
	"details": "詳細資訊",
	"fanoutTimelineDbFallback": "資料庫的回退",
	"fanoutTimelineDbFallbackDescription": "若啟用，在時間軸沒有快取的情況下將執行回退處理以額外查詢資料庫。若停用，可以透過不執行回退處理來進一步減少伺服器的負荷，但會限制可取得的時間軸範圍。",
	"reactionsBufferingDescription": "啟用時，可以顯著提高建立反應時的效能並減少資料庫的負載。 但是，Redis 記憶體使用量會增加。",
	"remoteNotesCleaning_description": "啟用後，系統會定期清理未被參照的舊遠端貼文，以抑制資料庫的膨脹。",
	"remoteNotesCleaningExpiryDaysForEachNotes": "貼文最短保留天數",
	"inDays": "日",
	"day": "日",
	"remoteNotesCleaningMaxProcessingDuration": "清理作業的最長持續時間",
	"inMinutes": "分鐘",
	"minute": "分鐘"
}
</locale>
