<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="550"
	data-testid="user-setup-dialog"
	@close="close(true)"
	@closed="emit('closed')"
>
	<template v-if="page === 1" #header><i class="ti ti-user-edit"></i> {{ $locale.sfc.initialAccountSettingProfileSetting }}</template>
	<template v-else-if="page === 2" #header><i class="ti ti-lock"></i> {{ $locale.sfc.initialAccountSettingPrivacySetting }}</template>
	<template v-else-if="page === 3" #header><i class="ti ti-user-plus"></i> {{ $locale.sfc.follow }}</template>
	<template v-else-if="page === 4" #header><i class="ti ti-bell-plus"></i> {{ $locale.sfc.pushNotification }}</template>
	<template v-else-if="page === 5" #header>{{ $locale.sfc.done }}</template>
	<template v-else #header>{{ $locale.sfc.initialAccountSetting }}</template>

	<div style="overflow-x: clip;">
		<div :class="$style.progressBar">
			<div :class="$style.progressBarValue" :style="{ width: `${(page / 5) * 100}%` }"></div>
		</div>
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<template v-if="page === 0">
				<div :class="$style.centerPage">
					<MkAnimBg style="position: absolute; top: 0;" :scale="1.5"/>
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-confetti" style="display: block; margin: auto; font-size: 3em; color: var(--MI_THEME-accent);"></i>
							<div style="font-size: 120%;">{{ $locale.sfc.initialAccountSettingAccountCreated }}</div>
							<div>{{ $locale.sfc.initialAccountSettingLetsStartAccountSetup }}</div>
							<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-testid="user-setup-continue" @click="page++">{{ $locale.sfc.initialAccountSettingProfileSetting }} <i class="ti ti-arrow-right"></i></MkButton>
							<MkButton style="margin: 0 auto;" transparent rounded @click="later(true)">{{ $locale.sfc.later }}</MkButton>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 1">
				<div style="height: 100cqh; overflow: auto;">
					<div :class="$style.pageRoot">
						<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;" :class="$style.pageMain">
							<XProfile/>
						</div>
						<div :class="$style.pageFooter">
							<div class="_buttonsCenter">
								<MkButton rounded data-testid="user-setup-back" @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton primary rounded gradate data-testid="user-setup-continue" @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 2">
				<div style="height: 100cqh; overflow: auto;">
					<div :class="$style.pageRoot">
						<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;" :class="$style.pageMain">
							<XPrivacy/>
						</div>
						<div :class="$style.pageFooter">
							<div class="_buttonsCenter">
								<MkButton rounded data-testid="user-setup-back" @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton primary rounded gradate data-testid="user-setup-continue" @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 3">
				<div style="height: 100cqh; overflow: auto;">
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<XFollow/>
					</div>
					<div :class="$style.pageFooter">
						<div class="_buttonsCenter">
							<MkButton rounded data-testid="user-setup-back" @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
							<MkButton primary rounded gradate style="" data-testid="user-setup-continue" @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 4">
				<div :class="$style.centerPage">
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-bell-ringing-2" style="display: block; margin: auto; font-size: 3em; color: var(--MI_THEME-accent);"></i>
							<div style="font-size: 120%;">{{ $locale.sfc.pushNotification }}</div>
							<div style="padding: 0 16px;">{{ interpolateLocaleParameters($locale.sfc.initialAccountSettingPushNotificationDescription, { name: instance.name ?? host }) }}</div>
							<MkPushNotificationAllowButton primary showOnlyToRegister style="margin: 0 auto;"/>
							<div class="_buttonsCenter" style="margin-top: 16px;">
								<MkButton rounded data-testid="user-setup-back" @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton primary rounded gradate data-testid="user-setup-continue" @click="page++">{{ $locale.sfc.continue }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="page === 5">
				<div :class="$style.centerPage">
					<MkAnimBg style="position: absolute; top: 0;" :scale="1.5"/>
					<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-check" style="display: block; margin: auto; font-size: 3em; color: var(--MI_THEME-accent);"></i>
							<div style="font-size: 120%;">{{ $locale.sfc.initialAccountSettingInitialAccountSettingCompleted }}</div>
							<div>{{ interpolateLocaleParameters($locale.sfc.initialAccountSettingYouCanContinueTutorial, { name: instance.name ?? host }) }}</div>
							<div class="_buttonsCenter" style="margin-top: 16px;">
								<MkButton rounded primary gradate data-testid="user-setup-continue" @click="launchTutorial()">{{ $locale.sfc.initialAccountSettingStartTutorial }} <i class="ti ti-arrow-right"></i></MkButton>
							</div>
							<div class="_buttonsCenter">
								<MkButton rounded data-testid="user-setup-back" @click="page--"><i class="ti ti-arrow-left"></i> {{ $locale.sfc.goBack }}</MkButton>
								<MkButton rounded primary data-testid="user-setup-continue" @click="setupComplete()">{{ $locale.sfc.close }}</MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, watch, nextTick, defineAsyncComponent } from 'vue';
