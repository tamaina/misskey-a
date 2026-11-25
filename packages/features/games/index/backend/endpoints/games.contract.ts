/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { bubbleGameRankingContract, bubbleGameRankingGetContract } from '../../../bubble-game/backend/endpoints/ranking.contract.js';
import { bubbleGameRegisterContract } from '../../../bubble-game/backend/endpoints/register.contract.js';
import { reversiCancelMatchContract } from '../../../reversi/backend/endpoints/cancel-match.contract.js';
import { reversiGamesContract } from '../../../reversi/backend/endpoints/games.contract.js';
import { reversiInvitationsContract } from '../../../reversi/backend/endpoints/invitations.contract.js';
import { reversiMatchContract } from '../../../reversi/backend/endpoints/match.contract.js';
import { reversiShowGameContract } from '../../../reversi/backend/endpoints/show-game.contract.js';
import { reversiSurrenderContract } from '../../../reversi/backend/endpoints/surrender.contract.js';
import { reversiVerifyContract } from '../../../reversi/backend/endpoints/verify.contract.js';

import { mahjongCreateContract, mahjongRoomsContract, mahjongShowContract, mahjongReadyContract, mahjongCancelContract, mahjongSubmitContract } from '../../../mahjong/backend/endpoints/mahjong.contract.js';

export const gamesContract = {
	mahjongCreate: mahjongCreateContract, mahjongRooms: mahjongRoomsContract, mahjongShow: mahjongShowContract,
	mahjongReady: mahjongReadyContract, mahjongCancel: mahjongCancelContract, mahjongSubmit: mahjongSubmitContract,
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
