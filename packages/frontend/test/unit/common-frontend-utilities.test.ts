/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref } from 'vue';
import { describe, expect, test } from 'vitest';
import { formatRelativeTime, parseTime } from '@features/ui/frontend/shared/relative-time.js';
import { parseUrlForDisplay, safeURIDecode } from '@features/web/frontend/shared/url.js';
import type { RelativeTimeLocale } from '@features/ui/frontend/shared/relative-time.js';

function locale(prefix: () => string): RelativeTimeLocale {
	const formatter = (unit: string) => ({ n }: { n: string }) => `${prefix()}:${unit}:${n}`;
	return {
		ago: {
			yearsAgo: formatter('yearsAgo'), monthsAgo: formatter('monthsAgo'), weeksAgo: formatter('weeksAgo'),
			daysAgo: formatter('daysAgo'), hoursAgo: formatter('hoursAgo'), minutesAgo: formatter('minutesAgo'), secondsAgo: formatter('secondsAgo'),
		},
		timeIn: {
			years: formatter('years'), months: formatter('months'), weeks: formatter('weeks'),
			days: formatter('days'), hours: formatter('hours'), minutes: formatter('minutes'), seconds: formatter('seconds'),
		},
		get justNow() { return `${prefix()}:now`; },
	};
}

describe('common frontend utilities', () => {
	test.each<[number, string]>([
		[31536000, 'yearsAgo:1'], [2592000, 'monthsAgo:1'], [604800, 'weeksAgo:1'], [86400, 'daysAgo:1'],
		[3600, 'hoursAgo:1'], [60, 'minutesAgo:1'], [59, 'secondsAgo:59'], [10, 'secondsAgo:10'], [9, 'now'], [-3, 'now'],
		[-4, 'seconds:4'], [-60, 'seconds:0'], [-61, 'minutes:1'], [-3600, 'minutes:60'], [-3601, 'hours:1'],
		[-86400, 'hours:24'], [-86401, 'days:1'], [-604800, 'days:7'], [-604801, 'weeks:1'],
		[-2592000, 'weeks:4'], [-2592001, 'months:1'], [-31536000, 'months:12'], [-31536001, 'years:1'],
	])('preserves past and future threshold %s', (seconds, expected) => {
		expect(formatRelativeTime(seconds, locale(() => 'en'))).toBe(`en:${expected}`);
	});

	test('reads live locale callbacks and just-now getter after locale changes', () => {
		const language = ref('en');
		const seconds = ref(60);
		const messages = locale(() => language.value);
		const current = computed(() => formatRelativeTime(seconds.value, messages));
		expect(current.value).toBe('en:minutesAgo:1');
		language.value = 'ja';
		expect(current.value).toBe('ja:minutesAgo:1');
		seconds.value = 0;
		expect(current.value).toBe('ja:now');
		language.value = 'en';
		expect(current.value).toBe('en:now');
	});

	test('parses time inputs and safely handles invalid dates and throwing Date implementations', () => {
		const epoch = Date.UTC(2026, 0, 1);
		expect(parseTime(new Date(epoch))).toBe(epoch);
		expect(parseTime('2026-01-01T00:00:00.000Z')).toBe(epoch);
		expect(parseTime(epoch)).toBe(epoch);
		expect(parseTime(null)).toBeNaN();
		expect(parseTime('invalid')).toBeNaN();
		class ThrowingDate extends Date {
			getTime(): number { throw new Error('unreadable date'); }
		}
		expect(parseTime(new ThrowingDate())).toBeNaN();
	});

	test('decodes display fields without changing the navigated URL and preserves malformed escapes', () => {
		const input = 'https://xn--r8jz45g.xn--zckzah:8443/%E6%97%A5?query=%E6%9C%AC#%E8%AA%9E';
		expect(parseUrlForDisplay(input)).toEqual({ schema: 'https:', hostname: '例え.テスト', port: '8443', pathname: '/日', query: '?query=本', hash: '#語' });
		expect(safeURIDecode('%broken')).toBe('%broken');
		expect(parseUrlForDisplay('http://example.com/%broken').pathname).toBe('/%broken');
		expect(() => parseUrlForDisplay('javascript:alert(1)')).toThrow('invalid url');
		expect(() => parseUrlForDisplay('not a URL')).toThrow();
	});
});
