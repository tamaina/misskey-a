/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { calcCellWidth } from '@features/ui/frontend/components/grid/grid-utils.js';
import type { GridCellValidator } from '@features/ui/frontend/components/grid/cell-validators.js';
import type { Size, SizeStyle } from '@features/ui/frontend/components/grid/grid.js';
import type { CellValue, GridCell } from '@features/ui/frontend/components/grid/cell.js';
import type { GridRow } from '@features/ui/frontend/components/grid/row.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { GridContext } from '@features/ui/frontend/components/grid/grid-event.js';

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'image' | 'hidden';

export type CustomValueEditor = (row: GridRow, col: GridColumn, value: CellValue, cellElement: HTMLElement) => Promise<CellValue>;
export type CellValueTransformer = (row: GridRow, col: GridColumn, value: CellValue) => CellValue;
export type GridColumnContextMenuFactory = (col: GridColumn, context: GridContext) => MenuItem[];

export type GridColumnSetting = {
	bindTo: string;
	title?: string;
	icon?: string;
	type: ColumnType;
	width: SizeStyle;
	editable?: boolean;
	validators?: GridCellValidator[];
	customValueEditor?: CustomValueEditor;
	valueTransformer?: CellValueTransformer;
	contextMenuFactory?: GridColumnContextMenuFactory;
	events?: {
		copy?: (value: CellValue) => string;
		paste?: (text: string) => CellValue;
		delete?: (cell: GridCell, context: GridContext) => void;
	}
};

export type GridColumn = {
	index: number;
	setting: GridColumnSetting;
	width: string;
	contentSize: Size;
};

export function createColumn(setting: GridColumnSetting, index: number): GridColumn {
	return {
		index,
		setting,
		width: calcCellWidth(setting.width),
		contentSize: { width: 0, height: 0 },
	};
}

