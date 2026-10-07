<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker markerId="botProtection" :keywords="['bot', 'protection', 'captcha', 'hcaptcha', 'mcaptcha', 'recaptcha', 'turnstile']">
	<MkFolder>
		<template #icon><SearchIcon><i class="ti ti-shield"></i></SearchIcon></template>
		<template #label><SearchLabel>{{ $locale.sfc.botProtection }}</SearchLabel></template>
		<template v-if="botProtectionForm.savedState.provider === 'hcaptcha'" #suffix>hCaptcha</template>
		<template v-else-if="botProtectionForm.savedState.provider === 'mcaptcha'" #suffix>mCaptcha</template>
		<template v-else-if="botProtectionForm.savedState.provider === 'recaptcha'" #suffix>reCAPTCHA</template>
		<template v-else-if="botProtectionForm.savedState.provider === 'turnstile'" #suffix>Turnstile</template>
		<template v-else-if="botProtectionForm.savedState.provider === 'testcaptcha'" #suffix>testCaptcha</template>
		<template v-else #suffix>{{ $locale.sfc.none }} ({{ $locale.sfc.notRecommended }})</template>
		<template v-if="botProtectionForm.modified.value" #footer>
			<MkFormFooter :canSaving="canSaving" :form="botProtectionForm"/>
		</template>

		<div class="_gaps_m">
			<MkRadios
				v-model="botProtectionForm.state.provider"
				:options="[
					{ value: 'none', label: `${$locale.sfc.none} (${$locale.sfc.notRecommended})` },
					{ value: 'hcaptcha', label: 'hCaptcha' },
					{ value: 'mcaptcha', label: 'mCaptcha' },
					{ value: 'recaptcha', label: 'reCAPTCHA' },
					{ value: 'turnstile', label: 'Turnstile' },
					{ value: 'testcaptcha', label: 'testCaptcha' },
				]"
			>
			</MkRadios>

			<template v-if="botProtectionForm.state.provider === 'hcaptcha'">
				<MkInput v-model="botProtectionForm.state.hcaptchaSiteKey" debounce>
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ $locale.sfc.hcaptchaSiteKey }}</template>
				</MkInput>
				<MkInput v-model="botProtectionForm.state.hcaptchaSecretKey" debounce>
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ $locale.sfc.hcaptchaSecretKey }}</template>
				</MkInput>
				<FormSlot v-if="botProtectionForm.state.hcaptchaSiteKey">
					<template #label>{{ $locale.sfc.captchaVerify }}</template>
					<MkCaptcha
						v-model="captchaResult"
						provider="hcaptcha"
						:sitekey="botProtectionForm.state.hcaptchaSiteKey"
						:secretKey="botProtectionForm.state.hcaptchaSecretKey"
					/>
				</FormSlot>
				<MkInfo>
					<div :class="$style.captchaInfoMsg">
						<div>{{ $locale.sfc.captchaTestSiteKeyMessage }}</div>
						<div>
							<span>ref: </span><a href="https://docs.hcaptcha.com/#integration-testing-test-keys" target="_blank">hCaptcha Developer Guide</a>
						</div>
					</div>
				</MkInfo>
			</template>

			<template v-else-if="botProtectionForm.state.provider === 'mcaptcha'">
				<MkInput v-model="botProtectionForm.state.mcaptchaSiteKey" debounce>
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ $locale.sfc.mcaptchaSiteKey }}</template>
				</MkInput>
				<MkInput v-model="botProtectionForm.state.mcaptchaSecretKey" debounce>
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ $locale.sfc.mcaptchaSecretKey }}</template>
				</MkInput>
				<MkInput v-model="botProtectionForm.state.mcaptchaInstanceUrl" debounce>
					<template #prefix><i class="ti ti-link"></i></template>
					<template #label>{{ $locale.sfc.mcaptchaInstanceUrl }}</template>
				</MkInput>
				<FormSlot v-if="botProtectionForm.state.mcaptchaSiteKey && botProtectionForm.state.mcaptchaInstanceUrl">
					<template #label>{{ $locale.sfc.captchaVerify }}</template>
					<MkCaptcha
						v-model="captchaResult"
						provider="mcaptcha"
						:sitekey="botProtectionForm.state.mcaptchaSiteKey"
						:secretKey="botProtectionForm.state.mcaptchaSecretKey"
						:instanceUrl="botProtectionForm.state.mcaptchaInstanceUrl"
					/>
				</FormSlot>
			</template>

			<template v-else-if="botProtectionForm.state.provider === 'recaptcha'">
				<MkInput v-model="botProtectionForm.state.recaptchaSiteKey" debounce>
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ $locale.sfc.recaptchaSiteKey }}</template>
				</MkInput>
				<MkInput v-model="botProtectionForm.state.recaptchaSecretKey" debounce>
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ $locale.sfc.recaptchaSecretKey }}</template>
				</MkInput>
				<FormSlot v-if="botProtectionForm.state.recaptchaSiteKey">
					<template #label>{{ $locale.sfc.captchaVerify }}</template>
					<MkCaptcha
						v-model="captchaResult"
						provider="recaptcha"
						:sitekey="botProtectionForm.state.recaptchaSiteKey"
						:secretKey="botProtectionForm.state.recaptchaSecretKey"
					/>
				</FormSlot>
				<MkInfo>
					<div :class="$style.captchaInfoMsg">
						<div>{{ $locale.sfc.captchaTestSiteKeyMessage }}</div>
						<div>
							<span>ref: </span>
							<a
								href="https://developers.google.com/recaptcha/docs/faq?hl=ja#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do"
								target="_blank"
							>reCAPTCHA FAQ</a>
						</div>
					</div>
				</MkInfo>
			</template>

			<template v-else-if="botProtectionForm.state.provider === 'turnstile'">
				<MkInput v-model="botProtectionForm.state.turnstileSiteKey" debounce>
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ $locale.sfc.turnstileSiteKey }}</template>
				</MkInput>
				<MkInput v-model="botProtectionForm.state.turnstileSecretKey" debounce>
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ $locale.sfc.turnstileSecretKey }}</template>
				</MkInput>
				<FormSlot v-if="botProtectionForm.state.turnstileSiteKey">
					<template #label>{{ $locale.sfc.captchaVerify }}</template>
					<MkCaptcha
						v-model="captchaResult"
						provider="turnstile"
						:sitekey="botProtectionForm.state.turnstileSiteKey"
						:secretKey="botProtectionForm.state.turnstileSecretKey"
					/>
				</FormSlot>
				<MkInfo>
					<div :class="$style.captchaInfoMsg">
						<div>
							{{ $locale.sfc.captchaTestSiteKeyMessage }}
						</div>
						<div>
							<span>ref: </span><a href="https://developers.cloudflare.com/turnstile/troubleshooting/testing/" target="_blank">Cloudflare Docs</a>
						</div>
					</div>
				</MkInfo>
			</template>

			<template v-else-if="botProtectionForm.state.provider === 'testcaptcha'">
				<MkInfo warn><span v-html="$locale.sfc.testCaptchaWarning"></span></MkInfo>
				<FormSlot>
					<template #label>{{ $locale.sfc.captchaVerify }}</template>
					<MkCaptcha v-model="captchaResult" provider="testcaptcha" :sitekey="null"/>
				</FormSlot>
			</template>
		</div>
	</MkFolder>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import type { ApiWithDialogCustomErrors } from '@features/ui/frontend/os.js';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { fetchInstance } from '@features/instance/frontend/instance.js';