import { host } from '@features/boot/frontend/shared/config.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import XProfile from '@features/users/frontend/components/MkUserSetupDialog.Profile.vue';
import XFollow from '@features/users/frontend/components/MkUserSetupDialog.Follow.vue';
import XPrivacy from '@features/users/frontend/components/MkUserSetupDialog.Privacy.vue';
import MkAnimBg from '@features/web/frontend/components/MkAnimBg.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { instance } from '@features/instance/frontend/instance.js';
import MkPushNotificationAllowButton from '@features/notifications/frontend/components/MkPushNotificationAllowButton.vue';
import { store } from '@features/preferences/frontend/store.js';
import * as os from '@features/ui/frontend/os.js';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const page = ref(store.s.accountSetupWizard);

watch(page, () => {
	store.set('accountSetupWizard', page.value);
});

async function close(skip: boolean) {
	if (skip) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: $locale.value.sfc.initialAccountSettingSkipAreYouSure,
		});
		if (canceled) return;
	}

	dialog.value?.close();
	store.set('accountSetupWizard', -1);
}

function setupComplete() {
	store.set('accountSetupWizard', -1);
	dialog.value?.close();
}

function launchTutorial() {
	setupComplete();
	nextTick(async () => {
		const { dispose } = await os.popupAsyncWithDialog(import('@features/navigation/frontend/components/MkTutorialDialog.vue').then(x => x.default), {
			initialPage: 1,
		}, {
			closed: () => dispose(),
		});
	});
}

async function later(later: boolean) {
	if (later) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: $locale.value.sfc.initialAccountSettingLaterAreYouSure,
		});
		if (canceled) return;
	}

	dialog.value?.close();
	store.set('accountSetupWizard', 0);
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

.progressBar {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 10;
	width: 100%;
	height: 4px;
}

.progressBarValue {
	height: 100%;
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
	transition: all 0.5s cubic-bezier(0,.5,.5,1);
}

.centerPage {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100cqh;
	padding-bottom: 30px;
	box-sizing: border-box;
}

.pageRoot {
	display: flex;
	flex-direction: column;
	min-height: 100%;
}

.pageMain {
	flex-grow: 1;
}

