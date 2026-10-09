/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { createPagesRouter } from './router.js';
import type { PagesSelectorRepository } from './endpoints/pages/show.js';
import { PageEntityService } from './serializers/PageEntityService.js';
import { PageLikeEntityService } from './serializers/PageLikeEntityService.js';
import { PageService } from './services/PageService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { PageLikesRepository, PagesRepository, DriveFilesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
type Router = ReturnType<typeof createPagesRouter>;
@Injectable()
export class PagesApiProvider {
	private router: Router | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): Router {
		if (this.router !== undefined) return this.router;
		this.router = createPagesRouter({
			pagesSelectorRepository: this.moduleRef.get<PagesSelectorRepository>(DI.pagesRepository, { strict: false }),
			pageLikesRepository: this.moduleRef.get<PageLikesRepository>(DI.pageLikesRepository, { strict: false }),
			pageLikeEntityService: this.moduleRef.get(PageLikeEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			pagesRepository: this.moduleRef.get<PagesRepository>(DI.pagesRepository, { strict: false }),
			pageEntityService: this.moduleRef.get(PageEntityService, { strict: false }),
			userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			globalEventService: this.moduleRef.get(GlobalEventService, { strict: false }),
			driveFilesRepository: this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false }),
			pageService: this.moduleRef.get(PageService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
		});
		return this.router;
	}
}
