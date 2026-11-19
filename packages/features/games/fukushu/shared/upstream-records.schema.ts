/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Validation schemas adapted from tamaina/fukushu (MIT), backup.ts at
 * 0efee271a13f15096beb8cbaaea25092c5927b29. See ../FUKUSHU-LICENSE.txt.
 */
import * as v from 'valibot';

const iso = () => v.pipe(v.string(), v.isoTimestamp());
const integer = (minimum = 0) => v.pipe(v.number(), v.finite(), v.integer(), v.minValue(minimum));
const bounded = (minimum: number, maximum: number) =>
	v.pipe(v.number(), v.finite(), v.minValue(minimum), v.maxValue(maximum));
const FormatSchema = v.picklist(['plain', 'html', 'markdown', 'moodle', 'auto']);
const ContentSchema = v.strictObject({ format: FormatSchema, value: v.string() });
const PositionSchema = v.strictObject({ offset: integer(), line: integer(1), column: integer(1) });
const RangeSchema = v.strictObject({ start: PositionSchema, end: PositionSchema });
const commonQuestion = {
	id: v.string(),
	deckId: v.string(),
	sourceKey: v.string(),
	name: v.optional(v.string()),
	prompt: ContentSchema,
	categoryPath: v.array(v.string()),
	explanation: v.optional(ContentSchema),
	sourceRange: v.optional(RangeSchema),
	shuffleChoices: v.optional(v.boolean()),
};
const ChoiceSchema = v.strictObject({
	id: v.string(),
	content: ContentSchema,
	weight: bounded(-100, 100),
	feedback: v.optional(ContentSchema),
});
const ShortAnswerSchema = v.strictObject({
	value: v.string(),
	weight: bounded(-100, 100),
	feedback: v.optional(ContentSchema),
});
const NumericalAnswerSchema = v.variant('type', [
	v.strictObject({
		type: v.literal('exact'),
		value: v.pipe(v.number(), v.finite()),
		weight: bounded(-100, 100),
		feedback: v.optional(ContentSchema),
	}),
	v.strictObject({
		type: v.literal('tolerance'),
		value: v.pipe(v.number(), v.finite()),
		tolerance: v.pipe(v.number(), v.finite(), v.minValue(0)),
		weight: bounded(-100, 100),
		feedback: v.optional(ContentSchema),
	}),
	v.strictObject({
		type: v.literal('range'),
		min: v.pipe(v.number(), v.finite()),
		max: v.pipe(v.number(), v.finite()),
		weight: bounded(-100, 100),
		feedback: v.optional(ContentSchema),
	}),
]);
const MatchingPairSchema = v.strictObject({
	id: v.string(),
	left: ContentSchema,
	right: ContentSchema,
});
const QuizQuestionSchema = v.variant('kind', [
	v.strictObject({
		...commonQuestion,
		kind: v.literal('single-choice'),
		choices: v.array(ChoiceSchema),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('multiple-choice'),
		choices: v.array(ChoiceSchema),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('true-false'),
		correctAnswer: v.boolean(),
		trueFeedback: v.optional(ContentSchema),
		falseFeedback: v.optional(ContentSchema),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('short-answer'),
		answers: v.array(ShortAnswerSchema),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('numerical'),
		answers: v.array(NumericalAnswerSchema),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('matching'),
		pairs: v.array(MatchingPairSchema),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('essay'),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('description'),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('flashcard'),
		answer: ContentSchema,
		typeAnswer: v.optional(v.boolean()),
		acceptedAnswer: v.optional(v.string()),
		ankiNoteType: v.optional(v.string()),
		ankiTags: v.optional(v.array(v.string())),
		ankiCss: v.optional(v.string()),
		ankiForceLight: v.optional(v.boolean()),
		ankiTemplateMode: v.optional(v.picklist(['native', 'isolated'])),
		ankiSource: v.optional(
			v.strictObject({
				guid: v.optional(v.string()),
				noteId: v.string(),
				cardId: v.string(),
				notetypeId: v.string(),
				ordinal: integer(),
				qfmt: v.string(),
				afmt: v.string(),
				css: v.string(),
			}),
		),
	}),
	v.strictObject({
		...commonQuestion,
		kind: v.literal('unsupported'),
		sourceKind: v.picklist(['matching', 'essay', 'description']),
	}),
]);
const CardSchema = v.strictObject({
	due: iso(),
	stability: v.pipe(v.number(), v.finite(), v.minValue(0)),
	difficulty: v.pipe(v.number(), v.finite(), v.minValue(0)),
	elapsedDays: integer(),
	scheduledDays: integer(),
	reps: integer(),
	lapses: integer(),
	state: v.pipe(integer(), v.maxValue(3)),
	lastReview: v.optional(iso()),
});
const FsrsLogSchema = v.strictObject({
	rating: v.pipe(integer(1), v.maxValue(4)),
	state: v.pipe(integer(), v.maxValue(3)),
	due: iso(),
	stability: v.pipe(v.number(), v.finite(), v.minValue(0)),
	difficulty: v.pipe(v.number(), v.finite(), v.minValue(0)),
	elapsedDays: integer(),
	lastElapsedDays: integer(),
	scheduledDays: integer(),
	review: iso(),
});
export const learningSettingsSchema = v.object({
	desiredRetention: bounded(0.8, 0.97),
	newQuestionsPerDay: v.pipe(integer(), v.maxValue(200)),
	maxReviewsPerDay: v.nullable(v.pipe(integer(1), v.maxValue(1000))),
});
export type LearningSettings = v.InferOutput<typeof learningSettingsSchema>;
export const defaultLearningSettings: LearningSettings = { desiredRetention: 0.9, newQuestionsPerDay: 20, maxReviewsPerDay: null };

