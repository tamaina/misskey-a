<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInput v-model="q_name" data-testid="server-setup-server-name">
		<template #label>{{ $locale.sfc.instanceName }}</template>
	</MkInput>

	<MkFolder :defaultOpen="true">
		<template #label>{{ $locale.sfc.howWillYouUseMisskey }}</template>
		<template #icon><i class="ti ti-settings-question"></i></template>

		<div class="_gaps_s">
			<MkRadios
				v-model="q_use"
				:options="[
					{ value: 'single', label: $locale.sfc.single, icon: 'ti ti-user', caption: $locale.sfc.single_description },
					{ value: 'group', label: $locale.sfc.group, icon: 'ti ti-lock', caption: $locale.sfc.group_description },
					{ value: 'open', label: $locale.sfc.open, icon: 'ti ti-world', caption: $locale.sfc.open_description },
				]"
				vertical
			>
			</MkRadios>

			<MkInfo v-if="q_use === 'single'">{{ $locale.sfc.single_youCanCreateMultipleAccounts }}</MkInfo>
			<MkInfo v-if="q_use === 'open'" warn><b>{{ $locale.sfc.advice }}:</b> {{ $locale.sfc.openServerAdvice }}</MkInfo>
			<MkInfo v-if="q_use === 'open'" warn><b>{{ $locale.sfc.advice }}:</b> {{ $locale.sfc.openServerAntiSpamAdvice }}</MkInfo>
		</div>
	</MkFolder>

	<MkFolder v-if="q_use !== 'single'" :defaultOpen="true">
		<template #label>{{ $locale.sfc.howManyUsersDoYouExpect }}</template>
		<template #icon><i class="ti ti-users"></i></template>

		<div class="_gaps_s">
			<MkRadios
				v-model="q_scale"
				:options="[
					{ value: 'small', label: $locale.sfc.small, icon: 'ti ti-user' },
					{ value: 'medium', label: $locale.sfc.medium, icon: 'ti ti-users' },
					{ value: 'large', label: $locale.sfc.large, icon: 'ti ti-users-group' },
				]"
				vertical
			>
			</MkRadios>

			<MkInfo v-if="q_scale === 'large'"><b>{{ $locale.sfc.advice }}:</b> {{ $locale.sfc.largeScaleServerAdvice }}</MkInfo>
		</div>
	</MkFolder>

	<MkFolder :defaultOpen="true">
		<template #label>{{ $locale.sfc.doYouConnectToFediverse }}</template>
		<template #icon><i class="ti ti-planet"></i></template>

		<div class="_gaps_s">
			<div>{{ $locale.sfc.doYouConnectToFediverse_description1 }}<br>{{ $locale.sfc.doYouConnectToFediverse_description2 }}<br><MkLink target="_blank" url="https://wikipedia.org/wiki/Fediverse">{{ $locale.sfc.learnMore }}</MkLink></div>

			<MkRadios
				v-model="q_federation"
				:options="[
					{ value: 'yes', label: $locale.sfc.yes },
					{ value: 'no', label: $locale.sfc.no },
				]"
				vertical
			>
			</MkRadios>

			<MkInfo v-if="q_federation === 'yes'">{{ $locale.sfc.youCanConfigureMoreFederationSettingsLater }}</MkInfo>

			<MkSwitch v-if="q_federation === 'yes'" v-model="q_remoteContentsCleaning">
				<template #label>{{ $locale.sfc.remoteContentsCleaning }}</template>
				<template #caption>{{ $locale.sfc.remoteContentsCleaning_description }}</template>
			</MkSwitch>
		</div>
	</MkFolder>

	<MkFolder v-if="q_use === 'open' || q_federation === 'yes'" :defaultOpen="true">
		<template #label>{{ $locale.sfc.adminInfo }}</template>
		<template #icon><i class="ti ti-mail"></i></template>

		<div class="_gaps_s">
			<div>{{ $locale.sfc.adminInfo_description }}</div>

			<MkInfo warn>{{ $locale.sfc.adminInfo_mustBeFilled }}</MkInfo>

			<MkInput v-model="q_adminName">
				<template #label>{{ $locale.sfc.maintainerName }}</template>
			</MkInput>

			<MkInput v-model="q_adminEmail" type="email">
				<template #label>{{ $locale.sfc.maintainerEmail }}</template>
			</MkInput>
		</div>
	</MkFolder>

	<MkFolder :defaultOpen="true" :maxHeight="300">
		<template #label>{{ $locale.sfc.followingSettingsAreRecommended }}</template>
		<template #icon><i class="ti ti-adjustments-alt"></i></template>

		<div class="_gaps_s">
			<div>
				<div><b>{{ $locale.sfc.singleUserMode }}:</b></div>
				<div>{{ serverSettings.singleUserMode ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.openRegistration }}:</b></div>
				<div>{{ !serverSettings.disableRegistration ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.emailRequiredForSignup }}:</b></div>
				<div>{{ serverSettings.emailRequiredForSignup ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>Log IP:</b></div>
				<div>{{ serverSettings.enableIpLogging ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.federation }}:</b></div>
				<div>{{ serverSettings.federation === 'none' ? $locale.sfc.no : $locale.sfc.all }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.remoteNotesCleaning }}:</b></div>
				<div>{{ serverSettings.enableRemoteNotesCleaning ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>FTT:</b></div>
				<div>{{ serverSettings.enableFanoutTimeline ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>FTT/{{ $locale.sfc.fanoutTimelineDbFallback }}:</b></div>
				<div>{{ serverSettings.enableFanoutTimelineDbFallback ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>RBT:</b></div>
				<div>{{ serverSettings.enableReactionsBuffering ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>

			<div>
				<div><b>{{ $locale.sfc.entrancePageStyle }}:</b></div>
				<div>{{ serverSettings.clientOptions?.entrancePageStyle }}</div>
			</div>

			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.rateLimitFactor }}:</b></div>
				<div>{{ defaultPolicies.rateLimitFactor }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.driveCapacity }}:</b></div>
				<div>{{ defaultPolicies.driveCapacityMb }} MB</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.userListMax }}:</b></div>
				<div>{{ defaultPolicies.userListLimit }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.antennaMax }}:</b></div>
				<div>{{ defaultPolicies.antennaLimit }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.webhookMax }}:</b></div>
				<div>{{ defaultPolicies.webhookLimit }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.canImportFollowing }}:</b></div>
				<div>{{ defaultPolicies.canImportFollowing ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.canImportMuting }}:</b></div>
				<div>{{ defaultPolicies.canImportMuting ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.canImportBlocking }}:</b></div>
				<div>{{ defaultPolicies.canImportBlocking ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.canImportUserLists }}:</b></div>
				<div>{{ defaultPolicies.canImportUserLists ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
			<div>
				<div><b>{{ $locale.sfc.baseRole }}/{{ $locale.sfc.canImportAntennas }}:</b></div>
				<div>{{ defaultPolicies.canImportAntennas ? $locale.sfc.yes : $locale.sfc.no }}</div>
			</div>
		</div>

		<template #footer>
			<MkButton gradate large rounded data-testid="server-setup-wizard-apply" style="margin: 0 auto;" @click="applySettings">
				<i class="ti ti-check"></i> {{ $locale.sfc.applyTheseSettings }}
			</MkButton>
		</template>
	</MkFolder>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';

const emit = defineEmits<{
	(ev: 'finished'): void;
}>();

const props = withDefaults(defineProps<{
	token?: string;
}>(), {
});

const q_name = ref('');
const q_use = ref<'single' | 'group' | 'open'>('single');
const q_scale = ref<'small' | 'medium' | 'large'>('small');
const q_federation = ref<'yes' | 'no'>('no');
const q_remoteContentsCleaning = ref(true);
const q_adminName = ref('');
const q_adminEmail = ref('');

const serverSettings = computed<Misskey.entities.AdminUpdateMetaRequest>(() => {
	let enableReactionsBuffering;
	if (q_use.value === 'single') {
		enableReactionsBuffering = false;
	} else {
		enableReactionsBuffering = q_scale.value !== 'small';
	}

	return {
		singleUserMode: q_use.value === 'single',
		disableRegistration: q_use.value !== 'open',
		emailRequiredForSignup: q_use.value === 'open',
		enableIpLogging: q_use.value === 'open',
		federation: q_federation.value === 'yes' ? 'all' : 'none',
		enableRemoteNotesCleaning: q_remoteContentsCleaning.value,
		enableFanoutTimeline: true,
		enableFanoutTimelineDbFallback: q_use.value === 'single',
		enableReactionsBuffering,
		clientOptions: {
			entrancePageStyle: q_use.value === 'open' ? 'classic' : 'simple',
		},
	};
});

const defaultPolicies = computed<Partial<Misskey.entities.RolePolicies>>(() => {
	let driveCapacityMb: Misskey.entities.RolePolicies['driveCapacityMb'] | undefined;
	if (q_use.value === 'single') {
		driveCapacityMb = 8192;
	} else if (q_use.value === 'group') {
		driveCapacityMb = 1000;
	} else if (q_use.value === 'open') {
		driveCapacityMb = 100;
	}

	let rateLimitFactor: Misskey.entities.RolePolicies['rateLimitFactor'] | undefined;
	if (q_use.value === 'single') {
		rateLimitFactor = 0.3;
	} else if (q_use.value === 'group') {
		rateLimitFactor = 0.7;
	} else if (q_use.value === 'open') {
		if (q_scale.value === 'small') {
			rateLimitFactor = 1;
		} else if (q_scale.value === 'medium') {
			rateLimitFactor = 1.25;
		} else if (q_scale.value === 'large') {
			rateLimitFactor = 1.5;
		}
	}

	let userListLimit: Misskey.entities.RolePolicies['userListLimit'] | undefined;
	if (q_use.value === 'single') {
		userListLimit = 100;
	} else if (q_use.value === 'group') {
		userListLimit = 5;
	} else if (q_use.value === 'open') {
		userListLimit = 3;
	}

	let antennaLimit: Misskey.entities.RolePolicies['antennaLimit'] | undefined;
	if (q_use.value === 'single') {
		antennaLimit = 100;
	} else if (q_use.value === 'group') {
		antennaLimit = 5;
	} else if (q_use.value === 'open') {
		antennaLimit = 0;
	}

	let webhookLimit: Misskey.entities.RolePolicies['webhookLimit'] | undefined;
	if (q_use.value === 'single') {
		webhookLimit = 100;
	} else if (q_use.value === 'group') {
		webhookLimit = 0;
	} else if (q_use.value === 'open') {
		webhookLimit = 0;
	}

	let canImportFollowing: Misskey.entities.RolePolicies['canImportFollowing'];
	if (q_use.value === 'single') {
		canImportFollowing = true;
	} else {
		canImportFollowing = false;
	}

	let canImportMuting: Misskey.entities.RolePolicies['canImportMuting'];
	if (q_use.value === 'single') {
		canImportMuting = true;
	} else {
		canImportMuting = false;
	}

	let canImportBlocking: Misskey.entities.RolePolicies['canImportBlocking'];
	if (q_use.value === 'single') {
		canImportBlocking = true;
	} else {
		canImportBlocking = false;
	}

	let canImportUserLists: Misskey.entities.RolePolicies['canImportUserLists'];
	if (q_use.value === 'single') {
		canImportUserLists = true;
	} else {
		canImportUserLists = false;
	}

	let canImportAntennas: Misskey.entities.RolePolicies['canImportAntennas'];
	if (q_use.value === 'single') {
		canImportAntennas = true;
	} else {
		canImportAntennas = false;
	}

	return {
		rateLimitFactor,
		driveCapacityMb,
		userListLimit,
		antennaLimit,
		webhookLimit,
		canImportFollowing,
		canImportMuting,
		canImportBlocking,
		canImportUserLists,
		canImportAntennas,
	};
});

function applySettings() {
	const _close = os.waiting();
	Promise.all([
		misskeyApi('admin/update-meta', {
			...serverSettings.value,
			name: q_name.value === '' ? undefined : q_name.value,
			maintainerName: q_adminName.value === '' ? undefined : q_adminName.value,
			maintainerEmail: q_adminEmail.value === '' ? undefined : q_adminEmail.value,
		}, props.token),
		misskeyApi('admin/roles/update-default-policies', {
			// @ts-expect-error バックエンド側の型
			policies: defaultPolicies.value,
		}, props.token),
	]).then(() => {
		emit('finished');
	}).catch((err) => {
		os.alert({
			type: 'error',
			title: err.code,
			text: err.message,
		});
	}).finally(() => {
		_close();
	});
}
</script>

<locale locale="ar-SA" lang="json">
{
  "instanceName": "اسم مثيل الخادم",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "راجع المزيد",
  "yes": "نعم",
  "no": "لا",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "المدير",
  "maintainerEmail": "عنوان بريد المدير الإلكتروني",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "عنوان البريد الإلكتروني إلزامي للتسجيل",
  "federation": "الفديرالية",
  "all": "الكل",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "instanceName": "Nom del servidor",
  "howWillYouUseMisskey": "Com es fa servir Misskey?",
  "single": "Servidor per una sola persona",
  "single_description": "Fes-ho servir com el teu propi servidor dedicat",
  "group": "Servidor per a grups",
  "group_description": "Invita altres usuaris de la teva confiança i fes-ho servir amb més d'una persona.",
  "open": "Servidor obert",
  "open_description": "Operar per donar cabuda a un nombre no determinat d'usuaris.",
  "single_youCanCreateMultipleAccounts": "Es poden crear diferents comptes segons siguin les teves necessitats, inclús quan es fa servir com a servidor unipersonal.",
  "advice": "Consell",
  "openServerAdvice": "Acceptar un nombre no determinat d'usuaris comporta alguns riscos. Es recomana operar amb un sistema de moderació fiable per fer front als problemes.",
  "openServerAntiSpamAdvice": "També s'ha de tenir molta cura amb la seguretat, per exemple habilitant funcions anti-bot com reCAPTCHA, per assegurar-te que el teu servidor no es converteix en un trampolí per contingut brossa.",
  "howManyUsersDoYouExpect": "Quantes persones preveus?",
  "small": "Menys de 100 (petita escala)",
  "medium": "Més de 100 i menys de 1000 (mida mitjana)",
  "large": "Més de 1000 persones (gran escala)",
  "largeScaleServerAdvice": "Els grans servidors poden requerir coneixements avançats d'infraestructures, com balanceig de càrregues i replicació de base de dades.",
  "doYouConnectToFediverse": "Desitges connectar-te amb el Fedivers?",
  "doYouConnectToFediverse_description1": "Quan es connecta amb una xarxa de servidors distribuïts (Fedivers), els continguts poden intercanviar-se amb altres servidors i entre ells.",
  "doYouConnectToFediverse_description2": "La connexió amb el Fedivers també es coneix com a \"federació\".",
  "learnMore": "Saber-ne més ",
  "yes": "Sí ",
  "no": "No",
  "youCanConfigureMoreFederationSettingsLater": "Les configuracions avançades, com especificar els servidors amb els quals es pot federar, es poden fer més tard.",
  "remoteContentsCleaning": "Neteja automàtica del contingut rebut",
  "remoteContentsCleaning_description": "Quan es comença a federar es rep un munt de contingut, quan s'activa la neteja automàtica el contingut antic que no es consulta serà eliminat del servidor, el que permet estalviar espai d'emmagatzematge.",
  "adminInfo": "Informació de l'administrador ",
  "adminInfo_description": "Estableix la informació de l'administrador que es farà servir per rebre consultes.",
  "adminInfo_mustBeFilled": "Aquesta informació ha de ser omplerta si el servidor té els registres oberts o la federació es troba activada.",
  "maintainerName": "Nom de l'administrador",
  "maintainerEmail": "Correu electrònic de l'administrador",
  "followingSettingsAreRecommended": "Es recomana la següent configuració ",
  "singleUserMode": "Mode un usuari",
  "openRegistration": "Registres oberts",
  "emailRequiredForSignup": "Demanar correu electrònic per registrar-se ",
  "federation": "Federació",
  "all": "Tot",
  "remoteNotesCleaning": "Neteja automàtica de notes remotes",
  "fanoutTimelineDbFallback": "Carregar de la base de dades",
  "entrancePageStyle": "Estil de la pàgina d'inici",
  "baseRole": "Plantilla de rols",
  "rateLimitFactor": "Limitador",
  "driveCapacity": "Capacitat del disc",
  "userListMax": "Nombre màxim de llistes d'usuaris ",
  "antennaMax": "Nombre màxim d'antenes",
  "webhookMax": "Nombre màxim de Webhooks",
  "canImportFollowing": "Autoritza la importació de seguidors",
  "canImportMuting": "Autoritza la importació de silenciats",
  "canImportBlocking": "Autoritza la importació de bloquejats",
  "canImportUserLists": "Autoritza la importació de llistes d'usuaris ",
  "canImportAntennas": "Autoritza la importació d'antenes ",
  "applyTheseSettings": "Aplicar aquesta configuració "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "instanceName": "Název instance",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Zjistit více",
  "yes": "Ano",
  "no": "Ne",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Správce",
  "maintainerEmail": "E-mailová adresa správce",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Vyžadovat email pro registraci",
  "federation": "Federace",
  "all": "Vše",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Šablona role",
  "rateLimitFactor": "Limit rychlosti",
  "driveCapacity": "Velikost disku",
  "userListMax": "Maximální počet seznamů uživatelů",
  "antennaMax": "Maximální počet antén",
  "webhookMax": "Maximální počet Webhooků",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "instanceName": "Instance name",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Learn more",
  "yes": "Yes",
  "no": "No",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Maintainer",
  "maintainerEmail": "Maintainer email",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Require email address for sign-up",
  "federation": "Federation",
  "all": "All",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "instanceName": "Name der Instanz",
  "howWillYouUseMisskey": "Wie wirst du Misskey verwenden?",
  "single": "Ein-Personen-Server",
  "single_description": "Verwende den Server alleine als deinen eigenen.",
  "group": "Gruppenserver",
  "group_description": "Lade andere vertrauenswürdige Benutzer ein und verwende es mit mehreren Personen.",
  "open": "Offener Server",
  "open_description": "Registrierung für alle öffnen.",
  "single_youCanCreateMultipleAccounts": "Bei Bedarf können mehrere Konten eingerichtet werden, auch wenn es sich um einen Ein-Personen-Server handelt.",
  "advice": "Tipps",
  "openServerAdvice": "Die Aufnahme einer unbestimmten Anzahl von Nutzern birgt Risiken. Es wird empfohlen, mit einem zuverlässigen Moderationssystem zu arbeiten, um eventuell auftretende Probleme behandeln zu können.",
  "openServerAntiSpamAdvice": "Große Sorgfalt muss auch auf die Sicherheit gelegt werden, z. B. durch die Aktivierung von Anti-Bot-Funktionen wie reCAPTCHA, um sicherzustellen, dass der Server nicht zum Verbreiten von Spam genutzt wird.",
  "howManyUsersDoYouExpect": "Mit wie vielen Benutzern rechnest du?",
  "small": "Weniger als 100 (kleiner Maßstab)",
  "medium": "Mehr als 100 und weniger als 1000 Benutzer (mittelgroß)",
  "large": "Mehr als 1000 (großer Maßstab)",
  "largeScaleServerAdvice": "Für große Server sind unter Umständen fortgeschrittene Kenntnisse erforderlich, z. B. Lastverteilung und Datenbankreplikation.",
  "doYouConnectToFediverse": "Mit dem Fediverse verbinden?",
  "doYouConnectToFediverse_description1": "Bei Anschluss an ein Netz von verteilten Servern (Fediverse) können Inhalte mit anderen Servern ausgetauscht werden.",
  "doYouConnectToFediverse_description2": "Die Verbindung mit dem Fediverse wird auch als „Föderation“ bezeichnet.",
  "learnMore": "Mehr erfahren",
  "yes": "Ja",
  "no": "Nein",
  "youCanConfigureMoreFederationSettingsLater": "Erweiterte Einstellungen, wie z. B. die Angabe von föderierbaren Servern, können später vorgenommen werden.",
  "remoteContentsCleaning": "Automatische Bereinigung von Remote-Inhalten",
  "remoteContentsCleaning_description": "Wenn Sie eine Föderation durchführen, empfangen Sie fortlaufend viele Inhalte. Wenn Sie die automatische Bereinigung aktivieren, werden Remote-Inhalte, deren bestimmter Zeitraum abgelaufen ist, automatisch vom Server gelöscht, wodurch Speicherplatz eingespart werden kann.",
  "adminInfo": "Administrator-Informationen",
  "adminInfo_description": "Legt die Administrator-Informationen fest, die für den Empfang von Anfragen verwendet werden.",
  "adminInfo_mustBeFilled": "Dies ist auf einem offenen Server oder bei aktivierter Föderation erforderlich.",
  "maintainerName": "Betreiber",
  "maintainerEmail": "Betreiber-Email",
  "followingSettingsAreRecommended": "Die folgenden Einstellungen werden empfohlen",
  "singleUserMode": "Einzelbenutzermodus",
  "openRegistration": "Registrierung von Konten aktivieren",
  "emailRequiredForSignup": "Angabe einer Email-Adresse als benötigt markieren",
  "federation": "Föderation",
  "all": "Alle",
  "remoteNotesCleaning": "Automatische Bereinigung von Remote-Beiträgen",
  "fanoutTimelineDbFallback": "Auf die Datenbank zurückfallen",
  "entrancePageStyle": "Stil der Einstiegsseite",
  "baseRole": "Rollenvorlage",
  "rateLimitFactor": "Versuchsanzahl",
  "driveCapacity": "Drive-Kapazität",
  "userListMax": "Maximale Anzahl an Benutzerlisten",
  "antennaMax": "Maximale Anzahl an Antennen",
  "webhookMax": "Maximale Anzahl an Webhooks",
  "canImportFollowing": "Importieren von Gefolgten zulassen",
  "canImportMuting": "Importieren von Stummgeschalteten zulassen",
  "canImportBlocking": "Importieren von Blockierungen zulassen",
  "canImportUserLists": "Importieren von Listen erlauben",
  "canImportAntennas": "Importieren von Antennen erlauben",
  "applyTheseSettings": "Diese Einstellungen anwenden"
}
</locale>

<locale locale="en-US" lang="json">
{
  "instanceName": "Instance name",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Learn more",
  "yes": "Yes",
  "no": "No",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Maintainer",
  "maintainerEmail": "Maintainer email",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Require email address for sign-up",
  "federation": "Federation",
  "all": "All",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "instanceName": "Nombre de la instancia",
  "howWillYouUseMisskey": "¿Cómo vas a usar Misskey?",
  "single": "Servidor para un único usuario.",
  "single_description": "Utilízalo como tu propio servidor dedicado.",
  "group": "Servidor de grupo",
  "group_description": "Invita otros usuarios de  confianza y úsalo con más de una persona.\n",
  "open": "Servidor público",
  "open_description": "Permite a cualquiera registrarse",
  "single_youCanCreateMultipleAccounts": "Se pueden crear múltiples cuentas según sea necesario, incluso cuando se opera como servidor unipersonal.",
  "advice": "Consejos",
  "openServerAdvice": "Aceptar un número no determinado de usuarios comporta algunos riesgos. Se recomienda operar con un sistema de moderación fiable para hacer frente a los problemas.",
  "openServerAntiSpamAdvice": "Para evitar que su servidor se convierta en un trampolín para el spam, también debe prestar mucha atención a la seguridad habilitando funciones anti-bot como reCAPTCHA.",
  "howManyUsersDoYouExpect": "¿Cuántas personas esperas?",
  "small": "Menos de 100 (escala pequeña)",
  "medium": "Más de 100 y menos de 1000 (escala media)\n",
  "large": "Más de 1000(escala grande)",
  "largeScaleServerAdvice": "Los grandes servidores pueden requerir conocimientos avanzados de infraestructura, como equilibrio de carga y replicación de bases de datos.",
  "doYouConnectToFediverse": "¿Quieres conectarte al Fediverso?",
  "doYouConnectToFediverse_description1": "Cuando se conecta a una red de servidores distribuidos (Fediverso), el contenido puede intercambiarse con otros servidores.",
  "doYouConnectToFediverse_description2": "Conectarse con el Fediverso también se conoce como \"federación\".",
  "learnMore": "Ver más",
  "yes": "Si",
  "no": "No",
  "youCanConfigureMoreFederationSettingsLater": "Los ajustes avanzados, como la especificación de servidores federados, pueden configurarse más adelante.",
  "remoteContentsCleaning": "Limpieza automática de los contenidos recibidos",
  "remoteContentsCleaning_description": "La federación puede dar lugar a un flujo continuo de contenido. Al habilitar la limpieza automática, se eliminará del servidor el contenido obsoleto y sin referencias para ahorrar espacio de almacenamiento.",
  "adminInfo": "Información del administrador",
  "adminInfo_description": "Establece la información del administrador para recibir consultas.",
  "adminInfo_mustBeFilled": "Esta información debe ser introducida en el caso de registros abiertos o la federación esté activada.",
  "maintainerName": "Nombre del administrador",
  "maintainerEmail": "Correo del administrador",
  "followingSettingsAreRecommended": "Se recomienda los siguientes ajustes",
  "singleUserMode": "Modo de usuario único",
  "openRegistration": "Registros Abiertos",
  "emailRequiredForSignup": "Se requiere una dirección de correo electrónico para el registro de la cuenta",
  "federation": "Federación",
  "all": "Todo",
  "remoteNotesCleaning": "Limpieza automática de notas (publicaciones) remotas",
  "fanoutTimelineDbFallback": "Cargar desde la base de datos",
  "entrancePageStyle": "Estilo de la página de inicio",
  "baseRole": "Rol base",
  "rateLimitFactor": "Limitador",
  "driveCapacity": "Capacidad del drive",
  "userListMax": "Máximo de listas de usuarios",
  "antennaMax": "Máximo de antenas",
  "webhookMax": "Máximo de Webhooks",
  "canImportFollowing": "Permitir la importación de seguidos",
  "canImportMuting": "Permitir la importación de silenciados",
  "canImportBlocking": "Permitir la importación de bloqueos",
  "canImportUserLists": "Permitir la importación de listas",
  "canImportAntennas": "Permitir la importación de antenas",
  "applyTheseSettings": "Aplicar estos ajustes"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "instanceName": "Nom de l’instance",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Plus d'informations",
  "yes": "Oui",
  "no": "Non",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "L’administrateur·rice",
  "maintainerEmail": "Email de l’administrateur·rice",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Une adresse e-mail est nécessaire pour créer un compte",
  "federation": "Fédération",
  "all": "Tous",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Recours à la base de données",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Modèle de rôle",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Capacité de stockage du Disque",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Nombre maximum d'antennes",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Autoriser l'importation d'antennes",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "instanceName": "Nama instansi",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Saran",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Pelajari lebih lanjut",
  "yes": "Iya",
  "no": "Tidak",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Pengelola",
  "maintainerEmail": "Surel pengelola",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Membutuhkan alamat surel untuk mendaftar",
  "federation": "Federasi",
  "all": "Semua",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback ke database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Templat peran",
  "rateLimitFactor": "Batas kecepatan",
  "driveCapacity": "Kapasitas Drive",
  "userListMax": "Jumlah maksimum daftar pengguna",
  "antennaMax": "Jumlah maksimum antena",
  "webhookMax": "Jumlah maksimum Webhook",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Izinkan mengimpor senarai",
  "canImportAntennas": "Izinkan mengimpor antena",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "instanceName": "Nome dell'istanza",
  "howWillYouUseMisskey": "Come si usa Misskey?",
  "single": "Modalità utenza singola",
  "single_description": "Se intendi usarlo come tuo server personale",
  "group": "Modalità multi utentza",
  "group_description": "Invita altre persone fidate ad usare il server insieme a te",
  "open": "Server aperto",
  "open_description": "Per ospitare un numero imprecisato di persone",
  "single_youCanCreateMultipleAccounts": "Anche se lo utilizzi come server per una sola persona, puoi creare più account in base alle tue esigenze.",
  "advice": "Consiglio",
  "openServerAdvice": "Ospitare un numero imprecisato di persone comporta dei rischi. Ti consigliamo di adottare un solido sistema di moderazione, in modo da poter gestire eventuali problemi che potrebbero presentarsi pubblicando contenuti proposti da altre persone, che potrebbero essere sconosciute.",
  "openServerAntiSpamAdvice": "Presta molta attenzione alla sicurezza, ad esempio attivando funzionalità anti-bot (iscrizioni automatiche) come reCAPTCHA. Questo può evitare che il tuo server diventi un trampolino di lancio per lo spam di altri.",
  "howManyUsersDoYouExpect": "Quante persone pensi che parteciperanno?",
  "small": "100 persone o meno (piccolo)",
  "medium": "Da 100 a 1000 persone (medio)",
  "large": "Oltre 1000 persone (grande)",
  "largeScaleServerAdvice": "Configurare grandi server potrebbe richiedere conoscenze infrastrutturali avanzate, ad esempio, il bilanciamento del carico e la replicazione del database.",
  "doYouConnectToFediverse": "Vuoi connetterti al Fediverso?",
  "doYouConnectToFediverse_description1": "Collegandosi a una rete di server distribuiti, denominata Fediverso, potrai scambiare contenuti con altri server, tramite il protocollo di comunicazione ActivityPub.",
  "doYouConnectToFediverse_description2": "Connettersi al Fediverso è anche detto \"federazione\".",
  "learnMore": "Per saperne di più",
  "yes": "Sì",
  "no": "No",
  "youCanConfigureMoreFederationSettingsLater": "Puoi svolgere la configurazione avanzata anche dopo. Ad esempio specificando quali server possono federarsi.",
  "remoteContentsCleaning": "Pulizia automatica dei contenuti in arrivo",
  "remoteContentsCleaning_description": "Con la federazione funzionante, riceverai sempre più contenuti. Abilitando la pulizia automatica, i contenuti non referenziati e obsoleti verranno rimossi automaticamente dai tuoi server, risparmiando spazio di archiviazione.",
  "adminInfo": "Informazioni sull'amministratore",
  "adminInfo_description": "Imposta le informazioni dell'amministratore utilizzate per accettare le richieste.",
  "adminInfo_mustBeFilled": "Questa operazione è necessaria su un server aperto o se è attiva la federazione.",
  "maintainerName": "Nome dell'amministratore",
  "maintainerEmail": "Indirizzo e-mail dell'amministratore",
  "followingSettingsAreRecommended": "Si consigliano le seguenti impostazioni:",
  "singleUserMode": "Modalità utenza singola",
  "openRegistration": "Registrazioni aperte",
  "emailRequiredForSignup": "L'indirizzo e-mail è obbligatorio per registrarsi",
  "federation": "Federazione",
  "all": "Tutte",
  "remoteNotesCleaning": "Pulizia automatica dei contenuti remoti",
  "fanoutTimelineDbFallback": "Elaborazione dati alternativa",
  "entrancePageStyle": "Stile della pagina di ingresso",
  "baseRole": "Ruolo di base",
  "rateLimitFactor": "Limite del rapporto",
  "driveCapacity": "Capienza del Drive",
  "userListMax": "Quantità massima di liste",
  "antennaMax": "Quantità massima di Antenne",
  "webhookMax": "Quantità massima di Webhook",
  "canImportFollowing": "Può importare Following",
  "canImportMuting": "Può importare Silenziati",
  "canImportBlocking": "Può importare Blocchi",
  "canImportUserLists": "Può importare liste di Profili",
  "canImportAntennas": "Può importare Antenne",
  "applyTheseSettings": "Applica questa impostazione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "instanceName": "サーバー名",
  "howWillYouUseMisskey": "Misskeyをどのように使いますか？",
  "single": "お一人様サーバー",
  "single_description": "自分専用のサーバーとして、一人で使う",
  "group": "グループサーバー",
  "group_description": "信頼できる他の利用者を招待して、複数人で使う",
  "open": "オープンサーバー",
  "open_description": "不特定多数の利用者を受け入れる運営を行う",
  "single_youCanCreateMultipleAccounts": "お一人様サーバーとして運用する場合でも、アカウントは必要に応じて複数作成可能です。",
  "advice": "アドバイス",
  "openServerAdvice": "不特定多数の利用者を受け入れることはリスクが伴います。トラブルに対処できるよう、確実なモデレーション体制で運営することを推奨します。",
  "openServerAntiSpamAdvice": "自サーバーがスパムの踏み台にならないように、reCAPTCHAといったアンチボット機能を有効にするなど、セキュリティについても細心の注意が必要です。",
  "howManyUsersDoYouExpect": "どれくらいの人数を想定していますか？",
  "small": "100人以下 (小規模)",
  "medium": "100人以上1000人以下 (中規模)",
  "large": "1000人以上 (大規模)",
  "largeScaleServerAdvice": "大規模なサーバーでは、ロードバランシングやデータベースのレプリケーションなど、高度なインフラストラクチャーの知識が必要になる場合があります。",
  "doYouConnectToFediverse": "Fediverseと接続しますか？",
  "doYouConnectToFediverse_description1": "分散型サーバーで構成されるネットワーク(Fediverse)に接続すると、他のサーバーと相互にコンテンツのやり取りが可能です。",
  "doYouConnectToFediverse_description2": "Fediverseと接続することは「連合」とも呼ばれます。",
  "learnMore": "詳しく",
  "yes": "はい",
  "no": "いいえ",
  "youCanConfigureMoreFederationSettingsLater": "連合可能なサーバーの指定など、高度な設定も後ほど可能です。",
  "remoteContentsCleaning": "リモートコンテンツの自動クリーニング",
  "remoteContentsCleaning_description": "連合を行うと、継続して多くのコンテンツを受信します。自動クリーニングを有効にすると、一定期間経過したリモートコンテンツを自動でサーバーから削除し、ストレージを節約できます。",
  "adminInfo": "管理者情報",
  "adminInfo_description": "問い合わせを受け付けるために使用される管理者情報を設定します。",
  "adminInfo_mustBeFilled": "オープンサーバー、または連合がオンの場合は必ず入力が必要です。",
  "maintainerName": "管理者の名前",
  "maintainerEmail": "管理者のメールアドレス",
  "followingSettingsAreRecommended": "以下の設定が推奨されます",
  "singleUserMode": "お一人様モード",
  "openRegistration": "アカウントの作成をオープンにする",
  "emailRequiredForSignup": "アカウント登録にメールアドレスを必須にする",
  "federation": "連合",
  "all": "全て",
  "remoteNotesCleaning": "リモート投稿の自動クリーニング",
  "fanoutTimelineDbFallback": "データベースへのフォールバック",
  "entrancePageStyle": "エントランスページのスタイル",
  "baseRole": "ベースロール",
  "rateLimitFactor": "レートリミット",
  "driveCapacity": "ドライブ容量",
  "userListMax": "ユーザーリストの作成可能数",
  "antennaMax": "アンテナの作成可能数",
  "webhookMax": "Webhookの作成可能数",
  "canImportFollowing": "フォローのインポートを許可",
  "canImportMuting": "ミュートのインポートを許可",
  "canImportBlocking": "ブロックのインポートを許可",
  "canImportUserLists": "リストのインポートを許可",
  "canImportAntennas": "アンテナのインポートを許可",
  "applyTheseSettings": "この設定を適用"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "instanceName": "サーバー名",
  "howWillYouUseMisskey": "Misskeyをどんな感じに使うん？",
  "single": "お一人様サーバー",
  "single_description": "自分専用のサーバーとして、一人で使う",
  "group": "グループサーバー",
  "group_description": "信頼できる他の利用者を招待して、複数人で使う",
  "open": "オープンサーバー",
  "open_description": "不特定多数の利用者を受け入れる運営を行う",
  "single_youCanCreateMultipleAccounts": "お一人様サーバーとして運用するとしても、アカウントは必要に応じて複数作れるで。",
  "advice": "アドバイス",
  "openServerAdvice": "不特定多数の利用者を受け入れるには相応のリスクがあるで。トラブルに対処できるよう、ちゃんとしたモデレーション体制で運営しいや。",
  "openServerAntiSpamAdvice": "うちのサーバーがスパムの踏み台にならへんように、reCAPTCHAとかのアンチボット機能を使う、みたいなセキュリティ対策もしっかり考えてな。",
  "howManyUsersDoYouExpect": "どれくらいの人数を考えとるん？",
  "small": "100人以下 (小規模)",
  "medium": "100人以上1000人以下 (中規模)",
  "large": "1000人以上 (大規模)",
  "largeScaleServerAdvice": "大規模なサーバーやったら、ロードバランシングとかデータベースのレプリケーションみたいな、高度なインフラストラクチャーの知識が必要になるかもしれへんわ。",
  "doYouConnectToFediverse": "Fediverseと接続するんやっけ？",
  "doYouConnectToFediverse_description1": "分散型サーバーでできたネットワーク(Fediverse)に繋げると、他のサーバーと相互にコンテンツのやり取りができるようになるで。",
  "doYouConnectToFediverse_description2": "Fediverseと接続することは「連合」とも呼ばれるな。",
  "learnMore": "詳しく",
  "yes": "ええで",
  "no": "あかん",
  "youCanConfigureMoreFederationSettingsLater": "連合してもええサーバーの指定とか、高度な設定も後でできるで。",
  "remoteContentsCleaning": "リモートコンテンツの自動クリーニング",
  "remoteContentsCleaning_description": "連合すると、ぎょうさんコンテンツを受け取り続けることになるねん。自動クリーニングをつけると、参照されてない古いコンテンツを自動でサーバーからほかして、ストレージを節約できるで。",
  "adminInfo": "管理者情報",
  "adminInfo_description": "問い合わせを受け付けるのに使う管理者情報を設定しよか。",
  "adminInfo_mustBeFilled": "オープンサーバー、もしくは連合を入れとるんやったら必ず入力せなあかんで。",
  "maintainerName": "管理者はんの名前",
  "maintainerEmail": "管理者はんのメールアドレス",
  "followingSettingsAreRecommended": "こういう設定がええかもな",
  "singleUserMode": "お一人様モード",
  "openRegistration": "アカウントの作成をオープンにする",
  "emailRequiredForSignup": "アカウント作るのにメールアドレスを必須にするで",
  "federation": "連合",
  "all": "みんな",
  "remoteNotesCleaning": "リモート投稿の自動クリーニング",
  "fanoutTimelineDbFallback": "データベースにフォールバックする",
  "entrancePageStyle": "エントランスページのスタイル",
  "baseRole": "ベースロール",
  "rateLimitFactor": "レートリミット",
  "driveCapacity": "ドライブ容量",
  "userListMax": "ユーザーリスト作れる数",
  "antennaMax": "アンテナ作れる数",
  "webhookMax": "Webhook作れる数",
  "canImportFollowing": "フォローのインポートを許す",
  "canImportMuting": "ミュートのインポートを許す",
  "canImportBlocking": "ブロックのインポートを許す",
  "canImportUserLists": "リストのインポートを許す",
  "canImportAntennas": "アンテナのインポートを許す",
  "applyTheseSettings": "この設定を適用"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "instanceName": "Instance name",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Learn more",
  "yes": "Yes",
  "no": "No",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Maintainer",
  "maintainerEmail": "Maintainer email",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Require email address for sign-up",
  "federation": "Federation",
  "all": "All",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "instanceName": "Instance name",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Learn more",
  "yes": "Yes",
  "no": "No",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Maintainer",
  "maintainerEmail": "Maintainer email",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Require email address for sign-up",
  "federation": "Federation",
  "all": "All",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "instanceName": "서버 이름",
  "howWillYouUseMisskey": "Misskey를 어떻게 사용하십니까?",
  "single": "1인 서버",
  "single_description": "자신 전용 서버로 혼자서 사용",
  "group": "그룹 서버",
  "group_description": "신뢰 가능한 다른 유저를 초대해 여러 명이 사용",
  "open": "오픈 서버",
  "open_description": "불특정 다수의 유저를 받아들이는 운영을 함",
  "single_youCanCreateMultipleAccounts": "1인 서버로 운영하는 경우에도 계정은 필요에 따라 여러 개 만들 수 있습니다.",
  "advice": "참고",
  "openServerAdvice": "불특정 다수의 유저를 받아들이는 것에는 위험이 따릅니다. 문제에 대처할 수 있도록 확실한 조정 체제로 운영하는 것을 권장합니다.",
  "openServerAntiSpamAdvice": "자신의 서버가 스팸으로 사용되지 않게끔 reCAPTCHA라는 안티 봇 기능을 활성화하는 등 보안에 대해서도 세심한 주의가 필요합니다.",
  "howManyUsersDoYouExpect": "어느 정도의 인원으로 생각 중이십니까?",
  "small": "100명 이하(소규모)",
  "medium": "100명 이상 1000명 이하(중간 규모)",
  "large": "1000명 이상(대규모)",
  "largeScaleServerAdvice": "대규모 서버에서는 부하분산이나 데이터베이스의 복제 등 높은 인프라스트럭처 지식이 필요할 수 있습니다.",
  "doYouConnectToFediverse": "Fediverse에 접속하시겠습니까?",
  "doYouConnectToFediverse_description1": "분산형 서버로 구성된 네트워크(Fediverse)에 접속하면 다른 서버와 서로 콘텐츠의 주고받기를 할 수 있습니다.",
  "doYouConnectToFediverse_description2": "Fediverse에 접속하는 것을 '연합'이라고도 부릅니다.",
  "learnMore": "자세히",
  "yes": "예",
  "no": "아니오",
  "youCanConfigureMoreFederationSettingsLater": "나중에 연합 가능한 서버의 지정 등 고급 설정을 할 수 있습니다.",
  "remoteContentsCleaning": "리모트 콘텐츠 자동 정리",
  "remoteContentsCleaning_description": "연합 중인 서버가 있는 경우, 리모트 서버에서 대단히 많은 콘텐츠를 받아오게 됩니다. 자동 정리 기능을 활성화하면, 오래되고 서버에서 더 이상 조회되지 않는 콘텐츠를 자동으로 서버에서 삭제하여, 스토리지를 절약할 수 있습니다.",
  "adminInfo": "관리자 정보",
  "adminInfo_description": "문의 접수를 위해 사용되는 관리자 정보를 설정합니다.",
  "adminInfo_mustBeFilled": "오픈 서버 혹은 연합이 켜져 있는 경우 반드시 입력해야 합니다.",
  "maintainerName": "관리자 이름",
  "maintainerEmail": "관리자 이메일",
  "followingSettingsAreRecommended": "아래의 설정이 권장됩니다.",
  "singleUserMode": "1인 모드",
  "openRegistration": "회원 가입을 활성화 하기",
  "emailRequiredForSignup": "가입할 때 이메일 주소 입력을 필수로 하기",
  "federation": "연합",
  "all": "전체",
  "remoteNotesCleaning": "리모트 서버 노트 자동 정리 ",
  "fanoutTimelineDbFallback": "데이터베이스를 예비로 사용하기",
  "entrancePageStyle": "입구 페이지의 스타일",
  "baseRole": "기본 역할",
  "rateLimitFactor": "요청 빈도 제한",
  "driveCapacity": "드라이브 용량",
  "userListMax": "만들 수 있는 유저 리스트 수",
  "antennaMax": "만들 수 있는 안테나 수",
  "webhookMax": "만들 수 있는 Webhook 수",
  "canImportFollowing": "팔로우 가져오기 허용",
  "canImportMuting": "뮤트 목록 가져오기 허용",
  "canImportBlocking": "차단 목록 가져오기 허용",
  "canImportUserLists": "리스트 목록 가져오기 허용",
  "canImportAntennas": "안테나 가져오기 허용",
  "applyTheseSettings": "이 설정을 적용"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "instanceName": "Naam van de server",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Meer leren",
  "yes": "Ja",
  "no": "Nee",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Onderhouder",
  "maintainerEmail": "E-mailadres beheerder",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Vereist e-mailadres voor aanmelding",
  "federation": "Federatie",
  "all": "Alle",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "instanceName": "Servernavn",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Les mer",
  "yes": "Ja",
  "no": "Nei",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Maintainer",
  "maintainerEmail": "Maintainer email",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Require email address for sign-up",
  "federation": "Føderasjon",
  "all": "Alle",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "instanceName": "Nazwa instancji",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Dowiedz się więcej",
  "yes": "Tak",
  "no": "Nie",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Administrator",
  "maintainerEmail": "E-mail administratora",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Wymagaj adresu e-mail do rejestracji",
  "federation": "Federacja",
  "all": "Wszystkie",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "instanceName": "Nome da instância",
  "howWillYouUseMisskey": "Como você usará o Misskey?",
  "single": "Servidor de Usuário Único",
  "single_description": "Utilizar servidor sozinho.",
  "group": "Servidor de Grupo",
  "group_description": "Convide outros usuários confiáveis para utilizar com mais de um usuário",
  "open": "Servidor Público",
  "open_description": "Permitir registro de todos.",
  "single_youCanCreateMultipleAccounts": "Múltiplas contas podem ser criadas se necessário, mesmo operando como servidor de usuário único.",
  "advice": "Dica",
  "openServerAdvice": "Aceitar um número alto de pessoas desconhecidas pode envolve um risco. Recomendamos que você opere com um sistema de moderação confiável para resolver quaisquer problemas.",
  "openServerAntiSpamAdvice": "Para prevenir que o seu servidor se torne alvo de spam, é essencial cuidar da segurança habilitando recursos antibot como o reCAPTCHA.",
  "howManyUsersDoYouExpect": "Quantos usuários você espera?",
  "small": "Menos que 100 (pequeno porte)",
  "medium": "Entre 100 e 1000 usuários (médio porte)",
  "large": "Mais que 1000 usuários (larga escala)",
  "largeScaleServerAdvice": "Servidores de larga escala podem precisar de conhecimento avançado de infraestrutura, como balanceamento de carga e replicação de banco de dados.",
  "doYouConnectToFediverse": "Você deseja conectar-se com o Fediverso?",
  "doYouConnectToFediverse_description1": "Quando conectado com uma rede distribuída de servidores (Fediverso), o conteúdo pode ser trocado com outros servidores.",
  "doYouConnectToFediverse_description2": "Conectar com o Fediverso também é chamado de \"federação\"",
  "learnMore": "Saiba mais",
  "yes": "Sim",
  "no": "Não",
  "youCanConfigureMoreFederationSettingsLater": "Configurações adicionais como especificar servidores para conectar-se com podem ser feitas posteriormente",
  "remoteContentsCleaning": "Limpeza automática de conteúdos recebidos",
  "remoteContentsCleaning_description": "A federação pode resultar em uma entrada contínua de conteúdo. Habilitar a limpeza automática removerá conteúdo obsoleto e não referenciado do servidor para economizar armazenamento.",
  "adminInfo": "Informações da administração",
  "adminInfo_description": "Define as informações do administrador usadas para receber consultas.",
  "adminInfo_mustBeFilled": "Deve ser preenchido se o servidor é público ou se a federação está ativa.",
  "maintainerName": "Nome do administrador",
  "maintainerEmail": "E-mail do Administrador:",
  "followingSettingsAreRecommended": "As configurações a seguir são recomendadas",
  "singleUserMode": "Modo de usuário único",
  "openRegistration": "Abrir a criação de contas",
  "emailRequiredForSignup": "Tornar o endereço de e-mail obrigatório durante o cadastro",
  "federation": "Federação",
  "all": "Todos",
  "remoteNotesCleaning": "Limpeza automática de notas remotas",
  "fanoutTimelineDbFallback": "\"Fallback\" ao banco de dados",
  "entrancePageStyle": "Estilo da página de entrada",
  "baseRole": "Cargo padrão",
  "rateLimitFactor": "Taxa de limitação",
  "driveCapacity": "Capacidade do drive",
  "userListMax": "Número máximo de listas de usuários",
  "antennaMax": "Número máximo de antenas",
  "webhookMax": "Número máximo de webhooks",
  "canImportFollowing": "Permitir importação de usuários seguidos",
  "canImportMuting": "Permitir importação de silenciamentos",
  "canImportBlocking": "Permitir importação de bloqueios",
  "canImportUserLists": "Permitir importação de listas",
  "canImportAntennas": "Permitir importação de antenas",
  "applyTheseSettings": "Aplicar essas configurações"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "instanceName": "Название инстанса",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Совет",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Подробнее",
  "yes": "Да",
  "no": "Нет",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Имя администратора",
  "maintainerEmail": "Электронная почта администратора",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Для регистрации учётной записи нужен адрес электронной почты",
  "federation": "Федерация",
  "all": "Все",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Шаблон роли",
  "rateLimitFactor": "Ограничение активности",
  "driveCapacity": "Доступное пространство на «диске»",
  "userListMax": "Максимальное количество списков аккаунтов",
  "antennaMax": "Доступное количество антенн",
  "webhookMax": "Максимум web-хуков",
  "canImportFollowing": "Можно импортировать подписчиков",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "instanceName": "Názov servera",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Zistiť viac",
  "yes": "Áno",
  "no": "Nie",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Správca",
  "maintainerEmail": "E-mailová adresa správcu",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Registrácia vyžaduje emailovú adresu",
  "federation": "Federácia",
  "all": "Všetko",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "instanceName": "ชื่อเซิร์ฟเวอร์",
  "howWillYouUseMisskey": "ต้องการใช้ Misskey อย่างไร?",
  "single": "เซิร์ฟเวอร์คนเดียว",
  "single_description": "ใช้งานเป็นเซิร์ฟเวอร์ส่วนตัวสำหรับตัวเองคนเดียว",
  "group": "เซิร์ฟเวอร์กลุ่ม",
  "group_description": "เชิญผู้ใช้ที่เชื่อถือได้ มาเข้าร่วมใช้งานแบบหลายคน",
  "open": "เซิร์ฟเวอร์สาธารณะ",
  "open_description": "เปิดรับผู้ใช้จำนวนมากแบบไม่จำกัด",
  "single_youCanCreateMultipleAccounts": "แม้จะใช้งานเป็นเซิร์ฟเวอร์ส่วนตัวสำหรับคนเดียว ก็สามารถสร้างบัญชีผู้ใช้หลายบัญชีได้ตามความจำเป็น",
  "advice": "คำแนะนำ",
  "openServerAdvice": "การเปิดรับผู้ใช้จำนวนมากมีความเสี่ยง ควรบริหารจัดการด้วยระบบดูแลที่เข้มงวดเพื่อรับมือกับปัญหาที่อาจเกิดขึ้น",
  "openServerAntiSpamAdvice": "เพื่อป้องกันไม่ให้เซิร์ฟเวอร์ของตนกลายเป็นแหล่งส่งสแปม ควรเปิดใช้งานฟีเจอร์ป้องกันบอต เช่น reCAPTCHA และใส่ใจเรื่องความปลอดภัยอย่างเคร่งครัด",
  "howManyUsersDoYouExpect": "คาดว่าจะมีผู้ใช้งานประมาณกี่คน?",
  "small": "น้อยกว่า 100 คน (ขนาดเล็ก)",
  "medium": "เกิน 100 คน แต่น้อยกว่า 1000 คน (ขนาดกลาง)",
  "large": "เกิน 1000 คน (ขนาดใหญ่)",
  "largeScaleServerAdvice": "เซิร์ฟเวอร์ขนาดใหญ่อาจต้องการความรู้ด้านโครงสร้างพื้นฐานขั้นสูง เช่น การบาลานซ์โหลด หรือการทำสำเนาฐานข้อมูล",
  "doYouConnectToFediverse": "เชื่อมต่อกับ Fediverse หรือไม่?",
  "doYouConnectToFediverse_description1": "หากเชื่อมต่อกับเครือข่ายที่ประกอบด้วยเซิร์ฟเวอร์แบบกระจาย (Fediverse) จะสามารถแลกเปลี่ยนเนื้อหากับเซิร์ฟเวอร์อื่นๆ ได้",
  "doYouConnectToFediverse_description2": "การเชื่อมต่อกับ Fediverse เรียกว่า “สหพันธ์”",
  "learnMore": "แสดงให้ดูหน่อย",
  "yes": "ใช่",
  "no": "ไม่",
  "youCanConfigureMoreFederationSettingsLater": "หลังจากนี้ยังสามารถตั้งค่าแบบขั้นสูง เช่น การกำหนดเซิร์ฟเวอร์ที่อนุญาตให้สหพันธ์ต่อกันได้เพิ่มเติม",
  "remoteContentsCleaning": "การล้างข้อมูลเนื้อหาที่ได้รับโดยอัตโนมัติ",
  "remoteContentsCleaning_description": "เมื่อมีการเชื่อมโยงสหพันธ์ จะได้รับเนื้อหาเป็นจำนวนมากอย่างต่อเนื่อง เมื่อเปิดใช้งานการล้างข้อมูลอัตโนมัติ จะทำการลบเนื้อหาเก่าที่ไม่ถูกอ้างอิง ไปจากเซิร์ฟเวอร์โดยอัตโนมัติ เพื่อประหยัดพื้นที่จัดเก็บข้อมูล",
  "adminInfo": "ข้อมูลผู้ดูแลระบ",
  "adminInfo_description": "ตั้งค่าข้อมูลผู้ดูแลระบบที่จะใช้รับคำถามและติดต่อ",
  "adminInfo_mustBeFilled": "หากเปิดใช้เซิร์ฟเวอร์สาธารณะ หรือเปิดใช้งานสหพันธ์ จะต้องกรอกข้อมูลนี้",
  "maintainerName": "ชื่อผู้ดูแลระบบ",
  "maintainerEmail": "อีเมลผู้ดูแลระบบ",
  "followingSettingsAreRecommended": "แนะนำให้ตั้งค่าตามด้านล่างนี้",
  "singleUserMode": "โหมดผู้ใช้คนเดียว",
  "openRegistration": "เปิดให้สร้างบัญชีได้",
  "emailRequiredForSignup": "จำเป็นต้องการใช้ที่อยู่อีเมลสำหรับการสมัคร",
  "federation": "สหพันธ์",
  "all": "ทั้งหมด",
  "remoteNotesCleaning": "การล้างข้อมูลโพสต์จากระยะไกลโดยอัตโนมัติ",
  "fanoutTimelineDbFallback": "ฟอลแบ๊กกลับฐานข้อมูล",
  "entrancePageStyle": "สไตล์ของหน้าเพจทางเข้า",
  "baseRole": "แม่แบบบทบาท",
  "rateLimitFactor": "อัตราการจำกัด",
  "driveCapacity": "ความจุของไดรฟ์",
  "userListMax": "จำนวนรายชื่อผู้ใช้สูงสุด",
  "antennaMax": "จำนวนสูงสุดของเสาอากาศ",
  "webhookMax": "จำนวนเว็บฮุคสูงสุด",
  "canImportFollowing": "อนุญาตให้นำเข้ารายการต่อไปนี้",
  "canImportMuting": "อนุญาตให้นำเข้าการปิดเสียง",
  "canImportBlocking": "อนุญาตให้นำเข้าการบล็อก",
  "canImportUserLists": "อนุญาตให้นำเข้ารายการ",
  "canImportAntennas": "อนุญาตให้นำเข้าเสาอากาศ",
  "applyTheseSettings": "ใช้การตั้งค่านี้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "instanceName": "Sunucu adı",
  "howWillYouUseMisskey": "Misskey'i nasıl kullanacaksınız?",
  "single": "Tek Kullanıcı Sunucusu",
  "single_description": "Kendi sunucunuz olarak tek başına kullanın.",
  "group": "Grup sunucusu",
  "group_description": "Diğer güvenilir kullanıcıları birden fazla kullanıcıyla birlikte kullanmaya davet edin.",
  "open": "Genel sunucu",
  "open_description": "Herkesin kayıt olmasına izin verin.",
  "single_youCanCreateMultipleAccounts": "Tek kullanıcı sunucusu olarak çalıştırıldığında bile, gerektiğinde birden fazla hesap oluşturulabilir.",
  "advice": "Tavsiye",
  "openServerAdvice": "Çok sayıda bilinmeyen kullanıcıyı kabul etmek risklidir. Herhangi bir sorunu çözmek için güvenilir bir moderasyon sistemi kullanmanızı öneririz.",
  "openServerAntiSpamAdvice": "Sunucunuzun spam için bir basamak haline gelmesini önlemek için, reCAPTCHA gibi anti-bot işlevlerini etkinleştirerek güvenliğe de özen göstermelisin.",
  "howManyUsersDoYouExpect": "Kaç kullanıcı bekliyorsunuz?",
  "small": "100'den az (küçük ölçekli)",
  "medium": "100'den fazla ve 1000'den az kullanıcı (orta büyüklükte)",
  "large": "1000'den fazla (Büyük ölçekli)",
  "largeScaleServerAdvice": "Büyük sunucular, yük dengeleme ve veritabanı çoğaltma gibi gelişmiş altyapı bilgisi gerektirebilir.",
  "doYouConnectToFediverse": "Fediverse'e bağlanmak ister misin?",
  "doYouConnectToFediverse_description1": "Dağıtılmış sunucular ağına (Fediverse) bağlandığında, içerik diğer sunucularla paylaşılabilir.",
  "doYouConnectToFediverse_description2": "Fediverse ile bağlantı kurmak “federasyon” olarak da adlandırılır.",
  "learnMore": "Daha fazla bilgi edinin",
  "yes": "Evet",
  "no": "Hayır",
  "youCanConfigureMoreFederationSettingsLater": "Birleştirilmiş sunucuları belirtme gibi gelişmiş ayarlar daha sonra yapılandırılabilir.",
  "remoteContentsCleaning": "Alınan içeriklerin otomatik olarak temizlenmesi",
  "remoteContentsCleaning_description": "Federasyon, sürekli içerik akışına neden olabilir. Otomatik temizleme özelliğini etkinleştirmek, depolama alanından tasarruf etmek için sunucudan eski ve referanslanmamış içeriği kaldıracak.",
  "adminInfo": "Yönetici bilgileri",
  "adminInfo_description": "Sorguları almak için kullanılan yönetici bilgilerini ayarlar.",
  "adminInfo_mustBeFilled": "Genel sunucu veya federasyon açıksa girilmelidir.",
  "maintainerName": "Bakım sorumlusu",
  "maintainerEmail": "Bakım sorumlusu E-Posta adresi",
  "followingSettingsAreRecommended": "Aşağıdaki ayarlar önerilir",
  "singleUserMode": "Tek kullanıcı modu",
  "openRegistration": "Hesap oluşturmayı açık hale getir",
  "emailRequiredForSignup": "Kayıt için E-posta adresi gereklidir.",
  "federation": "Federasyon",
  "all": "Tümü",
  "remoteNotesCleaning": "Uzak notların otomatik olarak temizlenmesi",
  "fanoutTimelineDbFallback": "Veritabanına geri dön",
  "entrancePageStyle": "Giriş sayfası stili",
  "baseRole": "Rol şablonu",
  "rateLimitFactor": "Hız Sınırı",
  "driveCapacity": "Drive kapasitesi",
  "userListMax": "Maksimum kullanıcı listesi sayısı",
  "antennaMax": "Maksimum anten sayısı",
  "webhookMax": "Maksimum Webhook sayısı",
  "canImportFollowing": "Aşağıdakilerin içe aktarılmasına izin ver",
  "canImportMuting": "Sessize alma özelliğini içe aktarmaya izin ver",
  "canImportBlocking": "Engellemeyi içe aktarmaya izin ver",
  "canImportUserLists": "Listelerin içe aktarılmasına izin ver",
  "canImportAntennas": "Antenlerin içe aktarılmasına izin ver",
  "applyTheseSettings": "Bu ayarları uygulayın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "instanceName": "Instance name",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Learn more",
  "yes": "Yes",
  "no": "No",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Maintainer",
  "maintainerEmail": "Maintainer email",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Require email address for sign-up",
  "federation": "Federation",
  "all": "All",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "instanceName": "Назва інстансу",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Порада",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Докладніше",
  "yes": "Так",
  "no": "Ні",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Ім'я адміністратора",
  "maintainerEmail": "Email адміністратора",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Вимагати email адресу для реєстрації",
  "federation": "Федіверс",
  "all": "Всі",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Drive capacity",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Maximum number of antennas",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "instanceName": "Tên máy chủ",
  "howWillYouUseMisskey": "How will you use Misskey?",
  "single": "Single User server",
  "single_description": "Use it alone as your own server.",
  "group": "Group server",
  "group_description": "Invite other trusted users to use it with more than one user.",
  "open": "Public server",
  "open_description": "Allow anyone to register.",
  "single_youCanCreateMultipleAccounts": "Multiple accounts can be created as needed, even when operated as a single user server.",
  "advice": "Advice",
  "openServerAdvice": "Accepting a large number of unknown users involves risk. We recommend that you operate with a reliable moderation system to handle any problems.",
  "openServerAntiSpamAdvice": "To prevent your server from becoming a stepping stone for spam, you should also pay close attention to security by enabling anti-bot functions such as reCAPTCHA.",
  "howManyUsersDoYouExpect": "How many users do you expect?",
  "small": "Less than 100 (small scale)",
  "medium": "More than 100 and less than 1000 users (medium size)",
  "large": "More than 1000 (Large scale)",
  "largeScaleServerAdvice": "Large servers may require advanced infrastructure knowledge, such as load balancing and database replication.",
  "doYouConnectToFediverse": "Do you want to connect to the Fediverse?",
  "doYouConnectToFediverse_description1": "When connected to a network of distributed servers (Fediverse) content can be exchanged with other servers.",
  "doYouConnectToFediverse_description2": "Connecting with the Fediverse is also called \"federation\"",
  "learnMore": "Tìm hiểu thêm",
  "yes": "Đồng ý",
  "no": "Từ chối",
  "youCanConfigureMoreFederationSettingsLater": "Advanced settings such as specifying federated servers can be configured later.",
  "remoteContentsCleaning": "Automatic cleanup of received contents",
  "remoteContentsCleaning_description": "Federation may result in a continuous inflow of content. Enabling automatic cleanup will remove outdated and unreferenced content from the server to save storage.",
  "adminInfo": "Administrator information",
  "adminInfo_description": "Sets the administrator information used to receive inquiries.",
  "adminInfo_mustBeFilled": "Must be entered if public server or federation is on.",
  "maintainerName": "Đội ngũ vận hành",
  "maintainerEmail": "Email đội ngũ",
  "followingSettingsAreRecommended": "The following settings are recommended",
  "singleUserMode": "Single user mode",
  "openRegistration": "Make the account creation open",
  "emailRequiredForSignup": "Yêu cầu địa chỉ email khi đăng ký",
  "federation": "Liên hợp",
  "all": "Tất cả",
  "remoteNotesCleaning": "Automatic cleanup of remote notes",
  "fanoutTimelineDbFallback": "Fallback to database",
  "entrancePageStyle": "Entrance page style",
  "baseRole": "Role template",
  "rateLimitFactor": "Rate limit",
  "driveCapacity": "Dữ liệu Drive",
  "userListMax": "Maximum number of user lists",
  "antennaMax": "Giới hạn tạo ăng ten",
  "webhookMax": "Maximum number of Webhooks",
  "canImportFollowing": "Can import following",
  "canImportMuting": "Can import muting",
  "canImportBlocking": "Can import blocking",
  "canImportUserLists": "Can import lists",
  "canImportAntennas": "Can import antennas",
  "applyTheseSettings": "Apply these settings"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "instanceName": "服务器名称",
  "howWillYouUseMisskey": "打算怎样使用 Misskey？",
  "single": "单用户服务器",
  "single_description": "仅供自己使用的单人服务器",
  "group": "群组服务器",
  "group_description": "邀请其他可信用户一起使用的多人服务器",
  "open": "开放服务器",
  "open_description": "以容纳不限定数量的用户的模式运行",
  "single_youCanCreateMultipleAccounts": "使用单用户服务器模式使用时，也可以根据需要创建多个账号。",
  "advice": "建议",
  "openServerAdvice": "容纳不限定数量的用户有风险。推荐建立能应对各种问题的强大的管理体制来运营。",
  "openServerAntiSpamAdvice": "为防止自己的服务器成为广告发信基地，请打开如 reCAPTCHA 等 Bot 防御功能，并谨慎关注安全性。",
  "howManyUsersDoYouExpect": "预计会有多少用户？",
  "small": "100 人以下（小规模）",
  "medium": "100 人以上 1000 人以下（中规模）",
  "large": "1000 人以上（大规模）",
  "largeScaleServerAdvice": "运营大规模服务器可能需要高级基础设施知识，如负载均衡和数据库复制。",
  "doYouConnectToFediverse": "要加入 Fediverse 吗？",
  "doYouConnectToFediverse_description1": "若加入由分散性服务器所构成的网络（Fediverse），将能与其它服务器交换内容。",
  "doYouConnectToFediverse_description2": "接入 Fediverse 被称为 “联邦”。",
  "learnMore": "更多信息",
  "yes": "是",
  "no": "否",
  "youCanConfigureMoreFederationSettingsLater": "可在之后进行如哪些服务器允许进行联邦交互等高级设置。",
  "remoteContentsCleaning": "自动清理传入内容",
  "remoteContentsCleaning_description": "开启联邦互通后，服务器将持续接收大量内容。打开自动清理后，将自动删除无法找到的旧内容，可节省存储空间。",
  "adminInfo": "管理员信息",
  "adminInfo_description": "设置用于接受询问的管理员信息。",
  "adminInfo_mustBeFilled": "开放服务器或启用了联邦的情况下必须输入。",
  "maintainerName": "管理员名称",
  "maintainerEmail": "管理员电子邮箱",
  "followingSettingsAreRecommended": "推荐以下设置",
  "singleUserMode": "单用户模式",
  "openRegistration": "开放注册",
  "emailRequiredForSignup": "注册账户需要电子邮件地址",
  "federation": "联邦",
  "all": "全部",
  "remoteNotesCleaning": "自动清理远程投稿",
  "fanoutTimelineDbFallback": "回退到数据库",
  "entrancePageStyle": "入口页面样式",
  "baseRole": "基本角色",
  "rateLimitFactor": "速率限制",
  "driveCapacity": "网盘容量",
  "userListMax": "可创建的用户列表数量",
  "antennaMax": "可创建的天线数量",
  "webhookMax": "可创建的 Webhook 的数量",
  "canImportFollowing": "允许导入关注列表",
  "canImportMuting": "允许导入隐藏列表",
  "canImportBlocking": "允许导入屏蔽列表",
  "canImportUserLists": "允许导入用户列表",
  "canImportAntennas": "允许导入天线",
  "applyTheseSettings": "使用此设置"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "instanceName": "伺服器名稱",
  "howWillYouUseMisskey": "您打算如何使用 Misskey？\n",
  "single": "單人伺服器",
  "single_description": "作為自己專用的伺服器，單獨使用。\n",
  "group": "群組伺服器\n",
  "group_description": "邀請可信賴的其他使用者，共同使用伺服器。\n",
  "open": "開放式伺服器",
  "open_description": "運營時接納不特定多數的使用者。",
  "single_youCanCreateMultipleAccounts": "即使作為單人伺服器運行，根據需要也可以創建多個帳戶。\n",
  "advice": "建議",
  "openServerAdvice": "接納不特定多數使用者會帶來風險。為了能夠有效處理問題，建議建立完善的審查機制來進行運營。\n",
  "openServerAntiSpamAdvice": "為了防止自家伺服器成為垃圾郵件的跳板，必須啟用如 reCAPTCHA 等反機器人功能，並對安全性保持高度警覺。\n",
  "howManyUsersDoYouExpect": "您預計有多少人使用呢？\n",
  "small": "100人以下（小規模）\n",
  "medium": "100人以上1000人以下（中規模）\n",
  "large": "1000人以上（大規模）\n",
  "largeScaleServerAdvice": "在大規模伺服器中，可能需要具備高階基礎設施知識，如負載平衡和資料庫複寫等。\n",
  "doYouConnectToFediverse": "您要連接到聯邦宇宙（Fediverse）嗎？\n",
  "doYouConnectToFediverse_description1": "連接到由分散型伺服器構成的網絡（聯邦宇宙）後，您可以與其他伺服器進行內容的互相交流。\n",
  "doYouConnectToFediverse_description2": "連接到聯邦宇宙被稱為「聯邦」。\n",
  "learnMore": "更多資訊",
  "yes": "是",
  "no": "否",
  "youCanConfigureMoreFederationSettingsLater": "您可以在稍後進行更高級的設定，例如指定可以聯繫的伺服器等。\n",
  "remoteContentsCleaning": "自動清理接收的內容",
  "remoteContentsCleaning_description": "進行聯邦後，會持續接收大量內容。啟用自動清理功能後，系統會自動從伺服器中刪除未被參照的過時內容，以節省儲存空間。",
  "adminInfo": "管理員資訊",
  "adminInfo_description": "設定用於接收查詢的管理者資訊。\n",
  "adminInfo_mustBeFilled": "當設置為開放伺服器或啟用聯邦時，必須填寫此資訊。\n",
  "maintainerName": "管理員名稱",
  "maintainerEmail": "管理員信箱",
  "followingSettingsAreRecommended": "建議使用下列設定",
  "singleUserMode": "單人模式",
  "openRegistration": "允許建立帳戶",
  "emailRequiredForSignup": "註冊帳戶需要電子郵件地址",
  "federation": "站台聯邦",
  "all": "全部",
  "remoteNotesCleaning": "自動清除遠端發佈內容",
  "fanoutTimelineDbFallback": "資料庫的回退",
  "entrancePageStyle": "入口頁面的樣式",
  "baseRole": "基本角色",
  "rateLimitFactor": "速率限制",
  "driveCapacity": "雲端硬碟容量",
  "userListMax": "可建立的使用者清單數量",
  "antennaMax": "可建立的天線數量",
  "webhookMax": "可建立的 Webhook 數量",
  "canImportFollowing": "允許匯入追隨名單",
  "canImportMuting": "允許匯入靜音名單",
  "canImportBlocking": "允許匯入封鎖名單",
  "canImportUserLists": "允許匯入清單",
  "canImportAntennas": "允許匯入天線",
  "applyTheseSettings": "套用此設定"
}
</locale>
