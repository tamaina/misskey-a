<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="550"
	@close="cancel"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.setupOf2fa }}</template>

	<div style="overflow-x: clip;">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<template v-if="page === 0">
				<div style="height: 100cqh; overflow: auto; text-align: center;">
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<div class="_gaps">
							<MkInfo><MkLink url="https://misskey-hub.net/docs/for-users/stepped-guides/how-to-enable-2fa/" target="_blank">{{ $locale.sfc.twoFactorMoreDetailedGuideHere }}</MkLink></MkInfo>

							<I18n :src="$locale.sfc.twoFactorStep1" tag="div">
								<template #a>
									<a href="https://authy.com/" rel="noopener" target="_blank" class="_link">Authy</a>
								</template>
								<template #b>
									<a href="https://support.google.com/accounts/answer/1066447" rel="noopener" target="_blank" class="_link">Google Authenticator</a>
								</template>
							</I18n>
							<div>{{ $locale.sfc.twoFactorStep2 }}</div>
							<div>
								<a :class="$style.qrRoot" :href="twoFactorData.url"><img :class="$style.qr" :src="twoFactorData.qr"></a>
								<!-- QRコード側にマージンが入っているので直下でOK -->
								<div><MkButton inline rounded type="routerLink" :to="twoFactorData.url" :linkBehavior="'browser'">{{ $locale.sfc.launchApp }}</MkButton></div>
							</div>
							<MkKeyValue :copy="twoFactorData.url">
								<template #key>{{ $locale.sfc.twoFactorStep2Uri }}</template>
								<template #value>{{ twoFactorData.url }}</template>
							</MkKeyValue>
						</div>
						<div class="_buttonsCenter" style="margin-top: 16px;">
							<MkButton rounded @click="cancel">{{ $locale.sfc.cancel }}</MkButton>
							<MkButton primary rounded gradate @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 1">
				<div style="height: 100cqh; overflow: auto;">
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<div class="_gaps">
							<div>{{ $locale.sfc.twoFactorStep3Title }}</div>
							<MkInput v-model="token" autocomplete="one-time-code" inputmode="numeric"></MkInput>
							<div>{{ $locale.sfc.twoFactorStep3 }}</div>
						</div>
						<div class="_buttonsCenter" style="margin-top: 16px;">
							<MkButton rounded @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
							<MkButton primary rounded gradate @click="tokenDone">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 2">
				<div style="height: 100cqh; overflow: auto;">
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<div class="_gaps">
							<div style="text-align: center;">{{ $locale.sfc.twoFactorSetupCompleted }}🎉</div>
							<div style="text-align: center;">{{ $locale.sfc.twoFactorStep4 }}</div>
							<div style="text-align: center; font-weight: bold;">{{ $locale.sfc.twoFactorCheckBackupCodesBeforeCloseThisWizard }}</div>

							<MkFolder :defaultOpen="true">
								<template #icon><i class="ti ti-key"></i></template>
								<template #label>{{ $locale.sfc.twoFactorBackupCodes }}</template>

								<div class="_gaps">
									<MkInfo warn>{{ $locale.sfc.twoFactorBackupCodesDescription }}</MkInfo>

									<div v-for="(code, i) in backupCodes" :key="code" class="_gaps_s">
										<MkKeyValue :copy="code">
											<template #key>#{{ i + 1 }}</template>
											<template #value><code class="_monospace">{{ code }}</code></template>
										</MkKeyValue>
									</div>

									<MkButton primary rounded gradate @click="downloadBackupCodes"><i class="ti ti-download"></i> {{ $locale.sfc.download }}</MkButton>
								</div>
							</MkFolder>
						</div>
						<div class="_buttonsCenter" style="margin-top: 16px;">
							<MkButton primary rounded gradate @click="allDone">{{ $locale.sfc.done }}</MkButton>
						</div>
					</div>
				</div>
			</template>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { hostname, port } from '@features/boot/frontend/shared/config.js';
import { useTemplateRef, ref } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import * as os from '@features/ui/frontend/os.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import { confetti } from '@features/ui/frontend/utility/confetti.js';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

