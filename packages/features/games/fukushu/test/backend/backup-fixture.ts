/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { emptyStoredCard, review } from '../../backend/fsrs.js';
import { material } from './fixture.js';
import type { BackupPayload } from '../../shared/backup.schema.js';

export function backupFixture(): BackupPayload {
	const source = material();
	const question = source.questions[0];
	const now = new Date('2026-11-17T00:00:00.000Z');
	const before = emptyStoredCard(new Date(question.createdAt));
	const saved = review(before, now, 'good');
	const id = '11111111-1111-4111-8111-111111111111';
	return {
		exportedAt: now.toISOString(), material: source, deckState: { revision: 1, archivedAt: null },
		questions: [{ questionId: question.id, position: 0, currentVersion: 1 }],
		versions: [{ questionId: question.id, version: 1, kind: 'baseline', recordedAt: now.toISOString(), data: structuredClone(question) }],
		states: [{ questionId: question.id, revision: 1, data: { questionId: question.id, deckId: source.deck.id, card: structuredClone(saved.card), updatedAt: now.toISOString(), suspended: false, suspendedKey: 0 } }],
		reviews: [{
			id, questionId: question.id, questionVersion: 1, stateRevision: 1, reviewedAt: now.toISOString(),
			data: { id, questionId: question.id, deckId: source.deck.id, reviewedAt: now.toISOString(), rating: 'good', correct: true, responseText: '', durationMs: 123, fsrsLog: saved.log },
			before, after: saved.card,
			request: { id: source.deck.id, questionId: question.id, questionVersion: 1, expectedStateRevision: 0, requestId: id, rating: 'good', durationMs: 123 },
			schedulerVersion: 'ts-fsrs@5.4.1', desiredRetention: 0.9, enableFuzz: false,
		}],
	};
}
