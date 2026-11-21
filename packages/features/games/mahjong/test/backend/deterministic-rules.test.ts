/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, expect, test, vi } from 'vitest';
import { MahjongEngine } from '../../backend/engine.js';
import * as random from '../../backend/random.js';
import { createRoom, projectRoom, readyRoom, submitRoom } from '../../backend/room.js';
import { createSeatSnapshot } from '../../backend/seat-snapshot.js';
import { rules } from '../../shared/rules.js';
import type { Action } from '../../backend/engine.js';
import type { Four } from '../../backend/reply-gate.js';
import type { RoomState } from '../../backend/room.js';

const users = ['alice', 'bob', 'carol', 'dave'] as const;
const dealer = 2; // Seats and account indexes must not be interchangeable.
const now = 1000;
const generateWall = random.generateWall;
const doubleRonHands = [null, 'm123p123s123z1115', 'm789p789s789z5666', null] as const;
const neutralHands = ['m147p148s149z1357', 'm258p259s258z1247', 'm369p136s367z2356', 'm289p469s478z1456'] as const;
afterEach(() => vi.restoreAllMocks());

/** Arrange only real tiles from the rule profile. Deal seats then draws in the core's pop order. */
function wall(hands: Four<string | null>, draws: string[], indicator = 'p4'): string[] {
	const tiles = generateWall(rules['赤牌'], max => max - 1);
	const take = (tile: string): string => {
		const i = tiles.indexOf(tile);
		if (i < 0) throw new Error(`Missing tile in fixed wall: ${tile}`);
		return tiles.splice(i, 1)[0];
	};
	const fixed = hands.map(hand => hand == null ? null : [...hand.matchAll(/([mpsz])(\d+)/g)].flatMap(([, suit, faces]) => [...faces].map(face => take(suit + face))));
	const drawOrder = draws.map(take);
	const doraIndicator = take(indicator);
	const deal = fixed.map(hand => hand ?? tiles.splice(0, 13));
	if (deal.some(hand => hand.length !== 13)) throw new Error('Invalid fixture hand size');
	tiles.splice(4, 0, doraIndicator);
	return [...tiles, ...drawOrder.reverse(), ...deal.flat().reverse()];
}

function start(walls: string[][]): RoomState {
	let index = 0;
	vi.spyOn(random, 'chooseInitialDealer').mockReturnValue(dealer);
	vi.spyOn(random, 'generateWall').mockImplementation(() => {
		const next = walls[index++];
		if (!next) throw new Error(`Unexpected hand ${index}`);
		return [...next];
	});
	const room = createRoom(users);
	for (const user of users) readyRoom(room, user, now);
	return room;
}

const view = (room: RoomState, user: string) => projectRoom('fixture', room, user, now);
const at = (room: RoomState, seat: number) => view(room, users[0]).snapshot!.seats[seat].userId;
const accountIndex = (user: string) => users.findIndex(candidate => candidate === user);
const scores = (room: RoomState) => Object.fromEntries(view(room, users[0]).snapshot!.seats.map(seat => [seat.userId, seat.score]));

function play(room: RoomState, seat: number, kind: Action['kind'], tiles?: string) {
	const user = at(room, seat);
	const phase = view(room, user).phase!;
	const found = phase.actions.filter(candidate => candidate.kind === kind && (tiles === undefined || candidate.tiles === tiles));
	expect(found, `${user} ${phase.kind} ${kind} ${tiles ?? ''}`).toHaveLength(1);
	submitRoom(room, user, phase.id, found[0].id, `${phase.id}:${user}`, now);
}

function passOthers(room: RoomState) {
	const phase = view(room, users[0]).phase!;
	for (let seat = 0; seat < 4; seat++) {
		const current = view(room, at(room, seat)).phase;
		if (current?.id !== phase.id) break;
		if (!current.submitted) play(room, seat, 'pass');
	}
}

function discard(room: RoomState, seat: number, tile: string, pass = true) {
	play(room, seat, 'discard', tile);
	if (pass && view(room, users[0]).phase?.kind === 'dapai') passOthers(room);
}

function confirmAll(room: RoomState) {
	expect(room.phase!.kind).toMatch(/^(hule|pingju)$/);
	for (let seat = 0; seat < 4; seat++) play(room, seat, 'continue');
}

