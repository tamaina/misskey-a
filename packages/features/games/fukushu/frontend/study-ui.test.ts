/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import StudyPanel from './components/StudyPanel.vue';
import type { FukushuMaterial } from '../shared/material.schema.js';
import type { StudyHistoryItem, StudyQueue, StudyReviewInput, StudyReviewResult } from '../shared/study.schema.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({}));
vi.mock('@features/navigation/frontend/components/global/MkA.vue', () => ({ default: { props: ['to'], template: '<a :href="to"><slot /></a>' } }));

const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
const time = '2026-11-17T12:00:00.000Z';
beforeAll(async () => { await internationalization.ready; });
beforeEach(() => { vi.resetAllMocks(); });
afterEach(cleanup);

function question(id = 'card-a', typeAnswer = false): FukushuMaterial['questions'][number] {
	return {
		id, deckId: 'deck', sourceKey: `key-${id}`, sourceOrder: 0, kind: 'flashcard', enabled: true, enabledKey: 1, createdAt: time, updatedAt: time,
		payload: {
			id, deckId: 'deck', sourceKey: `key-${id}`, kind: 'flashcard', categoryPath: [], typeAnswer, acceptedAnswer: 'different accepted text',
			prompt: { format: 'plain', value: id === 'card-a' ? '<img src=x onerror=alert(1)>' : `問い ${id}` },
			answer: { format: 'plain', value: `答え ${id}` }, explanation: { format: 'plain', value: `解説 ${id}` },
		},
	};
}
function queue(typeAnswer = false): StudyQueue {
	return {
		deckId: 'deck', serverTime: time,
		items: ['card-a', 'card-b'].map(id => ({ question: question(id, typeAnswer), questionVersion: 2, stateRevision: 0, isNew: true, due: time })),
	};
}
function result(input: StudyReviewInput): StudyReviewResult {
	return {
		id: input.requestId, questionVersion: input.questionVersion, stateRevision: input.expectedStateRevision + 1,
		card: { due: '2026-11-18T12:00:00.000Z', stability: 2, difficulty: 4, elapsedDays: 0, scheduledDays: 1, reps: 1, lapses: 0, state: 2, lastReview: time },
		record: {
			id: input.requestId, questionId: input.questionId, deckId: input.id, reviewedAt: time, rating: input.rating,
			correct: input.rating !== 'again', responseText: '', durationMs: input.durationMs,
			fsrsLog: { rating: 3, state: 0, due: time, stability: 2, difficulty: 4, elapsedDays: 0, lastElapsedDays: 0, scheduledDays: 1, review: time },
		},
	};
}
function historyEntry(index: number): StudyHistoryItem {
	const input: StudyReviewInput = { id: 'deck', questionId: 'card-a', questionVersion: 1, expectedStateRevision: 0, requestId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, rating: 'good', durationMs: 1000 };
	const saved = question();
	saved.payload.prompt.value = `回答時の問題 ${index}`;
	saved.payload.answer.value = `回答時の答え ${index}`;
	saved.payload.explanation!.value = `回答時の解説 ${index}`;
	return { ...result(input), question: saved };
}
function mount(archived = false, events: Record<string, unknown> = {}) {
	return render(StudyPanel, { props: { deckId: 'deck', archived, ...events }, global: { plugins: [internationalization] } });
}
function requests() { return vi.mocked(misskeyApi).mock.calls.filter(([endpoint]) => endpoint === 'fukushu/study/review'); }
function button(name: string) { return screen.getByRole('button', { name }) as HTMLButtonElement; }
async function begin() {
	await fireEvent.click(button('復習を始める'));
	await screen.findByText('<img src=x onerror=alert(1)>');
}
function simpleApi(typeAnswer = false) {
	vi.mocked(misskeyApi).mockImplementation(async (endpoint, input) => {
		if (endpoint === 'fukushu/study/queue') return queue(typeAnswer) as never;
		if (endpoint === 'fukushu/study/review') return result(input as StudyReviewInput) as never;
		if (endpoint === 'fukushu/study/history') return [] as never;
		throw new Error('Unexpected endpoint');
	});
}

