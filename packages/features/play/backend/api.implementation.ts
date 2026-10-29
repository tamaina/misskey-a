/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { FlashCreateDependencies } from './endpoints/flash/create.js';
import type { FlashDeleteDependencies } from './endpoints/flash/delete.js';
import type { FlashFeaturedDependencies } from './endpoints/flash/featured.js';
import type { FlashLikeDependencies } from './endpoints/flash/like.js';
import type { FlashMyLikesDependencies } from './endpoints/flash/my-likes.js';
import type { FlashMyDependencies } from './endpoints/flash/my.js';
import type { FlashSearchDependencies } from './endpoints/flash/search.js';
import type { FlashShowDependencies } from './endpoints/flash/show.js';
import type { FlashUnlikeDependencies } from './endpoints/flash/unlike.js';
import type { FlashUpdateDependencies } from './endpoints/flash/update.js';
import type { UsersFlashsDependencies } from './endpoints/users/flashs.js';
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { playContract } from './endpoints/play.contract.js';
import { createFlashCreateProcedure } from './endpoints/flash/create.js';
import { createFlashDeleteProcedure } from './endpoints/flash/delete.js';
import { createFlashFeaturedProcedure } from './endpoints/flash/featured.js';
import { createFlashLikeProcedure } from './endpoints/flash/like.js';
import { createFlashMyProcedure } from './endpoints/flash/my.js';
import { createFlashMyLikesProcedure } from './endpoints/flash/my-likes.js';
import { createFlashShowProcedure } from './endpoints/flash/show.js';
import { createFlashUnlikeProcedure } from './endpoints/flash/unlike.js';
import { createFlashUpdateProcedure } from './endpoints/flash/update.js';
import { createFlashSearchProcedure } from './endpoints/flash/search.js';
import { createUsersFlashsProcedure } from './endpoints/users/flashs.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { FlashEntityService } from './serializers/FlashEntityService.js';
import { FlashLikeEntityService } from './serializers/FlashLikeEntityService.js';
import { FlashService } from './services/FlashService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { FlashsRepository, UsersRepository, FlashLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

export type PlayDependencies = FlashCreateDependencies
	& FlashDeleteDependencies
	& FlashFeaturedDependencies
	& FlashLikeDependencies
	& FlashMyLikesDependencies
	& FlashMyDependencies
	& FlashSearchDependencies
	& FlashShowDependencies
	& FlashUnlikeDependencies
	& FlashUpdateDependencies
	& UsersFlashsDependencies;

export function createPlayRouter(deps: PlayDependencies) {
	return implement(playContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().router({
		flashCreate: createFlashCreateProcedure(deps),
		flashDelete: createFlashDeleteProcedure(deps),
		flashFeatured: createFlashFeaturedProcedure(deps),
		flashLike: createFlashLikeProcedure(deps),
		flashMy: createFlashMyProcedure(deps),
		flashMyLikes: createFlashMyLikesProcedure(deps),
		flashShow: createFlashShowProcedure(deps),
		flashUnlike: createFlashUnlikeProcedure(deps),
		flashUpdate: createFlashUpdateProcedure(deps),
		flashSearch: createFlashSearchProcedure(deps),
		usersFlashs: createUsersFlashsProcedure(deps),
	});
}

type Router = ReturnType<typeof createPlayRouter>;

@Injectable()
export class PlayApiProvider {
	private router: Router | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): Router {
		if (this.router !== undefined) return this.router;
		this.router = createPlayRouter({
			flashsRepository: this.moduleRef.get<FlashsRepository>(DI.flashsRepository, { strict: false }),
			flashEntityService: this.moduleRef.get(FlashEntityService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
			moderationLogService: this.moduleRef.get(ModerationLogService, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			flashService: this.moduleRef.get(FlashService, { strict: false }),
			flashLikesRepository: this.moduleRef.get<FlashLikesRepository>(DI.flashLikesRepository, { strict: false }),
			flashLikeEntityService: this.moduleRef.get(FlashLikeEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
		});
		return this.router;
	}
}
