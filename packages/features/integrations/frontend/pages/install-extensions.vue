<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithAnimBg>
	<div class="_spacer" style="--MI_SPACER-w: 550px; --MI_SPACER-max: 50px;">
		<MkLoading v-if="uiPhase === 'fetching'"/>
		<MkExtensionInstaller v-else-if="uiPhase === 'confirm' && data" :extension="data" @confirm="install()" @cancel="close_()">
			<template #additionalInfo>
				<FormSection>
					<div class="_gaps_s">
						<MkKeyValue>
							<template #key>{{ $locale.sfc.externalResourceInstallerVendorInfoEndpoint }}</template>
							<template #value><MkUrl v-if="url" :url="url" :showUrlPreview="false"></MkUrl></template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>{{ $locale.sfc.externalResourceInstallerVendorInfoHashVerify }}</template>
							<template #value>
								<!-- この画面が出ている時点でハッシュの検証には成功している -->
								<i class="ti ti-check" style="color: var(--MI_THEME-accent)"></i>
							</template>
						</MkKeyValue>
					</div>
				</FormSection>
			</template>
		</MkExtensionInstaller>
		<div v-else-if="uiPhase === 'error'" class="_gaps_m" :class="[$style.extInstallerRoot, $style.error]">
			<div :class="$style.extInstallerIconWrapper">
				<i class="ti ti-circle-x"></i>
			</div>
			<h2 :class="$style.extInstallerTitle">{{ errorKV?.title }}</h2>
			<div :class="$style.extInstallerNormDesc">{{ errorKV?.description }}</div>
			<div class="_buttonsCenter">
				<MkButton @click="close_()">{{ $locale.sfc.close }}</MkButton>
			</div>
		</div>
	</div>
</PageWithAnimBg>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import type { Extension } from '@features/integrations/frontend/components/MkExtensionInstaller.vue';
import type { AiScriptPluginMeta } from '@features/integrations/frontend/plugin.js';
import MkLoading from '@features/ui/frontend/components/global/MkLoading.vue';
import MkExtensionInstaller from '@features/integrations/frontend/components/MkExtensionInstaller.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkUrl from '@features/markup/frontend/components/global/MkUrl.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { parsePluginMeta, installPlugin } from '@features/integrations/frontend/plugin.js';
import { installTheme } from '@features/preferences/frontend/theme.js';
import { parseThemeCode } from '@features/preferences/frontend/shared/theme.js';
import { unisonReload } from '@features/runtime/frontend/utility/unison-reload.js';
import { definePage } from '@features/navigation/frontend/page.js';

const uiPhase = ref<'fetching' | 'confirm' | 'error'>('fetching');
const errorKV = ref<{
	title?: string;
	description?: string;
}>({
	title: '',
	description: '',
});

const url = ref<string | null>(null);
const hash = ref<string | null>(null);

const data = ref<Extension | null>(null);

function close_(): void {
	if (window.history.length === 1) {
		window.close();
	} else {
		window.history.back();
	}
}

async function _fetch_() {
	if (!url.value || !hash.value) {
		errorKV.value = {
			title: $locale.value.sfc.externalResourceInstallerErrorsInvalidParamsTitle,
			description: $locale.value.sfc.externalResourceInstallerErrorsInvalidParamsDescription,
		};
		uiPhase.value = 'error';
		return;
	}
	const res = await misskeyApi('fetch-external-resources', {
		url: url.value,
		hash: hash.value,
	}).catch((err) => {
		switch (err.id) {
			case 'bb774091-7a15-4a70-9dc5-6ac8cf125856':
				errorKV.value = {
					title: $locale.value.sfc.externalResourceInstallerErrorsFailedToFetchTitle,
					description: $locale.value.sfc.externalResourceInstallerErrorsFailedToFetchParseErrorDescription,
				};
				uiPhase.value = 'error';
				break;
			case '693ba8ba-b486-40df-a174-72f8279b56a4':
				errorKV.value = {
					title: $locale.value.sfc.externalResourceInstallerErrorsHashUnmatchedTitle,
					description: $locale.value.sfc.externalResourceInstallerErrorsHashUnmatchedDescription,
				};
				uiPhase.value = 'error';
				break;
			default:
				errorKV.value = {
					title: $locale.value.sfc.externalResourceInstallerErrorsFailedToFetchTitle,
					description: $locale.value.sfc.externalResourceInstallerErrorsFailedToFetchFetchErrorDescription,
				};
				uiPhase.value = 'error';
				break;
		}
		throw new Error(err.code);
	});

	if (!res) {
		errorKV.value = {
			title: $locale.value.sfc.externalResourceInstallerErrorsFailedToFetchTitle,
			description: $locale.value.sfc.externalResourceInstallerErrorsFailedToFetchFetchErrorDescription,
		};
		uiPhase.value = 'error';
		return;
	}

	switch (res.type) {
		case 'plugin':
			try {
				const meta = await parsePluginMeta(res.data);
				data.value = {
					type: 'plugin',
					meta,
					raw: res.data,
				};
			} catch (err) {
				errorKV.value = {
					title: $locale.value.sfc.externalResourceInstallerErrorsPluginParseFailedTitle,
					description: $locale.value.sfc.externalResourceInstallerErrorsPluginParseFailedDescription,
				};
				console.error(err);
				uiPhase.value = 'error';
				return;
			}
			break;

		case 'theme':
			try {
				const metaRaw = parseThemeCode(res.data);

				const { id, props, desc: description, ...meta } = metaRaw;
				data.value = {
					type: 'theme',
					meta: {
						// description, // 使用されていない
						...meta,
					},
					raw: res.data,
				};
			} catch (err) {
				if (!(err instanceof Error)) {
					throw err;
				}

				switch (err.message.toLowerCase()) {
					case 'this theme is already installed':
						errorKV.value = {
							title: $locale.value.sfc.externalResourceInstallerErrorsThemeParseFailedTitle,
							description: $locale.value.sfc.themeAlreadyInstalled,
						};
						break;

					default:
						errorKV.value = {
							title: $locale.value.sfc.externalResourceInstallerErrorsThemeParseFailedTitle,
							description: $locale.value.sfc.externalResourceInstallerErrorsThemeParseFailedDescription,
						};
						break;
				}
				console.error(err);
				uiPhase.value = 'error';
				return;
			}
			break;

		default:
			errorKV.value = {
				title: $locale.value.sfc.externalResourceInstallerErrorsResourceTypeNotSupportedTitle,
				description: $locale.value.sfc.externalResourceInstallerErrorsResourceTypeNotSupportedDescription,
			};
			uiPhase.value = 'error';
			return;
	}

	uiPhase.value = 'confirm';
}

