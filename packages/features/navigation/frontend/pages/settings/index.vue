<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs" :actions="headerActions">
	<div class="_spacer" style="--MI_SPACER-w: 900px; --MI_SPACER-min: 20px; --MI_SPACER-max: 32px;">
		<div ref="el" class="vvcocwet" :class="{ wide: !narrow }">
			<div class="body">
				<div v-if="!narrow || currentPage?.route.name == null" class="nav">
					<div class="_gaps_s">
						<MkInfo v-if="emailNotConfigured" warn class="info">{{ $locale.sfc.emailNotConfiguredWarning }} <MkA to="/settings/email" class="_link">{{ $locale.sfc.configure }}</MkA></MkInfo>
						<MkInfo v-if="storagePersistenceSupported && !storagePersisted && store.r.showStoragePersistenceSuggestion.value" class="info">
							<div>{{ $locale.sfc.settingsPersistence_description1 }}</div>
							<div>{{ $locale.sfc.settingsPersistence_description2 }}</div>
							<div><button class="_textButton" @click="enableStoragePersistence">{{ $locale.sfc.enable }}</button> | <button class="_textButton" @click="skipStoragePersistence">{{ $locale.sfc.skip }}</button></div>
						</MkInfo>
						<MkInfo v-if="!store.r.enablePreferencesAutoCloudBackup.value && store.r.showPreferencesAutoCloudBackupSuggestion.value" class="info">
							<div>{{ $locale.sfc.autoPreferencesBackupIsNotEnabledForThisDevice }}</div>
							<div><button class="_textButton" @click="enableAutoBackup">{{ $locale.sfc.enable }}</button> | <button class="_textButton" @click="skipAutoBackup">{{ $locale.sfc.skip }}</button></div>
						</MkInfo>
						<MkSuperMenu :def="menuDef" :grid="narrow" :searchIndex="searchIndex"></MkSuperMenu>
					</div>
				</div>
				<div v-if="!(narrow && currentPage?.route.name == null)" class="main">
					<div style="container-type: inline-size;">
						<NestedRouterView/>
					</div>
				</div>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import type { PageMetadata } from '@features/navigation/frontend/page.js';
import type { SuperMenuDef } from '@features/navigation/frontend/components/MkSuperMenu.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkSuperMenu from '@features/navigation/frontend/components/MkSuperMenu.vue';
import { $i } from '@features/auth/frontend/i.js';
import { clearCache } from '@features/runtime/frontend/utility/clear-cache.js';
import { instance } from '@features/instance/frontend/instance.js';
import { definePage, provideMetadataReceiver, provideReactiveMetadata } from '@features/navigation/frontend/page.js';
import * as os from '@features/ui/frontend/os.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { enableAutoBackup, getPreferencesProfileMenu } from '@features/preferences/frontend/state/utility.js';
import { store } from '@features/preferences/frontend/store.js';
import { signout } from '@features/auth/frontend/signout.js';
import { genSearchIndexes } from '@features/discovery/frontend/utility/inapp-search.js';
import { enableStoragePersistence, getStoragePersistenceStatusRef, storagePersistenceSupported, skipStoragePersistence } from '@features/runtime/frontend/utility/storage.js';

const searchIndex = await import('search-index:settings').then(({ searchIndexes }) => genSearchIndexes(searchIndexes));

const storagePersisted = await getStoragePersistenceStatusRef();

const indexInfo = {
	title: $locale.value.sfc.settings,
	icon: 'ti ti-settings',
	hideHeader: true,
};
const INFO = ref<PageMetadata>(indexInfo);
const el = useTemplateRef('el');
const childInfo = ref<null | PageMetadata>(null);

const router = useRouter();

const narrow = ref(false);
const NARROW_THRESHOLD = 600;

const currentPage = computed(() => router.currentRef.value.child);

const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow.value = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

function skipAutoBackup() {
	store.set('showPreferencesAutoCloudBackupSuggestion', false);
}

