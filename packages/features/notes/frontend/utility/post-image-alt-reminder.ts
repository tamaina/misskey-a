/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readonly, ref } from 'vue';

type Attachment = { type: string; comment?: string | null; };

export async function confirmImageAltText(
	enabled: boolean,
	attachments: readonly Attachment[],
	confirm: () => Promise<boolean>,
): Promise<boolean> {
	if (!enabled || !attachments.some(file => file.type.startsWith('image/') && !file.comment?.trim())) return true;

	return await confirm();
}

/** Hold the submit button and keyboard shortcut through asynchronous checks before sending. */
export function createPostPreparationGuard() {
	const preparing = ref(false);
	return {
		preparing: readonly(preparing),
		async run(prepare: () => Promise<void>): Promise<void> {
			if (preparing.value) return;
			preparing.value = true;
			try {
				await prepare();
			} finally {
				preparing.value = false;
			}
		},
	};
}
