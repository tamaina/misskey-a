/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { miLocalStorage } from '../local-storage.js';

type Storage = typeof miLocalStorage;

export type DeviceAppearanceBackup = {
	lang: string | null;
	fontSize: '1' | '2' | '3' | null;
	useSystemFont: boolean;
};

function isFontSize(value: unknown): value is NonNullable<DeviceAppearanceBackup['fontSize']> {
	return value === '1' || value === '2' || value === '3';
}

export function readDeviceAppearance(storage: Storage): DeviceAppearanceBackup {
	const fontSize = storage.getItem('fontSize');
	return {
		lang: storage.getItem('lang'),
		fontSize: isFontSize(fontSize) ? fontSize : null,
		useSystemFont: storage.getItem('useSystemFont') != null,
	};
}

export function restoreDeviceAppearance(storage: Storage, backup: unknown, availableLanguages: readonly string[]) {
	if (backup == null || typeof backup !== 'object' || Array.isArray(backup)) return;

	// Missing or invalid fields leave the target browser alone; null explicitly restores the default.
	const appearance = backup as Partial<Record<keyof DeviceAppearanceBackup, unknown>>;
	if (Object.hasOwn(appearance, 'lang')) {
		if (appearance.lang === null) storage.removeItem('lang');
		else if (typeof appearance.lang === 'string' && availableLanguages.includes(appearance.lang)) storage.setItem('lang', appearance.lang);
	}
	if (Object.hasOwn(appearance, 'fontSize')) {
		if (appearance.fontSize === null) storage.removeItem('fontSize');
		else if (isFontSize(appearance.fontSize)) storage.setItem('fontSize', appearance.fontSize);
	}
	if (Object.hasOwn(appearance, 'useSystemFont') && typeof appearance.useSystemFont === 'boolean') {
		if (appearance.useSystemFont) storage.setItem('useSystemFont', 't');
		else storage.removeItem('useSystemFont');
	}
}
