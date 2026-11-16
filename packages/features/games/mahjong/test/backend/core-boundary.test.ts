/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import Majiang from '@kobalab/majiang-core';
import { createSeatSnapshot } from '../../backend/seat-snapshot.js';
import { MahjongReplyGate } from '../../backend/reply-gate.js';
import type { Four, SeatRequest } from '../../backend/reply-gate.js';

const users = ['alice', 'bob', 'carol', 'dave'] as const;
afterEach(() => vi.restoreAllMocks());

function setup() {
	// A deterministic fixture only. Production wall/dealer randomness remains a separate boundary.
	vi.spyOn(Math, 'random').mockReturnValue(0.314159);
	const callbacks: ((reply: unknown) => void)[] = [];
	const game = new Majiang.Game(users.map((_, id) => ({ action(_message, reply) { if (reply) callbacks[id] = reply; } })), undefined, Majiang.rule());
	game._sync = true;
	game.kaiju(2);
	return { game, callbacks };
}

test.each(users)('reconnection exposes only %s own hand after dealer rotation', user => {
	const { game } = setup();
	game.qipai();
	const view = createSeatSnapshot(game.model, users, user);
	expect(game.model.player_id).toEqual([2, 3, 0, 1]);
	expect(view.seats.filter(seat => seat.concealedHand !== null)).toHaveLength(1);
	for (const [seat, value] of view.seats.entries()) {
		expect(value.concealedHand).toBe(value.userId === user ? game.model.shoupai[seat].toString().split(',')[0] : null);
		expect(value.concealedCount).toBe(13);
	}
});

test.each([null, 'spectator', 'unknown-user'])('spectator snapshot for %s has no hand, wall or private paipu', user => {
	const { game } = setup();
	game.qipai();
	const source = Object.assign(game.model, { privateCanary: 'do-not-send', _paipu: game._paipu });
	const view = createSeatSnapshot(source, users, user);
	expect(view.seats.every(seat => seat.concealedHand === null)).toBe(true);
	expect(Object.keys(view).sort()).toEqual(['doraIndicators', 'handNumber', 'honba', 'remainingTiles', 'riichiSticks', 'roundWind', 'seats', 'turnSeat']);
	expect(JSON.stringify(view)).not.toMatch(/do-not-send|_paipu|_pai|_bingpai|fubaopai/);
});

test('snapshots detach public arrays from engine state and reject corrupt seating', () => {
	const { game } = setup();
	game.qipai();
	const view = createSeatSnapshot(game.model, users, 'alice');
	view.doraIndicators.push('m9');
	view.seats[0].melds.push('m123-');
	view.seats[0].discards.push('p1');
	expect(game.model.shan.baopai).toHaveLength(1);
	expect(game.model.shoupai[0]._fulou).toHaveLength(0);
	expect(game.model.he[0]._pai).toHaveLength(0);
	expect(() => createSeatSnapshot({ ...game.model, player_id: [0, 0, 2, 3] }, users, 'alice')).toThrow('Invalid seating');
});

test('pinned core callbacks can overwrite a later phase, while the gate rejects old phase IDs', () => {
	const { game, callbacks } = setup();
	const oldRawCallback = callbacks[0];
	game.qipai();
	oldRawCallback({ dapai: 'm9' });
	expect(game._reply[0]).toEqual({ dapai: 'm9' });
	game.qipai();
	const gate = new MahjongReplyGate<object>(users);
	const requests = () => callbacks.map(deliver => ({ actions: new Map([['pass', {}]]), timeoutAction: 'pass', deliver })) as unknown as Four<SeatRequest<object>>;
	const first = gate.begin(requests(), 100);
	gate.expire(first, 100);
	game.qipai();
	const second = gate.begin(requests(), 200);
	expect(gate.submit(first, 'alice', 'pass', 150)).toBe('stale');
	expect(game._reply).toEqual([]);
	expect(gate.submit(second, 'alice', 'pass', 150)).toBe('accepted');
	expect(game._reply).toEqual([]); // No raw callback until every player has replied.
});

test('pinned core does not advance without four replies and silently falls back from an illegal discard', () => {
	const { game, callbacks } = setup();
	game.next();
	expect(game.model.shan).toBeNull();
	game.qipai();
	game.zimo();
	const legal = game.get_dapai();
	callbacks[game.model.player_id[game.model.lunban]]({ dapai: 'invalid' });
	const discard = vi.spyOn(game, 'dapai').mockImplementation(() => {});
	game.reply_zimo();
	expect(discard).toHaveBeenCalledExactlyOnceWith(legal.at(-1));
});
