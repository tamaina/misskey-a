/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { entities } from 'misskey-js';
import { tryParseUrl } from './url.js';

type RssXmlValue = entities.FetchRssResponse['items'][number]['link'];

// Make the existing URL/DOM string coercion explicit for copied XML objects.
export function rssDomAttribute(value: RssXmlValue): string | undefined {
	return value === undefined ? undefined : String(value);
}

export function isAllowedRssLink(value: RssXmlValue, base: string): boolean {
	if (!value) return false;
	try {
		const itemUrl = tryParseUrl(String(value), base);
		return itemUrl != null && ['http:', 'https:'].includes(itemUrl.protocol);
	} catch {
		return false;
	}
}
