/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { bubbleGameRankingContract, bubbleGameRankingGetContract } from './bubble-game/ranking.contract.js';
import { bubbleGameRegisterContract } from './bubble-game/register.contract.js';
import { reversiCancelMatchContract } from './reversi/cancel-match.contract.js';
import { reversiGamesContract } from './reversi/games.contract.js';
import { reversiInvitationsContract } from './reversi/invitations.contract.js';
import { reversiMatchContract } from './reversi/match.contract.js';
import { reversiShowGameContract } from './reversi/show-game.contract.js';
import { reversiSurrenderContract } from './reversi/surrender.contract.js';
import { reversiVerifyContract } from './reversi/verify.contract.js';

export const gamesContract = {
	bubbleGameRanking: bubbleGameRankingContract,
	bubbleGameRankingGet: bubbleGameRankingGetContract,
	bubbleGameRegister: bubbleGameRegisterContract,
	reversiCancelMatch: reversiCancelMatchContract,
	reversiGames: reversiGamesContract,
	reversiInvitations: reversiInvitationsContract,
	reversiMatch: reversiMatchContract,
	reversiShowGame: reversiShowGameContract,
	reversiSurrender: reversiSurrenderContract,
	reversiVerify: reversiVerifyContract,
};
