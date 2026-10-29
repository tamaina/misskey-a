<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	class="_forceShrinkSpacer"
	:class="[$style.root, { [$style.paged]: isMainColumn, [$style.naked]: naked, [$style.active]: active, [$style.draghover]: draghover, [$style.dragging]: dragging, [$style.dropready]: dropready, [$style.withWallpaper]: withWallpaper }]"
	@dragover.prevent.stop="onDragover"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
>
	<header
		:class="[$style.header]"
		draggable="true"
		@click="goTop"
		@dragstart="onDragstart"
		@dragend="onDragend"
		@contextmenu.prevent.stop="onContextmenu"
		@wheel.passive="emit('headerWheel', $event)"
	>
		<svg viewBox="0 0 256 128" :class="$style.tabShape">
			<g transform="matrix(6.2431,0,0,6.2431,-677.417,-29.3839)">
				<path d="M149.512,4.707L108.507,4.707C116.252,4.719 118.758,14.958 118.758,14.958C118.758,14.958 121.381,25.283 129.009,25.209L149.512,25.209L149.512,4.707Z" style="fill:var(--MI_THEME-deckBg);"/>
			</g>
		</svg>
		<div :class="$style.color"></div>
		<button v-if="isStacked && !isMainColumn" :class="$style.toggleActive" class="_button" @click="toggleActive">
			<template v-if="active"><i class="ti ti-chevron-up"></i></template>
			<template v-else><i class="ti ti-chevron-down"></i></template>
		</button>
		<span :class="$style.title"><slot name="header"></slot></span>
		<svg viewBox="0 0 16 16" version="1.1" :class="$style.grabber">
			<path fill="currentColor" d="M10 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-4 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5-9a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
		</svg>
		<button v-tooltip="$locale.sfc.settings" :class="$style.menu" class="_button" @click.stop="showSettingsMenu"><i class="ti ti-dots"></i></button>
	</header>
	<div v-if="active" ref="body" :class="$style.body">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, provide, watch, useTemplateRef, ref, computed } from 'vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import { deckGlobalEvents, updateColumn, swapLeftColumn, swapRightColumn, swapUpColumn, swapDownColumn, stackLeftColumn, popRightColumn, removeColumn, swapColumn } from '@features/preferences/frontend/deck.js';
import * as os from '@features/ui/frontend/os.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { checkDragDataType, getDragData, setDragData } from '@features/ui/frontend/drag-and-drop.js';

provide('shouldHeaderThin', true);
provide('shouldOmitHeaderTitle', true);

const withWallpaper = prefer.s['deck.wallpaper'] != null;

const props = withDefaults(defineProps<{
	column: Column;
	isStacked?: boolean;
	naked?: boolean;
	handleScrollToTop?: boolean;
	menu?: MenuItem[];
	refresher?: () => Promise<void>;
}>(), {
	isStacked: false,
	naked: false,
	handleScrollToTop: true,
});

const emit = defineEmits<{
	(ev: 'headerWheel', ctx: WheelEvent): void;
	(ev: 'headerClick', ctx: MouseEvent): void;
}>();

const body = useTemplateRef('body');

const dragging = ref(false);
watch(dragging, v => deckGlobalEvents.emit(v ? 'column.dragStart' : 'column.dragEnd'));

const draghover = ref(false);
const dropready = ref(false);

const isMainColumn = computed(() => props.column.type === 'main');
const active = computed(() => props.column.active !== false);

onMounted(() => {
	deckGlobalEvents.on('column.dragStart', onOtherDragStart);
	deckGlobalEvents.on('column.dragEnd', onOtherDragEnd);
});

onBeforeUnmount(() => {
	deckGlobalEvents.off('column.dragStart', onOtherDragStart);
	deckGlobalEvents.off('column.dragEnd', onOtherDragEnd);
});

function onOtherDragStart() {
	dropready.value = true;
}

