/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp, defineAsyncComponent } from 'vue';
import { common } from './common.js';
import type { InternationalizationInstance } from '../index.js';
import { emojiPicker } from '@features/emojis/frontend/utility/emoji-picker.js';
import UiMinimum from '@features/boot/frontend/ui/minimum.vue';

export async function subBoot(internationalization: InternationalizationInstance) {
	const { isClientUpdated } = await common(async () => createApp(UiMinimum), internationalization);

	emojiPicker.init();
}
