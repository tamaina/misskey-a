/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, assert, afterEach } from 'vitest';
import { render, cleanup, type RenderResult } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { preferState } from '../setup.unit.js';
import { getEmojiName } from '@features/emojis/frontend/shared/emojilist.js';
import { components } from '@features/index/frontend/components.js';
import { directives } from '@features/index/frontend/directives.js';
import MkEmoji from '@features/emojis/frontend/components/global/MkEmoji.vue';

describe('Emoji', () => {
	const renderEmoji = async (emoji: string): Promise<RenderResult> => {
		const internationalization = createInternationalization({ initialLocale: 'en-US' });
		await internationalization.ready;
		await internationalization.loadLocale('en-US');

		return render(MkEmoji, {
			props: { emoji },
			global: { plugins: [internationalization], directives, components },
		});
	};

	afterEach(() => {
		cleanup();
		preferState.emojiStyle = '';
	});

	describe('MkEmoji', () => {
		test('Should render selector-less heart with color in native mode', async () => {
			preferState.emojiStyle = 'native';
			const mkEmoji = await renderEmoji('\u2764'); // monochrome heart
			assert.ok(mkEmoji.queryByText('\u2764\uFE0F')); // colored heart
			assert.ok(!mkEmoji.queryByText('\u2764'));
		});
	});

	describe('Emoji list', () => {
		test('Should get the name of the heart', () => {
			assert.strictEqual(getEmojiName('\u2764'), 'heart');
		});
	});
});
