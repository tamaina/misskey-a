/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { MaterialError } from './store.js';
import { emptyStoredCard, review, schedulerVersion, desiredRetention, enableFuzz } from './fsrs.js';
import { MiFukushuDeck } from './models/FukushuDeck.js';
import { MiFukushuQuestion } from './models/FukushuQuestion.js';
import { MiFukushuQuestionVersion } from './models/FukushuQuestionVersion.js';
import { MiFukushuStudyState } from './models/FukushuStudyState.js';
import { MiFukushuReviewLog } from './models/FukushuReviewLog.js';
import { questionSchema, sourceIdSchema } from '../shared/material.schema.js';
import { studyHistoryPageSchema, studyReviewInputSchema, studyStateRecordSchema, reviewLogRecordSchema, storedFsrsCardSchema } from '../shared/study.schema.js';
import type { ReviewLogRecord, StudyHistoryItem, StudyQueue, StudyReviewInput, StudyReviewResult, StudyStateRecord } from '../shared/study.schema.js';
import type { DataSource, EntityManager } from 'typeorm';

export class StudyError extends Error {
	constructor(public readonly code: 'STUDY_CONFLICT' | 'STUDY_LIMIT' | 'STUDY_UNAVAILABLE') {
		super(code);
	}
}

export class FukushuStudyStore {
	constructor(private readonly db: DataSource, private readonly clock: () => Date = () => new Date()) {}

