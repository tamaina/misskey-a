/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fireEvent, render, waitFor } from '@testing-library/vue';
import { beforeEach, expect, test, vi } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { Nirax } from '@features/navigation/frontend/lib/nirax.js';
import { ROUTE_DEF } from '@features/navigation/frontend/router.definition.js';
import Page from '../../frontend/pages/index.vue';

const mocks = vi.hoisted(() => ({ api: vi.fn(), selectUser: vi.fn(), confirm: vi.fn() }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: { id: 'alice', policies: { chatAvailability: 'unavailable' } }, iAmModerator: false }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: mocks.api }));
vi.mock('@features/ui/frontend/os.js', () => ({ selectUser: mocks.selectUser, confirm: mocks.confirm }));
vi.mock('@features/navigation/frontend/router.js', () => ({ useRouter: () => router }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/index/frontend', () => ({ loadNotFoundPage: vi.fn() }));
vi.mock('@features/web/frontend/pages/_loading_.vue', () => ({ default: { template: '<p>Loading</p>' } }));
vi.mock('@features/web/frontend/pages/_error_.vue', () => ({ default: { template: '<p>Error</p>' } }));
vi.mock('@features/timelines/frontend/pages/timeline.vue', () => ({ default: { template: '<p>Timeline</p>' } }));
vi.mock('@features/navigation/frontend/components/global/MkA.vue', () => ({ default: { template: '<a><slot /></a>' } }));
const router = new Nirax(ROUTE_DEF, '/mahjong', true, { template: '<p>Not found</p>' });
beforeEach(() => { mocks.api.mockReset(); mocks.selectUser.mockReset(); mocks.confirm.mockReset(); });

test('creating an invitation navigates through the real router to the returned room', async () => {
	const roomId = '5824be9f-8b3c-45d0-af07-d7099dcb478c';
	mocks.api.mockImplementation(async endpoint => endpoint === 'mahjong/create' ? { id: roomId } : []);
	for (const id of ['bob', 'carol', 'dave']) mocks.selectUser.mockResolvedValueOnce({ id, username: id });
	const intl = createInternationalization({ initialLocale: 'ja-JP' });
	await intl.ready;
	const pushed = vi.fn();
	router.init();
	router.on('push', pushed);
	const wrapper = render(Page, { global: { plugins: [intl], stubs: { PageWithHeader: { template: '<main><slot /></main>' }, MkA: { template: '<a><slot /></a>' } } } });
	try {
		for (const button of wrapper.getAllByRole('button', { name: '参加者を選ぶ' })) await fireEvent.click(button);
		await fireEvent.click(wrapper.getByRole('button', { name: '部屋を作る' }));
		await waitFor(() => expect(pushed).toHaveBeenCalledWith(expect.objectContaining({ fullPath: `/mahjong/${roomId}` })));
		expect(mocks.api).toHaveBeenCalledWith('mahjong/create', { invitees: ['bob', 'carol', 'dave'] });
	} finally {
		router.off('push', pushed);
		wrapper.unmount();
	}
});

test('aborting play requires confirmation and replaces all controls with the terminal notice', async () => {
	const roomId = '5824be9f-8b3c-45d0-af07-d7099dcb478c';
	let cancelled = false;
	mocks.api.mockImplementation(async endpoint => {
		if (endpoint === 'users/show') return { username: 'fixture' };
		if (endpoint === 'mahjong/cancel') cancelled = true;
		return { id: roomId, users: ['alice', 'bob', 'carol', 'dave'], status: cancelled ? 'cancelled' : 'playing',
											revision: cancelled ? 2 : 1, serverTime: Date.now(), phase: null, snapshot: null, outcome: null };
	});
	mocks.confirm.mockResolvedValueOnce({ canceled: true }).mockResolvedValueOnce({ canceled: false });
	const intl = createInternationalization({ initialLocale: 'ja-JP' });
	await intl.ready;
	const wrapper = render(Page, { props: { roomId }, global: { plugins: [intl], stubs: { Table: { template: '<p>Playing table</p>' }, PageWithHeader: { template: '<main><slot /></main>' }, MkA: { template: '<a><slot /></a>' } } } });
	try {
		const button = await wrapper.findByRole('button', { name: '対局を中断する' });
		await fireEvent.click(button);
		await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
		expect(mocks.confirm).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning', text: expect.stringContaining('他の3人も含めて') }));
		expect(mocks.api.mock.calls.some(([endpoint]) => endpoint === 'mahjong/cancel')).toBe(false);
		await fireEvent.click(button);
		await wrapper.findByText('この部屋は参加者により取り消し・中断されました。再開はできません。新しい部屋で対局してください。');
		expect(mocks.api).toHaveBeenCalledWith('mahjong/cancel', { roomId });
		expect(wrapper.queryByText('Playing table')).toBeNull();
		expect(wrapper.queryByRole('button', { name: '対局を中断する' })).toBeNull();
	} finally { wrapper.unmount(); }
});

test('a confirmation opened in a previous room cannot abort the newly navigated room', async () => {
	let answer: (value: { canceled: boolean }) => void = () => {};
	mocks.confirm.mockImplementation(() => new Promise(resolve => { answer = resolve; }));
	mocks.api.mockImplementation(async (endpoint, input) => endpoint === 'users/show' ? { username: 'fixture' }
		: { id: input.roomId, users: ['alice', 'bob', 'carol', 'dave'], status: 'playing', revision: 1, serverTime: Date.now(), phase: null, snapshot: null, outcome: null });
	const intl = createInternationalization({ initialLocale: 'ja-JP' });
	await intl.ready;
	const wrapper = render(Page, { props: { roomId: 'old-room' }, global: { plugins: [intl], stubs: { Table: true, PageWithHeader: { template: '<main><slot /></main>' }, MkA: true } } });
	try {
		await fireEvent.click(await wrapper.findByRole('button', { name: '対局を中断する' }));
		await wrapper.rerender({ roomId: 'new-room' });
		answer({ canceled: false });
		await waitFor(() => expect(mocks.api).toHaveBeenCalledWith('mahjong/show', { roomId: 'new-room' }));
		expect(mocks.api.mock.calls.some(([endpoint]) => endpoint === 'mahjong/cancel')).toBe(false);
	} finally { wrapper.unmount(); }
});
