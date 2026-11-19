/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import * as os from '@features/ui/frontend/os.js';
import SourceLibrary from './components/SourceLibrary.vue';
import SourceContent from './components/SourceContent.vue';
import SourceStudy from './components/SourceStudy.vue';
import { loadSourceMedia } from './source-media.js';
import { queue, studyDay } from './source-study.js';
import type { SourceQuestion } from './source-study.js';
import type { UpstreamRecords } from '../shared/upstream-records.schema.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/drive/frontend/utility/drive.js', () => ({ chooseDriveFile: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ confirm: vi.fn(), inputText: vi.fn() }));
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
	const id = '709e80c88487a2411e1ee4dfb9f22a861492d20c4765150c0c794abd70f8147c';
	vi.mocked(misskeyApi).mockResolvedValue({ mimeType: 'image/png', base64: 'AAAA' } as never);
	const { container } = render(SourceContent, { global, props: { content: { format: 'html', value: '<strong>apple</strong><img alt="apple" src="fukushu-media:' + id + '"><img src="https://example.invalid/image" alt="diagram"><iframe></iframe><a href="https://example.invalid/">caption</a>' } } });
	await waitFor(() => expect(container.querySelector('img')?.src).toBe('data:image/png;base64,AAAA'));
	expect(container.querySelector('strong')?.textContent).toBe('apple');
	expect(container.querySelector('a, iframe')).toBeNull();
	expect(container.querySelectorAll('img')).toHaveLength(1);
	expect(container.textContent).toContain('diagram');
	expect(vi.mocked(misskeyApi).mock.calls.map(c => [c[0], c[1]])).toEqual([['fukushu/upstream/media', { id, offset: 0 }]]);
});

test('renders imported Markdown structure and owned media while keeping plain cards literal', async () => {
	const id = '709e80c88487a2411e1ee4dfb9f22a861492d20c4765150c0c794abd70f8147c';
	vi.mocked(misskeyApi).mockResolvedValue({ mimeType: 'image/png', base64: 'AAAA' } as never);
	const value = [
		'## Photosynthesis', '', '**Light** and `CO2`.', '', '- Oxygen', '- Sugar',
		'', '| Input | Output |', '| --- | --- |', '| Light | Sugar |',
		'', '![Diagram](fukushu-media:' + id + ')', '![Outside](https://example.invalid/image)',
	].join('\n');
	const { container, rerender } = render(SourceContent, { global, props: { content: { format: 'markdown', value } } });
	expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Photosynthesis');
	expect(container.querySelector('strong')?.textContent).toBe('Light');
	expect(container.querySelector('code')?.textContent).toBe('CO2');
	expect(screen.getAllByRole('listitem')).toHaveLength(2);
	expect(screen.getByRole('columnheader', { name: 'Output' })).toBeTruthy();
	await waitFor(() => expect(screen.getByRole('img', { name: 'Diagram' }).getAttribute('src')).toBe('data:image/png;base64,AAAA'));
	expect(screen.queryByRole('img', { name: 'Outside' })).toBeNull();
	expect(container.textContent).toContain('Outside');
	expect(misskeyApi).toHaveBeenCalledTimes(1);

	await rerender({ content: { format: 'plain', value } });
	expect(container.textContent).toBe(value);
	expect(container.querySelector('h2, strong, img, table')).toBeNull();
});