const menuDef = computed<SuperMenuDef[]>(() => [{
	items: [{
		icon: 'ti ti-user',
		text: $locale.value.sfc.profile,
		to: '/settings/profile',
		active: currentPage.value?.route.name === 'profile',
	}, {
		icon: 'ti ti-lock-open',
		text: $locale.value.sfc.privacy,
		to: '/settings/privacy',
		active: currentPage.value?.route.name === 'privacy',
	}, {
		icon: 'ti ti-bell',
		text: $locale.value.sfc.notifications,
		to: '/settings/notifications',
		active: currentPage.value?.route.name === 'notifications',
	}, {
		icon: 'ti ti-mail',
		text: $locale.value.sfc.email,
		to: '/settings/email',
		active: currentPage.value?.route.name === 'email',
	}, {
		icon: 'ti ti-lock',
		text: $locale.value.sfc.security,
		to: '/settings/security',
		active: currentPage.value?.route.name === 'security',
	}],
}, {
	items: [{
		icon: 'ti ti-adjustments',
		text: $locale.value.sfc.preferences,
		to: '/settings/preferences',
		active: currentPage.value?.route.name === 'preferences',
	}, {
		icon: 'ti ti-palette',
		text: $locale.value.sfc.theme,
		to: '/settings/theme',
		active: currentPage.value?.route.name === 'theme',
	}, {
		icon: 'ti ti-mood-happy',
		text: $locale.value.sfc.emojiPalette,
		to: '/settings/emoji-palette',
		active: currentPage.value?.route.name === 'emoji-palette',
	}, {
		icon: 'ti ti-music',
		text: $locale.value.sfc.sounds,
		to: '/settings/sounds',
		active: currentPage.value?.route.name === 'sounds',
	}, {
		icon: 'ti ti-plug',
		text: $locale.value.sfc.plugins,
		to: '/settings/plugin',
		active: currentPage.value?.route.name === 'plugin',
	}],
}, {
	items: [{
		icon: 'ti ti-cloud',
		text: $locale.value.sfc.drive,
		to: '/settings/drive',
		active: currentPage.value?.route.name === 'drive',
	}, {
		icon: 'ti ti-ban',
		text: $locale.value.sfc.muteAndBlock,
		to: '/settings/mute-block',
		active: currentPage.value?.route.name === 'mute-block',
	}, {
		icon: 'ti ti-link',
		text: $locale.value.sfc.serviceConnection,
		to: '/settings/connect',
		active: currentPage.value?.route.name === 'connect',
	}, {
		icon: 'ti ti-package',
		text: $locale.value.sfc.accountData,
		to: '/settings/account-data',
		active: currentPage.value?.route.name === 'account-data',
	}, {
		icon: 'ti ti-dots',
		text: $locale.value.sfc.other,
		to: '/settings/other',
		active: currentPage.value?.route.name === 'other',
	}],
}, {
	items: [{
		type: 'button',
		icon: 'ti ti-settings-2',
		text: $locale.value.sfc.preferencesProfile,
		action: async (ev) => {
			os.popupMenu(getPreferencesProfileMenu(), ev.currentTarget ?? ev.target);
		},
	}, {
		type: 'button',
		icon: 'ti ti-trash',
		text: $locale.value.sfc.clearCache,
		action: async () => {
			await clearCache();
		},
	}, {
		type: 'button',
		icon: 'ti ti-power',
		text: $locale.value.sfc.logout,
		action: async () => {
			const { canceled } = await os.confirm({
				type: 'warning',
				title: $locale.value.sfc.logoutConfirm,
				text: $locale.value.sfc.logoutWillClearClientData,
			});
			if (canceled) return;
			signout();
		},
		danger: true,
	}],
}]);

onMounted(() => {
	if (el.value == null) return; // TSを黙らすため

	ro.observe(el.value);

	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow.value && currentPage.value?.route.name == null) {
		router.replace('/settings/profile');
	}
});

onActivated(() => {
	if (el.value == null) return; // TSを黙らすため

	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow.value && currentPage.value?.route.name == null) {
		router.replace('/settings/profile');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (to.route.name === 'settings' && to.child?.route.name == null && !narrow.value) {
		router.replace('/settings/profile');
	}
});

const emailNotConfigured = computed(() => $i && instance.enableEmail && ($i.email == null || !$i.emailVerified));

provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	if (info == null) {
		childInfo.value = null;
	} else {
		childInfo.value = info;
		INFO.value.needWideArea = info.needWideArea ?? undefined;
	}
});
provideReactiveMetadata(INFO);

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => INFO.value);
// w 890
// h 700
</script>

