<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/moderation" :label="$locale.sfc.moderation" :keywords="['moderation']" icon="ti ti-shield" :inlining="['serverRules']">
			<div class="_gaps_m">
				<SearchMarker :keywords="['open', 'registration']">
					<MkSwitch :modelValue="enableRegistration" @update:modelValue="onChange_enableRegistration">
						<template #label><SearchLabel>{{ $locale.sfc.openRegistration }}</SearchLabel></template>
						<template #caption>
							<div><SearchText>{{ $locale.sfc.thisSettingWillAutomaticallyOffWhenModeratorsInactive }}</SearchText></div>
							<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> <SearchText>{{ $locale.sfc.openRegistrationWarning }}</SearchText></div>
						</template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['email', 'required', 'signup']">
					<MkSwitch v-model="emailRequiredForSignup" @change="onChange_emailRequiredForSignup">
						<template #label><SearchLabel>{{ $locale.sfc.emailRequiredForSignup }}</SearchLabel> ({{ $locale.sfc.recommended }})</template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['ugc', 'content', 'visibility', 'visitor', 'guest']">
					<MkSelect v-model="ugcVisibilityForVisitor" :items="ugcVisibilityForVisitorDef" @update:modelValue="onChange_ugcVisibilityForVisitor">
						<template #label><SearchLabel>{{ $locale.sfc.userGeneratedContentsVisibilityForVisitor }}</SearchLabel></template>
						<template #caption>
							<div><SearchText>{{ $locale.sfc.userGeneratedContentsVisibilityForVisitor_description }}</SearchText></div>
							<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> <SearchText>{{ $locale.sfc.userGeneratedContentsVisibilityForVisitor_description2 }}</SearchText></div>
						</template>
					</MkSelect>
				</SearchMarker>

				<XServerRules/>

				<SearchMarker :keywords="['preserved', 'usernames']">
					<MkFolder>
						<template #icon><SearchIcon><i class="ti ti-lock-star"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.preservedUsernames }}</SearchLabel></template>

						<div class="_gaps">
							<MkTextarea v-model="preservedUsernames">
								<template #caption>{{ $locale.sfc.preservedUsernamesDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_preservedUsernames">{{ $locale.sfc.save }}</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['sensitive', 'words']">
					<MkFolder>
						<template #icon><SearchIcon><i class="ti ti-message-exclamation"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.sensitiveWords }}</SearchLabel></template>

						<div class="_gaps">
							<MkTextarea v-model="sensitiveWords">
								<template #caption>{{ $locale.sfc.sensitiveWordsDescription }}<br>{{ $locale.sfc.sensitiveWordsDescription2 }}</template>
							</MkTextarea>
							<MkButton primary @click="save_sensitiveWords">{{ $locale.sfc.save }}</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['prohibited', 'words']">
					<MkFolder>
						<template #icon><SearchIcon><i class="ti ti-message-x"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.prohibitedWords }}</SearchLabel></template>

						<div class="_gaps">
							<MkTextarea v-model="prohibitedWords">
								<template #caption>{{ $locale.sfc.prohibitedWordsDescription }}<br>{{ $locale.sfc.prohibitedWordsDescription2 }}</template>
							</MkTextarea>
							<MkButton primary @click="save_prohibitedWords">{{ $locale.sfc.save }}</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['prohibited', 'name', 'user']">
					<MkFolder>
						<template #icon><SearchIcon><i class="ti ti-user-x"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.prohibitedWordsForNameOfUser }}</SearchLabel></template>

						<div class="_gaps">
							<MkTextarea v-model="prohibitedWordsForNameOfUser">
								<template #caption>{{ $locale.sfc.prohibitedWordsForNameOfUserDescription }}<br>{{ $locale.sfc.prohibitedWordsDescription2 }}</template>
							</MkTextarea>
							<MkButton primary @click="save_prohibitedWordsForNameOfUser">{{ $locale.sfc.save }}</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['hidden', 'tags', 'hashtags']">
					<MkFolder>
						<template #icon><SearchIcon><i class="ti ti-eye-off"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.hiddenTags }}</SearchLabel></template>

						<div class="_gaps">
							<MkTextarea v-model="hiddenTags">
								<template #caption>{{ $locale.sfc.hiddenTagsDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_hiddenTags">{{ $locale.sfc.save }}</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['silenced', 'servers', 'hosts']">
					<MkFolder>
						<template #icon><SearchIcon><i class="ti ti-eye-off"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.silencedInstances }}</SearchLabel></template>

						<div class="_gaps">
							<MkTextarea v-model="silencedHosts">
								<template #caption>{{ $locale.sfc.silencedInstancesDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_silencedHosts">{{ $locale.sfc.save }}</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['media', 'silenced', 'servers', 'hosts']">
					<MkFolder>
						<template #icon><SearchIcon><i class="ti ti-eye-off"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.mediaSilencedInstances }}</SearchLabel></template>

						<div class="_gaps">
							<MkTextarea v-model="mediaSilencedHosts">
								<template #caption>{{ $locale.sfc.mediaSilencedInstancesDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_mediaSilencedHosts">{{ $locale.sfc.save }}</MkButton>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['blocked', 'servers', 'hosts']">
					<MkFolder>
						<template #icon><SearchIcon><i class="ti ti-ban"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.blockedInstances }}</SearchLabel></template>

						<div class="_gaps">
							<MkTextarea v-model="blockedHosts">
								<template #caption>{{ $locale.sfc.blockedInstancesDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_blockedHosts">{{ $locale.sfc.save }}</MkButton>
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
import * as Misskey from 'misskey-js';
import XServerRules from '@features/instance/frontend/pages/admin/server-rules.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { fetchInstance } from '@features/instance/frontend/instance.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';

const meta = await misskeyApi('admin/meta');

const enableRegistration = ref(!meta.disableRegistration);
const emailRequiredForSignup = ref(meta.emailRequiredForSignup);
const {
	model: ugcVisibilityForVisitor,
	def: ugcVisibilityForVisitorDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'all' },
		{ label: $locale.value.sfc.localOnly, value: 'local' },
		{ label: $locale.value.sfc.none, value: 'none' },
	],
	initialValue: meta.ugcVisibilityForVisitor,
});
const sensitiveWords = ref(meta.sensitiveWords.join('\n'));
const prohibitedWords = ref(meta.prohibitedWords.join('\n'));
const prohibitedWordsForNameOfUser = ref(meta.prohibitedWordsForNameOfUser.join('\n'));
const hiddenTags = ref(meta.hiddenTags.join('\n'));
const preservedUsernames = ref(meta.preservedUsernames.join('\n'));
const blockedHosts = ref(meta.blockedHosts.join('\n'));
const silencedHosts = ref(meta.silencedHosts?.join('\n') ?? '');
const mediaSilencedHosts = ref(meta.mediaSilencedHosts.join('\n'));

