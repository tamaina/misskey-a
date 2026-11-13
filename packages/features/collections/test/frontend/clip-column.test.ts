/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { CLIP_COLUMN_RELOAD_JITTER_MAX_MS, getClipColumnReloadDelayMs } from '../../frontend/ui/deck/clip-column.js';

test('owner updates are immediate without drawing random jitter', () => {
	expect(getClipColumnReloadDelayMs('owner', 'owner', () => { throw new Error('unnecessary random draw'); })).toBe(0);
});

test('other viewers spread reloads across the upstream five-second window', () => {
	expect(getClipColumnReloadDelayMs('owner', 'viewer', () => 0.5)).toBe(CLIP_COLUMN_RELOAD_JITTER_MAX_MS / 2);
	expect(getClipColumnReloadDelayMs(undefined, undefined, () => 0.75)).toBe(3750);
});
