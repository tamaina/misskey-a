<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<MkInfo>{{ $locale.sfc.announcementShouldNotBeUsedToPresentPermanentInfo }}</MkInfo>
			<MkInfo v-if="announcementsStatus === 'active' && announcements.length > 5" warn>{{ $locale.sfc.announcementTooManyActiveAnnouncementDescription }}</MkInfo>

			<MkSelect v-model="announcementsStatus" :items="announcementsStatusDef">
				<template #label>{{ $locale.sfc.filter }}</template>
			</MkSelect>

			<MkLoading v-if="loading"/>

			<template v-else>
				<MkFolder v-for="announcement in announcements" :key="announcement.id ?? announcement._id" :defaultOpen="announcement.id == null">
					<template #label>{{ announcement.title }}</template>
					<template #icon>
						<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
						<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i>
						<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--MI_THEME-error);"></i>
						<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--MI_THEME-success);"></i>
					</template>
					<template #caption>{{ announcement.text }}</template>
					<template #footer>
						<div class="_buttons">
							<MkButton rounded primary @click="save(announcement)"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.save }}</MkButton>
							<MkButton v-if="announcement.id != null && announcement.isActive" rounded @click="archive(announcement)"><i class="ti ti-check"></i> {{ $locale.sfc.announcementEnd }} ({{ $locale.sfc.archive }})</MkButton>
							<MkButton v-if="announcement.id != null && !announcement.isActive" rounded @click="unarchive(announcement)"><i class="ti ti-restore"></i> {{ $locale.sfc.unarchive }}</MkButton>
							<MkButton v-if="announcement.id != null" rounded danger @click="del(announcement)"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
						</div>
					</template>

					<div class="_gaps">
						<MkInput v-model="announcement.title">
							<template #label>{{ $locale.sfc.title }}</template>
						</MkInput>
						<MkTextarea v-model="announcement.text" mfmAutocomplete :mfmPreview="true">
							<template #label>{{ $locale.sfc.text }}</template>
						</MkTextarea>
						<MkInput v-model="announcement.imageUrl" type="url">
							<template #label>{{ $locale.sfc.imageUrl }}</template>
						</MkInput>
						<MkRadios
							v-model="announcement.icon"
							:options="[
								{ value: 'info', icon: 'ti ti-info-circle' },
								{ value: 'warning', icon: 'ti ti-alert-triangle', iconStyle: 'color: var(--MI_THEME-warn);' },
								{ value: 'error', icon: 'ti ti-circle-x', iconStyle: 'color: var(--MI_THEME-error);' },
								{ value: 'success', icon: 'ti ti-check', iconStyle: 'color: var(--MI_THEME-success);' },
							]"
						>
							<template #label>{{ $locale.sfc.icon }}</template>
						</MkRadios>
						<MkRadios
							v-model="announcement.display"
							:options="[
								{ value: 'normal', label: $locale.sfc.normal },
								{ value: 'banner', label: $locale.sfc.banner },
								{ value: 'dialog', label: $locale.sfc.dialog },
							]"
						>
							<template #label>{{ $locale.sfc.display }}</template>
						</MkRadios>
						<MkInfo v-if="announcement.display === 'dialog'" warn>{{ $locale.sfc.announcementDialogAnnouncementUxWarn }}</MkInfo>
						<MkSwitch v-model="announcement.forExistingUsers" :helpText="$locale.sfc.announcementForExistingUsersDescription">
							{{ $locale.sfc.announcementForExistingUsers }}
						</MkSwitch>
						<MkSwitch v-model="announcement.silence" :helpText="$locale.sfc.announcementSilenceDescription">
							{{ $locale.sfc.announcementSilence }}
						</MkSwitch>
						<MkSwitch v-model="announcement.needConfirmationToRead" :helpText="$locale.sfc.announcementNeedConfirmationToReadDescription">
							{{ $locale.sfc.announcementNeedConfirmationToRead }}
						</MkSwitch>
						<p v-if="announcement.reads">{{ interpolateLocaleParameters($locale.sfc.nUsersRead, { n: announcement.reads }) }}</p>
					</div>
				</MkFolder>
				<MkLoading v-if="loadingMore"/>
				<MkButton @click="more()">
					<i class="ti ti-reload"></i>{{ $locale.sfc.more }}
				</MkButton>
			</template>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

const {
	model: announcementsStatus,
	def: announcementsStatusDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.active, value: 'active' },
		{ label: $locale.value.sfc.archived, value: 'archived' },
	],
	initialValue: 'active',
});

const loading = ref(true);
const loadingMore = ref(false);

const announcements = ref<(Omit<Misskey.entities.AdminAnnouncementsListResponse[number], 'id' | 'createdAt' | 'updatedAt' | 'reads' | 'isActive'> & {
	id: string | null;
	_id?: string;
	isActive?: Misskey.entities.AdminAnnouncementsListResponse[number]['isActive'];
	reads?: Misskey.entities.AdminAnnouncementsListResponse[number]['reads'];
})[]>([]);

watch(announcementsStatus, (to) => {
	loading.value = true;
	misskeyApi('admin/announcements/list', {
		status: to,
	}).then(announcementResponse => {
		announcements.value = announcementResponse;
		loading.value = false;
	});
}, { immediate: true });

function add() {
	announcements.value.unshift({
		_id: genId(),
		id: null,
		title: 'New announcement',
		text: '',
		imageUrl: null,
		icon: 'info',
		display: 'normal',
		forExistingUsers: false,
		silence: false,
		needConfirmationToRead: false,
		userId: null,
	});
}

async function del(announcement: (typeof announcements)['value'][number]) {
	if (announcement.id == null) return;
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.deleteAreYouSure, { x: announcement.title }),
	});
	if (canceled) return;
	announcements.value = announcements.value.filter(x => x !== announcement);
	misskeyApi('admin/announcements/delete', {
		id: announcement.id,
	});
}