async function onChange_enableRegistration(value: boolean) {
	if (value) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: $locale.value.sfc.acknowledgeNotesAndEnable,
		});
		if (canceled) return;
	}

	enableRegistration.value = value;

	os.apiWithDialog('admin/update-meta', {
		disableRegistration: !value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_emailRequiredForSignup(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		emailRequiredForSignup: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_ugcVisibilityForVisitor(value: typeof ugcVisibilityForVisitor.value) {
	os.apiWithDialog('admin/update-meta', {
		ugcVisibilityForVisitor: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function save_preservedUsernames() {
	os.apiWithDialog('admin/update-meta', {
		preservedUsernames: preservedUsernames.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_sensitiveWords() {
	os.apiWithDialog('admin/update-meta', {
		sensitiveWords: sensitiveWords.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_prohibitedWords() {
	os.apiWithDialog('admin/update-meta', {
		prohibitedWords: prohibitedWords.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_prohibitedWordsForNameOfUser() {
	os.apiWithDialog('admin/update-meta', {
		prohibitedWordsForNameOfUser: prohibitedWordsForNameOfUser.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_hiddenTags() {
	os.apiWithDialog('admin/update-meta', {
		hiddenTags: hiddenTags.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_blockedHosts() {
	os.apiWithDialog('admin/update-meta', {
		blockedHosts: blockedHosts.value.split('\n') || [],
	}).then(() => {
		fetchInstance(true);
	});
}

function save_silencedHosts() {
	os.apiWithDialog('admin/update-meta', {
		silencedHosts: silencedHosts.value.split('\n') || [],
	}).then(() => {
		fetchInstance(true);
	});
}

function save_mediaSilencedHosts() {
	os.apiWithDialog('admin/update-meta', {
		mediaSilencedHosts: mediaSilencedHosts.value.split('\n') || [],
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.moderation,
	icon: 'ti ti-shield',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "الإشراف",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "عنوان البريد الإلكتروني إلزامي للتسجيل",
	"recommended": "مقترح",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "أسماء المستخدمين المحجوزة",
	"preservedUsernamesDescription": "قائمة بأسماء المستخدمين المحجوزة كلٌ في سطر. لن يُقبل التسجيل بهذه الأسماء وستبقى محصورة على التسجيل اليدوي بواسطة المديرين. لن يتأثر المستخدمون الذين يملكون هذه الأسماء سلفًا.",
	"save": "حفظ",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "المثلاء المحجوبون",
	"blockedInstancesDescription": "قائمة بالمثلاء التي تريد حظرها بحيث كل نطاق في سطر لوحده. بعد إدراجهم لن يتمكنوا من التفاعل مع هذا المثيل."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"all": "Tot obert al públic ",
	"localOnly": "Només es publiquen els continguts locals, el contingut remot es manté privat",
	"none": "Tot privat",
	"acknowledgeNotesAndEnable": "Activa'l després de comprendre els possibles perills.",
	"moderation": "Moderació",
	"openRegistration": "Registres oberts",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "Si no es detecta activitat per part del moderador durant un període de temps, aquesta opció es desactiva automàticament per evitar el correu brossa.",
	"openRegistrationWarning": "Obrir els registres és arriscat. Es recomana obrir-los només si el servidor és monitorat constantment i per respondre immediatament davant qualsevol problema.",
	"emailRequiredForSignup": "Demanar correu electrònic per registrar-se ",
	"recommended": "Recomanat",
	"userGeneratedContentsVisibilityForVisitor": "L'abast de la publicació del contingut generat per l'usuari",
	"userGeneratedContentsVisibilityForVisitor_description": "Això ajuda a evitar problemes com que continguts remots inadequats que no hagin estat moderats correctament es publiquin a internet mitjançant el teu servidor.",
	"userGeneratedContentsVisibilityForVisitor_description2": "La publicació incondicional de tots els continguts del servidor a internet, incloent-hi els continguts remots rebuts pel servidor, comporta riscos. Això és extremadament important per els espectadors que desconeixen el caràcter descentralitzat dels continguts, ja que poden percebre erroneament els continguts remots com contingut generat per el propi servidor.",
	"preservedUsernames": "Noms d'usuaris reservats",
	"preservedUsernamesDescription": "Llistat de noms d'usuaris que no es poden fer servir separats per salts de linia. Aquests noms d'usuaris no estaran disponibles quan es creï un compte d'usuari normal, però els administradors els poden fer servir per crear comptes manualment. Per altre banda els comptes ja creats amb aquests noms d'usuari no es veure'n afectats.",
	"save": "Desa",
	"sensitiveWords": "Paraules sensibles",
	"sensitiveWordsDescription": "La visibilitat de totes les notes que continguin qualsevol de les paraules configurades seran, automàticament, afegides a \"Inici\". Pots llistar diferents paraules separant les per línies noves.",
	"sensitiveWordsDescription2": "Fent servir espais crearà expressions AND si l'expressió s'envolta amb barres inclinades es converteix en una expressió regular.",
	"prohibitedWords": "Paraules prohibides",
	"prohibitedWordsDescription": "Quan intenteu publicar una Nota que conté una paraula prohibida, feu que es converteixi en un error. Es poden dividir i establir múltiples línies.",
	"prohibitedWordsDescription2": "Fent servir espais crearà expressions AND si l'expressió s'envolta amb barres inclinades es converteix en una expressió regular.",
	"prohibitedWordsForNameOfUser": "Noms prohibits per escollir noms d'usuari ",
	"prohibitedWordsForNameOfUserDescription": "Si qualsevol d'aquestes paraules es troben a un nom d'usuari la creació de l'usuari no es durà a terme. Als moderadors no els afecta aquesta restricció.",
	"hiddenTags": "Etiquetes ocultes",
	"hiddenTagsDescription": "La visibilitat de totes les notes que continguin qualsevol de les paraules configurades seran, automàticament, afegides a \"Inici\". Pots llistar diferents paraules separant les per línies noves.",
	"silencedInstances": "Instàncies silenciades",
	"silencedInstancesDescription": "Llista els enllaços d'amfitrió de les instàncies que vols silenciar. Tots els comptes de les instàncies llistades s'establiran com silenciades i només podran fer sol·licitacions de seguiment, i no podran mencionar als comptes locals si no els segueixen. Això no afectarà les instàncies bloquejades.",
	"mediaSilencedInstances": "Instàncies amb els arxius silenciats",
	"mediaSilencedInstancesDescription": "Llista els noms dels servidors que vulguis silenciar els arxius, un servidor per línia. Tots els comptes que pertanyin als servidors llistats seran tractats com sensibles i no podran fer servir emojis personalitzats. Això no tindrà efecte sobre els servidors blocats.",
	"blockedInstances": "Instàncies bloquejades",
	"blockedInstancesDescription": "Llista els enllaços d'amfitrió de les instàncies que vols bloquejar separades per un salt de pàgina. Les instàncies llistades no podran comunicar-se amb aquesta instància."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderování",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Vyžadovat email pro registraci",
	"recommended": "Doporučeno",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Rezervované uživatelské jména",
	"preservedUsernamesDescription": "Seznam uživatelských jmén na rezervaci oddělené mezerama. Tyhle jména se potom nebudou moc použít při normálním procesu vytvoření účtu ale můžou být použiti manuálně administratorém. Existujících účtů se to nedotkne.",
	"save": "Uložit",
	"sensitiveWords": "Citlivá slova",
	"sensitiveWordsDescription": "Viditelnost všech poznámek obsahujících některé z nakonfigurovaných slov bude automaticky nastavena na \"Domů\". Můžete jich uvést více tak, že je oddělíte pomocí řádků.",
	"sensitiveWordsDescription2": "Použití mezer vytvoří výrazy AND a obklopení klíčových slov lomítky je změní na regulární výraz.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Použití mezer vytvoří výrazy AND a obklopení klíčových slov lomítky je změní na regulární výraz.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Blokované instance",
	"blockedInstancesDescription": "Vypište názvy hostitelů instancí, které chcete blokovat odděleně řádkovými zlomky. Uvedené instance již nebudou moci s touto instancí komunikovat."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderation",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Require email address for sign-up",
	"recommended": "Recommended",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Save",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Blocked Instances",
	"blockedInstancesDescription": "List the hostnames of the instances you want to block separated by linebreaks. Listed instances will no longer be able to communicate with this instance."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"all": "Alles ist öffentlich",
	"localOnly": "Nur lokale Inhalte werden veröffentlicht, fremde Inhalte bleiben privat",
	"none": "Alles ist privat",
	"acknowledgeNotesAndEnable": "Schalten Sie dies erst ein, wenn Sie die Vorsichtsmaßnahmen verstanden haben.",
	"moderation": "Moderation",
	"openRegistration": "Registrierung von Konten aktivieren",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "Wenn über einen bestimmten Zeitraum keine Moderatorenaktivität festgestellt wird, wird diese Einstellung automatisch deaktiviert, um Spam zu verhindern.",
	"openRegistrationWarning": "Das Aktivieren von Registrierungen ist riskant. Es wird empfohlen, sie nur dann zu aktivieren, wenn der Server ständig überwacht wird und im Falle eines Problems sofort reagiert werden kann.",
	"emailRequiredForSignup": "Angabe einer Email-Adresse als benötigt markieren",
	"recommended": "Empfehlung",
	"userGeneratedContentsVisibilityForVisitor": "Sichtbarkeit von nutzergenerierten Inhalten für Gäste",
	"userGeneratedContentsVisibilityForVisitor_description": "Dies ist nützlich, um zu verhindern, dass unangemessene Inhalte, die nicht gut moderiert sind, ungewollt über deinen eigenen Server im Internet veröffentlicht werden.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Die uneingeschränkte Veröffentlichung aller Inhalte des Servers im Internet, einschließlich der vom Server empfangenen Fremdinhalte, birgt Risiken. Dies ist besonders wichtig für Betrachter, die sich des dezentralen Charakters der Inhalte nicht bewusst sind, da sie selbst fremde Inhalte fälschlicherweise als auf dem Server erstellte Inhalte wahrnehmen könnten.",
	"preservedUsernames": "Reservierte Benutzernamen",
	"preservedUsernamesDescription": "Gib zu reservierende Benutzernamen durch Zeilenumbrüche getrennt an. Diese werden für die Registrierung gesperrt, können aber von Administratoren zur manuellen Erstellung von Konten verwendet werden. Existierende Konten, die diese Namen bereits verwenden, werden nicht beeinträchtigt.",
	"save": "Speichern",
	"sensitiveWords": "Sensible Wörter",
	"sensitiveWordsDescription": "Die Notizsichtbarkeit aller Notizen, die diese Wörter enthalten, wird automatisch auf \"Startseite\" gesetzt. Durch Zeilenumbrüche können mehrere konfiguriert werden.",
	"sensitiveWordsDescription2": "Durch die Verwendung von Leerzeichen können AND-Verknüpfungen angegeben werden und durch das Umgeben von Schrägstrichen können reguläre Ausdrücke verwendet werden.",
	"prohibitedWords": "Verbotene Wörter",
	"prohibitedWordsDescription": "Aktiviert eine Fehlermeldung, wenn versucht wird, eine Notiz zu veröffentlichen, die das/die eingestellte(n) Wort(e) enthält. Mehrere Begriffe können durch Zeilenumbrüche getrennt festgelegt werden.",
	"prohibitedWordsDescription2": "Durch die Verwendung von Leerzeichen können AND-Verknüpfungen angegeben werden und durch das Umgeben von Schrägstrichen können reguläre Ausdrücke verwendet werden.",
	"prohibitedWordsForNameOfUser": "Verbotene Begriffe für Benutzernamen",
	"prohibitedWordsForNameOfUserDescription": "Wenn eine Zeichenfolge aus dieser Liste im Namen eines Benutzers enthalten ist, wird der Benutzername abgelehnt. Benutzer mit Moderatorenrechten sind von dieser Einschränkung nicht betroffen.",
	"hiddenTags": "Ausgeblendete Hashtags",
	"hiddenTagsDescription": "Die hier eingestellten Tags werden nicht mehr in den Trends angezeigt. Mit der Umschalttaste können mehrere ausgewählt werden.",
	"silencedInstances": "Stummgeschaltete Instanzen",
	"silencedInstancesDescription": "Gib die Hostnamen der Instanzen, welche stummgeschaltet werden sollen, durch Zeilenumbrüche getrennt an. Alle Konten dieser Instanzen werden als stummgeschaltet behandelt, können nur noch Follow-Anfragen stellen und wenn nicht gefolgt keine lokalen Konten erwähnen. Blockierte Instanzen sind davon nicht betroffen.",
	"mediaSilencedInstances": "Medien-stummgeschaltete Server",
	"mediaSilencedInstancesDescription": "Gib pro Zeile die Hostnamen der Server ein, dessen Medien du stummschalten möchtest. Alle Benutzerkonten der aufgeführten Server werden als sensibel behandelt und können keine benutzerdefinierten Emojis verwenden. Gesperrte Server sind davon nicht betroffen.",
	"blockedInstances": "Blockierte Instanzen",
	"blockedInstancesDescription": "Gib die Hostnamen der Instanzen, welche blockiert werden sollen, durch Zeilenumbrüche getrennt an. Blockierte Instanzen können mit dieser instanz nicht mehr kommunizieren."
}
</locale>

<locale locale="en-US" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderation",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Require email address for sign-up",
	"recommended": "Recommended",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Save",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Blocked Instances",
	"blockedInstancesDescription": "List the hostnames of the instances you want to block separated by linebreaks. Listed instances will no longer be able to communicate with this instance."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"all": "Todo es público.",
	"localOnly": "Sólo se publica el contenido local, el remoto se mantiene privado",
	"none": "Todo es privado",
	"acknowledgeNotesAndEnable": "Activar después de comprender las precauciones",
	"moderation": "Moderación",
	"openRegistration": "Registros Abiertos",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "Si no se ha detectado por un tiempo actividad de un moderador, este ajuste será automáticamente desactivado para prevenir el spam. ",
	"openRegistrationWarning": "Abrir registros conlleva riesgos. Se recomienda solo habilitarlos si tienes un sistema en el cual puedes monitorear continuamente el servidor y respondes inmediatamente en caso de que haya cualquier problema.",
	"emailRequiredForSignup": "Se requiere una dirección de correo electrónico para el registro de la cuenta",
	"recommended": "Recomendado",
	"userGeneratedContentsVisibilityForVisitor": "Visibilidad de contenido generado por un usuario a invitados",
	"userGeneratedContentsVisibilityForVisitor_description": "Esto es útil para evitar problemas causados por contenidos remotos inapropiados que no estén bien moderados y que se publiquen involuntariamente en Internet a través de su propio servidor.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Publicar incondicionalmente todo el contenido del servidor en Internet, incluido el contenido remoto recibido por el servidor, es arriesgado. Esto es especialmente importante para los invitados que desconocen la naturaleza distribuida del contenido, ya que pueden creer erróneamente que incluso el contenido remoto es contenido creado por usuarios en el servidor.",
	"preservedUsernames": "Nombre de usuario reservado",
	"preservedUsernamesDescription": "La lista de nombres de usuario para reservar tienen que separarse con saltos de línea.\nEstos estarán indisponibles durante la creación de cuentas, pero pueden ser usados para que los administradores puedan crear esas cuentas manualmente. Las cuentas existentes con esos nombres de usuario no se verán afectadas.",
	"save": "Guardar",
	"sensitiveWords": "Palabras sensibles",
	"sensitiveWordsDescription": "La visibilidad de todas las notas que contienen cualquiera de las palabras configuradas serán puestas en \"Inicio\" automáticamente. Puedes enumerás varias separándolas con saltos de línea",
	"sensitiveWordsDescription2": "Si se usan espacios se crearán expresiones AND y las palabras subsecuentes con barras inclinadas se convertirán en expresiones regulares.",
	"prohibitedWords": "Palabras explícitas",
	"prohibitedWordsDescription": "Activa un error cuando se intenta publicar una nota que contiene una o varias palabras prohibidas. Se pueden establecer varias palabras, una por línea.",
	"prohibitedWordsDescription2": "Si se usan espacios se crearán expresiones AND y las palabras subsecuentes con barras inclinadas se convertirán en expresiones regulares.",
	"prohibitedWordsForNameOfUser": "Palabras prohibidas para nombres de usuario",
	"prohibitedWordsForNameOfUserDescription": "Si alguna de las cadenas de esta lista está incluida en el nombre del usuario, el nombre será denegado. Los usuarios con privilegios de moderador no se ven afectados por esta restricción.",
	"hiddenTags": "Hashtags ocultos",
	"hiddenTagsDescription": "Selecciona las etiquetas que no se mostrarán en tendencias. Una etiqueta por línea.",
	"silencedInstances": "Instancias silenciadas",
	"silencedInstancesDescription": "La lista de los dominios de las instancias que quieres silenciar. Todas las cuentas de las instancias listadas serán tratadas como silenciadas, solo podrán hacer peticiones de seguimiento, y no podrán mencionar cuentas locales si no las siguen. Esto no afecta a las instancias bloqueadas.",
	"mediaSilencedInstances": "Servidores con multimedia silenciada",
	"mediaSilencedInstancesDescription": "La lista de los dominios de las instancias cuya multimedia quieres silenciar. Todas las cuentas que pertenezcan a estas instancias serán marcadas como sensibles, y no podrán usar sus emojis personalizados. Esto no afectará a las instancias bloqueadas",
	"blockedInstances": "Instancias bloqueadas",
	"blockedInstancesDescription": "La lista de los dominios de las instancias que quieres bloquear, separadas por una linea nueva. Las instancias bloqueadas no podrán comunicarse con esta instancia."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Modérations",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Une adresse e-mail est nécessaire pour créer un compte",
	"recommended": "Recommandé",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Noms d'utilisateur·rice réservés",
	"preservedUsernamesDescription": "Énumérez les noms d'utilisateur à réserver, séparés par des nouvelles lignes. Les noms d'utilisateur spécifiés ici ne seront plus utilisables lors de la création d'un compte, sauf la création manuelle par un administrateur. De plus, les comptes existants ne seront pas affectés.",
	"save": "Enregistrer",
	"sensitiveWords": "Mots sensibles",
	"sensitiveWordsDescription": "Définir la visibilité des notes contenant un mot défini ici au fil principal automatiquement. Vous pouvez définir plusieurs valeurs en les séparant par des sauts de ligne.",
	"sensitiveWordsDescription2": "Séparer par une espace pour créer une expression AND ; entourer de barres obliques pour créer une expression régulière.",
	"prohibitedWords": "Mots interdits",
	"prohibitedWordsDescription": "Publier une note contenant un mot défini ici produira une erreur. Vous pouvez définir plusieurs valeurs en les séparant par des sauts de ligne.",
	"prohibitedWordsDescription2": "Séparer par une espace pour créer une expression AND ; entourer de barres obliques pour créer une expression régulière.",
	"prohibitedWordsForNameOfUser": "Mots interdits pour les noms d'utilisateur·rices",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hashtags cachés",
	"hiddenTagsDescription": "Les hashtags définis ne s'afficheront pas dans les tendances. Vous pouvez définir plusieurs hashtags en faisant un saut de ligne.",
	"silencedInstances": "Instances mises en sourdine",
	"silencedInstancesDescription": "Énumérer les noms d'hôte des instances à mettre en sourdine. Tous les comptes des instances énumérées seront traités comme mis en sourdine, ne peuvent faire que des demandes de suivi et ne peuvent pas mentionner les comptes locaux s'ils ne sont pas suivis. Cela n'affectera pas les instances bloquées.",
	"mediaSilencedInstances": "Médias silencieux sur ces instances",
	"mediaSilencedInstancesDescription": "Liste des noms de serveurs où vous voulez que les médias soient silencieux, séparés par un retour à la ligne.\nTous les comptes des instances listées seront considérés comme sensibles, et ne peuvent pas utilisés d'émojis personnalisés. Ceci n'affectera pas les serveurs bloquées.",
	"blockedInstances": "Instances bloquées",
	"blockedInstancesDescription": "Listez les instances que vous désirez bloquer, une par ligne. Ces instances ne seront plus en capacité d'interagir avec votre instance."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Aktifkan setelah memahami catatan penting.",
	"moderation": "Moderasi",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Membutuhkan alamat surel untuk mendaftar",
	"recommended": "Disarankan",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Nama pengguna tercadangkan",
	"preservedUsernamesDescription": "Daftar nama pengguna yang dicadangkan dipisah dengan baris baru. Nama pengguna berikut akan tidak dapat dipakai pada pembuatan akun normal, namun dapat digunakan oleh admin untuk membuat akun baru. Akun yang sudah ada dengan menggunakan nama pengguna ini tidak akan terpengaruh.",
	"save": "Simpan",
	"sensitiveWords": "Kata sensitif",
	"sensitiveWordsDescription": "Visibilitas dari semua catatan mengandung kata yang telah diatur akan dijadikan \"Beranda\" secara otomatis. Kamu dapat mendaftarkan kata tersebut lebih dari satu dengan menuliskannya di baris baru.",
	"sensitiveWordsDescription2": "Menggunakan spasi akan membuat ekspresi AND dan kata kunci disekitarnya dengan garis miring akan mengubahnya menjadi ekspresi reguler.",
	"prohibitedWords": "Kata yang dilarang",
	"prohibitedWordsDescription": "Menyalakan kesalahan ketika mencoba untuk memposting catatan dengan set kata-kata yang termasuk. Beberapa kata dapat diatur dan dipisahkan dengan baris baru.",
	"prohibitedWordsDescription2": "Menggunakan spasi akan membuat ekspresi AND dan kata kunci disekitarnya dengan garis miring akan mengubahnya menjadi ekspresi reguler.",
	"prohibitedWordsForNameOfUser": "Kata yang dilarang untuk nama pengguna",
	"prohibitedWordsForNameOfUserDescription": "Jika nama pengguna memuat kata dalam daftar ini, perubahan nama ditolak. Moderator tidak terkena pembatasan ini. Nama pengguna (username) juga diperiksa dalam huruf kecil.",
	"hiddenTags": "Tagar tersembunyi",
	"hiddenTagsDescription": "Pilih tanda yang mana akan tidak diperlihatkan dalam daftar tren.\nTanda lebih dari satu dapat didaftarkan dengan tiap baris.",
	"silencedInstances": "Instansi yang disenyapkan",
	"silencedInstancesDescription": "Daftar nama host dari peladen yang ingin anda senyapkan, dipisah dengan baris baru. Semua akun yang terdaftar di dalam peladen yang disebut akan dianggap disenyapkan, hanya dapat membuat permintaan mengikuti, dan didak dapat menyebut akun lokal jika tidak diikuti. Ini tidak akan mempengaruhi peladen terblokir.",
	"mediaSilencedInstances": "Peladen dengan media yang disenyapkan",
	"mediaSilencedInstancesDescription": "Masukkan nama host dari peladen yang ingin medianya dibisukan, dipisah dengan baris baru. Semua akun yang terdaftar di dalam peladen yang disebut akan dianggap sebagai akun sensitif, dan tidak dapat menggunakan emoji kustom. Ini tidak akan mempengaruhi peladen terblokir.",
	"blockedInstances": "Instansi terblokir",
	"blockedInstancesDescription": "Daftar nama host dari instansi yang diperlukan untuk diblokir. Instansi yang didaftarkan tidak akan dapat berkomunikasi dengan instansi ini."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"all": "Tutto pubblico",
	"localOnly": "Pubblica solo contenuti locali, mantieni privati \u200b\u200bi contenuti remoti",
	"none": "Tutto privato",
	"acknowledgeNotesAndEnable": "Attivare dopo averne compreso il comportamento.",
	"moderation": "Moderazione",
	"openRegistration": "Registrazioni aperte",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "Per prevenire SPAM, questa impostazione verrà disattivata automaticamente, se non si rileva alcuna attività di moderazione durante un certo periodo di tempo.",
	"openRegistrationWarning": "L’apertura della registrazione comporta dei rischi. Ti consigliamo di attivarla solo se hai predisposto il monitoraggio continuo del tuo server e puoi rispondere immediatamente se si verifica un problema.",
	"emailRequiredForSignup": "L'indirizzo e-mail è obbligatorio per registrarsi",
	"recommended": "Consigliato",
	"userGeneratedContentsVisibilityForVisitor": "Visibilità dei contenuti generati dagli utenti ai non utenti",
	"userGeneratedContentsVisibilityForVisitor_description": "Questa funzionalità è utile per impedire che contenuti remoti inappropriati e difficili da moderare vengano inavvertitamente resi pubblici su Internet tramite il proprio server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Esistono dei rischi nell'esporre incondizionatamente su internet tutto il contenuto del tuo server, incluso il contenuto remoto ricevuto da altri server. In particolare, occorre prestare attenzione, perché le persone non consapevoli della federazione potrebbero erroneamente credere che il contenuto remoto sia stato invece creato all'interno del proprio server.",
	"preservedUsernames": "Nomi utente riservati",
	"preservedUsernamesDescription": "Elenca, uno per linea, i nomi utente che non possono essere registrati durante la creazione del profilo. La restrizione non si applica agli amministratori. Inoltre, i profili già registrati sono esenti.",
	"save": "Salva",
	"sensitiveWords": "Parole esplicite",
	"sensitiveWordsDescription": "Imposta automaticamente \"Home\" alla visibilità delle Note che contengono una qualsiasi parola tra queste configurate. Puoi separarle per riga.",
	"sensitiveWordsDescription2": "Gli spazi creano la relazione \"E\" tra parole (questo E quello). Racchiudere una parola nelle slash \"/\" la trasforma in Espressione Regolare.",
	"prohibitedWords": "Parole proibite",
	"prohibitedWordsDescription": "Verrà impedito di pubblicare Note che abbiano le parole indicate. Puoi impostare più parole, separatamente, su ogni riga.",
	"prohibitedWordsDescription2": "Gli spazi creano la relazione \"E\" tra parole (questo E quello). Racchiudere una parola nelle slash \"/\" la trasforma in Espressione Regolare.",
	"prohibitedWordsForNameOfUser": "Parole proibite (nome utente)",
	"prohibitedWordsForNameOfUserDescription": "Il sistema rifiuta di rinominare un utente, se il nome contiene qualsiasi parola nell'elenco. Sono esenti i profili con privilegi di moderazione.",
	"hiddenTags": "Hashtag nascosti",
	"hiddenTagsDescription": "Impedire la visualizzazione del tag impostato nei trend. Puoi impostare più valori, uno per riga.",
	"silencedInstances": "Istanze silenziate",
	"silencedInstancesDescription": "Elenca i nomi host delle istanze che vuoi silenziare. Tutti i profili nelle istanze silenziate vengono trattati come tali. Possono solo inviare richieste di follow e menzionare soltanto i profili locali che seguono. Le istanze bloccate non sono interessate.",
	"mediaSilencedInstances": "Istanze coi media silenziati",
	"mediaSilencedInstancesDescription": "Elenca i nomi host delle istanze di cui vuoi silenziare i media, uno per riga. Tutti gli allegati dei profili nelle istanze silenziate per via degli allegati espliciti, verranno impostati come tali, le emoji personalizzate non saranno disponibili. Le istanze bloccate sono escluse.",
	"blockedInstances": "Istanze bloccate",
	"blockedInstancesDescription": "Elenca le istanze che vuoi bloccare, una per riga. Esse non potranno più interagire con la tua istanza."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"all": "全て公開",
	"localOnly": "ローカルコンテンツのみ公開し、リモートコンテンツは非公開",
	"none": "全て非公開",
	"acknowledgeNotesAndEnable": "注意事項を理解した上でオンにします。",
	"moderation": "モデレーション",
	"openRegistration": "アカウントの作成をオープンにする",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "一定期間モデレーターのアクティビティが検出されなかった場合、スパム防止のためこの設定は自動でオフになります。",
	"openRegistrationWarning": "登録を開放することはリスクが伴います。サーバーを常に監視し、トラブルが発生した際にすぐに対応できる体制がある場合のみオンにすることを推奨します。",
	"emailRequiredForSignup": "アカウント登録にメールアドレスを必須にする",
	"recommended": "推奨",
	"userGeneratedContentsVisibilityForVisitor": "非利用者に対するユーザー作成コンテンツの公開範囲",
	"userGeneratedContentsVisibilityForVisitor_description": "モデレーションが行き届きにくい不適切なリモートコンテンツなどが、自サーバー経由で図らずもインターネットに公開されてしまうことによるトラブル防止などに役立ちます。",
	"userGeneratedContentsVisibilityForVisitor_description2": "サーバーで受信したリモートのコンテンツを含め、サーバー内の全てのコンテンツを無条件でインターネットに公開することはリスクが伴います。特に、分散型の特性を知らない閲覧者にとっては、リモートのコンテンツであってもサーバー内で作成されたコンテンツであると誤って認識してしまう可能性があるため、注意が必要です。",
	"preservedUsernames": "予約ユーザー名",
	"preservedUsernamesDescription": "予約するユーザー名を改行で列挙します。ここで指定されたユーザー名はアカウント作成時に使えなくなりますが、管理者によるアカウント作成時はこの制限を受けません。また、既に存在するアカウントも影響を受けません。",
	"save": "保存",
	"sensitiveWords": "センシティブワード",
	"sensitiveWordsDescription": "設定したワードが含まれるノートの公開範囲をホームにします。改行で区切って複数設定できます。",
	"sensitiveWordsDescription2": "スペースで区切るとAND指定になり、キーワードをスラッシュで囲むと正規表現になります。",
	"prohibitedWords": "禁止ワード",
	"prohibitedWordsDescription": "設定したワードが含まれるノートを投稿しようとした際、エラーとなるようにします。改行で区切って複数設定できます。",
	"prohibitedWordsDescription2": "スペースで区切るとAND指定になり、キーワードをスラッシュで囲むと正規表現になります。",
	"prohibitedWordsForNameOfUser": "禁止ワード（ユーザーの名前）",
	"prohibitedWordsForNameOfUserDescription": "このリストに含まれる文字列がユーザーの名前に含まれる場合、ユーザーの名前の変更を拒否します。モデレーター権限を持つユーザーはこの制限の影響を受けません。ユーザー名(username)に対しても全て小文字に置き換えて検査します。",
	"hiddenTags": "非表示ハッシュタグ",
	"hiddenTagsDescription": "設定したタグをトレンドに表示させないようにします。改行で区切って複数設定できます。",
	"silencedInstances": "サイレンスしたサーバー",
	"silencedInstancesDescription": "サイレンスしたいサーバーのホストを改行で区切って設定します。サイレンスされたサーバーに所属するアカウントはすべて「サイレンス」として扱われ、フォローがすべてリクエストになります。ブロックしたインスタンスには影響しません。",
	"mediaSilencedInstances": "メディアサイレンスしたサーバー",
	"mediaSilencedInstancesDescription": "メディアサイレンスしたいサーバーのホストを改行で区切って設定します。メディアサイレンスされたサーバーに所属するアカウントによるファイルはすべてセンシティブとして扱われ、カスタム絵文字が使用できないようになります。ブロックしたインスタンスには影響しません。",
	"blockedInstances": "ブロックしたサーバー",
	"blockedInstancesDescription": "ブロックしたいサーバーのホストを改行で区切って設定します。ブロックされたサーバーは、このインスタンスとやり取りできなくなります。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"all": "全て公開",
	"localOnly": "ローカルコンテンツのみ公開し、リモートコンテンツは非公開",
	"none": "全て非公開",
	"acknowledgeNotesAndEnable": "注意事項をわかった上でオンにする。",
	"moderation": "モデレーション",
	"openRegistration": "アカウントの作成をオープンにする",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "一定期間モデレーターがおらんかったら、スパムを防ぐためにこの設定は勝手に切られるで。",
	"openRegistrationWarning": "登録を解放するのはリスクあるで。サーバーをいっつも監視して、なんか起きたらすぐに対応できるんやったら、オンにしてもええと思うけどな。",
	"emailRequiredForSignup": "アカウント作るのにメールアドレスを必須にするで",
	"recommended": "推奨",
	"userGeneratedContentsVisibilityForVisitor": "非利用者に対するユーザー作成コンテンツの公開範囲",
	"userGeneratedContentsVisibilityForVisitor_description": "モデレーションが行き届きにくい不適切なリモートコンテンツとかが、うちのサーバー経由で図らずもインターネットに公開されてまうことによるトラブルを防止できたりするで。",
	"userGeneratedContentsVisibilityForVisitor_description2": "サーバーで受け取ったリモートのコンテンツを含め、サーバー内の全部のコンテンツを何でもかんでもインターネットに公開するのはリスクを伴うねん。特に、分散型の特性を知らん閲覧者にとっては、リモートのコンテンツやったとしてもサーバー内で作られたコンテンツやと誤認してまうかもしれへんから、注意が必要やな。",
	"preservedUsernames": "予約ユーザー名",
	"preservedUsernamesDescription": "予約しとくユーザー名を行ごとに挙げるで。ここで指定されたユーザー名はアカウント作るときに使えへんくなるけど、管理者は例外や。あと、もうあるアカウントも例外やな。",
	"save": "とっとく",
	"sensitiveWords": "けったいな単語",
	"sensitiveWordsDescription": "設定した単語が入っとるノートの公開範囲をホームにしたるわ。改行で区切ったら複数設定できるで。",
	"sensitiveWordsDescription2": "スペースで区切るとAND指定、キーワードをスラッシュで囲んだら正規表現や。",
	"prohibitedWords": "禁止ワード",
	"prohibitedWordsDescription": "設定した言葉が含まれるノートを投稿しようとしたら、エラーが出るようにするで。改行で区切って複数設定できるで。",
	"prohibitedWordsDescription2": "スペースで区切るとAND指定、キーワードをスラッシュで囲んだら正規表現や。",
	"prohibitedWordsForNameOfUser": "禁止ワード（ユーザー名）",
	"prohibitedWordsForNameOfUserDescription": "このリストの中にある文字列がユーザー名に入っとったら、その名前に変更できひんようになるで。モデレーター権限があるユーザーは除外や。",
	"hiddenTags": "見えてへんハッシュタグ",
	"hiddenTagsDescription": "設定したタグを最近流行りのとこに見えんようにすんで。複数設定するときは改行で区切ってな。",
	"silencedInstances": "サーバーサイレンスされてんねん",
	"silencedInstancesDescription": "サイレンスしたいサーバーのホストを改行で区切って設定すんで。サイレンスされたサーバーに所属するアカウントはすべて「サイレンス」として扱われ、フォローがすべてリクエストになり、フォロワーでないローカルアカウントにはメンションできなくなんねん。ブロックしたインスタンスには影響せーへんで。",
	"mediaSilencedInstances": "メディアサイレンスしたサーバー",
	"mediaSilencedInstancesDescription": "メディアサイレンスしたいサーバーのホストを改行で区切って設定するで。メディアサイレンスされたサーバーに所属するアカウントによるファイルはすべてセンシティブとして扱われてな、カスタム絵文字が使えへんようになるで。ブロックしたインスタンスには影響せえへんで。",
	"blockedInstances": "ブロックしたサーバー",
	"blockedInstancesDescription": "ブロックしたいサーバーのホストを改行で区切って設定してな。ブロックされてもうたサーバーとはもう金輪際やり取りできひんくなるで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderation",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Require email address for sign-up",
	"recommended": "Recommended",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Sekles",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Blocked Instances",
	"blockedInstancesDescription": "List the hostnames of the instances you want to block separated by linebreaks. Listed instances will no longer be able to communicate with this instance."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderation",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Require email address for sign-up",
	"recommended": "Recommended",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "ಉಳಿಸಿ",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Blocked Instances",
	"blockedInstancesDescription": "List the hostnames of the instances you want to block separated by linebreaks. Listed instances will no longer be able to communicate with this instance."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"all": "모두 공개",
	"localOnly": "로컬 콘텐츠만 공개하고 리모트 콘텐츠는 비공개",
	"none": "모두 비공개",
	"acknowledgeNotesAndEnable": "활성화 하기 전에 주의 사항을 확인했습니다.",
	"moderation": "조정",
	"openRegistration": "회원 가입을 활성화 하기",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "일정 기간동안 모더레이터의 활동이 감지되지 않는 경우, 스팸 방지를 위해 이 설정은 자동으로 꺼집니다.",
	"openRegistrationWarning": "회원 가입을 개방하는 것은 리스크가 따릅니다. 서버를 항상 감시할 수 있고, 문제가 발생했을 때 바로 대응할 수 있는 상태에서만 활성화 하는 것을 권장합니다.",
	"emailRequiredForSignup": "가입할 때 이메일 주소 입력을 필수로 하기",
	"recommended": "추천",
	"userGeneratedContentsVisibilityForVisitor": "비이용자에 대한 유저 작성 콘텐츠의 공개 범위",
	"userGeneratedContentsVisibilityForVisitor_description": "조정을 하기 힘든 부적절한 리모트 콘텐츠 등이 자신의 서버 경유로 의도치 않게 인터넷에 공개되는 문제의 방지 등에 도움을 줍니다.",
	"userGeneratedContentsVisibilityForVisitor_description2": "서버에서 받은 리모트 콘텐츠를 포함해 서버 내의 모든 콘텐츠를 무조건 인터넷에 공개하는 것에는 위험이 따릅니다. 특히, 분산형 특성에 대해 모르는 열람자에게는 리모트 콘텐츠여도 서버 내에서 작성된 콘텐츠라고 잘못 인식할 수 있기에 주의가 필요합니다.",
	"preservedUsernames": "예약한 유저명",
	"preservedUsernamesDescription": "예약할 유저명을 한 줄에 하나씩 입력합니다. 여기에서 지정한 유저명으로는 계정을 생성할 수 없게 됩니다. 단, 관리자 권한으로 계정을 생성할 때에는 해당되지 않으며, 이미 존재하는 계정도 영향을 받지 않습니다.",
	"save": "저장",
	"sensitiveWords": "민감한 단어",
	"sensitiveWordsDescription": "설정한 단어가 포함된 노트의 공개 범위를 '홈'으로 강제합니다. 개행으로 구분하여 여러 개를 지정할 수 있습니다.",
	"sensitiveWordsDescription2": "공백으로 구분하면 AND 지정이 되며, 키워드를 슬래시로 둘러싸면 정규 표현식이 됩니다.",
	"prohibitedWords": "금지 단어",
	"prohibitedWordsDescription": "설정된 단어가 포함되는 노트를 게시하려고 하면, 오류가 발생하도록 합니다. 줄바꿈으로 구분지어 복수 설정할 수 있습니다.",
	"prohibitedWordsDescription2": "공백으로 구분하면 AND 지정이 되며, 키워드를 슬래시로 둘러싸면 정규 표현식이 됩니다.",
	"prohibitedWordsForNameOfUser": "금지 단어 (유저명)",
	"prohibitedWordsForNameOfUserDescription": "이 목록에 포함되는 키워드가 유저명에 있는 경우, 일반 유저는 이름을 바꿀 수 없습니다. 모더레이터 권한을 가진 유저는 제한 대상에서 제외됩니다.",
	"hiddenTags": "숨긴 해시태그",
	"hiddenTagsDescription": "설정한 태그를 트렌드에 표시하지 않도록 합니다. 줄 바꿈으로 하나씩 나눠서 설정할 수 있습니다.",
	"silencedInstances": "사일런스한 서버",
	"silencedInstancesDescription": "사일런스하려는 서버의 호스트명을 한 줄에 하나씩 입력합니다. 사일런스된 서버에 소속된 유저는 모두 '사일런스'된 상태로 취급되며, 이 서버로부터의 팔로우가 프로필 설정과 무관하게 승인제로 변경되고, 팔로워가 아닌 로컬 유저에게는 멘션할 수 없게 됩니다. 정지된 서버에는 적용되지 않습니다.",
	"mediaSilencedInstances": "미디어를 사일런스한 서버",
	"mediaSilencedInstancesDescription": "미디어를 사일런스 하려는 서버의 호스트를 한 줄에 하나씩 입력합니다. 미디어가 사일런스된 서버의 유저가 업로드한 파일은 모두 민감한 미디어로 처리되며, 커스텀 이모지를 사용할 수 없게 됩니다. 또한, 차단한 인스턴스에는 적용되지 않습니다.",
	"blockedInstances": "차단된 서버",
	"blockedInstancesDescription": "차단하려는 서버의 호스트 이름을 줄바꿈으로 구분하여 설정합니다. 차단된 인스턴스는 이 인스턴스와 통신할 수 없게 됩니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderatie",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Vereist e-mailadres voor aanmelding",
	"recommended": "Recommended",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Opslaan",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Verboden woorden",
	"prohibitedWordsDescription": "Activeert een foutmelding als er geprobeerd wordt een notitie met de ingestelde woorden te plaatsen. Meerdere woorden kunnen worden ingesteld, elk op hun eigen regel.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Verborgen hashtags",
	"hiddenTagsDescription": "Selecteer tags die niet worden weergegeven in de trends. Meerdere tags kunnen worden geregistreerd, elk op hun eigen regel.",
	"silencedInstances": "Gedempte instanties",
	"silencedInstancesDescription": "Geef de hostnamen van de servers die je wil dempen op, elk op hun eigen regel. Alle accounts die bij de opgegeven servers horen worden als gedempt behandeld, kunnen alleen maar volgverzoeken maken, en kunnen lokale accounts niet vermelden als ze niet gevolgd worden. Geblokkeerde servers worden hier niet door beïnvloed.",
	"mediaSilencedInstances": "Media-gedempte servers",
	"mediaSilencedInstancesDescription": "Geef de hostnamen van de servers die je wil media-dempen op, elk op hun eigen regel. Alle accounts die bij de opgegeven servers horen worden als gedempt behandeld, en kunnen geen eigen emojis gebruiken. Geblokkeerde servers worden hier niet door beïnvloed.",
	"blockedInstances": "Geblokkeerde servers",
	"blockedInstancesDescription": "Maak een lijst van de servers die moeten worden geblokkeerd, gescheiden door regeleinden. Geblokkeerde servers kunnen niet meer communiceren met deze server."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderation",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Require email address for sign-up",
	"recommended": "Anbefalt",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Lagre",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Blokkerte severe",
	"blockedInstancesDescription": "Skriv opp vertsnavnene til serverne du vil blokkere, atskilt med linjeskift. Serverne i listen vil ikke lenger kunne kommunisere med denne serveren."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderacja",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Wymagaj adresu e-mail do rejestracji",
	"recommended": "Zalecane",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Zapisz",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Wyciszone instancje",
	"silencedInstancesDescription": "Wypisz nazwy hostów instancji, które chcesz wyciszyć. Wszystkie konta wymienionych instancji będą traktowane jako wyciszone, będą mogły jedynie wysyłać prośby o obserwację i nie będą mogły wspominać kont lokalnych, jeśli nie będą obserwowane. Nie będzie to miało wpływu na zablokowane instancje.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Zablokowane instancje",
	"blockedInstancesDescription": "Wypisz nazwy hostów instancji, które powinny zostać zablokowane. Wypisane instancje nie będą mogły dłużej komunikować się z tą instancją."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"all": "Tudo é público",
	"localOnly": "Conteúdo local é publicado, conteúdo remoto é privado",
	"none": "Tudo é privado",
	"acknowledgeNotesAndEnable": "Ative após compreender as precauções.",
	"moderation": "Moderação",
	"openRegistration": "Abrir a criação de contas",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "Se nenhuma atividade da moderação for detectada por um tempo, essa configuração será desativada para prevenir spam.",
	"openRegistrationWarning": "Abrir cadastros contém riscos. É recomendado apenas habilitá-los se houver um sistema de monitoramento contínuo e resolução imediata de problemas.",
	"emailRequiredForSignup": "Tornar o endereço de e-mail obrigatório durante o cadastro",
	"recommended": "Recomendado",
	"userGeneratedContentsVisibilityForVisitor": "Visibilidade de conteúdo dos usuários para visitantes",
	"userGeneratedContentsVisibilityForVisitor_description": "Isso é útil para prevenir problemas causados por conteúdo inapropriado de usuários remotos de servidores com pouca ou nenhuma moderação, que pode ser hospedado na internet a partir desse servidor.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Publicar todo o conteúdo do servidor para a internet pode ser arriscado. Isso é especialmente importante para visitantes que desconhecem a natureza distribuída do conteúdo na internet, pois eles podem acreditar que o conteúdo remoto é criado por usuários desse servidor.",
	"preservedUsernames": "Nomes de usuário reservados",
	"preservedUsernamesDescription": "Liste os nomes de usuário que deseja reservar, separando-os por quebras de linha. Os nomes de usuário especificados aqui não poderão ser utilizados durante a criação de contas. No entanto, esta restrição não se aplica quando a conta é criada por um administrador. Além disso, as contas que já existem não serão afetadas.",
	"save": "Salvar",
	"sensitiveWords": "Palavras sensíveis",
	"sensitiveWordsDescription": "A visibilidade de todas as notas contendo as palavras configuradas será colocadas como \"Início\" automaticamente. Você pode listar várias delas separando-as por linha.",
	"sensitiveWordsDescription2": "Utilizar espaços irá criar expressões aditivas (AND) e cercar palavras-chave com barras irá transformá-las em expressões regulares (RegEx)",
	"prohibitedWords": "Palavras proibidas",
	"prohibitedWordsDescription": "Habilita um erro ao tentar publicar uma nota contendo as palavras escolhidas. Várias palavras podem ser escolhidas, separando-as por linha.",
	"prohibitedWordsDescription2": "Utilizar espaços irá criar expressões aditivas (AND) e cercar palavras-chave com barras irá transformá-las em expressões regulares (RegEx)",
	"prohibitedWordsForNameOfUser": "Palavras proibidas para nomes de usuário",
	"prohibitedWordsForNameOfUserDescription": "Se quaisquer palavras dessa lista forem incluídas no nome de usuário, seu uso será negado. Usuários com privilégios de moderador não serão afetados pela restrição.",
	"hiddenTags": "Hashtags escondidas",
	"hiddenTagsDescription": "Selecione tags que não serão exibidas na lista de destaques. Várias tags podem ser escolhidas, separadas por linha.",
	"silencedInstances": "Instâncias silenciadas",
	"silencedInstancesDescription": "Liste o nome de hospedagem dos servidores que você deseja silenciar, separados por linha. Todas as contas desses servidores serão silenciada e poderão enviar solicitações para seguir, mas não poderão mencionar usuários locais sem segui-los. Isso não afetará servidores bloqueados.",
	"mediaSilencedInstances": "Instâncias com mídia silenciadas",
	"mediaSilencedInstancesDescription": "Liste o nome de hospedagem dos servidores cuja mídia você deseja silenciar, separados por linha. Todas as contas desses servidores serão consideradas sensíveis e não poderão utilizar emojis personalizados. Isso não afetará servidores bloqueados.",
	"blockedInstances": "Instância bloqueada",
	"blockedInstancesDescription": "Configure os hosts dos servidores que deseja bloquear, separando-os por quebras de linha. Os servidores bloqueados não poderão interagir com este servidor, incluindo os subdomínios."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Включайте только после понимания мер предосторожности",
	"moderation": "Модерация",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Для регистрации учётной записи нужен адрес электронной почты",
	"recommended": "Рекомендуем",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Зарезервированные имена пользователей",
	"preservedUsernamesDescription": "Перечислите зарезервированные имена пользователей, отделяя их строками. Они станут недоступны при создании учётной записи. Это ограничение не применяется при создании учётной записи администраторами. Также, уже существующие учётные записи останутся без изменений.",
	"save": "Сохранить",
	"sensitiveWords": "Чувствительные слова",
	"sensitiveWordsDescription": "Установите общедоступный диапазон заметки, содержащей заданное слово, на домашний. Можно сделать несколько настроек, разделив их переносами строк.",
	"sensitiveWordsDescription2": "Разделение пробелом создаёт спецификацию AND, а разделение косой чертой создаёт регулярное выражение.",
	"prohibitedWords": "Запрещённые слова",
	"prohibitedWordsDescription": "Включает вывод ошибки при попытке опубликовать заметку, содержащую указанное слово/набор слов.\nМножество слов может быть указано, разделяемые новой строкой.",
	"prohibitedWordsDescription2": "Разделение пробелом создаёт спецификацию AND, а разделение косой чертой создаёт регулярное выражение.",
	"prohibitedWordsForNameOfUser": "Запрещенные слова (имя пользователя)",
	"prohibitedWordsForNameOfUserDescription": "Если имя пользователя содержит строку из этого списка, изменение имени пользователя будет запрещено. На пользователей с правами модератора это ограничение не распространяется. Имена пользователей также проверяются путём замены всех букв в нижнем регистре",
	"hiddenTags": "Скрытые хештеги",
	"hiddenTagsDescription": "Установленные теги не будут отображаться в тренде, можно установить несколько тегов.",
	"silencedInstances": "Заглушённые инстансы",
	"silencedInstancesDescription": "Перечислите имена серверов, которые вы хотите отключить, разделив их новой строкой. Все учетные записи, принадлежащие к указанным в списке серверам, будут заблокированы и смогут отправлять запросы только на повторное использование и не смогут указывать локальные учетные записи, если они не будут отслеживаться. Это не повлияет на заблокированные серверы.",
	"mediaSilencedInstances": "Заглушённые сервера",
	"mediaSilencedInstancesDescription": "Укажите названия серверов, для которых вы хотите отключить доступ к файлам, по одному серверу в строке. Все учетные записи, принадлежащие к перечисленным серверам, будут считаться конфиденциальными и не смогут использовать пользовательские эмодзи. Это никак не повлияет на заблокированные серверы.",
	"blockedInstances": "Заблокированные инстансы",
	"blockedInstancesDescription": "Введите список инстансов, которые хотите заблокировать. Они больше не смогут обмениваться с вашим инстансом."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderovanie",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Registrácia vyžaduje emailovú adresu",
	"recommended": "Odporúčané",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Uložiť",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Blokované servery",
	"blockedInstancesDescription": "Zoznam blokovaných serverov na riadkoch. Blokované servery nebudú môcť komunikovať s týmto serverom."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"all": "ทั้งหมดสาธารณะ",
	"localOnly": "เผยแพร่เป็นสาธารณะเฉพาะเนื้อหาท้องถิ่น เนื้อหาระยะไกลให้เป็นส่วนตัว",
	"none": "ทั้งหมดส่วนตัว",
	"acknowledgeNotesAndEnable": "เปิดใช้งานหลังจากที่เข้าใจข้อควรระวังแล้ว",
	"moderation": "การกลั่นกรอง",
	"openRegistration": "เปิดให้สร้างบัญชีได้",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "หากไม่พบกิจกรรมของผู้ควบคุมในช่วงระยะเวลาหนึ่ง การตั้งค่านี้จะถูกปิดโดยอัตโนมัติเพื่อป้องกันสแปม",
	"openRegistrationWarning": "การเปิดให้ลงทะเบียนมีความเสี่ยง แนะนำให้เปิดใช้งานเฉพาะในกรณีที่สามารถตรวจสอบเซิร์ฟเวอร์อย่างสม่ำเสมอและมีระบบรับมือกับปัญหาได้ทันท่วงที",
	"emailRequiredForSignup": "จำเป็นต้องการใช้ที่อยู่อีเมลสำหรับการสมัคร",
	"recommended": "แนะนำ",
	"userGeneratedContentsVisibilityForVisitor": "ขอบเขตการเปิดเผยเนื้อหาที่ผู้ใช้สร้างต่อบุคคลที่ไม่ได้เข้าร่วม (แขก)",
	"userGeneratedContentsVisibilityForVisitor_description": "ช่วยป้องกันปัญหาที่อาจเกิดขึ้นจากเนื้อหาระยะไกลที่ไม่เหมาะสม ซึ่งอาจถูกเผยแพร่ออกสู่อินเทอร์เน็ตโดยไม่ตั้งใจผ่านเซิร์ฟเวอร์ของตนเอง โดยเฉพาะในกรณีที่การดูแลควบคุมไม่ทั่วถึง",
	"userGeneratedContentsVisibilityForVisitor_description2": "การเปิดเผยเนื้อหาทั้งหมดในเซิร์ฟเวอร์รวมทั้งเนื้อหาที่รับมาจากระยะไกลสู่สาธารณะบนอินเทอร์เน็ตโดยไม่มีข้อจำกัดใดๆ มีความเสี่ยงโดยเฉพาะอย่างยิ่งสำหรับผู้ชมที่ไม่เข้าใจลักษณะของระบบแบบกระจาย อาจทำให้เกิดความเข้าใจผิดคิดว่าเนื้อหาที่มาจากระยะไกลนั้นเป็นเนื้อหาที่สร้างขึ้นภายในเซิร์ฟเวอร์นี้ จึงควรใช้ความระมัดระวังอย่างมาก",
	"preservedUsernames": "ชื่อผู้ใช้ที่สงวนไว้",
	"preservedUsernamesDescription": "ระบุชื่อผู้ใช้ที่จะสงวนชื่อไว้ คั่นด้วยการขึ้นบรรทัดใหม่ ชื่อผู้ใช้ที่ระบุที่นี่จะไม่สามารถใช้งานได้อีกต่อไปเมื่อสร้างบัญชีใหม่ ยกเว้นเมื่อผู้ดูแลระบบสร้างบัญชี นอกจากนี้ บัญชีที่มีอยู่แล้วจะไม่ได้รับผลกระทบ",
	"save": "บันทึก",
	"sensitiveWords": "คำที่มีเนื้อหาละเอียดอ่อน",
	"sensitiveWordsDescription": "โน้ตที่มีคำที่ระบุไว้จะถูกตั้งค่าการมองเห็นของให้แสดงเฉพาะในหน้าหลักเท่านั้น คั่นคำด้วยการขึ้นบรรทัดใหม่",
	"sensitiveWordsDescription2": "ถ้าแยกด้วยเว้นวรรคจะเป็นการระบุ AND และถ้าล้อมคำด้วยสแลช (/) จะเป็นการใช้ regular expression",
	"prohibitedWords": "คำต้องห้าม",
	"prohibitedWordsDescription": "จะแจ้งเตือนว่าเกิดข้อผิดพลาดเมื่อพยายามโพสต์โน้ตที่มีคำที่กำหนดไว้ สามารถตั้งได้หลายคำด้วยการขึ้นบรรทัดใหม่",
	"prohibitedWordsDescription2": "ถ้าแยกด้วยเว้นวรรคจะเป็นการระบุ AND และถ้าล้อมคำด้วยสแลช (/) จะเป็นการใช้ regular expression",
	"prohibitedWordsForNameOfUser": "คำนี้ไม่สามารถใช้เป็นชื่อผู้ใช้ได้",
	"prohibitedWordsForNameOfUserDescription": "จะไม่อนุญาตให้เปลี่ยนชื่อผู้ใช้หากชื่อของผู้ใช้มีข้อความที่อยู่ในรายการนี้  แต่ผู้ใช้ที่มีสิทธิ์เป็นผู้ควบคุมจะไม่ได้รับผลกระทบจากข้อจำกัดนี้",
	"hiddenTags": "แฮชแท็กที่ซ่อนอยู่",
	"hiddenTagsDescription": "เลือกแท็กที่จะไม่แสดงในรายการเทรนด์ สามารถลงทะเบียนหลายแท็กได้โดยขึ้นบรรทัดใหม่",
	"silencedInstances": "ปิดปากเซิร์ฟเวอร์นี้แล้ว",
	"silencedInstancesDescription": "ระบุโฮสต์ของเซิร์ฟเวอร์ที่ต้องการปิดปาก คั่นด้วยการขึ้นบรรทัดใหม่, บัญชีทั้งหมดของเซิร์ฟเวอร์ดังกล่าวจะถือว่าถูกปิดปากเช่นกัน ทำได้เฉพาะคำขอติดตามเท่านั้น และไม่สามารถกล่าวถึงบัญชีในเซิร์ฟเวอร์นี้ได้หากไม่ได้ถูกติดตามกลับ | สิ่งนี้ไม่มีผลต่ออินสแตนซ์ที่ถูกบล็อก",
	"mediaSilencedInstances": "เซิร์ฟเวอร์ที่ถูกปิดปากสื่อ",
	"mediaSilencedInstancesDescription": "ระบุโฮสต์ของเซิร์ฟเวอร์ที่ต้องการปิดปากสื่อ คั่นด้วยการขึ้นบรรทัดใหม่, ไฟล์ที่ถูกส่งจากบัญชีของเซิร์ฟเวอร์ดังกล่าวจะถือว่าถูกปิดปาก แล้วจะถูกติดเครื่องหมายว่ามีเนื้อหาละเอียดอ่อน และเอโมจิแบบกำหนดเองก็จะใช้ไม่ได้ด้วย | สิ่งนี้ไม่มีผลต่ออินสแตนซ์ที่ถูกบล็อก",
	"blockedInstances": "เซิร์ฟเวอร์ที่ถูกบล็อก",
	"blockedInstancesDescription": "ระบุโฮสต์ของเซิร์ฟเวอร์ที่ต้องการบล็อก คั่นด้วยการขึ้นบรรทัดใหม่ เซิร์ฟเวอร์ที่ถูกบล็อกจะไม่สามารถติดต่อกับอินสแตนซ์นี้ได้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"all": "Her şey halka açıktır.",
	"localOnly": "Yalnızca yerel içerik yayınlanır, uzak içerik gizli tutulur.",
	"none": "Her şey gizlidir.",
	"acknowledgeNotesAndEnable": "Önlemleri anladıktan sonra açın.",
	"moderation": "Moderasyon",
	"openRegistration": "Hesap oluşturmayı açık hale getir",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "Bir süre boyunca moderatör etkinliği algılanmazsa, spam'ı önlemek için bu ayar otomatik olarak kapatılır.",
	"openRegistrationWarning": "Kayıt açma işlemi riskler içerir. Sunucuyu sürekli olarak izleyen ve herhangi bir sorun durumunda hemen müdahale edebilen bir sistemin varsa, bu işlemi etkinleştirmen önerilir.",
	"emailRequiredForSignup": "Kayıt için E-posta adresi gereklidir.",
	"recommended": "Önerilen",
	"userGeneratedContentsVisibilityForVisitor": "Kullanıcılar tarafından oluşturulan içeriğin misafirlere görünürlüğü",
	"userGeneratedContentsVisibilityForVisitor_description": "Bu, uygunsuz ve iyi denetlenmemiş uzaktaki içeriğin kendi sunucunuz aracılığıyla istemeden internette yayınlanmasını önlemek için yararlıdır.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Sunucu tarafından alınan uzak içerik dahil olmak üzere sunucudaki tüm içeriği koşulsuz olarak İnternet'e yayınlamak risklidir. Bu, içeriğin dağıtılmış yapısından haberdar olmayan misafirler için özellikle önemlidir, çünkü onlar yanlışlıkla uzak içeriğin bile sunucudaki kullanıcılar tarafından oluşturulan içerik olduğunu düşünebilirler.",
	"preservedUsernames": "Rezerve edilmiş kullanıcı adları",
	"preservedUsernamesDescription": "Rezervasyon yapmak için kullanıcı adlarını satır sonlarıyla ayırarak listele. Bu kullanıcı adları normal hesap oluşturma sırasında kullanılamaz hale gelir, ancak yöneticiler tarafından manuel olarak hesap oluşturmak için kullanılabilir. Bu kullanıcı adlarını kullanan mevcut hesaplar etkilenmez.",
	"save": "Kaydet",
	"sensitiveWords": "Hassas kelimeler",
	"sensitiveWordsDescription": "Yapılandırılan kelimelerden herhangi birini içeren tüm notların görünürlüğü otomatik olarak “Ana Sayfa” olarak ayarlanacaktır. Satır sonları ile ayırarak birden fazla not listeleyebilirsin.",
	"sensitiveWordsDescription2": "Boşluk kullanmak AND ifadeleri oluşturur ve anahtar kelimeleri eğik çizgi ile çevrelemek bunları düzenli ifadeye dönüştürür.",
	"prohibitedWords": "Yasaklanmış kelimeler",
	"prohibitedWordsDescription": "Belirlenen kelime(ler)i içeren bir not göndermeye çalışıldığında hata verir. Birden fazla kelime, yeni satırla ayrılmış olarak ayarlanabilir.",
	"prohibitedWordsDescription2": "Boşluk kullanmak AND ifadeleri oluşturur ve anahtar kelimeleri eğik çizgi ile çevrelemek bunları düzenli ifadeye dönüştürür.",
	"prohibitedWordsForNameOfUser": "Kullanıcı adları için yasaklanmış kelimeler",
	"prohibitedWordsForNameOfUserDescription": "Bu listedeki dizilerden herhangi biri kullanıcının adında yer alıyorsa, ad reddedilecektir. Moderatör ayrıcalıklarına sahip kullanıcılar bu kısıtlamadan etkilenmez.",
	"hiddenTags": "Gizli hashtag'ler",
	"hiddenTagsDescription": "Trend listesinde gösterilmeyecek etiketleri seçin.\nSatırlarla birden fazla etiket kaydedilebilir.",
	"silencedInstances": "Susturulmuş sunucular",
	"silencedInstancesDescription": "Sessize almak istediğin sunucuların ana bilgisayar adlarını yeni bir satırla ayırarak listele. Listelenen sunuculara ait tüm hesaplar sessize alınmış olarak kabul edilecek ve yalnızca takip isteklerinde bulunabilecek, takip edilmedikleri takdirde yerel hesapları etiketleyemeyeceklerdir. Bu, engellenen sunucuları etkilemeyecek.",
	"mediaSilencedInstances": "Medya susturulmuş sunucular",
	"mediaSilencedInstancesDescription": "Medya sessize almak istediğin sunucuların ana bilgisayar adlarını yeni bir satırla ayırarak liste. Listelenen sunuculara ait tüm hesaplar hassas hesap olarak değerlendirilecek ve özel emojiler kullanılamayacaktır. Bu durum, engellenen sunucuları etkilemeyecek.",
	"blockedInstances": "Engellenen Sunucu",
	"blockedInstancesDescription": "Engellemek istediğin sunucuların ana bilgisayar adlarını satır sonlarıyla ayırarak liste. Listelenen örnekler artık bu örnekle iletişim kuramayacaktır."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Moderation",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Require email address for sign-up",
	"recommended": "Recommended",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Save",
	"sensitiveWords": "Sensitive words",
	"sensitiveWordsDescription": "The visibility of all notes containing any of the configured words will be set to \"Home\" automatically. You can list multiple by separating them via line breaks.",
	"sensitiveWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWords": "Prohibited words",
	"prohibitedWordsDescription": "Enables an error when attempting to post a note containing the set word(s). Multiple words can be set, separated by a new line.",
	"prohibitedWordsDescription2": "Using spaces will create AND expressions and surrounding keywords with slashes will turn them into a regular expression.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hidden hashtags",
	"hiddenTagsDescription": "Select tags which will not shown on trend list.\nMultiple tags could be registered by lines.",
	"silencedInstances": "Silenced instances",
	"silencedInstancesDescription": "List the host names of the servers that you want to silence, separated by a new line. All accounts belonging to the listed servers will be treated as silenced, and can only make follow requests, and cannot mention local accounts if not followed. This will not affect the blocked servers.",
	"mediaSilencedInstances": "Media-silenced servers",
	"mediaSilencedInstancesDescription": "List the host names of the servers that you want to media-silence, separated by a new line. All accounts belonging to the listed servers will be treated as sensitive, and can't use custom emojis. This will not affect the blocked servers.",
	"blockedInstances": "Blocked Instances",
	"blockedInstancesDescription": "List the hostnames of the instances you want to block separated by linebreaks. Listed instances will no longer be able to communicate with this instance."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Ввімкніть після зрозуміння попереджень.",
	"moderation": "Модерація",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Вимагати email адресу для реєстрації",
	"recommended": "Рекомендоване",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Зарезервовані імена користувачів",
	"preservedUsernamesDescription": "Укажіть імена користувачів, які потрібно зарезервувати, розділяючи їх переносами рядка. Вони стануть недоступними під час звичайного створення облікового запису, але адміністратори зможуть використовувати їх для ручного створення облікових записів. Уже наявні облікові записи з такими іменами користувачів не будуть зачеплені.",
	"save": "Зберегти",
	"sensitiveWords": "Чутливі слова",
	"sensitiveWordsDescription": "Видимість усіх нотаток, що містять будь-яке з налаштованих слів, автоматично буде встановлено на «Домашня». Можна вказати кілька слів, розділяючи їх переносами рядка.",
	"sensitiveWordsDescription2": "Використання пробілів створює AND-вирази, а ключові слова, взяті в скісні риски, перетворюються на регулярний вираз.",
	"prohibitedWords": "Заборонені слова",
	"prohibitedWordsDescription": "Вмикає помилку під час спроби опублікувати нотатку, що містить налаштоване слово або слова. Можна вказати кілька слів, розділяючи їх новим рядком.",
	"prohibitedWordsDescription2": "Використання пробілів створює AND-вирази, а ключові слова, взяті в скісні риски, перетворюються на регулярний вираз.",
	"prohibitedWordsForNameOfUser": "Заборонені слова (імʼя користувача)",
	"prohibitedWordsForNameOfUserDescription": "Якщо ім'я користувача має рядок з цього переліку, зміна імені користувача буде заборонено. На користувачів з правами модератору ця заборона не розповсюджується.",
	"hiddenTags": "Приховані хештеги",
	"hiddenTagsDescription": "Виберіть теги, які не зображатимуться у списку трендів. Можна зареєструвати кілька тегів, розділяючи їх рядками.",
	"silencedInstances": "Обмежені інстанси",
	"silencedInstancesDescription": "Вкажіть імена хостів серверів, які потрібно обмежити, кожен з нового рядка. Усі облікові записи з указаних серверів вважатимуться обмеженими: вони зможуть лише надсилати запити на підписку та не зможуть згадувати локальні облікові записи, якщо ті на них не підписані. Це не вплине на заблоковані сервери.",
	"mediaSilencedInstances": "Сервери з обмеженими медіа",
	"mediaSilencedInstancesDescription": "Вкажіть імена хостів серверів, для яких потрібно обмежити медіа, кожен з нового рядка. Усі облікові записи з указаних серверів вважатимуться чутливими, і вони не зможуть використовувати користувацькі емодзі. Це не вплине на заблоковані сервери.",
	"blockedInstances": "Заблоковані інстанси",
	"blockedInstancesDescription": "Вкажіть інстанси, які потрібно заблокувати. Перелічені інстанси більше не зможуть спілкуватися з цим інстансом."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"all": "Everything is public",
	"localOnly": "Only local content is published, remote content is kept private",
	"none": "Everything is private",
	"acknowledgeNotesAndEnable": "Turn on after understanding the precautions.",
	"moderation": "Kiểm duyệt",
	"openRegistration": "Make the account creation open",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "If no moderator activity is detected for a while, this setting will be automatically turned off to prevent spam.",
	"openRegistrationWarning": "Opening registration carries risks. It is recommended to only enable it if you have a system in place to continuously monitor the server and respond immediately in case of any issues.",
	"emailRequiredForSignup": "Yêu cầu địa chỉ email khi đăng ký",
	"recommended": "Được đề xuất",
	"userGeneratedContentsVisibilityForVisitor": "Visibility of user-generated content to guests",
	"userGeneratedContentsVisibilityForVisitor_description": "This is useful for preventing problems caused by inappropriate remote content that is not well moderated from being unintentionally published on the Internet via your own server.",
	"userGeneratedContentsVisibilityForVisitor_description2": "Unconditionally publishing all content on the server to the Internet, including remote content received by the server is risky. This is especially important for guests who are unaware of the distributed nature of the content, as they may mistakenly believe that even remote content is content created by users on the server.",
	"preservedUsernames": "Reserved usernames",
	"preservedUsernamesDescription": "List usernames to reserve separated by linebreaks. These will become unable during normal account creation, but can be used by administrators to manually create accounts. Already existing accounts using these usernames will not be affected.",
	"save": "Lưu",
	"sensitiveWords": "Các từ nhạy cảm",
	"sensitiveWordsDescription": "Phạm vi của tất cả bài đăng chứa các từ được cấu hình sẽ tự động được đặt về \"Home\". Ban có thể thêm nhiều từ trên mỗi dòng.",
	"sensitiveWordsDescription2": "Sử dụng dấu cách sẽ tạo cấu trúc AND và thêm dấu gạch xuôi để sử dụng như một regex.",
	"prohibitedWords": "Các từ bị cấm",
	"prohibitedWordsDescription": "Hiển thị lỗi khi đăng một bài đăng chứa các từ sau. Nhiều từ có thể được thêm bằng cách viết một từ trên mỗi dòng.",
	"prohibitedWordsDescription2": "Sử dụng dấu cách sẽ tạo cấu trúc AND và thêm dấu gạch xuôi để sử dụng như một regex.",
	"prohibitedWordsForNameOfUser": "Prohibited words for usernames",
	"prohibitedWordsForNameOfUserDescription": "If any of the strings in this list are included in the user's name, the name will be denied. Users with moderator privileges are not affected by this restriction.",
	"hiddenTags": "Hashtag ẩn",
	"hiddenTagsDescription": "Các hashtag này sẽ không được hiển thị trên danh sách Trending. Nhiều tag có thể được thêm bằng cách viết một tag trên mỗi dòng.",
	"silencedInstances": "Máy chủ im lặng",
	"silencedInstancesDescription": "Đặt máy chủ mà bạn muốn tắt tiếng, phân tách bằng dấu xuống dòng. Tất cả tài khoản trên máy chủ bị tắt tiếng sẽ được coi là \"bị tắt tiếng\" và mọi hành động theo dõi sẽ được coi là yêu cầu. Không có tác dụng với những trường hợp bị chặn.",
	"mediaSilencedInstances": "Các máy chủ đã tắt nội dung đa phương tiện ",
	"mediaSilencedInstancesDescription": "Đặt máy chủ mà bạn muốn tắt nội dung đa phương tiện, phân tách bằng dấu xuống dòng. Tất cả tài khoản trên máy chủ bị tắt tiếng sẽ được coi là \"nhạy cảm\" và biểu tượng cảm xúc tùy chỉnh sẽ không thể được sử dụng. Không có tác dụng với những trường hợp bị chặn.",
	"blockedInstances": "Máy chủ đã chặn",
	"blockedInstancesDescription": "Danh sách những máy chủ bạn muốn chặn. Chúng sẽ không thể giao tiếp với máy chủy này nữa."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"all": "全部公开",
	"localOnly": "仅公开本地内容，隐藏远程内容",
	"none": "全部隐藏",
	"acknowledgeNotesAndEnable": "理解注意事项后再开启。",
	"moderation": "管理",
	"openRegistration": "开放注册",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "若在一段时间内没有检测到管理活动，为防止垃圾信息，此设定将自动关闭。",
	"openRegistrationWarning": "开放注册有风险。建议仅当能够持续监控服务器，并在出现问题时能够立即响应时才打开它。",
	"emailRequiredForSignup": "注册账户需要电子邮件地址",
	"recommended": "推荐",
	"userGeneratedContentsVisibilityForVisitor": "用户生成内容对非用户的可见性",
	"userGeneratedContentsVisibilityForVisitor_description": "对于防止诸如难以管理的不适当的远程内容通过自己的服务器意外地在互联网上公开等问题很有用。",
	"userGeneratedContentsVisibilityForVisitor_description2": "包含服务器接收到的远程内容在内，无条件将服务器上的所有内容公开在互联网上存在风险。特别是对去中心化的特性不是很了解的访问者有可能将远程服务器上的内容误认为是在此服务器内生成的，需要特别留意。",
	"preservedUsernames": "保留的用户名",
	"preservedUsernamesDescription": "列出需要保留的用户名，使用换行来作为分割。被指定的用户名在建立账户时无法使用，但由管理员所创建的账户不受该限制。此外，现有的账户也不会受到影响。",
	"save": "保存",
	"sensitiveWords": "敏感词",
	"sensitiveWordsDescription": "包含这些词的帖子将只在首页可见。可用换行来设定多个词。",
	"sensitiveWordsDescription2": "AND 条件用空格分隔，正则表达式用斜线包裹。",
	"prohibitedWords": "禁用词",
	"prohibitedWordsDescription": "发布包含设定词汇的帖子时将出错。可用换行设定多个关键字。",
	"prohibitedWordsDescription2": "AND 条件用空格分隔，正则表达式用斜线包裹。",
	"prohibitedWordsForNameOfUser": "用户名中禁止的词",
	"prohibitedWordsForNameOfUserDescription": "更改用户名时，如果用户名中包含此列表里的词汇，用户的改名请求将被拒绝。持有管理员权限的用户不受此限制。",
	"hiddenTags": "隐藏标签",
	"hiddenTagsDescription": "设定的标签将不会在时间线上显示。可使用换行来设置多个标签。",
	"silencedInstances": "被静音的服务器",
	"silencedInstancesDescription": "设置要静音的服务器，以换行分隔。被静音的服务器内所有的账户都被视为「静音」状态，且关注操作均需要被批准。已被屏蔽的实例不受影响。",
	"mediaSilencedInstances": "已隐藏媒体文件的服务器",
	"mediaSilencedInstancesDescription": "设置要隐藏媒体文件的服务器，以换行分隔。被设置的服务器内所有账号的文件均按照 “敏感内容” 处理，且将无法使用自定义表情符号。已被屏蔽的实例不受影响。",
	"blockedInstances": "被屏蔽的服务器",
	"blockedInstancesDescription": "设定要屏蔽的服务器，以换行分隔。被屏蔽的服务器将无法与本服务器进行交换通讯。子域名也同样会被屏蔽。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"all": "全部公開\n",
	"localOnly": "僅公開本地內容，遠端內容則不公開\n",
	"none": "全部不公開",
	"acknowledgeNotesAndEnable": "了解注意事項後再開啟。",
	"moderation": "審查",
	"openRegistration": "允許建立帳戶",
	"thisSettingWillAutomaticallyOffWhenModeratorsInactive": "如果在一段期間內沒有偵測到任何審查員活動，此設定將自動關閉，以防止垃圾內容。",
	"openRegistrationWarning": "開放註冊伴隨著風險。 建議只有在伺服器受到持續監控，並準備好在出現問題時能立即處理的情況下才開放註冊。",
	"emailRequiredForSignup": "註冊帳戶需要電子郵件地址",
	"recommended": "推薦",
	"userGeneratedContentsVisibilityForVisitor": "使用者建立的內容對訪客的公開範圍",
	"userGeneratedContentsVisibilityForVisitor_description": "這有助於防止一些問題的發生，例如未經適當審核的不適當遠端內容無意中透過您自己的伺服器發佈到網際網路上。",
	"userGeneratedContentsVisibilityForVisitor_description2": "包括伺服器接收到的遠端內容在內，無條件地將伺服器內所有內容公開到網際網路上是具有風險的。特別是對於不了解分散式架構特性的瀏覽者來說，他們可能會誤以為這些遠端內容是由該伺服器所創建的，因此需要特別留意。",
	"preservedUsernames": "保留的使用者名稱",
	"preservedUsernamesDescription": "換行列舉要保留的使用者名稱。此處出現的名稱將在註冊時禁用，但由管理者建立帳戶則不受此限。此外，既有的帳戶也不受影響。",
	"save": "儲存",
	"sensitiveWords": "敏感詞",
	"sensitiveWordsDescription": "將含有設定詞彙的貼文可見性設為發送至首頁。可以用換行來進行複數的設定。",
	"sensitiveWordsDescription2": "空格代表「以及」（AND），斜線包圍關鍵字代表使用正規表達式。",
	"prohibitedWords": "禁語",
	"prohibitedWordsDescription": "當要發布包含禁語的貼文時，會出現錯誤。可以用換行分隔來設定多個禁語。",
	"prohibitedWordsDescription2": "空格代表「以及」（AND），斜線包圍關鍵字代表使用正規表達式。",
	"prohibitedWordsForNameOfUser": "禁止使用的字詞（使用者名稱）",
	"prohibitedWordsForNameOfUserDescription": "如果使用者名稱包含此清單中的任何字串，則拒絕重新命名使用者。 具有審查員權限的使用者不受此限制的影響。",
	"hiddenTags": "隱藏標籤",
	"hiddenTagsDescription": "設定的標籤不會在趨勢中顯示，換行可以設定多個標籤。",
	"silencedInstances": "被禁言的伺服器",
	"silencedInstancesDescription": "設定要禁言的伺服器主機名稱，以換行分隔。隸屬於禁言伺服器的所有帳戶都將被視為「禁言帳戶」，只能發出「追隨請求」，而且無法提及未追隨的本地帳戶。這不會影響已封鎖的實例。",
	"mediaSilencedInstances": "媒體被禁言的伺服器",
	"mediaSilencedInstancesDescription": "設定您想要對媒體設定禁言的伺服器，以換行符號區隔。來自被媒體禁言的伺服器所屬帳戶的所有檔案都會被視為敏感檔案，且自訂表情符號不能使用。被封鎖的伺服器不受影響。",
	"blockedInstances": "已封鎖的伺服器",
	"blockedInstancesDescription": "請逐行輸入需要封鎖的伺服器。已封鎖的伺服器將無法與本伺服器進行通訊。"
}
</locale>
