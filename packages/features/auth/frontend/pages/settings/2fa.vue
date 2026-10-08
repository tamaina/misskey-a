<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker markerId="2fa" :keywords="['2fa']">
	<FormSection :first="first">
		<template #label><SearchLabel>{{ $locale.sfc['2fa'] }}</SearchLabel></template>

		<div v-if="$i" class="_gaps_s">
			<MkInfo v-if="$i.twoFactorEnabled && $i.twoFactorBackupCodesStock === 'partial'" warn>
				{{ $locale.sfc['2faBackupCodeUsedWarning'] }}
			</MkInfo>
			<MkInfo v-if="$i.twoFactorEnabled && $i.twoFactorBackupCodesStock === 'none'" warn>
				{{ $locale.sfc['2faBackupCodesExhaustedWarning'] }}
			</MkInfo>

			<SearchMarker :keywords="['totp', 'app']">
				<MkFolder :defaultOpen="true">
					<template #icon><i class="ti ti-shield-lock"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.totp }}</SearchLabel></template>
					<template #caption><SearchText>{{ $locale.sfc.totpDescription }}</SearchText></template>
					<template #suffix><i v-if="$i.twoFactorEnabled" class="ti ti-check" style="color: var(--MI_THEME-success)"></i></template>

					<div v-if="$i.twoFactorEnabled" class="_gaps_s">
						<div>{{ $locale.sfc['2faAlreadyRegistered'] }}</div>
						<template v-if="$i.securityKeysList!.length > 0">
							<MkButton @click="renewTOTP">{{ $locale.sfc['2faRenewTOTP'] }}</MkButton>
							<MkInfo>{{ $locale.sfc['2faWhyTOTPOnlyRenew'] }}</MkInfo>
						</template>
						<MkButton v-else danger @click="unregisterTOTP">{{ $locale.sfc.unregister }}</MkButton>
					</div>

					<div v-else-if="!$i.twoFactorEnabled" class="_gaps_s">
						<MkButton primary gradate @click="registerTOTP">{{ $locale.sfc['2faRegisterTOTP'] }}</MkButton>
						<MkLink url="https://misskey-hub.net/docs/for-users/stepped-guides/how-to-enable-2fa/" target="_blank"><i class="ti ti-help-circle"></i> {{ $locale.sfc.learnMore }}</MkLink>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['security', 'key', 'passkey']">
				<MkFolder>
					<template #icon><i class="ti ti-key"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.securityKeyAndPasskey }}</SearchLabel></template>
					<div class="_gaps_s">
						<MkInfo>
							{{ $locale.sfc['2faSecurityKeyInfo'] }}
						</MkInfo>

						<MkInfo v-if="!browserSupportsWebAuthn()" warn>
							{{ $locale.sfc['2faSecurityKeyNotSupported'] }}
						</MkInfo>

						<MkInfo v-else-if="browserSupportsWebAuthn() && !$i.twoFactorEnabled" warn>
							{{ $locale.sfc['2faRegisterTOTPBeforeKey'] }}
						</MkInfo>

						<template v-else>
							<MkButton primary @click="addSecurityKey">{{ $locale.sfc['2faRegisterSecurityKey'] }}</MkButton>
							<MkFolder v-for="key in $i.securityKeysList!" :key="key.id">
								<template #label>{{ key.name }}</template>
								<template #suffix><I18n :src="$locale.sfc.lastUsedAt"><template #t><MkTime :time="key.lastUsed"/></template></I18n></template>
								<div class="_buttons">
									<MkButton @click="renameKey(key)"><i class="ti ti-forms"></i> {{ $locale.sfc.rename }}</MkButton>
									<MkButton danger @click="unregisterKey(key)"><i class="ti ti-trash"></i> {{ $locale.sfc.unregister }}</MkButton>
								</div>
							</MkFolder>
						</template>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['password', 'less', 'key', 'passkey', 'login', 'signin']">
				<MkSwitch :disabled="!$i.twoFactorEnabled || $i.securityKeysList!.length === 0" :modelValue="usePasswordLessLogin" @update:modelValue="v => updatePasswordLessLogin(v)">
					<template #label><SearchLabel>{{ $locale.sfc.passwordLessLogin }}</SearchLabel></template>
					<template #caption><SearchText>{{ $locale.sfc.passwordLessLoginDescription }}</SearchText></template>
				</MkSwitch>
			</SearchMarker>
		</div>
	</FormSection>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { updateCurrentAccountPartial } from '@features/auth/frontend/accounts.js';

const $i = ensureSignin();

// メモ: 各エンドポイントはmeUpdatedを発行するため、refreshAccountは不要

withDefaults(defineProps<{
	first?: boolean;
}>(), {
	first: false,
});

const usePasswordLessLogin = computed(() => $i.usePasswordLessLogin ?? false);

async function registerTOTP(): Promise<void> {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	const twoFactorData = await os.apiWithDialog('i/2fa/register', {
		password: auth.result.password,
		token: auth.result.token,
	});

	const { dispose } = await os.popupAsyncWithDialog(import('@features/auth/frontend/pages/settings/2fa.qrdialog.vue').then(x => x.default), {
		twoFactorData,
	}, {
		closed: () => dispose(),
	});
}

async function unregisterTOTP(): Promise<void> {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	os.apiWithDialog('i/2fa/unregister', {
		password: auth.result.password,
		token: auth.result.token,
	}).then(res => {
		updateCurrentAccountPartial({
			twoFactorEnabled: false,
		});
	}).catch(error => {
		os.alert({
			type: 'error',
			text: error,
		});
	});
}

function renewTOTP(): void {
	os.confirm({
		type: 'question',
		title: $locale.value.sfc['2faRenewTOTP'],
		text: $locale.value.sfc['2faRenewTOTPConfirm'],
		okText: $locale.value.sfc['2faRenewTOTPOk'],
		cancelText: $locale.value.sfc['2faRenewTOTPCancel'],
	}).then(({ canceled }) => {
		if (canceled) return;
		registerTOTP();
	});
}

async function unregisterKey(key: NonNullable<Misskey.entities.MeDetailedOnly['securityKeysList']>[number]) {
	const confirm = await os.confirm({
		type: 'question',
		title: $locale.value.sfc['2faRemoveKey'],
		text: interpolateLocaleParameters($locale.value.sfc['2faRemoveKeyConfirm'], { name: key.name }),
	});
	if (confirm.canceled) return;

	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	await os.apiWithDialog('i/2fa/remove-key', {
		password: auth.result.password,
		token: auth.result.token,
		credentialId: key.id,
	});
	os.success();
}

