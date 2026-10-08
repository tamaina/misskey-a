<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root]">
	<XTitlebar v-if="prefer.r.showTitlebar.value" style="flex-shrink: 0;"/>

	<div :class="$style.nonTitlebarArea">
		<XSidebar v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'left'"/>

		<div :class="[$style.main, { [$style.withWallpaper]: withWallpaper, [$style.withSidebarAndTitlebar]: !isMobile && prefer.r['deck.navbarPosition'].value === 'left' && prefer.r.showTitlebar.value }]" :style="{ backgroundImage: prefer.s['deck.wallpaper'] != null ? `url(${ prefer.s['deck.wallpaper'] })` : '' }">
			<XNavbarH v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'top'" :acrylic="withWallpaper"/>

			<XReloadSuggestion v-if="shouldSuggestReload"/>
			<XPreferenceRestore v-if="shouldSuggestRestoreBackup"/>
			<XThemePreviewing v-if="isThemePreviewMode"/>
			<XAnnouncements v-if="$i"/>
			<XStatusBars/>
			<div :class="$style.columnsWrapper">
				<!-- passive: https://bugs.webkit.org/show_bug.cgi?id=281300 -->
				<div ref="columnsEl" :class="[$style.columns, { [$style.center]: prefer.r['deck.columnAlign'].value === 'center', [$style.snapScroll]: snapScroll }]" @contextmenu.self.prevent="onContextmenu" @wheel.passive.self="onWheel">
					<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
					<section
						v-for="ids in layout"
						:class="$style.section"
						:style="columns.filter(c => ids.includes(c.id)).some(c => c.flexible) ? { flex: 1, minWidth: '350px' } : { width: Math.max(...columns.filter(c => ids.includes(c.id)).map(c => c.width)) + 'px' }"
						@wheel.passive.self="onWheel"
					>
						<component
							:is="columnComponents[columns.find(c => c.id === id)!.type] ?? XTlColumn"
							v-for="id in ids"
							:ref="id"
							:key="id"
							:class="{ '_shadow': withWallpaper }"
							:column="columns.find(c => c.id === id)!"
							:isStacked="ids.length > 1"
							@headerWheel="onWheel"
						/>
					</section>
					<div v-if="layout.length === 0" class="_panel _gaps" :class="$style.onboarding">
						<div>{{ $locale.sfc.deckIntroduction }}</div>
						<div>{{ $locale.sfc.deckIntroduction2 }}</div>
						<MkInfo v-if="!store.r.tips.value.deck" closable @close="closeTip('deck')">
							<button class="_textButton" @click="showTour">{{ $locale.sfc.deckShowHowToUse }}</button>
						</MkInfo>
					</div>
				</div>

				<div v-if="prefer.r['deck.menuPosition'].value === 'right'" :class="$style.sideMenu">
					<div :class="$style.sideMenuTop">
						<button ref="swicthProfileButtonEl" v-tooltip.noDelay.left="`${$locale.sfc.deckProfile}: ${prefer.s['deck.profile']}`" :class="$style.sideMenuButton" class="_button" @click="switchProfileMenu"><i class="ti ti-caret-down"></i></button>
						<button v-tooltip.noDelay.left="$locale.sfc.deckDeleteProfile" :class="$style.sideMenuButton" class="_button" @click="deleteProfile"><i class="ti ti-trash"></i></button>
					</div>
					<div :class="$style.sideMenuMiddle">
						<button ref="addColumnButtonEl" v-tooltip.noDelay.left="$locale.sfc.deckAddColumn" :class="$style.sideMenuButton" class="_button" @click="addColumn"><i class="ti ti-plus"></i></button>
					</div>
					<div :class="$style.sideMenuBottom">
						<button ref="settingsButtonEl" v-tooltip.noDelay.left="$locale.sfc.settings" :class="$style.sideMenuButton" class="_button" @click="showSettings"><i class="ti ti-settings-2"></i></button>
					</div>
				</div>
			</div>

			<div v-if="prefer.r['deck.menuPosition'].value === 'bottom'" :class="$style.bottomMenu">
				<div :class="$style.bottomMenuLeft">
					<button ref="swicthProfileButtonEl" v-tooltip.noDelay.top="`${$locale.sfc.deckProfile}: ${prefer.s['deck.profile']}`" :class="$style.bottomMenuButton" class="_button" @click="switchProfileMenu"><i class="ti ti-caret-down"></i></button>
					<button v-tooltip.noDelay.top="$locale.sfc.deckDeleteProfile" :class="$style.bottomMenuButton" class="_button" @click="deleteProfile"><i class="ti ti-trash"></i></button>
				</div>
				<div :class="$style.bottomMenuMiddle">
					<button ref="addColumnButtonEl" v-tooltip.noDelay.top="$locale.sfc.deckAddColumn" :class="$style.bottomMenuButton" class="_button" @click="addColumn"><i class="ti ti-plus"></i></button>
				</div>
				<div :class="$style.bottomMenuRight">
					<button ref="settingsButtonEl" v-tooltip.noDelay.top="$locale.sfc.settings" :class="$style.bottomMenuButton" class="_button" @click="showSettings"><i class="ti ti-settings-2"></i></button>
				</div>
			</div>

			<XNavbarH v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'bottom'" :acrylic="withWallpaper"/>

			<XMobileFooterMenu v-if="isMobile" v-model:drawerMenuShowing="drawerMenuShowing" v-model:widgetsShowing="widgetsShowing"/>
		</div>
	</div>

	<XCommon v-model:drawerMenuShowing="drawerMenuShowing" v-model:widgetsShowing="widgetsShowing"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, useTemplateRef } from 'vue';
