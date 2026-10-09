/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Messages from './messages.vue';

/** Capture raw owner messages after the entry has activated its loaded runtime. */
export function getImageEffectorMessages() {
	return Messages.$locale;
}