test('rejects a changed media body and cancels a rate-limited read when the card is closed', async () => {
	const id = 'b'.repeat(64);
	const controller = new AbortController();
	vi.mocked(misskeyApi).mockResolvedValueOnce({ mimeType: 'image/png', base64: 'AAAA', totalBytes: 3 } as never);
	await expect(loadSourceMedia(id, controller.signal)).rejects.toThrow('Media digest mismatch');

	vi.mocked(misskeyApi).mockRejectedValueOnce({ code: 'RATE_LIMIT_EXCEEDED', info: { resetMs: Date.now() + 60_000 } });
	const stopped = expect(loadSourceMedia(id, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
	await Promise.resolve();
	controller.abort();
	await stopped;
	expect(misskeyApi).toHaveBeenCalledTimes(2);
});

test('maps the upstream Anki cloze blank, label and hint onto local styles', () => {
	const value = '<span class="cloze-blank other"><span class="cloze-label">ア</span><span class="cloze-hint">年</span></span><span class="other">年号</span>';
	const { container } = render(SourceContent, { global, props: { content: { format: 'html', value } } });
	const spans = [...container.querySelectorAll('span')];
	expect(spans.map(span => span.textContent)).toEqual(['ア年', 'ア', '年', '年号']);
	expect(spans.map(span => span.getAttribute('data-fukushu-cloze'))).toEqual(['blank', 'label', 'hint', null]);
	expect(container.querySelector('.other')).toBeNull();
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

test('cancelling the GIFT preview leaves the deck uncreated', async () => {
	vi.mocked(chooseDriveFile).mockResolvedValue([{ id: 'gift-file', name: 'seasons.gift' } as never]);
	vi.mocked(os.inputText).mockResolvedValue({ canceled: false, result: 'Seasons' });
	vi.mocked(os.confirm).mockResolvedValue({ canceled: true });
	vi.mocked(misskeyApi).mockResolvedValue({ added: 2, token: 'preview', applied: false } as never);
	render(SourceLibrary, { global });
	await fireEvent.click(screen.getByText('Drive の GIFT から教材を作成'));
	await waitFor(() => expect(os.confirm).toHaveBeenCalledOnce());
	expect(misskeyApi).toHaveBeenCalledExactlyOnceWith('fukushu/upstream/create-gift', {
		fileId: 'gift-file', name: 'Seasons', requestId: expect.any(String),
	});
	expect(screen.queryByText('確認済みの教材作成を再試行')).toBeNull();
});

test('studies enabled cards across imported decks and preserves the mode and revision of each card', async () => {
	const other = { ...question, id: 'b', deckId: 'another', payload: { ...question.payload, id: 'b', deckId: 'another' } };
	const response = { shuffle: false, immediate: true, items: [
		{ origin: 'source', question, revision: 3, deckName: 'Quiz', flash: false },
		{ origin: 'source', question: other, revision: 0, deckName: 'Flash', flash: true },
	] };
	vi.mocked(misskeyApi).mockResolvedValue(response as never);
	render(SourceLibrary, { global });
	await fireEvent.click(await screen.findByText('全教材を予定外も含めて復習'));
	await screen.findByText('1 / 2 · Quiz');
	expect(vi.mocked(misskeyApi).mock.calls[0][1]).toMatchObject({ practiceAhead: true });
	await fireEvent.click(screen.getAllByRole('checkbox')[0]);
	await fireEvent.click(screen.getByText('採点する'));
	await fireEvent.click(screen.getByText('できた'));
	await screen.findByText('2 / 2 · Flash');
	await fireEvent.click(screen.getByText('答えを見る'));
	await fireEvent.click(screen.getByText('できた'));
	await screen.findByText('この回の復習は終了です。');
	const writes = vi.mocked(misskeyApi).mock.calls.filter(call => call[0] === 'fukushu/upstream/review');
	expect(writes.map(call => call[1])).toMatchObject([
		{ questionId: question.id, expectedRevision: 3, correct: true, answers: ['a'] },
		{ questionId: 'b', expectedRevision: 0, correct: true, answers: [] },
	]);
	await fireEvent.click(screen.getByText('教材一覧に戻る'));
	await screen.findByText('取込済み教材を開く');
});

test('the local study day changes at 04:00 and uses the next local calendar day', () => {
	const boundary = new Date(2026, 2, 8, 4);
	expect(studyDay(boundary)).toEqual({ start: boundary.toISOString(), end: new Date(2026, 2, 9, 4).toISOString() });
	expect(studyDay(new Date(boundary.getTime() - 1)).end).toBe(boundary.toISOString());
});

test('today resumes the same native review after a lost response and then grades the quiz', async () => {
	const native = { ...question, id: 'n', deckId: 'native', kind: 'flashcard', payload: {
		...question.payload, kind: 'flashcard', prompt: plain('Front'), answer: plain('Back'),
	} };
	const today = { shuffle: false, immediate: true, items: [
		{ origin: 'native', questionId: 'n', deckId: 'native', deckName: 'Native', version: 2, revision: 7 },
		{ origin: 'source', question, deckName: 'Imported', flash: false, revision: 1 },
	] };
	vi.mocked(misskeyApi).mockResolvedValueOnce(today as never)
		.mockRejectedValueOnce(new Error('load interrupted')).mockResolvedValueOnce({ question: native } as never)
		.mockRejectedValueOnce(new Error('response interrupted')).mockResolvedValue({} as never);
	render(SourceLibrary, { global });
	await fireEvent.click(screen.getByRole('button', { name: '今日の学習' }));
	await fireEvent.click(await screen.findByText('このカードを再読み込み'));
	await fireEvent.click(await screen.findByText('答えを見る'));
	await fireEvent.click(screen.getByText('できた'));
	await fireEvent.click(await screen.findByText('同じ回答の保存を再試行'));
	await screen.findByText('2 / 2 · Imported');
	const nativeCalls = vi.mocked(misskeyApi).mock.calls.filter(c => c[0] === 'fukushu/study/review');
	expect(nativeCalls.map(c => c[1])).toEqual([nativeCalls[0][1], nativeCalls[0][1]]);
	expect(nativeCalls[0][1]).toMatchObject({ id: 'native', questionId: 'n', questionVersion: 2, expectedStateRevision: 7 });
	for (const checkbox of screen.getAllByRole('checkbox')) await fireEvent.click(checkbox);
	await fireEvent.click(screen.getByText('採点する'));
	await fireEvent.click(screen.getByText('もう一度'));
	await screen.findByText('今日の学習を終了しました。');
	expect(vi.mocked(misskeyApi).mock.calls.at(-1)?.[1]).toMatchObject({ questionId: question.id, expectedRevision: 1, correct: false, answers: ['a', 'b'] });
});
