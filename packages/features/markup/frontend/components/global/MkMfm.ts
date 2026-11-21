/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createMfmRenderer } from '@features/markup/frontend/shared/mfm-renderer.js';
import type { MfmBaseProps } from '@features/markup/frontend/shared/mfm-renderer.js';
import type { MkABehavior } from '@features/navigation/frontend/components/global/MkA.vue';
import MkUrl from '@features/markup/frontend/components/global/MkUrl.vue';
import MkTime from '@features/ui/frontend/components/global/MkTime.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import MkMention from '@features/users/frontend/components/MkMention.vue';
import MkEmoji from '@features/emojis/frontend/components/global/MkEmoji.vue';
import MkCustomEmoji from '@features/emojis/frontend/components/global/MkCustomEmoji.vue';
import MkCode from '@features/markup/frontend/components/MkCode.vue';
import MkCodeInline from '@features/markup/frontend/components/MkCodeInline.vue';
import MkGoogle from '@features/integrations/frontend/components/MkGoogle.vue';
import MkSparkle from '@features/ui/frontend/components/MkSparkle.vue';
import MkA from '@features/navigation/frontend/components/global/MkA.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';

type MfmProps = MfmBaseProps & {
	enableEmojiMenu?: boolean;
	enableEmojiMenuReaction?: boolean;
	linkNavigationBehavior?: MkABehavior;
};

// eslint-disable-next-line import/no-default-export
export default createMfmRenderer<MfmProps>({
	components: () => ({
		Url: MkUrl,
		Link: MkLink,
		Mention: MkMention,
		A: MkA,
		Time: MkTime,
		Emoji: MkEmoji,
		CustomEmoji: MkCustomEmoji,
		Code: MkCode,
		CodeInline: MkCodeInline,
		Search: MkGoogle,
		Sparkle: MkSparkle,
	}),
	getOptions: () => ({
		advancedMfm: prefer.s.advancedMfm,
		animatedMfm: prefer.s.animatedMfm,
	}),
	supports: {
		navigationBehavior: true,
		emojiMenu: true,
	},
});
