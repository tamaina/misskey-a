<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer">
	<div class="_gaps">
		<MkFolder>
			<template #icon><i class="ti ti-settings"></i></template>
			<template #label>{{ $locale.sfc.customEmojisManagerLocalRegisterUploadSettingTitle }}</template>
			<template #caption>{{ $locale.sfc.customEmojisManagerLocalRegisterUploadSettingDescription }}</template>

			<div class="_gaps">
				<MkSelect v-model="selectedFolderId" :items="selectedFolderIdDef">
					<template #label>{{ $locale.sfc.uploadFolder }}</template>
				</MkSelect>

				<MkSwitch v-model="directoryToCategory">
					<template #label>{{ $locale.sfc.customEmojisManagerLocalRegisterDirectoryToCategoryLabel }}</template>
					<template #caption>{{ $locale.sfc.customEmojisManagerLocalRegisterDirectoryToCategoryCaption }}</template>
				</MkSwitch>
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

		<div class="_buttonsCenter">
			<MkButton primary rounded @click="onFileSelectClicked">{{ $locale.sfc.upload }}</MkButton>
			<MkButton primary rounded @click="onDriveSelectClicked">{{ $locale.sfc.fromDrive }}</MkButton>
		</div>

		<div v-if="gridItems.length > 0" :class="$style.gridArea">
			<MkGrid
				:data="gridItems"
				:settings="setupGrid()"
				@event="onGridEvent"
			/>
		</div>

		<div v-if="gridItems.length > 0" :class="$style.footer">
			<MkButton primary :disabled="registerButtonDisabled" @click="onRegistryClicked">
				{{ $locale.sfc.registration }}
			</MkButton>
			<MkButton @click="onClearClicked">
				{{ $locale.sfc.clear }}
			</MkButton>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { computed, onMounted, ref, useCssModule } from 'vue';
import type { RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';
import type { GridCellValidationEvent, GridCellValueChangeEvent, GridEvent } from '@features/ui/frontend/components/grid/grid-event.js';
import type { DroppedFile } from '@features/drive/frontend/utility/file-drop.js';
import type { GridSetting } from '@features/ui/frontend/components/grid/grid.js';
import type { GridRow } from '@features/ui/frontend/components/grid/row.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import {
	emptyStrToEmptyArray,
	emptyStrToNull,
	roleIdsParser,
} from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';
import MkGrid from '@features/ui/frontend/components/grid/MkGrid.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { validators } from '@features/ui/frontend/components/grid/cell-validators.js';
import { chooseDriveFile, chooseFileFromPcAndUpload } from '@features/drive/frontend/utility/drive.js';
import { extractDroppedItems, flattenDroppedFiles } from '@features/drive/frontend/utility/file-drop.js';
import XRegisterLogs from '@features/emojis/frontend/pages/admin/custom-emojis-manager.logs.vue';
import { copyGridDataToClipboard } from '@features/ui/frontend/components/grid/grid-utils.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

import { prefer } from '@features/preferences/frontend/preferences.js';

const MAXIMUM_EMOJI_REGISTER_COUNT = 100;

type FolderItem = {
	id?: string;
	name: string;
};

type GridItem = {
	fileId: string;
	url: string;
	name: string;
	host: string;
	category: string;
	aliases: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: { id: string, name: string }[];
	type: string | null;
};

function setupGrid(): GridSetting {
	const $style = useCssModule();

	const required = validators.required();
	const regex = validators.regex(/^[a-zA-Z0-9_]+$/);
	const unique = validators.unique();

	function removeRows(rows: GridRow[]) {
		const idxes = [...new Set(rows.map(it => it.index))];
		gridItems.value = gridItems.value.filter((_, i) => !idxes.includes(i));
	}

	return {
		row: {
			showNumber: true,
			selectable: true,
			minimumDefinitionCount: 100,
			styleRules: [
				{
					// 1つでもバリデーションエラーがあれば行全体をエラー表示する
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
						text: $locale.value.sfc.customEmojisManagerGridCommonDeleteSelectionRows,
						icon: 'ti ti-trash',
						action: () => removeRows(context.rangedRows),
					},
				];
			},
			events: {
				delete(rows) {
					removeRows(rows);
				},
			},
		},
		cols: [
			{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto', validators: [required] },
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
				valueTransformer: (row) => {
					// バックエンドからからはIDと名前のペア配列で受け取るが、表示にIDがあると煩雑なので名前だけにする
					return gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction
						.map((it) => it.name)
						.join(',');
				},
				customValueEditor: async (row) => {
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
		],
		cells: {
			// セルのコンテキストメニュー設定
			contextMenuFactory: (col, row, value, context) => {
				return [
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerGridCommonCopySelectionRanges,
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(gridItems, context),
					},
					{
						type: 'button',
						text: $locale.value.sfc.customEmojisManagerGridCommonDeleteSelectionRanges,
						icon: 'ti ti-trash',
						action: () => removeRows(context.rangedCells.map(it => it.row)),
					},
				];
			},
		},
	};
}

