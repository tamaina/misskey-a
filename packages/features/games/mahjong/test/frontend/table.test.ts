/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fireEvent, render, within } from '@testing-library/vue';
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
	const intl = createInternationalization({ initialLocale: 'ja-JP' });
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

test.each([
	['discard', '打牌'],
	['riichi', 'リーチ'],
] as const)('distinguishes hand and draw variants of the same %s tile without changing action IDs', async (kind, label) => {
	const intl = createInternationalization({ initialLocale: 'ja-JP' });
	await intl.ready;
	const phase = {
		...view.phase!,
		actions: [
			{ id: `${kind}:s1`, kind, tiles: 's1' },
			{ id: `${kind}:s1_`, kind, tiles: 's1_' },
		],
	};
	const wrapper = render(Table, { global: { plugins: [intl] }, props: { view: { ...view, phase }, userId: 'alice', names: {}, busy: false, seconds: 30 } });
	try {
		await fireEvent.click(wrapper.getByRole('button', { name: `${label}（手出し） s1` }));
		await fireEvent.click(wrapper.getByRole('button', { name: `${label}（ツモ切り） s1` }));
		expect(wrapper.emitted().action).toEqual([[`${kind}:s1`], [`${kind}:s1_`]]);
	} finally {
		wrapper.unmount();
	}
});

test.each([
	['hule', 'win', [8000, -8000, 0, 0]],
	['pingju', 'draw', [1500, -1500, 1500, -1500]],
] as const)('shows each seat’s %s delta without changing its score before the next phase', async (kind, result, deltas) => {
	const intl = createInternationalization({ initialLocale: 'ja-JP' });
	await intl.ready;
	const rotated = [2, 0, 3, 1].map((index, seat) => ({
		...view.snapshot!.seats[index],
		score: [33000, 17000, 27000, 23000][seat],
	}));
	const formatter = new Intl.NumberFormat(undefined, { signDisplay: 'exceptZero' });
	const resultView: MahjongView = {
		...view,
		snapshot: { ...view.snapshot!, seats: rotated },
		phase: { ...view.phase!, kind, actions: [{ id: 'continue:', kind: 'continue', tiles: '' }] },
		outcome: { kind: result, winner: result === 'win' ? 2 : null, name: '', points: result === 'win' ? 8000 : 0, yaku: [], deltas: [...deltas] },
	};
	const wrapper = render(Table, { global: { plugins: [intl] }, props: { view: resultView, userId: 'alice', names: {}, busy: false, seconds: 10 } });
	try {
		const assertResult = () => {
			for (const [index, seat] of rotated.entries()) {
				const queries = within(wrapper.getByText(new RegExp(seat.userId + '$')).closest('section')!);
				expect(queries.getByText(seat.score.toLocaleString())).toBeTruthy();
				expect(queries.getByText('点数増減')).toBeTruthy();
				expect(queries.getByText(formatter.format(deltas[index]))).toBeTruthy();
			}
		};
		assertResult();
		await wrapper.rerender({ view: { ...resultView, phase: { ...resultView.phase!, submitted: true, actions: [] } } });
		assertResult();
		await wrapper.rerender({ view: { ...resultView, phase: view.phase, outcome: null } });
		expect(wrapper.queryAllByText('点数増減')).toHaveLength(0);
	} finally {
		wrapper.unmount();
	}
});

test('shows the ordered final scores only for a completed match', async () => {
	const intl = createInternationalization({ initialLocale: 'ja-JP' });
	await intl.ready;
	const wrapper = render(Table, { global: { plugins: [intl] }, props: { view, userId: 'bob', names: { dave: '@dave' }, busy: false, seconds: 0 } });
	try {
		expect(wrapper.queryByRole('list', { name: '最終順位' })).toBeNull();
		const standings = ['dave', 'alice', 'bob', 'carol'].map(userId => ({ userId, score: 25000 }));
		await wrapper.rerender({ view: { ...view, status: 'ended', phase: null, standings } });
		expect(wrapper.getByRole('list', { name: '最終順位' })).toBeTruthy();
		expect(wrapper.getAllByRole('listitem').map(row => row.textContent)).toEqual(['@dave', 'alice', 'bob', 'carol'].map(name => name + (25000).toLocaleString()));
		expect(wrapper.queryAllByRole('button')).toHaveLength(0);
	} finally {
		wrapper.unmount();
	}
});
