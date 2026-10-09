<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/security" :label="$locale.sfc.security" :keywords="['security']" icon="ti ti-lock" :inlining="['botProtection']">
			<div class="_gaps_m">
				<XBotProtection/>

				<SearchMarker v-slot="slotProps" :keywords="['sensitive', 'media', 'detection']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-eye-off"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.sensitiveMediaDetection }}</SearchLabel></template>
						<template v-if="sensitiveMediaDetectionForm.savedState.sensitiveMediaDetection === 'all'" #suffix>{{ $locale.sfc.all }}</template>
						<template v-else-if="sensitiveMediaDetectionForm.savedState.sensitiveMediaDetection === 'local'" #suffix>{{ $locale.sfc.localOnly }}</template>
						<template v-else-if="sensitiveMediaDetectionForm.savedState.sensitiveMediaDetection === 'remote'" #suffix>{{ $locale.sfc.remoteOnly }}</template>
						<template v-else #suffix>{{ $locale.sfc.none }}</template>
						<template v-if="sensitiveMediaDetectionForm.modified.value" #footer>
							<MkFormFooter :form="sensitiveMediaDetectionForm"/>
						</template>

						<div class="_gaps_m">
							<div><SearchText>{{ $locale.sfc.description }}</SearchText></div>

							<MkInfo warn><SearchText>{{ $locale.sfc.externalServiceInfo }}</SearchText></MkInfo>

							<MkRadios
								v-model="sensitiveMediaDetectionForm.state.sensitiveMediaDetection"
								:options="[
									{ value: 'none', label: $locale.sfc.none },
									{ value: 'all', label: $locale.sfc.all },
									{ value: 'local', label: $locale.sfc.localOnly },
									{ value: 'remote', label: $locale.sfc.remoteOnly },
								]"
							>
							</MkRadios>

							<SearchMarker :keywords="['api', 'url', 'endpoint', 'sensitive']">
								<MkInput v-model="sensitiveMediaDetectionForm.state.sensitiveMediaDetectionApiUrl" type="url">
									<template #label><SearchLabel>{{ $locale.sfc.apiUrl }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.apiUrlDescription }}</SearchText></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['api', 'key', 'token', 'sensitive']">
								<MkInput v-model="sensitiveMediaDetectionForm.state.sensitiveMediaDetectionApiKey" type="password" autocomplete="new-password">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label><SearchLabel>{{ $locale.sfc.apiKey }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.apiKeyDescription }}</SearchText></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['timeout', 'sensitive']">
								<MkInput v-model="sensitiveMediaDetectionForm.state.sensitiveMediaDetectionTimeout" type="number" :min="1">
									<template #label><SearchLabel>{{ $locale.sfc.timeout }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.timeoutDescription }}</SearchText></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['max', 'images', 'chunk', 'sensitive']">
								<MkInput v-model="sensitiveMediaDetectionForm.state.sensitiveMediaDetectionMaxImagesPerRequest" type="number" :min="1">
									<template #label><SearchLabel>{{ $locale.sfc.maxImagesPerRequest }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.maxImagesPerRequestDescription }}</SearchText></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['sensitivity']">
								<MkRange v-model="sensitiveMediaDetectionForm.state.sensitiveMediaDetectionSensitivity" :min="0" :max="4" :step="1" :textConverter="(v) => `${v + 1}`">
									<template #label><SearchLabel>{{ $locale.sfc.sensitivity }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.sensitivityDescription }}</SearchText></template>
								</MkRange>
							</SearchMarker>

							<SearchMarker :keywords="['video', 'analyze']">
								<MkSwitch v-model="sensitiveMediaDetectionForm.state.enableSensitiveMediaDetectionForVideos">
									<template #label><SearchLabel>{{ $locale.sfc.analyzeVideos }}</SearchLabel><span class="_beta">{{ $locale.sfc.beta }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.analyzeVideosDescription }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker :keywords="['flag', 'automatically']">
								<MkSwitch v-model="sensitiveMediaDetectionForm.state.setSensitiveFlagAutomatically">
									<template #label><SearchLabel>{{ $locale.sfc.setSensitiveFlagAutomatically }}</SearchLabel> ({{ $locale.sfc.notRecommended }})</template>
									<template #caption><SearchText>{{ $locale.sfc.setSensitiveFlagAutomaticallyDescription }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>

							<!-- 現状 false positive が多すぎて実用に耐えない
					<MkSwitch v-model="disallowUploadWhenPredictedAsPorn">
						<template #label>{{ i18n.ts._sensitiveMediaDetection.disallowUploadWhenPredictedAsPorn }}</template>
					</MkSwitch>
					-->
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['email', 'validation']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #label><SearchLabel>Active Email Validation</SearchLabel></template>
						<template v-if="emailValidationForm.savedState.enableActiveEmailValidation" #suffix>Enabled</template>
						<template v-else #suffix>Disabled</template>
						<template v-if="emailValidationForm.modified.value" #footer>
							<MkFormFooter :form="emailValidationForm"/>
						</template>

						<div class="_gaps_m">
							<div><SearchText>{{ $locale.sfc.activeEmailValidationDescription }}</SearchText></div>

							<SearchMarker>
								<MkSwitch v-model="emailValidationForm.state.enableActiveEmailValidation">
									<template #label><SearchLabel>Enable</SearchLabel></template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker>
								<MkSwitch v-model="emailValidationForm.state.enableVerifymailApi">
									<template #label><SearchLabel>Use Verifymail.io API</SearchLabel></template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker>
								<MkInput v-model="emailValidationForm.state.verifymailAuthKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label><SearchLabel>Verifymail.io API Auth Key</SearchLabel></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker>
								<MkSwitch v-model="emailValidationForm.state.enableTruemailApi">
									<template #label><SearchLabel>Use TrueMail API</SearchLabel></template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker>
								<MkInput v-model="emailValidationForm.state.truemailInstance">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label><SearchLabel>TrueMail API Instance</SearchLabel></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker>
								<MkInput v-model="emailValidationForm.state.truemailAuthKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label><SearchLabel>TrueMail API Auth Key</SearchLabel></template>
								</MkInput>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['banned', 'email', 'domains', 'blacklist']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #label><SearchLabel>Banned Email Domains</SearchLabel></template>
						<template v-if="bannedEmailDomainsForm.modified.value" #footer>
							<MkFormFooter :form="bannedEmailDomainsForm"/>
						</template>

						<div class="_gaps_m">
							<SearchMarker>
								<MkTextarea v-model="bannedEmailDomainsForm.state.bannedEmailDomains">
									<template #label><SearchLabel>Banned Email Domains List</SearchLabel></template>
								</MkTextarea>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['log', 'ipAddress']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #label><SearchLabel>Log IP address</SearchLabel></template>
						<template v-if="ipLoggingForm.savedState.enableIpLogging" #suffix>Enabled</template>
						<template v-else #suffix>Disabled</template>
						<template v-if="ipLoggingForm.modified.value" #footer>
							<MkFormFooter :form="ipLoggingForm"/>
						</template>

						<div class="_gaps_m">
							<SearchMarker>
								<MkSwitch v-model="ipLoggingForm.state.enableIpLogging">
									<template #label><SearchLabel>Enable</SearchLabel></template>
								</MkSwitch>
							</SearchMarker>
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
import XBotProtection from '@features/auth/frontend/pages/admin/bot-protection.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { fetchInstance } from '@features/instance/frontend/instance.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useForm } from '@features/ui/frontend/composables/use-form.js';
import MkFormFooter from '@features/ui/frontend/components/MkFormFooter.vue';

