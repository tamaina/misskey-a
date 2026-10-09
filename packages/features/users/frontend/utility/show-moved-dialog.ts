/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@features/ui/frontend/os.js';
import { $i } from '@features/auth/frontend/i.js';
import FeatureLocaleMessages from '@features/users/frontend/ts-messages.vue';

export function showMovedDialog() {
	if (!$i) return;
	if (!$i.movedTo) return;

	os.alert({
		type: 'error',
		title: FeatureLocaleMessages.$locale.accountMovedShort,
		text: FeatureLocaleMessages.$locale.operationForbidden,
	});

	throw new Error('account moved');
}
