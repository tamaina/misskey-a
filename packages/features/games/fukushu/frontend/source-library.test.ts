/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import SourceLibrary from './components/SourceLibrary.vue';
import SourceContent from './components/SourceContent.vue';
import SourceStudy from './components/SourceStudy.vue';
import { queue } from './source-study.js';
import type { SourceQuestion } from './source-study.js';
import type { UpstreamRecords } from '../shared/upstream-records.schema.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/drive/frontend/utility/drive.js', () => ({ chooseDriveFile: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ confirm: vi.fn() }));
const i18n = createInternationalization({ initialLocale: 'ja-JP' });
const global = { plugins: [i18n] };
beforeAll(async () => { await i18n.ready; });
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const plain = (value: string) => ({ format: 'plain' as const, value });
const row = { id: 'source-card', deckId: 'deck', sourceKey: 'stable', kind: 'multiple-choice' as const, enabled: true, enabledKey: 1 as const, createdAt: '', updatedAt: '' };
const question: SourceQuestion = { ...row, payload: { ...row, categoryPath: [], prompt: plain('Select'), choices: [
	{ id: 'a', content: plain('A'), weight: 100 }, { id: 'b', content: plain('B'), weight: 0 },
] } };

test('uses grade.correct even at score 100 and retries the original submission unchanged', async () => {
	vi.mocked(misskeyApi).mockRejectedValueOnce(new Error('unconfirmed')).mockResolvedValueOnce({} as never);
	render(SourceStudy, { global, props: { questions: [question], revisions: new Map([['source-card', 3]]), flashMode: false, immediate: true, shuffle: false } });
	for (const checkbox of screen.getAllByRole('checkbox')) await fireEvent.click(checkbox);
	await fireEvent.click(screen.getByText('採点する'));
	await screen.findByText('不正解 (100%)');
	expect(screen.getByText('できた').closest('button')?.disabled).toBe(true);
	await fireEvent.click(screen.getByText('もう一度'));
	await fireEvent.click(await screen.findByText('同じ回答の保存を再試行'));
	await screen.findByText('この回の復習は終了です。');
	const calls = vi.mocked(misskeyApi).mock.calls;
	expect(calls.map(c => c[0])).toEqual(['fukushu/upstream/review', 'fukushu/upstream/review']);
	expect(calls[0][1]).toEqual(calls[1][1]);
	expect(calls[0][1]).toMatchObject({ questionId: 'source-card', expectedRevision: 3, rating: 'again', correct: false, answers: ['a', 'b'] });
});

test('a confirmed byte limit keeps the answer unsaved and avoids retrying the same request', async () => {
	vi.mocked(misskeyApi).mockRejectedValueOnce({ code: 'BACKUP_TOO_LARGE' });
	render(SourceStudy, { global, props: { questions: [question], revisions: new Map([['source-card', 3]]), flashMode: false, immediate: true, shuffle: false } });
	await fireEvent.click(screen.getAllByRole('checkbox')[0]);
	await fireEvent.click(screen.getByText('採点する'));
	await fireEvent.click(screen.getByText('もう一度'));
	expect((await screen.findByRole('alert')).textContent).toContain('この回答は保存されませんでした');
	expect(screen.queryByText('同じ回答の保存を再試行')).toBeNull();
	expect(screen.queryByText('この回の復習は終了です。')).toBeNull();
	expect(misskeyApi).toHaveBeenCalledTimes(1);
});

test('renders owned raster media, preserves text, and omits external requests and active markup', async () => {
	const id = 'b'.repeat(64);
	vi.mocked(misskeyApi).mockResolvedValue({ mimeType: 'image/png', base64: 'AAAA' } as never);
	const { container } = render(SourceContent, { global, props: { content: { format: 'html', value: '<strong>apple</strong><img alt="apple" src="fukushu-media:' + id + '"><img src="https://example.invalid/image" alt="diagram"><iframe></iframe><a href="https://example.invalid/">caption</a>' } } });
	await waitFor(() => expect(container.querySelector('img')?.src).toBe('data:image/png;base64,AAAA'));
	expect(container.querySelector('strong')?.textContent).toBe('apple');
	expect(container.querySelector('a, iframe')).toBeNull();
	expect(container.querySelectorAll('img')).toHaveLength(1);
	expect(container.textContent).toContain('diagram');
	expect(vi.mocked(misskeyApi).mock.calls.map(c => [c[0], c[1]])).toEqual([['fukushu/upstream/media', { id }]]);
});

test('normal queue respects the 4 am day boundary and reset history; cram includes the reset card', () => {
	const now = new Date(2026, 5, 3, 3);
	const records = { settings: [{ maxReviewsPerDay: null, newQuestionsPerDay: 1 }], questions: [question],
																			studyStates: [{ questionId: row.id, deckId: row.deckId, suspended: false, card: { reps: 0 } }],
																			reviewLogs: [{ questionId: row.id, reviewedAt: new Date(2026, 5, 2, 23).toISOString() }] } as UpstreamRecords;
	expect(queue(records, 'deck', now, false)).toEqual([]);
	expect(queue(records, 'deck', now, true)).toEqual([question]);
	const withoutHistory = { ...records, reviewLogs: [] };
	expect(queue(withoutHistory, 'deck', now, false, new Set([row.id]))).toEqual([]);
	expect(queue(withoutHistory, 'deck', now, true, new Set([row.id]))).toEqual([question]);
	expect(queue(records, 'deck', new Date(2026, 5, 3, 4), false)).toEqual([question]);
});

test('a dismissed or stale Drive picker leaves the library usable and cannot restore a file', async () => {
	let resolvePick!: (value: never[]) => void;
	vi.mocked(chooseDriveFile).mockImplementationOnce(() => new Promise(resolve => { resolvePick = resolve; }));
	vi.mocked(misskeyApi).mockRejectedValueOnce({ code: 'NO_SUCH_MATERIAL' });
	render(SourceLibrary, { global });
	await fireEvent.click(screen.getByText('Drive の .fukushu を取り込む'));
	await fireEvent.click(screen.getByText('取込済み教材を開く'));
	await screen.findByText('取込済みの教材はありません。');
	resolvePick([{ id: 'stale', name: 'ignored.fukushu' } as never]);
	await Promise.resolve();
	expect(vi.mocked(misskeyApi).mock.calls.map(call => call[0])).toEqual(['fukushu/upstream/show']);
});
