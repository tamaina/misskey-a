<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-if="logs.length > 0" style="display:flex; flex-direction: column; overflow-y: scroll; gap: 16px;">
		<MkSwitch v-model="showingSuccessLogs">
			<template #label>{{ $locale.sfc.showSuccessLogSwitch }}</template>
		</MkSwitch>
		<div>
			<div v-if="filteredLogs.length > 0">
				<MkGrid
					:data="filteredLogs"
					:settings="setupGrid()"
				/>
			</div>
			<div v-else>
				{{ $locale.sfc.failureLogNothing }}
			</div>
		</div>
	</div>
	<div v-else>
		{{ $locale.sfc.logNothing }}
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import MkGrid from '@features/ui/frontend/components/grid/MkGrid.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { copyGridDataToClipboard } from '@features/ui/frontend/components/grid/grid-utils.js';

import type { RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';
import type { GridSetting } from '@features/ui/frontend/components/grid/grid.js';

function setupGrid(): GridSetting {
	return {
		row: {
			showNumber: false,
			selectable: false,
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: $locale.value.sfc.copySelectionRows,
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(logs, context),
					},
				];
			},
		},
		cols: [
			{ bindTo: 'failed', title: 'failed', type: 'boolean', editable: false, width: 50 },
			{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto' },
			{ bindTo: 'name', title: 'name', type: 'text', editable: false, width: 140 },
			{ bindTo: 'error', title: 'log', type: 'text', editable: false, width: 'auto' },
		],
		cells: {
			contextMenuFactory: (col, row, value, context) => {
				return [
					{
						type: 'button',
						text: $locale.value.sfc.copySelectionRanges,
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(logs, context),
					},
				];
			},
		},
	};
}

const props = defineProps<{
	logs: RequestLogItem[];
}>();

const { logs } = toRefs(props);
const showingSuccessLogs = ref<boolean>(false);

const filteredLogs = computed(() => {
	const forceShowing = showingSuccessLogs.value;
	return logs.value.filter((log) => forceShowing || log.failed);
});
</script>

<locale locale="ar-SA" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"showSuccessLogSwitch": "Mostrar el registre d'èxit ",
	"failureLogNothing": "No hi ha registres de fallades.",
	"logNothing": "No hi ha registres.",
	"copySelectionRows": "Copiar línies seleccionades ",
	"copySelectionRanges": "Copiar selecció "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"showSuccessLogSwitch": "Erfolgsprotokoll zeigen",
	"failureLogNothing": "Es gibt kein Fehlerprotokoll.",
	"logNothing": "Keine Protokoll-Einträge.",
	"copySelectionRows": "Ausgewählte Zeilen kopieren",
	"copySelectionRanges": "Auswahl kopieren"
}
</locale>

<locale locale="en-US" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"showSuccessLogSwitch": "Mostrar registro de éxito",
	"failureLogNothing": "No hay log de fallos",
	"logNothing": "No hay logs",
	"copySelectionRows": "Copiar filas seleccionadas",
	"copySelectionRanges": "Copiar selección"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"showSuccessLogSwitch": "Mostra le azioni a buon fine",
	"failureLogNothing": "Non ci sono errori nello storico delle emoji",
	"logNothing": "Lo storico è vuoto.",
	"copySelectionRows": "Copia le righe selezionate",
	"copySelectionRanges": "Copia l'intervallo selezionato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"showSuccessLogSwitch": "成功ログを表示",
	"failureLogNothing": "失敗ログはありません。",
	"logNothing": "ログはありません。",
	"copySelectionRows": "選択行をコピー",
	"copySelectionRanges": "選択範囲をコピー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"showSuccessLogSwitch": "成功ログを表示するで",
	"failureLogNothing": "失敗ログはあらへん。",
	"logNothing": "失敗ログはあらへん。",
	"copySelectionRows": "選択行をコピーするで",
	"copySelectionRanges": "選択範囲をコピーするで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"showSuccessLogSwitch": "성공 로그를 표시",
	"failureLogNothing": "실패 로그가 없습니다.",
	"logNothing": "로그가 없습니다.",
	"copySelectionRows": "선택한 행을 복사하기",
	"copySelectionRanges": "선택범위를 복사하기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"showSuccessLogSwitch": "Exibir sucessos no histórico",
	"failureLogNothing": "Não há registro de falhas.",
	"logNothing": "Não há registros.",
	"copySelectionRows": "Copiar linhas selecionadas",
	"copySelectionRanges": "Copiar seleção"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"showSuccessLogSwitch": "Показывать журнал удачных изменений",
	"failureLogNothing": "Журнал ошибок пуст",
	"logNothing": "Журнал пуст",
	"copySelectionRows": "Скопировать выбранную строку",
	"copySelectionRanges": "Скопировать выбранное"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"showSuccessLogSwitch": "แสดงปูมที่สำเร็จ",
	"failureLogNothing": "ไม่มีปูมความล้มเหลว",
	"logNothing": "ไม่มีปูม",
	"copySelectionRows": "คัดลอกแถวที่เลือกไว้",
	"copySelectionRanges": "คัดลือกที่เลือกไว้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"showSuccessLogSwitch": "Başarı günlüğünü göster",
	"failureLogNothing": "Hata günlüğü yoktur.",
	"logNothing": "Günlük kaydı yok.",
	"copySelectionRows": "Seçili satırları kopyala",
	"copySelectionRanges": "Seçimi kopyala"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"showSuccessLogSwitch": "Show success log",
	"failureLogNothing": "There is no failure log.",
	"logNothing": "There is no log.",
	"copySelectionRows": "Copy selected rows",
	"copySelectionRanges": "Copy selection"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"showSuccessLogSwitch": "显示成功日志",
	"failureLogNothing": "没有失败日志。",
	"logNothing": "没有日志",
	"copySelectionRows": "复制所选行",
	"copySelectionRanges": "复制所选范围"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"showSuccessLogSwitch": "顯示成功日誌",
	"failureLogNothing": "沒有失敗的日誌。",
	"logNothing": "沒有日誌。",
	"copySelectionRows": "複製選取的行",
	"copySelectionRanges": "複製選取的範圍"
}
</locale>
