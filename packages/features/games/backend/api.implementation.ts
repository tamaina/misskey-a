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
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
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
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { ReversiGameEntityService } from './serializers/ReversiGameEntityService.js';
import { ReversiService } from './services/ReversiService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { BubbleGameRecordsRepository, ReversiGamesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

export type GamesDependencies = BubbleGameRankingDependencies
	& BubbleGameRegisterDependencies
	& ReversiCancelMatchDependencies
	& ReversiGamesDependencies
	& ReversiInvitationsDependencies
	& ReversiMatchDependencies
	& ReversiShowGameDependencies
	& ReversiSurrenderDependencies
	& ReversiVerifyDependencies;

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

type Router = ReturnType<typeof createGamesRouter>;

@Injectable()
export class GamesApiProvider {
	private router: Router | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): Router {
		if (this.router !== undefined) return this.router;
		this.router = createGamesRouter({
			bubbleGameRecordsRepository: this.moduleRef.get<BubbleGameRecordsRepository>(DI.bubbleGameRecordsRepository, { strict: false }),
			userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			reversiService: this.moduleRef.get(ReversiService, { strict: false }),
			reversiGamesRepository: this.moduleRef.get<ReversiGamesRepository>(DI.reversiGamesRepository, { strict: false }),
			reversiGameEntityService: this.moduleRef.get(ReversiGameEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			getterService: this.moduleRef.get(GetterService, { strict: false }),
		});
		return this.router;
	}
}
