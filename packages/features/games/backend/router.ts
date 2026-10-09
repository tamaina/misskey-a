/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { GamesDependencies } from './api.dependencies.js';
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
export function createGamesRouter(deps: GamesDependencies) {
	return implement(gamesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().router({
		bubbleGameRanking: createBubbleGameRankingProcedure(deps),
		bubbleGameRankingGet: createBubbleGameRankingGetProcedure(deps),
		bubbleGameRegister: createBubbleGameRegisterProcedure(deps),
		reversiCancelMatch: createReversiCancelMatchProcedure(deps),
		reversiGames: createReversiGamesProcedure(deps),
		reversiInvitations: createReversiInvitationsProcedure(deps),
		reversiMatch: createReversiMatchProcedure(deps),
		reversiShowGame: createReversiShowGameProcedure(deps),
		reversiSurrender: createReversiSurrenderProcedure(deps),
		reversiVerify: createReversiVerifyProcedure(deps),
	});
}