async function install() {
	if (!data.value) return;

	switch (data.value.type) {
		case 'plugin':
			if (!data.value.meta) return;
			try {
				await installPlugin(data.value.raw, data.value.meta as AiScriptPluginMeta);
				os.success();
				window.setTimeout(() => {
					close_();
				}, 3000);
			} catch (err) {
				errorKV.value = {
					title: $locale.value.sfc.externalResourceInstallerErrorsPluginInstallFailedTitle,
					description: $locale.value.sfc.externalResourceInstallerErrorsPluginInstallFailedDescription,
				};
				console.error(err);
				uiPhase.value = 'error';
			}
			break;
		case 'theme':
			if (!data.value.meta) return;
			await installTheme(data.value.raw);
			os.success();
			window.setTimeout(() => {
				close_();
			}, 3000);
	}
}

const urlParams = new URLSearchParams(window.location.search);
url.value = urlParams.get('url');
hash.value = urlParams.get('hash');
_fetch_();

definePage(() => ({
	title: $locale.value.sfc.externalResourceInstallerTitle,
	icon: 'ti ti-download',
}));
</script>

<style lang="scss" module>
.extInstallerRoot {
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	padding: 1.5rem;
}

.extInstallerIconWrapper {
	width: 48px;
	height: 48px;
	font-size: 24px;
	line-height: 48px;
	text-align: center;
	border-radius: 50%;
	margin-left: auto;
	margin-right: auto;

	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.error .extInstallerIconWrapper {
	background-color: rgba(255, 42, 42, .15);
	color: #ff2a2a;
}

.extInstallerTitle {
	font-size: 1.2rem;
	text-align: center;
	margin: 0;
}

.extInstallerNormDesc {
	text-align: center;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "اغلق",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "هذه السمة مثبتة سلفًا",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"externalResourceInstallerVendorInfoEndpoint": "Punt final referenciat",
	"externalResourceInstallerVendorInfoHashVerify": "Verificació d'integritat ",
	"close": "Tanca",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Paràmetres no vàlids ",
	"externalResourceInstallerErrorsInvalidParamsDescription": "No hi ha suficient informació per carregar les dades del lloc extern. Confirma l'URL que hi ha escrita.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Ha fallat l'obtenció de dades",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "Ha aparegut un error processant les dades carregades del lloc extern. Contacta amb l'administrador.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Ha fallat la verificació de les dades",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "Ha aparegut un error verificant les dades obtingudes. Com a mesura de seguretat la instal·lació no pot continuar. Contacta amb l'administrador.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "Ha aparegut un error comunicant-se amb el lloc extern. Si després d'intentar-ho un altre cop no es resol, contacta amb l'administrador.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "Error d'AiScript",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "Les dades sol·licitades s'han obtingut correctament, però hem trobat un error durant el processament d'AiScript. Contacta amb l'autor de l'afegit. Detalls de l'error es pot veure a la consola JavaScript.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Ha fallat el processament del tema",
	"themeAlreadyInstalled": "Aquest tema ja es troba instal·lat ",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "Les dades sol·licitades s'han obtingut correctament, però hem trobat un error durant el processament del tema. Contacta amb l'autor de l'afegit. Detalls de l'error es pot veure a la consola JavaScript.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "El recurs extern no està suportat.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "Aquesta mena de recurs no està suportat. Contacta amb l'administrador.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "La instal·lació de l'afegit a fallat",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "Ha aparegut un error durant la instal·lació de l'afegit. Intenta-ho una altra vegada. El detall de l'error es pot veure a la consola JavaScript.",
	"externalResourceInstallerTitle": "Instal·lar des d'un lloc extern"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Zavřít",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "Tento vzhled je již nainstalován.",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Close",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "This theme is already installed",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenzierter Endpunkt",
	"externalResourceInstallerVendorInfoHashVerify": "Hash-Verifikation",
	"close": "Schließen",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Ungültige Parameter",
	"externalResourceInstallerErrorsInvalidParamsDescription": "Es fehlen Informationen zum Laden der externen Ressource. Überprüfe die übergebene URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Fehler beim Abrufen der Daten",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "Während dem Auslesen der externen Daten ist ein Fehler aufgetreten. Kontaktiere den Seitenbesitzer.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Datenverifizierung fehlgeschlagen",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "Die Integritätsprüfung der geladenen Daten ist fehlgeschlagen. Aus Sicherheitsgründen kann die Installation nicht fortgesetzt werden. Kontaktiere den Seitenbesitzer.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "Während der Kommunikation mit der externen Seite ist ein Fehler aufgetreten. Kontaktiere den Seitenbesitzer, falls ein erneutes Probieren dieses Problem nicht löst.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript-Fehler",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "Die angeforderten Daten wurden erfolgreich abgerufen, jedoch trat während des AiScript-Parsings ein Fehler auf. Kontaktiere den Autor des Plugins. Detaillierte Fehlerinformationen können über die Javascript-Konsole abgerufen werden.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Parsing des Farbschemas fehlgeschlagen",
	"themeAlreadyInstalled": "Dieses Farbschema ist bereits installiert",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "Die angeforderten Daten wurden erfolgreich abgerufen, jedoch trat während des Farbschema-Parsings ein Fehler auf. Kontaktiere den Autor des Farbschemas. Detaillierte Fehlerinformationen können über die Javascript-Konsole abgerufen werden.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "Diese Ressource wird nicht unterstützt",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "Dieser Ressourcentyp wird nicht unterstützt. Bitte kontaktiere den Seitenbesitzer.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Das Plugin konnte nicht installiert werden",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "Während der Installation des Plugin ist ein Problem aufgetreten. Bitte versuche es erneut. Detaillierte Fehlerinformationen können über die Javascript-Konsole abgerufen werden.",
	"externalResourceInstallerTitle": "Von externer Seite installieren"
}
</locale>

<locale lang="json" locale="en-US">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Close",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "This theme is already installed",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"externalResourceInstallerVendorInfoEndpoint": "Terminal referenciada",
	"externalResourceInstallerVendorInfoHashVerify": "Verificación de hash",
	"close": "Cerrar",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Parámetros inválidos",
	"externalResourceInstallerErrorsInvalidParamsDescription": "No hay información suficiente para cargar datos de un sitio externo. Por favor, confirma la URL introducida.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "No se pudo obtener los datos",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "Ha ocurrido un error al procesar los datos obtenidos del sitio externo. Por favor, contacta con el administrador del sitio.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Verificación de datos fallida",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "Ha ocurrido un error al verificar la integridad de los datos obtenidos. Por seguridad, la instalación no se puede realizar. Por favor, contacta con el administrador del sitio.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "Ha ocurrido un error al comunicarse con el sitio externo. Si no se soluciona tras intentarlo otra vez, por favor, contacta con el administrador del sitio.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "Error de AiScript",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "Los datos se han obtenido correctamente, pero ha ocurrido un error de AiScript al procesarlos. Por favor, contacta con el autor del plugin. Se pueden ver más detalles del error en la consola de Javascript.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Análisis del tema fallido",
	"themeAlreadyInstalled": "Este tema ya está instalado",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "Los datos se han obtenido correctamente, pero ha ocurrido un error al analizar el tema. Por favor, contacta con el autor. Se pueden ver más detalles del error en la consola de Javascript.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "Este recurso externo no es compatible",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "El tipo de este recurso externo no es compatible. Por favor, contacta con el administrador del sitio.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Instalación del plugin fallida.",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "Ha ocurrido un problema al instalar el plugin. Por favor, inténtalo de nuevo. Se pueden ver más detalles del error en la consola de Javascript.",
	"externalResourceInstallerTitle": "Instalar desde sitio externo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"externalResourceInstallerVendorInfoEndpoint": "Point de terminaison référencé",
	"externalResourceInstallerVendorInfoHashVerify": "Vérification de l'intégrité du fichier",
	"close": "Fermer",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Paramètres invalides",
	"externalResourceInstallerErrorsInvalidParamsDescription": "Il y a un manque d'informations nécessaires pour obtenir des données à partir de sites externes. Veuillez vérifier l'URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Échec de récupération des données",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "Les données obtenues à partir du site externe n'ont pas pu être parsées. Veuillez contacter l'administrateur du site.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Échec de vérification des données",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "La vérification de l'intégrité des données fournies a échoué. Pour des raisons de sécurité, l'installation ne peut pas continuer. Veuillez contacter l'administrateur du site.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "La communication avec le site externe a échoué. Si vous réessayez et que cela ne s'améliore pas, veuillez contacter l'administrateur du site.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "Erreur d'AiScript",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "Bien que les données aient été obtenues, elles n'ont pas pu être lues, car il y a eu une erreur lors du parsage d'AiScript. Veuillez contacter l'auteur de l'extension. Pour plus de détails sur l'erreur, veuillez consulter la console JavaScript.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Erreur de parsage du thème",
	"themeAlreadyInstalled": "Ce thème est déjà installé",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "Bien que les données aient été obtenues, elles n'ont pas pu être lues, car il y a eu une erreur lors du parsage du fichier du thème. Veuillez contacter l'auteur du thème. Pour plus de détails sur l'erreur, veuillez consulter la console JavaScript.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "Cette ressource externe n'est pas prise en charge.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "Le type de ressource obtenue à partir de ce site externe n'est pas pris en charge. Veuillez contacter l'administrateur du site.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Échec d'installation de l'extension",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "Il y a eu un problème lors de l'installation de l'extension. Veuillez réessayer. Pour plus de détails sur l'erreur, veuillez consulter la console JavaScript.",
	"externalResourceInstallerTitle": "Installer depuis un site externe"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referensi Endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Verifikasi hash",
	"close": "Tutup",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Parameter tidak valid",
	"externalResourceInstallerErrorsInvalidParamsDescription": "Tidak cukup informasi untuk memuat data dari situs eksternal. Mohon konfirmasi kembali URL yang dimasukkan.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Gagal memuat data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "Kesalahan terjadi dalam memproses data yang dimuat dari situs eksternal. Mohon hubungi administrator dari situs tersebut.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Verifikasi data gagal",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "Kesalahan terjadi dalam memverifikasi integritas data yang diambil. Sebagai pencegahan keamanan, pemasangan tidak dapat dilanjutkan. Mohon hubungi administrator dari situs tersebut.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "Kesalahan terjadi ketika menghubungkan dengan situs eksternal. Jika percobaan kembali tidak dapat memperbaiki masalah ini, mohon hubungi administrator dari situs tersebut.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "Kesalahan AiScript",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "Data yang diminta telah diambil dengan sukses, namun kesalahan terjadi ketika AiScript melakukan parsing. Mohon hubungi pembuat plugin. Detil kesalahan dapat dilihat pada konsol Javascript.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Parsing tema gagal",
	"themeAlreadyInstalled": "Tema telah dipasang",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "Data yang diminta telah diambil dengan sukses, namun kesalahan terjadi ketika tema melakukan parsing. Mohon hubungi pembuat tema. Detil kesalahan dapat dilihat pada konsol Javascript.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "Sumber daya eksternal ini tidak didukung",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "Tipe sumber daya eksternal ini tidak didukung. Mohon kontak administrator dari situs tersebut.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Pemasangan plugin gagal",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "Kesalahan terjadi ketika pemasangan plugin. Mohon coba lagi. Detil kesalahan dapat dilihat pada konsol Javascript.",
	"externalResourceInstallerTitle": "Pasang dari situs eksternal"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"externalResourceInstallerVendorInfoEndpoint": "Punto di riferimento della fonte",
	"externalResourceInstallerVendorInfoHashVerify": "Codice di verifica della fonte",
	"close": "Chiudi",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Parametri non validi",
	"externalResourceInstallerErrorsInvalidParamsDescription": "Mancano alcuni parametri per il caricamento, per favore, verifica la URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Impossibile ottenere i dati",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "Si è verificato un errore elaborando i dati ottenuti dalla fonte. Per favore contattare il distributore.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Dati non verificabili, diversi da quelli della fonte",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "Si è verificato un errore durante la verifica di integrità dei dati ottenuti. Per sicurezza, l'installazione è stata interrotta. Contattare la fonte di distribuzione.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "Si è verificato un errore di comunicazione con la fonte. Se riprovare di nuovo non aiuta, contattare la fonte di distribuzione.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "Errore AiScript",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "Sebbene i dati ottenuti siano validi, non è stato possibile interpretarli, perché si è verificato un errore durante l'analisi di AiScript. Si prega di contattare gli autori del componente aggiuntivo. Potresti controllare la console di Javascript per ottenere dettagli aggiuntivi.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Impossibile interpretare la variazione grafica",
	"themeAlreadyInstalled": "Questo tema è già installato",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "Sebbene i dati siano stati ottenuti, non è stato possibile interpretarli, si è verificato un errore durante l'analisi della variazione grafica. Si prega di contattare gli autori. Potresti anche controllare la console di Javascript per ottenere dettagli aggiuntivi.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "Questa risorsa esterna non è supportata",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "Il tipo di risorsa ottenuta da questo sito esterno non è supportato. Si prega di contattare la fonte di distribuizone.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Impossibile installare il componente aggiuntivo",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "Si è verificato un impedimento durante l'installazione del componente aggiuntivo. Per favore riprova e consulta la console di Javascript per ottenere dettagli aggiuntivi.",
	"externalResourceInstallerTitle": "Installa da sito esterno"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"externalResourceInstallerVendorInfoEndpoint": "参照したエンドポイント",
	"externalResourceInstallerVendorInfoHashVerify": "ファイル整合性の確認",
	"close": "閉じる",
	"externalResourceInstallerErrorsInvalidParamsTitle": "パラメータが不足しています",
	"externalResourceInstallerErrorsInvalidParamsDescription": "外部サイトからデータを取得するために必要な情報が不足しています。URLをお確かめください。",
	"externalResourceInstallerErrorsFailedToFetchTitle": "データの取得に失敗しました",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "外部サイトから取得したデータが読み取れませんでした。サイト管理者にお問い合わせください。",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "正しいデータが取得できませんでした",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "提供されたデータの整合性の確認に失敗しました。セキュリティ上、インストールは続行できません。サイト管理者にお問い合わせください。",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "外部サイトとの通信に失敗しました。もう一度試しても改善しない場合、サイト管理者にお問い合わせください。",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript エラー",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "データは取得できたものの、AiScriptの解析時にエラーがあったため読み込めませんでした。プラグインの作者にお問い合わせください。エラーの詳細はJavascriptコンソールをご確認ください。",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "テーマ解析エラー",
	"themeAlreadyInstalled": "そのテーマは既にインストールされています",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "データは取得できたものの、テーマファイルの解析時にエラーがあったため読み込めませんでした。テーマの作者にお問い合わせください。エラーの詳細はJavascriptコンソールをご確認ください。",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "この外部リソースには対応していません",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "この外部サイトから取得したリソースの種別には対応していません。サイト管理者にお問い合わせください。",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "プラグインのインストールに失敗しました",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "プラグインのインストール中に問題が発生しました。もう一度お試しください。エラーの詳細はJavascriptコンソールをご覧ください。",
	"externalResourceInstallerTitle": "外部サイトからインストール"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"externalResourceInstallerVendorInfoEndpoint": "参照したエンドポイント",
	"externalResourceInstallerVendorInfoHashVerify": "ファイル整合性の確認",
	"close": "さいなら",
	"externalResourceInstallerErrorsInvalidParamsTitle": "パラメータが不足しています",
	"externalResourceInstallerErrorsInvalidParamsDescription": "外部サイトからデータを持ってくるのに欲しい情報が足らへんみたいやわ。URLは合っとる？",
	"externalResourceInstallerErrorsFailedToFetchTitle": "データの取得に失敗しました",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "他のサイトから持ってきたデータ、よう分からんかったわ。サイトの管理してる人に言っといて。",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "ちゃんとしたデータが持ってこれんかったわ",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "もらったデータがなんかおかしいっぽいわ。ちょっと危ないからインストールはできへん。サイト管理してる人に言っといてな。",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "他のサイトに繋がらんかったわ。もっかいやってもダメやったら、サイトの管理してる人に言っといて。",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScriptエラー起こしてもうたねん",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "データは取得できたものの、AiScript解析時にエラーがあったから読み込めへんかってん。すまんが、プラグインを作った人に問い合わせてくれへん？ごめんな。エラーの詳細はJavaScriptコンソール読んでな。",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "テーマ解析エラー",
	"themeAlreadyInstalled": "そのテーマはもうインストールされとるで？",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "データは取れたんやが、テーマファイル読み込んどる時にエラーがあったから読み込めへんかったわ。すまんけど、テーマ作った人に言うてくれへん？ごめんな。エラーの詳細はJavaScriptコンソール読んでな。",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "この外部リソースには対応していません",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "この外部サイトから取得したリソースの種別には対応していません。サイト管理者にお問い合わせください。",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "プラグインのインストール失敗してもた",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "プラグインのインストール中に問題発生してもた、もう1度試してな。エラーの詳細はJavaScriptのコンソール見てや。",
	"externalResourceInstallerTitle": "ほかのサイトからインストール"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Close",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "This theme is already installed",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Close",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "This theme is already installed",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"externalResourceInstallerVendorInfoEndpoint": "참조한 엔드포인트",
	"externalResourceInstallerVendorInfoHashVerify": "파일 무결성 확인",
	"close": "닫기",
	"externalResourceInstallerErrorsInvalidParamsTitle": "파라미터가 부족합니다",
	"externalResourceInstallerErrorsInvalidParamsDescription": "외부 사이트로부터 데이터를 불러오기 위해 필요한 정보가 부족합니다. URL을 다시 한 번 확인하십시오.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "데이터를 불러올 수 없습니다",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "외부 사이트에서 불러온 데이터를 읽어들일 수 없습니다. 사이트 관리자에게 문의하십시오.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "데이터가 올바르지 않습니다.",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "데이터의 무결성 확인에 실패하여, 보안을 위해 설치가 중단되었습니다. 사이트 관리자에게 문의하십시오.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "외부 사이트와의 통신에 실패하였습니다. 여러 번 시도해도 동일한 오류가 표시되는 경우 사이트 관리자에게 문의하십시오.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript 오류",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "데이터를 성공적으로 불러왔으나, AiScript 분석 과정에서 오류가 발생하여 읽어들일 수 없습니다. 플러그인 작성자에게 문의하십시오. 자세한 사항은 브라우저에 내장된 개발자 도구의 Javascript 콘솔에서 확인하실 수 있습니다.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "테마 코드 분석 오류",
	"themeAlreadyInstalled": "이미 설치된 테마입니다",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "데이터를 성공적으로 불러왔으나, 테마 코드 분석 과정에서 오류가 발생하여 읽어들일 수 없습니다. 테마 작성자에게 문의하십시오. 자세한 사항은 브라우저에 내장된 개발자 도구의 Javascript 콘솔에서 확인하실 수 있습니다.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "해당하는 외부 리소스는 지원되지 않습니다.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "외부 사이트의 해당 리소스는 지원되지 않습니다. 사이트 관리자에게 문의하십시오.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "플러그인 설치에 실패했습니다",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "플러그인을 설치하는 도중 문제가 발생하였습니다. 다시 한 번 시도하십시오. 자세한 사항은 브라우저에 내장된 개발자 도구의 Javascript 콘솔에서 확인하실 수 있습니다.",
	"externalResourceInstallerTitle": "외부 사이트로부터 설치"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Sluiten",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "This theme is already installed",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Lukk",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "This theme is already installed",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Zamknij",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "Motyw jest już zainstalowany",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"externalResourceInstallerVendorInfoEndpoint": "Endpoint referenciado",
	"externalResourceInstallerVendorInfoHashVerify": "Verificação de hashes",
	"close": "Fechar",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Parâmetros inválidos",
	"externalResourceInstallerErrorsInvalidParamsDescription": "Não há informações suficientes para carregar dados do site externo. Por favor, confirme o URL inserido.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Não foi possível obter dados",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "Houve um erro processando os dados do site externo. Por favor, contate o administrador do site.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Verificação de dados falhou",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "Houve um erro verificando a integridade do conteúdo obtido. Como medida de segurança, a instalação foi interrompida. Por favor, contate o administrador do site.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "Houve um erro ao comunicar com o site externo. Se tentar novamente não resolver o problema, contate o administrador do site.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "Erro AiScript",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "Os dados solicitados foram obtidos com sucesso, mas houve um erro na leitura do AiScript. Por favor, contate o autor do plugin. Detalhes de erro podem ser vistos no console Javascript.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Erro na leitura do tema",
	"themeAlreadyInstalled": "Esse tema já foi instalado",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "Os dados solicitados foram obtidos com sucesso, mas houve um erro na leitura do tema. Por favor, contate o autor do tema. Detalhes de erro podem ser vistos no console Javascript.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "Esse recurso externo é incompatível",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "Esse tipo de recuso externo é incompatível. Por favor, comunique o administrador do site.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "A instalação do plugin falhou.",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "Houve um problema na instalação do plugin. Por favor, tente novamente. Detalhes de erro podem ser vistos no console Javascript.",
	"externalResourceInstallerTitle": "Instalar de site externo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Закрыть",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "Тема уже установлена.",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Zavrieť",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "Táto téma je už nainštalovaná",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"externalResourceInstallerVendorInfoEndpoint": "จุดอ้างอิงปลายทาง (Referenced endpoint)",
	"externalResourceInstallerVendorInfoHashVerify": "การตรวจสอบแฮช (ความสมบูรณ์ของไฟล์)",
	"close": "ปิด",
	"externalResourceInstallerErrorsInvalidParamsTitle": "พารามิเตอร์ไม่ถูกต้อง",
	"externalResourceInstallerErrorsInvalidParamsDescription": "มีสารสนเทศไม่เพียงพอที่จะโหลดข้อมูลจากไซต์ภายนอก โปรดยืนยัน URL ที่ป้อน",
	"externalResourceInstallerErrorsFailedToFetchTitle": "รับข้อมูลล้มเหลว",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "เกิดข้อผิดพลาดในการประมวลผลข้อมูลที่โหลดจากไซต์ภายนอก โปรดติดต่อผู้ดูแลเว็บไซต์",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "การยืนยัน/ตรวจสอบข้อมูลล้มเหลว",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "เกิดข้อผิดพลาดในการตรวจสอบความสมบูรณ์ของข้อมูลที่ดึงมา เพื่อเป็นมาตรการรักษาความปลอดภัย การติดตั้งไม่สามารถดำเนินการต่อได้ โปรดติดต่อผู้ดูแลเว็บไซต์",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "เกิดข้อผิดพลาดในการสื่อสารกับไซต์ภายนอก หากการลองอีกครั้งไม่สามารถแก้ไขปัญหานี้ได้ โปรดติดต่อผู้ดูแลไซต์",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "ข้อผิดพลาด AiScript",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "ดึงข้อมูลที่ร้องขอสำเร็จแล้ว แต่มีข้อผิดพลาดเกิดขึ้นระหว่างการแยกวิเคราะห์ AiScript โปรดติดต่อผู้เขียนปลั๊กอิน รายละเอียดข้อผิดพลาดสามารถดูได้ในคอนโซล Javascript",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "การแยกวิเคราะห์ธีมล้มเหลว",
	"themeAlreadyInstalled": "ธีมนี้ได้รับการติดตั้งแล้ว",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "ดึงข้อมูลที่ร้องขอสำเร็จแล้ว แต่มีข้อผิดพลาดเกิดขึ้นระหว่างการแยกวิเคราะห์ธีม โปรดติดต่อผู้เขียนธีม รายละเอียดข้อผิดพลาดสามารถดูได้ในคอนโซล Javascript",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "ไม่รองรับทรัพยากรภายนอกนี้",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "ไม่รองรับประเภทของทรัพยากรภายนอกนี้ โปรดติดต่อผู้ดูแลเว็บไซต์",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "ติดตั้งปลั๊กอินล้มเหลว",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "เกิดปัญหาขณะติดตั้งปลั๊กอิน กรุณาลองอีกครั้ง. โปรดดูคอนโซล Javascript สำหรับรายละเอียดข้อผิดพลาด",
	"externalResourceInstallerTitle": "ติดตั้งจากไซต์ภายนอก"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referans uç nokta",
	"externalResourceInstallerVendorInfoHashVerify": "Hash doğrulama",
	"close": "Kapat",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Geçersiz parametreler",
	"externalResourceInstallerErrorsInvalidParamsDescription": "Harici bir siteden veri yüklemek için yeterli bilgi yok. Lütfen girdiğin URL'yi kontrol et.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Veriler alınamadı",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "Harici siteden yüklenen veriler işlenirken bir hata oluştu. Lütfen site yöneticisiyle iletişime geçin.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Veri doğrulama başarısız oldu",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "Alınan verilerin bütünlüğünü doğrularken bir hata oluştu. Güvenlik önlemi olarak, kurulum devam edemez. Lütfen site yöneticisiyle iletişime geçin.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "Harici siteyle iletişim sırasında bir hata oluştu. Tekrar denemen sorunu çözmezse, lütfen site yöneticisine başvur.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Hatası",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "İstenen veriler başarıyla alındı, ancak AiScript ayrıştırma sırasında bir hata oluştu. Lütfen eklenti yazarına başvurun. Hata ayrıntıları Javascript konsolunda görüntülenebilir.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Tema ayrıştırma başarısız oldu",
	"themeAlreadyInstalled": "Bu tema zaten yüklenmiş.",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "İstenen veriler başarıyla alındı, ancak tema ayrıştırma sırasında bir hata oluştu. Lütfen tema yazarıyla iletişime geçin. Hata ayrıntıları Javascript konsolunda görüntülenebilir.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "Bu harici kaynak desteklenmemektedir.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "Bu harici kaynağın türü desteklenmemektedir. Lütfen site yöneticisiyle iletişime geç.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Eklenti kurulumu başarısız oldu",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "Eklenti yükleme sırasında bir sorun oluştu. Lütfen tekrar dene. Hata ayrıntıları Javascript konsolunda görüntülenebilir.",
	"externalResourceInstallerTitle": "Harici siteden yükle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Close",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "This theme is already installed",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Закрити",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "Тему вже встановлено",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"externalResourceInstallerVendorInfoEndpoint": "Referenced endpoint",
	"externalResourceInstallerVendorInfoHashVerify": "Hash verification",
	"close": "Đóng",
	"externalResourceInstallerErrorsInvalidParamsTitle": "Invalid parameters",
	"externalResourceInstallerErrorsInvalidParamsDescription": "There is not enough information to load data from an external site. Please confirm the entered URL.",
	"externalResourceInstallerErrorsFailedToFetchTitle": "Failed to fetch data",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "An error occurred processing the data loaded from the external site. Please contact the site administrator.",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "Data verification failed",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "An error occurred verifying the integrity of the fetched data. As a security measure, installation cannot continue. Please contact the site administrator.",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "An error occurred communicating with the external site. If trying again does not fix this issue, please contact the site administrator.",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript Error",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "The requested data was fetched successfully, but an error occurred during AiScript parsing. Please contact the plugin author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "Theme parsing failed",
	"themeAlreadyInstalled": "Theme này đã được cài đặt",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "The requested data was fetched successfully, but an error occurred during theme parsing. Please contact the theme author. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "This external resource is not supported",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "The type of this external resource is not supported. Please contact the site administrator.",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "Plugin installation failed",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "A problem occurred during plugin installation. Please try again. Error details can be viewed in the Javascript console.",
	"externalResourceInstallerTitle": "Install from external site"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"externalResourceInstallerVendorInfoEndpoint": "参考端点",
	"externalResourceInstallerVendorInfoHashVerify": "确认文件完整性",
	"close": "关闭",
	"externalResourceInstallerErrorsInvalidParamsTitle": "缺少参数",
	"externalResourceInstallerErrorsInvalidParamsDescription": "缺少从外部站点获取数据所需的信息。请检查 URL。",
	"externalResourceInstallerErrorsFailedToFetchTitle": "获取数据失败",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "无法读取从外部站点取得的数据。请联系站点管理员。",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "无法获取正确数据",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "无法验证数据的完整性。安全起见，无法继续安装。请联系站点管理员。",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "与外部站点的通信失败。 如果重试后问题仍然存在，请联系站点管理员。",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript 错误",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "虽然取得了数据，但是由于 AiScript 解析时出现错误，无法读取数据。请联系插件的作者。可在 Javascript 控制台查看错误详情。",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "主题解析错误",
	"themeAlreadyInstalled": "此主题已经安装",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "虽然取得了主题文件，但是由于解析时出现错误，无法加载主题。请联系主题的作者。可在 Javascript 控制台查看错误详情。",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "不支持此外部资源",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "不支持从此外部站点获取的资源类型。请联系站点管理员。",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "插件安装失败",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "安装插件时出现错误。请再试一次。可在 Javascript 控制台查看错误详情。",
	"externalResourceInstallerTitle": "从外部站点安装"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"externalResourceInstallerVendorInfoEndpoint": "引用端點",
	"externalResourceInstallerVendorInfoHashVerify": "確認檔案的完整性",
	"close": "關閉",
	"externalResourceInstallerErrorsInvalidParamsTitle": "缺少參數",
	"externalResourceInstallerErrorsInvalidParamsDescription": "缺少從外部網站取得資料的必要資訊。請檢查 URL 是否正確。",
	"externalResourceInstallerErrorsFailedToFetchTitle": "無法取得資料",
	"externalResourceInstallerErrorsFailedToFetchParseErrorDescription": "無法讀取從外部站點取得的資料。請聯絡網站管理員。",
	"externalResourceInstallerErrorsHashUnmatchedTitle": "無法取得正確資料",
	"externalResourceInstallerErrorsHashUnmatchedDescription": "所提供資料的完整性驗證失敗。出於安全原因，安裝無法繼續。請聯絡網站管理員。",
	"externalResourceInstallerErrorsFailedToFetchFetchErrorDescription": "與外部站點的通訊失敗。如果重試後問題仍然存在，請聯絡網站管理員。",
	"externalResourceInstallerErrorsPluginParseFailedTitle": "AiScript 錯誤",
	"externalResourceInstallerErrorsPluginParseFailedDescription": "已取得資料但解析 AiScript 時發生錯誤，導致無法載入。請聯絡外掛作者。請檢查 Javascript 控制台以取得錯誤詳細資訊。",
	"externalResourceInstallerErrorsThemeParseFailedTitle": "佈景主題解析錯誤",
	"themeAlreadyInstalled": "已安裝此佈景主題",
	"externalResourceInstallerErrorsThemeParseFailedDescription": "已取得資料但解析佈景主題時發生錯誤，導致無法載入。請聯絡佈景主題的作者。請檢查 Javascript 控制台以取得錯誤詳細資訊。",
	"externalResourceInstallerErrorsResourceTypeNotSupportedTitle": "不支援此外部資源。",
	"externalResourceInstallerErrorsResourceTypeNotSupportedDescription": "不支援從此外部網站取得的資源類型。請聯絡網站管理員。",
	"externalResourceInstallerErrorsPluginInstallFailedTitle": "外掛安裝失敗",
	"externalResourceInstallerErrorsPluginInstallFailedDescription": "安裝外掛時出現問題。請再試一次。可參閱 Javascript 控制台以取得錯誤詳細資訊。",
	"externalResourceInstallerTitle": "從外部網站安裝"
}
</locale>
