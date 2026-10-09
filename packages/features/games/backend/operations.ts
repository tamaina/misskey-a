/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { bubbleGameRankingInput, bubbleGameRankingOutput } from './endpoints/bubble-game/ranking.contract.js';
import type { bubbleGameRegisterInput, bubbleGameRegisterOutput } from './endpoints/bubble-game/register.contract.js';
import type { reversiCancelMatchInput, reversiCancelMatchOutput } from './endpoints/reversi/cancel-match.contract.js';
import type { reversiGamesInput, reversiGamesOutput } from './endpoints/reversi/games.contract.js';
import type { reversiInvitationsInput, reversiInvitationsOutput } from './endpoints/reversi/invitations.contract.js';
import type { reversiMatchInput, reversiMatchOutput } from './endpoints/reversi/match.contract.js';
import type { reversiShowGameInput, reversiShowGameOutput } from './endpoints/reversi/show-game.contract.js';
import type { reversiSurrenderInput, reversiSurrenderOutput } from './endpoints/reversi/surrender.contract.js';
import type { reversiVerifyInput, reversiVerifyOutput } from './endpoints/reversi/verify.contract.js';

export interface GamesOperations<Actor extends ApiActor> {
	bubbleGameRanking(input: v.InferOutput<typeof bubbleGameRankingInput>, actor: Actor | null): Promise<v.InferOutput<typeof bubbleGameRankingOutput>>;
	bubbleGameRegister(input: v.InferOutput<typeof bubbleGameRegisterInput>, actor: Actor): Promise<v.InferOutput<typeof bubbleGameRegisterOutput>>;
	reversiCancelMatch(input: v.InferOutput<typeof reversiCancelMatchInput>, actor: Actor): Promise<v.InferOutput<typeof reversiCancelMatchOutput>>;
	reversiGames(input: v.InferOutput<typeof reversiGamesInput>, actor: Actor | null): Promise<v.InferOutput<typeof reversiGamesOutput>>;
	reversiInvitations(input: v.InferOutput<typeof reversiInvitationsInput>, actor: Actor): Promise<v.InferOutput<typeof reversiInvitationsOutput>>;
	reversiMatch(input: v.InferOutput<typeof reversiMatchInput>, actor: Actor): Promise<v.InferOutput<typeof reversiMatchOutput>>;
	reversiShowGame(input: v.InferOutput<typeof reversiShowGameInput>, actor: Actor | null): Promise<v.InferOutput<typeof reversiShowGameOutput>>;
	reversiSurrender(input: v.InferOutput<typeof reversiSurrenderInput>, actor: Actor): Promise<v.InferOutput<typeof reversiSurrenderOutput>>;
	reversiVerify(input: v.InferOutput<typeof reversiVerifyInput>, actor: Actor | null): Promise<v.InferOutput<typeof reversiVerifyOutput>>;
}
export type GamesContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { games: GamesOperations<Actor> } };
export type GamesApplications<Actor extends ApiActor> = { [K in keyof GamesOperations<Actor>]: { execute: GamesOperations<Actor>[K] } };
export function createGamesOperations<Actor extends ApiActor>(applications: GamesApplications<Actor>): GamesOperations<Actor> {
	return {
		bubbleGameRanking: (input, actor) => applications.bubbleGameRanking.execute(input, actor),
		bubbleGameRegister: (input, actor) => applications.bubbleGameRegister.execute(input, actor),
		reversiCancelMatch: (input, actor) => applications.reversiCancelMatch.execute(input, actor),
		reversiGames: (input, actor) => applications.reversiGames.execute(input, actor),
		reversiInvitations: (input, actor) => applications.reversiInvitations.execute(input, actor),
		reversiMatch: (input, actor) => applications.reversiMatch.execute(input, actor),
		reversiShowGame: (input, actor) => applications.reversiShowGame.execute(input, actor),
		reversiSurrender: (input, actor) => applications.reversiSurrender.execute(input, actor),
		reversiVerify: (input, actor) => applications.reversiVerify.execute(input, actor),
	};
}
