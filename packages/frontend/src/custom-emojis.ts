/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createCustomEmojiStore } from '@features/emojis/frontend';
import { misskeyApi, misskeyApiGet } from '@/utility/misskey-api.js';
import { get, set } from '@/utility/idb-proxy.js';

const storageCache = await get('emojis');

// Application-owned I/O and lifetime; the feature owns state and cache policy.
export const {
	customEmojis,
	customEmojiCategories,
	customEmojisMap,
	addCustomEmoji,
	updateCustomEmojis,
	removeCustomEmojis,
	fetchCustomEmojis,
	getCustomEmojiTags,
} = createCustomEmojiStore(Array.isArray(storageCache) ? storageCache : [], {
	now: () => Date.now(),
	readLastFetchedAt: () => get('lastEmojisFetchedAt'),
	writeEmojis: emojis => set('emojis', emojis),
	writeLastFetchedAt: time => set('lastEmojisFetchedAt', time),
	fetchEmojis: async force => (force ? await misskeyApi('emojis', {}) : await misskeyApiGet('emojis', {})).emojis,
});
