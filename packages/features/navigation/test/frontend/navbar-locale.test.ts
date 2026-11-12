/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp } from 'vue';
import { expect, test, vi } from 'vitest';
import { createInternationalization, useLocale } from 'virtual:vite-vue-internationalization';
import { locales } from 'i18n';
import { navbarItemDef } from '../../frontend/navbar.js';
import * as os from '@features/ui/frontend/os.js';

// Keep the actual navbar and generated VVI runtime; isolate unrelated app services.
vi.mock('@features/runtime/frontend/utility/clear-cache.js', () => ({ clearCache: vi.fn() }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: null }));
vi.mock('@features/preferences/frontend/local-storage.js', () => ({ miLocalStorage: { setItem: vi.fn() } }));
vi.mock('@features/navigation/frontend/ui/_common_/common.js', () => ({ openInstanceMenu: vi.fn(), openToolsMenu: vi.fn() }));
vi.mock('@features/discovery/frontend/utility/lookup.js', () => ({ lookup: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ popupMenu: vi.fn() }));
vi.mock('@features/runtime/frontend/utility/unison-reload.js', () => ({ unisonReload: vi.fn() }));

test('navbar imported before runtime installation resolves catalog titles when read after installation', async () => {
	// The static navbar import above must neither look up an active runtime nor
	// snapshot empty labels. No createInternationalization() has run yet.
	expect(() => useLocale(import.meta.url).value.env.search).toThrow();

	const language = 'en-US';
	const internationalization = createInternationalization({ initialLocale: language });
	await internationalization.ready;
	const app = createApp({});
	app.use(internationalization);

	for (const [item, key] of Object.entries({
		search: 'search', notifications: 'notifications', drive: 'drive',
		announcements: 'announcements', lists: 'lists', antennas: 'antennas',
		favorites: 'favorites', clips: 'clip', channels: 'channel', reload: 'reload',
	} as const)) {
		const expected = locales[language][key];
		expect(expected).toBeTruthy();
		expect(navbarItemDef[item].title).toBe(expected);
		expect(navbarItemDef[item].title).not.toContain('$locale');
	}

	navbarItemDef.ui.action!(new PointerEvent('click'));
	// `deck` remains SFC-local (Messages.$locale). This test does not load component
	// dictionaries, so only the globally migrated default label is asserted.
	expect(os.popupMenu).toHaveBeenLastCalledWith([
		expect.objectContaining({ text: locales[language].default }),
		expect.objectContaining({ action: expect.any(Function) }),
	], null);
	expect(locales[language].default).toBeTruthy();
});
