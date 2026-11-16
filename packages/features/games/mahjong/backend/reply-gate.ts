/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';

export type Four<T> = readonly [T, T, T, T];
export type ReplyResult = 'accepted' | 'stale' | 'unauthorized' | 'duplicate' | 'expired' | 'invalid';

export interface SeatRequest<Reply> {
	/** Server-generated legal action IDs. Never accept a raw core reply from the client. */
	actions: ReadonlyMap<string, Reply>;
	/** Explicit server policy; must name one of this seat's legal actions. */
	timeoutAction: string;
	deliver: (reply: Reply) => void;
}

interface PendingSeat<Reply> {
	actions: Map<string, Reply>;
	timeoutAction: string;
	deliver: (reply: Reply) => void;
	selected: string | null;
}

interface PendingPhase<Reply> {
	id: string;
	deadline: number;
	seats: PendingSeat<Reply>[];
}

/** Buffers one authenticated reply per player before invoking a core callback batch. */
export class MahjongReplyGate<Reply> {
	readonly #users: Four<string>;
	#phase: PendingPhase<Reply> | null = null;
	#flushing = false;

	constructor(users: Four<string>) {
		if (users.length !== 4 || new Set(users).size !== 4 || users.some(user => user.length === 0)) throw new Error('Four distinct users are required');
		this.#users = [...users];
	}

	begin(requests: Four<SeatRequest<Reply>>, deadline: number): string {
		if (this.#phase !== null || this.#flushing) throw new Error('A reply phase is already pending');
		if (requests.length !== 4 || !Number.isFinite(deadline)) throw new Error('Invalid reply phase');
		const seats = requests.map(request => {
			if (!request.actions.has(request.timeoutAction)) throw new Error('Timeout action must be legal');
			return { actions: new Map([...request.actions].map(([id, reply]) => [id, structuredClone(reply)])), timeoutAction: request.timeoutAction, deliver: request.deliver, selected: null };
		});
		const id = randomUUID();
		this.#phase = { id, deadline, seats };
		return id;
	}

	/** userId must come from the authenticated request, never from its body or seat index. */
	submit(phaseId: string, userId: string, actionId: string, now: number): ReplyResult {
		const phase = this.#phase;
		if (phase === null || phase.id !== phaseId) return 'stale';
		const index = this.#users.indexOf(userId);
		if (index < 0) return 'unauthorized';
		const seat = phase.seats[index];
		if (seat.selected !== null) return 'duplicate';
		if (!Number.isFinite(now) || now >= phase.deadline) return 'expired';
		if (!seat.actions.has(actionId)) return 'invalid';
		seat.selected = actionId;
		if (phase.seats.every(candidate => candidate.selected !== null)) this.flush(phase);
		return 'accepted';
	}

	/** A stale timer cannot expire the next phase. Disconnects keep the current deadline. */
	expire(phaseId: string, now: number): boolean {
		const phase = this.#phase;
		if (phase === null || phase.id !== phaseId || !Number.isFinite(now) || now < phase.deadline) return false;
		for (const seat of phase.seats) seat.selected ??= seat.timeoutAction;
		this.flush(phase);
		return true;
	}

	cancel(): void {
		this.#phase = null;
	}

	private flush(phase: PendingPhase<Reply>): void {
		// Clear before callbacks; a new phase may start only after this callback batch finishes.
		this.#phase = null;
		this.#flushing = true;
		try {
			for (const seat of phase.seats) seat.deliver(seat.actions.get(seat.selected!)!);
		} finally {
			this.#flushing = false;
		}
	}
}
