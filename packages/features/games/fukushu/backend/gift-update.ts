/*
 * SPDX-FileCopyrightText: 2026 fukushu contributors
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 * Adapted from tamaina/fukushu 0efee271. See FUKUSHU-LICENSE.txt.
 */
import { randomUUID } from 'node:crypto';
import { emptyStoredCard } from './fsrs.js';
import { previewGift } from './gift-preview.js';
import { BackupError } from './backup-codec.js';
import type { LearningSettings, UpstreamRecords } from '../shared/upstream-records.schema.js';
import type { UpstreamFrame } from '../shared/upstream-reader.js';

type QuizQuestion = UpstreamRecords['questions'][number]['payload'];

function answerSignature(question: QuizQuestion): string {
	if (question.kind === 'single-choice' || question.kind === 'multiple-choice') {
		return JSON.stringify(question.choices.map((choice) => [choice.content.value, choice.weight]));
	}
	if (question.kind === 'true-false') return String(question.correctAnswer);
	if (question.kind === 'short-answer') {
		return JSON.stringify(question.answers.map((answer) => [answer.value, answer.weight]));
	}
	if (question.kind === 'numerical') return JSON.stringify(question.answers);
	if (question.kind === 'matching') {
		return JSON.stringify(question.pairs.map((pair) => [pair.left.value, pair.right.value]));
	}
	if (question.kind === 'essay' || question.kind === 'description') return question.kind;
	if (question.kind === 'flashcard') return JSON.stringify([question.answer, question.typeAnswer, question.acceptedAnswer]);
	return question.sourceKind;
}

function semanticSignature(question: QuizQuestion): string {
	return JSON.stringify({
		kind: question.kind,
		name: question.name,
		prompt: question.prompt,
		categoryPath: question.categoryPath,
		explanation: question.explanation,
		shuffleChoices: question.shuffleChoices,
		answers: answerSignature(question),
	});
}

function promptSimilarity(left: string, right: string): number {
	const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
	const grams = (value: string): Set<string> => {
		const normalized = normalize(value);
		if (normalized.length < 2) return new Set([normalized]);
		return new Set(
			[...normalized.slice(0, -1)].map((character, index) => character + normalized[index + 1]),
		);
	};
	const a = grams(left);
	const b = grams(right);
	if (!a.size && !b.size) return 1;
	let intersection = 0;
	for (const value of a) if (b.has(value)) intersection += 1;
	return intersection / (a.size + b.size - intersection);
}

function parseGiftImport(source: string, deckId: string) {
	const parsed = previewGift(source, deckId);
	if (!parsed.questions.length || parsed.diagnostics.some(d => d.severity === 'error')) throw new BackupError('INVALID_BACKUP');
	if (parsed.questions.length > 1000) throw new BackupError('UPSTREAM_INSPECTION_LIMIT');
	return parsed;
}

// Matches saveNewDeck and defaultSettings in the pinned Fukushu app.
export function planNewGift(deckId: string, name: string, fileName: string, source: string, now: Date, initialSettings?: LearningSettings) {
	const { questions, sourceHash } = parseGiftImport(source, deckId);
	const time = now.toISOString();
	const common = { sourceType: 'gift', sourceFileName: fileName, sourceHash, sourceText: source, importedAt: time, updatedAt: time };
	const sourceId = randomUUID();
	const summary = { added: questions.length, changed: 0, disabled: 0, reset: 0 };
	const writes: UpstreamFrame[] = [
		{ store: 'importSources', value: { ...common, id: sourceId } },
		{ store: 'decks', value: { ...common, id: deckId, sourceId, name, sourceDeckKey: name, studyMode: 'quiz', questionCount: questions.length, enabledQuestionCount: questions.length } },
		{ store: 'imports', value: { id: randomUUID(), deckId, importedAt: time, sourceHash, added: questions.length, changed: 0, disabled: 0 } },
	];
	if (initialSettings) writes.unshift({ store: 'settings', value: { id: 'global', ...initialSettings, checkpointInterval: 20, shuffleChoices: true, showImmediateFeedback: true, locale: 'ja', theme: 'system' } });
	for (const [sourceOrder, payload] of questions.entries()) {
		writes.push({ store: 'questions', value: { id: payload.id, deckId, sourceKey: payload.sourceKey, sourceOrder, kind: payload.kind, payload, enabled: true, enabledKey: 1, createdAt: time, updatedAt: time } });
		writes.push({ store: 'studyStates', value: { questionId: payload.id, deckId, card: emptyStoredCard(now), suspended: false, suspendedKey: 0, updatedAt: time } });
	}
	return { writes, summary };
}

export function planGiftUpdate(records: UpstreamRecords, rawDeck: Record<string, unknown>, deckId: string, source: string, now: Date) {
	const deck = records.decks.find(row => row.id === deckId);
	if (!deck || deck.sourceType !== 'gift') throw new BackupError('INVALID_BACKUP');
	const parsed = parseGiftImport(source, deckId);
	const time = now.toISOString();
	const previous = records.questions.filter(row => row.deckId === deckId);
	const byKey = new Map(previous.map(row => [row.sourceKey, row]));
	const retained = new Set<string>();
	const occupied = new Set(records.questions.map(q => q.id));
	const states = new Map(records.studyStates.map(s => [s.questionId, s]));
	const writes: UpstreamFrame[] = [];
	let added = 0, changed = 0, disabled = 0, reset = 0;
	for (const [sourceOrder, incoming] of parsed.questions.entries()) {
		const old = byKey.get(incoming.sourceKey);
		const id = old?.id ?? incoming.id;
		if (!old && (occupied.has(id) || retained.has(id))) throw new BackupError('BACKUP_CONFLICT');
		const payload = { ...incoming, id, deckId };
		const state = old && states.get(id);
		const different = old && semanticSignature(old.payload) !== semanticSignature(payload);
		const compatible = old && (!different || (old.kind === payload.kind && answerSignature(old.payload) === answerSignature(payload) && promptSimilarity(old.payload.prompt.value, payload.prompt.value) >= 0.6));
		if (!old) added++; else if (different) changed++;
		if (old && !compatible) reset++;
		retained.add(id);
		writes.push({ store: 'questions', value: { ...old, id, deckId, sourceKey: payload.sourceKey, sourceOrder, kind: payload.kind, payload, enabled: true, enabledKey: 1, createdAt: old?.createdAt ?? time, updatedAt: time } });
		writes.push({ store: 'studyStates', value: state && compatible ? { ...state, suspended: false, suspendedKey: 0, updatedAt: time } : { questionId: id, deckId, card: emptyStoredCard(now), suspended: false, suspendedKey: 0, updatedAt: time } });
	}
	const removed = previous.filter(row => !retained.has(row.id));
	for (const [index, old] of removed.entries()) {
		if (old.enabled) disabled++;
		writes.push({ store: 'questions', value: { ...old, enabled: false, enabledKey: 0, sourceOrder: parsed.questions.length + index, updatedAt: time } });
		const state = states.get(old.id);
		if (state) writes.push({ store: 'studyStates', value: { ...state, suspended: true, suspendedKey: 1, updatedAt: time } });
	}
	writes.push({ store: 'decks', value: { ...rawDeck, sourceText: source, sourceHash: parsed.sourceHash, updatedAt: time, questionCount: retained.size + removed.length, enabledQuestionCount: retained.size } });
	writes.push({ store: 'imports', value: { id: randomUUID(), deckId, importedAt: time, sourceHash: parsed.sourceHash, added, changed, disabled } });
	return { writes, summary: { added, changed, disabled, reset } };
}
