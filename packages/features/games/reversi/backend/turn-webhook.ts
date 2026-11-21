/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import * as Reversi from 'misskey-reversi';
import { MiReversiGame } from './models/ReversiGame.js';
import type { EntityManager } from 'typeorm';
import type { Redis } from 'ioredis';
import type { ReversiTurnReference } from '../../index/shared/turn-webhook.schema.js';

type TurnSnapshot = Pick<MiReversiGame, 'id' | 'black' | 'user1Id' | 'user2Id' | 'isStarted' | 'isEnded'
	| 'map' | 'isLlotheo' | 'canPutEverywhere' | 'loopedBoard' | 'logs'>;

export function projectReversiTurn(game: TurnSnapshot, engine: Reversi.Game) {
	if (!game.isStarted || game.isEnded || (game.black !== 1 && game.black !== 2)
		|| engine.turn === null || !engine.canPutSomewhere(engine.turn)) return null;
	const logs = Reversi.Serializer.deserializeLogs(game.logs);
	const reference: ReversiTurnReference = { game: 'reversi', gameId: game.id, revision: logs.length + 1 };
	// Different native moves can race at one revision. Retain an internal proof
	// of this snapshot, not a time, CRC-derived revision, or client-supplied ID.
	const stateKey = createHash('sha256').update(JSON.stringify([
		game.black, game.map, game.isLlotheo, game.canPutEverywhere, game.loopedBoard,
		logs.map(log => [log.player, log.operation, log.pos]),
	])).digest('hex');
	const player1 = engine.turn === (game.black === 1);
	return { userId: player1 ? game.user1Id : game.user2Id, color: engine.turn, reference, stateKey };
}

export async function canReceiveReversiTurn(manager: EntityManager, redis: Pick<Redis, 'mget'>, userId: string, turn: ReversiTurnReference, stateKey: string): Promise<boolean> {
	// Active moves are still Redis-only. DB is checked separately for
	// participant identity and any terminal update not visible in the cache yet.
	const game = await manager.getRepository(MiReversiGame).createQueryBuilder('game')
		.select(['game.id', 'game.black', 'game.user1Id', 'game.user2Id'])
		.where('game.id = :id AND (game."user1Id" = :userId OR game."user2Id" = :userId)', { id: turn.gameId, userId })
		.andWhere('game."isStarted" AND NOT game."isEnded"').getOne();
	if (!game) return false;
	const [raw, blackTimer, whiteTimer] = await redis.mget(
		`reversi:game:cache:${game.id}`,
		`reversi:game:turnTimer:${game.id}:1`,
		`reversi:game:turnTimer:${game.id}:0`,
	);
	if (raw == null) return false; // Never hydrate an old SQL board just to send a hint.
	let snapshot: TurnSnapshot;
	let current: ReturnType<typeof projectReversiTurn>;
	try {
		snapshot = JSON.parse(raw) as TurnSnapshot;
		if (snapshot.id !== game.id || snapshot.black !== game.black
			|| snapshot.user1Id !== game.user1Id || snapshot.user2Id !== game.user2Id) return false;
		current = projectReversiTurn(snapshot, Reversi.Serializer.restoreGame(snapshot));
	} catch {
		return false;
	}
	// The existing start path uses the black timer key even for a custom
	// white-only opening. Preserve that timer/stream behavior in this change.
	const timer = turn.revision === 1 || current?.color ? blackTimer : whiteTimer;
	return timer != null && current?.userId === userId && current.reference.revision === turn.revision && current.stateKey === stateKey;
}