const SettingsSchema = v.strictObject({
	id: v.literal('global'),
	...learningSettingsSchema.entries,
	checkpointInterval: v.optional(v.pipe(integer(), v.maxValue(1000)), 20),
	shuffleChoices: v.boolean(),
	showImmediateFeedback: v.boolean(),
	locale: v.picklist(['ja', 'en']),
	theme: v.picklist(['system', 'light', 'dark']),
});
const DeckSchema = v.strictObject({
	id: v.string(),
	name: v.string(),
	description: v.optional(v.string()),
	studyMode: v.optional(v.picklist(['flashcard', 'quiz']), 'quiz'),
	historyRevision: v.optional(v.string()),
	sourceType: v.picklist(['gift', 'anki-text', 'anki-package']),
	sourceFileName: v.optional(v.string()),
	sourceHash: v.string(),
	sourceText: v.optional(v.string()),
	sourceId: v.optional(v.string()),
	sourceDeckKey: v.optional(v.string()),
	importedAt: iso(),
	updatedAt: iso(),
	questionCount: integer(),
	enabledQuestionCount: integer(),
});
const QuestionSchema = v.strictObject({
	id: v.string(),
	deckId: v.string(),
	sourceKey: v.string(),
	sourceOrder: v.optional(integer()),
	kind: v.picklist([
		'single-choice',
		'multiple-choice',
		'true-false',
		'short-answer',
		'numerical',
		'matching',
		'essay',
		'description',
		'flashcard',
		'unsupported',
	]),
	payload: QuizQuestionSchema,
	enabled: v.boolean(),
	enabledKey: v.union([v.literal(0), v.literal(1)]),
	createdAt: iso(),
	updatedAt: iso(),
});
const StudyStateSchema = v.strictObject({
	questionId: v.string(),
	deckId: v.string(),
	card: CardSchema,
	suspended: v.boolean(),
	suspendedKey: v.union([v.literal(0), v.literal(1)]),
	sourceRemoved: v.optional(v.boolean()),
	manualSuspended: v.optional(v.boolean()),
	buriedUntil: v.optional(iso()),
	updatedAt: iso(),
});
const ReviewLogSchema = v.strictObject({
	id: v.string(),
	questionId: v.string(),
	deckId: v.string(),
	reviewedAt: iso(),
	rating: v.picklist(['again', 'hard', 'good', 'easy']),
	correct: v.boolean(),
	selectedAnswerIds: v.optional(v.array(v.string())),
	responseText: v.optional(v.string()),
	durationMs: v.optional(integer()),
	fsrsLog: FsrsLogSchema,
	origin: v.optional(
		v.strictObject({ sourceId: v.string(), cardId: v.string(), revlogId: v.string() }),
	),
});
const BackupSchema = v.strictObject({
	format: v.literal('gift-fsrs-learning-backup'),
	version: v.union([v.literal(1), v.literal(2), v.literal(3)]),
	exportedAt: iso(),
	appVersion: v.string(),
	settings: SettingsSchema,
	decks: v.array(DeckSchema),
	questions: v.array(QuestionSchema),
	studyStates: v.array(StudyStateSchema),
	reviewLogs: v.array(ReviewLogSchema),
	importSources: v.optional(
		v.array(
			v.strictObject({
				id: v.string(),
				sourceType: v.picklist(['gift', 'anki-text', 'anki-package']),
				sourceFileName: v.optional(v.string()),
				sourceHash: v.string(),
				sourceText: v.optional(v.string()),
				sourceArchiveBase64: v.optional(v.string()),
				packageFormat: v.optional(v.picklist(['anki2', 'anki21', '21b'])),
				importProgress: v.optional(v.boolean()),
				forceLight: v.optional(v.boolean()),
				revision: v.optional(integer()),
				needsReimport: v.optional(v.boolean()),
				importedAt: iso(),
				updatedAt: iso(),
			}),
		),
	),
	imports: v.optional(
		v.array(
			v.strictObject({
				id: v.string(),
				deckId: v.string(),
				importedAt: iso(),
				sourceHash: v.string(),
				added: integer(),
				changed: integer(),
				disabled: integer(),
			}),
		),
	),
	media: v.optional(
		v.array(
			v.strictObject({
				id: v.string(),
				mimeType: v.string(),
				size: integer(),
				blobBase64: v.string(),
			}),
		),
	),
});

export const upstreamStoreSchemas = {
	settings: SettingsSchema, decks: DeckSchema, questions: QuestionSchema,
	studyStates: StudyStateSchema, reviewLogs: ReviewLogSchema,
	importSources: BackupSchema.entries.importSources.wrapped.item,
	media: BackupSchema.entries.media.wrapped.item,
	imports: BackupSchema.entries.imports.wrapped.item,
};
export type UpstreamRecords = { [K in keyof typeof upstreamStoreSchemas]: v.InferOutput<(typeof upstreamStoreSchemas)[K]>[] };
