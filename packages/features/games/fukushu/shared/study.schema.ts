/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Stored FSRS mapping adapted from tamaina/fukushu (MIT), commit
 * 0efee271a13f15096beb8cbaaea25092c5927b29. Original license: ../FUKUSHU-LICENSE.txt.
 */

import * as v from 'valibot';
import { plainContentSchema, questionSchema, sourceIdSchema } from './material.schema.js';

const timestamp = v.pipe(v.string(), v.isoTimestamp());
const integer = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2_147_483_647));
const positiveInteger = v.pipe(integer, v.minValue(1));
const quantity = v.pipe(v.number(), v.finite(), v.minValue(0));
export const studyRatingSchema = v.picklist(['again', 'hard', 'good', 'easy']);
export const studyRequestIdSchema = v.pipe(v.string(), v.uuid(), v.transform(value => value.toLowerCase()));
export const storedFsrsCardSchema = v.strictObject({
	due: timestamp, stability: quantity, difficulty: quantity, elapsedDays: quantity,
	scheduledDays: quantity, reps: integer, lapses: integer,
	state: v.pipe(integer, v.maxValue(3)), lastReview: v.optional(timestamp),
});
export const storedFsrsReviewLogSchema = v.strictObject({
	rating: v.pipe(positiveInteger, v.maxValue(4)), state: v.pipe(integer, v.maxValue(3)),
	due: timestamp, stability: quantity, difficulty: quantity, elapsedDays: quantity,
	lastElapsedDays: quantity, scheduledDays: quantity, review: timestamp,
});
export const studyStateRecordSchema = v.strictObject({
	questionId: sourceIdSchema, deckId: sourceIdSchema, card: storedFsrsCardSchema,
	suspended: v.boolean(), suspendedKey: v.union([v.literal(0), v.literal(1)]),
	sourceRemoved: v.optional(v.boolean()), manualSuspended: v.optional(v.boolean()),
	buriedUntil: v.optional(timestamp), updatedAt: timestamp,
});
export const reviewLogRecordSchema = v.strictObject({
	id: studyRequestIdSchema, questionId: sourceIdSchema, deckId: sourceIdSchema,
	reviewedAt: timestamp, rating: studyRatingSchema, correct: v.boolean(),
	selectedAnswerIds: v.optional(v.pipe(v.array(sourceIdSchema), v.maxLength(1000))),
	responseText: v.optional(plainContentSchema.entries.value),
	durationMs: v.optional(v.pipe(integer, v.maxValue(86_400_000))), fsrsLog: storedFsrsReviewLogSchema,
	origin: v.optional(v.strictObject({ sourceId: sourceIdSchema, cardId: sourceIdSchema, revlogId: sourceIdSchema })),
});
export const studyReviewInputSchema = v.strictObject({
	id: sourceIdSchema, questionId: sourceIdSchema, questionVersion: positiveInteger,
	expectedStateRevision: integer, requestId: studyRequestIdSchema, rating: studyRatingSchema,
	durationMs: v.pipe(integer, v.maxValue(86_400_000)),
});
export const studySubmissionSchema = v.strictObject({ ...studyReviewInputSchema.entries, practiceAhead: v.optional(v.literal(true)) });
export const studyHistoryPageSchema = v.strictObject({
	beforeId: v.optional(studyRequestIdSchema),
	limit: v.optional(v.pipe(integer, v.minValue(1), v.maxValue(20)), 20),
});
export const studyReviewResultSchema = v.strictObject({
	id: studyRequestIdSchema, questionVersion: positiveInteger, stateRevision: positiveInteger,
	record: reviewLogRecordSchema, card: storedFsrsCardSchema,
});
export const studyHistoryItemSchema = v.strictObject({ ...studyReviewResultSchema.entries, question: questionSchema });
export const studyQueueSchema = v.strictObject({
	deckId: sourceIdSchema, serverTime: timestamp,
	items: v.pipe(v.array(v.strictObject({
		question: questionSchema, questionVersion: positiveInteger, stateRevision: integer,
		isNew: v.boolean(), due: timestamp,
	})), v.maxLength(1000)),
});

export type StudyRating = v.InferOutput<typeof studyRatingSchema>;
export type StoredFsrsCard = v.InferOutput<typeof storedFsrsCardSchema>;
export type StoredFsrsReviewLog = v.InferOutput<typeof storedFsrsReviewLogSchema>;
export type StudyStateRecord = v.InferOutput<typeof studyStateRecordSchema>;
export type ReviewLogRecord = v.InferOutput<typeof reviewLogRecordSchema>;
export type StudyReviewInput = v.InferOutput<typeof studyReviewInputSchema>;
export type StudyReviewResult = v.InferOutput<typeof studyReviewResultSchema>;
export type StudyHistoryItem = v.InferOutput<typeof studyHistoryItemSchema>;
export type StudyQueue = v.InferOutput<typeof studyQueueSchema>;
