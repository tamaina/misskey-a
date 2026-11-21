/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, expect, it } from 'vitest';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { readDeviceAppearance, restoreDeviceAppearance } from '@features/preferences/frontend/state/device-appearance-backup.js';

const languages = ['ja-JP', 'en-US'];

beforeEach(() => window.localStorage.clear());

it('round-trips explicit appearance choices from backup without copying other device data', () => {
	miLocalStorage.setItem('lang', 'ja-JP');
	miLocalStorage.setItem('fontSize', '3');
	miLocalStorage.setItem('useSystemFont', 't');
	miLocalStorage.setItem('customCss', 'source-only');
	const snapshot = readDeviceAppearance(miLocalStorage);
	expect(snapshot).toEqual({ lang: 'ja-JP', fontSize: '3', useSystemFont: true });

	window.localStorage.clear();
	miLocalStorage.setItem('customCss', 'target-only');
	restoreDeviceAppearance(miLocalStorage, JSON.parse(JSON.stringify(snapshot)), languages);

	expect(readDeviceAppearance(miLocalStorage)).toEqual(snapshot);
	expect(miLocalStorage.getItem('customCss')).toBe('target-only');
});

it('distinguishes explicitly saved defaults from a legacy backup that lacks appearance settings', () => {
	const defaults = readDeviceAppearance(miLocalStorage);
	miLocalStorage.setItem('lang', 'en-US');
	miLocalStorage.setItem('fontSize', '2');
	miLocalStorage.setItem('useSystemFont', 't');

	restoreDeviceAppearance(miLocalStorage, undefined, languages);
	expect(readDeviceAppearance(miLocalStorage)).toEqual({ lang: 'en-US', fontSize: '2', useSystemFont: true });

	restoreDeviceAppearance(miLocalStorage, defaults, languages);
	expect(readDeviceAppearance(miLocalStorage)).toEqual({ lang: null, fontSize: null, useSystemFont: false });
});

it('ignores unknown, invalid and inherited values without changing other fields', () => {
	miLocalStorage.setItem('lang', 'en-US');
	miLocalStorage.setItem('fontSize', '2');
	miLocalStorage.setItem('useSystemFont', 't');
	miLocalStorage.setItem('customCss', 'local-only');

	restoreDeviceAppearance(miLocalStorage, { lang: 'no-such-locale', fontSize: 3, useSystemFont: 'false', customCss: 'ignored' }, languages);
	restoreDeviceAppearance(miLocalStorage, Object.create({ lang: 'ja-JP', fontSize: null, useSystemFont: false }), languages);

	expect(readDeviceAppearance(miLocalStorage)).toEqual({ lang: 'en-US', fontSize: '2', useSystemFont: true });
	expect(miLocalStorage.getItem('customCss')).toBe('local-only');

	restoreDeviceAppearance(miLocalStorage, { fontSize: '1' }, languages);
	expect(readDeviceAppearance(miLocalStorage)).toEqual({ lang: 'en-US', fontSize: '1', useSystemFont: true });
});