const meta = await misskeyApi('admin/meta');

const sensitiveMediaDetectionForm = useForm({
	sensitiveMediaDetection: meta.sensitiveMediaDetection,
	sensitiveMediaDetectionSensitivity: meta.sensitiveMediaDetectionSensitivity === 'veryLow' ? 0 :
	meta.sensitiveMediaDetectionSensitivity === 'low' ? 1 :
	meta.sensitiveMediaDetectionSensitivity === 'medium' ? 2 :
	meta.sensitiveMediaDetectionSensitivity === 'high' ? 3 :
	meta.sensitiveMediaDetectionSensitivity === 'veryHigh' ? 4 : 0,
	setSensitiveFlagAutomatically: meta.setSensitiveFlagAutomatically,
	enableSensitiveMediaDetectionForVideos: meta.enableSensitiveMediaDetectionForVideos,
	sensitiveMediaDetectionApiUrl: meta.sensitiveMediaDetectionApiUrl,
	sensitiveMediaDetectionApiKey: meta.sensitiveMediaDetectionApiKey,
	sensitiveMediaDetectionTimeout: meta.sensitiveMediaDetectionTimeout,
	sensitiveMediaDetectionMaxImagesPerRequest: meta.sensitiveMediaDetectionMaxImagesPerRequest,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		sensitiveMediaDetection: state.sensitiveMediaDetection,
		sensitiveMediaDetectionSensitivity:
			state.sensitiveMediaDetectionSensitivity === 0 ? 'veryLow' :
			state.sensitiveMediaDetectionSensitivity === 1 ? 'low' :
			state.sensitiveMediaDetectionSensitivity === 2 ? 'medium' :
			state.sensitiveMediaDetectionSensitivity === 3 ? 'high' :
			state.sensitiveMediaDetectionSensitivity === 4 ? 'veryHigh' :
			null as never,
		setSensitiveFlagAutomatically: state.setSensitiveFlagAutomatically,
		enableSensitiveMediaDetectionForVideos: state.enableSensitiveMediaDetectionForVideos,
		sensitiveMediaDetectionApiUrl: state.sensitiveMediaDetectionApiUrl,
		sensitiveMediaDetectionApiKey: state.sensitiveMediaDetectionApiKey,
		sensitiveMediaDetectionTimeout: state.sensitiveMediaDetectionTimeout,
		sensitiveMediaDetectionMaxImagesPerRequest: state.sensitiveMediaDetectionMaxImagesPerRequest,
	});
	fetchInstance(true);
});

const ipLoggingForm = useForm({
	enableIpLogging: meta.enableIpLogging,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableIpLogging: state.enableIpLogging,
	});
	fetchInstance(true);
});

const emailValidationForm = useForm({
	enableActiveEmailValidation: meta.enableActiveEmailValidation,
	enableVerifymailApi: meta.enableVerifymailApi,
	verifymailAuthKey: meta.verifymailAuthKey,
	enableTruemailApi: meta.enableTruemailApi,
	truemailInstance: meta.truemailInstance,
	truemailAuthKey: meta.truemailAuthKey,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableActiveEmailValidation: state.enableActiveEmailValidation,
		enableVerifymailApi: state.enableVerifymailApi,
		verifymailAuthKey: state.verifymailAuthKey,
		enableTruemailApi: state.enableTruemailApi,
		truemailInstance: state.truemailInstance,
		truemailAuthKey: state.truemailAuthKey,
	});
	fetchInstance(true);
});

