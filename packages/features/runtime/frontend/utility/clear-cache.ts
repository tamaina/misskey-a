/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { unisonReload } from '@features/runtime/frontend/utility/unison-reload.js';
import { misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { fetchCustomEmojis } from '@features/emojis/frontend/custom-emojis.js';
import { fetchInstance } from '@features/instance/frontend/instance.js';
import { clearAppliedThemeCache } from '@features/preferences/frontend/theme.js';

export async function clearCache() {
	os.waiting();
	miLocalStorage.removeItem('instance');
	miLocalStorage.removeItem('instanceCachedAt');
	miLocalStorage.removeItem('emojis');
	miLocalStorage.removeItem('lastEmojisFetchedAt');
	clearAppliedThemeCache();
	await misskeyApiGet('clear-browser-cache', {}).catch(() => {
		// ignore
	});
	await fetchInstance(true);
	await fetchCustomEmojis(true);
	unisonReload();
}
