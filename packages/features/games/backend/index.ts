/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { gamesContract } from './endpoints/games.contract.js';
export { createGamesRouter } from './router.js';
export { createGamesOperations } from './operations.js';
export type { GamesOperations, GamesContext, GamesApplications } from './operations.js';
export { gamesApplicationProviders } from './application-providers.js';
export { BubbleGameRankingApplicationService } from './applications/bubble-game/ranking.js';
export { BubbleGameRegisterApplicationService } from './applications/bubble-game/register.js';
export { ReversiCancelMatchApplicationService } from './applications/reversi/cancel-match.js';
export { ReversiGamesApplicationService } from './applications/reversi/games.js';
export { ReversiInvitationsApplicationService } from './applications/reversi/invitations.js';
export { ReversiMatchApplicationService } from './applications/reversi/match.js';
export { ReversiShowGameApplicationService } from './applications/reversi/show-game.js';
export { ReversiSurrenderApplicationService } from './applications/reversi/surrender.js';
export { ReversiVerifyApplicationService } from './applications/reversi/verify.js';
