/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { formatAutoArchiveInput, parseAutoArchiveInput } from '../../frontend/auto-archive-input.js';

test('preserves seconds and milliseconds when the displayed minute has not changed', () => {
	const original = '2026-11-14T12:34:56.789Z';
	expect(parseAutoArchiveInput(formatAutoArchiveInput(original), original)).toBe(Date.parse(original));
});

test('interprets edited datetime-local values in local time', () => {
	const value = '2026-12-24T15:30';
	expect(parseAutoArchiveInput(value, '2026-11-14T12:34:56.789Z')).toBe(new Date(2026, 11, 24, 15, 30).getTime());
});

test('clearing a deadline produces null rather than the original value', () => {
	expect(parseAutoArchiveInput('', '2026-11-14T12:34:56.789Z')).toBeNull();
	expect(formatAutoArchiveInput(null)).toBe('');
	expect(parseAutoArchiveInput('', null)).toBeNull();
});

test('invalid input remains invalid so validation cannot schedule an arbitrary time', () => {
	expect(Number.isNaN(parseAutoArchiveInput('invalid', null))).toBe(true);
});
