<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/branding" :label="$locale.sfc.branding" :keywords="['branding']" icon="ti ti-paint">
			<div class="_gaps_m">
				<SearchMarker :keywords="['entrance', 'welcome', 'landing', 'front', 'home', 'page', 'style']">
					<MkRadios
						v-model="entrancePageStyle"
						:options="[
							{ value: 'classic' },
							{ value: 'simple' },
						]"
					>
						<template #label><SearchLabel>{{ $locale.sfc.serverSettingsEntrancePageStyle }}</SearchLabel></template>
					</MkRadios>
				</SearchMarker>

				<SearchMarker :keywords="['timeline']">
					<MkSwitch v-model="showTimelineForVisitor">
						<template #label><SearchLabel>{{ $locale.sfc.serverSettingsShowTimelineForVisitor }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['activity', 'activities']">
					<MkSwitch v-model="showActivitiesForVisitor">
						<template #label><SearchLabel>{{ $locale.sfc.serverSettingsShowActivitiesForVisitor }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>

				<SearchMarker :keywords="['icon', 'image']">
					<MkInput v-model="iconUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.serverSettingsIconUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['icon', 'image']">
					<MkInput v-model="app192IconUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.serverSettingsIconUrl }} (App/192px)</SearchLabel></template>
						<template #caption>
							<div>{{ interpolateLocaleParameters($locale.sfc.serverSettingsAppIconDescription, { host: instance.name ?? host }) }}</div>
							<div>({{ $locale.sfc.serverSettingsAppIconUsageExample }})</div>
							<div>{{ $locale.sfc.serverSettingsAppIconStyleRecommendation }}</div>
							<div><strong>{{ interpolateLocaleParameters($locale.sfc.serverSettingsAppIconResolutionMustBe, { resolution: '192x192px' }) }}</strong></div>
						</template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['icon', 'image']">
					<MkInput v-model="app512IconUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.serverSettingsIconUrl }} (App/512px)</SearchLabel></template>
						<template #caption>
							<div>{{ interpolateLocaleParameters($locale.sfc.serverSettingsAppIconDescription, { host: instance.name ?? host }) }}</div>
							<div>({{ $locale.sfc.serverSettingsAppIconUsageExample }})</div>
							<div>{{ $locale.sfc.serverSettingsAppIconStyleRecommendation }}</div>
							<div><strong>{{ interpolateLocaleParameters($locale.sfc.serverSettingsAppIconResolutionMustBe, { resolution: '512x512px' }) }}</strong></div>
						</template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['banner', 'image']">
					<MkInput v-model="bannerUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.bannerUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['background', 'image']">
					<MkInput v-model="backgroundImageUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.backgroundImageUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['image']">
					<MkInput v-model="notFoundImageUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.notFoundDescription }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['image']">
					<MkInput v-model="infoImageUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.nothing }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['image']">
					<MkInput v-model="serverErrorImageUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.somethingHappened }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker :keywords="['theme', 'color']">
					<MkColorInput v-model="themeColor">
						<template #label><SearchLabel>{{ $locale.sfc.themeColor }}</SearchLabel></template>
					</MkColorInput>
				</SearchMarker>

				<SearchMarker :keywords="['theme', 'default', 'light']">
					<MkTextarea v-model="defaultLightTheme">
						<template #label><SearchLabel>{{ $locale.sfc.instanceDefaultLightTheme }}</SearchLabel></template>
						<template #caption>{{ $locale.sfc.instanceDefaultThemeDescription }}</template>
					</MkTextarea>
				</SearchMarker>

				<SearchMarker :keywords="['theme', 'default', 'dark']">
					<MkTextarea v-model="defaultDarkTheme">
						<template #label><SearchLabel>{{ $locale.sfc.instanceDefaultDarkTheme }}</SearchLabel></template>
						<template #caption>{{ $locale.sfc.instanceDefaultThemeDescription }}</template>
					</MkTextarea>
				</SearchMarker>

				<SearchMarker>
					<MkInput v-model="repositoryUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.repositoryUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker>
					<MkInput v-model="feedbackUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label><SearchLabel>{{ $locale.sfc.feedbackUrl }}</SearchLabel></template>
					</MkInput>
				</SearchMarker>

				<SearchMarker>
					<MkTextarea v-model="manifestJsonOverride">
						<template #label><SearchLabel>{{ $locale.sfc.serverSettingsManifestJsonOverride }}</SearchLabel></template>
					</MkTextarea>
				</SearchMarker>
			</div>
		</SearchMarker>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import JSON5 from 'json5';
import * as Misskey from 'misskey-js';
import { host } from '@features/boot/frontend/shared/config.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { instance, fetchInstance } from '@features/instance/frontend/instance.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkColorInput from '@features/ui/frontend/components/MkColorInput.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';

const meta = await misskeyApi('admin/meta');

