/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { render, waitFor } from '@testing-library/vue';
import { defineComponent, h } from 'vue';
import { expect, test, vi } from 'vitest';
import { definePage } from '@features/navigation/frontend/page.js';
import { ROUTE_DEF } from '@features/navigation/frontend/router.definition.js';

vi.mock('@features/auth/frontend/i.js', () => ({ $i: null, iAmModerator: false }));
vi.mock('@features/index/frontend', () => ({ loadNotFoundPage: vi.fn() }));
vi.mock('@features/web/frontend/pages/_loading_.vue', () => ({ default: { template: '<p>Loading</p>' } }));
vi.mock('@features/web/frontend/pages/_error_.vue', () => ({ default: { template: '<p>Error</p>' } }));
vi.mock('@features/timelines/frontend/pages/timeline.vue', () => ({ default: { template: '<p>Timeline</p>' } }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));

test('the public /games route lazily renders the existing game links and metadata', async () => {
	const route = ROUTE_DEF.find(candidate => candidate.path === '/games');
	expect(route).toBeDefined();
	expect(route?.loginRequired).toBe(false);
	const wrapper = render(defineComponent({ setup: () => () => h('div', [h(route!.component)]) }), {
		global: {
			stubs: {
				PageWithHeader: { template: '<main><slot /></main>' },
				MkA: { props: ['to'], template: '<a :href="to"><slot /></a>' },
			},
		},
	});
	try {
		await waitFor(() => {
			expect(Array.from(wrapper.container.querySelectorAll('a'), link => link.getAttribute('href'))).toEqual(['/mahjong', '/bubble-game', '/reversi']);
		});
		expect(Array.from(wrapper.container.querySelectorAll('img'), image => image.getAttribute('src'))).toEqual([
			'/client-assets/drop-and-fusion/logo.png',
			'/client-assets/reversi/logo.png',
		]);
		const metadata = vi.mocked(definePage).mock.calls.at(-1)?.[0];
		expect(typeof metadata).toBe('function');
		if (typeof metadata !== 'function') throw new Error('Expected page metadata getter');
		expect(metadata()).toEqual({ title: 'Misskey Games', icon: 'ti ti-device-gamepad' });
	} finally {
		wrapper.unmount();
	}
});
