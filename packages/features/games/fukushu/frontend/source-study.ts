/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 * Adapted from Fukushu's application/study.ts. See ../FUKUSHU-LICENSE.txt.
 */
import type { UpstreamRecords } from '../shared/upstream-records.schema.js';

export type SourceQuestion = UpstreamRecords['questions'][number];
export type Payload = SourceQuestion['payload'];
export type Content = Payload['prompt'];

function day(date: Date) {
	const shifted = new Date(date);
	shifted.setHours(shifted.getHours() - 4);
	return shifted.toDateString();
}

export function shuffled<T>(values: T[]) {
	const result = values.slice();
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[j], result[i]] = [result[i], result[j]];
	}
	if (result.length > 1 && result.every((v, i) => v === values[i])) result.push(result.shift()!);
	return result;
}

export function queue(records: UpstreamRecords, deckId: string | undefined, now: Date, cram: boolean, reviewedToday?: ReadonlySet<string>): SourceQuestion[] {
	const settings = records.settings[0];
	const states = records.studyStates.filter(s => (deckId === undefined || s.deckId === deckId) && !s.suspended)
		.sort((a, b) => a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0);
	const questions = new Map(records.questions.filter(q => q.enabled && q.kind !== 'unsupported').map(q => [q.id, q]));
	const today = reviewedToday ?? new Set(records.reviewLogs.filter(r => day(new Date(r.reviewedAt)) === day(now)).map(r => r.questionId));
	const reviews = states.filter(s => s.card.reps > 0 && (cram || new Date(s.card.due) <= now) && questions.has(s.questionId))
		.sort((a, b) => a.card.due.localeCompare(b.card.due));
	const fresh = states.filter(s => s.card.reps === 0 && (cram || !today.has(s.questionId)));
	return [...(cram || settings.maxReviewsPerDay === null ? reviews : reviews.slice(0, settings.maxReviewsPerDay)),
									...(cram ? fresh : fresh.slice(0, settings.newQuestionsPerDay))].flatMap(s => questions.get(s.questionId) ?? []);
}

export function solution(q: Payload, yes: string, no: string): Content[] {
	const plain = (value: string): Content => ({ value, format: 'plain' });
	switch (q.kind) {
		case 'flashcard': return [q.answer];
		case 'true-false': return [plain(q.correctAnswer ? yes : no)];
		case 'single-choice':
		case 'multiple-choice': return q.choices.filter(c => c.weight > 0).map(c => c.content);
		case 'short-answer': return q.answers.filter(a => a.weight >= 100).map(a => plain(a.value));
		case 'numerical': return q.answers.filter(a => a.weight >= 100).map(a => plain(a.type === 'range' ? a.min + ' … ' + a.max : a.type === 'tolerance' ? a.value + ' ± ' + a.tolerance : String(a.value)));
		case 'matching': return q.pairs.flatMap(p => [p.left, p.right]);
		default: return [];
	}
}
