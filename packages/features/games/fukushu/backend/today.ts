/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { In } from 'typeorm';
import * as v from 'valibot';
import { upstreamStoreSchemas as schemas } from '../shared/upstream-records.schema.js';
import { initialLearningSettings } from './learning-settings.js';
import { MiFukushuUpstreamRecord } from './models/FukushuUpstreamRecord.js';
import type { EntityManager } from 'typeorm';
import type { TodayQueue } from '../shared/today.schema.js';

type Item = TodayQueue['items'][number];
type Candidate = { id: string; due: number | null; item?: Item };

// Both families of writers hold the caller's owner lock. Native question bodies
// are loaded at their selected version when shown, including for unlimited reviews.
export async function todayQueue(manager: EntityManager, ownerId: string, now: Date, day: { start: string; end: string; practiceAhead?: true }): Promise<TodayQueue> {
	const rows = await manager.getRepository(MiFukushuUpstreamRecord).find({
		where: { ownerId, store: In(['decks', 'questions', 'studyStates', 'settings']) },
		select: { store: true, key: true, data: true, revision: true },
	});
	const setting = rows.find(r => r.store === 'settings');
	const settings = setting ? v.parse(schemas.settings, JSON.parse(setting.data)) : { ...await initialLearningSettings(manager, ownerId), shuffleChoices: true, showImmediateFeedback: true };
	const decks = new Map(rows.filter(r => r.store === 'decks').map(r => {
		const d = v.parse(schemas.decks, JSON.parse(r.data));
		return [d.id, d] as const;
	}));
	const questions = new Map(rows.filter(r => r.store === 'questions').map(r => [r.key, v.parse(schemas.questions, JSON.parse(r.data))]));
	const deckKeys = rows.filter(r => r.store === 'decks').map(r => r.key);
	const seen: { key: string }[] = !day.practiceAhead && deckKeys.length ? await manager.query(`SELECT DISTINCT "historyQuestion" AS key FROM fukushu_upstream_record
		WHERE "ownerId" = $1 AND store = 'reviewLogs' AND "historyDeck" = ANY($2::text[])
		AND "historyOrder" > $3 AND "historyOrder" <= $4`, [ownerId, deckKeys, -Date.parse(day.end), -Date.parse(day.start)]) : [];
	const studied = new Set(seen.map(row => row.key));
	const candidates: Candidate[] = [];
	for (const row of rows) {
		if (row.store !== 'studyStates') continue;
		const state = v.parse(schemas.studyStates, JSON.parse(row.data));
		const question = questions.get(row.key);
		const deck = decks.get(state.deckId);
		if (state.suspended) continue;
		const due = state.card.reps ? Date.parse(state.card.due) : null;
		if (!day.practiceAhead && (due === null ? studied.has(row.key) : due > now.getTime())) continue;
		if (!question?.enabled || question.kind === 'unsupported' || !deck) {
			// Upstream selects fresh states before looking up their questions.
			if (due === null) candidates.push({ id: state.questionId, due });
			continue;
		}
		candidates.push({ id: question.id, due, item: { origin: 'source', deckName: deck.name, flash: deck.studyMode === 'flashcard', revision: row.revision, question } });
	}
	type Native = { questionId: string; deckId: string; deckName: string; version: number; revision: number; due: string | null };
	const native: Native[] = await manager.query(`SELECT q.id AS "questionId", q."deckId", d.data->>'name' AS "deckName", q."currentVersion" AS version,
		COALESCE(s.revision, 0) AS revision, CASE WHEN (s.data->'card'->>'reps')::integer > 0 THEN s.data->'card'->>'due' END AS due
		FROM fukushu_question q JOIN fukushu_deck d ON d."ownerId" = q."ownerId" AND d.id = q."deckId"
		LEFT JOIN fukushu_study_state s ON s."ownerId" = q."ownerId" AND s."questionId" = q.id
		LEFT JOIN (SELECT DISTINCT "deckId", "questionId" FROM fukushu_review_log
			WHERE NOT $5 AND "ownerId" = $1 AND "deckId" = ANY(ARRAY(SELECT id FROM fukushu_deck WHERE "ownerId" = $1 AND "archivedAt" IS NULL))
				AND "reviewedAt" >= $3 AND "reviewedAt" < $4) seen ON seen."deckId" = q."deckId" AND seen."questionId" = q.id
		WHERE q."ownerId" = $1 AND d."archivedAt" IS NULL AND (q.data->>'enabled')::boolean
		AND NOT COALESCE((s.data->>'suspended')::boolean, false)
		AND COALESCE(s.data->>'updatedAt', q.data->>'createdAt')::timestamptz <= $2
		AND (s.data->'card'->>'lastReview' IS NULL OR (s.data->'card'->>'lastReview')::timestamptz <= $2)
		AND ($5 OR CASE WHEN COALESCE((s.data->'card'->>'reps')::integer, 0) > 0 THEN (s.data->'card'->>'due')::timestamptz <= $2
			ELSE seen."questionId" IS NULL END)`, [ownerId, now, day.start, day.end, day.practiceAhead === true]);
	for (const { due, ...item } of native) candidates.push({ id: item.questionId, due: due === null ? null : Date.parse(due), item: { origin: 'native', ...item } });

	const byId = (a: Candidate, b: Candidate) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
	const reviews = candidates.filter(c => c.due !== null).sort((a, b) => a.due! - b.due! || byId(a, b));
	const fresh = candidates.filter(c => c.due === null).sort(byId);
	const selectedReviews = day.practiceAhead ? reviews : reviews.slice(0, settings.maxReviewsPerDay ?? reviews.length);
	const selectedFresh = day.practiceAhead ? fresh : fresh.slice(0, settings.newQuestionsPerDay);
	return { shuffle: settings.shuffleChoices, immediate: settings.showImmediateFeedback,
		items: [...selectedReviews, ...selectedFresh].flatMap(c => c.item ?? []) };
}
