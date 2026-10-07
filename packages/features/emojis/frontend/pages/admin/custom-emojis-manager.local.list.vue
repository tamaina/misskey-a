<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader :overridePageMetadata="headerPageMetadata" :actions="headerActions"/>
	</template>
	<template #default>
		<div class="_gaps" :class="$style.main">
			<component :is="loadingHandler.component.value" v-if="loadingHandler.showing.value"/>
			<template v-else>
				<div v-if="gridItems.length === 0" style="text-align: center">
					{{ $locale.sfc.customEmojisManagerLocalListEmojisNothing }}
				</div>

				<template v-else>
					<div :class="$style.grid">
						<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
					</div>
				</template>
			</template>
		</div>
	</template>

	<template #footer>
		<div v-if="gridItems.length > 0" :class="$style.footer">
			<div :class="$style.left">
				<MkButton danger style="margin-right: auto" @click="onDeleteButtonClicked">
					{{ $locale.sfc.delete }} ({{ deleteItemsCount }})
				</MkButton>
			</div>

			<div :class="$style.center">
				<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>
			</div>

			<div :class="$style.right">
				<MkButton primary :disabled="updateButtonDisabled" @click="onUpdateButtonClicked">
					{{ $locale.sfc.update }} ({{ updatedItemsCount }})
				</MkButton>
				<MkButton @click="onGridResetButtonClicked">{{ $locale.sfc.reset }}</MkButton>
			</div>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts">
import type { SortOrder } from '@features/preferences/frontend/components/MkSortOrderEditor.define.js';
import type { GridSortOrderKey } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';

