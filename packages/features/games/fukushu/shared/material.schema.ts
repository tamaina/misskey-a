/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Record structure adapted from tamaina/fukushu (MIT), commit
 * 0efee271a13f15096beb8cbaaea25092c5927b29, infrastructure/db/schema.ts.
 * Original license: ../FUKUSHU-LICENSE.txt.
 */

import * as v from 'valibot';

// A deliberately bounded subset of upstream DeckRecord / QuestionRecord.
// Unknown fields are rejected, never stripped from a purported backup import.
const text = (max: number) => v.pipe(v.string(), v.maxLength(max), v.check(value => !value.includes('\0') && !/[\uD800-\uDFFF]/u.test(value), 'Invalid Unicode text'));
export const sourceIdSchema = v.pipe(text(256), v.minLength(1));
const timestamp = v.pipe(v.string(), v.isoTimestamp());
const integer = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1_000_000));
export const plainContentSchema = v.strictObject({ format: v.literal('plain'), value: text(16_384) });

export const deckSchema = v.strictObject({
	id: sourceIdSchema,
	name: v.pipe(text(256), v.minLength(1)),
	description: v.optional(text(4096)),
	studyMode: v.literal('flashcard'),
	sourceType: v.picklist(['gift', 'anki-text']),
	sourceFileName: v.optional(text(256)),
	sourceHash: text(256),
	sourceText: v.optional(text(131_072)),
	importedAt: timestamp,
	updatedAt: timestamp,
	questionCount: v.pipe(integer, v.maxValue(1000)),
	enabledQuestionCount: v.pipe(integer, v.maxValue(1000)),
});

const payload = v.strictObject({
	id: sourceIdSchema,
	deckId: sourceIdSchema,
	sourceKey: sourceIdSchema,
	name: v.optional(text(256)),
	prompt: plainContentSchema,
	categoryPath: v.pipe(v.array(text(256)), v.maxLength(32)),
	explanation: v.optional(plainContentSchema),
	shuffleChoices: v.optional(v.boolean()),
	kind: v.literal('flashcard'),
	answer: plainContentSchema,
	ankiNoteType: v.optional(v.literal('Basic')),
	typeAnswer: v.optional(v.boolean()),
	acceptedAnswer: v.optional(text(16_384)),
});

export const questionSchema = v.strictObject({
	id: sourceIdSchema,
	deckId: sourceIdSchema,
	sourceKey: sourceIdSchema,
	sourceOrder: integer,
	kind: v.literal('flashcard'),
	payload,
	enabled: v.boolean(),
	enabledKey: v.union([v.literal(0), v.literal(1)]),
	createdAt: timestamp,
	updatedAt: timestamp,
});

export const materialSchema = v.pipe(v.strictObject({
	deck: deckSchema,
	questions: v.pipe(v.array(questionSchema), v.minLength(1), v.maxLength(1000)),
}), v.check(material => material.deck.questionCount === material.questions.length
	&& material.deck.enabledQuestionCount === material.questions.filter(q => q.enabled).length
	&& new Set(material.questions.map(q => q.id)).size === material.questions.length
	&& new Set(material.questions.map(q => q.sourceKey)).size === material.questions.length
	&& material.questions.every(q => q.deckId === material.deck.id && q.payload.deckId === q.deckId
		&& q.payload.id === q.id && q.payload.sourceKey === q.sourceKey && q.enabledKey === Number(q.enabled)),
'Inconsistent material identity or counts'),
v.check(material => new TextEncoder().encode(JSON.stringify(material)).byteLength <= 1_048_576, 'Material exceeds 1 MiB'));

export type FukushuMaterial = v.InferOutput<typeof materialSchema>;
