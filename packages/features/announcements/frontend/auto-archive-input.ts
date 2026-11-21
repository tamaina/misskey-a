/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { formatDateTimeString } from '@features/ui/frontend/utility/format-time-string.js';

export function formatAutoArchiveInput(value: string | null | undefined): string {
	return value ? formatDateTimeString(new Date(value), 'yyyy-MM-ddTHH:mm') : '';
}

export function parseAutoArchiveInput(value: string, originalValue: string | null | undefined): number | null {
	if (originalValue != null && value === formatAutoArchiveInput(originalValue)) {
		return new Date(originalValue).getTime();
	}
	return value === '' ? null : new Date(value).getTime();
}
