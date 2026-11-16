/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll, beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import Page from './pages/index.vue';
import type { FukushuMaterial } from '../shared/material.schema.js';

vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/drive/frontend/utility/drive.js', () => ({ chooseDriveFile: vi.fn() }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/navigation/frontend/components/global/MkA.vue', () => ({ default: { props: ['to'], template: '<a :href="to"><slot /></a>' } }));

const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
beforeAll(async () => { await internationalization.ready; });
beforeEach(() => { vi.resetAllMocks(); });
afterEach(cleanup);

function data(): FukushuMaterial {
	const time = '2026-11-16T00:00:00.000Z';
	return {
		deck: { id: 'deck', name: '教材A', studyMode: 'flashcard', sourceType: 'anki-text', sourceHash: 'hash', importedAt: time, updatedAt: time, questionCount: 21, enabledQuestionCount: 21 },
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
	vi.mocked(misskeyApi).mockImplementation(async endpoint => endpoint === 'fukushu/materials/list' ? [] as never : await new Promise<unknown>(resolve => { finish = resolve; }) as never);
	vi.mocked(chooseDriveFile).mockResolvedValue([{ id: 'file-1', name: 'cards.tsv', url: 'https://example.invalid/public' }] as never);
	mount();
	await screen.findByText(/教材はまだありません/);
	expect((screen.getByText('教材として保存').closest('button') as HTMLButtonElement).disabled).toBe(true);
	await fireEvent.click(screen.getByText('Drive のファイルを選ぶ'));
	await screen.findByText(/cards.tsv/);
	await fireEvent.click(screen.getByText('教材として保存'));
	expect((screen.getByText('教材として保存').closest('button') as HTMLButtonElement).disabled).toBe(true);
	expect(misskeyApi).toHaveBeenLastCalledWith('fukushu/materials/import', { fileId: 'file-1' });
	finish(data());
	await screen.findByText('教材を保存しました。');
	expect(vi.mocked(misskeyApi).mock.calls.filter(([endpoint]) => endpoint.endsWith('/import'))).toHaveLength(1);
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