.pageFooter {
	position: sticky;
	bottom: 0;
	left: 0;
	flex-shrink: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	-webkit-backdrop-filter: blur(15px);
	backdrop-filter: blur(15px);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"initialAccountSettingProfileSetting": "إعدادات الملف الشخصي",
	"initialAccountSettingPrivacySetting": "إعدادات الخصوصية",
	"follow": "تابِع",
	"pushNotification": "إرسال الإشعارات",
	"done": "تمّ",
	"initialAccountSetting": "إعداد الملف الشخصي",
	"initialAccountSettingAccountCreated": "نجح إنشاء حسابك!",
	"initialAccountSettingLetsStartAccountSetup": "إذا كنت جديدًا لنعدّ حسابك الشخصي.",
	"later": "لاحقاً",
	"goBack": "رجوع",
	"continue": "متابعة",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "اغلق",
	"initialAccountSettingSkipAreYouSure": "أتريد تخطي إعداد الملف الشخصي؟",
	"initialAccountSettingLaterAreYouSure": "أتريد إعداد الملف الشخصي لاحقًا؟"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"initialAccountSettingProfileSetting": "Configuració del perfil",
	"initialAccountSettingPrivacySetting": "Configuració de seguretat",
	"follow": "Segueix",
	"pushNotification": "Enviament de notificacions",
	"done": "Fet",
	"initialAccountSetting": "Configuració del perfil",
	"initialAccountSettingAccountCreated": "S'ha completat la creació del compte!",
	"initialAccountSettingLetsStartAccountSetup": "Posem ràpidament la configuració inicial del compte.",
	"later": "Més tard",
	"goBack": "Tornar",
	"continue": "Continuar",
	"initialAccountSettingPushNotificationDescription": "Activant les notificacions emergents et permetrà rebre notificacions de {name} directament al teu dispositiu.",
	"initialAccountSettingInitialAccountSettingCompleted": "Configuració del perfil completada!",
	"initialAccountSettingYouCanContinueTutorial": "Pots continuar amb un tutorial per aprendre a Fer servir {name} (MissKey) o tu pots estalviar i començar a fer-lo servir ja.",
	"initialAccountSettingStartTutorial": "Començar el tutorial",
	"close": "Tanca",
	"initialAccountSettingSkipAreYouSure": "Et vols saltar la configuració del perfil?",
	"initialAccountSettingLaterAreYouSure": "Vols continuar la configuració del perfil més tard?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"initialAccountSettingProfileSetting": "Nastavení profilu",
	"initialAccountSettingPrivacySetting": "Nastavení soukromí",
	"follow": "Sledovaní",
	"pushNotification": "Push oznámení",
	"done": "Hotovo",
	"initialAccountSetting": "Nastavení profilu",
	"initialAccountSettingAccountCreated": "Váš účet byl úspěšně vytvořen!",
	"initialAccountSettingLetsStartAccountSetup": "Pro začátek si nastavte svůj profil.",
	"later": "Později",
	"goBack": "Zpět",
	"continue": "Pokračovat",
	"initialAccountSettingPushNotificationDescription": "Povolení push oznámení vám umožní přijímat oznámení od {name} přímo ve vašem zařízení.",
	"initialAccountSettingInitialAccountSettingCompleted": "Nastavení profilu dokončeno!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Zavřít",
	"initialAccountSettingSkipAreYouSure": "Opravdu chcete přeskočit nastavení profilu?",
	"initialAccountSettingLaterAreYouSure": "Opravdu chcete provést nastavení profilu později?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Follow",
	"pushNotification": "Push notifications",
	"done": "Done",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Back",
	"continue": "Continue",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Close",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"initialAccountSettingProfileSetting": "Profileinstellungen",
	"initialAccountSettingPrivacySetting": "Privatsphäreneinstellungen",
	"follow": "Folgen",
	"pushNotification": "Push-Benachrichtigungen",
	"done": "Fertig",
	"initialAccountSetting": "Kontoeinrichtung",
	"initialAccountSettingAccountCreated": "Dein Konto wurde erfolgreich erstellt!",
	"initialAccountSettingLetsStartAccountSetup": "Lass uns nun dein Konto einrichten.",
	"later": "Später",
	"goBack": "Zurück",
	"continue": "Fortfahren",
	"initialAccountSettingPushNotificationDescription": "Durch die Aktivierung von Push-Benachrichtigungen kannst du von {name} Benachrichtigungen direkt auf dein Gerät erhalten.",
	"initialAccountSettingInitialAccountSettingCompleted": "Kontoeinrichtung abgeschlossen!",
	"initialAccountSettingYouCanContinueTutorial": "Du kannst mit dem Tutorial von {name}(Misskey) fortfahren, oder auch abbrechen und gleich anfangen Misskey zu benutzen.",
	"initialAccountSettingStartTutorial": "Fange mit dem Tutorial an",
	"close": "Schließen",
	"initialAccountSettingSkipAreYouSure": "Die Kontoeinrichtung wirklich überspringen?",
	"initialAccountSettingLaterAreYouSure": "Die Kontoeinrichtung wirklich später erledigen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Follow",
	"pushNotification": "Push notifications",
	"done": "Done",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Back",
	"continue": "Continue",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Close",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"initialAccountSettingProfileSetting": "Configuración del perfil",
	"initialAccountSettingPrivacySetting": "Configuración de privacidad",
	"follow": "Seguir",
	"pushNotification": "Alerta emergente",
	"done": "Hecho",
	"initialAccountSetting": "Configración inicial de su cuenta",
	"initialAccountSettingAccountCreated": "¡La cuenta ha sido creada!",
	"initialAccountSettingLetsStartAccountSetup": "Para empezar, creemos tu perfil.",
	"later": "Ahora no",
	"goBack": "Anterior",
	"continue": "Continuar",
	"initialAccountSettingPushNotificationDescription": "Habilitar las notificaciones push te permitirá recibir notificaciones de {name} directamente en tu dispositivo.",
	"initialAccountSettingInitialAccountSettingCompleted": "¡Configuración del perfil completada!",
	"initialAccountSettingYouCanContinueTutorial": "Puedes proceder a un tutorial sobre cómo usar {name} (Misskey) o puedes terminar la instalación aquí y empezar a usarlo ya mismo.",
	"initialAccountSettingStartTutorial": "Comenzar tutorial",
	"close": "Cerrar",
	"initialAccountSettingSkipAreYouSure": "¿Realmente quieres saltarte la configuración del perfil?",
	"initialAccountSettingLaterAreYouSure": "¿Realmente quieres configurar tu perfil después?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"initialAccountSettingProfileSetting": "Paramètres du profil",
	"initialAccountSettingPrivacySetting": "Paramètres de confidentialité",
	"follow": "S’abonner",
	"pushNotification": "Notifications push",
	"done": "Terminé",
	"initialAccountSetting": "Configuration initiale du profil",
	"initialAccountSettingAccountCreated": "Votre compte a été créé avec succès !",
	"initialAccountSettingLetsStartAccountSetup": "Procédons au réglage initial du compte.",
	"later": "Plus tard",
	"goBack": "Retour",
	"continue": "Continuer",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Configuration du profil terminée avec succès !",
	"initialAccountSettingYouCanContinueTutorial": "Vous pouvez procéder au tutoriel sur l'utilisation de {name}(Misskey) ou vous arrêter ici et commencer à l'utiliser immédiatement.",
	"initialAccountSettingStartTutorial": "Démarrer le tutoriel",
	"close": "Fermer",
	"initialAccountSettingSkipAreYouSure": "Désirez-vous ignorer la configuration du profil ?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"initialAccountSettingProfileSetting": "Pengaturan profil",
	"initialAccountSettingPrivacySetting": "Pengaturan privasi",
	"follow": "Ikuti",
	"pushNotification": "Notifikasi dorong",
	"done": "Selesai",
	"initialAccountSetting": "Atur profil",
	"initialAccountSettingAccountCreated": "Akun kamu telah sukses dibuat!",
	"initialAccountSettingLetsStartAccountSetup": "Pertama-tama, ayo atur profilmu dulu.",
	"later": "Nanti saja",
	"goBack": "Kembali",
	"continue": "Lanjutkan",
	"initialAccountSettingPushNotificationDescription": "Menyalakan notifikasi dorong akan membuatmu menerima notifikasi dari {name} secara langsung ke perangkatmu.",
	"initialAccountSettingInitialAccountSettingCompleted": "Pengaturan profil selesai!",
	"initialAccountSettingYouCanContinueTutorial": "Kamu dapat menjutkan ke tutorial dalam bagaimana menggunakan {name} (Misskey) atau kamu dapat keluar dari pemasangan ini dan langsung menggunakannya segera.",
	"initialAccountSettingStartTutorial": "Mulai Tutorial",
	"close": "Tutup",
	"initialAccountSettingSkipAreYouSure": "Yakin melewati atur profil?",
	"initialAccountSettingLaterAreYouSure": "Yakin banget untuk atur profil nanti?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"initialAccountSettingProfileSetting": "Impostazioni del profilo",
	"initialAccountSettingPrivacySetting": "Impostazioni sulla privacy",
	"follow": "Segui",
	"pushNotification": "Notifiche Push",
	"done": "Fine",
	"initialAccountSetting": "Impostazioni iniziali del profilo",
	"initialAccountSettingAccountCreated": "Il tuo profilo è stato creato!",
	"initialAccountSettingLetsStartAccountSetup": "Per iniziare, impostiamo il tuo profilo.",
	"later": "Non ora",
	"goBack": "Indietro",
	"continue": "Continua",
	"initialAccountSettingPushNotificationDescription": "Attivare le notifiche push ti permettera di ricevere informazioni sulla attività di {name} direttamente sul tuo dispositivo.",
	"initialAccountSettingInitialAccountSettingCompleted": "Hai completato la configurazione iniziale!",
	"initialAccountSettingYouCanContinueTutorial": "Puoi continuare con l'esercitazione su come usare {name} (Misskey), oppure interrompere, iniziando subito a usarlo.",
	"initialAccountSettingStartTutorial": "Avvia l'esercitazione",
	"close": "Chiudi",
	"initialAccountSettingSkipAreYouSure": "Vuoi davvero saltare la configurazione iniziale?",
	"initialAccountSettingLaterAreYouSure": "Vuoi davvero rimandare la configurazione iniziale?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"initialAccountSettingProfileSetting": "プロフィール設定",
	"initialAccountSettingPrivacySetting": "プライバシー設定",
	"follow": "フォロー",
	"pushNotification": "プッシュ通知",
	"done": "完了",
	"initialAccountSetting": "初期設定",
	"initialAccountSettingAccountCreated": "アカウントの作成が完了しました！",
	"initialAccountSettingLetsStartAccountSetup": "さっそくアカウントの初期設定を行いましょう。",
	"later": "あとで",
	"goBack": "戻る",
	"continue": "続ける",
	"initialAccountSettingPushNotificationDescription": "プッシュ通知を有効にすると{name}の通知をお使いのデバイスで受け取ることができます。",
	"initialAccountSettingInitialAccountSettingCompleted": "初期設定が完了しました！",
	"initialAccountSettingYouCanContinueTutorial": "このまま{name}(Misskey)の使い方についてのチュートリアルに進むこともできますが、ここで中断してすぐに使い始めることもできます。",
	"initialAccountSettingStartTutorial": "チュートリアルを開始",
	"close": "閉じる",
	"initialAccountSettingSkipAreYouSure": "初期設定をスキップしますか？",
	"initialAccountSettingLaterAreYouSure": "初期設定をあとでやり直しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"initialAccountSettingProfileSetting": "プロフィール設定",
	"initialAccountSettingPrivacySetting": "プライバシー設定",
	"follow": "フォロー",
	"pushNotification": "プッシュ通知",
	"done": "でけた",
	"initialAccountSetting": "初期設定",
	"initialAccountSettingAccountCreated": "アカウント作り終わったで。",
	"initialAccountSettingLetsStartAccountSetup": "アカウントの初期設定をしよか。",
	"later": "あとで",
	"goBack": "戻る",
	"continue": "続けるで",
	"initialAccountSettingPushNotificationDescription": "プッシュ通知を有効にすると{name}の通知をあんたのデバイスで受け取れるで。",
	"initialAccountSettingInitialAccountSettingCompleted": "初期設定終わりや！",
	"initialAccountSettingYouCanContinueTutorial": "こんまま{name}(Misskey)の使い方のチュートリアルにも行けるけど、ここでやめてすぐに使い始めてもええで。",
	"initialAccountSettingStartTutorial": "チュートリアルはじめる",
	"close": "さいなら",
	"initialAccountSettingSkipAreYouSure": "初期設定飛ばすか？",
	"initialAccountSettingLaterAreYouSure": "初期設定あとでやり直すん？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Ḍfeṛ",
	"pushNotification": "Push notifications",
	"done": "Done",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Back",
	"continue": "Continue",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Close",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Follow",
	"pushNotification": "Push notifications",
	"done": "Done",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Back",
	"continue": "Continue",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Close",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"initialAccountSettingProfileSetting": "프로필 설정",
	"initialAccountSettingPrivacySetting": "프라이버시 설정",
	"follow": "팔로우",
	"pushNotification": "푸시 알림",
	"done": "완료",
	"initialAccountSetting": "초기 설정",
	"initialAccountSettingAccountCreated": "계정 생성이 완료되었습니다!",
	"initialAccountSettingLetsStartAccountSetup": "계정의 초기 설정을 진행합니다.",
	"later": "나중에",
	"goBack": "뒤로",
	"continue": "계속",
	"initialAccountSettingPushNotificationDescription": "푸시 알림을 활성화하면 {name}의 알림을 나의 기기에서 받아볼 수 있게 됩니다.",
	"initialAccountSettingInitialAccountSettingCompleted": "초기 설정을 모두 마쳤습니다!",
	"initialAccountSettingYouCanContinueTutorial": "이대로 {name}(Misskey)의 사용법에 대해 튜토리얼을 진행할 수도 있지만, 여기서 중단하고 바로 시작할 수도 있습니다.",
	"initialAccountSettingStartTutorial": "튜토리얼 시작",
	"close": "닫기",
	"initialAccountSettingSkipAreYouSure": "초기 설정을 중단하시겠습니까?",
	"initialAccountSettingLaterAreYouSure": "초기 설정을 나중에 진행하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Volgen",
	"pushNotification": "Pushberichten",
	"done": "Klaar",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Terug",
	"continue": "Continue",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Sluiten",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Følg",
	"pushNotification": "Push-varsler",
	"done": "Ferdig",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Back",
	"continue": "Fortsett",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Lukk",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Obserwuj",
	"pushNotification": "Powiadomienia",
	"done": "Gotowe",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Wróć",
	"continue": "Continue",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Zamknij",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"initialAccountSettingProfileSetting": "Configurações do perfil",
	"initialAccountSettingPrivacySetting": "Configurações de privacidade",
	"follow": "Seguir",
	"pushNotification": "Notificações Push",
	"done": "Concluído",
	"initialAccountSetting": "Configuração inicial do perfil",
	"initialAccountSettingAccountCreated": "A sua conta foi criada com sucesso!",
	"initialAccountSettingLetsStartAccountSetup": "Em primeiro lugar, vamos configurar o seu perfil.",
	"later": "Talvez mais tarde",
	"goBack": "Voltar",
	"continue": "Continuar",
	"initialAccountSettingPushNotificationDescription": "Habilitar notificações push o possibilitará receber notificações de {name} diretamente no seu dispositivo.",
	"initialAccountSettingInitialAccountSettingCompleted": "Configuração de perfil completa!",
	"initialAccountSettingYouCanContinueTutorial": "Você pode iniciar um tutorial de como utilizar {name} (Misskey) ou pode sair da configuração e começar o uso imediatamente.",
	"initialAccountSettingStartTutorial": "Iniciar Tutorial",
	"close": "Fechar",
	"initialAccountSettingSkipAreYouSure": "Deseja pular a configuração de perfil?",
	"initialAccountSettingLaterAreYouSure": "Deseja adiar a configuração de perfil?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"initialAccountSettingProfileSetting": "Настройки профиля",
	"initialAccountSettingPrivacySetting": "Настройки конфиденциальности",
	"follow": "Подписка",
	"pushNotification": "Push-уведомления",
	"done": "Готово",
	"initialAccountSetting": "Настройка профиля",
	"initialAccountSettingAccountCreated": "Аккаунт успешно создан!",
	"initialAccountSettingLetsStartAccountSetup": "Давайте настроим вашу учётную запись.",
	"later": "Позже",
	"goBack": "Выход",
	"continue": "Продолжить",
	"initialAccountSettingPushNotificationDescription": "Включение уведомлений позволит вам получать уведомления от {name} напрямую на ваше устройство.",
	"initialAccountSettingInitialAccountSettingCompleted": "Первоначальная настройка успешно завершена!",
	"initialAccountSettingYouCanContinueTutorial": "Вы можете продолжить туториал по тому как пользоваться {name} (Misskey), или вы можете сразу перейти к его использованию.",
	"initialAccountSettingStartTutorial": "Пройти Обучение",
	"close": "Закрыть",
	"initialAccountSettingSkipAreYouSure": "Пропустить настройку?",
	"initialAccountSettingLaterAreYouSure": "Точно настроить профиль позже?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Sledovať",
	"pushNotification": "Push notifikácie",
	"done": "Hotovo",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Späť",
	"continue": "Continue",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Zavrieť",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"initialAccountSettingProfileSetting": "ตั้งค่าโปรไฟล์",
	"initialAccountSettingPrivacySetting": "ตั้งค่าความเป็นส่วนตัว",
	"follow": "ติดตาม",
	"pushNotification": "การแจ้งเตือนแบบพุช",
	"done": "เสร็จสิ้น",
	"initialAccountSetting": "ตั้งค่าโปรไฟล์",
	"initialAccountSettingAccountCreated": "สร้างบัญชีเสร็จสมบูรณ์!",
	"initialAccountSettingLetsStartAccountSetup": "สำหรับผู้เริ่มต้นมาตั้งค่าโปรไฟล์ของคุณกันเถอะ",
	"later": "ไว้ทีหลัง",
	"goBack": "ย้อนกลับ",
	"continue": "ดำเนินการต่อ",
	"initialAccountSettingPushNotificationDescription": "เมื่อเปิดใช้งานการแจ้งเตือนแบบพุช จะสามารถรับการแจ้งเตือนจาก {name} บนอุปกรณ์ที่ใช้งานอยู่ได้",
	"initialAccountSettingInitialAccountSettingCompleted": "ตั้งค่าโปรไฟล์เสร็จสมบูรณ์แล้ว!",
	"initialAccountSettingYouCanContinueTutorial": "คุณสามารถดำเนินการต่อด้วยบทช่วยสอนเกี่ยวกับวิธีใช้ {name} (Misskey) หรือออกจากบทช่วยสอนแล้วเริ่มใช้งานได้ทันที",
	"initialAccountSettingStartTutorial": "เริ่มการฝึกสอน",
	"close": "ปิด",
	"initialAccountSettingSkipAreYouSure": "ต้องการข้ามการตั้งค่าโปรไฟล์จริงๆแบบนั้นหรอ?",
	"initialAccountSettingLaterAreYouSure": "ต้องการตั้งค่าโปรไฟล์ในภายหลังจริงๆอย่างงั้นหรอ?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"initialAccountSettingProfileSetting": "Profil ayarları",
	"initialAccountSettingPrivacySetting": "Gizlilik ayarları",
	"follow": "Takip et",
	"pushNotification": "Push bildirimleri",
	"done": "Tamam",
	"initialAccountSetting": "Profil ayarları",
	"initialAccountSettingAccountCreated": "Hesabınız başarıyla oluşturuldu!",
	"initialAccountSettingLetsStartAccountSetup": "Şimdi hesabını oluşturalım.",
	"later": "Daha sonra",
	"goBack": "Geri",
	"continue": "Devam et",
	"initialAccountSettingPushNotificationDescription": "Push bildirimlerini etkinleştirdiğinde, {name} adresinden gelen bildirimleri doğrudan cihazınıza alabilirsin.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profil kurulumu tamamlandı!",
	"initialAccountSettingYouCanContinueTutorial": "{name} (Misskey) öğreticisine geçebilir veya buradan kurulumu sonlandırıp hemen kullanabilirsin.",
	"initialAccountSettingStartTutorial": "Öğreticiye başla",
	"close": "Kapat",
	"initialAccountSettingSkipAreYouSure": "Profil kurulumunu cidden atlamak mı istiyorsun?",
	"initialAccountSettingLaterAreYouSure": "Profil ayarlarını cidden daha sonra mı yapacaksın?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"initialAccountSettingProfileSetting": "Profile settings",
	"initialAccountSettingPrivacySetting": "Privacy settings",
	"follow": "Follow",
	"pushNotification": "Push notifications",
	"done": "Done",
	"initialAccountSetting": "Profile setup",
	"initialAccountSettingAccountCreated": "Your account was successfully created!",
	"initialAccountSettingLetsStartAccountSetup": "For starters, let's set up your profile.",
	"later": "Later",
	"goBack": "Back",
	"continue": "Continue",
	"initialAccountSettingPushNotificationDescription": "Enabling push notifications will allow you to receive notifications from {name} directly on your device.",
	"initialAccountSettingInitialAccountSettingCompleted": "Profile setup complete!",
	"initialAccountSettingYouCanContinueTutorial": "You can proceed to a tutorial on how to use {name} (Misskey) or you can exit the setup here and start using it immediately.",
	"initialAccountSettingStartTutorial": "Start Tutorial",
	"close": "Close",
	"initialAccountSettingSkipAreYouSure": "Really skip profile setup?",
	"initialAccountSettingLaterAreYouSure": "Really do profile setup later?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"initialAccountSettingProfileSetting": "Налаштування профілю",
	"initialAccountSettingPrivacySetting": "Налаштування конфіденційності",
	"follow": "Підписатись",
	"pushNotification": "Push сповіщення",
	"done": "Готово",
	"initialAccountSetting": "Налаштування профілю",
	"initialAccountSettingAccountCreated": "Ваш обліковий запис успішно створено!",
	"initialAccountSettingLetsStartAccountSetup": "Для початку нумо підготуймо ваш профіль.",
	"later": "Пізніше",
	"goBack": "Назад",
	"continue": "Продовжити",
	"initialAccountSettingPushNotificationDescription": "Ввімкнення оповіщень дозволить вам отримувати оголошення від {name} прямо на ваш пристрій.",
	"initialAccountSettingInitialAccountSettingCompleted": "Обліковий запис підготовано!",
	"initialAccountSettingYouCanContinueTutorial": "Ви можете продовжити посібник по тому, як використовувати {name} (Misskey), або ви можете закінчити посібник й відразу почати користуватися ним. ",
	"initialAccountSettingStartTutorial": "Увімкнути посібник",
	"close": "Закрити",
	"initialAccountSettingSkipAreYouSure": "Ви й правда бажаєте пропустити підготування профілю? (нуймо, не треба)",
	"initialAccountSettingLaterAreYouSure": "Ви й правда бажаєте підготувати профіль пізніше?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"initialAccountSettingProfileSetting": "Thiết lập hồ sơ",
	"initialAccountSettingPrivacySetting": "Cài đặt quyền riêng tư",
	"follow": "Theo dõi",
	"pushNotification": "Thông báo đẩy",
	"done": "Xong",
	"initialAccountSetting": "Thiết lập hồ sơ",
	"initialAccountSettingAccountCreated": "Tài khoản của bạn đã được tạo thành công!",
	"initialAccountSettingLetsStartAccountSetup": "Để bắt đầu, hãy cùng thiết lập tài khoản nhé.",
	"later": "Để sau",
	"goBack": "Quay lại",
	"continue": "Tiếp tục",
	"initialAccountSettingPushNotificationDescription": "Bật thông báo đẩy sẽ cho phép bạn nhận thông báo từ {name} trực tiếp từ thiết bị của bạn.",
	"initialAccountSettingInitialAccountSettingCompleted": "Thiết lập tài khoản thành công!",
	"initialAccountSettingYouCanContinueTutorial": "Bạn có thể tiếp tục xem hướng dẫn về cách sử dụng {name} (Misskey) hoặc bạn có thể thoát khỏi phần thiết lập tại đây và bắt đầu sử dụng ngay lập tức.",
	"initialAccountSettingStartTutorial": "Bắt đầu hướng dẫn",
	"close": "Đóng",
	"initialAccountSettingSkipAreYouSure": "Bạn thực sự muốn bỏ qua mục thiết lập tài khoản?",
	"initialAccountSettingLaterAreYouSure": "Bạn thực sự muốn thiết lập tài khoản vào lúc khác?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"initialAccountSettingProfileSetting": "个人资料设置",
	"initialAccountSettingPrivacySetting": "隐私设置",
	"follow": "关注",
	"pushNotification": "推送通知",
	"done": "完成",
	"initialAccountSetting": "初始设定",
	"initialAccountSettingAccountCreated": "账户创建完成了！",
	"initialAccountSettingLetsStartAccountSetup": "马上来进行账户的初始设定吧。",
	"later": "一会再说",
	"goBack": "返回",
	"continue": "继续",
	"initialAccountSettingPushNotificationDescription": "启用推送通知的话，就可以在设备上接收来自 {name} 的通知了。",
	"initialAccountSettingInitialAccountSettingCompleted": "初始设定已经完成了！",
	"initialAccountSettingYouCanContinueTutorial": "您可以继续了解 {name}(Misskey) 的使用教程，也可以在此停止教程并立即开始使用它。\n",
	"initialAccountSettingStartTutorial": "开始教学",
	"close": "关闭",
	"initialAccountSettingSkipAreYouSure": "要跳过初始设定吗？",
	"initialAccountSettingLaterAreYouSure": "要稍后再进行初始设定吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"initialAccountSettingProfileSetting": "個人檔案設定",
	"initialAccountSettingPrivacySetting": "隱私設定",
	"follow": "追隨",
	"pushNotification": "推播通知",
	"done": "完成",
	"initialAccountSetting": "初始設定",
	"initialAccountSettingAccountCreated": "帳戶已建立完成！",
	"initialAccountSettingLetsStartAccountSetup": "來進行帳戶的初始設定吧。",
	"later": "稍後再說",
	"goBack": "返回",
	"continue": "繼續",
	"initialAccountSettingPushNotificationDescription": "啟用推送通知後，就可以在裝置上接收來自 {name} 的通知了。",
	"initialAccountSettingInitialAccountSettingCompleted": "初始設定完成了！",
	"initialAccountSettingYouCanContinueTutorial": "您可以繼續學習如何使用{name}(Misskey)，也可以就此打住，立即開始使用。",
	"initialAccountSettingStartTutorial": "開始教學課程",
	"close": "關閉",
	"initialAccountSettingSkipAreYouSure": "要略過初始設定嗎？",
	"initialAccountSettingLaterAreYouSure": "稍後再重新進行初始設定嗎？"
}
</locale>
