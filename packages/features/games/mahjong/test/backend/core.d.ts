/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Only the pinned 1.4.1 API used by conformance tests. No public response may use these types.
declare module '@kobalab/majiang-core' {
	import type { CoreSnapshotSource } from '@features/games/mahjong/backend/seat-snapshot.js';
	class Game {
		constructor(players: { action(message: unknown, reply?: (value: unknown) => void): void }[], callback?: (paipu: unknown) => void, rule?: Record<string, unknown>);
		model: CoreSnapshotSource;
		_sync: boolean;
		_reply: unknown[];
		_paipu: unknown;
		kaiju(dealer?: number): void;
		qipai(): void;
		zimo(): void;
		next(): void;
		reply_zimo(): void;
		get_dapai(): string[];
		dapai(tile: string): void;
	}
	const core: { Game: typeof Game; rule(overrides?: Record<string, unknown>): Record<string, unknown> };
	export default core;
}
