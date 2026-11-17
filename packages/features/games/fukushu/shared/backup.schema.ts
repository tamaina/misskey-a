/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { sourceIdSchema, materialSchema, questionSchema } from './material.schema.js';
import { studyStateRecordSchema, reviewLogRecordSchema, storedFsrsCardSchema, studyReviewInputSchema, studyRequestIdSchema } from './study.schema.js';

export const MAX_BACKUP_BYTES = 8 * 1024 * 1024;
export const MAX_BACKUP_VERSIONS = 20_000;
const positive = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2_147_483_647));
const time = v.pipe(v.string(), v.isoTimestamp());
export const backupPayloadSchema = v.strictObject({
	exportedAt: time,
	material: materialSchema,
	deckState: v.strictObject({ revision: positive, archivedAt: v.nullable(time) }),
	questions: v.pipe(v.array(v.strictObject({ questionId: sourceIdSchema, position: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(999)), currentVersion: v.pipe(positive, v.maxValue(1000)) })), v.maxLength(1000)),
	versions: v.pipe(v.array(v.strictObject({ questionId: sourceIdSchema, version: v.pipe(positive, v.maxValue(1000)), recordedAt: time, kind: v.picklist(['baseline', 'explanation']), data: questionSchema })), v.maxLength(MAX_BACKUP_VERSIONS)),
	states: v.pipe(v.array(v.strictObject({ questionId: sourceIdSchema, revision: positive, data: studyStateRecordSchema })), v.maxLength(1000)),
	reviews: v.pipe(v.array(v.strictObject({
		id: studyRequestIdSchema, questionId: sourceIdSchema, questionVersion: positive, stateRevision: positive,
		reviewedAt: time, data: reviewLogRecordSchema, before: storedFsrsCardSchema, after: storedFsrsCardSchema,
		request: studyReviewInputSchema, schedulerVersion: v.literal('ts-fsrs@5.4.1'), desiredRetention: v.literal(0.9), enableFuzz: v.literal(false),
	})), v.maxLength(10_000)),
});
export const backupEnvelopeSchema = v.strictObject({
	format: v.literal('misskey-fukushu-deck-backup'), version: v.literal(1), payload: backupPayloadSchema,
	sha256: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
});
export const backupInspectionSchema = v.strictObject({
	format: v.literal('misskey-fukushu-deck-backup'), version: v.literal(1), restored: v.literal(false),
	deckName: v.string(), deckId: sourceIdSchema, exportedAt: time, archived: v.boolean(),
	questions: v.number(), versions: v.number(), studyStates: v.number(), reviews: v.number(),
	conflicts: v.strictObject({ deck: v.boolean(), questions: v.number(), reviews: v.number() }),
});
export type BackupPayload = v.InferOutput<typeof backupPayloadSchema>;
export type BackupInspection = v.InferOutput<typeof backupInspectionSchema>;

export const backupRestoreResultSchema = v.strictObject({
	restored: v.literal(true), deckId: sourceIdSchema, archived: v.boolean(),
	questions: v.number(), versions: v.number(), studyStates: v.number(), reviews: v.number(),
});
export type BackupRestoreResult = v.InferOutput<typeof backupRestoreResultSchema>;
