<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #default>
		<div :class="$style.root" class="_gaps">
			<MkFolder>
				<template #icon><i class="ti ti-search"></i></template>
				<template #label>{{ $locale.sfc.customEmojisManagerGridCommonSearchSettings }}</template>
				<template #caption>
					{{ $locale.sfc.customEmojisManagerGridCommonSearchSettingCaption }}
				</template>

				<div class="_gaps">
					<div :class="[[spMode ? $style.searchAreaSp : $style.searchArea]]">
						<MkInput
							v-model="queryName"
							type="search"
							autocapitalize="off"
							:class="[$style.col1, $style.row1]"
							@enter="onSearchRequest"
						>
							<template #label>name</template>
						</MkInput>
						<MkInput
							v-model="queryHost"
							type="search"
							autocapitalize="off"
							:class="[$style.col2, $style.row1]"
							@enter="onSearchRequest"
						>
							<template #label>host</template>
						</MkInput>
						<MkInput
							v-model="queryLicense"
							type="search"
							autocapitalize="off"
							:class="[$style.col3, $style.row1]"
							@enter="onSearchRequest"
						>
							<template #label>license</template>
						</MkInput>

						<MkInput
							v-model="queryUri"
							type="search"
							autocapitalize="off"
							:class="[$style.col1, $style.row2]"
							@enter="onSearchRequest"
						>
							<template #label>uri</template>
						</MkInput>
						<MkInput
							v-model="queryPublicUrl"
							type="search"
							autocapitalize="off"
							:class="[$style.col2, $style.row2]"
							@enter="onSearchRequest"
						>
							<template #label>publicUrl</template>
						</MkInput>
					</div>

					<hr>

					<MkFolder :spacerMax="8" :spacerMin="8">
						<template #icon><i class="ti ti-arrows-sort"></i></template>
						<template #label>{{ $locale.sfc.customEmojisManagerGridCommonSortOrder }}</template>
						<MkSortOrderEditor
							:baseOrderKeyNames="gridSortOrderKeys"
							:currentOrders="sortOrders"
							@update="onSortOrderUpdate"
						/>
					</MkFolder>

					<MkInput
						v-model="queryLimit"
						type="number"
						:max="100"
					>
						<template #label>{{ $locale.sfc.customEmojisManagerGridCommonSearchLimit }}</template>
					</MkInput>

					<div :class="[[spMode ? $style.searchButtonsSp : $style.searchButtons]]">
						<MkButton primary @click="onSearchRequest">
							{{ $locale.sfc.search }}
						</MkButton>
						<MkButton @click="onQueryResetButtonClicked">
							{{ $locale.sfc.reset }}
						</MkButton>
					</div>
				</div>
			</MkFolder>

			<MkFolder>
				<template #icon><i class="ti ti-notes"></i></template>
				<template #label>{{ $locale.sfc.customEmojisManagerGridCommonRegistrationLogs }}</template>
				<template #caption>
					{{ $locale.sfc.customEmojisManagerGridCommonRegistrationLogsCaption }}
				</template>
				<XRegisterLogs :logs="requestLogs"/>
			</MkFolder>

			<component :is="loadingHandler.component.value" v-if="loadingHandler.showing.value"/>
			<template v-else>
				<div v-if="gridItems.length === 0" style="text-align: center">
					{{ $locale.sfc.customEmojisManagerLocalListEmojisNothing }}
				</div>

				<template v-else>
					<div v-if="gridItems.length > 0" :class="$style.gridArea">
						<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
					</div>

					<div :class="$style.footer">
						<div>
							<!-- レイアウト調整用のスペース -->
						</div>

						<div :class="$style.center">
							<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>
						</div>

						<div :class="$style.right">
							<MkButton primary @click="onImportClicked">
								{{
									$locale.sfc.customEmojisManagerRemoteImportEmojisButton
								}} ({{ checkedItemsCount }})
							</MkButton>
						</div>
					</div>
				</template>
			</template>
		</div>
	</template>
</MkStickyContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useCssModule } from 'vue';
import * as Misskey from 'misskey-js';
import type { GridSortOrderKey, RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';
import type { GridCellValueChangeEvent, GridEvent } from '@features/ui/frontend/components/grid/grid-event.js';
import type { GridSetting } from '@features/ui/frontend/components/grid/grid.js';
import type { SortOrder } from '@features/preferences/frontend/components/MkSortOrderEditor.define.js';
import MkRemoteEmojiEditDialog from '@features/emojis/frontend/components/MkRemoteEmojiEditDialog.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkGrid from '@features/ui/frontend/components/grid/MkGrid.vue';
import { emptyStrToUndefined, gridSortOrderKeys } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import XRegisterLogs from '@features/emojis/frontend/pages/admin/custom-emojis-manager.logs.vue';
import * as os from '@features/ui/frontend/os.js';
import { deviceKind } from '@features/ui/frontend/utility/device-kind.js';
import MkPagingButtons from '@features/ui/frontend/components/MkPagingButtons.vue';
import MkSortOrderEditor from '@features/preferences/frontend/components/MkSortOrderEditor.vue';
import { useLoading } from '@features/ui/frontend/composables/use-loading.js';

type GridItem = {
	checked: boolean;
	id: string;
	url: string;
	name: string;
	host: string;
};

function setupGrid(): GridSetting {
	const $style = useCssModule();

	return {
		row: {
			// グリッドの行数をあらかじめ100行確保する
			minimumDefinitionCount: 100,
			styleRules: [
				{
					// チェックされたら背景色を変える
					condition: ({ row }) => gridItems.value[row.index].checked,
					applyStyle: { className: $style.changedRow },
				},
			],
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerRemoteImportSelectionRows,
						icon: 'ti ti-download',
						action: async () => {
							const targets = context.rangedRows.map(it => gridItems.value[it.index]);
							await importEmojis(targets);
						},
					},
				];
			},
		},
		cols: [
			{ bindTo: 'checked', icon: 'ti-download', type: 'boolean', editable: true, width: 34 },
			{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto' },
			{ bindTo: 'name', title: 'name', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'host', title: 'host', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'license', title: 'license', type: 'text', editable: false, width: 200 },
			{ bindTo: 'uri', title: 'uri', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'publicUrl', title: 'publicUrl', type: 'text', editable: false, width: 'auto' },
		],
		cells: {
			contextMenuFactory: (col, row, value, context) => {
				return [
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerRemoteSelectionRowDetail,
						icon: 'ti ti-info-circle',
						action: async () => {
							const target = customEmojis.value[row.index];
							const { dispose } = os.popup(MkRemoteEmojiEditDialog, {
								emoji: {
									id: target.id,
									name: target.name,
									host: target.host!,
									license: target.license,
									url: target.publicUrl,
								},
							}, {
								done: () => {
									dispose();
								},
								closed: () => {
									dispose();
								},
							});
						},
					},
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerRemoteImportSelectionRangesRows,
						icon: 'ti ti-download',
						action: async () => {
							const targets = context.rangedCells.map(it => gridItems.value[it.row.index]);
							await importEmojis(targets);
						},
					},
				];
			},
		},
	};
}

const loadingHandler = useLoading();

const customEmojis = ref<Misskey.entities.EmojiDetailedAdmin[]>([]);
const allPages = ref<number>(0);
const currentPage = ref<number>(0);

const queryName = ref<string | null>(null);
const queryHost = ref<string | null>(null);
const queryLicense = ref<string | null>(null);
const queryUri = ref<string | null>(null);
const queryPublicUrl = ref<string | null>(null);
const queryLimit = ref<number>(100);
const previousQuery = ref<string | undefined>(undefined);
const sortOrders = ref<SortOrder<GridSortOrderKey>[]>([]);
const requestLogs = ref<RequestLogItem[]>([]);

const gridItems = ref<GridItem[]>([]);

const spMode = computed(() => ['smartphone', 'tablet'].includes(deviceKind));
const checkedItemsCount = computed(() => gridItems.value.filter(it => it.checked).length);

function onSortOrderUpdate(_sortOrders: SortOrder<GridSortOrderKey>[]) {
	sortOrders.value = _sortOrders;
}

async function onSearchRequest() {
	await refreshCustomEmojis();
}

