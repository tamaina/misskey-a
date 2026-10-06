/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Options } from './vite-plugin-create-search-index.js';

/** Search both retained host views and domain-owned settings/admin views. */
export const searchIndexes = ['settings', 'admin'].map(section => ({
	targetFilePaths: [`src/pages/${section}/*.vue`, `../features/*/frontend/pages/${section}/*.vue`],
	mainVirtualModule: `search-index:${section}`,
	modulesToHmrOnUpdate: [`../features/navigation/frontend/pages/${section}/index.vue`],
	verbose: process.env.FRONTEND_SEARCH_INDEX_VERBOSE === 'true',
})) satisfies Options[];
