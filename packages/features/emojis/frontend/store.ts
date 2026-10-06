/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, markRaw, shallowRef, watch } from 'vue';
import type { EmojiSimple } from '../contract/index.js';

export type CustomEmojiStoreDependencies = {
	now: () => number;
	readLastFetchedAt: () => Promise<number | undefined>;
	writeEmojis: (list: EmojiSimple[]) => void | Promise<void>;
	writeLastFetchedAt: (time: number) => void | Promise<void>;
	fetchEmojis: (force: boolean) => Promise<EmojiSimple[]>;
};

export function createCustomEmojiStore(initialEmojis: EmojiSimple[], dependencies: CustomEmojiStoreDependencies) {
	const customEmojis = shallowRef<EmojiSimple[]>(initialEmojis);
	const customEmojiCategories = computed<[ ...string[], null ]>(() => {
		const categories = new Set<string>();
		for (const emoji of customEmojis.value) {
			if (emoji.category && emoji.category !== 'null') {
				categories.add(emoji.category);
			}
		}
		return markRaw([...Array.from(categories), null]);
	});

	const customEmojisMap = new Map<string, EmojiSimple>();
	const stopWatching = watch(customEmojis, emojis => {
		customEmojisMap.clear();
		for (const emoji of emojis) {
			customEmojisMap.set(emoji.name, emoji);
		}
	}, { immediate: true });

	function addCustomEmoji(emoji: EmojiSimple) {
		customEmojis.value = [emoji, ...customEmojis.value];
		dependencies.writeEmojis(customEmojis.value);
	}

	function updateCustomEmojis(emojis: EmojiSimple[]) {
		customEmojis.value = customEmojis.value.map(item => emojis.find(search => search.name === item.name) ?? item);
		dependencies.writeEmojis(customEmojis.value);
	}

	function removeCustomEmojis(emojis: EmojiSimple[]) {
		customEmojis.value = customEmojis.value.filter(item => !emojis.some(search => search.name === item.name));
		dependencies.writeEmojis(customEmojis.value);
	}

	async function fetchCustomEmojis(force = false) {
		const now = dependencies.now();

		if (!force) {
			const lastFetchedAt = await dependencies.readLastFetchedAt();
			if (lastFetchedAt && (now - lastFetchedAt) < 1000 * 60 * 60) return;
		}

		const emojis = await dependencies.fetchEmojis(force);
		customEmojis.value = emojis;
		dependencies.writeEmojis(emojis);
		dependencies.writeLastFetchedAt(now);
	}

	let cachedTags: string[] | null = null;

	function getCustomEmojiTags() {
		if (cachedTags) return cachedTags;

		const tags = new Set<string>();
		for (const emoji of customEmojis.value) {
			for (const tag of emoji.aliases) {
				tags.add(tag);
			}
		}
		const res = Array.from(tags);
		cachedTags = res;
		return res;
	}

	function dispose() {
		stopWatching();
	}

	return {
		customEmojis,
		customEmojiCategories,
		customEmojisMap,
		addCustomEmoji,
		updateCustomEmojis,
		removeCustomEmojis,
		fetchCustomEmojis,
		getCustomEmojiTags,
		dispose,
	};
}
