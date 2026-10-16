<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithAnimBg>
	<div :class="$style.formContainer">
		<div :class="$style.form" class="_panel">
			<div :class="$style.header">
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="z-index:1;position:relative" viewBox="0 0 854 300">
					<defs>
						<linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stop-color="#86b300"/><stop offset="100%" stop-color="#4ab300"/>
						</linearGradient>
					</defs>

					<g transform="translate(427, 150) scale(1, 1) translate(-427, -150)">
						<path d="" fill="url(#linear)" opacity="0.4">
							<animate
								attributeName="d"
								dur="20s"
								repeatCount="indefinite"
								keyTimes="0;0.333;0.667;1"
								calcmod="spline"
								keySplines="0.2 0 0.2 1;0.2 0 0.2 1;0.2 0 0.2 1"
								begin="0s"
								values="M0 0L 0 220Q 213.5 260 427 230T 854 255L 854 0 Z;M0 0L 0 245Q 213.5 260 427 240T 854 230L 854 0 Z;M0 0L 0 265Q 213.5 235 427 265T 854 230L 854 0 Z;M0 0L 0 220Q 213.5 260 427 230T 854 255L 854 0 Z"
							>
							</animate>
						</path>
						<path d="" fill="url(#linear)" opacity="0.4">
							<animate
								attributeName="d"
								dur="20s"
								repeatCount="indefinite"
								keyTimes="0;0.333;0.667;1"
								calcmod="spline"
								keySplines="0.2 0 0.2 1;0.2 0 0.2 1;0.2 0 0.2 1"
								begin="-10s"
								values="M0 0L 0 235Q 213.5 280 427 250T 854 260L 854 0 Z;M0 0L 0 250Q 213.5 220 427 220T 854 240L 854 0 Z;M0 0L 0 245Q 213.5 225 427 250T 854 265L 854 0 Z;M0 0L 0 235Q 213.5 280 427 250T 854 260L 854 0 Z"
							>
							</animate>
						</path>
					</g>
				</svg>
				<div :class="$style.title">
					<div>Welcome to {{ productName }}!</div>
					<div :class="$style.version">v{{ version }}</div>
				</div>
			</div>
			<div style="padding: 16px 32px 32px 32px;">
				<form v-if="!accountCreated" class="_gaps_m" @submit.prevent="createAccount()">
					<div style="text-align: center;" class="_gaps_s">
						<div><b>{{ $locale.sfc.installCompleted }}</b></div>
						<div>{{ $locale.sfc.firstCreateAccount }}</div>
					</div>
					<MkInput v-model="setupPassword" type="password" data-testid="admin-initial-password">
						<template #label>{{ $locale.sfc.initialPasswordForSetup }} <div v-tooltip:dialog="$locale.sfc.initialPasswordForSetupDescription" class="_button _help"><i class="ti ti-help-circle"></i></div></template>
						<template #prefix><i class="ti ti-lock"></i></template>
					</MkInput>
					<MkInput v-model="username" pattern="^[a-zA-Z0-9_]{1,20}$" :spellcheck="false" required data-testid="admin-username">
						<template #label>{{ $locale.sfc.username }} <div v-tooltip:dialog="$locale.sfc.usernameInfo" class="_button _help"><i class="ti ti-help-circle"></i></div></template>
						<template #prefix>@</template>
						<template #suffix>@{{ host }}</template>
					</MkInput>
					<MkInput v-model="password" type="password" data-testid="admin-password">
						<template #label>{{ $locale.sfc.password }}</template>
						<template #prefix><i class="ti ti-lock"></i></template>
					</MkInput>
					<div>
						<MkButton gradate large rounded :disabled="accountCreating" data-testid="admin-ok" style="margin: 0 auto;" type="submit">
							{{ accountCreating ? $locale.sfc.processing : $locale.sfc.next }}<MkEllipsis v-if="accountCreating"/>
						</MkButton>
					</div>
				</form>
				<div v-else-if="step === 0" class="_gaps_m">
					<div style="text-align: center;" class="_gaps_s">
						<div><b>{{ $locale.sfc.accountCreated }}</b></div>
					</div>
					<MkButton gradate large rounded data-testid="next" style="margin: 0 auto;" @click="step++">
						{{ $locale.sfc.next }}
					</MkButton>
				</div>
				<div v-else-if="step === 1" class="_gaps_m">
					<div style="text-align: center;" class="_gaps_s">
						<div style="font-size: 120%;"><b>{{ $locale.sfc.serverSetting }}</b></div>
						<div>{{ $locale.sfc.youCanEasilyConfigureOptimalServerSettingsWithThisWizard }}</div>
						<div>{{ $locale.sfc.settingsYouMakeHereCanBeChangedLater }}</div>
					</div>

					<Suspense>
						<template #default>
							<MkServerSetupWizard :token="token!" @finished="onWizardFinished"/>
						</template>
						<template #fallback>
							<MkLoading/>
						</template>
					</Suspense>

					<MkButton rounded style="margin: 0 auto;" @click="skipSettings">
						{{ $locale.sfc.skipSettings }}
					</MkButton>
				</div>
				<div v-else-if="step === 2" class="_gaps_m">
					<div style="text-align: center;" class="_gaps_s">
						<div><b>{{ $locale.sfc.settingsCompleted }}</b></div>
						<div>{{ $locale.sfc.settingsCompleted_description }}</div>
						<div>{{ $locale.sfc.settingsCompleted_description2 }}</div>
					</div>
					<div class="_gaps_s" :class="$style.donation">
						<div><b>{{ $locale.sfc.donationRequest }}</b></div>
						<div>{{ $locale.sfc.text1 }}<br>{{ $locale.sfc.text2 }}<br>{{ $locale.sfc.text3 }}</div>
						<MkLink target="_blank" url="https://misskey-hub.net/docs/donate/" style="margin: 0 auto;">{{ $locale.sfc.learnMore }}</MkLink>
					</div>
					<div class="_buttonsCenter">
						<MkButton gradate large rounded data-testid="next" style="margin: 0 auto;" @click="finish">
							{{ $locale.sfc.start }}
						</MkButton>
					</div>
				</div>
			</div>
		</div>
	</div>