function onOtherDragEnd() {
	dropready.value = false;
}

function toggleActive() {
	if (!props.isStacked) return;
	updateColumn(props.column.id, {
		active: props.column.active == null ? false : !props.column.active,
	});
}

function getMenu() {
	const menuItems: MenuItem[] = [];

	if (props.menu) {
		menuItems.push(...props.menu);
	}

	if (props.refresher) {
		menuItems.push({
			icon: 'ti ti-refresh',
			text: $locale.value.sfc.reload,
			action: () => {
				if (props.refresher) {
					props.refresher();
				}
			},
		});
	}

	if (menuItems.length > 0) {
		menuItems.push({
			type: 'divider',
		});
	}

	menuItems.push({
		icon: 'ti ti-settings',
		text: $locale.value.sfc.deckConfigureColumn,
		action: async () => {
			const name = props.column.name ?? copyLocaleDictionary($locale.value.sfc.deckColumnsLabels)[props.column.type];
			const { canceled, result } = await os.form(name, {
				name: {
					type: 'string',
					label: $locale.value.sfc.name,
					default: props.column.name,
				},
				width: {
					type: 'number',
					label: $locale.value.sfc.width,
					description: $locale.value.sfc.deckUsedAsMinWidthWhenFlexible,
					default: props.column.width,
				},
				flexible: {
					type: 'boolean',
					label: $locale.value.sfc.deckFlexible,
					default: props.column.flexible ?? null,
				},
			});
			if (canceled) return;
			updateColumn(props.column.id, result);
		},
	});

	const flexibleRef = ref(props.column.flexible ?? false);

	watch(flexibleRef, flexible => {
		updateColumn(props.column.id, {
			flexible,
		});
	});

	menuItems.push({
		type: 'switch',
		icon: 'ti ti-arrows-horizontal',
		text: $locale.value.sfc.deckFlexible,
		ref: flexibleRef,
	});

	const moveToMenuItems: MenuItem[] = [];

	moveToMenuItems.push({
		icon: 'ti ti-arrow-left',
		text: $locale.value.sfc.deckSwapLeft,
		action: () => {
			swapLeftColumn(props.column.id);
		},
	}, {
		icon: 'ti ti-arrow-right',
		text: $locale.value.sfc.deckSwapRight,
		action: () => {
			swapRightColumn(props.column.id);
		},
	});

	if (props.isStacked) {
		moveToMenuItems.push({
			icon: 'ti ti-arrow-up',
			text: $locale.value.sfc.deckSwapUp,
			action: () => {
				swapUpColumn(props.column.id);
			},
		}, {
			icon: 'ti ti-arrow-down',
			text: $locale.value.sfc.deckSwapDown,
			action: () => {
				swapDownColumn(props.column.id);
			},
		});
	}

	menuItems.push({
		type: 'parent',
		text: $locale.value.sfc.move + '...',
		icon: 'ti ti-arrows-move',
		children: moveToMenuItems,
	}, {
		icon: 'ti ti-stack-2',
		text: $locale.value.sfc.deckStackLeft,
		action: () => {
			stackLeftColumn(props.column.id);
		},
	});

	if (props.isStacked) {
		menuItems.push({
			icon: 'ti ti-window-maximize',
			text: $locale.value.sfc.deckPopRight,
			action: () => {
				popRightColumn(props.column.id);
			},
		});
	}

	menuItems.push({ type: 'divider' }, {
		icon: 'ti ti-trash',
		text: $locale.value.sfc.remove,
		danger: true,
		action: () => {
			removeColumn(props.column.id);
		},
	});

	return menuItems;
}

function showSettingsMenu(ev: PointerEvent) {
	os.popupMenu(getMenu(), ev.currentTarget ?? ev.target);
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu(getMenu(), ev);
}

function goTop(ev: PointerEvent) {
	emit('headerClick', ev);
	if (!props.handleScrollToTop) return;

	if (body.value) {
		body.value.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}
}