test('loads only on demand, reveals plain text without writing, and keeps a fixed Again queue', async () => {
	simpleApi();
	const { container } = mount();
	expect(misskeyApi).not.toHaveBeenCalled();
	await begin();
	expect(container.querySelector('img')).toBeNull();
	expect(screen.queryByText('答え card-a')).toBeNull();
	expect(screen.queryByRole('button', { name: 'わかった' })).toBeNull();
	await fireEvent.click(button('答えを開く'));
	expect(screen.getByText('答え card-a')).toBeTruthy();
	expect(screen.getByText('解説 card-a')).toBeTruthy();
	expect(requests()).toHaveLength(0);
	await fireEvent.click(button('もう一度'));
	await screen.findByText(/記録しました/);
	expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
	expect(container.querySelector('time')?.dateTime).toBe('2026-11-18T12:00:00.000Z');
	await fireEvent.click(button('次のカードへ'));
	expect(screen.getByText('問い card-b')).toBeTruthy();
	expect(screen.queryByText('答え card-b')).toBeNull();
	await fireEvent.click(button('答えを開く'));
	await fireEvent.click(button('わかった'));
	await screen.findByText(/記録しました/);
	await fireEvent.click(button('今回の復習を完了'));
	expect(screen.getByText('今回の復習は完了しました。')).toBeTruthy();
	expect(requests().map(([, input]) => (input as StudyReviewInput).questionId)).toEqual(['card-a', 'card-b']);
	expect(vi.mocked(misskeyApi).mock.calls.filter(([endpoint]) => endpoint.endsWith('/queue'))).toHaveLength(1);
});

test.each([['もう一度', 'again'], ['難しかった', 'hard'], ['わかった', 'good'], ['簡単', 'easy']] as const)('sends self-rating %s without a client grade or schedule', async (label, rating) => {
	simpleApi();
	mount();
	await begin();
	await fireEvent.click(button('答えを開く'));
	await fireEvent.click(button(label));
	await screen.findByText(/記録しました/);
	const input = requests()[0][1] as StudyReviewInput;
	expect(input).toEqual({ id: 'deck', questionId: 'card-a', questionVersion: 2, expectedStateRevision: 0, requestId: expect.stringMatching(/^[0-9a-f-]{36}$/), rating, durationMs: expect.any(Number) });
	expect(Number.isInteger(input.durationMs)).toBe(true);
	expect(input.durationMs).toBeGreaterThanOrEqual(0);
	expect(input.durationMs).toBeLessThanOrEqual(86_400_000);
});

test('typeAnswer gates reveal but does not grade or transmit the typed answer; IME Enter is ignored', async () => {
	simpleApi(true);
	mount();
	await begin();
	expect(button('答えを開く').disabled).toBe(true);
	const input = screen.getByLabelText('答えを入力');
	await fireEvent.update(input, '   ');
	expect(button('答えを開く').disabled).toBe(true);
	await fireEvent.update(input, 'acceptedAnswerと異なる回答');
	await fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
	expect(screen.queryByText('答え card-a')).toBeNull();
	await fireEvent.keyDown(input, { key: 'Enter' });
	expect(screen.getByText('答え card-a')).toBeTruthy();
	await fireEvent.click(button('簡単'));
	await screen.findByText(/記録しました/);
	expect(JSON.stringify(requests()[0][1])).not.toContain('acceptedAnswerと異なる回答');
	expect(requests()[0][1]).toMatchObject({ rating: 'easy' });
	await fireEvent.click(button('次のカードへ'));
	expect((screen.getByLabelText('答えを入力') as HTMLInputElement).value).toBe('');
});

