/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { createGamesRouter } from './router.js';
import { ReversiGameEntityService } from './serializers/ReversiGameEntityService.js';
import { ReversiService } from './services/ReversiService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { BubbleGameRecordsRepository, ReversiGamesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
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