function onDragstart(ev: DragEvent) {
	if (ev.dataTransfer == null) return;

	ev.dataTransfer.effectAllowed = 'move';
	setDragData(ev, 'deckColumn', props.column.id);

	// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
	// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
	window.setTimeout(() => {
		dragging.value = true;
	}, 10);
}

function onDragend(ev: DragEvent) {
	dragging.value = false;
}

function onDragover(ev: DragEvent) {
	if (ev.dataTransfer == null) return;

	// 自分自身がドラッグされている場合
	if (dragging.value) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = 'none';
	} else {
		const isDeckColumn = checkDragDataType(ev, ['deckColumn']);

		ev.dataTransfer.dropEffect = isDeckColumn ? 'move' : 'none';

		if (isDeckColumn) draghover.value = true;
	}
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev: DragEvent) {
	draghover.value = false;
	deckGlobalEvents.emit('column.dragEnd');

	const id = getDragData(ev, 'deckColumn');
	if (id != null) {
		swapColumn(props.column.id, id);
	}
}
</script>

<style lang="scss" module>
.root {
	--root-margin: 10px;
	--deckColumnHeaderHeight: 38px;

	height: 100%;
	overflow: clip;
	/**
	 * FIXME: Safari 26 で contain: layout を(含む)指定するとバグる
	 * https://github.com/misskey-dev/misskey/issues/16204#issuecomment-3265404776
	 * https://bugs.webkit.org/show_bug.cgi?id=297186
	 */
	// contain: strict;
	contain: size style paint;
	border-radius: 10px;

	&.draghover {
		&::after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--MI_THEME-focus);
		}
	}

	&.dragging {
		&::after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--MI_THEME-focus);
			opacity: 0.5;
		}
	}

	&.dropready {
		* {
			pointer-events: none;
		}
	}

	&:not(.active) {
		flex-basis: var(--deckColumnHeaderHeight);
		min-height: var(--deckColumnHeaderHeight);
		border-bottom-right-radius: 0;
	}

	&.naked {
		background: color(from var(--MI_THEME-bg) srgb r g b / 0.5) !important;

		> .header {
			background: transparent;
			box-shadow: none;
			color: var(--MI_THEME-fg);
		}

		> .body {
			background: transparent !important;
			scrollbar-color: var(--MI_THEME-scrollbarHandle) transparent;
		}
	}

	&.withWallpaper {
		&.naked {
			background: color(from var(--MI_THEME-bg) srgb r g b / 0.75) !important;
			-webkit-backdrop-filter: var(--MI-blur, blur(10px));
			backdrop-filter: var(--MI-blur, blur(10px));

			> .header {
				color: light-dark(#000000bf, #ffffffbf);
			}
		}

		.tabShape {
			display: none;
		}
	}

	&.paged {
		background: var(--MI_THEME-bg) !important;

		> .body {
			background: var(--MI_THEME-bg) !important;
			scrollbar-color: var(--MI_THEME-scrollbarHandle) transparent;
		}
	}
}

.header {
	position: relative;
	display: flex;
	z-index: 2;
	line-height: var(--deckColumnHeaderHeight);
	height: var(--deckColumnHeaderHeight);
	padding: 0 16px 0 30px;
	font-size: 0.9em;
	color: var(--MI_THEME-panelHeaderFg);
	background: var(--MI_THEME-panelHeaderBg);
	cursor: pointer;
	user-select: none;
}