</PageWithAnimBg>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { host, version, productName } from '@features/boot/frontend/shared/config.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { login } from '@features/auth/frontend/accounts.js';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import MkServerSetupWizard from '@features/boot/frontend/components/MkServerSetupWizard.vue';

const username = ref('');
const password = ref('');
const setupPassword = ref('');
const accountCreating = ref(false);
const accountCreated = ref(false);
const step = ref(0);

let token: string | null = null;

function createAccount() {
	if (accountCreating.value) return;
	accountCreating.value = true;

	const _close = os.waiting();

	misskeyApi('admin/accounts/create', {
		username: username.value,
		password: password.value,
		setupPassword: setupPassword.value === '' ? null : setupPassword.value,
	}).then(res => {
		token = res.token;
		accountCreated.value = true;
	}).catch((err) => {
		accountCreating.value = false;

		let title: string = $locale.value.sfc.somethingHappened;
		let text = err.message + '\n' + err.id;

		if (err.code === 'ACCESS_DENIED') {
			title = $locale.value.sfc.permissionDeniedError;
			text = $locale.value.sfc.operationForbidden;
		} else if (err.code === 'INCORRECT_INITIAL_PASSWORD') {
			title = $locale.value.sfc.permissionDeniedError;
			text = $locale.value.sfc.incorrectPassword;
		}

		os.alert({
			type: 'error',
			title,
			text,
		});
	}).finally(() => {
		_close();
	});
}

function onWizardFinished() {
	step.value++;
}

function skipSettings() {
	step.value++;
}

function finish() {
	if (token == null) return;
	login(token);
}
</script>

<style lang="scss" module>
.formContainer {
	min-height: 100svh;
	padding: 32px 32px 64px 32px;
	box-sizing: border-box;
	align-content: center;
}

