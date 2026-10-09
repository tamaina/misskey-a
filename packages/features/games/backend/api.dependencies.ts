/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { BubbleGameRankingDependencies } from './endpoints/bubble-game/ranking.js';
import type { BubbleGameRegisterDependencies } from './endpoints/bubble-game/register.js';
import type { ReversiCancelMatchDependencies } from './endpoints/reversi/cancel-match.js';
import type { ReversiGamesDependencies } from './endpoints/reversi/games.js';
import type { ReversiInvitationsDependencies } from './endpoints/reversi/invitations.js';
import type { ReversiMatchDependencies } from './endpoints/reversi/match.js';
import type { ReversiShowGameDependencies } from './endpoints/reversi/show-game.js';
import type { ReversiSurrenderDependencies } from './endpoints/reversi/surrender.js';
import type { ReversiVerifyDependencies } from './endpoints/reversi/verify.js';
export type GamesDependencies = BubbleGameRankingDependencies
	& BubbleGameRegisterDependencies
	& ReversiCancelMatchDependencies
	& ReversiGamesDependencies
	& ReversiInvitationsDependencies
	& ReversiMatchDependencies
	& ReversiShowGameDependencies
	& ReversiSurrenderDependencies
	& ReversiVerifyDependencies;