function onQueryResetButtonClicked() {
	queryName.value = null;
	queryHost.value = null;
	queryLicense.value = null;
	queryUri.value = null;
	queryPublicUrl.value = null;
}

async function onPageChanged(pageNumber: number) {
	currentPage.value = pageNumber;
	await refreshCustomEmojis();
}

async function onImportClicked() {
	const targets = gridItems.value.filter(it => it.checked);
	await importEmojis(targets);
}

function onGridEvent(event: GridEvent) {
	switch (event.type) {
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
	}
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		(gridItems.value[row.index] as any)[column.setting.bindTo] = newValue;
	}
}

async function importEmojis(targets: GridItem[]) {
	const confirm = await os.confirm({
		type: 'info',
		title: $locale.value.sfc.customEmojisManagerRemoteConfirmImportEmojisTitle,
		text: interpolateLocaleParameters($locale.value.sfc.customEmojisManagerRemoteConfirmImportEmojisDescription, { count: targets.length }),
	});

	if (confirm.canceled) {
		return;
	}

	const result = await os.promiseDialog(
		Promise.all(
			targets.map(item =>
				misskeyApi(
					'admin/emoji/copy',
					{
						emojiId: item.id!,
					})
					.then(() => ({ item, success: true, err: undefined }))
					.catch(err => ({ item, success: false, err })),
			),
		),
	);
	const failedItems = result.filter(it => !it.success);

	if (failedItems.length > 0) {
		await os.alert({
			type: 'error',
			title: $locale.value.sfc.somethingHappened,
			text: $locale.value.sfc.customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription,
		});
	}

	requestLogs.value = result.map(it => ({
		failed: !it.success,
		url: it.item.url,
		name: it.item.name,
		error: it.err ? JSON.stringify(it.err) : undefined,
	}));

	await refreshCustomEmojis();
}

async function refreshCustomEmojis() {
	const query: Misskey.entities.V2AdminEmojiListRequest['query'] = {
		name: emptyStrToUndefined(queryName.value),
		host: emptyStrToUndefined(queryHost.value),
		license: emptyStrToUndefined(queryLicense.value),
		uri: emptyStrToUndefined(queryUri.value),
		publicUrl: emptyStrToUndefined(queryPublicUrl.value),
		hostType: 'remote',
	};

	if (JSON.stringify(query) !== previousQuery.value) {
		currentPage.value = 1;
	}

	const result = await loadingHandler.scope(() => misskeyApi('v2/admin/emoji/list', {
		limit: queryLimit.value,
		query: query,
		page: currentPage.value,
		sortKeys: sortOrders.value.map(({ key, direction }) => `${direction}${key}`) as never[],
	}));

	customEmojis.value = result.emojis;
	allPages.value = result.allPages;
	previousQuery.value = JSON.stringify(query);
	gridItems.value = customEmojis.value.map(it => ({
		checked: false,
		id: it.id,
		url: it.publicUrl,
		name: it.name,
		license: it.license,
		host: it.host!,
	}));
}

onMounted(async () => {
	await refreshCustomEmojis();
});
</script>

<style module lang="scss">
.row1 {
	grid-row: 1 / 2;
}

.row2 {
	grid-row: 2 / 3;
}

.col1 {
	grid-column: 1 / 2;
}

.col2 {
	grid-column: 2 / 3;
}

.col3 {
	grid-column: 3 / 4;
}

.root {
	padding: 16px;
}

.changedRow {
	background-color: var(--MI_THEME-infoBg) !important;
}

.searchArea {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 16px;
}

.searchButtons {
	display: flex;
	justify-content: flex-end;
	align-items: flex-end;
	gap: 8px;
}

.searchButtonsSp {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
}

