/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, expect, test, vi } from 'vitest';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { load, save, saveData } from '../../frontend/utility/clicker-game.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));

beforeEach(() => {
	vi.mocked(misskeyApi).mockReset();
	saveData.value = undefined;
});

test('existing clicker saves retain the registry scope, key and stored fields', async () => {
	const existing = { gameVersion: 2, cookies: 7, totalCookies: 9, totalHandmadeCookies: 8, clicked: 8, achievements: [], facilities: [] };
	vi.mocked(misskeyApi).mockResolvedValueOnce(existing);
	await load();
	expect(misskeyApi).toHaveBeenCalledWith('i/registry/get', { scope: ['clickerGame'], key: 'saveData' });
	expect(saveData.value).toEqual(existing);
	await save();
	expect(misskeyApi).toHaveBeenLastCalledWith('i/registry/set', { scope: ['clickerGame'], key: 'saveData', value: existing });
});

test('loading a missing save still creates the same version 2 data', async () => {
	vi.mocked(misskeyApi).mockRejectedValueOnce({ code: 'NO_SUCH_KEY' });
	await load();
	expect(saveData.value).toEqual({ gameVersion: 2, cookies: 0, totalCookies: 0, totalHandmadeCookies: 0, clicked: 0, achievements: [], facilities: [] });
	expect(misskeyApi).toHaveBeenLastCalledWith('i/registry/set', { scope: ['clickerGame'], key: 'saveData', value: saveData.value });
});