const uploadFolders = ref<FolderItem[]>([]);
const gridItems = ref<GridItem[]>([]);
const {
	model: selectedFolderId,
	def: selectedFolderIdDef,
} = useMkSelect({
	items: computed(() => uploadFolders.value.map(folder => ({ label: folder.name, value: folder.id || '' }))),
	initialValue: prefer.s.uploadFolder,
});
const directoryToCategory = ref<boolean>(false);
const registerButtonDisabled = ref<boolean>(false);
const requestLogs = ref<RequestLogItem[]>([]);
const isDragOver = ref<boolean>(false);

async function onRegistryClicked() {
	const dialogSelection = await os.confirm({
		type: 'info',
		text: interpolateLocaleParameters($locale.value.sfc.customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription, { count: MAXIMUM_EMOJI_REGISTER_COUNT }),
	});

	if (dialogSelection.canceled) {
		return;
	}

	const items = gridItems.value;
	const upload = () => {
		return items.slice(0, MAXIMUM_EMOJI_REGISTER_COUNT)
			.map(item =>
				misskeyApi(
					'admin/emoji/add', {
						name: item.name,
						category: emptyStrToNull(item.category),
						aliases: emptyStrToEmptyArray(item.aliases),
						license: emptyStrToNull(item.license),
						isSensitive: item.isSensitive,
						localOnly: item.localOnly,
						roleIdsThatCanBeUsedThisEmojiAsReaction: item.roleIdsThatCanBeUsedThisEmojiAsReaction.map(it => it.id),
						fileId: item.fileId!,
					})
					.then(() => ({ item, success: true, err: undefined }))
					.catch(err => ({ item, success: false, err })),
			);
	};

	const result = await os.promiseDialog(Promise.all(upload()));
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

	// 登録に成功したものは一覧から除く
	const successItems = result.filter(it => it.success).map(it => it.item);
	gridItems.value = gridItems.value.filter(it => !successItems.includes(it));
}

async function onClearClicked() {
	const result = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.customEmojisManagerLocalRegisterConfirmClearEmojisDescription,
	});

	if (!result.canceled) {
		gridItems.value = [];
	}
}

async function onFileSelectClicked() {
	const driveFiles = await chooseFileFromPcAndUpload({
		multiple: true,
		folderId: selectedFolderId.value,
		// // 拡張子は消す
		// nameConverter: (file) => file.name.replace(/\.[a-zA-Z0-9]+$/, ''),
	});

	gridItems.value.push(...driveFiles.map(fromDriveFile));
}

async function onDriveSelectClicked() {
	const driveFiles = await chooseDriveFile({
		multiple: true,
	});
	gridItems.value.push(...driveFiles.map(fromDriveFile));
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
	registerButtonDisabled.value = event.all.filter(it => !it.valid).length > 0;
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		(gridItems.value[row.index] as any)[column.setting.bindTo] = newValue;
	}
}

function fromDriveFile(it: Misskey.entities.DriveFile): GridItem {
	return {
		fileId: it.id,
		url: it.url,
		name: it.name.replace(/(\.[a-zA-Z0-9]+)+$/, '').replaceAll('-', '_').replaceAll(' ', '_'),
		host: '',
		category: '',
		aliases: '',
		license: '',
		isSensitive: it.isSensitive,
		localOnly: false,
		roleIdsThatCanBeUsedThisEmojiAsReaction: [],
		type: it.type,
	};
}

