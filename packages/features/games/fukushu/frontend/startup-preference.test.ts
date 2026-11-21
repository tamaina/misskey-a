/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { PreferencesManager } from '@features/preferences/frontend/state/manager.js';
import type { StorageProvider } from '@features/preferences/frontend/state/manager.js';

test('opening Fukushu on startup is opt-in for each account on a shared browser', async () => {
	let profile: string | null = null;
	const io: StorageProvider = {
		load: () => profile === null ? null : JSON.parse(profile),
		save: ({ profile: current }) => { profile = JSON.stringify(current); },
		cloudGet: async () => null,
		cloudGetBulk: async () => ({}),
		cloudSet: async () => {},
	};

	async function signIn(id: string) {
		const preferences = new PreferencesManager(io, { id });
		await preferences.cloudReady;
		return preferences;
	}

	const alice = await signIn('alice');
	expect(alice.s['fukushu.openOnStartup']).toBe(false);
	alice.commit('fukushu.openOnStartup', true);
	expect((await signIn('bob')).s['fukushu.openOnStartup']).toBe(false);
	const returned = await signIn('alice');
	expect(returned.s['fukushu.openOnStartup']).toBe(true);
	returned.commit('fukushu.openOnStartup', false);
	expect((await signIn('alice')).s['fukushu.openOnStartup']).toBe(false);
});
