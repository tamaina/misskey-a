/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { decodeArchive } from '@aqz/anki-reader/archive';
import { HTMLElement, parse } from 'node-html-parser';
import * as v from 'valibot';
import { convertAnkiArchive, resolveAnkiReaderWasm } from '@/anki-reader.js';
import { ankiMediaReference, normalizeAnkiAsset, validateAnkiMediaReferences } from './anki-media.js';
import { MAX_ANKI_MEDIA_BYTES } from '../shared/anki-media.schema.js';
import { materialSchema } from '../shared/material.schema.js';
import type { AnkiMediaAsset } from '../shared/anki-media.schema.js';
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

const staticTags = new Set('p br b strong mark details summary i em u s sub sup ruby rt rp ul ol li span div section article table thead tbody tr th td blockquote pre code hr h1 h2 h3 h4 h5 h6'.split(' '));

function staticHtml(value: string, assets?: ReadonlyMap<string, AnkiMediaAsset>, raw = false) {
	// Check both pre-conversion sources and converted markup. Reject active or
	// unsupported constructs instead of quietly dropping them; no URLs or inline CSS.
	if (value.length > 16_384) throw new ApkgMaterialError('APKG_UNSUPPORTED');
	const document = parse(value);
	const pending = document.childNodes.map(node => ({ node, depth: 1 }));
	const media = new Set<string>();
	while (pending.length) {
		const next = pending.pop()!;
		const { node, depth } = next;
		if (depth > 128) throw new ApkgMaterialError('APKG_UNSUPPORTED');
		if (node instanceof HTMLElement) {
			const tag = node.rawTagName.toLowerCase();
			if (assets && (tag === 'img' || tag === 'audio')) {
				if (raw) {
					// Only literal local image filenames. Audio can enter through
					// Anki's [sound:...] notation, not user-supplied HTML audio.
					const src = node.getAttribute('src');
					if (tag !== 'img' || !src || !/^[^\x00-\x1f\x7f\\/:{}<>?#]{1,256}\.png$/i.test(src)
						|| Object.keys(node.attributes).some(name => name !== 'src' && name !== 'alt')
						|| (node.getAttribute('alt')?.length ?? 0) > 256 || node.childNodes.length) throw new ApkgMaterialError('APKG_UNSUPPORTED');
				} else {
					const ref = ankiMediaReference(node);
					const asset = ref && assets.get(ref.id);
					if (!ref || !asset || ref.mimeType !== asset.mimeType || media.has(tag)) throw new ApkgMaterialError('APKG_UNSUPPORTED');
					media.add(tag);
					node.setAttribute('src', `fukushu-media:${asset.id}`);
				}
				continue;
			}
			if (!staticTags.has(tag)) throw new ApkgMaterialError('APKG_UNSUPPORTED');
			for (const [rawName, value] of Object.entries(node.attributes)) {
				const name = rawName.toLowerCase();
				const allowed = name === 'id' || name === 'class' ? value.length <= 256 && /^[\w\s-]+$/.test(value)
					: (tag === 'td' || tag === 'th') && (name === 'colspan' || name === 'rowspan') && /^(?:[1-9]|[12]\d|3[012])$/.test(value);
				if (!allowed) throw new ApkgMaterialError('APKG_UNSUPPORTED');
			}
		}
		for (const child of node.childNodes) pending.push({ node: child, depth: depth + 1 });
	}
	const text = document.text.trim() || [
		...(media.has('img') ? ['[画像 / image]'] : []),
		...(media.has('audio') ? ['[音声 / audio]'] : []),
	].join(' ');
	return { text, html: media.size ? document.toString() : value };
}

export type ApkgImport = { material: FukushuMaterial; media?: AnkiMediaAsset[] };

async function mapStaticArchive(decoded: Decoded, fileName: string, sha256: string): Promise<ApkgImport> {
	const { rows, files, format } = decoded;
	const cards = rows.cards;
	const notes = rows.notes;
	if (!cards || !notes || !rows.revlog || !rows.col?.[0]) throw new ApkgMaterialError('APKG_INVALID');
	const archiveNames = Object.keys(files).filter(name => name !== 'meta' && name !== 'media' && !(name === 'collection.anki2' && format !== 'anki2'));
	if (!cards.length || cards.length > 1000 || notes.length > cards.length || rows.revlog.length
		|| archiveNames.length > 2 || archiveNames.some(name => !/^(?:0|[1-9][0-9]{0,9})$/.test(name) || files[name].length > MAX_ANKI_MEDIA_BYTES)
		|| (!archiveNames.length && files.media && (format === '21b' ? files.media.length !== 0 : new TextDecoder().decode(files.media).trim() !== '{}'))
		|| cards.some(card => card.did !== cards[0].did || (card.flags !== undefined && card.flags !== 0))) {
		throw new ApkgMaterialError('APKG_UNSUPPORTED');
	}
	const ids = new Set(cards.map(card => String(positiveId(card.id))));
	const noteIds = new Set(notes.map(note => positiveId(note.id)));
	const referenced = new Set(cards.map(card => positiveId(card.nid)));
	if (ids.size !== cards.length || noteIds.size !== notes.length || referenced.size !== notes.length
		|| [...referenced].some(id => !noteIds.has(id))) throw new ApkgMaterialError('APKG_INVALID');
	const byReaderId = new Map<string, AnkiMediaAsset>();
	const assets = archiveNames.length ? byReaderId : undefined;
	for (const note of notes) {
		if (typeof note.flds !== 'string') throw new ApkgMaterialError('APKG_INVALID');
		for (const field of note.flds.split('\x1f')) staticHtml(field, assets, true);
	}
	// The reader uses an isolated, non-executing DOM. Raw provenance never renders.
	const result = await convertAnkiArchive(decoded);
	const [deck] = result.decks;
	if (result.decks.length !== 1 || deck.id !== String(cards[0].did) || deck.cards.length !== cards.length
		|| result.media.length !== archiveNames.length || result.stats.reviewCount || result.stats.skippedReviewCount || result.diagnostics.length
		|| deck.cards.some(card => !ids.delete(card.source.cardId) || card.reviews.length)) {
		throw new ApkgMaterialError('APKG_UNSUPPORTED');
	}
	try {
		// Keep the existing plain study/backup representation for stock Basic text.
		return { material: mapPlainBasicArchive(decoded, fileName, sha256) };
	} catch (error) {
		if (!(error instanceof ApkgMaterialError) || error.code !== 'APKG_UNSUPPORTED') throw error;
	}
	for (const media of result.media) {
		const asset = await normalizeAnkiAsset(media);
		if (!asset || [...byReaderId.values()].some(other => other.mimeType === asset.mimeType)) throw new ApkgMaterialError('APKG_UNSUPPORTED');
		byReaderId.set(media.id, asset);
	}
	const id = `apkg:${sha256}`;
	const time = new Date().toISOString();
	const questions = deck.cards.map((card, sourceOrder) => {
		staticHtml(card.source.qfmt, assets, true);
		staticHtml(card.source.afmt, assets, true);
		const prompt = staticHtml(card.frontHtml, assets);
		const answer = staticHtml(card.backHtml, assets);
		if (!prompt.text || !answer.text || card.acceptedAnswer !== undefined) throw new ApkgMaterialError('APKG_UNSUPPORTED');
		const sourceKey = `anki-card:${card.source.cardId}`;
		const questionId = `${id}:${sourceKey}`;
		return {
			id: questionId, deckId: id, sourceKey, sourceOrder, kind: 'flashcard',
			enabled: true, enabledKey: 1, createdAt: time, updatedAt: time,
			payload: {
				id: questionId, deckId: id, sourceKey, kind: 'flashcard', categoryPath: [],
				prompt: { format: 'plain', value: prompt.text }, answer: { format: 'plain', value: answer.text },
				ankiTemplate: {
					frontHtml: prompt.html, backHtml: answer.html,
					css: card.rendering.mode === 'template' ? card.rendering.css : '',
					source: card.source, tags: card.tags, noteType: card.noteType,
				},
			},
		};
	});
	const parsed = v.safeParse(materialSchema, {
		deck: {
			id, name: deck.name, studyMode: 'flashcard', sourceType: 'anki-apkg', sourceFileName: fileName,
			sourceHash: sha256, importedAt: time, updatedAt: time,
			questionCount: questions.length, enabledQuestionCount: questions.length,
		},
		questions,
	});
	const media = [...byReaderId.values()];
	if (!parsed.success || !validateAnkiMediaReferences(media, parsed.output.questions)) throw new ApkgMaterialError('APKG_UNSUPPORTED');
	return { material: parsed.output, ...(media.length ? { media } : {}) };
}

/** Convert a bounded, static, single-deck export without migrating review state. */
export async function readApkgImport(bytes: Uint8Array, fileName: string, sha256: string): Promise<ApkgImport> {
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
	return mapStaticArchive(decoded, fileName, sha256);
}
