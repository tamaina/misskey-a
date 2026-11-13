/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createMfmRenderer } from '@features/markup/frontend/shared/mfm-renderer.js';
import EmUrl from '@features/markup/frontend/embed/components/EmUrl.vue';
import EmTime from '@features/ui/frontend/embed/components/EmTime.vue';
import EmLink from '@features/navigation/frontend/embed/components/EmLink.vue';
import EmMention from '@features/users/frontend/embed/components/EmMention.vue';
import EmEmoji from '@features/emojis/frontend/embed/components/EmEmoji.vue';
import EmCustomEmoji from '@features/emojis/frontend/embed/components/EmCustomEmoji.vue';
import EmA from '@features/navigation/frontend/embed/components/EmA.vue';

// eslint-disable-next-line import/no-default-export
export default createMfmRenderer({
	components: () => ({
		Url: EmUrl,
		Link: EmLink,
		Mention: EmMention,
		A: EmA,
		Time: EmTime,
		Emoji: EmEmoji,
		CustomEmoji: EmCustomEmoji,
	}),
});
