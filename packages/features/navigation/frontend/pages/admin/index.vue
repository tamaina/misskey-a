<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="el" class="hiyeyicy" :class="{ wide: !narrow }">
	<div v-if="!narrow || currentPage?.route.name == null" class="nav">
		<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px;">
			<div class="lxpfedzu _gaps">
				<div class="banner">
					<img :src="instance.iconUrl || '/favicon.ico'" alt="" class="icon"/>
				</div>

				<div class="_gaps_s">
					<MkInfo v-if="thereIsUnresolvedAbuseReport" warn>{{ $locale.sfc.thereIsUnresolvedAbuseReportWarning }} <MkA to="/admin/abuses" class="_link">{{ $locale.sfc.check }}</MkA></MkInfo>
					<MkInfo v-if="noMaintainerInformation" warn>{{ $locale.sfc.noMaintainerInformationWarning }} <MkA to="/admin/settings" class="_link">{{ $locale.sfc.configure }}</MkA></MkInfo>
					<MkInfo v-if="noInquiryUrl" warn>{{ $locale.sfc.noInquiryUrlWarning }} <MkA to="/admin/settings" class="_link">{{ $locale.sfc.configure }}</MkA></MkInfo>
					<MkInfo v-if="noBotProtection" warn>{{ $locale.sfc.noBotProtectionWarning }} <MkA to="/admin/security" class="_link">{{ $locale.sfc.configure }}</MkA></MkInfo>
					<MkInfo v-if="noEmailServer" warn>{{ $locale.sfc.noEmailServerWarning }} <MkA to="/admin/email-settings" class="_link">{{ $locale.sfc.configure }}</MkA></MkInfo>
				</div>

				<MkSuperMenu :def="menuDef" :searchIndex="searchIndex" :grid="narrow"></MkSuperMenu>
			</div>
		</div>
	</div>
	<div v-if="!(narrow && currentPage?.route.name == null)" class="main _pageContainer" style="height: 100%;">
		<NestedRouterView/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onActivated, onMounted, onUnmounted, provide, watch, ref, computed } from 'vue';
import type { SuperMenuDef } from '@features/navigation/frontend/components/MkSuperMenu.vue';
import type { PageMetadata } from '@features/navigation/frontend/page.js';
import MkSuperMenu from '@features/navigation/frontend/components/MkSuperMenu.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { instance } from '@features/instance/frontend/instance.js';
import { lookup } from '@features/discovery/frontend/utility/lookup.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { lookupUser, lookupUserByEmail, lookupFile } from '@features/moderation/frontend/utility/admin-lookup.js';
import { definePage, provideMetadataReceiver, provideReactiveMetadata } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { genSearchIndexes } from '@features/discovery/frontend/utility/inapp-search.js';

const searchIndex = await import('search-index:admin').then(({ searchIndexes }) => genSearchIndexes(searchIndexes));

const isEmpty = (x: string | null) => x == null || x === '';

const router = useRouter();

const indexInfo = {
	title: $locale.value.sfc.controlPanel,
	icon: 'ti ti-settings',
	hideHeader: true,
};

provide('shouldOmitHeaderTitle', false);

const INFO = ref<PageMetadata>(indexInfo);
const childInfo = ref<null | PageMetadata>(null);
const narrow = ref(false);
const view = ref(null);
const el = ref<HTMLDivElement | null>(null);
const pageProps = ref({});
const noMaintainerInformation = computed(() => isEmpty(instance.maintainerName) || isEmpty(instance.maintainerEmail));
const noBotProtection = computed(() => !instance.disableRegistration && !instance.enableHcaptcha && !instance.enableRecaptcha && !instance.enableTurnstile && !instance.enableMcaptcha);
const noEmailServer = computed(() => !instance.enableEmail);
const noInquiryUrl = computed(() => isEmpty(instance.inquiryUrl));
const thereIsUnresolvedAbuseReport = ref(false);
const currentPage = computed(() => router.currentRef.value.child);

misskeyApi('admin/abuse-user-reports', {
	state: 'unresolved',
	limit: 1,
}).then(reports => {
	if (reports.length > 0) thereIsUnresolvedAbuseReport.value = true;
});

const NARROW_THRESHOLD = 600;
const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow.value = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = computed<SuperMenuDef[]>(() => [{
	title: $locale.value.sfc.quickAction,
	items: [{
		type: 'button',
		icon: 'ti ti-search',
		text: $locale.value.sfc.lookup,
		action: adminLookup,
	}, ...(instance.disableRegistration ? [{
		type: 'button' as const,
		icon: 'ti ti-user-plus',
		text: $locale.value.sfc.createInviteCode,
		action: invite,
	}] : [])],
}, {
	title: $locale.value.sfc.administration,
	items: [{
		icon: 'ti ti-dashboard',
		text: $locale.value.sfc.dashboard,
		to: '/admin/overview',
		active: currentPage.value?.route.name === 'overview',
	}, {
		icon: 'ti ti-users',
		text: $locale.value.sfc.users,
		to: '/admin/users',
		active: currentPage.value?.route.name === 'users',
	}, {
		icon: 'ti ti-user-plus',
		text: $locale.value.sfc.invite,
		to: '/admin/invites',
		active: currentPage.value?.route.name === 'invites',
	}, {
		icon: 'ti ti-badges',
		text: $locale.value.sfc.roles,
		to: '/admin/roles',
		active: currentPage.value?.route.name === 'roles',
	}, {
		icon: 'ti ti-icons',
		text: $locale.value.sfc.customEmojis,
		to: '/admin/emojis',
		active: currentPage.value?.route.name === 'emojis',
	}, {
		icon: 'ti ti-icons',
		text: $locale.value.sfc.customEmojis + '(beta)',
		to: '/admin/emojis2',
		active: currentPage.value?.route.name === 'emojis2',
	}, {
		icon: 'ti ti-sparkles',
		text: $locale.value.sfc.avatarDecorations,
		to: '/admin/avatar-decorations',
		active: currentPage.value?.route.name === 'avatarDecorations',
	}, {
		icon: 'ti ti-whirl',
		text: $locale.value.sfc.federation,
		to: '/admin/federation',
		active: currentPage.value?.route.name === 'federation',
	}, {
		icon: 'ti ti-clock-play',
		text: $locale.value.sfc.federationJobs,
		to: '/admin/federation-job-queue',
		active: currentPage.value?.route.name === 'federationJobQueue',
	}, {
		icon: 'ti ti-clock-play',
		text: $locale.value.sfc.jobQueue,
		to: '/admin/job-queue',
		active: currentPage.value?.route.name === 'jobQueue',
	}, {
		icon: 'ti ti-cloud',
		text: $locale.value.sfc.files,
		to: '/admin/files',
		active: currentPage.value?.route.name === 'files',
	}, {
		icon: 'ti ti-speakerphone',
		text: $locale.value.sfc.announcements,
		to: '/admin/announcements',
		active: currentPage.value?.route.name === 'announcements',
	}, {
		icon: 'ti ti-ad',
		text: $locale.value.sfc.ads,
		to: '/admin/ads',
		active: currentPage.value?.route.name === 'ads',
	}, {
		icon: 'ti ti-exclamation-circle',
		text: $locale.value.sfc.abuseReports,
		to: '/admin/abuses',
		active: currentPage.value?.route.name === 'abuses',
	}, {
		icon: 'ti ti-list-search',
		text: $locale.value.sfc.moderationLogs,
		to: '/admin/modlog',
		active: currentPage.value?.route.name === 'modlog',
	}],
}, {
	title: $locale.value.sfc.settings,
	items: [{
		icon: 'ti ti-settings',
		text: $locale.value.sfc.general,
		to: '/admin/settings',
		active: currentPage.value?.route.name === 'settings',
	}, {
		icon: 'ti ti-paint',
		text: $locale.value.sfc.branding,
		to: '/admin/branding',
		active: currentPage.value?.route.name === 'branding',
	}, {
		icon: 'ti ti-shield',
		text: $locale.value.sfc.moderation,
		to: '/admin/moderation',
		active: currentPage.value?.route.name === 'moderation',
	}, {
		icon: 'ti ti-mail',
		text: $locale.value.sfc.emailServer,
		to: '/admin/email-settings',
		active: currentPage.value?.route.name === 'email-settings',
	}, {
		icon: 'ti ti-cloud',
		text: $locale.value.sfc.objectStorage,
		to: '/admin/object-storage',
		active: currentPage.value?.route.name === 'object-storage',
	}, {
		icon: 'ti ti-lock',
		text: $locale.value.sfc.security,
		to: '/admin/security',
		active: currentPage.value?.route.name === 'security',
	}, {
		icon: 'ti ti-planet',
		text: $locale.value.sfc.relays,
		to: '/admin/relays',
		active: currentPage.value?.route.name === 'relays',
	}, {
		icon: 'ti ti-link',
		text: $locale.value.sfc.externalServices,
		to: '/admin/external-services',
		active: currentPage.value?.route.name === 'external-services',
	}, {
		icon: 'ti ti-webhook',
		text: 'Webhook',
		to: '/admin/system-webhook',
		active: currentPage.value?.route.name === 'system-webhook',
	}, {
		icon: 'ti ti-bolt',
		text: $locale.value.sfc.performance,
		to: '/admin/performance',
		active: currentPage.value?.route.name === 'performance',
	}],
}, {
	title: $locale.value.sfc.info,
	items: [{
		icon: 'ti ti-database',
		text: $locale.value.sfc.database,
		to: '/admin/database',
		active: currentPage.value?.route.name === 'database',
	}],
}]);