export type EmojiSearchQuery = {
	name: string | null;
	category: string | null;
	aliases: string | null;
	type: string | null;
	license: string | null;
	updatedAtFrom: string | null;
	updatedAtTo: string | null;
	sensitive: string | null;
	localOnly: string | null;
	roles: { id: string, name: string }[];
	sortOrders: SortOrder<GridSortOrderKey>[];
	limit: number;
};
</script>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, nextTick, useCssModule } from 'vue';
import * as Misskey from 'misskey-js';
import type { RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';
import type { GridCellValidationEvent, GridCellValueChangeEvent, GridEvent } from '@features/ui/frontend/components/grid/grid-event.js';
import type { GridSetting } from '@features/ui/frontend/components/grid/grid.js';
import * as os from '@features/ui/frontend/os.js';
import {
	emptyStrToEmptyArray,
	emptyStrToNull,
	emptyStrToUndefined,
	roleIdsParser,
} from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';
import MkGrid from '@features/ui/frontend/components/grid/MkGrid.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { validators } from '@features/ui/frontend/components/grid/cell-validators.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkPagingButtons from '@features/ui/frontend/components/MkPagingButtons.vue';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import { copyGridDataToClipboard, removeDataFromGrid } from '@features/ui/frontend/components/grid/grid-utils.js';
import { useLoading } from '@features/ui/frontend/composables/use-loading.js';

type GridItem = {
	checked: boolean;
	id: string;
	url: string;
	name: string;
	host: string;
	category: string;
	aliases: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: { id: string, name: string }[];
	fileId?: string;
	updatedAt: string | null;
	publicUrl?: string | null;
	originalUrl?: string | null;
	type: string | null;
};

function setupGrid(): GridSetting {
	const $style = useCssModule();

	const required = validators.required();
	const regex = validators.regex(/^[a-zA-Z0-9_]+$/);
	const unique = validators.unique();
	return {
		root: {
			noOverflowStyle: true,
			rounded: false,
			outerBorder: false,
		},
		row: {
			showNumber: true,
			selectable: true,
			// グリッドの行数をあらかじめ100行確保する
			minimumDefinitionCount: 100,
			styleRules: [
				{
					// 初期値から変わっていたら背景色を変更
					condition: ({ row }) => JSON.stringify(gridItems.value[row.index]) !== JSON.stringify(originGridItems.value[row.index]),
					applyStyle: { className: $style.changedRow },
				},
				{
					// バリデーションに引っかかっていたら背景色を変更
					condition: ({ cells }) => cells.some(it => !it.violation.valid),
					applyStyle: { className: $style.violationRow },
				},
			],
			// 行のコンテキストメニュー設定
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerGridCommonCopySelectionRows,
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(gridItems, context),
					},
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerLocalListMarkAsDeleteTargetRows,
						icon: 'ti ti-trash',
						action: () => {
							for (const rangedRow of context.rangedRows) {
								gridItems.value[rangedRow.index].checked = true;
							}
						},
					},
				];
			},
			events: {
				delete(rows) {
					// 行削除時は元データの行を消さず、削除対象としてマークするのみにする
					for (const row of rows) {
						gridItems.value[row.index].checked = true;
					}
				},
			},
		},
		cols: [
			{ bindTo: 'checked', icon: 'ti-trash', type: 'boolean', editable: true, width: 34 },
			{
				bindTo: 'url', icon: 'ti-icons', type: 'image', editable: true, width: 'auto', validators: [required],
				async customValueEditor(row, col, value, cellElement) {
					const file = await selectFile({
						anchorElement: cellElement,
						multiple: false,
					});
					gridItems.value[row.index].url = file.url;
					gridItems.value[row.index].fileId = file.id;

					return file.url;
				},
			},
			{
				bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140,
				validators: [required, regex, unique],
			},
			{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
			{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
			{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
			{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
			{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
			{
				bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 140,
				valueTransformer(row) {
					// バックエンドからからはIDと名前のペア配列で受け取るが、表示にIDがあると煩雑なので名前だけにする
					return gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction
						.map((it) => it.name)
						.join(',');
				},
				async customValueEditor(row) {
					// ID直記入は体験的に最悪なのでモーダルを使って入力する
					const current = gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction;
					const result = await os.selectRole({
						initialRoleIds: current.map(it => it.id),
						title: $locale.value.sfc.rolesThatCanBeUsedThisEmojiAsReaction,
						infoMessage: $locale.value.sfc.rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription,
						publicOnly: true,
					});
					if (result.canceled) {
						return current;
					}

					const transform = result.result.map(it => ({ id: it.id, name: it.name }));
					gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction = transform;

					return transform;
				},
				events: {
					paste: roleIdsParser,
					delete(cell) {
						// デフォルトはundefinedになるが、このプロパティは空配列にしたい
						gridItems.value[cell.row.index].roleIdsThatCanBeUsedThisEmojiAsReaction = [];
					},
				},
			},
			{ bindTo: 'type', type: 'text', editable: false, width: 90 },
			{ bindTo: 'updatedAt', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'publicUrl', type: 'text', editable: false, width: 180 },
			{ bindTo: 'originalUrl', type: 'text', editable: false, width: 180 },
		],
		cells: {
			// セルのコンテキストメニュー設定
			contextMenuFactory(col, row, value, context) {
				return [
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerGridCommonCopySelectionRanges,
						icon: 'ti ti-copy',
						action: () => {
							return copyGridDataToClipboard(gridItems, context);
						},
					},
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerGridCommonDeleteSelectionRanges,
						icon: 'ti ti-trash',
						action: () => {
							removeDataFromGrid(context, (cell) => {
								(gridItems.value[cell.row.index] as any)[cell.column.setting.bindTo] = undefined;
							});
						},
					},
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerLocalListMarkAsDeleteTargetRanges,
						icon: 'ti ti-trash',
						action: () => {
							for (const rowIdx of [...new Set(context.rangedCells.map(it => it.row.index)).values()]) {
								gridItems.value[rowIdx].checked = true;
							}
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

const searchQuery = ref<EmojiSearchQuery>({
	name: null,
	category: null,
	aliases: null,
	type: null,
	license: null,
	updatedAtFrom: null,
	updatedAtTo: null,
	sensitive: null,
	localOnly: null,
	roles: [],
	sortOrders: [],
	limit: 100,
});
let searchWindowOpening = false;

const previousQuery = ref<string | undefined>(undefined);
const sortOrders = ref<SortOrder<GridSortOrderKey>[]>([]);
const requestLogs = ref<RequestLogItem[]>([]);

const gridItems = ref<GridItem[]>([]);
const originGridItems = ref<GridItem[]>([]);
const updateButtonDisabled = ref<boolean>(false);

const updatedItemsCount = computed(() => {
	return gridItems.value.filter((it, idx) => !it.checked && JSON.stringify(it) !== JSON.stringify(originGridItems.value[idx])).length;
});
const deleteItemsCount = computed(() => gridItems.value.filter(it => it.checked).length);

async function onUpdateButtonClicked() {
	const _items = gridItems.value;
	const _originItems = originGridItems.value;
	if (_items.length !== _originItems.length) {
		throw new Error('The number of items has been changed. Please refresh the page and try again.');
	}

	const updatedItems = _items.filter((it, idx) => !it.checked && JSON.stringify(it) !== JSON.stringify(_originItems[idx]));
	if (updatedItems.length === 0) {
		await os.alert({
			type: 'info',
			text: $locale.value.sfc.customEmojisManagerLocalListAlertUpdateEmojisNothingDescription,
		});
		return;
	}

	const { canceled } = await os.confirm({
		type: 'info',
		text: interpolateLocaleParameters($locale.value.sfc.customEmojisManagerLocalListConfirmUpdateEmojisDescription, { count: updatedItems.length }),
	});
	if (canceled) {
		return;
	}

	const action = () => {
		return updatedItems.map(item =>
			misskeyApi(
				'admin/emoji/update',
				{
					// eslint-disable-next-line
					id: item.id!,
					name: item.name,
					category: emptyStrToNull(item.category),
					aliases: emptyStrToEmptyArray(item.aliases),
					license: emptyStrToNull(item.license),
					isSensitive: item.isSensitive,
					localOnly: item.localOnly,
					roleIdsThatCanBeUsedThisEmojiAsReaction: item.roleIdsThatCanBeUsedThisEmojiAsReaction.map(it => it.id),
					fileId: item.fileId,
				})
				.then(() => ({ item, success: true, err: undefined }))
				.catch(err => ({ item, success: false, err })),
		);
	};

	const result = await os.promiseDialog(Promise.all(action()));
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

async function onDeleteButtonClicked() {
	const _items = gridItems.value;
	const _originItems = originGridItems.value;
	if (_items.length !== _originItems.length) {
		throw new Error('The number of items has been changed. Please refresh the page and try again.');
	}

	const deleteItems = _items.filter((it) => it.checked);
	if (deleteItems.length === 0) {
		await os.alert({
			type: 'info',
			text: $locale.value.sfc.customEmojisManagerLocalListAlertDeleteEmojisNothingDescription,
		});
		return;
	}

	const { canceled } = await os.confirm({
		type: 'info',
		text: interpolateLocaleParameters($locale.value.sfc.customEmojisManagerLocalListConfirmDeleteEmojisDescription, { count: deleteItems.length }),
	});
	if (canceled) {
		return;
	}

	async function action() {
		const deleteIds = deleteItems.map(it => it.id!);
		await misskeyApi('admin/emoji/delete-bulk', { ids: deleteIds });
	}

	await os.promiseDialog(
		action(),
	);
}

async function onGridResetButtonClicked() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: $locale.value.sfc.resetAreYouSure,
		text: $locale.value.sfc.customEmojisManagerLocalListConfirmResetDescription,
	});

	if (canceled) return;

	refreshGridItems();
}

async function onSearchRequest() {
	await refreshCustomEmojis();
}

async function onPageChanged(pageNumber: number) {
	if (updatedItemsCount.value > 0) {
		const { canceled } = await os.confirm({
			type: 'warning',
			title: $locale.value.sfc.customEmojisManagerLocalListConfirmMovePage,
			text: $locale.value.sfc.customEmojisManagerLocalListConfirmMovePageDesciption,
		});
		if (canceled) return;
	}

	currentPage.value = pageNumber;
	await nextTick();
	refreshCustomEmojis();
}

function onGridEvent(event: GridEvent) {
	switch (event.type) {
		case 'cell-validation':
			onGridCellValidation(event);
			break;
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
	}
}

function onGridCellValidation(event: GridCellValidationEvent) {
	updateButtonDisabled.value = event.all.filter(it => !it.valid).length > 0;
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		(gridItems.value[row.index] as any)[column.setting.bindTo] = newValue;
	}
}

async function refreshCustomEmojis() {
	const limit = searchQuery.value.limit;

	const query: Misskey.entities.V2AdminEmojiListRequest['query'] = {
		name: emptyStrToUndefined(searchQuery.value.name),
		type: emptyStrToUndefined(searchQuery.value.type),
		aliases: emptyStrToUndefined(searchQuery.value.aliases),
		category: emptyStrToUndefined(searchQuery.value.category),
		license: emptyStrToUndefined(searchQuery.value.license),
		isSensitive: searchQuery.value.sensitive != null ? Boolean(searchQuery.value.sensitive).valueOf() : undefined,
		localOnly: searchQuery.value.localOnly != null ? Boolean(searchQuery.value.localOnly).valueOf() : undefined,
		updatedAtFrom: emptyStrToUndefined(searchQuery.value.updatedAtFrom),
		updatedAtTo: emptyStrToUndefined(searchQuery.value.updatedAtTo),
		roleIds: searchQuery.value.roles.map(it => it.id),
		hostType: 'local',
	};

	if (JSON.stringify(query) !== previousQuery.value) {
		currentPage.value = 1;
	}

	const result = await loadingHandler.scope(() => misskeyApi('v2/admin/emoji/list', {
		query: query,
		limit: limit,
		page: currentPage.value,
		sortKeys: sortOrders.value.map(({ key, direction }) => `${direction}${key}` as any),
	}));

	customEmojis.value = result.emojis;
	allPages.value = result.allPages;

	previousQuery.value = JSON.stringify(query);

	refreshGridItems();
}

function refreshGridItems() {
	gridItems.value = customEmojis.value.map(it => ({
		checked: false,
		id: it.id,
		fileId: undefined,
		url: it.publicUrl,
		name: it.name,
		host: it.host ?? '',
		category: it.category ?? '',
		aliases: it.aliases.join(' '),
		license: it.license ?? '',
		isSensitive: it.isSensitive,
		localOnly: it.localOnly,
		roleIdsThatCanBeUsedThisEmojiAsReaction: it.roleIdsThatCanBeUsedThisEmojiAsReaction,
		updatedAt: it.updatedAt,
		publicUrl: it.publicUrl,
		originalUrl: it.originalUrl,
		type: it.type,
	}));
	originGridItems.value = JSON.parse(JSON.stringify(gridItems.value));
}

onMounted(async () => {
	await refreshCustomEmojis();
});

const headerPageMetadata = computed(() => ({
	title: $locale.value.sfc.customEmojisManagerLocalTabTitleList,
	icon: 'ti ti-icons',
}));

const headerActions = computed<PageHeaderItem[]>(() => [{
	icon: 'ti ti-search',
	text: $locale.value.sfc.search,
	handler: async () => {
		if (searchWindowOpening) return;
		searchWindowOpening = true;
		const { dispose } = await os.popupAsyncWithDialog(import('@features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.search.vue').then(x => x.default), {
			query: searchQuery.value,
		}, {
			queryUpdated: (query: EmojiSearchQuery) => {
				searchQuery.value = query;
			},
			sortOrderUpdated: (orders: SortOrder<GridSortOrderKey>[]) => {
				sortOrders.value = orders;
			},
			search: () => {
				onSearchRequest();
			},
			closed: () => {
				dispose();
				searchWindowOpening = false;
			},
		});
	},
}, {
	icon: 'ti ti-list-numbers',
	text: $locale.value.sfc.customEmojisManagerGridCommonSearchLimit,
	handler: (ev) => {
		async function changeSearchLimit(to: number) {
			if (updatedItemsCount.value > 0) {
				const { canceled } = await os.confirm({
					type: 'warning',
					title: $locale.value.sfc.customEmojisManagerLocalListConfirmChangeView,
					text: $locale.value.sfc.customEmojisManagerLocalListConfirmMovePageDesciption,
				});
				if (canceled) return;
			}

			searchQuery.value.limit = to;
			refreshCustomEmojis();
		}

		os.popupMenu([{
			type: 'radioOption',
			text: '25',
			active: computed(() => searchQuery.value.limit === 25),
			action: () => changeSearchLimit(25),
		}, {
			type: 'radioOption',
			text: '50',
			active: computed(() => searchQuery.value.limit === 50),
			action: () => changeSearchLimit(50),
		}, {
			type: 'radioOption',
			text: '100',
			active: computed(() => searchQuery.value.limit === 100),
			action: () => changeSearchLimit(100),
		}], ev.currentTarget ?? ev.target);
	},
}, {
	icon: 'ti ti-notes',
	text: $locale.value.sfc.customEmojisManagerGridCommonRegistrationLogs,
	handler: async () => {
		const { dispose } = await os.popupAsyncWithDialog(import('@features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.logs.vue').then(x => x.default), {
			logs: requestLogs.value,
		}, {
			closed: () => {
				dispose();
			},
		});
	},
}]);
</script>

<style module lang="scss">
.changedRow {
	background-color: var(--MI_THEME-infoBg) !important;
}

.violationRow {
	background-color: var(--MI_THEME-infoWarnBg) !important;
}

.main {
	height: calc(100vh - var(--MI-stickyTop) - var(--MI-stickyBottom));
	overflow: scroll;
}

.grid {
	width: max-content;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.footer {
	background-color: var(--MI_THEME-bg);

	padding: var(--MI-margin);
	border-top: 1px solid var(--MI_THEME-divider);

	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;

	& .left {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 8px;
	}

	& .center {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	& .right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-direction: row;
		gap: 8px;
	}
}

.divider {
	margin: 8px 0;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

</style>

<locale lang="json" locale="ar-SA">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "حذف",
	"update": "حدِّث",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "الأدوار التي يُسمح لأصحابها استخدام هذا اإيموجي في اللتفاعل",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "إذا لم تحدد دورًا يمكن للجميع استخدام هذا الإيموجي في التفاعل.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "حدث خطأ",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "هل تريد إعادة التعيين؟",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "البحث",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"customEmojisManagerLocalListEmojisNothing": "No hi ha Emojis registrats",
	"delete": "Elimina",
	"update": "Actualitzar",
	"reset": "Reiniciar",
	"customEmojisManagerGridCommonCopySelectionRows": "Copiar línies seleccionades ",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Files seleccionades que s'han d'esborrar ",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rols que poden fer servir aquest emoji com a reacció ",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si cap rol es especificat tothom ho pot fer servir",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copiar selecció ",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Esborrar files de la selecció ",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Selecció de files per la seva eliminació ",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "No hi ha Emojis actualitzats.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Actualitzar {count} Emojis. Vols executar-ho?",
	"somethingHappened": "S'ha produït un error",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "No s'ha pogut actualitzar o esborrar l'emoji. Si us plau, dona una ullada al registre per més detalls.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "No hi ha Emoji per esborrar.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Esborrar {count} Emojis marcats. Vols continuar?",
	"resetAreYouSure": "Segur que vols restablir-ho?",
	"customEmojisManagerLocalListConfirmResetDescription": "Es restabliran tots els canvis fets fins ara.",
	"customEmojisManagerLocalListConfirmMovePage": "Vols canviar de pàgina?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "S'han fet canvis als Emojis d'aquesta pàgina. Si continues navegant sense guardar els canvis, es perdran tots els canvis fets en aquesta pàgina.",
	"customEmojisManagerLocalTabTitleList": "Llistar els Emojis registrats",
	"search": "Cercar",
	"customEmojisManagerGridCommonSearchLimit": "Nombre de pantalles",
	"customEmojisManagerLocalListConfirmChangeView": "Vols canviar la pantalla?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registres d'inscripcions "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Smazat",
	"update": "Aktualizovat",
	"reset": "Obnovit",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Role, které můžou tuhle emoji použít jako reakci",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Pokud nejsou určena role, tak pak každý může použít tenhle emoji.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Opravdu resetovat?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Vyhledávání",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Delete",
	"update": "Update",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Really reset?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Search",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"customEmojisManagerLocalListEmojisNothing": "Es wurden keine Emojis hinzugefügt.",
	"delete": "Löschen",
	"update": "Aktualisieren",
	"reset": "Zurücksetzen",
	"customEmojisManagerGridCommonCopySelectionRows": "Ausgewählte Zeilen kopieren",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Ausgewählte Zeilen als zu löschendes Element markieren",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rollen, die dieses Emoji als Reaktion verwenden können",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Sind keine Rollen angegeben, kann jeder dieses Emoji als Reaktion verwenden.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Auswahl kopieren",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Zeilen in der Auswahl löschen",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Zeilen in der Auswahl als zu löschendes Element markieren",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "Es wurden keine Emojis geändert.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Aktualisiere {count} Emoji(s). Willst du fortfahren?",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Emoji konnte nicht aktualisiert oder gelöscht werden. Bitte prüfe das Registrierungsprotokoll für Details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "Es gibt keine zu löschenden Emojis.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Lösche {count} ausgewählte Emoji(s). Willst du fortfahren?",
	"resetAreYouSure": "Wirklich zurücksetzen?",
	"customEmojisManagerLocalListConfirmResetDescription": "Alle bisher vorgenommenen Änderungen werden zurückgesetzt.",
	"customEmojisManagerLocalListConfirmMovePage": "Möchten Sie die Seiten verschieben?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "An den Emojis auf dieser Seite wurden Änderungen vorgenommen.\nWenn du die Seite verlässt, ohne zu speichern, werden alle auf dieser Seite vorgenommenen Änderungen verworfen.",
	"customEmojisManagerLocalTabTitleList": "Hinzugefügte Emojis",
	"search": "Suchen",
	"customEmojisManagerGridCommonSearchLimit": "Anzahl der Ergebnisse",
	"customEmojisManagerLocalListConfirmChangeView": "Möchten Sie die Darstellung wechseln?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registrierungsprotokoll"
}
</locale>

<locale lang="json" locale="en-US">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Delete",
	"update": "Update",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Really reset?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Search",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"customEmojisManagerLocalListEmojisNothing": "No hay Emojis registrados",
	"delete": "Borrar",
	"update": "Actualizar",
	"reset": "Restablecer",
	"customEmojisManagerGridCommonCopySelectionRows": "Copiar filas seleccionadas",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Marcar las filas seleccionadas como objetivo a eliminar",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles que pueden usar este emoji como reacción",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si no se especifican roles, cualquiera podrá usar éste emoji como reacción.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copiar selección",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Borrar las filas de la selección",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Selección de filas para su eliminación",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "No hay Emojis actualizados",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Actualizar {count} Emoji(s). ¿Deseas continuar?",
	"somethingHappened": "Ocurrió un error",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "No se ha podido actualizar o borrar el emoji. Por favor comprueba el log del registro para más detalles.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "No hay Emojis para borrar",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Borrar {count} Emoji(s) seleccionados. ¿Deseas continuar?",
	"resetAreYouSure": "¿Desea reestablecer?",
	"customEmojisManagerLocalListConfirmResetDescription": "Se restablecerán todos los cambios hechos hasta ahora.",
	"customEmojisManagerLocalListConfirmMovePage": "¿Quieres cambiar de página?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Se han realizado cambios en los Emojis de esta página.\nSi abandonas la página sin guardar, se descartarán todos los cambios realizados en esta página.",
	"customEmojisManagerLocalTabTitleList": "Lista de emojis registrados",
	"search": "Buscar",
	"customEmojisManagerGridCommonSearchLimit": "Límite de resultados",
	"customEmojisManagerLocalListConfirmChangeView": "¿De verdad quieres cambiar la vista?",
	"customEmojisManagerGridCommonRegistrationLogs": "Log de registros "
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Supprimer",
	"update": "Mettre à jour",
	"reset": "Réinitialiser",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rôles qui peuvent utiliser cet émoji comme réaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si aucun rôle n'est spécifié, tout le monde peut utiliser cet émoji comme réaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Une erreur est survenue",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Voulez-vous réinitialiser ?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Rechercher",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Hapus",
	"update": "Perbarui",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Peran yang dapat menggunakan emoji ini sebagai reaksi",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Jika peran tidak ditentukan, semua pengguna dapat menggunakan emoji ini sebagai reaksi.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Terjadi kesalahan",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Yakin mau atur ulang?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Cari",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"customEmojisManagerLocalListEmojisNothing": "Non ci sono emoji registrate.",
	"delete": "Elimina",
	"update": "Aggiorna",
	"reset": "Ripristina",
	"customEmojisManagerGridCommonCopySelectionRows": "Copia le righe selezionate",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Selezionare le righe come eliminabili",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Ruoli che possono usare questa emoji come reazione",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Se non viene specificato alcun ruolo, chiunque può reagire con questa emoji.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copia l'intervallo selezionato",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Elimina le righe nell'intervallo selezionato",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Selezionare le righe nell'intervallo come eliminabili",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "Non ci sono emoji aggiornate.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Aggiornamento di {count} emoji. Vuoi davvero continuare?",
	"somethingHappened": "Si è verificato un problema",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Attenzione, è impossibile modificare la emoji. Si prega di controllare lo storico per ulteriori dettagli.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "Non ci sono emoji da eliminare.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Eliminazione delle {count} emoji selezionate. Vuoi davvero continuare?",
	"resetAreYouSure": "Ripristinare?",
	"customEmojisManagerLocalListConfirmResetDescription": "Verranno ripristinate tutte le modifiche apportate finora.",
	"customEmojisManagerLocalListConfirmMovePage": "Vuoi davvero spostare la pagina?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Sono state modificate le emoji in questa pagina.\nUscendo senza salvare, tutte le modifiche verranno ignorate.",
	"customEmojisManagerLocalTabTitleList": "Elenco delle emoji registrate",
	"search": "Cerca",
	"customEmojisManagerGridCommonSearchLimit": "Risultati visualizzati",
	"customEmojisManagerLocalListConfirmChangeView": "Vuoi davvero cambiare la vista?",
	"customEmojisManagerGridCommonRegistrationLogs": "Storico della registrazione"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"customEmojisManagerLocalListEmojisNothing": "登録された絵文字はありません。",
	"delete": "削除",
	"update": "更新",
	"reset": "リセット",
	"customEmojisManagerGridCommonCopySelectionRows": "選択行をコピー",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "選択行を削除対象にする",
	"rolesThatCanBeUsedThisEmojiAsReaction": "リアクションとして使えるロール",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ロールの指定が一つもない場合、誰でもリアクションとして使えます。",
	"customEmojisManagerGridCommonCopySelectionRanges": "選択範囲をコピー",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "選択範囲の値をクリア",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "選択範囲の行を削除対象にする",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "変更された絵文字はありません。",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "{count}個の絵文字を更新します。実行しますか？",
	"somethingHappened": "問題が発生しました",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "絵文字の更新・削除に失敗しました。詳細は登録ログをご確認ください。",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "削除対象の絵文字はありません。",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "チェックがつけられた{count}個の絵文字を削除します。実行しますか？",
	"resetAreYouSure": "リセットしますか？",
	"customEmojisManagerLocalListConfirmResetDescription": "今までに加えた変更がすべてリセットされます。",
	"customEmojisManagerLocalListConfirmMovePage": "ページを移動しますか？",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "このページの絵文字に変更が加えられています。\n保存せずにこのままページを移動すると、このページで加えた変更はすべて破棄されます。",
	"customEmojisManagerLocalTabTitleList": "登録済み絵文字一覧",
	"search": "検索",
	"customEmojisManagerGridCommonSearchLimit": "表示件数",
	"customEmojisManagerLocalListConfirmChangeView": "表示を変更しますか？",
	"customEmojisManagerGridCommonRegistrationLogs": "登録ログ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"customEmojisManagerLocalListEmojisNothing": "登録された絵文字はないで。",
	"delete": "ほかす",
	"update": "更新",
	"reset": "リセット",
	"customEmojisManagerGridCommonCopySelectionRows": "選択行をコピーするで",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "選択行を削除対象にするで",
	"rolesThatCanBeUsedThisEmojiAsReaction": "ツッコミとして使えるロール",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ロールが一個も指定されてへんかったら、誰でもツッコミとして使えるで。",
	"customEmojisManagerGridCommonCopySelectionRanges": "選択範囲をコピーするで",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "選択範囲の値をクリアするで",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "選択範囲の行を削除対象にするで",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "変更された絵文字はないで。",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "{count}個の絵文字を更新するで。実行してもええか？",
	"somethingHappened": "なんかあかんわ",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "絵文字の更新・削除に失敗したで。詳細は登録ログを確認してな。",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "削除対象の絵文字はないで。",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "チェックがつけられた{count}個の絵文字を削除するで。ほんまにええか？",
	"resetAreYouSure": "リセットしてええん？",
	"customEmojisManagerLocalListConfirmResetDescription": "今までやった変更が全部リセットされるで。",
	"customEmojisManagerLocalListConfirmMovePage": "ページを移動してもええんか？",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "このページの絵文字に変更が加えられてるで。\n保存せずページを移動してまうと、このページで加えた変更が全てパーになるで。",
	"customEmojisManagerLocalTabTitleList": "登録済み絵文字一覧",
	"search": "探す",
	"customEmojisManagerGridCommonSearchLimit": "表示件数",
	"customEmojisManagerLocalListConfirmChangeView": "表示を変更してもええんか？",
	"customEmojisManagerGridCommonRegistrationLogs": "登録ログ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Kkes",
	"update": "Update",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Really reset?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Nadi",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "ಅಳಿಸು",
	"update": "Update",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Really reset?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "ಹುಡುಕು",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"customEmojisManagerLocalListEmojisNothing": "등록한 이모지가 없습니다.",
	"delete": "삭제",
	"update": "업데이트",
	"reset": "초기화",
	"customEmojisManagerGridCommonCopySelectionRows": "선택한 행을 복사하기",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "선택한 행을 삭제할 대상으로 하기",
	"rolesThatCanBeUsedThisEmojiAsReaction": "이 이모지를 리액션으로 사용할 수 있는 역할",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "역할을 지정하지 않으면, 누구나 이 이모지를 리액션으로 사용할 수 있습니다.",
	"customEmojisManagerGridCommonCopySelectionRanges": "선택범위를 복사하기",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "선택한 행을 삭제",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "선택한 범위의 행을 삭제 대상으로 하기",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "변경할 이모지가 없습니다.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "{count}개의 이모지를 갱신합니다. 실행할까요?",
	"somethingHappened": "오류가 발생했습니다",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "이모지를 갱신 또는 삭제하지 못했습니다. 자세한 내용은 등록 로그를 확인해주세요.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "삭제 대상의 이모지는 없습니다.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "선택한 이모지 {count}개를 삭제합니다. 실행할까요?",
	"resetAreYouSure": "초기화 하시겠습니까?",
	"customEmojisManagerLocalListConfirmResetDescription": "지금까지 했던 변경 내용이 모두 초기화됩니다.",
	"customEmojisManagerLocalListConfirmMovePage": "페이지를 이동할까요?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "이 페이지의 이모지에 변경이 있습니다.\n저장하지 않은 상태로 페이지를 이동하면, 이 페이지에서 바꾼 변경 내용이 모두 지워집니다.",
	"customEmojisManagerLocalTabTitleList": "등록한 이모지 리스트",
	"search": "검색",
	"customEmojisManagerGridCommonSearchLimit": "표시 건수",
	"customEmojisManagerLocalListConfirmChangeView": "표시를 바꿀까요?",
	"customEmojisManagerGridCommonRegistrationLogs": "등록 로그"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Verwijderen",
	"update": "Update",
	"reset": "Herstellen",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Er is iets misgegaan.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Resetten?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Zoeken",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Slett",
	"update": "Update",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "En feil har oppstått",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Really reset?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Søk",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Usuń",
	"update": "Update",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Coś poszło nie tak",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Czy na pewno chcesz zresetować?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Szukaj",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"customEmojisManagerLocalListEmojisNothing": "Não há Emojis registrados.",
	"delete": "Excluir",
	"update": "Atualizar",
	"reset": "Redefinir",
	"customEmojisManagerGridCommonCopySelectionRows": "Copiar linhas selecionadas",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Marcar linhas selecionadas para remoção",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Cargos que podem utilizar este emoji como reação",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Se nenhum cargo for especificado, qualquer pessoa pode usar este emoji como reação.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copiar seleção",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Excluir valores selecionados",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Marcar linhas no intervalo para remoção",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "Não há Emojis atualizados.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Atualizando {count} Emoji(s). Deseja continuar?",
	"somethingHappened": "Ocorreu um erro",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Não foi possível atualizar ou remover emojis. Por favor, confira o histórico de registro para mais detalhes.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "Não há Emojis marcados para remoção.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Removendo {count} Emoji(s) marcado(s). Deseja continuar?",
	"resetAreYouSure": "Deseja reiniciar?",
	"customEmojisManagerLocalListConfirmResetDescription": "Todas as mudanças serão redefinidas.",
	"customEmojisManagerLocalListConfirmMovePage": "Deseja mudar de página?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Mudanças foram feitas nos Emojis dessa página. Se você sair sem salvar, todas serão descartadas.",
	"customEmojisManagerLocalTabTitleList": "Emojis registrados",
	"search": "Pesquisar",
	"customEmojisManagerGridCommonSearchLimit": "Limite de busca",
	"customEmojisManagerLocalListConfirmChangeView": "Deseja mudar de seção?",
	"customEmojisManagerGridCommonRegistrationLogs": "Histórico de registros"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"customEmojisManagerLocalListEmojisNothing": "Зарегистрированных эмодзи нет.",
	"delete": "Удалить",
	"update": "Обновить",
	"reset": "Сброс",
	"customEmojisManagerGridCommonCopySelectionRows": "Скопировать выбранную строку",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Пометить выбранные строки для удаления",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Роли тех, кому можно использовать эти эмодзи как реакцию",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Если здесь ничего не указать, в качестве реакции эту эмодзи сможет использовать каждый.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Скопировать выбранное",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Удалить строки в выделении",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Пометить строки в выделении для удаления",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "Никакие эмодзи не были изменены",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Что-то пошло не так",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Не удалось обновить или удалить эмодзи. Посмотрите журнал регистрации для подробностей",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "Никакие эмодзи не были удалеы",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "На самом деле сбросить?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Перенести страницу?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Зарегистрированные эмодзи",
	"search": "Поиск",
	"customEmojisManagerGridCommonSearchLimit": "Лимит поиска",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Журнал регистрации"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Odstrániť",
	"update": "Update",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Naozaj resetovať?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Hľadať",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"customEmojisManagerLocalListEmojisNothing": "ยังไม่มีเอโมจิที่ลงทะเบียนไว้",
	"delete": "ลบ",
	"update": "อัปเดต",
	"reset": "รีเซ็ต",
	"customEmojisManagerGridCommonCopySelectionRows": "คัดลอกแถวที่เลือกไว้",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "กำหนดแถวที่เลือกให้เป็นรายการสำหรับลบ",
	"rolesThatCanBeUsedThisEmojiAsReaction": "บทบาทที่สามารถใช้เอโมจินี้เป็นรีแอคชั่นได้",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ถ้าหากไม่ได้ระบุบทบาท ใคร ๆ ก็สามารถใช้เอโมจินี้เพื่อรีแอคชั่นได้",
	"customEmojisManagerGridCommonCopySelectionRanges": "คัดลือกที่เลือกไว้",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "ล้างค่าช่วงที่เลือก",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "กำหนดช่วงแถวที่เลือกให้เป็นรายการสำหรับลบ",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "ไม่มีการเปลี่ยนแปลงเอโมจิ",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "จะอัปเดตเอโมจิ {count} รายการ ดำเนินการหรือไม่?",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "การอัปเดตหรือลบเอโมจิล้มเหลว กรุณาตรวจสอบรายละเอียดในปูมการลงทะเบียน",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "ไม่มีเอโมจิที่อยู่ในรายการสำหรับลบ",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "จะลบเอโมจิที่ถูกทำเครื่องหมายไว้  {count} รายการ ดำเนินการหรือไม่?",
	"resetAreYouSure": "รีเซ็ตเลยไหม?",
	"customEmojisManagerLocalListConfirmResetDescription": "การเปลี่ยนแปลงทั้งหมดที่ทำมาจะถูกรีเซ็ต",
	"customEmojisManagerLocalListConfirmMovePage": "ต้องการเปลี่ยนหน้าหรือไม่?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "มีการเปลี่ยนแปลงเอโมจิในหน้านี้ หากเปลี่ยนหน้าโดยไม่บันทึก การเปลี่ยนแปลงทั้งหมดจะถูกละทิ้ง",
	"customEmojisManagerLocalTabTitleList": "รายการเอโมจิที่ลงทะเบียนไว้แล้ว",
	"search": "ค้นหา",
	"customEmojisManagerGridCommonSearchLimit": "จำนวนรายการที่แสดง",
	"customEmojisManagerLocalListConfirmChangeView": "ต้องการเปลี่ยนการแสดงผลหรือไม่?",
	"customEmojisManagerGridCommonRegistrationLogs": "ปูมการลงทะเบียน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"customEmojisManagerLocalListEmojisNothing": "Kayıtlı Emoji yok.",
	"delete": "Sil",
	"update": "Güncelle",
	"reset": "Sıfırla",
	"customEmojisManagerGridCommonCopySelectionRows": "Seçili satırları kopyala",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Silinecek hedef olarak seçilen satırları işaretle",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Bu emojiyi tepki olarak kullanabileceğin roller",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Herhangi bir rol belirtilmezse, herkes bu emojiyi tepki olarak kullanabilir.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Seçimi kopyala",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Seçimdeki satırları sil",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Seçimdeki satırları silinecek hedef olarak işaretle",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "Güncellenmiş Emoji yok.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "{count} Emoji'yi güncelle. Devam etmek istediğinden emin misin?",
	"somethingHappened": "Bir hata oluştu",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Emojileri güncelleyemedi veya silemedi. Ayrıntılar için kayıt günlüğünü kontrol edin.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "Silinecek Emoji yok.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "İşaretli {count} Emoji(leri) silin. Devam etmek istediğinden emin misin?",
	"resetAreYouSure": "Cidden sıfırlansın mı?",
	"customEmojisManagerLocalListConfirmResetDescription": "Şimdiye kadar yapılan tüm değişiklikler geri alınacaktır.",
	"customEmojisManagerLocalListConfirmMovePage": "Sayfaları taşımak ister misin?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Bu sayfadaki Emojilerde değişiklikler yapılmış.\nSayfayı kaydetmeden terk ederseniz, bu sayfada yapılan tüm değişiklikler silinecek.",
	"customEmojisManagerLocalTabTitleList": "Kayıtlı emojiler",
	"search": "Ara",
	"customEmojisManagerGridCommonSearchLimit": "Sonuç sayısı",
	"customEmojisManagerLocalListConfirmChangeView": "Görüntüleme şeklini değiştirmek ister misn?",
	"customEmojisManagerGridCommonRegistrationLogs": "Kayıt günlüğü"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "ئۆچۈرۈش",
	"update": "Update",
	"reset": "Reset",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Really reset?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "ئىزدەش",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Видалити",
	"update": "Оновити",
	"reset": "Скинути",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Ролі, які можуть використовувати цей емодзі як реакцію",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Якщо ролі не вказано, будь-хто може використовувати цей емодзі як реакцію.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Щось пішло не так",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Delete checked {count} Emoji(s). Are you sure to continue?",
	"resetAreYouSure": "Справді скинути?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Пошук",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"customEmojisManagerLocalListEmojisNothing": "There are no registered Emojis.",
	"delete": "Xóa",
	"update": "Cập nhật",
	"reset": "cài lại",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "Mark selected rows as a target to delete",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "Mark rows in the selection as a target to delete",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "There are no updated Emojis.",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "Update {count} Emoji(s). Are you sure to continue?",
	"somethingHappened": "Xảy ra lỗi",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "There are no Emojis to be deleted.",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "Xóa các biểu tượng cảm xúc {count} đã chọn. Bạn có muốn chạy nó không?",
	"resetAreYouSure": "Bạn có chắc muốn đặt lại?",
	"customEmojisManagerLocalListConfirmResetDescription": "All changes made so far will be reset",
	"customEmojisManagerLocalListConfirmMovePage": "Would you like to move pages?",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "Changes have been made to the Emojis on this page.\nIf you leave the page without saving, all changes made on this page will be discarded.",
	"customEmojisManagerLocalTabTitleList": "Registered emojis",
	"search": "Tìm kiếm",
	"customEmojisManagerGridCommonSearchLimit": "Search limit",
	"customEmojisManagerLocalListConfirmChangeView": "Would you like to change view?",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"customEmojisManagerLocalListEmojisNothing": "没有已注册的表情符号。",
	"delete": "删除",
	"update": "更新",
	"reset": "重置",
	"customEmojisManagerGridCommonCopySelectionRows": "复制所选行",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "将所选行标记为删除对象",
	"rolesThatCanBeUsedThisEmojiAsReaction": "可以使用表情作为回应的角色",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "在没有指定角色的情况下，任何人都可以使用表情作为回应。",
	"customEmojisManagerGridCommonCopySelectionRanges": "复制所选范围",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "删除所选范围的行",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "将所选范围的行标记为删除对象",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "没有已更改的表情符号。",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "要更新 {count} 个表情符号吗？",
	"somethingHappened": "出错了",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "更新或删除表情符号失败。详情请确认注册日志。",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "没有被标记为删除对象的表情符号。",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "要删除已选择的 {count} 个表情符号吗？",
	"resetAreYouSure": "确定要重置吗？",
	"customEmojisManagerLocalListConfirmResetDescription": "至今为止所做的所有修改都将被重置。",
	"customEmojisManagerLocalListConfirmMovePage": "要离开此页吗？",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "此页面上的表情符号已更改。\n若不保存就离开此页，此页面上所有的更改都将丢失。",
	"customEmojisManagerLocalTabTitleList": "已注册的表情符号列表",
	"search": "搜索",
	"customEmojisManagerGridCommonSearchLimit": "显示项目数",
	"customEmojisManagerLocalListConfirmChangeView": "要更改显示吗？",
	"customEmojisManagerGridCommonRegistrationLogs": "注册日志"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"customEmojisManagerLocalListEmojisNothing": "沒有登錄的表情符號。",
	"delete": "刪除",
	"update": "更新",
	"reset": "重設",
	"customEmojisManagerGridCommonCopySelectionRows": "複製選取的行",
	"customEmojisManagerLocalListMarkAsDeleteTargetRows": "將選取的行設為刪除對象",
	"rolesThatCanBeUsedThisEmojiAsReaction": "可以使用此表情符號為反應的角色",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "如沒有指定角色，任何人都可使用此表情回應。",
	"customEmojisManagerGridCommonCopySelectionRanges": "複製選取的範圍",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "刪除選取範圍的行",
	"customEmojisManagerLocalListMarkAsDeleteTargetRanges": "將選取範圍的行設為刪除對象\n",
	"customEmojisManagerLocalListAlertUpdateEmojisNothingDescription": "沒有選取需要變更的表情符號。",
	"customEmojisManagerLocalListConfirmUpdateEmojisDescription": "將更新{count}個表情符號。是否執行此操作？",
	"somethingHappened": "發生錯誤",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "更新或刪除表情符號失敗。詳情請查看登錄日誌。",
	"customEmojisManagerLocalListAlertDeleteEmojisNothingDescription": "沒有選取需要刪除的表情符號。",
	"customEmojisManagerLocalListConfirmDeleteEmojisDescription": "將刪除勾選的{count}個表情符號。是否執行此操作？",
	"resetAreYouSure": "確定要重設嗎？",
	"customEmojisManagerLocalListConfirmResetDescription": "目前所做的所有變更都會重設。",
	"customEmojisManagerLocalListConfirmMovePage": "要移動到其他頁面嗎？",
	"customEmojisManagerLocalListConfirmMovePageDesciption": "此頁面的表情符號已被更改。  \n若未儲存就直接離開此頁面，則在此頁面進行的所有更改將會被捨棄。",
	"customEmojisManagerLocalTabTitleList": "已登錄的表情符號列表",
	"search": "搜尋",
	"customEmojisManagerGridCommonSearchLimit": "顯示的數量",
	"customEmojisManagerLocalListConfirmChangeView": "要更改顯示方式嗎？",
	"customEmojisManagerGridCommonRegistrationLogs": "登錄日誌"
}
</locale>