import { useForm } from '@features/ui/frontend/composables/use-form.js';
import MkFormFooter from '@features/ui/frontend/components/MkFormFooter.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';

const MkCaptcha = defineAsyncComponent(() => import('@features/auth/frontend/components/MkCaptcha.vue'));

const errorHandler: ApiWithDialogCustomErrors = {
	// 検証リクエストそのものに失敗
	'0f4fe2f1-2c15-4d6e-b714-efbfcde231cd': {
		title: $locale.value.sfc.captchaErrorRequestFailedTitle,
		text: $locale.value.sfc.captchaErrorRequestFailedText,
	},
	// 検証リクエストの結果が不正
	'c41c067f-24f3-4150-84b2-b5a3ae8c2214': {
		title: $locale.value.sfc.captchaErrorVerificationFailedTitle,
		text: $locale.value.sfc.captchaErrorVerificationFailedText,
	},
	// 不明なエラー
	'f868d509-e257-42a9-99c1-42614b031a97': {
		title: $locale.value.sfc.captchaErrorUnknownTitle,
		text: $locale.value.sfc.captchaErrorUnknownText,
	},
};

const captchaResult = ref<string | null>(null);

const meta = await misskeyApi('admin/captcha/current');
const botProtectionForm = useForm({
	provider: meta.provider,
	hcaptchaSiteKey: meta.hcaptcha.siteKey,
	hcaptchaSecretKey: meta.hcaptcha.secretKey,
	mcaptchaSiteKey: meta.mcaptcha.siteKey,
	mcaptchaSecretKey: meta.mcaptcha.secretKey,
	mcaptchaInstanceUrl: meta.mcaptcha.instanceUrl,
	recaptchaSiteKey: meta.recaptcha.siteKey,
	recaptchaSecretKey: meta.recaptcha.secretKey,
	turnstileSiteKey: meta.turnstile.siteKey,
	turnstileSecretKey: meta.turnstile.secretKey,
}, async (state) => {
	const provider = state.provider;
	if (provider === 'none') {
		await os.apiWithDialog(
			'admin/captcha/save',
			{ provider: provider as Misskey.entities.AdminCaptchaSaveRequest['provider'] },
			undefined,
			errorHandler,
		);
	} else {
		const sitekey = provider === 'hcaptcha'
			? state.hcaptchaSiteKey
			: provider === 'mcaptcha'
				? state.mcaptchaSiteKey
				: provider === 'recaptcha'
					? state.recaptchaSiteKey
					: provider === 'turnstile'
						? state.turnstileSiteKey
						: null;
		const secret = provider === 'hcaptcha'
			? state.hcaptchaSecretKey
			: provider === 'mcaptcha'
				? state.mcaptchaSecretKey
				: provider === 'recaptcha'
					? state.recaptchaSecretKey
					: provider === 'turnstile'
						? state.turnstileSecretKey
						: null;

		await os.apiWithDialog(
			'admin/captcha/save',
			{
				provider: provider as Misskey.entities.AdminCaptchaSaveRequest['provider'],
				sitekey: sitekey,
				secret: secret,
				instanceUrl: state.mcaptchaInstanceUrl,
				captchaResult: captchaResult.value,
			},
			undefined,
			errorHandler,
		);
	}

	await fetchInstance(true);
});

