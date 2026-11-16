/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { parseUserAgent } from '../../frontend/utility/user-agent.js';

const windows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const android = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko)';
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';

test.each([
	[`${windows} Gecko/20100101 Firefox/145.0`, 'Firefox 145 / Windows', 'desktop'],
	[`${windows} AppleWebKit/537.36 Chrome/140.0.7339.80 Safari/537.36`, 'Chrome 140 / Windows', 'desktop'],
	[`${android} Chrome/140.0.7339.80 Mobile Safari/537.36`, 'Chrome 140 / Android', 'mobile'],
	[`${iphone} Version/18.0 Mobile/15E148 Safari/604.1`, 'Safari 18 / iOS / iPhone', 'mobile'],
	[`${iphone} CriOS/140.0.7339.80 Mobile/15E148 Safari/604.1`, 'Chrome 140 / iOS / iPhone', 'mobile'],
	[`${iphone} FxiOS/145.0 Mobile/15E148 Safari/605.1.15`, 'Firefox 145 / iOS / iPhone', 'mobile'],
	['Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1', 'Safari 18 / iOS / iPad', 'tablet'],
	[`${windows} Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0`, 'Edge 140 / Windows', 'desktop'],
	[`${android} Chrome/140.0.0.0 Mobile Safari/537.36 SamsungBrowser/28.0`, 'Samsung Internet 28 / Android', 'mobile'],
	[`${windows} Chrome/140.0.0.0 Safari/537.36 OPR/122.0`, 'Opera 122 / Windows', 'desktop'],
	['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15', 'Safari 18 / macOS', 'desktop'],
	['Mozilla/5.0 (X11; Linux x86_64) Firefox/145.0', 'Firefox 145 / Linux', 'desktop'],
	['Mozilla/5.0 (X11; CrOS x86_64 16371.0.0) Chrome/140.0.0.0 Safari/537.36', 'Chrome 140 / ChromeOS', 'desktop'],
	[`${android} Chrome/140.0.0.0 Safari/537.36`, 'Chrome 140 / Android', 'tablet'],
])('labels %s', (ua, label, device) => {
	expect(parseUserAgent(ua)).toEqual({ label, icon: `ti ti-device-${device}` });
});

test.each([null, undefined, '', '   ', 'Unknown synthetic client', 'Mozilla/5.0'])('unknown or missing UA %s has a clean fallback', ua => {
	expect(parseUserAgent(ua)).toEqual({ label: null, icon: 'ti ti-browser' });
});

test('keeps partial information without inventing versions or devices', () => {
	expect(parseUserAgent('Firefox/145.0').label).toBe('Firefox 145');
	expect(parseUserAgent('Unknown client (Android 14)').label).toBe('Android');
	expect(parseUserAgent('Chrome/unknown').label).toBeNull();
});
