/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
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

/** One sample of synthetic PCM16, mono, 8 kHz. No user material or decoder dependency. */
export function mediaBackupFixture(): BackupPayload {
	const data = Buffer.from('524946462600000057415645666d74201000000001000100401f0000803e00000200100064617461020000000000', 'hex');
	const id = createHash('sha256').update(data).digest('hex');
	const payload = backupFixture();
	payload.media = [{ id, mimeType: 'audio/wav', data: data.toString('base64') }];
	payload.material.deck.sourceType = 'anki-apkg';
	payload.material.questions[0].payload.ankiTemplate = {
		frontHtml: '<div>Question</div>',
		backHtml: `<div>Answer</div><audio controls="" preload="none" src="fukushu-media:${id}"></audio>`,
		css: '',
		source: { noteId: '1', cardId: '2', notetypeId: '3', ordinal: 0, qfmt: '{{Front}}', afmt: '{{Back}}', css: '' },
		noteType: 'Basic',
	};
	payload.versions[0].data = structuredClone(payload.material.questions[0]);
	return payload;
}
