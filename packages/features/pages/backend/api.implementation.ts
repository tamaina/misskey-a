/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { IPageLikesDependencies } from './endpoints/i/page-likes.js';
import type { IPagesDependencies } from './endpoints/i/pages.js';
import type { PagePushDependencies } from './endpoints/page-push.js';
import type { PagesCreateDependencies } from './endpoints/pages/create.js';
import type { PagesDeleteDependencies } from './endpoints/pages/delete.js';
import type { PagesFeaturedDependencies } from './endpoints/pages/featured.js';
import type { PagesLikeDependencies } from './endpoints/pages/like.js';
import type { PagesShowDependencies, PagesSelectorRepository } from './endpoints/pages/show.js';
import type { PagesUnlikeDependencies } from './endpoints/pages/unlike.js';
import type { PagesUpdateDependencies } from './endpoints/pages/update.js';
import type { UsersPagesDependencies } from './endpoints/users/pages.js';
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { pagesContract } from './endpoints/pages.contract.js';
import { createIPageLikesProcedure } from './endpoints/i/page-likes.js';
import { createIPagesProcedure } from './endpoints/i/pages.js';
import { createPagePushProcedure } from './endpoints/page-push.js';
import { createPagesCreateProcedure } from './endpoints/pages/create.js';
import { createPagesDeleteProcedure } from './endpoints/pages/delete.js';
import { createPagesFeaturedProcedure } from './endpoints/pages/featured.js';
import { createPagesLikeProcedure } from './endpoints/pages/like.js';
import { createPagesShowProcedure } from './endpoints/pages/show.js';
import { createPagesUnlikeProcedure } from './endpoints/pages/unlike.js';
import { createPagesUpdateProcedure } from './endpoints/pages/update.js';
import { createUsersPagesProcedure } from './endpoints/users/pages.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { PageEntityService } from './serializers/PageEntityService.js';
import { PageLikeEntityService } from './serializers/PageLikeEntityService.js';
import { PageService } from './services/PageService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { PageLikesRepository, PagesRepository, DriveFilesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

export type PagesDependencies = IPageLikesDependencies
	& IPagesDependencies
	& PagePushDependencies
	& PagesCreateDependencies
	& PagesDeleteDependencies
	& PagesFeaturedDependencies
	& PagesLikeDependencies
	& PagesShowDependencies
	& PagesUnlikeDependencies
	& PagesUpdateDependencies
	& UsersPagesDependencies;

export function createPagesRouter(deps: PagesDependencies) {
	return implement(pagesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().router({
		iPageLikes: createIPageLikesProcedure(deps),
		iPages: createIPagesProcedure(deps),
		pagePush: createPagePushProcedure(deps),
		pagesCreate: createPagesCreateProcedure(deps),
		pagesDelete: createPagesDeleteProcedure(deps),
		pagesFeatured: createPagesFeaturedProcedure(deps),
		pagesLike: createPagesLikeProcedure(deps),
		pagesShow: createPagesShowProcedure(deps),
		pagesUnlike: createPagesUnlikeProcedure(deps),
		pagesUpdate: createPagesUpdateProcedure(deps),
		usersPages: createUsersPagesProcedure(deps),
	});
}

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
