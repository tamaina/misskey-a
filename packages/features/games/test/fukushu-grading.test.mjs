/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Includes cases adapted from tamaina/fukushu's grading.test.ts (MIT).
 * See ../FUKUSHU-LICENSE.txt.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gradeQuestion } from '../shared/fukushu-grading.ts';

const feedback = { format: 'plain', value: 'Explanation' };

test('single choice normalizes the highest weight and retains partial credit and feedback', () => {
	const question = { kind: 'single-choice', choices: [
		{ id: 'a', weight: 50, feedback },
		{ id: 'b', weight: 25 },
		{ id: 'x', weight: -50 },
	] };
	assert.deepEqual(gradeQuestion(question, ['a']), { score: 100, correct: true, feedback: [feedback] });
	assert.deepEqual(gradeQuestion(question, ['b']), { score: 50, correct: false, feedback: [] });
	assert.deepEqual(gradeQuestion(question, ['x']), { score: 0, correct: false, feedback: [] });
});

test('multiple choice separates full positive score from an exact answer', () => {
	const question = { kind: 'multiple-choice', choices: [
		{ id: 'a', weight: 50 },
		{ id: 'b', weight: 50 },
		{ id: 'x', weight: -50, feedback },
	] };
	assert.deepEqual(gradeQuestion(question, ['a']), { score: 50, correct: false, feedback: [] });
	assert.deepEqual(gradeQuestion(question, ['a', 'x']), { score: 50, correct: false, feedback: [feedback] });
	assert.deepEqual(gradeQuestion(question, ['a', 'b']), { score: 100, correct: true, feedback: [] });
	assert.deepEqual(gradeQuestion(question, ['a', 'b', 'x']), { score: 100, correct: false, feedback: [feedback] });
	assert.deepEqual(gradeQuestion(question, []), { score: 0, correct: false, feedback: [] });
});

test('true/false returns feedback for the selected answer', () => {
	const question = { kind: 'true-false', correctAnswer: false, falseFeedback: feedback };
	assert.deepEqual(gradeQuestion(question, ['false']), { score: 100, correct: true, feedback: [feedback] });
	assert.deepEqual(gradeQuestion(question, ['true']), { score: 0, correct: false, feedback: [] });
});

test('short answers trim and normalize Unicode and case', () => {
	const question = { kind: 'short-answer', answers: [{ value: 'Blue', weight: 100 }] };
	assert.equal(gradeQuestion(question, [' blue ']).correct, true);
	assert.equal(gradeQuestion(question, ['ＢＬＵＥ']).correct, true);
	assert.equal(gradeQuestion(question, ['green']).correct, false);
	assert.equal(gradeQuestion({ ...question, answers: [{ value: 'Ａ', weight: 100 }] }, ['a']).correct, true);
});

test('short answers keep the first matching answer, partial credit, and score bounds', () => {
	const question = { kind: 'short-answer', answers: [
		{ value: 'a', weight: 50, feedback }, { value: 'a', weight: 100 },
		{ value: 'b', weight: 120 }, { value: 'x', weight: -10 },
	] };
	assert.deepEqual(gradeQuestion(question, ['a']), { score: 50, correct: false, feedback: [feedback] });
	assert.equal(gradeQuestion(question, ['b']).score, 100);
	assert.equal(gradeQuestion(question, ['x']).score, 0);
});

test('exact numerical answers tolerate floating point rounding', () => {
	const question = { kind: 'numerical', answers: [{ type: 'exact', value: 0.3, weight: 100, feedback }] };
	assert.deepEqual(gradeQuestion(question, [String(0.1 + 0.2)]), { score: 100, correct: true, feedback: [feedback] });
	assert.equal(gradeQuestion(question, ['0.31']).correct, false);
});

test('numerical tolerance and ranges include their boundaries', () => {
	const question = { kind: 'numerical', answers: [
		{ type: 'tolerance', value: 3.14, tolerance: 0.01, weight: 100 },
		{ type: 'range', min: 9, max: 11, weight: 100 },
	] };
	for (const value of ['3.145', '9', '10', '11']) assert.equal(gradeQuestion(question, [value]).correct, true);
	for (const value of ['3.2', '8.99', '11.01']) assert.equal(gradeQuestion(question, [value]).correct, false);
	const tolerance = { kind: 'numerical', answers: [{ type: 'tolerance', value: 4, tolerance: 0.5, weight: 100 }] };
	for (const value of ['3.5', '4.5']) assert.equal(gradeQuestion(tolerance, [value]).correct, true);
});

test('numerical answers preserve partial credit and reject nonfinite values', () => {
	const question = { kind: 'numerical', answers: [{ type: 'exact', value: 10, weight: 50, feedback }] };
	assert.deepEqual(gradeQuestion(question, ['10']), { score: 50, correct: false, feedback: [feedback] });
	for (const value of ['NaN', 'Infinity', '-Infinity', 'ten']) {
		assert.deepEqual(gradeQuestion(question, [value]), { score: 0, correct: false, feedback: [] });
	}
});

test('matching gives partial credit and requires every pair to be correct', () => {
	const question = { kind: 'matching', pairs: [{ id: 'a' }, { id: 'b' }] };
	assert.deepEqual(gradeQuestion(question, ['a\u0000a', 'b\u0000b']), { score: 100, correct: true, feedback: [] });
	assert.deepEqual(gradeQuestion(question, ['a\u0000b', 'b\u0000b']), { score: 50, correct: false, feedback: [] });
	assert.deepEqual(gradeQuestion(question, ['a\u0000b', 'b\u0000a']), { score: 0, correct: false, feedback: [] });
});

test('self-rated and legacy unsupported questions retain the neutral grading result', () => {
	for (const kind of ['essay', 'description', 'flashcard', 'unsupported']) {
		assert.deepEqual(gradeQuestion({ kind }, ['answer']), { score: 0, correct: false, feedback: [] });
	}
});

test('grading leaves the question and answer unchanged', () => {
	const question = { kind: 'multiple-choice', choices: [{ id: 'a', weight: 100, feedback }] };
	const answer = ['a'];
	const before = structuredClone({ question, answer });
	gradeQuestion(question, answer);
	assert.deepEqual({ question, answer }, before);
});