async function refreshUploadFolders() {
	const result = await misskeyApi('drive/folders', {});
	uploadFolders.value = Array.of<FolderItem>({ name: '-' }, ...result);
}

onMounted(async () => {
	await refreshUploadFolders();
});
</script>

<style module lang="scss">
.violationRow {
	background-color: var(--MI_THEME-infoWarnBg);
}

.gridArea {
	padding-top: 8px;
	padding-bottom: 8px;
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

	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-end;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "المجلد الافتراضي للرفع",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "ارفع",
	"fromDrive": "من المخزن",
	"registration": "إنشاء حساب",
	"clear": "عودة",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "الأدوار التي يُسمح لأصحابها استخدام هذا اإيموجي في اللتفاعل",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "إذا لم تحدد دورًا يمكن للجميع استخدام هذا الإيموجي في التفاعل.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "حدث خطأ",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Actualitza la configuració ",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "En aquesta pantalla pots configurar el que s'ha de fer quan es puja un Emoji.",
	"uploadFolder": "Carpeta per defecte on desar els arxius pujats",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Escriu el nom del directori al camp de \"categoria\"",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "Quan arrossegues un directori, escriu el nom del directori al camp categoria.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registres d'inscripcions ",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Quan s'actualitzin o s'esborrin emojis es mostrarà un registre. Desapareixeran quan s'actualitzin, s'esborrin, visitis una nova pàgina o la recarreguis.",
	"upload": "Puja",
	"fromDrive": "Des del Disc",
	"registration": "Registre",
	"clear": "Tornar",
	"customEmojisManagerGridCommonCopySelectionRows": "Copiar línies seleccionades ",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Esborrar línies seleccionades",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rols que poden fer servir aquest emoji com a reacció ",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si cap rol es especificat tothom ho pot fer servir",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copiar selecció ",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Esborrar files de la selecció ",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Registrar els Emojis de la llista com a nous Emojis personalitzats. Vols continuar? (Per evitar una sobrecàrrega només {count} Emojis es poden registrar d'una sola vegada)",
	"somethingHappened": "S'ha produït un error",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "No s'ha pogut actualitzar o esborrar l'emoji. Si us plau, dona una ullada al registre per més detalls.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Descartar els canvis i esborrar els Emojis de la llista. Vols continuar?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Výchozí lokace pro upload",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Nahrát soubory",
	"fromDrive": "Z disku",
	"registration": "Registrace",
	"clear": "Vrátit",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Role, které můžou tuhle emoji použít jako reakci",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Pokud nejsou určena role, tak pak každý může použít tenhle emoji.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Default folder for uploads",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"registration": "Register",
	"clear": "Return",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload-Einstellungen",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "Hier kannst du das Verhalten beim Hochladen von Emojis konfigurieren.",
	"uploadFolder": "Standardordner für Uploads",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Gib den Namen des Verzeichnisses in das Feld „Kategorie“ ein",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "Wenn du ein Verzeichnis ziehst und ablegst, gib den Verzeichnisnamen in das Feld „Kategorie“ ein.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registrierungsprotokoll",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Protokolle werden beim Aktualisieren oder Löschen von Emojis angezeigt. Sie verschwinden nach dem Aktualisieren oder Löschen, dem Wechsel zu einer neuen Seite oder dem Neuladen.",
	"upload": "Hochladen",
	"fromDrive": "Aus Drive",
	"registration": "Registrieren",
	"clear": "Zurückkehren",
	"customEmojisManagerGridCommonCopySelectionRows": "Ausgewählte Zeilen kopieren",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Ausgewählte Zeilen löschen",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rollen, die dieses Emoji als Reaktion verwenden können",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Sind keine Rollen angegeben, kann jeder dieses Emoji als Reaktion verwenden.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Auswahl kopieren",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Zeilen in der Auswahl löschen",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Füge die in der Liste aufgeführten Emojis als neue benutzerdefinierte Emojis hinzu. Bist du sicher? (Um eine Überlastung zu vermeiden, können nur {count} Emoji(s) in einem Vorgang hinzugefügt werden)",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Emoji konnte nicht aktualisiert oder gelöscht werden. Bitte prüfe das Registrierungsprotokoll für Details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Verwerfe die Bearbeitungen und lösche die Emojis aus der Liste. Bist du sicher, dass du fortfahren möchtest?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Default folder for uploads",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"registration": "Register",
	"clear": "Return",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Ajustes de carga",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "En esta pantalla, puedes configurar el comportamiento al cargar Emojis.",
	"uploadFolder": "Carpeta de subidas por defecto",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Introduce el nombre del directorio en el campo \"categoría\"",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "Cuando arrastres y sueltes un directorio, introduce el nombre del directorio en el campo \"categoría\".",
	"customEmojisManagerGridCommonRegistrationLogs": "Log de registros ",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Los registros se mostrarán al actualizar o borrar Emojis. Desaparecerán después de actualizarlos o eliminarlos, pasar a una nueva página o recargar.",
	"upload": "Subir",
	"fromDrive": "Desde el drive",
	"registration": "Registro",
	"clear": "Limpiar",
	"customEmojisManagerGridCommonCopySelectionRows": "Copiar filas seleccionadas",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Borrar las líneas seleccionadas",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles que pueden usar este emoji como reacción",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si no se especifican roles, cualquiera podrá usar éste emoji como reacción.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copiar selección",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Borrar las filas de la selección",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Registra los Emojis de la lista como nuevos Emojis personalizados. ¿Estás seguro de continuar? (Para evitar sobrecargas, sólo {count} Emoji(s) en una sola operación)",
	"somethingHappened": "Ocurrió un error",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "No se ha podido actualizar o borrar el emoji. Por favor comprueba el log del registro para más detalles.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Descartar las ediciones y borrar los Emojis de la lista. ¿Estás seguro de continuar?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Emplacement de téléversement par défaut",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Téléverser",
	"fromDrive": "Depuis le Disque",
	"registration": "S’inscrire",
	"clear": "Effacer",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rôles qui peuvent utiliser cet émoji comme réaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si aucun rôle n'est spécifié, tout le monde peut utiliser cet émoji comme réaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Une erreur est survenue",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Lokasi unggah folder bawaan",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Unggah",
	"fromDrive": "Dari Drive",
	"registration": "Pendaftaran",
	"clear": "Bersihkan",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Peran yang dapat menggunakan emoji ini sebagai reaksi",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Jika peran tidak ditentukan, semua pengguna dapat menggunakan emoji ini sebagai reaksi.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Terjadi kesalahan",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Caricamento impostazioni",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "Questa schermata ti permette di scegliere il comportamento durante il caricamento delle emoji.",
	"uploadFolder": "Destinazione caricamento predefinita",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Inseriscile in una cartella omonima alla categoria",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "Crea il campo categoria in base alla cartella.",
	"customEmojisManagerGridCommonRegistrationLogs": "Storico della registrazione",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Lo storico verrà visualizzato in base alla attività sulle emoji. Scompare quando si esegue un'operazione di aggiornamento/eliminazione o si modifica/ricarica la pagina.",
	"upload": "Carica",
	"fromDrive": "Dal Drive",
	"registration": "Registrazione",
	"clear": "Cancella",
	"customEmojisManagerGridCommonCopySelectionRows": "Copia le righe selezionate",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Elimina le righe selezionate",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Ruoli che possono usare questa emoji come reazione",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Se non viene specificato alcun ruolo, chiunque può reagire con questa emoji.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copia l'intervallo selezionato",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Elimina le righe nell'intervallo selezionato",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Registrazione delle emoji elencate come nuove emoji personalizzate. Vuoi davvero procedere? (Per evitare sovraccarichi, puoi registrare al massimo {count} emoji per volta)",
	"somethingHappened": "Si è verificato un problema",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Attenzione, è impossibile modificare la emoji. Si prega di controllare lo storico per ulteriori dettagli.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Annullare le modifiche e cancella le emoji nell'elenco. Confermi?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "アップロード設定",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "この画面で絵文字アップロードを行う際の動作を設定できます。",
	"uploadFolder": "既定アップロード先",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "ディレクトリ名を\"category\"に入力する",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "ディレクトリをドラッグ・ドロップした時に、ディレクトリ名を\"category\"に入力します。",
	"customEmojisManagerGridCommonRegistrationLogs": "登録ログ",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "絵文字更新・削除時のログが表示されます。更新・削除操作を行ったり、ページを遷移・リロードすると消えます。",
	"upload": "アップロード",
	"fromDrive": "ドライブから",
	"registration": "登録",
	"clear": "クリア",
	"customEmojisManagerGridCommonCopySelectionRows": "選択行をコピー",
	"customEmojisManagerGridCommonDeleteSelectionRows": "選択行を削除",
	"rolesThatCanBeUsedThisEmojiAsReaction": "リアクションとして使えるロール",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ロールの指定が一つもない場合、誰でもリアクションとして使えます。",
	"customEmojisManagerGridCommonCopySelectionRanges": "選択範囲をコピー",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "選択範囲の値をクリア",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "リストに表示されている絵文字を新たなカスタム絵文字として登録します。よろしいですか？（負荷を避けるため、一度の操作で登録可能な絵文字は{count}件までです）",
	"somethingHappened": "問題が発生しました",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "絵文字の更新・削除に失敗しました。詳細は登録ログをご確認ください。",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "編集内容を破棄し、リストに表示されている絵文字をクリアします。よろしいですか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "アップロード設定",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "この画面で絵文字アップロードするときの動きを設定できるで。",
	"uploadFolder": "とりあえずアップロードしたやつ置いとく所",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "ディレクトリ名を\"category\"に入力する",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "ディレクトリをドラッグ・ドロップした時に、ディレクトリ名を\"category\"に入力します。",
	"customEmojisManagerGridCommonRegistrationLogs": "登録ログ",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "絵文字更新・削除時のログが表示されるで。更新・削除操作をしたり、ページを遷移・リロードしたら消えるから気ぃつけてな。",
	"upload": "アップロード",
	"fromDrive": "ドライブから",
	"registration": "登録",
	"clear": "クリア",
	"customEmojisManagerGridCommonCopySelectionRows": "選択行をコピーするで",
	"customEmojisManagerGridCommonDeleteSelectionRows": "選択行を削除するで",
	"rolesThatCanBeUsedThisEmojiAsReaction": "ツッコミとして使えるロール",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ロールが一個も指定されてへんかったら、誰でもツッコミとして使えるで。",
	"customEmojisManagerGridCommonCopySelectionRanges": "選択範囲をコピーするで",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "選択範囲の値をクリアするで",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "リストに表示されてる絵文字を新たなカスタム絵文字として登録するで。ほんまにええか？ (サーバーがしんどくなるから、一回で登録できる絵文字は{count}件までやで)",
	"somethingHappened": "なんかあかんわ",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "絵文字の更新・削除に失敗したで。詳細は登録ログを確認してな。",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "編集内容をほかして、リストに表示されている絵文字をクリアするで。ほんまにええか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Default folder for uploads",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"registration": "Register",
	"clear": "Return",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Default folder for uploads",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"registration": "Register",
	"clear": "Return",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "업로드 설정",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "여기서 이모지를 업로드 할 때의 동작을 설정할 수 있습니다.",
	"uploadFolder": "기본 업로드 위치",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "디렉토리 이름을 \"category\"로 입력하기",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "디렉토리를 드래그 앤 드롭한 경우, 디렉토리 이름을 \"category\"로 입력합니다.",
	"customEmojisManagerGridCommonRegistrationLogs": "등록 로그",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "이모지를 갱신하거나 삭제할 때 로그가 표시됩니다. 갱신 또는 삭제하거나, 페이지 이동, 새로 고침하면 삭제됩니다.",
	"upload": "업로드",
	"fromDrive": "드라이브에서",
	"registration": "등록",
	"clear": "지우기",
	"customEmojisManagerGridCommonCopySelectionRows": "선택한 행을 복사하기",
	"customEmojisManagerGridCommonDeleteSelectionRows": "선택한 행을 삭제",
	"rolesThatCanBeUsedThisEmojiAsReaction": "이 이모지를 리액션으로 사용할 수 있는 역할",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "역할을 지정하지 않으면, 누구나 이 이모지를 리액션으로 사용할 수 있습니다.",
	"customEmojisManagerGridCommonCopySelectionRanges": "선택범위를 복사하기",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "선택한 행을 삭제",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "리스트에 표시되어진 이모지를 새로운 커스텀 이모지로 등록합니다. 실행할까요? (부하를 피하기 위해, 한 번에 등록할 수 있는 이모지는 {count}건까지 입니다.)",
	"somethingHappened": "오류가 발생했습니다",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "이모지를 갱신 또는 삭제하지 못했습니다. 자세한 내용은 등록 로그를 확인해주세요.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "편집 내용을 지우고, 목록에 표시되어진 이모지를 지웁니다. 실행할까요?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Standaardmap voor uploaden",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Uploaden",
	"fromDrive": "Van schijf",
	"registration": "Registreren",
	"clear": "Terugkeren",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Er is iets misgegaan.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Default folder for uploads",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Laste opp",
	"fromDrive": "From Drive",
	"registration": "Registrer",
	"clear": "Tøm",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "En feil har oppstått",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Domyślne położenie wysłanych",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Wyślij",
	"fromDrive": "Z dysku",
	"registration": "Zarejestruj się",
	"clear": "Wróć",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Coś poszło nie tak",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Configurações de envio",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "Nessa tela, você pode configurar o comportamento ao enviar Emojis.",
	"uploadFolder": "Destino de upload padrão",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Transformar as pastas em categorias",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "Quando você arrastar um diretório, converter o caminho das pastas no campo \"categoria\".",
	"customEmojisManagerGridCommonRegistrationLogs": "Histórico de registros",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Atualizações e remoções de emoji serão gravadas no histórico. Atualizar, remover, mover a uma nova página ou recarregar limpará o histórico",
	"upload": "Fazer upload",
	"fromDrive": "Do drive",
	"registration": "Registar",
	"clear": "Limpar",
	"customEmojisManagerGridCommonCopySelectionRows": "Copiar linhas selecionadas",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Excluir linhas selecionadas",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Cargos que podem utilizar este emoji como reação",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Se nenhum cargo for especificado, qualquer pessoa pode usar este emoji como reação.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copiar seleção",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Excluir valores selecionados",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Registrando os Emojis da lista como novos Emojis personalizados. Deseja continuar? (Para evitar sobrecarga, apenas {count} Emoji(s) podem ser registrados em uma única operação)",
	"somethingHappened": "Ocorreu um erro",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Não foi possível atualizar ou remover emojis. Por favor, confira o histórico de registro para mais detalhes.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Descartando edições e limpando Emojis da lista. Deseja continuar?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Место загрузки по умолчанию",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Журнал регистрации",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Журнал будет показан при изменении или удалении эмодзи. Он будет очищен при их изменении или удалении, перемещении на новую страницу или обновлении страницы.",
	"upload": "Загрузить",
	"fromDrive": "С Диска",
	"registration": "Регистрация",
	"clear": "Очистить",
	"customEmojisManagerGridCommonCopySelectionRows": "Скопировать выбранную строку",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Удалить выбранные строки",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Роли тех, кому можно использовать эти эмодзи как реакцию",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Если здесь ничего не указать, в качестве реакции эту эмодзи сможет использовать каждый.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Скопировать выбранное",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Удалить строки в выделении",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Что-то пошло не так",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Не удалось обновить или удалить эмодзи. Посмотрите журнал регистрации для подробностей",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Predvolený priečinok pre nahrávanie",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Nahrať súbor",
	"fromDrive": "Z disku",
	"registration": "Registrácia",
	"clear": "Vrátiť",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "ตั้งค่าการอัปโหลด",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "สามารถกำหนดพฤติกรรมขณะอัปโหลดเอโมจิจากหน้าจอนี้ได้",
	"uploadFolder": "โฟลเดอร์เริ่มต้นสำหรับอัปโหลด",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "ป้อนชื่อไดเรกทอรีเป็น \"category\"",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "เมื่อทำการลากและวางไดเรกทอรี ชื่อจะถูกป้อนเป็น \"category\"",
	"customEmojisManagerGridCommonRegistrationLogs": "ปูมการลงทะเบียน",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "จะแสดงปูมเมื่อมีการอัปเดตหรือลบเอโมจิ หากดำเนินการอัปเดต/ลบ หรือเปลี่ยนหน้า/รีโหลด หน้านี้ ปูมจะหายไป",
	"upload": "อัปโหลด",
	"fromDrive": "จากไดรฟ์",
	"registration": "ลงทะเบียน",
	"clear": "ล้าง",
	"customEmojisManagerGridCommonCopySelectionRows": "คัดลอกแถวที่เลือกไว้",
	"customEmojisManagerGridCommonDeleteSelectionRows": "ลบแถวที่เลือกไว้",
	"rolesThatCanBeUsedThisEmojiAsReaction": "บทบาทที่สามารถใช้เอโมจินี้เป็นรีแอคชั่นได้",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ถ้าหากไม่ได้ระบุบทบาท ใคร ๆ ก็สามารถใช้เอโมจินี้เพื่อรีแอคชั่นได้",
	"customEmojisManagerGridCommonCopySelectionRanges": "คัดลือกที่เลือกไว้",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "ล้างค่าช่วงที่เลือก",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "จะลงทะเบียนเอโมจิที่แสดงในรายการเป็นเอโมจิแบบกำหนดเองใหม่\nดำเนินการต่อหรือไม่? (เพื่อหลีกเลี่ยงภาระโหลดหนัก ระบบจะสามารถลงทะเบียนเอโมจิได้สูงสุด {count} รายการต่อครั้ง)",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "การอัปเดตหรือลบเอโมจิล้มเหลว กรุณาตรวจสอบรายละเอียดในปูมการลงทะเบียน",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "ต้องการยกเลิกการแก้ไขและล้างรายการเอโมจิที่แสดงอยู่หรือไม่?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Yükleme ayarları",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "Bu ekranda, Emoji yüklerken davranışı yapılandırabilirsin.",
	"uploadFolder": "Yüklemeler için varsayılan klasör",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "“Kategori” alanına dizin adını girin.",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "Bir dizini sürükleyip bıraktığınızda, “kategori” alanına dizin adını girin.",
	"customEmojisManagerGridCommonRegistrationLogs": "Kayıt günlüğü",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Emojileri güncellerken veya silerken günlükler görüntülenecek. Güncelleme veya silme işleminden sonra, yeni bir sayfaya geçildiğinde veya yeniden yüklendiğinde günlükler kaybolacak.",
	"upload": "Yükle",
	"fromDrive": "Drive'den",
	"registration": "Kaydol",
	"clear": "Temizle",
	"customEmojisManagerGridCommonCopySelectionRows": "Seçili satırları kopyala",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Seçili satırları sil",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Bu emojiyi tepki olarak kullanabileceğin roller",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Herhangi bir rol belirtilmezse, herkes bu emojiyi tepki olarak kullanabilir.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Seçimi kopyala",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Seçimdeki satırları sil",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Listeden Emojileri yeni özel Emojiler olarak kaydet. Devam etmek istediğinden emin misin? (Aşırı yüklemeyi önlemek için, tek bir işlemde yalnızca {count} Emoji kaydedilebilir)",
	"somethingHappened": "Bir hata oluştu",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Emojileri güncelleyemedi veya silemedi. Ayrıntılar için kayıt günlüğünü kontrol edin.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Düzenlemeleri sil ve listeden Emojileri temizle. Devam etmek istediğinden emin misiniz?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Default folder for uploads",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Upload",
	"fromDrive": "From Drive",
	"registration": "Register",
	"clear": "Return",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "An error has occurred",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Місце для завантаження за замовчуванням",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Завантажити",
	"fromDrive": "З диска",
	"registration": "Реєстрація",
	"clear": "Очистити",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Ролі, які можуть використовувати цей емодзі як реакцію",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Якщо ролі не вказано, будь-хто може використовувати цей емодзі як реакцію.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Щось пішло не так",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "Upload settings",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "On this screen, you can configure the behavior when uploading Emojis.",
	"uploadFolder": "Thư mục tải lên mặc định",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "Enter the directory name in the \"category\" field",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "When you drag and drop a directory, enter the directory name in the \"category\" field.",
	"customEmojisManagerGridCommonRegistrationLogs": "Registration log",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "Logs will be displayed when updating or deleting Emojis. They will disappear after updating or deleting them, moving to a new page, or reloading.",
	"upload": "Tải lên",
	"fromDrive": "Từ ổ đĩa",
	"registration": "Đăng ký",
	"clear": "Hoàn lại",
	"customEmojisManagerGridCommonCopySelectionRows": "Copy selected rows",
	"customEmojisManagerGridCommonDeleteSelectionRows": "Delete selected rows",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"customEmojisManagerGridCommonCopySelectionRanges": "Copy selection",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "Delete rows in the selection",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "Register the Emojis from the list as new custom Emojis. Are you sure to continue? (To avoid overload, only {count} Emoji(s) can be registered in a single operation)",
	"somethingHappened": "Xảy ra lỗi",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "Failed to update or delete Emojis. Please check the registration log for details.",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "Discard the edits and clear the Emojis from the list. Are you sure to continue?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "上传设置",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "可以在此页面设置上传表情符号时的行为。",
	"uploadFolder": "默认上传文件夹",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "将目录名设为 “category”",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "拖放目录时，将目录名设置为 “category”。",
	"customEmojisManagerGridCommonRegistrationLogs": "注册日志",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "将显示更新和删除表情符号的日志。执行更新或删除操作，又或者更改或重新加载页面时会消失。",
	"upload": "本地上传",
	"fromDrive": "从网盘中",
	"registration": "注册",
	"clear": "清除",
	"customEmojisManagerGridCommonCopySelectionRows": "复制所选行",
	"customEmojisManagerGridCommonDeleteSelectionRows": "删除所选行",
	"rolesThatCanBeUsedThisEmojiAsReaction": "可以使用表情作为回应的角色",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "在没有指定角色的情况下，任何人都可以使用表情作为回应。",
	"customEmojisManagerGridCommonCopySelectionRanges": "复制所选范围",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "删除所选范围的行",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "要将列表内显示的表情符号替换为新的自定义表情符号吗？（为降低服务器负载，一次操作最多只能注册 {count} 个表情符号）",
	"somethingHappened": "出错了",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "更新或删除表情符号失败。详情请确认注册日志。",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "要放弃编辑并将列表内表示的表情符号清空吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"customEmojisManagerLocalRegisterUploadSettingTitle": "上傳設定",
	"customEmojisManagerLocalRegisterUploadSettingDescription": "您可以在此畫面設定表情符號上傳時的操作。",
	"uploadFolder": "預設上傳資料夾",
	"customEmojisManagerLocalRegisterDirectoryToCategoryLabel": "在「類別」欄位中輸入目錄名稱",
	"customEmojisManagerLocalRegisterDirectoryToCategoryCaption": "拖放目錄時，請在「類別」欄位中輸入目錄名稱。",
	"customEmojisManagerGridCommonRegistrationLogs": "登錄日誌",
	"customEmojisManagerGridCommonRegistrationLogsCaption": "會顯示更新或刪除表情符號時的日誌。進行更新或刪除操作，或切換頁面、重新載入後，日誌將會消失。",
	"upload": "上傳",
	"fromDrive": "從雲端空間中選擇",
	"registration": "註冊",
	"clear": "清除",
	"customEmojisManagerGridCommonCopySelectionRows": "複製選取的行",
	"customEmojisManagerGridCommonDeleteSelectionRows": "刪除所選的行",
	"rolesThatCanBeUsedThisEmojiAsReaction": "可以使用此表情符號為反應的角色",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "如沒有指定角色，任何人都可使用此表情回應。",
	"customEmojisManagerGridCommonCopySelectionRanges": "複製選取的範圍",
	"customEmojisManagerGridCommonDeleteSelectionRanges": "刪除選取範圍的行",
	"customEmojisManagerLocalRegisterConfirmRegisterEmojisDescription": "將列表中顯示的表情符號登錄為新的自定表情符號。是否確定？（為避免過高負荷，每次操作最多可登錄{count}個表情符號）",
	"somethingHappened": "發生錯誤",
	"customEmojisManagerGridCommonAlertEmojisRegisterFailedDescription": "更新或刪除表情符號失敗。詳情請查看登錄日誌。",
	"customEmojisManagerLocalRegisterConfirmClearEmojisDescription": "放棄編輯內容並清除列表中顯示的表情符號。是否確定？"
}
</locale>