defineProps<{
	twoFactorData: {
		qr: string;
		url: string;
	};
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');
const page = ref(0);
const token = ref<string | null>(null);
const backupCodes = ref<string[]>();

function cancel() {
	dialog.value?.close();
}

async function tokenDone() {
	if (token.value == null) return;
	const res = await os.apiWithDialog('i/2fa/done', {
		token: token.value.toString(), // 実装ミスなどでnumberが入る可能性を払拭できないため念のためtoString
	});

	backupCodes.value = res.backupCodes;

	page.value++;

	confetti({
		duration: 1000 * 3,
	});
}

function downloadBackupCodes() {
	if (backupCodes.value !== undefined) {
		const txtBlob = new Blob([backupCodes.value.join('\n')], { type: 'text/plain' });
		const dummya = window.document.createElement('a');
		dummya.href = URL.createObjectURL(txtBlob);
		dummya.download = `${$i.username}@${hostname}` + (port !== '' ? `_${port}` : '') + '-2fa-backup-codes.txt';
		dummya.click();
	}
}

function allDone() {
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.qrRoot {
	display: block;
	margin: 0 auto;
	width: 200px;
	max-width: 100%;
}

.qr {
	width: 100%;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "أولًا ثبّت تطبيق استيثاق على جهازك (مثل {a} و{b}).",
	"twoFactorStep2": "امسح رمز الاستجابة السريعة الموجد على الشاشة.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": " إلغاء",
	"continue": "متابعة",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "أدخل الرمز الموجود في تطبيقك لإكمال التثبيت.",
	"goBack": "رجوع",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "من هذه اللحظة أثناء ولوجك سيُطلب منك الرمز.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "تنزيل",
	"done": "تمّ"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"setupOf2fa": "Configura l'autenticació de doble factor",
	"twoFactorMoreDetailedGuideHere": "Aquí tens una guia al detall",
	"twoFactorStep1": "Primer instal·la una aplicació autenticadora (com {a} o {b}) al teu dispositiu.",
	"twoFactorStep2": "Després escaneja el codi QR que es mostra en aquesta pantalla.",
	"launchApp": "Inicia l'aplicació ",
	"twoFactorStep2Uri": "Escriu la següent URI si estàs fent servir una aplicació d'escriptori ",
	"cancel": "Cancel·lar",
	"continue": "Continuar",
	"twoFactorStep3Title": "Escriu un codi d'autenticació",
	"twoFactorStep3": "Escriu el codi d'autenticació (token) que es mostra a la teva aplicació per finalitzar la configuració.",
	"goBack": "Tornar",
	"twoFactorSetupCompleted": "Configuració terminada",
	"twoFactorStep4": "D'ara endavant quan accedeixis se't demanarà el token que has introduït.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Abans de tancar aquesta finestra, comprova el següent codi de seguretat.",
	"twoFactorBackupCodes": "Codi de seguretat.",
	"twoFactorBackupCodesDescription": "Si l'aplicació d'autenticació no es pot utilitzar, es pot accedir al compte utilitzant els següents codis de còpia de seguretat. Assegura't de mantenir aquests codis en un lloc segur. Cada codi es pot utilitzar només una vegada.",
	"download": "Descarregar",
	"done": "Fet"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "Nejprve si do zařízení nainstalujte aplikaci pro ověřování (například {a} nebo {b}).",
	"twoFactorStep2": "Poté naskenujte QR kód zobrazený na této obrazovce.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Zrušit",
	"continue": "Pokračovat",
	"twoFactorStep3Title": "Zadejte ověřovací kód",
	"twoFactorStep3": "Pro dokončení nastavení zadejte token poskytnutý vaší aplikací.",
	"goBack": "Zpět",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "Od této chvíle budou všechny budoucí pokusy o přihlášení vyžadovat tento přihlašovací token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Stáhnout",
	"done": "Hotovo"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "First, install an authentication app (such as {a} or {b}) on your device.",
	"twoFactorStep2": "Then, scan the QR code displayed on this screen.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Cancel",
	"continue": "Continue",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Enter the authentication code (token) provided by your app to finish setup.",
	"goBack": "Back",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "From now on, any future login attempts will ask for such a login token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Download",
	"done": "Done"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"setupOf2fa": "Zweifaktorauthentifizierung einrichten",
	"twoFactorMoreDetailedGuideHere": "Hier ist eine ausführliche Anleitung",
	"twoFactorStep1": "Installiere zuerst eine Authentifizierungsapp (z.B. {a} oder {b}) auf deinem Gerät.",
	"twoFactorStep2": "Dann, scanne den angezeigten QR-Code mit deinem Gerät.",
	"launchApp": "Starte die App",
	"twoFactorStep2Uri": "Nutzt du ein Desktopprogramm, gib folgende URI eingeben",
	"cancel": "Abbrechen",
	"continue": "Fortfahren",
	"twoFactorStep3Title": "Authentifizierungsscode eingeben",
	"twoFactorStep3": "Gib zum Abschluss den Code (Token) ein, der von deiner App angezeigt wird.",
	"goBack": "Zurück",
	"twoFactorSetupCompleted": "Einrichtung abgeschlossen",
	"twoFactorStep4": "Alle folgenden Anmeldeversuche werden ab sofort die Eingabe eines solchen Tokens benötigen.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Notiere bitte deine Backup-Codes, bevor du dieses Fenster schließt.",
	"twoFactorBackupCodes": "Backup-Codes",
	"twoFactorBackupCodesDescription": "Verwende diese Codes, falls du nicht mehr auf deine App zur Zweifaktorauthentifizierung zugreifen kannst. Jeder Code kann nur einmal verwendet werden. Bewahre sie an einem sicheren Ort auf.",
	"download": "Herunterladen",
	"done": "Fertig"
}
</locale>

<locale lang="json" locale="en-US">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "First, install an authentication app (such as {a} or {b}) on your device.",
	"twoFactorStep2": "Then, scan the QR code displayed on this screen.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Cancel",
	"continue": "Continue",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Enter the authentication code (token) provided by your app to finish setup.",
	"goBack": "Back",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "From now on, any future login attempts will ask for such a login token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Download",
	"done": "Done"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"setupOf2fa": "Configurar la autenticación de dos factores",
	"twoFactorMoreDetailedGuideHere": "Guía detallada",
	"twoFactorStep1": "Primero, instale en su dispositivo la aplicación de autenticación {a} o {b} u otra.",
	"twoFactorStep2": "Luego, escanee con la aplicación el código QR mostrado en pantalla.",
	"launchApp": "Ejecutar la app",
	"twoFactorStep2Uri": "Si usas una aplicación de escritorio, introduce en ella la siguiente URL.",
	"cancel": "Cancelar",
	"continue": "Continuar",
	"twoFactorStep3Title": "Ingresa un código de autenticación",
	"twoFactorStep3": "Para terminar, ingrese el token mostrado en la aplicación.",
	"goBack": "Anterior",
	"twoFactorSetupCompleted": "Configuración completada",
	"twoFactorStep4": "Ahora cuando inicie sesión, ingrese el mismo token",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Por favor, copia los siguientes códigos de respaldo antes de finalizar el asistente.",
	"twoFactorBackupCodes": "Códigos de Respaldo",
	"twoFactorBackupCodesDescription": "En caso de que no puedas usar tu aplicación de autenticación, podrás usar los códigos de respaldo que figuran abajo para acceder a tu cuenta. Asegúrate de guardar en lugar seguro los códigos de respaldo. Cada uno de los códigos de respaldo es de un solo uso.",
	"download": "Descargar",
	"done": "Hecho"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"setupOf2fa": "Configuration de l’authentification à deux facteurs",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "Tout d'abord, installez une application d'authentification, telle que {a} ou {b}, sur votre appareil.",
	"twoFactorStep2": "Ensuite, scannez le code QR affiché sur l’écran.",
	"launchApp": "Lancer l'app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Annuler",
	"continue": "Continuer",
	"twoFactorStep3Title": "Veuillez saisir le code d’authentification",
	"twoFactorStep3": "Entrez le jeton affiché sur votre application pour compléter la configuration.",
	"goBack": "Retour",
	"twoFactorSetupCompleted": "Configuration terminée avec succès !",
	"twoFactorStep4": "À partir de maintenant, ce même jeton vous sera demandé à chacune de vos connexions.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Codes de Secours",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Télécharger",
	"done": "Terminé"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"setupOf2fa": "Atur autentikasi 2-faktor",
	"twoFactorMoreDetailedGuideHere": "Berikut panduan detilnya",
	"twoFactorStep1": "Pertama, pasang aplikasi autentikasi (seperti {a} atau {b}) di perangkat kamu.",
	"twoFactorStep2": "Lalu, pindai kode QR yang ada di layar.",
	"launchApp": "Luncurkan Aplikasi",
	"twoFactorStep2Uri": "Masukkan URI berikut jika kamu menggunakan program desktop",
	"cancel": "Batalkan",
	"continue": "Lanjutkan",
	"twoFactorStep3Title": "Masukkan kode autentikasi",
	"twoFactorStep3": "Masukkan token yang telah disediakan oleh aplikasimu untuk menyelesaikan pemasangan.",
	"goBack": "Kembali",
	"twoFactorSetupCompleted": "Penyetelan autentikasi 2-faktor selesai",
	"twoFactorStep4": "Mulai sekarang, upaya login apapun akan meminta token login dari aplikasi autentikasi kamu.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Sebelum kamu menutup jendela ini, pastikan untuk memperhatikan dan mencadangkan kode cadangan berikut.",
	"twoFactorBackupCodes": "Kode Pencadangan",
	"twoFactorBackupCodesDescription": "Kamu dapat menggunakan kode ini untuk mendapatkan akses ke akun kamu apabila berada dalam situasi tidak dapat menggunakan aplikasi autentikasi 2-faktor yang kamu miliki. Setiap kode hanya dapat digunakan satu kali. Mohon simpan kode ini di tempat yang aman.",
	"download": "Unduh",
	"done": "Selesai"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"setupOf2fa": "Impostare l'autenticazione a due fattori",
	"twoFactorMoreDetailedGuideHere": "Informazioni dettagliate sull'autenticazione multi fattore (2FA/MFA)",
	"twoFactorStep1": "Innanzitutto, installa sul dispositivo un'App di autenticazione come {a} o {b}.",
	"twoFactorStep2": "Quindi, tramite la App installata, scansiona questo codice QR.",
	"launchApp": "Esegui l'App",
	"twoFactorStep2Uri": "Inserisci il seguente URL se desideri utilizzare una App per PC",
	"cancel": "Annulla",
	"continue": "Continua",
	"twoFactorStep3Title": "Inserisci il codice di verifica",
	"twoFactorStep3": "Inserite il token visualizzato nell'app e il gioco è fatto.",
	"goBack": "Indietro",
	"twoFactorSetupCompleted": "Impostazione completata! 🎉",
	"twoFactorStep4": "D'ora in poi, quando si accede, si inserisce il token nello stesso modo.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Prima di chiudere questa procedura guidata, salva i tuoi codici usa-e-getta in un posto sicuro.",
	"twoFactorBackupCodes": "Codici usa-e-getta",
	"twoFactorBackupCodesDescription": "Puoi usare questi codici usa-e-getta per ottenere l'accesso al tuo profilo in caso sia impossibile usare l'App col codice OTP. Salvali in un posto sicuro.",
	"download": "Scarica",
	"done": "Fine"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"setupOf2fa": "二要素認証のセットアップ",
	"twoFactorMoreDetailedGuideHere": "詳細なガイドはこちら",
	"twoFactorStep1": "まず、{a}や{b}などの認証アプリをお使いのデバイスにインストールします。",
	"twoFactorStep2": "次に、表示されているQRコードをアプリでスキャンするか、ボタンをクリックして端末上でアプリを開きます。",
	"launchApp": "アプリを起動",
	"twoFactorStep2Uri": "デスクトップアプリを使用する場合は次のURIを入力します",
	"cancel": "キャンセル",
	"continue": "続ける",
	"twoFactorStep3Title": "確認コードを入力",
	"twoFactorStep3": "アプリに表示されている確認コード（トークン）を入力します。",
	"goBack": "戻る",
	"twoFactorSetupCompleted": "設定が完了しました",
	"twoFactorStep4": "これからログインするときも、同じようにコードを入力します。",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "このウィザードを閉じる前に、以下のバックアップコードを確認してください。",
	"twoFactorBackupCodes": "バックアップコード",
	"twoFactorBackupCodesDescription": "認証アプリが使用できなくなった場合、以下のバックアップコードを使ってアカウントにアクセスできます。これらのコードは必ず安全な場所に保管してください。各コードは一回だけ使用できます。",
	"download": "ダウンロード",
	"done": "完了"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"setupOf2fa": "二要素認証のセットアップ",
	"twoFactorMoreDetailedGuideHere": "詳細なガイドはこちら",
	"twoFactorStep1": "ほんなら、{a}や{b}とかの認証アプリを使っとるデバイスにインストールしてな。",
	"twoFactorStep2": "次に、ここにあるQRコードをアプリでスキャンしてな～。",
	"launchApp": "アプリを起動",
	"twoFactorStep2Uri": "デスクトップアプリを使う時は次のURIを入れるで",
	"cancel": "やめる",
	"continue": "続けるで",
	"twoFactorStep3Title": "確認コードを入れてーや",
	"twoFactorStep3": "アプリに映っとる確認コード（トークン）を入れて終わりや。",
	"goBack": "戻る",
	"twoFactorSetupCompleted": "設定が終わったで。",
	"twoFactorStep4": "これからログインするときも、同じようにコードを入れるんや。",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "このウィザードを閉じる前に、したのバックアップコードを確認しいや。",
	"twoFactorBackupCodes": "バックアップコード",
	"twoFactorBackupCodesDescription": "認証アプリが使用できんなった場合、以下のバックアップコードを使ってアカウントにアクセスできるで。これらのコードは必ず安全な場所に置いときや。各コードは一回だけ使用できるで。",
	"download": "ダウンロード",
	"done": "でけた"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "First, install an authentication app (such as {a} or {b}) on your device.",
	"twoFactorStep2": "Then, scan the QR code displayed on this screen.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Cancel",
	"continue": "Continue",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Enter the authentication code (token) provided by your app to finish setup.",
	"goBack": "Back",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "From now on, any future login attempts will ask for such a login token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Sider",
	"done": "Done"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "First, install an authentication app (such as {a} or {b}) on your device.",
	"twoFactorStep2": "Then, scan the QR code displayed on this screen.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "ರದ್ದು",
	"continue": "Continue",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Enter the authentication code (token) provided by your app to finish setup.",
	"goBack": "Back",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "From now on, any future login attempts will ask for such a login token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "ಜಾಲದಿಂದಿಳಿಸು",
	"done": "Done"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"setupOf2fa": "2단계 인증 설정",
	"twoFactorMoreDetailedGuideHere": "여기에 자세한 설명이 있습니다",
	"twoFactorStep1": "먼저, {a}나 {b}등의 인증 앱을 사용 중인 디바이스에 설치합니다.",
	"twoFactorStep2": "그 후, 표시되어 있는 QR코드를 앱으로 스캔합니다.",
	"launchApp": "앱 실행",
	"twoFactorStep2Uri": "데스크톱 앱을 사용하려면 다음 URI를 입력하십시오",
	"cancel": "취소",
	"continue": "계속",
	"twoFactorStep3Title": "인증 코드 입력",
	"twoFactorStep3": "앱에 표시된 토큰을 입력하시면 완료됩니다.",
	"goBack": "뒤로",
	"twoFactorSetupCompleted": "설정 완료했습니다",
	"twoFactorStep4": "다음 로그인부터는 토큰을 입력해야 합니다.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "이 위자드를 닫기 전에 아래 백업 코드를 확인하십시오",
	"twoFactorBackupCodes": "백업 코드",
	"twoFactorBackupCodesDescription": "인증 앱을 사용할 수 없게 된 경우 아래 백업 코드를 사용하여 계정에 액세스 할 수 있습니다.이 코드들은 반드시 안전한 장소에 보관하십시오.각 코드는 한 번만 사용할 수 있습니다.",
	"download": "다운로드",
	"done": "완료"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"setupOf2fa": "Tweefactorauthenticatie instellen",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "First, install an authentication app (such as {a} or {b}) on your device.",
	"twoFactorStep2": "Then, scan the QR code displayed on this screen.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Annuleren",
	"continue": "Continue",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Enter the authentication code (token) provided by your app to finish setup.",
	"goBack": "Terug",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "From now on, any future login attempts will ask for such a login token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Downloaden",
	"done": "Klaar"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "First, install an authentication app (such as {a} or {b}) on your device.",
	"twoFactorStep2": "Then, scan the QR code displayed on this screen.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Avbryt",
	"continue": "Fortsett",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Enter the authentication code (token) provided by your app to finish setup.",
	"goBack": "Back",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "From now on, any future login attempts will ask for such a login token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Nedlastinger",
	"done": "Ferdig"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"setupOf2fa": "Skonfiguruj dwuetapową autentykację",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "Najpierw, zainstaluj aplikację uwierzytelniającą (taką jak {a} lub {b}) na swoim urządzeniu.",
	"twoFactorStep2": "Następnie, zeskanuje kod QR z ekranu.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Anuluj",
	"continue": "Continue",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Wprowadź token podany w aplikacji, aby ukończyć konfigurację.",
	"goBack": "Wróć",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "Od teraz, przy każdej próbie logowania otrzymasz prośbę o token logowania.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Pobierz",
	"done": "Gotowe"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"setupOf2fa": "Configuração de autenticação de dois fatores",
	"twoFactorMoreDetailedGuideHere": "Aqui está um guia detalhado",
	"twoFactorStep1": "Inicialmente, instale um aplicativo autenticador (como {a} ou {b}) em seu dispositivo.",
	"twoFactorStep2": "Então, escaneie o código QR exibido na tela.",
	"launchApp": "Iniciar aplicação",
	"twoFactorStep2Uri": "Acesse o seguinte URI se você estiver utilizando um aplicativo no computador",
	"cancel": "Cancelar",
	"continue": "Continuar",
	"twoFactorStep3Title": "Insira o código de autenticação",
	"twoFactorStep3": "Insira o código de autenticação (token) providenciado pelo seu aplicativo para terminar a configuração.",
	"goBack": "Voltar",
	"twoFactorSetupCompleted": "Configuração completa",
	"twoFactorStep4": "De agora em diante, quaisquer solicitações de entrada pedirão pelo código.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Antes de fechar essa janela, anote os códigos de backup a seguir.",
	"twoFactorBackupCodes": "Códigos de backup",
	"twoFactorBackupCodesDescription": "Você pode utilizar esses códigos para ganhar acesso à conta caso sua autenticação de dois fatores esteja indisponível. Cada código pode ser utilizado apenas uma vez. Por favor, guarde-os em um local seguro.",
	"download": "Descarregar",
	"done": "Concluído"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"setupOf2fa": "Настроить двухфакторную аутентификацию",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "Прежде всего, установите на устройство приложение для аутентификации, например, {a} или {b}.",
	"twoFactorStep2": "Далее отсканируйте отображаемый QR-код при помощи приложения.",
	"launchApp": "Запустить приложение",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Отмена",
	"continue": "Продолжить",
	"twoFactorStep3Title": "Введите проверочный код",
	"twoFactorStep3": "И наконец, введите код, который покажет приложение.",
	"goBack": "Выход",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "Теперь при каждом входе на сайт вам нужно будет вводить код из приложения аналогичным образом.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Скачать",
	"done": "Готово"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "Najprv si nainštalujte autentifikačnú aplikáciu (napríklad {a} alebo {b}) na svoje zariadenie.",
	"twoFactorStep2": "Potom, naskenujte QR kód zobrazený na obrazovke.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Zrušiť",
	"continue": "Continue",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Nastavenie dokončíte zadaním tokenu z vašej aplikácie.",
	"goBack": "Späť",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "Od teraz, všetky ďalšie prihlásenia budú vyžadovať prihlasovací token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Stiahnuť",
	"done": "Hotovo"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"setupOf2fa": "ตั้งค่าการยืนยันตัวตนแบบสองชั้น",
	"twoFactorMoreDetailedGuideHere": "คลิกที่นี่เพื่อดูคำแนะนำโดยละเอียด",
	"twoFactorStep1": "ขั้นตอนแรก ติดตั้งแอปยืนยันตัวตน (เช่น {a} หรือ {b}) บนอุปกรณ์ของคุณ",
	"twoFactorStep2": "จากนั้นสแกนรหัส QR ที่แสดงบนหน้าจอนี้",
	"launchApp": "เริ่มแอป",
	"twoFactorStep2Uri": "ป้อนใส่ URL ดังต่อไปนี้ถ้าหากคุณใช้โปรแกรมเดสก์ท็อป",
	"cancel": "ยกเลิก",
	"continue": "ดำเนินการต่อ",
	"twoFactorStep3Title": "ป้อนรหัสยืนยัน",
	"twoFactorStep3": "ป้อนโทเค็นที่แอปของคุณให้มาเพื่อเสร็จสิ้นการตั้งค่า",
	"goBack": "ย้อนกลับ",
	"twoFactorSetupCompleted": "ตั้งค่าสำเร็จแล้ว",
	"twoFactorStep4": "นับจากนี้เป็นต้นไปการพยายามเข้าสู่ระบบในอนาคตนั้น อาจจะต้องขอโทเค็นในการเข้าสู่ระบบดังกล่าว",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "โปรดตรวจสอบรหัสแบ๊กอัปด้านล่างก่อนที่จะปิดวิซาร์ดนี้",
	"twoFactorBackupCodes": "รหัสแบ๊กอัป",
	"twoFactorBackupCodesDescription": "หากแอปยืนยันตัวตนของคุณไม่พร้อมใช้งาน คุณสามารถใช้รหัสสำรองด้านล่างเพื่อเข้าถึงบัญชีของคุณได้ อย่าลืมเก็บรหัสเหล่านี้ไว้ในที่ปลอดภัย แต่ละรหัสสามารถใช้ได้เพียงครั้งเดียวเท่านั้น",
	"download": "ดาวน์โหลด",
	"done": "เสร็จสิ้น"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"setupOf2fa": "İki faktörlü kimlik doğrulamayı ayarlayın",
	"twoFactorMoreDetailedGuideHere": "İşte ayrıntılı kılavuz",
	"twoFactorStep1": "Öncelikle, cihazınıza bir kimlik doğrulama uygulaması (örneğin {a} veya {b}) yükleyin.",
	"twoFactorStep2": "Ardından, bu ekranda görüntülenen QR kodunu tarayın.",
	"launchApp": "Uygulamayı başlatın",
	"twoFactorStep2Uri": "Masaüstü programı kullanıyorsanız aşağıdaki URI'yi girin",
	"cancel": "Vazgeç",
	"continue": "Devam et",
	"twoFactorStep3Title": "Doğrulama kodunu girin",
	"twoFactorStep3": "Uygulamanız tarafından sağlanan kimlik doğrulama kodunu (token) girerek kurulumu tamamlayın.",
	"goBack": "Geri",
	"twoFactorSetupCompleted": "Kurulum tamamlandı",
	"twoFactorStep4": "Bundan sonra, gelecekteki tüm oturum açma girişimlerinde bu tür bir oturum açma jetonu istenecek.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Bu pencereyi kapatmadan önce, lütfen aşağıdaki yedek kodları not edin.",
	"twoFactorBackupCodes": "Yedek kodlar",
	"twoFactorBackupCodesDescription": "İki faktörlü kimlik doğrulama uygulamasını kullanamaz hale gelmen durumunda, bu kodları kullanarak hesabınıza erişebilirsin. Her kod yalnızca bir kez kullanılabilir. Lütfen bu kodları güvenli bir yerde sakla.",
	"download": "İndir",
	"done": "Tamam"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"setupOf2fa": "Setup two-factor authentification",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "First, install an authentication app (such as {a} or {b}) on your device.",
	"twoFactorStep2": "Then, scan the QR code displayed on this screen.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Cancel",
	"continue": "Continue",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Enter the authentication code (token) provided by your app to finish setup.",
	"goBack": "Back",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "From now on, any future login attempts will ask for such a login token.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Download",
	"done": "Done"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"setupOf2fa": "Налаштувати двофакторну автентифікацію",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "Спершу встановіть на свій пристрій програму автентифікації (наприклад {a} або {b}).",
	"twoFactorStep2": "Потім відскануйте QR-код, який відображається на цьому екрані.",
	"launchApp": "Запуск додатку",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Скасувати",
	"continue": "Продовжити",
	"twoFactorStep3Title": "Enter an authentication code",
	"twoFactorStep3": "Щоб завершити налаштування, введіть токен, наданий вашою програмою.",
	"goBack": "Назад",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "Відтепер будь-які майбутні спроби входу вимагатимуть такого токена.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Завантажити",
	"done": "Готово"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"setupOf2fa": "Thiết lập xác thực 2 yếu tố",
	"twoFactorMoreDetailedGuideHere": "Here is detailed guide",
	"twoFactorStep1": "Trước tiên, hãy cài đặt một ứng dụng xác minh (chẳng hạn như {a} hoặc {b}) trên thiết bị của bạn.",
	"twoFactorStep2": "Sau đó, quét mã QR hiển thị trên màn hình này.",
	"launchApp": "Launch the app",
	"twoFactorStep2Uri": "Enter the following URI if you are using a desktop program",
	"cancel": "Hủy",
	"continue": "Tiếp tục",
	"twoFactorStep3Title": "Nhập mã xác thực",
	"twoFactorStep3": "Nhập mã token do ứng dụng của bạn cung cấp để hoàn tất thiết lập.",
	"goBack": "Quay lại",
	"twoFactorSetupCompleted": "Setup complete",
	"twoFactorStep4": "Kể từ bây giờ, những lần đăng nhập trong tương lai sẽ yêu cầu mã token đăng nhập đó.",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "Before you close this window, please note the following backup codes.",
	"twoFactorBackupCodes": "Backup codes",
	"twoFactorBackupCodesDescription": "You can use these codes to gain access to your account in case of becoming unable to use your two-factor authentificator app. Each can only be used once. Please keep them in a safe place.",
	"download": "Tải xuống",
	"done": "Xong"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"setupOf2fa": "设置双重认证",
	"twoFactorMoreDetailedGuideHere": "此处为详细指南",
	"twoFactorStep1": "首先，在您的设备上安装验证应用，例如 {a} 或 {b}。",
	"twoFactorStep2": "然后，扫描屏幕上显示的二维码。",
	"launchApp": "启动应用",
	"twoFactorStep2Uri": "如果使用桌面应用程序的话，请输入下面的 URI",
	"cancel": "取消",
	"continue": "继续",
	"twoFactorStep3Title": "输入验证码",
	"twoFactorStep3": "输入您的应用提供的动态口令以完成设置。",
	"goBack": "返回",
	"twoFactorSetupCompleted": "设置完成",
	"twoFactorStep4": "从现在开始，任何登录操作都将要求您提供动态口令。",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "在关闭此窗口前，请确认下面的备用代码",
	"twoFactorBackupCodes": "备用代码",
	"twoFactorBackupCodesDescription": "如果无法使用验证器，可以使用以下的备用代码来访问账户。请务必将这些代码保存在安全的地方。每个代码仅可使用一次。",
	"download": "下载",
	"done": "完成"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"setupOf2fa": "設定雙重驗證",
	"twoFactorMoreDetailedGuideHere": "請點擊此處查看詳細說明。",
	"twoFactorStep1": "首先，在您的裝置上安裝驗證程式，例如 {a} 或 {b}。",
	"twoFactorStep2": "然後，掃描螢幕上的 QR 碼。",
	"launchApp": "啟動 APP",
	"twoFactorStep2Uri": "使用桌面版應用程式時，請輸入以下的 URI",
	"cancel": "取消",
	"continue": "繼續",
	"twoFactorStep3Title": "輸入驗證碼",
	"twoFactorStep3": "輸入應用程式所提供的權杖以完成設定。",
	"goBack": "返回",
	"twoFactorSetupCompleted": "設定完成",
	"twoFactorStep4": "從現在開始，任何登入操作都將要求您提供權杖。",
	"twoFactorCheckBackupCodesBeforeCloseThisWizard": "請先確認下列備用驗證碼，再關閉此精靈視窗。",
	"twoFactorBackupCodes": "備用驗證碼",
	"twoFactorBackupCodesDescription": "如果驗證應用程式不能用了，可以使用以下的備用驗證碼存取您的帳戶。請務必妥善保管這個驗證碼。每個驗證碼只能使用一次。",
	"download": "下載",
	"done": "完成"
}
</locale>
