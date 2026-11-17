/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { emptyStoredCard, review, schedulerVersion, desiredRetention, enableFuzz } from '../../backend/fsrs.js';
import type { StoredFsrsCard, StoredFsrsReviewLog, StudyRating } from '../../shared/study.schema.js';

// Generated independently by running the pinned upstream adapter against its
// SHA-512-verified official ts-fsrs 5.4.1 tarball, not by this implementation.
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/upstream-fsrs.json', import.meta.url), 'utf8')) as {
	scheduler: string; retention: number; fuzz: boolean;
	cases: { name: string; before: StoredFsrsCard; now: string; rating: StudyRating; result: { card: StoredFsrsCard; log: StoredFsrsReviewLog } }[];
};
test('pins the scheduler and upstream initial empty-card mapping', () => {
	expect({ scheduler: schedulerVersion, retention: desiredRetention, fuzz: enableFuzz }).toEqual({ scheduler: fixtures.scheduler, retention: fixtures.retention, fuzz: fixtures.fuzz });
	expect(emptyStoredCard(new Date('2026-11-16T00:00:00.000Z'))).toEqual(fixtures.cases[0].before);
});
test.each(fixtures.cases)('matches pinned upstream $name without mutating its input', ({ before, now, rating, result }) => {
	const unchanged = structuredClone(before);
	expect(review(before, new Date(now), rating)).toEqual(result);
	expect(before).toEqual(unchanged);
});
