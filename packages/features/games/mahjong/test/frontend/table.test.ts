/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fireEvent, render } from '@testing-library/vue';
import { expect, test } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Table from '../../frontend/components/Table.vue';
import type { MahjongView } from '../../shared/view.schema.js';

const view: MahjongView = {
	id: 'room', version: '9k-invite-v1', users: ['alice', 'bob', 'carol', 'dave'], ready: [true, true, true, true],
	status: 'playing', revision: 1, serverTime: 1000, outcome: null,
	snapshot: {
		roundWind: 0, handNumber: 0, honba: 0, riichiSticks: 0, turnSeat: 0, remainingTiles: 69, doraIndicators: ['z7'],
		seats: ['alice', 'bob', 'carol', 'dave'].map((userId, index) => ({ userId, score: 25000, concealedHand: index === 0 ? 'm123456789p123s11' : null, concealedCount: index === 0 ? 14 : 13, melds: [], discards: [] })),
	},
	phase: { id: 'phase', kind: 'zimo', deadline: 31000, submitted: false, actions: [{ id: 'discard:s1_', kind: 'discard', tiles: 's1_' }] },
};

test('renders only the supplied private hand, emits the offered action, and disables expired or submitted input', async () => {
	const intl = createInternationalization({ locale: 'ja-JP' });
	await intl.ready;
	const wrapper = render(Table, { global: { plugins: [intl] }, props: { view, userId: 'alice', names: {}, busy: false, seconds: 30 } });
	try {
		expect(wrapper.getAllByRole('img', { name: '🀫' })).toHaveLength(39);
		const button = wrapper.getByRole('button', { name: '打牌 s1' }) as HTMLButtonElement;
		await fireEvent.click(button);
		expect(wrapper.emitted().action).toEqual([['discard:s1_']]);
		await wrapper.rerender({ seconds: 0 });
		expect(button.disabled).toBe(true);
		await wrapper.rerender({ seconds: 30, view: { ...view, phase: { ...view.phase!, submitted: true, actions: [] } } });
		expect(wrapper.queryAllByRole('button')).toHaveLength(0);
	} finally {
		wrapper.unmount();
	}
});
