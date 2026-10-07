/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FlashEntityService } from './serializers/FlashEntityService.js';
import { FlashLikeEntityService } from './serializers/FlashLikeEntityService.js';
import { FlashService } from './services/FlashService.js';
import type { FlashLikesRepository, FlashsRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { QueryService } from '@/core/QueryService.js';

export interface PlayServicesDependencies {
	flashsRepository: FlashsRepository;
	flashLikesRepository: FlashLikesRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	idService: Pick<IdService, 'parse'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createPlayServices(deps: PlayServicesDependencies) {
	const flashEntityService = new FlashEntityService(deps.flashsRepository, deps.flashLikesRepository, deps.userEntityService, deps.idService);
	const flashLikeEntityService = new FlashLikeEntityService(deps.flashLikesRepository, flashEntityService);
	const flashService = new FlashService(deps.flashsRepository, deps.flashLikesRepository, deps.queryService);

	return {
		FlashEntityService: flashEntityService,
		FlashLikeEntityService: flashLikeEntityService,
		FlashService: flashService,
	};
}

export type PlayServices = ReturnType<typeof createPlayServices>;
