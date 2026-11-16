/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { MahjongReplyGate } from '../../backend/reply-gate.js';
import type { Four, SeatRequest } from '../../backend/reply-gate.js';

const users = ['alice', 'bob', 'carol', 'dave'] as const;

function setup() {
	const deliver = users.map(() => vi.fn());
	const requests = users.map((_, seat) => ({ actions: new Map<string, object>([['pass', { pass: true }], ['play', { seat }]]), timeoutAction: 'pass', deliver: deliver[seat] })) as unknown as Four<SeatRequest<object>>;
	const gate = new MahjongReplyGate<object>(users);
	return { gate, requests, deliver, phase: gate.begin(requests, 100) };
}

test('waits for all four authenticated players and delivers one batch', () => {
	const { gate, phase, deliver } = setup();
	for (const user of users.slice(0, 3)) expect(gate.submit(phase, user, 'play', 50)).toBe('accepted');
	for (const callback of deliver) expect(callback).not.toHaveBeenCalled();
	expect(gate.submit(phase, 'dave', 'play', 50)).toBe('accepted');
	for (const [seat, callback] of deliver.entries()) expect(callback).toHaveBeenCalledExactlyOnceWith({ seat });
});

test('unauthorized, illegal and duplicate replies never overwrite a player choice', () => {
	const { gate, phase, deliver } = setup();
	expect(gate.submit(phase, 'spectator', 'play', 50)).toBe('unauthorized');
	expect(gate.submit(phase, 'alice', 'unoffered-tile', 50)).toBe('invalid');
	expect(gate.submit(phase, 'alice', 'play', 50)).toBe('accepted');
	expect(gate.submit(phase, 'alice', 'pass', 50)).toBe('duplicate');
	gate.expire(phase, 100);
	expect(deliver[0]).toHaveBeenCalledExactlyOnceWith({ seat: 0 });
});

test('a disconnected player expires to an explicit legal action at the deadline', () => {
	const { gate, phase, deliver } = setup();
	expect(gate.submit(phase, 'alice', 'play', 99)).toBe('accepted');
	expect(gate.submit(phase, 'bob', 'play', 100)).toBe('expired');
	expect(gate.expire(phase, 99)).toBe(false);
	expect(gate.expire(phase, 100)).toBe(true);
	expect(gate.expire(phase, 101)).toBe(false);
	expect(deliver[0]).toHaveBeenCalledExactlyOnceWith({ seat: 0 });
	for (const callback of deliver.slice(1)) expect(callback).toHaveBeenCalledExactlyOnceWith({ pass: true });
});

test('old replies and old timers cannot enter a subsequent phase', () => {
	const { gate, phase, requests, deliver } = setup();
	gate.expire(phase, 100);
	const next = gate.begin(requests, 200);
	expect(next).not.toBe(phase);
	expect(gate.submit(phase, 'alice', 'play', 150)).toBe('stale');
	expect(gate.expire(phase, 250)).toBe(false);
	for (const callback of deliver) expect(callback).toHaveBeenCalledTimes(1);
	expect(gate.submit(next, 'alice', 'play', 150)).toBe('accepted');
});

test('copies offered payloads instead of retaining mutable action maps', () => {
	const { gate, phase, requests, deliver } = setup();
	Object.assign(requests[0].actions.get('play')!, { seat: 'changed' });
	gate.submit(phase, 'alice', 'play', 10);
	gate.expire(phase, 100);
	expect(deliver[0]).toHaveBeenCalledExactlyOnceWith({ seat: 0 });
});

test('cancel invalidates callbacks and a pending phase cannot be replaced implicitly', () => {
	const { gate, phase, requests, deliver } = setup();
	expect(() => gate.begin(requests, 200)).toThrow('already pending');
	gate.cancel();
	expect(gate.submit(phase, 'alice', 'play', 10)).toBe('stale');
	expect(gate.expire(phase, 100)).toBe(false);
	for (const callback of deliver) expect(callback).not.toHaveBeenCalled();
});

test('rejects ambiguous participants, absent timeout actions and invalid clocks', () => {
	expect(() => new MahjongReplyGate(['alice', 'alice', 'carol', 'dave'])).toThrow();
	const { gate, requests, phase } = setup();
	expect(gate.submit(phase, 'alice', 'play', NaN)).toBe('expired');
	expect(gate.expire(phase, NaN)).toBe(false);
	gate.cancel();
	expect(() => gate.begin(requests, Infinity)).toThrow();
	expect(() => gate.begin([{ ...requests[0], timeoutAction: 'illegal' }, ...requests.slice(1)] as unknown as Four<SeatRequest<object>>, 100)).toThrow('must be legal');
});

test('does not mix a reentrant next phase into the old callback batch', () => {
	const { gate, requests, phase } = setup();
	gate.cancel();
	const current = gate.begin([{ ...requests[0], deliver: () => { expect(() => gate.begin(requests, 200)).toThrow('already pending'); } }, requests[1], requests[2], requests[3]], 100);
	gate.expire(current, 100);
	const next = gate.begin(requests, 200);
	expect(gate.submit(current, 'alice', 'play', 150)).toBe('stale');
	expect(gate.submit(phase, 'alice', 'play', 150)).toBe('stale');
	expect(gate.submit(next, 'alice', 'play', 150)).toBe('accepted');
});
