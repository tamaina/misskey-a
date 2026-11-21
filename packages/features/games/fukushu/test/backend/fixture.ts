/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { FukushuMaterial } from '../../shared/material.schema.js';

export function material(id = 'deck-original', card = 'card-original'): FukushuMaterial {
	const time = '2026-11-16T00:00:00.000Z';
	return {
		deck: { id, name: '教材', studyMode: 'flashcard', sourceType: 'anki-text', sourceHash: 'original-hash', importedAt: time, updatedAt: time, questionCount: 1, enabledQuestionCount: 1 },
		questions: [{ id: card, deckId: id, sourceKey: 'note:original:0', sourceOrder: 7, kind: 'flashcard', enabled: true, enabledKey: 1, createdAt: time, updatedAt: time, payload: {
			id: card, deckId: id, sourceKey: 'note:original:0', kind: 'flashcard', categoryPath: ['元の分類'], prompt: { format: 'plain', value: '表' }, answer: { format: 'plain', value: '裏' },
		} }],
	};
}