test('blocks duplicate clicks and retains the exact request after an uncertain result until explicit retry', async () => {
	let reject!: (reason: unknown) => void;
	let attempt = 0;
	const payloads: StudyReviewInput[] = [];
	vi.mocked(misskeyApi).mockImplementation(async (endpoint, input) => {
		if (endpoint === 'fukushu/study/queue') return queue() as never;
		payloads.push({ ...input } as StudyReviewInput);
		if (attempt++ === 0) {
			// The production API helper appends credentials to its argument. It must
			// receive a copy, not contaminate the retained logical review request.
			(input as { i?: string }).i = 'synthetic-test-token';
			return await new Promise((_, rejectPromise) => { reject = rejectPromise; }) as never;
		}
		return result(input as StudyReviewInput) as never;
	});
	mount();
	await begin();
	await fireEvent.click(button('答えを開く'));
	await fireEvent.click(button('難しかった'));
	await fireEvent.click(button('難しかった'));
	expect(requests()).toHaveLength(1);
	expect(button('復習を終了').disabled).toBe(true);
	reject(new TypeError('Failed to fetch'));
	await screen.findByRole('alert');
	expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
	expect(screen.queryByRole('button', { name: '次のカードへ' })).toBeNull();
	expect(button('難しかった').disabled).toBe(true);
	expect(button('復習を終了').disabled).toBe(true);
	await fireEvent.click(button('同じ記録を再確認'));
	await screen.findByText(/記録しました/);
	expect(payloads).toHaveLength(2);
	expect(payloads[1]).toEqual(payloads[0]);
	expect(payloads[1]).not.toHaveProperty('i');
	await fireEvent.click(button('次のカードへ'));
	expect(screen.getByText('問い card-b')).toBeTruthy();
});

test('a definite conflict requires a fresh queue and never silently retries the old rating', async () => {
	let loads = 0;
	vi.mocked(misskeyApi).mockImplementation(async (endpoint, input) => {
		if (endpoint === 'fukushu/study/queue') {
			const value = queue();
			value.items[0].questionVersion = ++loads === 1 ? 2 : 3;
			value.items[0].stateRevision = loads === 1 ? 0 : 1;
			return value as never;
		}
		if ((input as StudyReviewInput).questionVersion === 2) throw { code: 'STUDY_CONFLICT' };
		return result(input as StudyReviewInput) as never;
	});
	mount();
	await begin();
	await fireEvent.click(button('答えを開く'));
	await fireEvent.click(button('わかった'));
	await screen.findByRole('alert');
	expect(button('わかった').disabled).toBe(true);
	expect(screen.queryByRole('button', { name: '同じ記録を再確認' })).toBeNull();
	expect(requests()).toHaveLength(1);
	await fireEvent.click(button('復習するカードを読み直す'));
	await waitFor(() => expect(button('答えを開く').disabled).toBe(false));
	await fireEvent.click(button('答えを開く'));
	await fireEvent.click(button('わかった'));
	await screen.findByText(/記録しました/);
	const first = requests()[0][1] as StudyReviewInput;
	const second = requests()[1][1] as StudyReviewInput;
	expect(second).toMatchObject({ questionVersion: 3, expectedStateRevision: 1 });
	expect(second.requestId).not.toBe(first.requestId);
});

test('empty queues do not request cram or write a review, and leaving an unanswered card does not write', async () => {
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...queue(), items: [] } as never).mockResolvedValueOnce(queue() as never);
	mount();
	await fireEvent.click(button('復習を始める'));
	await screen.findByText(/今は復習できるカードがありません/);
	expect(misskeyApi).toHaveBeenCalledTimes(1);
	expect(vi.mocked(misskeyApi).mock.calls[0][1]).toEqual({ id: 'deck' });
	await fireEvent.click(button('復習を終了'));
	await begin();
	await fireEvent.click(button('答えを開く'));
	await fireEvent.click(button('復習を終了'));
	expect(requests()).toHaveLength(0);
});

test('archived materials only expose saved snapshots, with twenty-record cursor pages and explicit refresh', async () => {
	const first = Array.from({ length: 20 }, (_, index) => historyEntry(index + 1));
	const older = [historyEntry(21)];
	vi.mocked(misskeyApi).mockImplementation(async (endpoint, input) => {
		if (endpoint !== 'fukushu/study/history') throw new Error('Archived materials must not start study');
		return ((input as { beforeId?: string }).beforeId ? older : first) as never;
	});
	const { container } = mount(true);
	expect(button('復習を始める').disabled).toBe(true);
	await fireEvent.click(button('復習を始める'));
	expect(misskeyApi).not.toHaveBeenCalled();
	await fireEvent.click(button('復習記録を見る'));
	await screen.findByText('回答時の問題 1');
	expect(container.querySelectorAll('ol > li')).toHaveLength(20);
	expect(screen.getByText('回答時の答え 1')).toBeTruthy();
	expect(screen.getByText('回答時の解説 1')).toBeTruthy();
	expect(screen.queryByText('答え card-a')).toBeNull();
	await fireEvent.click(button('古い記録へ'));
	await screen.findByText('回答時の問題 21');
	expect(vi.mocked(misskeyApi).mock.calls.at(-1)?.[1]).toEqual({ id: 'deck', beforeId: first[19].id, limit: 20 });
	expect(container.querySelectorAll('ol > li')).toHaveLength(1);
	expect(button('古い記録へ').disabled).toBe(true);
	await fireEvent.click(button('新しい記録へ'));
	await screen.findByText('回答時の問題 1');
	expect(vi.mocked(misskeyApi).mock.calls.at(-1)?.[1]).toEqual({ id: 'deck', limit: 20 });
	await fireEvent.click(button('最新の記録を読む'));
	await waitFor(() => expect(misskeyApi).toHaveBeenCalledTimes(4));
	expect(requests()).toHaveLength(0);
});