function expectPrivateViews(room: RoomState) {
	for (const user of users) {
		const result = view(room, user);
		expect(result.snapshot!.seats.filter(seat => seat.concealedHand !== null).map(seat => seat.userId)).toEqual([user]);
		expect(JSON.stringify(result)).not.toMatch(/"_paipu"|"journal"|"walls"|"reply"|"fubaopai"|"shoupai"/);
	}
}

test('two valid ron claims settle in seat order even if the farther player submits first', () => {
	const room = start([wall(doubleRonHands, ['z5']), wall(neutralHands, [])]);
	const payer = at(room, 0);
	const nearer = at(room, 1);
	const farther = at(room, 2);
	discard(room, 0, 'z5_', false);
	play(room, 2, 'win');
	play(room, 1, 'win');
	if (room.phase!.kind === 'dapai') passOthers(room);
	expectPrivateViews(room);
	for (const [seat, user] of [[1, nearer], [2, farther]] as const) {
		const before = scores(room);
		const result = view(room, users[0]).outcome!;
		// Closed mixed outside hand and mixed triple sequence (2 han each), plus yakuhai.
		expect(result).toMatchObject({ kind: 'win', winner: accountIndex(user), points: 8000, yaku: expect.arrayContaining(['混全帯幺九', '三色同順']) });
		expect(result.deltas).toEqual(seat === 1 ? [-8000, 8000, 0, 0] : [-8000, 0, 8000, 0]);
		for (const observer of users) expect(view(room, observer).outcome).toEqual(result);
		confirmAll(room);
		expect(scores(room)).toEqual({ ...before, [payer]: before[payer] - 8000, [user]: before[user] + 8000 });
	}
});

test('passing ron prevents a second claim until the player takes their own turn', () => {
	const room = start([wall([null, neutralHands[1], doubleRonHands[1], null], ['z5', 'z5', 'p4', 'z5'])]);
	discard(room, 0, 'z5_', false);
	expect(view(room, at(room, 2)).phase!.actions).toContainEqual({ id: 'win:', kind: 'win', tiles: '' });
	passOthers(room);
	discard(room, 1, 'z5_', false);
	expect(view(room, at(room, 2)).phase!.actions.some(action => action.kind === 'win')).toBe(false);
	if (room.phase!.kind === 'dapai') passOthers(room);
	discard(room, 2, 'p4_');
	discard(room, 3, 'z5_', false);
	expect(view(room, at(room, 2)).phase!.actions).toContainEqual({ id: 'win:', kind: 'win', tiles: '' });
	expectPrivateViews(room);
});

test('passing ron after riichi stays furiten through the next own draw and discard', () => {
	const room = start([wall([null, doubleRonHands[1], null, null], ['p4', 's4', 'z5', 'p6', 's6', 'p7', 'z5'])]);
	discard(room, 0, 'p4_');
	play(room, 1, 'riichi', 's4_');
	if (room.phase!.kind === 'dapai') passOthers(room);
	expect(view(room, users[0]).snapshot!.riichiSticks).toBe(1);
	discard(room, 2, 'z5_', false);
	expect(view(room, at(room, 1)).phase!.actions).toContainEqual({ id: 'win:', kind: 'win', tiles: '' });
	passOthers(room);
	discard(room, 3, 'p6_');
	discard(room, 0, 's6_');
	discard(room, 1, 'p7_');
	discard(room, 2, 'z5_', false);
	expect(view(room, at(room, 1)).phase!.actions.some(action => action.kind === 'win')).toBe(false);
	if (room.phase!.kind === 'dapai') passOthers(room);
	expect(view(room, at(room, 3)).snapshot!.turnSeat).toBe(3);
});

