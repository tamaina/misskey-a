/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, expect, test, vi } from 'vitest';
import { remainingEntries, sessionCard, useTabSession } from './tab-session.js';
import type { TodayQueue } from '../shared/today.schema.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); vi.restoreAllMocks(); });
const native = { origin: 'native', questionId: 'native', deckId: 'deck', deckName: 'Private name', revision: 0, version: 2 } as const;
const answer = { requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', questionId: native.questionId, expectedRevision: 0, rating: 'hard' as const, correct: false, answers: [], durationMs: 12 };
test('reloads only matching owner/run, retains one pending request and counts its confirmation once', () => {
	const alice = useTabSession('alice');
	alice.begin('native', 'deck', false, [sessionCard(native)]);
	alice.prepare(answer);
	expect(useTabSession('bob').plan.value).toBeUndefined();
	const resumed = useTabSession('alice');
	expect(resumed.progress.value?.pending).toEqual(answer);
	resumed.confirm(answer); resumed.confirm(answer);
	expect(useTabSession('alice').progress.value).toMatchObject({ pending: null, correct: 0, answered: 1 });
	const key = 'fukushu:study:v1:alice';
	expect(sessionStorage.getItem(key + ':plan')).not.toContain('Private name');
	expect(sessionStorage.getItem(key)).not.toContain(answer.requestId);
	sessionStorage.setItem('fukushu:study:v1:bob', sessionStorage.getItem(key)!);
	sessionStorage.setItem('fukushu:study:v1:bob:plan', sessionStorage.getItem(key + ':plan')!);
	expect(useTabSession('bob').plan.value).toBeUndefined();
	sessionStorage.setItem(key, sessionStorage.getItem(key)!.replace(resumed.plan.value!.run, 'other-run'));
	expect(useTabSession('alice').plan.value).toBeUndefined();
});
test('maps remaining cards in saved order and rejects removed cards, versions, decks or review revisions', () => {
	const other = { ...native, questionId: 'other' };
	const refs = [native, other].map(sessionCard);
	expect(remainingEntries(refs, [other, native])).toEqual([native, other]);
	for (const items of [[other], [other, { ...native, version: 3 }], [other, { ...native, revision: 1 }], [other, { ...native, deckId: 'moved' }]] satisfies TodayQueue['items'][]) {
		expect(remainingEntries(refs, items)).toBeUndefined();
	}
});
test('storage denial preserves in-memory study and exposes the reload limitation', () => {
	const journal = useTabSession('alice');
	vi.stubGlobal('sessionStorage', { getItem: () => null, removeItem: () => {}, setItem: () => { throw new Error('quota'); } });
	journal.begin('native', 'deck', false, [sessionCard(native)]);
	journal.prepare(answer); journal.confirm(answer);
	expect(journal.unavailable.value).toBe(true);
	expect(journal.progress.value?.answered).toBe(1);
	expect(useTabSession('alice').plan.value).toBeUndefined();
});
