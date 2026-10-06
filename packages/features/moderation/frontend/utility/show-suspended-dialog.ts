/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@features/ui/frontend/os.js';
import { i18n } from '@features/runtime/frontend/i18n.js';

export function showSuspendedDialog() {
	return os.alert({
		type: 'error',
		title: i18n.ts.yourAccountSuspendedTitle,
		text: i18n.ts.yourAccountSuspendedDescription,
	});
}
