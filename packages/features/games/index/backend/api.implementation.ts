/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { createBubbleGameRankingProcedure, createBubbleGameRankingGetProcedure } from '../../bubble-game/backend/endpoints/ranking.js';
import { gamesContract } from './endpoints/games.contract.js';
import type { BubbleGameRankingDependencies } from '../../bubble-game/backend/endpoints/ranking.js';
import type { BubbleGameRegisterDependencies } from '../../bubble-game/backend/endpoints/register.js';
import type { ReversiCancelMatchDependencies } from '../../reversi/backend/endpoints/cancel-match.js';
import type { ReversiGamesDependencies } from '../../reversi/backend/endpoints/games.js';
import type { ReversiInvitationsDependencies } from '../../reversi/backend/endpoints/invitations.js';
import type { ReversiMatchDependencies } from '../../reversi/backend/endpoints/match.js';
import type { ReversiShowGameDependencies } from '../../reversi/backend/endpoints/show-game.js';
import type { ReversiSurrenderDependencies } from '../../reversi/backend/endpoints/surrender.js';
import type { ReversiVerifyDependencies } from '../../reversi/backend/endpoints/verify.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createBubbleGameRegisterProcedure } from '../../bubble-game/backend/endpoints/register.js';
import { createReversiCancelMatchProcedure } from '../../reversi/backend/endpoints/cancel-match.js';
import { createReversiGamesProcedure } from '../../reversi/backend/endpoints/games.js';
import { createReversiInvitationsProcedure } from '../../reversi/backend/endpoints/invitations.js';
import { createReversiMatchProcedure } from '../../reversi/backend/endpoints/match.js';
import { createReversiShowGameProcedure } from '../../reversi/backend/endpoints/show-game.js';
import { createReversiSurrenderProcedure } from '../../reversi/backend/endpoints/surrender.js';
import { createReversiVerifyProcedure } from '../../reversi/backend/endpoints/verify.js';
import { ReversiGameEntityService } from '../../reversi/backend/serializers/ReversiGameEntityService.js';
import { ReversiService } from '../../reversi/backend/services/ReversiService.js';
import type { BubbleGameRecordsRepository, ReversiGamesRepository } from '@features/persistence/backend/repositories/models.js';

import { MahjongStore } from '../../mahjong/backend/store.js';
import { createMahjongProcedures } from '../../mahjong/backend/endpoints/mahjong.js';
import type { MahjongDependencies } from '../../mahjong/backend/endpoints/mahjong.js';

export type GamesDependencies = MahjongDependencies & BubbleGameRankingDependencies
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
		...createMahjongProcedures(deps),
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
			mahjong: new MahjongStore(this.moduleRef.get(DI.db, { strict: false })),
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
