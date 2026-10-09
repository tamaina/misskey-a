/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import { Pizzax } from '@features/preferences/frontend/utility/pizzax.js';

// TODO: 消す(移行済みのため)
export const deckStore = markRaw(new Pizzax('deck', {
	profile: {
		where: 'deviceAccount',
		default: 'default',
	},
	columns: {
		where: 'deviceAccount',
		default: [] as Column[],
	},
	layout: {
		where: 'deviceAccount',
		default: [] as Column['id'][][],
	},
}));
