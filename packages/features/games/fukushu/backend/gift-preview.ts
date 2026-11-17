/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 * Adapted from tamaina/fukushu 0efee271. See FUKUSHU-LICENSE.txt.
 */
import { createHash, randomUUID as createId } from 'node:crypto';
import { parseGift } from '../shared/upstream/gift/parser.js';
import { validateGift } from '../shared/upstream/gift/validate.js';
import type { GiftContent, GiftDiagnostic, GiftQuestion } from '../shared/upstream/gift/types.js';
import type { UpstreamRecords } from '../shared/upstream-records.schema.js';

type QuizQuestion = UpstreamRecords['questions'][number]['payload'];
type QuizContent = QuizQuestion['prompt'];

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const toContent = (value: GiftContent): QuizContent => ({
	format: value.format,
	value: value.value,
});
const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ');

function fingerprintAnswer(question: GiftQuestion) {
	switch (question.kind) {
		case 'multiple-choice': return question.answers.map(answer => [normalize(answer.content.value), answer.weight]);
		case 'true-false': return question.correctAnswer;
		case 'short-answer': return question.answers.map(answer => [normalize(answer.value), answer.weight]);
		case 'numerical': return question.answers;
		case 'matching': return question.pairs.map(pair => [normalize(pair.left.value), normalize(pair.right.value)]);
		default: return question.kind;
	}
}

const fingerprint = (question: GiftQuestion, categoryPath: string[]) =>
	JSON.stringify({ kind: question.kind, prompt: normalize(question.prompt.value), categoryPath, answer: fingerprintAnswer(question) });

function convert(
	question: GiftQuestion,
	deckId: string,
	categoryPath: string[],
	sourceKey: string,
): QuizQuestion {
	const common = {
		id: createId(),
		deckId,
		sourceKey,
		...(question.name === undefined ? {} : { name: question.name }),
		prompt: toContent(question.prompt),
		...(question.generalFeedback ? { explanation: toContent(question.generalFeedback) } : {}),
		categoryPath,
		sourceRange: question.range,
		...(/\[(?:no-shuffle|fixed|固定)\]/i.test(question.name ?? '')
			? { shuffleChoices: false }
			: {}),
	};
	if (question.kind === 'multiple-choice') return {
		...common,
		kind: question.mode === 'single' ? 'single-choice' : 'multiple-choice',
		choices: question.answers.map((answer) => ({
			id: createId(),
			content: toContent(answer.content),
			weight: answer.weight,
			...(answer.feedback ? { feedback: toContent(answer.feedback) } : {}),
		})),
	};
	if (question.kind === 'true-false') return {
		...common,
		kind: 'true-false',
		correctAnswer: question.correctAnswer,
		...(question.trueFeedback ? { trueFeedback: toContent(question.trueFeedback) } : {}),
		...(question.falseFeedback ? { falseFeedback: toContent(question.falseFeedback) } : {}),
	};
	if (question.kind === 'short-answer') return {
		...common,
		kind: 'short-answer',
		answers: question.answers.map((answer) => ({
			value: answer.value,
			weight: answer.weight,
			...(answer.feedback ? { feedback: toContent(answer.feedback) } : {}),
		})),
	};
	if (question.kind === 'numerical') return {
		...common,
		kind: 'numerical',
		answers: question.answers.map((answer) =>
			answer.type === 'numerical-exact'
				? {
					type: 'exact',
					value: answer.value,
					weight: answer.weight,
					...(answer.feedback ? { feedback: toContent(answer.feedback) } : {}),
				}
				: answer.type === 'numerical-tolerance'
					? {
						type: 'tolerance',
						value: answer.value,
						tolerance: answer.tolerance,
						weight: answer.weight,
						...(answer.feedback ? { feedback: toContent(answer.feedback) } : {}),
					}
					: {
						type: 'range',
						min: answer.min,
						max: answer.max,
						weight: answer.weight,
						...(answer.feedback ? { feedback: toContent(answer.feedback) } : {}),
					},
		),
	};
	if (question.kind === 'matching') return {
		...common,
		kind: 'matching',
		pairs: question.pairs.map((pair) => ({
			id: createId(),
			left: toContent(pair.left),
			right: toContent(pair.right),
		})),
	};
	if (question.kind === 'essay') return { ...common, kind: 'essay' };
	if (question.kind === 'description') return { ...common, kind: 'description' };
	throw new Error('Unsupported GIFT question kind.');
}

export interface ImportPreview {
	source: string
	sourceHash: string
	diagnostics: GiftDiagnostic[]
	questions: QuizQuestion[]
}
export function previewGift(source: string, deckId: string): ImportPreview {
	const parsed = parseGift(source);
	const diagnostics = [...parsed.diagnostics, ...validateGift(parsed.document)];
	const names = new Map<string, number>();
	for (const block of parsed.document.children) if (block.type === 'question' && block.name) names.set(block.name, (names.get(block.name) ?? 0) + 1);
	let categoryPath: string[] = [];
	const questions: QuizQuestion[] = [];
	const keys = new Set<string>();
	for (const block of parsed.document.children) {
		if (block.type === 'category') {
			categoryPath = block.path;
			continue;
		}
		if (block.type !== 'question') continue;
		const hash = sha256(fingerprint(block, categoryPath));
		const key =
			block.name && names.get(block.name) === 1
				? block.name
				: block.name
					? `${categoryPath.join('/')}:${block.name}`
					: hash;
		if (keys.has(key)) diagnostics.push({
			severity: 'error',
			code: 'GIFT_SOURCE_KEY_COLLISION',
			message: 'Multiple questions resolve to the same question ID.',
			range: block.range,
		});
		keys.add(key);
		questions.push(convert(block, deckId, [...categoryPath], key));
	}
	return { source, sourceHash: sha256(source), diagnostics, questions };
}