watch(botProtectionForm.state, () => {
	captchaResult.value = null;
});

const canSaving = computed((): boolean => {
	return (botProtectionForm.state.provider === 'none') ||
		(botProtectionForm.state.provider === 'hcaptcha' && !!captchaResult.value) ||
		(botProtectionForm.state.provider === 'mcaptcha' && !!captchaResult.value) ||
		(botProtectionForm.state.provider === 'recaptcha' && !!captchaResult.value) ||
		(botProtectionForm.state.provider === 'turnstile' && !!captchaResult.value) ||
		(botProtectionForm.state.provider === 'testcaptcha' && !!captchaResult.value);
});

</script>

<style lang="scss" module>
.captchaInfoMsg {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"botProtection": "الحماية من الحسابات الآلية",
	"none": "لا شيء",
	"notRecommended": "غير مستحسن",
	"hcaptchaSiteKey": "مفتاح الموقع",
	"hcaptchaSecretKey": "المفتاح السري",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "مفتاح الموقع",
	"mcaptchaSecretKey": "المفتاح السري",
	"mcaptchaInstanceUrl": "mCaptcha server URL",
	"recaptchaSiteKey": "مفتاح الموقع",
	"recaptchaSecretKey": "المفتاح السري",
	"turnstileSiteKey": "مفتاح الموقع",
	"turnstileSecretKey": "المفتاح السري",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"botProtection": "Protecció contra bots",
	"none": "Res",
	"notRecommended": "No recomanat",
	"hcaptchaSiteKey": "Clau del lloc",
	"hcaptchaSecretKey": "Clau secreta",
	"captchaVerify": "Passar pel CAPTCHA",
	"captchaTestSiteKeyMessage": "Pots comprovar una vista prèvia introduïnt valors de prova per la clau del lloc i la clau secreta. Si vols més informació consulteu la següent pàgina.",
	"mcaptchaSiteKey": "Clau del lloc",
	"mcaptchaSecretKey": "Clau secreta",
	"mcaptchaInstanceUrl": "Adreça URL del servidor mCaptcha",
	"recaptchaSiteKey": "Clau del lloc",
	"recaptchaSecretKey": "Clau secreta",
	"turnstileSiteKey": "Clau del lloc",
	"turnstileSecretKey": "Clau secreta",
	"testCaptchaWarning": "És una característica dissenyada per a la prova de CAPTCHA. <strong>No l'utilitzes en l'entorn real.</strong>",
	"captchaErrorRequestFailedTitle": "Ha fallat la sol·licitud del CAPTCHA",
	"captchaErrorRequestFailedText": "Si us plau, torna a intentar-ho d'aquí una estona o comprova els ajustos de nou.",
	"captchaErrorVerificationFailedTitle": "Ha fallat la validació CAPTCHA",
	"captchaErrorVerificationFailedText": "Comprova que els ajustos són els correctes.",
	"captchaErrorUnknownTitle": "Error CAPTCHA",
	"captchaErrorUnknownText": "S'ha produït un error inesperat."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"botProtection": "Bot ochrana",
	"none": "Žádný",
	"notRecommended": "Nedoporučuje se",
	"hcaptchaSiteKey": "Klíč stránky",
	"hcaptchaSecretKey": "Tajný Klíč (Secret Key)",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Klíč stránky",
	"mcaptchaSecretKey": "Tajný Klíč (Secret Key)",
	"mcaptchaInstanceUrl": "URL mCaptcha serveru",
	"recaptchaSiteKey": "Klíč stránky",
	"recaptchaSecretKey": "Tajný Klíč (Secret Key)",
	"turnstileSiteKey": "Klíč stránky",
	"turnstileSecretKey": "Tajný Klíč (Secret Key)",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"botProtection": "Bot Protection",
	"none": "None",
	"notRecommended": "Not recommended",
	"hcaptchaSiteKey": "Site key",
	"hcaptchaSecretKey": "Secret key",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret key",
	"mcaptchaInstanceUrl": "mCaptcha server URL",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret key",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"botProtection": "Schutz vor Bots",
	"none": "Nichts",
	"notRecommended": "Nicht empfohlen",
	"hcaptchaSiteKey": "Site key",
	"hcaptchaSecretKey": "Secret key",
	"captchaVerify": "Bitte beantworte das CAPTCHA",
	"captchaTestSiteKeyMessage": "Du kannst die Vorschau prüfen, indem du die Testwerte für den Site- und Secret-Key eingibst. Weitere Informationen findest du auf der folgenden Seite.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret key",
	"mcaptchaInstanceUrl": "mCaptcha Instanz-URL",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret key",
	"testCaptchaWarning": "Diese Funktion ist für CAPTCHA-Testzwecke gedacht.\n<strong>Nicht in einer Produktivumgebung verwenden.</strong>",
	"captchaErrorRequestFailedTitle": "CAPTCHA-Anfrage fehlgeschlagen.",
	"captchaErrorRequestFailedText": "Bitte probiere es später noch einmal oder überprüfe die Einstellungen erneut.",
	"captchaErrorVerificationFailedTitle": "CAPTCHA-Prüfung fehlgeschlagen",
	"captchaErrorVerificationFailedText": "Bitte überprüfe nochmals, ob die Einstellungen korrekt sind.",
	"captchaErrorUnknownTitle": "CAPTCHA-Fehler",
	"captchaErrorUnknownText": "Es ist ein unerwarteter Fehler aufgetreten."
}
</locale>