const entrancePageStyle = ref<NonNullable<Misskey.entities.MetaClientOptions['entrancePageStyle']>>(meta.clientOptions.entrancePageStyle ?? 'classic');
const showTimelineForVisitor = ref<boolean>(meta.clientOptions.showTimelineForVisitor ?? true);
const showActivitiesForVisitor = ref<boolean>(meta.clientOptions.showActivitiesForVisitor ?? true);

const iconUrl = ref(meta.iconUrl);
const app192IconUrl = ref(meta.app192IconUrl);
const app512IconUrl = ref(meta.app512IconUrl);
const bannerUrl = ref(meta.bannerUrl);
const backgroundImageUrl = ref(meta.backgroundImageUrl);
const themeColor = ref(meta.themeColor);
const defaultLightTheme = ref(meta.defaultLightTheme);
const defaultDarkTheme = ref(meta.defaultDarkTheme);
const serverErrorImageUrl = ref(meta.serverErrorImageUrl);
const infoImageUrl = ref(meta.infoImageUrl);
const notFoundImageUrl = ref(meta.notFoundImageUrl);
const repositoryUrl = ref(meta.repositoryUrl);
const feedbackUrl = ref(meta.feedbackUrl);
const manifestJsonOverride = ref(meta.manifestJsonOverride === '' ? '{}' : JSON.stringify(JSON.parse(meta.manifestJsonOverride), null, '\t'));

