/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { ruleVersion, timeouts } from '../shared/rules.js';
import { chooseInitialDealer } from './random.js';
import { MahjongEngine } from './engine.js';
import { createSeatSnapshot } from './seat-snapshot.js';
import type { Four } from './reply-gate.js';
import type { Action, Journal, Reply, Outcome } from './engine.js';
import type { SeatSnapshot } from './seat-snapshot.js';

export class RoomError extends Error {
	constructor(readonly code: 'NO_SUCH_ROOM' | 'STALE_ACTION' | 'INVALID_ACTION' | 'ROOM_LIMIT') { super(code); }
}
export interface RoomState {
	version: typeof ruleVersion;
	users: Four<string>;
	ready: boolean[];
	status: 'waiting' | 'playing' | 'ended' | 'cancelled';
	revision: number;
	journal: Journal | null;
	phase: { id: string; kind: string; deadline: number; menus: Action[][]; selected: (Reply | null)[] } | null;
	views: SeatSnapshot[];
	outcome: Outcome | null;
	receipts: { user: string; request: string; phase: string; action: string }[];
}
export function createRoom(users: Four<string>): RoomState {
	if (new Set(users).size !== 4 || users.some(id => !id)) throw new RoomError('INVALID_ACTION');
	return { version: ruleVersion, users: [...users], ready: [false, false, false, false], status: 'waiting', revision: 0, journal: null, phase: null, views: [], outcome: null, receipts: [] };
}

function participant(room: RoomState, user: string): number {
	const index = room.users.indexOf(user);
	if (index < 0) throw new RoomError('NO_SUCH_ROOM');
	return index;
}

function refresh(room: RoomState, engine: MahjongEngine, now: number): void {
	room.revision++;
	room.outcome = engine.outcome;
	room.views = room.users.map(user => createSeatSnapshot(engine.model, room.users, user));
	if (engine._status === 'jieju') { room.status = 'ended'; room.phase = null; return; }
	const menus = engine.menus();
	const duration = ['hule', 'pingju'].includes(engine._status) ? timeouts.result
		: menus.some(menu => menu.some(action => action.kind === 'discard')) ? timeouts.discard : timeouts.reaction;
	room.phase = { id: randomUUID(), kind: engine._status, deadline: now + duration, menus,
																selected: menus.map(menu => menu.length === 1 && menu[0].kind === 'pass' ? {} : null) };
}

export function readyRoom(room: RoomState, user: string, now: number): void {
	const player = participant(room, user);
	if (room.status !== 'waiting') return;
	room.ready[player] = true;
	room.revision++;
	if (room.ready.every(Boolean)) {
		room.status = 'playing';
		room.journal = { dealer: chooseInitialDealer(), walls: [], steps: [] };
		refresh(room, new MahjongEngine(room.journal), now);
	}
}
export function cancelRoom(room: RoomState, user: string): void {
	participant(room, user);
	if (room.status !== 'waiting') throw new RoomError('INVALID_ACTION');
	room.status = 'cancelled'; room.revision++;
}

function advance(room: RoomState, now: number): void {
	const phase = room.phase;
	if (!phase || phase.selected.some(reply => reply === null) || !room.journal) return;
	const engine = new MahjongEngine(room.journal);
	engine.advance(phase.selected as Reply[]);
	refresh(room, engine, now);
}

/** Called with the DB row locked and a trusted server time; at most one expired phase per request. */
export function expireRoom(room: RoomState, now: number): boolean {
	const phase = room.phase;
	if (!phase || now < phase.deadline) return false;
	for (let i = 0; i < 4; i++) {
		if (phase.selected[i] !== null) continue;
		const menu = phase.menus[i];
		const fallback = menu.findLast(action => action.kind === 'discard') ?? menu.find(action => action.kind === 'pass' || action.kind === 'continue');
		if (!fallback) throw new Error('Missing legal timeout action');
		phase.selected[i] = fallback.reply;
	}
	advance(room, now);
	return true;
}
export function submitRoom(room: RoomState, user: string, phaseId: string, actionId: string, requestId: string, now: number): void {
	const player = participant(room, user);
	const prior = room.receipts.find(receipt => receipt.user === user && receipt.request === requestId);
	if (prior) {
		if (prior.phase !== phaseId || prior.action !== actionId) throw new RoomError('INVALID_ACTION');
		return;
	}
	const phase = room.phase;
	if (!phase || phase.id !== phaseId || now >= phase.deadline || phase.selected[player] !== null) throw new RoomError('STALE_ACTION');
	const action = phase.menus[player].find(candidate => candidate.id === actionId);
	if (!action) throw new RoomError('INVALID_ACTION');
	phase.selected[player] = structuredClone(action.reply);
	room.receipts.push({ user, request: requestId, phase: phaseId, action: actionId });
	room.receipts = room.receipts.slice(-64);
	room.revision++;
	advance(room, now);
}
/** The only public projection: no raw room/state/model/journal leaves the server. */
export function projectRoom(id: string, room: RoomState, user: string, now: number) {
	const player = participant(room, user);
	const phase = room.phase;
	return { id, version: room.version, users: [...room.users], ready: [...room.ready], status: room.status,
										revision: room.revision, serverTime: now, outcome: room.outcome ? structuredClone(room.outcome) : null, snapshot: room.views[player] ? structuredClone(room.views[player]) : null,
										phase: phase ? { id: phase.id, kind: phase.kind, deadline: phase.deadline, submitted: phase.selected[player] !== null,
																											actions: phase.selected[player] !== null ? [] : phase.menus[player].map(({ id, kind, tiles }) => ({ id, kind, tiles })) } : null };
}
