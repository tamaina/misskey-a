/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function loadEmojiCatalog() {
	return import('./EmojiCatalog.vue');
}

export { createCustomEmojiStore } from './store.js';