async function archive(announcement: (typeof announcements)['value'][number]) {
	if (announcement.id == null) return;
	const { _id, ...data } = announcement; // _idを消す
	await os.apiWithDialog('admin/announcements/update', {
		...data,
		id: announcement.id, // TSを黙らすため
		isActive: false,
	});
	refresh();
}

async function unarchive(announcement: (typeof announcements)['value'][number]) {
	if (announcement.id == null) return;
	const { _id, ...data } = announcement; // _idを消す
	await os.apiWithDialog('admin/announcements/update', {
		...data,
		id: announcement.id, // TSを黙らすため
		isActive: true,
	});
	refresh();
}

async function save(announcement: (typeof announcements)['value'][number]) {
	const { _id, ...data } = announcement; // _idを消す
	if (announcement.id == null) {
		await os.apiWithDialog('admin/announcements/create', data);
		refresh();
	} else {
		os.apiWithDialog('admin/announcements/update', {
			...data,
			id: announcement.id, // TSを黙らすため
		});
	}
}

function more() {
	loadingMore.value = true;
	misskeyApi('admin/announcements/list', {
		status: announcementsStatus.value,
		untilId: announcements.value.reduce((acc, announcement) => announcement.id != null ? announcement : acc).id!,
	}).then(announcementResponse => {
		announcements.value = announcements.value.concat(announcementResponse);
		loadingMore.value = false;
	});
}

function refresh() {
	loading.value = true;
	misskeyApi('admin/announcements/list', {
		status: announcementsStatus.value,
	}).then(announcementResponse => {
		announcements.value = announcementResponse;
		loading.value = false;
	});
}

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: $locale.value.sfc.add,
	handler: add,
	disabled: announcementsStatus.value === 'archived',
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.announcements,
	icon: 'ti ti-speakerphone',
}));
</script>