async function renameKey(key: NonNullable<Misskey.entities.MeDetailedOnly['securityKeysList']>[number]) {
	const name = await os.inputText({
		title: $locale.value.sfc.rename,
		default: key.name,
		type: 'text',
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	await os.apiWithDialog('i/2fa/update-key', {
		name: name.result,
		credentialId: key.id,
	});
}

async function addSecurityKey() {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	const registrationOptions = await os.apiWithDialog('i/2fa/register-key', {
		password: auth.result.password,
		token: auth.result.token,
	});

	const name = await os.inputText({
		title: $locale.value.sfc['2faRegisterSecurityKey'],
		text: $locale.value.sfc['2faSecurityKeyName'],
		type: 'text',
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	const credential = await os.promiseDialog(
		startRegistration({ optionsJSON: registrationOptions }),
		null,
		() => {}, // ユーザーのキャンセルはrejectなのでエラーダイアログを出さない
		$locale.value.sfc['2faTapSecurityKey'],
	);
	if (!credential) return;

	const auth2 = await os.authenticateDialog();
	if (auth2.canceled) return;

	await os.apiWithDialog('i/2fa/key-done', {
		password: auth2.result.password,
		token: auth2.result.token,
		name: name.result,
		credential: credential,
	});
}

async function updatePasswordLessLogin(value: boolean) {
	await os.apiWithDialog('i/2fa/password-less', {
		value,
	});
}
</script>

<locale lang="json" locale="ar-SA">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "تطبيق استيثاق",
	"totpDescription": "Use an authenticator app to enter one-time passwords",
	"2faAlreadyRegistered": "سجلت سلفًا جهازًا للاستيثاق بعاملين.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "إلغاء التسجيل",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "راجع المزيد",
	"securityKeyAndPasskey": "الأمن ومفاتيح الأمان",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "آخر استخدام: {t}",
	"rename": "إعادة التسمية",
	"passwordLessLogin": "لِج مِن دون كلمة سرية",
	"passwordLessLoginDescription": "Allows password-less login using a security- or passkey only",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "ليس اﻵن",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "الاستيثاق بعاملَيْن"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"2faBackupCodeUsedWarning": "Es va utilitzar un codi de còpia de seguretat. Si l'aplicació de certificació està disponible, reconfigura l'aplicació d'autenticació tan aviat com sigui possible.",
	"2faBackupCodesExhaustedWarning": "Es van utilitzar tots els codis de còpia de seguretat. Si no es pot utilitzar l'aplicació d'autenticació, ja no es pot accedir al compte. Torna a registrar l'aplicació d'autenticació.",
	"totp": "Aplicació d'autenticació",
	"totpDescription": "Escriu una contrasenya d'un sol us fent servir l'aplicació d'autenticació",
	"2faAlreadyRegistered": "J has registrat un dispositiu d'autenticació de doble factor.",
	"2faRenewTOTP": "Reconfigurar l'aplicació d'autenticació ",
	"2faWhyTOTPOnlyRenew": "L'aplicació d'autenticació no es pot eliminar mentre hi hagi una clau de seguretat registrada.",
	"unregister": "Cancel·la el registre",
	"2faRegisterTOTP": "Registrar una aplicació autenticadora",
	"learnMore": "Saber-ne més ",
	"securityKeyAndPasskey": "Clau de seguretat / Clau de pas",
	"2faSecurityKeyInfo": "A més de l'empremta digital o PIN per autenticar-te, pots configurar autenticació mitjançant maquinari que suporti claus de seguretat FIDO2, per protegir encara més el teu compte.",
	"2faSecurityKeyNotSupported": "El teu navegador no suporta claus de seguretat",
	"2faRegisterTOTPBeforeKey": "Configura una aplicació d'autenticació per registrar una clau de seguretat o una clau de pas.",
	"2faRegisterSecurityKey": "Registrar una clau de seguretat o clau de pas",
	"lastUsedAt": "Fet servir per última vegada: {t}",
	"rename": "Canvia el nom",
	"passwordLessLogin": "Inici de sessió sense contrasenya",
	"passwordLessLoginDescription": "Permet l'inici de sessió sense contrasenya fent servir només una Clau de seguretat/Clau de pas",
	"2faRenewTOTPConfirm": "Això farà que els codis de validació de l'antiga aplicació deixin de funcionar",
	"2faRenewTOTPOk": "Reconfigurar",
	"2faRenewTOTPCancel": "No, gràcies",
	"2faRemoveKey": "Esborrar la clau de seguretat",
	"2faRemoveKeyConfirm": "Esborrar la còpia de seguretat {name}?",
	"2faSecurityKeyName": "Escriu un nom per la clau",
	"2faTapSecurityKey": "Seguiu les instruccions del navegador i registrar les claus de seguretat o la clau de pas",
	"2fa": "Autenticació de doble factor"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Ověřovací aplikace",
	"totpDescription": "Použít ověřovací aplikaci pro použití jednorázových hesel",
	"2faAlreadyRegistered": "Již jste zaregistrovali dvoufaktorové ověřovací zařízení.",
	"2faRenewTOTP": "Překonfigurování aplikace autentizátor",
	"2faWhyTOTPOnlyRenew": "Aplikaci autentizátoru nelze odstranit, dokud je zaregistrován bezpečnostní klíč.",
	"unregister": "Odstranit",
	"2faRegisterTOTP": "Registrovat aplikaci autentizátoru",
	"learnMore": "Zjistit více",
	"securityKeyAndPasskey": "Bezpečnostní klíče a tokeny",
	"2faSecurityKeyInfo": "Kromě ověřování otiskem prstu nebo PIN můžete nastavit také ověřování pomocí hardwarových bezpečnostních klíčů, které podporují FIDO2, a svůj účet tak dále zabezpečit.",
	"2faSecurityKeyNotSupported": "Váš prohlížeč nepodporuje bezpečnostní klíče.",
	"2faRegisterTOTPBeforeKey": "Nastavte aplikaci autentizátoru pro registraci bezpečnostního nebo přístupového klíče.",
	"2faRegisterSecurityKey": "Registrace bezpečnostního nebo přístupového klíče",
	"lastUsedAt": "Naposledy použito: {t}",
	"rename": "Přejmenovat",
	"passwordLessLogin": "Přihlášení bez hesla",
	"passwordLessLoginDescription": "Umožní bez-heslové přihlášení pomocí bezpečnostního klíče či tokenu",
	"2faRenewTOTPConfirm": "Tohle způsobí, že ověřovací kódy z předchozí aplikace přestanou fungovat.",
	"2faRenewTOTPOk": "Přenastavit",
	"2faRenewTOTPCancel": "Ne děkuji",
	"2faRemoveKey": "Odstranit bezpečnostní klíč",
	"2faRemoveKeyConfirm": "Opravdu chcete odstranit klíč {name}?",
	"2faSecurityKeyName": "Zadejte název klíče",
	"2faTapSecurityKey": "Při registraci bezpečnostního nebo přístupového klíče postupujte podle svého prohlížeče.",
	"2fa": "Dvoufázové ověření"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Authenticator App",
	"totpDescription": "Use an authenticator app to enter one-time passwords",
	"2faAlreadyRegistered": "You have already registered a 2-factor authentication device.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Unregister",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Learn more",
	"securityKeyAndPasskey": "Security- and passkeys",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Last used: {t}",
	"rename": "Rename",
	"passwordLessLogin": "Password-less login",
	"passwordLessLoginDescription": "Allows password-less login using a security- or passkey only",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "Cancel",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Two-factor authentication"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"2faBackupCodeUsedWarning": "Ein Backup-Code wurde verwendet. Falls du den Zugriff zu deiner Zweifaktorauthentifizierungsapp verloren hast, konfiguriere diese bitte möglichst bald erneut.",
	"2faBackupCodesExhaustedWarning": "Alle Backup-Codes wurden verwendet. Falls du den Zugang zu deiner Zweifaktorauthentifizierungsapp verlierst, wirst du dich nicht mehr in dieses Konto einloggen können. Bitte konfiguriere diese App erneut.",
	"totp": "Authentifizierungs-App",
	"totpDescription": "Logge dich via Authentifizierungs-App mit Einmalpasswort ein",
	"2faAlreadyRegistered": "Du hast bereits ein Gerät für Zwei-Faktor-Authentifizierung registriert.",
	"2faRenewTOTP": "Authentifizierungs-App neu einrichten",
	"2faWhyTOTPOnlyRenew": "Solange ein Sicherheitsschlüssel registriert ist, kann die Authentifizierungs-App nicht entfernt werden.",
	"unregister": "Deaktivieren",
	"2faRegisterTOTP": "Authentifizierungs-App registrieren",
	"learnMore": "Mehr erfahren",
	"securityKeyAndPasskey": "Hardware-Sicherheitsschlüssel und Passkeys",
	"2faSecurityKeyInfo": "Du kannst neben Fingerabdruck- oder PIN-Authentifizierung auf deinem Gerät auch Anmeldung mit Hilfe eines FIDO2-kompatiblen Hardware-Sicherheitsschlüssels einrichten.",
	"2faSecurityKeyNotSupported": "Dein Browser unterstützt keine Hardware-Sicherheitsschlüssel.",
	"2faRegisterTOTPBeforeKey": "Um einen Security-Token oder einen Passkey zu registrieren, musst du zuerst eine Authentifizierungs-App registrieren.",
	"2faRegisterSecurityKey": "Hardware-Sicherheitsschlüssel oder Passkey registrieren",
	"lastUsedAt": "Zuletzt verwendet: {t}",
	"rename": "Umbenennen",
	"passwordLessLogin": "Passwortloses Anmelden",
	"passwordLessLoginDescription": "Ermöglicht passwortloses Einloggen mit einem Security-Token oder Passkey",
	"2faRenewTOTPConfirm": "Codes der bisherigen App werden hierdurch nutzlos",
	"2faRenewTOTPOk": "Neu einrichten",
	"2faRenewTOTPCancel": "Abbrechen",
	"2faRemoveKey": "Sicherheitsschlüssel entfernen",
	"2faRemoveKeyConfirm": "Den Schlüssel {name} wirklich löschen?",
	"2faSecurityKeyName": "Schlüsselname eingeben",
	"2faTapSecurityKey": "Bitten folge den Anweisungen deines Browsers zur Registrierung",
	"2fa": "Zwei-Faktor-Authentifizierung"
}
</locale>

<locale lang="json" locale="en-US">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Authenticator App",
	"totpDescription": "Use an authenticator app to enter one-time passwords",
	"2faAlreadyRegistered": "You have already registered a 2-factor authentication device.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Unregister",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Learn more",
	"securityKeyAndPasskey": "Security- and passkeys",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Last used: {t}",
	"rename": "Rename",
	"passwordLessLogin": "Password-less login",
	"passwordLessLoginDescription": "Allows password-less login using a security- or passkey only",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "Cancel",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Two-factor authentication"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"2faBackupCodeUsedWarning": "Has usado todos los códigos de respaldo. Si dejas de tener acceso a tu aplicación de autenticación, no podrás volver a iniciar sesión en tu cuenta. Por favor, reconfigura tu aplicación de autenticación lo antes posible.",
	"2faBackupCodesExhaustedWarning": "Has usado todos los códigos de respaldo. Si dejas de tener acceso a tu aplicación de autenticación, no podrás volver a iniciar sesión en la cuenta que figura arriba. Por favor, reconfigura tu aplicación de autenticación lo antes posible.",
	"totp": "Aplicación autentícadora",
	"totpDescription": "Ingresa una contaseña de un sólo uso usando la aplicación autenticadora",
	"2faAlreadyRegistered": "Ya has completado la configuración.",
	"2faRenewTOTP": "Reconfigurar la aplicación autenticadora",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.\nLa aplicación autenticadora no puede ser eliminada mientras la llave de seguridad se encuentre registrada.",
	"unregister": "Cancelar registro",
	"2faRegisterTOTP": "Registrar aplicación autenticadora",
	"learnMore": "Ver más",
	"securityKeyAndPasskey": "Clave de seguridad / clave de paso",
	"2faSecurityKeyInfo": "Se puede configurar el inicio de sesión usando una clave de seguridad de hardware que soporte FIDO2 o con un certificado de huella digital o con un PIN",
	"2faSecurityKeyNotSupported": "Tu navegador no soporta claves de autenticación.",
	"2faRegisterTOTPBeforeKey": "Por favor. configura una aplicación de autenticación para registrar una llave de seguridad.",
	"2faRegisterSecurityKey": "Registrar una llave de seguridad",
	"lastUsedAt": "Último uso: {t}",
	"rename": "Renombrar",
	"passwordLessLogin": "Iniciar sesión sin contraseña",
	"passwordLessLoginDescription": "Iniciar sesión con sólo una clave se seguridad / de paso sin usar una contraseña",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working\nEsto hará que los códigos de verificación de la aplicación anterior dejen de funcionar",
	"2faRenewTOTPOk": "Reconfigurar",
	"2faRenewTOTPCancel": "No gracias",
	"2faRemoveKey": "Quitar la llave de seguridad",
	"2faRemoveKeyConfirm": "¿Borrar el respaldo \"{name}\"?",
	"2faSecurityKeyName": "Ingresa un nombre para la clave",
	"2faTapSecurityKey": "Por favor, sigue tu navegador para registrar una llave de seguridad",
	"2fa": "Autenticación de doble factor"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Application d'authentification",
	"totpDescription": "Entrer un mot de passe à usage unique à l'aide d'une application d'authentification",
	"2faAlreadyRegistered": "Configuration déjà achevée.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Se désinscrire",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Plus d'informations",
	"securityKeyAndPasskey": "Sécurité et clés de sécurité",
	"2faSecurityKeyInfo": "Vous pouvez configurer l'authentification WebAuthN pour sécuriser davantage le processus de connexion grâce à une clé de sécurité matérielle qui prend en charge FIDO2, ou bien en configurant l'authentification par empreinte digitale ou par code PIN sur votre appareil.",
	"2faSecurityKeyNotSupported": "Votre navigateur ne prend pas en charge les clés de sécurité.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Dernière utilisation\u00a0: {t}",
	"rename": "Renommer",
	"passwordLessLogin": "Se connecter sans mot de passe",
	"passwordLessLoginDescription": "Se connecter uniquement avec une clé de sécurité ou une clé d'accès sans utiliser de mot de passe",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigurer",
	"2faRenewTOTPCancel": "Pas maintenant",
	"2faRemoveKey": "Supprimer la clé de sécurité",
	"2faRemoveKeyConfirm": "Êtes-vous sûr·e de vouloir supprimer {name} ?",
	"2faSecurityKeyName": "Nom de la clé",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Authentification à deux facteurs"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"2faBackupCodeUsedWarning": "Kode cadangan telah digunakan. Mohon mengatur ulang autentikasi 2-faktor secepatnya apabila kamu sudah tidak dapat menggunakannya lagi.",
	"2faBackupCodesExhaustedWarning": "Semua kode cadangan telah digunakan. Apabila kamu kehilangan akses pada aplikasi autentikasi 2-faktor milikmu, kamu tidak dapat mengakses akun ini lagi. Mohon atur ulang autentikasi 2-faktor kamu.",
	"totp": "Aplikasi autentikator",
	"totpDescription": "Gunakan aplikasi autentikator untuk mendapatkan kata sandi sekali pakai",
	"2faAlreadyRegistered": "Kamu telah mendaftarkan perangkat autentikasi 2-faktor.",
	"2faRenewTOTP": "Atur ulang aplikasi autentikator",
	"2faWhyTOTPOnlyRenew": "Aplikasi autentikator tidak dapat dihapus selama security key masih terdaftar.",
	"unregister": "Batalkan pendaftaran",
	"2faRegisterTOTP": "Daftarkan aplikasi autentikator",
	"learnMore": "Pelajari lebih lanjut",
	"securityKeyAndPasskey": "Security key dan passkey",
	"2faSecurityKeyInfo": "Kamu dapat memasang autentikasi WebAuthN untuk mengamankan proses login lebih lanjut dengan tidak hanya perangkat keras kunci keamanan yang mendukung FIDO2, namun juga sidik jari atau autentikasi PIN pada perangkatmu.",
	"2faSecurityKeyNotSupported": "Peramban kamu tidak mendukung security key.",
	"2faRegisterTOTPBeforeKey": "Mohon atur aplikasi autentikator untuk mendaftarkan security key atau passkey.",
	"2faRegisterSecurityKey": "Daftarkan security key atau passkey.",
	"lastUsedAt": "Penggunaan terakhir: {t}",
	"rename": "Ubah nama",
	"passwordLessLogin": "Setel login tanpa kata sandi",
	"passwordLessLoginDescription": "Bolehkan masuk tanpa kata sandi dengan menggunakan hanya security-key atau passkey",
	"2faRenewTOTPConfirm": "Hal ini akan menyebabkan kode verifikasi dari aplikasi autentikator sebelumnya berhenti bekerja",
	"2faRenewTOTPOk": "Atur ulang",
	"2faRenewTOTPCancel": "Tidak sekarang.",
	"2faRemoveKey": "Hapus security key",
	"2faRemoveKeyConfirm": "Hapus cadangan {name}?",
	"2faSecurityKeyName": "Masukkan nama key.",
	"2faTapSecurityKey": "Mohon ikuti peramban kamu untuk mendaftarkan security key atau passkey",
	"2fa": "Autentikasi 2-faktor"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"2faBackupCodeUsedWarning": "È stato usato un codice usa-e-getta. Per favore, riconfigura l'autenticazione a due fattori il prima possibile, nel caso la configurazione precedente abbia smesso di funzionare.",
	"2faBackupCodesExhaustedWarning": "Hai esaurito i codici usa-e-getta. Se l'App che genera il codice OTP non è più disponibile, non potrai più accedere al tuo profilo. Ripeti la configurazione per l'autenticazione a due fattori.",
	"totp": "App di autenticazione a due fattori (2FA/MFA)",
	"totpDescription": "Puoi autenticarti inserendo un codice OTP tramite la tua App di autenticazione a due fattori (2FA/MFA)",
	"2faAlreadyRegistered": "La configurazione è stata già completata.",
	"2faRenewTOTP": "Riconfigura l'app di autenticazione",
	"2faWhyTOTPOnlyRenew": "Se c'è una chiave di sicurezza attiva, non è possibile rimuovere l'app di autenticazione.",
	"unregister": "Rimuovi autenticazione a due fattori (2FA/MFA)",
	"2faRegisterTOTP": "Registra una App di autenticazione a due fattori (2FA/MFA)",
	"learnMore": "Per saperne di più",
	"securityKeyAndPasskey": "Chiave di sicurezza e accesso",
	"2faSecurityKeyInfo": "È possibile impostare il dispositivo per accedere utilizzando una chiave di sicurezza hardware che supporta FIDO2 o un'impronta digitale o un PIN sul dispositivo.",
	"2faSecurityKeyNotSupported": "Il tuo browser non supporta le chiavi di sicurezza.",
	"2faRegisterTOTPBeforeKey": "Ti occorre un'app di autenticazione con OTP, prima di registrare la chiave di sicurezza.",
	"2faRegisterSecurityKey": "Registra la chiave di sicurezza",
	"lastUsedAt": "Uso più recente: {t}",
	"rename": "Modifica nome",
	"passwordLessLogin": "Accedi senza password",
	"passwordLessLoginDescription": "Accedi senza password, usando la chiave di sicurezza",
	"2faRenewTOTPConfirm": "I codici di verifica nelle app di autenticazione esistenti smetteranno di funzionare",
	"2faRenewTOTPOk": "Ripristina",
	"2faRenewTOTPCancel": "No grazie",
	"2faRemoveKey": "Elimina la chiave di sicurezza",
	"2faRemoveKeyConfirm": "Vuoi davvero eliminare \"{name}\"?",
	"2faSecurityKeyName": "Inserisci il nome della chiave",
	"2faTapSecurityKey": "Segui le istruzioni del browser e registra la chiave di sicurezza.",
	"2fa": "Autenticazione a due fattori"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"2faBackupCodeUsedWarning": "バックアップコードが使用されました。認証アプリが使えなくなっている場合、なるべく早く認証アプリを再設定してください。",
	"2faBackupCodesExhaustedWarning": "バックアップコードが全て使用されました。認証アプリを利用できない場合、これ以上アカウントにアクセスできなくなります。認証アプリを再登録してください。",
	"totp": "認証アプリ",
	"totpDescription": "認証アプリを使ってワンタイムパスワードを入力",
	"2faAlreadyRegistered": "既に設定は完了しています。",
	"2faRenewTOTP": "認証アプリを再設定",
	"2faWhyTOTPOnlyRenew": "セキュリティキーが登録されている場合、認証アプリの設定は解除できません。",
	"unregister": "登録を解除",
	"2faRegisterTOTP": "認証アプリの設定を開始",
	"learnMore": "詳しく",
	"securityKeyAndPasskey": "セキュリティキー・パスキー",
	"2faSecurityKeyInfo": "FIDO2をサポートするハードウェアセキュリティキー、端末の生体認証やPINロック、パスキーといった、WebAuthn由来の鍵を登録します。",
	"2faSecurityKeyNotSupported": "お使いのブラウザはセキュリティキーに対応していません。",
	"2faRegisterTOTPBeforeKey": "セキュリティキー・パスキーを登録するには、まず認証アプリの設定を行なってください。",
	"2faRegisterSecurityKey": "セキュリティキー・パスキーを登録する",
	"lastUsedAt": "最後の使用: {t}",
	"rename": "名前を変更",
	"passwordLessLogin": "パスワードレスログイン",
	"passwordLessLoginDescription": "パスワードを使用せず、セキュリティキーやパスキーなどのみでログインします",
	"2faRenewTOTPConfirm": "今までの認証アプリの確認コードおよびバックアップコードは使用できなくなります",
	"2faRenewTOTPOk": "再設定する",
	"2faRenewTOTPCancel": "やめておく",
	"2faRemoveKey": "セキュリティキーを削除",
	"2faRemoveKeyConfirm": "{name}を削除しますか？",
	"2faSecurityKeyName": "キーの名前を入力",
	"2faTapSecurityKey": "ブラウザの指示に従い、セキュリティキーやパスキーを登録してください",
	"2fa": "二要素認証"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"2faBackupCodeUsedWarning": "バックアップコードが使用されたで。認証アプリが使えなくなってるん場合、なるべく早く認証アプリを再設定しや。",
	"2faBackupCodesExhaustedWarning": "バックアップコードが全て使用されたで。認証アプリを利用できん場合、これ以上アカウントにアクセスできなくなるで。認証アプリを再登録しや。",
	"totp": "認証アプリ",
	"totpDescription": "認証アプリ使うてワンタイムパスワードを入れる",
	"2faAlreadyRegistered": "もう設定終わっとるわ。",
	"2faRenewTOTP": "認証アプリをもっかい設定",
	"2faWhyTOTPOnlyRenew": "セキュリティキーが登録されとったら、認証アプリの設定は解除できへんで。",
	"unregister": "登録やめる",
	"2faRegisterTOTP": "認証アプリの設定はじめる",
	"learnMore": "詳しく",
	"securityKeyAndPasskey": "セキュリティキー・パスキー",
	"2faSecurityKeyInfo": "FIDO2をサポートするハードウェアセキュリティキーか端末の指紋認証やPINを使ってログインするように設定できるで。",
	"2faSecurityKeyNotSupported": "今使とるブラウザはセキュリティキーに対応してへんのやってさ。",
	"2faRegisterTOTPBeforeKey": "セキュリティキー・パスキーを登録するんやったら、まず認証アプリを設定してーな。",
	"2faRegisterSecurityKey": "セキュリティキー・パスキーを登録するわ",
	"lastUsedAt": "最後に使うたんは: {t}",
	"rename": "名前を変えるで",
	"passwordLessLogin": "パスワード無くてもログインできるようにする",
	"passwordLessLoginDescription": "パスワードなんかいらん、セキュリティキーとかパスキーだけでログインするわ",
	"2faRenewTOTPConfirm": "今までの認証アプリの確認コードは使えんくなるけどええか？",
	"2faRenewTOTPOk": "もっかい設定する",
	"2faRenewTOTPCancel": "やめとく",
	"2faRemoveKey": "セキュリティキーをほかす",
	"2faRemoveKeyConfirm": "{name}を消すん？",
	"2faSecurityKeyName": "キーの名前を入れてーや",
	"2faTapSecurityKey": "ブラウザが言うこと聞いて、セキュリティキーとかパスキー登録しといでや",
	"2fa": "二要素認証"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Authenticator App",
	"totpDescription": "Use an authenticator app to enter one-time passwords",
	"2faAlreadyRegistered": "You have already registered a 2-factor authentication device.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Unregister",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Learn more",
	"securityKeyAndPasskey": "Security- and passkeys",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Last used: {t}",
	"rename": "Rename",
	"passwordLessLogin": "Password-less login",
	"passwordLessLoginDescription": "Allows password-less login using a security- or passkey only",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "Cancel",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Two-factor authentication"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Authenticator App",
	"totpDescription": "Use an authenticator app to enter one-time passwords",
	"2faAlreadyRegistered": "You have already registered a 2-factor authentication device.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Unregister",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Learn more",
	"securityKeyAndPasskey": "Security- and passkeys",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Last used: {t}",
	"rename": "Rename",
	"passwordLessLogin": "Password-less login",
	"passwordLessLoginDescription": "Allows password-less login using a security- or passkey only",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "Cancel",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Two-factor authentication"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"2faBackupCodeUsedWarning": "백업 코드가 사용되었습니다.인증 앱을 사용할 수 없게 된 경우, 조속히 인증 앱을 다시 설정해 주십시오.",
	"2faBackupCodesExhaustedWarning": "백업 코드가 모두 사용되었습니다.인증 앱을 사용할 수 없는 경우 더 이상 계정에 액세스하는 것이 불가능합니다.인증 앱을 다시 등록해 주세요.",
	"totp": "인증 앱",
	"totpDescription": "인증 앱을 사용하여 일회성 비밀번호 입력",
	"2faAlreadyRegistered": "이미 설정이 완료되었습니다.",
	"2faRenewTOTP": "인증 앱 재설정",
	"2faWhyTOTPOnlyRenew": "보안 키가 등록되어 있는 경우 인증 앱을 해제할 수 없습니다.",
	"unregister": "등록 해제",
	"2faRegisterTOTP": "인증 앱 설정 시작",
	"learnMore": "자세히",
	"securityKeyAndPasskey": "보안 키 또는 패스키",
	"2faSecurityKeyInfo": "FIDO2를 지원하는 하드웨어 보안 키 혹은 디바이스의 지문인식이나 화면잠금 PIN을 이용해서 로그인하도록 설정할 수 있습니다.",
	"2faSecurityKeyNotSupported": "이 브라우저는 보안 키를 지원하지 않습니다.",
	"2faRegisterTOTPBeforeKey": "보안 키 또는 패스키를 등록하려면 인증 앱을 등록하십시오.",
	"2faRegisterSecurityKey": "보안 키 또는 패스키 등록",
	"lastUsedAt": "마지막 사용: {t}",
	"rename": "이름 변경",
	"passwordLessLogin": "비밀번호 없이 로그인",
	"passwordLessLoginDescription": "비밀번호 없이 보안 키 또는 패스키만 사용해서 로그인합니다.",
	"2faRenewTOTPConfirm": "기존에 등록되어 있던 인증 키는 사용하지 못하게 됩니다.",
	"2faRenewTOTPOk": "재설정",
	"2faRenewTOTPCancel": "취소",
	"2faRemoveKey": "보안 키를 삭제",
	"2faRemoveKeyConfirm": "{name} 앱을 삭제하시겠습니까?",
	"2faSecurityKeyName": "키 이름 입력",
	"2faTapSecurityKey": "브라우저의 지시에 따라 보안 키 또는 패스키를 등록하여 주십시오",
	"2fa": "2단계 인증"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Verificatie-App",
	"totpDescription": "Log in via de verificatie-app met het eenmalige wachtwoord",
	"2faAlreadyRegistered": "You have already registered a 2-factor authentication device.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Uitschrijven",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Meer leren",
	"securityKeyAndPasskey": "Beveiligings- en pasjessleutels",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Laatst gebruikt: {t}",
	"rename": "Hernoemen",
	"passwordLessLogin": "Inloggen zonder wachtwoord",
	"passwordLessLoginDescription": "Maakt aanmelden zonder wachtwoord mogelijk met een beveiligingstoken of -wachtsleutel",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "Nee, bedankt",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Twee factor authenticatie"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Authenticator App",
	"totpDescription": "Use an authenticator app to enter one-time passwords",
	"2faAlreadyRegistered": "You have already registered a 2-factor authentication device.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Unregister",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Les mer",
	"securityKeyAndPasskey": "Security- and passkeys",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Last used: {t}",
	"rename": "Endre navn",
	"passwordLessLogin": "Password-less login",
	"passwordLessLoginDescription": "Allows password-less login using a security- or passkey only",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "Avbryt",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Two-factor authentication"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Klucz aplikacji uwierzytelniającej (totp)",
	"totpDescription": "Opis klucza czasowego",
	"2faAlreadyRegistered": "Zarejestrowałeś już urządzenie do uwierzytelniania dwuskładnikowego.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Cofnij rejestrację",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Dowiedz się więcej",
	"securityKeyAndPasskey": "Klucz bezpieczeństwa i klucze Passkey",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Ostatnio używane: {t}",
	"rename": "Zmień nazwę",
	"passwordLessLogin": "Skonfiguruj logowanie bez użycia hasła",
	"passwordLessLoginDescription": "Opis logowania bez użycia hasła",
	"2faRenewTOTPConfirm": "Spowoduje to, że kody weryfikacyjne z poprzedniej aplikacji przestaną działać",
	"2faRenewTOTPOk": "Rekonfiguruj",
	"2faRenewTOTPCancel": "Nie teraz",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Usunąć kopię zapasową {name}?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Klucz 2FA "
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"2faBackupCodeUsedWarning": "Um código de backup foi utilizado. Por favor, reconfigure a autenticação de dois fatores o quanto antes, caso não consiga utilizá-la.",
	"2faBackupCodesExhaustedWarning": "Todos os códigos de backup foram utilizados. Caso perca acesso à autenticação de dois fatores, você perderá o acesso à conta. Por favor, reconfigure a autenticação de dois fatores.",
	"totp": "Aplicativo Autenticador",
	"totpDescription": "Digite a senha de uso único informado pelo aplicativo autenticador",
	"2faAlreadyRegistered": "Você já cadastrou um dispositivo de autenticação de dois fatores.",
	"2faRenewTOTP": "Reconfigurar autenticador",
	"2faWhyTOTPOnlyRenew": "O autenticador não pode ser removido enquanto há códigos de segurança registrados.",
	"unregister": "Cancelar registro",
	"2faRegisterTOTP": "Cadastrar aplicativo autenticador",
	"learnMore": "Saiba mais",
	"securityKeyAndPasskey": "Chave de segurança / Chave de acesso",
	"2faSecurityKeyInfo": "Além da autenticação por impressão digital ou PIN, você também pode configurar a autenticação por chaves de segurança de hardware compatível com FIDO2 para proteger ainda mais a sua conta.",
	"2faSecurityKeyNotSupported": "O seu navegador não é compatível com chaves de segurança.",
	"2faRegisterTOTPBeforeKey": "Por favor, configure um aplicativo autenticador para registrar uma chave de segurança.",
	"2faRegisterSecurityKey": "Registre um código de segurança",
	"lastUsedAt": "Última utilização: {t}",
	"rename": "Renomear",
	"passwordLessLogin": "Entrar sem senha",
	"passwordLessLoginDescription": "Faça login apenas com uma chave de segurança / chave de acesso sem utilização de senha",
	"2faRenewTOTPConfirm": "Isso interromperá o funcionamento dos códigos de aplicativos anteriores ",
	"2faRenewTOTPOk": "Reconfigurar",
	"2faRenewTOTPCancel": "Não, obrigado",
	"2faRemoveKey": "Remover código de segurança",
	"2faRemoveKeyConfirm": "Deseja excluir {name}?",
	"2faSecurityKeyName": "Insira um nome para a chave",
	"2faTapSecurityKey": "Por favor, siga as instruções do navegador para registrar o código de segurança",
	"2fa": "Autenticação de dois fatores"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Приложение-аутентификатор",
	"totpDescription": "Описание приложения-аутентификатора",
	"2faAlreadyRegistered": "Двухфакторная аутентификация уже настроена.",
	"2faRenewTOTP": "Перенастроите приложение аутентификации",
	"2faWhyTOTPOnlyRenew": "Если ключ безопасности зарегистрирован, вы не сможете отключить приложение аутентификации.",
	"unregister": "Отписаться",
	"2faRegisterTOTP": "Начните настраивать приложение-аутентификатор",
	"learnMore": "Подробнее",
	"securityKeyAndPasskey": "Ключ безопасности и парольная фраза",
	"2faSecurityKeyInfo": "Вы можете настроить вход с помощью аппаратного ключа безопасности, поддерживающего FIDO2, или отпечатка пальца или PIN-кода на устройстве.",
	"2faSecurityKeyNotSupported": "Ваш браузер не поддерживает ключи безопасности.",
	"2faRegisterTOTPBeforeKey": "Чтобы зарегистрировать ключ безопасности и пароль, сначала настройте приложение аутентификации.",
	"2faRegisterSecurityKey": "Зарегистрируйте ключ безопасности ・Passkey",
	"lastUsedAt": "Последнее использование: {t}",
	"rename": "Переименовать",
	"passwordLessLogin": "Настроить вход без пароля",
	"passwordLessLoginDescription": "Вход без пароля",
	"2faRenewTOTPConfirm": "Проверочный код предыдущего приложения для аутентификации больше не будет доступен",
	"2faRenewTOTPOk": "Настроить",
	"2faRenewTOTPCancel": "Нет, спасибо",
	"2faRemoveKey": "Удалить ключ безопасности",
	"2faRemoveKeyConfirm": "Удалить резервную копию «{name}»?",
	"2faSecurityKeyName": "Введите имя для ключа",
	"2faTapSecurityKey": "Пожалуйста, следуйте инструкциям в вашем браузере, чтобы зарегистрировать свой ключ безопасности или пароль",
	"2fa": "Двухфакторная аутентификация"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Overovacia aplikácia",
	"totpDescription": "Zadajte jednorazové heslo z overovacej aplikácie",
	"2faAlreadyRegistered": "Už ste zaregistrovali 2-faktorové autentifikačné zariadenie.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Odregistrovať",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Zistiť viac",
	"securityKeyAndPasskey": "Bezpečnostný kľúč/heslo",
	"2faSecurityKeyInfo": "Okrem odtlačku prsta alebo PIN autentifikácie si môžete nastaviť autentifikáciu cez hardvérový bezpečnostný kľúč podporujúci FIDO2 a tak ešte viac zabezpečiť svoj účet.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Naposledy použité: {t}",
	"rename": "Premenovať",
	"passwordLessLogin": "Nastaviť bezheslové prihlásenie",
	"passwordLessLoginDescription": "Prihlásenie bez hesla, len bezpečnostným kľúčom alebo prístupovým kľúčom",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "Nie, ďakujem",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Naozaj chcete odstrániť \"{name}\"?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Dvojfaktorové overenie (2FA)"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"2faBackupCodeUsedWarning": "รหัสแบ๊กอัปถูกใช้งานแล้ว หากแอปพลิเคชันการยืนยันตัวตนไม่สามารถใช้งานได้ ให้รีบทำการตั้งค่าแอปฯใหม่โดยเร็วที่สุด",
	"2faBackupCodesExhaustedWarning": "รหัสแบ๊กอัปทั้งหมดถูกใช้งานแล้ว หากยังไม่สามารถใช้แอปพลิเคชันการยืนยันตัวตนได้ก็จะไม่สามารถเข้าถึงบัญชีนี้ได้อีกต่อไป กรุณาลงทะเบียนแอปพลิเคชันการยืนยันตัวตนใหม่",
	"totp": "แอป Authenticator",
	"totpDescription": "ใช้แอปยืนยันตัวตนเพื่อป้อนรหัสผ่านแบบใช้ครั้งเดียว",
	"2faAlreadyRegistered": "คุณได้ลงทะเบียนอุปกรณ์ยืนยันตัวตนแบบ 2 ชั้นแล้ว",
	"2faRenewTOTP": "ตั้งค่าแอปยืนยันตัวตน",
	"2faWhyTOTPOnlyRenew": "ไม่สามารถลบแอปตัวรับรองความถูกต้องได้ตราบใดที่ยังมีการลงทะเบียน Security Key อยู่",
	"unregister": "เลิกติดตาม",
	"2faRegisterTOTP": "ลงทะเบียนแอพตัวตรวจสอบสิทธิ์",
	"learnMore": "แสดงให้ดูหน่อย",
	"securityKeyAndPasskey": "Security key และ Passkey",
	"2faSecurityKeyInfo": "ลงทะเบียนกุญแจที่มาจาก WebAuthn เช่น Security Key แบบฮาร์ดแวร์ที่รองรับ FIDO2 การยืนยันตัวตนด้วยชีวมิติหรือ PIN บนอุปกรณ์ และ Passkey",
	"2faSecurityKeyNotSupported": "เว็บเบราว์เซอร์ที่ใช้งานอยู่ไม่รองรับ Security Key",
	"2faRegisterTOTPBeforeKey": "ก่อนลงทะเบียน Security Key หรือ Passkey กรุณาตั้งค่าแอปยืนยันตัวตนก่อน",
	"2faRegisterSecurityKey": "ลงทะเบียน Security Key หรือ Passkey",
	"lastUsedAt": "ใช้งานครั้งล่าสุด: {t}",
	"rename": "เปลี่ยนชื่อ",
	"passwordLessLogin": "เข้าสู่ระบบแบบไม่ใช้รหัสผ่าน",
	"passwordLessLoginDescription": "เข้าสู่ระบบโดยไม่ใช้รหัสผ่าน โดยใช้เฉพาะ Security Key หรือ Passkey เท่านั้น",
	"2faRenewTOTPConfirm": "วิธีการแบบนี้จะทําให้รหัสยืนยันจากแอพก่อนหน้าของคุณหยุดทํางานเลยนะ",
	"2faRenewTOTPOk": "ตั้งค่าคอนฟิกใหม่",
	"2faRenewTOTPCancel": "ไม่เป็นไร",
	"2faRemoveKey": "ลบ Security Key ออก",
	"2faRemoveKeyConfirm": "ลบข้อมูลสำรอง {name} มั้ย?",
	"2faSecurityKeyName": "ป้อนชื่อคีย์",
	"2faTapSecurityKey": "กรุณาทำตามคำแนะนำของเบราว์เซอร์เพื่อลงทะเบียน Security Key หรือ Passkey",
	"2fa": "การยืนยันตัวตนแบบสองชั้น"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"2faBackupCodeUsedWarning": "Yedek kod kullanıldı. Artık kullanamıyorsanız, lütfen iki faktörlü kimlik doğrulamayı mümkün olan en kısa sürede yeniden yapılandırın.",
	"2faBackupCodesExhaustedWarning": "Tüm yedek kodlar kullanıldı. İki faktörlü kimlik doğrulama uygulamana erişimini kaybedersen, bu hesaba erişemezsin. Lütfen iki faktörlü kimlik doğrulamayı yeniden yapılandır.",
	"totp": "Authenticator Uygulaması",
	"totpDescription": "Tek seferlik şifreleri girmek için bir kimlik doğrulama uygulaması kullanın",
	"2faAlreadyRegistered": "2fa kimlik doğrulama cihazını zaten kaydettin.",
	"2faRenewTOTP": "Kimlik doğrulama uygulamasını yeniden yapılandırın",
	"2faWhyTOTPOnlyRenew": "Güvenlik anahtarı kayıtlı olduğu sürece kimlik doğrulama uygulaması kaldırılamaz.",
	"unregister": "Kayıttan çık",
	"2faRegisterTOTP": "Kimlik doğrulama uygulamasını kaydet",
	"learnMore": "Daha fazla bilgi edinin",
	"securityKeyAndPasskey": "Güvenlik ve geçiş anahtarları",
	"2faSecurityKeyInfo": "Parmak izi veya PIN kimlik doğrulamasının yanı sıra, hesabını daha da güvenli hale getirmek için FIDO2'yi destekleyen donanım güvenlik anahtarları aracılığıyla kimlik doğrulama da ayarlayabilirsin.",
	"2faSecurityKeyNotSupported": "Tarayıcınız güvenlik anahtarlarını desteklemiyor.",
	"2faRegisterTOTPBeforeKey": "Güvenlik veya geçiş anahtarını kaydetmek için bir kimlik doğrulama uygulaması kurun.",
	"2faRegisterSecurityKey": "Güvenlik veya geçiş anahtarını kaydedin",
	"lastUsedAt": "Son kullanım: {t}",
	"rename": "Yeniden adlandır",
	"passwordLessLogin": "Şifresiz giriş",
	"passwordLessLoginDescription": "Yalnızca güvenlik anahtarı veya şifre anahtarı kullanarak şifresiz oturum açmaya izin verir.",
	"2faRenewTOTPConfirm": "Bu, önceki uygulamanızdaki doğrulama kodlarının çalışmamasına neden olacaktır.",
	"2faRenewTOTPOk": "Yeniden yapılandır",
	"2faRenewTOTPCancel": "İptal",
	"2faRemoveKey": "Güvenlik anahtarını kaldır",
	"2faRemoveKeyConfirm": "{name} anahtarını cidden silmek istiyor musun?",
	"2faSecurityKeyName": "Bir anahtar adı girin",
	"2faTapSecurityKey": "Güvenlik veya geçiş anahtarını kaydetmek için lütfen tarayıcınızı takip edin.",
	"2fa": "İki faktörlü kimlik doğrulama"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Authenticator App",
	"totpDescription": "Use an authenticator app to enter one-time passwords",
	"2faAlreadyRegistered": "You have already registered a 2-factor authentication device.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Unregister",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Learn more",
	"securityKeyAndPasskey": "Security- and passkeys",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Last used: {t}",
	"rename": "Rename",
	"passwordLessLogin": "Password-less login",
	"passwordLessLoginDescription": "Allows password-less login using a security- or passkey only",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "ئۇنى توختىتىڭ",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Two-factor authentication"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Програма аутентифікації",
	"totpDescription": "Використовуйте застосунок-автентифікатор для введення одноразових паролів",
	"2faAlreadyRegistered": "Двофакторна автентифікація вже налаштована.",
	"2faRenewTOTP": "Reconfigure authenticator app",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Скасувати реєстрацію",
	"2faRegisterTOTP": "Register authenticator app",
	"learnMore": "Докладніше",
	"securityKeyAndPasskey": "Ключі безпеки та ключі доступу",
	"2faSecurityKeyInfo": "Besides fingerprint or PIN authentication, you can also setup authentication via hardware security keys that support FIDO2 to further secure your account.",
	"2faSecurityKeyNotSupported": "Your browser does not support security keys.",
	"2faRegisterTOTPBeforeKey": "Please set up an authenticator app to register a security or pass key.",
	"2faRegisterSecurityKey": "Register a security or pass key",
	"lastUsedAt": "Востаннє використано: {t}",
	"rename": "Перейменувати",
	"passwordLessLogin": "Налаштувати вхід без пароля",
	"passwordLessLoginDescription": "Дозволяє вхід без пароля лише за допомогою ключа безпеки або ключа доступу",
	"2faRenewTOTPConfirm": "This will cause verification codes from your previous app to stop working",
	"2faRenewTOTPOk": "Reconfigure",
	"2faRenewTOTPCancel": "Не зараз",
	"2faRemoveKey": "Remove security key",
	"2faRemoveKeyConfirm": "Really delete the {name} key?",
	"2faSecurityKeyName": "Enter a key name",
	"2faTapSecurityKey": "Please follow your browser to register the security or pass key",
	"2fa": "Двофакторна аутентифікація"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"2faBackupCodeUsedWarning": "A backup code has been used. Please reconfigure two-factor authentification as soon as possible if you are no longer able to use it.",
	"2faBackupCodesExhaustedWarning": "All backup codes have been used. Should you lose access to your two-factor authentification app, you will be unable to access this account. Please reconfigure two-factor authentification.",
	"totp": "Ứng dụng xác thực",
	"totpDescription": "Nhắn mã OTP bằng ứng dụng xác thực",
	"2faAlreadyRegistered": "Bạn đã đăng ký thiết bị xác minh 2 bước.",
	"2faRenewTOTP": "Cài đặt lại ứng dụng xác thực",
	"2faWhyTOTPOnlyRenew": "The authenticator app cannot be removed as long as a security key is registered.",
	"unregister": "Hủy đăng ký",
	"2faRegisterTOTP": "Đăng ký ứng dụng xác thực",
	"learnMore": "Tìm hiểu thêm",
	"securityKeyAndPasskey": "Mã bảo mật・Passkey",
	"2faSecurityKeyInfo": "Bên cạnh xác minh bằng vân tay hoặc mã PIN, bạn cũng có thể thiết lập xác minh thông qua khóa bảo mật phần cứng hỗ trợ FIDO2 để bảo mật hơn nữa cho tài khoản của mình.",
	"2faSecurityKeyNotSupported": "Trình duyệt của bạn không hỗ trợ khóa bảo mật",
	"2faRegisterTOTPBeforeKey": "Vui lòng thiết lập một ứng dụng xác thực để đăng ký khóa bảo mật hoặc mật khẩu.",
	"2faRegisterSecurityKey": "Tạo khóa bảo mật hoặc mã bảo mật",
	"lastUsedAt": "Lần cuối sử dụng: {t}",
	"rename": "Đổi tên",
	"passwordLessLogin": "Đăng nhập không mật khẩu",
	"passwordLessLoginDescription": "Đăng nhập bằng chỉ mã bảo mật hoặc passkey, không sử dụng mật khẩu.",
	"2faRenewTOTPConfirm": "Mã xác nhận cũ của ứng dụng xác thực không thể sử dụng được nữa",
	"2faRenewTOTPOk": "Cài đặt lại",
	"2faRenewTOTPCancel": "Không, cảm ơn",
	"2faRemoveKey": "Xóa mã bảo mật",
	"2faRemoveKeyConfirm": "Xóa bản sao lưu {name}?",
	"2faSecurityKeyName": "Nhập tên khóa bảo mật",
	"2faTapSecurityKey": "Vui lòng làm theo hướng dẫn của trình duyệt để đăng ký mã bảo mật hoặc mã khóa",
	"2fa": "Xác thực 2 yếu tố"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"2faBackupCodeUsedWarning": "已使用备用代码。若验证器无法使用，请尽快重置验证器。",
	"2faBackupCodesExhaustedWarning": "已使用完所有的备用代码。若验证器无法使用，则无法再访问您的账户。请重置验证器。",
	"totp": "验证器",
	"totpDescription": "使用验证器输入一次性密码",
	"2faAlreadyRegistered": "此设备已被注册",
	"2faRenewTOTP": "重置验证器",
	"2faWhyTOTPOnlyRenew": "当注册了安全密钥时，无法取消使用验证器。",
	"unregister": "删除账户",
	"2faRegisterTOTP": "开始设置验证器",
	"learnMore": "更多信息",
	"securityKeyAndPasskey": "安全密钥或 Passkey",
	"2faSecurityKeyInfo": "注册兼容 WebAuthn 的密钥，例如支持 FIDO2 的硬件安全密钥、设备上的生物识别功能、PIN 以及 Passkey 等。",
	"2faSecurityKeyNotSupported": "您的浏览器不支持安全密钥。",
	"2faRegisterTOTPBeforeKey": "要注册安全密钥或 Passkey，请先设置验证器。",
	"2faRegisterSecurityKey": "注册安全密钥或 Passkey",
	"lastUsedAt": "最后使用: {t}",
	"rename": "重命名",
	"passwordLessLogin": "无密码登录",
	"passwordLessLoginDescription": "不使用密码，仅使用安全密钥或 Passkey 登录",
	"2faRenewTOTPConfirm": "当前验证器的验证码及备用代码已失效",
	"2faRenewTOTPOk": "重新配置",
	"2faRenewTOTPCancel": "不用，谢谢",
	"2faRemoveKey": "删除安全密钥",
	"2faRemoveKeyConfirm": "确定要删除 {name} 吗？",
	"2faSecurityKeyName": "输入密钥名称",
	"2faTapSecurityKey": "请按照浏览器说明操作来注册安全密钥或 Passkey。",
	"2fa": "双重认证"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"2faBackupCodeUsedWarning": "已使用備用驗證碼。如果無法使用驗證應用程式，請盡快重新設定。",
	"2faBackupCodesExhaustedWarning": "已使用所有備用驗證碼。如果無法使用驗證應用程式，則將無法再存取您的帳戶。請重新設定您的驗證應用程式。",
	"totp": "驗證應用程式",
	"totpDescription": "以驗證應用程式輸入一次性密碼",
	"2faAlreadyRegistered": "此裝置已被註冊過了",
	"2faRenewTOTP": "重設驗證應用程式",
	"2faWhyTOTPOnlyRenew": "如果註冊了安全金鑰，則無法解除驗證應用程式的設定。",
	"unregister": "註銷",
	"2faRegisterTOTP": "開始設定驗證應用程式",
	"learnMore": "更多資訊",
	"securityKeyAndPasskey": "安全金鑰、通行金鑰",
	"2faSecurityKeyInfo": "註冊 WebAuthn 衍生的金鑰，例如支援 FIDO2 的硬體安全金鑰、裝置生物識別、PIN 鎖和通行金鑰。",
	"2faSecurityKeyNotSupported": "您的瀏覽器不支援安全金鑰。",
	"2faRegisterTOTPBeforeKey": "如要註冊安全金鑰或通行金鑰，請先設定驗證應用程式。",
	"2faRegisterSecurityKey": "註冊安全金鑰或通行金鑰",
	"lastUsedAt": "上次使用：{t}",
	"rename": "重新命名",
	"passwordLessLogin": "無密碼登入",
	"passwordLessLoginDescription": "不使用密碼，以安全金鑰或通行金鑰登入",
	"2faRenewTOTPConfirm": "目前驗證應用程式的驗證碼將無法使用。",
	"2faRenewTOTPOk": "重設",
	"2faRenewTOTPCancel": "現在不要",
	"2faRemoveKey": "刪除安全金鑰",
	"2faRemoveKeyConfirm": "要刪除{name}嗎？",
	"2faSecurityKeyName": "輸入金鑰名稱",
	"2faTapSecurityKey": "按照瀏覽器的說明註冊安全金鑰或通行金鑰。",
	"2fa": "雙重驗證"
}
</locale>
