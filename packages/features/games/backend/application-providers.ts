/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { BubbleGameRankingApplicationService } from './applications/bubble-game/ranking.js';
import { BubbleGameRegisterApplicationService } from './applications/bubble-game/register.js';
import { ReversiCancelMatchApplicationService } from './applications/reversi/cancel-match.js';
import { ReversiGamesApplicationService } from './applications/reversi/games.js';
import { ReversiInvitationsApplicationService } from './applications/reversi/invitations.js';
import { ReversiMatchApplicationService } from './applications/reversi/match.js';
import { ReversiShowGameApplicationService } from './applications/reversi/show-game.js';
import { ReversiSurrenderApplicationService } from './applications/reversi/surrender.js';
import { ReversiVerifyApplicationService } from './applications/reversi/verify.js';

export const gamesApplicationProviders = [
	BubbleGameRankingApplicationService,
	BubbleGameRegisterApplicationService,
	ReversiCancelMatchApplicationService,
	ReversiGamesApplicationService,
	ReversiInvitationsApplicationService,
	ReversiMatchApplicationService,
	ReversiShowGameApplicationService,
	ReversiSurrenderApplicationService,
	ReversiVerifyApplicationService,
];
