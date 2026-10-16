/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type bootMessages from '../embed/boot-messages.json';

type BootLoaderLocaleBody = typeof bootMessages['ja-JP']['_bootErrors'] & { reload: typeof bootMessages['ja-JP']['reload'] };

export function storeBootloaderErrors(locale: BootLoaderLocaleBody) {
	localStorage.setItem('bootloaderLocales', JSON.stringify(locale));
}
