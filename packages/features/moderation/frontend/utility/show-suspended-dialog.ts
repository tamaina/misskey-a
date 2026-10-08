/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@features/ui/frontend/os.js';
import FeatureLocaleMessages from '@features/moderation/frontend/ts-messages.vue';

export function showSuspendedDialog() {
	return os.alert({
		type: 'error',
		title: FeatureLocaleMessages.$locale.yourAccountSuspendedTitle,
		text: FeatureLocaleMessages.$locale.yourAccountSuspendedDescription,
	});
}