<locale lang="json" locale="en-US">
{
	"botProtection": "Bot Protection",
	"none": "None",
	"notRecommended": "Not recommended",
	"hcaptchaSiteKey": "Site key",
	"hcaptchaSecretKey": "Secret key",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret key",
	"mcaptchaInstanceUrl": "mCaptcha server URL",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret key",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"botProtection": "Protección contra bots",
	"none": "Ninguna",
	"notRecommended": "obsoleto",
	"hcaptchaSiteKey": "Clave del sitio",
	"hcaptchaSecretKey": "Clave secreta",
	"captchaVerify": "Por favor verifica el CAPTCHA",
	"captchaTestSiteKeyMessage": "Puedes comprobar la vista previa introduciendo los valores de prueba para el sitio y las claves secretas.\nPara más detalles, consulta la página siguiente.\n",
	"mcaptchaSiteKey": "Clave del sitio",
	"mcaptchaSecretKey": "Clave secreta",
	"mcaptchaInstanceUrl": "URL del servidor mCaptcha",
	"recaptchaSiteKey": "Clave del sitio",
	"recaptchaSecretKey": "Clave secreta",
	"turnstileSiteKey": "Clave del sitio",
	"turnstileSecretKey": "Clave secreta",
	"testCaptchaWarning": "Esta función está pensada para probar CAPTCHAs.<strong>No utilizar en un entorno de producción.</strong>",
	"captchaErrorRequestFailedTitle": "Ha fallado la solicitud del CAPTCHA",
	"captchaErrorRequestFailedText": "Por favor, ejecútalo después de un rato o comprueba los ajustes de nuevo.",
	"captchaErrorVerificationFailedTitle": "Ha fallado la validación del CAPTCHA",
	"captchaErrorVerificationFailedText": "Comprueba que los ajustes son los correctos.",
	"captchaErrorUnknownTitle": "Error en el CAPTCHA.",
	"captchaErrorUnknownText": "Se ha producido un error inesperado."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"botProtection": "Protection contre les bots",
	"none": "Rien",
	"notRecommended": "Déconseillé",
	"hcaptchaSiteKey": "Clé du site",
	"hcaptchaSecretKey": "Clé secrète",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Clé du site",
	"mcaptchaSecretKey": "Clé secrète",
	"mcaptchaInstanceUrl": "URL de l'instance de mCaptcha",
	"recaptchaSiteKey": "Clé du site",
	"recaptchaSecretKey": "Clé secrète",
	"turnstileSiteKey": "Clé du site",
	"turnstileSecretKey": "Clé secrète",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"botProtection": "Perlindungan Bot",
	"none": "Tidak ada",
	"notRecommended": "Tidak disarankan",
	"hcaptchaSiteKey": "Site Key",
	"hcaptchaSecretKey": "Secret Key",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret Key",
	"mcaptchaInstanceUrl": "URL instansi mCaptcha",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret Key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret Key",
	"testCaptchaWarning": "Fitur ini untuk menguji CAPTCHA. <strong>Jangan dipakai di lingkungan produksi.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"botProtection": "Protezione contro i bot",
	"none": "Nessuna",
	"notRecommended": "Sconsigliato",
	"hcaptchaSiteKey": "Chiave del sito",
	"hcaptchaSecretKey": "Chiave segreta",
	"captchaVerify": "Per favore, controlla la verifica CAPTCHA",
	"captchaTestSiteKeyMessage": "Puoi provare l'anteprima inserendo valori di test, sia per la chiave del sito che per la chiave segreta.\nSi prega di controllare la pagina qui sotto per i dettagli.",
	"mcaptchaSiteKey": "Chiave del sito",
	"mcaptchaSecretKey": "Chiave segreta",
	"mcaptchaInstanceUrl": "URL della istanza mCaptcha",
	"recaptchaSiteKey": "Chiave del sito",
	"recaptchaSecretKey": "Chiave segreta",
	"turnstileSiteKey": "Chiave del sito",
	"turnstileSecretKey": "Chiave segreta",
	"testCaptchaWarning": "Questa funzione è destinata al test CAPTCHA. <strong>Da non utilizzare in ambiente di produzione.</strong>",
	"captchaErrorRequestFailedTitle": "Errore durante la richiesta del CAPTCHA",
	"captchaErrorRequestFailedText": "Riprova più tardi o controlla nuovamente le impostazioni.",
	"captchaErrorVerificationFailedTitle": "Convalida CAPTCHA non riuscita",
	"captchaErrorVerificationFailedText": "Si prega di verificare nuovamente se le impostazioni sono corrette.",
	"captchaErrorUnknownTitle": "Errore CAPTCHA",
	"captchaErrorUnknownText": "Si è verificato un errore imprevisto."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"botProtection": "Botプロテクション",
	"none": "なし",
	"notRecommended": "非推奨",
	"hcaptchaSiteKey": "サイトキー",
	"hcaptchaSecretKey": "シークレットキー",
	"captchaVerify": "CAPTCHAを通過してください",
	"captchaTestSiteKeyMessage": "サイトキーとシークレットキーにテスト用の値を入力することでプレビューを確認できます。\n詳細は下記ページをご確認ください。",
	"mcaptchaSiteKey": "サイトキー",
	"mcaptchaSecretKey": "シークレットキー",
	"mcaptchaInstanceUrl": "mCaptchaのインスタンスのURL",
	"recaptchaSiteKey": "サイトキー",
	"recaptchaSecretKey": "シークレットキー",
	"turnstileSiteKey": "サイトキー",
	"turnstileSecretKey": "シークレットキー",
	"testCaptchaWarning": "CAPTCHAのテストを目的とした機能です。<strong>本番環境で使用しないでください。</strong>",
	"captchaErrorRequestFailedTitle": "CAPTCHAのリクエストに失敗しました",
	"captchaErrorRequestFailedText": "しばらく後に実行するか、設定をもう一度ご確認ください。",
	"captchaErrorVerificationFailedTitle": "CAPTCHAの検証に失敗しました",
	"captchaErrorVerificationFailedText": "設定が正しいかどうかもう一度確認ください。",
	"captchaErrorUnknownTitle": "CAPTCHAエラー",
	"captchaErrorUnknownText": "想定外のエラーが発生しました。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"botProtection": "Botプロテクション",
	"none": "なし",
	"notRecommended": "あんま推奨しやんで",
	"hcaptchaSiteKey": "サイトキー",
	"hcaptchaSecretKey": "シークレットキー",
	"captchaVerify": "CAPTCHAしばいたって",
	"captchaTestSiteKeyMessage": "サイトキーとシークレットキーにテスト用の値を入力することでプレビューを確認できるで。\n詳細は下記ページを確認してな。",
	"mcaptchaSiteKey": "サイトキー",
	"mcaptchaSecretKey": "シークレットキー",
	"mcaptchaInstanceUrl": "mCaptchaのインスタンスのURL",
	"recaptchaSiteKey": "サイトキー",
	"recaptchaSecretKey": "シークレットキー",
	"turnstileSiteKey": "サイトキー",
	"turnstileSecretKey": "シークレットキー",
	"testCaptchaWarning": "CAPTCHAのテストを目的としてるで。<strong>絶対に本番環境で使わんといてな。絶対やで。</strong>",
	"captchaErrorRequestFailedTitle": "CAPTCHAのリクエストに失敗してもうた",
	"captchaErrorRequestFailedText": "しばらく後で実行するか、設定をもっかい確認してや。",
	"captchaErrorVerificationFailedTitle": "CAPTCHAのリクエストに失敗してもうた",
	"captchaErrorVerificationFailedText": "設定がほんまに合ってるかもっかい確認してや。",
	"captchaErrorUnknownTitle": "CAPTCHAエラー",
	"captchaErrorUnknownText": "思いもせんかったエラーが起きたわ。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"botProtection": "Bot Protection",
	"none": "None",
	"notRecommended": "Not recommended",
	"hcaptchaSiteKey": "Site key",
	"hcaptchaSecretKey": "Secret key",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret key",
	"mcaptchaInstanceUrl": "mCaptcha server URL",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret key",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"botProtection": "Bot Protection",
	"none": "None",
	"notRecommended": "Not recommended",
	"hcaptchaSiteKey": "Site key",
	"hcaptchaSecretKey": "Secret key",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret key",
	"mcaptchaInstanceUrl": "mCaptcha server URL",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret key",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"botProtection": "Bot 방어",
	"none": "없음",
	"notRecommended": "추천하지 않음",
	"hcaptchaSiteKey": "사이트 키",
	"hcaptchaSecretKey": "시크릿 키",
	"captchaVerify": "CAPTCHA를 먼저 해결하세요.",
	"captchaTestSiteKeyMessage": "사이트 키와 비밀 키에 테스트용 값을 입력하여 미리보기를 확인할 수 있습니다.\n자세한 내용은 아래 페이지를 확인해보세요.",
	"mcaptchaSiteKey": "사이트 키",
	"mcaptchaSecretKey": "시크릿 키",
	"mcaptchaInstanceUrl": "mCaptcha 인스턴스 URL",
	"recaptchaSiteKey": "사이트 키",
	"recaptchaSecretKey": "시크릿 키",
	"turnstileSiteKey": "사이트 키",
	"turnstileSecretKey": "시크릿 키",
	"testCaptchaWarning": "CAPTCHA를 테스트하기 위한 기능입니다. <strong>실제 환경에서는 사용하지 마세요.</strong>",
	"captchaErrorRequestFailedTitle": "CAPTCHA 요구에 실패했습니다.",
	"captchaErrorRequestFailedText": "잠시 후에 다시 실행하거나, 설정을 다시 한 번 확인해보세요.",
	"captchaErrorVerificationFailedTitle": "CAPTCHA 검증을 실패했습니다.",
	"captchaErrorVerificationFailedText": "설정이 올바른지 다시 한 번 확인해보세요.",
	"captchaErrorUnknownTitle": "CAPTCHA 오류",
	"captchaErrorUnknownText": "알 수 없는 오류가 발생했습니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"botProtection": "Beveiliging tegen bots",
	"none": "Niets",
	"notRecommended": "Niet aanbevolen",
	"hcaptchaSiteKey": "Site sleutel",
	"hcaptchaSecretKey": "Geheime sleutel",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site sleutel",
	"mcaptchaSecretKey": "Geheime sleutel",
	"mcaptchaInstanceUrl": "mCaptcha server-URL",
	"recaptchaSiteKey": "Site sleutel",
	"recaptchaSecretKey": "Geheime sleutel",
	"turnstileSiteKey": "Site sleutel",
	"turnstileSecretKey": "Geheime sleutel",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"botProtection": "Bot Protection",
	"none": "Ingen",
	"notRecommended": "Not recommended",
	"hcaptchaSiteKey": "Site key",
	"hcaptchaSecretKey": "Secret key",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret key",
	"mcaptchaInstanceUrl": "mCaptcha server URL",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret key",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"botProtection": "Zabezpieczenie przed botami",
	"none": "Brak",
	"notRecommended": "Nie zalecane",
	"hcaptchaSiteKey": "Klucz strony",
	"hcaptchaSecretKey": "Tajny klucz",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Klucz strony",
	"mcaptchaSecretKey": "Tajny klucz",
	"mcaptchaInstanceUrl": "URL instancji mCaptcha",
	"recaptchaSiteKey": "Klucz strony",
	"recaptchaSecretKey": "Tajny klucz",
	"turnstileSiteKey": "Klucz strony",
	"turnstileSecretKey": "Tajny klucz",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"botProtection": "Proteção contra Bot",
	"none": "Nenhum",
	"notRecommended": "Não recomendado",
	"hcaptchaSiteKey": "Chave do sítio ‘web’",
	"hcaptchaSecretKey": "Chave secreta",
	"captchaVerify": "Por favor, verifique o CAPTCHA",
	"captchaTestSiteKeyMessage": "Você pode conferir a prévia inserindo valores de teste para o site e chaves secretas.\nVeja a página seguinte para mais detalhes.",
	"mcaptchaSiteKey": "Chave do sítio ‘web’",
	"mcaptchaSecretKey": "Chave secreta",
	"mcaptchaInstanceUrl": "URL do servidor mCaptcha",
	"recaptchaSiteKey": "Chave do sítio ‘web’",
	"recaptchaSecretKey": "Chave secreta",
	"turnstileSiteKey": "Chave do sítio ‘web’",
	"turnstileSecretKey": "Chave secreta",
	"testCaptchaWarning": "Essa função é utilizada apenas para testar CAPTCHA. <strong>Não a use num ambiente de produção.</strong>",
	"captchaErrorRequestFailedTitle": "O pedido do CAPTCHA falhou",
	"captchaErrorRequestFailedText": "Por favor, tente novamente ou verifique as configurações.",
	"captchaErrorVerificationFailedTitle": "A validação do CAPTCHA falhou",
	"captchaErrorVerificationFailedText": "Por favor, verifique se as configurações estão corretas.",
	"captchaErrorUnknownTitle": "Erro CAPTCHA",
	"captchaErrorUnknownText": "Houve um erro inexperado."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"botProtection": "Ботозащита",
	"none": "Ничего",
	"notRecommended": "Не рекомендуется",
	"hcaptchaSiteKey": "Ключ сайта",
	"hcaptchaSecretKey": "Секретный ключ",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Ключ сайта",
	"mcaptchaSecretKey": "Секретный ключ",
	"mcaptchaInstanceUrl": "Ссылка на сервер mCaptcha",
	"recaptchaSiteKey": "Ключ сайта",
	"recaptchaSecretKey": "Секретный ключ",
	"turnstileSiteKey": "Ключ сайта",
	"turnstileSecretKey": "Секретный ключ",
	"testCaptchaWarning": "Эта тестовая CAPTCHA. <strong>Не используйте её!</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"botProtection": "Bot ochrana",
	"none": "Žiadne",
	"notRecommended": "Neodporúčané",
	"hcaptchaSiteKey": "Site key",
	"hcaptchaSecretKey": "Secret key",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret key",
	"mcaptchaInstanceUrl": "mCaptcha server URL",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret key",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"botProtection": "การป้องกัน Bot",
	"none": "ไม่มี",
	"notRecommended": "ไม่แนะนำ",
	"hcaptchaSiteKey": "คีย์ไซต์",
	"hcaptchaSecretKey": "คีย์ลับ",
	"captchaVerify": "กรุณาผ่าน CAPTCHA",
	"captchaTestSiteKeyMessage": "สามารถดูตัวอย่างได้โดยป้อนค่าทดสอบใน site key และ secret key\nดูรายละเอียดเพิ่มเติมได้ที่หน้าด้านล่างนี้",
	"mcaptchaSiteKey": "คีย์ไซต์",
	"mcaptchaSecretKey": "คีย์ลับ",
	"mcaptchaInstanceUrl": "URL ของอินสแตนซ์ของ mCaptcha",
	"recaptchaSiteKey": "คีย์ไซต์",
	"recaptchaSecretKey": "คีย์ลับ",
	"turnstileSiteKey": "คีย์ไซต์",
	"turnstileSecretKey": "คีย์ลับ",
	"testCaptchaWarning": "ฟังก์ชันนี้มีไว้สำหรับทดสอบ CAPTCHA เท่านั้น\n<strong>ห้ามนำไปใช้ในระบบจริงโดยเด็ดขาด</strong>",
	"captchaErrorRequestFailedTitle": "การร้องขอ CAPTCHA ล้มเหลว",
	"captchaErrorRequestFailedText": "โปรดลองใหม่ภายหลัง หรือ ตรวจสอบการตั้งค่าอีกครั้ง",
	"captchaErrorVerificationFailedTitle": "การยืนยัน CAPTCHA ล้มเหลว",
	"captchaErrorVerificationFailedText": "กรุณาตรวจสอบอีกครั้งว่าการตั้งค่าถูกต้องหรือไม่",
	"captchaErrorUnknownTitle": "CAPTCHA เกิดข้อผิดพลาด",
	"captchaErrorUnknownText": "เกิดข้อผิดพลาดที่ไม่คาดคิด"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"botProtection": "Bot Koruması",
	"none": "Hiçbiri",
	"notRecommended": "Tavsiye edilmez",
	"hcaptchaSiteKey": "Site anahtar",
	"hcaptchaSecretKey": "Gizli anahtar",
	"captchaVerify": "Lütfen CAPTCHA'yı doğrulayın",
	"captchaTestSiteKeyMessage": "Site ve gizli anahtarlar için test değerlerini girerek önizlemeyi kontrol edebilirsin.\nAyrıntılar için lütfen aşağıdaki sayfaya bak.",
	"mcaptchaSiteKey": "Site anahtarı",
	"mcaptchaSecretKey": "Gizli anahtar",
	"mcaptchaInstanceUrl": "mCaptcha sunucu URL'si",
	"recaptchaSiteKey": "Site anahtar",
	"recaptchaSecretKey": "Gizli anahtar",
	"turnstileSiteKey": "Site anahtar",
	"turnstileSecretKey": "Gizli anahtar",
	"testCaptchaWarning": "Bu işlev CAPTCHA testi amacıyla tasarlanmıştır.\n<strong>Üretim ortamında kullanmayın.</strong>",
	"captchaErrorRequestFailedTitle": "CAPTCHA isteği başarısız oldu",
	"captchaErrorRequestFailedText": "Lütfen bir süre sonra tekrar çalıştırın veya ayarları tekrar kontrol edin.",
	"captchaErrorVerificationFailedTitle": "CAPTCHA doğrulaması başarısız oldu",
	"captchaErrorVerificationFailedText": "Ayarların doğru olup olmadığını lütfen tekrar kontrol edin.",
	"captchaErrorUnknownTitle": "CAPTCHA hatası",
	"captchaErrorUnknownText": "Beklenmedik bir hata oluştu."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"botProtection": "Bot Protection",
	"none": "None",
	"notRecommended": "Not recommended",
	"hcaptchaSiteKey": "Site key",
	"hcaptchaSecretKey": "Secret key",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Site key",
	"mcaptchaSecretKey": "Secret key",
	"mcaptchaInstanceUrl": "mCaptcha server URL",
	"recaptchaSiteKey": "Site key",
	"recaptchaSecretKey": "Secret key",
	"turnstileSiteKey": "Site key",
	"turnstileSecretKey": "Secret key",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"botProtection": "Захист від ботів",
	"none": "Відсутній",
	"notRecommended": "Не рекомендовано",
	"hcaptchaSiteKey": "Ключ сайту",
	"hcaptchaSecretKey": "Секретний ключ",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Ключ сайту",
	"mcaptchaSecretKey": "Секретний ключ",
	"mcaptchaInstanceUrl": "Посилання на сервер MCaptcha",
	"recaptchaSiteKey": "Ключ сайту",
	"recaptchaSecretKey": "Секретний ключ",
	"turnstileSiteKey": "Ключ сайту",
	"turnstileSecretKey": "Секретний ключ",
	"testCaptchaWarning": "Це тестова CAPTCHA. <strong>Не використовуйте її.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"botProtection": "Bảo vệ Bot",
	"none": "Không",
	"notRecommended": "Không đề xuất",
	"hcaptchaSiteKey": "Khóa của trang",
	"hcaptchaSecretKey": "Khóa bí mật",
	"captchaVerify": "Please verify the CAPTCHA",
	"captchaTestSiteKeyMessage": "You can check the preview by entering the test values for the site and secret keys.\nPlease see the following page for details.",
	"mcaptchaSiteKey": "Khóa của trang",
	"mcaptchaSecretKey": "Khóa bí mật",
	"mcaptchaInstanceUrl": "URL mCaptcha máy chủ",
	"recaptchaSiteKey": "Khóa của trang",
	"recaptchaSecretKey": "Khóa bí mật",
	"turnstileSiteKey": "Khóa của trang",
	"turnstileSecretKey": "Khóa bí mật",
	"testCaptchaWarning": "This function is intended for CAPTCHA testing purposes.\n<strong>Do not use in a production environment.</strong>",
	"captchaErrorRequestFailedTitle": "Failed to request CAPTCHA",
	"captchaErrorRequestFailedText": "Please run it after a while or check the settings again.",
	"captchaErrorVerificationFailedTitle": "Failed to validate CAPTCHA",
	"captchaErrorVerificationFailedText": "Please check again if the settings are correct.",
	"captchaErrorUnknownTitle": "CAPTCHA error",
	"captchaErrorUnknownText": "An unexpected error occurred."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"botProtection": "Bot防御",
	"none": "无",
	"notRecommended": "不推荐",
	"hcaptchaSiteKey": "网站密钥",
	"hcaptchaSecretKey": "hCaptcha 密钥(SecretKey)",
	"captchaVerify": "请通过 CAPTCHA 验证",
	"captchaTestSiteKeyMessage": "输入测试用的网站密钥及私密密钥后可以生成预览并检查，\n详情请看以下页面。",
	"mcaptchaSiteKey": "网站密钥",
	"mcaptchaSecretKey": "mCaptcha 密钥(SecretKey)",
	"mcaptchaInstanceUrl": "mCaptcha 实例地址",
	"recaptchaSiteKey": "网站密钥",
	"recaptchaSecretKey": "mCaptcha 密钥(SecretKey)",
	"turnstileSiteKey": "网站密钥",
	"turnstileSecretKey": "Turnstile 密钥(SecretKey)",
	"testCaptchaWarning": "此功能为测试 CAPTCHA 用。<strong>请勿在正式环境中使用。</strong>",
	"captchaErrorRequestFailedTitle": "请求 CAPTCHA 失败",
	"captchaErrorRequestFailedText": "请稍后再试，又或者再检查一次设置。",
	"captchaErrorVerificationFailedTitle": "验证 CAPTCHA 失败",
	"captchaErrorVerificationFailedText": "请再次确认设置是否正确。",
	"captchaErrorUnknownTitle": "CAPTCHA 错误",
	"captchaErrorUnknownText": "发生意外错误。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"botProtection": "Bot 防護",
	"none": "無",
	"notRecommended": "不推薦",
	"hcaptchaSiteKey": "hcaptchaSiteKey",
	"hcaptchaSecretKey": "hcaptchaSecretKey",
	"captchaVerify": "請通過 CAPTCHA 驗證",
	"captchaTestSiteKeyMessage": "可以輸入網站金鑰和秘密金鑰的測試值來檢查預覽。\n詳細資訊請參閱以下頁面。",
	"mcaptchaSiteKey": "網站金鑰",
	"mcaptchaSecretKey": "私密金鑰",
	"mcaptchaInstanceUrl": "mCaptcha 的實例網址",
	"recaptchaSiteKey": "網站金鑰",
	"recaptchaSecretKey": "金鑰",
	"turnstileSiteKey": "turnstileSiteKey",
	"turnstileSecretKey": "turnstileSecretKey",
	"testCaptchaWarning": "此功能用於 CAPTCHA 的測試。<strong>請勿在正式環境中使用。</strong>",
	"captchaErrorRequestFailedTitle": "CAPTCHA 請求失敗",
	"captchaErrorRequestFailedText": "請過一段時間後再執行，或再次檢查設定。",
	"captchaErrorVerificationFailedTitle": "CAPTCHA 驗證失敗",
	"captchaErrorVerificationFailedText": "請再次檢查設定是否正確。",
	"captchaErrorUnknownTitle": "CAPTCHA 錯誤",
	"captchaErrorUnknownText": "發生了意外的錯誤。"
}
</locale>
