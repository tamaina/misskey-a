/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { nextTick } from 'vue';
import { describe, expect, test, vi } from 'vitest';
import type { EmojiSimple } from '../backend/api.schema.js';
import { createCustomEmojiStore } from './store.js';
import type { CustomEmojiStoreDependencies } from './store.js';

function emoji(name: string, category: string | null = null, aliases: string[] = []): EmojiSimple {
	return { name, category, aliases, url: `https://example.test/${name}.png` };
}

function dependencies(overrides: Partial<CustomEmojiStoreDependencies> = {}) {
	return {
		now: vi.fn(() => overrides.now ? overrides.now() : 100),
		readLastFetchedAt: vi.fn(() => overrides.readLastFetchedAt ? overrides.readLastFetchedAt() : Promise.resolve(undefined)),
		writeEmojis: vi.fn((list: EmojiSimple[]) => overrides.writeEmojis?.(list)),
		writeLastFetchedAt: vi.fn((time: number) => overrides.writeLastFetchedAt?.(time)),
		fetchEmojis: vi.fn((force: boolean) => overrides.fetchEmojis ? overrides.fetchEmojis(force) : Promise.resolve([])),
	};
}

describe('createCustomEmojiStore', () => {
	test('creates independent stores with immediate maps and ordered categories', async () => {
		const firstEmojis = [
			emoji('first', 'animals'),
			emoji('empty-category', ''),
			emoji('null-category', 'null'),
			emoji('second', 'food'),
			emoji('third', 'animals'),
		];
		const firstDeps = dependencies();
		const first = createCustomEmojiStore(firstEmojis, firstDeps);
		const secondEmoji = emoji('separate', 'places');
		const secondDeps = dependencies();
		const second = createCustomEmojiStore([secondEmoji], secondDeps);

		expect(firstDeps.now).not.toHaveBeenCalled();
		expect(firstDeps.readLastFetchedAt).not.toHaveBeenCalled();
		expect(firstDeps.writeEmojis).not.toHaveBeenCalled();
		expect(firstDeps.writeLastFetchedAt).not.toHaveBeenCalled();
		expect(firstDeps.fetchEmojis).not.toHaveBeenCalled();
		expect(first.customEmojis.value).toBe(firstEmojis);
		expect(first.customEmojiCategories.value).toEqual(['animals', 'food', null]);
		expect(first.customEmojisMap.get('first')).toBe(firstEmojis[0]);
		expect([...first.customEmojisMap.keys()]).toEqual(['first', 'empty-category', 'null-category', 'second', 'third']);
		expect(second.customEmojiCategories.value).toEqual(['places', null]);
		expect(second.customEmojisMap.get('separate')).toBe(secondEmoji);

		first.addCustomEmoji(emoji('only-first'));
		expect(second.customEmojis.value).toEqual([secondEmoji]);
		expect(second.customEmojisMap.has('only-first')).toBe(false);
		await nextTick();
		expect(first.customEmojisMap.has('only-first')).toBe(true);

		first.dispose();
		first.addCustomEmoji(emoji('after-dispose'));
		second.addCustomEmoji(emoji('only-second'));
		await nextTick();
		expect(first.customEmojisMap.has('after-dispose')).toBe(false);
		expect(second.customEmojisMap.has('only-second')).toBe(true);
		expect(secondDeps.writeEmojis).toHaveBeenCalledTimes(1);
		second.dispose();
	});

	test('keeps the map stable and updates it on Vue’s default watcher schedule', async () => {
		const original = emoji('wave');
		const replacement = emoji('wave', 'updated');
		const removed = emoji('remove-me');
		const store = createCustomEmojiStore([original, removed], dependencies());
		const stableMap = store.customEmojisMap;

		store.addCustomEmoji(emoji('new'));
		expect(store.customEmojisMap).toBe(stableMap);
		expect(store.customEmojisMap.has('new')).toBe(false);
		await nextTick();
		expect(store.customEmojisMap).toBe(stableMap);
		expect([...store.customEmojisMap.keys()]).toEqual(['new', 'wave', 'remove-me']);

		store.updateCustomEmojis([replacement]);
		await nextTick();
		expect(store.customEmojisMap.get('wave')).toBe(replacement);
		expect([...store.customEmojisMap.keys()]).toEqual(['new', 'wave', 'remove-me']);

		store.removeCustomEmojis([emoji('remove-me')]);
		await nextTick();
		expect(store.customEmojisMap.has('remove-me')).toBe(false);
		expect(store.customEmojisMap).toBe(stableMap);
		store.dispose();
	});

	test('preserves mutation and fetch persistence arguments and invocation order', async () => {
		const first = emoji('first');
		const second = emoji('second');
		const updatedFirst = emoji('first', 'updated');
		const fetched = [emoji('fetched')];
		const calls: unknown[][] = [];
		const deps = dependencies({
			now: () => {
				calls.push(['now']);
				return 500;
			},
			readLastFetchedAt: async () => {
				calls.push(['readLastFetchedAt']);
				return undefined;
			},
			writeEmojis: list => {
				calls.push(['writeEmojis', list, store.customEmojis.value]);
			},
			writeLastFetchedAt: time => {
				calls.push(['writeLastFetchedAt', time]);
			},
			fetchEmojis: async force => {
				calls.push(['fetchEmojis', force]);
				return fetched;
			},
		});
		const store = createCustomEmojiStore([first], deps);

		store.addCustomEmoji(second);
		const afterAdd = store.customEmojis.value;
		expect(afterAdd).toEqual([second, first]);
		expect(calls[0]).toEqual(['writeEmojis', afterAdd, afterAdd]);

		store.updateCustomEmojis([updatedFirst, emoji('unused')]);
		const afterUpdate = store.customEmojis.value;
		expect(afterUpdate).toEqual([second, updatedFirst]);
		expect(calls[1]).toEqual(['writeEmojis', afterUpdate, afterUpdate]);

		store.removeCustomEmojis([emoji('second')]);
		const afterRemove = store.customEmojis.value;
		expect(afterRemove).toEqual([updatedFirst]);
		expect(calls[2]).toEqual(['writeEmojis', afterRemove, afterRemove]);

		await store.fetchCustomEmojis();
		expect(store.customEmojis.value).toBe(fetched);
		expect(calls.slice(3)).toEqual([
			['now'],
			['readLastFetchedAt'],
			['fetchEmojis', false],
			['writeEmojis', fetched, fetched],
			['writeLastFetchedAt', 500],
		]);
		expect(deps.writeEmojis).toHaveBeenCalledTimes(4);
		store.dispose();
	});

	test('uses the strict one-hour TTL boundary and force skips the timestamp read', async () => {
		const recent = dependencies({
			now: () => 3_600_999,
			readLastFetchedAt: async () => 1_000,
		});
		const recentStore = createCustomEmojiStore([emoji('cached')], recent);
		await recentStore.fetchCustomEmojis();
		expect(recent.fetchEmojis).not.toHaveBeenCalled();
		expect(recent.writeEmojis).not.toHaveBeenCalled();
		expect(recent.writeLastFetchedAt).not.toHaveBeenCalled();
		recentStore.dispose();

		const atBoundary = dependencies({
			now: () => 3_601_000,
			readLastFetchedAt: async () => 1_000,
		});
		const boundaryStore = createCustomEmojiStore([], atBoundary);
		await boundaryStore.fetchCustomEmojis();
		expect(atBoundary.fetchEmojis).toHaveBeenCalledWith(false);
		expect(atBoundary.writeLastFetchedAt).toHaveBeenCalledWith(3_601_000);
		boundaryStore.dispose();

		const forced = dependencies({
			readLastFetchedAt: async () => 100,
			fetchEmojis: async () => [emoji('forced')],
		});
		const forcedStore = createCustomEmojiStore([], forced);
		await forcedStore.fetchCustomEmojis(true);
		expect(forced.readLastFetchedAt).not.toHaveBeenCalled();
		expect(forced.fetchEmojis).toHaveBeenCalledWith(true);
		expect(forced.writeLastFetchedAt).toHaveBeenCalledWith(100);
		forcedStore.dispose();
	});

	test('does not update state or persist when fetching fails', async () => {
		const original = [emoji('cached')];
		const failed = dependencies({
			fetchEmojis: async () => {
				throw new Error('network failed');
			},
		});
		const store = createCustomEmojiStore(original, failed);

		await expect(store.fetchCustomEmojis()).rejects.toThrow('network failed');
		expect(store.customEmojis.value).toBe(original);
		expect(failed.writeEmojis).not.toHaveBeenCalled();
		expect(failed.writeLastFetchedAt).not.toHaveBeenCalled();
		store.dispose();
	});

	test('waits for a successful fetch before changing state or writing the cache', async () => {
		const original = [emoji('cached')];
		let resolveFetch!: (emojis: EmojiSimple[]) => void;
		const pendingFetch = new Promise<EmojiSimple[]>(resolve => {
			resolveFetch = resolve;
		});
		const deps = dependencies({ fetchEmojis: () => pendingFetch });
		const store = createCustomEmojiStore(original, deps);
		const request = store.fetchCustomEmojis(true);

		expect(store.customEmojis.value).toBe(original);
		expect(deps.writeEmojis).not.toHaveBeenCalled();
		expect(deps.writeLastFetchedAt).not.toHaveBeenCalled();

		const fetched = [emoji('fetched')];
		resolveFetch(fetched);
		await request;
		expect(store.customEmojis.value).toBe(fetched);
		expect(deps.writeEmojis).toHaveBeenCalledWith(fetched);
		expect(deps.writeLastFetchedAt).toHaveBeenCalledWith(100);
		store.dispose();
	});

	test('does not wait for either fire-and-forget persistence write', async () => {
		let resolveEmojisWrite!: () => void;
		let resolveTimestampWrite!: () => void;
		const emojisWrite = new Promise<void>(resolve => {
			resolveEmojisWrite = resolve;
		});
		const timestampWrite = new Promise<void>(resolve => {
			resolveTimestampWrite = resolve;
		});
		const fetched = [emoji('fetched')];
		const deps = dependencies({
			writeEmojis: () => emojisWrite,
			writeLastFetchedAt: () => timestampWrite,
			fetchEmojis: async () => fetched,
		});
		const store = createCustomEmojiStore([], deps);

		await store.fetchCustomEmojis(true);
		expect(deps.writeEmojis).toHaveBeenCalledWith(fetched);
		expect(deps.writeLastFetchedAt).toHaveBeenCalledWith(100);
		expect(store.customEmojis.value).toBe(fetched);

		resolveEmojisWrite();
		resolveTimestampWrite();
		await Promise.all([emojisWrite, timestampWrite]);
		store.dispose();
	});

	test('keeps concurrent forced fetches independent and applies results in completion order', async () => {
		const fetchedResults: Array<(emojis: EmojiSimple[]) => void> = [];
		const deps = dependencies({
			fetchEmojis: () => new Promise(resolve => fetchedResults.push(resolve)),
		});
		const store = createCustomEmojiStore([emoji('original')], deps);

		const firstRequest = store.fetchCustomEmojis(true);
		const secondRequest = store.fetchCustomEmojis(true);
		expect(deps.fetchEmojis).toHaveBeenCalledTimes(2);
		expect(deps.fetchEmojis).toHaveBeenNthCalledWith(1, true);
		expect(deps.fetchEmojis).toHaveBeenNthCalledWith(2, true);

		const secondResult = [emoji('second-result')];
		fetchedResults[1](secondResult);
		await secondRequest;
		expect(store.customEmojis.value).toBe(secondResult);

		const firstResult = [emoji('first-result')];
		fetchedResults[0](firstResult);
		await firstRequest;
		expect(store.customEmojis.value).toBe(firstResult);
		expect(deps.writeEmojis.mock.calls.map(([list]) => list)).toEqual([secondResult, firstResult]);
		store.dispose();
	});

	test('memoizes the first custom emoji tag snapshot', () => {
		const store = createCustomEmojiStore([
			emoji('one', null, ['first', 'shared']),
			emoji('two', null, ['shared', 'second']),
		], dependencies());
		const initialTags = store.getCustomEmojiTags();

		expect(initialTags).toEqual(['first', 'shared', 'second']);
		store.addCustomEmoji(emoji('three', null, ['later']));
		expect(store.getCustomEmojiTags()).toBe(initialTags);
		expect(store.getCustomEmojiTags()).toEqual(['first', 'shared', 'second']);
		store.dispose();
	});
});