import XCommon from './_common_/common.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import XSidebar from '@features/navigation/frontend/ui/_common_/navbar.vue';
import XNavbarH from '@features/navigation/frontend/ui/_common_/navbar-h.vue';
import XMobileFooterMenu from '@features/navigation/frontend/ui/_common_/mobile-footer-menu.vue';
import XTitlebar from '@features/navigation/frontend/ui/_common_/titlebar.vue';
import XPreferenceRestore from '@features/preferences/frontend/ui/_common_/PreferenceRestore.vue';
import XReloadSuggestion from '@features/boot/frontend/ui/_common_/ReloadSuggestion.vue';
import XThemePreviewing from '@features/preferences/frontend/ui/_common_/ThemePreviewing.vue';
import * as os from '@features/ui/frontend/os.js';
import { $i } from '@features/auth/frontend/i.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { deviceKind } from '@features/ui/frontend/utility/device-kind.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { store } from '@features/preferences/frontend/store.js';
import { isPreviewMode as isThemePreviewMode } from '@features/preferences/frontend/theme.js';
import XMainColumn from '@features/navigation/frontend/ui/deck/main-column.vue';
import XTlColumn from '@features/timelines/frontend/ui/deck/tl-column.vue';
import XAntennaColumn from '@features/timelines/frontend/ui/deck/antenna-column.vue';
import XListColumn from '@features/relationships/frontend/ui/deck/list-column.vue';
import XChannelColumn from '@features/channels/frontend/ui/deck/channel-column.vue';
import XNotificationsColumn from '@features/notifications/frontend/ui/deck/notifications-column.vue';
import XWidgetsColumn from '@features/navigation/frontend/ui/deck/widgets-column.vue';
import XMentionsColumn from '@features/relationships/frontend/ui/deck/mentions-column.vue';
import XDirectColumn from '@features/relationships/frontend/ui/deck/direct-column.vue';
import XRoleTimelineColumn from '@features/roles/frontend/ui/deck/role-timeline-column.vue';
import XChatColumn from '@features/chat/frontend/ui/deck/chat-column.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { mainRouter } from '@features/navigation/frontend/router.js';
import { columns, layout, columnTypes, switchProfileMenu, addColumn as addColumnToStore, deleteProfile as deleteProfile_ } from '@features/preferences/frontend/deck.js';
import { shouldSuggestRestoreBackup } from '@features/preferences/frontend/state/utility.js';
import { shouldSuggestReload } from '@features/boot/frontend/utility/reload-suggest.js';
import { startTour } from '@features/navigation/frontend/utility/tour.js';
import { closeTip } from '@features/web/frontend/tips.js';

const XStatusBars = defineAsyncComponent(() => import('@features/navigation/frontend/ui/_common_/statusbars.vue'));
const XAnnouncements = defineAsyncComponent(() => import('@features/announcements/frontend/ui/_common_/announcements.vue'));

const columnComponents = {
	main: XMainColumn,
	widgets: XWidgetsColumn,
	notifications: XNotificationsColumn,
	tl: XTlColumn,
	list: XListColumn,
	channel: XChannelColumn,
	antenna: XAntennaColumn,
	mentions: XMentionsColumn,
	direct: XDirectColumn,
	roleTimeline: XRoleTimelineColumn,
	chat: XChatColumn,
};

mainRouter.navHook = (path, flag): boolean => {
	if (flag === 'forcePage') return false;
	const noMainColumn = !columns.value.some(x => x.type === 'main');
	if (prefer.s['deck.navWindow'] || noMainColumn) {
		os.pageWindow(path);
		return true;
	}
	return false;
};

const isMobile = ref(window.innerWidth <= 500);
window.addEventListener('resize', () => {
	isMobile.value = window.innerWidth <= 500;
});

// ポインターイベント非対応用に初期値はUAから出す
const snapScroll = ref(deviceKind === 'smartphone' || deviceKind === 'tablet');
const withWallpaper = prefer.s['deck.wallpaper'] != null;
const drawerMenuShowing = ref(false);
const widgetsShowing = ref(false);
const gap = prefer.r['deck.columnGap'];

/*
const route = 'TODO';
watch(route, () => {
	drawerMenuShowing.value = false;
});
*/

function showSettings() {
	os.pageWindow('/settings/deck');
}

const columnsEl = useTemplateRef('columnsEl');
const addColumnButtonEl = useTemplateRef('addColumnButtonEl');
const settingsButtonEl = useTemplateRef('settingsButtonEl');
const swicthProfileButtonEl = useTemplateRef('swicthProfileButtonEl');

async function addColumn(ev: PointerEvent) {
	const { canceled, result: column } = await os.select({
		title: $locale.value.sfc.deckAddColumn,
		items: columnTypes.filter(column => column !== 'chat' || $i == null || $i.policies.chatAvailability !== 'unavailable').map(column => ({
			value: column, label: copyLocaleDictionary($locale.value.sfc.deckColumnsLabels)[column],
		})),
	});
	if (canceled || column == null) return;

	addColumnToStore({
		type: column,
		id: genId(),
		name: null,
		width: 330,
		soundSetting: { type: null, volume: 1 },
	});
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu([{
		text: $locale.value.sfc.deckAddColumn,
		action: addColumn,
	}], ev);
}

