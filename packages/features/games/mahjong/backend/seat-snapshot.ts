/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Four } from './reply-gate.js';

/** Server-only subset of majiang-core's Game.model. This is never a response schema. */
export interface CoreSnapshotSource {
	zhuangfeng: number;
	jushu: number;
	changbang: number;
	lizhibang: number;
	lunban: number;
	defen: readonly number[];
	player_id: readonly number[];
	shoupai: readonly { toString(): string; _fulou: readonly string[] }[];
	he: readonly { _pai: readonly string[] }[];
	shan: { paishu: number; baopai: readonly string[] };
}

export interface SeatSnapshot {
	roundWind: number;
	handNumber: number;
	honba: number;
	riichiSticks: number;
	turnSeat: number;
	remainingTiles: number;
	doraIndicators: string[];
	seats: {
		userId: string;
		score: number;
		/** null for every opponent and every spectator, including after a game ends. */
		concealedHand: string | null;
		concealedCount: number;
		melds: string[];
		discards: string[];
	}[];
}

/** Reconnection and live views must share this allowlist projection, never serialize model/paipu. */
export function createSeatSnapshot(model: CoreSnapshotSource, users: Four<string>, authenticatedUserId: string | null): SeatSnapshot {
	if (users.length !== 4 || new Set(users).size !== 4 || users.some(id => id.length === 0)
		|| model.shoupai.length !== 4 || model.he.length !== 4 || model.defen.length !== 4
		|| model.player_id.length !== 4 || new Set(model.player_id).size !== 4
		|| model.player_id.some(id => !Number.isInteger(id) || id < 0 || id > 3)) throw new Error('Invalid seating state');
	return {
		roundWind: model.zhuangfeng,
		handNumber: model.jushu,
		honba: model.changbang,
		riichiSticks: model.lizhibang,
		turnSeat: model.lunban,
		remainingTiles: model.shan.paishu,
		doraIndicators: [...model.shan.baopai],
		seats: model.player_id.map((player, seat) => {
			const hand = model.shoupai[seat].toString().split(',')[0];
			return {
				userId: users[player],
				score: model.defen[player],
				concealedHand: authenticatedUserId === users[player] ? hand : null,
				concealedCount: (hand.match(/[0-9_]/g) ?? []).length,
				melds: [...model.shoupai[seat]._fulou],
				discards: [...model.he[seat]._pai],
			};
		}),
	};
}
