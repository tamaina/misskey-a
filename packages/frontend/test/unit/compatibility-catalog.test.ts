/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';

vi.mock('@features/boot/frontend/shared/config.js', () => ({ lang: 'fr-FR', version: 'fixture-version' }));

afterEach(() => vi.restoreAllMocks());

test.each(['network', '404', 'json'])('does not reject module loading when the compatibility catalog fails: %s', async failure => {
	vi.resetModules();
	const request = vi.spyOn(window, 'fetch').mockClear();
	if (failure === 'network') request.mockRejectedValue(new Error('Network failure'));
	else request.mockResolvedValue(new Response(failure === '404' ? 'Not found' : '{', { status: failure === '404' ? 404 : 200 }));
	const catalog = await import('@features/runtime/frontend/shared/locale.js');
	expect(catalog.locale).toBeNull();
	expect(request.mock.calls.filter(([url]) => url === '/assets/locales/fr-FR.fixture-version.json')).toHaveLength(1);
});

test('retains a valid catalog and the compatibility update API', async () => {
	vi.resetModules();
	vi.spyOn(window, 'fetch').mockResolvedValue(new Response(JSON.stringify({ title: 'Catalogue' }), { status: 200 }));
	const catalog = await import('@features/runtime/frontend/shared/locale.js');
	expect(catalog.locale).toEqual({ title: 'Catalogue' });
	catalog.updateLocale(catalog.locale);
	expect(catalog.locale).toEqual({ title: 'Catalogue' });
});