// タッチでスクロールしてるときはスナップスクロールを有効にする
function pointerEvent(ev: PointerEvent) {
	snapScroll.value = ev.pointerType === 'touch';
}

window.document.addEventListener('pointerdown', pointerEvent, { passive: true });

function onWheel(ev: WheelEvent) {
	// WheelEvent はマウスからしか発火しないのでスナップスクロールは無効化する
	snapScroll.value = false;
	if (ev.deltaX === 0 && columnsEl.value != null) {
		columnsEl.value.scrollLeft += ev.deltaY;
	}
}

async function deleteProfile() {
	if (prefer.s['deck.profile'] == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.deleteAreYouSure, { x: prefer.s['deck.profile'] }),
	});
	if (canceled) return;

	await deleteProfile_(prefer.s['deck.profile']);

	os.success();
}

function showTour() {
	if (addColumnButtonEl.value == null ||
		settingsButtonEl.value == null ||
		swicthProfileButtonEl.value == null) {
		return;
	}

	startTour([{
		element: addColumnButtonEl.value,
		title: $locale.value.sfc.deckHowToUseAddColumn_title,
		description: $locale.value.sfc.deckHowToUseAddColumn_description,
	}, {
		element: settingsButtonEl.value,
		title: $locale.value.sfc.deckHowToUseSettings_title,
		description: $locale.value.sfc.deckHowToUseSettings_description,
	}, {
		element: swicthProfileButtonEl.value,
		title: $locale.value.sfc.deckHowToUseSwitchProfile_title,
		description: $locale.value.sfc.deckHowToUseSwitchProfile_description,
	}]).then(() => {
		closeTip('deck');
	});
}

window.document.documentElement.style.overflowY = 'hidden';
window.document.documentElement.style.scrollBehavior = 'auto';
</script>

<style lang="scss" module>
.root {
	--MI-margin: var(--MI-marginHalf);

	--columnGap: v-bind("gap + 'px'");

	display: flex;
	flex-direction: column;
	height: 100dvh;
	box-sizing: border-box;
	flex: 1;
	background: var(--MI_THEME-navBg);
}

.nonTitlebarArea {
	display: flex;
	flex: 1;
	min-height: 0;
}

.main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;

	&:not(.withWallpaper) {
		background: var(--MI_THEME-deckBg);
	}

	&.withSidebarAndTitlebar {
		border-radius: 12px 0 0 0;
		overflow: clip;
	}
}

.columnsWrapper {
	flex: 1;
	display: flex;
	flex-direction: row;

	// これがないと狭い画面でマージンが広いデッキを表示したときにナビゲーションフッターが画面の外に追いやられて操作不能になる場合がある
	min-height: 0;
}

.columns {
	flex: 1;
	display: flex;
	overflow-x: auto;
	overflow-y: clip;
	overscroll-behavior: contain;
	padding: var(--columnGap);
	gap: var(--columnGap);

	&.center {
		> .section:first-of-type {
			margin-left: auto !important;
		}

		> .section:last-of-type {
			margin-right: auto !important;
		}
	}

	&.snapScroll {
		scroll-snap-type: x mandatory;
	}
}

.section {
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	gap: var(--columnGap);
	scroll-snap-align: start;
	scroll-margin-left: var(--columnGap);
}

.onboarding {
	padding: 32px;
	height: min-content;
	text-align: center;
	margin: auto;
}

.sideMenu {
	flex-shrink: 0;
	margin-right: 0;
	margin-left: auto;
	display: flex;
	flex-direction: column;
	justify-content: center;
	width: 32px;
}

.sideMenuButton {
	display: block;
	width: 100%;
	aspect-ratio: 1;
}

.sideMenuTop {
	margin-bottom: auto;
}

.sideMenuMiddle {
	margin-top: auto;
	margin-bottom: auto;
}

.sideMenuBottom {
	margin-top: auto;
}

.bottomMenu {
	flex-shrink: 0;
	display: flex;
	flex-direction: row;
	justify-content: center;
	height: 32px;
}

.bottomMenuButton {
	display: inline-block;
	height: 100%;
	aspect-ratio: 1;
}

.bottomMenuLeft {
	margin-right: auto;
}

.bottomMenuMiddle {
	margin-left: auto;
	margin-right: auto;
}

