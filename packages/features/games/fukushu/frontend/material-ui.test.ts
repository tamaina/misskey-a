/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll, beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import * as os from '@features/ui/frontend/os.js';
import Page from './pages/index.vue';
import type { FukushuMaterial } from '../shared/material.schema.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/drive/frontend/utility/drive.js', () => ({ chooseDriveFile: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ confirm: vi.fn() }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/navigation/frontend/components/global/MkA.vue', () => ({ default: { props: ['to'], template: '<a :href="to"><slot /></a>' } }));

const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
beforeAll(async () => { await internationalization.ready; });
beforeEach(() => { vi.resetAllMocks(); });
afterEach(cleanup);

function data(): FukushuMaterial & { revision: number; archivedAt: string | null } {
	const time = '2026-11-16T00:00:00.000Z';
	return {
		revision: 1, archivedAt: null,
		deck: { id: 'deck', name: '教材A', studyMode: 'flashcard', sourceType: 'anki-text', sourceHash: 'hash', sourceText: '#html:false\nfront\tback', description: '元の説明', importedAt: time, updatedAt: time, questionCount: 21, enabledQuestionCount: 21 },
		questions: Array.from({ length: 21 }, (_, index) => ({
			id: `q${index}`, deckId: 'deck', sourceKey: `key${index}`, sourceOrder: index, kind: 'flashcard', enabled: true, enabledKey: 1, createdAt: time, updatedAt: time,
			payload: { id: `q${index}`, deckId: 'deck', sourceKey: `key${index}`, kind: 'flashcard', categoryPath: [], prompt: { format: 'plain', value: index === 0 ? '<img src=x onerror=alert(1)>' : `問い${index}` }, answer: { format: 'plain', value: `答え${index}` } },
		})),
	};
}

function mount() {
	return render(Page, { global: { plugins: [internationalization], stubs: { PageWithHeader: { template: '<main><slot /></main>' }, MkA: { props: ['to'], template: '<a :href="to"><slot /></a>' } } } });
}

test('renders material as text, paginates cards and never submits a grade', async () => {
	const original = data();
	vi.mocked(misskeyApi).mockImplementation(async endpoint => (endpoint === 'fukushu/materials/list' ? [original.deck] : original) as never);
	const { container } = mount();
	await fireEvent.click(await screen.findByText('教材A'));
	await screen.findByText('<img src=x onerror=alert(1)>');
	expect(container.querySelector('img')).toBeNull();
	expect(container.querySelectorAll('ol > li')).toHaveLength(20);
	await fireEvent.click(screen.getByText('次へ'));
	expect(screen.getByText('問い20')).toBeTruthy();
	expect(container.querySelectorAll('ol > li')).toHaveLength(1);
	expect(vi.mocked(misskeyApi).mock.calls.map(([endpoint]) => endpoint)).toEqual(['fukushu/materials/list', 'fukushu/materials/show']);
});

test('requires a Drive choice and sends only its ID once while saving', async () => {
	let finish!: (value: unknown) => void;
	vi.mocked(misskeyApi).mockImplementation(async endpoint => {
		if (endpoint === 'fukushu/materials/list') return [] as never;
		if (endpoint === 'fukushu/materials/show') return data() as never;
		if (endpoint === 'fukushu/materials/update') return { revision: 2, archivedAt: null } as never;
		return await new Promise<unknown>(resolve => { finish = resolve; }) as never;
	});
	vi.mocked(chooseDriveFile).mockResolvedValue([{ id: 'file-1', name: 'cards.tsv', url: 'https://example.invalid/public' }] as never);
	mount();
	await screen.findByText(/教材はまだありません/);
	expect((screen.getByText('教材として保存').closest('button') as HTMLButtonElement).disabled).toBe(true);
	await fireEvent.click(screen.getByText('Drive のファイルを選ぶ'));
	await screen.findByText(/cards.tsv/);
	await fireEvent.click(screen.getByText('教材として保存'));
	expect((screen.getByText('教材として保存').closest('button') as HTMLButtonElement).disabled).toBe(true);
	expect(misskeyApi).toHaveBeenLastCalledWith('fukushu/materials/import', { fileId: 'file-1' });
	const { deck, questions } = data();
	finish({ deck, questions });
	await screen.findByText('教材を保存しました。');
	expect(vi.mocked(misskeyApi).mock.calls.filter(([endpoint]) => endpoint.endsWith('/import'))).toHaveLength(1);
	expect(misskeyApi).toHaveBeenLastCalledWith('fukushu/materials/show', { id: 'deck' });
	await fireEvent.click(screen.getByText('名前・説明を編集'));
	await fireEvent.update(screen.getByLabelText('教材名'), '取り込み後の名前');
	await fireEvent.click(screen.getByText('変更を保存'));
	await waitFor(() => expect(misskeyApi).toHaveBeenLastCalledWith('fukushu/materials/update', { id: 'deck', expectedRevision: 1, name: '取り込み後の名前', description: '元の説明' }));
});

test('an unfinished picker does not lock the page and an older selection cannot replace the newest', async () => {
	let oldPick!: (value: unknown) => void;
	vi.mocked(misskeyApi).mockResolvedValue([] as never);
	vi.mocked(chooseDriveFile).mockImplementationOnce(async () => await new Promise<unknown>(resolve => { oldPick = resolve; }) as never)
		.mockResolvedValueOnce([{ id: 'new', name: 'new.tsv' }] as never);
	mount();
	await screen.findByText(/教材はまだありません/);
	await fireEvent.click(screen.getByText('Drive のファイルを選ぶ'));
	expect((screen.getByText('再読み込み').closest('button') as HTMLButtonElement).disabled).toBe(false);
	await fireEvent.click(screen.getByText('Drive のファイルを選ぶ'));
	await screen.findByText(/new.tsv/);
	oldPick([{ id: 'old', name: 'old.tsv' }]);
	await waitFor(() => expect(screen.queryByText(/old.tsv/)).toBeNull());
});

test('shows duplicate-import guidance and releases controls after failure', async () => {
	vi.mocked(misskeyApi).mockImplementation(async endpoint => {
		if (endpoint === 'fukushu/materials/list') return [] as never;
		throw Object.assign(new Error('Duplicate'), { code: 'MATERIAL_EXISTS' });
	});
	vi.mocked(chooseDriveFile).mockResolvedValue([{ id: 'file', name: 'cards.tsv' }] as never);
	mount();
	await screen.findByText(/教材はまだありません/);
	await fireEvent.click(screen.getByText('Drive のファイルを選ぶ'));
	await screen.findByText(/cards.tsv/);
	await fireEvent.click(screen.getByText('教材として保存'));
	await screen.findByRole('alert');
	expect(screen.getByRole('alert').textContent).toContain('すでに保存');
	expect((screen.getByText('教材として保存').closest('button') as HTMLButtonElement).disabled).toBe(false);
});

test('edits metadata only, cancels drafts, and validates name and description bounds', async () => {
	const original = data();
	vi.mocked(misskeyApi).mockImplementation(async endpoint => {
		if (endpoint === 'fukushu/materials/list') return [original.deck] as never;
		if (endpoint === 'fukushu/materials/update') return { revision: 2, archivedAt: null } as never;
		return original as never;
	});
	mount();
	await fireEvent.click(await screen.findByText('教材A'));
	await fireEvent.click(await screen.findByText('名前・説明を編集'));
	await fireEvent.update(screen.getByLabelText('教材名'), '下書き');
	await fireEvent.click(screen.getByText('キャンセル'));
	expect(screen.getByRole('heading', { name: '教材A' })).toBeTruthy();
	expect(vi.mocked(misskeyApi).mock.calls.some(([endpoint]) => endpoint.endsWith('/update'))).toBe(false);
	await fireEvent.click(screen.getByText('名前・説明を編集'));
	expect((screen.getByLabelText('教材名') as HTMLInputElement).value).toBe('教材A');
	for (const name of ['   ', 'a'.repeat(257)]) {
		await fireEvent.update(screen.getByLabelText('教材名'), name);
		expect((screen.getByText('変更を保存').closest('button') as HTMLButtonElement).disabled).toBe(true);
	}
	await fireEvent.update(screen.getByLabelText('教材名'), '<b>新しい名前</b>');
	await fireEvent.update(screen.getByLabelText('説明'), 'a'.repeat(4097));
	expect((screen.getByText('変更を保存').closest('button') as HTMLButtonElement).disabled).toBe(true);
	await fireEvent.update(screen.getByLabelText('説明'), '新しい説明');
	await fireEvent.click(screen.getByText('変更を保存'));
	await screen.findByText('名前と説明を保存しました。');
	expect(misskeyApi).toHaveBeenLastCalledWith('fukushu/materials/update', { id: 'deck', expectedRevision: 1, name: '<b>新しい名前</b>', description: '新しい説明' });
	expect(screen.getByRole('heading', { name: '<b>新しい名前</b>' }).querySelector('b')).toBeNull();
	expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
});

test.each(['MATERIAL_CONFLICT', 'NETWORK_ERROR'])('retains drafts after %s and explicitly reloads before retrying', async code => {
	const original = data();
	let latest = original;
	let fail = true;
	vi.mocked(misskeyApi).mockImplementation(async endpoint => {
		if (endpoint === 'fukushu/materials/list') return [original.deck] as never;
		if (endpoint === 'fukushu/materials/show') return latest as never;
		if (fail) throw Object.assign(new Error('Failed'), { code });
		return { revision: 3, archivedAt: null } as never;
	});
	mount();
	await fireEvent.click(await screen.findByText('教材A'));
	await fireEvent.click(await screen.findByText('名前・説明を編集'));
	await fireEvent.update(screen.getByLabelText('教材名'), '自分の下書き');
	await fireEvent.update(screen.getByLabelText('説明'), '自分の説明');
	await fireEvent.click(screen.getByText('変更を保存'));
	await screen.findByRole('alert');
	expect((screen.getByLabelText('教材名') as HTMLInputElement).value).toBe('自分の下書き');
	expect((screen.getByLabelText('説明') as HTMLTextAreaElement).value).toBe('自分の説明');
	expect((screen.getByText('変更を保存').closest('button') as HTMLButtonElement).disabled).toBe(true);
	expect(vi.mocked(misskeyApi).mock.calls.filter(([endpoint]) => endpoint.endsWith('/show'))).toHaveLength(1);
	latest = { ...original, revision: 2, deck: { ...original.deck, name: '別の変更', description: '別の説明' } };
	await fireEvent.click(screen.getByText('教材の最新状態を読み込む'));
	await screen.findByRole('heading', { name: '別の変更' });
	expect(screen.getByText('別の説明')).toBeTruthy();
	expect((screen.getByLabelText('教材名') as HTMLInputElement).value).toBe('自分の下書き');
	expect((screen.getByLabelText('説明') as HTMLTextAreaElement).value).toBe('自分の説明');
	fail = false;
	await fireEvent.click(screen.getByText('変更を保存'));
	await screen.findByText('名前と説明を保存しました。');
	expect(misskeyApi).toHaveBeenLastCalledWith('fukushu/materials/update', { id: 'deck', expectedRevision: 2, name: '自分の下書き', description: '自分の説明' });
});

test('confirms archive and restore, filters the library, and preserves card preview', async () => {
	let current = data();
	vi.mocked(misskeyApi).mockImplementation(async (endpoint, params) => {
		if (endpoint === 'fukushu/materials/list') {
			const archived = (params as { archived: boolean }).archived;
			return (archived === (current.archivedAt !== null) ? [current.deck] : []) as never;
		}
		if (endpoint === 'fukushu/materials/archive') {
			const archived = (params as { archived: boolean }).archived;
			current = { ...current, revision: current.revision + 1, archivedAt: archived ? '2026-11-17T00:00:00.000Z' : null };
			return { revision: current.revision, archivedAt: current.archivedAt } as never;
		}
		return current as never;
	});
	vi.mocked(os.confirm).mockResolvedValueOnce({ canceled: true }).mockResolvedValue({ canceled: false });
	mount();
	await fireEvent.click(await screen.findByText('教材A'));
	await fireEvent.click(await screen.findByText('教材を保管'));
	await waitFor(() => expect(os.confirm).toHaveBeenCalledTimes(1));
	expect(vi.mocked(misskeyApi).mock.calls.some(([endpoint]) => endpoint.endsWith('/archive'))).toBe(false);
	await waitFor(() => expect((screen.getByText('教材を保管').closest('button') as HTMLButtonElement).disabled).toBe(false));
	await fireEvent.click(screen.getByText('教材を保管'));
	await screen.findByText('教材を保管しました。');
	expect(os.confirm).toHaveBeenLastCalledWith(expect.objectContaining({ text: expect.stringContaining('削除しません') }));
	expect(misskeyApi).toHaveBeenLastCalledWith('fukushu/materials/archive', { id: 'deck', expectedRevision: 1, archived: true });
	expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
	await fireEvent.click(screen.getByText('← 保存した教材'));
	await screen.findByText(/教材はまだありません/);
	expect(screen.getByText(/保管しても空き枠は増えません/)).toBeTruthy();
	await fireEvent.click(screen.getByText('保管済み'));
	await fireEvent.click(await screen.findByText('教材A'));
	await fireEvent.click(await screen.findByText('教材を復元'));
	await screen.findByText('教材を復元しました。');
	expect(misskeyApi).toHaveBeenLastCalledWith('fukushu/materials/archive', { id: 'deck', expectedRevision: 2, archived: false });
	await fireEvent.click(screen.getByText('← 保存した教材'));
	await screen.findByText('保管済みの教材はありません。');
	await fireEvent.click(screen.getByText('通常の教材'));
	await screen.findByText('教材A');
	expect(vi.mocked(misskeyApi).mock.calls.some(([endpoint]) => /delete|grade/.test(endpoint))).toBe(false);
});

test('reopens a successfully imported material after a failed show without importing twice', async () => {
	let failShow = true;
	vi.mocked(misskeyApi).mockImplementation(async endpoint => {
		if (endpoint === 'fukushu/materials/list') return [] as never;
		if (endpoint === 'fukushu/materials/show' && failShow) throw new Error('Offline');
		return data() as never;
	});
	vi.mocked(chooseDriveFile).mockResolvedValue([{ id: 'file', name: 'cards.tsv' }] as never);
	mount();
	await screen.findByText(/教材はまだありません/);
	await fireEvent.click(screen.getByText('Drive のファイルを選ぶ'));
	await screen.findByText(/cards.tsv/);
	await fireEvent.click(screen.getByText('教材として保存'));
	await screen.findByRole('alert');
	expect((screen.getByText('教材として保存').closest('button') as HTMLButtonElement).disabled).toBe(true);
	failShow = false;
	await fireEvent.click(screen.getByText('保存した教材を開く'));
	await screen.findByRole('heading', { name: '教材A' });
	expect(vi.mocked(misskeyApi).mock.calls.filter(([endpoint]) => endpoint.endsWith('/import'))).toHaveLength(1);
});

test('does not change archive state optimistically when its revision is stale', async () => {
	const original = data();
	vi.mocked(misskeyApi).mockImplementation(async endpoint => {
		if (endpoint === 'fukushu/materials/list') return [original.deck] as never;
		if (endpoint === 'fukushu/materials/archive') throw Object.assign(new Error('Conflict'), { code: 'MATERIAL_CONFLICT' });
		return original as never;
	});
	vi.mocked(os.confirm).mockResolvedValue({ canceled: false });
	mount();
	await fireEvent.click(await screen.findByText('教材A'));
	await fireEvent.click(await screen.findByText('教材を保管'));
	await screen.findByRole('alert');
	expect(screen.queryByText('教材を復元')).toBeNull();
	expect((screen.getByText('教材を保管').closest('button') as HTMLButtonElement).disabled).toBe(true);
	expect(vi.mocked(misskeyApi).mock.calls.filter(([endpoint]) => endpoint.endsWith('/show'))).toHaveLength(1);
	await fireEvent.click(screen.getByText('教材の最新状態を読み込む'));
	await screen.findByText('最新状態を表示しました。');
	expect((screen.getByText('教材を保管').closest('button') as HTMLButtonElement).disabled).toBe(false);
});
