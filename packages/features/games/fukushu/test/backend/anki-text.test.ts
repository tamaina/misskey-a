/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { buildAnkiTextMaterial } from '../../backend/anki-text.js';
import { MaterialError } from '../../backend/store.js';
import { materialSchema } from '../../shared/material.schema.js';

const time = new Date('2026-11-17T00:00:00.000Z');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const text = (body: string, header = '') => `#html:false\n${header}${body}`;

describe('strict Anki text material import', () => {
	test('preserves upstream Basic identities, metadata, source and hashes', () => {
		const source = '\uFEFF#separator:Tab\r\n#html:false\r\n#deck:教材🌟\r\n#columns:Front\tBack\r\n#notetype:Basic\r\n表\t裏\r\n\r\n次\t答\r\n';
		const result = buildAnkiTextMaterial(source, 'original.TSV', time);
		expect(v.parse(materialSchema, result)).toEqual(result);
		expect(result.deck).toEqual({
			id: expect.stringMatching(uuid), name: '教材🌟', studyMode: 'flashcard', sourceType: 'anki-text',
			sourceFileName: 'original.TSV', sourceText: source,
			sourceHash: createHash('sha256').update(source).digest('hex'),
			importedAt: time.toISOString(), updatedAt: time.toISOString(), questionCount: 2, enabledQuestionCount: 2,
		});
		for (const [index, [front, back]] of [['表', '裏'], ['次', '答']].entries()) {
			const card = result.questions[index];
			expect(card).toEqual({
				id: expect.stringMatching(uuid), deckId: result.deck.id,
				sourceKey: `${createHash('sha256').update(`Basic\0${front}`).digest('hex')}:forward`,
				sourceOrder: index, kind: 'flashcard', enabled: true, enabledKey: 1,
				createdAt: time.toISOString(), updatedAt: time.toISOString(),
				payload: {
					id: card.id, deckId: result.deck.id, sourceKey: card.sourceKey, kind: 'flashcard',
					ankiNoteType: 'Basic', categoryPath: [], prompt: { format: 'plain', value: front }, answer: { format: 'plain', value: back },
				},
			});
		}
		expect(result.questions[0].id).not.toBe(result.questions[1].id);
		const repeated = buildAnkiTextMaterial(source, 'original.TSV', time);
		expect(repeated.deck.id).not.toBe(result.deck.id);
		expect(repeated.questions[0].id).not.toBe(result.questions[0].id);
		expect(repeated.questions[0].sourceKey).toBe(result.questions[0].sourceKey);
	});

	test.each([
		['comma', 'cards.csv', '"one, two\nthree","a ""quoted"" answer"\nnext,', 'one, two\nthree', 'a "quoted" answer'],
		['tab', 'cards.tsv', '"one\ttwo\nthree"\t"a ""quoted"" answer"\nnext\t', 'one\ttwo\nthree', 'a "quoted" answer'],
	])('supports quoted delimiters, multiline fields and escaped quotes (%s)', (separator, fileName, body, front, back) => {
		const result = buildAnkiTextMaterial(text(body, `#separator:${separator}\n`), fileName, time);
		expect(result.questions.map(card => [card.payload.prompt.value, card.payload.answer.value])).toEqual([[front, back], ['next', '']]);
		expect(result.deck.name).toBe('cards');
	});

	test('matches upstream CRLF normalization in fields but hashes the original source', () => {
		const source = '#html:false\r\n#separator:comma\r\n"first\r\nsecond",answer';
		const result = buildAnkiTextMaterial(source, 'cards.csv', time);
		expect(result.questions[0].payload.prompt.value).toBe('first\nsecond');
		expect(result.questions[0].sourceKey).toBe(`${createHash('sha256').update('Basic\0first\nsecond').digest('hex')}:forward`);
		expect(result.deck.sourceText).toBe(source);
		expect(result.deck.sourceHash).not.toBe(createHash('sha256').update(source.replaceAll('\r\n', '\n')).digest('hex'));
	});

	test.each([
		['cards.csv', 'front,back'], ['cards.txt', 'front\tback'], ['cards.TSV', 'front\tback'],
	])('guesses supported separators for %s', (fileName, body) => {
		expect(buildAnkiTextMaterial(text(body), fileName).questions[0].payload.answer.value).toBe('back');
	});

	test.each([
		'front\tback', '#html:true\nfront\tback', '#html:0\nfront\tback',
		text('front\tback', '#html:false\n'), text('front\tback', '# HTML :false\n'),
		text('front\tback', '#guid column:1\n'), text('front\tback', '#deck column:1\n'),
		text('front\tback', '#notetype column:1\n'), text('front\tback', '#tags column:2\n'),
		text('front\tback', '#unknown:anything\n'), text('front\tback', '#comment\n'),
		text('front\tback', '#notetype:Cloze\n'), text('front\tback', '#notetype:Basic (and reversed card)\n'),
		text('front\tback', '#deck:\n'), text('front\tback', '#separator:pipe\n'),
		text('front\tback', '#separator:\n'), text('front\tback', '#columns:Front\tBack\tExtra\n'),
		text('front\tback', '#columns:Front\tTags\n'), text('front\tback', '#columns:Front\tFront\n'),
		text('front\tback', '#columns:Front\n'), text('front\tback', '#columns:\tBack\n'),
		text('front\tback\n#notetype:Cloze'),
	])('rejects unsupported, duplicate or incomplete headers (%#)', source => {
		expect(() => buildAnkiTextMaterial(source, 'cards.txt')).toThrow(MaterialError);
	});

	test.each([
		'', '\n\n', 'front', 'front\tback\textra', '\tback', ' \tback',
		'"front\tback', 'fr"ont\tback', '"front"junk\tback', 'front\t"back"junk',
		'{{c1::front}}\tback', 'front\t{{Back}}', '[sound:file.mp3]\tback',
		'front\t<img src="image.png">', 'front\t<audio src="a"></audio>', 'front\t![image](image.png)',
		'front\t[latex]x[/latex]', 'front\t<div>HTML</div>', 'front\t\0', 'front\t\uD800', 'front\t\uDC00',
		`front\t${'x'.repeat(16_385)}`,
	])('rejects unsupported content or malformed rows (%#)', body => {
		try {
			buildAnkiTextMaterial(text(body), 'cards.tsv');
			throw new Error('Expected an invalid material error');
		} catch (error) {
			expect(error).toBeInstanceOf(MaterialError);
			expect(error).toHaveProperty('code', 'INVALID_MATERIAL');
		}
	});

	test('rejects duplicate source keys instead of silently replacing either answer', () => {
		expect(() => buildAnkiTextMaterial(text('same\tone\nsame\ttwo'), 'cards.tsv')).toThrow('Duplicate front field');
		const result = buildAnkiTextMaterial(text('same\tone\n same\ttwo'), 'cards.tsv');
		expect(result.questions).toHaveLength(2);
		expect(result.questions[1].payload.prompt.value).toBe(' same');
	});

	test('bounds source characters and UTF-8 bytes before parsing', () => {
		expect(() => buildAnkiTextMaterial('x'.repeat(131_073), 'cards.tsv')).toThrow('128 KiB');
		expect(() => buildAnkiTextMaterial('字'.repeat(43_691), 'cards.tsv')).toThrow('128 KiB');
	});

	test('accepts 1,000 cards and rejects 1,001 without truncating', () => {
		const body = Array.from({ length: 1000 }, (_, index) => `front${index}\tback`).join('\n');
		expect(buildAnkiTextMaterial(text(body), 'cards.tsv').questions).toHaveLength(1000);
		expect(() => buildAnkiTextMaterial(text(`${body}\nextra\tback`), 'cards.tsv')).toThrow('1,000');
	});

	test('rejects an invalid clock and oversized metadata through the same error boundary', () => {
		expect(() => buildAnkiTextMaterial(text('front\tback'), 'cards.tsv', new Date('invalid'))).toThrow(MaterialError);
		expect(() => buildAnkiTextMaterial(text('front\tback'), 'x'.repeat(257))).toThrow(MaterialError);
		expect(() => buildAnkiTextMaterial(text('front\tback', `#deck:${'x'.repeat(257)}\n`), 'cards.tsv')).toThrow(MaterialError);
	});

	test('the shared schema permits only the supported optional Anki note type', () => {
		const input = buildAnkiTextMaterial(text('front\tback'), 'cards.tsv');
		delete input.questions[0].payload.ankiNoteType;
		expect(v.safeParse(materialSchema, input).success).toBe(true);
		for (const noteType of ['Cloze', 'Basic (and reversed card)', 'Unknown']) {
			const payload = { ...input.questions[0].payload, ankiNoteType: noteType };
			expect(v.safeParse(materialSchema, { ...input, questions: [{ ...input.questions[0], payload }] }).success).toBe(false);
		}
	});
});
