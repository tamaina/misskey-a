/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { HashtagEntityService } from './serializers/HashtagEntityService.js';
import type { HashtagsRepository, UsersRepository, NotesRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import { FeaturedService } from './services/FeaturedService.js';
import { HashtagService } from './services/HashtagService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { UserSearchService } from './services/UserSearchService.js';
import { createDiscoveryRouter } from './endpoints/discovery.js';

type DiscoveryRouter = ReturnType<typeof createDiscoveryRouter<MiLocalUser>>;

/** Composed once after Nest initialization; domain services keep their existing lifetime. */
@Injectable()
export class DiscoveryApiProvider {
	private router: DiscoveryRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): DiscoveryRouter {
		if (this.router !== undefined) return this.router;
		this.router = createDiscoveryRouter<MiLocalUser>({
			hashtagsRepository: this.moduleRef.get<HashtagsRepository>(DI.hashtagsRepository, { strict: false }),
			hashtagEntityService: this.moduleRef.get(HashtagEntityService, { strict: false }),
			featuredService: this.moduleRef.get(FeaturedService, { strict: false }),
			hashtagService: this.moduleRef.get(HashtagService, { strict: false }),
			usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
			userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			notesRepository: this.moduleRef.get<NotesRepository>(DI.notesRepository, { strict: false }),
			cacheService: this.moduleRef.get(CacheService, { strict: false }),
			noteEntityService: this.moduleRef.get(NoteEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			getterService: this.moduleRef.get(GetterService, { strict: false }),
			followingsRepository: this.moduleRef.get<FollowingsRepository>(DI.followingsRepository, { strict: false }),
			userSearchService: this.moduleRef.get(UserSearchService, { strict: false }),
		});
		return this.router;
	}
}