test('history failures retain the displayed snapshot and cursor for an explicit retry', async () => {
	const first = Array.from({ length: 20 }, (_, index) => historyEntry(index + 1));
	vi.mocked(misskeyApi).mockResolvedValueOnce(first as never).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([historyEntry(21)] as never);
	mount();
	await fireEvent.click(button('復習記録を見る'));
	await screen.findByText('回答時の問題 1');
	await fireEvent.click(button('古い記録へ'));
	await screen.findByRole('alert');
	expect(screen.getByText('回答時の問題 1')).toBeTruthy();
	await fireEvent.click(button('古い記録へ'));
	await screen.findByText('回答時の問題 21');
	expect(vi.mocked(misskeyApi).mock.calls[1][1]).toEqual(vi.mocked(misskeyApi).mock.calls[2][1]);
});

test('an unmounted panel ignores a late successful write and makes no follow-up requests', async () => {
	let finish!: (value: StudyReviewResult) => void;
	vi.mocked(misskeyApi).mockImplementation(async endpoint => {
		if (endpoint === 'fukushu/study/queue') return queue() as never;
		return await new Promise<StudyReviewResult>(resolve => { finish = resolve; }) as never;
	});
	const active = vi.fn();
	const locked = vi.fn();
	const { unmount } = mount(false, { onActive: active, onLocked: locked });
	await begin();
	await fireEvent.click(button('答えを開く'));
	await fireEvent.click(button('わかった'));
	const input = requests()[0][1] as StudyReviewInput;
	unmount();
	active.mockClear(); locked.mockClear();
	finish(result(input));
	await Promise.resolve();
	await Promise.resolve();
	expect(active).not.toHaveBeenCalled();
	expect(locked).not.toHaveBeenCalled();
	expect(misskeyApi).toHaveBeenCalledTimes(2);
});


test('a history refresh failure cannot turn a saved review back into a pending submission', async () => {
	vi.mocked(misskeyApi).mockImplementation(async (endpoint, input) => {
		if (endpoint === 'fukushu/study/queue') return queue() as never;
		if (endpoint === 'fukushu/study/review') return result(input as StudyReviewInput) as never;
		throw new Error('History temporarily unavailable');
	});
	mount();
	await begin();
	await fireEvent.click(button('答えを開く'));
	await fireEvent.click(button('わかった'));
	await screen.findByText(/記録しました/);
	await fireEvent.click(button('復習記録を見る'));
	await screen.findByRole('alert');
	expect(screen.getByText(/記録しました/)).toBeTruthy();
	expect(button('次のカードへ').disabled).toBe(false);
	expect(screen.queryByRole('button', { name: '同じ記録を再確認' })).toBeNull();
	expect(requests()).toHaveLength(1);
	await fireEvent.click(button('次のカードへ'));
	expect(screen.getByText('問い card-b')).toBeTruthy();
});

test('a failed queue load stays read-only and can be explicitly retried', async () => {
	vi.mocked(misskeyApi).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(queue() as never);
	mount();
	await fireEvent.click(button('復習を始める'));
	await screen.findByRole('alert');
	expect(button('復習を始める').disabled).toBe(false);
	expect(requests()).toHaveLength(0);
	await begin();
	expect(vi.mocked(misskeyApi).mock.calls.map(([endpoint]) => endpoint)).toEqual(['fukushu/study/queue', 'fukushu/study/queue']);
});
