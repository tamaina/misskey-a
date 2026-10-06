/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Keep the optional system-information import lazy and owned by the backend package. */
export function loadSystemInformation() {
	return import('systeminformation');
}
