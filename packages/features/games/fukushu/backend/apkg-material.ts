/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { decodeArchive } from '@aqz/anki-reader/archive';
import * as v from 'valibot';
import { resolveAnkiReaderWasm } from '@/anki-reader.js';
import { materialSchema } from '../shared/material.schema.js';
import type { FukushuMaterial } from '../shared/material.schema.js';

export class ApkgMaterialError extends Error {
	constructor(public readonly code: 'APKG_INVALID' | 'APKG_UNSUPPORTED') {
		super(code);
	}
}

type Decoded = Awaited<ReturnType<typeof decodeArchive>>;
type Row = Record<string, unknown>;

const STOCK_CSS = '.card{font-family:arial;font-size:20px;line-height:1.5;text-align:center;color:black;background-color:white;}';

function asRecord(value: unknown): Row {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new ApkgMaterialError('APKG_INVALID');
	return value as Row;
}

function jsonRecord(value: unknown): Row {
	if (typeof value !== 'string') throw new ApkgMaterialError('APKG_INVALID');
	try {
		return asRecord(JSON.parse(value));
	} catch {
		throw new ApkgMaterialError('APKG_INVALID');
	}
}

function positiveId(value: unknown): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) throw new ApkgMaterialError('APKG_INVALID');
	return value;
}

function isStockBasic(model: Row): boolean {
	const { type, flds, tmpls, css } = model;
	if (type !== 0 || !Array.isArray(flds) || flds.length !== 2 || !Array.isArray(tmpls) || tmpls.length !== 1
		|| typeof css !== 'string' || css.replace(/\s+/g, '') !== STOCK_CSS) return false;
	// Anki localizes the two stock field labels, but not the special FrontSide token.
	const front = asRecord(flds[0]).name;
	const back = asRecord(flds[1]).name;
	if (!((front === 'Front' && back === 'Back') || (front === '表面' && back === '裏面'))) return false;
	const template = asRecord(tmpls[0]);
	return template.ord === 0 && typeof template.qfmt === 'string' && template.qfmt.trim() === `{{${front}}}`
		&& typeof template.afmt === 'string'
		&& /^\s*\{\{FrontSide\}\}\s*<hr id=(?:"answer"|'answer'|answer)>\s*\{\{(Back|裏面)\}\}\s*$/.exec(template.afmt)?.[1] === back;
}

// This pilot copies literal fields, not rendered HTML. Reject markup, HTML
// escapes, media, math and template syntax rather than stripping or evaluating it.
function plainField(text: string): boolean {
	return text.trim().length > 0 && text.length <= 16_384
		&& !/[<>{}\x00-\x1f]|&(?:#|[a-z])|\[(?:sound:|latex\]|\$)|\\[([]/i.test(text);
}

function mapPlainBasicArchive(decoded: Decoded, fileName: string, sha256: string): FukushuMaterial {
	const { format, files, rows } = decoded;
	const { cards, notes, revlog } = rows;
	const col = rows.col?.[0];
	if (!col || !cards || !notes || !revlog) throw new ApkgMaterialError('APKG_INVALID');
	// Current Anki exports may carry a legacy compatibility collection. No
	// actual media is accepted, including stale numeric files or malformed maps.
	if (Object.keys(files).some(name => name !== 'meta' && name !== 'media' && !(name === 'collection.anki2' && format !== 'anki2'))
		|| (files.media && (format === '21b' ? files.media.length !== 0 : new TextDecoder().decode(files.media).trim() !== '{}'))
		|| revlog.length > 0 || notes.length !== cards.length || cards.length < 1 || cards.length > 1000) {
		throw new ApkgMaterialError('APKG_UNSUPPORTED');
	}

	const models = jsonRecord(col.models);
	const decks = jsonRecord(col.decks);
	const deckId = positiveId(cards[0].did);
	const deck = asRecord(Object.hasOwn(decks, deckId) ? decks[deckId] : undefined);
	const notesById = new Map(notes.map(note => [positiveId(note.id), note]));
	const usedNotes = new Set<number>();
	const usedCards = new Set<number>();
	const validatedModels = new Set<number>();
	const id = `apkg:${sha256}`;
	const time = new Date().toISOString();
	const questions: FukushuMaterial['questions'] = [];

	for (const card of cards) {
		const cid = positiveId(card.id);
		const nid = positiveId(card.nid);
		const note = notesById.get(nid);
		if (!note || usedCards.has(cid) || usedNotes.has(nid)) throw new ApkgMaterialError('APKG_INVALID');
		usedCards.add(cid);
		usedNotes.add(nid);
		if (card.did !== deckId || card.ord !== 0 || (card.flags !== undefined && card.flags !== 0)
			|| typeof note.tags !== 'string' || note.tags.trim() !== '' || typeof note.flds !== 'string') {
			throw new ApkgMaterialError('APKG_UNSUPPORTED');
		}
		const mid = positiveId(note.mid);
		if (!validatedModels.has(mid)) {
			const model = asRecord(Object.hasOwn(models, mid) ? models[mid] : undefined);
			if (!isStockBasic(model)) throw new ApkgMaterialError('APKG_UNSUPPORTED');
			validatedModels.add(mid);
		}
		const fields = note.flds.split('\x1f');
		if (fields.length !== 2 || !fields.every(plainField)) throw new ApkgMaterialError('APKG_UNSUPPORTED');
		const sourceKey = `anki-card:${cid}`;
		const questionId = `${id}:${sourceKey}`;
		questions.push({
			id: questionId, deckId: id, sourceKey, sourceOrder: questions.length, kind: 'flashcard',
			enabled: true, enabledKey: 1, createdAt: time, updatedAt: time,
			payload: {
				id: questionId, deckId: id, sourceKey, kind: 'flashcard', categoryPath: [], ankiNoteType: 'Basic',
				prompt: { format: 'plain', value: fields[0] }, answer: { format: 'plain', value: fields[1] },
			},
		});
	}
	const result = v.safeParse(materialSchema, {
		deck: {
			id, name: deck.name, studyMode: 'flashcard', sourceType: 'anki-apkg', sourceFileName: fileName,
			sourceHash: sha256, importedAt: time, updatedAt: time,
			questionCount: questions.length, enabledQuestionCount: questions.length,
		},
		questions,
	});
	if (!result.success) throw new ApkgMaterialError('APKG_UNSUPPORTED');
	return result.output;
}

/** Archive-only import of a strict single-deck Basic subset; no DOM or new review state. */
export async function readApkgMaterial(bytes: Uint8Array, fileName: string, sha256: string): Promise<FukushuMaterial> {
	if (!/^[a-f0-9]{64}$/.test(sha256) || createHash('sha256').update(bytes).digest('hex') !== sha256) {
		throw new ApkgMaterialError('APKG_INVALID');
	}
	const wasmUrl = resolveAnkiReaderWasm();
	let decoded: Decoded;
	try {
		decoded = await decodeArchive(bytes, { wasmUrl });
	} catch {
		throw new ApkgMaterialError('APKG_INVALID');
	}
	return mapPlainBasicArchive(decoded, fileName, sha256);
}
