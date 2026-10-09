/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { bubbleGameRankingContract } from './endpoints/bubble-game/ranking.contract.js';
import type { bubbleGameRegisterContract } from './endpoints/bubble-game/register.contract.js';
import type { reversiCancelMatchContract } from './endpoints/reversi/cancel-match.contract.js';
import type { reversiGamesContract } from './endpoints/reversi/games.contract.js';
import type { reversiInvitationsContract } from './endpoints/reversi/invitations.contract.js';
import type { reversiMatchContract } from './endpoints/reversi/match.contract.js';
import type { reversiShowGameContract } from './endpoints/reversi/show-game.contract.js';
import type { reversiSurrenderContract } from './endpoints/reversi/surrender.contract.js';
import type { reversiVerifyContract } from './endpoints/reversi/verify.contract.js';

export interface GamesOperations<Actor extends ApiActor> {
	bubbleGameRanking(input: InferSchemaOutput<NonNullable<(typeof bubbleGameRankingContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof bubbleGameRankingContract)['~orpc']['outputSchema']>>>;
	bubbleGameRegister(input: InferSchemaOutput<NonNullable<(typeof bubbleGameRegisterContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof bubbleGameRegisterContract)['~orpc']['outputSchema']>>>;
	reversiCancelMatch(input: InferSchemaOutput<NonNullable<(typeof reversiCancelMatchContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof reversiCancelMatchContract)['~orpc']['outputSchema']>>>;
	reversiGames(input: InferSchemaOutput<NonNullable<(typeof reversiGamesContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof reversiGamesContract)['~orpc']['outputSchema']>>>;
	reversiInvitations(input: InferSchemaOutput<NonNullable<(typeof reversiInvitationsContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof reversiInvitationsContract)['~orpc']['outputSchema']>>>;
	reversiMatch(input: InferSchemaOutput<NonNullable<(typeof reversiMatchContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof reversiMatchContract)['~orpc']['outputSchema']>>>;
	reversiShowGame(input: InferSchemaOutput<NonNullable<(typeof reversiShowGameContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof reversiShowGameContract)['~orpc']['outputSchema']>>>;
	reversiSurrender(input: InferSchemaOutput<NonNullable<(typeof reversiSurrenderContract)['~orpc']['inputSchema']>>, actor: Actor): Promise<InferSchemaOutput<NonNullable<(typeof reversiSurrenderContract)['~orpc']['outputSchema']>>>;
	reversiVerify(input: InferSchemaOutput<NonNullable<(typeof reversiVerifyContract)['~orpc']['inputSchema']>>, actor: Actor | null): Promise<InferSchemaOutput<NonNullable<(typeof reversiVerifyContract)['~orpc']['outputSchema']>>>;
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