@container style(--MI_THEME-panelHeaderBg: var(--MI_THEME-panel)) {
	.header {
		box-shadow: 0 0.5px 0 0 light-dark(#0002, #fff2);
	}
}

.color {
	position: absolute;
	top: 12px;
	left: 12px;
	width: 3px;
	height: calc(100% - 24px);
	background: var(--MI_THEME-accent);
	border-radius: 999px;
}

.tabShape {
	position: absolute;
	top: 0;
	right: -8px;
	width: auto;
	height: calc(100% - 6px);
}

.title {
	display: inline-block;
	align-items: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
}

.toggleActive,
.menu {
	z-index: 1;
	width: var(--deckColumnHeaderHeight);
	line-height: var(--deckColumnHeaderHeight);
}

.toggleActive {
	margin-left: -16px;
}

.grabber {
	margin-left: auto;
	margin-right: 10px;
	padding: 8px 8px;
	box-sizing: border-box;
	height: var(--deckColumnHeaderHeight);
	cursor: move;
	user-select: none;
	opacity: 0.5;
}

.menu {
	margin-right: -16px;
}

.body {
	height: calc(100% - var(--deckColumnHeaderHeight));
	overflow-y: auto;
	overflow-x: clip;
	overscroll-behavior-y: contain;
	box-sizing: border-box;
	container-type: size;
	background-color: var(--MI_THEME-bg);
	scrollbar-color: var(--MI_THEME-scrollbarHandle) var(--MI_THEME-panel);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"settings": "الاعدادات",
	"reload": "انعش",
	"deckConfigureColumn": "Column settings",
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
	"name": "الإسم",
	"width": "العرض",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "التحريك إلى اليسار",
	"deckSwapRight": "التحريك إلى اليمين",
	"deckSwapUp": "التحريك إلى الأعلى",
	"deckSwapDown": "التحريك إلى الأسفل",
	"move": "أنقل",
	"deckStackLeft": "Stack on left column",
	"deckPopRight": "Pop column to the right",
	"remove": "حذف"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"settings": "Preferències",
	"reload": "Actualitzar",
	"deckConfigureColumn": "Configuració de columnes",
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
	"name": "Nom",
	"width": "Amplada",
	"deckUsedAsMinWidthWhenFlexible": "L'amplada mínima es farà servir quan \"Ajust automàtic de l'amplada\" estigui activat",
	"deckFlexible": "Ajust automàtic de l'amplada",
	"deckSwapLeft": "Mou a l’esquerra",
	"deckSwapRight": "Mou a la dreta",
	"deckSwapUp": "Mou cap amunt",
	"deckSwapDown": "Mou cap avall",
	"move": "Mou",
	"deckStackLeft": "Pila a la columna esquerra",
	"deckPopRight": "Col·loca a la dreta",
	"remove": "Eliminar"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"settings": "Nastavení",
	"reload": "Aktualizovat",
	"deckConfigureColumn": "Nastavení sloupců",
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
	"name": "Jméno",
	"width": "Šířka",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Prohodit s levým sloupcem",
	"deckSwapRight": "Prohodit s pravým sloupcem",
	"deckSwapUp": "Prohodit s výše uvedeným sloupcem",
	"deckSwapDown": "Prohodit s níže uvedeným sloupcem",
	"move": "Přesunout",
	"deckStackLeft": "Nahromadit v levém sloupci",
	"deckPopRight": "Popnout sloupec na pravou stranu",
	"remove": "Smazat"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"settings": "Settings",
	"reload": "Refresh",
	"deckConfigureColumn": "Column settings",
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
	"name": "Name",
	"width": "Width",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Swap with the left column",
	"deckSwapRight": "Swap with the right column",
	"deckSwapUp": "Swap with the above column",
	"deckSwapDown": "Swap with the below column",
	"move": "Move",
	"deckStackLeft": "Stack on left column",
	"deckPopRight": "Pop column to the right",
	"remove": "Delete"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"settings": "Einstellungen",
	"reload": "Aktualisieren",
	"deckConfigureColumn": "Spalteneinstellungen",
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
	"name": "Name",
	"width": "Breite",
	"deckUsedAsMinWidthWhenFlexible": "Ist \"Automatische Breitenanpassung\" aktiviert, wird hierfür die minimale Breite verwendet",
	"deckFlexible": "Automatische Breitenanpassung",
	"deckSwapLeft": "Mit linker Spalte tauschen",
	"deckSwapRight": "Mit rechter Spalte tauschen",
	"deckSwapUp": "Mit oberer Spalte tauschen",
	"deckSwapDown": "Mit unterer Spalte tauschen",
	"move": "Verschieben",
	"deckStackLeft": "Auf linke Spalte stapeln",
	"deckPopRight": "Nach rechts vom Stapel nehmen",
	"remove": "Löschen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"settings": "Settings",
	"reload": "Refresh",
	"deckConfigureColumn": "Column settings",
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
	"name": "Name",
	"width": "Width",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Swap with the left column",
	"deckSwapRight": "Swap with the right column",
	"deckSwapUp": "Swap with the above column",
	"deckSwapDown": "Swap with the below column",
	"move": "Move",
	"deckStackLeft": "Stack on left column",
	"deckPopRight": "Pop column to the right",
	"remove": "Delete"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"settings": "Configuración",
	"reload": "Recargar",
	"deckConfigureColumn": "Ajustes de columna",
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
	"name": "Nombre",
	"width": "Ancho",
	"deckUsedAsMinWidthWhenFlexible": "Se usará el ancho mínimo cuando la opción \"Autoajustar ancho\" esté habilitada",
	"deckFlexible": "Autoajustar ancho",
	"deckSwapLeft": "Mover a la izquierda",
	"deckSwapRight": "Mover a la derecha",
	"deckSwapUp": "Mover arriba",
	"deckSwapDown": "Mover abajo",
	"move": "Mover",
	"deckStackLeft": "Apilar a la izquierda",
	"deckPopRight": "Sacar a la derecha",
	"remove": "Borrar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"settings": "Paramètres",
	"reload": "Rafraîchir",
	"deckConfigureColumn": "Configuration de la colonne",
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
	"name": "Nom",
	"width": "Largeur",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Ajuster automatiquement la largeur",
	"deckSwapLeft": "Déplacer à gauche",
	"deckSwapRight": "Déplacer à droite",
	"deckSwapUp": "Déplacer vers le haut",
	"deckSwapDown": "Déplacer vers le bas",
	"move": "Déplacer",
	"deckStackLeft": "Empiler à gauche",
	"deckPopRight": "Extraire à droite",
	"remove": "Supprimer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"settings": "Pengaturan",
	"reload": "Muat ulang",
	"deckConfigureColumn": "Atur kolom",
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
	"name": "Nama",
	"width": "Lebar",
	"deckUsedAsMinWidthWhenFlexible": "Lebar minimum akan digunakan untuk ini ketika opsi \"Atur-otomatis lebar\" dinyalakan",
	"deckFlexible": "Atur-otomatis lebar",
	"deckSwapLeft": "Pindah ke kiri",
	"deckSwapRight": "Pindah ke kanan",
	"deckSwapUp": "Pindah ke atas",
	"deckSwapDown": "Pindah ke bawah",
	"move": "Pindah",
	"deckStackLeft": "Tumpukkan di kolom kiri",
	"deckPopRight": "Keluarkan di kanan",
	"remove": "Hapus"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"settings": "Impostazioni",
	"reload": "Ricarica",
	"deckConfigureColumn": "Impostazioni colonna",
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
	"name": "Nome",
	"width": "Larghezza",
	"deckUsedAsMinWidthWhenFlexible": "Se \"larghezza flessibile\" è abilitato, questa diventa la larghezza minima",
	"deckFlexible": "Larghezza flessibile",
	"deckSwapLeft": "Sposta a sinistra",
	"deckSwapRight": "Sposta a destra",
	"deckSwapUp": "Sposta in alto",
	"deckSwapDown": "Sposta in basso",
	"move": "Sposta",
	"deckStackLeft": "Impila a sinistra",
	"deckPopRight": "Estrai a destra",
	"remove": "Elimina"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"settings": "設定",
	"reload": "リロード",
	"deckConfigureColumn": "カラムの設定",
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
	"name": "名前",
	"width": "幅",
	"deckUsedAsMinWidthWhenFlexible": "「幅を自動調整」が有効の場合、これが幅の最小値となります",
	"deckFlexible": "幅を自動調整",
	"deckSwapLeft": "左に移動",
	"deckSwapRight": "右に移動",
	"deckSwapUp": "上に移動",
	"deckSwapDown": "下に移動",
	"move": "移動",
	"deckStackLeft": "左にスタック",
	"deckPopRight": "右に出す",
	"remove": "削除"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"settings": "設定",
	"reload": "リロード",
	"deckConfigureColumn": "カラムの設定",
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
	"name": "名前",
	"width": "幅",
	"deckUsedAsMinWidthWhenFlexible": "「幅を自動調整」が有効の場合、これが幅の最小値となるで",
	"deckFlexible": "幅を自動調整",
	"deckSwapLeft": "左に移動",
	"deckSwapRight": "右に移動",
	"deckSwapUp": "上に移動",
	"deckSwapDown": "下に移動",
	"move": "移すで",
	"deckStackLeft": "左に重ねる",
	"deckPopRight": "右に出す",
	"remove": "ほかす"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"settings": "Iɣewwaṛen",
	"reload": "Refresh",
	"deckConfigureColumn": "Column settings",
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
	"name": "Name",
	"width": "Width",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Swap with the left column",
	"deckSwapRight": "Swap with the right column",
	"deckSwapUp": "Swap with the above column",
	"deckSwapDown": "Swap with the below column",
	"move": "Move",
	"deckStackLeft": "Stack on left column",
	"deckPopRight": "Pop column to the right",
	"remove": "Kkes"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"settings": "ಸಿದ್ಧತೆಗಳು",
	"reload": "Refresh",
	"deckConfigureColumn": "Column settings",
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
	"name": "Name",
	"width": "Width",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Swap with the left column",
	"deckSwapRight": "Swap with the right column",
	"deckSwapUp": "Swap with the above column",
	"deckSwapDown": "Swap with the below column",
	"move": "Move",
	"deckStackLeft": "Stack on left column",
	"deckPopRight": "Pop column to the right",
	"remove": "ಅಳಿಸು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"settings": "설정",
	"reload": "새로고침",
	"deckConfigureColumn": "칼럼 설정",
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
	"name": "이름",
	"width": "폭",
	"deckUsedAsMinWidthWhenFlexible": "'폭 자동 조정'이 활성화된 경우 최소 폭으로 사용됩니다",
	"deckFlexible": "폭 자동 조정",
	"deckSwapLeft": "왼쪽으로 이동",
	"deckSwapRight": "오른쪽으로 이동",
	"deckSwapUp": "위로 이동",
	"deckSwapDown": "아래로 이동",
	"move": "이동",
	"deckStackLeft": "왼쪽에 쌓기",
	"deckPopRight": "오른쪽으로 빼기",
	"remove": "삭제"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"settings": "Instellingen",
	"reload": "Verversen",
	"deckConfigureColumn": "Column settings",
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
	"name": "Naam",
	"width": "Breedte",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Swap with the left column",
	"deckSwapRight": "Swap with the right column",
	"deckSwapUp": "Swap with the above column",
	"deckSwapDown": "Swap with the below column",
	"move": "Move",
	"deckStackLeft": "Stack on left column",
	"deckPopRight": "Pop column to the right",
	"remove": "Verwijderen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"settings": "Innstillinger",
	"reload": "Refresh",
	"deckConfigureColumn": "Column settings",
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
	"name": "Navn",
	"width": "Width",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Flytt til venstre",
	"deckSwapRight": "Flytt til høyre",
	"deckSwapUp": "Flytt opp",
	"deckSwapDown": "Flytt ned",
	"move": "Flytt",
	"deckStackLeft": "Stack on left column",
	"deckPopRight": "Pop column to the right",
	"remove": "Slett"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"settings": "Ustawienia",
	"reload": "Odśwież",
	"deckConfigureColumn": "Ustawienia kolumny",
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
	"name": "Nazwa",
	"width": "Szerokość",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Przesuń w lewo",
	"deckSwapRight": "Przesuń w prawo",
	"deckSwapUp": "Zamień z powyższym",
	"deckSwapDown": "Zamień z poniższym",
	"move": "Przenieś",
	"deckStackLeft": "Przypnij do lewej",
	"deckPopRight": "Odepnij w prawo",
	"remove": "Usuń"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"settings": "Configurações",
	"reload": "Recarregar",
	"deckConfigureColumn": "Configurar coluna",
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
	"name": "Nome",
	"width": "Largura",
	"deckUsedAsMinWidthWhenFlexible": "A largura mínima será usada para isso quando o \"Ajuste automático da largura\" estiver ativado",
	"deckFlexible": "Ajuste automático da largura",
	"deckSwapLeft": "Trocar de posição com a coluna à esquerda",
	"deckSwapRight": "Trocar de posição com a coluna à direita",
	"deckSwapUp": "Trocar de posição com a coluna acima",
	"deckSwapDown": "Trocar de posição com a coluna abaixo",
	"move": "Mover",
	"deckStackLeft": "Empilhar na coluna à esquerda",
	"deckPopRight": "Acoplar coluna à direita",
	"remove": "Remover"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"settings": "Настройки",
	"reload": "Перезагрузить",
	"deckConfigureColumn": "Настройки колонок",
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
	"name": "Название",
	"width": "Ширина",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Переставить левее",
	"deckSwapRight": "Переставить правее",
	"deckSwapUp": "Переставить выше",
	"deckSwapDown": "Переставить ниже",
	"move": "Переместить",
	"deckStackLeft": "В столбик влево",
	"deckPopRight": "Из столбика вправо",
	"remove": "Удалить"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"settings": "Nastavenia",
	"reload": "Obnoviť",
	"deckConfigureColumn": "Nastavenie stĺpcov",
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
	"name": "Názov",
	"width": "Šírka",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Vymeniť vľavo",
	"deckSwapRight": "Vymeniť vpravo",
	"deckSwapUp": "Vymeniť hore",
	"deckSwapDown": "Vymeniť s nasledujúcim",
	"move": "Pohyb",
	"deckStackLeft": "Priložiť do ľavého stĺpca",
	"deckPopRight": "Vybrať napravo",
	"remove": "Odstrániť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"settings": "การตั้งค่า",
	"reload": "รีโหลด",
	"deckConfigureColumn": "ตั้งค่าคอลัมน์",
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
	"name": "ชื่อ",
	"width": "ความกว้าง",
	"deckUsedAsMinWidthWhenFlexible": "ความกว้างขั้นต่ำนั้นจะถูกใช้งานสำหรับสิ่งนี้เมื่อเปิดใช้งานตัวเลือก \"ปรับความกว้างอัตโนมัติ\" หากเลือกเปิดใช้งานแล้ว",
	"deckFlexible": "ปรับความกว้างอัตโนมัติ",
	"deckSwapLeft": "ขยับไปทางซ้าย",
	"deckSwapRight": "ขยับไปทางขวา",
	"deckSwapUp": "เลื่อนขึ้น",
	"deckSwapDown": "เลื่อนลง",
	"move": "ย้าย",
	"deckStackLeft": "กองกับคอลัมน์ด้านซ้าย",
	"deckPopRight": "ป๊อปคอลัมน์ไปทางขวา",
	"remove": "ลบ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"settings": "Ayarlar",
	"reload": "Yenile",
	"deckConfigureColumn": "Sütun ayarları",
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
	"name": "İsim",
	"width": "Genişlik",
	"deckUsedAsMinWidthWhenFlexible": "“Otomatik genişlik ayarı” seçeneği etkinleştirildiğinde, bunun için minimum genişlik kullanılacak.",
	"deckFlexible": "Otomatik genişlik ayarı",
	"deckSwapLeft": "Sol sütunla değiştir",
	"deckSwapRight": "Sağ sütunla değiştir",
	"deckSwapUp": "Yukarıdaki sütunla değiştir",
	"deckSwapDown": "Aşağıdaki sütunla değiştir",
	"move": "Taşı",
	"deckStackLeft": "Sol sütunda yığın",
	"deckPopRight": "Sağdaki pop sütunu",
	"remove": "Sil"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"settings": "Settings",
	"reload": "Refresh",
	"deckConfigureColumn": "Column settings",
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
	"name": "Name",
	"width": "Width",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Swap with the left column",
	"deckSwapRight": "Swap with the right column",
	"deckSwapUp": "Swap with the above column",
	"deckSwapDown": "Swap with the below column",
	"move": "Move",
	"deckStackLeft": "Stack on left column",
	"deckPopRight": "Pop column to the right",
	"remove": "ئۆچۈرۈش"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"settings": "Налаштування",
	"reload": "Оновити",
	"deckConfigureColumn": "Column settings",
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
	"name": "Ім'я",
	"width": "Ширина",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Пересунути ліворуч",
	"deckSwapRight": "Пересунути праворуч",
	"deckSwapUp": "Пересунути вгору",
	"deckSwapDown": "Пересунути вниз",
	"move": "Пересунути",
	"deckStackLeft": "У стовпчик вліво",
	"deckPopRight": "Витягнути вправо",
	"remove": "Видалити"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"settings": "Cài đặt",
	"reload": "Tải lại",
	"deckConfigureColumn": "Cài đặt cột",
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
	"name": "Tên",
	"width": "Chiều rộng",
	"deckUsedAsMinWidthWhenFlexible": "Minimum width will be used for this when the \"Auto-adjust width\" option is enabled",
	"deckFlexible": "Auto-adjust width",
	"deckSwapLeft": "Hoán đổi với cột bên trái",
	"deckSwapRight": "Hoán đổi với cột bên phải",
	"deckSwapUp": "Hoán đổi với cột trên",
	"deckSwapDown": "Hoán đổi với cột dưới",
	"move": "Di chuyển",
	"deckStackLeft": "Xếp chồng với cột bên trái",
	"deckPopRight": "Xếp chồng với cột bên trái",
	"remove": "Xóa"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"settings": "设置",
	"reload": "刷新",
	"deckConfigureColumn": "列设置",
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
	"name": "名称",
	"width": "宽度",
	"deckUsedAsMinWidthWhenFlexible": "如果启用 “自适应宽度”，此为最小宽度",
	"deckFlexible": "自适应宽度",
	"deckSwapLeft": "向左移动",
	"deckSwapRight": "向右移动",
	"deckSwapUp": "向上移动",
	"deckSwapDown": "向下移动",
	"move": "移动",
	"deckStackLeft": "向左折叠",
	"deckPopRight": "向右弹出",
	"remove": "删除"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"settings": "設定",
	"reload": "重新整理",
	"deckConfigureColumn": "欄位的設定",
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
	"name": "名稱",
	"width": "寬度",
	"deckUsedAsMinWidthWhenFlexible": "如果啟用「自動調整寬度」，此為最小寬度",
	"deckFlexible": "自動調整寬度",
	"deckSwapLeft": "向左移動",
	"deckSwapRight": "向右移動",
	"deckSwapUp": "往上移動",
	"deckSwapDown": "往下移動",
	"move": "移動 ",
	"deckStackLeft": "向左折疊",
	"deckPopRight": "向右彈出",
	"remove": "刪除"
}
</locale>
