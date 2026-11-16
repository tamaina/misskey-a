/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Adapted from tamaina/fukushu (MIT), commit 0efee271a13f15096beb8cbaaea25092c5927b29:
 * packages/app/src/domain/quiz/{grading,types}.ts
 * The original license is preserved in ../FUKUSHU-LICENSE.txt.
 */

export interface QuizContent {
	format: 'plain' | 'html' | 'markdown' | 'moodle' | 'auto';
	value: string;
}

interface QuizChoice {
	id: string;
	weight: number;
	feedback?: QuizContent;
}

interface NumericalAnswer {
	type: 'exact' | 'tolerance' | 'range';
	value?: number;
	tolerance?: number;
	min?: number;
	max?: number;
	weight: number;
	feedback?: QuizContent;
}

/** Only the fields used by grading; independent of persistence and import formats. */
export type GradingQuestion =
	| { kind: 'single-choice' | 'multiple-choice'; choices: QuizChoice[] }
	| { kind: 'true-false'; correctAnswer: boolean; trueFeedback?: QuizContent; falseFeedback?: QuizContent }
	| { kind: 'short-answer'; answers: { value: string; weight: number; feedback?: QuizContent }[] }
	| { kind: 'numerical'; answers: NumericalAnswer[] }
	| { kind: 'matching'; pairs: { id: string }[] }
	| { kind: 'essay' | 'description' | 'flashcard' | 'unsupported' };

export interface GradeResult {
	score: number;
	correct: boolean;
	feedback: QuizContent[];
}

const result = (
	score: number,
	feedback: GradeResult['feedback'],
	correct = score >= 100,
): GradeResult => ({
	score: Math.max(0, Math.min(100, score)),
	correct,
	feedback,
});

/**
 * Grade an imported question and a valid study answer using Fukushu's rules.
 * This is not an API input validator or an HTML sanitizer. Self-rated question
 * kinds return the upstream neutral result and require a separate rating step.
 */
export function gradeQuestion(question: GradingQuestion, answer: string[]): GradeResult {
	if (question.kind === 'single-choice') {
		const selected = question.choices.filter((choice) => answer.includes(choice.id));
		const raw = selected.reduce((sum, choice) => sum + choice.weight, 0);
		const max = Math.max(...question.choices.map((choice) => choice.weight), 0);
		return result(
			max > 0 ? (raw / max) * 100 : raw,
			selected.flatMap((choice) => (choice.feedback ? [choice.feedback] : [])),
		);
	}
	if (question.kind === 'multiple-choice') {
		const selected = question.choices.filter((choice) => answer.includes(choice.id));
		const correctChoices = question.choices.filter((choice) => choice.weight > 0);
		const availableScore = correctChoices.reduce((sum, choice) => sum + choice.weight, 0);
		const earnedScore = selected.reduce((sum, choice) => sum + Math.max(0, choice.weight), 0);
		const exact = selected.length === correctChoices.length && selected.every((choice) => choice.weight > 0);
		return result(
			availableScore > 0 ? (earnedScore / availableScore) * 100 : 0,
			selected.flatMap((choice) => (choice.feedback ? [choice.feedback] : [])),
			exact,
		);
	}
	if (question.kind === 'true-false') {
		const value = answer[0] === 'true';
		const correct = value === question.correctAnswer;
		const feedback = value ? question.trueFeedback : question.falseFeedback;
		return result(correct ? 100 : 0, feedback ? [feedback] : []);
	}
	if (question.kind === 'short-answer') {
		const entered = answer[0]?.trim() ?? '';
		const normalized = entered.normalize('NFKC').toLocaleLowerCase();
		const found = question.answers.find(
			(candidate) => candidate.value.trim().normalize('NFKC').toLocaleLowerCase() === normalized,
		);
		return result(found?.weight ?? 0, found?.feedback ? [found.feedback] : []);
	}
	if (question.kind === 'numerical') {
		const entered = Number(answer[0]);
		if (!Number.isFinite(entered)) return result(0, []);
		const found = question.answers.find((candidate) =>
			candidate.type === 'exact'
				? Math.abs(entered - (candidate.value ?? 0)) <= Number.EPSILON * Math.max(1, Math.abs(entered))
				: candidate.type === 'tolerance'
					? Math.abs(entered - (candidate.value ?? 0)) <= (candidate.tolerance ?? 0)
					: entered >= (candidate.min ?? Infinity) && entered <= (candidate.max ?? -Infinity),
		);
		return result(found?.weight ?? 0, found?.feedback ? [found.feedback] : []);
	}
	if (question.kind === 'matching') {
		const selections = new Map(answer.map((entry) => entry.split('\u0000', 2) as [string, string]));
		const correct = question.pairs.filter((pair) => selections.get(pair.id) === pair.id).length;
		return result((correct / question.pairs.length) * 100, [], correct === question.pairs.length);
	}
	return result(0, []);
}
