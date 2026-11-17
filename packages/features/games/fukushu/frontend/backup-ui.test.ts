/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import BackupPanel from './components/BackupPanel.vue';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/drive/frontend/utility/drive.js', () => ({ chooseDriveFile: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({}));
vi.mock('@features/navigation/frontend/components/global/MkA.vue', () => ({ default: { props: ['to'], template: '<a :href="to"><slot /></a>' } }));
const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
beforeAll(async () => { await internationalization.ready; });
beforeEach(() => { vi.resetAllMocks(); });
afterEach(cleanup);
const output = { format: 'misskey-fukushu-deck-backup', version: 1, deckId: 'deck', deckName: '<img src=x onerror=alert(1)>', exportedAt: '2026-11-17T00:00:00.000Z', archived: true, questions: 2, versions: 4, studyStates: 1, reviews: 3, conflicts: { deck: true, questions: 2, reviews: 3 }, restored: false };
const mount = (props = {}) => render(BackupPanel, { props: { deckId: 'deck', ...props }, global: { plugins: [internationalization], stubs: { MkA: { props: ['to'], template: '<a :href="to"><slot /></a>' } } } });
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

async function expandPanel() { await fireEvent.click(screen.getByText('バックアップ・復元前の確認')); }

async function choose(id = 'file') {
	vi.mocked(chooseDriveFile).mockResolvedValueOnce([{ id, name: `${id}.json` }] as never);
	await fireEvent.click(button('Drive のバックアップを選ぶ'));
	await screen.findByText(`${id}.json`);
}

test('requires explicit Drive visibility acknowledgement and queues once without claiming completion', async () => {
	let finish!: () => void;
	vi.mocked(misskeyApi).mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }) as never);
	mount(); await expandPanel();
	expect(misskeyApi).not.toHaveBeenCalled();
	expect(button('バックアップを Drive に保存').disabled).toBe(true);
	await fireEvent.click(screen.getByRole('checkbox'));
	await fireEvent.click(button('バックアップを Drive に保存'));
	await fireEvent.click(button('バックアップを Drive に保存'));
	expect(misskeyApi).toHaveBeenCalledTimes(1);
	expect(vi.mocked(misskeyApi).mock.calls[0].slice(0, 2)).toEqual(['fukushu/backup/export', { id: 'deck', acknowledgeDriveVisibility: true }]);
	finish();
	await screen.findByText(/保存結果は通知または Drive/);
	expect(button('バックアップを Drive に保存').disabled).toBe(true);
});

test('failed or uncertain export explicitly requires checking Drive and notifications before another request', async () => {
	vi.mocked(misskeyApi).mockRejectedValueOnce(new TypeError('Offline'));
	mount(); await expandPanel();
	await fireEvent.click(screen.getByRole('checkbox'));
	await fireEvent.click(button('バックアップを Drive に保存'));
	await screen.findByRole('alert');
	expect(screen.getByText(/再実行する前に通知と Drive を確認/)).toBeTruthy();
	expect(screen.queryByText(/保存結果は通知または Drive/)).toBeNull();
	expect(misskeyApi).toHaveBeenCalledTimes(1);
});

test('inspects only the selected owned file, escapes names and never offers a restore write', async () => {
	vi.mocked(misskeyApi).mockResolvedValue(output as never);
	const { container } = mount({ deckId: undefined }); await expandPanel();
	expect(screen.queryByRole('checkbox')).toBeNull();
	expect(button('書き込まずに検査').disabled).toBe(true);
	await choose();
	expect(misskeyApi).not.toHaveBeenCalled();
	await fireEvent.click(button('書き込まずに検査'));
	await screen.findByText(output.deckName);
	expect(container.querySelector('img')).toBeNull();
	expect(screen.getByText(/書き込み・置換はしていません/)).toBeTruthy();
	expect(screen.getByText(/1 \/ 2 \/ 3/)).toBeTruthy();
	expect(vi.mocked(misskeyApi).mock.calls[0].slice(0, 2)).toEqual(['fukushu/backup/inspect', { fileId: 'file' }]);
	await choose('next');
	expect(screen.queryByText(output.deckName)).toBeNull();
});

test.each([
	['UPSTREAM_BACKUP_UNSUPPORTED', /本家 Fukushu のバックアップです/],
	['BACKUP_TOO_LARGE', /上限8 MiBを超えています/],
	['INVALID_BACKUP', /教材や履歴は変更していません/],
] as const)('clears old inspection and safely explains %s', async (code, message) => {
	vi.mocked(misskeyApi).mockResolvedValueOnce(output as never).mockRejectedValueOnce({ code });
	mount(); await expandPanel(); await choose();
	await fireEvent.click(button('書き込まずに検査'));
	await screen.findByText(output.deckName);
	await fireEvent.click(button('書き込まずに検査'));
	await screen.findByRole('alert');
	expect(screen.getByText(message)).toBeTruthy();
	expect(screen.queryByText(output.deckName)).toBeNull();
});

