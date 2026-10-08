/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import * as os from '@features/ui/frontend/os.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import FeatureLocaleMessages from '@features/drive/frontend/ts-messages.vue';

export function shouldHideFileByDefault(file: Misskey.entities.DriveFile, ignoreDataSaver = false): boolean {
	if (prefer.s.nsfw === 'force' || (!ignoreDataSaver && prefer.s.dataSaver.media)) {
		return true;
	}

	if (file.isSensitive && prefer.s.nsfw !== 'ignore') {
		return true;
	}

	return false;
}

export async function canRevealFile(file: Misskey.entities.DriveFile): Promise<boolean> {
	if (file.isSensitive && prefer.s.confirmWhenRevealingSensitiveMedia) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: FeatureLocaleMessages.$locale.sensitiveMediaRevealConfirm,
		});
		if (canceled) return false;
	}

	return true;
}
