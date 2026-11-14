/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Display hints only: UA strings can be reduced or spoofed. Keep the raw UA available.
// Match Chromium derivatives and iOS browsers before their compatibility tokens.
const browsers: [string, RegExp][] = [
	['Edge', /(?:EdgA|EdgiOS|Edg|Edge)\/(\d+)/i],
	['Opera', /(?:OPR|OPiOS)\/(\d+)/i],
	['Samsung Internet', /SamsungBrowser\/(\d+)/i],
	['Firefox', /(?:Firefox|FxiOS)\/(\d+)/i],
	['Chrome', /(?:Chrome|CriOS)\/(\d+)/i],
	['Chromium', /Chromium\/(\d+)/i],
	['Safari', /Version\/(\d+).*Safari\//i],
	['Internet Explorer', /(?:MSIE |Trident\/[^;]+;.*rv:)(\d+)/i],
];

export function parseUserAgent(ua: string | null | undefined): { label: string | null; icon: string } {
	if (!ua?.trim()) return { label: null, icon: 'ti ti-browser' };

	let browser: string | undefined;
	for (const [name, pattern] of browsers) {
		const match = ua.match(pattern);
		if (match) {
			browser = `${name} ${match[1]}`;
			break;
		}
	}

	const device = /iPhone/i.test(ua) ? 'iPhone' : /iPad/i.test(ua) ? 'iPad' : /iPod/i.test(ua) ? 'iPod' : undefined;
	const os = device ? 'iOS'
		: /Android/i.test(ua) ? 'Android'
			: /Windows NT|Windows Phone/i.test(ua) ? 'Windows'
				: /CrOS/i.test(ua) ? 'ChromeOS'
					: /Macintosh|Mac OS X/i.test(ua) ? 'macOS'
						: /Linux/i.test(ua) ? 'Linux' : undefined;
	const icon = device === 'iPad' || /Android/i.test(ua) && !/Mobile/i.test(ua) ? 'ti ti-device-tablet'
		: device || /Android|Windows Phone/i.test(ua) ? 'ti ti-device-mobile'
			: os ? 'ti ti-device-desktop' : 'ti ti-browser';

	return { label: [browser, os, device].filter(Boolean).join(' / ') || null, icon };
}
