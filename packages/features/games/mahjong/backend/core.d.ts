/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Private, pinned 1.4.1 surface. Never use this model as an API response.
declare module '@kobalab/majiang-core' {
	import type { CoreSnapshotSource } from '@features/games/mahjong/backend/seat-snapshot.js';
	class Shoupai { static fromString(value: string): Shoupai; toString(): string; _fulou: string[]; }
	class Shan {
		_rule: Record<string, unknown>;
		_pai: string[];
		_baopai: string[];
		_fubaopai: string[] | null;
		_weikaigang: boolean;
		_closed: boolean;
		paishu: number;
		baopai: string[];
	}
	class Game {
		constructor(players: { action(message: unknown, reply?: (value: unknown) => void): void }[], callback?: (paipu: unknown) => void, rule?: Record<string, unknown>, title?: string);
		model: CoreSnapshotSource & { shoupai: Shoupai[] };
		_sync: boolean;
		_status: string;
		_gang: string | null;
		_reply: unknown[];
		_paipu: unknown;
		kaiju(dealer?: number): void;
		qipai(shan?: Shan): void;
		zimo(): void;
		next(): void;
		reply_zimo(): void;
		get_dapai(): string[];
		get_chi_mianzi(seat: number): string[] | null;
		get_peng_mianzi(seat: number): string[] | null;
		get_gang_mianzi(seat?: number): string[] | null;
		allow_lizhi(tile?: string): string[] | boolean;
		allow_hule(seat?: number): boolean;
		allow_pingju(): boolean;
		dapai(tile: string): void;
		call_players(type: string, messages: unknown[], timeout?: number): void;
	}
	const core: { Game: typeof Game; Shoupai: typeof Shoupai; Shan: typeof Shan; rule(overrides?: Record<string, unknown>): Record<string, unknown> };
	export default core;
}
