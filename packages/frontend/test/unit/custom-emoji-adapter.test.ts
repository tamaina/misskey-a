/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { EmojiSimple } from '../../../features/emojis/contract/index.js';

const mocks = vi.hoisted(() => ({
	cached: undefined as unknown,
	lastFetched: undefined as number | undefined,
	network: [] as EmojiSimple[],
	get: vi.fn(), set: vi.fn(), post: vi.fn(), getApi: vi.fn(),
	cleanup: [] as Array<() => void>,
}));
vi.mock('@features/runtime/frontend/utility/idb-proxy.js', () => ({ get: mocks.get, set: mocks.set }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: mocks.post, misskeyApiGet: mocks.getApi }));
vi.mock('@features/emojis/frontend', async importOriginal => {
	const actual = await importOriginal<typeof import('../../../features/emojis/frontend/index.js')>();
	return {
		...actual,
		createCustomEmojiStore: (...args: Parameters<typeof actual.createCustomEmojiStore>) => {
			const store = actual.createCustomEmojiStore(...args);
			mocks.cleanup.push(store.dispose);
			return store;
		},
	};
});

function emoji(name: string): EmojiSimple { return { name, aliases: [], category: null, url: `/${name}.png` }; }

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	mocks.cached = undefined;
	mocks.lastFetched = undefined;
	mocks.network = [emoji('network')];
	mocks.get.mockImplementation(async key => key === 'emojis' ? mocks.cached : mocks.lastFetched);
	mocks.set.mockResolvedValue(undefined);
	mocks.post.mockImplementation(async () => ({ emojis: mocks.network }));
	mocks.getApi.mockImplementation(async () => ({ emojis: mocks.network }));
	vi.spyOn(Date, 'now').mockReturnValue(10_000);
});
afterEach(() => {
	for (const dispose of mocks.cleanup.splice(0)) dispose();
	vi.restoreAllMocks();
});

test.each([undefined, null, 1, 'invalid', {}])('non-array stored cache starts empty (%s)', async cached => {
	mocks.cached = cached;
	const store = await import('@features/emojis/frontend/custom-emojis.js');
	expect(store.customEmojis.value).toEqual([]);
	expect(mocks.get.mock.calls).toEqual([['emojis']]);
	expect(mocks.set).not.toHaveBeenCalled();
	expect(mocks.post).not.toHaveBeenCalled();
	expect(mocks.getApi).not.toHaveBeenCalled();
});

test('accepts an array cache and persists mutations under the existing key', async () => {
	const cached = [emoji('cached')];
	mocks.cached = cached;
	const store = await import('@features/emojis/frontend/custom-emojis.js');
	expect(store.customEmojis.value).toBe(cached);
	store.addCustomEmoji(emoji('added'));
	expect(mocks.set).toHaveBeenCalledWith('emojis', store.customEmojis.value);
});

test('normal refresh uses GET and writes emojis before the original start timestamp', async () => {
	const store = await import('@features/emojis/frontend/custom-emojis.js');
	await store.fetchCustomEmojis();
	expect(mocks.get.mock.calls).toEqual([['emojis'], ['lastEmojisFetchedAt']]);
	expect(mocks.getApi).toHaveBeenCalledExactlyOnceWith('emojis', {});
	expect(mocks.post).not.toHaveBeenCalled();
	expect(mocks.set.mock.calls).toEqual([['emojis', mocks.network], ['lastEmojisFetchedAt', 10_000]]);
});

test('forced refresh uses POST and does not read the cached timestamp', async () => {
	mocks.lastFetched = 9_999;
	const store = await import('@features/emojis/frontend/custom-emojis.js');
	await store.fetchCustomEmojis(true);
	expect(mocks.get.mock.calls).toEqual([['emojis']]);
	expect(mocks.post).toHaveBeenCalledExactlyOnceWith('emojis', {});
	expect(mocks.getApi).not.toHaveBeenCalled();
	expect(store.customEmojis.value).toBe(mocks.network);
});

test('a recent timestamp skips network and persistence', async () => {
	mocks.lastFetched = 9_999;
	const store = await import('@features/emojis/frontend/custom-emojis.js');
	await store.fetchCustomEmojis();
	expect(mocks.getApi).not.toHaveBeenCalled();
	expect(mocks.post).not.toHaveBeenCalled();
	expect(mocks.set).not.toHaveBeenCalled();
});

test('API failures do not replace cached state or write persistence', async () => {
	const cached = [emoji('cached')];
	mocks.cached = cached;
	const failure = new Error('fixture failure');
	mocks.getApi.mockRejectedValue(failure);
	const store = await import('@features/emojis/frontend/custom-emojis.js');
	await expect(store.fetchCustomEmojis()).rejects.toBe(failure);
	expect(store.customEmojis.value).toBe(cached);
	expect(mocks.set).not.toHaveBeenCalled();
});
