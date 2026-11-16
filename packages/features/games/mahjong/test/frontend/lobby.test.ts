/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fireEvent, render, waitFor } from '@testing-library/vue';
import { expect, test, vi } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { Nirax } from '@features/navigation/frontend/lib/nirax.js';
import { ROUTE_DEF } from '@features/navigation/frontend/router.definition.js';
import Page from '../../frontend/pages/index.vue';

const mocks = vi.hoisted(() => ({ api: vi.fn(), selectUser: vi.fn() }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: { id: 'alice', policies: { chatAvailability: 'unavailable' } }, iAmModerator: false }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: mocks.api }));
vi.mock('@features/ui/frontend/os.js', () => ({ selectUser: mocks.selectUser }));
vi.mock('@features/navigation/frontend/router.js', () => ({ useRouter: () => router }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/index/frontend', () => ({ loadNotFoundPage: vi.fn() }));
vi.mock('@features/web/frontend/pages/_loading_.vue', () => ({ default: { template: '<p>Loading</p>' } }));
vi.mock('@features/web/frontend/pages/_error_.vue', () => ({ default: { template: '<p>Error</p>' } }));
vi.mock('@features/timelines/frontend/pages/timeline.vue', () => ({ default: { template: '<p>Timeline</p>' } }));
vi.mock('@features/navigation/frontend/components/global/MkA.vue', () => ({ default: { template: '<a><slot /></a>' } }));
const router = new Nirax(ROUTE_DEF, '/mahjong', true, { template: '<p>Not found</p>' });

test('creating an invitation navigates through the real router to the returned room', async () => {
	const roomId = '5824be9f-8b3c-45d0-af07-d7099dcb478c';
	mocks.api.mockImplementation(async endpoint => endpoint === 'mahjong/create' ? { id: roomId } : []);
	for (const id of ['bob', 'carol', 'dave']) mocks.selectUser.mockResolvedValueOnce({ id, username: id });
	const intl = createInternationalization({ locale: 'ja-JP' });
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
