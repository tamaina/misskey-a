/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import { inspectLocalUpstream } from './upstream-local.js';
import UpstreamBackupPanel from './components/UpstreamBackupPanel.vue';
import type { UpstreamInspection } from '../shared/upstream-backup.schema.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/drive/frontend/utility/drive.js', () => ({ chooseDriveFile: vi.fn() }));
vi.mock('./upstream-local.js', () => ({ inspectLocalUpstream: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({}));
const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
beforeAll(async () => { await internationalization.ready; });
beforeEach(() => { vi.resetAllMocks(); });
afterEach(cleanup);
const output: UpstreamInspection = { format: 'FUKUSHU-BACKUP-1', imported: false, canImport: false, sha256: 'a'.repeat(64), exportedAt: null,
																																					counts: { decks: 1, questions: 2, studyStates: 1, reviewLogs: 1, importSources: 1, media: 1, imports: 1 }, binaryBytes: 100,
																																					currentDesiredRetention: 0.93, missingQuestionOrders: 1, decks: [{ id: 'deck', name: '<img src=x onerror=alert(1)>', questions: 2, reviewLogs: 1 }],
																																					history: [{ id: 'old-review', questionId: 'card', deckId: 'deck', reviewedAt: '2026-09-11T00:00:00.000Z', rating: 'easy', correct: false, questionSnapshot: 'unavailable', cardBefore: null, cardAfter: null, scheduler: null }] };
const mount = (disabled = false) => render(UpstreamBackupPanel, { props: { disabled }, global: { plugins: [internationalization], stubs: { MkA: { props: ['to'], template: '<a :href="to"><slot /></a>' } } } });
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const chooseLabel = '本家 .fukushu を Drive から選ぶ';
const inspectLabel = '本家バックアップを書き込まずに検査';

async function expand() { await fireEvent.click(screen.getByText('本家 Fukushu のバックアップを調べる')); }

async function choose(id = 'upstream') {
	vi.mocked(chooseDriveFile).mockResolvedValueOnce([{ id, name: `${id}.fukushu` }] as never);
	await fireEvent.click(button(chooseLabel)); await screen.findByText(`${id}.fukushu`);
}

test('inspects the chosen original, escapes names and labels historical snapshots unknown without offering writes', async () => {
	vi.mocked(misskeyApi).mockResolvedValue(output as never);
	const { container } = mount(); await expand();
	expect(button(inspectLabel).disabled).toBe(true); expect(misskeyApi).not.toHaveBeenCalled();
	await choose(); await fireEvent.click(button(inspectLabel));
	await screen.findByText('読み込めた内容');
	expect(vi.mocked(misskeyApi).mock.calls[0].slice(0, 2)).toEqual(['fukushu/backup/inspect-upstream', { fileId: 'upstream' }]);
	expect(screen.getByText(/回答時のカード内容: 不明/)).toBeTruthy();
	expect(screen.getByText(/easy · 記録上の不正解/)).toBeTruthy();
	expect(screen.getByText(/書き出し日時が記録されていません/)).toBeTruthy();
	expect(screen.getByText(/過去の復習時に使った値とは限りません/)).toBeTruthy();
	expect(screen.queryByRole('button', { name: '教材全体を復元' })).toBeNull();
	expect(screen.queryByRole('checkbox')).toBeNull(); expect(container.querySelector('img')).toBeNull();
	expect(misskeyApi).toHaveBeenCalledTimes(1);
});

test('changing the selected file removes the old report', async () => {
	vi.mocked(misskeyApi).mockResolvedValue(output as never);
	mount(); await expand(); await choose(); await fireEvent.click(button(inspectLabel)); await screen.findByText('読み込めた内容');
	await choose('other'); expect(screen.queryByText('読み込めた内容')).toBeNull(); expect(misskeyApi).toHaveBeenCalledTimes(1);
});

test.each(['BACKUP_TOO_LARGE', 'UPSTREAM_INSPECTION_LIMIT', 'INVALID_BACKUP', 'NO_SUCH_FILE'])('shows an explicit non-writing failure for %s', async code => {
	vi.mocked(misskeyApi).mockRejectedValue({ code }); mount(); await expand(); await choose(); await fireEvent.click(button(inspectLabel));
	const error = await screen.findByRole('alert'); expect(error.textContent).toMatch(/一部だけを取り込むことはありません|データは変更していません/);
	expect(screen.queryByText('読み込めた内容')).toBeNull(); expect(misskeyApi).toHaveBeenCalledTimes(1);
});

test('blocks duplicate reads, clears state on unmount and never follows up with an import', async () => {
	let finish: ((value: unknown) => void) | undefined;
	vi.mocked(misskeyApi).mockImplementation(() => new Promise<unknown>(resolve => { finish = resolve; }) as never);
	const view = mount(); await expand(); await choose(); await fireEvent.click(button(inspectLabel)); await fireEvent.click(button(inspectLabel));
	expect(misskeyApi).toHaveBeenCalledTimes(1); expect(button(chooseLabel).disabled).toBe(true);
	view.unmount(); finish?.(output); await waitFor(() => expect(screen.queryByText('読み込めた内容')).toBeNull());
	expect(misskeyApi).toHaveBeenCalledTimes(1);
});

test('respects the parent operation lock', async () => {
	mount(true); await expand(); expect(button(chooseLabel).disabled).toBe(true); expect(button(inspectLabel).disabled).toBe(true);
	await fireEvent.click(button(chooseLabel)); expect(chooseDriveFile).not.toHaveBeenCalled();
});

test('local selection inspects only in memory without any Drive or API request', async () => {
	vi.mocked(inspectLocalUpstream).mockResolvedValue(output);
	mount(); await expand();
	const file = new File(['synthetic'], 'local.fukushu');
	await fireEvent.change(screen.getByTestId('upstream-local-file'), { target: { files: [file] } });
	await screen.findByText('読み込めた内容');
	expect(inspectLocalUpstream).toHaveBeenCalledWith(file);
	expect(screen.getByText(/端末内で検査・未送信/)).toBeTruthy();
	expect(screen.getByText(/回答時のカード内容: 不明/)).toBeTruthy();
	expect(misskeyApi).not.toHaveBeenCalled(); expect(chooseDriveFile).not.toHaveBeenCalled();
	expect(button(inspectLabel).disabled).toBe(true);
});

test('local read errors do not fall back to uploading or leave an old report', async () => {
	vi.mocked(inspectLocalUpstream).mockRejectedValue({ code: 'INVALID_BACKUP' });
	mount(); await expand();
	await fireEvent.change(screen.getByTestId('upstream-local-file'), { target: { files: [new File(['bad'], 'bad.fukushu')] } });
	await screen.findByRole('alert');
	expect(screen.queryByText('読み込めた内容')).toBeNull();
	expect(misskeyApi).not.toHaveBeenCalled(); expect(chooseDriveFile).not.toHaveBeenCalled();
});

test('parent operation lock also blocks local inspection', async () => {
	mount(true); await expand();
	expect(button('端末の .fukushu を検査').disabled).toBe(true);
	await fireEvent.change(screen.getByTestId('upstream-local-file'), { target: { files: [new File(['x'], 'x.fukushu')] } });
	expect(inspectLocalUpstream).not.toHaveBeenCalled(); expect(misskeyApi).not.toHaveBeenCalled();
});
