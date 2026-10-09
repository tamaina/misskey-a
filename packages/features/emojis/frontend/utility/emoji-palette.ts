/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { prefer } from '@features/preferences/frontend/preferences.js';
import * as os from '@features/ui/frontend/os.js';
import FeatureLocaleMessages from '@features/emojis/frontend/ts-messages.vue';
import type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';

export function chooseEmojiPalette() {
	return os.select({
		title: FeatureLocaleMessages.$locale.chooseEmojiPalette,
		default: prefer.s.emojiPaletteForMain ?? prefer.s.emojiPaletteForReaction ?? prefer.s.emojiPalettes[0]?.id,
		items: prefer.s.emojiPalettes.map<MkSelectItem<string>>((palette) => {
			let caption: string | undefined = undefined;

			if (prefer.s.emojiPaletteForMain === palette.id) {
				caption = FeatureLocaleMessages.$locale._emojiPalette.paletteForMain;
			} else if (prefer.s.emojiPaletteForReaction === palette.id) {
				caption = FeatureLocaleMessages.$locale._emojiPalette.paletteForReaction;
			}

			return {
				label: palette.name || `(${FeatureLocaleMessages.$locale.noName})`,
				caption,
				value: palette.id,
			};
		}),
	});
}

export async function addToEmojiPalette(emoji: string) {
	const res = await chooseEmojiPalette();

	if (res.canceled || res.result == null) return;

	const palette = prefer.s.emojiPalettes.find((p) => p.id === res.result);
	if (!palette) return;
	let emojis = [...palette.emojis];

	if (!emojis.includes(emoji)) {
		emojis.push(emoji);
		prefer.commit('emojiPalettes', prefer.s.emojiPalettes.map((p) => {
			if (p.id === palette.id) {
				return {
					...p,
					emojis,
				};
			} else {
				return p;
			}
		}));
		os.success();
	} else {
		const res = await os.actions({
			type: 'warning',
			text: FeatureLocaleMessages.$locale.emojiPaletteAlreadyAddedConfirm,
			actions: [{
				value: 'prepend',
				text: FeatureLocaleMessages.$locale.prepend,
			}, {
				value: 'append',
				text: FeatureLocaleMessages.$locale.append,
			}, {
				value: 'doNothing',
				text: FeatureLocaleMessages.$locale.doNothing,
			}],
		});

		if (res.canceled || res.result === 'doNothing') return;

		emojis = emojis.filter((e) => e !== emoji);

		if (res.result === 'append') {
			emojis.push(emoji);
		} else if (res.result === 'prepend') {
			emojis.unshift(emoji);
		}

		prefer.commit('emojiPalettes', prefer.s.emojiPalettes.map((p) => {
			if (p.id === palette.id) {
				return {
					...p,
					emojis,
				};
			} else {
				return p;
			}
		}));

		os.success();
	}
}