onMounted(() => {
	if (el.value != null) {
		ro.observe(el.value);
		narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;
	}
	if (currentPage.value?.route.name == null && !narrow.value) {
		router.replace('/admin/overview');
	}
});

onActivated(() => {
	if (el.value != null) {
		narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;
	}
	if (currentPage.value?.route.name == null && !narrow.value) {
		router.replace('/admin/overview');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (to.route.path === '/admin' && to.child?.route.name == null && !narrow.value) {
		router.replace('/admin/overview');
	}
});

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

function invite() {
	misskeyApi('admin/invite/create').then(x => {
		os.alert({
			type: 'info',
			text: x[0].code,
		});
	}).catch(err => {
		os.alert({
			type: 'error',
			text: err,
		});
	});
}

function adminLookup(ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.user,
		icon: 'ti ti-user',
		action: () => {
			lookupUser();
		},
	}, {
		text: `${$locale.value.sfc.user} (${$locale.value.sfc.email})`,
		icon: 'ti ti-user',
		action: () => {
			lookupUserByEmail();
		},
	}, {
		text: $locale.value.sfc.file,
		icon: 'ti ti-cloud',
		action: () => {
			lookupFile();
		},
	}, {
		text: $locale.value.sfc.lookup,
		icon: 'ti ti-world-search',
		action: () => {
			lookup();
		},
	}], ev.currentTarget ?? ev.target);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => INFO.value);
</script>

