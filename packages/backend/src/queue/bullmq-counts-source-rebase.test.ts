/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { restoreReviewedBullMqCountsVersion } from './bullmq-counts-source-rebase.js';

const require = createRequire(import.meta.url);

test('reviewed upgrade keeps exact installed source guards before the historical count oracle', () => {
	expect(require('bullmq/package.json').version).toBe('6.3.12');
	expect(restoreReviewedBullMqCountsVersion('6.3.12')).toBe('6.3.2');
	expect(() => restoreReviewedBullMqCountsVersion('6.3.13')).toThrow('Unreviewed BullMQ counts version');
	expect(() => restoreReviewedBullMqCountsVersion('6.3.12', () => 'altered')).toThrow('Unreviewed BullMQ counts source');
});