.bottomMenuRight {
	margin-left: auto;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "حسابي الشخصي",
	"deckDeleteProfile": "حذف الملف التعريفي",
	"deckAddColumn": "إضافة عمود",
	"settings": "الاعدادات",
	"deckColumnsLabels": {
		"main": "الرئيسية",
		"widgets": "التطبيقات المُصغّرة",
		"notifications": "الإشعارات",
		"tl": "الخط الزمني",
		"antenna": "الهوائيات",
		"list": "القوائم",
		"channel": "القنوات",
		"mentions": "الإشارات",
		"direct": "مباشرة",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"deckIntroduction": "Crea la interfície perfecta posant les columnes allà on vulguis!",
	"deckIntroduction2": "Fes clic al botó + de la dreta per afegir noves columnes sempre que vulguis.",
	"deckShowHowToUse": "Veure la descripció de la interfície d'usuari ",
	"deckProfile": "Perfil",
	"deckDeleteProfile": "Elimina el perfil",
	"deckAddColumn": "Afegeix una columna",
	"settings": "Preferències",
	"deckColumnsLabels": {
		"main": "Principal",
		"widgets": "Ginys",
		"notifications": "Notificacions",
		"tl": "Línia de temps",
		"antenna": "Antena",
		"list": "Llistes",
		"channel": "Canals",
		"mentions": "Mencions",
		"direct": "Publicacions directes",
		"roleTimeline": "Línia de temps dels rols",
		"chat": "Xateja amb aquest usuari"
	},
	"deleteAreYouSure": "Segur que vols esborrar «{x}»?",
	"deckHowToUseAddColumn_title": "Afegir columna",
	"deckHowToUseAddColumn_description": "Pots seleccionar i afegir tipus de columnes.",
	"deckHowToUseSettings_title": "Configuració de la interfície d'usuari ",
	"deckHowToUseSettings_description": "Pots configurar la interfície d'usuari amb detall.",
	"deckHowToUseSwitchProfile_title": "Canviar perfil",
	"deckHowToUseSwitchProfile_description": "Pots desar el disseny de la interfície d'usuari com un perfil i anar canviant entre ells quan vulguis."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"deckIntroduction": "Vytvořte si dokonalé rozhraní volným uspořádáním sloupců!",
	"deckIntroduction2": "Kliknutím na tlačítko + v pravé části obrazovky můžete kdykoli přidat nové sloupce.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profil",
	"deckDeleteProfile": "Smazat profil",
	"deckAddColumn": "Přidat sloupec",
	"settings": "Nastavení",
	"deckColumnsLabels": {
		"main": "Hlavní",
		"widgets": "Widgety",
		"notifications": "Oznámení",
		"tl": "Časová osa",
		"antenna": "Antény",
		"list": "Seznamy",
		"channel": "Kanály",
		"mentions": "Zmínění",
		"direct": "Přímé poznámky",
		"roleTimeline": "Časová osa role",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profile",
	"deckDeleteProfile": "Delete profile",
	"deckAddColumn": "Add column",
	"settings": "Settings",
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Notifications",
		"tl": "Timeline",
		"antenna": "Antennas",
		"list": "List",
		"channel": "Channel",
		"mentions": "Mentions",
		"direct": "Direct notes",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"deckIntroduction": "Erstelle eine auf dich zugeschneiderte Benutzeroberfläche durch das Aneinanderreihen von Spalten!",
	"deckIntroduction2": "Klicke auf das + rechts um wann immer du möchtest neue Spalten hinzuzufügen.",
	"deckShowHowToUse": "Siehe dir die UI-Beschreibung an.",
	"deckProfile": "Profil",
	"deckDeleteProfile": "Profil löschen",
	"deckAddColumn": "Spalte hinzufügen",
	"settings": "Einstellungen",
	"deckColumnsLabels": {
		"main": "Hauptspalte",
		"widgets": "Widgets",
		"notifications": "Benachrichtigungen",
		"tl": "Chronik",
		"antenna": "Antennen",
		"list": "Listen",
		"channel": "Kanal",
		"mentions": "Erwähnungen",
		"direct": "Direktnachrichten",
		"roleTimeline": "Rollenchronik",
		"chat": "Mit dem Benutzer chatten"
	},
	"deleteAreYouSure": "Möchtest du „{x}“ wirklich löschen?",
	"deckHowToUseAddColumn_title": "Spalte hinzufügen",
	"deckHowToUseAddColumn_description": "Sie können den Spaltentyp auswählen und hinzufügen.",
	"deckHowToUseSettings_title": "UI-Einstellungen",
	"deckHowToUseSettings_description": "Sie können die detaillierten Einstellungen der Deck-UI vornehmen.",
	"deckHowToUseSwitchProfile_title": "Profil wechseln",
	"deckHowToUseSwitchProfile_description": "Das UI-Layout kann als Profil gespeichert werden, sodass du jederzeit zwischen den Profilen wechseln kannst."
}
</locale>

<locale lang="json" locale="en-US">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profile",
	"deckDeleteProfile": "Delete profile",
	"deckAddColumn": "Add column",
	"settings": "Settings",
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Notifications",
		"tl": "Timeline",
		"antenna": "Antennas",
		"list": "List",
		"channel": "Channel",
		"mentions": "Mentions",
		"direct": "Direct notes",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"deckIntroduction": "¡Crea la interfaz perfecta para tí organizando las columnas libremente!",
	"deckIntroduction2": "Presiona en la  + de la derecha de la pantalla para añadir nuevas columnas donde quieras.",
	"deckShowHowToUse": "Ver la descripción de la interfaz de usuario",
	"deckProfile": "Perfil",
	"deckDeleteProfile": "Eliminar perfil",
	"deckAddColumn": "Agregar columna",
	"settings": "Configuración",
	"deckColumnsLabels": {
		"main": "Principal",
		"widgets": "Widgets",
		"notifications": "Notificaciones",
		"tl": "Linea de tiempo",
		"antenna": "Antenas",
		"list": "Listas",
		"channel": "Canal",
		"mentions": "Menciones",
		"direct": "Notas directas",
		"roleTimeline": "Linea de tiempo del rol",
		"chat": "Chatear"
	},
	"deleteAreYouSure": "¿Desea borrar \"{x}\"?",
	"deckHowToUseAddColumn_title": "Añadir columna",
	"deckHowToUseAddColumn_description": "Puede seleccionar y añadir tipos de columnas.",
	"deckHowToUseSettings_title": "Configuración de la interfaz de usuario",
	"deckHowToUseSettings_description": "Puedes configurar la interfaz de usuario en detalle.",
	"deckHowToUseSwitchProfile_title": "Cambiar de perfil",
	"deckHowToUseSwitchProfile_description": "Puedes guardar diseños de interfaz de usuario como perfiles y cambiar entre ellos en cualquier momento."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"deckIntroduction": "Créez l’interface parfaite qui vous sied en arrangeant librement les colonnes !",
	"deckIntroduction2": "Cliquez sur le + à droite de l'écran pour ajouter de nouvelles colonnes quand vous le souhaitez.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profil",
	"deckDeleteProfile": "Supprimer le profil",
	"deckAddColumn": "Ajouter une colonne",
	"settings": "Paramètres",
	"deckColumnsLabels": {
		"main": "Principale",
		"widgets": "Widgets",
		"notifications": "Notifications",
		"tl": "Fil",
		"antenna": "Antennes",
		"list": "Listes",
		"channel": "Canal",
		"mentions": "Mentions",
		"direct": "Direct",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} » ?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"deckIntroduction": "Buat antarmuka sempurna untukmu dengan menata kolom secara bebas!",
	"deckIntroduction2": "Klik \"+\" pada kanan layar untuk menambahkan kolom baru kapanpun yang kamu mau.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profil",
	"deckDeleteProfile": "Hapus profil",
	"deckAddColumn": "Tambahkan kolom",
	"settings": "Pengaturan",
	"deckColumnsLabels": {
		"main": "Utama",
		"widgets": "Widget",
		"notifications": "Notifikasi",
		"tl": "Beranda",
		"antenna": "Antena",
		"list": "Daftar",
		"channel": "Kanal",
		"mentions": "Sebutan",
		"direct": "Langsung",
		"roleTimeline": "Lini masa peran",
		"chat": "Obrolan pengguna"
	},
	"deleteAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "Pengaturan UI",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"deckIntroduction": "Crea la tua interfaccia combinando le colonne!",
	"deckIntroduction2": "Per aggiungere una colonna, cliccare il bottone + (più) visibile al margine dello schermo.",
	"deckShowHowToUse": "Guarda la spiegazione dell'interfaccia grafica",
	"deckProfile": "Profilo",
	"deckDeleteProfile": "Cancellare il profilo.",
	"deckAddColumn": "Aggiungi colonna",
	"settings": "Impostazioni",
	"deckColumnsLabels": {
		"main": "Principale",
		"widgets": "Riquadri",
		"notifications": "Notifiche",
		"tl": "Timeline",
		"antenna": "Antenne",
		"list": "Liste",
		"channel": "Canali",
		"mentions": "Menzioni",
		"direct": "Note Dirette",
		"roleTimeline": "Timeline Ruolo",
		"chat": "Chatta con questa persona"
	},
	"deleteAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"deckHowToUseAddColumn_title": "Aggiungere colonne",
	"deckHowToUseAddColumn_description": "Puoi selezionare un tipo di colonna e aggiungerlo.",
	"deckHowToUseSettings_title": "Configurazione interfaccia grafica",
	"deckHowToUseSettings_description": "Puoi personalizzare i dettagli dell'interfaccia grafica.",
	"deckHowToUseSwitchProfile_title": "Selettore profilo",
	"deckHowToUseSwitchProfile_description": "Puoi salvare la disposizione dell'interfaccia grafica nel tuo profilo, affinché cambi con comodità."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"deckIntroduction": "カラムを組み合わせて自分だけのインターフェイスを作りましょう！",
	"deckIntroduction2": "カラムを追加するには、画面の + をクリックします。",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "プロファイル",
	"deckDeleteProfile": "プロファイルを削除",
	"deckAddColumn": "カラムを追加",
	"settings": "設定",
	"deckColumnsLabels": {
		"main": "メイン",
		"widgets": "ウィジェット",
		"notifications": "通知",
		"tl": "タイムライン",
		"antenna": "アンテナ",
		"list": "リスト",
		"channel": "チャンネル",
		"mentions": "メンション",
		"direct": "指名",
		"roleTimeline": "ロールタイムライン",
		"chat": "ダイレクトメッセージ"
	},
	"deleteAreYouSure": "「{x}」を削除しますか？",
	"deckHowToUseAddColumn_title": "カラム追加",
	"deckHowToUseAddColumn_description": "カラムの種類を選んで追加できます。",
	"deckHowToUseSettings_title": "UI設定",
	"deckHowToUseSettings_description": "デッキUIの詳細設定を行えます。",
	"deckHowToUseSwitchProfile_title": "プロファイル切り替え",
	"deckHowToUseSwitchProfile_description": "UIのレイアウトをプロファイルとして保存し、いつでも切り替えられるようにできます。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"deckIntroduction": "カラムを組み合わせて自分だけのインターフェイスを作りましょ！",
	"deckIntroduction2": "画面の右にある + を押して、いつでもカラムを追加できるで。",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "プロファイル",
	"deckDeleteProfile": "プロファイルを削除",
	"deckAddColumn": "カラムを追加",
	"settings": "設定",
	"deckColumnsLabels": {
		"main": "メイン",
		"widgets": "ウィジェット",
		"notifications": "通知",
		"tl": "タイムライン",
		"antenna": "アンテナ",
		"list": "リスト",
		"channel": "チャンネル",
		"mentions": "あんた宛て",
		"direct": "ダイレクト",
		"roleTimeline": "ロールタイムライン",
		"chat": "チャットしよか"
	},
	"deleteAreYouSure": "「{x}」はほかしてええか？",
	"deckHowToUseAddColumn_title": "カラム追加",
	"deckHowToUseAddColumn_description": "カラムの種類を選んで追加できます。",
	"deckHowToUseSettings_title": "UI設定",
	"deckHowToUseSettings_description": "デッキUIの詳細設定を行えます。",
	"deckHowToUseSwitchProfile_title": "プロファイル切り替え",
	"deckHowToUseSwitchProfile_description": "UIのレイアウトをプロファイルとして保存し、いつでも切り替えられるようにできます。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profile",
	"deckDeleteProfile": "Delete profile",
	"deckAddColumn": "Add column",
	"settings": "Iɣewwaṛen",
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Ilɣuyen",
		"tl": "Timeline",
		"antenna": "Antennas",
		"list": "Tibdarin",
		"channel": "Channel",
		"mentions": "Mentions",
		"direct": "Direct notes",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profile",
	"deckDeleteProfile": "Delete profile",
	"deckAddColumn": "Add column",
	"settings": "ಸಿದ್ಧತೆಗಳು",
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "ಅಧಿಸೂಚನೆಗಳು",
		"tl": "ಸಮಯಸಾಲು",
		"antenna": "Antennas",
		"list": "List",
		"channel": "Channel",
		"mentions": "ಹೆಸರಿಸಿದ",
		"direct": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"deckIntroduction": "칼럼을 조합해서 나만의 인터페이스를 구성해 보아요!",
	"deckIntroduction2": "나중에라도 화면 우측의 + 버튼을 눌러 새 칼럼을 추가할 수 있습니다.",
	"deckShowHowToUse": "UI 설명 보기",
	"deckProfile": "프로파일",
	"deckDeleteProfile": "프로파일 삭제",
	"deckAddColumn": "칼럼 추가",
	"settings": "설정",
	"deckColumnsLabels": {
		"main": "메인",
		"widgets": "위젯",
		"notifications": "알림",
		"tl": "타임라인",
		"antenna": "안테나",
		"list": "리스트",
		"channel": "채널",
		"mentions": "받은 멘션",
		"direct": "다이렉트",
		"roleTimeline": "역할 타임라인",
		"chat": "채팅하기"
	},
	"deleteAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"deckHowToUseAddColumn_title": "칼럼 추가",
	"deckHowToUseAddColumn_description": "칼럼의 종류를 선택해 추가할 수 있습니다.",
	"deckHowToUseSettings_title": "UI 설정",
	"deckHowToUseSettings_description": "덱 UI의 상세 설정을 할 수 있습니다.",
	"deckHowToUseSwitchProfile_title": "프로파일 전환",
	"deckHowToUseSwitchProfile_description": "UI의 레이아웃을 프로파일로 저장하고 언제든지 전환할 수 있습니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profile",
	"deckDeleteProfile": "Delete profile",
	"deckAddColumn": "Add column",
	"settings": "Instellingen",
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Meldingen",
		"tl": "Tijdlijn",
		"antenna": "Antennes",
		"list": "Lijsten",
		"channel": "Kanalen",
		"mentions": "Vermeldingen",
		"direct": "Directe notities",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profil",
	"deckDeleteProfile": "Slett profil",
	"deckAddColumn": "Add column",
	"settings": "Innstillinger",
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Varsler",
		"tl": "Tidslinje",
		"antenna": "Antenner",
		"list": "Lister",
		"channel": "Kanaler",
		"mentions": "Mentions",
		"direct": "Direkte",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Er du sikker på at du vil slette \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profil",
	"deckDeleteProfile": "Usuń profil",
	"deckAddColumn": "Dodaj kolumnę",
	"settings": "Ustawienia",
	"deckColumnsLabels": {
		"main": "Główna",
		"widgets": "Widżety",
		"notifications": "Powiadomienia",
		"tl": "Oś czasu",
		"antenna": "Anteny",
		"list": "Listy",
		"channel": "Kanały",
		"mentions": "Wspomnienia",
		"direct": "Bezpośredni",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"deckIntroduction": "Crie a interface perfeita para você arranjando as colunas livremente!",
	"deckIntroduction2": "Clique no + à direita da tela para adicionar novas colunas quando quiser.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Perfil",
	"deckDeleteProfile": "Remover perfil",
	"deckAddColumn": "Adicionar coluna",
	"settings": "Configurações",
	"deckColumnsLabels": {
		"main": "Principal",
		"widgets": "Widgets",
		"notifications": "Notificações",
		"tl": "Timeline",
		"antenna": "Antenas",
		"list": "Listas",
		"channel": "Canais",
		"mentions": "Menções",
		"direct": "Notas diretas",
		"roleTimeline": "Linha do tempo do cargo",
		"chat": "Conversar com usuário"
	},
	"deleteAreYouSure": "Deseja excluir \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"deckIntroduction": "Создайте идеальный интерфейс расставляя колонки как угодно",
	"deckIntroduction2": "Чтобы добавлять колонки в любом месте, жмите «+» справа экрана.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Расстановка",
	"deckDeleteProfile": "Удаление расстановки",
	"deckAddColumn": "Добавить колонку",
	"settings": "Настройки",
	"deckColumnsLabels": {
		"main": "Основная",
		"widgets": "Виджеты",
		"notifications": "Уведомления",
		"tl": "Лента",
		"antenna": "Антенны",
		"list": "Списки",
		"channel": "Каналы",
		"mentions": "Упоминания",
		"direct": "Личное",
		"roleTimeline": "История Ролей",
		"chat": "Открыть личные сообщения"
	},
	"deleteAreYouSure": "Хотите удалить «{x}»?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"deckIntroduction": "Kombinujte stĺpce a vytvorte si svoje vlastné rozhranie!",
	"deckIntroduction2": "Stlačením tlačidla + v pravej časti obrazovky môžete kedykoľvek pridať stĺpce.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profil",
	"deckDeleteProfile": "Odstrániť profil",
	"deckAddColumn": "Pridať stĺpec",
	"settings": "Nastavenia",
	"deckColumnsLabels": {
		"main": "Hlavný",
		"widgets": "Widgety",
		"notifications": "Oznámenia",
		"tl": "Časová os",
		"antenna": "Antény",
		"list": "Zoznam",
		"channel": "Kanály",
		"mentions": "Zmienky",
		"direct": "Priame poznámky",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"deckIntroduction": "สร้างอินเทอร์เฟซที่สมบูรณ์แบบสำหรับคุณโดยจัดเรียงคอลัมน์ได้อย่างอิสระ!",
	"deckIntroduction2": "คลิกที่เครื่องหมาย + ทางขวาของหน้าจอเพื่อเพิ่มคอลัมน์ใหม่ทุกครั้งที่คุณต้องการ",
	"deckShowHowToUse": "แสดงวิธีใช้ UI",
	"deckProfile": "โปรไฟล์",
	"deckDeleteProfile": "ลบโปรไฟล์",
	"deckAddColumn": "เพิ่มคอลัมน์",
	"settings": "การตั้งค่า",
	"deckColumnsLabels": {
		"main": "หลัก",
		"widgets": "วิดเจ็ต",
		"notifications": "การเเจ้งเตือน",
		"tl": "ไทม์ไลน์",
		"antenna": "เสาอากาศ",
		"list": "รายการ",
		"channel": "ช่อง",
		"mentions": "กล่าวถึงคุณ",
		"direct": "ไดเร็กต์",
		"roleTimeline": "บทบาทไทม์ไลน์",
		"chat": "แชตเลย"
	},
	"deleteAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"deckHowToUseAddColumn_title": "เพิ่มคอลัมน์",
	"deckHowToUseAddColumn_description": "สามารถเลือกประเภทของคอลัมน์แล้วเพิ่มได้",
	"deckHowToUseSettings_title": "ตั้งค่า UI",
	"deckHowToUseSettings_description": "สามารถตั้งค่ารายละเอียดของ UI แบบเด็คได้",
	"deckHowToUseSwitchProfile_title": "สลับโปรไฟล์",
	"deckHowToUseSwitchProfile_description": "สามารถบันทึกเลย์เอาต์ของ UI เป็นโปรไฟล์ และสลับใช้งานได้ทุกเมื่อ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"deckIntroduction": "Sütunları serbestçe düzenleyerek size en uygun arayüzü oluşturun!",
	"deckIntroduction2": "Ekranın sağındaki + işaretine tıklayarak istediğin zaman yeni sütunlar ekleyebilirsin.",
	"deckShowHowToUse": "Kullanıcı arayüzü açıklamasını görüntüle",
	"deckProfile": "Profil",
	"deckDeleteProfile": "Profili sil",
	"deckAddColumn": "Sütun ekle",
	"settings": "Ayarlar",
	"deckColumnsLabels": {
		"main": "Ana",
		"widgets": "Widget'lar",
		"notifications": "Bildirimler",
		"tl": "Pano",
		"antenna": "Antenler",
		"list": "Liste",
		"channel": "Kanal",
		"mentions": "Bahsetmeler",
		"direct": "Doğrudan notlar",
		"roleTimeline": "Rol Pano",
		"chat": "Sohbet"
	},
	"deleteAreYouSure": "“{x}” öğesini silmek istediğinizden emin misin?",
	"deckHowToUseAddColumn_title": "Sütun ekle",
	"deckHowToUseAddColumn_description": "Sütun türlerini seçip ekleyebilirsiniz.",
	"deckHowToUseSettings_title": "Arayüz Yapılandırması",
	"deckHowToUseSettings_description": "Sekme kullanıcı arayüzünü ayrıntılı olarak yapılandırabilirsiniz.",
	"deckHowToUseSwitchProfile_title": "Profili Değiştir",
	"deckHowToUseSwitchProfile_description": "Kullanıcı arayüzü düzenlerini profil olarak kaydedebilir ve istediğiniz zaman bunlar arasında geçiş yapabilirsiniz."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"deckIntroduction": "Create the perfect interface for you by arranging columns freely!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Profile",
	"deckDeleteProfile": "Delete profile",
	"deckAddColumn": "Add column",
	"settings": "Settings",
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Notifications",
		"tl": "Timeline",
		"antenna": "Antennas",
		"list": "List",
		"channel": "Channel",
		"mentions": "Mentions",
		"direct": "Direct notes",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"deckIntroduction": "Створіть для себе ідеальний інтерфейс, вільно розташувавши стовпці!",
	"deckIntroduction2": "Click on the + on the right of the screen to add new columns whenever you want.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Обліковий запис",
	"deckDeleteProfile": "Видалити профіль",
	"deckAddColumn": "Додати стовпець",
	"settings": "Налаштування",
	"deckColumnsLabels": {
		"main": "Головна",
		"widgets": "Віджети",
		"notifications": "Сповіщення",
		"tl": "Стрічка",
		"antenna": "Антени",
		"list": "Списки",
		"channel": "Канали",
		"mentions": "Згадки",
		"direct": "Особисте",
		"roleTimeline": "Role Timeline",
		"chat": "Написати цьому користувачу"
	},
	"deleteAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"deckIntroduction": "Kết hợp các cột để tạo giao diện của riêng bạn!",
	"deckIntroduction2": "Bạn có thể thêm cột bất kỳ lúc nào bằng cách nhấn + ở bên phải màn hình.",
	"deckShowHowToUse": "UIの説明を見る",
	"deckProfile": "Hồ sơ",
	"deckDeleteProfile": "Xóa hồ sơ",
	"deckAddColumn": "Thêm cột",
	"settings": "Cài đặt",
	"deckColumnsLabels": {
		"main": "Chính",
		"widgets": "Tiện ích",
		"notifications": "Thông báo",
		"tl": "Bảng tin",
		"antenna": "Trạm phát sóng",
		"list": "Danh sách",
		"channel": "Kênh",
		"mentions": "Lượt nhắc",
		"direct": "Nhắn riêng",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deleteAreYouSure": "Bạn có chắc muốn xóa \"{x}\"?",
	"deckHowToUseAddColumn_title": "Add column",
	"deckHowToUseAddColumn_description": "You can select and add column types.",
	"deckHowToUseSettings_title": "UI Settings",
	"deckHowToUseSettings_description": "You can configure detailed settings for the deck UI.",
	"deckHowToUseSwitchProfile_title": "Profile Switching",
	"deckHowToUseSwitchProfile_description": "You can save UI layouts as profiles and switch between them at any time."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"deckIntroduction": "将各列进行组合以创建您自己的界面！",
	"deckIntroduction2": "可以随时通过屏幕右侧的 + 来添加列",
	"deckShowHowToUse": "查看用户界面说明",
	"deckProfile": "配置文件",
	"deckDeleteProfile": "删除配置文件",
	"deckAddColumn": "添加列",
	"settings": "设置",
	"deckColumnsLabels": {
		"main": "主列",
		"widgets": "小工具",
		"notifications": "通知",
		"tl": "时间线",
		"antenna": "天线",
		"list": "列表",
		"channel": "频道",
		"mentions": "提及",
		"direct": "指定用户",
		"roleTimeline": "角色时间线",
		"chat": "私信"
	},
	"deleteAreYouSure": "要删掉「{x}」吗？",
	"deckHowToUseAddColumn_title": "添加列",
	"deckHowToUseAddColumn_description": "可以选择要添加的列的类型。",
	"deckHowToUseSettings_title": "用户界面设置",
	"deckHowToUseSettings_description": "可以配置 Deck UI 的详细设置，",
	"deckHowToUseSwitchProfile_title": "切换配置文件",
	"deckHowToUseSwitchProfile_description": "将用户界面布局保存为配置文件，以便随时切换。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"deckIntroduction": "組合多個欄位，製作屬於自己的介面吧！",
	"deckIntroduction2": "您可以隨時按畫面右方的「+」新增欄位。",
	"deckShowHowToUse": "檢視使用者介面說明",
	"deckProfile": "個人檔案",
	"deckDeleteProfile": "刪除個人檔案",
	"deckAddColumn": "新增欄位",
	"settings": "設定",
	"deckColumnsLabels": {
		"main": "主列",
		"widgets": "小工具",
		"notifications": "通知",
		"tl": "時間軸",
		"antenna": "天線",
		"list": "清單",
		"channel": "頻道",
		"mentions": "提及",
		"direct": "指定使用者",
		"roleTimeline": "角色時間軸",
		"chat": "聊天"
	},
	"deleteAreYouSure": "確定要刪掉「{x}」嗎？",
	"deckHowToUseAddColumn_title": "新增欄位",
	"deckHowToUseAddColumn_description": "您可以選擇要新增的欄位類型。",
	"deckHowToUseSettings_title": "使用者介面設定",
	"deckHowToUseSettings_description": "您可以對多欄模式使用者介面做詳細設定。",
	"deckHowToUseSwitchProfile_title": "切換設定檔",
	"deckHowToUseSwitchProfile_description": "將使用者介面佈局儲存為設定檔，就可以隨時切換使用。"
}
</locale>