const bannedEmailDomainsForm = useForm({
	bannedEmailDomains: meta.bannedEmailDomains?.join('\n') || '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		bannedEmailDomains: state.bannedEmailDomains.split('\n'),
	});
	fetchInstance(true);
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.security,
	icon: 'ti ti-lock',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"security": "الأمان",
	"sensitiveMediaDetection": "التعرف على المحتوى الحساس",
	"all": "الكل",
	"localOnly": "المحلي فقط",
	"remoteOnly": "بُعدي فقط",
	"none": "لا شيء",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "بيتا",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Mark as sensitive",
	"notRecommended": "غير مستحسن",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "يتحقق من صحة عنوان البريد الإلكتروني بشكل أكثر حزمًا وذلك عبر تحديد ما إذا كان عنوان بريد إلكتروني مؤقت وإمكانية التواصل معه. إذا لم يحدد هذا الخيار فسيتحقق من نسق عنوان البريد الإلكتروني."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"security": "Seguretat",
	"sensitiveMediaDetection": "Detecció de contingut sensible",
	"all": "Tot",
	"localOnly": "Només local",
	"remoteOnly": "Només remot",
	"none": "Res",
	"description": "Redueix els esforços de moderació gràcies al reconeixement automàtic dels fitxers amb contingut sensible mitjançant Machine Learing. Això augmentarà la càrrega del servidor.",
	"externalServiceInfo": "La detecció de mitjans sensibles s'ha delegat a un servei extern (sensitive-detector). Per utilitzar aquesta funció, cal configurar un servei sidecar separat i establir els detalls de connexió que es detallen a continuació. Si no es configuren els detalls de connexió, no es durà a terme cap detecció (el contingut es tractarà com a no sensible).",
	"apiUrl": "URL per connectar-se al servei de verificació",
	"apiUrlDescription": "L'URL base del servei de detector de sensibilitat (per exemple, http://localhost:3009). Si us connecteu a un servei en una xarxa privada, afegiu la xarxa de destinació a la configuració `allowedPrivateNetworks` del fitxer de configuració. Si utilitzeu un proxy, configureu també `proxyBypassHosts`. Si es deixa en blanc, no es realitzaran comprovacions de sensibilitat.",
	"apiKey": "Clau de l'API",
	"apiKeyDescription": "Introduïu això si l'autenticació (token Bearer) està configurada al costat del servei d'autenticació. Si no està configurada, deixeu aquest camp en blanc.",
	"timeout": "Temps d'espera (mil·lisegons)",
	"timeoutDescription": "1 Aquesta és la durada del temps mort per sol·licitud de validació.",
	"maxImagesPerRequest": "1 Nombre màxim d'imatges per sol·licitud",
	"maxImagesPerRequestDescription": "1 Quan s'analitzen múltiples fotogrames, com en un vídeo, aquest és el nombre màxim d'imatges que es poden enviar en una única petició. Qualsevol imatge que superi aquest límit es dividirà en parts i s'enviarà seqüencialment. Assegureu-vos que aquest ajust no superi el valor de `maxParts` al costat del `sensitive-detector` (per defecte: 10). Si es supera aquest límit, totes les imatges d'aquest lot es consideraran no sensibles.",
	"sensitivity": "Sensibilitat de la detecció ",
	"sensitivityDescription": "Reduint la sensibilitat provocarà menys falsos positius. D'altra banda incrementant-ho generarà més falsos negatius.",
	"analyzeVideos": "Activar anàlisis de vídeos ",
	"beta": "Proves",
	"analyzeVideosDescription": "Analitzar els vídeos a més de les imatges. Això incrementarà lleugerament la càrrega del servidor.",
	"setSensitiveFlagAutomatically": "Marcar com a sensible",
	"notRecommended": "No recomanat",
	"setSensitiveFlagAutomaticallyDescription": "Els resultats de la detecció interna seran desats, inclòs si aquesta opció es troba desactivada.",
	"activeEmailValidationDescription": "Activa la validació estricta de comptes de correu electrònic, inclou la validació d'adreces d'un sol ús i si es possible comunicar-se amb aquestes. Quan es troba desactivada només es vàlida el format del correu electrònic."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"security": "Zabezpečení",
	"sensitiveMediaDetection": "Detekce citlivého média",
	"all": "Vše",
	"localOnly": "Jenom lokální",
	"remoteOnly": "Jenom vzdáleně",
	"none": "Žádný",
	"description": "Snižuje náročnost moderování serveru díky automatickému rozpoznávání citlivých médií pomocí strojového učení. Tím se mírně zvýší zatížení serveru.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detekce citlivosti",
	"sensitivityDescription": "Snížení citlivosti povede k menšímu počtu chybných detekcí (falešně pozitivních), zatímco její zvýšení povede k menšímu počtu chybných detekcí (falešně negativních).",
	"analyzeVideos": "Povolit analýzy videí",
	"beta": "Beta verze",
	"analyzeVideosDescription": "Kromě obrázků analyzuje i videa. Tím se mírně zvýší zatížení serveru.",
	"setSensitiveFlagAutomatically": "Označit jako citlivé",
	"notRecommended": "Nedoporučuje se",
	"setSensitiveFlagAutomaticallyDescription": "Výsledky interní detekce se zachovají, i když je tato možnost vypnutá.",
	"activeEmailValidationDescription": "Umožňuje striktní validaci emailové adresy, která zahrnuje kontrolu pro jednorázové adresy a pokud je možno s ní komunikovat. Pokud je to vypnuté, bude se kontrolovat pouze formát emailu."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"security": "Security",
	"sensitiveMediaDetection": "Detection of sensitive media",
	"all": "All",
	"localOnly": "Local only",
	"remoteOnly": "Remote only",
	"none": "None",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Mark as sensitive",
	"notRecommended": "Not recommended",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Enables stricter validation of email addresses, which includes checking for disposable addresses and by whether it can actually be communicated with. When unchecked, only the format of the email is validated."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"security": "Sicherheit",
	"sensitiveMediaDetection": "Erkennung von sensiblen Medien",
	"all": "Alle",
	"localOnly": "Nur Lokal",
	"remoteOnly": "Nur für fremde Instanzen",
	"none": "Nichts",
	"description": "Ermöglicht eine Erleichterung der Servermoderation durch die automatische Erkennungen von sensiblen Medien unter Verwendung von Machine Learning. Hierdurch wird die Serverlast etwas erhöht.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Erkennungssensitivität",
	"sensitivityDescription": "Durch das Senken der Sensitivität kann die Anzahl an Fehlerkennungen (sog. false positives) reduziert werden. Durch ein Erhöhen dieser kann die Anzahl an verpassten Erkennungen (sog. false negatives) reduziert werden.",
	"analyzeVideos": "Videoanalyse aktivieren",
	"beta": "Beta",
	"analyzeVideosDescription": "Analysiert zusätzlich zu Bildern auch Videos. Die Last des Servers wird hierdurch etwas erhöht.",
	"setSensitiveFlagAutomatically": "Als sensibel markieren",
	"notRecommended": "Nicht empfohlen",
	"setSensitiveFlagAutomaticallyDescription": "Die Resultate der internen Erkennung werden beibehalten, auch wenn diese Option deaktiviert ist.",
	"activeEmailValidationDescription": "Aktivert strengere Überprüfung von E-Mail-Adressen, d.h. Testen auf Wegwerfadressen und darauf, ob mit der Adresse tatsächlich kommuniziert werden kann. Ist dies deaktiviert, so wird nur das Format der E-Mail überprüft."
}
</locale>

