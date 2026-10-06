/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@features/ui/frontend/os.js';
import { $i } from '@features/auth/frontend/i.js';
import { i18n } from '@features/runtime/frontend/i18n.js';

export function showMovedDialog() {
	if (!$i) return;
	if (!$i.movedTo) return;

	os.alert({
		type: 'error',
		title: i18n.ts.accountMovedShort,
		text: i18n.ts.operationForbidden,
	});

	throw new Error('account moved');
}
