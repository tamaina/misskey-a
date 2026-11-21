/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { materialSchema } from '../../shared/material.schema.js';
import { material } from './fixture.js';

describe('Fukushu material input boundary', () => {
	test('preserves the upstream identities, ordering, timestamps and plain content', () => {
		const input = material('source-deck:日本語🌟', 'original-guid:0');
		expect(v.parse(materialSchema, input)).toEqual(input);
	});
	test.each([
		(value) => { value.questions[0].deckId = 'foreign'; },
		(value) => { value.questions[0].payload.id = 'different'; },
		(value) => { value.questions[0].payload.sourceKey = 'different'; },
		(value) => { value.questions[0].enabledKey = 0; },
		(value) => { value.deck.questionCount = 2; },
		(value) => { value.deck.enabledQuestionCount = 0; },
		(value) => { value.questions.push(value.questions[0]); value.deck.questionCount = 2; value.deck.enabledQuestionCount = 2; },
	] satisfies ((value: ReturnType<typeof material>) => void)[])('rejects inconsistent references and counts (%#)', mutate => {
		const input = material(); mutate(input);
		expect(v.safeParse(materialSchema, input).success).toBe(false);
	});
	test('rejects unsupported formats and extra fields rather than dropping data', () => {
		const input = material();
		for (const extra of [{ historyRevision: 'existing' }, { sourceId: 'unresolved' }]) {
			expect(v.safeParse(materialSchema, { ...input, deck: { ...input.deck, ...extra } }).success).toBe(false);
		}
		for (const extra of [{ format: 'html', value: '<script>x</script>' }, { format: 'markdown', value: 'x' }]) {
			expect(v.safeParse(materialSchema, { ...input, questions: [{ ...input.questions[0], payload: { ...input.questions[0].payload, prompt: extra } }] }).success).toBe(false);
		}
		expect(v.safeParse(materialSchema, { ...input, reviewLogs: [] }).success).toBe(false);
		expect(v.safeParse(materialSchema, { ...input, deck: { ...input.deck, sourceType: 'anki-package' } }).success).toBe(false);
	});
	test('bounds identifiers, text, card count, numeric order and total UTF-8 bytes', () => {
		for (const id of ['', 'x'.repeat(257), 'x\0y', '\uD800', '\uDC00']) expect(v.safeParse(materialSchema, material(id)).success).toBe(false);
		const input = material();
		input.questions[0].payload.answer.value = 'x'.repeat(16_385);
		expect(v.safeParse(materialSchema, input).success).toBe(false);
		input.questions[0].payload.answer.value = '字'.repeat(16_384);
		input.questions = Array.from({ length: 30 }, (_, index) => ({ ...input.questions[0], id: `card${index}`, sourceKey: `source${index}`, payload: { ...input.questions[0].payload, id: `card${index}`, sourceKey: `source${index}` } }));
		input.deck.questionCount = input.deck.enabledQuestionCount = input.questions.length;
		expect(v.safeParse(materialSchema, input).success).toBe(false);
		input.questions = []; input.deck.questionCount = input.deck.enabledQuestionCount = 0;
		expect(v.safeParse(materialSchema, input).success).toBe(false);
		const invalidOrder = material(); invalidOrder.questions[0].sourceOrder = 1.5;
		expect(v.safeParse(materialSchema, invalidOrder).success).toBe(false);
	});
	test('accepts 1,000 bounded cards and rejects 1,001 without truncation', () => {
		const input = material();
		input.questions = Array.from({ length: 1000 }, (_, index) => {
			const question = material(input.deck.id, `card${index}`).questions[0];
			question.sourceKey = question.payload.sourceKey = `source${index}`;
			return question;
		});
		input.deck.questionCount = input.deck.enabledQuestionCount = 1000;
		expect(v.parse(materialSchema, input).questions).toHaveLength(1000);
		input.questions.push(material(input.deck.id, 'extra-card').questions[0]);
		input.deck.questionCount = input.deck.enabledQuestionCount = 1001;
		expect(v.safeParse(materialSchema, input).success).toBe(false);
	});
});