.searchAreaSp {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.gridArea {
	padding-top: 8px;
	padding-bottom: 8px;
}

.pages {
	display: flex;
	justify-content: center;
	align-items: center;

	button {
		background-color: var(--MI_THEME-buttonBg);
		border-radius: 9999px;
		border: none;
		margin: 0 4px;
		padding: 8px;
	}
}

.footer {
	background-color: var(--MI_THEME-bg);

	position: sticky;
	left:0;
	bottom:0;
	z-index: 1;
	// stickyで追従させる都合上、フッター自身でpaddingを持つ必要があるため、親要素で画一的に指定している分をネガティブマージンで相殺している
	margin-top: calc(var(--MI-margin) * -1);
	margin-bottom: calc(var(--MI-margin) * -1);
	padding-top: var(--MI-margin);
	padding-bottom: var(--MI-margin);

	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;

	& .center {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	& .right {
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "البحث",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "حدث خطأ",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"customEmojisManagerGridCommonSearchSettings": "Configuració del cercador",
	"customEmojisManagerGridCommonSearchSettingCaption": "Defineix criteris de cerca detallats.",
	"customEmojisManagerGridCommonSortOrder": "Ordenar",
	"customEmojisManagerGridCommonSearchLimit": "Nombre de pantalles",
	"search": "Cercar",
	"reset": "Reiniciar",
	"customEmojisManagerGridCommonRegistrationLogs": "Registres d'inscripcions ",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Quan s'actualitzin o s'esborrin emojis es mostrarà un registre. Desapareixeran quan s'actualitzin, s'esborrin, visitis una nova pàgina o la recarreguis.",
	"customEmojisManagerLocalListEmojisNothing": "No hi ha Emojis registrats",
	"customEmojisManagerRemoteImportEmojisButton": "Importar els Emojis marcats",
	"customEmojisManagerRemoteImportSelectionRows": "Importar les files seleccionades",
	"customEmojisManagerRemoteSelectionRowDetail": "Detall de la línia seleccionada",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Importar les files de la selecció ",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Importar Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Importar {count} Emojis d'una adreça remota. Tingues cura de les llicències dels Emojis. Vols importar-los?",
	"somethingHappened": "S'ha produït un error",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "No s'ha pogut actualitzar o esborrar l'emoji. Si us plau, dona una ullada al registre per més detalls."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Vyhledávání",
	"reset": "Obnovit",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Search",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"customEmojisManagerGridCommonSearchSettings": "Sucheinstellungen",
	"customEmojisManagerGridCommonSearchSettingCaption": "Detaillierte Suchkriterien festlegen.",
	"customEmojisManagerGridCommonSortOrder": "Sortierung",
	"customEmojisManagerGridCommonSearchLimit": "Anzahl der Ergebnisse",
	"search": "Suchen",
	"reset": "Zurücksetzen",
	"customEmojisManagerGridCommonRegistrationLogs": "Registrierungsprotokoll",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Protokolle werden beim Aktualisieren oder Löschen von Emojis angezeigt. Sie verschwinden nach dem Aktualisieren oder Löschen, dem Wechsel zu einer neuen Seite oder dem Neuladen.",
	"customEmojisManagerLocalListEmojisNothing": "Es wurden keine Emojis hinzugefügt.",
	"customEmojisManagerRemoteImportEmojisButton": "Ausgewählte Emojis importieren",
	"customEmojisManagerRemoteImportSelectionRows": "Ausgewählte Zeilen importieren",
	"customEmojisManagerRemoteSelectionRowDetail": "Details der ausgewählten Zeile",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Zeilen in der Auswahl importieren",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Emojis importieren",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Importiere {count} Emoji(s), die von entfernten Server empfangen wurden. Bitte achte genau auf die Lizenz der Emojis. Bist du sicher, dass du fortfahren möchtest?",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Emoji konnte nicht aktualisiert oder gelöscht werden. Bitte prüfe das Registrierungsprotokoll für Details."
}
</locale>

<locale lang="json" locale="en-US">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Search",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"customEmojisManagerGridCommonSearchSettings": "Ajustes de búsqueda",
	"customEmojisManagerGridCommonSearchSettingCaption": "Establecer criterios de búsqueda detallados.",
	"customEmojisManagerGridCommonSortOrder": "Ordenar",
	"customEmojisManagerGridCommonSearchLimit": "Límite de resultados",
	"search": "Buscar",
	"reset": "Restablecer",
	"customEmojisManagerGridCommonRegistrationLogs": "Log de registros ",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Los registros se mostrarán al actualizar o borrar Emojis. Desaparecerán después de actualizarlos o eliminarlos, pasar a una nueva página o recargar.",
	"customEmojisManagerLocalListEmojisNothing": "No hay Emojis registrados",
	"customEmojisManagerRemoteImportEmojisButton": "Importar los Emojis marcados",
	"customEmojisManagerRemoteImportSelectionRows": "Importar las líneas seleccionadas",
	"customEmojisManagerRemoteSelectionRowDetail": "Detalle de la línea seleccionada",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Importar las filas seleccionadas",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Importar Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Importar {count} Emoji(s) recibidos del servidor remoto. Por favor, presta mucha atención a la licencia del Emoji. ¿Estás seguro de continuar?",
	"somethingHappened": "Ocurrió un error",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "No se ha podido actualizar o borrar el emoji. Por favor comprueba el log del registro para más detalles."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Rechercher",
	"reset": "Réinitialiser",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "Une erreur est survenue",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Cari",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "Terjadi kesalahan",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"customEmojisManagerGridCommonSearchSettings": "Impostazioni di ricerca",
	"customEmojisManagerGridCommonSearchSettingCaption": "Imposta condizioni di ricerca dettagliate.",
	"customEmojisManagerGridCommonSortOrder": "Ordine",
	"customEmojisManagerGridCommonSearchLimit": "Risultati visualizzati",
	"search": "Cerca",
	"reset": "Ripristina",
	"customEmojisManagerGridCommonRegistrationLogs": "Storico della registrazione",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Lo storico verrà visualizzato in base alla attività sulle emoji. Scompare quando si esegue un'operazione di aggiornamento/eliminazione o si modifica/ricarica la pagina.",
	"customEmojisManagerLocalListEmojisNothing": "Non ci sono emoji registrate.",
	"customEmojisManagerRemoteImportEmojisButton": "Importa le emoji selezionate",
	"customEmojisManagerRemoteImportSelectionRows": "Importa le righe selezionate",
	"customEmojisManagerRemoteSelectionRowDetail": "Dettagli della riga selezionata",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Importa le righe nell'intervallo selezionato",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Importazione emoji",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Importazione di {count} emoji ricevute da remoto. Si prega di prestare molta attenzione al tipo di licenza delle emoji. Vuoi confermare?",
	"somethingHappened": "Si è verificato un problema",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Attenzione, è impossibile modificare la emoji. Si prega di controllare lo storico per ulteriori dettagli."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"customEmojisManagerGridCommonSearchSettings": "検索設定",
	"customEmojisManagerGridCommonSearchSettingCaption": "検索条件を詳細に設定します。",
	"customEmojisManagerGridCommonSortOrder": "並び順",
	"customEmojisManagerGridCommonSearchLimit": "表示件数",
	"search": "検索",
	"reset": "リセット",
	"customEmojisManagerGridCommonRegistrationLogs": "登録ログ",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "絵文字更新・削除時のログが表示されます。更新・削除操作を行ったり、ページを遷移・リロードすると消えます。",
	"customEmojisManagerLocalListEmojisNothing": "登録された絵文字はありません。",
	"customEmojisManagerRemoteImportEmojisButton": "チェックされた絵文字をインポート",
	"customEmojisManagerRemoteImportSelectionRows": "選択行をインポート",
	"customEmojisManagerRemoteSelectionRowDetail": "選択行の詳細",
	"customEmojisManagerRemoteImportSelectionRangesRows": "選択範囲の行をインポート",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "絵文字のインポート",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "リモートから受信した{count}個の絵文字のインポートを行います。絵文字のライセンスに十分な注意を払ってください。実行しますか？",
	"somethingHappened": "問題が発生しました",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "絵文字の更新・削除に失敗しました。詳細は登録ログをご確認ください。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"customEmojisManagerGridCommonSearchSettings": "検索設定",
	"customEmojisManagerGridCommonSearchSettingCaption": "検索条件を詳しく設定するで。",
	"customEmojisManagerGridCommonSortOrder": "並び順",
	"customEmojisManagerGridCommonSearchLimit": "表示件数",
	"search": "探す",
	"reset": "リセット",
	"customEmojisManagerGridCommonRegistrationLogs": "登録ログ",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "絵文字更新・削除時のログが表示されるで。更新・削除操作をしたり、ページを遷移・リロードしたら消えるから気ぃつけてな。",
	"customEmojisManagerLocalListEmojisNothing": "登録された絵文字はないで。",
	"customEmojisManagerRemoteImportEmojisButton": "チェックされた絵文字をインポートするで",
	"customEmojisManagerRemoteImportSelectionRows": "選択行をインポートするで",
	"customEmojisManagerRemoteSelectionRowDetail": "選択行の詳細やで",
	"customEmojisManagerRemoteImportSelectionRangesRows": "選択範囲の行をインポートするで",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "絵文字のインポートするで",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "リモートから受信した{count}個の絵文字をインポートするで。絵文字のライセンスには十分気ぃつけてな。実行してもええか？",
	"somethingHappened": "なんかあかんわ",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "絵文字の更新・削除に失敗したで。詳細は登録ログを確認してな。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Nadi",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "ಹುಡುಕು",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"customEmojisManagerGridCommonSearchSettings": "검색 설정",
	"customEmojisManagerGridCommonSearchSettingCaption": "고급 검색을 설정합니다.",
	"customEmojisManagerGridCommonSortOrder": "정렬 순서",
	"customEmojisManagerGridCommonSearchLimit": "표시 건수",
	"search": "검색",
	"reset": "초기화",
	"customEmojisManagerGridCommonRegistrationLogs": "등록 로그",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "이모지를 갱신하거나 삭제할 때 로그가 표시됩니다. 갱신 또는 삭제하거나, 페이지 이동, 새로 고침하면 삭제됩니다.",
	"customEmojisManagerLocalListEmojisNothing": "등록한 이모지가 없습니다.",
	"customEmojisManagerRemoteImportEmojisButton": "선택한 이모지를 가져오기",
	"customEmojisManagerRemoteImportSelectionRows": "선택 행을 가져오기",
	"customEmojisManagerRemoteSelectionRowDetail": "선택 행 (상세)",
	"customEmojisManagerRemoteImportSelectionRangesRows": "선택한 범위 안의 행을 가져오기",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "이모지 가져오기",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "리모트 서버에서 받아온 이모지 {count}개를 이 서버로 가져옵니다. 이모지의 저작권, 라이선스를 확실히 확인하셨다면 실행해주세요.",
	"somethingHappened": "오류가 발생했습니다",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "이모지를 갱신 또는 삭제하지 못했습니다. 자세한 내용은 등록 로그를 확인해주세요."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Zoeken",
	"reset": "Herstellen",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "Er is iets misgegaan.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Søk",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "En feil har oppstått",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Szukaj",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "Coś poszło nie tak",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"customEmojisManagerGridCommonSearchSettings": "Opções de busca",
	"customEmojisManagerGridCommonSearchSettingCaption": "Definir critérios detalhados de busca.",
	"customEmojisManagerGridCommonSortOrder": "Ordem de classificação",
	"customEmojisManagerGridCommonSearchLimit": "Limite de busca",
	"search": "Pesquisar",
	"reset": "Redefinir",
	"customEmojisManagerGridCommonRegistrationLogs": "Histórico de registros",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Atualizações e remoções de emoji serão gravadas no histórico. Atualizar, remover, mover a uma nova página ou recarregar limpará o histórico",
	"customEmojisManagerLocalListEmojisNothing": "Não há Emojis registrados.",
	"customEmojisManagerRemoteImportEmojisButton": "Importar Emojis selecionados",
	"customEmojisManagerRemoteImportSelectionRows": "Importar linhas selecionadas",
	"customEmojisManagerRemoteSelectionRowDetail": "Detalhes da linha selecionada",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Importar linhas no intervalo",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Importar Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Importar {count} Emoji(s) recebidos de um servidor remoto. Por favor, preste atenção na licença do Emoji. Tem certeza que deseja continuar?",
	"somethingHappened": "Ocorreu um erro",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Não foi possível atualizar ou remover emojis. Por favor, confira o histórico de registro para mais detalhes."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"customEmojisManagerGridCommonSearchSettings": "Параметры поиска",
	"customEmojisManagerGridCommonSearchSettingCaption": "Задать подробные критерии поиска",
	"customEmojisManagerGridCommonSortOrder": "Порядок сортировки",
	"customEmojisManagerGridCommonSearchLimit": "Лимит поиска",
	"search": "Поиск",
	"reset": "Сброс",
	"customEmojisManagerGridCommonRegistrationLogs": "Журнал регистрации",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Журнал будет показан при изменении или удалении эмодзи. Он будет очищен при их изменении или удалении, перемещении на новую страницу или обновлении страницы.",
	"customEmojisManagerLocalListEmojisNothing": "Зарегистрированных эмодзи нет.",
	"customEmojisManagerRemoteImportEmojisButton": "Импортировать выбранные эмодзи",
	"customEmojisManagerRemoteImportSelectionRows": "Импортировать выбранные строки",
	"customEmojisManagerRemoteSelectionRowDetail": "Информация о выбранных строках",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Импортировать строки в выделении",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Импортировать эмодзи",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Импортировать {count} эмодзи с внешнего сервера. Пожалуйста, обратите внимание на их лицензию. Продолжить?",
	"somethingHappened": "Что-то пошло не так",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Не удалось обновить или удалить эмодзи. Посмотрите журнал регистрации для подробностей"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Hľadať",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"customEmojisManagerGridCommonSearchSettings": "ตั้งค่าการค้นหา",
	"customEmojisManagerGridCommonSearchSettingCaption": "ตั้งค่าเงื่อนไขการค้นหาอย่างละเอียด",
	"customEmojisManagerGridCommonSortOrder": "ลำดับการเรียง",
	"customEmojisManagerGridCommonSearchLimit": "จำนวนรายการที่แสดง",
	"search": "ค้นหา",
	"reset": "รีเซ็ต",
	"customEmojisManagerGridCommonRegistrationLogs": "ปูมการลงทะเบียน",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "จะแสดงปูมเมื่อมีการอัปเดตหรือลบเอโมจิ หากดำเนินการอัปเดต/ลบ หรือเปลี่ยนหน้า/รีโหลด หน้านี้ ปูมจะหายไป",
	"customEmojisManagerLocalListEmojisNothing": "ยังไม่มีเอโมจิที่ลงทะเบียนไว้",
	"customEmojisManagerRemoteImportEmojisButton": "นำเข้าเอโมจิที่ทำเครื่องหมายไว้",
	"customEmojisManagerRemoteImportSelectionRows": "นำเข้าแถวที่เลือก",
	"customEmojisManagerRemoteSelectionRowDetail": "รายละเอียดของแถวที่เลือก",
	"customEmojisManagerRemoteImportSelectionRangesRows": "นำเข้าแถวในช่วงที่เลือก",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "นำเข้าเอโมจิ",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "จะนำเข้าเอโมจิ {count} รายการที่ได้รับจากระยะไกล ทั้งนี้โปรดระมัดระวังเรื่องสิทธิ์การใช้งานเอโมจิ ดำเนินการหรือไม่?",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "การอัปเดตหรือลบเอโมจิล้มเหลว กรุณาตรวจสอบรายละเอียดในปูมการลงทะเบียน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"customEmojisManagerGridCommonSearchSettings": "Arama ayarları",
	"customEmojisManagerGridCommonSearchSettingCaption": "Ayrıntılı arama kriterleri belirle.",
	"customEmojisManagerGridCommonSortOrder": "Sıralama düzeni",
	"customEmojisManagerGridCommonSearchLimit": "Sonuç sayısı",
	"search": "Ara",
	"reset": "Sıfırla",
	"customEmojisManagerGridCommonRegistrationLogs": "Kayıt günlüğü",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Emojileri güncellerken veya silerken günlükler görüntülenecek. Güncelleme veya silme işleminden sonra, yeni bir sayfaya geçildiğinde veya yeniden yüklendiğinde günlükler kaybolacak.",
	"customEmojisManagerLocalListEmojisNothing": "Kayıtlı Emoji yok.",
	"customEmojisManagerRemoteImportEmojisButton": "Kontrol edilen Emojileri içe aktar",
	"customEmojisManagerRemoteImportSelectionRows": "Seçilen satırları içe aktar",
	"customEmojisManagerRemoteSelectionRowDetail": "Seçilen satırın ayrıntıları",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Seçimdeki satırları içe aktar",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Emoji'leri İçe Aktar",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Uzak sunucudan alınan {count} Emoji(ler)i içe aktarın. Emoji lisansına dikkat edin. Devam etmek istediğinizden emin misiniz?",
	"somethingHappened": "Bir hata oluştu",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Emojileri güncelleyemedi veya silemedi. Ayrıntılar için kayıt günlüğünü kontrol edin."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "ئىزدەش",
	"reset": "Reset",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Пошук",
	"reset": "Скинути",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "Щось пішло не так",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"customEmojisManagerGridCommonSearchSettings": "Search settings",
	"customEmojisManagerGridCommonSearchSettingCaption": "Set detailed search criteria.",
	"customEmojisManagerGridCommonSortOrder": "Sort order",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"search": "Tìm kiếm",
	"reset": "cài lại",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"customEmojisManagerRemoteImportEmojisButton": "Import checked Emojis",
	"customEmojisManagerRemoteImportSelectionRows": "Import selected rows",
	"customEmojisManagerRemoteSelectionRowDetail": "Selected row's detail",
	"customEmojisManagerRemoteImportSelectionRangesRows": "Import rows in the selection",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "Import Emojis",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "Import {count} Emoji(s) received from the remote server. Please pay close attention to the license of the Emoji. Are you sure to continue?",
	"somethingHappened": "Xảy ra lỗi",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"customEmojisManagerGridCommonSearchSettings": "搜索设置",
	"customEmojisManagerGridCommonSearchSettingCaption": "设置详细的搜索条件。",
	"customEmojisManagerGridCommonSortOrder": "排序方式",
	"customEmojisManagerGridCommonSearchLimit": "显示项目数",
	"search": "搜索",
	"reset": "重置",
	"customEmojisManagerGridCommonRegistrationLogs": "注册日志",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "将显示更新和删除表情符号的日志。执行更新或删除操作，又或者更改或重新加载页面时会消失。",
	"customEmojisManagerLocalListEmojisNothing": "没有已注册的表情符号。",
	"customEmojisManagerRemoteImportEmojisButton": "导入已选择的表情符号",
	"customEmojisManagerRemoteImportSelectionRows": "导入所选行",
	"customEmojisManagerRemoteSelectionRowDetail": "所选行的详细信息",
	"customEmojisManagerRemoteImportSelectionRangesRows": "导入所选范围的行",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "导入表情符号",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "是否导入从远程服务器接收的 {count} 个表情符号？请密切关注表情符号的许可协议。",
	"somethingHappened": "出错了",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "更新或删除表情符号失败。详情请确认注册日志。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"customEmojisManagerGridCommonSearchSettings": "搜尋設定",
	"customEmojisManagerGridCommonSearchSettingCaption": "詳細設定搜尋條件。",
	"customEmojisManagerGridCommonSortOrder": "排序",
	"customEmojisManagerGridCommonSearchLimit": "顯示的數量",
	"search": "搜尋",
	"reset": "重設",
	"customEmojisManagerGridCommonRegistrationLogs": "登錄日誌",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "會顯示更新或刪除表情符號時的日誌。進行更新或刪除操作，或切換頁面、重新載入後，日誌將會消失。",
	"customEmojisManagerLocalListEmojisNothing": "沒有登錄的表情符號。",
	"customEmojisManagerRemoteImportEmojisButton": "匯入勾選的表情符號",
	"customEmojisManagerRemoteImportSelectionRows": "匯入選取的行",
	"customEmojisManagerRemoteSelectionRowDetail": "選取行的詳細資訊",
	"customEmojisManagerRemoteImportSelectionRangesRows": "匯入選取範圍的行",
	"customEmojisManagerRemoteConfirmImportEmojisTitle": "匯入表情符號",
	"customEmojisManagerRemoteConfirmImportEmojisDescription": "將從遠端接收的{count}個表情符號進行匯入。請務必注意表情符號的授權。是否執行此操作？",
	"somethingHappened": "發生錯誤",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "更新或刪除表情符號失敗。詳情請查看登錄日誌。"
}
</locale>
