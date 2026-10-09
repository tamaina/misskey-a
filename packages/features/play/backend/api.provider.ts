/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { createPlayRouter } from './router.js';
import { FlashEntityService } from './serializers/FlashEntityService.js';
import { FlashLikeEntityService } from './serializers/FlashLikeEntityService.js';
import { FlashService } from './services/FlashService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { FlashsRepository, UsersRepository, FlashLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
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
