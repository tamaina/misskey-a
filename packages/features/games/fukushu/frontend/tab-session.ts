/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { ref, shallowRef } from 'vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { studyRatingSchema, studyRequestIdSchema } from '../shared/study.schema.js';
import type { TodayQueue } from '../shared/today.schema.js';

const count = v.pipe(v.number(), v.safeInteger(), v.minValue(0));
const cardSchema = v.object({
	id: v.string(), deck: v.string(), revision: count,
	version: v.nullable(count), sourceUpdated: v.optional(v.string()), flash: v.optional(v.boolean()),
});
const answerSchema = v.object({
	requestId: studyRequestIdSchema, questionId: v.string(), expectedRevision: count,
	rating: studyRatingSchema, correct: v.boolean(), answers: v.array(v.string()), durationMs: count,
});
const planSchema = v.object({
	run: v.string(), owner: v.string(), scope: v.picklist(['today', 'source', 'native']),
	deck: v.nullable(v.string()), practice: v.boolean(), cards: v.array(cardSchema),
});
const progressSchema = v.object({
	run: v.string(), answered: count, correct: count, state: v.picklist(['active', 'paused', 'stale']),
	pending: v.nullable(answerSchema),
});
type Plan = v.InferOutput<typeof planSchema>;
export type SessionCard = v.InferOutput<typeof cardSchema>;
export type SessionAnswer = v.InferOutput<typeof answerSchema>;
export type SessionProgress = v.InferOutput<typeof progressSchema>;
type Entry = TodayQueue['items'][number];

export function sessionCard(entry: Entry): SessionCard {
	return entry.origin === 'native'
		? { id: entry.questionId, deck: entry.deckId, version: entry.version, revision: entry.revision }
		: { id: entry.question.id, deck: entry.question.deckId, version: null, revision: entry.revision, sourceUpdated: entry.question.updatedAt, flash: entry.flash };
}

export function remainingEntries(cards: SessionCard[], available: Entry[]): Entry[] | undefined {
	const current = new Map(available.map(entry => [entry.origin === 'native' ? entry.questionId : entry.question.id, entry]));
	const remaining: Entry[] = [];
	for (const card of cards) {
		const entry = current.get(card.id);
		if (!entry) return;
		const live = sessionCard(entry);
		if (live.deck !== card.deck || live.version !== card.version || live.revision !== card.revision || live.sourceUpdated !== card.sourceUpdated || live.flash !== card.flash) return;
		remaining.push(entry);
	}
	return remaining;
}

export function rejectedReview(cause: unknown) {
	const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : null;
	return typeof code === 'string' && ['STUDY_CONFLICT', 'STUDY_UNAVAILABLE', 'NO_SUCH_MATERIAL', 'STUDY_LIMIT', 'CARD_HISTORY_LIMIT', 'BACKUP_TOO_LARGE', 'INVALID_PARAM'].includes(code);
}

export async function sendSessionAnswer(card: SessionCard, answer: SessionAnswer, practice: boolean) {
	const signal = AbortSignal.timeout(30_000);
	if (card.version === null) return misskeyApi('fukushu/upstream/review', answer, undefined, signal);
	return misskeyApi('fukushu/study/review', {
		id: card.deck, questionId: card.id, questionVersion: card.version, expectedStateRevision: answer.expectedRevision,
		requestId: answer.requestId, rating: answer.rating, durationMs: Math.min(86400000, answer.durationMs),
		...(practice ? { practiceAhead: true } : {}),
	}, undefined, signal);
}

// The queue identities are written once. Only the small progress record is
// replaced for each answer, first with the exact request, then its confirmation.
export function useTabSession(owner: string | undefined) {
	const plan = shallowRef<Plan>();
	const progress = shallowRef<SessionProgress>();
	const unavailable = ref(false);
	const key = 'fukushu:study:v1:' + owner;

	function clearStorage() {
		if (!owner) return;
		try {
			sessionStorage.removeItem(key);
			sessionStorage.removeItem(key + ':plan');
		} catch { unavailable.value = true; }
	}

	if (owner) {
		try {
			const raw = sessionStorage.getItem(key);
			if (raw) {
				const saved = v.parse(progressSchema, JSON.parse(raw));
				const queue = v.parse(planSchema, JSON.parse(sessionStorage.getItem(key + ':plan') ?? 'null'));
				const current = queue.cards[saved.answered];
				if (queue.owner === owner && queue.run === saved.run && queue.cards.length > 0 && saved.answered <= queue.cards.length &&
					saved.correct <= saved.answered && (queue.scope === 'today' ? queue.deck === null : queue.cards.every(c => c.deck === queue.deck)) &&
					(!saved.pending || (current && saved.pending.questionId === current.id && saved.pending.expectedRevision === current.revision))) {
					plan.value = queue; progress.value = saved;
				} else clearStorage();
			}
		} catch { clearStorage(); }
	}

	function write(next: SessionProgress) {
		progress.value = next;
		if (!owner || unavailable.value) return;
		try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { unavailable.value = true; clearStorage(); }
	}

	function begin(scope: Plan['scope'], deck: string | null, practice: boolean, cards: SessionCard[]) {
		const run = crypto.randomUUID();
		plan.value = { run, owner: owner ?? '', scope, deck, practice, cards };
		if (owner) {
			unavailable.value = false;
			try { sessionStorage.setItem(key + ':plan', JSON.stringify(plan.value)); } catch { unavailable.value = true; clearStorage(); }
		}
		write({ run, answered: 0, correct: 0, state: 'active', pending: null });
	}

	function prepare(answer: SessionAnswer) {
		const p = progress.value;
		if (p) write({ ...p, pending: answer });
	}

	function confirm(answer: SessionAnswer) {
		const p = progress.value;
		if (p?.pending?.requestId === answer.requestId) write({ ...p, pending: null, answered: p.answered + 1, correct: p.correct + Number(p.pending.correct) });
	}

	function state(value: SessionProgress['state']) {
		const p = progress.value;
		if (p) write({ ...p, state: value, pending: value === 'stale' ? null : p.pending });
	}

	function discard() {
		clearStorage();
		plan.value = undefined; progress.value = undefined;
	}

	return { plan, progress, unavailable, begin, prepare, confirm, state, discard };
}