	async queue(ownerId: string, id: string): Promise<StudyQueue> {
		this.validateId(id);
		return this.db.transaction('REPEATABLE READ', async manager => {
			const deck = await this.ownedDeck(manager, ownerId, id);
			if (deck.archivedAt) throw new StudyError('STUDY_UNAVAILABLE');
			const now = this.clock();
			const questions = await manager.getRepository(MiFukushuQuestion).find({ where: { ownerId, deckId: id }, order: { id: 'ASC' } });
			const states = new Map((await manager.getRepository(MiFukushuStudyState).find({ where: { ownerId, deckId: id } })).map(state => [state.questionId, state]));
			const due: StudyQueue['items'] = [];
			const fresh: StudyQueue['items'] = [];
			for (const question of questions) {
				const saved = states.get(question.id);
				const state = saved?.data ?? this.emptyState(question);
				if (!question.data.enabled || state.suspended || new Date(state.updatedAt).getTime() > now.getTime()) continue;
				if (state.card.lastReview && new Date(state.card.lastReview).getTime() > now.getTime()) continue;
				const isNew = state.card.reps === 0;
				const item = { question: question.data, questionVersion: question.currentVersion, stateRevision: saved?.revision ?? 0, isNew, due: state.card.due };
				if (isNew) fresh.push(item);
				else if (new Date(state.card.due).getTime() <= now.getTime()) due.push(item);
			}
			// Stable question-ID order for new cards; due cards sort by time then ID.
			due.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime() || this.compareId(a.question.id, b.question.id));
			fresh.sort((a, b) => this.compareId(a.question.id, b.question.id));
			return { deckId: id, serverTime: now.toISOString(), items: [...due, ...fresh.slice(0, 20)] };
		});
	}

	async review(ownerId: string, input: StudyReviewInput): Promise<StudyReviewResult> {
		const parsed = v.safeParse(studyReviewInputSchema, input);
		if (!parsed.success) throw new MaterialError('INVALID_MATERIAL');
		const request = parsed.output;
		return this.db.transaction(async manager => {
			await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`fukushu:create:${ownerId}`]);
			const logs = manager.getRepository(MiFukushuReviewLog);
			const existing = await logs.findOneBy({ ownerId, id: request.requestId });
			if (existing) {
				if (!this.sameRequest(existing.request, request)) throw new StudyError('STUDY_CONFLICT');
				// A committed retry is independent of current version, availability and quota.
				return this.result(existing);
			}
			const deck = await this.ownedDeck(manager, ownerId, request.id);
			const question = await manager.getRepository(MiFukushuQuestion).findOneBy({ ownerId, deckId: request.id, id: request.questionId });
			if (!question) throw new MaterialError('NO_SUCH_MATERIAL');
			const states = manager.getRepository(MiFukushuStudyState);
			const saved = await states.findOneBy({ ownerId, questionId: question.id });
			const state = saved?.data ?? this.emptyState(question);
			if (deck.archivedAt || !question.data.enabled || state.suspended) throw new StudyError('STUDY_UNAVAILABLE');
			if (question.currentVersion !== request.questionVersion || (saved?.revision ?? 0) !== request.expectedStateRevision
				|| saved?.revision === 2_147_483_647) throw new StudyError('STUDY_CONFLICT');
			const now = this.clock();
			if (new Date(state.updatedAt).getTime() > now.getTime()
				|| (state.card.lastReview && new Date(state.card.lastReview).getTime() > now.getTime())) throw new StudyError('STUDY_UNAVAILABLE');
			if (state.card.reps > 0 && new Date(state.card.due).getTime() > now.getTime()) throw new StudyError('STUDY_UNAVAILABLE');
			const before = state.card;
			const scheduled = review(before, now, request.rating, desiredRetention, enableFuzz);
			const nextState: StudyStateRecord = { ...state, card: scheduled.card, updatedAt: now.toISOString() };
			const record: ReviewLogRecord = {
				id: request.requestId, questionId: question.id, deckId: request.id,
				reviewedAt: now.toISOString(), rating: request.rating, correct: request.rating !== 'again',
				responseText: '', durationMs: request.durationMs, fsrsLog: scheduled.log,
			};
			// Validate server-generated state before any baseline or history write.
			v.parse(studyStateRecordSchema, nextState);
			v.parse(reviewLogRecordSchema, record);
			v.parse(storedFsrsCardSchema, before);
			const byteSize = [record, before, scheduled.card, request].reduce((sum, value) => sum + Buffer.byteLength(JSON.stringify(value), 'utf8'), 0);
			await this.captureVersion(manager, ownerId, question, now);
			const stateRevision = (saved?.revision ?? 0) + 1;
			if (saved) await states.update({ ownerId, questionId: question.id }, { data: nextState, revision: stateRevision });
			else await states.insert({ ownerId, questionId: question.id, deckId: request.id, data: nextState, revision: stateRevision });
			const row = {
				ownerId, id: request.requestId, questionId: question.id, deckId: request.id,
				questionVersion: request.questionVersion, stateRevision, reviewedAt: now,
				data: record, before, after: scheduled.card, request,
				schedulerVersion, desiredRetention, enableFuzz, byteSize,
			};
			await logs.insert(row);
			return this.result(row);
		});
	}

	async history(ownerId: string, id: string, options: { beforeId?: string; limit?: number } = {}): Promise<StudyHistoryItem[]> {
		this.validateId(id);
		const parsed = v.safeParse(studyHistoryPageSchema, options);
		if (!parsed.success) throw new MaterialError('INVALID_MATERIAL');
		return this.db.transaction('REPEATABLE READ', async manager => {
			await this.ownedDeck(manager, ownerId, id);
			const logs = manager.getRepository(MiFukushuReviewLog);
			const query = logs.createQueryBuilder('review').where('review.ownerId = :ownerId AND review.deckId = :id', { ownerId, id });
			if (parsed.output.beforeId) {
				const cursor = await logs.findOneBy({ ownerId, deckId: id, id: parsed.output.beforeId });
				if (!cursor) throw new MaterialError('NO_SUCH_MATERIAL');
				query.andWhere('(review."reviewedAt", review.id) < (:time, CAST(:cursorId AS uuid))', { time: cursor.reviewedAt, cursorId: cursor.id });
			}
			const rows = await query.orderBy('review.reviewedAt', 'DESC').addOrderBy('review.id', 'DESC').take(parsed.output.limit).getMany();
			const result: StudyHistoryItem[] = [];
			for (const row of rows) {
				const version = await manager.getRepository(MiFukushuQuestionVersion).findOneBy({ ownerId, questionId: row.questionId, version: row.questionVersion });
				if (!version) throw new MaterialError('NO_SUCH_MATERIAL');
				result.push({ ...this.result(row), question: version.data });
			}
			return result;
		});
	}

	private async captureVersion(manager: EntityManager, ownerId: string, question: MiFukushuQuestion, now: Date) {
		const versions = manager.getRepository(MiFukushuQuestionVersion);
		if (await versions.existsBy({ ownerId, questionId: question.id, version: question.currentVersion })) return;
		if (question.currentVersion !== 1) throw new StudyError('STUDY_CONFLICT');
		v.parse(questionSchema, question.data);
		const byteSize = Buffer.byteLength(JSON.stringify(question.data), 'utf8');
		const [{ bytes }] = await manager.query('SELECT COALESCE(SUM("byteSize"), 0)::text AS bytes FROM "fukushu_question_version" WHERE "ownerId" = $1', [ownerId]) as { bytes: string }[];
		if (Number(bytes) + byteSize > 32 * 1024 * 1024) throw new MaterialError('CARD_HISTORY_LIMIT');
		await versions.insert({ ownerId, questionId: question.id, version: 1, data: question.data, recordedAt: now, kind: 'baseline', byteSize });
	}

	private emptyState(question: MiFukushuQuestion): StudyStateRecord {
		return { questionId: question.id, deckId: question.deckId, card: emptyStoredCard(new Date(question.data.createdAt)), suspended: false, suspendedKey: 0, updatedAt: question.data.createdAt };
	}

	private result(row: Pick<MiFukushuReviewLog, 'id' | 'questionVersion' | 'stateRevision' | 'data' | 'after'>): StudyReviewResult {
		return { id: row.id, questionVersion: row.questionVersion, stateRevision: row.stateRevision, record: row.data, card: row.after };
	}

	private sameRequest(a: StudyReviewInput, b: StudyReviewInput) {
		return a.id === b.id && a.questionId === b.questionId && a.questionVersion === b.questionVersion
			&& a.expectedStateRevision === b.expectedStateRevision && a.requestId === b.requestId
			&& a.rating === b.rating && a.durationMs === b.durationMs;
	}

	private validateId(id: string) {
		if (!v.safeParse(sourceIdSchema, id).success) throw new MaterialError('INVALID_MATERIAL');
	}

	private async ownedDeck(manager: EntityManager, ownerId: string, id: string) {
		const deck = await manager.getRepository(MiFukushuDeck).findOneBy({ ownerId, id });
		if (!deck) throw new MaterialError('NO_SUCH_MATERIAL');
		return deck;
	}

	private compareId(a: string, b: string) { return a < b ? -1 : a > b ? 1 : 0; }
}