<style lang="scss" scoped>
.vvcocwet {
	&.wide {
		> .body {
			display: flex;
			height: 100%;

			> .nav {
				width: 34%;
				padding-right: 32px;
				box-sizing: border-box;
			}

			> .main {
				flex: 1;
				min-width: 0;
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"settings": "الاعدادات",
	"profile": "الملف التعريفي",
	"privacy": "الخصوصية",
	"notifications": "الإشعارات",
	"email": "البريد الإلكتروني ",
	"security": "الأمان",
	"preferences": "Preferences",
	"theme": "المظهر",
	"emojiPalette": "Emoji palette",
	"sounds": "الرنات",
	"plugins": "الإضافات",
	"drive": "قرص التخرين",
	"muteAndBlock": "المكتومون والمحجوبون",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "منوعات",
	"preferencesProfile": "Preferences profile",
	"clearCache": "امسح التخزين المؤقت",
	"logout": "الخروج",
	"logoutConfirm": "أتريد الخروج؟",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "لم تعيّن بريدًا إلكترونيًا",
	"configure": "اضبط",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "تشغيل",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"settings": "Preferències",
	"profile": "Perfil",
	"privacy": "Privadesa",
	"notifications": "Notificacions",
	"email": "Correu electrònic",
	"security": "Seguretat",
	"preferences": "Preferències ",
	"theme": "Tema",
	"emojiPalette": "Calaix d'emojis",
	"sounds": "Sons",
	"plugins": "Extensions",
	"drive": "Disc",
	"muteAndBlock": "Silencia i bloca",
	"serviceConnection": "Relació entre serveis",
	"accountData": "Dades del compte",
	"other": "Altres",
	"preferencesProfile": "Perfil de configuració ",
	"clearCache": "Esborra la memòria cau",
	"logout": "Tancar la sessió",
	"logoutConfirm": "Vols sortir?",
	"logoutWillClearClientData": "En tancar la sessió, la informació del client al navegador s'esborrarà. Per garantir que la informació de configuració es pugui restaurar en tornar a iniciar sessió activa la còpia de seguretat automàtica de la configuració.",
	"emailNotConfiguredWarning": "Adreça de correu electrònic",
	"configure": "Configurar",
	"settingsPersistence_description1": "Habilitar la persistència de la configuració permet que no es perdi la informació de la configuració ",
	"settingsPersistence_description2": "Depenent de l'entorn pot ser que no puguis habilitar aquesta opció.",
	"enable": "Habilita",
	"skip": "Ometre ",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "La còpia de seguretat automàtica no es troba activada en aquest dispositiu."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"settings": "Nastavení",
	"profile": "Váš profil",
	"privacy": "Soukromí",
	"notifications": "Oznámení",
	"email": "Email",
	"security": "Zabezpečení",
	"preferences": "Preferences",
	"theme": "Vzhled",
	"emojiPalette": "Emoji palette",
	"sounds": "Zvuky",
	"plugins": "Pluginy",
	"drive": "Úložiště",
	"muteAndBlock": "Ztlumení a blokování",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Ostatní",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Vyprázdnit mezipaměť",
	"logout": "Odhlásit",
	"logoutConfirm": "Opravdu se chcete odhlásit?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "E-mailová adresa není nastavena.",
	"configure": "Nastavit",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Povolit",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"settings": "Settings",
	"profile": "Profile",
	"privacy": "Privacy",
	"notifications": "Notifications",
	"email": "Email",
	"security": "Security",
	"preferences": "Preferences",
	"theme": "Themes",
	"emojiPalette": "Emoji palette",
	"sounds": "Sounds",
	"plugins": "Plugins",
	"drive": "Drive",
	"muteAndBlock": "Mutes and Blocks",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Other",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Clear cache",
	"logout": "Sign Out",
	"logoutConfirm": "Are you sure you want to log out?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Email address not set.",
	"configure": "Configure",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Enable",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"settings": "Einstellungen",
	"profile": "Profil",
	"privacy": "Privatsphäre",
	"notifications": "Benachrichtigungen",
	"email": "Email",
	"security": "Sicherheit",
	"preferences": "Einstellungen",
	"theme": "Farbschema",
	"emojiPalette": "Emoji-Palette",
	"sounds": "Töne",
	"plugins": "Plugins",
	"drive": "Drive",
	"muteAndBlock": "Stummschaltungen und Blockierungen",
	"serviceConnection": "Integrierte Dienste",
	"accountData": "Kontodaten",
	"other": "Anderes",
	"preferencesProfile": "Einstellungsprofil",
	"clearCache": "Cache leeren",
	"logout": "Abmelden",
	"logoutConfirm": "Wirklich abmelden?",
	"logoutWillClearClientData": "Beim Abmelden werden die Konfigurationsdaten des Clients aus dem Browser gelöscht. Um sicherzustellen, dass die Konfigurationsdaten beim erneuten Einloggen wiederhergestellt werden können, aktivieren Sie bitte die automatische Sicherung der Konfiguration.",
	"emailNotConfiguredWarning": "Keine Email-Adresse hinterlegt.",
	"configure": "Konfigurieren",
	"settingsPersistence_description1": "Durch das Aktivieren der persistenten Speicherung der Einstellungen kann verhindert werden, dass Einstellungsinformationen verloren gehen.",
	"settingsPersistence_description2": "Je nach Umgebung ist eine Aktivierung möglicherweise nicht möglich.",
	"enable": "Aktivieren",
	"skip": "Überspringen",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Die automatische Sicherung der Einstellungen ist auf diesem Gerät nicht aktiviert."
}
</locale>

<locale locale="en-US" lang="json">
{
	"settings": "Settings",
	"profile": "Profile",
	"privacy": "Privacy",
	"notifications": "Notifications",
	"email": "Email",
	"security": "Security",
	"preferences": "Preferences",
	"theme": "Themes",
	"emojiPalette": "Emoji palette",
	"sounds": "Sounds",
	"plugins": "Plugins",
	"drive": "Drive",
	"muteAndBlock": "Mutes and Blocks",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Other",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Clear cache",
	"logout": "Sign Out",
	"logoutConfirm": "Are you sure you want to log out?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Email address not set.",
	"configure": "Configure",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Enable",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"settings": "Configuración",
	"profile": "Perfil",
	"privacy": "Privacidad",
	"notifications": "Notificaciones",
	"email": "Correo",
	"security": "Seguridad",
	"preferences": "Preferencias",
	"theme": "Tema",
	"emojiPalette": "Paleta emoji",
	"sounds": "Sonidos",
	"plugins": "Plugins",
	"drive": "Drive",
	"muteAndBlock": "Silenciar y bloquear",
	"serviceConnection": "Integraciones",
	"accountData": "Datos de la cuenta",
	"other": "Otro",
	"preferencesProfile": "Configuración del perfil",
	"clearCache": "Limpiar caché",
	"logout": "Cerrar sesión",
	"logoutConfirm": "¿Cerrar sesión?",
	"logoutWillClearClientData": "Al cerrar la sesión, la información de configuración del cliente se borra del navegador. Para garantizar que la información de configuración se pueda restaurar al volver a iniciar sesión, active la copia de seguridad automática de la configuración.",
	"emailNotConfiguredWarning": "No se ha configurado una dirección de correo electrónico.",
	"configure": "Configurar",
	"settingsPersistence_description1": "Habilitar la persistencia de la configuración evita que se pierda la información de configuración.",
	"settingsPersistence_description2": "Es posible que no se pueda habilitar esta función dependiendo del entorno.",
	"enable": "Activar",
	"skip": "Saltar",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "La copia de seguridad automática de los ajustes no está activada en este dispositivo."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"settings": "Paramètres",
	"profile": "Profil",
	"privacy": "Confidentialité",
	"notifications": "Notifications",
	"email": "E-mail ",
	"security": "Sécurité",
	"preferences": "Preferences",
	"theme": "Thème",
	"emojiPalette": "Emoji palette",
	"sounds": "Sons",
	"plugins": "Extensions",
	"drive": "Disque",
	"muteAndBlock": "Masqué·e·s / Bloqué·e·s",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Autre",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Vider le cache",
	"logout": "Se déconnecter",
	"logoutConfirm": "Se déconnecter\u202f?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Vous n'avez pas configuré d'adresse e-mail.",
	"configure": "Configurer",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Activer",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"settings": "Pengaturan",
	"profile": "Profil",
	"privacy": "Privasi",
	"notifications": "Notifikasi",
	"email": "Surel",
	"security": "Keamanan",
	"preferences": "Preferences",
	"theme": "Tema",
	"emojiPalette": "Palet emoji",
	"sounds": "Bunyi",
	"plugins": "Plugin",
	"drive": "Drive",
	"muteAndBlock": "Bisukan / Blokir",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Lainnya",
	"preferencesProfile": "Pengaturan profil",
	"clearCache": "Hapus tembolok",
	"logout": "Keluar",
	"logoutConfirm": "Anda yakin ingin keluar?",
	"logoutWillClearClientData": "Pengaturan klien di browser akan terhapus jika anda keluar dari sesi. Untuk mengembalikan pengaturan saat masuk kembali, anda perlu mengaktifkan pencadangan otomatis di pengaturan anda.",
	"emailNotConfiguredWarning": "Alamat surel tidak disetel.",
	"configure": "Setel",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Aktifkan",
	"skip": "Lewati",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"settings": "Impostazioni",
	"profile": "Profilo",
	"privacy": "Privacy",
	"notifications": "Notifiche",
	"email": "Email",
	"security": "Sicurezza",
	"preferences": "Preferenze",
	"theme": "Tema",
	"emojiPalette": "Tavolozza emoji",
	"sounds": "Impostazioni suoni",
	"plugins": "Estensioni",
	"drive": "Drive",
	"muteAndBlock": "Silenziare e bloccare",
	"serviceConnection": "Integrazione servizi",
	"accountData": "Dati del profilo",
	"other": "Eccetera",
	"preferencesProfile": "Preferenze del profilo",
	"clearCache": "Svuota la cache",
	"logout": "Uscita",
	"logoutConfirm": "Vuoi davvero uscire da Misskey? ",
	"logoutWillClearClientData": "All'uscita, la configurazione del client viene rimossa dal browser. Per ripristinarla quando si effettua nuovamente l'accesso, abilitare il backup automatico.",
	"emailNotConfiguredWarning": "Non hai impostato nessun indirizzo e-mail.",
	"configure": "Imposta",
	"settingsPersistence_description1": "Attivando le impostazioni persistenti si può evitare di riconfigurare il client successivamente.",
	"settingsPersistence_description2": "Potrebbe non essere possibile attivare, dipende dall'ambiente.",
	"enable": "Abilita",
	"skip": "Salta",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Su questo dispositivo non è stato attivato il backup automatico delle preferenze."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"settings": "設定",
	"profile": "プロフィール",
	"privacy": "プライバシー",
	"notifications": "通知",
	"email": "メール",
	"security": "セキュリティ",
	"preferences": "環境設定",
	"theme": "テーマ",
	"emojiPalette": "絵文字パレット",
	"sounds": "サウンド",
	"plugins": "プラグイン",
	"drive": "ドライブ",
	"muteAndBlock": "ミュートとブロック",
	"serviceConnection": "サービス連携",
	"accountData": "アカウントのデータ",
	"other": "その他",
	"preferencesProfile": "設定のプロファイル",
	"clearCache": "キャッシュをクリア",
	"logout": "ログアウト",
	"logoutConfirm": "ログアウトしますか？",
	"logoutWillClearClientData": "ログアウトするとクライアントの設定情報がブラウザから消去されます。再ログイン時に設定情報を復元できるようにするためには、設定の自動バックアップを有効にしてください。",
	"emailNotConfiguredWarning": "メールアドレスの設定がされていません。",
	"configure": "設定する",
	"settingsPersistence_description1": "設定の永続化を有効にすると、設定情報が失われるのを防止できます。",
	"settingsPersistence_description2": "環境によっては有効化できない場合があります。",
	"enable": "有効にする",
	"skip": "スキップ",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "このデバイスで設定の自動バックアップは有効になっていません。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"settings": "設定",
	"profile": "プロフィール",
	"privacy": "プライバシー",
	"notifications": "通知",
	"email": "メール",
	"security": "セキュリティ",
	"preferences": "環境設定",
	"theme": "テーマ",
	"emojiPalette": "絵文字パレット",
	"sounds": "音",
	"plugins": "プラグイン",
	"drive": "ドライブ",
	"muteAndBlock": "ミュートとブロック",
	"serviceConnection": "サービス連携",
	"accountData": "アカウントのデータ",
	"other": "その他",
	"preferencesProfile": "設定のプロファイル",
	"clearCache": "キャッシュをほかす",
	"logout": "ログアウト",
	"logoutConfirm": "ログアウトしまっか？",
	"logoutWillClearClientData": "ログアウトするとクライアントの設定情報がブラウザから消されてまうで。再ログイン時に設定情報を復元できるようにするためには、設定の自動バックアップを有効にするとええで。",
	"emailNotConfiguredWarning": "メアドの設定がされてへんで。",
	"configure": "設定する",
	"settingsPersistence_description1": "設定の永続化を有効にすると、設定情報が失われるのを防止できます。",
	"settingsPersistence_description2": "環境によっては有効化できない場合があります。",
	"enable": "有効にするで",
	"skip": "スキップ",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "このデバイスで設定の自動バックアップは有効になってへんで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"settings": "Iɣewwaṛen",
	"profile": "Amaɣnu",
	"privacy": "Tabaḍnit",
	"notifications": "Ilɣuyen",
	"email": "Imayl",
	"security": "Taɣellist",
	"preferences": "Preferences",
	"theme": "Themes",
	"emojiPalette": "Emoji palette",
	"sounds": "Sounds",
	"plugins": "Izegrar",
	"drive": "Drive",
	"muteAndBlock": "Mutes and Blocks",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Wiyyaḍ",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Clear cache",
	"logout": "Sign Out",
	"logoutConfirm": "Are you sure you want to log out?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Email address not set.",
	"configure": "Configure",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Enable",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"settings": "ಸಿದ್ಧತೆಗಳು",
	"profile": "ಪ್ರೊಫೈಲು",
	"privacy": "Privacy",
	"notifications": "ಅಧಿಸೂಚನೆಗಳು",
	"email": "Email",
	"security": "Security",
	"preferences": "Preferences",
	"theme": "Themes",
	"emojiPalette": "Emoji palette",
	"sounds": "Sounds",
	"plugins": "Plugins",
	"drive": "Drive",
	"muteAndBlock": "Mutes and Blocks",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Other",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Clear cache",
	"logout": "ಆಚೆಗೆ",
	"logoutConfirm": "Are you sure you want to log out?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Email address not set.",
	"configure": "Configure",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Enable",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"settings": "설정",
	"profile": "프로필",
	"privacy": "프라이버시",
	"notifications": "알림",
	"email": "이메일",
	"security": "보안",
	"preferences": "환경설정",
	"theme": "테마",
	"emojiPalette": "이모지 팔레트",
	"sounds": "소리",
	"plugins": "플러그인",
	"drive": "드라이브",
	"muteAndBlock": "뮤트 및 차단",
	"serviceConnection": "서비스 연동",
	"accountData": "계정 데이터",
	"other": "기타",
	"preferencesProfile": "설정 프로파일",
	"clearCache": "캐시 비우기",
	"logout": "로그아웃",
	"logoutConfirm": "로그아웃 하시겠습니까?",
	"logoutWillClearClientData": "로그아웃하면 클라이언트의 설정 데이터가 브라우저에서 지워지게 됩니다. 다시 로그인할 때 설정 데이터를 복원할 수 있도록 하려면 설정 자동 백업을 활성화하세요.",
	"emailNotConfiguredWarning": "메일 주소가 설정되어 있지 않습니다.",
	"configure": "설정하기",
	"settingsPersistence_description1": "설정 영구화를 활성화하면 설정 정보를 잃어버리는 것을 방지할 수 있습니다.",
	"settingsPersistence_description2": "환경에 따라 활성화되지 않을 수 있습니다.",
	"enable": "사용",
	"skip": "건너뛰기",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "이 장치에서 설정 자동 백업이 활성화되어 있지 않습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"settings": "Instellingen",
	"profile": "Profiel",
	"privacy": "Privacy",
	"notifications": "Meldingen",
	"email": "Email",
	"security": "Beveiliging",
	"preferences": "Preferences",
	"theme": "Thema's",
	"emojiPalette": "Emoji palette",
	"sounds": "Geluiden",
	"plugins": "Plugins",
	"drive": "Schijf",
	"muteAndBlock": "Gedempt en geblokkeerd",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Ander",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Cache opschonen",
	"logout": "Afmelden",
	"logoutConfirm": "Are you sure you want to log out?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "E-mailadres niet ingesteld.",
	"configure": "Configureer",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Inschakelen",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"settings": "Innstillinger",
	"profile": "Profil",
	"privacy": "Personvern",
	"notifications": "Varsler",
	"email": "E-post",
	"security": "Sikkerhet",
	"preferences": "Preferences",
	"theme": "Temaer",
	"emojiPalette": "Emoji palette",
	"sounds": "Sounds",
	"plugins": "Plugins",
	"drive": "Drive",
	"muteAndBlock": "Skjul og blokker",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Andre",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Clear cache",
	"logout": "Logg ut",
	"logoutConfirm": "Vil du logge ut?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Email address not set.",
	"configure": "Configure",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Enable",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"settings": "Ustawienia",
	"profile": "Profil",
	"privacy": "Prywatność",
	"notifications": "Powiadomienia",
	"email": "Adres e-mail",
	"security": "Bezpieczeństwo",
	"preferences": "Preferences",
	"theme": "Motywy",
	"emojiPalette": "Emoji palette",
	"sounds": "Dźwięk",
	"plugins": "Wtyczki",
	"drive": "Dysk",
	"muteAndBlock": "Wycisz / Zablokuj",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Inne",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Wyczyść pamięć podręczną",
	"logout": "Wyloguj się",
	"logoutConfirm": "Czy na pewno chcesz się wylogować?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Nie podano adresu e-mail",
	"configure": "Skonfiguruj",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Włącz",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"settings": "Configurações",
	"profile": "Perfil",
	"privacy": "Privacidade",
	"notifications": "Notificações",
	"email": "E-mail",
	"security": "Segurança",
	"preferences": "Preferências",
	"theme": "Tema",
	"emojiPalette": "Paleta de emojis",
	"sounds": "Sons",
	"plugins": "Plugins",
	"drive": "Drive",
	"muteAndBlock": "Silenciar e bloquear",
	"serviceConnection": "Integração de serviço",
	"accountData": "Dados da conta",
	"other": "Outros",
	"preferencesProfile": "Perfil de preferências",
	"clearCache": "Limpar o cache",
	"logout": "Sair",
	"logoutConfirm": "Gostaria de encerrar a sessão?",
	"logoutWillClearClientData": "Sair irá remover as configurações do cliente do navegador. Para redefinir as configurações ao entrar, você deve habilitar o backup automático de configurações.",
	"emailNotConfiguredWarning": "Endereço de e-mail não configurado. ",
	"configure": "Configurar",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Habilitar",
	"skip": "Pular",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Backup automático de configurações não está habilitado no dispositivo."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"settings": "Настройки",
	"profile": "Профиль",
	"privacy": "Конфиденциальность",
	"notifications": "Уведомления",
	"email": "Электронная почта",
	"security": "Безопасность",
	"preferences": "Основное",
	"theme": "Тема",
	"emojiPalette": "Палитра эмодзи",
	"sounds": "Звуки",
	"plugins": "Расширения",
	"drive": "Диск",
	"muteAndBlock": "Скрытие и блокировка",
	"serviceConnection": "Интеграция сервисов",
	"accountData": "Данные аккаунта",
	"other": "Другие",
	"preferencesProfile": "Настройки профиля",
	"clearCache": "Очистить кэш",
	"logout": "Выйти",
	"logoutConfirm": "Вы хотите выйти из аккаунта?",
	"logoutWillClearClientData": "Выход из аккаунта удалит настройки клиента из этого браузера. Включите автоматическое резервное копирование, чтобы иметь возможность восстановить настройки при повторном входе.",
	"emailNotConfiguredWarning": "Адрес почты пустует",
	"configure": "Настроить",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Включить",
	"skip": "Пропустить",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"settings": "Nastavenia",
	"profile": "Profil",
	"privacy": "Súkromie",
	"notifications": "Oznámenia",
	"email": "Email",
	"security": "Zabezpečenie",
	"preferences": "Preferences",
	"theme": "Téma",
	"emojiPalette": "Emoji palette",
	"sounds": "Zvuky",
	"plugins": "Pluginy",
	"drive": "Disk",
	"muteAndBlock": "Umlčania a blokácie",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Ostatní",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Vyprázdniť cache",
	"logout": "Odhlásiť",
	"logoutConfirm": "Naozaj sa chcete odhlásiť?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Nie je nastavená emailová adresa.",
	"configure": "Konfigurovať",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Povoliť",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"settings": "การตั้งค่า",
	"profile": "โปรไฟล์",
	"privacy": "ความเป็นส่วนตัว",
	"notifications": "เเจ้งเตือน",
	"email": "อีเมล",
	"security": "ความปลอดภัย",
	"preferences": "การตั้งค่าสภาพแวดล้อม",
	"theme": "ธีม",
	"emojiPalette": "จานสีเอโมจิ",
	"sounds": "เสียง",
	"plugins": "ปลั๊กอิน",
	"drive": "ไดรฟ์",
	"muteAndBlock": "ปิดเสียงและบล็อก",
	"serviceConnection": "การเชื่อมต่อกับบริการ",
	"accountData": "ข้อมูลบัญชี",
	"other": "อื่น ๆ",
	"preferencesProfile": "โปรไฟล์ของการตั้งค่า",
	"clearCache": "ล้างแคช",
	"logout": "ออกจากระบบ",
	"logoutConfirm": "ต้องการออกจากระบบใช่ไหม?",
	"logoutWillClearClientData": "เมื่อออกจากระบบ ข้อมูลการตั้งค่าของไคลเอนต์จะถูกลบออกจากเบราว์เซอร์ เพื่อให้สามารถกู้คืนข้อมูลการตั้งค่าได้เมื่อกลับมาเข้าสู่ระบบอีกครั้ง โปรดเปิดใช้งานการสำรองข้อมูลการตั้งค่าอัตโนมัติ",
	"emailNotConfiguredWarning": "ยังไม่ได้ตั้งค่าที่อยู่อีเมล",
	"configure": "ตั้งค่า",
	"settingsPersistence_description1": "เมื่อเปิดใช้งานการคงสภาพการตั้งค่า จะช่วยป้องกันไม่ให้ข้อมูลการตั้งค่าสูญหายได้",
	"settingsPersistence_description2": "แต่ในบางสภาพแวดล้อม อาจไม่สามารถเปิดใช้งานได้",
	"enable": "เปิดใช้งาน",
	"skip": "ข้าม",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "ยังไม่ได้เปิดใช้งานการสำรองการตั้งค่าแบบอัตโนมัติบนอุปกรณ์นี้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"settings": "Ayarlar",
	"profile": "Profil",
	"privacy": "Gizlilik",
	"notifications": "Bildirimler",
	"email": "E-Posta",
	"security": "Güvenlik",
	"preferences": "Tercihler",
	"theme": "Tema",
	"emojiPalette": "Emoji paleti",
	"sounds": "Sesler",
	"plugins": "Eklentiler",
	"drive": "Drive",
	"muteAndBlock": "Sessize Alma ve Engelleme",
	"serviceConnection": "Hizmet entegrasyonu",
	"accountData": "Hesap verileri",
	"other": "Diğer",
	"preferencesProfile": "Tercihler profili",
	"clearCache": "Önbellek temizle",
	"logout": "Çıkış Yap",
	"logoutConfirm": "Çıkmak istediğinden emin misin?",
	"logoutWillClearClientData": "Oturumu kapatmak, tarayıcıdan istemcinin ayarlarını siler. Tekrar oturum açtığında ayarları geri yükleyebilmek için, ayarlarının otomatik yedeklenmesini etkinleştirmen gerekir.",
	"emailNotConfiguredWarning": "E-posta adresi ayarlanmamış.",
	"configure": "Yeniden Yapılandır",
	"settingsPersistence_description1": "Ayarların kalıcı olarak saklanmasını etkinleştirmek, yapılandırma bilgilerinin kaybolmasını önler.",
	"settingsPersistence_description2": "Ortamınıza bağlı olarak bu özelliği etkinleştirmek mümkün olmayabilir.",
	"enable": "Etkin",
	"skip": "Atla",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Bu cihazda ayarların otomatik yedeklemesi etkinleştirilmemiş."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"settings": "Settings",
	"profile": "profile",
	"privacy": "Privacy",
	"notifications": "Notifications",
	"email": "Email",
	"security": "Security",
	"preferences": "Preferences",
	"theme": "Themes",
	"emojiPalette": "Emoji palette",
	"sounds": "Sounds",
	"plugins": "Plugins",
	"drive": "Drive",
	"muteAndBlock": "Mutes and Blocks",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Other",
	"preferencesProfile": "Preferences profile",
	"clearCache": "Clear cache",
	"logout": "Sign Out",
	"logoutConfirm": "Are you sure you want to log out?",
	"logoutWillClearClientData": "Logging out will erase the settings of the client from the browser. In order to be able to restore the settings upon logging in again, you must enable automatic backup of your settings.",
	"emailNotConfiguredWarning": "Email address not set.",
	"configure": "Configure",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Enable",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"settings": "Налаштування",
	"profile": "Профіль",
	"privacy": "Конфіденційність",
	"notifications": "Сповіщення",
	"email": "E-mail",
	"security": "Безпека",
	"preferences": "Налаштування",
	"theme": "Тема",
	"emojiPalette": "Палітра емодзі",
	"sounds": "Звуки",
	"plugins": "Плагіни",
	"drive": "Диск",
	"muteAndBlock": "Заглушення і блокування",
	"serviceConnection": "Інтеграції",
	"accountData": "Інформація про обліковий запис",
	"other": "Інше",
	"preferencesProfile": "Налаштування профілю",
	"clearCache": "Очистити кеш",
	"logout": "Вийти",
	"logoutConfirm": "Справді вийти?",
	"logoutWillClearClientData": "Вихід з облікового запису видалить налаштування клієнта з браузера. Щоб відновити налаштування після повторного входу, потрібно увімкнути автоматичне резервне копіювання налаштувань.",
	"emailNotConfiguredWarning": "Email адреса не вказана",
	"configure": "Налаштувати",
	"settingsPersistence_description1": "Ввімкнення збереження налаштувань запобігає загублення значень налаштувань.",
	"settingsPersistence_description2": "Це налаштування може бути неможливо увімкнути залежно від умов.",
	"enable": "Увімкнути",
	"skip": "Пропустити",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Автоматичне резервне копіювання налаштувань вимкнуто для цього пристрою."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"settings": "Cài đặt",
	"profile": "Trang cá nhân",
	"privacy": "Riêng tư",
	"notifications": "Thông báo",
	"email": "Email",
	"security": "Bảo mật",
	"preferences": "Thiết lập môi trường",
	"theme": "Chủ đề",
	"emojiPalette": "Emoji palette",
	"sounds": "Âm thanh",
	"plugins": "Plugin",
	"drive": "Ổ đĩa",
	"muteAndBlock": "Ẩn và Chặn",
	"serviceConnection": "Service integration",
	"accountData": "Account data",
	"other": "Khác",
	"preferencesProfile": "Hồ sơ sở thích",
	"clearCache": "Xóa bộ nhớ đệm",
	"logout": "Đăng xuất",
	"logoutConfirm": "Bạn có chắc muốn đăng xuất?",
	"logoutWillClearClientData": "Đăng xuất sẽ xoá các thiết lập của bạn khỏi trình duyệt. Để có thể khôi phục thiết lập khi đăng nhập lại, bạn phải bật tự động sao lưu cài đặt.",
	"emailNotConfiguredWarning": "Chưa đặt địa chỉ email.",
	"configure": "Thiết lập",
	"settingsPersistence_description1": "Enabling setting persistence prevents configuration information from being lost.",
	"settingsPersistence_description2": "It may not be possible to enable this depending on the environment.",
	"enable": "Bật",
	"skip": "Skip",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "Settings auto backup is not enabled on this device."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"settings": "设置",
	"profile": "个人资料",
	"privacy": "隐私",
	"notifications": "通知",
	"email": "邮箱",
	"security": "安全",
	"preferences": "偏好设置",
	"theme": "主题",
	"emojiPalette": "表情符号选择器",
	"sounds": "提示音",
	"plugins": "插件",
	"drive": "网盘",
	"muteAndBlock": "隐藏和屏蔽",
	"serviceConnection": "连接服务",
	"accountData": "账户数据",
	"other": "其他",
	"preferencesProfile": "设置的配置文件",
	"clearCache": "清除缓存",
	"logout": "登出",
	"logoutConfirm": "是否确认登出？",
	"logoutWillClearClientData": "登出时将会从浏览器中删除客户端的设置信息。如果想要在再次登入时恢复设置信息，请在设置里打开自动备份。",
	"emailNotConfiguredWarning": "尚未设置电子邮件地址。",
	"configure": "设置",
	"settingsPersistence_description1": "启用设置持久化可防止设置信息丢失。",
	"settingsPersistence_description2": "根据环境不同，有可能无法开启。",
	"enable": "启用",
	"skip": "跳过",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "此设备未开启自动备份"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"settings": "設定",
	"profile": "個人檔案",
	"privacy": "隱私",
	"notifications": "通知",
	"email": "電子郵件",
	"security": "安全性",
	"preferences": "環境設定",
	"theme": "佈景主題",
	"emojiPalette": "表情符號調色盤",
	"sounds": "音效",
	"plugins": "外掛",
	"drive": "雲端硬碟",
	"muteAndBlock": "靜音和封鎖",
	"serviceConnection": "服務整合",
	"accountData": "帳戶資料",
	"other": "其他",
	"preferencesProfile": "設定檔案",
	"clearCache": "清除快取資料",
	"logout": "登出",
	"logoutConfirm": "確定要登出嗎？",
	"logoutWillClearClientData": "當您登出時，客戶端的設定資訊將從瀏覽器中清除。為了能夠在重新登入時恢復您的設定資訊，請啟用設定內的自動備份選項。",
	"emailNotConfiguredWarning": "沒有設定電子郵件地址",
	"configure": "設定",
	"settingsPersistence_description1": "啟用「設定的持久化」後，可以防止設定資訊遺失。",
	"settingsPersistence_description2": "依環境不同，可能無法啟用。",
	"enable": "啟用",
	"skip": "跳過",
	"autoPreferencesBackupIsNotEnabledForThisDevice": "此裝置未啟用自動備份設定。"
}
</locale>
