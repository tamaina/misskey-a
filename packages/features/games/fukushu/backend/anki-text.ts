/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Delimited parsing and import record conventions adapted from tamaina/fukushu
 * (MIT), commit 0efee271a13f15096beb8cbaaea25092c5927b29:
 * application/importAnki.ts, application/decks.ts and utils/id.ts.
 * Original license: ../FUKUSHU-LICENSE.txt.
 */

import { createHash, randomUUID } from 'node:crypto';
import * as v from 'valibot';
import { materialSchema } from '../shared/material.schema.js';
import { MaterialError } from './store.js';
import type { FukushuMaterial } from '../shared/material.schema.js';

function invalid(reason: string): never {
	const error = new MaterialError('INVALID_MATERIAL');
	error.message = reason;
	throw error;
}

/** Upstream RFC-4180 fields, rejecting malformed quoting instead of repairing it. */
function parseDelimited(source: string, separator: ',' | '\t'): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	let closedQuote = false;
	for (let index = 0; index <= source.length; index += 1) {
		const character = source[index];
		if (quoted) {
			if (character === '"' && source[index + 1] === '"') {
				field += '"';
				index += 1;
			} else if (character === '"') {
				quoted = false;
				closedQuote = true;
			} else if (character === undefined) {
				invalid('Quoted field is not closed.');
			} else {
				field += character;
			}
			continue;
		}
		if (character === separator || character === '\n' || character === undefined) {
			row.push(field);
			field = '';
			closedQuote = false;
			if (character !== separator) {
				rows.push(row);
				row = [];
			}
		} else if (closedQuote) {
			invalid('Unexpected text after a quoted field.');
		} else if (character === '"') {
			if (field.length !== 0) invalid('Quotes in an unquoted field must be escaped.');
			quoted = true;
		} else {
			field += character;
		}
	}
	return rows;
}

/** New Basic/plain decks only; never an APKG/backup or update-import operation. */
export function buildAnkiTextMaterial(source: string, fileName: string, now = new Date()): FukushuMaterial {
	if (source.length > 131_072 || Buffer.byteLength(source, 'utf8') > 131_072) invalid('Anki text exceeds 128 KiB.');
	if (source.includes('\0') || /[\uD800-\uDFFF]/u.test(source)) invalid('Invalid Unicode text.');
	if (!Number.isFinite(now.getTime())) invalid('Invalid import time.');

	const headers = new Map<string, string>();
	const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
	let bodyStart = 0;
	for (const line of lines) {
		if (!line.startsWith('#')) break;
		const match = /^#([^:]+):(.*)$/.exec(line);
		if (!match) invalid('Only supported Anki headers may precede the cards.');
		const key = match[1].trim().toLowerCase();
		if (!['html', 'separator', 'deck', 'columns', 'notetype'].includes(key)) invalid('Unsupported Anki header.');
		if (headers.has(key)) invalid('Duplicate Anki header.');
		headers.set(key, match[2].trim());
		bodyStart += 1;
	}
	if (headers.get('html')?.toLowerCase() !== 'false') invalid('Explicit #html:false is required.');
	if (headers.has('notetype') && headers.get('notetype') !== 'Basic') invalid('Only the Basic note type is supported.');
	if (headers.has('deck') && !headers.get('deck')) invalid('Deck name is empty.');
	const body = lines.slice(bodyStart).join('\n');
	const requestedSeparator = headers.get('separator')?.toLowerCase();
	let separator: ',' | '\t';
	if (requestedSeparator !== undefined) {
		if (requestedSeparator === 'tab' || requestedSeparator === '\\t') separator = '\t';
		else if (requestedSeparator === 'comma' || requestedSeparator === ',') separator = ',';
		else invalid('Only tab and comma separators are supported.');
	} else {
		// Match upstream guessing for this two-separator subset (ties prefer tab).
		const firstLine = lines.slice(bodyStart).find(line => line && !line.startsWith('#')) ?? '';
		separator = /\.tsv$/i.test(fileName) || firstLine.split('\t').length >= firstLine.split(',').length ? '\t' : ',';
	}
	if (headers.has('columns')) {
		const columns = parseDelimited(headers.get('columns')!, separator);
		if (columns.length !== 1 || columns[0].length !== 2
			|| columns[0].some(name => !name.trim() || /^(deck|notetype|tags|guid)$/i.test(name.trim()))
			|| columns[0][0].trim().toLowerCase() === columns[0][1].trim().toLowerCase()) invalid('Exactly two regular columns are supported.');
	}

	const deckId = randomUUID();
	const time = now.toISOString();
	const questions: FukushuMaterial['questions'] = [];
	const sourceKeys = new Set<string>();
	for (const row of parseDelimited(body, separator)) {
		if (row.length === 1 && row[0] === '') continue;
		if (row.length !== 2) invalid('Each card must have exactly two fields.');
		const [front, back] = row;
		if (!front.trim()) invalid('The front field is empty.');
		// No cloze/template or media conversion in the plain-text pilot.
		if (row.some(value => /\{\{|\}\}|\[sound:|<\/?[a-z][^>]*>|!\[[^\]]*\]\(|\[(?:latex|\$\$?)\]/i.test(value))) invalid('Cloze, templates, HTML and media are not supported.');
		const sourceKey = `${createHash('sha256').update(`Basic\0${front}`).digest('hex')}:forward`;
		if (sourceKeys.has(sourceKey)) invalid('Duplicate front field: cards must have distinct source keys.');
		sourceKeys.add(sourceKey);
		if (questions.length >= 1000) invalid('At most 1,000 cards are supported.');
		const id = randomUUID();
		questions.push({
			id, deckId, sourceKey, sourceOrder: questions.length, kind: 'flashcard',
			enabled: true, enabledKey: 1, createdAt: time, updatedAt: time,
			payload: {
				id, deckId, sourceKey, kind: 'flashcard', categoryPath: [], ankiNoteType: 'Basic',
				prompt: { format: 'plain', value: front }, answer: { format: 'plain', value: back },
			},
		});
	}
	const parsed = v.safeParse(materialSchema, {
		deck: {
			id: deckId, name: headers.get('deck') ?? (fileName.replace(/\.(csv|tsv|txt)$/i, '') || 'Anki'),
			studyMode: 'flashcard', sourceType: 'anki-text', sourceFileName: fileName,
			sourceHash: createHash('sha256').update(source).digest('hex'), sourceText: source,
			importedAt: time, updatedAt: time, questionCount: questions.length, enabledQuestionCount: questions.length,
		},
		questions,
	});
	if (!parsed.success) invalid('Material is empty or exceeds supported field limits.');
	return parsed.output;
}
