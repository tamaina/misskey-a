/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';

const count = v.pipe(v.number(), v.integer(), v.minValue(0));
export const upstreamInspectionSchema = v.strictObject({
	format: v.literal('FUKUSHU-BACKUP-1'), imported: v.literal(false), canImport: v.literal(false),
	sha256: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
	exportedAt: v.null(),
	counts: v.strictObject({ decks: count, questions: count, studyStates: count, reviewLogs: count, importSources: count, media: count, imports: count }),
	binaryBytes: count,
	currentDesiredRetention: v.number(),
	missingQuestionOrders: count,
	decks: v.pipe(v.array(v.strictObject({ id: v.string(), name: v.string(), questions: count, reviewLogs: count })), v.maxLength(100)),
	history: v.pipe(v.array(v.strictObject({
		id: v.string(), deckId: v.string(), questionId: v.string(), reviewedAt: v.string(),
		rating: v.picklist(['again', 'hard', 'good', 'easy']), correct: v.boolean(),
		questionSnapshot: v.literal('unavailable'), cardBefore: v.null(), cardAfter: v.null(), scheduler: v.null(),
	})), v.maxLength(20)),
});
export type UpstreamInspection = v.InferOutput<typeof upstreamInspectionSchema>;
