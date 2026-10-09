/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { GamesContext } from './operations.js';
import { gamesContract } from './endpoints/games.contract.js';
import { createBubbleGameRankingProcedure, createBubbleGameRankingGetProcedure } from './endpoints/bubble-game/ranking.js';
import { createBubbleGameRegisterProcedure } from './endpoints/bubble-game/register.js';
import { createReversiCancelMatchProcedure } from './endpoints/reversi/cancel-match.js';
import { createReversiGamesProcedure } from './endpoints/reversi/games.js';
import { createReversiInvitationsProcedure } from './endpoints/reversi/invitations.js';
import { createReversiMatchProcedure } from './endpoints/reversi/match.js';
import { createReversiShowGameProcedure } from './endpoints/reversi/show-game.js';
import { createReversiSurrenderProcedure } from './endpoints/reversi/surrender.js';
import { createReversiVerifyProcedure } from './endpoints/reversi/verify.js';

export function createGamesRouter<Actor extends ApiActor>() {
	return implement(gamesContract).$context<GamesContext<Actor>>().router({
		bubbleGameRanking: createBubbleGameRankingProcedure<Actor>(),
		bubbleGameRankingGet: createBubbleGameRankingGetProcedure<Actor>(),
		bubbleGameRegister: createBubbleGameRegisterProcedure<Actor>(),
		reversiCancelMatch: createReversiCancelMatchProcedure<Actor>(),
		reversiGames: createReversiGamesProcedure<Actor>(),
		reversiInvitations: createReversiInvitationsProcedure<Actor>(),
		reversiMatch: createReversiMatchProcedure<Actor>(),
		reversiShowGame: createReversiShowGameProcedure<Actor>(),
		reversiSurrender: createReversiSurrenderProcedure<Actor>(),
		reversiVerify: createReversiVerifyProcedure<Actor>(),
	});
}
