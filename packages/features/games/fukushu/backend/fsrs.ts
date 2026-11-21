/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Stored FSRS mapping adapted from tamaina/fukushu (MIT), commit
 * 0efee271a13f15096beb8cbaaea25092c5927b29. Original license: ../FUKUSHU-LICENSE.txt.
 */

import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';
import type { Card, Grade, ReviewLog } from 'ts-fsrs';
import type { StoredFsrsCard, StoredFsrsReviewLog, StudyRating } from '../shared/study.schema.js';

export const schedulerVersion = 'ts-fsrs@5.4.1';
export const desiredRetention = 0.9;
export const enableFuzz = false;
const ratingMap: Record<StudyRating, Grade> = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy };

export function serializeCard(card: Card): StoredFsrsCard {
	return {
		due: card.due.toISOString(), stability: card.stability, difficulty: card.difficulty,
		elapsedDays: card.elapsed_days, scheduledDays: card.scheduled_days, reps: card.reps,
		lapses: card.lapses, state: card.state,
		...(card.last_review ? { lastReview: card.last_review.toISOString() } : {}),
	};
}
export function deserializeCard(card: StoredFsrsCard): Card {
	return {
		due: new Date(card.due), stability: card.stability, difficulty: card.difficulty,
		elapsed_days: card.elapsedDays, scheduled_days: card.scheduledDays, reps: card.reps,
		lapses: card.lapses, state: card.state,
		...(card.lastReview ? { last_review: new Date(card.lastReview) } : {}),
	} as Card;
}
export function emptyStoredCard(now: Date): StoredFsrsCard { return serializeCard(createEmptyCard(now)); }

export function review(card: StoredFsrsCard, now: Date, rating: StudyRating, retention = desiredRetention, fuzz = enableFuzz): { card: StoredFsrsCard; log: StoredFsrsReviewLog } {
	const scheduler = fsrs(generatorParameters({ request_retention: retention, enable_fuzz: fuzz }));
	const result = scheduler.next(deserializeCard(card), now, ratingMap[rating]);
	return { card: serializeCard(result.card), log: serializeLog(result.log) };
}

function serializeLog(log: ReviewLog): StoredFsrsReviewLog {
	return {
		rating: log.rating, state: log.state, due: log.due.toISOString(), stability: log.stability,
		difficulty: log.difficulty, elapsedDays: log.elapsed_days, lastElapsedDays: log.last_elapsed_days,
		scheduledDays: log.scheduled_days, review: log.review.toISOString(),
	};
}
