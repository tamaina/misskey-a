/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ReversiGameEntityService } from './serializers/ReversiGameEntityService.js';
import type { ReversiGamesRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface GameServicesDependencies {
	reversiGamesRepository: ReversiGamesRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	idService: Pick<IdService, 'parse'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createGameServices(deps: GameServicesDependencies) {
	const reversiGameEntityService = new ReversiGameEntityService(deps.reversiGamesRepository, deps.userEntityService, deps.idService);

	return {
		ReversiGameEntityService: reversiGameEntityService,
	};
}

export type GameServices = ReturnType<typeof createGameServices>;