.form {
	position: relative;
	z-index: 10;
	border-radius: var(--MI-radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: clip;
	max-width: 550px;
	margin: 0 auto;
}

.header {
	display: grid;

	> svg {
		grid-area: 1 / 1;
		width: 100%;
	}
}

.title {
	position: relative;
	grid-area: 1 / 1;
	z-index: 1;
	margin: 0;
	font-size: 1.5em;
	text-align: center;
	padding: 48px 32px 32px;
	color: #fff;
	font-weight: bold;
}

.version {
	font-size: 70%;
	font-weight: normal;
	opacity: 0.7;
}

.donation {
	background: var(--MI_THEME-accentedBg);
	border-radius: 12px;
	padding: 16px;
	text-align: center;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"somethingHappened": "حدث خطأ",
	"permissionDeniedError": "رُفضة العملية",
	"operationForbidden": "عملية ممنوعة",
	"incorrectPassword": "كلمة السر خاطئة.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "اسم المستخدم",
	"usernameInfo": "الاسم الذي يميزك عن بافي مستخدمي هذا الخادم، يمكنك استخدام الحروف اللاتينية (a~z, A~Z) والأرقام (0~9) والشرطة السفلية (_). لا يمكنك تغييره بعد تسجيله.",
	"password": "الكلمة السرية",
	"processing": "المعالجة جارية",
	"next": "التالية",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "راجع المزيد",
	"start": "البداية"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"somethingHappened": "S'ha produït un error",
	"permissionDeniedError": "Operació no permesa ",
	"operationForbidden": "Operació no permesa ",
	"incorrectPassword": "Contrasenya incorrecta.",
	"installCompleted": "La instal·lació de Misskey ha finalitzat!",
	"firstCreateAccount": "Primer crea un compte d'administrador.",
	"initialPasswordForSetup": "Contrasenya inicial per fer la primera configuració ",
	"initialPasswordForSetupDescription": "Fes servir la contrasenya que has fet servir al fitxer de configuració, si tu mateix has instal·lat Misskey.\nSi fas servir una empresa d'allotjament de Misskey, fes servir la contrasenya que t'han donat.\nSi no has posat cap contrasenya deixar l'espai en blanc.",
	"username": "Nom d'usuari",
	"usernameInfo": "Un nom que identifiqui el teu compte d'altres en aquest servidor. Pots fer servir lletres (a~z, A~Z), números (0~9) i guions baixos (_). Els noms d'usuari no es poden canviar després.",
	"password": "Contrasenya",
	"processing": "S'està processant...",
	"next": "Següent",
	"accountCreated": "Compte d'administrador creat.",
	"serverSetting": "Configuració del servidor",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "Aquest assistent t'ajuda a fer una configuració òptima del servidor.",
	"settingsYouMakeHereCanBeChangedLater": "Els canvis que facis ara poden modificar-se més tard.",
	"skipSettings": "Saltar la configuració ",
	"settingsCompleted": "Configuració finalitzada ",
	"settingsCompleted_description": "Gràcies per la teva ajuda. Ara que ja està tot llest, pots començar a fer servir el servidor immediatament.",
	"settingsCompleted_description2": "La configuració avançada del servidor també poden fer-se des del \"Tauler de control\".",
	"donationRequest": "Una donació, si us plau",
	"text1": "Misskey és un programari gratuït fet per voluntaris.",
	"text2": "Si ho desitges, agrairíem molt la teva donació per poder seguir desenvolupant el projecte.",
	"text3": "També hi ha privilegis especials per als donants!",
	"learnMore": "Saber-ne més ",
	"start": "Comença"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"permissionDeniedError": "Operace zamítnuta",
	"operationForbidden": "Zakázaná operace",
	"incorrectPassword": "Nesprávné heslo.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Počáteční heslo pro nastavení",
	"initialPasswordForSetupDescription": "Použijte heslo, které jste nastavili v konfiguračním souboru, pokud jste Misskey instalovali ručně.\nPokud užíváte Misskey hostovací službu, použijte poskytnuté heslo.\nPokud jste heslo nenastavovali, zanechte prázdné.",
	"username": "Uživatelské jméno",
	"usernameInfo": "Jméno které identifikuje váš účet od jiných na tomhle serveru. Můžete použít abecedu (a~z, A~Z), čísla (0~9) nebo podtržítka (_). Uživatelské jména nemůžou být změněna později.",
	"password": "Heslo",
	"processing": "Zpracovávám",
	"next": "Další",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Zjistit více",
	"start": "Začít"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"somethingHappened": "An error has occurred",
	"permissionDeniedError": "Operation denied",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Incorrect password.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "Username",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"password": "Password",
	"processing": "Processing...",
	"next": "Next",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Learn more",
	"start": "Begin"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"permissionDeniedError": "Aktion verweigert",
	"operationForbidden": "Aktion nicht möglich",
	"incorrectPassword": "Falsches Passwort.",
	"installCompleted": "Die Installation von Misskey ist abgeschlossen!",
	"firstCreateAccount": "Erstelle zunächst ein Administratorkonto.",
	"initialPasswordForSetup": "Initiales Passwort für die Einrichtung",
	"initialPasswordForSetupDescription": "Verwende das in der Konfigurationsdatei angegebene Passwort, wenn du Misskey selbst installiert hast.\nWenn du einen Misskey-Hostingdienst o.ä. nutzt, verwende das dort angegebene Kennwort.\nWenn du kein Passwort festgelegt hast, lasse es leer, um fortzufahren.",
	"username": "Benutzername",
	"usernameInfo": "Ein Name, durch den dein Benutzerkonto auf diesem Server identifiziert werden kann. Du kannst das Alphabet (a~z, A~Z), Ziffern (0~9) oder Unterstriche (_) verwenden. Benutzernamen können später nicht geändert werden.",
	"password": "Passwort",
	"processing": "In Bearbeitung …",
	"next": "Weiter",
	"accountCreated": "Ein Administratorkonto wurde angelegt!",
	"serverSetting": "Servereinstellungen",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "Mit diesem Assistenten lässt sich die optimale Serverkonfiguration leicht einrichten.",
	"settingsYouMakeHereCanBeChangedLater": "Die Einstellungen hier können später geändert werden.",
	"skipSettings": "Konfiguration überspringen",
	"settingsCompleted": "Einrichtung abgeschlossen!",
	"settingsCompleted_description": "Vielen Dank für deine Zeit. Jetzt, wo alles fertig ist, kannst du den Server sofort benutzen.",
	"settingsCompleted_description2": "Detaillierte Servereinstellungen können über die „Systemsteuerung“ vorgenommen werden.",
	"donationRequest": "Spendenaufruf",
	"text1": "Misskey ist eine freie Software, die von Freiwilligen entwickelt wird.",
	"text2": "Wir würden uns über deine Unterstützung freuen, damit wir dieses Projekt auch in Zukunft weiterentwickeln können.",
	"text3": "Für Unterstützer gibt es auch besondere Vorteile!",
	"learnMore": "Mehr erfahren",
	"start": "Anfangen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"somethingHappened": "An error has occurred",
	"permissionDeniedError": "Operation denied",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Incorrect password.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "Username",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"password": "Password",
	"processing": "Processing...",
	"next": "Next",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Learn more",
	"start": "Begin"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"somethingHappened": "Ocurrió un error",
	"permissionDeniedError": "Operación denegada",
	"operationForbidden": "Operación prohibida",
	"incorrectPassword": "La contraseña es incorrecta",
	"installCompleted": "¡La instalación de Misskey se ha completado!",
	"firstCreateAccount": "Para comenzar, crea una cuenta de administrador",
	"initialPasswordForSetup": "Contraseña de configuración inicial",
	"initialPasswordForSetupDescription": "Si ha instalado Misskey usted mismo, utilice la contraseña introducida en el archivo de configuración.\nSi utiliza un servicio de alojamiento de Misskey o similar, utilice la contraseña proporcionada.\nSi no ha establecido una contraseña, déjela en blanco para continuar.",
	"username": "Nombre de usuario",
	"usernameInfo": "Un nombre que identifique su cuenta de otras en este servidor.  Puede utilizar el alfabeto (a~z, A~Z), dígitos (0~9) o guiones bajos (_). Los nombres de usuario no se pueden cambiar posteriormente.",
	"password": "Contraseña",
	"processing": "Procesando...",
	"next": "Siguiente",
	"accountCreated": "¡La cuenta de administrador se ha creado! ",
	"serverSetting": "Configuración del servidor",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "Este asistente te facilita una configuración óptima del servidor.",
	"settingsYouMakeHereCanBeChangedLater": "Los ajustes que han sido cambiados a través de este asistente pueden ser modificados más tarde.",
	"skipSettings": "Omitir configuración",
	"settingsCompleted": "¡Configuración inicial del servidor completada!",
	"settingsCompleted_description": "Gracias por tu tiempo. Ahora que está todo listo puedes empezar a utilizar el servidor inmediatamente.",
	"settingsCompleted_description2": "La configuración avanzada del servidor pueden realizarse a través del \"Panel de control\".",
	"donationRequest": "Por favor Dona",
	"text1": "Misskey es un software libre desarrollado por voluntarios.",
	"text2": "Agradeceríamos su apoyo para que podamos seguir desarrollando este software en el futuro.",
	"text3": "También hay beneficios especiales para los donantes",
	"learnMore": "Ver más",
	"start": "Comenzar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"somethingHappened": "Une erreur est survenue",
	"permissionDeniedError": "Opération refusée",
	"operationForbidden": "Opération non autorisée",
	"incorrectPassword": "Le mot de passe est incorrect.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Mot de passe initial pour la configuration",
	"initialPasswordForSetupDescription": "Utilisez le mot de passe que vous avez entré pour le fichier de configuration si vous avez installé Misskey vous-même.\nSi vous utilisez un service d'hébergement Misskey, utilisez le mot de passe fourni.\nSi vous n'avez pas défini de mot de passe, laissez le champ vide pour continuer.",
	"username": "Nom d’utilisateur·rice",
	"usernameInfo": "C'est un nom qui identifie votre compte sur l'instance de manière unique. Vous pouvez utiliser des lettres de l'alphabet (minuscules et majuscules), des chiffres (de 0 à 9), ou bien le tiret « _ ». Vous ne pourrez pas modifier votre nom d'utilisateur·rice par la suite.",
	"password": "Mot de passe",
	"processing": "Traitement en cours",
	"next": "Suivant",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Plus d'informations",
	"start": "Commencer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"somethingHappened": "Terjadi kesalahan",
	"permissionDeniedError": "Operasi ditolak",
	"operationForbidden": "Operasi dilarang",
	"incorrectPassword": "Kata sandi salah.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Kata sandi untuk konfigurasi awal",
	"initialPasswordForSetupDescription": "Jika Anda memasang Misskey sendiri, gunakan kata sandi yang Anda masukkan di berkas konfigurasi.\nJika Anda menggunakan layanan hosting Misskey, gunakan kata sandi yang diberikan.\nJika Anda belum mengatur kata sandi, biarkan kosong dan lanjutkan.",
	"username": "Nama Pengguna",
	"usernameInfo": "Nama yang mengidentifikasikan akun kamu dari yang lain pada peladen ini. Kamu dapat menggunakan alfabet (a~z, A~Z), digit (0~9) atau garis bawah (_). Username tidak dapat diubah setelahnya.",
	"password": "Kata sandi",
	"processing": "Memproses",
	"next": "Selanjutnya",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Pelajari lebih lanjut",
	"start": "Mulai"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"somethingHappened": "Si è verificato un problema",
	"permissionDeniedError": "Errore, attività non autorizzata",
	"operationForbidden": "Operazione non consentita",
	"incorrectPassword": "La password è errata.",
	"installCompleted": "L'installazione di Misskey è completata!",
	"firstCreateAccount": "Per prima cosa, crea un account amministratore.",
	"initialPasswordForSetup": "Password iniziale per la configurazione",
	"initialPasswordForSetupDescription": "Se hai installato Misskey personalmente, usa la password che hai inserito nel file di configurazione.\nSe stai utilizzando un servizio di hosting Misskey, usa la password fornita dal gestore.\nSe non hai una password preimpostata, lascia il campo vuoto e continua.",
	"username": "Nome utente",
	"usernameInfo": "Un nome per identificare univocamente il tuo profilo sull'istanza. Puoi utilizzare caratteri alfanumerici maiuscoli, minuscoli e il trattino basso (_). Non potrai cambiare nome utente in seguito.",
	"password": "Password",
	"processing": "In elaborazione",
	"next": "Avanti",
	"accountCreated": "Il tuo account amministratore è stato creato!",
	"serverSetting": "Configurazione del server",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "Questa procedura guidata ti aiuterà a configurare facilmente il tuo server in modo ottimale.",
	"settingsYouMakeHereCanBeChangedLater": "Potrai anche modificare le impostazioni in seguito.",
	"skipSettings": "Salta l'installazione",
	"settingsCompleted": "Installazione completata!",
	"settingsCompleted_description": "Grazie per il tuo impegno. Adesso che hai completato la configurazione, puoi iniziare a utilizzare il tuo server.",
	"settingsCompleted_description2": "Le impostazioni dettagliate del server possono essere effettuate tramite il Pannello di controllo.",
	"donationRequest": "Per favore Fai una donazione",
	"text1": "Misskey è un software libero sviluppato da volontari.",
	"text2": "Se puoi, ti preghiamo di prendere in considerazione l'idea di fare una donazione, così potremo continuare a sviluppare.",
	"text3": "Sono previsti anche dei vantaggi speciali per i sostenitori!",
	"learnMore": "Per saperne di più",
	"start": "Inizia!"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"somethingHappened": "問題が発生しました",
	"permissionDeniedError": "操作が拒否されました",
	"operationForbidden": "この操作はできません",
	"incorrectPassword": "パスワードが間違っています。",
	"installCompleted": "Misskeyのインストールが完了しました！",
	"firstCreateAccount": "まずは、管理者アカウントを作成しましょう。",
	"initialPasswordForSetup": "初期設定開始用パスワード",
	"initialPasswordForSetupDescription": "Misskeyを自分でインストールした場合は、設定ファイルに入力したパスワードを使用してください。\nMisskeyのホスティングサービスなどを使用している場合は、提供されたパスワードを使用してください。\nパスワードを設定していない場合は、空欄にしたまま続行してください。",
	"username": "ユーザー名",
	"usernameInfo": "サーバー上であなたのアカウントを一意に識別するための名前。アルファベット(a~z, A~Z)、数字(0~9)、およびアンダーバー(_)が使用できます。ユーザー名は後から変更することは出来ません。",
	"password": "パスワード",
	"processing": "処理中",
	"next": "次",
	"accountCreated": "管理者アカウントが作成されました！",
	"serverSetting": "サーバーの設定",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "このウィザードで簡単に最適なサーバーの設定が行えます。",
	"settingsYouMakeHereCanBeChangedLater": "ここでの設定は、あとからでも変更できます。",
	"skipSettings": "設定をスキップ",
	"settingsCompleted": "設定が完了しました！",
	"settingsCompleted_description": "お疲れ様でした。準備が整ったので、さっそくサーバーの使用を開始できます。",
	"settingsCompleted_description2": "詳細なサーバー設定は、「コントロールパネル」から行えます。",
	"donationRequest": "寄付のお願い",
	"text1": "Misskeyは有志によって開発されている無料のソフトウェアです。",
	"text2": "今後も開発を続けられるように、よろしければぜひカンパをお願いいたします。",
	"text3": "支援者向け特典もあります！",
	"learnMore": "詳しく",
	"start": "始める"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"somethingHappened": "なんかあかんわ",
	"permissionDeniedError": "操作が拒否されてもうた。",
	"operationForbidden": "この操作はできまへん",
	"incorrectPassword": "パスワードがちゃうわ。",
	"installCompleted": "Misskeyのインストールが終わったで！",
	"firstCreateAccount": "最初は、管理者アカウントを作成しよか。",
	"initialPasswordForSetup": "初期設定開始用パスワード",
	"initialPasswordForSetupDescription": "Miskkeyを自分でインストールしたんやったら、設定ファイルに入れたパスワードを使ってや。\nホスティングサービスを使っとるんやったら、サービスから言われたやつを使うんやで。\n別に何も設定しとらんのやったら、何も入れずに空けといてな。",
	"username": "ユーザー名",
	"usernameInfo": "サーバー上であんたのアカウントをあんたやと分かるようにするための名前やで。アルファベット(a~z, A~Z)、数字(0~9)、それとアンダーバー(_)が使って考えてな。この名前は後から変更することはできへんからちゃんと考えるんやで。",
	"password": "パスワード",
	"processing": "処理しとる",
	"next": "次",
	"accountCreated": "管理者アカウントができたで！",
	"serverSetting": "サーバーの設定",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "このウィザードで簡単にええ感じのサーバーの設定ができるで。",
	"settingsYouMakeHereCanBeChangedLater": "ここでの設定は、あとからでも変えられるで。",
	"skipSettings": "設定をスキップ",
	"settingsCompleted": "設定が終わったで！",
	"settingsCompleted_description": "お疲れさん。準備ができたから、さっそくサーバーを使い始められるで。",
	"settingsCompleted_description2": "細かいサーバー設定は、「コントロールパネル」を見てみてな。",
	"donationRequest": "寄付のお願い",
	"text1": "Misskeyは有志で開発されとる無料のソフトウェアやで。",
	"text2": "今後も開発を続けられるように、よかったらぜひカンパをお願いするわ。",
	"text3": "支援者向け特典もあるで！",
	"learnMore": "詳しく",
	"start": "始める"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"somethingHappened": "An error has occurred",
	"permissionDeniedError": "Operation denied",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Incorrect password.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "Isem n umseqdac",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"password": "Awal uffir",
	"processing": "Processing...",
	"next": "Next",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Learn more",
	"start": "Begin"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"somethingHappened": "An error has occurred",
	"permissionDeniedError": "Operation denied",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Incorrect password.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "ಬಳಕೆಹೆಸರು",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"password": "ಗುಪ್ತಪದ",
	"processing": "Processing...",
	"next": "Next",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Learn more",
	"start": "Begin"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"somethingHappened": "오류가 발생했습니다",
	"permissionDeniedError": "작업이 거부되었습니다",
	"operationForbidden": "사용할 수 없습니다",
	"incorrectPassword": "비밀번호가 올바르지 않습니다.",
	"installCompleted": "Misskey의 설치가 완료됐습니다!",
	"firstCreateAccount": "먼저 관리자 계정을 만듭시다.",
	"initialPasswordForSetup": "초기 설정용 비밀번호",
	"initialPasswordForSetupDescription": "Misskey를 직접 설치하는 경우, 설정 파일에 입력해둔 비밀번호를 사용하세요.\nMisskey 설치를 도와주는 호스팅 서비스 등을 사용하는 경우, 서비스 제공자로부터 받은 비밀번호를 사용하세요.\n비밀번호를 따로 설정하지 않은 경우, 아무것도 입력하지 않아도 됩니다.",
	"username": "유저명",
	"usernameInfo": "서버상에서 계정을 식별하기 위한 이름. 알파벳(a~z, A~Z), 숫자(0~9) 및 언더바(_)를 사용할 수 있습니다. 유저명은 나중에 변경할 수 없습니다.",
	"password": "비밀번호",
	"processing": "처리중",
	"next": "다음",
	"accountCreated": "관리자 계정이 만들어졌습니다!",
	"serverSetting": "서버 설정",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "이 위자드로 쉽게 최적화된 서버의 설정을 할 수 있습니다.",
	"settingsYouMakeHereCanBeChangedLater": "이 설정은 나중에 변경 가능합니다.",
	"skipSettings": "설정 건너뛰기",
	"settingsCompleted": "설정이 완료됐습니다!",
	"settingsCompleted_description": "수고하셨습니다. 준비를 마쳤으므로 바로 서버의 이용을 시작하실 수 있습니다.",
	"settingsCompleted_description2": "상세한 서버 설정은 '제어판'에서 하실 수 있습니다.",
	"donationRequest": "기부 요청",
	"text1": "Misskey는 자원봉사자들에 의해 개발되는 무료 소프트웨어입니다.",
	"text2": "앞으로도 계속해서 개발을 할 수 있도록 괜찮으시다면 부디 기부를 부탁드립니다.",
	"text3": "지원자 대상 특전도 있습니다!",
	"learnMore": "자세히",
	"start": "시작하기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"somethingHappened": "Er is iets misgegaan.",
	"permissionDeniedError": "Operation denied",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Onjuist wachtwoord.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initiële wachtwoord voor configuratie",
	"initialPasswordForSetupDescription": "Gebruik het initiële wachtwoord uit de configuratie, als je Misskey zelf hebt geïnstalleerd.\nAls je een Misskey hosting provider gebruikt, gebruik dan het gegeven wachtwoord.\nAls je geen wachtwoord hebt gezet, laat het dan leeg om verder te gaan.",
	"username": "Gebruikersnaam",
	"usernameInfo": "Een naam die kan worden gebruikt om je gebruikersaccount op deze server te identificeren. Je kunt het alfabet (a~z, A~Z), cijfers (0~9) of underscores (_) gebruiken. Gebruikersnamen kunnen later niet worden gewijzigd.",
	"password": "Wachtwoord",
	"processing": "Bezig met verwerken",
	"next": "Volgende",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Meer leren",
	"start": "Aan de slag"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"somethingHappened": "En feil har oppstått",
	"permissionDeniedError": "Operation denied",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Incorrect password.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "Brukernavn",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"password": "Passord",
	"processing": "Processing...",
	"next": "Neste",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Les mer",
	"start": "Begin"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"somethingHappened": "Coś poszło nie tak",
	"permissionDeniedError": "Odrzucono operacje",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Nieprawidłowe hasło.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "Nazwa użytkownika",
	"usernameInfo": "Nazwa, która identyfikuje Twoje konto spośród innych na tym serwerze.  Możesz użyć alfabetu (a~z, A~Z), cyfr (0~9) lub podkreślników (_). Nazwy użytkownika nie mogą być później zmieniane.",
	"password": "Hasło",
	"processing": "Przetwarzanie",
	"next": "Dalej",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Dowiedz się więcej",
	"start": "Rozpocznij"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"somethingHappened": "Ocorreu um erro",
	"permissionDeniedError": "Operação recusada",
	"operationForbidden": "Operação proibída",
	"incorrectPassword": "Senha inválida.",
	"installCompleted": "Instalação do Misskey concluída!",
	"firstCreateAccount": "Para iniciar, crie uma conta de administrador.",
	"initialPasswordForSetup": "Senha para a configuração inicial",
	"initialPasswordForSetupDescription": "Use a senha configurada no arquivo de configuração se você instalou o Misskey manualmente.\nSe você estiver utilizando um serviço de hospedagem, utilize a senha fornecida.\nSe uma senha não foi configurada, deixe em branco e continue.",
	"username": "Nome de usuário",
	"usernameInfo": "O nome para identificar exclusivamente a sua conta no servidor. Pode conter letras (az, AZ), números (0~9) e sublinhados (_). O nome de usuário não pode ser alterado posteriormente.",
	"password": "Senha",
	"processing": "Em Progresso",
	"next": "Seguinte",
	"accountCreated": "Conta de administrador foi criada!",
	"serverSetting": "Configurações de Servidor",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "O assistente facilita a configuração do servidor.",
	"settingsYouMakeHereCanBeChangedLater": "Configurações alteradas pelo assistente podem ser ajustadas posteriormente.",
	"skipSettings": "Pular configuração",
	"settingsCompleted": "Instalação concluída!",
	"settingsCompleted_description": "Obrigado pelo seu tempo. Agora que tudo está pronto, você pode começar a utilizar o servidor.",
	"settingsCompleted_description2": "As configurações do servidor podem ser alteradas no \"Painel de Controle\"",
	"donationRequest": "Solicitação de Doação",
	"text1": "Misskey é software aberto desenvolvido por voluntários.",
	"text2": "Nós apreciaríamos o seu apoio para podermos continuar o desenvolvimento desse software no futuro.",
	"text3": "Também há benefícios especiais para apoiadores!",
	"learnMore": "Saiba mais",
	"start": "começar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"somethingHappened": "Что-то пошло не так",
	"permissionDeniedError": "Операция запрещена",
	"operationForbidden": "Это действие запрещено",
	"incorrectPassword": "Пароль неверен.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Пароль для начала настройки",
	"initialPasswordForSetupDescription": "Если вы установили Misskey самостоятельно, используйте пароль, который вы указали в файле конфигурации.\nЕсли вы используете что-то вроде хостинга Misskey, используйте предоставленный пароль.\nЕсли вы не установили пароль, оставьте его пустым и продолжайте.",
	"username": "Имя пользователя",
	"usernameInfo": "Имя, которое отличает вашу учетную запись от других на этом сервере. Вы можете использовать алфавит (a~z, A~Z), цифры (0~9) или символы подчеркивания (_). Имена пользователей не могут быть изменены позже.",
	"password": "Пароль",
	"processing": "Обработка",
	"next": "Дальше",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Подробнее",
	"start": "Начать"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"permissionDeniedError": "Operation denied",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Nesprávne heslo.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "Meno používateľa",
	"usernameInfo": "Meno, ktoré odlišuje váš účet od ostatných na tomto serveri. Môžete použiť abecedu (a~z, A~Z), čísla (0~9) alebo podtržník (_). Používateľské mená sa nedajú neskôr zmeniť.",
	"password": "Heslo",
	"processing": "Pracujem...",
	"next": "Ďalší",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Zistiť viac",
	"start": "Začať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"permissionDeniedError": "การดำเนินถูกปฏิเสธ",
	"operationForbidden": "การดำเนินการถูกห้าม",
	"incorrectPassword": "รหัสผ่านไม่ถูกต้อง",
	"installCompleted": "การติดตั้ง Misskey เสร็จสมบูรณ์แล้ว!",
	"firstCreateAccount": "ขั้นแรก ให้สร้างบัญชีผู้ดูแลระบบ",
	"initialPasswordForSetup": "รหัสผ่านเริ่มต้นสำหรับการตั้งค่า",
	"initialPasswordForSetupDescription": "ถ้าหากคุณติดตั้ง Misskey เอง ให้ใช้รหัสผ่านที่คุณป้อนในไฟล์กำหนดค่า \nถ้าหากคุณกำลังใช้บริการโฮสต์ Misskey ให้ใช้รหัสผ่านที่ได้รับมา\nถ้ายังไม่มีรหัสผ่าน ให้ข้ามช่องรหัสผ่านไป แล้วกดต่อไป",
	"username": "ชื่อผู้ใช้",
	"usernameInfo": "ชื่อที่ระบุบัญชีของคุณจากผู้อื่นในเซิร์ฟเวอร์นี้ คุณสามารถใช้ตัวอักษร (a~z, A~Z), ตัวเลข (0~9) หรือขีดล่าง (_) ชื่อผู้ใช้ไม่สามารถเปลี่ยนแปลงได้ในภายหลัง",
	"password": "รหัสผ่าน",
	"processing": "กำลังประมวลผล...",
	"next": "ถัด\u200bไป",
	"accountCreated": "บัญชีผู้ดูแลระบบถูกสร้างขึ้นแล้ว!",
	"serverSetting": "การตั้งค่าเซิร์ฟเวอร์",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "สามารถตั้งค่าเซิร์ฟเวอร์ได้อย่างง่ายดายด้วยวิซาร์ดนี้",
	"settingsYouMakeHereCanBeChangedLater": "สามารถเปลี่ยนแปลงการตั้งค่าเหล่านี้ในภายหลังได้",
	"skipSettings": "ข้ามการตั้งค่า",
	"settingsCompleted": "การตั้งค่าเสร็จสมบูรณ์แล้ว!",
	"settingsCompleted_description": "ขอบคุณที่สละเวลามาตั้งค่า ตอนนี้เซิร์ฟเวอร์พร้อมใช้งานได้ทันที",
	"settingsCompleted_description2": "การตั้งค่าเซิร์ฟเวอร์อย่างละเอียดสามารถทำได้จาก “แผงควบคุม”",
	"donationRequest": "คำขอรับบริจาค",
	"text1": "Misskey เป็นซอฟต์แวร์ฟรีที่พัฒนาโดยอาสาสมัคร",
	"text2": "เพื่อให้การพัฒนางานนี้สามารถดำเนินต่อไปได้ในอนาคต หากไม่เป็นการรบกวน รบกวนพิจารณาร่วมสมทบทุนด้วยนะคะ",
	"text3": "นอกจากนี้ยังมีสิทธิพิเศษสำหรับผู้สนับสนุนอีกด้วยค่ะ",
	"learnMore": "แสดงให้ดูหน่อย",
	"start": "เริ่ม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"somethingHappened": "Bir hata oluştu",
	"permissionDeniedError": "İşlem reddedildi",
	"operationForbidden": "İşlem yasak",
	"incorrectPassword": "Yanlış şifre.",
	"installCompleted": "Misskey kurulumu tamamlandı!",
	"firstCreateAccount": "Başlamak için bir yönetici hesabı oluşturun.",
	"initialPasswordForSetup": "Kurulum için ilk şifre",
	"initialPasswordForSetupDescription": "Misskey'i kendiniz kurduysan, yapılandırma dosyasında belirtilen şifreyi kullan.\nMisskey barındırma hizmeti veya benzeri bir hizmet kullanıyorsan, orada belirtilen şifreyi kullan.\nŞifre belirlemediysen, devam etmek için boş bırak.",
	"username": "Kullanıcı Adı",
	"usernameInfo": "Bu sunucudaki diğer hesaplardan hesabını ayıran bir isim.  Alfabe (a~z, A~Z), rakamlar (0~9) veya alt çizgi (_) kullanabilirsin. Kullanıcı adları daha sonra değiştirilemez.",
	"password": "Şifre",
	"processing": "İşleniyor...",
	"next": "Sonraki",
	"accountCreated": "Yönetici hesabı oluşturuldu!",
	"serverSetting": "Sunucu Ayarları",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "Bu sihirbaz, sunucu ayarlarını yapılandırmayı kolaylaştırır.",
	"settingsYouMakeHereCanBeChangedLater": "Bu sihirbaz aracılığıyla değiştirilen ayarlar daha sonra yeniden düzenlenebilir.",
	"skipSettings": "Ayarları atla",
	"settingsCompleted": "Kurulum tamamlandı!",
	"settingsCompleted_description": "Zaman ayırdığınız için teşekkür ederiz. Artık her şey hazır olduğuna göre, sunucuyu hemen kullanmaya başlayabilirsin.",
	"settingsCompleted_description2": "Sunucu ayarları “Kontrol Paneli”nden değiştirilebilir.",
	"donationRequest": "Bağış Talebi",
	"text1": "Misskey, gönüllüler tarafından geliştirilen ücretsiz bir yazılımdır.",
	"text2": "Bu yazılımı gelecekte de geliştirmeye devam edebilmemiz için desteğini rica ederiz.",
	"text3": "Destekçilere özel avantajlar da var!",
	"learnMore": "Daha fazla bilgi edinin",
	"start": "Başla"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"somethingHappened": "An error has occurred",
	"permissionDeniedError": "Operation denied",
	"operationForbidden": "Operation forbidden",
	"incorrectPassword": "Incorrect password.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Initial password for setup",
	"initialPasswordForSetupDescription": "Use the password you entered in the configuration file if you installed Misskey yourself.\n If you are using a Misskey hosting service, use the password provided.\n If you have not set a password, leave it blank to continue.",
	"username": "Username",
	"usernameInfo": "A name that identifies your account from others on this server.  You can use the alphabet (a~z, A~Z), digits (0~9) or underscores (_). Usernames cannot be changed later.",
	"password": "Password",
	"processing": "Processing...",
	"next": "Next",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Learn more",
	"start": "Begin"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"somethingHappened": "Щось пішло не так",
	"permissionDeniedError": "Операцію заборонено",
	"operationForbidden": "Операцію заборонено",
	"incorrectPassword": "Неправильний пароль.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Початковий пароль для налаштування",
	"initialPasswordForSetupDescription": "Використайте пароль, вказаний у конфігураційному файлі, якщо ви встановлювали Misskey власноруч.\nЯкщо використовуєте сервіси хостингу Misskey, використайте наданий пароль.\nЯкщо ви не маєте паролю, лишіть порожнім щоб продовжити. ",
	"username": "Ім'я користувача",
	"usernameInfo": "Ім’я, яке відрізняє ваш обліковий запис від інших на цьому сервері. Можна використовувати латинські літери (az, AZ), цифри (0~9) або підкреслення (_). Ім’я користувача не можна буде змінити пізніше.",
	"password": "Пароль",
	"processing": "Обробка",
	"next": "Далі",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Докладніше",
	"start": "Розпочати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"somethingHappened": "Xảy ra lỗi",
	"permissionDeniedError": "Thao tác bị từ chối",
	"operationForbidden": "Thao tác này không thể thực hiện",
	"incorrectPassword": "Sai mật khẩu.",
	"installCompleted": "Misskey installation is now complete!",
	"firstCreateAccount": "To begin, create an administrator account.",
	"initialPasswordForSetup": "Mật khẩu ban đầu để thiết lập",
	"initialPasswordForSetupDescription": "Nếu bạn tự cài đặt Misskey, hãy sử dụng mật khẩu ban đầu của bạn đã nhập trong tệp cấu hình.\nNếu bạn đang sử dụng dịch vụ nào đó giống như dịch vụ lưu trữ của Misskey, hãy sử dụng mật khẩu ban đầu được cung cấp.\nNếu bạn chưa đặt mật khẩu ban đầu, vui lòng để trống và tiếp tục.",
	"username": "Tên người dùng",
	"usernameInfo": "Bạn có thể sử dụng chữ cái (a ~ z, A ~ Z), chữ số (0 ~ 9) hoặc dấu gạch dưới (_). Tên người dùng không thể thay đổi sau này.",
	"password": "Mật khẩu",
	"processing": "Đang xử lý",
	"next": "Kế tiếp",
	"accountCreated": "Administrator account has been created!",
	"serverSetting": "Server Settings",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "This wizard makes it easier to configure the server settings.",
	"settingsYouMakeHereCanBeChangedLater": "The settings that were changed via this wizard can be adjusted later.",
	"skipSettings": "Skip settings",
	"settingsCompleted": "Setup is now complete!",
	"settingsCompleted_description": "Thank you for your time. Now that everything is ready, you can start using the server right away.",
	"settingsCompleted_description2": "The server settings can be changed from the “Control Panel”",
	"donationRequest": "Donation Request",
	"text1": "Misskey is a free software developed by volunteers.",
	"text2": "We would appreciate your support so that we can continue to develop this software further into the future.",
	"text3": "There are also special benefits for supporters!",
	"learnMore": "Tìm hiểu thêm",
	"start": "Bắt đầu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"somethingHappened": "出错了",
	"permissionDeniedError": "操作被拒绝",
	"operationForbidden": "不允许此操作",
	"incorrectPassword": "密码错误",
	"installCompleted": "Misskey 安装完成！",
	"firstCreateAccount": "首先，创建一个管理员帐户。",
	"initialPasswordForSetup": "初始化密码",
	"initialPasswordForSetupDescription": "如果是自己安装的 Misskey，请输入配置文件里设好的密码。\n如果使用的是 Misskey 的托管服务等，请输入服务商提供的密码。\n如果没有设置密码，请留空并继续。",
	"username": "用户名",
	"usernameInfo": "在服务器上唯一标识您的帐户的名称。您可以使用字母 (a ~ z, A ~ Z)、数字 (0 ~ 9) 和下划线 (_)。用户名以后不能更改。",
	"password": "密码",
	"processing": "正在处理",
	"next": "下一个",
	"accountCreated": "管理员账号已创建！",
	"serverSetting": "服务器设置",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "用此向导来轻松地以最佳方式配置服务器。",
	"settingsYouMakeHereCanBeChangedLater": "这里的设置在之后也能更改。",
	"skipSettings": "跳过设置",
	"settingsCompleted": "设置完成！",
	"settingsCompleted_description": "辛苦了。设置已完成，可以立即开始使用服务器了。",
	"settingsCompleted_description2": "服务器的详细设置可在 “控制面板” 进行。",
	"donationRequest": "请求捐助",
	"text1": "Misskey 是由志愿者开发的免费软件。",
	"text2": "为了今后也能继续开发，如果可以的话，请考虑一下捐助。",
	"text3": "也有面向支援者的特典！",
	"learnMore": "更多信息",
	"start": "开始"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"somethingHappened": "發生錯誤",
	"permissionDeniedError": "操作被拒絕",
	"operationForbidden": "不允許此操作",
	"incorrectPassword": "密碼錯誤。",
	"installCompleted": "Misskey 的安裝已經完成了！",
	"firstCreateAccount": "首先，請建立管理者帳戶。",
	"initialPasswordForSetup": "啟動初始設定的密碼",
	"initialPasswordForSetupDescription": "如果您自己安裝了 Misskey，請使用您在設定檔中輸入的密碼。\n如果您使用 Misskey 的託管服務之類的服務，請使用提供的密碼。\n如果您尚未設定密碼，請將其留空並繼續。",
	"username": "使用者名稱",
	"usernameInfo": "在伺服器上您的帳戶是唯一的識別名稱。您可以使用字母 (a ~ z, A ~ Z)、數字 (0 ~ 9) 和下底線 (_)。之後帳戶名是不能更改的。",
	"password": "密碼",
	"processing": "處理中",
	"next": "下一步",
	"accountCreated": "已建立管理者帳戶！",
	"serverSetting": "伺服器設定",
	"youCanEasilyConfigureOptimalServerSettingsWithThisWizard": "利用這個精靈，可以簡單地最佳化伺服器的設定。",
	"settingsYouMakeHereCanBeChangedLater": "這裡的設定之後也可以進行更改。\n",
	"skipSettings": "跳過設定",
	"settingsCompleted": "設定完成！",
	"settingsCompleted_description": "辛苦了！準備已經完成，您可以立即開始使用伺服器了。\n",
	"settingsCompleted_description2": "詳細的伺服器設定可透過「控制臺」進行。",
	"donationRequest": "請求捐款",
	"text1": "Misskey 是由志願者開發的免費軟體。",
	"text2": "為了能夠繼續開發，若您願意的話，請考慮進行捐款。\n",
	"text3": "也有提供支援者專屬的特典！\n",
	"learnMore": "更多資訊",
	"start": "開始"
}
</locale>