<locale locale="en-US" lang="json">
{
	"security": "Security",
	"sensitiveMediaDetection": "Detection of sensitive media",
	"all": "All",
	"localOnly": "Local only",
	"remoteOnly": "Remote only",
	"none": "None",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Mark as sensitive",
	"notRecommended": "Not recommended",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Enables stricter validation of email addresses, which includes checking for disposable addresses and by whether it can actually be communicated with. When unchecked, only the format of the email is validated."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"security": "Seguridad",
	"sensitiveMediaDetection": "Detección de contenido NSFW",
	"all": "Todo",
	"localOnly": "Solo local",
	"remoteOnly": "Sólo remoto",
	"none": "Ninguna",
	"description": "Reduce el esfuerzo de la moderación en el servidor a través del reconocimiento automático de contenido NSFW usando 'Machine Learning'. Esto puede incrementar ligeramente la carga en el servidor.",
	"externalServiceInfo": "La detección de contenidos sensibles se ha externalizado a un servicio externo (sensitive-detector). Para utilizar esta función, es necesario configurar por separado un servicio «sidecar» y establecer los datos de conexión que se indican a continuación. Si no se configuran los datos de conexión, no se realizará la detección (se tratará como contenido no sensible).",
	"apiUrl": "URL de conexión al servicio de verificación",
	"apiUrlDescription": "URL base del servicio «sensitive-detector» (por ejemplo: http://localhost:3009). Si te conectas a un servicio situado en una red privada, debes permitir la red de destino en el parámetro «allowedPrivateNetworks» del archivo de configuración. Si utilizas un proxy, configura también el parámetro «proxyBypassHosts». Si se deja en blanco, no se realizará la evaluación de datos sensibles.",
	"apiKey": "Clave API",
	"apiKeyDescription": "Introduce este dato si se ha configurado la autenticación (token Bearer) en el servicio de validación. Si no se ha configurado, déjalo en blanco.",
	"timeout": "Tiempo de espera (milisegundos)",
	"timeoutDescription": "Duración del tiempo de espera para cada solicitud de resolución.",
	"maxImagesPerRequest": "Número máximo de imágenes por solicitud",
	"maxImagesPerRequestDescription": "Es el número máximo de imágenes que se pueden enviar en una sola solicitud al analizar varios fotogramas, como en un vídeo. Las imágenes que superen este límite se dividirán y se enviarán de forma secuencial. Configúralo de manera que no se supere el valor de «maxParts» de sensitive-detector (por defecto: 10). Si se supera este límite, todas las imágenes de ese fragmento se considerarán no sensibles.",
	"sensitivity": "Sensibilidad de la detección",
	"sensitivityDescription": "Reducir la sensibilidad puede acarrear a varios falsos positivos, mientras que incrementarla puede reducir las detecciones (falsos negativos).",
	"analyzeVideos": "Habilitar el análisis de videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analizar videos en adición a las imágenes. Esto puede incrementar ligeramente la carga del servidor.",
	"setSensitiveFlagAutomatically": "Marcar como NSFW",
	"notRecommended": "obsoleto",
	"setSensitiveFlagAutomaticallyDescription": "Los resultados de la detección interna pueden ser retenidos incluso si la opción está desactivada.",
	"activeEmailValidationDescription": "Habilita la validación estricta de direcciones de correo electrónico, lo cual incluye la revisión de direcciones desechables y si se puede comunicar con éstas. Cuando está deshabilitado, sólo el formato de la dirección es validado."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"security": "Sécurité",
	"sensitiveMediaDetection": "Détection des médias sensibles",
	"all": "Tous",
	"localOnly": "Local seulement",
	"remoteOnly": "Distant uniquement",
	"none": "Rien",
	"description": "L'apprentissage automatique peut être utilisé pour détecter automatiquement les médias sensibles à modérer. La sollicitation des serveurs augmente légèrement.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Sensibilité de la détection",
	"sensitivityDescription": "Une sensibilité plus faible réduit les faux positifs. Une sensibilité plus élevée réduit les omissions (faux négatifs).",
	"analyzeVideos": "Activer l’analyse de vidéos",
	"beta": "Bêta",
	"analyzeVideosDescription": "Veillez à ce que les vidéos soient analysées en plus des images fixes. La sollicitation des serveurs augmentera légèrement.",
	"setSensitiveFlagAutomatically": "Définir le drapeau NSFW.",
	"notRecommended": "Déconseillé",
	"setSensitiveFlagAutomaticallyDescription": "Même si ce paramètre est désactivé, le résultat de la décision est conservé en interne.",
	"activeEmailValidationDescription": "Valide l'adresse électronique d'un utilisateur de manière plus agressive en déterminant s'il s'agit d'une adresse électronique jetable et si l'on peut effectivement communiquer avec elle. Si cette option n'est pas cochée, l'adresse électronique n'est vérifiée que sous forme de chaîne de caractères."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"security": "Keamanan",
	"sensitiveMediaDetection": "Deteksi media NSFW",
	"all": "Semua",
	"localOnly": "Hanya lokal",
	"remoteOnly": "Hanya luar instansi",
	"none": "Tidak ada",
	"description": "Mengurangi usaha moderasi peladen dengan mengenali media NSFW secara otomatis menggunakan Pembelajaran Mesin. Fungsi ini akan sedikit menaikkan beban peladen.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Sensitivitas deteksi",
	"sensitivityDescription": "Mengurangi sensitivitas akan mengurangi misdeteksi (false positive) sedangkan meningkatkannya akan menambah misdeteksi (false positive).",
	"analyzeVideos": "Nyalakan analisis terhadap video",
	"beta": "Beta",
	"analyzeVideosDescription": "Analisa video sebagai tambahan dari gambar. Ini akan sedikit meningkatkan beban ke peladen.",
	"setSensitiveFlagAutomatically": "Tandai sebagai NSFW",
	"notRecommended": "Tidak disarankan",
	"setSensitiveFlagAutomaticallyDescription": "Hasil dari deteksi internal akan dipertahankan meskipun fungsi ini dimatikan.",
	"activeEmailValidationDescription": "Membolehkan validasi alamat surel ketat dengan mengecek apakah alamat surel tersebut temporer dan bisa berkomunikasi dengan surel tersebut. Ketidak tidak dicentang, hanya format surel yang divalidasi."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"security": "Sicurezza",
	"sensitiveMediaDetection": "Rilevamento dei contenuti espliciti",
	"all": "Tutte",
	"localOnly": "Soltanto locale",
	"remoteOnly": "Solo remoto",
	"none": "Nessuna",
	"description": "Utilizzare l'apprendimento automatico (machine learning) per riconoscere media espliciti e sottoporli alla moderazione. Aumenterà lievemente il carico del server.",
	"externalServiceInfo": "Abbiamo spostato esternamente il riconoscimento di media espliciti (sensitive-detector). Per usufruirne devi impostare un servizio separato e indicare di seguito la destinazione. Se non è impostata, non viene emesso alcun giudizio (contenuto NON esplicito).",
	"apiUrl": "URL di connessione a Sensitive-Detector",
	"apiUrlDescription": "L'URL di base del servizio (ad esempio http://localhost:3009). Collegandosi a una rete privata, autorizzare la rete nel parametro allowedPrivateNetworks nel file di configurazione.\nCollegandosi con un proxy, è anche necessario impostare proxyBypassHosts. Nel caso il campo sia vuoto, non vengono emessi giudizi di sensibilità.",
	"apiKey": "Chiave API",
	"apiKeyDescription": "Indicare il token di autenticazione (Bearer token), soltanto se occorre, altrimenti lasciare vuoto.",
	"timeout": "Timeout (ms)",
	"timeoutDescription": "Tempo limite per ogni richiesta",
	"maxImagesPerRequest": "Numero massimo di media per ogni richiesta",
	"maxImagesPerRequestDescription": "In caso ci siano più fotogrammi, come nei video, questo è il numero massimo di immagini da inviare in una richiesta. Oltre questo numero, il totale sarà diviso e inviato in sequenza.\nImpostare in modo che non superi il valore maxParts (default: 10) in Sensitive-Detector. Se viene superato, il media sarà considerato non esplicito.",
	"sensitivity": "Sensibilità del rilevamento",
	"sensitivityDescription": "Abbassando la sensibilità si riducono i falsi positivi (rilevazioni errate). Aumentando la sensibilità si riduce il numero di rilevazioni mancate. (rilevazioni ignorate).",
	"analyzeVideos": "Abilitazione dell'analisi video.",
	"beta": "Versione beta",
	"analyzeVideosDescription": "Assicuratevi che vengano analizzati anche i video oltre alle immagini fisse. Il carico del server aumenterà leggermente.",
	"setSensitiveFlagAutomatically": "Impostare il flag NSFW.",
	"notRecommended": "Sconsigliato",
	"setSensitiveFlagAutomaticallyDescription": "Anche se questa impostazione è disattivata, il risultato della decisione viene conservato internamente.",
	"activeEmailValidationDescription": "Convalida l'indirizzo e-mail di un utente in modo più aggressivo, determinando se si tratta di un indirizzo e-mail scartato e se è possibile comunicare con esso. Se non è selezionata, l'indirizzo e-mail viene controllato per verificarne la correttezza solo come stringa."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"security": "セキュリティ",
	"sensitiveMediaDetection": "センシティブなメディアの検出",
	"all": "全て",
	"localOnly": "ローカルのみ",
	"remoteOnly": "リモートのみ",
	"none": "なし",
	"description": "機械学習を使って自動でセンシティブなメディアを検出し、モデレーションに役立てることができます。サーバーの負荷が少し増えます。",
	"externalServiceInfo": "センシティブメディアの判定は外部サービス (sensitive-detector) に分離されました。この機能を利用するには、別途サイドカーサービスをセットアップし、下記の接続先を設定する必要があります。接続先が未設定の場合、判定は行われません (非センシティブ扱い)。",
	"apiUrl": "判定サービスの接続先URL",
	"apiUrlDescription": "sensitive-detector サービスのベースURL (例: http://localhost:3009)。プライベートネットワーク上のサービスに接続する場合は、設定ファイルの allowedPrivateNetworks で接続先ネットワークを許可してください。プロキシを使用している場合は、proxyBypassHosts も設定してください。空欄の場合、センシティブ判定は行われません。",
	"apiKey": "APIキー",
	"apiKeyDescription": "判定サービス側で認証 (Bearerトークン) を設定している場合に入力します。設定していない場合は空欄のままにしてください。",
	"timeout": "タイムアウト (ミリ秒)",
	"timeoutDescription": "判定リクエスト1回あたりのタイムアウト時間です。",
	"maxImagesPerRequest": "1リクエストあたりの最大画像数",
	"maxImagesPerRequestDescription": "動画など複数フレームを判定する際、1回のリクエストにまとめて送る画像の最大枚数です。これを超える分は分割して順次送信されます。sensitive-detector 側の maxParts 設定（デフォルト: 10）を超えないように設定してください。超えた場合、そのチャンクは全件非センシティブ扱いとなります。",
	"sensitivity": "検出感度",
	"sensitivityDescription": "感度を低くすると、誤検知(偽陽性)が減ります。感度を高くすると、検知漏れ(偽陰性)が減ります。",
	"analyzeVideos": "動画の解析を有効化",
	"beta": "ベータ",
	"analyzeVideosDescription": "静止画に加えて動画も解析するようにします。サーバーの負荷が少し増えます。",
	"setSensitiveFlagAutomatically": "センシティブフラグを設定する",
	"notRecommended": "非推奨",
	"setSensitiveFlagAutomaticallyDescription": "この設定をオフにしても内部的に判定結果は保持されます。",
	"activeEmailValidationDescription": "ユーザーのメールアドレスのバリデーションを、捨てアドかどうかや実際に通信可能かどうかなどを判定しより積極的に行います。オフにすると単に文字列として正しいかどうかのみチェックされます。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"security": "セキュリティ",
	"sensitiveMediaDetection": "きわどいやつの検出",
	"all": "みんな",
	"localOnly": "ローカルだけ",
	"remoteOnly": "リモートだけ",
	"none": "なし",
	"description": "機械学習で自動できわどいメディアを検出して、運営しやすくするで。でもサーバーが少し重くなってまうわ。",
	"externalServiceInfo": "センシティブメディアの判定は外部サービス (sensitive-detector) に分離されました。この機能を利用するには、別途サイドカーサービスをセットアップし、下記の接続先を設定する必要があります。接続先が未設定の場合、判定は行われません (非センシティブ扱い)。",
	"apiUrl": "判定サービスの接続先URL",
	"apiUrlDescription": "sensitive-detector サービスのベースURL (例: http://localhost:3009)。プライベートネットワーク上のサービスに接続する場合は、設定ファイルの allowedPrivateNetworks で接続先ネットワークを許可してください。プロキシを使用している場合は、proxyBypassHosts も設定してください。空欄の場合、センシティブ判定は行われません。",
	"apiKey": "APIキー",
	"apiKeyDescription": "判定サービス側で認証 (Bearerトークン) を設定している場合に入力します。設定していない場合は空欄のままにしてください。",
	"timeout": "タイムアウト (ミリ秒)",
	"timeoutDescription": "判定リクエスト1回あたりのタイムアウト時間です。",
	"maxImagesPerRequest": "1リクエストあたりの最大画像数",
	"maxImagesPerRequestDescription": "動画など複数フレームを判定する際、1回のリクエストにまとめて送る画像の最大枚数です。これを超える分は分割して順次送信されます。sensitive-detector 側の maxParts 設定（デフォルト: 10）を超えないように設定してください。超えた場合、そのチャンクは全件非センシティブ扱いとなります。",
	"sensitivity": "検出感度やで",
	"sensitivityDescription": "感度を低くすると、誤検知(偽陽性)が減るで。感度を高くすると、検知漏れ(偽陰性)が減るで。",
	"analyzeVideos": "動画の解析をオンにするで",
	"beta": "ベータ",
	"analyzeVideosDescription": "画像だけじゃなくて動画も解析するようにするで。サーバーがちょっと重くなるで。",
	"setSensitiveFlagAutomatically": "センシティブフラグを設定するで",
	"notRecommended": "あんま推奨しやんで",
	"setSensitiveFlagAutomaticallyDescription": "この設定切っても内部的には判定結果はそのままや。",
	"activeEmailValidationDescription": "ユーザーのメアドのバリデーションを、捨てアドかどうかとか、ちゃんと通信できるかとかを見るで。切ったら単に文字列として合っとるかどうかだけ見るわ。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"security": "Taɣellist",
	"sensitiveMediaDetection": "Detection of sensitive media",
	"all": "All",
	"localOnly": "Local only",
	"remoteOnly": "Remote only",
	"none": "None",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Mark as sensitive",
	"notRecommended": "Not recommended",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Enables stricter validation of email addresses, which includes checking for disposable addresses and by whether it can actually be communicated with. When unchecked, only the format of the email is validated."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"security": "Security",
	"sensitiveMediaDetection": "Detection of sensitive media",
	"all": "All",
	"localOnly": "Local only",
	"remoteOnly": "Remote only",
	"none": "None",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Mark as sensitive",
	"notRecommended": "Not recommended",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Enables stricter validation of email addresses, which includes checking for disposable addresses and by whether it can actually be communicated with. When unchecked, only the format of the email is validated."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"security": "보안",
	"sensitiveMediaDetection": "민감한 미디어 탐지",
	"all": "전체",
	"localOnly": "로컬에만",
	"remoteOnly": "리모트만",
	"none": "없음",
	"description": "기계 학습으로 민감한 미디어를 알아서 찾아내어 조정에 참고하도록 합니다. 서버가 부하를 다소 받습니다.",
	"externalServiceInfo": "민감한 미디어 판정은 외부 서비스(sensitive-detector)로 분리됐습니다. 이 기능을 이용하려면 별도 사이드카 서비스를 설정하고, 아래의 접속 위치를 설정해야 합니다. 접속 위치가 설정되지 않은 경우에는 판정이 이루어지지 않습니다. (민감하지 않음 처리)",
	"apiUrl": "판정 서비스의 접속 위치 URL",
	"apiUrlDescription": "sensitive-detector 서비스의 베이스 URL(예시: http://localhost:3009). 프라이빗 네트워크상의 서비스에 접속하는 경우에는 설정 파일의 allowedPrivateNetworks로 접속 위치 네트워크를 허가해 주십시오. 프록시를 사용하고 있는 경우에는 proxyBypassHosts도 설정해 주십시오. 비어있으면 민감함 판정은 이루어지지 않습니다.",
	"apiKey": "API 키",
	"apiKeyDescription": "판정 서비스 측에서 인증(Bearer 토큰)을 설정하고 있는 경우에 입력합니다. 설정하고 있지 않은 경우에는 빈칸으로 둬주십시오.",
	"timeout": "타임아웃 (밀리초)",
	"timeoutDescription": "판정 요청 1회당 타임아웃 시간입니다.",
	"maxImagesPerRequest": "한 요청당 최대 이미지 수",
	"maxImagesPerRequestDescription": "동영상 등 여러 프레임을 판정할 때, 한 번의 요청에 모아서 보내는 이미지의 최대 장수입니다. 이를 넘으면 분할해 순차적으로 송신됩니다. sensitive-detector 측의 maxParts 설정(기본: 10)을 남지 않도록 설정해 주십시오. 넘은 경우에는 그 청크는 전부 민감하지 않음 처리로 됩니다.",
	"sensitivity": "탐지 민감도",
	"sensitivityDescription": "민감도가 낮을수록 안전한 미디어가 잘못 탐지될 확률이 줄어들며, 높을수록 민감한 미디어가 탐지되지 않을 확률이 줄어듭니다.",
	"analyzeVideos": "동영상도 같이 확인하기",
	"beta": "베타",
	"analyzeVideosDescription": "사진 뿐만 아니라 동영상의 NSFW 여부도 탐지합니다. 서버의 부하를 약간 증가시킵니다.",
	"setSensitiveFlagAutomatically": "자동으로 NSFW로 설정하기",
	"notRecommended": "추천하지 않음",
	"setSensitiveFlagAutomaticallyDescription": "이 설정을 해제해도 탐지 결과는 유지됩니다.",
	"activeEmailValidationDescription": "유저가 입력한 메일 주소가 일회용 메일인지, 실제로 통신할 수 있는 지 엄격하게 검사합니다. 해제할 경우 이메일 형식에 대해서만 검사합니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"security": "Beveiliging",
	"sensitiveMediaDetection": "Detection of sensitive media",
	"all": "Alle",
	"localOnly": "Local only",
	"remoteOnly": "Remote only",
	"none": "Niets",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Mark as sensitive",
	"notRecommended": "Niet aanbevolen",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Enables stricter validation of email addresses, which includes checking for disposable addresses and by whether it can actually be communicated with. When unchecked, only the format of the email is validated."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"security": "Sikkerhet",
	"sensitiveMediaDetection": "Detection of sensitive media",
	"all": "Alle",
	"localOnly": "Local only",
	"remoteOnly": "Remote only",
	"none": "Ingen",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Mark as sensitive",
	"notRecommended": "Not recommended",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Enables stricter validation of email addresses, which includes checking for disposable addresses and by whether it can actually be communicated with. When unchecked, only the format of the email is validated."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"security": "Bezpieczeństwo",
	"sensitiveMediaDetection": "Detekcja wrażliwej zawartości",
	"all": "Wszystkie",
	"localOnly": "Lokalne tylko",
	"remoteOnly": "Tylko zdalne instancje",
	"none": "Brak",
	"description": "Zmniejsza wysiłek związany z moderacją serwera dzięki automatycznemu rozpoznawaniu zawartości NSFW za pomocą uczenia maszynowego. To nieznacznie zwiększy obciążenie serwera.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Oznacz jako NSFW",
	"notRecommended": "Nie zalecane",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Włącza bardziej restrykcyjną walidację adresów e-mail, co obejmuje sprawdzanie adresów jednorazowych i czy komunikacja z tym adresem jest możliwa. Gdy wyłączone, tylko format adresu e-mail jest sprawdzany."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"security": "Segurança",
	"sensitiveMediaDetection": "Detecção de conteúdo sensível",
	"all": "Todos",
	"localOnly": "Apenas local",
	"remoteOnly": "Apenas remoto",
	"none": "Nenhum",
	"description": "Use o aprendizado de máquina para detectar automaticamente mídias sensíveis para moderação. Isso pode aumentar ligeiramente a carga no servidor.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detecção de sensibilidade",
	"sensitivityDescription": "Ao reduzir a sensibilidade, as detecções incorretas (falsos positivos) diminuem. Ao aumentar a sensibilidade, as falhas de detecção (falsos negativos) diminuem.",
	"analyzeVideos": "Habilitar análise de vídeos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analisa vídeos em adição a imagens. Isso irá aumentar levemente a carga do servidor.",
	"setSensitiveFlagAutomatically": "Marcar como sensível",
	"notRecommended": "Não recomendado",
	"setSensitiveFlagAutomaticallyDescription": "Os resultados da detecção interna serão mantidos mesmo se essa opção estiver desligada.",
	"activeEmailValidationDescription": "A validação do endereço de e-mail do usuário será realizada de forma mais rigorosa, considerando se é um endereço descartável ou se é possível realizar comunicação efetiva. Se desativado, apenas a validade do formato do endereço será verificada como uma sequência de caracteres."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"security": "Безопасность",
	"sensitiveMediaDetection": "Распознание содержимого не для всех",
	"all": "Все",
	"localOnly": "Локально",
	"remoteOnly": "Только удалённо",
	"none": "Ничего",
	"description": "Машинное обучение может быть использовано для автоматического обнаружения чувствительных медиа для модерации. Нагрузка на сервер увеличивается незначительно.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Чувствительность обнаружения",
	"sensitivityDescription": "Более низкая чувствительность уменьшает количество ложных срабатываний (false positives). Повышение чувствительности уменьшает утечку при обнаружении (ложноотрицательные результаты).",
	"analyzeVideos": "Анализировать видео?",
	"beta": "Бета",
	"analyzeVideosDescription": "Анализируйте видео в дополнение к неподвижным изображениям. Нагрузка на сервер немного увеличивается.",
	"setSensitiveFlagAutomatically": "Обозначить как не для всех",
	"notRecommended": "Не рекомендуется",
	"setSensitiveFlagAutomaticallyDescription": "Даже если этот параметр отключен, результат оценки сохраняется внутри системы.",
	"activeEmailValidationDescription": "Если включено, будет проводиться более строгая проверка адреса электронной почты, в том числе на то, что он действительный и не временный. Если же отключено, то проверяется только корректность написания адреса."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"security": "Zabezpečenie",
	"sensitiveMediaDetection": "Detekcia citlivých médií.",
	"all": "Všetko",
	"localOnly": "Iba lokálne",
	"remoteOnly": "Len vzdialené",
	"none": "Žiadne",
	"description": "Strojové učenie sa použije na automatickú detekciu citlivých médií na účely ich moderovania. Mierne sa zvýši zaťaženie servera.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Citlivosť detekcie",
	"sensitivityDescription": "Nižšia citlivosť znižuje počet falošne pozitívnych výsledkov (false positives). Vyššia citlivosť znižuje počet falošne negatívnych výsledkov (false negatives).",
	"analyzeVideos": "Zapnúť analýzu videa",
	"beta": "Beta",
	"analyzeVideosDescription": "Okrem obrázkov zapne detekciu aj pre videá. Zaťaženie servera sa mierne zvýši.",
	"setSensitiveFlagAutomatically": "Nastaviť príznak NSFW",
	"notRecommended": "Neodporúčané",
	"setSensitiveFlagAutomaticallyDescription": "Aj keď je toto nastavenie vypnuté, výsledok rozhodnutia je interne uložený.",
	"activeEmailValidationDescription": "Dôkladnejšie overí e-mailovú adresu používateľa tým, že zistí, či ide o vyradenú e-mailovú adresu a či sa s ňou dá skutočne komunikovať. Ak nie je začiarknuté, e-mailová adresa sa kontroluje len ako text."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"security": "ความปลอดภัย",
	"sensitiveMediaDetection": "การตรวจจับสื่อที่มีเนื้อหาละเอียดอ่อน",
	"all": "ทั้งหมด",
	"localOnly": "เฉพาะท้องถิ่น",
	"remoteOnly": "ระยะไกลเท่านั้น",
	"none": "ไม่มี",
	"description": "ใช้ Machine Learning เพื่อตรวจจับสื่อที่มีเนื้อหาละเอียดอ่อนโดยอัตโนมัติและใช้เพื่อการกลั่นกรอง ภาระของเซิร์ฟเวอร์จะเพิ่มขึ้นเล็กน้อย",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "ความไวในการตรวจจับ",
	"sensitivityDescription": "เมื่อความไวต่ำ Misdetection (ผลบวกลวง) จะลดลง, เมื่อความไวสูง Missed detection (ผลลบลวง) จะลดลง",
	"analyzeVideos": "เปิดใช้งานวิเคราะห์วิดีโอ",
	"beta": "เบต้า",
	"analyzeVideosDescription": "การวิเคราะห์วิดีโอนอกเหนือจากรูปภาพนั้น การทำสิ่งนี้จะทำให้เพิ่มภาระบนเซิร์ฟเวอร์เล็กน้อย",
	"setSensitiveFlagAutomatically": "ทำเครื่องหมายว่ามีเนื้อหาละเอียดอ่อน",
	"notRecommended": "ไม่แนะนำ",
	"setSensitiveFlagAutomaticallyDescription": "ผลลัพธ์ของการตรวจจับภายในนั้นจะยังคงอยู่ ถึงแม้ว่าจะปิดตัวเลือกนี้",
	"activeEmailValidationDescription": "การตรวจสอบอีเมลของผู้ใช้จะเข้มงวดมากขึ้น โดยพิจารณาว่าเป็นอีเมลชั่วคราวหรือไม่ และสามารถติดต่อได้จริงหรือไม่ หากปิดการตรวจสอบนี้ จะตรวจสอบเพียงว่ารูปแบบอีเมลที่ถูกต้องหรือไม่เท่านั้น"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"security": "Güvenlik",
	"sensitiveMediaDetection": "Hassas ortamların tespiti",
	"all": "Tümü",
	"localOnly": "Yalnızca yerel",
	"remoteOnly": "Sadece uzaktan",
	"none": "Hiçbiri",
	"description": "Makine öğrenimi yoluyla hassas medyayı otomatik olarak tanıyarak sunucu moderasyonunun yükünü azaltır. Bu, sunucu üzerindeki yükü biraz artıracaktır.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Algılama hassasiyeti",
	"sensitivityDescription": "Hassasiyeti azaltmak, yanlış algılamaların (yanlış pozitifler) azalmasına neden olurken, hassasiyeti artırmak ise algılamaların kaçırılmasının (yanlış negatifler) azalmasına neden olur.",
	"analyzeVideos": "Videoların analizini etkinleştir",
	"beta": "Beta",
	"analyzeVideosDescription": "Görüntülerin yanı sıra videoları da analiz eder. Bu, sunucu üzerindeki yükü biraz artıracaktır.",
	"setSensitiveFlagAutomatically": "Hassas olarak işaretle",
	"notRecommended": "Tavsiye edilmez",
	"setSensitiveFlagAutomaticallyDescription": "Bu seçenek kapatılsa bile, dahili algılama sonuçları korunacaktır.",
	"activeEmailValidationDescription": "E-posta adreslerinin daha sıkı bir şekilde doğrulanmasını sağlar. Bu, tek kullanımlık adreslerin kontrol edilmesini ve adresin gerçekten iletişim kurulabilir olup olmadığının kontrol edilmesini içerir. İşaretlenmediğinde, yalnızca e-postanın biçimi doğrulanır."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"security": "Security",
	"sensitiveMediaDetection": "Detection of sensitive media",
	"all": "All",
	"localOnly": "Local only",
	"remoteOnly": "Remote only",
	"none": "None",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Detection sensitivity",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Enable analysis of videos",
	"beta": "Beta",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Mark as sensitive",
	"notRecommended": "Not recommended",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Enables stricter validation of email addresses, which includes checking for disposable addresses and by whether it can actually be communicated with. When unchecked, only the format of the email is validated."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"security": "Безпека",
	"sensitiveMediaDetection": "Виявлення NSFW",
	"all": "Всі",
	"localOnly": "Локально",
	"remoteOnly": "Тільки віддаленi",
	"none": "Відсутній",
	"description": "Reduces the effort of server moderation through automatically recognizing sensitive media via Machine Learning. This will slightly increase the load on the server.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Чутливість детектування",
	"sensitivityDescription": "Reducing the sensitivity will lead to fewer misdetections (false positives) whereas increasing it will lead to fewer missed detections (false negatives).",
	"analyzeVideos": "Увімкнути аналіз відео",
	"beta": "Бета",
	"analyzeVideosDescription": "Analyzes videos in addition to images. This will slightly increase the load on the server.",
	"setSensitiveFlagAutomatically": "Позначити як NSFW",
	"notRecommended": "Не рекомендовано",
	"setSensitiveFlagAutomaticallyDescription": "The results of the internal detection will be retained even if this option is turned off.",
	"activeEmailValidationDescription": "Увімкнути суворішу перевірку адрес електронної пошти, зокрема перевірку на тимчасові адреси та можливість фактичного зв’язку з ними. Якщо вимкнено, перевірятиметься лише формат адреси."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"security": "Bảo mật",
	"sensitiveMediaDetection": "Tự động phát hiện NSFW",
	"all": "Tất cả",
	"localOnly": "Chỉ trên máy chủ",
	"remoteOnly": "Chỉ máy chủ từ xa",
	"none": "Không",
	"description": "Giảm nỗ lực kiểm duyệt máy chủ thông qua việc tự động nhận dạng media NSFW thông qua học máy. Điều này sẽ làm tăng một chút áp lực trên máy chủ.",
	"externalServiceInfo": "The detection of sensitive media has been offloaded to an external service (sensitive-detector). To use this feature, you must set up a separate service and configure the connection details provided below. If no connection details are configured, no detection will be performed (it will be treated as non-sensitive).",
	"apiUrl": "Detection service endpoint URL",
	"apiUrlDescription": "The base URL for the sensitive-detector service (e.g., http://localhost:3009). If you are connecting to a service on a private network, please allow the target network in the allowedPrivateNetworks setting in the configuration file. If you are using a proxy, please also configure proxyBypassHosts. If left blank, sensitive media detection will not be performed.",
	"apiKey": "API key",
	"apiKeyDescription": "Enter this if authentication (Bearer token) is configured on the detector service. If it is not configured, please leave it blank.",
	"timeout": "Timeout (Milliseconds)",
	"timeoutDescription": "Timeout duration for each judgment request.",
	"maxImagesPerRequest": "Max images per request",
	"maxImagesPerRequestDescription": "Maximum number of images that can be sent in a single request when processing multi-frame at once, such as videos. Any images exceeding this limit will be split and sent sequentially. Please ensure this is set to not exceed the maxParts setting (default: 10) on the detector service. If it exceeds this limit, all items in that chunk will be treated as non-sensitive.",
	"sensitivity": "Phát hiện nhạy cảm",
	"sensitivityDescription": "Giảm độ nhạy sẽ dẫn đến ít phát hiện sai hơn (dương tính giả), tăng nó sẽ dẫn đến ít phát hiện sai hơn (âm tính giả).",
	"analyzeVideos": "Bật chuẩn đoán video",
	"beta": "Beta",
	"analyzeVideosDescription": "Phân tích video bên cạnh hình ảnh. Điều này sẽ làm tăng một chút áp lực trên máy chủ.",
	"setSensitiveFlagAutomatically": "Đánh dấu là NSFW",
	"notRecommended": "Không đề xuất",
	"setSensitiveFlagAutomaticallyDescription": "Kết quả của phát hiện nội bộ sẽ được giữ lại ngay cả khi tùy chọn này bị tắt.",
	"activeEmailValidationDescription": "Cho phép xác minh địa chỉ email chặt chẽ hơn, bao gồm việc kiểm tra các địa chỉ dùng một lần và xem nó có thực sự được giao tiếp hay không. Khi bỏ chọn, chỉ định dạng của email được xác minh."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"security": "安全",
	"sensitiveMediaDetection": "检测到敏感媒体",
	"all": "全部",
	"localOnly": "仅限本地",
	"remoteOnly": "仅远程",
	"none": "无",
	"description": "使用机器学习技术自动检测敏感媒体，以便进行审核。服务器负载将略微增加。",
	"externalServiceInfo": "检测敏感媒体已分离至外部服务 (sensitive-detector)。若要使用，需额外部署 Sidecar 服务，并设置下方的连接 URL。未设定时将不会进行检测（视为非敏感媒体）。",
	"apiUrl": "检测服务的连接 URL",
	"apiUrlDescription": "sensitive-detector 服务的 base URL（如：http://localhost:3009）。若是连接至部署在专用网络上的服务，请在配置文件中的 allowedPrivateNetworks 里允许目标网络。若是使用了代理，请一并设置 proxyBypassHosts。留空则不进行敏感媒体检测。",
	"apiKey": "API 密钥",
	"apiKeyDescription": "若服务端有设置验证（Bearer token）则填写，未设置则留空。",
	"timeout": "超时（毫秒）",
	"timeoutDescription": "此为单次检测请求的超时时长。",
	"maxImagesPerRequest": "单次检测请求最大图像数量",
	"maxImagesPerRequestDescription": "此为在检测动画等多帧图像时，单次请求中可发送的图像数量上限。超出此值时动画将被拆分并按序发送。请勿将此值设为超出 sensitive-detector 侧的 maxParts 的值（默认：10），否则对应的分块将全被视为非敏感媒体。",
	"sensitivity": "检测敏感度",
	"sensitivityDescription": "敏感度较低，则误检（假阳性）会减少；敏感度较高，则漏检（假阴性）会减少。",
	"analyzeVideos": "启用对视频的检测",
	"beta": "测试",
	"analyzeVideosDescription": "除了静止图像之外，还对视频进行分析。服务器负载会略微增加。",
	"setSensitiveFlagAutomatically": "自动设置 NSFW 标签",
	"notRecommended": "不推荐",
	"setSensitiveFlagAutomaticallyDescription": "即使关闭此配置，识别结果也会在内部保存。",
	"activeEmailValidationDescription": "开启用户的电子邮件地址验证，判断它是一次性的电子邮件地址，还是可以实际通信的地址。关闭时，则只检查字符串是否正确。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"security": "安全性",
	"sensitiveMediaDetection": "敏感檔案的檢測",
	"all": "全部",
	"localOnly": "僅限本地",
	"remoteOnly": "僅限遠端",
	"none": "無",
	"description": "您可以使用機器學習自動檢測敏感檔案以便審查。這會稍微增加伺服器負荷。",
	"externalServiceInfo": "敏感媒體的判定已分離至外部服務（sensitive-detector）。若要使用此功能，必須另外設定 Sidecar 服務，並設定下方的連接資訊。若未設定連接資訊，則不會執行判定（視為非敏感內容）。",
	"apiUrl": "判定服務的連接資訊 URL",
	"apiUrlDescription": "sensitive-detector 服務的基礎網址（例如：http://localhost:3009）。若要連接位於私有網路上的服務，請在設定檔的 allowedPrivateNetworks 中允許對應的連接網路。若使用代理伺服器（Proxy），也請一併設定 proxyBypassHosts。若留白，則不會執行敏感內容判定。",
	"apiKey": "API 金鑰",
	"apiKeyDescription": "若判定服務端已設定認證（Bearer Token），請輸入此資訊。若未設定，請保持空白。",
	"timeout": "連線逾時（微秒）",
	"timeoutDescription": "單次判定請求的逾時時間。",
	"maxImagesPerRequest": "每筆請求的最大圖片數量",
	"maxImagesPerRequestDescription": "當判定包含多個影格的內容（如影片等）時，為每筆請求所允許的單次最大圖片數量。超過此數量的部分將會分割並依序發送。請確保此數值不超過 sensitive-detector 端的 maxParts 設定（預設值：10）。若超過該數值，該區塊（Chunk）的所有項目將被視為非敏感內容。",
	"sensitivity": "檢測敏感度",
	"sensitivityDescription": "敏感度低時，誤檢測（偽陽性）會減少。敏感度高時，漏檢（偽陰性）會減少。",
	"analyzeVideos": "啟用影片分析",
	"beta": "測試版",
	"analyzeVideosDescription": "除了靜止影像以外，也分析影片。伺服器的負荷會稍微增加。",
	"setSensitiveFlagAutomatically": "設定 NSFW 標籤",
	"notRecommended": "不推薦",
	"setSensitiveFlagAutomaticallyDescription": "即使將此設定關閉，判定結果也會保留在內部。",
	"activeEmailValidationDescription": "主動地驗證使用者的電子郵件地址，以確定是否是一次性地址以及是否可以真正與其進行通訊。關閉時，僅檢查格式是否正確。"
}
</locale>