test('a real pon can be extended to kan, but chankan wins before the replacement draw', () => {
	const room = start([wall([null, 'm4468p467s2468z34', 'm35p123s789z11122', null], ['m4', 'p9', 's4', 's6', 'm4'])]);
	discard(room, 0, 'm4_', false);
	play(room, 1, 'pon');
	passOthers(room);
	discard(room, 1, 's8');
	discard(room, 2, 'p9_');
	discard(room, 3, 's4_');
	discard(room, 0, 's6_');
	const sticks = view(room, users[0]).snapshot!;
	play(room, 1, 'kan');
	expect(room.phase!.kind).toBe('gang');
	expect(view(room, at(room, 2)).snapshot!.seats[1].melds).toEqual(['m444-4']);
	play(room, 2, 'win');
	if (room.phase!.kind === 'gang') passOthers(room);
	const result = view(room, at(room, 2));
	expect(result.outcome).toMatchObject({ kind: 'win', winner: accountIndex(at(room, 2)), yaku: expect.arrayContaining(['槍槓']) });
	expect(result.outcome!.deltas[1]).toBe(-result.outcome!.points);
	expect(result.outcome!.deltas[2]).toBe(result.outcome!.points);
	expect(result.snapshot!.remainingTiles).toBe(sticks.remainingTiles);
	expect(result.snapshot!.doraIndicators).toEqual(sticks.doraIndicators);
	expectPrivateViews(room);
});

test('the actual last hand pays out an unclaimed riichi stick and all four DTOs agree on standings', () => {
	const neutralWall = wall(neutralHands, []);
	const room = start([
		wall(doubleRonHands, ['z5']),
		...Array.from({ length: 6 }, () => neutralWall),
		wall([neutralHands[0].replace('z1357', 'z3457'), doubleRonHands[1], neutralHands[2], neutralHands[3]], ['s4', 'p4']),
	]);
	discard(room, 0, 'z5_', false);
	play(room, 1, 'win');
	play(room, 2, 'win');
	if (room.phase!.kind === 'dapai') passOthers(room);
	confirmAll(room);
	confirmAll(room);

	// Drive the repeated uninteresting draws once through the actual engine rather than
	// replaying a full journal at every step. The final four confirmations use submitRoom.
	const journal = room.journal!;
	const engine = new MahjongEngine(journal);
	const isSouthFour = () => engine.model.zhuangfeng === 1 && engine.model.jushu === 3;
	let declared = false;
	for (let steps = 0; !(isSouthFour() && engine._status === 'pingju') && steps < 1500; steps++) {
		const riichi = isSouthFour() && !declared && engine.model.lunban === 1 && engine._status === 'zimo';
		const replies = engine.menus().map(menu => {
			const action = riichi ? menu.find(candidate => candidate.kind === 'riichi' && candidate.tiles === 'p4_') : undefined;
			if (action) declared = true;
			return (action ?? menu.findLast(candidate => candidate.kind === 'discard') ?? menu.find(candidate => candidate.kind === 'pass' || candidate.kind === 'continue'))!.reply;
		});
		engine.advance(replies);
	}
	expect(declared).toBe(true);
	expect(isSouthFour()).toBe(true);
	expect(engine._status).toBe('pingju');
	expect(engine.outcome).toMatchObject({ kind: 'draw', name: '荒牌平局', deltas: [-1000, 3000, -1000, -1000] });
	room.outcome = engine.outcome;
	room.views = users.map(user => createSeatSnapshot(engine.model, users, user));
	room.phase = { id: 'final-confirmation', kind: 'pingju', deadline: now + 1, menus: engine.menus(), selected: [null, null, null, null] };

	const before = view(room, users[0]).snapshot!;
	expect(before.riichiSticks).toBe(1);
	expect(before.seats.map(seat => seat.score).reduce((a, b) => a + b)).toBe(99000);
	expect(scores(room)).toEqual({ alice: 33000, bob: 25000, carol: 8000, dave: 33000 });
	// The draw moves 3000 to Carol, 1000 from everyone else. Dave and Alice
	// are tied at 32000, so Dave (closer to the starting dealer) gets the stick.
	const expected = [
		{ userId: 'dave', score: 33000 },
		{ userId: 'alice', score: 32000 },
		{ userId: 'bob', score: 24000 },
		{ userId: 'carol', score: 11000 },
	];
	const reopenedRoom = JSON.parse(JSON.stringify(room)) as RoomState;
	confirmAll(reopenedRoom);
	expect(reopenedRoom.status).toBe('ended');
	expect(reopenedRoom.phase).toBeNull();
	for (const user of users) expect(view(reopenedRoom, user).standings).toEqual(expected);
	expect(Object.values(scores(reopenedRoom)).reduce((a, b) => a + b)).toBe(100000);
	expectPrivateViews(reopenedRoom);
});