<locale lang="json" locale="ar-SA">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "رشّح",
	"save": "حفظ",
	"announcementEnd": "Archive announcement",
	"archive": "الأرشيف",
	"unarchive": "Unarchive",
	"delete": "حذف",
	"title": "العنوان",
	"text": "النص",
	"imageUrl": "رابط الصورة",
	"icon": "الصورة الرمزية",
	"normal": "عادي",
	"banner": "الصورة الرأسية",
	"dialog": "Dialog",
	"display": "المظهر",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "قرأه {n}",
	"more": "المزيد!",
	"active": "نشط",
	"archived": "Archived",
	"deleteAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"add": "إضافة",
	"announcements": "الإعلانات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "Ja que l'ús de notificacions pot impactar l'experiència dels nous usuaris, és recomanable fer servir les notificacions amb el flux d'informació en comptes de fer-les servir en un únic bloc.",
	"announcementTooManyActiveAnnouncementDescription": "Tenir masses notificacions actives pot empitjorar l'experiència de l'usuari. Considera finalitzar els avisos que siguin antics.",
	"filter": "Filtrar",
	"save": "Desa",
	"announcementEnd": "Final de la notificació ",
	"archive": "Arxiu",
	"unarchive": "Desarxivar",
	"delete": "Elimina",
	"title": "Títol",
	"text": "Text",
	"imageUrl": "URL de la imatge",
	"icon": "Icona",
	"normal": "Normal",
	"banner": "Bàner",
	"dialog": "Diàleg ",
	"display": "Veure",
	"announcementDialogAnnouncementUxWarn": "Tenir dues o més notificacions amb l'estil de finestres pot impactar l'experiència de l'usuari, és per això que és recomana fer-lo servir amb cura.",
	"announcementForExistingUsersDescription": "Aquest avís només es mostrarà als usuaris existents fins al moment de la publicació. Si no també es mostrarà als usuaris que es registrin després de la publicació.",
	"announcementForExistingUsers": "Anunci per usuaris registrats",
	"announcementSilenceDescription": "Activant aquesta opció la notificació no es mostrarà ni l'usuari l'haurà de llegir.",
	"announcementSilence": "Sense notificacions",
	"announcementNeedConfirmationToReadDescription": "Si s'activa es mostrarà un diàleg per confirmar la lectura d'aquesta notificació. A més aquesta notificació serà exclosa de qualsevol funcionalitat com \"Marcar tot com a llegit\".",
	"announcementNeedConfirmationToRead": "Es necessita confirmació de lectura de la notificació ",
	"nUsersRead": "Vist per {n}",
	"more": "Més",
	"active": "Actiu",
	"archived": "Arxivat",
	"deleteAreYouSure": "Segur que vols esborrar «{x}»?",
	"add": "Afegir",
	"announcements": "Avisos"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filtr",
	"save": "Uložit",
	"announcementEnd": "Archive announcement",
	"archive": "Archiv",
	"unarchive": "Obnovit",
	"delete": "Smazat",
	"title": "Titulek",
	"text": "Text",
	"imageUrl": "URL obrázku",
	"icon": "Avatar",
	"normal": "Normální",
	"banner": "Baner",
	"dialog": "Dialog",
	"display": "Zobrazit",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "přečteno {n} uživateli",
	"more": "Více!",
	"active": "Aktivní",
	"archived": "Archivované",
	"deleteAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"add": "Přidat",
	"announcements": "Oznámení"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filter",
	"save": "Save",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Unarchive",
	"delete": "Delete",
	"title": "Title",
	"text": "Text",
	"imageUrl": "Image URL",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "read by {n}",
	"more": "More!",
	"active": "Active",
	"archived": "Archived",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"add": "Add",
	"announcements": "Announcements"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "Es wird empfohlen, Ankündigungen für aktuelle und zeitlich begrenzte Neuigkeiten zu nutzen, statt für Informationen, die langfristig relevant sind.",
	"announcementTooManyActiveAnnouncementDescription": "Zu viele aktive Ankündigungen können die Benutzerfreundlichkeit verschlechtern. Es wird empfohlen, veraltete Ankündigungen zu archivieren.",
	"filter": "Filter",
	"save": "Speichern",
	"announcementEnd": "Ankündigung archivieren",
	"archive": "Archivieren",
	"unarchive": "Dearchivieren",
	"delete": "Löschen",
	"title": "Titel",
	"text": "Text",
	"imageUrl": "Bild-URL",
	"icon": "Symbol",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialogfeld",
	"display": "Anzeigeart",
	"announcementDialogAnnouncementUxWarn": "Bei der Verwendung von mehr als zwei Meldungen im Dialog-Format wird um Vorsicht geboten, da dies negative Auswirkungen auf die UX haben kann.",
	"announcementForExistingUsersDescription": "Ist diese Option aktiviert, wird diese Ankündigung nur Nutzern angezeigt, die zum Zeitpunkt der Ankündigung bereits registriert sind. Ist sie deaktiviert, wird sie auch Nutzern, die sich nach dessen Veröffentlichung registrieren, angezeigt.",
	"announcementForExistingUsers": "Nur für existierende Nutzer",
	"announcementSilenceDescription": "Wenn aktiviert, gibt diese Meldung keine Nachricht aus und muss nicht als \"gelesen\" markiert werden.",
	"announcementSilence": "Keine Benachrichtigung",
	"announcementNeedConfirmationToReadDescription": "Ist dies aktiviert, so wird beim Markieren dieser Ankündigung als gelesen ein separates Bestätigungsfenster angezeigt. Auch wird sie von der \"Alle als gelesen markieren\"-Funktion ausgenommen.",
	"announcementNeedConfirmationToRead": "Separate Lesebestätigung erfordern",
	"nUsersRead": "Von {n} Benutzern gelesen",
	"more": "Mehr!",
	"active": "Aktiv",
	"archived": "Archiviert",
	"deleteAreYouSure": "Möchtest du „{x}“ wirklich löschen?",
	"add": "Hinzufügen",
	"announcements": "Ankündigungen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filter",
	"save": "Save",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Unarchive",
	"delete": "Delete",
	"title": "Title",
	"text": "Text",
	"imageUrl": "Image URL",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "read by {n}",
	"more": "More!",
	"active": "Active",
	"archived": "Archived",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"add": "Add",
	"announcements": "Announcements"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "Se recomienda utilizar los avisos para publicar información que requiera inmediatez, en lugar de hacerlo constantemente, ya que esto perjudica especialmente la UX de los nuevos usuarios.",
	"announcementTooManyActiveAnnouncementDescription": "Tener demasiados anuncios activos empeora la experiencia de usuario. Por favor, considera archivar aquellos anuncios que hayan quedado obsoletos.",
	"filter": "Filtrar",
	"save": "Guardar",
	"announcementEnd": "Anuncios archivados",
	"archive": "Archivo",
	"unarchive": "Desarchivar",
	"delete": "Borrar",
	"title": "Título",
	"text": "Texto",
	"imageUrl": "URL de la imagen.",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Diálogo",
	"display": "Apariencia",
	"announcementDialogAnnouncementUxWarn": "Mostrar dos o más notificaciones en formato diálogo a la vez puede impactar en la experiencia de usuario de forma significativa, úsalos con cuidado.",
	"announcementForExistingUsersDescription": "Este anuncio solo se mostrará a aquellos usuarios registrados en el momento de su publicación. Si se deshabilita esta opción, aquellos usuarios que se registren tras su publicación también lo verán.",
	"announcementForExistingUsers": "Solo para usuarios registrados",
	"announcementSilenceDescription": "Si lo activas, no enviarás notificación sobre este anuncio y el usuario no tendrá que leerlo.",
	"announcementSilence": "Silenciar notificaciones",
	"announcementNeedConfirmationToReadDescription": "Si se habilita esta opción, se pedirá una confirmación de lectura aparte. Además, este anuncio será excluido de cualquier funcionalidad de \"Marcar todos como leídos\".",
	"announcementNeedConfirmationToRead": "Requerir confirmación de lectura aparte",
	"nUsersRead": "Leído por {n} personas",
	"more": "¡Más!",
	"active": "Activo",
	"archived": "Archivado",
	"deleteAreYouSure": "¿Desea borrar \"{x}\"?",
	"add": "Agregar",
	"announcements": "Avisos"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "Puisque cela pourrait nuire considérablement à l'expérience utilisateur pour les nouveaux utilisateurs, il est recommandé d'utiliser les annonces pour afficher des informations temporaires plutôt que des informations persistantes.",
	"announcementTooManyActiveAnnouncementDescription": "Un grand nombre d'annonces actives peut baisser l'expérience utilisateur. Considérez d'archiver les annonces obsolètes.",
	"filter": "Filtre",
	"save": "Enregistrer",
	"announcementEnd": "Archiver l'annonce",
	"archive": "Archive",
	"unarchive": "Annuler l'archivage",
	"delete": "Supprimer",
	"title": "Titre",
	"text": "Texte",
	"imageUrl": "URL de l’image",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Bannière",
	"dialog": "Dialogue",
	"display": "Affichage",
	"announcementDialogAnnouncementUxWarn": "Avoir deux ou plus annonces de style dialogue en même temps pourrait nuire considérablement à l'expérience utilisateur. Veuillez les utiliser avec caution.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Pour les utilisateurs existants seulement",
	"announcementSilenceDescription": "Si activée, vous ne recevrez pas de notifications sur les annonces et n'aurez pas besoin de les marquer comme lues.",
	"announcementSilence": "Ne pas me notifier",
	"announcementNeedConfirmationToReadDescription": "Si activé, afficher un dialogue de confirmation quand l'annonce est marquée comme lue. Aussi, elle sera exclue de « marquer tout comme lu » .",
	"announcementNeedConfirmationToRead": "Exiger la confirmation de la lecture",
	"nUsersRead": "Lu par {n} personnes",
	"more": "Plus !",
	"active": "Actif·ve",
	"archived": "Archivé",
	"deleteAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} » ?",
	"add": "Ajouter",
	"announcements": "Annonces"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "Karena dapat berdampak pada pengalaman pengguna untuk pengguna baru, sangat direkomendasikan untuk menggunakan notifikasi secara mengalir daripada tetap.",
	"announcementTooManyActiveAnnouncementDescription": "Terlalu banyak pengumuman dapat memperburuk pengalaman pengguna. Mohon pertimbangkan untuk mengarsipkan pengumuman yang sudah usang/tidak relevan.",
	"filter": "Saring",
	"save": "Simpan",
	"announcementEnd": "Arsipkan pengumuman",
	"archive": "Arsipkan",
	"unarchive": "Batalkan pengarsipan",
	"delete": "Hapus",
	"title": "Judul",
	"text": "Teks",
	"imageUrl": "URL Gambar",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Tampilkan",
	"announcementDialogAnnouncementUxWarn": "Memiliki dua atau lebih gaya dialog notifikasi secara bersamaan dapat berdampak signifikan pada pengalaman pengguna, mohon untuk menggunakannya dengan hati-hati.",
	"announcementForExistingUsersDescription": "Pengumuman ini akan dimunculkan ke pengguna yang sudah ada dari titik waktu publikasi jika dinyalakan. Apabila dimatikan, mereka yang baru mendaftar setelah publikasi ini akan juga melihatnya.",
	"announcementForExistingUsers": "Hanya pengguna yang telah ada",
	"announcementSilenceDescription": "Apabila diaktifkan, notifikasi dari pengumuman ini akan dilewatkan dan pengguna tidak perlu membacanya.",
	"announcementSilence": "Tiada notifikasi",
	"announcementNeedConfirmationToReadDescription": "Permintaan terpisah untuk mengonfirmasi menandai pengumuman ini telah dibaca akan ditampilkan apabila fitur ini dinyalakan. Pengumuman ini juga akan dikecualikan dari fungsi \"Tandai semua telah dibaca\".",
	"announcementNeedConfirmationToRead": "Membutuhkan konfirmasi terpisah bahwa telah dibaca",
	"nUsersRead": "Dibaca oleh {n}",
	"more": "Lainnya",
	"active": "Aktif",
	"archived": "Diarsipkan",
	"deleteAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"add": "Tambahkan",
	"announcements": "Pengumuman"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "Ti consigliamo di utilizzare gli annunci per pubblicare informazioni tempestive e limitate nel tempo, anziché informazioni importanti a lungo andare nel tempo, poiché potrebbero risultare difficili da ritrovare e peggiorare la fruibilità del servizio, specialmente alle nuove persone iscritte.",
	"announcementTooManyActiveAnnouncementDescription": "L'esperienza delle persone può peggiorare se ci sono troppi annunci attivi. Considera anche l'archiviazione degli annunci conclusi.",
	"filter": "Filtri",
	"save": "Salva",
	"announcementEnd": "Archivia l'annuncio",
	"archive": "Archivio",
	"unarchive": "Annulla archiviazione",
	"delete": "Elimina",
	"title": "Titolo",
	"text": "Testo",
	"imageUrl": "URL dell'immagine",
	"icon": "Ritratto",
	"normal": "Normale",
	"banner": "Intestazione",
	"dialog": "Dialogo",
	"display": "Visualizza",
	"announcementDialogAnnouncementUxWarn": "Ti consigliamo di usarli con cautela, poiché è molto probabile che avere più di un annuncio in stile \"finestra di dialogo\" peggiori sensibilmente la fruibilità del servizio, specialmente alle nuove persone iscritte.",
	"announcementForExistingUsersDescription": "L'annuncio sarà visibile solo ai profili esistenti in questo momento. Se disabilitato, sarà visibile anche ai profili che verranno creati dopo la pubblicazione di questo annuncio.",
	"announcementForExistingUsers": "Solo ai profili attuali",
	"announcementSilenceDescription": "Attivando questa opzione, non invierai la notifica, evitando che debba essere contrassegnata come già letta.",
	"announcementSilence": "Annuncio silenzioso",
	"announcementNeedConfirmationToReadDescription": "I profili riceveranno una finestra di dialogo che richiede di accettare obbligatoriamente per procedere. Tale richiesta è esente da  \"conferma tutte\".",
	"announcementNeedConfirmationToRead": "Conferma di lettura obbligatoria",
	"nUsersRead": "Letto da {n} persone",
	"more": "Di più!",
	"active": "Attivo",
	"archived": "Archiviato",
	"deleteAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"add": "Aggiungi",
	"announcements": "Annunci"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "特に新規ユーザーのUXを損ねる可能性が高いため、常時掲示するための情報ではなく、即時性が求められる情報の掲示のためにお知らせを使用することを推奨します。",
	"announcementTooManyActiveAnnouncementDescription": "アクティブなお知らせが多いため、UXが低下する可能性があります。終了したお知らせはアーカイブすることを検討してください。",
	"filter": "フィルタ",
	"save": "保存",
	"announcementEnd": "お知らせを終了",
	"archive": "アーカイブ",
	"unarchive": "アーカイブ解除",
	"delete": "削除",
	"title": "タイトル",
	"text": "テキスト",
	"imageUrl": "画像URL",
	"icon": "アイコン",
	"normal": "通常",
	"banner": "バナー",
	"dialog": "ダイアログ",
	"display": "表示",
	"announcementDialogAnnouncementUxWarn": "ダイアログ形式のお知らせが同時に2つ以上ある場合、UXに悪影響を及ぼす可能性が非常に高いため、使用は慎重に行うことを推奨します。",
	"announcementForExistingUsersDescription": "有効にすると、このお知らせ作成時点で存在するユーザーにのみお知らせが表示されます。無効にすると、このお知らせ作成後にアカウントを作成したユーザーにもお知らせが表示されます。",
	"announcementForExistingUsers": "既存ユーザーのみ",
	"announcementSilenceDescription": "オンにすると、このお知らせは通知されず、既読にする必要もなくなります。",
	"announcementSilence": "非通知",
	"announcementNeedConfirmationToReadDescription": "有効にすると、このお知らせを既読にする際に確認ダイアログが表示されます。また、一括既読操作の対象になりません。",
	"announcementNeedConfirmationToRead": "既読にするのに確認が必要",
	"nUsersRead": "{n}人が読みました",
	"more": "もっと！",
	"active": "アクティブ",
	"archived": "アーカイブ済み",
	"deleteAreYouSure": "「{x}」を削除しますか？",
	"add": "追加",
	"announcements": "お知らせ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "新規ユーザーのUXを損ねやすいから、お知らせはストック情報やのうてフロー情報の掲示に使った方がええで。",
	"announcementTooManyActiveAnnouncementDescription": "お知らせが多すぎてUXが落ちそうや。終わったお知らせはアーカイブに突っ込んだほうがええかも。",
	"filter": "フィルタ",
	"save": "とっとく",
	"announcementEnd": "お知らせやめる",
	"archive": "アーカイブ",
	"unarchive": "アーカイブ解除",
	"delete": "ほかす",
	"title": "タイトル",
	"text": "テキスト",
	"imageUrl": "画像URL",
	"icon": "アイコン",
	"normal": "ええ感じ",
	"banner": "バナー",
	"dialog": "ダイアログ",
	"display": "表示",
	"announcementDialogAnnouncementUxWarn": "ダイアログ形式のお知らせがいっぺんに2コ以上ある場合、UXに良うないことが多いから、使うんは慎重にすんのがおすすめやで。",
	"announcementForExistingUsersDescription": "オンにしたらこのお知らせができた時点でおる人らにだけお知らせが行くで。切ったらこの知らせが行ったあとにアカウント作った人にもちゃんとお知らせが行くで。",
	"announcementForExistingUsers": "もうおるユーザーのみ",
	"announcementSilenceDescription": "オンにすると、このお知らせは通知されへんし、既読にする必要もなくなるで。",
	"announcementSilence": "通知せんで",
	"announcementNeedConfirmationToReadDescription": "オンにしたら、このお知らせを既読にする時に確認するで。ついでに、一括既読しても既読扱いにならへんで。",
	"announcementNeedConfirmationToRead": "既読にするんやったら確認してや",
	"nUsersRead": "{n}人が読んでもうた",
	"more": "他のん",
	"active": "アクティブ",
	"archived": "アーカイブ済み",
	"deleteAreYouSure": "「{x}」はほかしてええか？",
	"add": "増やす",
	"announcements": "お知らせ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filter",
	"save": "Sekles",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Unarchive",
	"delete": "Kkes",
	"title": "Title",
	"text": "Text",
	"imageUrl": "Image URL",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "read by {n}",
	"more": "More!",
	"active": "Active",
	"archived": "Archived",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"add": "Add",
	"announcements": "Announcements"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filter",
	"save": "ಉಳಿಸಿ",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Unarchive",
	"delete": "ಅಳಿಸು",
	"title": "Title",
	"text": "Text",
	"imageUrl": "Image URL",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "read by {n}",
	"more": "More!",
	"active": "Active",
	"archived": "Archived",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"add": "Add",
	"announcements": "Announcements"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "신규 유저의 이용 경험에 악영향을 끼칠 수 있으므로, 일시적인 알림 수단으로만 사용하고 고정된 정보에는 사용을 지양하는 것을 추천합니다.",
	"announcementTooManyActiveAnnouncementDescription": "공지사항이 너무 많을 경우, 유저 경험에 영향을 끼칠 가능성이 있습니다. 오래된 공지사항은 아카이브하시는 것을 권장드립니다.",
	"filter": "필터",
	"save": "저장",
	"announcementEnd": "공지에서 내리기",
	"archive": "아카이브",
	"unarchive": "보관 취소",
	"delete": "삭제",
	"title": "제목",
	"text": "텍스트",
	"imageUrl": "이미지 URL",
	"icon": "아바타",
	"normal": "일반",
	"banner": "배너",
	"dialog": "다이얼로그",
	"display": "보기",
	"announcementDialogAnnouncementUxWarn": "다이얼로그 형태의 알림이 동시에 2개 이상 존재하는 경우, 유저 경험에 악영향을 끼칠 수 있으므로 신중히 결정하십시오.",
	"announcementForExistingUsersDescription": "활성화하면 이 공지사항을 게시한 시점에서 이미 가입한 유저에게만 표시합니다. 비활성화하면 게시 후에 가입한 유저에게도 표시합니다.",
	"announcementForExistingUsers": "기존 유저에게만 알림",
	"announcementSilenceDescription": "활성화하면 공지사항에 대한 알림이 가지 않게 되며, 확인 버튼을 누를 필요가 없게 됩니다.",
	"announcementSilence": "조용히 알림",
	"announcementNeedConfirmationToReadDescription": "활성화하면 이 공지사항을 읽음으로 표시하기 전에 확인 알림창을 띄웁니다. '모두 읽음'의 대상에서도 제외됩니다.",
	"announcementNeedConfirmationToRead": "읽음으로 표시하기 전에 확인하기",
	"nUsersRead": "{n}명이 읽음",
	"more": "더 보기!",
	"active": "최근에 활동함",
	"archived": "아카이브 됨",
	"deleteAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"add": "추가",
	"announcements": "공지사항"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filter",
	"save": "Opslaan",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Dearchiveren",
	"delete": "Verwijderen",
	"title": "Titel",
	"text": "Tekst",
	"imageUrl": "AfbeeldingsURL",
	"icon": "Avatar",
	"normal": "Normaal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Weergave",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "gelezen door {n}",
	"more": "Meer!",
	"active": "Actief",
	"archived": "Gearchiveerd",
	"deleteAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"add": "Toevoegen",
	"announcements": "Aankondigingen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filter",
	"save": "Lagre",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Unarchive",
	"delete": "Slett",
	"title": "Tittel",
	"text": "Tekst",
	"imageUrl": "Image URL",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "lest av {n}",
	"more": "Mer!",
	"active": "Active",
	"archived": "Archived",
	"deleteAreYouSure": "Er du sikker på at du vil slette \"{x}\"?",
	"add": "Legg til",
	"announcements": "Kunngjøringer"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filtr",
	"save": "Zapisz",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Unarchive",
	"delete": "Usuń",
	"title": "Tytuł",
	"text": "Tekst",
	"imageUrl": "Adres URL obrazka",
	"icon": "Awatar",
	"normal": "Normalny",
	"banner": "Baner",
	"dialog": "Dialog",
	"display": "Wyświetlanie",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "przeczytano przez {n}",
	"more": "Więcej!",
	"active": "Aktywny",
	"archived": "Archived",
	"deleteAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"add": "Dodaj",
	"announcements": "Ogłoszenia"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "É preferível utilizar anúncios para publicar informações atuais e de curto prazo, e não informações que serão relevantes por muito tempo.",
	"announcementTooManyActiveAnnouncementDescription": "O excesso de anúncios pode atrapalhar a experiência do usuário. Considere arquivar anúncios obsoletos.",
	"filter": "Filtrar",
	"save": "Salvar",
	"announcementEnd": "Arquivar anúncio",
	"archive": "Arquivo",
	"unarchive": "Desarquivar",
	"delete": "Excluir",
	"title": "Título",
	"text": "Texto",
	"imageUrl": "URL da imagem",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Capa",
	"dialog": "Diálogo",
	"display": "Visualizar",
	"announcementDialogAnnouncementUxWarn": "O uso de duas ou mais notificações de diálogo simultaneamente pode impactar significativamente a experiência de usuário. Portanto, utilize-as cuidadosamente.",
	"announcementForExistingUsersDescription": "Se habilitado, esse anúncio será exibido apenas para usuários existentes no tempo de publicação. Se desabilitado, novos usuários também o receberão. ",
	"announcementForExistingUsers": "Apenas aos usuários existente",
	"announcementSilenceDescription": "Habilitar isso irá pular a notificação desse anúncio e o usuário não precisará lê-lo.",
	"announcementSilence": "Sem notificação",
	"announcementNeedConfirmationToReadDescription": "Um lembrete adicional será exibido para confirmar a leitura do anúncio. Esse anúncio também será excluído de qualquer forma de \"Marcar tudo como lido\".",
	"announcementNeedConfirmationToRead": "Exigir confirmação de leitura",
	"nUsersRead": "{n} pessoas leram",
	"more": "Mais!",
	"active": "Ativo",
	"archived": "Arquivado",
	"deleteAreYouSure": "Deseja excluir \"{x}\"?",
	"add": "Adicionar",
	"announcements": "Avisos"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Большое количество оповещений может ухудшить пользовательский опыт. Рассмотрите архивирование неактуальных оповещений. ",
	"filter": "Фильтры",
	"save": "Сохранить",
	"announcementEnd": "Archive announcement",
	"archive": "Архив",
	"unarchive": "Разархивировать",
	"delete": "Удалить",
	"title": "Заголовок",
	"text": "Текст",
	"imageUrl": "Ссылка на изображение",
	"icon": "Аватар",
	"normal": "Стабильно",
	"banner": "Шапка",
	"dialog": "Диалог",
	"display": "Отображение",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "Прочитали {n}",
	"more": "Ещё!",
	"active": "Действует",
	"archived": "Архивировано",
	"deleteAreYouSure": "Хотите удалить «{x}»?",
	"add": "Добавить",
	"announcements": "Оповещения"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filter",
	"save": "Uložiť",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Unarchive",
	"delete": "Odstrániť",
	"title": "Nadpis",
	"text": "Text",
	"imageUrl": "URL obrázku",
	"icon": "Avatar",
	"normal": "Normálne",
	"banner": "BAnner",
	"dialog": "Dialog",
	"display": "Zobraziť",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "prečítané {n} používateľmi",
	"more": "Viac!",
	"active": "Aktívny",
	"archived": "Archived",
	"deleteAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"add": "Pridať",
	"announcements": "Oznamy"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "เนื่องจากมีความเป็นไปได้สูงที่จะส่งผลเสียต่อง UX ของผู้ใช้ใหม่ จึงขอแนะนำให้ใช้ประกาศสำหรับข้อมูลที่ต้องการการตอบสนองในทันที ไม่ใช่ข้อมูลที่ต้องการแสดงตลอดเวลา",
	"announcementTooManyActiveAnnouncementDescription": "เนื่องจากมีการประกาศที่ยังใช้งานอยู่จำนวนมาก อาจทำให้ UX ลดลง แนะนำให้พิจารณาการเก็บประกาศที่สิ้นสุดไปแล้ว",
	"filter": "กรอง",
	"save": "บันทึก",
	"announcementEnd": "เก็บประกาศ",
	"archive": "เก็บถาวร",
	"unarchive": "เลิกการเก็บถาวร",
	"delete": "ลบ",
	"title": "หัวข้อ",
	"text": "ข้อความ",
	"imageUrl": "URL รูปภาพ",
	"icon": "ไอคอน",
	"normal": "ปกติ",
	"banner": "แบนเนอร์",
	"dialog": "ไดอะล็อก",
	"display": "แสดงผล",
	"announcementDialogAnnouncementUxWarn": "เราขอแนะนำให้ใช้ด้วยความระมัดระวัง เนื่องจากการแจ้งเตือนแบบกล่องโต้ตอบตั้งแต่ 2 รายการขึ้นไปพร้อมกันอาจส่งผลเสียต่อ UX ได้อย่างมาก",
	"announcementForExistingUsersDescription": "หากเปิดใช้งาน การประกาศนี้จะแสดงเฉพาะกับผู้ใช้ที่สร้างบัญชีก่อน/ที่มีอยู่ในขณะที่สร้างประกาศนี้เท่านั้น หากปิดใช้งาน การประกาศนี้จะแสดงกับผู้ใช้ที่สร้างบัญชีหลังจากสร้างประกาศนี้ด้วย",
	"announcementForExistingUsers": "ผู้ใช้งานที่มีอยู่ตอนนี้เท่านั้น",
	"announcementSilenceDescription": "หากเปิดใช้งาน จะไม่มีการแจ้งเตือนประกาศนี้ และผู้ใช้จะไม่จำเป็นต้องทำเครื่องหมายว่าอ่านแล้ว",
	"announcementSilence": "ไม่มีการแจ้งเตือน",
	"announcementNeedConfirmationToReadDescription": "กล่องโต้ตอบการยืนยันจะปรากฏขึ้นเมื่อจะทำเครื่องหมายว่าอ่านแล้ว นอกจากนี้ยังทำให้ประกาศนี้ยังไม่ถูกอ่านเมื่อใช้ฟังก์ชั่น “ทำเครื่องหมายฯ ทั้งหมดว่าอ่านแล้ว”",
	"announcementNeedConfirmationToRead": "จำเป็นต้องยืนยันว่าอ่านแล้ว",
	"nUsersRead": "อ่านโดย {n}",
	"more": "เพิ่มเติม!",
	"active": "ใช้งานอยู่",
	"archived": "เก็บถาวรแล้ว",
	"deleteAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"add": "เพิ่ม",
	"announcements": "ประกาศ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "Duyuruları, uzun vadede geçerli olacak bilgiler için değil, güncel ve zaman sınırlı bilgileri yayınlamak için kullanmak en iyisidir.",
	"announcementTooManyActiveAnnouncementDescription": "Çok fazla aktif duyuru olması kullanıcı deneyimini kötüleştirebilir. Artık geçerliliğini yitirmiş duyuruları arşivlemeyi düşün.",
	"filter": "Filtre",
	"save": "Kaydet",
	"announcementEnd": "Arşiv duyurusu",
	"archive": "Arşiv",
	"unarchive": "Arşivden çıkar",
	"delete": "Sil",
	"title": "Başlık",
	"text": "Metin",
	"imageUrl": "Görsel URL",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Diyalog",
	"display": "Ekran",
	"announcementDialogAnnouncementUxWarn": "Aynı anda iki veya daha fazla diyalog tarzı bildirim olması, kullanıcı deneyimini önemli ölçüde etkileyebilir, bu nedenle lütfen bunları dikkatli kullanın.",
	"announcementForExistingUsersDescription": "Bu duyuru, etkinleştirildiğinde yalnızca yayınlandığı anda mevcut olan kullanıcılara gösterilecek. Devre dışı bırakıldığında, yayınlandıktan sonra yeni kaydolan kullanıcılar da bu duyuruyu görecek.",
	"announcementForExistingUsers": "Sadece mevcut kullanıcılar",
	"announcementSilenceDescription": "Bu seçeneği etkinleştirdiğinde, bu duyurunun bildirimi atlanacak ve kullanıcı bunu okumak zorunda kalmayacak.",
	"announcementSilence": "Bildirim yok",
	"announcementNeedConfirmationToReadDescription": "Etkinleştirildiğinde, bu duyuruyu okundu olarak işaretlemek için ayrı bir onay mesajı görüntülenir. Bu duyuru, “Tümünü okundu olarak işaretle” işlevinden de hariç tutulur.",
	"announcementNeedConfirmationToRead": "Ayrı okuma onayı gerektirir",
	"nUsersRead": "{n} tarafından okundu",
	"more": "Daha fazlası!",
	"active": "Aktif",
	"archived": "Arşivle",
	"deleteAreYouSure": "“{x}” öğesini silmek istediğinizden emin misin?",
	"add": "Ekle",
	"announcements": "Duyurular"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Having too many active announcements may worsen the user experience. Please consider archiving announcements that have become obsolete.",
	"filter": "Filter",
	"save": "Save",
	"announcementEnd": "Archive announcement",
	"archive": "Archive",
	"unarchive": "Unarchive",
	"delete": "ئۆچۈرۈش",
	"title": "Title",
	"text": "Text",
	"imageUrl": "Image URL",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "This announcement will only be shown to users existing at the point of publishment if enabled. If disabled, those newly signing up after it has been posted will also see it.",
	"announcementForExistingUsers": "Existing users only",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "read by {n}",
	"more": "More!",
	"active": "Active",
	"archived": "Archived",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"add": "Add",
	"announcements": "Announcements"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "Краще за все використовувати оголошення щоб повідомляти про свіжу й обмежену по часу інформацію, аніж стару й постійно актуальну.",
	"announcementTooManyActiveAnnouncementDescription": "Велика кількість оголошень може погіршити досвід користувача. Будь ласка, архівуйте оголошення, які здаються вам неактуальними.",
	"filter": "Фільтр",
	"save": "Зберегти",
	"announcementEnd": "Архівувати оголошення",
	"archive": "Архів",
	"unarchive": "Розархівувати",
	"delete": "Видалити",
	"title": "Тема",
	"text": "Текст",
	"imageUrl": "Посилання на зображення",
	"icon": "Аватар",
	"normal": "Нормальний",
	"banner": "Банер",
	"dialog": "Діалог",
	"display": "Відображення",
	"announcementDialogAnnouncementUxWarn": "Наявність двох або більше оголошення типу діалогу водночас може суттєво вплинути на досвід користувача, тому, будь ласка, використовуйте їх обережно.",
	"announcementForExistingUsersDescription": "Це оголошення буде показано лише існуючим користувачам, якщо публікацію ввімкнуто.",
	"announcementForExistingUsers": "Тільки для існуючих користувачів",
	"announcementSilenceDescription": "Ввімкнення цього пункту вимкне повідомлення користувача про оголошення, й користувач не буде вимушеним його читати.",
	"announcementSilence": "Без оповіщення",
	"announcementNeedConfirmationToReadDescription": "Окремий запит заради позначення цього оголошення прочитаним буде показано якщо ввімкнуто. Це оголошення також буде виключено з будь-якого функціоналу \"Позначити як прочитане\".",
	"announcementNeedConfirmationToRead": "Вимагати окреме підтвердження заради позначення прочитаним",
	"nUsersRead": "Прочитали {n}",
	"more": "Бiльше!",
	"active": "Активовано",
	"archived": "Заархівовано",
	"deleteAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"add": "Додати",
	"announcements": "Оголошення"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "It's best to use announcements to publish fresh and time-bound information, not for information that will be relevant in the long term.",
	"announcementTooManyActiveAnnouncementDescription": "Có quá nhiều thông báo sẽ làm trải nghiệm của người dùng tệ đi. Vui lòng lưu trữ những thông báo đã hết hiệu lực.",
	"filter": "Bộ lọc",
	"save": "Lưu",
	"announcementEnd": "Lưu trữ thông báo",
	"archive": "Lưu trữ",
	"unarchive": "Unarchive",
	"delete": "Xóa",
	"title": "Tựa đề",
	"text": "Nội dung",
	"imageUrl": "URL ảnh",
	"icon": "Ảnh đại diện",
	"normal": "Bình thường",
	"banner": "Ảnh bìa",
	"dialog": "Hộp thoại",
	"display": "Hiển thị",
	"announcementDialogAnnouncementUxWarn": "Having two or more dialog-style notifications simultaneously can significantly impact the user experience, so please use them carefully.",
	"announcementForExistingUsersDescription": "Nếu được bật, thông báo này sẽ chỉ hiển thị với những người dùng đã tồn tại vào lúc thông báo được tạo. Nếu tắt đi, những tài khoản mới đăng ký sau khi thông báo được đăng lên cũng sẽ thấy nó.",
	"announcementForExistingUsers": "Chỉ những người dùng đã tồn tại",
	"announcementSilenceDescription": "Turning this on will skip the notification of this announcement and the user won't need to read it.",
	"announcementSilence": "No notification",
	"announcementNeedConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"announcementNeedConfirmationToRead": "Require separate read confirmation",
	"nUsersRead": "đọc bởi {n}",
	"more": "Thêm nữa!",
	"active": "Hoạt động",
	"archived": "Archived",
	"deleteAreYouSure": "Bạn có chắc muốn xóa \"{x}\"?",
	"add": "Thêm",
	"announcements": "Thông báo máy chủ"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "因可能损坏新用户的 UX 体验，建议将通知用于发布具有时效性的信息，而不是用于长期展示的信息。",
	"announcementTooManyActiveAnnouncementDescription": "若有大量活动公告，可能会造成用户体验下降。请考虑归档已完成的公告。",
	"filter": "筛选",
	"save": "保存",
	"announcementEnd": "结束公告",
	"archive": "归档",
	"unarchive": "取消归档",
	"delete": "删除",
	"title": "标题",
	"text": "文本",
	"imageUrl": "图片 URL",
	"icon": "头像",
	"normal": "正常",
	"banner": "横幅",
	"dialog": "对话框",
	"display": "显示",
	"announcementDialogAnnouncementUxWarn": "同时存在 2 个或以上的对话框公告极有可能对用户体验产生负面的影响，建议谨慎使用。",
	"announcementForExistingUsersDescription": "若启用，该公告将仅对创建此公告时存在的用户可见。 如果禁用，则在创建此公告后注册的用户也可以看到该公告。",
	"announcementForExistingUsers": "仅限现有用户",
	"announcementSilenceDescription": "开启后，此条公告将不会发送通知，也不强制用户阅读。",
	"announcementSilence": "不发送通知",
	"announcementNeedConfirmationToReadDescription": "若启用，则会在标记已读时会显示确认对话框。此外，它也会不受批量已读操作的影响。",
	"announcementNeedConfirmationToRead": "需要确认才能标记为已读",
	"nUsersRead": "{n}人已读",
	"more": "更多！",
	"active": "活动",
	"archived": "已归档",
	"deleteAreYouSure": "要删掉「{x}」吗？",
	"add": "添加",
	"announcements": "公告"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"announcementShouldNotBeUsedToPresentPermanentInfo": "為了避免損害新用戶的使用體驗，建議使用公告來發布即時性的訊息，而不是用於固定不變的資訊。",
	"announcementTooManyActiveAnnouncementDescription": "有過多公告可能會影響使用者體驗。請考慮歸檔已結束的公告。",
	"filter": "篩選",
	"save": "儲存",
	"announcementEnd": "結束公告",
	"archive": "封存",
	"unarchive": "取消封存",
	"delete": "刪除",
	"title": "標題",
	"text": "文字",
	"imageUrl": "圖片URL",
	"icon": "圖示",
	"normal": "正常",
	"banner": "橫幅",
	"dialog": "對話方塊",
	"display": "檢視",
	"announcementDialogAnnouncementUxWarn": "如果同時有 2 個以上對話方塊形式的公告存在，對於使用者體驗很可能會有不良的影響，因此建議謹慎使用。",
	"announcementForExistingUsersDescription": "啟用代表僅向現存使用者顯示；停用代表張貼後註冊的新使用者也會看到。",
	"announcementForExistingUsers": "僅限既有的使用者",
	"announcementSilenceDescription": "啟用此選項後，將不會發送此公告的通知，並且無需將其標記為已讀。",
	"announcementSilence": "不發送通知",
	"announcementNeedConfirmationToReadDescription": "啟用代表此公告將顯示對話方塊以確認是否標記為已讀，同時不會受「標記所有公告為已讀」功能影響。",
	"announcementNeedConfirmationToRead": "必須確認才能標記為已讀",
	"nUsersRead": "{n} 人已讀",
	"more": "更多！",
	"active": "最近活躍",
	"archived": "已封存",
	"deleteAreYouSure": "確定要刪掉「{x}」嗎？",
	"add": "新增",
	"announcements": "公告"
}
</locale>