<style lang="scss" scoped>
.hiyeyicy {
	height: 100%;

	&.wide {
		display: flex;
		margin: 0 auto;

		> .nav {
			position: sticky;
			top: 0;
			width: 32%;
			max-width: 280px;
			box-sizing: border-box;
			border-right: solid 0.5px var(--MI_THEME-divider);
			overflow: auto;
			height: 100cqh;
		}

		> .main {
			flex: 1;
			min-width: 0;
		}
	}

	> .nav {
		.lxpfedzu {
			> .banner {
				margin: 16px;

				> .icon {
					display: block;
					margin: auto;
					height: 42px;
					border-radius: 8px;
				}
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"controlPanel": "لوحة التحكم",
	"quickAction": "الإجراءات السّريعة",
	"lookup": "البحث",
	"createInviteCode": "ولِّد دعوة",
	"administration": "إدارة ",
	"dashboard": "لوحة التحكم",
	"users": "المستخدمون",
	"invite": "دعوة",
	"roles": "الأدوار",
	"customEmojis": "إيموجي مخصص",
	"avatarDecorations": "Avatar decorations",
	"federation": "الفديرالية",
	"federationJobs": "Federation Jobs",
	"jobQueue": "قائمة الانتظار",
	"files": "الملفات",
	"announcements": "الإعلانات",
	"ads": "الإعلانات",
	"abuseReports": "البلاغات",
	"moderationLogs": "Moderation logs",
	"settings": "الاعدادات",
	"general": "الرئيسية",
	"branding": "Branding",
	"moderation": "الإشراف",
	"emailServer": "خادم البريد الإلكتروني",
	"objectStorage": "Object Storage",
	"security": "الأمان",
	"relays": "المُرَحلات",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "عن",
	"database": "قاعدة البيانات",
	"user": "المستخدمون",
	"email": "البريد الإلكتروني ",
	"file": "الملفات",
	"thereIsUnresolvedAbuseReportWarning": "توجد بلاغات غير معالجة.",
	"check": "التحقق",
	"noMaintainerInformationWarning": "لم تُضبط معلومات المدير",
	"configure": "اضبط",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "لم تضبط الحماية من الحسابات الآلية",
	"noEmailServerWarning": "خادم البريد غير مضبوط."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"controlPanel": "Tauler de control",
	"quickAction": "Accions ràpides",
	"lookup": "Cerca",
	"createInviteCode": "Crear codi d'invitació ",
	"administration": "Administració",
	"dashboard": "Tauler de control",
	"users": "Usuaris",
	"invite": "Convida",
	"roles": "Rols",
	"customEmojis": "Emojis personalitzats",
	"avatarDecorations": "Decoracions dels avatars",
	"federation": "Federació",
	"federationJobs": "Treballs de federació",
	"jobQueue": "Cua de feines",
	"files": "Fitxers",
	"announcements": "Avisos",
	"ads": "Publicitat ",
	"abuseReports": "Denúncies ",
	"moderationLogs": "Registre de moderació ",
	"settings": "Preferències",
	"general": "General",
	"branding": "Marca",
	"moderation": "Moderació",
	"emailServer": "Servidor de correu electrònic ",
	"objectStorage": "Emmagatzematge d'objectes\n",
	"security": "Seguretat",
	"relays": "Relés",
	"externalServices": "Serveis externs",
	"performance": "Rendiment",
	"info": "Informació",
	"database": "Bases de dades",
	"user": "Usuaris",
	"email": "Correu electrònic",
	"file": "Fitxers",
	"thereIsUnresolvedAbuseReportWarning": "Hi ha informes sense solucionar.",
	"check": "Verificar",
	"noMaintainerInformationWarning": "La informació de l'administrador no s'ha configurat",
	"configure": "Configurar",
	"noInquiryUrlWarning": "No s'ha desat l'URL de consulta.",
	"noBotProtectionWarning": "La protecció contra bots no s'ha configurat.",
	"noEmailServerWarning": "Correu electrònic del servidor sense configurar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"controlPanel": "Ovládací panel",
	"quickAction": "Rychlé akce",
	"lookup": "Vyhledat",
	"createInviteCode": "Vygenerovat pozvánku",
	"administration": "Administrace",
	"dashboard": "Přehled",
	"users": "Uživatelé",
	"invite": "Pozvat",
	"roles": "Role",
	"customEmojis": "Vlastní emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federace",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Fronta úloh",
	"files": "Soubor(ů)",
	"announcements": "Oznámení",
	"ads": "Reklamy",
	"abuseReports": "Nahlášení",
	"moderationLogs": "Moderation logs",
	"settings": "Nastavení",
	"general": "Obecně",
	"branding": "Značka",
	"moderation": "Moderování",
	"emailServer": "Mailový server",
	"objectStorage": "Úložiště objektů",
	"security": "Zabezpečení",
	"relays": "Relay",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "Informace",
	"database": "Databáze",
	"user": "Uživatelé",
	"email": "Email",
	"file": "Soubor(ů)",
	"thereIsUnresolvedAbuseReportWarning": "Jsou k dispozici nevyřešené nahlášení zneužití",
	"check": "Zkontrolovat",
	"noMaintainerInformationWarning": "Informace o správci nejsou nastavené",
	"configure": "Nastavit",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "Ochrana proti botům není nastavena",
	"noEmailServerWarning": "Emailový server není nastavený"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"controlPanel": "Control Panel",
	"quickAction": "Quick actions",
	"lookup": "Lookup",
	"createInviteCode": "Generate invite",
	"administration": "Management",
	"dashboard": "Dashboard",
	"users": "Users",
	"invite": "Invite",
	"roles": "Roles",
	"customEmojis": "Custom Emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federation",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Job Queue",
	"files": "Files",
	"announcements": "Announcements",
	"ads": "Advertisements",
	"abuseReports": "Reports",
	"moderationLogs": "Moderation logs",
	"settings": "Settings",
	"general": "General",
	"branding": "Branding",
	"moderation": "Moderation",
	"emailServer": "Email server",
	"objectStorage": "Object Storage",
	"security": "Security",
	"relays": "Relays",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "About",
	"database": "Database",
	"user": "User",
	"email": "Email",
	"file": "File",
	"thereIsUnresolvedAbuseReportWarning": "There are unsolved reports.",
	"check": "Check",
	"noMaintainerInformationWarning": "Maintainer information is not configured.",
	"configure": "Configure",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "Bot protection is not configured.",
	"noEmailServerWarning": "Email server not configured."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"controlPanel": "Systemsteuerung",
	"quickAction": "Schnellaktionen",
	"lookup": "Anfragen",
	"createInviteCode": "Einladung erstellen",
	"administration": "Verwaltung",
	"dashboard": "Dashboard",
	"users": "Benutzer",
	"invite": "Einladen",
	"roles": "Rollen",
	"customEmojis": "Benutzerdefinierte Emojis",
	"avatarDecorations": "Profilbilddekoration",
	"federation": "Föderation",
	"federationJobs": "Föderation Jobs",
	"jobQueue": "Job-Warteschlange",
	"files": "Dateien",
	"announcements": "Ankündigungen",
	"ads": "Werbung",
	"abuseReports": "Meldungen",
	"moderationLogs": "Moderationsprotokolle",
	"settings": "Einstellungen",
	"general": "Allgemein",
	"branding": "Branding",
	"moderation": "Moderation",
	"emailServer": "Email-Server",
	"objectStorage": "Object Storage",
	"security": "Sicherheit",
	"relays": "Relays",
	"externalServices": "Externe Dienste",
	"performance": "Leistung",
	"info": "Über",
	"database": "Datenbank",
	"user": "Benutzer",
	"email": "Email",
	"file": "Datei",
	"thereIsUnresolvedAbuseReportWarning": "Es liegen ungelöste Meldungen vor.",
	"check": "Check",
	"noMaintainerInformationWarning": "Betreiberinformationen sind nicht konfiguriert.",
	"configure": "Konfigurieren",
	"noInquiryUrlWarning": "Keine gültige Kontakt-URL.",
	"noBotProtectionWarning": "Schutz vor Bots ist nicht konfiguriert.",
	"noEmailServerWarning": "Es ist kein Email-Server konfiguriert."
}
</locale>

<locale locale="en-US" lang="json">
{
	"controlPanel": "Control Panel",
	"quickAction": "Quick actions",
	"lookup": "Lookup",
	"createInviteCode": "Generate invite",
	"administration": "Management",
	"dashboard": "Dashboard",
	"users": "Users",
	"invite": "Invite",
	"roles": "Roles",
	"customEmojis": "Custom Emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federation",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Job Queue",
	"files": "Files",
	"announcements": "Announcements",
	"ads": "Advertisements",
	"abuseReports": "Reports",
	"moderationLogs": "Moderation logs",
	"settings": "Settings",
	"general": "General",
	"branding": "Branding",
	"moderation": "Moderation",
	"emailServer": "Email server",
	"objectStorage": "Object Storage",
	"security": "Security",
	"relays": "Relays",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "About",
	"database": "Database",
	"user": "User",
	"email": "Email",
	"file": "File",
	"thereIsUnresolvedAbuseReportWarning": "There are unsolved reports.",
	"check": "Check",
	"noMaintainerInformationWarning": "Maintainer information is not configured.",
	"configure": "Configure",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "Bot protection is not configured.",
	"noEmailServerWarning": "Email server not configured."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"controlPanel": "Panel de control",
	"quickAction": "Acciones rápidas",
	"lookup": "Búsqueda",
	"createInviteCode": "Generar invitación",
	"administration": "Administrar",
	"dashboard": "Panel de control",
	"users": "Usuarios",
	"invite": "Invitar",
	"roles": "Roles",
	"customEmojis": "Emojis personalizados",
	"avatarDecorations": "Decoraciones de avatar",
	"federation": "Federación",
	"federationJobs": "Trabajos de Federación",
	"jobQueue": "Cola de trabajos",
	"files": "Archivos",
	"announcements": "Avisos",
	"ads": "Anuncios",
	"abuseReports": "Reportes",
	"moderationLogs": "Log de moderación",
	"settings": "Configuración",
	"general": "General",
	"branding": "Marca",
	"moderation": "Moderación",
	"emailServer": "Servidor de correo",
	"objectStorage": "Almacenamiento de objetos",
	"security": "Seguridad",
	"relays": "Relés",
	"externalServices": "Servicios Externos",
	"performance": "Rendimiento",
	"info": "Información",
	"database": "Base de datos",
	"user": "Usuarios",
	"email": "Correo",
	"file": "Archivos",
	"thereIsUnresolvedAbuseReportWarning": "Hay reportes sin resolver",
	"check": "Verificar",
	"noMaintainerInformationWarning": "No se ha establecido la información del administrador",
	"configure": "Configurar",
	"noInquiryUrlWarning": "No se ha guardado la URL de consulta.",
	"noBotProtectionWarning": "La protección contra los bots no está configurada",
	"noEmailServerWarning": "No se ha configurado un servidor de correo electrónico."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"controlPanel": "Panneau de configuration",
	"quickAction": "Actions rapides",
	"lookup": "Recherche",
	"createInviteCode": "Créer un code d'invitation",
	"administration": "Gestion",
	"dashboard": "Tableau de bord",
	"users": "Utilisateur·rice·s",
	"invite": "Inviter",
	"roles": "Rôles",
	"customEmojis": "Émojis personnalisés",
	"avatarDecorations": "Décorations d'avatar",
	"federation": "Fédération",
	"federationJobs": "Federation Jobs",
	"jobQueue": "File d’attente",
	"files": "Fichiers",
	"announcements": "Annonces",
	"ads": "Publicité",
	"abuseReports": "Signalements",
	"moderationLogs": "Journal de modération",
	"settings": "Paramètres",
	"general": "Général",
	"branding": "Image de marque",
	"moderation": "Modérations",
	"emailServer": "Serveur de messagerie",
	"objectStorage": "Stockage d'objets",
	"security": "Sécurité",
	"relays": "Relais",
	"externalServices": "Services externes",
	"performance": "Performance",
	"info": "Informations",
	"database": "Base de données",
	"user": "Utilisateur·rice·s",
	"email": "E-mail ",
	"file": "Fichier",
	"thereIsUnresolvedAbuseReportWarning": "Il n’y a aucun rapport non résolu.",
	"check": "Vérifier",
	"noMaintainerInformationWarning": "Informations administrateur non configurées.",
	"configure": "Configurer",
	"noInquiryUrlWarning": "L'URL demandé n'est pas définie",
	"noBotProtectionWarning": "La protection contre les bots n'est pas configurée.",
	"noEmailServerWarning": "Serveur de courrier non configuré."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"controlPanel": "Panel kendali",
	"quickAction": "Aksi cepat",
	"lookup": "Cari",
	"createInviteCode": "Buat kode undangan",
	"administration": "Manajemen",
	"dashboard": "Dasbor",
	"users": "Pengguna",
	"invite": "Undang",
	"roles": "Peran",
	"customEmojis": "Emoji kustom",
	"avatarDecorations": "Dekorasi avatar",
	"federation": "Federasi",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Antrian kerja",
	"files": "Berkas",
	"announcements": "Pengumuman",
	"ads": "Iklan",
	"abuseReports": "Laporkan",
	"moderationLogs": "Log moderasi",
	"settings": "Pengaturan",
	"general": "Umum",
	"branding": "Merek",
	"moderation": "Moderasi",
	"emailServer": "Peladen surel",
	"objectStorage": "Object Storage",
	"security": "Keamanan",
	"relays": "Relay",
	"externalServices": "Layanan eksternal",
	"performance": "Kinerja",
	"info": "Informasi",
	"database": "Basis data",
	"user": "Pengguna",
	"email": "Surel",
	"file": "Berkas",
	"thereIsUnresolvedAbuseReportWarning": "Ada laporan yang belum diselesaikan.",
	"check": "Cek",
	"noMaintainerInformationWarning": "Informasi pengelola belum disetel.",
	"configure": "Setel",
	"noInquiryUrlWarning": "URL kontak belum diatur",
	"noBotProtectionWarning": "Proteksi bot belum disetel.",
	"noEmailServerWarning": "Mail Server tidak disetel."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"controlPanel": "Pannello di controllo",
	"quickAction": "Azioni rapide",
	"lookup": "Ricerca remota",
	"createInviteCode": "Genera codice di invito",
	"administration": "Gestione",
	"dashboard": "Pannello di controllo",
	"users": "Profili",
	"invite": "Invita",
	"roles": "Ruoli",
	"customEmojis": "Emoji personalizzate",
	"avatarDecorations": "Decorazioni foto profilo",
	"federation": "Federazione",
	"federationJobs": "Coda di federazione",
	"jobQueue": "Coda di lavoro",
	"files": "Allegati",
	"announcements": "Annunci",
	"ads": "Banner",
	"abuseReports": "Segnalazioni",
	"moderationLogs": "Cronologia di moderazione",
	"settings": "Impostazioni",
	"general": "Generali",
	"branding": "Branding",
	"moderation": "Moderazione",
	"emailServer": "Server email",
	"objectStorage": "Storage S3",
	"security": "Sicurezza",
	"relays": "Ripetitori",
	"externalServices": "Servizi esterni",
	"performance": "Prestazioni",
	"info": "Informazioni",
	"database": "Base dati",
	"user": "Profilo",
	"email": "Email",
	"file": "Allegati",
	"thereIsUnresolvedAbuseReportWarning": "Ci sono report non evasi.",
	"check": "Verifica",
	"noMaintainerInformationWarning": "Mancano le informazioni sull'amministratore.",
	"configure": "Imposta",
	"noInquiryUrlWarning": "Non è stata impostata la URL di contatto",
	"noBotProtectionWarning": "Non è stata impostata alcuna protezione dai Bot",
	"noEmailServerWarning": "Il server di posta non è configurato."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"controlPanel": "コントロールパネル",
	"quickAction": "クイックアクション",
	"lookup": "照会",
	"createInviteCode": "招待コードを作成",
	"administration": "管理",
	"dashboard": "ダッシュボード",
	"users": "ユーザー",
	"invite": "招待",
	"roles": "ロール",
	"customEmojis": "カスタム絵文字",
	"avatarDecorations": "アイコンデコレーション",
	"federation": "連合",
	"federationJobs": "連合ジョブ",
	"jobQueue": "ジョブキュー",
	"files": "ファイル",
	"announcements": "お知らせ",
	"ads": "広告",
	"abuseReports": "通報",
	"moderationLogs": "モデログ",
	"settings": "設定",
	"general": "全般",
	"branding": "ブランディング",
	"moderation": "モデレーション",
	"emailServer": "メールサーバー",
	"objectStorage": "オブジェクトストレージ",
	"security": "セキュリティ",
	"relays": "リレー",
	"externalServices": "外部サービス",
	"performance": "パフォーマンス",
	"info": "情報",
	"database": "データベース",
	"user": "ユーザー",
	"email": "メール",
	"file": "ファイル",
	"thereIsUnresolvedAbuseReportWarning": "未対応の通報があります。",
	"check": "チェック",
	"noMaintainerInformationWarning": "管理者情報が設定されていません。",
	"configure": "設定する",
	"noInquiryUrlWarning": "問い合わせ先URLが設定されていません。",
	"noBotProtectionWarning": "Botプロテクションが設定されていません。",
	"noEmailServerWarning": "メールサーバーの設定がされていません。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"controlPanel": "コントロールパネル",
	"quickAction": "クイックアクション",
	"lookup": "見てきて",
	"createInviteCode": "招待コード作る",
	"administration": "管理",
	"dashboard": "ダッシュボード",
	"users": "ユーザー",
	"invite": "来てや",
	"roles": "ロール",
	"customEmojis": "カスタム絵文字",
	"avatarDecorations": "アイコンデコレーション",
	"federation": "連合",
	"federationJobs": "連合ジョブ",
	"jobQueue": "ジョブキュー",
	"files": "ファイル",
	"announcements": "お知らせ",
	"ads": "広告",
	"abuseReports": "通報",
	"moderationLogs": "モデログ",
	"settings": "設定",
	"general": "全般",
	"branding": "ブランディング",
	"moderation": "モデレーション",
	"emailServer": "メールサーバー",
	"objectStorage": "オブジェクトストレージ",
	"security": "セキュリティ",
	"relays": "リレー",
	"externalServices": "他のサイトのサービス",
	"performance": "パフォーマンス",
	"info": "情報",
	"database": "データベース",
	"user": "ユーザー",
	"email": "メール",
	"file": "ファイル",
	"thereIsUnresolvedAbuseReportWarning": "未対応の通報があるみたいやで",
	"check": "チェック",
	"noMaintainerInformationWarning": "管理者情報が設定されてへんで",
	"configure": "設定する",
	"noInquiryUrlWarning": "問い合わせ先URLが設定されてへんで。",
	"noBotProtectionWarning": "Botプロテクションが設定されてへんで。",
	"noEmailServerWarning": "メールサーバーの設定がされてへんで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"controlPanel": "Control Panel",
	"quickAction": "Quick actions",
	"lookup": "Lookup",
	"createInviteCode": "Generate invite",
	"administration": "Management",
	"dashboard": "Dashboard",
	"users": "Users",
	"invite": "Invite",
	"roles": "Roles",
	"customEmojis": "Custom Emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federation",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Job Queue",
	"files": "Ifuyla",
	"announcements": "Announcements",
	"ads": "Advertisements",
	"abuseReports": "Reports",
	"moderationLogs": "Moderation logs",
	"settings": "Iɣewwaṛen",
	"general": "General",
	"branding": "Branding",
	"moderation": "Moderation",
	"emailServer": "Email server",
	"objectStorage": "Object Storage",
	"security": "Taɣellist",
	"relays": "Relays",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "About",
	"database": "Database",
	"user": "User",
	"email": "Imayl",
	"file": "Ifuyla",
	"thereIsUnresolvedAbuseReportWarning": "There are unsolved reports.",
	"check": "Check",
	"noMaintainerInformationWarning": "Maintainer information is not configured.",
	"configure": "Configure",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "Bot protection is not configured.",
	"noEmailServerWarning": "Email server not configured."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"controlPanel": "Control Panel",
	"quickAction": "Quick actions",
	"lookup": "Lookup",
	"createInviteCode": "Generate invite",
	"administration": "Management",
	"dashboard": "Dashboard",
	"users": "ಬಳಕೆದಾರ",
	"invite": "Invite",
	"roles": "Roles",
	"customEmojis": "Custom Emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federation",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Job Queue",
	"files": "ಕಡತಗಳು",
	"announcements": "Announcements",
	"ads": "Advertisements",
	"abuseReports": "Reports",
	"moderationLogs": "Moderation logs",
	"settings": "ಸಿದ್ಧತೆಗಳು",
	"general": "General",
	"branding": "Branding",
	"moderation": "Moderation",
	"emailServer": "Email server",
	"objectStorage": "Object Storage",
	"security": "Security",
	"relays": "Relays",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "About",
	"database": "Database",
	"user": "ಬಳಕೆದಾರ",
	"email": "Email",
	"file": "ಕಡತಗಳು",
	"thereIsUnresolvedAbuseReportWarning": "There are unsolved reports.",
	"check": "Check",
	"noMaintainerInformationWarning": "Maintainer information is not configured.",
	"configure": "Configure",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "Bot protection is not configured.",
	"noEmailServerWarning": "Email server not configured."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"controlPanel": "제어판",
	"quickAction": "빠른 동작",
	"lookup": "찾아보기",
	"createInviteCode": "초대 코드 생성",
	"administration": "관리",
	"dashboard": "대시보드",
	"users": "유저",
	"invite": "초대",
	"roles": "역할",
	"customEmojis": "커스텀 이모지",
	"avatarDecorations": "아바타 장식",
	"federation": "연합",
	"federationJobs": "연합 작업",
	"jobQueue": "작업 대기열",
	"files": "파일",
	"announcements": "공지사항",
	"ads": "광고",
	"abuseReports": "신고",
	"moderationLogs": "모더레이션 로그",
	"settings": "설정",
	"general": "일반",
	"branding": "브랜딩",
	"moderation": "조정",
	"emailServer": "메일 서버",
	"objectStorage": "오브젝트 스토리지",
	"security": "보안",
	"relays": "릴레이",
	"externalServices": "외부 서비스",
	"performance": "퍼포먼스",
	"info": "정보",
	"database": "데이터베이스",
	"user": "유저",
	"email": "이메일",
	"file": "파일",
	"thereIsUnresolvedAbuseReportWarning": "해결되지 않은 신고가 있습니다.",
	"check": "체크",
	"noMaintainerInformationWarning": "관리자 정보가 설정되어 있지 않습니다.",
	"configure": "설정하기",
	"noInquiryUrlWarning": "문의처 주소를 설정하지 않았습니다.",
	"noBotProtectionWarning": "Bot 방어가 설정되어 있지 않습니다.",
	"noEmailServerWarning": "메일 서버가 설정되어 있지 않습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"controlPanel": "Controlepaneel",
	"quickAction": "Snelle acties",
	"lookup": "Opzoeken",
	"createInviteCode": "Generate invite",
	"administration": "Beheer",
	"dashboard": "Overzicht",
	"users": "Gebruikers",
	"invite": "Uitnodigen",
	"roles": "Roles",
	"customEmojis": "Eigen emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federatie",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Job Queue",
	"files": "Bestanden",
	"announcements": "Aankondigingen",
	"ads": "Advertenties",
	"abuseReports": "Meldt",
	"moderationLogs": "Moderatieprotocollen",
	"settings": "Instellingen",
	"general": "Algemeen",
	"branding": "Branding",
	"moderation": "Moderatie",
	"emailServer": "Email-Server",
	"objectStorage": "Object Storage",
	"security": "Beveiliging",
	"relays": "Relays",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "Over",
	"database": "Database",
	"user": "Gebruikers",
	"email": "Email",
	"file": "Bestanden",
	"thereIsUnresolvedAbuseReportWarning": "There are unsolved reports.",
	"check": "Check",
	"noMaintainerInformationWarning": "Operatorinformatie is niet geconfigureerd.",
	"configure": "Configureer",
	"noInquiryUrlWarning": "Contact-URL niet opgegeven",
	"noBotProtectionWarning": "Bescherming tegen bots is niet geconfigureerd.",
	"noEmailServerWarning": "Email server not configured."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"controlPanel": "Control Panel",
	"quickAction": "Quick actions",
	"lookup": "Lookup",
	"createInviteCode": "Generate invite",
	"administration": "Management",
	"dashboard": "Dashboard",
	"users": "Brukere",
	"invite": "Inviter",
	"roles": "Roller",
	"customEmojis": "Custom Emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Føderasjon",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Job Queue",
	"files": "Filer",
	"announcements": "Kunngjøringer",
	"ads": "Annonser",
	"abuseReports": "Rappoter",
	"moderationLogs": "Moderation logs",
	"settings": "Innstillinger",
	"general": "Generelt",
	"branding": "Branding",
	"moderation": "Moderation",
	"emailServer": "Email server",
	"objectStorage": "Object Storage",
	"security": "Sikkerhet",
	"relays": "Relays",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "Infomasjon",
	"database": "Database",
	"user": "Brukere",
	"email": "E-post",
	"file": "Filer",
	"thereIsUnresolvedAbuseReportWarning": "There are unsolved reports.",
	"check": "Sjekk",
	"noMaintainerInformationWarning": "Maintainer information is not configured.",
	"configure": "Configure",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "Bot protection is not configured.",
	"noEmailServerWarning": "Email server not configured."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"controlPanel": "Panel sterowania",
	"quickAction": "Szybkie działania",
	"lookup": "Zapytania",
	"createInviteCode": "Generate invite",
	"administration": "Zarządzanie",
	"dashboard": "Kokpit",
	"users": "Użytkownicy",
	"invite": "Zaproś",
	"roles": "Role",
	"customEmojis": "Niestandardowe emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federacja",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Kolejka zadań",
	"files": "Pliki",
	"announcements": "Ogłoszenia",
	"ads": "Reklamy",
	"abuseReports": "Zgłoszenia",
	"moderationLogs": "Logi moderacyjne",
	"settings": "Ustawienia",
	"general": "Ogólne",
	"branding": "Branding",
	"moderation": "Moderacja",
	"emailServer": "Serwer poczty e-mail",
	"objectStorage": "Pamięć obiektowa",
	"security": "Bezpieczeństwo",
	"relays": "Przekaźniki",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "Informacje",
	"database": "Baza danych",
	"user": "Użytkownicy",
	"email": "Adres e-mail",
	"file": "Pliki",
	"thereIsUnresolvedAbuseReportWarning": "Istnieją niewyjaśnione raporty",
	"check": "Zweryfikuj",
	"noMaintainerInformationWarning": "Informacje o administratorze nie są skonfigurowane.",
	"configure": "Skonfiguruj",
	"noInquiryUrlWarning": "Adres URL zapytania nie został ustawiony",
	"noBotProtectionWarning": "Zabezpieczenie przed botami nie jest skonfigurowane.",
	"noEmailServerWarning": "Serwer Email nie jest skonfigurowany"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"controlPanel": "Painel de controle",
	"quickAction": "Ações rápidas",
	"lookup": "Consultar",
	"createInviteCode": "Gerar convite",
	"administration": "Administrar",
	"dashboard": "Painel de controle",
	"users": "Usuários",
	"invite": "Convidar",
	"roles": "Cargos",
	"customEmojis": "Emoji personalizado",
	"avatarDecorations": "Decorações de avatar",
	"federation": "Federação",
	"federationJobs": "Tarefas de Federação",
	"jobQueue": "Fila de tarefas",
	"files": "Arquivos",
	"announcements": "Avisos",
	"ads": "Anúncios",
	"abuseReports": "Denúncias",
	"moderationLogs": "Logs de moderação",
	"settings": "Configurações",
	"general": "Geral",
	"branding": "Marca",
	"moderation": "Moderação",
	"emailServer": "Servidor de e-mail",
	"objectStorage": "Armazenamento de objetos",
	"security": "Segurança",
	"relays": "Relays",
	"externalServices": "Serviços Externos",
	"performance": "Desempenho",
	"info": "Informações",
	"database": "Banco de dados",
	"user": "Usuário",
	"email": "E-mail",
	"file": "Ficheiros",
	"thereIsUnresolvedAbuseReportWarning": "Existem denúncias não resolvidas.",
	"check": "Verificar",
	"noMaintainerInformationWarning": "A informação de administrador não foi configurada.",
	"configure": "Configurar",
	"noInquiryUrlWarning": "URL de consulta não está definida",
	"noBotProtectionWarning": "A proteção contra bots não foi configurada.",
	"noEmailServerWarning": "Servidor de e-mail não configurado."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"controlPanel": "Панель управления",
	"quickAction": "Быстрое действие",
	"lookup": "Запрос",
	"createInviteCode": "Создать код приглашения",
	"administration": "Управление",
	"dashboard": "Панель управления",
	"users": "Пользователи",
	"invite": "Пригласить",
	"roles": "Роли",
	"customEmojis": "Собственные эмодзи",
	"avatarDecorations": "Украшения для аватара",
	"federation": "Федерация",
	"federationJobs": "Процессы федерации",
	"jobQueue": "Очередь заданий",
	"files": "Файлы",
	"announcements": "Оповещения",
	"ads": "Реклама",
	"abuseReports": "Жалобы",
	"moderationLogs": "Журнал модерации",
	"settings": "Настройки",
	"general": "Общее",
	"branding": "Бренд",
	"moderation": "Модерация",
	"emailServer": "Сервер электронной почты",
	"objectStorage": "Хранилище",
	"security": "Безопасность",
	"relays": "Ретрансляторы",
	"externalServices": "Интеграции",
	"performance": "Производительность",
	"info": "Описание",
	"database": "База данных",
	"user": "Пользователи",
	"email": "Электронная почта",
	"file": "Файлы",
	"thereIsUnresolvedAbuseReportWarning": "Остались нерешённые жалобы",
	"check": "Проверить",
	"noMaintainerInformationWarning": "Не заполнены сведения об администраторах",
	"configure": "Настроить",
	"noInquiryUrlWarning": "URL-адрес контактной формы еще не задан.",
	"noBotProtectionWarning": "Ботозащита не настроена",
	"noEmailServerWarning": "Отправка писем выключена"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"controlPanel": "Ovládací panel",
	"quickAction": "Rýchle akcie",
	"lookup": "Vyhľadať",
	"createInviteCode": "Generate invite",
	"administration": "Spravovanie",
	"dashboard": "Prehľad",
	"users": "Používatelia",
	"invite": "Pozvať",
	"roles": "Roles",
	"customEmojis": "Vlastné emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federácia",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Fronta úloh",
	"files": "Súbor/y",
	"announcements": "Oznamy",
	"ads": "Reklamy",
	"abuseReports": "Nahlásenia",
	"moderationLogs": "Moderation logs",
	"settings": "Nastavenia",
	"general": "Všeobecné",
	"branding": "Branding",
	"moderation": "Moderovanie",
	"emailServer": "Email server",
	"objectStorage": "Objektové úložisko",
	"security": "Zabezpečenie",
	"relays": "Prenos",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "Informácie",
	"database": "Databáza",
	"user": "Používatelia",
	"email": "Email",
	"file": "Súbor/y",
	"thereIsUnresolvedAbuseReportWarning": "Existuje nevyriešené nahlásenie zneužitia.",
	"check": "Check",
	"noMaintainerInformationWarning": "Informácie správcu nie sú nastavené.",
	"configure": "Konfigurovať",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "Ochrana proti botom nie je nastavená.",
	"noEmailServerWarning": "Nie je nastavený emailový server."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"controlPanel": "แผงควบคุม",
	"quickAction": "ปุ่มลัด",
	"lookup": "การค้นหา",
	"createInviteCode": "สร้างรหัสเชิญ",
	"administration": "การจัดการ",
	"dashboard": "หน้ากระดานหลัก",
	"users": "ผู้ใช้",
	"invite": "คำเชิญ",
	"roles": "บทบาท",
	"customEmojis": "เอโมจิที่กำหนดเอง",
	"avatarDecorations": "ของตกแต่งไอคอน",
	"federation": "สหพันธ์",
	"federationJobs": "งานสหพันธ์",
	"jobQueue": "คิวงาน",
	"files": "ไฟล์",
	"announcements": "ประกาศ",
	"ads": "โฆษณา",
	"abuseReports": "รายงาน",
	"moderationLogs": "ปูมการควบคุมดูแล",
	"settings": "การตั้งค่า",
	"general": "ทั่วไป",
	"branding": "แบรนดิ้ง",
	"moderation": "การกลั่นกรอง",
	"emailServer": "เซิร์ฟเวอร์ของอีเมล",
	"objectStorage": "การจัดเก็บในรูปแบบอ็อบเจกต์",
	"security": "ความปลอดภัย",
	"relays": "รีเลย์",
	"externalServices": "บริการภายนอก",
	"performance": "ประสิทธิภาพ\u200b",
	"info": "เกี่ยวกับ",
	"database": "ฐานข้อมูล",
	"user": "ผู้ใช้",
	"email": "อีเมล",
	"file": "ไฟล์",
	"thereIsUnresolvedAbuseReportWarning": "มีรายงานที่ยังไม่ได้แก้ไข",
	"check": "ตรวจสอบ",
	"noMaintainerInformationWarning": "ยังไม่ได้ตั้งค่าข้อมูลของผู้ดูแลระบบ",
	"configure": "ตั้งค่า",
	"noInquiryUrlWarning": "ยังไม่ได้ตั้งค่า URL สำหรับการติดต่อสอบถาม",
	"noBotProtectionWarning": "ยังไม่ได้ตั้งค่าการป้องกันบอต",
	"noEmailServerWarning": "ยังไม่ได้ตั้งค่าเซิร์ฟเวอร์ของอีเมล"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"controlPanel": "Kontrol Paneli",
	"quickAction": "Hızlı eylemler",
	"lookup": "Sorgu",
	"createInviteCode": "Davet Kodu oluştur",
	"administration": "Yönetim",
	"dashboard": "Gösterge paneli",
	"users": "Kullanıcılar",
	"invite": "Davet et",
	"roles": "Roller",
	"customEmojis": "Özel Emoji",
	"avatarDecorations": "Avatar süsleri",
	"federation": "Federasyon",
	"federationJobs": "Federasyon İşleri",
	"jobQueue": "İşlem sırası",
	"files": "Dosyalar",
	"announcements": "Duyurular",
	"ads": "Reklamlar",
	"abuseReports": "Raporlar",
	"moderationLogs": "Moderasyon günlükleri",
	"settings": "Ayarlar",
	"general": "Genel",
	"branding": "Markalaşma",
	"moderation": "Moderasyon",
	"emailServer": "E-posta sunucusu",
	"objectStorage": "Nesne Depolama",
	"security": "Güvenlik",
	"relays": "Röleler",
	"externalServices": "Dış Hizmetler",
	"performance": "Başarım",
	"info": "Hakkında",
	"database": "Veritabanı",
	"user": "Kullanıcı",
	"email": "E-Posta",
	"file": "Dosyalar",
	"thereIsUnresolvedAbuseReportWarning": "Çözülmemiş raporlar var.",
	"check": "Kontrol",
	"noMaintainerInformationWarning": "Bakımcı bilgileri yapılandırılmamıştır.",
	"configure": "Yeniden Yapılandır",
	"noInquiryUrlWarning": "Sorgu URL'si ayarlanmadı",
	"noBotProtectionWarning": "Bot koruması yapılandırılmamıştır.",
	"noEmailServerWarning": "E-posta sunucusu yapılandırılmamış."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"controlPanel": "Control Panel",
	"quickAction": "Quick actions",
	"lookup": "Lookup",
	"createInviteCode": "Generate invite",
	"administration": "Management",
	"dashboard": "Dashboard",
	"users": "Users",
	"invite": "Invite",
	"roles": "Roles",
	"customEmojis": "Custom Emoji",
	"avatarDecorations": "Avatar decorations",
	"federation": "Federation",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Job Queue",
	"files": "Files",
	"announcements": "Announcements",
	"ads": "Advertisements",
	"abuseReports": "Reports",
	"moderationLogs": "Moderation logs",
	"settings": "Settings",
	"general": "General",
	"branding": "Branding",
	"moderation": "Moderation",
	"emailServer": "Email server",
	"objectStorage": "Object Storage",
	"security": "Security",
	"relays": "Relays",
	"externalServices": "External Services",
	"performance": "Performance",
	"info": "About",
	"database": "Database",
	"user": "User",
	"email": "Email",
	"file": "File",
	"thereIsUnresolvedAbuseReportWarning": "There are unsolved reports.",
	"check": "Check",
	"noMaintainerInformationWarning": "Maintainer information is not configured.",
	"configure": "Configure",
	"noInquiryUrlWarning": "Inquiry URL isn’t set",
	"noBotProtectionWarning": "Bot protection is not configured.",
	"noEmailServerWarning": "Email server not configured."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"controlPanel": "Панель керування",
	"quickAction": "Швидкі дії",
	"lookup": "Пошук",
	"createInviteCode": "Створити запрошення",
	"administration": "Управління",
	"dashboard": "Панель приладів",
	"users": "Користувачі",
	"invite": "Запросити",
	"roles": "Ролі",
	"customEmojis": "Кастомні емоджі",
	"avatarDecorations": "Прикраси аватара",
	"federation": "Федіверс",
	"federationJobs": "Завдання федерації",
	"jobQueue": "Черга завдань",
	"files": "Файли",
	"announcements": "Оголошення",
	"ads": "Реклама",
	"abuseReports": "Скарги",
	"moderationLogs": "Журнали модерації",
	"settings": "Налаштування",
	"general": "Загальне",
	"branding": "Брендинг",
	"moderation": "Модерація",
	"emailServer": "Email сервер",
	"objectStorage": "Object Storage",
	"security": "Безпека",
	"relays": "Ретранслятори",
	"externalServices": "Зовнішні сервіси",
	"performance": "Продуктивність",
	"info": "Інформація",
	"database": "База даних",
	"user": "Користувачі",
	"email": "E-mail",
	"file": "Файли",
	"thereIsUnresolvedAbuseReportWarning": "Є нерозглянуті скарги.",
	"check": "Перевірити",
	"noMaintainerInformationWarning": "Інформація про адміністраторів не налаштована",
	"configure": "Налаштувати",
	"noInquiryUrlWarning": "URL для звернень не встановлено",
	"noBotProtectionWarning": "Захист від ботів не налаштовано",
	"noEmailServerWarning": "Email сервер не налаштовано."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"controlPanel": "Bảng điều khiển",
	"quickAction": "Thao tác nhanh",
	"lookup": "Tra cứu",
	"createInviteCode": "Tạo lời mời",
	"administration": "Quản lý",
	"dashboard": "Trang chính",
	"users": "Người dùng",
	"invite": "Mời",
	"roles": "Vai trò",
	"customEmojis": "Tùy chỉnh emoji",
	"avatarDecorations": "Trang trí ảnh đại diện",
	"federation": "Liên hợp",
	"federationJobs": "Federation Jobs",
	"jobQueue": "Công việc chờ xử lý",
	"files": "Tập tin",
	"announcements": "Thông báo máy chủ",
	"ads": "Quảng cáo",
	"abuseReports": "Lượt báo cáo",
	"moderationLogs": "Nhật kí quản trị",
	"settings": "Cài đặt",
	"general": "Tổng quan",
	"branding": "Thương hiệu",
	"moderation": "Kiểm duyệt",
	"emailServer": "Email máy chủ",
	"objectStorage": "Đối tượng lưu trữ",
	"security": "Bảo mật",
	"relays": "Chuyển tiếp",
	"externalServices": "Các dịch vụ bên ngoài",
	"performance": "Performance",
	"info": "Giới thiệu",
	"database": "Cơ sở dữ liệu",
	"user": "Người dùng",
	"email": "Email",
	"file": "Tập tin",
	"thereIsUnresolvedAbuseReportWarning": "Có báo cáo chưa xử lí.",
	"check": "Kiểm tra",
	"noMaintainerInformationWarning": "Chưa thiết lập thông tin vận hành.",
	"configure": "Thiết lập",
	"noInquiryUrlWarning": "Địa chỉ hỏi đáp chưa được đặt",
	"noBotProtectionWarning": "Bảo vệ Bot chưa thiết lập.",
	"noEmailServerWarning": "Chưa đặt máy chủ email."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"controlPanel": "控制面板",
	"quickAction": "快捷操作",
	"lookup": "查找用户",
	"createInviteCode": "生成邀请码",
	"administration": "管理",
	"dashboard": "管理面板",
	"users": "用户",
	"invite": "邀请",
	"roles": "角色",
	"customEmojis": "自定义表情符号",
	"avatarDecorations": "头像挂件",
	"federation": "联邦",
	"federationJobs": "联邦作业",
	"jobQueue": "作业队列",
	"files": "文件",
	"announcements": "公告",
	"ads": "广告",
	"abuseReports": "举报",
	"moderationLogs": "管理日志",
	"settings": "设置",
	"general": "常规设置",
	"branding": "品牌",
	"moderation": "管理",
	"emailServer": "邮件服务器",
	"objectStorage": "对象存储",
	"security": "安全",
	"relays": "中继",
	"externalServices": "外部服务",
	"performance": "性能",
	"info": "关于",
	"database": "数据库",
	"user": "用户",
	"email": "邮箱",
	"file": "文件",
	"thereIsUnresolvedAbuseReportWarning": "有未解决的报告",
	"check": "检查",
	"noMaintainerInformationWarning": "尚未设置管理员信息。",
	"configure": "设置",
	"noInquiryUrlWarning": "尚未设置联络地址。",
	"noBotProtectionWarning": "尚未设置 Bot 防御。",
	"noEmailServerWarning": "电子邮件服务器未设置。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"controlPanel": "控制臺",
	"quickAction": "快捷操作",
	"lookup": "查詢",
	"createInviteCode": "建立邀請碼",
	"administration": "管理",
	"dashboard": "儀表板",
	"users": "使用者",
	"invite": "邀請",
	"roles": "角色",
	"customEmojis": "自訂表情符號",
	"avatarDecorations": "頭像裝飾",
	"federation": "站台聯邦",
	"federationJobs": "聯邦通訊作業",
	"jobQueue": "工作佇列",
	"files": "檔案",
	"announcements": "公告",
	"ads": "廣告",
	"abuseReports": "檢舉",
	"moderationLogs": "管理日誌",
	"settings": "設定",
	"general": "一般",
	"branding": "品牌宣傳",
	"moderation": "審查",
	"emailServer": "電子郵件伺服器",
	"objectStorage": "物件儲存",
	"security": "安全性",
	"relays": "中繼器",
	"externalServices": "外部服務",
	"performance": "性能",
	"info": "資訊",
	"database": "資料庫",
	"user": "使用者",
	"email": "電子郵件",
	"file": "檔案",
	"thereIsUnresolvedAbuseReportWarning": "有尚未處理的檢舉。",
	"check": "檢查",
	"noMaintainerInformationWarning": "尚未設定管理員訊息。",
	"configure": "設定",
	"noInquiryUrlWarning": "尚未設定聯絡表單網址。",
	"noBotProtectionWarning": "尚未設定 Bot 防護。",
	"noEmailServerWarning": "尚未設定電子郵件伺服器。"
}
</locale>