function save() {
	os.apiWithDialog('admin/update-meta', {
		clientOptions: {
			entrancePageStyle: entrancePageStyle.value,
			showTimelineForVisitor: showTimelineForVisitor.value,
			showActivitiesForVisitor: showActivitiesForVisitor.value,
		},
		iconUrl: iconUrl.value,
		app192IconUrl: app192IconUrl.value,
		app512IconUrl: app512IconUrl.value,
		bannerUrl: bannerUrl.value,
		backgroundImageUrl: backgroundImageUrl.value,
		themeColor: themeColor.value === '' ? null : themeColor.value,
		defaultLightTheme: defaultLightTheme.value === '' ? null : defaultLightTheme.value,
		defaultDarkTheme: defaultDarkTheme.value === '' ? null : defaultDarkTheme.value,
		infoImageUrl: infoImageUrl.value === '' ? null : infoImageUrl.value,
		notFoundImageUrl: notFoundImageUrl.value === '' ? null : notFoundImageUrl.value,
		serverErrorImageUrl: serverErrorImageUrl.value === '' ? null : serverErrorImageUrl.value,
		repositoryUrl: repositoryUrl.value === '' ? null : repositoryUrl.value,
		feedbackUrl: feedbackUrl.value === '' ? null : feedbackUrl.value,
		manifestJsonOverride: manifestJsonOverride.value === '' ? '{}' : JSON.stringify(JSON5.parse(manifestJsonOverride.value)),
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.branding,
	icon: 'ti ti-paint',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>

<locale lang="json" locale="ar-SA">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "رابط صورة اللافتة",
	"backgroundImageUrl": "رابط صورة الخلفية",
	"notFoundDescription": "تعذر العثور على صفحة يقود إليها هذا الرابط.",
	"nothing": "لا يوجد شيء هنا",
	"somethingHappened": "حدث خطأ",
	"themeColor": "لون السمة",
	"instanceDefaultLightTheme": "Instance-wide default light theme",
	"instanceDefaultThemeDescription": "Enter the theme code in object format.",
	"instanceDefaultDarkTheme": "Instance-wide default dark theme",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "حفظ"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"branding": "Marca",
	"serverSettingsEntrancePageStyle": "Estil de la pàgina d'inici",
	"serverSettingsShowTimelineForVisitor": "Mostrar la línia de temps",
	"serverSettingsShowActivitiesForVisitor": "Mostrar activitat",
	"serverSettingsIconUrl": "URL de la icona",
	"serverSettingsAppIconDescription": "Especifica la icona que es mostrarà quan el {host} es mostri en una aplicació.",
	"serverSettingsAppIconUsageExample": "Per exemple com a PWA, o quan es mostri com un favorit a la pàgina d'inici del telèfon mòbil",
	"serverSettingsAppIconStyleRecommendation": "Com la icona pot ser retallada com un cercle o un quadrat, es recomana fer servir una icona amb un marge acolorit que l'envolti.",
	"serverSettingsAppIconResolutionMustBe": "La resolució mínima és {resolution}.",
	"bannerUrl": "Adreça URL del bàner",
	"backgroundImageUrl": "Adreça URL de la imatge de fons",
	"notFoundDescription": "No es troba cap pàgina que correspongui a aquesta adreça",
	"nothing": "No hi ha res per veure aquí ",
	"somethingHappened": "S'ha produït un error",
	"themeColor": "Color del tema",
	"instanceDefaultLightTheme": "Tema clar per defecte de tota la instància ",
	"instanceDefaultThemeDescription": "Introdueix el codi del tema en format d'objecte",
	"instanceDefaultDarkTheme": "Tema fosc per defecte de tota la instància ",
	"repositoryUrl": "URL del repositori",
	"feedbackUrl": "URL per a opinar",
	"serverSettingsManifestJsonOverride": "Sobreescriure manifest.json",
	"save": "Desa"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"branding": "Značka",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "URL ikony",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Baner URL",
	"backgroundImageUrl": "Adresa URL obrázku pozadí",
	"notFoundDescription": "Nebyla nalezená žádná stránka korespondující se zadanou URL.",
	"nothing": "Nic nebylo nalezeno",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"themeColor": "Barva motivu",
	"instanceDefaultLightTheme": "Výchozí světlý motiv instance",
	"instanceDefaultThemeDescription": "Zadejte kód motivu v objektovém formátu",
	"instanceDefaultDarkTheme": "Výhozí tmavý motiv instance",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Uložit"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Banner image URL",
	"backgroundImageUrl": "Background image URL",
	"notFoundDescription": "No page corresponding to this URL could be found.",
	"nothing": "There's nothing to see here",
	"somethingHappened": "An error has occurred",
	"themeColor": "Instance Ticker Color",
	"instanceDefaultLightTheme": "Instance-wide default light theme",
	"instanceDefaultThemeDescription": "Enter the theme code in object format.",
	"instanceDefaultDarkTheme": "Instance-wide default dark theme",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Save"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Stil der Einstiegsseite",
	"serverSettingsShowTimelineForVisitor": "Zeitleiste anzeigen",
	"serverSettingsShowActivitiesForVisitor": "Aktivitäten anzeigen",
	"serverSettingsIconUrl": "Icon-URL",
	"serverSettingsAppIconDescription": "Gibt das zu verwendende Icon bei der Anzeige von {host} als App an.",
	"serverSettingsAppIconUsageExample": "Beispielsweise als PWA, oder bei Lesezeichen auf dem Startbildschirm von Smartphones",
	"serverSettingsAppIconStyleRecommendation": "Da das Icon zu einem Kreis oder Quadrat zugeschnitten wird, wird ein Icon mit gefülltem Margin um den Inhalt herum empfohlen.",
	"serverSettingsAppIconResolutionMustBe": "Die Mindestauflösung ist {resolution}.",
	"bannerUrl": "Banner-URL",
	"backgroundImageUrl": "Hintergrundbild-URL",
	"notFoundDescription": "Es konnte keine Seite unter dieser URL gefunden werden.",
	"nothing": "Hier gibt es nichts zu sehen",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"themeColor": "Farbe der Instanz-Information",
	"instanceDefaultLightTheme": "Instanzweites Standardfarbschema (Hell)",
	"instanceDefaultThemeDescription": "Gib den Farbschemencode im Objektformat ein.",
	"instanceDefaultDarkTheme": "Instanzweites Standardfarbschema (Dunkel)",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback-Website",
	"serverSettingsManifestJsonOverride": "Überschreiben von manifest.json",
	"save": "Speichern"
}
</locale>

<locale lang="json" locale="en-US">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Banner image URL",
	"backgroundImageUrl": "Background image URL",
	"notFoundDescription": "No page corresponding to this URL could be found.",
	"nothing": "There's nothing to see here",
	"somethingHappened": "An error has occurred",
	"themeColor": "Instance Ticker Color",
	"instanceDefaultLightTheme": "Instance-wide default light theme",
	"instanceDefaultThemeDescription": "Enter the theme code in object format.",
	"instanceDefaultDarkTheme": "Instance-wide default dark theme",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Save"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"branding": "Marca",
	"serverSettingsEntrancePageStyle": "Estilo de la página de inicio",
	"serverSettingsShowTimelineForVisitor": "Mostrar la línea de tiempo",
	"serverSettingsShowActivitiesForVisitor": "Mostrar actividades",
	"serverSettingsIconUrl": "URL del ícono",
	"serverSettingsAppIconDescription": "Indica el icono que se va a usar cuando {host} se muestre como una app.",
	"serverSettingsAppIconUsageExample": "Por ejemplo, como PWA o cuando se muestre como un marcador en la pantalla inicial del dispositivo",
	"serverSettingsAppIconStyleRecommendation": "Como el icono puede ser recortado como un cuadrado o un círculo, se recomienda un icono con un margen coloreado alrededor del contenido.",
	"serverSettingsAppIconResolutionMustBe": "La resolución mínima es {resolution}.",
	"bannerUrl": "URL de la imagen del banner",
	"backgroundImageUrl": "URL de la imagen de fondo",
	"notFoundDescription": "No se encontró la página correspondiente a la URL elegida",
	"nothing": "No hay nada que ver aqui",
	"somethingHappened": "Ocurrió un error",
	"themeColor": "Color del tema",
	"instanceDefaultLightTheme": "Tema claro por defecto de la instancia",
	"instanceDefaultThemeDescription": "Ingrese el código del tema en formato objeto",
	"instanceDefaultDarkTheme": "Tema oscuro por defecto de la instancia",
	"repositoryUrl": "URL del repositorio",
	"feedbackUrl": "URL de comentarios",
	"serverSettingsManifestJsonOverride": "Sobreescribir manifest.json",
	"save": "Guardar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"branding": "Image de marque",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "URL de l’icône",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "La résolution doit être au moins {resolution}.",
	"bannerUrl": "URL de l’image de la bannière",
	"backgroundImageUrl": "URL de l'image d'arrière-plan",
	"notFoundDescription": "Aucune page ne correspond à l’URL spécifiée.",
	"nothing": "Il n'y a rien à voir ici",
	"somethingHappened": "Une erreur est survenue",
	"themeColor": "Couleur du thème",
	"instanceDefaultLightTheme": "Thème clair par défaut sur toute l’instance",
	"instanceDefaultThemeDescription": "Saisissez le code du thème en format objet.",
	"instanceDefaultDarkTheme": "Thème sombre par défaut sur toute l’instance",
	"repositoryUrl": "URL du dépôt",
	"feedbackUrl": "URL pour les commentaires",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Enregistrer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"branding": "Merek",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "URL ikon",
	"serverSettingsAppIconDescription": "Tentukan ikon yang digunakan ketika {host} ditampilkan sebagai aplikasi.",
	"serverSettingsAppIconUsageExample": "Contoh: Sebagai PWA, atau ketika ditampilkan sebagai markah layar beranda pada ponsel",
	"serverSettingsAppIconStyleRecommendation": "Karena ikon berkemungkinan dipotong menjadi persegi atau lingkaran, ikon dengan margin terwanai di sekeliling konten sangat direkomendasikan.",
	"serverSettingsAppIconResolutionMustBe": "Minimum resolusi adalah {resolution}.",
	"bannerUrl": "URL Banner",
	"backgroundImageUrl": "URL Gambar latar",
	"notFoundDescription": "Tidak ada halaman sesuai dengan URL yang ditentukan.",
	"nothing": "Tidak ada sama sekali disini",
	"somethingHappened": "Terjadi kesalahan",
	"themeColor": "Warna Tema",
	"instanceDefaultLightTheme": "Bawaan instan tema terang",
	"instanceDefaultThemeDescription": "Masukkan kode tema di format obyek.",
	"instanceDefaultDarkTheme": "Bawaan instan tema gelap",
	"repositoryUrl": "URL Repositori",
	"feedbackUrl": "URL Umpan balik",
	"serverSettingsManifestJsonOverride": "Ambil alih manifest.json",
	"save": "Simpan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Stile della pagina di ingresso",
	"serverSettingsShowTimelineForVisitor": "Mostra la Timeline a visitatori non autenticati",
	"serverSettingsShowActivitiesForVisitor": "Mostrare la propria attività",
	"serverSettingsIconUrl": "URL dell'icona",
	"serverSettingsAppIconDescription": "Indicare l'icona da usare quando {host} viene salvata come App.",
	"serverSettingsAppIconUsageExample": "Ad esempio quando si aggiunge il segnalibro alla PWA (Progressive Web App), oppure alla schermata iniziale del dispositivo mobile ",
	"serverSettingsAppIconStyleRecommendation": "Poiché l'icona potrebbe essere ritagliata in un quadrato o in un cerchio, si raccomanda che abbia un margine colorato.",
	"serverSettingsAppIconResolutionMustBe": "La risoluzione minima è {resolution}",
	"bannerUrl": "URL dell'immagine d'intestazione",
	"backgroundImageUrl": "URL dello sfondo",
	"notFoundDescription": "Nessuna pagina corrisponde all'URL indicata.",
	"nothing": "Niente da visualizzare",
	"somethingHappened": "Si è verificato un problema",
	"themeColor": "Colore del tema",
	"instanceDefaultLightTheme": "Istanza, tema luminoso predefinito.",
	"instanceDefaultThemeDescription": "Compilare il codice del tema nel modulo dell'oggetto.",
	"instanceDefaultDarkTheme": "Istanza, tema scuro predefinito.",
	"repositoryUrl": "URL della repository",
	"feedbackUrl": "URL di feedback",
	"serverSettingsManifestJsonOverride": "Sostituire il file manifest.json",
	"save": "Salva"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"branding": "ブランディング",
	"serverSettingsEntrancePageStyle": "エントランスページのスタイル",
	"serverSettingsShowTimelineForVisitor": "タイムラインを表示する",
	"serverSettingsShowActivitiesForVisitor": "アクティビティを表示する",
	"serverSettingsIconUrl": "アイコン画像のURL",
	"serverSettingsAppIconDescription": "{host}がアプリとして表示される際のアイコンを指定します。",
	"serverSettingsAppIconUsageExample": "例: PWAや、スマートフォンのホーム画面にブックマークとして追加された時など",
	"serverSettingsAppIconStyleRecommendation": "円形もしくは角丸にクロップされる場合があるため、塗り潰された余白のある背景を持つことが推奨されます。",
	"serverSettingsAppIconResolutionMustBe": "解像度は必ず{resolution}である必要があります。",
	"bannerUrl": "バナー画像のURL",
	"backgroundImageUrl": "背景画像のURL",
	"notFoundDescription": "指定されたURLに該当するページはありませんでした。",
	"nothing": "ありません",
	"somethingHappened": "問題が発生しました",
	"themeColor": "テーマカラー",
	"instanceDefaultLightTheme": "サーバーデフォルトのライトテーマ",
	"instanceDefaultThemeDescription": "オブジェクト形式のテーマコードを記入します。",
	"instanceDefaultDarkTheme": "サーバーデフォルトのダークテーマ",
	"repositoryUrl": "リポジトリURL",
	"feedbackUrl": "フィードバックURL",
	"serverSettingsManifestJsonOverride": "manifest.jsonのオーバーライド",
	"save": "保存"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"branding": "ブランディング",
	"serverSettingsEntrancePageStyle": "エントランスページのスタイル",
	"serverSettingsShowTimelineForVisitor": "タイムラインを表示する",
	"serverSettingsShowActivitiesForVisitor": "アクティビティを表示する",
	"serverSettingsIconUrl": "アイコン画像のURL",
	"serverSettingsAppIconDescription": "{host}がアプリとして表示してるんやつをアイコンを指定すんで。",
	"serverSettingsAppIconUsageExample": "例えば、PWAとか、スマホのホームにブックマークしたときとか",
	"serverSettingsAppIconStyleRecommendation": "円か角丸に切り取られることがあるさかい、塗り潰した余白のある背景があるものがおすすめや。",
	"serverSettingsAppIconResolutionMustBe": "解像度は絶対{resolution}じゃないとアカン。",
	"bannerUrl": "バナー画像のURL",
	"backgroundImageUrl": "背景画像のURL",
	"notFoundDescription": "言われたURLのページはなかったで。",
	"nothing": "あらへん",
	"somethingHappened": "なんかあかんわ",
	"themeColor": "テーマカラー",
	"instanceDefaultLightTheme": "サーバーおすすめの明るいテーマ",
	"instanceDefaultThemeDescription": "オブジェクト形式のテーマコードを記入するで。",
	"instanceDefaultDarkTheme": "サーバーおすすめのの暗いテーマ",
	"repositoryUrl": "リポジトリURL",
	"feedbackUrl": "フィードバックURL",
	"serverSettingsManifestJsonOverride": "manifest.jsonのオーバーライド",
	"save": "とっとく"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Banner image URL",
	"backgroundImageUrl": "Background image URL",
	"notFoundDescription": "No page corresponding to this URL could be found.",
	"nothing": "There's nothing to see here",
	"somethingHappened": "An error has occurred",
	"themeColor": "Instance Ticker Color",
	"instanceDefaultLightTheme": "Instance-wide default light theme",
	"instanceDefaultThemeDescription": "Enter the theme code in object format.",
	"instanceDefaultDarkTheme": "Instance-wide default dark theme",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Sekles"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Banner image URL",
	"backgroundImageUrl": "Background image URL",
	"notFoundDescription": "No page corresponding to this URL could be found.",
	"nothing": "There's nothing to see here",
	"somethingHappened": "An error has occurred",
	"themeColor": "Instance Ticker Color",
	"instanceDefaultLightTheme": "Instance-wide default light theme",
	"instanceDefaultThemeDescription": "Enter the theme code in object format.",
	"instanceDefaultDarkTheme": "Instance-wide default dark theme",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "ಉಳಿಸಿ"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"branding": "브랜딩",
	"serverSettingsEntrancePageStyle": "입구 페이지의 스타일",
	"serverSettingsShowTimelineForVisitor": "타임라인 표시",
	"serverSettingsShowActivitiesForVisitor": "액티비티 표시하기",
	"serverSettingsIconUrl": "아이콘 URL",
	"serverSettingsAppIconDescription": "{host}이 앱으로 표시될 때의 아이콘을 지정합니다.",
	"serverSettingsAppIconUsageExample": "예를 들어, PWA나 스마트폰 홈 화면에 북마크로 추가되었을 때 등",
	"serverSettingsAppIconStyleRecommendation": "아이콘이 원형 또는 둥근 사각형으로 잘리는 경우가 있으므로, 가장자리 여백이 충분한 사진을 사용하는 것을 추천합니다.",
	"serverSettingsAppIconResolutionMustBe": "해상도는 반드시 {resolution} 이어야 합니다.",
	"bannerUrl": "배너 이미지 URL",
	"backgroundImageUrl": "배경 이미지 URL",
	"notFoundDescription": "지정한 URL에 해당하는 페이지가 존재하지 않습니다.",
	"nothing": "아무것도 없습니다",
	"somethingHappened": "오류가 발생했습니다",
	"themeColor": "테마 컬러",
	"instanceDefaultLightTheme": "서버 기본 라이트 테마",
	"instanceDefaultThemeDescription": "객체 형식({}로 감싼 형태)의 테마 코드를 입력해 주세요.",
	"instanceDefaultDarkTheme": "서버 기본 다크 테마",
	"repositoryUrl": "저장소 URL",
	"feedbackUrl": "피드백 URL",
	"serverSettingsManifestJsonOverride": "manifest.json 오버라이드",
	"save": "저장"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Banner URL",
	"backgroundImageUrl": "URL afbeelding",
	"notFoundDescription": "Er is geen pagina gevonden onder deze URL.",
	"nothing": "Niets te zien hier",
	"somethingHappened": "Er is iets misgegaan.",
	"themeColor": "Instance Ticker Color",
	"instanceDefaultLightTheme": "Instance-wide default light theme",
	"instanceDefaultThemeDescription": "Enter the theme code in object format.",
	"instanceDefaultDarkTheme": "Instance-wide default dark theme",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Opslaan"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Banner image URL",
	"backgroundImageUrl": "Background image URL",
	"notFoundDescription": "No page corresponding to this URL could be found.",
	"nothing": "Ingenting",
	"somethingHappened": "En feil har oppstått",
	"themeColor": "Instance Ticker Color",
	"instanceDefaultLightTheme": "Instance-wide default light theme",
	"instanceDefaultThemeDescription": "Enter the theme code in object format.",
	"instanceDefaultDarkTheme": "Instance-wide default dark theme",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Lagre"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Adres URL banera",
	"backgroundImageUrl": "Adres URL tła",
	"notFoundDescription": "Nie ma strony odpowiadającej określonemu adresowi URL.",
	"nothing": "Nie ma tu niczego",
	"somethingHappened": "Coś poszło nie tak",
	"themeColor": "Motyw kolorystyczny",
	"instanceDefaultLightTheme": "Domyślny motyw dla trybu jasnego",
	"instanceDefaultThemeDescription": "Opis domyślnego motywu instancji",
	"instanceDefaultDarkTheme": "Domyślny motyw dla trybu ciemnego",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Zapisz"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"branding": "Marca",
	"serverSettingsEntrancePageStyle": "Estilo da página de entrada",
	"serverSettingsShowTimelineForVisitor": "Mostrar linha do tempo",
	"serverSettingsShowActivitiesForVisitor": "Mostrar atividades",
	"serverSettingsIconUrl": "URL do ícone",
	"serverSettingsAppIconDescription": "Especifica o ícone utilizado quando {host} é exibido como um app.",
	"serverSettingsAppIconUsageExample": "Exemplo: Como PWA, ou quando exibido num marcador de páginas ou na tela inicial de um celular",
	"serverSettingsAppIconStyleRecommendation": "Como o ícone pode ser cortado para um quadrado ou círculo, é recomendado adicionar um fundo colorido na imagem.",
	"serverSettingsAppIconResolutionMustBe": "A resolução mínima é {resolution}.",
	"bannerUrl": "URL da imagem do ‘banner’",
	"backgroundImageUrl": "URL da imagem de fundo",
	"notFoundDescription": "Não havia página correspondente ao URL especificado.",
	"nothing": "Não há nada aqui",
	"somethingHappened": "Ocorreu um erro",
	"themeColor": "Cor do tema",
	"instanceDefaultLightTheme": "Tema diurno padrão para toda a instância",
	"instanceDefaultThemeDescription": "Insira o código do tema em formato de objeto.",
	"instanceDefaultDarkTheme": "Tema noturno para toda a instância",
	"repositoryUrl": "URL do repositório",
	"feedbackUrl": "Link para Feedback",
	"serverSettingsManifestJsonOverride": "Sobrescrever manifest.json",
	"save": "Salvar"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"branding": "Бренд",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Адрес на иконку роли",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Ссылка на изображение в шапке",
	"backgroundImageUrl": "Ссылка на фоновое изображение",
	"notFoundDescription": "Страница по указанной ссылке не найдена",
	"nothing": "Ничего нет",
	"somethingHappened": "Что-то пошло не так",
	"themeColor": "Цвет темы",
	"instanceDefaultLightTheme": "Светлая тема по умолчанию",
	"instanceDefaultThemeDescription": "Введите код темы в формате объекта.",
	"instanceDefaultDarkTheme": "Темная тема по умолчанию",
	"repositoryUrl": "Ссылка на репозиторий",
	"feedbackUrl": "Ссылка для обратной связи",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Сохранить"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "URL obrázku bannera",
	"backgroundImageUrl": "URL obrázku pozadia",
	"notFoundDescription": "Nenašla sa žiadna stránka na zadanej URL.",
	"nothing": "Nič tu nie je",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"themeColor": "Farba témy",
	"instanceDefaultLightTheme": "Predvolená svetlá téma",
	"instanceDefaultThemeDescription": "Vložte kód témy v objektovom formáte",
	"instanceDefaultDarkTheme": "Predvolená tmavá téma",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Uložiť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"branding": "แบรนดิ้ง",
	"serverSettingsEntrancePageStyle": "สไตล์ของหน้าเพจทางเข้า",
	"serverSettingsShowTimelineForVisitor": "แสดงไทม์ไลน์",
	"serverSettingsShowActivitiesForVisitor": "แสดงกิจกรรม",
	"serverSettingsIconUrl": "URL ของไอคอน",
	"serverSettingsAppIconDescription": "ระบุไอคอนที่จะใช้เมื่อ {host} แสดงเป็นแอป",
	"serverSettingsAppIconUsageExample": "ตัวอย่างเช่น เมื่อถูกเพิ่มเป็น PWA หรือบุ๊กมาร์กบนหน้าจอหลักในสมาร์ทโฟน",
	"serverSettingsAppIconStyleRecommendation": "เนื่องจากอาจถูกครอบตัดเป็นสี่เหลี่ยมหรือวงกลม จึงแนะนำให้ใช้ภาพที่เผื่อพื้นที่รอบๆ ตัวโลโก้ไอคอนไว้",
	"serverSettingsAppIconResolutionMustBe": "ความละเอียดขั้นต่ำไว้คือ {resolution}.",
	"bannerUrl": "URL รูปภาพแบนเนอร์",
	"backgroundImageUrl": "URL ภาพพื้นหลัง",
	"notFoundDescription": "ไม่พบหน้าตาม URL ที่ระบุ",
	"nothing": "ไม่พบผลลัพธ์",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"themeColor": "สีธีม",
	"instanceDefaultLightTheme": "ธีมสว่างตามค่าเริ่มต้นของเซิร์ฟเวอร์",
	"instanceDefaultThemeDescription": "ป้อนรหัสธีมในรูปแบบออบเจ็กต์",
	"instanceDefaultDarkTheme": "ธีมมืดตามค่าเริ่มต้นของเซิร์ฟเวอร์",
	"repositoryUrl": "URL ของ repository",
	"feedbackUrl": "URLของฟีดแบ็ก",
	"serverSettingsManifestJsonOverride": "เขียนทับ manifest.json",
	"save": "บันทึก"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"branding": "Markalaşma",
	"serverSettingsEntrancePageStyle": "Giriş sayfası stili",
	"serverSettingsShowTimelineForVisitor": "Panoyu göster",
	"serverSettingsShowActivitiesForVisitor": "Aktiviteleri göster",
	"serverSettingsIconUrl": "Simge URL'si",
	"serverSettingsAppIconDescription": " {host} bir uygulama olarak görüntülendiğinde kullanılacak simgeyi belirtir.",
	"serverSettingsAppIconUsageExample": "Örneğin, PWA olarak veya bir telefonda ana ekran yer imi olarak görüntülendiğinde",
	"serverSettingsAppIconStyleRecommendation": "Simge kare veya daire şeklinde kırpılabileceğinden, içeriğin etrafında renkli kenar boşluğu bulunan bir simge kullanılması önerilir.",
	"serverSettingsAppIconResolutionMustBe": "Minimum çözünürlük {resolution}'tür.",
	"bannerUrl": "Banner görseli URL",
	"backgroundImageUrl": "Arka plan görseli URL",
	"notFoundDescription": "Bu URL'ye karşılık gelen sayfa bulunamadı.",
	"nothing": "Burada görülecek bir şey yok.",
	"somethingHappened": "Bir hata oluştu",
	"themeColor": "Örnek Ticker Rengi",
	"instanceDefaultLightTheme": "Sunucu genelinde varsayılan açık tema",
	"instanceDefaultThemeDescription": "Tema kodunu nesne biçiminde girin.",
	"instanceDefaultDarkTheme": "Sunucu genelinde varsayılan koyu tema",
	"repositoryUrl": "Depo URL'si",
	"feedbackUrl": "Geri Bildirim URL'si",
	"serverSettingsManifestJsonOverride": "manifest.json Geçersiz Kılma",
	"save": "Kaydet"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"branding": "Branding",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Icon URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "The minimum resolution is {resolution}.",
	"bannerUrl": "Banner image URL",
	"backgroundImageUrl": "Background image URL",
	"notFoundDescription": "No page corresponding to this URL could be found.",
	"nothing": "There's nothing to see here",
	"somethingHappened": "An error has occurred",
	"themeColor": "Instance Ticker Color",
	"instanceDefaultLightTheme": "Instance-wide default light theme",
	"instanceDefaultThemeDescription": "Enter the theme code in object format.",
	"instanceDefaultDarkTheme": "Instance-wide default dark theme",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "Feedback URL",
	"serverSettingsManifestJsonOverride": "manifest.json Override",
	"save": "Save"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"branding": "Брендинг",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Посилання на іконку",
	"serverSettingsAppIconDescription": "Вказує іконку яку треба використовувати коли {host} показано як застосунок.",
	"serverSettingsAppIconUsageExample": "Наприклад: як PWA, або коли показано як закладку на домашній сторінці на телефоні.",
	"serverSettingsAppIconStyleRecommendation": "Оскільки іконку можна обрізати до квадрата або кола, рекомендується використовувати іконку з кольоровою рамкою навколо змісту.",
	"serverSettingsAppIconResolutionMustBe": "Мінімальним розміром є {resolution}.",
	"bannerUrl": "URL банера",
	"backgroundImageUrl": "URL-адреса фонового зображення",
	"notFoundDescription": "Сторінка за вказаною адресою не знайдена.",
	"nothing": "Тут нічого немає",
	"somethingHappened": "Щось пішло не так",
	"themeColor": "Колір теми",
	"instanceDefaultLightTheme": "Світла тема за промовчанням",
	"instanceDefaultThemeDescription": "Введіть код теми у форматі об’єкта.",
	"instanceDefaultDarkTheme": "Темна тема за промовчанням",
	"repositoryUrl": "URL репозиторію",
	"feedbackUrl": "URL відгуків",
	"serverSettingsManifestJsonOverride": "Перевизначення manifest.json ",
	"save": "Зберегти"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"branding": "Thương hiệu",
	"serverSettingsEntrancePageStyle": "Entrance page style",
	"serverSettingsShowTimelineForVisitor": "Show timeline",
	"serverSettingsShowActivitiesForVisitor": "Show activities",
	"serverSettingsIconUrl": "Biểu tượng URL",
	"serverSettingsAppIconDescription": "Specifies the icon to use when {host} is displayed as an app.",
	"serverSettingsAppIconUsageExample": "E.g. As PWA, or when displayed as a home screen bookmark on a phone",
	"serverSettingsAppIconStyleRecommendation": "As the icon may be cropped to a square or circle, an icon with colored margin around the content is recommended.",
	"serverSettingsAppIconResolutionMustBe": "Độ phân giải tối thiểu là {resolution}.",
	"bannerUrl": "URL Ảnh bìa",
	"backgroundImageUrl": "URL Ảnh nền",
	"notFoundDescription": "Không tìm thấy trang nào tương ứng với URL này.",
	"nothing": "Không có gì ở đây",
	"somethingHappened": "Xảy ra lỗi",
	"themeColor": "Màu theme",
	"instanceDefaultLightTheme": "Theme máy chủ Sáng-Rộng",
	"instanceDefaultThemeDescription": "Nhập mã theme trong định dạng đối tượng.",
	"instanceDefaultDarkTheme": "Theme máy chủ Tối-Rộng",
	"repositoryUrl": "Repository URL",
	"feedbackUrl": "URL phản hồi",
	"serverSettingsManifestJsonOverride": "Ghi đè manifest.json",
	"save": "Lưu"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"branding": "品牌",
	"serverSettingsEntrancePageStyle": "入口页面样式",
	"serverSettingsShowTimelineForVisitor": "显示时间线",
	"serverSettingsShowActivitiesForVisitor": "显示活动",
	"serverSettingsIconUrl": "图标 URL",
	"serverSettingsAppIconDescription": "指定当 {host} 显示为 app 时的图标。",
	"serverSettingsAppIconUsageExample": "如作为书签添加到 PWA 或手机主屏幕时",
	"serverSettingsAppIconStyleRecommendation": "因为有可能会被裁切为圆形或者圆角矩形，建议使用边缘带有留白背景的图标。",
	"serverSettingsAppIconResolutionMustBe": "分辨率必须为 {resolution}。",
	"bannerUrl": "横幅 URL",
	"backgroundImageUrl": "背景图片的链接",
	"notFoundDescription": "没有与指定 URL 对应的页面。",
	"nothing": "无",
	"somethingHappened": "出错了",
	"themeColor": "主题颜色",
	"instanceDefaultLightTheme": "服务器默认浅色主题",
	"instanceDefaultThemeDescription": "以对象格式输入主题代码",
	"instanceDefaultDarkTheme": "服务器默认深色主题",
	"repositoryUrl": "仓库地址",
	"feedbackUrl": "反馈地址",
	"serverSettingsManifestJsonOverride": "覆盖 manifest.json",
	"save": "保存"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"branding": "品牌宣傳",
	"serverSettingsEntrancePageStyle": "入口頁面的樣式",
	"serverSettingsShowTimelineForVisitor": "顯示時間軸",
	"serverSettingsShowActivitiesForVisitor": "顯示活動",
	"serverSettingsIconUrl": "圖示的 URL",
	"serverSettingsAppIconDescription": "指定顯示 {host} 為應用程式時的圖示。",
	"serverSettingsAppIconUsageExample": "例如：PWA 或是在手機桌面作為書籤等",
	"serverSettingsAppIconStyleRecommendation": "因為可能會裁剪成圓形或圓角，所以建議用單色填滿邊框及背景。",
	"serverSettingsAppIconResolutionMustBe": "解析度必須為 {resolution}。",
	"bannerUrl": "橫幅圖片URL",
	"backgroundImageUrl": "背景圖片的來源網址 ",
	"notFoundDescription": "查無此頁",
	"nothing": "查無項目",
	"somethingHappened": "發生錯誤",
	"themeColor": "佈景主題顏色",
	"instanceDefaultLightTheme": "實例預設的淺色佈景主題",
	"instanceDefaultThemeDescription": "輸入物件形式的佈景主題代碼",
	"instanceDefaultDarkTheme": "實例預設的深色佈景主題",
	"repositoryUrl": "儲存庫 URL",
	"feedbackUrl": "意見回饋 URL",
	"serverSettingsManifestJsonOverride": "覆寫 manifest.json",
	"save": "儲存"
}
</locale>
