/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import core from '@kobalab/majiang-core';
import { createRoom, readyRoom, projectRoom, submitRoom, expireRoom, cancelRoom } from '../../backend/room.js';
import { MahjongEngine } from '../../backend/engine.js';
import { generateWall } from '../../backend/random.js';
import { rules } from '../../shared/rules.js';

const users = ['alice', 'bob', 'carol', 'dave'] as const;

function started() {
	const room = createRoom(users);
	for (const user of users) readyRoom(room, user, 1000);
	return room;
}

describe('durable invite-only mahjong', () => {
	test('profile pins every core rule, including hard-coded 30000 point return behavior', () => {
		expect(rules).toEqual(core.rule());
	});
	test('four participants must consent before dealing; any invitee may decline', () => {
		const room = createRoom(users);
		for (const user of users.slice(0, 3)) readyRoom(room, user, 0);
		expect(room.journal).toBeNull();
		cancelRoom(room, users[3]);
		readyRoom(room, users[3], 0);
		expect(room.status).toBe('cancelled');
	});
	test('all projections conceal other hands, journal, wall and unoffered actions, including reconnect', () => {
		const room = JSON.parse(JSON.stringify(started()));
		for (const user of users) {
			const view = projectRoom('room', room, user, 2000);
			expect(view.snapshot!.seats.filter(seat => seat.concealedHand !== null).map(seat => seat.userId)).toEqual([user]);
			expect(JSON.stringify(view)).not.toMatch(/journal|walls|reply|_paipu/);
			view.snapshot!.seats[0].discards.push('canary');
			expect(projectRoom('room', room, user, 2000).snapshot!.seats[0].discards).not.toContain('canary');
		}
		expect(() => projectRoom('room', room, 'outsider', 0)).toThrow('NO_SUCH_ROOM');
		expect(() => submitRoom(room, 'outsider', room.phase.id, 'pass:', 'id', 0)).toThrow('NO_SUCH_ROOM');
	});
	test('rejects illegal, stale and duplicate actions; identical retries are idempotent across reconnection', () => {
		const room = started();
		const player = room.phase!.menus.findIndex(menu => menu.some(action => action.kind === 'discard'));
		const phase = room.phase!.id;
		const action = room.phase!.menus[player].find(action => action.kind === 'discard')!.id;
		expect(() => submitRoom(room, users[player], phase, 'discard:z9', 'bad', 1001)).toThrow('INVALID_ACTION');
		submitRoom(room, users[player], phase, action, 'accepted', 1001);
		const revision = room.revision;
		submitRoom(room, users[player], phase, action, 'accepted', 1002);
		expect(room.revision).toBe(revision);
		expect(() => submitRoom(room, users[player], phase, action, 'different', 1002)).toThrow('STALE_ACTION');
		expect(() => submitRoom(room, users[player], phase, 'pass:', 'accepted', 1002)).toThrow('INVALID_ACTION');
	});
	test('expired input is rejected; server expiry advances once using offered legal fallback', () => {
		const room = started();
		const phase = room.phase!;
		const player = phase.menus.findIndex(menu => menu.some(action => action.kind === 'discard'));
		expect(expireRoom(room, phase.deadline - 1)).toBe(false);
		expect(() => submitRoom(room, users[player], phase.id, phase.menus[player][0].id, 'late', phase.deadline)).toThrow('STALE_ACTION');
		expect(expireRoom(room, phase.deadline)).toBe(true);
		expect(room.phase!.id).not.toBe(phase.id);
		expect(room.journal!.steps[0].replies[player]).toEqual(phase.menus[player].findLast(action => action.kind === 'discard')!.reply);
	});
	test('offers tsumo and emits only the sanitized scoring result', () => {
		const journal = { dealer: 0, walls: [], steps: [] };
		const game = new MahjongEngine(journal);
		// A focused core fixture: the dealer has a closed yakuhai winning hand.
		game.model.shoupai[0] = core.Shoupai.fromString('m123p123s123z11122');
		expect(game.menus()[0].some(action => action.kind === 'win')).toBe(true);
		game.advance([{ hule: true }, {}, {}, {}]);
		expect(game._status).toBe('hule');
		expect(game.outcome?.points).toBeGreaterThan(0);
		expect(JSON.stringify(game.outcome)).not.toMatch(/shoupai|fubaopai/);
	});
	test('offers legal chi/pon reactions, and does not offer chi to the opposite seat', () => {
		const game = new MahjongEngine({ dealer: 0, walls: [], steps: [] });
		game.model.shoupai[0] = core.Shoupai.fromString('m123p123s123z11122');
		game.model.shoupai[1] = core.Shoupai.fromString('m12p123456s123z12');
		game.model.shoupai[2] = core.Shoupai.fromString('m33p123456s123z12');
		game.dapai('m3');
		expect(game.menus()[1].some(action => action.kind === 'chi')).toBe(true);
		expect(game.menus()[2].some(action => action.kind === 'pon')).toBe(true);
		expect(game.menus()[2].some(action => action.kind === 'chi')).toBe(false);
	});
	test('offers riichi, closed kan and ron through the pinned core legal menus', () => {
		const riichi = new MahjongEngine({ dealer: 0, walls: [], steps: [] });
		riichi.model.shoupai[0] = core.Shoupai.fromString('m123p123s123z11122');
		const declaration = riichi.menus()[0].find(action => action.kind === 'riichi');
		expect(declaration?.reply.dapai).toMatch(/\*$/);

		const kan = new MahjongEngine({ dealer: 0, walls: [], steps: [] });
		kan.model.shoupai[0] = core.Shoupai.fromString('m1111p123s123z1122');
		const closedKan = kan.menus()[0].find(action => action.kind === 'kan');
		expect(closedKan?.tiles).toBe('m1111');
		kan.advance([closedKan!.reply, {}, {}, {}]);
		expect(kan._status).toBe('gangzimo');
		expect(kan.model.shoupai[0]._fulou).toContain('m1111');

		const ron = new MahjongEngine({ dealer: 0, walls: [], steps: [] });
		ron.model.shoupai[0] = core.Shoupai.fromString('m123p123s123z11122');
		ron.model.shoupai[1] = core.Shoupai.fromString('m123p123s123z1112');
		ron.dapai('z2');
		expect(ron.menus()[1].some(action => action.kind === 'win')).toBe(true);
		ron.advance([{}, { hule: true }, {}, {}]);
		expect(ron.outcome?.winner).toBe(1);
		expect(ron.outcome?.points).toBeGreaterThan(0);
	});
	test('replays a complete multi-hand game with persisted walls and never calls Math.random', () => {
		// Deterministic test-only walls avoid a random all-tenpai repeated hand.
		let seed = 316;
		const nextWall = () => generateWall(rules['赤牌'], max => {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			return seed % max;
		});
		const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('insecure random'); });
		try {
			const journal = { dealer: 2, walls: [], steps: [] };
			const game = new MahjongEngine(journal, nextWall);
			let steps = 0;
			while (game._status !== 'jieju' && steps++ < 3000) {
				const replies = game.menus().map(menu => (menu.findLast(action => action.kind === 'discard') ?? menu.find(action => action.kind === 'pass' || action.kind === 'continue'))!.reply);
				game.advance(replies);
				if (steps % 100 === 0) {
					const restored = new MahjongEngine(structuredClone(journal));
					expect(restored.model.shoupai.map(hand => hand.toString())).toEqual(game.model.shoupai.map(hand => hand.toString()));
					expect(restored.menus()).toEqual(game.menus());
				}
			}
			expect(game._status).toBe('jieju');
			expect(journal.walls.length).toBeGreaterThan(4);
			expect(new MahjongEngine(structuredClone(journal)).model.defen).toEqual(game.model.defen);
		} finally { random.mockRestore(); }
	}, 30_000);
});