test('disables all operations during parent edits or study', async () => {
	mount({ disabled: true }); await expandPanel();
	for (const b of screen.getAllByRole('button')) expect((b as HTMLButtonElement).disabled).toBe(true);
	expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
	expect(misskeyApi).not.toHaveBeenCalled();
	expect(chooseDriveFile).not.toHaveBeenCalled();
});

test('ignores a late picker result after unmount and does not issue API calls', async () => {
	let finish!: (value: unknown) => void;
	vi.mocked(chooseDriveFile).mockImplementation(() => new Promise(resolve => { finish = resolve; }) as never);
	const { unmount } = mount(); await expandPanel();
	await fireEvent.click(button('Drive のバックアップを選ぶ'));
	unmount(); finish([{ id: 'late', name: 'late.json' }]);
	await waitFor(() => expect(chooseDriveFile).toHaveBeenCalledTimes(1));
	expect(misskeyApi).not.toHaveBeenCalled();
});

async function inspectRestorable() {
	vi.mocked(misskeyApi).mockResolvedValueOnce({ ...output, conflicts: { deck: false, questions: 0, reviews: 0 } } as never);
	await expandPanel(); await choose(); await fireEvent.click(button('書き込まずに検査')); await screen.findByText(output.deckName);
}

test('restores only after conflict-free inspection and confirmation, suppressing duplicate requests', async () => {
	const view = mount({ deckId: undefined }); await inspectRestorable();
	expect(button('教材全体を復元').disabled).toBe(true);
	await fireEvent.click(screen.getByRole('checkbox'));
	let finish!: (value: unknown) => void;
	vi.mocked(misskeyApi).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }) as never);
	await fireEvent.click(button('教材全体を復元')); await fireEvent.click(button('教材全体を復元'));
	expect(misskeyApi).toHaveBeenCalledTimes(2);
	expect(vi.mocked(misskeyApi).mock.calls[1].slice(0, 2)).toEqual(['fukushu/backup/restore', { fileId: 'file', confirmRestore: true }]);
	expect(button('Drive のバックアップを選ぶ').disabled).toBe(true);
	const restored = { restored: true, deckId: 'deck', archived: true, questions: 2, versions: 4, studyStates: 1, reviews: 3 };
	finish(restored);
	await waitFor(() => expect(view.emitted().restored).toEqual([[restored]]));
	expect(view.emitted().locked).toEqual([[true], [false]]);
	expect(screen.queryByRole('button', { name: '教材全体を復元' })).toBeNull();
});

test('does not offer restore for known conflicts and clears confirmation when the file changes', async () => {
	mount({ deckId: undefined }); await inspectRestorable();
	await fireEvent.click(screen.getByRole('checkbox')); await choose('other');
	expect(screen.queryByRole('button', { name: '教材全体を復元' })).toBeNull();
	vi.mocked(misskeyApi).mockResolvedValueOnce(output as never);
	await fireEvent.click(button('書き込まずに検査')); await screen.findByText(output.deckName);
	expect(screen.queryByRole('button', { name: '教材全体を復元' })).toBeNull();
	expect(screen.getByText(/既存データとIDが重複しています/)).toBeTruthy();
});

test.each([
	[{ code: 'BACKUP_CONFLICT' }, /既存データとIDが重複しています/],
	[{ code: 'BACKUP_LIMIT' }, /保存先の教材数/],
	[new TypeError('Offline'), /再実行する前に教材一覧と復習履歴を確認/],
])('clears stale inspection after restore rejection or unknown result: %j', async (cause, message) => {
	const view = mount({ deckId: undefined }); await inspectRestorable(); await fireEvent.click(screen.getByRole('checkbox'));
	vi.mocked(misskeyApi).mockRejectedValueOnce(cause);
	await fireEvent.click(button('教材全体を復元')); await screen.findByRole('alert');
	expect(screen.getByText(message)).toBeTruthy();
	expect(screen.queryByRole('button', { name: '教材全体を復元' })).toBeNull();
	expect(view.emitted().restored).toBeUndefined();
	expect(view.emitted().locked).toEqual([[true], [false]]);
	expect(misskeyApi).toHaveBeenCalledTimes(2);
});
